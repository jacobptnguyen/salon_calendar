import { useState } from 'react'
import { signInWithPin } from '../../lib/auth'
import { copy } from '../../config/copy'
import { ErrorBanner } from '../shared/ErrorBanner'

const PIN_LENGTH = 4

// Shown whenever there's no active session — the app's normal signed-out
// state, not a hidden or separate screen. Signing in persists the Supabase
// session in this browser until it's been idle too long (see
// useAuthSession), so staff just re-enter the PIN themselves when needed
// rather than needing an owner to fix anything.
//
// Only a 4-digit PIN is shown — matches the kind of PIN staff already
// know from a debit card. See lib/auth.js's signInWithPin for how this
// maps onto Supabase's email+password auth underneath.
export function DeviceSetup() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Four digits is the whole PIN, so there's nothing to press once the
  // last one lands — it checks itself.
  async function handleChange(event) {
    const next = event.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH)
    setPin(next)
    if (next.length < PIN_LENGTH) return

    setError('')
    setSubmitting(true)
    const { error: signInError } = await signInWithPin(next)
    setSubmitting(false)

    if (signInError) {
      setError("That PIN didn't work. Try again.")
      setPin('')
    }
    // On success, useAuthSession's auth-state listener picks up the new
    // session and App re-renders into the calendar — nothing else to do.
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-center text-4xl font-extrabold text-ink">{copy.deviceSetup.heading}</h1>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={PIN_LENGTH}
            autoComplete="one-time-code"
            autoFocus
            disabled={submitting}
            value={pin}
            onChange={handleChange}
            aria-label="4 digit PIN"
            className="h-24 w-full rounded-md border-[3px] border-ink bg-paper text-transparent caret-transparent selection:bg-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center gap-6 text-4xl font-bold text-ink"
          >
            {Array.from({ length: PIN_LENGTH }, (_, index) => (
              <span key={index}>{index < pin.length ? '•' : '_'}</span>
            ))}
          </div>
        </div>
        <ErrorBanner>{error}</ErrorBanner>
      </div>
    </main>
  )
}
