import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.is_admin === 1)
  const userProfile = computed(() => user.value?.user_profile || '')

  // Actions
  async function login(credentials) {
    loading.value = true
    error.value = null

    try {
      const response = await authAPI.login(credentials)
      const { token: authToken, user: userData } = response.data

      token.value = authToken
      user.value = userData

      // Store token in localStorage
      localStorage.setItem('token', authToken)

      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.error || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authAPI.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Clear state regardless of API call result
      token.value = null
      user.value = null
      localStorage.removeItem('token')
    }
  }

  async function checkSession() {
    if (!token.value) {
      return false
    }

    try {
      const response = await authAPI.checkSession()
      user.value = response.data.user
      return true
    } catch (err) {
      // Session invalid, clear auth
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      return false
    }
  }

  // Helpers to allow external bootstrap to hydrate state
  function setToken(t) {
    token.value = t
  }
  function setUser(u) {
    user.value = u
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    token,
    loading,
    error,
    // Getters
    isAuthenticated,
    isAdmin,
    userProfile,
    // Actions
    login,
    logout,
    checkSession,
    clearError,
    setToken,
    setUser
  }
})