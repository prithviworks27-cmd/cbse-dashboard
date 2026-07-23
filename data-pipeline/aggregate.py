"""Steps 6-10 of the pipeline: per-student metrics, class averages,
leaderboards, and the cross-subject combinedOverall -- all recomputed from
scratch on every run (never patched in place, see step 10 of the spec).

--------------------------------------------------------------------------
DESIGN NOTE -- two different gating rules, used deliberately in different
places (this is not spelled out unambiguously in the spec, flagged here and
in the final report):

  * TEST-LEVEL gating (a whole test counts as "attempted" if the student has
    at least one submitted=True question row in it). Used for:
      - StudentSubjectEntry.overall     ("marks scored / marks of tests they
        submitted" -- a test the student attempted counts its FULL marks in
        the denominator, even if they left some individual questions in it
        blank; a test they never touched at all is excluded entirely).
      - StudentSubjectEntry.trend       (per-test accuracy, same reasoning).
      - LeaderboardEntry.adjustedPct    (denominator = every test in the
        subject regardless of attendance, per step 7).
      - combinedOverall                 (denominator = only tests actually
        attempted, across all enrolled subjects, per step 8).

  * QUESTION-LEVEL gating (only rows where that specific question was
    submitted). Used for:
      - byTypology / byDifficulty / byType / byTopic / byTopicDifficulty
      - priority
      - questions[].accuracy
      - ScoredSubject.classAvg's byTypology/byDifficulty/byType
    A topic/typology/difficulty accuracy breakdown is about "how did the
    student do on the questions they actually answered in this bucket" --
    conflating a left-blank question inside an otherwise-submitted test with
    a wrong-answer would make topic-level weaknesses look artificially worse
    without evidence, which would poison the `priority` (worst topics)
    surfacing this whole feature exists for.
--------------------------------------------------------------------------
"""
from __future__ import annotations

from typing import Dict, List, Optional

import pandas as pd

from normalize import qid_sort_key
from parsers.format_c import TrackingData
from models import (
    ClassAvg,
    LeaderboardEntry,
    PriorityItem,
    QuestionDetail,
    ScoredSubject,
    StudentSubjectEntry,
    TrackingOnlySubject,
    TrendPoint,
)

PRIORITY_MIN = 4
PRIORITY_MAX = 6


def _pct(numerator: float, denominator: float) -> Optional[float]:
    if denominator is None or denominator == 0 or pd.isna(denominator):
        return None
    return round(float(numerator) / float(denominator) * 100, 2)


def _test_total_marks(df: pd.DataFrame, test_order: List[str]) -> Dict[str, float]:
    """Full marks possible for each test = sum of marks of its unique
    questions (question rows repeat once per student, so dedupe first)."""
    totals: Dict[str, float] = {t: 0.0 for t in test_order}
    if df.empty:
        return totals
    for test_id, g in df.groupby("test_id"):
        uniq = g.drop_duplicates(subset="qno_norm")
        totals[test_id] = float(uniq["marks"].sum())
    return totals


def _student_test_level(df: pd.DataFrame, student: str) -> Dict[str, Dict[str, float]]:
    """Per test_id for one student: {"attempted": bool, "score_sum": float}.

    "attempted" = at least one submitted=True row for this student in this
    test. score_sum treats any un-submitted individual question within an
    attempted test as contributing 0 (never null-propagates the whole test).
    """
    out: Dict[str, Dict[str, float]] = {}
    sdf = df[df["student"] == student]
    for test_id, g in sdf.groupby("test_id"):
        attempted = bool(g["submitted"].any())
        score_sum = float(g["score"].fillna(0).sum()) if attempted else 0.0
        out[test_id] = {"attempted": attempted, "score_sum": score_sum}
    return out


def _grouped_question_level(df_submitted: pd.DataFrame, group_cols) -> pd.DataFrame:
    if df_submitted.empty:
        return pd.DataFrame(columns=list(group_cols) + ["score", "marks"])
    return df_submitted.groupby(list(group_cols)).agg(score=("score", "sum"), marks=("marks", "sum")).reset_index()


