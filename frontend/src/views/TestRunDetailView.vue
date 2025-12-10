<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <router-link to="/test-runs" class="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center">
        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Test Runs
      </router-link>
      
      <div v-if="loading" class="flex items-center mt-2">
        <div class="spinner w-8 h-8 text-primary-600"></div>
        <span class="ml-3 text-gray-600">Loading test run...</span>
      </div>

      <div v-else-if="testRun" class="flex justify-between items-start mt-2">
        <div>
          <div class="flex items-center">
            <h1 class="text-3xl font-bold text-gray-900">{{ testRun.run_name }}</h1>
            <span class="ml-3 badge" :class="getStatusBadgeClass(testRun.status)">
              {{ testRun.status }}
            </span>
          </div>
          <p v-if="testRun.description" class="text-gray-600 mt-2">{{ testRun.description }}</p>
          <div class="flex items-center space-x-4 mt-3 text-sm text-gray-500">
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              {{ testRun.query_set_name }}
            </span>
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ formatDate(testRun.created_at) }}
            </span>
            <span class="badge" :class="getMetricsLevelBadgeClass(testRun.metrics_level)">
              {{ testRun.metrics_level }}
            </span>
          </div>
        </div>

        <div class="flex space-x-2">
          <button
            v-if="testRun.status === 'COMPLETED'"
            @click="showCompareModal = true"
            class="btn-secondary"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Compare
          </button>
          <button
            v-if="testRun.status === 'RUNNING'"
            @click="cancelRun"
            class="btn-danger"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert-danger mb-6">
      {{ error }}
    </div>

    <!-- Summary Cards -->
    <div v-if="!loading && testRun" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="card">
        <div class="text-sm font-medium text-gray-600 mb-1">Total Executions</div>
        <div class="text-3xl font-bold text-gray-900">{{ formatNumber(testRun.total_executions) }}</div>
        <div class="text-sm text-gray-500 mt-1">
          {{ testRun.iterations }} × {{ testRun.total_queries }} queries
        </div>
      </div>

      <div class="card">
        <div class="text-sm font-medium text-gray-600 mb-1">Success Rate</div>
        <div class="text-3xl font-bold" :class="testRun.success_rate >= 95 ? 'text-success-600' : 'text-warning-600'">
          {{ formatPercentage(testRun.success_rate, 1) }}
        </div>
        <div class="text-sm text-gray-500 mt-1">
          {{ formatNumber(testRun.successful_executions) }} / {{ formatNumber(testRun.total_executions) }}
        </div>
      </div>

      <div class="card">
        <div class="text-sm font-medium text-gray-600 mb-1">Total Duration</div>
        <div class="text-3xl font-bold text-gray-900">{{ formatDuration(testRun.total_duration) }}</div>
        <div class="text-sm text-gray-500 mt-1">
          Avg: {{ formatDuration(testRun.avg_duration) }}
        </div>
      </div>

      <div class="card">
        <div class="text-sm font-medium text-gray-600 mb-1">Failed Queries</div>
        <div class="text-3xl font-bold" :class="testRun.failed_executions > 0 ? 'text-danger-600' : 'text-success-600'">
          {{ formatNumber(testRun.failed_executions) }}
        </div>
        <div class="text-sm text-gray-500 mt-1">
          {{ testRun.failed_queries }} unique queries
        </div>
      </div>
    </div>

    <!-- Progress Bar for Running Tests -->
    <div v-if="testRun && testRun.status === 'RUNNING'" class="card mb-8">
      <h2 class="text-xl font-semibold mb-4">Execution Progress</h2>
      <div class="space-y-4">
        <div>
          <div class="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{{ progress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div
              class="bg-primary-600 h-3 rounded-full transition-all duration-300"
              :style="{ width: progress + '%' }"
            ></div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Completed:</span>
            <span class="font-medium ml-2">{{ testRun.successful_executions || 0 }}</span>
          </div>
          <div>
            <span class="text-gray-600">Failed:</span>
            <span class="font-medium ml-2 text-danger-600">{{ testRun.failed_executions || 0 }}</span>
          </div>
          <div>
            <span class="text-gray-600">Remaining:</span>
            <span class="font-medium ml-2">{{ testRun.total_executions - (testRun.successful_executions || 0) - (testRun.failed_executions || 0) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Query Results -->
    <div v-if="!loading && testRun && testRun.status === 'COMPLETED'" class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Query Results</h2>
        <div class="flex space-x-2">
          <button
            @click="sortBy = 'sequence'"
            class="btn-secondary btn-sm"
            :class="{ 'bg-primary-100': sortBy === 'sequence' }"
          >
            Sequence
          </button>
          <button
            @click="sortBy = 'duration'"
            class="btn-secondary btn-sm"
            :class="{ 'bg-primary-100': sortBy === 'duration' }"
          >
            Duration
          </button>
          <button
            @click="sortBy = 'failures'"
            class="btn-secondary btn-sm"
            :class="{ 'bg-primary-100': sortBy === 'failures' }"
          >
            Failures
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th class="w-12">#</th>
              <th>SQL Statement</th>
              <th class="w-32">Executions</th>
              <th class="w-32">Avg Duration</th>
              <th class="w-32">Min / Max</th>
              <th class="w-32">Success Rate</th>
              <th class="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="query in sortedQueryResults" :key="query.query_id">
              <td class="font-medium">{{ query.sequence_number }}</td>
              <td>
                <div class="font-mono text-sm" :title="query.sql_text">
                  {{ formatSQL(query.sql_text, 80) }}
                </div>
              </td>
              <td>{{ formatNumber(query.execution_count) }}</td>
              <td>{{ formatDuration(query.avg_duration) }}</td>
              <td class="text-sm">
                {{ formatDuration(query.min_duration) }} / {{ formatDuration(query.max_duration) }}
              </td>
              <td>
                <span
                  class="badge"
                  :class="query.success_rate >= 95 ? 'badge-success' : query.success_rate >= 80 ? 'badge-warning' : 'badge-danger'"
                >
                  {{ formatPercentage(query.success_rate, 0) }}
                </span>
              </td>
              <td>
                <button
                  @click="viewQueryDetails(query)"
                  class="text-primary-600 hover:text-primary-700"
                  title="View details"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Query Details Modal -->
    <div v-if="selectedQuery" class="modal" @click.self="selectedQuery = null">
      <div class="modal-content max-w-4xl">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">Query Execution Details</h3>
          <button
            @click="selectedQuery = null"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">SQL Statement</label>
            <pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">{{ selectedQuery.sql_text }}</pre>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="card">
              <div class="text-sm font-medium text-gray-600 mb-1">Total Executions</div>
              <div class="text-2xl font-bold text-gray-900">{{ formatNumber(selectedQuery.execution_count) }}</div>
            </div>
            <div class="card">
              <div class="text-sm font-medium text-gray-600 mb-1">Success Rate</div>
              <div class="text-2xl font-bold" :class="selectedQuery.success_rate >= 95 ? 'text-success-600' : 'text-warning-600'">
                {{ formatPercentage(selectedQuery.success_rate, 1) }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="card">
              <div class="text-sm font-medium text-gray-600 mb-1">Avg Duration</div>
              <div class="text-xl font-bold text-gray-900">{{ formatDuration(selectedQuery.avg_duration) }}</div>
            </div>
            <div class="card">
              <div class="text-sm font-medium text-gray-600 mb-1">Min Duration</div>
              <div class="text-xl font-bold text-success-600">{{ formatDuration(selectedQuery.min_duration) }}</div>
            </div>
            <div class="card">
              <div class="text-sm font-medium text-gray-600 mb-1">Max Duration</div>
              <div class="text-xl font-bold text-danger-600">{{ formatDuration(selectedQuery.max_duration) }}</div>
            </div>
          </div>

          <div v-if="selectedQuery.failed_count > 0" class="alert alert-warning">
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <span>{{ selectedQuery.failed_count }} execution(s) failed</span>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button @click="selectedQuery = null" class="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Compare Modal -->
    <div v-if="showCompareModal" class="modal" @click.self="showCompareModal = false">
      <div class="modal-content">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">Create Comparison</h3>
          <button
            @click="showCompareModal = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p class="text-gray-600 mb-4">Compare this test run with another to identify performance changes.</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Compare With <span class="text-danger-600">*</span>
            </label>
            <select v-model="compareWithRunId" class="input">
              <option value="">Select a test run</option>
              <option
                v-for="run in availableTestRuns"
                :key="run.run_id"
                :value="run.run_id"
              >
                {{ run.run_name }} - {{ formatDate(run.created_at) }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Deviation Threshold (%)
            </label>
            <input
              v-model.number="deviationThreshold"
              type="number"
              min="0"
              max="100"
              class="input"
              placeholder="e.g., 10"
            />
            <p class="text-xs text-gray-500 mt-1">Flag queries with performance changes exceeding this percentage</p>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="showCompareModal = false"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button
            @click="createComparison"
            :disabled="!compareWithRunId || comparing"
            class="btn-primary"
          >
            <span v-if="comparing" class="flex items-center">
              <span class="spinner w-5 h-5 mr-2"></span>
              Creating...
            </span>
            <span v-else>Create Comparison</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Overlays -->
    <div v-if="selectedQuery || showCompareModal" class="modal-overlay"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { testRunsAPI, comparisonsAPI } from '@/utils/api'
import { formatDate, formatDuration, formatNumber, formatPercentage, formatSQL, getStatusBadgeClass, getMetricsLevelBadgeClass } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()
const runId = route.params.id

const loading = ref(true)
const comparing = ref(false)
const error = ref(null)
const testRun = ref(null)
const queryResults = ref([])
const selectedQuery = ref(null)
const showCompareModal = ref(false)
const sortBy = ref('sequence')
const availableTestRuns = ref([])
const compareWithRunId = ref('')
const deviationThreshold = ref(10)

let refreshInterval = null

const progress = computed(() => {
  if (!testRun.value || testRun.value.status !== 'RUNNING') return 0
  const completed = (testRun.value.successful_executions || 0) + (testRun.value.failed_executions || 0)
  return Math.round((completed / testRun.value.total_executions) * 100)
})

const sortedQueryResults = computed(() => {
  const results = [...queryResults.value]
  
  switch (sortBy.value) {
    case 'duration':
      return results.sort((a, b) => b.avg_duration - a.avg_duration)
    case 'failures':
      return results.sort((a, b) => b.failed_count - a.failed_count)
    default: // sequence
      return results.sort((a, b) => a.sequence_number - b.sequence_number)
  }
})

onMounted(async () => {
  await loadTestRun()
  
  // Auto-refresh for running tests
  if (testRun.value && testRun.value.status === 'RUNNING') {
    refreshInterval = setInterval(loadTestRun, 3000) // Refresh every 3 seconds
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

async function loadTestRun() {
  loading.value = true
  error.value = null

  try {
    const response = await testRunsAPI.getById(runId)
    testRun.value = response.data.testRun

    // Load results if completed
    if (testRun.value.status === 'COMPLETED') {
      const resultsResponse = await testRunsAPI.getResults(runId)
      queryResults.value = resultsResponse.data.queryResults || []
      
      // Stop auto-refresh
      if (refreshInterval) {
        clearInterval(refreshInterval)
        refreshInterval = null
      }
      
      // Load available test runs for comparison
      await loadAvailableTestRuns()
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load test run'
  } finally {
    loading.value = false
  }
}

async function loadAvailableTestRuns() {
  try {
    const response = await testRunsAPI.getBySetId(testRun.value.set_id)
    availableTestRuns.value = (response.data.testRuns || [])
      .filter(run => run.run_id !== parseInt(runId) && run.status === 'COMPLETED')
  } catch (err) {
    console.error('Failed to load available test runs:', err)
  }
}

function viewQueryDetails(query) {
  selectedQuery.value = query
}

async function cancelRun() {
  if (!confirm('Are you sure you want to cancel this test run?')) return

  try {
    await testRunsAPI.cancel(runId)
    await loadTestRun()
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to cancel test run'
  }
}

async function createComparison() {
  if (!compareWithRunId.value) return

  comparing.value = true
  error.value = null

  try {
    const data = {
      baselineRunId: parseInt(compareWithRunId.value),
      comparisonRunId: parseInt(runId),
      deviationThreshold: deviationThreshold.value || 10
    }

    const response = await comparisonsAPI.create(data)
    const comparisonId = response.data.comparisonId

    showCompareModal.value = false
    router.push(`/comparisons/${comparisonId}`)
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create comparison'
  } finally {
    comparing.value = false
  }
}
</script>