import { useRef, useState } from 'react'
import { useEmployeesContext } from '../../context/EmployeesProvider'

// The dropdown next to every month heading (see MonthHeader) that filters
// the whole calendar to one employee's appointments, or "All". Adding a new
// employee is a text entry right inside this menu — no separate screen, no
// navigation — same commit-on-blur/Enter pattern as an appointment line.
// Which menu (if any) is open is owned by MonthCalendar, same reasoning as
// which day is open for editing: only one at a time, closed by outside
// click or Escape.
//
// Renaming/removing an employee reuses that same pattern, but a name is
// also the click target that selects it as the filter — one click can't
// mean both. So: clicking a name selects it and closes the menu, same as
// always; clicking the *already-selected* name (the one already
// highlighted) opens it for editing in place instead, the same way
// clicking an open day's line edits that line. Clearing it and clicking
// away removes that employee, exactly like clearing an appointment line —
// no delete button, no confirmation.
export function EmployeeMenu({ isOpen, onToggle, onClose }) {
  const { employees, selectedEmployeeId, setSelectedEmployeeId, addEmployee } = useEmployeesContext()
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [editingEmployeeId, setEditingEmployeeId] = useState(null)
  const inputRef = useRef(null)

  const selectedName = selectedEmployeeId ? employees.find((employee) => employee.id === selectedEmployeeId)?.name : null
  const label = selectedName ?? 'All'

  function choose(employeeId) {
    setSelectedEmployeeId(employeeId)
    setAdding(false)
    setEditingEmployeeId(null)
    onClose()
  }

  async function commitNewEmployee() {
    const name = (inputRef.current?.value ?? '').trim()
    if (!name) {
      // nothing typed — nothing to do, same as a blank appointment line
      setAdding(false)
      return
    }

    try {
      const created = await addEmployee(name)
      setAdding(false)
      setError('')
      setSelectedEmployeeId(created.id)
      onClose()
    } catch {
      // Never fail silently — same rule as AppointmentRow. Leave the input
      // open with what was typed so the name isn't lost and blurring again
      // (or Enter) retries.
      setError('Not added. Please try again.')
    }
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

          {employees.map((employee) =>
            editingEmployeeId === employee.id ? (
              <EmployeeEditRow
                key={employee.id}
                employee={employee}
                onDone={() => setEditingEmployeeId(null)}
                onDeleted={() => {
                  setEditingEmployeeId(null)
                  if (selectedEmployeeId === employee.id) setSelectedEmployeeId(null)
                }}
              />
            ) : (
              <button
                key={employee.id}
                type="button"
                onClick={() => (selectedEmployeeId === employee.id ? setEditingEmployeeId(employee.id) : choose(employee.id))}
                className={`block w-full border-t-2 border-hairline px-5 py-3 text-left text-[1.3rem] font-bold text-ink ${
                  selectedEmployeeId === employee.id ? 'bg-highlight' : 'hover:bg-highlight'
                }`}
              >
                {employee.name}
              </button>
            )
          )}

          <div className="border-t-2 border-hairline">
            {adding ? (
              <div className="flex flex-col gap-0.5 px-5 py-3">
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  autoComplete="off"
                  aria-label="New employee name"
                  onKeyDown={handleInputKeyDown}
                  onBlur={commitNewEmployee}
                  onChange={() => error && setError('')}
                  className="block w-full text-[1.3rem] font-bold text-ink outline-none"
                />
                {error && <p className="text-[0.8em] leading-snug font-bold text-danger">{error}</p>}
              </div>
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

// One editable row, the same shape as DayCell's AppointmentRow: no Save
// button, commits on blur or Enter, and clearing the name entirely removes
// that employee — no delete button, no confirmation step.
function EmployeeEditRow({ employee, onDone, onDeleted }) {
  const { renameEmployee, removeEmployee } = useEmployeesContext()
  const inputRef = useRef(null)
  const [error, setError] = useState('')

  function handleKeyDown(event) {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  async function commit() {
    const trimmed = (inputRef.current?.value ?? '').trim()

    if (!trimmed) {
      try {
        await removeEmployee(employee.id)
        onDeleted()
      } catch {
        setError('Not removed. Please try again.')
      }
      return
    }

    if (trimmed === employee.name) {
      onDone()
      return
    }

    try {
      await renameEmployee(employee.id, trimmed)
      onDone()
    } catch {
      setError('Not saved. Please try again.')
    }
  }

  return (
    <div className="flex flex-col gap-0.5 border-t-2 border-hairline px-5 py-3">
      <input
        ref={inputRef}
        type="text"
        defaultValue={employee.name}
        autoFocus
        autoComplete="off"
        aria-label={`Edit employee name: ${employee.name}`}
        onKeyDown={handleKeyDown}
        onBlur={() => void commit()}
        onChange={() => error && setError('')}
        className="block w-full text-[1.3rem] font-bold text-ink outline-none"
      />
      {error && <p className="text-[0.8em] leading-snug font-bold text-danger">{error}</p>}
    </div>
  )
}