def _first_seen_order(df: pd.DataFrame, test_order: List[str], col: str) -> List[str]:
    """Unique values of `col` in encounter order: test order, then numeric
    qno order within each test. Gives deterministic, readable orderings for
    `topics` / `typologies` lists."""
    if df.empty:
        return []
    order_index = {t: i for i, t in enumerate(test_order)}
    tmp = df.drop_duplicates(subset=["test_id", "qno_norm"]).copy()
    tmp["_test_ord"] = tmp["test_id"].map(order_index).fillna(len(test_order))
    tmp["_qno_ord"] = tmp["qno_norm"].map(qid_sort_key)
    tmp = tmp.sort_values(["_test_ord", "_qno_ord"])
    seen: List[str] = []
    for v in tmp[col]:
        if v not in seen:
            seen.append(v)
    return seen


def build_student_subject_entry(
    df: pd.DataFrame,
    student: str,
    enrolled: bool,
    test_order: List[str],
    test_total_marks: Dict[str, float],
) -> StudentSubjectEntry:
    sdf = df[df["student"] == student]
    submitted_df = sdf[sdf["submitted"] & sdf["score"].notna()]

    # --- overall (test-level gating) ---
    test_level = _student_test_level(df, student)
    num, den = 0.0, 0.0
    any_attempted = False
    for test_id in test_order:
        info = test_level.get(test_id)
        if info and info["attempted"]:
            any_attempted = True
            num += info["score_sum"]
            den += test_total_marks.get(test_id, 0.0)
    overall = _pct(num, den) if any_attempted else None

    # --- question-level breakdowns ---
    by_typology = {r["typology"]: _pct(r["score"], r["marks"]) for _, r in
                   _grouped_question_level(submitted_df, ["typology"]).iterrows()}
    by_difficulty = {r["difficulty"]: _pct(r["score"], r["marks"]) for _, r in
                      _grouped_question_level(submitted_df, ["difficulty"]).iterrows()}
    by_type = {r["type"]: _pct(r["score"], r["marks"]) for _, r in
               _grouped_question_level(submitted_df, ["type"]).iterrows()}
    by_topic = {r["topic"]: _pct(r["score"], r["marks"]) for _, r in
                _grouped_question_level(submitted_df, ["topic"]).iterrows()}

    by_topic_difficulty: Dict[str, Dict[str, float]] = {}
    td = _grouped_question_level(submitted_df, ["topic", "difficulty"])
    for _, r in td.iterrows():
        pct = _pct(r["score"], r["marks"])
        if pct is None:
            continue
        by_topic_difficulty.setdefault(r["topic"], {})[r["difficulty"]] = pct

    # --- trend (test-level gating, in test order) ---
    trend: List[TrendPoint] = []
    for test_id in test_order:
        info = test_level.get(test_id)
        if info and info["attempted"]:
            acc = _pct(info["score_sum"], test_total_marks.get(test_id, 0.0))
        else:
            acc = None
        trend.append(TrendPoint(test=test_id, accuracy=acc))

    # --- priority: worst (topic, typology, difficulty) combos ---
    combo = _grouped_question_level(submitted_df, ["topic", "typology", "difficulty"])
    priority: List[PriorityItem] = []
    if not combo.empty:
        combo["accuracy"] = combo.apply(lambda r: _pct(r["score"], r["marks"]), axis=1)
        combo = combo.dropna(subset=["accuracy"])
        # worst accuracy first; ties broken by highest stakes (marks) first
        combo = combo.sort_values(["accuracy", "marks"], ascending=[True, False])
        take = min(PRIORITY_MAX, len(combo))
        # if there are at least PRIORITY_MIN combos, take up to PRIORITY_MAX;
        # if fewer exist we simply can't fabricate more -- take what's there.
        for _, r in combo.head(take).iterrows():
            priority.append(PriorityItem(
                topic=r["topic"], typology=r["typology"], difficulty=r["difficulty"],
                accuracy=float(r["accuracy"]), marks=float(r["marks"]),
            ))

    # --- questions: full detail, sorted by test order then numeric qno ---
    order_index = {t: i for i, t in enumerate(test_order)}
    sdf_sorted = sdf.copy()
    sdf_sorted["_test_ord"] = sdf_sorted["test_id"].map(order_index).fillna(len(test_order))
    sdf_sorted["_qno_ord"] = sdf_sorted["qno"].map(qid_sort_key)
    sdf_sorted = sdf_sorted.sort_values(["_test_ord", "_qno_ord"])

    questions: List[QuestionDetail] = []
    for _, r in sdf_sorted.iterrows():
        score = None if pd.isna(r["score"]) else float(r["score"])
        acc = _pct(score, r["marks"]) if score is not None else None
        questions.append(QuestionDetail(
            test=r["test_id"], topic=r["topic"], qno=r["qno"], difficulty=r["difficulty"],
            typology=r["typology"], type=r["type"], score=score, marks=float(r["marks"]),
            accuracy=acc,
        ))

    return StudentSubjectEntry(
        enrolled=enrolled,
        overall=overall,
        byTypology=by_typology,
        byDifficulty=by_difficulty,
        byType=by_type,
        byTopic=by_topic,
        byTopicDifficulty=by_topic_difficulty,
        trend=trend,
        priority=priority,
        questions=questions,
    )


