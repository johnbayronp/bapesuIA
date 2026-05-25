import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente auxiliar SIN persistencia ni auto-refresh.
// Se usa para acciones como signUp desde el dashboard (crear nuevos usuarios)
// sin que se sobrescriba la sesión del admin actual.
export const supabaseAuxAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'sb-aux-no-persist',
  },
})
