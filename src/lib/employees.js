import { supabase } from './supabaseClient'

const TABLE = 'employees'

export async function fetchEmployees() {
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function createEmployee(name) {
  const { data, error } = await supabase.from(TABLE).insert({ name }).select().single()

  if (error) throw error
  return data
}

export async function updateEmployee(id, name) {
  const { data, error } = await supabase.from(TABLE).update({ name }).eq('id', id).select().single()

  if (error) throw error
  return data
}

export async function deleteEmployee(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

// One shared realtime channel (owned by EmployeesProvider), same pattern as
// src/lib/appointments.js's subscribeToAppointments — so a name added on
// another device or tab shows up here without a manual refresh.
export function subscribeToEmployees(onChange, onStatusChange) {
  const channel = supabase
    .channel('employees-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, onChange)
    .subscribe((status) => onStatusChange?.(status))

  return () => {
    supabase.removeChannel(channel)
  }
}
