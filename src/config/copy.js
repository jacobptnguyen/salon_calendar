// Centralized user-facing strings and shop-specific config, kept separate
// from components so the owner (or a future dev) can tweak wording or the
// shop name in one place without touching component code.

// The one shop Supabase Auth account is identified by a fixed email under
// the hood, but the app only ever asks for the PIN (the account's
// password) — simpler to type and remember than an email+password pair.
// Create the Auth user in the Supabase Dashboard with exactly this email.
export const shopAuthEmail = 'desk@salon.internal'

// If the screen is hidden/backgrounded (screen off, switched away, tab or
// browser closed) for longer than this, the session is treated as stale
// and the PIN is required again next time it's opened. Adjust freely.
export const idleTimeoutHours = 2

export const copy = {
  deviceSetup: {
    heading: 'Enter PIN',
  },
}
