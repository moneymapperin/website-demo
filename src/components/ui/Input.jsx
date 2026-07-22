import { cn } from '../../utils/helpers'

export function Input({ label, className = '', id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <label className="flex w-full flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/60 focus:border-2 focus:border-primary',
          className
        )}
        {...props}
      />
    </label>
  )
}
