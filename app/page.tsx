import { SignalForgeApp } from '@/components/signalforge/signalforge-app'
import { getBackendMode } from '@/lib/research/backend'

export default function Page() {
  return <SignalForgeApp backendMode={getBackendMode()} />
}
