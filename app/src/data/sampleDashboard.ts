import type { DashboardData } from '../types/dashboard'

// Anonymized sample fixture used for local development and render tests. Deliberately covers
// all four subject states (scored / tracking-only / no-data / not-enrolled) and a student
// with zero submissions, so the UI has real cases to render against during development.
export const sampleDashboard: DashboardData = {
  school: 'Bluebell Academy',
  className: 'XII',
  subjects: ['Physics', 'Chemistry', 'Maths'],
  subjectsWithScores: ['Physics'],
  students: ['Asha Verma', 'Rahul Singh', 'Priya Nair', 'Karan Mehta'],
  subjectEnrollment: {
    'Asha Verma': ['Physics', 'Chemistry', 'Maths'],
    'Rahul Singh': ['Physics', 'Chemistry'],
    'Priya Nair': ['Physics', 'Maths'],
    'Karan Mehta': ['Chemistry', 'Maths'],
  },
  attendance: {
    'Asha Verma': { attendancePct: 92, presentPct: 85, onlinePct: 7, absentPct: 8 },
    'Rahul Singh': { attendancePct: 78, presentPct: 70, onlinePct: 8, absentPct: 22 },
    'Priya Nair': { attendancePct: 88, presentPct: 88, onlinePct: 0, absentPct: 12 },
    'Karan Mehta': { attendancePct: 95, presentPct: 90, onlinePct: 5, absentPct: 5 },
  },
  syllabusProgress: { Physics: 65, Chemistry: 40, Maths: 20 },
  scored: {
    Physics: {
      classAvg: {
        byTypology: { 'Understanding / Remembering': 82, Applying: 71, Analysing: 60 },
        byDifficulty: { Easy: 85, Medium: 70, Hard: 55 },
        byType: { MCQ: 78, Subjective: 68 },
        byTopic: { "Coulomb's Law (Subjective)": 65, "Coulomb's Law (MCQ)": 75, "Ohm's Law": 70 },
        overall: 73.5,
        submittedCount: 2,
        totalStudents: 3,
        totalTests: 3,
        totalMarksAllTests: 150,
      },
      testOrder: ['t1', 't2', 't3'],
      testLabels: {
        t1: "Unit Test 1 - Coulomb's Law",
        t2: 'Unit Test 2 - Current Electricity',
        t3: 'Half Yearly Comprehensive Examination',
      },
      topics: ["Coulomb's Law (Subjective)", "Coulomb's Law (MCQ)", "Ohm's Law", 'Half Yearly Comprehensive Examination'],
      typologies: ['Understanding / Remembering', 'Applying', 'Analysing'],
      students: {
        'Asha Verma': {
          enrolled: true,
          overall: 82,
          byTypology: { 'Understanding / Remembering': 90, Applying: 78, Analysing: 70 },
          byDifficulty: { Easy: 88, Medium: 80, Hard: 65 },
          byType: { MCQ: 85, Subjective: 78 },
          byTopic: { "Coulomb's Law (Subjective)": 78, "Coulomb's Law (MCQ)": 88, "Ohm's Law": 84 },
          byTopicDifficulty: {
            "Coulomb's Law (Subjective)": { Easy: 90, Medium: 75, Hard: 60 },
            "Coulomb's Law (MCQ)": { Easy: 95, Medium: 88, Hard: 80 },
            "Ohm's Law": { Easy: 90, Medium: 82, Hard: 70 },
          },
          trend: [
            { test: 't1', accuracy: 75 },
            { test: 't2', accuracy: 85 },
            { test: 't3', accuracy: 88 },
          ],
          priority: [
            { topic: "Coulomb's Law (Subjective)", typology: 'Analysing', difficulty: 'Hard', accuracy: 40, marks: 5 },
            { topic: "Ohm's Law", typology: 'Applying', difficulty: 'Hard', accuracy: 55, marks: 4 },
          ],
          questions: [
            { test: 't1', topic: "Coulomb's Law (MCQ)", qno: 'Q1', difficulty: 'Easy', typology: 'Understanding / Remembering', type: 'MCQ', score: 1, marks: 1, accuracy: 100 },
            { test: 't1', topic: "Coulomb's Law (Subjective)", qno: 'Q2', difficulty: 'Hard', typology: 'Analysing', type: 'Subjective', score: 2, marks: 5, accuracy: 40 },
            { test: 't2', topic: "Ohm's Law", qno: 'Q1', difficulty: 'Medium', typology: 'Applying', type: 'Numerical', score: 4, marks: 5, accuracy: 80 },
            { test: 't3', topic: 'Half Yearly Comprehensive Examination', qno: 'Q10', difficulty: 'Hard', typology: 'Analysing', type: 'Subjective', score: 4, marks: 5, accuracy: 80 },
          ],
        },
        'Rahul Singh': {
          enrolled: true,
          overall: 65,
          byTypology: { 'Understanding / Remembering': 75, Applying: 60, Analysing: 50 },
          byDifficulty: { Easy: 80, Medium: 60, Hard: 45 },
          byType: { MCQ: 70, Subjective: 58 },
          byTopic: { "Coulomb's Law (Subjective)": 55, "Coulomb's Law (MCQ)": 75, "Ohm's Law": 62 },
          byTopicDifficulty: {
            "Coulomb's Law (Subjective)": { Easy: 70, Medium: 50, Hard: 35 },
            "Coulomb's Law (MCQ)": { Easy: 85, Medium: 70, Hard: 60 },
            "Ohm's Law": { Easy: 75, Medium: 60, Hard: 45 },
          },
          trend: [
            { test: 't1', accuracy: 60 },
            { test: 't2', accuracy: 62 },
            { test: 't3', accuracy: 70 },
          ],
          priority: [
            { topic: "Coulomb's Law (Subjective)", typology: 'Analysing', difficulty: 'Hard', accuracy: 30, marks: 5 },
            { topic: "Ohm's Law", typology: 'Applying', difficulty: 'Hard', accuracy: 40, marks: 4 },
          ],
          questions: [
            { test: 't1', topic: "Coulomb's Law (MCQ)", qno: 'Q1', difficulty: 'Easy', typology: 'Understanding / Remembering', type: 'MCQ', score: 1, marks: 1, accuracy: 100 },
            { test: 't2', topic: "Ohm's Law", qno: 'Q1', difficulty: 'Medium', typology: 'Applying', type: 'Numerical', score: 3, marks: 5, accuracy: 60 },
            { test: 't3', topic: 'Half Yearly Comprehensive Examination', qno: 'Q10', difficulty: 'Hard', typology: 'Analysing', type: 'Subjective', score: 3, marks: 5, accuracy: 60 },
          ],
        },
        'Priya Nair': {
          enrolled: true,
          overall: null,
          byTypology: {},
          byDifficulty: {},
          byType: {},
          byTopic: {},
          byTopicDifficulty: {},
          trend: [
            { test: 't1', accuracy: null },
            { test: 't2', accuracy: null },
            { test: 't3', accuracy: null },
          ],
          priority: [],
          questions: [],
        },
      },
      leaderboard: [
        { student: 'Asha Verma', testsTaken: 3, totalScore: 123, adjustedPct: 82, rank: 1 },
        { student: 'Rahul Singh', testsTaken: 3, totalScore: 97.5, adjustedPct: 65, rank: 2 },
        { student: 'Priya Nair', testsTaken: 0, totalScore: 0, adjustedPct: 0, rank: null },
      ],
      trackingOnlyExtra: { testOrder: [], testLabels: {}, submissions: {} },
    },
  },
  trackingOnly: {
    Chemistry: {
      testOrder: ['c1', 'c2'],
      testLabels: { c1: 'Periodic Test 1', c2: 'Periodic Test 2' },
      submissions: {
        'Asha Verma': ['c1', 'c2'],
        'Rahul Singh': ['c1'],
        'Karan Mehta': ['c1', 'c2'],
      },
    },
  },
  combinedOverall: {
    classOverall: 73.5,
    students: {
      'Asha Verma': 82,
      'Rahul Singh': 65,
      'Priya Nair': null,
      'Karan Mehta': null,
    },
  },
}
