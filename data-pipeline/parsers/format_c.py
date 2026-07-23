"""Format C: submission-tracking-only grid, no scores.

Shape: ``S.No, Student Name, <Test 1>, <Test 2>, ...`` where each cell is
``Checked``, ``Submitted``, or ``Not submitted``. No marks, no per-question
detail -- this is modeled entirely separately from A/B and must never have
scores fabricated for it.

In practice this often comes from a pasted screenshot the tutor transcribes
into a simple grid, so this parser accepts a plain CSV path, a DataFrame
already in memory, or a list of dicts -- it does not require a formatted
Excel workbook.
"""
from __future__ import annotations

from typing import Dict, List, Union

import pandas as pd

from normalize import normalize_colname

_SUBMITTED_TRUE = {"submitted", "checked"}
_META_ALIASES = {normalize_colname(a) for a in ["S.No", "SNo", "Student Name", "StudentName"]}

TrackingSource = Union[str, pd.DataFrame, List[dict]]


class TrackingData:
    """Container for a parsed Format-C grid: which tests exist and which
    students submitted which. Mirrors the shape of ``TrackingOnlySubject``
    in the JSON schema (test_order / test_labels / submissions)."""

    def __init__(self, test_order: List[str], test_labels: Dict[str, str],
                 submissions: Dict[str, List[str]]):
        self.test_order = test_order
        self.test_labels = test_labels
        self.submissions = submissions

    def is_empty(self) -> bool:
        return not self.test_order

    def drop_tests(self, test_ids_to_drop: set) -> "TrackingData":
        """Return a copy with the given test ids removed entirely -- used
        when a tracking-only test graduates to fully-scored and its
        placeholder must not double-count."""
        new_order = [t for t in self.test_order if t not in test_ids_to_drop]
        new_labels = {t: l for t, l in self.test_labels.items() if t not in test_ids_to_drop}
        new_subs = {
            student: [t for t in tests if t not in test_ids_to_drop]
            for student, tests in self.submissions.items()
        }
        return TrackingData(new_order, new_labels, new_subs)


def _load_grid(source: TrackingSource) -> pd.DataFrame:
    if isinstance(source, pd.DataFrame):
        return source
    if isinstance(source, list):
        return pd.DataFrame(source)
    # path
    if str(source).lower().endswith((".xlsx", ".xls")):
        return pd.read_excel(source, engine="openpyxl")
    return pd.read_csv(source)


def parse_format_c(source: TrackingSource) -> TrackingData:
    """Parse a Format-C submission grid. Test ids default to the grid's own
    column headers (trimmed) -- keep those headers consistent with the
    ``test_id`` used for the same test's scored ingestion (format A/B) so
    the graduation logic (see ``TrackingData.drop_tests``) can match them up.
    """
    df = _load_grid(source)

    student_col = None
    for col in df.columns:
        if normalize_colname(col) in {normalize_colname(a) for a in ["Student Name", "StudentName"]}:
            student_col = col
            break
    if student_col is None:
        raise KeyError(f"Could not find a 'Student Name' column among {list(df.columns)}")

    test_cols = [c for c in df.columns if normalize_colname(c) not in _META_ALIASES]
    test_order = [str(c).strip() for c in test_cols]
    test_labels = {str(c).strip(): str(c).strip() for c in test_cols}

    submissions: Dict[str, List[str]] = {}
    for _, row in df.iterrows():
        student = str(row[student_col]).strip()
        submitted_tests = []
        for col in test_cols:
            val = str(row[col]).strip().lower()
            if val in _SUBMITTED_TRUE:
                submitted_tests.append(str(col).strip())
        submissions[student] = submitted_tests

    return TrackingData(test_order, test_labels, submissions)
