import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authStore = useAuthStore()
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      authStore.logout()
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

export default api

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  checkSession: () => api.get('/auth/session')
}

export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (userData) => api.post('/users', userData),
  update: (userId, userData) => api.put(`/users/${userId}`, userData),
  remove: (userId) => api.delete(`/users/${userId}`)
}

export const planCacheAPI = {
  getViews: () => api.get('/plan-cache/views'),
  query: (params) => api.get('/plan-cache/query', { params }),
  preview: (params) => api.post('/plan-cache/preview', params)
}

export const querySetsAPI = {
  getAll: (params) => api.get('/query-sets', { params }),
  getById: (id) => api.get(`/query-sets/${id}`),
  createFromPlanCache: (data) => api.post('/query-sets/from-plan-cache', data),
  createManual: (data) => api.post('/query-sets/manual', data),
  update: (id, data) => api.put(`/query-sets/${id}`, data),
  remove: (id) => api.delete(`/query-sets/${id}`),
  refresh: (id) => api.post(`/query-sets/${id}/refresh`)
}

export const queriesAPI = {
  getById: (id) => api.get(`/queries/${id}`),
  addToSet: (data) => api.post('/queries', data),
  update: (id, data) => api.put(`/queries/${id}`, data),
  remove: (id) => api.delete(`/queries/${id}`),
  reorder: (id, data) => api.put(`/queries/${id}/reorder`, data)
}

export const testRunsAPI = {
  getAll: (params) => api.get('/test-runs', { params }),
  getById: (id) => api.get(`/test-runs/${id}`),
  getBySetId: (setId) => api.get(`/test-runs/set/${setId}`),
  create: (data) => api.post('/test-runs', data),
  execute: (id) => api.post(`/test-runs/${id}/execute`),
  cancel: (id) => api.post(`/test-runs/${id}/cancel`),
  remove: (id) => api.delete(`/test-runs/${id}`),
  getResults: (id) => api.get(`/test-runs/${id}/results`)
}

export const comparisonsAPI = {
  getAll: (params) => api.get('/comparisons', { params }),
  getById: (id) => api.get(`/comparisons/${id}`),
  create: (data) => api.post('/comparisons', data),
  getSummary: (id) => api.get(`/comparisons/${id}/summary`),
  getDeviations: (id, params) => api.get(`/comparisons/${id}/deviations`, { params }),
  remove: (id) => api.delete(`/comparisons/${id}`)
}