import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Bot, Megaphone, Users, Layers, BarChart3, Command, Sparkles } from 'lucide-react'
import { cn } from '../../lib/cn'
import { motion } from 'framer-motion'

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
    <aside className="w-[220px] h-screen flex flex-col glass-strong flex-shrink-0 select-none relative overflow-hidden">
      {/* Ambient gradient */}
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />

      {/* Logo */}
      <div className="relative px-5 h-14 flex items-center gap-2.5">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-glow"
        >
          <Command size={13} className="text-white" />
        </motion.div>
        <span className="text-md font-display font-bold text-txt-0 tracking-tight">XenoReach</span>
        <span className="badge bg-accent/15 text-accent-light border border-accent/20">.AI</span>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 px-3 py-3 space-y-1">
        {NAV.map(({ to, icon: Icon, label, kbd }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group',
                isActive
                  ? 'text-txt-0'
                  : 'text-txt-3 hover:text-txt-1 hover:bg-glass-light'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent/10 to-purple-500/5 border border-accent/20"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <Icon size={15} className={cn('relative z-10', isActive ? 'text-accent-light' : 'text-txt-4 group-hover:text-txt-2')} />
              <span className="relative z-10 flex-1">{label}</span>
              <span className={cn('kbd relative z-10', !isActive && 'opacity-0 group-hover:opacity-50')}>{kbd}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* AI Status */}
      <div className="relative px-4 py-3 border-t border-glass-border">
        <div className="flex items-center gap-2 text-xs text-txt-3">
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-semantic-green shadow-[0_0_6px_rgba(52,211,153,0.5)]"
          />
          <span>Connected</span>
          <Sparkles size={10} className="text-accent ml-auto" />
          <span className="text-accent">10 tools</span>
        </div>
      </div>
    </aside>
  )
}
