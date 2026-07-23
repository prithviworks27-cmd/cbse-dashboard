"""One parser module per input format (A/B/C/D). Each parser is responsible
only for turning its raw spreadsheet shape into a common internal
representation; format_a/format_b both produce the same "long" per-question
dataframe (see ``LONG_COLUMNS`` below) so ``aggregate.py`` never has to know
which format a test originally came from.
"""
from __future__ import annotations

# Canonical column set shared by Format A and Format B parser output, after
# merging scores with typology. One row = one (student, question) pair for
# one test.
LONG_COLUMNS = [
    "test_id",
    "test_label",
    "subject",
    "student",
    "qno",       # original/display question id (as seen in the source test)
    "qno_norm",  # normalized id, used only for joins -- not for display
    "submitted",  # bool: did the student submit this question
    "score",      # float or NaN
    "topic",
    "difficulty",
    "typology",   # normalized CBSE typology bucket
    "type",       # Theory / Numerical
    "marks",      # resolved max marks for the question
    "paper_id",
]
