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
          <div className="absolute inset-0 bg-carbon/20 backdrop-blur-[2px]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'relative w-full panel shadow-lg',
              SIZES[size],
              className
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-base font-semibold text-txt-0">{title}</h2>
                  {description && <p className="text-xs text-txt-2 mt-0.5">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="text-txt-3 hover:text-txt-1 transition-colors rounded-full p-1.5 hover:bg-bg-2"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="p-5">{children}</div>
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
    <div className={cn('flex items-center justify-end gap-2 pt-4 border-t border-border mt-4', className)}>
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
  primary: 'bg-carbon hover:bg-graphite text-white',
  secondary: 'bg-bg-2 hover:bg-bg-3 text-txt-0 border border-border',
  danger: 'bg-semantic-red/10 hover:bg-semantic-red/20 text-semantic-red border border-semantic-red/20',
  ghost: 'hover:bg-bg-2 text-txt-1 hover:text-txt-0',
}

export function Button({ variant = 'primary', children, onClick, disabled, className, type = 'button' }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all',
        'disabled:opacity-40 disabled:pointer-events-none',
        BUTTON_VARIANTS[variant],
        className
      )}
    >
      {children}
    </button>
  )
}
