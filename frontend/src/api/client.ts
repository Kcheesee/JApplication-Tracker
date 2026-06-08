import axios from 'axios'

const normalizeApiUrl = (url?: string) => {
  const value = url || 'http://localhost:8000'
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value.replace(/\/$/, '')
  }
  if (value.startsWith('localhost') || value.startsWith('127.0.0.1')) {
    return `http://${value}`.replace(/\/$/, '')
  }
  return `https://${value}`.replace(/\/$/, '')
}

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL)

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  withCredentials: true,  // Important: Send cookies with requests
})

// Add auth token to requests (for backwards compatibility with Bearer tokens)
// The backend now primarily uses httpOnly cookies, but still supports Bearer tokens
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401s from OUR backend, not from third-party APIs
    // Check if the error is from our API by looking at the request URL
    const isOurApi = error.config?.baseURL === API_URL ||
                     error.config?.url?.startsWith(API_URL) ||
                     error.config?.url?.startsWith('/api');

    if (error.response?.status === 401 && isOurApi) {
      // Clear any stored tokens
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
