import { supabase } from './supabaseClient'
import { toDateKey, addMonths } from './date'

const TABLE = 'appointments'

// Keeps a locally-patched cache page in the same order the server would
// return it in (date, then time) after an insert/update. A note with no
// time yet (appointment_time null) sorts after every timed one that day,
// same as the server's ORDER BY ... ASC (Postgres puts nulls last).
export function sortByDateTime(list) {
  return [...list].sort((a, b) => {
    if (a.appointment_date !== b.appointment_date) {
      return a.appointment_date < b.appointment_date ? -1 : 1
    }
    if (a.appointment_time === b.appointment_time) return 0
    if (a.appointment_time === null) return 1
    if (b.appointment_time === null) return -1
    return a.appointment_time < b.appointment_time ? -1 : 1
  })
}

// [startInclusive, endExclusive) date-key bounds for a given displayed month.
function monthBounds(monthDate) {
  return [toDateKey(monthDate), toDateKey(addMonths(monthDate, 1))]
}

export async function fetchMonthAppointments(monthDate) {
  const [start, end] = monthBounds(monthDate)
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .gte('appointment_date', start)
    .lt('appointment_date', end)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  if (error) throw error
  return data
}

export async function createAppointment({ customerName, dateKey, time, employeeId }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ customer_name: customerName, appointment_date: dateKey, appointment_time: time, employee_id: employeeId ?? null })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAppointment(id, { customerName, dateKey, time }) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ customer_name: customerName, appointment_date: dateKey, appointment_time: time })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAppointment(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

// One shared realtime channel for the whole app (owned by AppointmentsProvider).
// onChange receives the raw postgres_changes payload; the caller patches its
// own in-memory cache by payload.eventType + payload.new/old.id.
export function subscribeToAppointments(onChange, onStatusChange) {
  const channel = supabase
    .channel('appointments-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, onChange)
    .subscribe((status) => onStatusChange?.(status))

  return () => {
    supabase.removeChannel(channel)
  }
}
