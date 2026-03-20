export const mockUser = {
  name: "Ravi Kumar",
  phone: "+91 98765 43210",
  platform: "Zomato",
  city: "Bengaluru",
  weeklyEarnings: 4200,
  avatar: "RK",
};

export const mockPolicy = {
  id: "GW-PI-20260319",
  status: "active" as const,
  plan: "Standard Shield",
  premium: 30,
  workerShare: 20,
  platformShare: 10,
  coverageAmount: 500,
  validFrom: "19 Mar 2026",
  validTo: "25 Mar 2026",
  riskLevel: "Low" as const,
};

export const mockWeather = {
  temperature: 32,
  humidity: 68,
  aqi: 142,
  aqiLabel: "Moderate",
  condition: "Partly Cloudy",
  rainProbability: 35,
  alerts: [] as { type: string; message: string; severity: string }[],
};

export const mockPayouts = [
  { id: 1, date: "12 Mar 2026", amount: 200, trigger: "Heavy Rain", status: "credited" },
  { id: 2, date: "05 Mar 2026", amount: 150, trigger: "Poor AQI (>300)", status: "credited" },
  { id: 3, date: "22 Feb 2026", amount: 200, trigger: "Heavy Rain", status: "credited" },
  { id: 4, date: "10 Feb 2026", amount: 100, trigger: "Heatwave (>42°C)", status: "credited" },
];

export const mockEarningsHistory = [
  { week: "W11", earnings: 4200, protected: 4200, payout: 0 },
  { week: "W10", earnings: 3800, protected: 3800, payout: 200 },
  { week: "W9", earnings: 4500, protected: 4500, payout: 0 },
  { week: "W8", earnings: 3200, protected: 3200, payout: 150 },
  { week: "W7", earnings: 4100, protected: 4100, payout: 0 },
  { week: "W6", earnings: 3900, protected: 3900, payout: 200 },
];

export const mockPlans = [
  {
    id: "basic",
    name: "Basic Cover",
    premium: 20,
    workerShare: 15,
    platformShare: 5,
    coverage: 300,
    triggers: ["Heavy Rain", "Heatwave"],
  },
  {
    id: "standard",
    name: "Standard Shield",
    premium: 30,
    workerShare: 20,
    platformShare: 10,
    coverage: 500,
    triggers: ["Heavy Rain", "Heatwave", "Poor AQI"],
    popular: true,
  },
  {
    id: "premium",
    name: "Full Guard",
    premium: 40,
    workerShare: 25,
    platformShare: 15,
    coverage: 800,
    triggers: ["Heavy Rain", "Heatwave", "Poor AQI", "Flooding", "Storm"],
  },
];

export const mockAdminStats = {
  totalUsers: 12847,
  activePolicies: 9234,
  premiumCollected: 277020,
  claimsProcessed: 1847,
  claimsPaid: 369400,
  avgClaimAmount: 200,
  riskZones: [
    { city: "Mumbai", level: "High", users: 3200, claims: 520 },
    { city: "Bengaluru", level: "Medium", users: 2800, claims: 280 },
    { city: "Delhi", level: "High", users: 2400, claims: 490 },
    { city: "Chennai", level: "Medium", users: 1800, claims: 210 },
    { city: "Hyderabad", level: "Low", users: 1500, claims: 120 },
    { city: "Pune", level: "Low", users: 1147, claims: 90 },
  ],
};

export const mockNoClaimBonus = {
  currentStreak: 3,
  bonusAmount: 15,
  nextMilestone: 5,
  nextBonusAmount: 25,
};
