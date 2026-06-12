import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Bot, Megaphone, Users, Layers, BarChart3 } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agent', icon: Bot, label: 'AI Agent' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/segments', icon: Layers, label: 'Segments' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-[var(--border)]">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-[var(--primary)]">Reach</span>AI
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">BrewPulse Marketing CRM</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="inline-block w-2 h-2 bg-[var(--success)] rounded-full animate-pulse" />
            All systems operational
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
        <Outlet />
      </main>
    </div>
  )
}
