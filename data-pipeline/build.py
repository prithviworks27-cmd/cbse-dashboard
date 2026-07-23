"""Public API + CLI entrypoint for the pipeline.

``build_dashboard(...)`` is the programmatic entrypoint (what tests call).
Running this file as a script (``python build.py --config manifest.json
--out dashboard.json``) is the CLI entrypoint: it reads a JSON manifest
describing the roster + per-subject test files, runs the whole pipeline,
validates the result against ``schemas/dashboard.schema.json``, and writes
the output JSON.
"""
from __future__ import annotations

import argparse
import json
import os
from typing import Dict, List, Optional

import jsonschema
import pandas as pd
from pydantic import BaseModel, ConfigDict

from aggregate import (
    build_scored_subject,
    build_tracking_only_subject,
    compute_combined_overall,
)
from models import AttendanceEntry, CombinedOverall, DashboardData
from parsers import LONG_COLUMNS
from parsers.format_a import parse_format_a
from parsers.format_b import parse_format_b
from parsers.format_c import TrackingData, parse_format_c
from parsers.format_d import RosterSource, parse_format_d

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "..", "schemas", "dashboard.schema.json")


class ScoredTestSpec(BaseModel):
    model_config = ConfigDict(extra="forbid", arbitrary_types_allowed=True)

    path: str
    format: str  # "A" or "B"
    test_id: str
    test_label: str
    marks_overrides: Optional[Dict[str, float]] = None
    topic_override: Optional[str] = None


class SubjectConfig(BaseModel):
    model_config = ConfigDict(extra="forbid", arbitrary_types_allowed=True)

    scored_tests: List[ScoredTestSpec] = []
    tracking_grid: Optional[object] = None  # path / DataFrame / list[dict], see parse_format_c


def _parse_scored_test(spec: ScoredTestSpec, subject: str) -> pd.DataFrame:
    fmt = spec.format.strip().upper()
    if fmt == "A":
        parser = parse_format_a
    elif fmt == "B":
        parser = parse_format_b
    else:
        raise ValueError(f"Unknown test format '{spec.format}' for test '{spec.test_id}' (expected 'A' or 'B')")
    return parser(
        spec.path,
        test_id=spec.test_id,
        test_label=spec.test_label,
        subject=subject,
        marks_overrides=spec.marks_overrides,
        topic_override=spec.topic_override,
    )


def build_dashboard(
    *,
    school: str,
    className: str,
    roster: RosterSource,
    subjects_config: Dict[str, SubjectConfig],
    attendance: Optional[Dict[str, dict]] = None,
    syllabus_progress: Optional[Dict[str, float]] = None,
) -> DashboardData:
    roster_data = parse_format_d(roster)

    subjects: List[str] = list(subjects_config.keys())
    for s in roster_data.all_subjects:
        if s not in subjects:
            subjects.append(s)

    subject_enrollment = {student: subs for student, subs in roster_data.subject_enrollment.items()}

    subjects_with_scores: List[str] = []
    scored_out: Dict[str, object] = {}
    tracking_out: Dict[str, object] = {}

    # kept around for combinedOverall, which needs every subject's df + test order
    subject_dfs: Dict[str, pd.DataFrame] = {}
    subject_test_orders: Dict[str, List[str]] = {}

    for subject in subjects:
        cfg = subjects_config.get(subject, SubjectConfig())
        enrolled_students = [s for s in roster_data.students if subject in subject_enrollment.get(s, [])]

        test_order = [t.test_id for t in cfg.scored_tests]
        test_labels = {t.test_id: t.test_label for t in cfg.scored_tests}

        if cfg.scored_tests:
            parts = [_parse_scored_test(spec, subject) for spec in cfg.scored_tests]
            scored_df = pd.concat(parts, ignore_index=True)
        else:
            scored_df = pd.DataFrame(columns=LONG_COLUMNS)

        if cfg.tracking_grid is not None:
            tracking_data = parse_format_c(cfg.tracking_grid)
        else:
            tracking_data = TrackingData([], {}, {})

        # --- graduation: a tracking-only test whose test_id now has scored
        # data must be dropped from the tracking placeholder so it is never
        # double-counted. ---
        scored_test_ids = set(test_order)
        tracking_data = tracking_data.drop_tests(scored_test_ids)

        subject_dfs[subject] = scored_df
        subject_test_orders[subject] = test_order

        if not scored_df.empty:
            subjects_with_scores.append(subject)
            scored_out[subject] = build_scored_subject(
                subject, scored_df, test_order, test_labels, enrolled_students, tracking_data,
            )
        elif not tracking_data.is_empty():
            tracking_out[subject] = build_tracking_only_subject(tracking_data, enrolled_students)
        # else: subject has no data at all -- appears in `subjects` only.

    class_overall, per_student_combined = compute_combined_overall(
        roster_data.students, subject_enrollment, subject_dfs, subject_test_orders,
    )

    attendance_models = None
    if attendance is not None:
        attendance_models = {k: AttendanceEntry(**v) for k, v in attendance.items()}

    return DashboardData(
        school=school,
        className=className,
        subjects=subjects,
        subjectsWithScores=subjects_with_scores,
        students=roster_data.students,
        subjectEnrollment=subject_enrollment,
        attendance=attendance_models,
        syllabusProgress=syllabus_progress,
        scored=scored_out,
        trackingOnly=tracking_out,
        combinedOverall=CombinedOverall(classOverall=class_overall, students=per_student_combined),
    )


