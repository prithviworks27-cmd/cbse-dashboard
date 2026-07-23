"""Pydantic models mirroring ``schemas/dashboard.schema.json``.

These are the internal typed representation used throughout the pipeline
AND the object that gets serialized (via ``.model_dump(mode="json")``) and
checked against the JSON Schema before being written to disk. Keep this file
in lock-step with the schema -- field names/shapes here are load-bearing for
the frontend contract, do not rename anything here without also updating the
schema (and telling the frontend team).
"""
from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class AttendanceEntry(StrictModel):
    attendancePct: float
    presentPct: float
    onlinePct: float
    absentPct: float


class TrackingOnlySubject(StrictModel):
    testOrder: List[str] = Field(default_factory=list)
    testLabels: Dict[str, str] = Field(default_factory=dict)
    submissions: Dict[str, List[str]] = Field(default_factory=dict)


class ClassAvg(StrictModel):
    byTypology: Dict[str, float] = Field(default_factory=dict)
    byDifficulty: Dict[str, float] = Field(default_factory=dict)
    byType: Dict[str, float] = Field(default_factory=dict)
    overall: float
    submittedCount: int
    totalStudents: int
    totalTests: int
    totalMarksAllTests: float


class TrendPoint(StrictModel):
    test: str
    accuracy: Optional[float] = None


class PriorityItem(StrictModel):
    topic: str
    typology: str
    difficulty: str
    accuracy: float
    marks: float


class QuestionDetail(StrictModel):
    test: str
    topic: str
    qno: str
    difficulty: str
    typology: str
    type: str
    score: Optional[float] = None
    marks: float
    accuracy: Optional[float] = None


class StudentSubjectEntry(StrictModel):
    enrolled: bool
    overall: Optional[float] = None
    byTypology: Dict[str, float] = Field(default_factory=dict)
    byDifficulty: Dict[str, float] = Field(default_factory=dict)
    byType: Dict[str, float] = Field(default_factory=dict)
    byTopic: Dict[str, float] = Field(default_factory=dict)
    byTopicDifficulty: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    trend: List[TrendPoint] = Field(default_factory=list)
    priority: List[PriorityItem] = Field(default_factory=list)
    questions: List[QuestionDetail] = Field(default_factory=list)


class LeaderboardEntry(StrictModel):
    student: str
    testsTaken: int
    totalScore: float
    adjustedPct: float
    rank: Optional[int] = None


class ScoredSubject(StrictModel):
    classAvg: ClassAvg
    students: Dict[str, StudentSubjectEntry] = Field(default_factory=dict)
    testOrder: List[str] = Field(default_factory=list)
    testLabels: Dict[str, str] = Field(default_factory=dict)
    topics: List[str] = Field(default_factory=list)
    typologies: List[str] = Field(default_factory=list)
    leaderboard: List[LeaderboardEntry] = Field(default_factory=list)
    trackingOnlyExtra: TrackingOnlySubject = Field(default_factory=TrackingOnlySubject)


class CombinedOverall(StrictModel):
    classOverall: Optional[float] = None
    students: Dict[str, Optional[float]] = Field(default_factory=dict)


class DashboardData(StrictModel):
    school: str
    className: str
    subjects: List[str] = Field(default_factory=list)
    subjectsWithScores: List[str] = Field(default_factory=list)
    students: List[str] = Field(default_factory=list)
    subjectEnrollment: Dict[str, List[str]] = Field(default_factory=dict)
    attendance: Optional[Dict[str, AttendanceEntry]] = None
    syllabusProgress: Optional[Dict[str, float]] = None
    scored: Dict[str, ScoredSubject] = Field(default_factory=dict)
    trackingOnly: Dict[str, TrackingOnlySubject] = Field(default_factory=dict)
    combinedOverall: CombinedOverall
