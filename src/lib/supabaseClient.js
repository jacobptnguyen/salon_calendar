import { createClient } from '@supabase/supabase-js'
import { isDemo } from './demo'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!isDemo && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in.'
  )
}

// persistSession + autoRefreshToken are both true by default — this is what
// keeps the shared front-desk device permanently signed in without a
// day-to-day login screen. Do not disable either.
// The demo build has no database at all (see demo.js), so no client.
export const supabase = isDemo ? null : createClient(supabaseUrl, supabaseAnonKey)
