import React from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/common/Button'

export const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Insurance for <span className="text-purple-600">Gig Workers</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Parametric income protection. Automatic payouts when weather or disruptions hit. No forms. No waiting. Just support when you need it most.
        </p>
        <Link to="/onboarding">
          <Button size="lg" className="mb-12">
            Get Started
          </Button>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div>
            <div className="text-3xl font-bold text-purple-600">50K+</div>
            <p className="text-gray-600 mt-2">Workers Protected</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">₹10Cr+</div>
            <p className="text-gray-600 mt-2">Paid Out</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">24hrs</div>
            <p className="text-gray-600 mt-2">Average Payout Time</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="border-2 border-purple-600 rounded-xl p-8 text-center">
              <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-bold mb-4">Buy Coverage</h3>
              <p className="text-gray-600">Choose your coverage tier and income level. Premium calculated fairly.</p>
            </div>

            {/* Step 2 */}
            <div className="border-2 border-amber-500 rounded-xl p-8 text-center">
              <div className="bg-amber-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-bold mb-4">Weather Happens</h3>
              <p className="text-gray-600">Heavy rain, extreme heat, or disruption occurs in your area.</p>
            </div>

            {/* Step 3 */}
            <div className="border-2 border-green-700 rounded-xl p-8 text-center">
              <div className="bg-green-700 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-bold mb-4">Auto Payout</h3>
              <p className="text-gray-600">You get paid automatically. No claiming. No waiting. Immediate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Tiers */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Coverage Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold mb-2">Basic</h3>
              <p className="text-gray-600 mb-6">Essential protection</p>
              <div className="text-3xl font-bold text-purple-600 mb-6">₹99<span className="text-sm text-gray-600">/week</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-600" /> <span className="text-gray-600">Max ₹2000 per claim</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-600" /> <span className="text-gray-600">2 claims per week</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-600" /> <span className="text-gray-600">Rain protection</span>
                </li>
              </ul>
              <Button fullWidth variant="secondary">Select</Button>
            </div>

            {/* Standard */}
            <div className="bg-white border-2 border-purple-600 rounded-xl p-8 shadow-lg transform md:scale-105 md:-translate-y-4">
              <div className="bg-purple-600 text-white px-3 py-1 rounded-full inline-block mb-4 text-sm font-bold">POPULAR</div>
              <h3 className="text-2xl font-bold mb-2">Standard</h3>
              <p className="text-gray-600 mb-6">Most popular choice</p>
              <div className="text-3xl font-bold text-purple-600 mb-6">₹199<span className="text-sm text-gray-600">/week</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-600" /> <span className="text-gray-600">Max ₹5000 per claim</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-600" /> <span className="text-gray-600">Unlimited claims</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-600" /> <span className="text-gray-600">All triggers covered</span>
                </li>
              </ul>
              <Button fullWidth>Select</Button>
            </div>

            {/* Premium */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <p className="text-gray-600 mb-6">Maximum protection</p>
              <div className="text-3xl font-bold text-purple-600 mb-6">₹349<span className="text-sm text-gray-600">/week</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-600" /> <span className="text-gray-600">Max ₹10,000 per claim</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-600" /> <span className="text-gray-600">Unlimited claims</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-600" /> <span className="text-gray-600">Premium + surge pricing</span>
                </li>
              </ul>
              <Button fullWidth variant="secondary">Select</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2026 zylocover. Insurance made simple for gig workers.</p>
        </div>
      </footer>
    </div>
  )
}
