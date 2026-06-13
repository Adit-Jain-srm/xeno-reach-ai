import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import { CommandPalette } from '../ui/CommandPalette'

export default function Shell() {
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-bg-0">
      <Sidebar />
      <main className="flex-1 overflow-y-auto border-l border-border-subtle">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
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
