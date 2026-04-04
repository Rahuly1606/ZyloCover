import API from './api'

export const userService = {
  getProfile: () => API.get('/user/profile'),

  updateLocation: (lat: number, lng: number) => 
    API.put('/user/profile', { latitude: lat, longitude: lng }),

  updateProfile: (data: any) => 
    API.put('/user/profile', data),

  updateIncome: (avg_daily_income: number) =>
    API.put('/user/profile', { avg_daily_income })
}
