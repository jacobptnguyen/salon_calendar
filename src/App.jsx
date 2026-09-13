import { useAuthSession } from './hooks/useAuthSession'
import { DeviceSetup } from './components/setup/DeviceSetup'
import { LoadingState } from './components/shared/LoadingState'
import { AppointmentsProvider } from './context/AppointmentsProvider'
import { EmployeesProvider } from './context/EmployeesProvider'
import { MonthCalendar } from './components/calendar/MonthCalendar'

// No router — the app is a single screen, the month calendar (see
// MonthCalendar). There's also no separate /setup path: the PIN screen is
// just what shows whenever there's no active session (see DeviceSetup,
// useAuthSession).
function App() {
  const { session, status } = useAuthSession()

  if (status === 'loading') return <LoadingState />
  if (!session) return <DeviceSetup />

  return (
    <EmployeesProvider>
      <AppointmentsProvider>
        <MonthCalendar />
      </AppointmentsProvider>
    </EmployeesProvider>
  )
}

export default App
