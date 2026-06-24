import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[SF Deals] Variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes. ' +
      'Copier .env.example en .env.local et renseigner les clés.',
  )
}

/**
 * Client Supabase côté navigateur. N'utilise que la clé ANON (publishable) —
 * JAMAIS la clé service_role côté client.
 */
export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})