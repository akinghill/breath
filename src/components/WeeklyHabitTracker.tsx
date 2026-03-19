

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const SESSION_COLORS = [
  '#22233a', // 0 – empty
  '#3b3d7a', // 1 – low
  '#5558c8', // 2 – mid
  '#6366f1', // 3 – full
]

/** Returns the ISO date strings for Mon–Sun of the current week. */
function currentWeekDays(): string[] {
  const now = new Date()
  const day = now.getDay() // 0 = Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

export interface WeeklyHabitTrackerProps {
  habit: Record<string, number>
  today: string
}

export function WeeklyHabitTracker({ habit, today }: WeeklyHabitTrackerProps) {
  const weekDays = currentWeekDays()

  return (
    <div className="flex gap-2 mb-8">
      {weekDays.map((date, i) => {
        const count = habit[date] ?? 0
        const isToday = date === today
        return (
          <div key={date} className="flex flex-col items-center gap-1.5">
            <div
              className="w-9 h-9 rounded-lg transition-colors duration-300"
              style={{ backgroundColor: SESSION_COLORS[count] }}
            />
            <span
              className="text-xs"
              style={{ color: isToday ? '#6b7280' : '#3a3b4a' }}
            >
              {DAY_LABELS[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
