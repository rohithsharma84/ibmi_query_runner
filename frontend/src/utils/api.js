import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Read token from localStorage (persistent across refresh)
function getPersistedToken() {
  try {
    return localStorage.getItem('token') || null
  } catch {
    return null
  }
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    // prefer store token, fallback to localStorage for hard refresh
    const token = authStore.token || getPersistedToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
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
      // Token expired or invalid: clear persisted token and redirect
      try { localStorage.removeItem('token') } catch {}
      // Clear locally to avoid calling backend logout without a token
      if (authStore?.clearSession) authStore.clearSession()
      // Optional: avoid redirect loops; only redirect on explicit auth endpoints or first load
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// API endpoints
export const authAPI = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials)
    // Persist token so session survives browser refresh
    const token = res?.data?.token
    if (token) {
      try { localStorage.setItem('token', token) } catch {}
      // hydrate store if available
      const authStore = useAuthStore()
      if (authStore?.setToken) authStore.setToken(token)
    }
    return res
  },
  logout: () => api.post('/auth/logout'),
  checkSession: () => api.get('/auth/session')
}

// Optional: helper to initialize auth on app startup
export async function initAuthSession() {
  const token = getPersistedToken()
  const authStore = useAuthStore()
  if (token && authStore?.setToken) authStore.setToken(token)
  try {
    const res = await api.get('/auth/session')
    return res?.data || { authenticated: false }
  } catch {
    return { authenticated: false }
  }
}

export const usersAPI = {
  getAll: () => api.get('/users').then(res => {
    // Normalize backend payload { success, users: [...] } to array with expected keys
    const users = Array.isArray(res?.data?.users) ? res.data.users.map(normalizeUser) : []
    return { data: users }
  }),
  create: (userData) => api.post('/users', userData),
  update: (userId, userData) => api.put(`/users/${userId}`, userData),
  remove: (userId) => api.delete(`/users/${userId}`)
}

// Helper: normalize user payload from backend to frontend expected keys
function normalizeUser(u) {
  if (!u || typeof u !== 'object') return u
  const userId = u.USER_ID ?? u.userId ?? u.user_id ?? u.user_profile
  const isAdmin = u.IS_ADMIN ?? u.isAdmin ?? u.is_admin
  const createdAt = u.CREATED_AT ?? u.createdAt ?? u.created_at
  const lastLogin = u.LAST_LOGIN ?? u.lastLogin ?? u.last_login

  return {
    user_profile: userId,
    userId,
    user_name: u.USER_NAME ?? u.userName ?? u.user_name ?? userId,
    is_admin: isAdmin === 'Y' || isAdmin === 1 || isAdmin === true,
    is_active: u.IS_ACTIVE === 'Y' || u.is_active === true || true, // default to true if not provided
    created_at: createdAt,
    modified_at: u.MODIFIED_AT ?? u.modifiedAt ?? u.modified_at ?? null,
    last_login: lastLogin
  }
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
    if (res?.data?.querySet) {
      // Normalize the query set object
      res.data.querySet = normalizeQuerySet(res.data.querySet)
      // Normalize nested queries inside querySet if present
      if (Array.isArray(res.data.querySet.queries)) {
        res.data.querySet.queries = res.data.querySet.queries.map(normalizeQuery)
      }
    }
    // Also normalize top-level queries array for compatibility
    if (Array.isArray(res?.data?.queries)) {
      res.data.queries = res.data.queries.map(normalizeQuery)
    }
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

// Helper: normalize query payload keys from DB (uppercase) to frontend expected snake_case
function normalizeQuery(q) {
  if (!q || typeof q !== 'object') return q

  const normalized = {}
  // Map known fields
  normalized.query_id = q.QUERY_ID ?? q.query_id
  normalized.set_id = q.SET_ID ?? q.set_id
  normalized.sql_text = q.QUERY_TEXT ?? q.sql_text
  normalized.query_hash = q.QUERY_HASH ?? q.query_hash
  normalized.sequence_number = q.SEQUENCE_NUMBER ?? q.sequence_number ?? q.SEQUENCE_NUM ?? q.sequence_num
  normalized.query_name = q.QUERY_NAME ?? q.query_name
  normalized.original_user = q.ORIGINAL_USER ?? q.original_user
  normalized.original_run_count = q.ORIGINAL_RUN_COUNT ?? q.original_run_count
  normalized.added_at = q.ADDED_AT ?? q.added_at
  normalized.is_active = q.IS_ACTIVE === 'Y' || q.is_active === true || true

  // Provide camelCase counterparts for convenience
  normalized.queryId = normalized.query_id
  normalized.setId = normalized.set_id
  normalized.sqlText = normalized.sql_text
  normalized.queryHash = normalized.query_hash
  normalized.sequenceNumber = normalized.sequence_number
  normalized.queryName = normalized.query_name
  normalized.originalUser = normalized.original_user
  normalized.originalRunCount = normalized.original_run_count
  normalized.addedAt = normalized.added_at

  return normalized
}

export const queriesAPI = {
  getById: (id) => api.get(`/queries/${id}`),
  // Add a new query to a specific set
  addToSet: (setId, data) => api.post(`/queries/sets/${setId}`, data),
  // Update a specific query by ID
  update: (id, data) => api.put(`/queries/${id}`, data),
  // Delete a specific query by ID
  remove: (id) => api.delete(`/queries/${id}`),
  // Reorder queries within a set
  reorder: (setId, data) => api.post(`/queries/sets/${setId}/reorder`, data)
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