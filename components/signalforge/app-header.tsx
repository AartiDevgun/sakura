import { Button } from '@/components/ui/button'
import type { BackendMode } from '@/lib/research/schema'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  visible: boolean
  backendMode: BackendMode
  onReset?: () => void
}

export function AppHeader({ visible, backendMode, onReset }: AppHeaderProps) {
  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 border-b border-white/[0.07] bg-black/45 backdrop-blur-xl transition-opacity duration-500 motion-reduce:transition-none',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      {/* pr-16 reserves the slot the docked Electric Logo occupies. */}
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 pr-24 sm:pl-6 sm:pr-24">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-[0.27em] text-rose-50">SAKURA</p>
          <p className="mt-0.5 hidden text-[9px] uppercase tracking-[0.17em] text-rose-100/35 sm:block">Financial investigator</p>
        </div>
        <span className="hidden rounded-full border border-pink-200/15 bg-pink-200/[0.04] px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.15em] text-pink-100/60 md:inline-flex">Track A · Financial services</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] px-2.5 py-1.5 text-[9px] uppercase tracking-[0.12em] text-rose-100/45">
          <span className={'size-1.5 rounded-full ' + (backendMode === 'live' ? 'bg-emerald-300' : 'bg-amber-300')} />
          {backendMode === 'live' ? 'Live engine' : 'Demo mode'}
        </span>
        {onReset ? (
          <Button variant="ghost" size="sm" className="shrink-0" onClick={onReset}>
            New research
          </Button>
        ) : null}
      </div>
    </header>
  )
}
