import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useDashboard } from '@/hooks/useDashboard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { STAGE_BY_ID, stageLabel } from '@/config/pipeline'
import { countryName } from '@/config/countries'
import { DEVISE_BY_ID, formatEur, formatMoney } from '@/config/currencies'
import { cn } from '@/lib/cn'

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent?: boolean
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span
        className={cn(
          'font-serif text-3xl',
          accent ? 'text-gold' : 'text-ink-text',
        )}
      >
        {value}
      </span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </Card>
  )
}

export function Dashboard() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage as 'fr' | 'en') ?? 'fr'
  const { metrics, loading } = useDashboard()

  if (loading || !metrics) {
    return (
      <div className="p-6">
        <PageHeader title={t('dashboard.title')} accent="—" />
        <Card className="flex justify-center py-16">
          <Spinner size={28} />
        </Card>
      </div>
    )
  }

  const countryData = metrics.byCountry.slice(0, 10).map((c) => ({
    name: countryName(c.code, lang),
    count: c.count,
  }))

  const stageData = metrics.byStage.map((s) => ({
    name: stageLabel(s.stage, lang),
    count: s.count,
    fill: STAGE_BY_ID[s.stage].color,
  }))

  const conversion =
    metrics.conversionRate == null
      ? '—'
      : `${Math.round(metrics.conversionRate * 100)}%`

  return (
    <div className="p-6">
      <PageHeader title={t('dashboard.title')} accent="—" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('dashboard.total_prospects')}
          value={String(metrics.totalProspects)}
        />
        <StatCard
          label={t('dashboard.total_opportunities')}
          value={String(metrics.totalOpportunities)}
        />
        <StatCard
          label={t('dashboard.open_value')}
          value={formatEur(metrics.openValueEur)}
          hint={metrics.openByDevise
            .map((d) => `${formatMoney(d.raw, d.devise)}`)
            .join(' · ')}
          accent
        />
        <StatCard
          label={t('dashboard.conversion_rate')}
          value={conversion}
          hint={t('dashboard.conversion_hint')}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-serif text-lg text-ink-text">
            {t('dashboard.by_stage')}
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stageData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#8a8275', fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={64}
              />
              <YAxis tick={{ fill: '#8a8275', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#efebe110' }}
                contentStyle={{
                  background: '#0e0d0c',
                  border: '1px solid #c9a44d55',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#f3f0e9' }}
                itemStyle={{ color: '#f3f0e9' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stageData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="mb-4 font-serif text-lg text-ink-text">
            {t('dashboard.prospects_by_country')}
          </h2>
          {countryData.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">{t('common.empty')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={countryData}
                layout="vertical"
                margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
              >
                <XAxis type="number" tick={{ fill: '#8a8275', fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={96}
                  tick={{ fill: '#8a8275', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: '#efebe110' }}
                  contentStyle={{
                    background: '#0e0d0c',
                    border: '1px solid #c9a44d55',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#f3f0e9' }}
                  itemStyle={{ color: '#f3f0e9' }}
                />
                <Bar dataKey="count" fill="#c9a44d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {metrics.wonValueEur > 0 && (
        <Card className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted">{t('dashboard.won_value')}</span>
          <span className="font-serif text-2xl text-gold">
            {formatEur(metrics.wonValueEur)}
          </span>
        </Card>
      )}

      <div className="mt-4">
        <Card>
          <h2 className="mb-3 font-serif text-lg text-ink-text">
            {t('dashboard.pipeline_value')}
          </h2>
          {metrics.openByDevise.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{t('common.empty')}</p>
          ) : (
            <div className="flex flex-wrap gap-6">
              {metrics.openByDevise.map((d) => (
                <div key={d.devise} className="flex flex-col gap-1">
                  <span className="text-xs text-muted">{DEVISE_BY_ID[d.devise].label}</span>
                  <span className="font-serif text-xl text-ink-text">
                    {formatMoney(d.raw, d.devise)}
                  </span>
                  <span className="text-xs text-muted">≈ {formatEur(d.eur)}</span>
                </div>
              ))}
              <div className="ml-auto flex flex-col gap-1 border-l border-line-dark pl-6">
                <span className="text-xs text-muted">{t('dashboard.open_value')}</span>
                <span className="font-serif text-2xl text-gold">
                  {formatEur(metrics.openValueEur)}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}