import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import GeotechPage from './pages/modules/GeotechPage'
import BOQPage from './pages/modules/BOQPage'
import ISCodePage from './pages/modules/ISCodePage'
import StructuralPage from './pages/modules/StructuralPage'
import TenderPage from './pages/modules/TenderPage'
import SitePhotoPage from './pages/modules/SitePhotoPage'

function PrivateRoute({ children }) {
  const token = useAuthStore((state) => state.token)
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'glass-panel',
          style: {
            background: 'rgba(255, 255, 255, 0.8)',
            color: '#0f172a',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
            padding: '16px',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#6366f1',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="geotech" element={<GeotechPage />} />
          <Route path="boq" element={<BOQPage />} />
          <Route path="iscode" element={<ISCodePage />} />
          <Route path="structural" element={<StructuralPage />} />
          <Route path="tender" element={<TenderPage />} />
          <Route path="site-photo" element={<SitePhotoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
