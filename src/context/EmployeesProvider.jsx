import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as api from '../lib/employees'

const EmployeesContext = createContext(null)

// Owns the employee list and the single active filter (`selectedEmployeeId`,
// null = "All") used by the dropdown next to every month heading (see
// EmployeeMenu) and by DayCell for filtering/tagging appointments. Separate
// from AppointmentsProvider since employees change rarely and aren't
// month-paged — the whole list is small and fetched once.
export function EmployeesProvider({ children }) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)

  useEffect(() => {
    api
      .fetchEmployees()
      .then((data) => {
        setEmployees(data)
        setError(null)
      })
      .catch(() => setError('Could not load employees. Check the internet connection, then reload the page.'))
      .finally(() => setLoading(false))
  }, [])

  // Same shared-realtime reasoning as AppointmentsProvider — a name added
  // on another device or tab shows up here without a manual refresh.
  useEffect(() => {
    const unsubscribe = api.subscribeToEmployees((payload) => {
      setEmployees((prev) => {
        if (payload.eventType === 'DELETE') {
          return prev.filter((employee) => employee.id !== payload.old?.id)
        }
        const withoutRow = prev.filter((employee) => employee.id !== payload.new.id)
        return [...withoutRow, payload.new].sort((a, b) => a.created_at.localeCompare(b.created_at))
      })
    })
    return unsubscribe
  }, [])

  const addEmployee = useCallback(async (name) => {
    const created = await api.createEmployee(name)
    setEmployees((prev) => [...prev, created])
    return created
  }, [])

  const value = {
    employees,
    loading,
    error,
    addEmployee,
    selectedEmployeeId,
    setSelectedEmployeeId,
  }

  return <EmployeesContext.Provider value={value}>{children}</EmployeesContext.Provider>
}

export function useEmployeesContext() {
  const ctx = useContext(EmployeesContext)
  if (!ctx) throw new Error('useEmployeesContext must be used within EmployeesProvider')
  return ctx
}
