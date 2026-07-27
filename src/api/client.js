import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://moneymapper-api.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('mm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (localStorage.getItem('mm_preview_mode') === 'true') {
    config.adapter = async function(config) {
      const url = config.url || '';
      let data = {};
      
      try {
        if (url.includes('/api/dashboard')) {
          const m = await import('../mockData/dashboard.js');
          data = m.dashboardData;
        } else if (url.includes('/api/weekly')) {
          const m = await import('../mockData/weekly.js');
          data = m.weeklyInitialData;
        } else if (url.includes('/api/profile/master')) {
          const m = await import('../mockData/masterData.js');
          data = m.masterDataDefaults;
        } else if (url.includes('/api/achievements')) {
          const m = await import('../mockData/achievements.js');
          data = { achievements: m.achievements };
        } else if (url.includes('/api/leaderboard')) {
          const m = await import('../mockData/achievements.js');
          data = { leaderboard: m.leaderboard };
        } else if (url.includes('/api/recommendations/hub')) {
          const m = await import('../mockData/recommendations.js');
          data = m.recommendationsHub;
        } else if (url.includes('/api/pillars')) {
          const m = await import('../mockData/pillars.js');
          data = m.pillarsData;
        }
      } catch (e) {
        console.warn('Mock not found for', url);
      }
      
      return {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {}
      };
    };
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
client.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('mm_token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

export default client;
