import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bot, Megaphone, Users, Layers, BarChart3 } from 'lucide-react'
import { cn } from '../../lib/cn'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agent', icon: Bot, label: 'AI Agent' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/segments', icon: Layers, label: 'Segments' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function Sidebar() {
  return (
    <aside className="w-[264px] h-screen flex flex-col border-r border-white/[0.06] bg-raised/80 backdrop-blur-xl flex-shrink-0">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-lg shadow-accent/20">
            <span className="text-white font-bold text-sm">X</span>
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight">
              Xeno<span className="gradient-text">Reach</span>.AI
            </h1>
            <p className="text-[11px] text-txt-muted leading-none mt-0.5">BrewPulse Marketing</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 group relative',
              isActive
                ? 'text-white bg-accent/10'
                : 'text-txt-secondary hover:text-txt-primary hover:bg-white/[0.03]'
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent shadow-[0_0_8px_rgb(var(--accent)/0.5)]" />
                )}
                <Icon size={17} className={cn(isActive ? 'text-accent' : 'text-txt-muted group-hover:text-txt-secondary')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-[11px] text-txt-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          All systems operational
        </div>
      </div>
    </aside>
  )
}
