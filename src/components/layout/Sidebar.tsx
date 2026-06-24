import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  KanbanSquare,
  ListChecks,
  Building2,
  Users,
  Bell,
  Settings,
} from 'lucide-react'
import { Logo } from './Logo'
import { cn } from '@/lib/cn'

const items = [
  { to: '/', icon: LayoutDashboard, key: 'nav.dashboard', end: true },
  { to: '/pipeline', icon: KanbanSquare, key: 'nav.pipeline', end: false },
  { to: '/liste', icon: ListChecks, key: 'nav.liste', end: false },
  { to: '/entreprises', icon: Building2, key: 'nav.entreprises', end: false },
  { to: '/contacts', icon: Users, key: 'nav.contacts', end: false },
  { to: '/rappels', icon: Bell, key: 'nav.rappels', end: false },
  { to: '/parametres', icon: Settings, key: 'nav.parametres', end: false },
]

export function Sidebar() {
  const { t } = useTranslation()
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line-dark bg-ink">
      <div className="flex h-16 items-center border-b border-line-dark px-5">
        <Logo size={32} variant="dark" withWordmark />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-ink-soft text-gold'
                  : 'text-muted hover:bg-ink-soft hover:text-ink-text',
              )
            }
          >
            <it.icon size={17} />
            <span>{t(it.key)}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line-dark p-4 text-[11px] text-muted">
        SF Deals · v1 · {new Date().getFullYear()}
      </div>
    </aside>
  )
}