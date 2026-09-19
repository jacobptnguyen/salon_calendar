import { supabase } from './supabaseClient'
import { isDemo, demoEmployees, demoAppointments } from './demo'

const TABLE = 'employees'

export async function fetchEmployees() {
  if (isDemo) return demoEmployees.map((employee) => ({ ...employee }))
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function createEmployee(name) {
  if (isDemo) {
    const row = { id: crypto.randomUUID(), name, created_at: new Date().toISOString() }
    demoEmployees.push(row)
    return { ...row }
  }
  const { data, error } = await supabase.from(TABLE).insert({ name }).select().single()

  if (error) throw error
  return data
}

export async function updateEmployee(id, name) {
  if (isDemo) {
    const row = demoEmployees.find((employee) => employee.id === id)
    row.name = name
    return { ...row }
  }
  const { data, error } = await supabase.from(TABLE).update({ name }).eq('id', id).select().single()

  if (error) throw error
  return data
}

export async function deleteEmployee(id) {
  if (isDemo) {
    const index = demoEmployees.findIndex((employee) => employee.id === id)
    if (index >= 0) demoEmployees.splice(index, 1)
    // Same as the database's "on delete set null": appointments fall back to unassigned.
    for (const appt of demoAppointments) if (appt.employee_id === id) appt.employee_id = null
    return
  }
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

// One shared realtime channel (owned by EmployeesProvider), same pattern as
// src/lib/appointments.js's subscribeToAppointments — so a name added on
// another device or tab shows up here without a manual refresh.
export function subscribeToEmployees(onChange, onStatusChange) {
  if (isDemo) {
    onStatusChange?.('SUBSCRIBED')
    return () => {}
  }
  const channel = supabase
    .channel('employees-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, onChange)
    .subscribe((status) => onStatusChange?.(status))

  return () => {
    supabase.removeChannel(channel)
  }
}
