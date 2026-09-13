import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useAppointmentsContext } from '../../context/AppointmentsProvider'
import { addMonths, startOfMonth, toMonthKey } from '../../lib/date'
import { MonthHeader } from './MonthHeader'
import { MonthGrid } from './MonthGrid'
import { ErrorBanner } from '../shared/ErrorBanner'

// How far back/forward from today's month the continuous scroll covers.
// A bounded range (not truly infinite) keeps this simple, and it's no
// less "physical calendar" for it — a real wall calendar is also only
// ever a fixed stack of pages. Two years each way is far more than a
// salon ever needs to look at.
const MONTHS_BACK = 24
const MONTHS_FORWARD = 24

// The whole app is one continuous scroll of month pages — an ordinary
// scrollable page, no buttons, no page-flip gesture. Clicking a day edits
// it in place (see DayCell). This component owns which day (if any) is
// currently open for editing, since opening one must close any other.
export function MonthCalendar() {
  const { error } = useAppointmentsContext()
  const [editingDate, setEditingDate] = useState(null)
  const [openMenuMonthKey, setOpenMenuMonthKey] = useState(null)
  const todaySectionRef = useRef(null)

  const months = useMemo(() => {
    const current = startOfMonth(new Date())
    const list = []
    for (let i = -MONTHS_BACK; i <= MONTHS_FORWARD; i++) list.push(addMonths(current, i))
    return list
  }, [])
  const todayMonthKey = toMonthKey(startOfMonth(new Date()))

  // Land on today's month, not the top of the whole multi-year range —
  // before paint, so there's no visible jump.
  useLayoutEffect(() => {
    todaySectionRef.current?.scrollIntoView({ block: 'start' })
  }, [])

  // Click/tap anywhere outside the open cell, or Escape, closes it — the
  // only way in or out of editing a day. Blurring the focused input
  // *before* that lets its row's own onBlur commit run (and read its
  // values) while the cell is still mounted, so closing never races ahead
  // of a save and silently drops whatever was just typed.
  useEffect(() => {
    if (!editingDate) return

    function handlePointerDown(event) {
      if (event.target.closest(`[data-day-cell="${editingDate}"]`)) return
      document.activeElement?.blur()
      setEditingDate(null)
    }
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return
      document.activeElement?.blur()
      setEditingDate(null)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editingDate])

  // Same rule as the day-editing effect above, for the employee dropdown:
  // only one open at a time, closed by clicking anywhere outside it or
  // pressing Escape.
  useEffect(() => {
    if (!openMenuMonthKey) return

    function handlePointerDown(event) {
      if (event.target.closest('[data-employee-menu]')) return
      document.activeElement?.blur()
      setOpenMenuMonthKey(null)
    }
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return
      document.activeElement?.blur()
      setOpenMenuMonthKey(null)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenuMonthKey])

  return (
    <div className="h-svh overflow-y-auto">
      <div className="sticky top-0 z-10">
        <ErrorBanner>{error}</ErrorBanner>
      </div>
      {months.map((monthDate) => {
        const monthKey = toMonthKey(monthDate)
        return (
          <MonthSection
            key={monthKey}
            monthKey={monthKey}
            monthDate={monthDate}
            sectionRef={monthKey === todayMonthKey ? todaySectionRef : undefined}
            editingDate={editingDate}
            onOpenEdit={setEditingDate}
            openMenuMonthKey={openMenuMonthKey}
            onToggleMenu={setOpenMenuMonthKey}
          />
        )
      })}
    </div>
  )
}

// One page of the continuous scroll. Every month in the range is fetched
// once, on mount (see AppointmentsProvider's ensureMonthLoaded, which
// de-dupes so this is harmless even if a section remounts). That's ~49
// small requests against a single small table — a real cost, but a
// simple, predictable one, and trivial for the size of data this app
// ever holds; not worth an IntersectionObserver-based lazy load unless
// it's actually shown to matter.
function MonthSection({ monthKey, monthDate, sectionRef, editingDate, onOpenEdit, openMenuMonthKey, onToggleMenu }) {
  const { ensureMonthLoaded, getMonthAppointments, isMonthLoading } = useAppointmentsContext()

  useEffect(() => {
    ensureMonthLoaded(monthDate)
    // Only once per section — monthDate never changes for a mounted one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section ref={sectionRef} className="flex min-h-svh flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8">
      <MonthHeader
        monthDate={monthDate}
        isMenuOpen={openMenuMonthKey === monthKey}
        onToggleMenu={() => onToggleMenu((prev) => (prev === monthKey ? null : monthKey))}
        onCloseMenu={() => onToggleMenu(null)}
      />
      <MonthGrid
        monthDate={monthDate}
        appointments={getMonthAppointments(monthDate)}
        isLoading={isMonthLoading(monthDate)}
        editingDate={editingDate}
        onOpenEdit={onOpenEdit}
      />
    </section>
  )
}
