import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { authService } from '@/services/authService'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SignupFormData {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  city: string
  zone_risk: string
  delivery_platform: string
  avg_daily_income: string
  agreeTerms: boolean
}

type Step = 1 | 2 | 3

const CITIES = ['bangalore', 'delhi', 'mumbai', 'hyderabad', 'pune', 'kolkata', 'ahmedabad']
const ZONES = ['zone_a_flood_prone', 'zone_b_high_traffic', 'zone_c_industrial', 'zone_d_residential', 'zone_e_outer_ring']
const PLATFORMS = ['swiggy', 'zomato', 'blinkit', 'ola', 'uber', 'rapido']

export const Signup = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    zone_risk: '',
    delivery_platform: '',
    avg_daily_income: '',
    agreeTerms: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const validateStep1 = () => {
    if (!formData.name.trim()) return 'Name is required'
    if (!formData.email.includes('@')) return 'Valid email is required'
    if (!formData.phone || formData.phone.length < 10) return 'Valid phone number is required'
    if (!formData.password || formData.password.length < 6) return 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match'
    return ''
  }

  const validateStep2 = () => {
    if (!formData.city) return 'City is required'
    if (!formData.zone_risk) return 'Zone is required'
    if (!formData.delivery_platform) return 'Platform is required'
    if (!formData.avg_daily_income || parseInt(formData.avg_daily_income) < 100) return 'Daily income must be at least ₹100'
    return ''
  }

  const validateStep3 = () => {
    if (!formData.agreeTerms) return 'You must agree to the terms'
    return ''
  }

  const handleNext = () => {
    const validationError = step === 1 ? validateStep1() : validateStep2()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    if (step < 3) setStep((step + 1) as Step)
  }

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateStep3()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await authService.signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        city: formData.city,
        zone_risk: formData.zone_risk,
        delivery_platform: formData.delivery_platform,
        avg_daily_income: parseInt(formData.avg_daily_income),
      })

      login(result.access_token, result.user.id, result.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
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
            {/* Progress Bar */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">Step {step} of 3</p>
                <p className="text-xs font-medium text-purple-600">{Math.round((step / 3) * 100)}%</p>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-600"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(step / 3) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>

            {/* Header */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-center"
            >
              <p className="text-xs text-muted-foreground">Create Account</p>
              <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">
                {step === 1 ? 'Personal Details' : step === 2 ? 'Work Information' : 'Terms & Review'}
              </h1>
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
              {/* Step 1 */}
              {step === 1 && (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <Input name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                    <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                    <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Min 6 characters" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                    <Input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" required />
                  </div>
                </motion.div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                    <select name="city" value={formData.city} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                      <option value="">Select city</option>
                      {CITIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Work Zone</label>
                    <select name="zone_risk" value={formData.zone_risk} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                      <option value="">Select zone</option>
                      {ZONES.map(z => <option key={z} value={z}>{z.replace(/_/g, ' ').toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Platform</label>
                    <select name="delivery_platform" value={formData.delivery_platform} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                      <option value="">Select platform</option>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Average Daily Income (₹)</label>
                    <Input name="avg_daily_income" type="number" value={formData.avg_daily_income} onChange={handleChange} placeholder="500" required />
                  </div>
                </motion.div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="glass-card-nested p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Name</span>
                        <span className="font-semibold text-slate-900">{formData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Email</span>
                        <span className="font-semibold text-slate-900">{formData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">City</span>
                        <span className="font-semibold text-slate-900">{formData.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Daily Income</span>
                        <span className="font-semibold text-slate-900">₹{formData.avg_daily_income}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 pt-2">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer mt-1"
                      required
                    />
                    <label htmlFor="agreeTerms" className="text-sm text-slate-600 cursor-pointer">
                      I agree to the Terms of Service and Privacy Policy
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-6">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBack}
                    disabled={loading}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                    className="flex-1 gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                )}
              </div>
            </form>

            {/* Login Link */}
            <motion.div 
              initial={{ y: 10, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-sm"
            >
              <span className="text-muted-foreground">Already have an account? </span>
              <button 
                type="button"
                onClick={() => navigate('/login')}
                className="text-purple-600 font-semibold hover:text-purple-700"
              >
                Login
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
