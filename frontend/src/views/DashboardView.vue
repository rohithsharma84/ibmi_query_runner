<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-600 mt-2">Welcome to IBM i Query Runner</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Query Sets</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.querySets }}</p>
          </div>
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Test Runs</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.testRuns }}</p>
          </div>
          <div class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Comparisons</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.comparisons }}</p>
          </div>
          <div class="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Active Runs</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.activeRuns }}</p>
          </div>
          <div class="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card mb-8">
      <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <router-link
          to="/query-sets/create"
          class="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
        >
          <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center mr-4">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-gray-900">Create Query Set</p>
            <p class="text-sm text-gray-600">Import from plan cache</p>
          </div>
        </router-link>

        <router-link
          to="/query-sets"
          class="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
        >
          <div class="w-10 h-10 bg-success-600 rounded-lg flex items-center justify-center mr-4">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-gray-900">Run Tests</p>
            <p class="text-sm text-gray-600">Execute query sets</p>
          </div>
        </router-link>

        <router-link
          to="/comparisons"
          class="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
        >
          <div class="w-10 h-10 bg-warning-600 rounded-lg flex items-center justify-center mr-4">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-gray-900">Compare Results</p>
            <p class="text-sm text-gray-600">Analyze performance</p>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Getting Started -->
    <div class="card">
      <h2 class="text-xl font-semibold mb-4">Getting Started</h2>
      <div class="space-y-4">
        <div class="flex items-start">
          <div class="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
            1
          </div>
          <div class="ml-4">
            <h3 class="font-medium text-gray-900">Create a Query Set</h3>
            <p class="text-sm text-gray-600 mt-1">
              Import queries from the SQL plan cache by user profile, or create a custom set manually.
            </p>
          </div>
        </div>

        <div class="flex items-start">
          <div class="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
            2
          </div>
          <div class="ml-4">
            <h3 class="font-medium text-gray-900">Run Performance Tests</h3>
            <p class="text-sm text-gray-600 mt-1">
              Execute your query set multiple times (1-1000 iterations) with configurable metrics collection levels.
            </p>
          </div>
        </div>

        <div class="flex items-start">
          <div class="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
            3
          </div>
          <div class="ml-4">
            <h3 class="font-medium text-gray-900">Compare Results</h3>
            <p class="text-sm text-gray-600 mt-1">
              Compare test runs before and after system changes to identify performance deviations.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { querySetsAPI, testRunsAPI, comparisonsAPI } from '@/utils/api'

const stats = ref({
  querySets: 0,
  testRuns: 0,
  comparisons: 0,
  activeRuns: 0
})

onMounted(async () => {
  await loadStats()
})

async function loadStats() {
  try {
    const [querySetsRes, testRunsRes, comparisonsRes] = await Promise.all([
      querySetsAPI.getAll(),
      testRunsAPI.getAll(),
      comparisonsAPI.getAll()
    ])

    stats.value.querySets = querySetsRes.data.total || 0
    stats.value.testRuns = testRunsRes.data.total || 0
    stats.value.comparisons = comparisonsRes.data.total || 0
    
    // Count active runs
    const activeRuns = testRunsRes.data.testRuns?.filter(
      run => run.status === 'RUNNING'
    ) || []
    stats.value.activeRuns = activeRuns.length
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}
</script>