import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, MapPin, Upload, Check, AlertCircle, Loader2, X } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SignupFormData {
  // Step 1: Personal
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  // Step 2: Job Verification & Location
  employee_id: string
  job_proof_image: string | null
  current_latitude: number | null
  current_longitude: number | null
  current_address: string
  // Step 3: Work Info
  city: string
  zone_risk: string
  delivery_platform: string
  avg_daily_income: string
  experience_months: string
  // Step 4: Terms
  agreeTerms: boolean
}

type Step = 1 | 2 | 3 | 4

// Fallback cities list (in case API fails)
const FALLBACK_CITIES = [
  'ahmedabad', 'aizawl', 'ajmer', 'allahabad', 'almora', 'amritsar', 'amravati', 'aurangabad', 'ayodhya',
  'badami', 'badlapur', 'bagalkot', 'bahraich', 'balangir', 'balasore', 'bangalore', 'bareilly', 'baroda',
  'belgaum', 'bengaluru', 'bhubaneswar', 'bikaner', 'bijnor', 'bhilai', 'bhiwandi', 'bhopal', 'bilaspur',
  'biratnagar', 'borivali', 'budaun', 'bulandshahr', 'burdwan', 'burhanpur', 'buxar', 'chandausi',
  'chandigarh', 'chandrapur', 'chatra', 'chikkaballapur', 'chikmagalur', 'chindwara', 'chitradurga',
  'chittoor', 'coimbatore', 'cuttack', 'dahod', 'damoh', 'danapur', 'dankaur', 'dasuya', 'dehradun',
  'delhi', 'denapur', 'dewas', 'dhar', 'dhanbad', 'dhanpur', 'dharamshala', 'dharmapuri', 'dhubri',
  'dhule', 'dibrugarh', 'digar', 'dinajpur', 'dimapur', 'dombivli', 'dumbriganj', 'dumka', 'durgapur',
  'dwarka', 'eranakulam', 'erode', 'etah', 'etawah', 'faizabad', 'faridabad', 'faridkot', 'faridpur',
  'firozabad', 'firozpur', 'gajuwaka', 'gandhinagar', 'gangtok', 'gaya', 'gazipuram', 'giridih',
  'gita nagpur', 'goa', 'godhra', 'gondal', 'gonda', 'gondwada', 'gorakhpur', 'gotegaon', 'govardhan',
  'guhagar', 'gulbarga', 'gulmarg', 'guntur', 'gupta', 'gurgaon', 'gurmandi', 'gurnar', 'gurugram',
  'guwahati', 'gyarasing', 'habra', 'haldia', 'halibpur', 'halpur', 'hamirpur', 'hansi', 'hanumangarh',
  'haryana', 'haripur', 'hatauda', 'hatia', 'hatod', 'hattush', 'haugh', 'haulbowline', 'hausdorf',
  'haveri', 'hawalbagh', 'hawaldanpur', 'hawapur', 'hawaudpur', 'hawera', 'haweri', 'haweswater',
  'hawkes bay', 'hawkins', 'hawkinge', 'hawkmond', 'hawkshead', 'hawksbury', 'hawkshaw', 'hawksley',
  'hawkstone', 'hawksworth', 'indore', 'jaipur', 'jalandhar', 'jammu', 'jamshedpur', 'jodhpur',
  'junagadh', 'kakinada', 'kalimpong', 'kalyan', 'kamrup', 'kanpur', 'kanyakumari', 'karad',
  'karamadai', 'karaman', 'karanpur', 'karela', 'karhapur', 'karkhpur', 'karivallur', 'karjan',
  'karjat', 'karlpur', 'karma', 'karmanasa', 'karmarang', 'karmarapur', 'karmasar', 'karmaspur',
  'karmatpur', 'karmaveer', 'karlpur', 'karnali', 'karnal', 'karnapur', 'karnaul', 'karnaut',
  'karnauta', 'karnautpalli', 'karnaval', 'karnawd', 'karnaware', 'karnawati', 'karnayla'
].sort()

const ZONES = ['zone_a_flood_prone', 'zone_b_high_traffic', 'zone_c_industrial', 'zone_d_residential', 'zone_e_outer_ring']
const PLATFORMS = ['swiggy', 'zomato', 'blinkit', 'ola', 'uber', 'rapido']

