import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
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
