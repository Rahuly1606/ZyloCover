import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { Checkbox } from '@/components/common/Checkbox'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

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
    if (!formData.zone_risk) return 'Zone risk is required'
    if (!formData.delivery_platform) return 'Delivery platform is required'
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-purple-600">Step {step} of 3</span>
            <span className="text-sm text-gray-600">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
              />
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
              />
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
              />
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Work Information</h2>
              <Select
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                options={[
                  { value: 'bangalore', label: 'Bangalore' },
                  { value: 'delhi', label: 'Delhi' },
                  { value: 'mumbai', label: 'Mumbai' },
                  { value: 'hyderabad', label: 'Hyderabad' },
                  { value: 'pune', label: 'Pune' },
                  { value: 'bangalore', label: 'Bangalore' },
                  { value: 'kolkata', label: 'Kolkata' },
                  { value: 'ahmedabad', label: 'Ahmedabad' },
                ]}
              />
              <Select
                label="Delivery Platform"
                name="delivery_platform"
                value={formData.delivery_platform}
                onChange={handleChange}
                options={[
                  { value: 'swiggy', label: 'Swiggy' },
                  { value: 'zomato', label: 'Zomato' },
                  { value: 'blinkit', label: 'Blinkit' },
                  { value: 'ola', label: 'Ola' },
                  { value: 'uber', label: 'Uber' },
                  { value: 'rapido', label: 'Rapido' },
                ]}
              />
              <Input
                label="Average Daily Income (₹)"
                name="avg_daily_income"
                type="number"
                value={formData.avg_daily_income}
                onChange={handleChange}
                placeholder="500"
              />
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Review & Confirm</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-semibold text-gray-900">{formData.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Platform</p>
                    <p className="font-semibold text-gray-900">{formData.delivery_platform}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Daily Income</p>
                    <p className="font-semibold text-gray-900">₹{formData.avg_daily_income}</p>
                  </div>
                </div>
              </div>
              <Checkbox
                name="agreeTerms"
                label="I agree to Terms of Service and Privacy Policy"
                checked={formData.agreeTerms}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button
                variant="secondary"
                onClick={() => setStep((step - 1) as Step)}
                disabled={loading}
              >
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={loading}
                className="flex-1"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                className="flex-1"
              >
                Create Account
              </Button>
            )}
          </div>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/onboarding')}
            className="text-purple-600 font-semibold hover:underline"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  )
}
