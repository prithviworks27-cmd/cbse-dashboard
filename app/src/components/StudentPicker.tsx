interface StudentPickerProps {
  students: string[]
  selected: string | null // null = "All Students"
  onSelect: (student: string | null) => void
}

export function StudentPicker({ students, selected, onSelect }: StudentPickerProps) {
  return (
    <label className="student-picker mono">
      Student
      <select value={selected ?? '__all__'} onChange={(e) => onSelect(e.target.value === '__all__' ? null : e.target.value)}>
        <option value="__all__">All Students</option>
        {students.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </label>
  )
}
