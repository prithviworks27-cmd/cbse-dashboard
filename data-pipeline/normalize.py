"""Normalization helpers used everywhere a merge or a groupby depends on
matching strings that different source schools spell differently.

Three independent normalizers live here:

1. ``normalize_colname``   - for matching spreadsheet header names regardless
                              of case/whitespace/punctuation.
2. ``normalize_qid``        - for matching question IDs across Score-sheet
                              column headers and Typology-sheet ``Q.No`` values
                              (Format B), and across Test_Scores_Unpivot /
                              CBSE_Typology sheets (Format A).
3. ``normalize_typology``   - for collapsing CBSE cognitive-level labels into
                              the canonical bucket set the dashboard expects.
"""
from __future__ import annotations

import re
from typing import Dict, Iterable, Optional

_PUNCT_RE = re.compile(r"[^a-z0-9]")


def normalize_colname(raw: object) -> str:
    """Collapse a spreadsheet column header to a bare lowercase alnum key.

    ``"Student Name"``, ``"student_name"``, ``" StudentName "`` and
    ``"Student  Name"`` all normalize to ``"studentname"`` so header lookups
    are robust to the whitespace/case/punctuation drift the spec calls out.
    """
    return _PUNCT_RE.sub("", str(raw).strip().lower())


def find_column(columns: Iterable[str], aliases: Iterable[str], *, required: bool = True,
                 field_name: str = "") -> Optional[str]:
    """Find the actual column name in ``columns`` matching one of ``aliases``.

    Matching is done via ``normalize_colname`` on both sides. Returns the
    original (un-normalized) column name so callers can index the dataframe
    with it. Raises ``KeyError`` if required and not found.
    """
    alias_set = {normalize_colname(a) for a in aliases}
    for col in columns:
        if normalize_colname(col) in alias_set:
            return col
    if required:
        raise KeyError(
            f"Could not find a column for '{field_name or aliases}' among headers {list(columns)}"
        )
    return None


# --- question ID normalization -------------------------------------------------

_QID_STRIP_RE = re.compile(r"[Q().\s]", re.IGNORECASE)


def normalize_qid(raw: object) -> str:
    """Normalize a question ID for cross-sheet/cross-format matching.

    Strips the letters 'Q', dots, spaces, and parens, then uppercases.
    This makes ``Q216``, ``216``, ``Q.216`` and ``q 216`` all equal, and
    lets ``Q310 (i)`` match a typology row spelled ``310(I)`` or ``310 i``.
    Never assume the two sides already agree textually -- always run both
    sides through this function before comparing/merging.
    """
    s = str(raw).strip()
    s = _QID_STRIP_RE.sub("", s)
    return s.upper()


def qid_sort_key(qno: str):
    """Sort key for question IDs so 'Q10' does not sort before 'Q2'.

    Extracts the first run of digits as the primary numeric key; falls back
    to a large number (so un-numbered IDs sort last) and uses the full
    original string as a stable tie-breaker (e.g. 'Q310 (i)' vs 'Q310 (ii)').
    """
    s = str(qno)
    m = re.search(r"\d+", s)
    numeric = int(m.group()) if m else float("inf")
    return (numeric, s)


# --- CBSE typology label normalization ------------------------------------------

_TYPOLOGY_CANON: Dict[str, str] = {
    "remembering": "Understanding / Remembering",
    "understanding": "Understanding / Remembering",
    "understanding/remembering": "Understanding / Remembering",
    "remembering/understanding": "Understanding / Remembering",
    "applying": "Applying",
    "analysing": "Analysing",
    "analyzing": "Analysing",  # US spelling variant, kept as the same bucket as Analysing
}


def normalize_typology(raw: object) -> str:
    """Collapse Remembering/Understanding/(Understanding / Remembering) label
    variants -- including inconsistent slash-spacing -- into a single
    ``"Understanding / Remembering"`` bucket. ``Applying`` and ``Analysing``
    are kept as their own distinct buckets (never merged with each other or
    with the Understanding/Remembering bucket).

    Unrecognized labels are passed through unchanged (stripped) rather than
    silently dropped, so unexpected typology spellings are visible in output
    instead of disappearing.
    """
    s = str(raw).strip()
    collapsed_slashes = re.sub(r"\s*/\s*", "/", s)
    key = collapsed_slashes.lower()
    return _TYPOLOGY_CANON.get(key, s)
