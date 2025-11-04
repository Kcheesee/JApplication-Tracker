import React, { createContext, useContext, useState, useEffect } from 'react'
import apiClient from '../api/client'

interface User {
  id: number
  email: string
  username: string
  full_name: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, fullName?: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in (fetch current user from backend)
    const checkAuth = async () => {
      try {
        // First check localStorage for backwards compatibility
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
          setUser(JSON.parse(savedUser))
        }

        // Try to fetch current user (validates cookie/token)
        const response = await apiClient.get('/api/auth/me')
        setUser(response.data)
        localStorage.setItem('user', JSON.stringify(response.data))
      } catch (error) {
        // Not authenticated or token expired
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)

      const response = await apiClient.post('/api/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const { access_token, user } = response.data

      // Store token for backwards compatibility (backend now uses cookies)
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
    } catch (error: any) {
      // Re-throw with user-friendly message
      const message = error.response?.data?.detail || 'Login failed. Please check your credentials.'
      throw new Error(message)
    }
  }

  const register = async (email: string, username: string, password: string, fullName?: string) => {
    try {
      await apiClient.post('/api/auth/register', {
        email,
        username,
        password,
        full_name: fullName,
      })

      // Auto-login after registration
      await login(username, password)
    } catch (error: any) {
      // Re-throw with user-friendly message
      const message = error.response?.data?.detail || 'Registration failed. Please try again.'
      throw new Error(message)
    }
  }

  const logout = async () => {
    try {
      // Call backend logout endpoint to clear httpOnly cookie
      await apiClient.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage and state regardless of backend response
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
