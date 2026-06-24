import { Logo } from '@/components/layout/Logo'

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ink px-6">
      <Logo size={56} variant="dark" />
      <h1 className="text-3xl text-ink-text">
        SF <span className="accent-italic">Deals</span>
      </h1>
      <p className="font-sans text-sm text-muted">
        CRM de prospection — Afrique de l'Ouest &amp; réseau Ecobank
      </p>
    </main>
  )
}