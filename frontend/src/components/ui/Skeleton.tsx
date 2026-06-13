import { cn } from '../../lib/cn'

interface SkeletonProps {
  className?: string
  variant?: 'line' | 'card' | 'table-row' | 'metric' | 'circle'
}

export function Skeleton({ className, variant = 'line' }: SkeletonProps) {
  const base = 'animate-pulse rounded bg-bg-3'

  switch (variant) {
    case 'card':
      return (
        <div className={cn('panel rounded-md p-4 space-y-3', className)}>
          <div className={cn(base, 'h-3 w-2/3')} />
          <div className={cn(base, 'h-3 w-full')} />
          <div className={cn(base, 'h-3 w-4/5')} />
        </div>
      )
    case 'table-row':
      return (
        <div className={cn('flex items-center gap-3 px-3 py-2.5', className)}>
          <div className={cn(base, 'h-3 w-24')} />
          <div className={cn(base, 'h-3 w-32')} />
          <div className={cn(base, 'h-3 w-20')} />
          <div className={cn(base, 'h-3 w-16 ml-auto')} />
        </div>
      )
    case 'metric':
      return (
        <div className={cn('panel rounded-md p-3 space-y-2', className)}>
          <div className={cn(base, 'h-2.5 w-20')} />
          <div className={cn(base, 'h-5 w-14')} />
        </div>
      )
    case 'circle':
      return <div className={cn(base, 'rounded-full h-8 w-8', className)} />
    default:
      return <div className={cn(base, 'h-3 w-full', className)} />
  }
}

export function SkeletonRows({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="table-row" />
      ))}
    </div>
  )
}

export function SkeletonMetrics({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-4 gap-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="metric" />
      ))}
    </div>
  )
}
