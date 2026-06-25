import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

interface AuthState {
  session: Session | null
  user: User | null
  /** team_id de l'utilisateur courant (pour créer des lignes). */
  teamId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

// Garde contre le double-onboarding (getSession + onAuthStateChange peuvent
// se chevaucher pour la même session initiale).
const onboardingInFlight = new Map<string, Promise<string | null>>()

/**
 * Onboarding automatique : si l'utilisateur connecté n'a pas de team_members,
 * on crée une équipe + une appartenance (owner) pour lui. RLS l'autorise :
 *  - teams insert     : with check (true)
 *  - team_members     : with check (user_id = auth.uid())
 * Aucune clé service_role nécessaire — tout passe par la session de l'utilisateur.
 */
async function ensureTeam(userId: string, email?: string): Promise<string | null> {
  // 1. a-t-il déjà une équipe ?
  const { data: existing } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (existing?.team_id) return existing.team_id

  // 2. onboarding (sous garde pour éviter les courses)
  if (onboardingInFlight.has(userId)) return onboardingInFlight.get(userId)!

  const p = (async () => {
    const teamName = email ? email.split('@')[0] : 'Mon équipe'
    const { data: team, error: te } = await supabase
      .from('teams')
      .insert({ name: teamName })
      .select()
      .single()
    if (te || !team) {
      // eslint-disable-next-line no-console
      console.error('[SF Deals] onboarding: création équipe échouée', te?.message)
      return null
    }
    const { error: me } = await supabase
      .from('team_members')
      .insert({ team_id: team.id, user_id: userId, role: 'owner' })
    if (me) {
      // eslint-disable-next-line no-console
      console.error('[SF Deals] onboarding: appartenance échouée', me.message)
      return null
    }
    return team.id
  })()
  onboardingInFlight.set(userId, p)
  try {
    return await p
  } finally {
    onboardingInFlight.delete(userId)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Charge le team_id de l'utilisateur courant ; onboarding auto si nécessaire.
  async function loadTeamId(user: User | null | undefined) {
    if (!user) {
      setTeamId(null)
      return
    }
    const id = await ensureTeam(user.id, user.email)
    setTeamId(id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      void loadTeamId(data.session?.user ?? null).finally(() => setLoading(false))
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      void loadTeamId(newSession?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      teamId,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error ? error.message : null }
      },
      async signOut() {
        await supabase.auth.signOut()
        setTeamId(null)
      },
    }),
    [session, teamId, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}