// src/test/integration.test.ts
// Quick integration test - run this to verify setup

import { authService } from '@/services/authService'
import { policyService } from '@/services/policyService'
import { triggerService } from '@/services/triggerService'

/**
 * Manual Integration Tests
 * 
 * These are NOT Jest tests - use in browser console during dev
 * 
 * Copy-paste each test into browser console (F12) while app is running
 * Check Network tab to verify API calls
 */

// Test 1: Health Check
async function testHealthCheck() {
  console.log('🧪 Test 1: Health Check')
  try {
    const response = await fetch('http://localhost:8000/health')
    const data = await response.json()
    console.log('[OK] Backend is responding:', data)
    return true
  } catch (err) {
    console.error('[FAIL] Backend not responding:', err)
    return false
  }
}

// Test 2: Signup API
async function testSignup() {
  console.log('🧪 Test 2: Signup API')
  try {
    const result = await authService.signup({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      phone: '9876543210',
      password: 'TestPass123!',
      city: 'Bangalore',
      delivery_platform: 'Swiggy',
      vehicle_type: 'bike',
      avg_daily_income: 500
    })
    console.log('[OK] Signup successful:', result.data?.user)
    return result.data?.access_token
  } catch (err) {
    console.error('[FAIL] Signup failed:', err)
    return null
  }
}

// Test 3: Login API
async function testLogin() {
  console.log('🧪 Test 3: Login API')
  try {
    const result = await authService.login(
      'test@example.com',
      'password123'
    )
    console.log('[OK] Login successful:', result.data?.user)
    return result.data?.access_token
  } catch (err) {
    console.error('[FAIL] Login failed:', err)
    return null
  }
}

// Test 4: Authorization Header
async function testAuthHeader() {
  console.log('🧪 Test 4: Authorization Header')
  const token = localStorage.getItem('access_token')
  if (!token) {
    console.warn('[WARN] No token in localStorage - signup/login first')
    return false
  }
  
  try {
    const result = await policyService.getActive()
    console.log('[OK] Authorized request successful:', result)
    return true
  } catch (err) {
    console.error('[FAIL] Authorization failed:', err)
    return false
  }
}

// Test 5: Get Pricing Tiers
async function testPricingTiers() {
  console.log('🧪 Test 5: Get Pricing Tiers')
  try {
    const result = await pricingService.getTiers()
    console.log('[OK] Pricing tiers loaded:', result.data)
    return true
  } catch (err) {
    console.error('[FAIL] Failed to load pricing:', err)
    return false
  }
}

// Test 6: Trigger Cities
async function testTriggerCities() {
  console.log('🧪 Test 6: Trigger Cities')
  try {
    const result = await triggerService.getCities()
    console.log('[OK] Cities loaded:', result.data?.cities?.length, 'cities')
    return true
  } catch (err) {
    console.error('[FAIL] Failed to load cities:', err)
    return false
  }
}

// Run All Tests
export async function runIntegrationTests() {
  console.log('\nStarting Integration Tests...\n')
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Signup API', fn: testSignup },
    { name: 'Login API', fn: testLogin },
    { name: 'Authorization', fn: testAuthHeader },
    { name: 'Pricing Tiers', fn: testPricingTiers },
    { name: 'Trigger Cities', fn: testTriggerCities },
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    try {
      const result = await test.fn()
      if (result) passed++
      else failed++
    } catch (err) {
      failed++
      console.error(`Error in ${test.name}:`, err)
    }
  }
  
  console.log(`\nResults: ${passed} passed, ${failed} failed\n`)
  return failed === 0
}

/**
 * How to Use:
 * 
 * 1. Start backend: python main.py
 * 2. Start frontend: npm run dev
 * 3. Open in browser: http://localhost:5173
 * 4. Open DevTools (F12), go to Console tab
 * 5. Copy-paste test code or run:
 * 
 *    import { runIntegrationTests } from './test/integration.test'
 *    await runIntegrationTests()
 * 
 * 6. Check results - should see all passes
 * 7. If any fail, check Network tab for errors
 * 
 * Quick Sanity Checks:
 * 
 * - API is running: curl http://localhost:8000/health
 * - Frontend is running: http://localhost:5173 loads
 * - Services import: Open browser console, type: window.__webpack_require__.e('src/services/authService')
 * - Token storage: Open DevTools Storage tab, check localStorage for 'access_token'
 */
