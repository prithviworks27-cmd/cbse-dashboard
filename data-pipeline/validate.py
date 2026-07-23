"""Validation gates that run during ingestion of every scored test file.

Both errors below are designed to be *loud and specific*: they raise with
the exact offending rows/question-IDs and both the observed and stated
values, rather than silently guessing. Callers that want to proceed anyway
must explicitly say so (e.g. via ``marks_overrides``), never implicitly.
"""
from __future__ import annotations

from typing import Dict, List, Optional

import pandas as pd


class UnmatchedRowsError(Exception):
    """Raised when rows in a Score sheet fail to find a matching Typology row
    after question-ID normalization (i.e. a real data problem, not just a
    blank score for a question the student didn't submit)."""

    def __init__(self, test_id: str, rows: pd.DataFrame):
        self.test_id = test_id
        self.rows = rows
        preview = rows.to_dict(orient="records")
        super().__init__(
            f"Test '{test_id}': {len(rows)} score row(s) did not match any "
            f"CBSE_Typology row after question-ID normalization. "
            f"Unmatched rows: {preview}"
        )


class MarksValidationError(Exception):
    """Raised when a question's stated Marks is blank, or the observed max
    score for that question exceeds the stated Marks. Never silently
    resolved -- caller must pass ``marks_overrides`` to confirm/override."""

    def __init__(self, test_id: str, issues: List[dict]):
        self.test_id = test_id
        self.issues = issues
        super().__init__(
            f"Test '{test_id}': marks validation failed for {len(issues)} question(s): {issues}. "
            f"Pass marks_overrides={{qno_norm: marks}} to confirm/override explicitly."
        )


def assert_no_unmatched_rows(merged: pd.DataFrame, test_id: str, indicator_col: str = "_merge") -> None:
    """After a left-merge of scores -> typology on normalized question ID,
    assert every score row found a typology match.

    A blank/NaN ``score`` on an otherwise-matched row (because the student
    did not submit that question) is expected and NOT an error -- this only
    flags rows where the *question itself* had no typology entry to join to.
    """
    unmatched = merged[merged[indicator_col] == "left_only"]
    if len(unmatched):
        raise UnmatchedRowsError(test_id, unmatched)


def validate_marks(
    long_df: pd.DataFrame,
    test_id: str,
    *,
    qno_col: str = "qno_norm",
    score_col: str = "score",
    marks_col: str = "marks",
    marks_overrides: Optional[Dict[str, float]] = None,
) -> pd.DataFrame:
    """For every question, compare the observed max score anyone achieved to
    the stated ``Marks``. Raises ``MarksValidationError`` (listing every
    offending question, both values) if:

    - stated Marks is blank/NaN for a question with no override, or
    - observed max score exceeds stated Marks for a question with no override.

    ``marks_overrides`` maps normalized qno -> the marks value the caller
    explicitly confirms should be used instead of (or in place of) whatever
    was stated. Returns the dataframe with a resolved ``marks`` column
    (overrides applied) -- never mutates in place silently otherwise.
    """
    marks_overrides = marks_overrides or {}
    out = long_df.copy()
    issues = []
    resolved_marks = {}

    for qno, group in out.groupby(qno_col):
        stated_series = group[marks_col].dropna().unique()
        stated = float(stated_series[0]) if len(stated_series) else None
        observed_max = group[score_col].max(skipna=True)
        observed_max = float(observed_max) if pd.notna(observed_max) else None

        if qno in marks_overrides:
            resolved_marks[qno] = float(marks_overrides[qno])
            continue

        if stated is None:
            issues.append({"qno": qno, "observed_max": observed_max, "stated_marks": None,
                            "reason": "stated Marks is blank"})
            continue
        if observed_max is not None and observed_max > stated:
            issues.append({"qno": qno, "observed_max": observed_max, "stated_marks": stated,
                            "reason": "observed max score exceeds stated Marks"})
            continue
        resolved_marks[qno] = stated

    if issues:
        raise MarksValidationError(test_id, issues)

    out[marks_col] = out[qno_col].map(resolved_marks)
    return out
