import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/lib/toast'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Pipeline } from '@/pages/Pipeline'
import { Liste } from '@/pages/Liste'
import { EntreprisesPage } from '@/pages/EntreprisesPage'
import { EntrepriseDetailPage } from '@/pages/EntrepriseDetailPage'
import { ContactsPage } from '@/pages/ContactsPage'
import { Rappels } from '@/pages/Rappels'
import { Parametres } from '@/pages/Parametres'

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
              <Route path="/" element={<Dashboard />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/liste" element={<Liste />} />
              <Route path="/entreprises" element={<EntreprisesPage />} />
              <Route path="/entreprises/:id" element={<EntrepriseDetailPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/rappels" element={<Rappels />} />
              <Route path="/parametres" element={<Parametres />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}