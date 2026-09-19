import { toDateKey } from './date'

// Demo build (VITE_DEMO=true): no database and no login. Everything lives in
// these in-memory arrays, seeded around today, and resets on reload. The real
// deployment never sets this, so it behaves exactly as before.
export const isDemo = import.meta.env.VITE_DEMO === 'true'

const now = new Date()
const year = now.getFullYear()
const month = now.getMonth()
const daysInMonth = new Date(year, month + 1, 0).getDate()

export const demoEmployees = ['Maria', 'Linh', 'Tasha'].map((name, index) => ({
  id: crypto.randomUUID(),
  name,
  created_at: new Date(2000, 0, 1, 0, index).toISOString(),
}))

const services = ['Cut', 'Color', 'Blowout', 'Perm', 'Trim', 'Updo', 'Full set', 'Style']
const times = ['09:30:00', '10:45:00', '11:30:00', '13:00:00', '14:00:00', '15:30:00']

export const demoAppointments = []

for (let day = 1; day <= daysInMonth; day++) {
  // 0-3 appointments a day, so some days stay empty like a real month.
  for (let slot = 0; slot < day % 4; slot++) {
    demoAppointments.push({
      id: crypto.randomUUID(),
      customer_name: services[(day + slot) % services.length],
      appointment_date: toDateKey(new Date(year, month, day)),
      appointment_time: times[(day + slot * 2) % times.length],
      // Every fourth line is left unassigned, like appointments booked under "All".
      employee_id: demoEmployees[(day + slot) % (demoEmployees.length + 1)]?.id ?? null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
  }
}
