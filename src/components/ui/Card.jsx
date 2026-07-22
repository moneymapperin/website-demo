import { cn } from '../../utils/helpers'

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-border bg-card p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
