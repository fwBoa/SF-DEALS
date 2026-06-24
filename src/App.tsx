import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/lib/toast'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoading } from '@/components/ui/Spinner'
import { Login } from '@/pages/Login'

// Pages chargées en lazy (code-splitting par route) — recharts et les vues
// lourdes ne sont téléchargées qu'à la navigation.
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Pipeline = lazy(() => import('@/pages/Pipeline').then((m) => ({ default: m.Pipeline })))
const Liste = lazy(() => import('@/pages/Liste').then((m) => ({ default: m.Liste })))
const EntreprisesPage = lazy(() =>
  import('@/pages/EntreprisesPage').then((m) => ({ default: m.EntreprisesPage })),
)
const EntrepriseDetailPage = lazy(() =>
  import('@/pages/EntrepriseDetailPage').then((m) => ({ default: m.EntrepriseDetailPage })),
)
const OpportuniteDetailPage = lazy(() =>
  import('@/pages/OpportuniteDetailPage').then((m) => ({ default: m.OpportuniteDetailPage })),
)
const ContactsPage = lazy(() => import('@/pages/ContactsPage').then((m) => ({ default: m.ContactsPage })))
const Rappels = lazy(() => import('@/pages/Rappels').then((m) => ({ default: m.Rappels })))
const Parametres = lazy(() => import('@/pages/Parametres').then((m) => ({ default: m.Parametres })))

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<PageLoading />}>
                    <Dashboard />
                  </Suspense>
                }
              />
              <Route
                path="pipeline"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <Pipeline />
                  </Suspense>
                }
              />
              <Route
                path="liste"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <Liste />
                  </Suspense>
                }
              />
              <Route
                path="entreprises"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <EntreprisesPage />
                  </Suspense>
                }
              />
              <Route
                path="entreprises/:id"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <EntrepriseDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="opportunites/:id"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <OpportuniteDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="contacts"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <ContactsPage />
                  </Suspense>
                }
              />
              <Route
                path="rappels"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <Rappels />
                  </Suspense>
                }
              />
              <Route
                path="parametres"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <Parametres />
                  </Suspense>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}