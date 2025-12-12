import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/views/LayoutView.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue')
        },
        {
          path: 'query-sets',
          name: 'query-sets',
          component: () => import('@/views/QuerySetsView.vue')
        },
        {
          path: 'query-sets/:id',
          name: 'query-set-detail',
          component: () => import('@/views/QuerySetDetailView.vue')
        },
        {
          path: 'query-sets/create',
          name: 'query-set-create',
          component: () => import('@/views/QuerySetCreateView.vue')
        },
        {
          path: 'test-runs',
          name: 'test-runs',
          component: () => import('@/views/TestRunsView.vue')
        },
        {
          path: 'test-runs/:id',
          name: 'test-run-detail',
          component: () => import('@/views/TestRunDetailView.vue')
        },
        {
          path: 'comparisons',
          name: 'comparisons',
          component: () => import('@/views/ComparisonsView.vue')
        },
        {
          path: 'comparisons/:id',
          name: 'comparison-detail',
          component: () => import('@/views/ComparisonDetailView.vue')
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/UsersView.vue'),
          meta: { requiresAdmin: true }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue')
    }
  ]
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const hasToken = !!(authStore.token || (typeof localStorage !== 'undefined' && localStorage.getItem('token')))
  
  // Allow navigation if a token exists but user hasn't hydrated yet; bootstrap in main.js will validate session
  if (to.meta.requiresAuth && !authStore.isAuthenticated && !hasToken) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'dashboard' })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router