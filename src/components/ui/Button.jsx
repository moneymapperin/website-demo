import { cn } from '../../utils/helpers'

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'border-2 border-primary text-primary bg-transparent hover:bg-primary/5',
    ghost: 'bg-transparent text-text-secondary hover:bg-border/60',
    danger: 'border-2 border-danger text-danger bg-transparent hover:bg-danger/5',
    soft: 'bg-primary/10 text-primary hover:bg-primary/15',
  }

  return (
    <button type={type} className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  )
}
