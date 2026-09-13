import { useMemo } from 'react'
import { buildMonthMatrix, todayDateKey } from '../../lib/date'
import { useEmployeesContext } from '../../context/EmployeesProvider'
import { DayCell } from './DayCell'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// The grid of a real wall calendar page: weekday names over a plain rule,
// then a white grid of cells split by hairlines, sized to exactly the
// weeks this month needs. Each week is as tall as its busiest day needs
// (never cutting an appointment off); any leftover screen height spreads
// across the weeks. A month taller than the screen scrolls.
export function MonthGrid({ monthDate, appointments, isLoading, editingDate, onOpenEdit }) {
  const weeks = buildMonthMatrix(monthDate)
  const today = todayDateKey()
  const { selectedEmployeeId } = useEmployeesContext()

  const byDate = useMemo(() => {
    const visible = selectedEmployeeId
      ? appointments.filter((appt) => appt.employee_id === selectedEmployeeId)
      : appointments
    const map = {}
    for (const appt of visible) {
      ;(map[appt.appointment_date] ||= []).push(appt)
    }
    return map
  }, [appointments, selectedEmployeeId])

  return (
    <div className="flex flex-1 flex-col">
      <div className="grid grid-cols-7 border-b-2 border-ink" aria-hidden="true">
        {WEEKDAYS.map((name) => (
          <div key={name} className="truncate px-1 pb-1 text-[1.05rem] font-bold tracking-[0.04em] text-ink uppercase md:px-2 md:text-[1.25rem] md:tracking-[0.1em]">
            <span className="hidden 2xl:inline">{name}</span>
            <span className="2xl:hidden">{name.slice(0, 3)}</span>
          </div>
        ))}
      </div>

      <div className="relative flex flex-1 flex-col">
        <div
          className="grid flex-1 grid-cols-7 [--row-min:4.75rem] md:[--row-min:9rem] lg:[--row-min:3rem]"
          style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(var(--row-min), auto))` }}
        >
          {weeks.flatMap((week) =>
            week.map((day) => (
              <DayCell
                key={day.dateKey}
                day={day}
                appointments={byDate[day.dateKey] || []}
                isToday={day.dateKey === today}
                isPast={day.dateKey < today}
                isEditing={day.dateKey === editingDate}
                onOpenEdit={onOpenEdit}
              />
            ))
          )}
        </div>

        {isLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status">
            <p className="rounded-md border-2 border-ink bg-paper px-8 py-5 text-3xl font-bold text-ink">Loading appointments…</p>
          </div>
        )}
      </div>
    </div>
  )
}
