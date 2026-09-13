import { useRef, useState } from 'react'
import { useEmployeesContext } from '../../context/EmployeesProvider'

// The dropdown next to every month heading (see MonthHeader) that filters
// the whole calendar to one employee's appointments, or "All". Adding a new
// employee is a text entry right inside this menu — no separate screen, no
// navigation — same commit-on-blur/Enter pattern as an appointment line.
// Which menu (if any) is open is owned by MonthCalendar, same reasoning as
// which day is open for editing: only one at a time, closed by outside
// click or Escape.
export function EmployeeMenu({ isOpen, onToggle, onClose }) {
  const { employees, selectedEmployeeId, setSelectedEmployeeId, addEmployee } = useEmployeesContext()
  const [adding, setAdding] = useState(false)
  const inputRef = useRef(null)

  const selectedName = selectedEmployeeId ? employees.find((employee) => employee.id === selectedEmployeeId)?.name : null
  const label = selectedName ?? 'All'

  function choose(employeeId) {
    setSelectedEmployeeId(employeeId)
    setAdding(false)
    onClose()
  }

  async function commitNewEmployee() {
    const name = (inputRef.current?.value ?? '').trim()
    setAdding(false)
    if (!name) return // nothing typed — nothing to do, same as a blank appointment line

    const created = await addEmployee(name)
    setSelectedEmployeeId(created.id)
    onClose()
  }

  function handleInputKeyDown(event) {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  return (
    <div data-employee-menu className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="rounded-md border-[3px] border-ink bg-paper px-4 py-1 text-[clamp(1.1rem,0.85rem+1vw,1.7rem)] font-bold text-ink hover:bg-highlight"
      >
        {label} ▾
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-20 mt-2 min-w-[14rem] rounded-md border-[3px] border-ink bg-paper">
          <button
            type="button"
            onClick={() => choose(null)}
            className={`block w-full px-5 py-3 text-left text-[1.3rem] font-bold text-ink ${
              !selectedEmployeeId ? 'bg-highlight' : 'hover:bg-highlight'
            }`}
          >
            All
          </button>

          {employees.map((employee) => (
            <button
              key={employee.id}
              type="button"
              onClick={() => choose(employee.id)}
              className={`block w-full border-t-2 border-hairline px-5 py-3 text-left text-[1.3rem] font-bold text-ink ${
                selectedEmployeeId === employee.id ? 'bg-highlight' : 'hover:bg-highlight'
              }`}
            >
              {employee.name}
            </button>
          ))}

          <div className="border-t-2 border-hairline">
            {adding ? (
              <input
                ref={inputRef}
                type="text"
                autoFocus
                autoComplete="off"
                aria-label="New employee name"
                onKeyDown={handleInputKeyDown}
                onBlur={commitNewEmployee}
                className="block w-full px-5 py-3 text-[1.3rem] font-bold text-ink outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="block w-full px-5 py-3 text-left text-[1.3rem] font-bold text-ink hover:bg-highlight"
              >
                + Add employee
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
