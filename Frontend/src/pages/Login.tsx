import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { authService } from '@/services/authService'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Checkbox } from '@/components/common/Checkbox'

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-12">
        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <span className="font-bold text-2xl text-gray-900">zylocover</span>
      </Link>

      {/* Login Form */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isAdmin ? 'Admin Login' : 'Welcome Back'}
        </h2>
        <p className="text-gray-600 mb-8">
          {isAdmin ? 'Login to admin panel' : 'Login to your account'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <Checkbox
            name="isAdmin"
            label="Login as Admin"
            checked={isAdmin}
            onChange={e => setIsAdmin(e.target.checked)}
          />

          <Button
            type="submit"
            disabled={loading}
            isLoading={loading}
            fullWidth
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        {!isAdmin && (
          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/onboarding" className="text-purple-600 font-semibold hover:underline">
              Sign up here
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
