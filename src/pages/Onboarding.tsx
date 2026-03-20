import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ChevronRight, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const steps = ["phone", "otp", "details"] as const;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<(typeof steps)[number]>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const handlePhoneSubmit = () => {
    if (phone.length >= 10) setStep("otp");
  };

  const handleOtpSubmit = () => {
    if (otp.length === 4) setStep("details");
  };

  const handleFinish = () => {
    localStorage.setItem("onboarded", "true");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 flex flex-col items-center gap-3"
      >
        <div className="gradient-primary flex h-16 w-16 items-center justify-center rounded-2xl">
          <Shield className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold">GigShield</h1>
        <p className="text-sm text-muted-foreground">AI-Powered Insurance for Gig Workers</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === "phone" && (
          <motion.div
            key="phone"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="glass-card w-full max-w-sm space-y-4 p-6"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              <span className="text-sm font-medium">Enter Mobile Number</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-muted px-3 py-2 text-sm font-medium">+91</span>
              <Input
                type="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="text-lg tracking-wider"
              />
            </div>
            <p className="text-xs text-muted-foreground/80 italic text-center">Use any random 10-digit number for login</p>
            <Button onClick={handlePhoneSubmit} className="gradient-primary w-full text-primary-foreground" disabled={phone.length < 10}>
              Get OTP <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div
            key="otp"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="glass-card w-full max-w-sm space-y-4 p-6"
          >
            <p className="text-sm text-muted-foreground">OTP sent to +91 {phone}</p>
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={otp[i] || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const newOtp = otp.split("");
                    newOtp[i] = val;
                    setOtp(newOtp.join("").slice(0, 4));
                    if (val && i < 3) {
                      (e.target.nextElementSibling as HTMLInputElement)?.focus();
                    }
                  }}
                  className="h-14 w-14 rounded-xl border border-border bg-card text-center text-2xl font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground/80 italic text-center">Use any random 4-digit OTP</p>
            <Button onClick={handleOtpSubmit} className="gradient-primary w-full text-primary-foreground" disabled={otp.length < 4}>
              Verify <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {step === "details" && (
          <motion.div
            key="details"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="glass-card w-full max-w-sm space-y-4 p-6"
          >
            <p className="text-sm font-medium text-muted-foreground">Tell us about you</p>
            <Input placeholder="Full Name" defaultValue="Ravi Kumar" />
            <select className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Zomato</option>
              <option>Swiggy</option>
              <option>Uber</option>
              <option>Ola</option>
              <option>Rapido</option>
            </select>
            <select className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Bengaluru</option>
              <option>Mumbai</option>
              <option>Delhi</option>
              <option>Chennai</option>
              <option>Hyderabad</option>
            </select>
            <Input placeholder="Avg. Weekly Earnings (₹)" defaultValue="4200" type="number" />
            <Button onClick={handleFinish} className="gradient-primary w-full text-primary-foreground">
              Start Protection <Shield className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
