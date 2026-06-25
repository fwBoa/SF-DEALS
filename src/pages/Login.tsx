import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { Logo } from '@/components/layout/Logo'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function Login() {
  const { t } = useTranslation()
  const { signIn, session } = useAuth()
  const location = useLocation() as { state?: { from?: string } }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to={location.state?.from ?? '/'} replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email.trim(), password)
    setBusy(false)
    if (error) setError(t('auth.error'))
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ink px-6">
      <div className="absolute right-5 top-5">
        <LanguageToggle />
      </div>
      <Logo size={56} variant="dark" />
      <h1 className="text-3xl text-ink-text">
        SF <span className="accent-italic">Deals</span>
      </h1>

      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <Input
          name="email"
          type="email"
          label={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          label={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={busy}>
          {t('auth.signin')}
        </Button>
      </form>
    </div>
  )
}