def build_leaderboard(
    df: pd.DataFrame,
    enrolled_students: List[str],
    test_order: List[str],
    test_total_marks: Dict[str, float],
) -> List[LeaderboardEntry]:
    total_possible = sum(test_total_marks.get(t, 0.0) for t in test_order)
    rows = []
    for student in enrolled_students:
        test_level = _student_test_level(df, student)
        num = 0.0
        tests_taken = 0
        for test_id in test_order:
            info = test_level.get(test_id)
            if info and info["attempted"]:
                num += info["score_sum"]
                tests_taken += 1
        adjusted_pct = round(num / total_possible * 100, 2) if total_possible > 0 else 0.0
        rows.append({
            "student": student, "testsTaken": tests_taken, "totalScore": round(num, 2),
            "adjustedPct": adjusted_pct,
        })

    ranked = [r for r in rows if r["testsTaken"] > 0]
    unranked = [r for r in rows if r["testsTaken"] == 0]
    # sort: adjustedPct desc, then testsTaken desc (more tests taken wins a
    # tie), then alphabetical by name for full determinism
    ranked.sort(key=lambda r: (-r["adjustedPct"], -r["testsTaken"], r["student"]))
    unranked.sort(key=lambda r: r["student"])

    entries: List[LeaderboardEntry] = []
    for i, r in enumerate(ranked, start=1):
        entries.append(LeaderboardEntry(rank=i, **r))
    for r in unranked:
        entries.append(LeaderboardEntry(rank=None, **r))
    return entries


