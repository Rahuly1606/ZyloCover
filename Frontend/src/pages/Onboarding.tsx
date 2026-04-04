import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, ChevronRight, Mail, Lock, User, Phone, AlertCircle, 
  MapPin, Loader, Check, Eye, EyeOff, Truck, Home, UtensilsCrossed,
  Package, Zap, Box, ShoppingCart, MoreHorizontal, CloudRain, Navigation,
  Hammer, Compass, DollarSign, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/api/auth";

type AuthStep = "mode" | "login" | "signup";
type SignupStep = 1 | 2 | 3;

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [authStep, setAuthStep] = useState<AuthStep>("mode");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [signupStep, setSignupStep] = useState<SignupStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup fields
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [platform, setPlatform] = useState("zomato");
  const [workZone, setWorkZone] = useState("zone_d_residential");
  const [income, setIncome] = useState("25000");
  const [hours, setHours] = useState("8");
  const [location, setLocation] = useState<LocationData | null>(null);

  // Get current location
  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          const address = data.address?.city || data.address?.town || data.address?.village || 
                         data.address?.county || "Location captured";
          
          setLocation({ latitude, longitude, address });
        } catch (err) {
          console.error("Geocoding error:", err);
          // Fallback if geocoding fails
          setLocation({ latitude, longitude, address: "Location captured" });
        }
        
        setError("");
        setGettingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError("Unable to get your location. Please check permissions.");
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleLogin = async () => {
    setError("");
    if (!loginEmail || !loginPassword) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login(loginEmail, loginPassword);
      login(response.access_token, response.user_id);
      navigate("/");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Login failed";
      
      // Provide specific error messages
      if (errorMsg.includes("401") || errorMsg.includes("Invalid credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (errorMsg.includes("disabled")) {
        setError("Your account has been disabled. Contact support.");
      } else if (errorMsg.includes("not found")) {
        setError("Account not found. Please sign up first.");
      } else if (errorMsg.includes("network") || errorMsg.includes("ERR_")) {
        setError("Network error. Please check your connection.");
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setError("");
    if (!signupEmail || !signupPassword || !name || !phone) {
      setError("Please fill in all required fields");
      return;
    }

    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (phone.length !== 10) {
      setError("Phone number must be 10 digits");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.signup({
        email: signupEmail,
        password: signupPassword,
        name,
        phone,
        platform,
        work_zone: workZone,
        avg_daily_income: parseInt(income),
        avg_daily_hours: parseInt(hours),
        location: location || undefined,
      });
      login(response.access_token, response.user_id);
      navigate("/");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Signup failed";
      
      if (errorMsg.includes("already registered")) {
        setError("Email already registered. Please sign in or use a different email.");
      } else if (errorMsg.includes("email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (signupStep === 1 && (!name || !signupEmail)) {
      setError("Please fill in all required fields");
      return;
    }
    if (signupStep === 2 && (!phone || !signupPassword)) {
      setError("Please fill in all required fields");
      return;
    }
    setError("");
    if (signupStep < 3) setSignupStep((s) => (s + 1) as SignupStep);
  };

  const handlePrevStep = () => {
    if (signupStep > 1) setSignupStep((s) => (s - 1) as SignupStep);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 px-4 py-8 sm:px-6">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-200/30 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl"></div>
      </div>

      {/* Logo and branding */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 mb-6 flex flex-col items-center gap-3 sm:mb-8"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-purple-300/30"
        >
          <Shield className="h-8 w-8 text-white" />
        </motion.div>
        <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">ZyloCover</h1>
        <p className="text-center text-xs text-slate-600 sm:text-sm">AI-Powered Insurance for Gig Workers</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Mode Selection */}
        {authStep === "mode" && (
          <motion.div
            key="mode"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="relative z-10 w-full max-w-md space-y-3 rounded-2xl border border-purple-200 bg-white/90 backdrop-blur-xl p-6 sm:p-8 shadow-lg"
          >
            <p className="text-center text-xs font-medium text-slate-600 sm:text-sm">Choose how you'd like to proceed</p>
            
            <div className="space-y-3 pt-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setAuthStep("login")}
                  className="w-full gradient-primary text-white font-semibold py-3 shadow-md hover:shadow-lg"
                >
                  Sign In
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => {
                    setAuthStep("signup");
                    setSignupStep(1);
                  }}
                  variant="outline"
                  className="w-full border-purple-300 bg-white hover:bg-purple-50 text-slate-900 font-semibold py-3"
                >
                  Create Account
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </div>

            <div className="pt-2 text-center text-xs text-slate-600 border-t border-purple-200">
              <p className="mt-4">💡 Get protected today, earn securely</p>
            </div>
          </motion.div>
        )}

        {/* Login */}
        {authStep === "login" && (
          <motion.div
            key="login"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-purple-200 bg-white/90 backdrop-blur-xl p-8 sm:p-10 shadow-lg"
          >
            <button
              onClick={() => {
                setAuthStep("mode");
                setError("");
              }}
              className="mb-4 text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
            >
              ← Back
            </button>

            <div className="space-y-2 mb-6">
              <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">Welcome Back</h2>
              <p className="text-sm text-slate-600">Sign in to your account</p>
            </div>

            {error && (
              <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <Alert variant="destructive" className="mb-4 bg-red-100 border-red-300 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="space-y-5">
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-slate-900">Email</label>
                <div className="flex items-center gap-3 rounded-lg border border-purple-300 bg-white px-4 py-3.5 focus-within:border-purple-500 focus-within:bg-purple-50 focus-within:shadow-md transition">
                  <Mail className="h-5 w-5 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="border-0 bg-transparent p-0 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-slate-900">Password</label>
                <div className="flex items-center gap-3 rounded-lg border border-purple-300 bg-white px-4 py-3.5 focus-within:border-purple-500 focus-within:bg-purple-50 focus-within:shadow-md transition">
                  <Lock className="h-5 w-5 text-slate-500" />
                  <Input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="border-0 bg-transparent p-0 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 flex-1"
                  />
                  <button
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="text-slate-500 hover:text-slate-700 transition"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  onClick={handleLogin}
                  disabled={isLoading || !loginEmail || !loginPassword}
                  className="w-full gradient-primary disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold py-3.5 shadow-md mt-2 text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>

              <div className="mt-6 rounded-lg bg-purple-50 border border-purple-300 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-700">
                      <strong className="text-slate-900 block mb-3 font-semibold">Demo Account</strong>
                      <span className="inline-block mb-2">Email: <span className="font-mono text-purple-700 font-medium">demo@zylocover.com</span></span><br/>
                      <span className="inline-block">Password: <span className="font-mono text-purple-700 font-medium">Demo1234!</span></span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {authStep === "signup" && (
          <motion.div
            key="signup"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-purple-200 bg-white/90 backdrop-blur-xl p-8 sm:p-10 shadow-lg"
          >
            <button
              onClick={() => {
                setAuthStep("mode");
                setSignupStep(1);
                setError("");
              }}
              className="mb-4 text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
            >
              ← Back
            </button>

            {/* Progress indicator */}
            <div className="mb-8 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">Create Account</h2>
                <span className="text-sm font-semibold text-slate-700 bg-purple-100 px-3 py-1.5 rounded-full">Step {signupStep}/3</span>
              </div>
              <div className="flex gap-3">
                {[1, 2, 3].map((step) => (
                  <motion.div
                    key={step}
                    className={`h-3 flex-1 rounded-full transition ${
                      step <= signupStep
                        ? "gradient-primary"
                        : "bg-purple-200"
                    }`}
                    animate={{ width: step <= signupStep ? "100%" : "100%" }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-4">
                <Alert variant="destructive" className="bg-red-100 border-red-300 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* Step 1: Personal Info */}
              {signupStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-600" />
                      Full Name *
                    </label>
                    <div className="flex items-center gap-3 rounded-lg border border-purple-300 bg-white px-4 py-3.5 focus-within:border-purple-500 focus-within:bg-purple-50 focus-within:shadow-md transition">
                      <Input
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border-0 bg-transparent p-0 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-purple-600" />
                      Email *
                    </label>
                    <div className="flex items-center gap-3 rounded-lg border border-purple-300 bg-white px-4 py-3.5 focus-within:border-purple-500 focus-within:bg-purple-50 focus-within:shadow-md transition">
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="border-0 bg-transparent p-0 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-4">
                    <Button
                      onClick={handleNextStep}
                      className="w-full gradient-primary text-white font-semibold py-3 shadow-md text-base"
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {/* Step 2: Contact & Password */}
              {signupStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-purple-600" />
                      Phone Number *
                    </label>
                    <div className="flex items-center gap-3 rounded-lg border border-purple-300 bg-white px-4 py-3.5 focus-within:border-purple-500 focus-within:bg-purple-50 focus-within:shadow-md transition">
                      <Input
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="border-0 bg-transparent p-0 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-purple-600" />
                      Password *
                    </label>
                    <div className="flex items-center gap-3 rounded-lg border border-purple-300 bg-white px-4 py-3.5 focus-within:border-purple-500 focus-within:bg-purple-50 focus-within:shadow-md transition">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="border-0 bg-transparent p-0 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 flex-1"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-500 hover:text-slate-700 transition"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-600">Min 6 characters</p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handlePrevStep}
                      variant="outline"
                      className="flex-1 border-purple-300 hover:bg-purple-50 text-slate-900 font-semibold py-3 text-base"
                    >
                      Back
                    </Button>
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1">
                      <Button
                        onClick={handleNextStep}
                        className="w-full gradient-primary text-white font-semibold py-3 shadow-md text-base"
                      >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Work & Location Info */}
              {signupStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6 flex flex-col"
                >
                  <div className="space-y-6 max-h-[calc(95vh-320px)] overflow-y-auto pr-2">
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5 text-purple-600" />
                        Delivery Platform
                      </label>
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full rounded-lg border border-purple-300 bg-white px-4 py-3.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-sm hover:border-purple-400 cursor-pointer appearance-none bg-no-repeat bg-right"
                        style={{
                          backgroundImage: `url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23334155%22 stroke-width=%222%22%3e%3cpolyline points=%226 9 12 15 18 9%22%3e%3c/polyline%3e%3c/svg%3e')`,
                          backgroundSize: '1.5em 1.5em',
                          backgroundPosition: 'right 0.5rem center',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option value="zomato" className="bg-white">Zomato</option>
                        <option value="swiggy" className="bg-white">Swiggy</option>
                        <option value="blinkit" className="bg-white">Blinkit</option>
                        <option value="zepto" className="bg-white">Zepto</option>
                        <option value="amazon" className="bg-white">Amazon Flex</option>
                        <option value="flipkart" className="bg-white">Flipkart</option>
                        <option value="other" className="bg-white">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-purple-600" />
                        Work Zone (Hyderabad)
                      </label>
                      <select
                        value={workZone}
                        onChange={(e) => setWorkZone(e.target.value)}
                        className="w-full rounded-lg border border-purple-300 bg-white px-4 py-3.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-sm hover:border-purple-400 cursor-pointer appearance-none bg-no-repeat bg-right"
                        style={{
                          backgroundImage: `url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23334155%22 stroke-width=%222%22%3e%3cpolyline points=%226 9 12 15 18 9%22%3e%3c/polyline%3e%3c/svg%3e')`,
                          backgroundSize: '1.5em 1.5em',
                          backgroundPosition: 'right 0.5rem center',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option value="zone_a_flood_prone" className="bg-white">Flood Prone Zone</option>
                        <option value="zone_b_high_traffic" className="bg-white">High Traffic Zone</option>
                        <option value="zone_c_industrial" className="bg-white">Industrial Zone</option>
                        <option value="zone_d_residential" className="bg-white">Residential Zone</option>
                        <option value="zone_e_outer_ring" className="bg-white">Outer Ring Zone</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-purple-600" />
                          Avg Daily Income
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="25000"
                            value={income}
                            onChange={(e) => setIncome(e.target.value)}
                            className="rounded-lg border border-purple-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-sm hover:border-purple-400 w-full"
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-purple-600" />
                          Avg Daily Hours
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="8"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            className="rounded-lg border border-purple-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-sm hover:border-purple-400 w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location Section */}
                    <div className="space-y-4 rounded-lg border border-purple-300 bg-purple-50 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-purple-600" />
                            Your Location
                          </label>
                          <p className="text-xs text-slate-600 mt-2">We use this to provide better coverage</p>
                        </div>
                      </div>

                      {location ? (
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="rounded-lg bg-green-50 p-4 border border-green-300 flex items-start gap-3"
                        >
                          <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-green-700 font-semibold">Location Captured</p>
                            <p className="text-xs text-green-600 mt-2">
                              {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                            </p>
                          </div>
                          <button
                            onClick={() => setLocation(null)}
                            className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                          >
                            Change
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={handleGetLocation}
                            disabled={gettingLocation}
                            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 flex items-center justify-center gap-2 transition"
                          >
                            {gettingLocation ? (
                              <>
                                <Loader className="h-4 w-4 animate-spin" />
                                Getting location...
                              </>
                            ) : (
                              <>
                                <MapPin className="h-4 w-4" />
                                Get Current Location
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-purple-200 mt-4">
                    <Button
                      onClick={handlePrevStep}
                      variant="outline"
                      className="flex-1 border-purple-300 hover:bg-purple-50 text-slate-900 font-semibold py-3 text-base"
                    >
                      Back
                    </Button>
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1">
                      <Button
                        onClick={handleSignup}
                        disabled={isLoading || !signupEmail || !signupPassword || !name || !phone}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-slate-400 disabled:to-slate-400 disabled:text-slate-600 text-white font-bold py-3.5 text-base shadow-lg hover:shadow-xl transition"
                      >
                        {isLoading ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            Register & Proceed
                            <Check className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-4 mt-4 border-t border-purple-200 text-center">
              <p className="text-xs text-slate-600">By signing up, you agree to our terms</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
