import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldAlert, Loader2, ArrowLeft, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/api/auth'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { adminLogin, isAdmin, adminToken } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAdmin && adminToken) {
      navigate('/admin', { replace: true })
    }
  }, [isAdmin, adminToken, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Admin login attempt:', { email, hasPassword: !!password })
      const response = await authApi.adminLogin(email, password)
      console.log('Admin login successful:', response)
      adminLogin(response.admin_token)
      navigate('/admin', { replace: true })
    } catch (err: any) {
      console.error('Admin login error:', err)
      setError(err.message || err.detail || 'Invalid admin credentials')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <button
          onClick={() => navigate('/onboarding')}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>

        {/* Card */}
        <div className="glass-card p-6 rounded-2xl border border-border/50 backdrop-blur-xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-xl mx-auto mb-4">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-center">Admin Portal</h1>
            <p className="text-sm text-muted-foreground text-center mt-2">
              ZyloCover System Management
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Admin Email</label>
              <Input
                type="email"
                placeholder="admin@zylocover.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Admin Password</label>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Access Admin Dashboard'
              )}
            </Button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-900 dark:text-blue-100 mb-3">
              <span className="font-semibold">🔐 Default Admin Credentials:</span>
            </p>
            <div className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
                <p className="font-semibold mb-1">Email</p>
                <code className="block bg-white dark:bg-black px-2 py-1 rounded text-xs">
                  admin@zylocover.com
                </code>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
                <p className="font-semibold mb-1">Password</p>
                <code className="block bg-white dark:bg-black px-2 py-1 rounded text-xs">
                  Admin1234!
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          ZyloCover © 2026 • Admin Access Only
        </p>
      </motion.div>
    </div>
  )
}
