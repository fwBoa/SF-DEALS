import { Loader2 } from 'lucide-react'

export function Spinner({ size = 18 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-muted" />
}

export function PageLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size={28} />
    </div>
  )
}