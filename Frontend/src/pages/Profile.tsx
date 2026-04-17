import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  Clock,
  Shield,
  Award,
  AlertCircle,
  Edit,
  LogOut,
  UtensilsCrossed,
  TrendingUp,
  Loader2,
  X,
  Save,
  AlertTriangle,
  Navigation,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { userApi } from "@/api/user";
import type { User as UserType, UserStats } from "@/types/api";

const getWorkZoneLabel = (zone: string): string => {
  const zones: Record<string, string> = {
    zone_a_flood_prone: "Flood Prone Zone",
    zone_b_high_traffic: "High Traffic Zone",
    zone_c_industrial: "Industrial Zone",
    zone_d_residential: "Residential Zone",
    zone_e_outer_ring: "Outer Ring Zone",
  };
  return zones[zone] || zone;
};

const getPlatformLabel = (platform: string): string => {
  const platforms: Record<string, string> = {
    zomato: "Zomato",
    swiggy: "Swiggy",
    blinkit: "Blinkit",
    zepto: "Zepto",
    amazon: "Amazon Flex",
    flipkart: "Flipkart",
    other: "Other",
  };
  return platforms[platform] || platform;
};

const getRiskBadgeColor = (isFraudFlagged: boolean): string => {
  return isFraudFlagged ? "bg-red-100 text-red-700 border border-red-300" : "bg-green-100 text-green-700 border border-green-300";
};

// Fraud prevention helper
const checkFraudRisks = (user: UserType): { riskLevel: "high" | "medium" | "low"; risks: string[] } => {
  const risks: string[] = [];

  if (user.is_fraud_flagged) {
    risks.push("Account flagged for suspicious activity");
  }

  if (!user.avg_daily_income || user.avg_daily_income < 500) {
    risks.push("Income too low for coverage verification");
  }

  if (!user.avg_daily_hours || user.avg_daily_hours < 4) {
    risks.push("Working hours seem unusually low");
  }

  if (!user.experience_months || user.experience_months < 3) {
    risks.push("Insufficient delivery experience");
  }

  let riskLevel: "high" | "medium" | "low" = "low";
  if (risks.length >= 3) riskLevel = "high";
  else if (risks.length >= 1) riskLevel = "medium";

  return { riskLevel, risks };
};

