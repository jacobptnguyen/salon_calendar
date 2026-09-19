import { useEffect, useState } from 'react'
import { getSession, onAuthStateChange, signOut } from '../lib/auth'
import { idleTimeoutHours } from '../config/copy'
import { isDemo } from '../lib/demo'

const HIDDEN_AT_KEY = 'salon-calendar-hidden-at'
const IDLE_TIMEOUT_MS = idleTimeoutHours * 60 * 60 * 1000

// True if the screen was hidden/backgrounded (screen off, switched away,
// tab or browser closed) for longer than the idle timeout — no polling,
// just the gap between when it was last hidden and now.
function isStale() {
  const hiddenAt = Number(localStorage.getItem(HIDDEN_AT_KEY))
  return Boolean(hiddenAt) && Date.now() - hiddenAt > IDLE_TIMEOUT_MS
}

// Tracks the current Supabase session. A session left idle too long signs
// itself out automatically, so staff just re-enter the PIN when needed
// instead of a session silently living forever.
export function useAuthSession() {
  // The demo build has no login (see lib/demo.js): always "signed in".
  const [session, setSession] = useState(isDemo ? {} : null)
  const [status, setStatus] = useState(isDemo ? 'ready' : 'loading')

  useEffect(() => {
    if (isDemo) return

    let active = true

    getSession().then(({ data }) => {
      if (!active) return
      if (data.session && isStale()) {
        signOut() // triggers onAuthStateChange below with session: null
      } else {
        setSession(data.session)
      }
      setStatus('ready')
    })

    const subscription = onAuthStateChange((event, nextSession) => {
      if (!active) return
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        localStorage.removeItem(HIDDEN_AT_KEY)
      }
      setSession(nextSession)
      setStatus('ready')
    })

    // Records when the screen was last hidden/backgrounded, and checks the
    // gap when it becomes visible again — that's the whole idle check.
    function handleVisibility() {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem(HIDDEN_AT_KEY, String(Date.now()))
      } else if (isStale()) {
        signOut()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      active = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return { session, status }
}
