import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import * as api from '../lib/appointments'
import { toMonthKey } from '../lib/date'

const { sortByDateTime } = api

const AppointmentsContext = createContext(null)

// Owns appointment data for however many months are currently scrolled
// into the continuous calendar (see MonthCalendar) — each fetched once
// and cached by 'YYYY-MM' key, so scrolling back over a month already
// seen doesn't refetch or flicker. Which day (if any) is open for editing
// stays in MonthCalendar — this provider doesn't know or care what's
// currently on screen.
export function AppointmentsProvider({ children }) {
  const [cache, setCache] = useState({})
  const [loadingMonths, setLoadingMonths] = useState({})
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING')
  // Tracks whether we've ever reached SUBSCRIBED, so the very first
  // connect (which briefly passes through non-SUBSCRIBED states) never
  // shows the "Reconnecting…" banner — only a real drop after being
  // connected does. Otherwise every normal app open would flash an
  // alarming message for no reason.
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false)
  // Month keys already requested (fetched or in flight) this page load, so
  // each rendered month section only ever triggers one fetch.
  const requestedRef = useRef(new Set())

  // One realtime subscription for the whole app, independent of which
  // months are on screen, so a change made on another device (or another
  // browser tab) shows up here without a manual refresh — the entire
  // point of using a shared calendar instead of paper. DELETE payloads
  // only carry the deleted row's id (default replica identity), not its
  // date, so on delete we sweep every cached month page rather than
  // trying to know which one.
  useEffect(() => {
    const unsubscribe = api.subscribeToAppointments(
      (payload) => {
        setCache((prev) => {
          if (payload.eventType === 'DELETE') {
            return withoutId(prev, payload.old?.id)
          }
          return withRow(prev, payload.new)
        })
      },
      (status) => {
        if (status === 'SUBSCRIBED') setHasConnectedOnce(true)
        setConnectionStatus(status)
      }
    )
    return unsubscribe
  }, [])

  // Fetches one month's appointments if it hasn't been requested yet —
  // safe to call on every render of a month section, since a month
  // already loaded or loading is a no-op.
  const ensureMonthLoaded = useCallback((monthDate) => {
    const monthKey = toMonthKey(monthDate)
    if (requestedRef.current.has(monthKey)) return
    requestedRef.current.add(monthKey)
    setLoadingMonths((prev) => ({ ...prev, [monthKey]: true }))

    api
      .fetchMonthAppointments(monthDate)
      .then((data) => {
        setCache((prev) => ({ ...prev, [monthKey]: data }))
        setError(null)
      })
      .catch(() => {
        requestedRef.current.delete(monthKey) // let a later render retry
        setError('Could not load appointments. Check the internet connection, then reload the page.')
      })
      .finally(() => {
        setLoadingMonths((prev) => ({ ...prev, [monthKey]: false }))
      })
  }, [])

  const getMonthAppointments = useCallback((monthDate) => cache[toMonthKey(monthDate)] || [], [cache])

  const isMonthLoading = useCallback(
    (monthDate) => {
      const key = toMonthKey(monthDate)
      return Boolean(loadingMonths[key]) && !cache[key]
    },
    [cache, loadingMonths]
  )

  const addAppointment = useCallback(async ({ customerName, dateKey, time, employeeId }) => {
    const created = await api.createAppointment({ customerName, dateKey, time, employeeId })
    setCache((prev) => withRow(prev, created))
    return created
  }, [])

  const updateAppointmentInPlace = useCallback(async (id, { customerName, time, dateKey }) => {
    const updated = await api.updateAppointment(id, { customerName, dateKey, time })
    setCache((prev) => withRow(prev, updated))
    return updated
  }, [])

  const removeAppointment = useCallback(async (id) => {
    await api.deleteAppointment(id)
    setCache((prev) => withoutId(prev, id))
  }, [])

  const value = {
    ensureMonthLoaded,
    getMonthAppointments,
    isMonthLoading,
    error,
    addAppointment,
    updateAppointmentInPlace,
    removeAppointment,
    connectionStatus,
  }

  // A silent desync would recreate exactly the "did it save?" anxiety this
  // app exists to remove, so a dropped realtime channel gets a clear,
  // non-blocking banner rather than failing invisibly.
  const isReconnecting = hasConnectedOnce && connectionStatus !== 'SUBSCRIBED'

  return (
    <AppointmentsContext.Provider value={value}>
      {isReconnecting && (
        <div className="border-b-2 border-ink bg-highlight px-4 py-2 text-center text-lg font-bold text-ink" role="status">
          Reconnecting to the calendar… changes made on other screens may not show yet.
        </div>
      )}
      {children}
    </AppointmentsContext.Provider>
  )
}

// Removes an appointment id from every cached month page.
function withoutId(cache, id) {
  const next = {}
  for (const key of Object.keys(cache)) {
    next[key] = cache[key].filter((appt) => appt.id !== id)
  }
  return next
}

// Inserts or replaces a row in its month page. If that month hasn't been
// loaded yet it's left alone — creating a partial page would stop the full
// month from ever being fetched when it scrolls into view.
function withRow(cache, row) {
  const next = withoutId(cache, row.id)
  const key = row.appointment_date.slice(0, 7)
  if (!next[key]) return next
  next[key] = sortByDateTime([...next[key], row])
  return next
}

export function useAppointmentsContext() {
  const ctx = useContext(AppointmentsContext)
  if (!ctx) throw new Error('useAppointmentsContext must be used within AppointmentsProvider')
  return ctx
}
