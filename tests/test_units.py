"""Unit tests for the pipeline's individual building blocks:
  - question-ID normalizer across all described ID format variants
  - CBSE typology label normalizer
  - marks validator raising on blank/exceeded marks
  - unmatched-row assertion after a scores<->typology merge
  - leaderboard tie-break rule
  - combinedOverall formula (attempted-only denominator, NOT the
    leaderboard's subject-wide full-pool denominator)
  - enrollment-gating logic (non-enrolled student absent from leaderboard
    and class averages)
  - the tracking-only -> scored "graduation" transition (old placeholder
    removed, no double count)
"""
import os

import pandas as pd
import pytest

from conftest import FIXTURES_DIR

from normalize import normalize_qid, normalize_typology, qid_sort_key
from validate import (
    MarksValidationError,
    UnmatchedRowsError,
    assert_no_unmatched_rows,
    validate_marks,
)
from parsers import LONG_COLUMNS
from parsers.format_c import TrackingData
from aggregate import build_leaderboard, build_scored_subject, compute_combined_overall
from build import SubjectConfig, ScoredTestSpec, build_dashboard


# ---------------------------------------------------------------------------
# Question-ID normalizer
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("a,b", [
    ("Q216", "216"),
    ("Q216", "Q.216"),
    ("Q216", "q216"),
    ("Q222", "Q.222"),
    ("Q1", "Q.1"),
    ("Q1", "1"),
    ("Q310 (i)", "Q310(I)"),
    ("Q310 (i)", "310 I"),
    ("Q310 (i)", "q310(i)"),
])
def test_normalize_qid_matches_variants(a, b):
    assert normalize_qid(a) == normalize_qid(b)


@pytest.mark.parametrize("a,b", [
    ("Q216", "Q222"),
    ("Q310 (i)", "Q310 (ii)"),
    ("Q1", "Q10"),
])
def test_normalize_qid_distinguishes_different_questions(a, b):
    assert normalize_qid(a) != normalize_qid(b)


def test_qid_sort_key_numeric_not_lexicographic():
    qnos = ["Q10", "Q2", "Q1"]
    assert sorted(qnos, key=qid_sort_key) == ["Q1", "Q2", "Q10"]


# ---------------------------------------------------------------------------
# Typology normalizer
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("raw", [
    "Remembering",
    "remembering",
    "Understanding",
    "understanding",
    "Understanding / Remembering",
    "Understanding/Remembering",
    "Understanding /Remembering",
    "Remembering/Understanding",
])
def test_normalize_typology_collapses_remembering_bucket(raw):
    assert normalize_typology(raw) == "Understanding / Remembering"


def test_normalize_typology_keeps_applying_and_analysing_separate():
    assert normalize_typology("Applying") == "Applying"
    assert normalize_typology("Analysing") == "Analysing"
    assert normalize_typology("Analyzing") == "Analysing"
    assert normalize_typology("Applying") != normalize_typology("Analysing")
    assert normalize_typology("Applying") != normalize_typology("Remembering")


# ---------------------------------------------------------------------------
# Marks validator
# ---------------------------------------------------------------------------

def _long_df(rows):
    return pd.DataFrame(rows)


def test_validate_marks_raises_on_blank_stated_marks():
    df = _long_df([
        {"qno_norm": "1", "score": 2.0, "marks": None},
        {"qno_norm": "1", "score": 1.0, "marks": None},
    ])
    with pytest.raises(MarksValidationError) as exc:
        validate_marks(df, "test1")
    assert exc.value.issues[0]["qno"] == "1"
    assert exc.value.issues[0]["stated_marks"] is None


def test_validate_marks_raises_when_observed_exceeds_stated():
    df = _long_df([
        {"qno_norm": "1", "score": 5.0, "marks": 3.0},
        {"qno_norm": "1", "score": 2.0, "marks": 3.0},
    ])
    with pytest.raises(MarksValidationError) as exc:
        validate_marks(df, "test1")
    issue = exc.value.issues[0]
    assert issue["observed_max"] == 5.0
    assert issue["stated_marks"] == 3.0


