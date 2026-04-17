import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Public Pages
import { Index as Landing } from '@/pages/Index'
import { Signup } from '@/pages/Signup'
import { Login } from '@/pages/Login'

// Worker Pages
import { Dashboard } from '@/pages/Dashboard'
import { Policy } from '@/pages/Policy'
import { Claims } from '@/pages/Claims'
import { ClaimDetail } from '@/pages/ClaimDetail'
import { ActiveTriggers } from '@/pages/ActiveTriggers'
import { Payouts } from '@/pages/Payouts'
import { Profile } from '@/pages/Profile'
import Plans from '@/pages/Plans'
import Monitor from '@/pages/Monitor'
import Earnings from '@/pages/Earnings'
import { ClaimsHistory } from '@/pages/ClaimsHistory'

// Admin Pages
import { AdminDashboard } from '@/pages/AdminDashboard'
import { AdminSimulator } from '@/pages/AdminSimulator'
import { AdminFraudQueue } from '@/pages/AdminFraudQueue'
import { AdminAuditLog } from '@/pages/AdminAuditLog'
import AdminCenter from '@/pages/AdminCenter'
import AdminCredentials from '@/pages/AdminCredentials'
import AdminLogin from '@/pages/AdminLogin'

// 404 Page
import { NotFound } from '@/pages/NotFound'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  }
  
  return (isAuthenticated && token) ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, adminToken, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  }
  
  return (isAdmin && adminToken) ? <>{children}</> : <Navigate to="/admin-login" replace />
}

function AppRoutes() {
  const { isAuthenticated, isAdmin, adminToken } = useAuth()

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/admin-login" element={(isAdmin && adminToken) ? <Navigate to="/admin" replace /> : <AdminLogin />} />
      <Route path="/onboarding" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} />

      {/* Worker Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
      <Route path="/monitor" element={<ProtectedRoute><Monitor /></ProtectedRoute>} />
      <Route path="/earnings" element={<ProtectedRoute><Earnings /></ProtectedRoute>} />
      <Route path="/triggers" element={<ProtectedRoute><ActiveTriggers /></ProtectedRoute>} />
      <Route path="/claims" element={<ProtectedRoute><Claims /></ProtectedRoute>} />
      <Route path="/claims/history" element={<ProtectedRoute><ClaimsHistory /></ProtectedRoute>} />
      <Route path="/claims/:claimId" element={<ProtectedRoute><ClaimDetail /></ProtectedRoute>} />
      {/* Compatibility aliases */}
      <Route path="/policy" element={<Navigate to="/plans" replace />} />
      <Route path="/policy-legacy" element={<ProtectedRoute><Policy /></ProtectedRoute>} />
      <Route path="/claims-legacy" element={<ProtectedRoute><ClaimsHistory /></ProtectedRoute>} />
      <Route path="/payouts" element={<ProtectedRoute><Payouts /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminCenter /></AdminRoute>} />
      <Route path="/admin/center" element={<AdminRoute><AdminCenter /></AdminRoute>} />
      <Route path="/admin/credentials" element={<AdminRoute><AdminCredentials /></AdminRoute>} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/simulator" element={<AdminRoute><AdminSimulator /></AdminRoute>} />
      <Route path="/admin/fraud-queue" element={<AdminRoute><AdminFraudQueue /></AdminRoute>} />
      <Route path="/admin/audit" element={<AdminRoute><AdminAuditLog /></AdminRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
)

export default App
