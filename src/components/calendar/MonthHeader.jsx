import { monthNameFormatter } from '../../lib/date'
import { EmployeeMenu } from './EmployeeMenu'

// One plain line — the month name a real wall calendar page would have
// printed at the top — plus the employee filter dropdown (see EmployeeMenu),
// present next to every month since the calendar is one continuous scroll
// and switching who you're looking at shouldn't require scrolling back to
// the top. No other nav buttons: changing month is a scroll/swipe gesture on
// the grid itself (see MonthCalendar).
export function MonthHeader({ monthDate, isMenuOpen, onToggleMenu, onCloseMenu }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-1">
      <h1 className="text-[clamp(1.9rem,1.2rem+2vw,3.2rem)] leading-tight font-bold text-ink">
        {monthNameFormatter.format(monthDate)} {monthDate.getFullYear()}
      </h1>
      <EmployeeMenu isOpen={isMenuOpen} onToggle={onToggleMenu} onClose={onCloseMenu} />
    </div>
  )
}
