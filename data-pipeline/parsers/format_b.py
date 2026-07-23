"""Format B: wide Score + Typology workbook (second school's shape).

``Score`` sheet: one row per student, one column per question (school's own
question-bank IDs, e.g. ``Q216``, ``Q310 (i)`` -- not sequential), plus
meta columns (student name, submitted/not-submitted, total marks). ``Typology``
sheet: one row per question, with its own ``Q.No`` naming that may not
textually match the Score sheet's column names (``Q.1`` vs ``Q1``, ``222`` vs
``Q222``). We melt Score into the same long shape as Format A, normalizing
question IDs on both sides before matching -- never assume they already
agree textually.
"""
from __future__ import annotations

from typing import Dict, Optional

import pandas as pd

from normalize import find_column, normalize_colname, normalize_qid, normalize_typology
from validate import assert_no_unmatched_rows, validate_marks
from . import LONG_COLUMNS

_SUBMITTED_TRUE = {"submitted", "checked"}

# Score-sheet meta columns that are NOT question columns.
_META_ALIASES = {
    normalize_colname(a)
    for a in [
        "S.No", "SNo", "student_name", "Student Name",
        "submitted / not submitted", "submitted/not submitted", "Status",
        "total_marks_obt", "total marks obt", "Total Marks Obtained",
    ]
}


def _find_sheet(sheets: Dict[str, pd.DataFrame], *candidates: str) -> pd.DataFrame:
    norm_map = {normalize_colname(name): name for name in sheets}
    for cand in candidates:
        key = normalize_colname(cand)
        if key in norm_map:
            return sheets[norm_map[key]]
    raise KeyError(f"Could not find sheet among {candidates!r}; workbook has sheets {list(sheets)}")


def parse_format_b(
    path: str,
    *,
    test_id: str,
    test_label: str,
    subject: str,
    marks_overrides: Optional[Dict[str, float]] = None,
    topic_override: Optional[str] = None,
) -> pd.DataFrame:
    sheets = pd.read_excel(path, sheet_name=None, engine="openpyxl")
    score_sheet = _find_sheet(sheets, "Score")
    typ_sheet = _find_sheet(sheets, "Typology")

    student_col = find_column(score_sheet.columns, ["student_name", "Student Name"], field_name="student_name")
    status_col = find_column(
        score_sheet.columns,
        ["submitted / not submitted", "submitted/not submitted", "Status"],
        field_name="submitted / not submitted",
    )

    question_cols = [c for c in score_sheet.columns if normalize_colname(c) not in _META_ALIASES]

    long_rows = score_sheet.melt(
        id_vars=[student_col, status_col],
        value_vars=question_cols,
        var_name="qno",
        value_name="score",
    )
    long_rows = long_rows.rename(columns={student_col: "student", status_col: "status_raw"})
    long_rows["student"] = long_rows["student"].astype(str).str.strip()
    long_rows["qno"] = long_rows["qno"].astype(str).str.strip()
    long_rows["qno_norm"] = long_rows["qno"].map(normalize_qid)
    long_rows["submitted"] = long_rows["status_raw"].astype(str).str.strip().str.lower().isin(_SUBMITTED_TRUE)
    long_rows["score"] = pd.to_numeric(long_rows["score"], errors="coerce")
    # Format B only records submission at the whole-test level (no
    # per-question submitted flag) -- if the student didn't submit the test,
    # never fabricate a score for any of their questions even if a stray
    # value sits in the cell.
    long_rows.loc[~long_rows["submitted"], "score"] = float("nan")
    long_rows = long_rows.drop(columns=["status_raw"])

    typ_qno_col = find_column(typ_sheet.columns, ["Q.No", "QNo", "Q No", "Question No"], field_name="Q.No")
    topic_col = find_column(typ_sheet.columns, ["Topic"], field_name="Topic")
    diff_col = find_column(typ_sheet.columns, ["Difficulty"], field_name="Difficulty")
    typology_col = find_column(typ_sheet.columns, ["CBSE Typology", "CBSETypology", "Typology"],
                                field_name="CBSE Typology")
    marks_col = find_column(typ_sheet.columns, ["Marks"], field_name="Marks")
    type_col = find_column(typ_sheet.columns, ["Theory / Numerical", "Theory Numerical", "Type"],
                            field_name="Theory / Numerical")
    paper_col = find_column(typ_sheet.columns, ["Paper ID", "PaperID"], required=False, field_name="Paper ID")

    typ = pd.DataFrame({
        "qno_norm": typ_sheet[typ_qno_col].map(normalize_qid),
        "topic": typ_sheet[topic_col].astype(str).str.strip() if topic_override is None else topic_override,
        "difficulty": typ_sheet[diff_col].astype(str).str.strip(),
        "typology": typ_sheet[typology_col].map(normalize_typology),
        "marks": pd.to_numeric(typ_sheet[marks_col], errors="coerce"),
        "type": typ_sheet[type_col].astype(str).str.strip(),
        "paper_id": typ_sheet[paper_col].astype(str).str.strip() if paper_col else "",
    })
    typ = typ.drop_duplicates(subset="qno_norm", keep="first")

    merged = long_rows.merge(typ, on="qno_norm", how="left", indicator=True)
    assert_no_unmatched_rows(merged, test_id)
    merged = merged.drop(columns="_merge")

    merged = validate_marks(merged, test_id, marks_overrides=marks_overrides)

    merged["test_id"] = test_id
    merged["test_label"] = test_label
    merged["subject"] = subject
    merged["score"] = merged["score"].astype(float)

    return merged[LONG_COLUMNS]
