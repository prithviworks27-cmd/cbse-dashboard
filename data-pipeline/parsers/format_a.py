"""Format A: long/unpivoted Excel workbook, one test per file.

Sheets: ``Test_Scores`` (wide, informational only -- ignored on purpose),
``Test_Scores_Unpivot`` (one row per student x question), ``CBSE_Typology``
(one row per question).
"""
from __future__ import annotations

from typing import Dict, Optional

import pandas as pd

from normalize import find_column, normalize_colname, normalize_qid, normalize_typology
from validate import assert_no_unmatched_rows, validate_marks
from . import LONG_COLUMNS

_SUBMITTED_TRUE = {"submitted", "checked"}


def _find_sheet(sheets: Dict[str, pd.DataFrame], *candidates: str) -> pd.DataFrame:
    norm_map = {normalize_colname(name): name for name in sheets}
    for cand in candidates:
        key = normalize_colname(cand)
        if key in norm_map:
            return sheets[norm_map[key]]
    raise KeyError(f"Could not find sheet among {candidates!r}; workbook has sheets {list(sheets)}")


def parse_format_a(
    path: str,
    *,
    test_id: str,
    test_label: str,
    subject: str,
    marks_overrides: Optional[Dict[str, float]] = None,
    topic_override: Optional[str] = None,
) -> pd.DataFrame:
    """Parse one Format-A workbook into the common long dataframe.

    ``topic_override``: if this test is a comprehensive/review test spanning
    multiple underlying topics, pass a single topic label here and every
    question in the test will be tagged with it (design choice #5 -- we do
    NOT split a comprehensive test's questions back out into their
    individual underlying topics; the test is its own topic bucket).
    """
    sheets = pd.read_excel(path, sheet_name=None, engine="openpyxl")
    scores_sheet = _find_sheet(sheets, "Test_Scores_Unpivot", "TestScoresUnpivot")
    typ_sheet = _find_sheet(sheets, "CBSE_Typology", "CBSETypology")

    student_col = find_column(scores_sheet.columns, ["Student Name", "StudentName"], field_name="Student Name")
    qno_col = find_column(scores_sheet.columns, ["Q.No", "QNo", "Q No", "Question No"], field_name="Q.No")
    status_col = find_column(scores_sheet.columns, ["Submittedstatus", "Submitted Status", "Status"],
                              field_name="Submittedstatus")
    score_col = find_column(scores_sheet.columns, ["Score"], field_name="Score")

    scores = pd.DataFrame({
        "student": scores_sheet[student_col].astype(str).str.strip(),
        "qno": scores_sheet[qno_col].astype(str).str.strip(),
        "qno_norm": scores_sheet[qno_col].map(normalize_qid),
        "submitted": scores_sheet[status_col].astype(str).str.strip().str.lower().isin(_SUBMITTED_TRUE),
        "score": pd.to_numeric(scores_sheet[score_col], errors="coerce"),
    })
    # A question a student did not submit legitimately has no score, even if
    # the source sheet happens to have a stray value in that cell.
    scores.loc[~scores["submitted"], "score"] = float("nan")

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
    # de-duplicate typology rows on qno_norm (should already be 1:1, but guard
    # against accidental repeats in the source sheet).
    typ = typ.drop_duplicates(subset="qno_norm", keep="first")

    merged = scores.merge(typ, on="qno_norm", how="left", indicator=True)
    assert_no_unmatched_rows(merged, test_id)
    merged = merged.drop(columns="_merge")

    merged = validate_marks(merged, test_id, marks_overrides=marks_overrides)

    merged["test_id"] = test_id
    merged["test_label"] = test_label
    merged["subject"] = subject
    merged["score"] = merged["score"].astype(float)

    return merged[LONG_COLUMNS]
