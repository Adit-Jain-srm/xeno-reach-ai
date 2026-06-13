import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'accent'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  animated?: boolean
  pulse?: boolean
  className?: string
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-bg-3 text-txt-2 border-border',
  success: 'bg-semantic-green/10 text-semantic-green border-semantic-green/20',
  error: 'bg-semantic-red/10 text-semantic-red border-semantic-red/20',
  warning: 'bg-semantic-amber/10 text-semantic-amber border-semantic-amber/20',
  info: 'bg-semantic-blue/10 text-semantic-blue border-semantic-blue/20',
  accent: 'bg-accent/10 text-accent border-accent/20',
}

export function Badge({ variant = 'default', children, animated, pulse, className }: BadgeProps) {
  const Comp = animated ? motion.span : 'span'
  const animProps = animated
    ? { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 400, damping: 20 } }
    : {}

  return (
    <Comp
      {...animProps}
      className={cn(
        'badge inline-flex items-center gap-1 border',
        VARIANT_STYLES[variant],
        pulse && 'animate-pulse',
        className
      )}
    >
      {pulse && (
        <span className={cn(
          'inline-block h-1.5 w-1.5 rounded-full',
          variant === 'success' && 'bg-semantic-green',
          variant === 'error' && 'bg-semantic-red',
          variant === 'warning' && 'bg-semantic-amber',
          variant === 'info' && 'bg-semantic-blue',
          variant === 'accent' && 'bg-accent',
          variant === 'default' && 'bg-txt-3',
        )} />
      )}
      {children}
    </Comp>
  )
}
