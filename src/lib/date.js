// Naive local date/time helpers. Appointments are stored as plain
// `date` + `time` columns (no timezone), since this is a single physical
// location and mixing in timezone-aware conversion is how appointments
// silently end up on the wrong day. Never call .toISOString() on a
// date-only value anywhere in this app — it converts to UTC and can shift
// the calendar date.

function pad(n) {
  return String(n).padStart(2, '0')
}

// 'YYYY-MM-DD' from a local Date, using local getters only (no UTC conversion).
export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayDateKey() {
  return toDateKey(new Date())
}

// 'YYYY-MM' for month-cache keys.
export function toMonthKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

// Builds the Sunday-first weeks covering the given month, for MonthGrid.
// Only as many weeks as the month actually needs (4–6), so a 5-week month
// doesn't waste a whole row of screen height on next month's days.
export function buildMonthMatrix(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekCount = Math.ceil((firstOfMonth.getDay() + daysInMonth) / 7)
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay())

  const weeks = []
  let cursor = gridStart
  for (let week = 0; week < weekCount; week++) {
    const days = []
    for (let day = 0; day < 7; day++) {
      days.push({
        date: cursor,
        dateKey: toDateKey(cursor),
        dayNumber: cursor.getDate(),
        inCurrentMonth: cursor.getMonth() === month,
      })
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    }
    weeks.push(days)
  }
  return weeks
}

// 'HH:MM:SS' (Postgres time) or 'HH:MM' -> minutes since midnight, for sorting.
export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// 'HH:MM:SS' -> '2:30', the way it's written on the paper calendar. Salon
// hours never overlap across AM/PM ambiguity (no 9 PM appointments), so
// the calendar lines leave the AM/PM off; the side panel shows it in full.
export function formatShortTime(time) {
  const minutes = timeToMinutes(time)
  const hour12 = Math.floor(minutes / 60) % 12 || 12
  return `${hour12}:${pad(minutes % 60)}`
}

export const monthNameFormatter = new Intl.DateTimeFormat(undefined, { month: 'long' })

// "2:30 Full set" — an explicit colon.
const TIME_WITH_COLON = /^(\d{1,2}):(\d{2})\s*(am|pm)?\s+(.+)$/i
// "230 Full set" — no colon at all (a hard character for some people to
// type, being the shifted form of the semicolon key): the last two
// digits are the minutes, whatever's left is the hour.
const TIME_NO_COLON = /^(\d{3,4})\s*(am|pm)?\s+(.+)$/i
// "9 Full set" — a bare hour, no minutes (:00).
const TIME_HOUR_ONLY = /^(\d{1,2})\s*(am|pm)?\s+(.+)$/i

// Parses one line typed the way it's written on paper — "2:30 Full set" —
// into a 24-hour 'HH:MM' time and a note. The colon is optional (see
// TIME_NO_COLON above). A bare hour with no am/pm is read the same way
// staff already write it on paper: 1-7 means afternoon/evening, 8-11
// means morning, 12 means noon. That's never actually ambiguous for this
// salon, which never opens before 9am or past 7:30pm.
// Returns null if the text doesn't start with a recognizable time.
export function parseTimeAndNote(text) {
  const trimmed = text.trim()
  let hour12, minute, marker, note

  const withColon = TIME_WITH_COLON.exec(trimmed)
  const noColon = !withColon && TIME_NO_COLON.exec(trimmed)
  const hourOnly = !withColon && !noColon && TIME_HOUR_ONLY.exec(trimmed)

  if (withColon) {
    hour12 = Number(withColon[1])
    minute = Number(withColon[2])
    marker = withColon[3]
    note = withColon[4]
  } else if (noColon) {
    const digits = noColon[1]
    hour12 = Number(digits.slice(0, -2))
    minute = Number(digits.slice(-2))
    marker = noColon[2]
    note = noColon[3]
  } else if (hourOnly) {
    hour12 = Number(hourOnly[1])
    minute = 0
    marker = hourOnly[2]
    note = hourOnly[3]
  } else {
    return null
  }

  marker = marker?.toLowerCase()
  note = note.trim()

  if (hour12 < 1 || hour12 > 12 || minute > 59 || !note) return null

  let hour24
  if (marker === 'am') hour24 = hour12 % 12
  else if (marker === 'pm') hour24 = (hour12 % 12) + 12
  else if (hour12 === 12) hour24 = 12
  else if (hour12 <= 7) hour24 = hour12 + 12
  else hour24 = hour12 // bare 8-11, no marker: morning

  return { time: `${pad(hour24)}:${pad(minute)}`, note }
}
