import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, ArrowRight, Shield, Zap, Clock } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'

export const Landing = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <motion.div 
          className="max-w-2xl mx-auto text-center space-y-6 md:space-y-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-block">
            <div className="glass-card border border-purple-200 px-4 py-2 inline-block">
              <p className="text-xs font-semibold text-purple-600">✨ Parametric Insurance for Gig Workers</p>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            variants={itemVariants}
            className="font-display text-3xl md:text-5xl font-bold text-slate-900 leading-tight"
          >
            Insurance for <span className="text-purple-600">Gig Workers</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            variants={itemVariants}
            className="text-base md:text-lg text-slate-600 max-w-xl mx-auto"
          >
            Parametric income protection. Automatic payouts when weather or disruptions hit. No forms. No waiting. Just support when you need it most.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
          >
            <Link to="/onboarding">
              <Button className="gap-2 w-full sm:w-auto">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" className="w-full sm:w-auto">
                I have an account
              </Button>
            </Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div 
            variants={itemVariants}
            className="pt-4 md:pt-8 flex justify-center gap-4 md:gap-8 text-xs md:text-sm text-muted-foreground flex-wrap"
          >
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-purple-600" />
              <span>Fast & Transparent</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-purple-600" />
              <span>Zero Paperwork</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-purple-600" />
              <span>24/7 Support</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 px-4 bg-white">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
            <motion.div 
              variants={itemVariants}
              className="glass-card p-6 md:p-8 border border-purple-200 text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">50K+</div>
              <p className="text-slate-600 text-sm md:text-base">Workers Protected</p>
            </motion.div>
            <motion.div 
              variants={itemVariants}
              className="glass-card p-6 md:p-8 border border-purple-200 text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">₹10Cr+</div>
              <p className="text-slate-600 text-sm md:text-base">Paid Out</p>
            </motion.div>
            <motion.div 
              variants={itemVariants}
              className="glass-card p-6 md:p-8 border border-purple-200 text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">24hrs</div>
              <p className="text-slate-600 text-sm md:text-base">Average Payout Time</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-20 px-4">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="text-center mb-10 md:mb-16">
            <p className="text-xs md:text-sm text-purple-600 font-semibold mb-2">HOW IT WORKS</p>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-slate-900">
              Three Simple Steps
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {/* Step 1 */}
            <motion.div 
              variants={itemVariants}
              className="glass-card p-6 border border-purple-200 space-y-4 text-center"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Buy Coverage</h3>
              <p className="text-slate-600 text-sm">Choose your coverage tier and income level. Premium calculated fairly.</p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              variants={itemVariants}
              className="glass-card p-6 border border-purple-200 space-y-4 text-center"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Weather Happens</h3>
              <p className="text-slate-600 text-sm">Heavy rain, extreme heat, or disruption occurs in your area.</p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              variants={itemVariants}
              className="glass-card p-6 border border-purple-200 space-y-4 text-center"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Auto Payout</h3>
              <p className="text-slate-600 text-sm">You get paid automatically. No claiming. No waiting. Immediate.</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Coverage Tiers Section */}
      <section className="py-12 md:py-20 px-4 bg-white">
        <motion.div 
          className="max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="text-center mb-10 md:mb-16">
            <p className="text-xs md:text-sm text-purple-600 font-semibold mb-2">PRICING</p>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-slate-900">
              Simple, Transparent Plans
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Basic */}
            <motion.div 
              variants={itemVariants}
              className="glass-card p-6 md:p-8 border border-slate-200 space-y-4 md:space-y-6"
            >
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900">Basic</h3>
                <p className="text-xs md:text-sm text-slate-600 mt-1">Essential protection</p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-purple-600">₹99<span className="text-xs md:text-sm font-normal text-slate-600">/week</span></div>
              </div>
              <ul className="space-y-2 md:space-y-3">
                <li className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-600">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Max ₹2000 per claim</span>
                </li>
                <li className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-600">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Rain protection</span>
                </li>
                <li className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-600">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>24/7 support</span>
                </li>
              </ul>
              <Button variant="secondary" className="w-full">Select Plan</Button>
            </motion.div>

            {/* Standard */}
            <motion.div 
              variants={itemVariants}
              className="glass-card p-6 md:p-8 border-2 border-purple-600 space-y-4 md:space-y-6"
            >
              <div className="space-y-2 md:space-y-3">
                <div className="inline-block text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                  POPULAR
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900">Standard</h3>
                  <p className="text-xs md:text-sm text-slate-600 mt-1">Most popular choice</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-purple-600">₹199<span className="text-xs md:text-sm font-normal text-slate-600">/week</span></div>
              </div>
              <ul className="space-y-2 md:space-y-3">
                <li className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-600">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Max ₹5000 per claim</span>
                </li>
                <li className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-600">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Unlimited claims</span>
                </li>
                <li className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-600">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>All triggers covered</span>
                </li>
              </ul>
              <Button className="w-full">Select Plan</Button>
            </motion.div>

            {/* Premium */}
            <motion.div 
              variants={itemVariants}
              className="glass-card p-6 md:p-8 border border-slate-200 space-y-4 md:space-y-6"
            >
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900">Premium</h3>
                <p className="text-xs md:text-sm text-slate-600 mt-1">Maximum protection</p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-purple-600">₹349<span className="text-xs md:text-sm font-normal text-slate-600">/week</span></div>
              </div>
              <ul className="space-y-2 md:space-y-3">
                <li className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-600">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Max ₹10,000 per claim</span>
                </li>
                <li className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-600">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Unlimited claims</span>
                </li>
                <li className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-600">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Premium support</span>
                </li>
              </ul>
              <Button variant="secondary" className="w-full">Select Plan</Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-4">
        <motion.div 
          className="max-w-2xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.div 
            variants={itemVariants}
            className="glass-card p-8 md:p-12 border border-purple-200 text-center space-y-4 md:space-y-6"
          >
            <h2 className="font-display text-2xl md:text-4xl font-bold text-slate-900">
              Ready to get protected?
            </h2>
            <p className="text-base md:text-lg text-slate-600">
              Join 50,000+ gig workers who trust zylocover for their income protection.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 md:pt-4">
              <Link to="/onboarding">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Get Started Today
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 md:py-8 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs md:text-sm text-slate-600">© 2026 zylocover. Insurance made simple for gig workers.</p>
          <div className="flex gap-4 md:gap-6 justify-center mt-3 md:mt-4 text-xs md:text-sm text-slate-600">
            <Link to="#" className="hover:text-purple-600">Terms</Link>
            <Link to="#" className="hover:text-purple-600">Privacy</Link>
            <Link to="#" className="hover:text-purple-600">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
