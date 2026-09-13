import { supabase } from './supabaseClient'
import { shopAuthEmail } from '../config/copy'

// Deliberately no signUp() export anywhere in this app — the one shop
// account is created once by the owner via the Supabase Dashboard.

export function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

// Employees/owner only ever type a 4-digit PIN, matching a PIN
// staff are already used to (like a debit card). Supabase requires
// passwords to be 6+ characters (and some projects also block
// known-leaked passwords), so a bare 4-digit PIN can't be the literal
// account password. Rather than depend on the owner finding and loosening
// that project-wide Supabase Auth setting — its location shifts between
// dashboard versions — we pad the PIN with this fixed, non-secret suffix
// before it reaches Supabase. The 4-digit PIN remains the effective
// secret; the suffix only exists to satisfy Supabase's password shape
// requirements. When creating the shop Auth user, the account's actual
// password must be "<your 4-digit PIN>" + this exact suffix — see
// README.md.
const PIN_SUFFIX = '-Sc4l0n!'

export function signInWithPin(pin) {
  return signIn(shopAuthEmail, pin + PIN_SUFFIX)
}

export function signOut() {
  return supabase.auth.signOut()
}

export function getSession() {
  return supabase.auth.getSession()
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session))
  return data.subscription
}
