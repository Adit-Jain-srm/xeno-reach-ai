import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, LayoutDashboard, Bot, Megaphone, Users, Layers, BarChart3, Zap } from 'lucide-react'
import { cn } from '../../lib/cn'

interface CommandItem {
  id: string
  label: string
  icon: typeof Search
  action: () => void
  category: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const nav = useNavigate()

  const items: CommandItem[] = [
    { id: 'dash', label: 'Go to Dashboard', icon: LayoutDashboard, action: () => nav('/'), category: 'Navigation' },
    { id: 'agent', label: 'Open AI Agent', icon: Bot, action: () => nav('/agent'), category: 'Navigation' },
    { id: 'campaigns', label: 'View Campaigns', icon: Megaphone, action: () => nav('/campaigns'), category: 'Navigation' },
    { id: 'customers', label: 'Browse Customers', icon: Users, action: () => nav('/customers'), category: 'Navigation' },
    { id: 'segments', label: 'Manage Segments', icon: Layers, action: () => nav('/segments'), category: 'Navigation' },
    { id: 'analytics', label: 'View Analytics', icon: BarChart3, action: () => nav('/analytics'), category: 'Navigation' },
    { id: 'new-campaign', label: 'Create New Campaign', icon: Zap, action: () => nav('/agent'), category: 'Actions' },
  ]

  const filtered = query
    ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : items

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (!open && !document.activeElement?.closest('input, textarea, select')) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 6) {
          const routes = ['/', '/agent', '/campaigns', '/customers', '/segments', '/analytics']
          nav(routes[num - 1])
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, nav])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && filtered[selected]) {
      filtered[selected].action()
      setOpen(false)
    }
  }, [filtered, selected])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh]"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className="relative w-[480px] panel rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 border-b border-border-subtle">
              <Search size={14} className="text-txt-4" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0) }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="flex-1 py-3 text-sm text-txt-0 bg-transparent placeholder:text-txt-4 focus:outline-none"
              />
              <span className="kbd">esc</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto py-1">
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-2xs text-txt-4">No results</div>
              )}
              {filtered.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => { item.action(); setOpen(false) }}
                  onMouseEnter={() => setSelected(i)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                    i === selected ? 'bg-bg-3 text-txt-0' : 'text-txt-2 hover:bg-bg-2'
                  )}
                >
                  <item.icon size={14} className={i === selected ? 'text-accent' : 'text-txt-4'} />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-2xs text-txt-4">{item.category}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