export const Signup = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [citySearch, setCitySearch] = useState('')
  const [citySearching, setCitySearching] = useState(false)
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const citySearchRef = useRef<HTMLDivElement>(null)
  const [dataRecovered, setDataRecovered] = useState(false)
  const [cityAutoDetected, setCityAutoDetected] = useState(false)

  // Storage key for form cache
  const CACHE_KEY = 'zylocover_signup_form'

  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    employee_id: '',
    job_proof_image: null,
    current_latitude: null,
    current_longitude: null,
    current_address: '',
    city: '',
    zone_risk: 'zone_d_residential',
    delivery_platform: 'swiggy',
    avg_daily_income: '',
    experience_months: '',
    agreeTerms: false,
  })

  // ═══════════════════════════════════════════════════════════════════
  // CACHE MANAGEMENT - Save form data to localStorage
  // ═══════════════════════════════════════════════════════════════════

  // Save form data to localStorage
  const saveFormToCache = useCallback((data: SignupFormData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to save form to cache:', e)
    }
  }, [CACHE_KEY])

  // Load form data from localStorage
  const loadFormFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        setFormData(parsed)
        setDataRecovered(true)
        console.log('✅ Form data recovered from cache')
        return true
      }
    } catch (e) {
      console.warn('Failed to load form from cache:', e)
    }
    return false
  }, [CACHE_KEY])

  // Clear form data from localStorage
  const clearFormCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY)
      console.log('🗑️ Form cache cleared')
    } catch (e) {
      console.warn('Failed to clear form cache:', e)
    }
  }, [CACHE_KEY])

  // Load cached data on component mount
  useEffect(() => {
    loadFormFromCache()
  }, [])

  // Save form data to cache whenever it changes (debounced to avoid excessive saves)
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      saveFormToCache(formData)
    }, 500) // Save after 500ms of inactivity

    return () => clearTimeout(saveTimer)
  }, [formData, saveFormToCache])

  // ═══════════════════════════════════════════════════════════════════
  // CITY SEARCH
  // ═══════════════════════════════════════════════════════════════════
  const searchCities = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setCitySuggestions([])
      return
    }

    setCitySearching(true)
    try {
      // First try local FALLBACK_CITIES for quick results
      const localMatches = FALLBACK_CITIES.filter(c =>
        c.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)

      // Always show local suggestions while fetching from API
      if (localMatches.length > 0) {
        setCitySuggestions(localMatches)
      }

      // Use Nominatim to search for cities in India (for more complete results)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=IN&featuretype=city&limit=10`
      )
      const data = await response.json()
      const apiCities = data
        .map((item: any) => item.address?.city || item.address?.town || item.name)
        .filter((city: string) => city && city.length > 0)
        .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index) // Remove duplicates
        .map((city: string) => city.toLowerCase())
        .slice(0, 5)

      // Merge local and API results, remove duplicates
      const allCities = [...new Set([...localMatches, ...apiCities])]
      setCitySuggestions(allCities.length > 0 ? allCities : localMatches)
    } catch (error) {
      console.error('City search error:', error)
      // Fallback to local search if API fails
      const filtered = FALLBACK_CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
      setCitySuggestions(filtered)
    } finally {
      setCitySearching(false)
    }
  }, [])

  // Get user's current city from IP geolocation
  const getCurrentCityFromIP = useCallback(async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      if (data.city) {
        return data.city.toLowerCase()
      }
    } catch {
      // Failed silently, will use GPS instead
    }
    return null
  }, [])

  // Auto-detect and fill city on component mount
  useEffect(() => {
    // Skip if city is already filled from cache
    if (formData.city && formData.city.length > 0) {
      console.log('City already set from cache:', formData.city)
      return
    }

    const autoDetectCity = async () => {
      console.log('Starting city auto-detection...')
      // First try GPS
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            console.log('GPS location obtained:', latitude, longitude)
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              )
              const data = await response.json()
              const cityName = data.address?.city || data.address?.town || data.address?.suburb
              if (cityName) {
                console.log('City detected from GPS:', cityName)
                setFormData(prev => ({
                  ...prev,
                  city: cityName.toLowerCase(),
                  current_latitude: latitude,
                  current_longitude: longitude
                }))
                setCityAutoDetected(true)
                setTimeout(() => setCityAutoDetected(false), 5000) // Hide after 5 seconds
              }
            } catch (err) {
              console.error('Reverse geocoding failed:', err)
              // Try IP geolocation as fallback
              try {
                const response = await fetch('https://ipapi.co/json/')
                const data = await response.json()
                if (data.city) {
                  console.log('City detected from IP:', data.city)
                  setFormData(prev => ({ ...prev, city: data.city.toLowerCase() }))
                  setCityAutoDetected(true)
                  setTimeout(() => setCityAutoDetected(false), 5000)
                }
              } catch (ipErr) {
                console.error('IP geolocation failed:', ipErr)
              }
            }
          },
          async (error) => {
            console.error('GPS error:', error)
            // If GPS fails, try IP geolocation
            try {
              const response = await fetch('https://ipapi.co/json/')
              const data = await response.json()
              if (data.city) {
                console.log('City detected from IP (GPS failed):', data.city)
                setFormData(prev => ({ ...prev, city: data.city.toLowerCase() }))
                setCityAutoDetected(true)
                setTimeout(() => setCityAutoDetected(false), 5000)
              }
            } catch (ipErr) {
              console.error('IP geolocation also failed:', ipErr)
            }
          }
        )
      } else {
        console.log('Geolocation not supported, trying IP...')
        // No geolocation, use IP geolocation
        try {
          const response = await fetch('https://ipapi.co/json/')
          const data = await response.json()
          if (data.city) {
            console.log('City detected from IP (no GPS):', data.city)
            setFormData(prev => ({ ...prev, city: data.city.toLowerCase() }))
            setCityAutoDetected(true)
            setTimeout(() => setCityAutoDetected(false), 5000)
          }
        } catch (ipErr) {
          console.error('IP geolocation failed:', ipErr)
        }
      }
    }

    // Run auto-detect immediately
    autoDetectCity()
  }, [])  // Empty dependency array - only run once on mount

  // Handle image capture and conversion to base64
  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64String = event.target?.result as string
      setFormData(prev => ({
        ...prev,
        job_proof_image: base64String,
      }))
      setImagePreview(base64String)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setShowCitySuggestions(false)
  }

  // Handle city search input
  const handleCityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCitySearch(value)
    setFormData(prev => ({ ...prev, city: value }))
    setShowCitySuggestions(true)

    // Search immediately with any input length
    if (value.length > 0) {
      searchCities(value)
    } else {
      setCitySuggestions([])
    }
  }

  // Select a city from suggestions
  const selectCity = (city: string) => {
    setFormData(prev => ({ ...prev, city }))
    setCitySearch(city)
    setShowCitySuggestions(false)
  }

  // Close city suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (citySearchRef.current && !citySearchRef.current.contains(event.target as Node)) {
        setShowCitySuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getLocation = async () => {
    setGettingLocation(true)
    setError('')

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Try to get address from coordinates (reverse geocoding)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const address = data.address?.city || data.address?.town || data.address?.suburb || 'Current Location'

          setFormData(prev => ({
            ...prev,
            current_latitude: latitude,
            current_longitude: longitude,
            current_address: `${address} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          }))
        } catch {
          // If reverse geocoding fails, just use coordinates
          setFormData(prev => ({
            ...prev,
            current_latitude: latitude,
            current_longitude: longitude,
            current_address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          }))
        }
        setGettingLocation(false)
      },
      (error) => {
        let errorMsg = 'Failed to get location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable it in your browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMsg = 'Location request timed out.'
            break
        }
        setError(errorMsg)
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
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
    if (!formData.employee_id.trim()) return 'Employee ID is required'
    if (!formData.job_proof_image) return 'Job proof image is required'
    if (formData.current_latitude === null) return 'Current location is required'
    return ''
  }

  const validateStep3 = () => {
    if (!formData.city) return 'City is required'
    if (!formData.zone_risk) return 'Zone is required'
    if (!formData.delivery_platform) return 'Platform is required'
    if (!formData.avg_daily_income || parseInt(formData.avg_daily_income) < 500) return 'Daily income must be at least ₹500'
    if (!formData.experience_months || parseInt(formData.experience_months) < 3) return 'Must have at least 3 months of delivery experience'
    return ''
  }

  const validateStep4 = () => {
    if (!formData.agreeTerms) return 'You must agree to the terms'
    return ''
  }

  const handleNext = () => {
    const validationError = step === 1 ? validateStep1() : step === 2 ? validateStep2() : validateStep3()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    if (step < 4) setStep((step + 1) as Step)
  }

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateStep4()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await authApi.signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        employee_id: formData.employee_id,
        job_proof_image: formData.job_proof_image || undefined,
        city: formData.city,
        zone_risk: formData.zone_risk,
        delivery_platform: formData.delivery_platform,
        avg_daily_income: parseInt(formData.avg_daily_income),
        avg_daily_hours: 8.0,
        experience_months: parseInt(formData.experience_months),
        registered_latitude: formData.current_latitude || undefined,
        registered_longitude: formData.current_longitude || undefined,
        registered_address: formData.current_address || undefined,
      })

      // Extract user info from response
      const user = (result as any).user || result

      // Clear form cache after successful signup
      clearFormCache()

      login(result.access_token, user.id, user)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
      setLoading(false)
    }
  }

  const stepTitles = [
    'Personal Details',
    'Job Verification',
    'Work Information',
    'Review & Confirm'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />

      <div className="px-4 py-12 pb-20">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-2xl mx-auto"
        >
          <div className="glass-card p-8 border border-purple-200 space-y-8">
            {/* Progress Bar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">Step {step} of 4</p>
                <p className="text-xs font-medium text-purple-600">{Math.round((step / 4) * 100)}%</p>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(step / 4) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>

            {/* Step Indicator */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-center"
            >
              <p className="text-xs text-muted-foreground">Create Account</p>
              <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
                {stepTitles[step - 1]}
              </h1>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Cache Recovery Notification */}
            {dataRecovered && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0 flex items-center justify-center">
                    <Check className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Welcome back!</span> We recovered your saved signup data. You can continue where you left off.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearFormCache()
                    setDataRecovered(false)
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      password: '',
                      confirmPassword: '',
                      employee_id: '',
                      job_proof_image: null,
                      current_latitude: null,
                      current_longitude: null,
                      current_address: '',
                      city: '',
                      zone_risk: 'zone_d_residential',
                      delivery_platform: 'swiggy',
                      avg_daily_income: '',
                      experience_months: '',
                      agreeTerms: false,
                    })
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                >
                  Start Fresh
                </button>
              </motion.div>
            )}

            {/* City Auto-Detection Notification */}
            {cityAutoDetected && formData.city && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
              >
                <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-green-700">
                    <span className="font-semibold">City detected!</span> We found you're in <span className="font-semibold">{formData.city.charAt(0).toUpperCase() + formData.city.slice(1)}</span>. You can change it if needed.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Personal Details */}
              {step === 1 && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      required
                      className="text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      required
                      className="text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                    <Input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      required
                      className="text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      required
                      className="text-base"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 2: Job Verification & Location */}
              {step === 2 && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Employee ID</label>
                    <p className="text-xs text-muted-foreground mb-2">Your unique identification from your delivery platform</p>
                    <Input
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleChange}
                      placeholder="e.g., ZOM123456 or SWI789012"
                      required
                      className="text-base"
                    />
                  </div>

                  <div className="border-t pt-5">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Job Proof Image</label>
                    <p className="text-xs text-muted-foreground mb-3">Upload a photo of your employee badge, delivery kit, or platform verification email</p>

                    {imagePreview ? (
                      <div className="space-y-3">
                        <div className="relative inline-block w-full">
                          <img
                            src={imagePreview}
                            alt="Job proof"
                            className="w-full h-48 object-cover rounded-lg border-2 border-green-300 bg-slate-100"
                          />
                          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-2">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                        >
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center cursor-pointer hover:bg-purple-50 transition"
                      >
                        <Upload className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-700">Click to upload image</p>
                        <p className="text-xs text-muted-foreground">or drag and drop</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageCapture}
                      className="hidden"
                    />
                  </div>

                  <div className="border-t pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700">Current Location</label>
                        <p className="text-xs text-muted-foreground">We'll capture your location for fraud prevention</p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={getLocation}
                      disabled={gettingLocation}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 py-2 h-auto"
                    >
                      {gettingLocation ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-5 w-5" />
                          {formData.current_latitude ? 'Update Location' : 'Capture My Location'}
                        </>
                      )}
                    </Button>

                    {formData.current_latitude && (
                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-green-900">Location Captured</p>
                            <p className="text-sm text-green-700 mt-1">{formData.current_address}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Work Information */}
              {step === 3 && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                    <p className="text-xs text-muted-foreground mb-2">Your city will be auto-detected. You can also search below.</p>

                    <div ref={citySearchRef} className="relative">
                      <div className="relative">
                        <Input
                          type="text"
                          value={formData.city}
                          onChange={handleCityInput}
                          placeholder="Auto-detecting or type to search..."
                          className="text-base pr-10"
                          onFocus={() => setShowCitySuggestions(true)}
                        />
                        {citySearching && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-purple-600" />
                        )}
                        {formData.city && !citySearching && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, city: '' }))
                                setCitySearch('')
                                setCitySuggestions([])
                              }}
                            >
                              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* City Suggestions Dropdown */}
                      {showCitySuggestions && citySuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                        >
                          {citySuggestions.map((city, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectCity(city)}
                              className="w-full text-left px-4 py-2 hover:bg-purple-50 border-b border-gray-200 last:border-b-0 transition text-sm"
                            >
                              <span className="font-medium text-slate-700">{city.charAt(0).toUpperCase() + city.slice(1)}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}

                      {/* No results message */}
                      {showCitySuggestions && citySuggestions.length === 0 && formData.city.length >= 2 && !citySearching && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 text-center"
                        >
                          <p className="text-sm text-slate-500">No cities found for "{formData.city}"</p>
                          <p className="text-xs text-slate-400 mt-1">Try searching with fewer letters</p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Work Zone</label>
                    <select
                      name="zone_risk"
                      value={formData.zone_risk}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                      required
                    >
                      {ZONES.map(z => (
                        <option key={z} value={z}>
                          {z.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Platform</label>
                    <select
                      name="delivery_platform"
                      value={formData.delivery_platform}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                      required
                    >
                      {PLATFORMS.map(p => (
                        <option key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Average Daily Income (₹)</label>
                    <Input
                      name="avg_daily_income"
                      type="number"
                      value={formData.avg_daily_income}
                      onChange={handleChange}
                      placeholder="500"
                      required
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Minimum ₹500 required for coverage</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Experience (Months)</label>
                    <Input
                      name="experience_months"
                      type="number"
                      value={formData.experience_months}
                      onChange={handleChange}
                      placeholder="3"
                      required
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Minimum 3 months required for coverage</p>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review & Terms */}
              {step === 4 && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-5"
                >
                  {/* Summary Card */}
                  <div className="glass-card-nested p-5 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                    <h3 className="text-sm font-semibold text-blue-900">Your Registration Details</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border border-blue-100">
                        <p className="text-xs text-slate-600">Name</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{formData.name}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-blue-100">
                        <p className="text-xs text-slate-600">Employee ID</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{formData.employee_id}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-blue-100">
                        <p className="text-xs text-slate-600">Email</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{formData.email}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-blue-100">
                        <p className="text-xs text-slate-600">City</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{formData.city}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-blue-100">
                        <p className="text-xs text-slate-600">Platform</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{formData.delivery_platform}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-blue-100">
                        <p className="text-xs text-slate-600">Daily Income</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">₹{formData.avg_daily_income}</p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded border border-blue-100">
                      <p className="text-xs text-slate-600">Registered Location</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        {formData.current_address}
                      </p>
                    </div>

                    {imagePreview && (
                      <div className="bg-white p-3 rounded border border-blue-100">
                        <p className="text-xs text-slate-600 mb-2">Job Proof Image</p>
                        <img src={imagePreview} alt="Job proof" className="h-24 w-24 object-cover rounded border border-blue-200" />
                      </div>
                    )}
                  </div>

                  {/* Terms */}
                  <div className="space-y-3 border-t pt-5">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="agreeTerms"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-gray-300 cursor-pointer mt-1 accent-purple-600"
                        required
                      />
                      <label htmlFor="agreeTerms" className="text-sm text-slate-600 cursor-pointer leading-relaxed">
                        I agree to the <span className="font-semibold">Terms of Service</span>, <span className="font-semibold">Privacy Policy</span>, and confirm that:
                        <ul className="list-disc list-inside mt-2 space-y-1 ml-1 text-xs text-slate-500">
                          <li>All provided information is accurate and verified</li>
                          <li>My employee ID is valid and unique to me</li>
                          <li>My location will be used for fraud prevention</li>
                          <li>I consent to identity verification procedures</li>
                        </ul>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-8 border-t">
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
                {step < 4 ? (
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
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
              className="text-center text-sm border-t pt-6"
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
