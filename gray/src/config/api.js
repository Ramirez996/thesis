// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL ||
                     import.meta.env.VITE_BACKEND_URL || 
                     'http://127.0.0.1:5000';

const normalizedBaseURL = API_BASE_URL.replace(/\/$/, '');

export const API_CONFIG = {
  BASE_URL: normalizedBaseURL,
  ENDPOINTS: {
    HEALTH: '/',
    HEALTH_CHECK: '/health',
    GAD7_RISK: '/gad7_risk',
    PHQ9_RISK: '/phq9_risk',
    BFI10_RISK: '/bfi10_risk',
    WHO5_RISK: '/who5_risk',
    POSTS: '/posts',
    TRAIN: '/train',
    TRAINING_STATUS: '/training_status',
    ANALYZE: '/analyze'
  }
};

export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint] || endpoint}`;
};

export const API_URL = API_CONFIG.BASE_URL;

export default API_CONFIG;