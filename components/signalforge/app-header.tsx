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
        'fixed inset-x-0 top-0 z-40 border-b border-white/[0.09] bg-[#080708]/95 transition-opacity duration-300 motion-reduce:transition-none',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 pr-20 sm:px-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-[0.22em] text-stone-100">SAKURA</p>
          <p className="mt-0.5 hidden text-[9px] uppercase tracking-[0.16em] text-stone-500 sm:block">Financial research desk</p>
        </div>

        <span aria-hidden="true" className="hidden h-7 w-px bg-white/[0.12] md:block" />
        <span className="hidden text-[10px] uppercase tracking-[0.14em] text-stone-500 md:inline">India · Public markets</span>

        <div className="ml-auto flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.13em] text-stone-400 sm:text-[10px]">
            <span aria-hidden="true" className={'size-1.5 ' + (backendMode === 'live' ? 'bg-emerald-300' : 'bg-amber-300')} />
            {backendMode === 'live' ? 'Live research' : 'Demo data'}
          </span>
          {onReset ? (
            <Button variant="ghost" size="sm" className="shrink-0 rounded-sm text-stone-300 hover:text-white" onClick={onReset}>
              New search
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
