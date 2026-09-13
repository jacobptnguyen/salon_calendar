import { useRef, useState } from 'react'
import { useAppointmentsContext } from '../../context/AppointmentsProvider'
import { useEmployeesContext } from '../../context/EmployeesProvider'
import { formatShortTime, parseTimeAndNote } from '../../lib/date'

const cellLines = 'border-b border-hairline [&:not(:nth-child(7n))]:border-r'

// One box of the wall calendar: a small day number in the top-left corner,
// then the day's appointments — just "9:45 Full set", one line each. A
// busy day's week simply grows taller (see MonthGrid) rather than cutting
// anything off.
//
// Clicking the cell opens it for editing in place: every appointment
// becomes one plain text line you can retype directly ("2:30 Full set"),
// plus one blank line at the end to add another. Tapping anywhere in the
// cell — not just precisely on that line — lands the cursor there, since
// the audience here isn't reliably able to click a small target exactly;
// clicking an existing line still edits that one specifically. There's no
// Save button — a line commits when you click away from it (or press
// Enter), and clearing a line entirely removes that appointment. Only one
// day is ever open at a time (see MonthCalendar), closed by clicking
// elsewhere or pressing Escape.
//
// A day before today gets a plain X drawn over it, corner to corner —
// like crossing a finished day off a paper calendar. Its appointments
// stay exactly as they were underneath (nothing is ever deleted, and the
// text stays fully readable), and it's still clickable like any other
// day, in case a mistake needs fixing after the fact.
export function DayCell({ day, appointments, isToday, isPast, isEditing, onOpenEdit }) {
  if (!day.inCurrentMonth) {
    return <div className={`min-w-0 ${cellLines}`} aria-hidden="true" />
  }

  const count = appointments.length
  const label = `${day.dayNumber}${isToday ? ', today' : ''}${isPast ? ', past' : ''}: ${
    count === 0 ? 'no appointments' : count === 1 ? '1 appointment' : `${count} appointments`
  }`
  const crossedOut = isPast && !isEditing

  return (
    <div
      data-day-cell={day.dateKey}
      onClick={(event) => {
        if (!isEditing) {
          onOpenEdit(day.dateKey)
          return
        }
        // Already open: a click that doesn't land precisely on a line's
        // own input still has to go somewhere — send it to the newest
        // line rather than doing nothing, since it's the one most likely
        // being reached for and the smallest, hardest target to hit.
        if (event.target.tagName !== 'INPUT') {
          const inputs = event.currentTarget.querySelectorAll('input')
          inputs[inputs.length - 1]?.focus()
        }
      }}
      aria-label={isEditing ? undefined : label}
      className={`relative flex min-w-0 flex-col gap-0.5 px-1 pt-0.5 pb-0.5 md:px-1.5 ${cellLines} ${
        isEditing ? 'cursor-default bg-highlight outline-[3px] -outline-offset-[3px] outline-ink' : 'cursor-pointer'
      }`}
    >
      {crossedOut && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to top right, transparent calc(50% - 1px), var(--color-ink-muted) calc(50% - 1px), var(--color-ink-muted) calc(50% + 1px), transparent calc(50% + 1px)), linear-gradient(to top left, transparent calc(50% - 1px), var(--color-ink-muted) calc(50% - 1px), var(--color-ink-muted) calc(50% + 1px), transparent calc(50% + 1px))',
          }}
        />
      )}

      <span
        className={`day-number flex shrink-0 items-center leading-none tabular-nums ${
          isToday ? 'justify-center rounded-full bg-ink font-bold text-paper' : 'justify-start px-1 text-ink'
        }`}
        style={isToday ? { width: 'calc(var(--appt-size) * 1.5)', height: 'calc(var(--appt-size) * 1.5)' } : undefined}
      >
        {day.dayNumber}
      </span>

      {isEditing ? (
        <EditableAppointments dateKey={day.dateKey} appointments={appointments} />
      ) : (
        count > 0 && (
          <ul className="flex flex-col gap-px">
            {appointments.map((appt) => (
              <li key={appt.id} className="min-w-0">
                <p className="appt-line block min-w-0 rounded-sm pr-1 pl-[calc(1em+0.25rem)] -indent-[1em] break-words whitespace-normal text-ink">
                  {appt.appointment_time && <span className="font-bold tabular-nums">{formatShortTime(appt.appointment_time)} </span>}
                  {appt.customer_name}
                </p>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}

// Clicking anywhere else, or pressing Escape, is how you leave this state
// — handled by MonthCalendar, which owns which day (if any) is open.
function EditableAppointments({ dateKey, appointments }) {
  const [draftKey, setDraftKey] = useState(0)

  return (
    <ul className="flex flex-col gap-1 overflow-y-auto">
      {appointments.map((appt) => (
        <li key={appt.id} className="min-w-0">
          <AppointmentRow appt={appt} dateKey={dateKey} />
        </li>
      ))}
      <li className="min-w-0">
        {/* Always focused on mount — when the day first opens, and again
            after each successful add (a fresh blank line remounts via
            draftKey) — so typing can just continue right away. */}
        <AppointmentRow
          key={`new-${draftKey}`}
          appt={null}
          dateKey={dateKey}
          autoFocus
          onCommitted={() => setDraftKey((k) => k + 1)}
        />
      </li>
    </ul>
  )
}

// A plain "time note" or, with no time, just the note.
function describeAppointment(appt) {
  return appt.appointment_time ? `${formatShortTime(appt.appointment_time)} ${appt.customer_name}` : appt.customer_name
}

// One editable line, typed the way it's written on paper: "2:30 Full
// set". Just a simple text entry — no format or business-hours checking;
// a leading time is read off when there's one to find (parseTimeAndNote),
// but isn't required — a line with none is saved as just a note. Editing
// an existing line with no time in it keeps that appointment's time as-is
// and just updates the note. No Save button — committing happens when the
// line loses focus (click away or Enter), via the same add/update/remove
// calls the old form used. Clearing an existing line entirely removes
// that appointment.
function AppointmentRow({ appt, dateKey, autoFocus, onCommitted }) {
  const { addAppointment, updateAppointmentInPlace, removeAppointment } = useAppointmentsContext()
  const { selectedEmployeeId } = useEmployeesContext()
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const isNew = !appt

  function handleKeyDown(event) {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  function handleBlur() {
    void commit()
  }

  async function commit() {
    const trimmed = (inputRef.current?.value ?? '').trim()

    if (isNew) {
      if (!trimmed) return // nothing typed — nothing to do
    } else if (!trimmed) {
      // Clearing the whole line is how an appointment is removed — no
      // delete button, no confirmation.
      try {
        await removeAppointment(appt.id)
      } catch {
        setError('Not removed. Please try again.')
      }
      return
    }

    // A leading time is read off the line when there's one to find; the
    // rest (or the whole line, if there's no time) is the note. Editing an
    // existing line with no time in it keeps that appointment's time as-is
    // rather than clearing it.
    const parsed = parseTimeAndNote(trimmed)
    const currentTime = appt?.appointment_time?.slice(0, 5) ?? null
    const time = parsed ? parsed.time : isNew ? null : currentTime
    const note = parsed ? parsed.note : trimmed

    // Nothing actually changed — skip the write.
    if (!isNew && time === currentTime && note === appt.customer_name) {
      setError('')
      return
    }

    try {
      if (isNew) {
        // Whichever employee's filter is active becomes whose task this is
        // — "All" leaves it unassigned, same as today.
        await addAppointment({ customerName: note, dateKey, time, employeeId: selectedEmployeeId })
        onCommitted?.()
      } else {
        await updateAppointmentInPlace(appt.id, { customerName: note, dateKey, time })
      }
      setError('')
    } catch {
      setError('Not saved. Please try again.')
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <input
        ref={inputRef}
        type="text"
        defaultValue={appt ? describeAppointment(appt) : ''}
        autoFocus={autoFocus}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onChange={() => error && setError('')}
        aria-label={isNew ? 'New appointment' : `Edit appointment: ${describeAppointment(appt)}`}
        autoComplete="off"
        className="appt-line block w-full min-w-0 rounded-sm border-0 bg-transparent text-ink placeholder:text-ink-faint"
      />
      {error && <p className="text-[0.8em] leading-snug font-bold text-danger">{error}</p>}
    </div>
  )
}