def _dump_dashboard(dashboard: DashboardData) -> dict:
    """Serialize to plain JSON-able dict.

    Deliberately does NOT use pydantic's ``exclude_none=True``: many nested
    fields (e.g. ``score``, ``accuracy``, ``rank``) are *required* keys in
    the schema whose *value* may legitimately be null -- exclude_none would
    strip the key entirely and fail schema validation. Only the two
    genuinely-optional root fields (``attendance``, ``syllabusProgress``,
    which are typed as plain objects with no null in the schema) are
    dropped when absent.
    """
    data = dashboard.model_dump(mode="json")
    if data.get("attendance") is None:
        data.pop("attendance", None)
    if data.get("syllabusProgress") is None:
        data.pop("syllabusProgress", None)
    return data


def validate_against_schema(data: dict, schema_path: str = SCHEMA_PATH) -> None:
    with open(schema_path) as f:
        schema = json.load(f)
    jsonschema.validate(instance=data, schema=schema)


def _resolve_manifest_path(base_dir: str, path: str) -> str:
    return path if os.path.isabs(path) else os.path.join(base_dir, path)


def run_from_manifest(manifest_path: str, out_path: str) -> DashboardData:
    with open(manifest_path) as f:
        manifest = json.load(f)
    base_dir = os.path.dirname(os.path.abspath(manifest_path))

    subjects_config: Dict[str, SubjectConfig] = {}
    for subject, cfg in manifest.get("subjects", {}).items():
        scored_tests = []
        for t in cfg.get("scoredTests", []):
            t = dict(t)
            t["path"] = _resolve_manifest_path(base_dir, t["path"])
            scored_tests.append(ScoredTestSpec(**t))
        tracking_grid = cfg.get("trackingGrid")
        if tracking_grid is not None:
            tracking_grid = _resolve_manifest_path(base_dir, tracking_grid)
        subjects_config[subject] = SubjectConfig(scored_tests=scored_tests, tracking_grid=tracking_grid)

    roster_path = _resolve_manifest_path(base_dir, manifest["rosterPath"])

    dashboard = build_dashboard(
        school=manifest["school"],
        className=manifest["className"],
        roster=roster_path,
        subjects_config=subjects_config,
        attendance=manifest.get("attendance"),
        syllabus_progress=manifest.get("syllabusProgress"),
    )

    data = _dump_dashboard(dashboard)
    validate_against_schema(data)

    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)

    return dashboard


def main():
    ap = argparse.ArgumentParser(description="Build the CBSE dashboard JSON from source spreadsheets.")
    ap.add_argument("--config", required=True, help="Path to the pipeline manifest JSON file.")
    ap.add_argument("--out", required=True, help="Path to write the resulting dashboard JSON.")
    args = ap.parse_args()
    run_from_manifest(args.config, args.out)
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
