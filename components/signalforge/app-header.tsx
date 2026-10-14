import { Button } from '@/components/ui/button'
import type { BackendMode } from '@/lib/research/schema'
import { cn } from '@/lib/utils'
import { MockBadge } from './mock-badge'

interface AppHeaderProps {
  visible: boolean
  backendMode: BackendMode
  onReset?: () => void
}

export function AppHeader({ visible, backendMode, onReset }: AppHeaderProps) {
  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md transition-opacity duration-500 motion-reduce:transition-none',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      {/* pr-16 reserves the slot the docked Electric Logo occupies. */}
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 pr-16 md:pr-4">
        <p className="text-sm font-semibold tracking-[0.2em]">Sakura : Your pepersonal financial analyst</p>
        {onReset ? (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={onReset}>
            New research
          </Button>
        ) : null}
      </div>
    </header>
  )
}
