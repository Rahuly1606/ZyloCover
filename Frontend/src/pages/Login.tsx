import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, LogIn } from 'lucide-react'
import { authService } from '@/services/authService'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/layout/Navbar'

export const Login = () => {
  const navigate = useNavigate()
  const { login, adminLogin } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isAdmin) {
        const result = await authService.adminLogin(email, password)
        adminLogin(result.admin_token)
        navigate('/admin')
      } else {
        const result = await authService.login(email, password)
        login(result.access_token, result.user.id, result.user)
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="px-4 py-12 pb-20">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="glass-card p-6 md:p-8 border border-purple-200 space-y-6">
            {/* Header */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <p className="text-xs text-muted-foreground mb-2">Account Access</p>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                Welcome Back
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                {isAdmin ? 'Admin panel access' : 'Login to your account'}
              </p>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={isAdmin}
                  onChange={e => setIsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
                <label htmlFor="isAdmin" className="text-sm text-slate-600 cursor-pointer">
                  Login as Admin
                </label>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="gap-2 w-full"
                >
                  <LogIn className="h-4 w-4" />
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Sign Up Link */}
            {!isAdmin && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-center text-sm"
              >
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link to="/onboarding" className="text-purple-600 font-semibold hover:text-purple-700">
                  Sign up
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