export const Profile = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, isLoading: authLoading, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [formData, setFormData] = useState<Partial<UserType>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [locationRefreshInterval, setLocationRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Calculate distance between two coordinates in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [authLoading, isAuthenticated, navigate])

  // Fetch user data - skip until auth fully loaded and token exists
  const { data: user, loading: userLoading, error: userError, refetch: refetchUser } = useApi<UserType>(() =>
    userApi.getProfile(), { skip: !isAuthenticated || !token }
  );
  const { data: stats, loading: statsLoading, error: statsError } = useApi<UserStats>(() =>
    userApi.getStats(), { skip: !isAuthenticated || !token }
  );

  // Auto-refresh current location every 30 seconds
  useEffect(() => {
    if (!user || !user.base_latitude || !user.base_longitude) return;

    const refreshLocation = async () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Only update if location changed significantly (>100 meters)
            const distance = calculateDistance(
              user.base_latitude!,
              user.base_longitude!,
              latitude,
              longitude
            );

            if (distance > 0.1) { // 100 meters
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              const data = await response.json();
              const address =
                data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                "Location updated";

              // Auto-update location in background
              await userApi.updateProfile({
                base_latitude: latitude,
                base_longitude: longitude,
                base_address: address,
              });

              console.log('Location auto-updated:', { latitude, longitude, address });
              refetchUser();
            }
          } catch (err) {
            console.error('Auto location update failed:', err);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 30000,
        }
      );
    };

    // Start auto-refresh
    const interval = setInterval(refreshLocation, 30000); // Every 30 seconds
    setLocationRefreshInterval(interval);

    // Cleanup on unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, refetchUser]);

  const isLoading = userLoading || statsLoading;
  const hasError = userError || statsError;

  const handleLogout = () => {
    logout();
    navigate("/onboarding");
  };

  const handleEditClick = () => {
    if (user) {
      setFormData(user);
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name || !formData.avg_daily_income || !formData.avg_daily_hours) {
      alert("Please fill all required fields");
      return;
    }

    setIsSaving(true);
    try {
      await userApi.updateProfile({
        name: formData.name,
        avg_daily_income: formData.avg_daily_income,
        avg_daily_hours: formData.avg_daily_hours,
        experience_months: formData.experience_months,
        base_latitude: formData.base_latitude,
        base_longitude: formData.base_longitude,
        base_address: formData.base_address,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsEditing(false);
      refetchUser();
    } catch (error) {
      alert("Failed to update profile. Please try again.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Reverse geocode to get address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            const address =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county ||
              "Location captured";

            setFormData((prev) => ({
              ...prev,
              base_latitude: latitude,
              base_longitude: longitude,
              base_address: address,
            }));
            alert("Location captured successfully.");
          } catch (err) {
            console.error("Geocoding error:", err);
            setFormData((prev) => ({
              ...prev,
              base_latitude: latitude,
              base_longitude: longitude,
              base_address: "Location captured",
            }));
            alert("Location captured (address lookup failed).");
          }
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Unable to get location. Please check your permissions.");
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (err) {
      console.error("Location error:", err);
      setIsGettingLocation(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("daily") || name === "experience_months" ? parseFloat(value) || 0 : value,
    }));
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </AppShell>
    );
  }

  if (hasError || !user) {
    return (
      <AppShell>
        <div className="space-y-5 p-4 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl font-bold">Profile</h1>
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center text-red-700">
            Failed to load profile data
          </div>
        </div>
      </AppShell>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const fraudCheckResult = checkFraudRisks(user);
  const riskColor = {
    high: "bg-red-50 border-red-200",
    medium: "bg-yellow-50 border-yellow-200",
    low: "bg-green-50 border-green-200",
  };
  const riskTextColor = {
    high: "text-red-700",
    medium: "text-yellow-700",
    low: "text-green-700",
  };

  return (
    <AppShell>
      <div className="space-y-5 p-4 pt-6 pb-12">
        {/* Header */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold">My Profile</h1>
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition p-2">
            <X className="h-5 w-5" />
          </button>
        </motion.div>

        {/* Success Message */}
        {saveSuccess && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
          >
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm font-semibold text-green-700">Profile updated successfully!</p>
          </motion.div>
        )}

        {/* Profile Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card space-y-4 p-6 text-center"
        >
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            {getInitials(user.name)}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">{getPlatformLabel(user.platform)}</p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className={`inline-block ${getRiskBadgeColor(user.is_fraud_flagged)} rounded-full px-3 py-1 text-xs font-semibold`}>
              {user.is_fraud_flagged ? "Flagged" : "Good Standing"}
            </span>
            <span className={`inline-block ${user.is_active ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-700 border border-gray-300"} rounded-full px-3 py-1 text-xs font-semibold`}>
              {user.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Member Since */}
          <p className="text-xs text-muted-foreground border-t border-purple-200 pt-3">
            Member since {formatDate(user.created_at)}
          </p>
        </motion.div>

        {/* Fraud Prevention Alert */}
        {fraudCheckResult.riskLevel !== "low" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={`glass-card space-y-3 p-4 border-2 ${riskColor[fraudCheckResult.riskLevel]}`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${riskTextColor[fraudCheckResult.riskLevel]}`} />
              <div className="flex-1">
                <p className={`font-semibold text-sm ${riskTextColor[fraudCheckResult.riskLevel]}`}>
                  {fraudCheckResult.riskLevel === "high" ? "High Risk Detected" : "Review Needed"}
                </p>
                <ul className={`text-xs mt-2 space-y-1 ${riskTextColor[fraudCheckResult.riskLevel]}`}>
                  {fraudCheckResult.risks.map((risk, idx) => (
                    <li key={idx}>• {risk}</li>
                  ))}
                </ul>
                <p className="text-xs mt-3 opacity-75">Please ensure all information is accurate to maintain your account in good standing.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Contact Information */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card space-y-4 p-4 border border-purple-200"
        >
          <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-600" />
            Contact Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Mail className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Phone className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-slate-900">+91 {user.phone}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Employee ID & Verification */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="glass-card space-y-4 p-4 border border-purple-200"
        >
          <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Employment Verification
          </h3>
          <div className="space-y-3">
            {user.employee_id && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-muted-foreground mb-1">Employee ID</p>
                <p className="text-sm font-mono font-semibold text-slate-900">{user.employee_id}</p>
              </div>
            )}
            {user.job_verification_status && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-muted-foreground mb-1">Verification Status</p>
                <div className="flex items-center gap-2">
                  {user.job_verification_status === 'approved' && (
                    <>
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                      <p className="text-sm font-semibold text-green-700">Verified</p>
                    </>
                  )}
                  {user.job_verification_status === 'pending' && (
                    <>
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 animate-pulse"></div>
                      <p className="text-sm font-semibold text-yellow-700">Pending Review</p>
                    </>
                  )}
                  {user.job_verification_status === 'rejected' && (
                    <>
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                      <p className="text-sm font-semibold text-red-700">Verification Failed</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Registered Location (at Signup) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.26 }}
          className="glass-card space-y-4 p-4 border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50"
        >
          <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Registered Location
          </h3>
          {user.registered_latitude && user.registered_longitude ? (
            <div className="p-4 bg-white rounded-lg border border-blue-200 space-y-3">
              {user.registered_address && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <p className="text-sm font-semibold text-slate-900">{user.registered_address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Latitude</p>
                  <p className="text-xs font-mono text-slate-700">{user.registered_latitude.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Longitude</p>
                  <p className="text-xs font-mono text-slate-700">{user.registered_longitude.toFixed(4)}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 pt-2 border-t border-blue-200">
                This is your location at registration. It's used for initial fraud verification.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-white rounded-lg border border-blue-200 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">No Registered Location</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Your registration location wasn't captured during signup.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Location Information - Current/Base Location */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="glass-card space-y-4 p-4 border border-purple-200"
        >
          <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Navigation className="h-5 w-5 text-purple-600" />
            Current Location
          </h3>
          {user.address || (user.latitude && user.longitude) ? (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 space-y-3">
              {user.address && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <p className="text-sm font-semibold text-slate-900">{user.address}</p>
                </div>
              )}
              {user.latitude && user.longitude && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Latitude</p>
                    <p className="text-xs font-mono text-slate-700">{user.latitude.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Longitude</p>
                    <p className="text-xs font-mono text-slate-700">{user.longitude.toFixed(4)}</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-600 pt-2 border-t border-blue-200">
                This is your current work location. Update it in edit mode if needed.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">No Current Location</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Capture your current location in edit mode for better coverage and risk assessment.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Work Details */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card space-y-4 p-4 border border-purple-200"
        >
          <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            Work Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <UtensilsCrossed className="h-3.5 w-3.5" /> Platform
              </p>
              <p className="text-sm font-semibold text-slate-900">{getPlatformLabel(user.platform)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Clock className="h-3.5 w-3.5" /> Experience
              </p>
              <p className="text-sm font-semibold text-slate-900">{user.experience_months} mo</p>
            </div>
          </div>
        </motion.div>

        {/* Work Zone */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="glass-card space-y-4 p-4 border border-purple-200"
        >
          <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-600" />
            Work Zone
          </h3>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-l-4 border-purple-600">
            <p className="text-lg font-bold text-slate-900">{getWorkZoneLabel(user.work_zone)}</p>
            <p className="text-xs text-slate-600 mt-2">Your primary delivery zone for risk assessment and coverage</p>
          </div>
        </motion.div>

        {/* Income & Hours */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card space-y-3 p-4 border border-purple-200"
        >
          <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            Daily Metrics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-green-600" /> Income
              </p>
              <p className="text-lg font-bold text-green-700">₹{user.avg_daily_income.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Clock className="h-3.5 w-3.5 text-blue-600" /> Hours
              </p>
              <p className="text-lg font-bold text-blue-700">{user.avg_daily_hours} hrs</p>
            </div>
          </div>
        </motion.div>

        {/* Policy & Coverage Stats */}
        {stats && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="glass-card space-y-4 p-4 border border-purple-200"
          >
            <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Coverage Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Active Policies</p>
                <p className="text-2xl font-bold text-purple-700">{stats.active_policies}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Claims</p>
                <p className="text-2xl font-bold text-orange-700">{stats.total_claims}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Payouts</p>
                <p className="text-2xl font-bold text-green-700">₹{(stats.total_payouts || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Fraud Flags</p>
                <p className="text-2xl font-bold text-red-700">{stats.fraud_flags}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="space-y-3 pt-4"
        >
          <Button
            onClick={handleEditClick}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-purple-300 text-slate-900 font-semibold py-3 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </motion.div>

        {/* Privacy Note */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center p-4 rounded-lg bg-slate-50 border border-slate-200"
        >
          <p className="text-xs text-muted-foreground">
            Your profile information is secure and encrypted. We never share your data with third parties.
          </p>
        </motion.div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEditing(false)}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="relative z-50 w-full max-w-md mx-4 bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Edit Profile</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Full Name *</label>
                <Input
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className="rounded-lg border border-purple-300 bg-white px-4 py-2.5"
                />
              </div>

              {/* Daily Income */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Average Daily Income (₹) *</label>
                <Input
                  name="avg_daily_income"
                  type="number"
                  value={formData.avg_daily_income || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., 25000"
                  className="rounded-lg border border-purple-300 bg-white px-4 py-2.5"
                />
              </div>

              {/* Daily Hours */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Average Daily Hours *</label>
                <Input
                  name="avg_daily_hours"
                  type="number"
                  value={formData.avg_daily_hours || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., 8"
                  className="rounded-lg border border-purple-300 bg-white px-4 py-2.5"
                />
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Experience (Months)</label>
                <Input
                  name="experience_months"
                  type="number"
                  value={formData.experience_months || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., 12"
                  className="rounded-lg border border-purple-300 bg-white px-4 py-2.5"
                />
              </div>

              {/* Location Section */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  Update Your Current Location
                </label>
                <p className="text-xs text-slate-600 mb-2">
                  This helps us provide accurate coverage and risk assessment for your work area.
                </p>
                {formData.base_address || (formData.base_latitude && formData.base_longitude) ? (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 space-y-2">
                    {formData.base_address && (
                      <div>
                        <p className="text-xs text-green-600 font-medium">Current Address</p>
                        <p className="text-sm font-semibold text-green-700">
                          {formData.base_address}
                        </p>
                      </div>
                    )}
                    {formData.base_latitude && formData.base_longitude && (
                      <div className="flex items-center gap-3 text-xs">
                        <div>
                          <span className="text-green-600">Lat:</span>
                          <span className="font-mono text-green-700 ml-1">{formData.base_latitude.toFixed(4)}</span>
                        </div>
                        <div>
                          <span className="text-green-600">Lon:</span>
                          <span className="font-mono text-green-700 ml-1">{formData.base_longitude.toFixed(4)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-700">No location captured yet. Tap the button below to capture your current location.</p>
                  </div>
                )}
                <Button
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 text-sm"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <Navigation className="mr-2 h-4 w-4" />
                      {formData.base_address ? "Update Location" : "Capture My Location"}
                    </>
                  )}
                </Button>
              </div>

              {/* Warning Message */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700">
                  Ensure all information is accurate. Fraudulent data may result in claim rejection or account suspension.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
