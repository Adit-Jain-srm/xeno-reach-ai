import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Bot, Megaphone, Users, Layers, BarChart3, Command } from 'lucide-react'
import { cn } from '../../lib/cn'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', kbd: '1' },
  { to: '/agent', icon: Bot, label: 'Agent', kbd: '2' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns', kbd: '3' },
  { to: '/customers', icon: Users, label: 'Customers', kbd: '4' },
  { to: '/segments', icon: Layers, label: 'Segments', kbd: '5' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', kbd: '6' },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-[200px] h-screen flex flex-col bg-bg-1 flex-shrink-0 select-none">
      {/* Logo */}
      <div className="px-4 h-12 flex items-center gap-2 border-b border-border-subtle">
        <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
          <Command size={11} className="text-white" />
        </div>
        <span className="text-sm font-bold text-txt-0 tracking-tight">XenoReach</span>
        <span className="badge bg-accent/10 text-accent ml-auto">.AI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-px">
        {NAV.map(({ to, icon: Icon, label, kbd }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-sm transition-colors duration-100',
                isActive
                  ? 'bg-bg-3 text-txt-0'
                  : 'text-txt-3 hover:text-txt-1 hover:bg-bg-2'
              )}
            >
              <Icon size={14} className={cn(isActive ? 'text-accent' : 'text-txt-4')} />
              <span className="flex-1">{label}</span>
              <span className="kbd opacity-0 group-hover:opacity-100">{kbd}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Status */}
      <div className="px-3 py-3 border-t border-border-subtle">
        <div className="flex items-center gap-1.5 text-2xs text-txt-4">
          <span className="w-1.5 h-1.5 rounded-full bg-semantic-green" />
          Connected · BrewPulse
        </div>
      </div>
    </aside>
  )
}
