import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import { CommandPalette } from '../ui/CommandPalette'

export default function Shell() {
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-bg-0 relative">
      {/* Global ambient mesh */}
      <div className="absolute inset-0 mesh-gradient pointer-events-none opacity-50" />

      <Sidebar />
      <main className="relative flex-1 overflow-y-auto border-l border-glass-border">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <CommandPalette />
    </div>
  )
}
