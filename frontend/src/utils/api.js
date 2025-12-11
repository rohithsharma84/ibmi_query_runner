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
  getAll: (params) => api.get('/query-sets', { params }).then(res => {
    // Normalize DB uppercase column names to frontend expected snake_case
    if (res?.data?.querySets && Array.isArray(res.data.querySets)) {
      res.data.querySets = res.data.querySets.map(normalizeQuerySet)
    }
    return res
  }),
  getById: (id) => api.get(`/query-sets/${id}`).then(res => {
    if (res?.data?.querySet) res.data.querySet = normalizeQuerySet(res.data.querySet)
    return res
  }),
  createFromPlanCache: (data) => api.post('/query-sets/from-plan-cache', data).then(res => {
    if (res?.data?.querySet) res.data.querySet = normalizeQuerySet(res.data.querySet)
    return res
  }),
  createManual: (data) => api.post('/query-sets/manual', data).then(res => {
    if (res?.data?.querySet) res.data.querySet = normalizeQuerySet(res.data.querySet)
    return res
  }),
  update: (id, data) => api.put(`/query-sets/${id}`, data),
  remove: (id) => api.delete(`/query-sets/${id}`),
  refresh: (id) => api.post(`/query-sets/${id}/refresh`)
}

// Helper: normalize DB-returned query set keys (uppercase) to snake_case used by frontend
function normalizeQuerySet(qs) {
  if (!qs || typeof qs !== 'object') return qs

  const normalized = {}

  // Prefer canonical DB/response values (uppercase), then common variants
  const id = qs.SET_ID ?? qs.Set_Id ?? qs.setId ?? qs.set_id ?? qs.id
  const name = qs.SET_NAME ?? qs.set_name ?? qs.setName ?? qs.name
  const description = qs.SET_DESCRIPTION ?? qs.DESCRIPTION ?? qs.description
  const userProfile = qs.SOURCE_USER_PROFILE ?? qs.USER_PROFILE ?? qs.user_profile ?? qs.userProfile
  const createdBy = qs.CREATED_BY ?? qs.created_by ?? qs.createdBy
  const createdAt = qs.CREATED_AT ?? qs.created_at ?? qs.createdAt
  const lastRefreshed = qs.LAST_REFRESHED ?? qs.LAST_REFRESHED_AT ?? qs.last_refreshed_at ?? qs.last_refreshed
  const queryCount = qs.QUERY_COUNT ?? qs.query_count ?? qs.queryCount ?? 0

  // Provide both snake_case and camelCase keys so different views/components can use either
  normalized.set_id = id
  normalized.setId = id

  normalized.set_name = name
  normalized.setName = name

  normalized.description = description

  normalized.user_profile = userProfile
  normalized.userProfile = userProfile

  normalized.created_by = createdBy
  normalized.createdBy = createdBy

  normalized.created_at = createdAt
  normalized.createdAt = createdAt

  normalized.last_refreshed_at = lastRefreshed
  normalized.lastRefreshedAt = lastRefreshed

  normalized.query_count = queryCount
  normalized.queryCount = queryCount

  // Copy other properties to lowercase/camel keys as fallbacks, without overwriting
  Object.keys(qs).forEach(k => {
    const lower = k.toLowerCase()
    if (!normalized.hasOwnProperty(lower)) {
      // map the original value to a lowercase key if not present
      normalized[lower] = qs[k]
    }
    // also provide camelCase version for convenience if it looks like a compound key
    const camel = lower.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    if (!normalized.hasOwnProperty(camel)) {
      normalized[camel] = qs[k]
    }
  })

  return normalized
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