import { cn } from '../../utils/helpers'

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    accent: 'bg-accent/10 text-accent',
    muted: 'bg-border/60 text-text-secondary',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