def test_validate_marks_passes_with_override():
    df = _long_df([
        {"qno_norm": "1", "score": 5.0, "marks": 3.0},
    ])
    out = validate_marks(df, "test1", marks_overrides={"1": 5.0})
    assert out.loc[0, "marks"] == 5.0


def test_validate_marks_ok_when_observed_within_stated():
    df = _long_df([
        {"qno_norm": "1", "score": 2.0, "marks": 3.0},
        {"qno_norm": "1", "score": float("nan"), "marks": 3.0},
    ])
    out = validate_marks(df, "test1")
    assert (out["marks"] == 3.0).all()


# ---------------------------------------------------------------------------
# Unmatched-row assertion
# ---------------------------------------------------------------------------

def test_assert_no_unmatched_rows_raises_on_left_only():
    merged = pd.DataFrame([
        {"qno_norm": "1", "score": 2.0, "_merge": "both"},
        {"qno_norm": "99", "score": 1.0, "_merge": "left_only"},
    ])
    with pytest.raises(UnmatchedRowsError):
        assert_no_unmatched_rows(merged, "test1")


def test_assert_no_unmatched_rows_allows_blank_score_for_not_submitted():
    # A blank score for a legitimately-not-submitted question is fine as
    # long as the question itself matched a typology row (indicator="both").
    merged = pd.DataFrame([
        {"qno_norm": "1", "score": float("nan"), "_merge": "both"},
    ])
    assert_no_unmatched_rows(merged, "test1")  # should not raise


# ---------------------------------------------------------------------------
# Leaderboard tie-break rule
# ---------------------------------------------------------------------------

def _make_row(test_id, student, qno, score, marks, submitted=True):
    return {
        "test_id": test_id, "test_label": test_id, "subject": "Physics",
        "student": student, "qno": qno, "qno_norm": qno,
        "submitted": submitted, "score": score,
        "topic": "T", "difficulty": "Easy", "typology": "Applying", "type": "Theory",
        "marks": marks, "paper_id": "",
    }


def test_leaderboard_tiebreak_more_tests_taken_then_alphabetical():
    # adjustedPct's denominator is FIXED (total marks across every test in
    # the subject, whether attempted or not) -- so Zoe, Bob, and Cal all
    # land on exactly the same 50% despite very different participation:
    #   Zoe: attempted only t1, aced it (10/10)      -> 10 / 20 = 50%
    #   Bob/Cal: attempted both tests, half marks     -> 10 / 20 = 50%
    # Amy is included as a clearly-lower scorer for contrast.
    rows = [
        _make_row("t1", "Amy", "Q1", 5, 10),
        _make_row("t2", "Amy", "Q1", 0, 10),
        _make_row("t1", "Zoe", "Q1", 10, 10),
        _make_row("t2", "Zoe", "Q1", None, 10, submitted=False),
        # Bob and Cal tie exactly on percentage AND tests taken -> alphabetical
        _make_row("t1", "Bob", "Q1", 5, 10),
        _make_row("t2", "Bob", "Q1", 5, 10),
        _make_row("t1", "Cal", "Q1", 5, 10),
        _make_row("t2", "Cal", "Q1", 5, 10),
    ]
    df = pd.DataFrame(rows)[LONG_COLUMNS]
    test_order = ["t1", "t2"]
    totals = {"t1": 10.0, "t2": 10.0}
    board = build_leaderboard(df, ["Amy", "Zoe", "Bob", "Cal"], test_order, totals)
    by_name = {e.student: e for e in board}

    assert by_name["Amy"].adjustedPct == 25.0   # 5 / 20, clearly last
    assert by_name["Zoe"].adjustedPct == 50.0   # 10 / 20
    assert by_name["Bob"].adjustedPct == by_name["Cal"].adjustedPct == 50.0  # 10 / 20

    # Three-way tie at 50% between Zoe, Bob, Cal: Bob/Cal took MORE tests
    # (2) than Zoe (1), so the tie-break rule puts them ahead of Zoe even
    # though all three share the same adjustedPct.
    assert by_name["Bob"].testsTaken == by_name["Cal"].testsTaken == 2
    assert by_name["Zoe"].testsTaken == 1
    assert by_name["Bob"].rank < by_name["Zoe"].rank
    assert by_name["Cal"].rank < by_name["Zoe"].rank
    assert by_name["Amy"].rank > by_name["Zoe"].rank  # lowest pct ranks last

    # Bob and Cal are the true final tie case: identical pct AND identical
    # testsTaken -> alphabetical order decides.
    assert by_name["Bob"].rank < by_name["Cal"].rank


