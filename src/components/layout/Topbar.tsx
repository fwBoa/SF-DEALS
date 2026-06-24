import { useTranslation } from 'react-i18next'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { Button } from '@/components/ui/Button'

export function Topbar() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-line-dark bg-ink px-6">
      <p className="font-sans text-xs text-muted">{t('app.tagline')}</p>
      <div className="flex items-center gap-4">
        <LanguageToggle />
        <div className="hidden text-xs text-muted sm:block">{user?.email}</div>
        <Button variant="ghost" size="sm" onClick={() => void signOut()}>
          <LogOut size={15} />
          {t('auth.signout')}
        </Button>
      </div>
    </header>
  )
}