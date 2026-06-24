import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'

export function Parametres() {
  const { t } = useTranslation()
  return (
    <div className="p-6">
      <PageHeader title={t('settings.title')} />
      <Card>
        <p className="mb-3 text-sm text-muted">{t('settings.language')}</p>
        <LanguageToggle />
      </Card>
    </div>
  )
}