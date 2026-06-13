import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'max-w-[380px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[600px]',
}

export function Modal({ open, onClose, title, description, children, className, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === overlayRef.current) onClose()
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'relative w-full panel rounded-lg shadow-2xl',
              SIZES[size],
              className
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                <div>
                  <h2 className="text-sm font-semibold text-txt-0">{title}</h2>
                  {description && <p className="text-2xs text-txt-3 mt-0.5">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="text-txt-4 hover:text-txt-2 transition-colors rounded p-1 hover:bg-bg-3"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="p-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ModalActionsProps {
  children: ReactNode
  className?: string
}

export function ModalActions({ children, className }: ModalActionsProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2 pt-3 border-t border-border-subtle mt-3', className)}>
      {children}
    </div>
  )
}

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}

const BUTTON_VARIANTS = {
  primary: 'bg-accent hover:bg-accent-dim text-white',
  secondary: 'bg-bg-3 hover:bg-bg-4 text-txt-1 border border-border',
  danger: 'bg-semantic-red/10 hover:bg-semantic-red/20 text-semantic-red border border-semantic-red/20',
  ghost: 'hover:bg-bg-3 text-txt-2 hover:text-txt-1',
}

export function Button({ variant = 'primary', children, onClick, disabled, className, type = 'button' }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-2xs font-medium rounded-md transition-all',
        'disabled:opacity-40 disabled:pointer-events-none',
        BUTTON_VARIANTS[variant],
        className
      )}
    >
      {children}
    </button>
  )
}
