"""Format D: student roster / subject enrollment.

Table: ``S.No, Student Name, Class, Subjects`` where ``Subjects`` is
multi-select text like ``"Physics, Chemistry, Maths"``. This is the
*authoritative* source of which students take which subjects -- it is never
derived from test data, since a student can be enrolled with zero
submissions.
"""
from __future__ import annotations

import re
from typing import Dict, List, Union

import pandas as pd

from normalize import find_column

RosterSource = Union[str, pd.DataFrame]

_SUBJECT_SPLIT_RE = re.compile(r"[,;/]")


class RosterData:
    def __init__(self, students: List[str], class_by_student: Dict[str, str],
                 subject_enrollment: Dict[str, List[str]]):
        self.students = students
        self.class_by_student = class_by_student
        self.subject_enrollment = subject_enrollment

    @property
    def all_subjects(self) -> List[str]:
        seen: List[str] = []
        for subs in self.subject_enrollment.values():
            for s in subs:
                if s not in seen:
                    seen.append(s)
        return seen


def _load(source: RosterSource) -> pd.DataFrame:
    if isinstance(source, pd.DataFrame):
        return source
    if str(source).lower().endswith((".xlsx", ".xls")):
        return pd.read_excel(source, engine="openpyxl")
    return pd.read_csv(source)


def parse_format_d(source: RosterSource) -> RosterData:
    df = _load(source)

    student_col = find_column(df.columns, ["Student Name", "StudentName"], field_name="Student Name")
    class_col = find_column(df.columns, ["Class"], required=False, field_name="Class")
    subjects_col = find_column(df.columns, ["Subjects", "Subject"], field_name="Subjects")

    students: List[str] = []
    class_by_student: Dict[str, str] = {}
    subject_enrollment: Dict[str, List[str]] = {}

    for _, row in df.iterrows():
        student = str(row[student_col]).strip()
        if not student or student.lower() == "nan":
            continue
        students.append(student)
        if class_col:
            class_by_student[student] = str(row[class_col]).strip()
        raw_subjects = str(row[subjects_col]) if pd.notna(row[subjects_col]) else ""
        subjects = [s.strip() for s in _SUBJECT_SPLIT_RE.split(raw_subjects) if s.strip()]
        subject_enrollment[student] = subjects

    return RosterData(students, class_by_student, subject_enrollment)