def test_leaderboard_zero_submissions_gets_null_rank():
    rows = [_make_row("t1", "Amy", "Q1", 5, 10)]
    df = pd.DataFrame(rows)[LONG_COLUMNS]
    board = build_leaderboard(df, ["Amy", "NoShow"], ["t1"], {"t1": 10.0})
    by_name = {e.student: e for e in board}
    assert by_name["NoShow"].rank is None
    assert by_name["NoShow"].testsTaken == 0
    assert by_name["NoShow"].adjustedPct == 0.0


def test_leaderboard_more_tests_taken_wins_true_tie():
    # Construct an exact tie in adjustedPct (both land on 10/20 = 50%) where
    # testsTaken differs, isolating the "more tests taken wins" rule.
    rows = [
        # Dev: aces t1, never attempts t2 -> 10 / 20 = 50%
        _make_row("t1", "Dev", "Q1", 10, 10),
        _make_row("t2", "Dev", "Q1", None, 10, submitted=False),
        # Eva: half marks on both t1 and t2 -> 10 / 20 = 50%, but attempted both
        _make_row("t1", "Eva", "Q1", 5, 10),
        _make_row("t2", "Eva", "Q1", 5, 10),
    ]
    df = pd.DataFrame(rows)[LONG_COLUMNS]
    board = build_leaderboard(df, ["Dev", "Eva"], ["t1", "t2"], {"t1": 10.0, "t2": 10.0})
    by_name = {e.student: e for e in board}
    assert by_name["Dev"].adjustedPct == by_name["Eva"].adjustedPct == 50.0
    assert by_name["Eva"].testsTaken == 2
    assert by_name["Dev"].testsTaken == 1
    assert by_name["Eva"].rank == 1
    assert by_name["Dev"].rank == 2


# ---------------------------------------------------------------------------
# combinedOverall formula: attempted-only denominator, distinct from
# leaderboard's subject-wide full-pool denominator
# ---------------------------------------------------------------------------

def test_combined_overall_uses_attempted_only_denominator():
    # Physics has 3 tests worth 10 marks each (30 total); student attempts
    # only 1 of them and scores 5/10. Leaderboard's adjustedPct would be
    # 5/30 = 16.67%, but combinedOverall must use only the attempted test:
    # 5/10 = 50%.
    rows = [
        _make_row("t1", "Amy", "Q1", 5, 10),
        _make_row("t2", "Amy", "Q1", None, 10, submitted=False),
        _make_row("t3", "Amy", "Q1", None, 10, submitted=False),
    ]
    df = pd.DataFrame(rows)[LONG_COLUMNS]
    class_overall, per_student = compute_combined_overall(
        students=["Amy"],
        subject_enrollment={"Amy": ["Physics"]},
        subject_dfs={"Physics": df},
        subject_test_orders={"Physics": ["t1", "t2", "t3"]},
    )
    assert per_student["Amy"] == 50.0  # NOT 16.67

    # For contrast, confirm the leaderboard formula (used elsewhere) really
    # would give the smaller, full-pool-denominator number.
    board = build_leaderboard(df, ["Amy"], ["t1", "t2", "t3"], {"t1": 10.0, "t2": 10.0, "t3": 10.0})
    assert board[0].adjustedPct == 16.67


def test_combined_overall_null_when_zero_submissions_anywhere():
    df = pd.DataFrame([_make_row("t1", "Amy", "Q1", None, 10, submitted=False)])[LONG_COLUMNS]
    _, per_student = compute_combined_overall(
        students=["Amy"],
        subject_enrollment={"Amy": ["Physics"]},
        subject_dfs={"Physics": df},
        subject_test_orders={"Physics": ["t1"]},
    )
    assert per_student["Amy"] is None


