import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Bot, Megaphone, Users, Layers, BarChart3 } from 'lucide-react'
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
    <aside className="w-[200px] h-screen flex flex-col bg-bg-1 flex-shrink-0 select-none border-r border-border">
      {/* Logo */}
      <div className="px-4 h-14 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-signal flex items-center justify-center">
          <span className="text-white text-xs font-bold">X</span>
        </div>
        <span className="text-md font-semibold text-txt-0 tracking-tight font-sans">XenoReach</span>
        <span className="badge bg-signal/10 text-signal border border-signal/20">.AI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, kbd }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-bg-0 text-txt-0 shadow-sm'
                  : 'text-txt-2 hover:text-txt-0 hover:bg-bg-2'
              )}
            >
              <Icon size={15} className={cn(isActive ? 'text-signal' : 'text-txt-3')} />
              <span className="flex-1 font-body">{label}</span>
              <span className={cn('kbd text-[10px]', isActive ? 'opacity-60' : 'opacity-0 group-hover:opacity-60')}>{kbd}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Status */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-txt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-semantic-green" />
          Connected · BrewPulse
        </div>
      </div>
    </aside>
  )
}
