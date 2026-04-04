#!/bin/bash
# WEATHER API INTEGRATION - VERIFICATION CHECKLIST
# Run this to verify everything is working correctly

echo "🔍 RaahPay Weather API Integration Verification"
echo "================================================="
echo ""

# Check 1: Backend configuration
echo "✋ CHECK 1: Backend Configuration"
echo "  Checking Backend/.env for API keys..."
if grep -q "OPENWEATHER_API_KEY=b7a1ad4a16a4600ffe9a80af9079c8cd" Backend/.env; then
    echo "  ✅ OPENWEATHER_API_KEY: FOUND"
else
    echo "  ❌ OPENWEATHER_API_KEY: MISSING"
fi

if grep -q "WAQI_API_KEY=5741c6319a684ab29a3672cd1a096d349e051a4e" Backend/.env; then
    echo "  ✅ WAQI_API_KEY: FOUND"
else
    echo "  ❌ WAQI_API_KEY: MISSING"
fi

if grep -q "USE_MOCK_ENV_DATA=False" Backend/.env; then
    echo "  ✅ USE_MOCK_ENV_DATA=False: REAL APIs ACTIVE"
else
    echo "  ❌ USE_MOCK_ENV_DATA: Should be False for real APIs"
fi

echo ""

# Check 2: Backend files
echo "✋ CHECK 2: Backend Files"
echo "  Verifying required backend files..."

if [ -f "Backend/app/services/environmental.py" ]; then
    echo "  ✅ environmental.py: EXISTS"
else
    echo "  ❌ environmental.py: MISSING"
fi

if [ -f "Backend/WEATHER_API_EXAMPLES.py" ]; then
    echo "  ✅ WEATHER_API_EXAMPLES.py: EXISTS"
else
    echo "  ❌ WEATHER_API_EXAMPLES.py: MISSING"
fi

if [ -f "Backend/test_weather_api.py" ]; then
    echo "  ✅ test_weather_api.py: EXISTS"
else
    echo "  ❌ test_weather_api.py: MISSING"
fi

echo ""

# Check 3: Frontend components
echo "✋ CHECK 3: Frontend Components"
echo "  Verifying required frontend files..."

if [ -f "Frontend/src/components/EnvironmentalSnapshot.tsx" ]; then
    echo "  ✅ EnvironmentalSnapshot.tsx: EXISTS"
else
    echo "  ❌ EnvironmentalSnapshot.tsx: MISSING"
fi

if [ -f "Frontend/src/components/WeatherAlert.tsx" ]; then
    echo "  ✅ WeatherAlert.tsx: EXISTS"
else
    echo "  ❌ WeatherAlert.tsx: MISSING"
fi

echo ""

# Check 4: Dashboard updated
echo "✋ CHECK 4: Dashboard Integration"
echo "  Checking if Dashboard.tsx imports new components..."

if grep -q "EnvironmentalSnapshot" Frontend/src/pages/Dashboard.tsx; then
    echo "  ✅ EnvironmentalSnapshot imported"
else
    echo "  ❌ EnvironmentalSnapshot NOT imported"
fi

if grep -q "WeatherAlert" Frontend/src/pages/Dashboard.tsx; then
    echo "  ✅ WeatherAlert imported"
else
    echo "  ❌ WeatherAlert NOT imported"
fi

if grep -q "pricingService.calculatePricing" Frontend/src/pages/Dashboard.tsx; then
    echo "  ✅ calculatePricing() call added"
else
    echo "  ❌ calculatePricing() call MISSING"
fi

echo ""

# Check 5: Pricing service updated
echo "✋ CHECK 5: Pricing Service"
echo "  Checking pricingService.ts for new method..."

if grep -q "calculatePricing()" Frontend/src/services/pricingService.ts; then
    echo "  ✅ calculatePricing() method exists"
else
    echo "  ❌ calculatePricing() method MISSING"
fi

echo ""
echo "================================================="
echo "✅ VERIFICATION COMPLETE!"
echo ""
echo "Next Steps:"
echo "1. Start Backend:  cd Backend && python app/main.py"
echo "2. Start Frontend: cd Frontend && npm run dev"
echo "3. Open Dashboard and verify environmental data displays"
echo "4. Check browser DevTools for API responses"
echo ""