# ---------------------------------------------------------------------------
# Enrollment gating
# ---------------------------------------------------------------------------

def test_enrollment_gating_excludes_non_enrolled_student_from_subject():
    # "Ghost" has rows in the subject's data (e.g. a stray submission) but is
    # deliberately left out of enrolled_students -- must not appear anywhere
    # in the built ScoredSubject.
    rows = [
        _make_row("t1", "Amy", "Q1", 8, 10),
        _make_row("t1", "Ghost", "Q1", 10, 10),
    ]
    df = pd.DataFrame(rows)[LONG_COLUMNS]
    subject = build_scored_subject(
        "Physics", df, ["t1"], {"t1": "Test 1"},
        enrolled_students=["Amy"],  # Ghost excluded
        tracking_extra=TrackingData([], {}, {}),
    )
    assert "Ghost" not in subject.students
    assert {e.student for e in subject.leaderboard} == {"Amy"}
    assert subject.classAvg.totalStudents == 1
    # class average must be computed only from Amy's row, not blended with Ghost's
    assert subject.classAvg.overall == 80.0


def test_enrollment_gating_excludes_non_enrolled_from_tracking_only():
    from aggregate import build_tracking_only_subject
    tracking = TrackingData(["t1"], {"t1": "Test 1"}, {"Amy": ["t1"], "Ghost": ["t1"]})
    result = build_tracking_only_subject(tracking, enrolled_students=["Amy"])
    assert "Ghost" not in result.submissions
    assert result.submissions == {"Amy": ["t1"]}


# ---------------------------------------------------------------------------
# Tracking-only -> scored graduation
# ---------------------------------------------------------------------------

def test_tracking_data_drop_tests_removes_graduated_test():
    tracking = TrackingData(
        test_order=["t1", "t2"],
        test_labels={"t1": "Test 1", "t2": "Test 2"},
        submissions={"Amy": ["t1", "t2"], "Bob": ["t2"]},
    )
    graduated = tracking.drop_tests({"t1"})
    assert graduated.test_order == ["t2"]
    assert "t1" not in graduated.test_labels
    assert graduated.submissions == {"Amy": ["t2"], "Bob": ["t2"]}


def test_graduation_end_to_end_no_double_count():
    """Full pipeline: a test that used to be tracking-only ('phy_test1') now
    has scored data. Its tracking placeholder must disappear from
    trackingOnlyExtra entirely (not just be ignored) so it can never be
    double-counted, while a genuinely-still-pending test ('phy_test2')
    remains tracking-only."""
    roster_path = os.path.join(FIXTURES_DIR, "roster.csv")
    scored_xlsx = os.path.join(FIXTURES_DIR, "physics_test1_format_a.xlsx")

    tracking_grid = pd.DataFrame({
        "S.No": [1, 2, 3],
        "Student Name": ["Aarav Sharma", "Diya Patel", "Kabir Singh"],
        # phy_test1 used to be tracked here before scores existed; phy_test2
        # is still genuinely pending.
        "phy_test1": ["Submitted", "Submitted", "Not submitted"],
        "phy_test2": ["Submitted", "Not submitted", "Not submitted"],
    })

    dashboard = build_dashboard(
        school="Test School",
        className="10-A",
        roster=roster_path,
        subjects_config={
            "Physics": SubjectConfig(
                scored_tests=[
                    ScoredTestSpec(path=scored_xlsx, format="A", test_id="phy_test1",
                                    test_label="Physics Test 1"),
                ],
                tracking_grid=tracking_grid,
            ),
        },
    )

    physics = dashboard.scored["Physics"]
    # graduated test must be gone from the tracking-only placeholder...
    assert "phy_test1" not in physics.trackingOnlyExtra.testOrder
    for subs in physics.trackingOnlyExtra.submissions.values():
        assert "phy_test1" not in subs
    # ...but still present (and only once) in the scored testOrder
    assert physics.testOrder.count("phy_test1") == 1
    # ...and the still-pending test remains tracking-only
    assert "phy_test2" in physics.trackingOnlyExtra.testOrder
    # totalTests must reflect only the scored test, not double-count the
    # graduated placeholder
    assert physics.classAvg.totalTests == 1
