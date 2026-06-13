import { type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionLink?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="rounded-lg bg-bg-3 p-3 mb-3">
        <Icon size={20} className="text-txt-4" />
      </div>
      <h3 className="text-sm font-semibold text-txt-1 mb-1">{title}</h3>
      <p className="text-2xs text-txt-3 max-w-[240px]">{description}</p>
      {actionLabel && (
        actionLink ? (
          <Link
            to={actionLink}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-2xs font-medium rounded-md bg-accent text-white hover:bg-accent-dim transition-colors"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-2xs font-medium rounded-md bg-accent text-white hover:bg-accent-dim transition-colors"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  )
}