def build_scored_subject(
    subject: str,
    df: pd.DataFrame,
    test_order: List[str],
    test_labels: Dict[str, str],
    enrolled_students: List[str],
    tracking_extra: TrackingData,
) -> ScoredSubject:
    test_total_marks = _test_total_marks(df, test_order)

    students: Dict[str, StudentSubjectEntry] = {}
    for student in enrolled_students:
        students[student] = build_student_subject_entry(df, student, True, test_order, test_total_marks)

    # --- classAvg (pooled across enrolled students) ---
    enrolled_df = df[df["student"].isin(enrolled_students)]
    submitted_df = enrolled_df[enrolled_df["submitted"] & enrolled_df["score"].notna()]

    by_typology = {r["typology"]: _pct(r["score"], r["marks"]) for _, r in
                   _grouped_question_level(submitted_df, ["typology"]).iterrows()}
    by_difficulty = {r["difficulty"]: _pct(r["score"], r["marks"]) for _, r in
                      _grouped_question_level(submitted_df, ["difficulty"]).iterrows()}
    by_type = {r["type"]: _pct(r["score"], r["marks"]) for _, r in
               _grouped_question_level(submitted_df, ["type"]).iterrows()}

    total_num, total_den = 0.0, 0.0
    submitted_count = 0
    for student in enrolled_students:
        test_level = _student_test_level(df, student)
        attempted_any = False
        for test_id in test_order:
            info = test_level.get(test_id)
            if info and info["attempted"]:
                attempted_any = True
                total_num += info["score_sum"]
                total_den += test_total_marks.get(test_id, 0.0)
        if attempted_any:
            submitted_count += 1
    overall = _pct(total_num, total_den)
    class_avg = ClassAvg(
        byTypology=by_typology, byDifficulty=by_difficulty, byType=by_type,
        overall=overall if overall is not None else 0.0,
        submittedCount=submitted_count,
        totalStudents=len(enrolled_students),
        totalTests=len(test_order),
        totalMarksAllTests=sum(test_total_marks.get(t, 0.0) for t in test_order),
    )

    topics = _first_seen_order(df, test_order, "topic")
    typologies = _first_seen_order(df, test_order, "typology")

    leaderboard = build_leaderboard(df, enrolled_students, test_order, test_total_marks)

    tracking_only_extra = TrackingOnlySubject(
        testOrder=tracking_extra.test_order,
        testLabels=tracking_extra.test_labels,
        submissions={s: tracking_extra.submissions.get(s, []) for s in enrolled_students},
    )

    return ScoredSubject(
        classAvg=class_avg,
        students=students,
        testOrder=test_order,
        testLabels=test_labels,
        topics=topics,
        typologies=typologies,
        leaderboard=leaderboard,
        trackingOnlyExtra=tracking_only_extra,
    )


def build_tracking_only_subject(tracking_data: TrackingData, enrolled_students: List[str]) -> TrackingOnlySubject:
    return TrackingOnlySubject(
        testOrder=tracking_data.test_order,
        testLabels=tracking_data.test_labels,
        submissions={s: tracking_data.submissions.get(s, []) for s in enrolled_students},
    )


def compute_combined_overall(
    students: List[str],
    subject_enrollment: Dict[str, List[str]],
    subject_dfs: Dict[str, pd.DataFrame],
    subject_test_orders: Dict[str, List[str]],
):
    """Cross-subject headline number per step 8: marks scored across every
    ATTEMPTED test in every enrolled subject, over marks POSSIBLE in only
    those attempted tests (deliberately NOT the subject-wide full-pool
    denominator the leaderboard uses -- see module docstring)."""
    per_student: Dict[str, Optional[float]] = {}
    for student in students:
        enrolled_subjects = subject_enrollment.get(student, [])
        num, den = 0.0, 0.0
        any_attempted = False
        for subject in enrolled_subjects:
            df = subject_dfs.get(subject)
            if df is None or df.empty:
                continue
            test_order = subject_test_orders.get(subject, [])
            test_total_marks = _test_total_marks(df, test_order)
            test_level = _student_test_level(df, student)
            for test_id in test_order:
                info = test_level.get(test_id)
                if info and info["attempted"]:
                    any_attempted = True
                    num += info["score_sum"]
                    den += test_total_marks.get(test_id, 0.0)
        per_student[student] = _pct(num, den) if any_attempted else None

    non_null = [v for v in per_student.values() if v is not None]
    # Design choice: classOverall = the mean of students' individual
    # combinedOverall values (a simple, explainable headline number), not a
    # marks-pooled micro-average. Documented here since the spec doesn't
    # pin this down explicitly.
    class_overall = round(sum(non_null) / len(non_null), 2) if non_null else None
    return class_overall, per_student
