import { cn } from '@/lib/utils'

export function MockBadge({ label = 'Mock data', className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-warning/50 bg-warning/15 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-warning',
        className,
      )}
    >
      {label}
    </span>
  )
}
