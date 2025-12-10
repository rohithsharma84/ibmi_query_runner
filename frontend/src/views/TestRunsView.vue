<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Test Runs</h1>
        <p class="text-gray-600 mt-2">Execute and monitor query performance tests</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="btn-primary"
      >
        <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create Test Run
      </button>
    </div>

    <!-- Filters -->
    <div class="card mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select v-model="filters.status" class="input">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Query Set</label>
          <select v-model="filters.setId" class="input">
            <option value="">All Query Sets</option>
            <option v-for="set in querySets" :key="set.set_id" :value="set.set_id">
              {{ set.set_name }}
            </option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="applyFilters"
            class="btn-primary w-full"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="spinner w-12 h-12 text-primary-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="testRuns.length === 0" class="card text-center py-12">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Test Runs</h3>
      <p class="text-gray-600 mb-6">Create your first test run to start measuring query performance</p>
      <button
        @click="showCreateModal = true"
        class="btn-primary"
      >
        Create Test Run
      </button>
    </div>

    <!-- Test Runs List -->
    <div v-else class="space-y-4">
      <div
        v-for="run in testRuns"
        :key="run.run_id"
        class="card hover:shadow-lg transition-shadow cursor-pointer"
        @click="viewTestRun(run.run_id)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center">
              <h3 class="text-lg font-semibold text-gray-900">{{ run.run_name }}</h3>
              <span class="ml-3 badge" :class="getStatusBadgeClass(run.status)">
                {{ run.status }}
              </span>
              <span class="ml-2 badge" :class="getMetricsLevelBadgeClass(run.metrics_level)">
                {{ run.metrics_level }}
              </span>
            </div>
            
            <p class="text-gray-600 mt-2">{{ run.query_set_name }}</p>
            
            <div class="flex items-center space-x-6 mt-3 text-sm text-gray-500">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {{ run.iterations }} iterations
              </span>
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {{ run.total_queries }} queries
              </span>
              <span v-if="run.status === 'COMPLETED'" class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ formatDuration(run.total_duration) }}
              </span>
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ formatDate(run.created_at) }}
              </span>
            </div>

            <!-- Progress Bar for Running Tests -->
            <div v-if="run.status === 'RUNNING' && run.progress !== undefined" class="mt-4">
              <div class="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{{ run.progress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: run.progress + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="flex space-x-2 ml-4">
            <button
              v-if="run.status === 'RUNNING'"
              @click.stop="cancelTestRun(run.run_id)"
              class="btn-danger btn-sm"
              title="Cancel test run"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              v-if="run.status === 'COMPLETED'"
              @click.stop="viewResults(run.run_id)"
              class="btn-primary btn-sm"
              title="View results"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button
              @click.stop="deleteTestRun(run.run_id)"
              class="btn-danger btn-sm"
              title="Delete test run"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Test Run Modal -->
    <div v-if="showCreateModal" class="modal" @click.self="showCreateModal = false">
      <div class="modal-content max-w-2xl">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">Create Test Run</h3>
          <button
            @click="showCreateModal = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="createTestRun" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Test Run Name <span class="text-danger-600">*</span>
            </label>
            <input
              v-model="newRun.runName"
              type="text"
              required
              maxlength="100"
              class="input"
              placeholder="e.g., Pre-Upgrade Baseline"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Query Set <span class="text-danger-600">*</span>
            </label>
            <select
              v-model="newRun.setId"
              required
              class="input"
            >
              <option value="">Select a query set</option>
              <option v-for="set in querySets" :key="set.set_id" :value="set.set_id">
                {{ set.set_name }} ({{ set.query_count }} queries)
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Number of Iterations <span class="text-danger-600">*</span>
            </label>
            <input
              v-model.number="newRun.iterations"
              type="number"
              required
              min="1"
              max="1000"
              class="input"
              placeholder="e.g., 10"
            />
            <p class="text-xs text-gray-500 mt-1">Each query will be executed this many times (1-1000)</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Metrics Collection Level <span class="text-danger-600">*</span>
            </label>
            <div class="space-y-2">
              <label class="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  v-model="newRun.metricsLevel"
                  type="radio"
                  value="BASIC"
                  class="mt-1 mr-3"
                />
                <div>
                  <div class="font-medium">Basic</div>
                  <div class="text-sm text-gray-600">Execution time only</div>
                </div>
              </label>
              <label class="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  v-model="newRun.metricsLevel"
                  type="radio"
                  value="STANDARD"
                  class="mt-1 mr-3"
                />
                <div>
                  <div class="font-medium">Standard</div>
                  <div class="text-sm text-gray-600">Execution time + row counts</div>
                </div>
              </label>
              <label class="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  v-model="newRun.metricsLevel"
                  type="radio"
                  value="COMPREHENSIVE"
                  class="mt-1 mr-3"
                />
                <div>
                  <div class="font-medium">Comprehensive</div>
                  <div class="text-sm text-gray-600">Full performance metrics (CPU, I/O, locks, etc.)</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              v-model="newRun.description"
              rows="3"
              maxlength="500"
              class="input"
              placeholder="Optional description"
            ></textarea>
          </div>

          <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-primary-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <div class="text-sm text-primary-800">
                <p class="font-medium mb-1">Test Execution</p>
                <p>The test will execute all queries in the selected set for the specified number of iterations. You can monitor progress in real-time.</p>
              </div>
            </div>
          </div>

          <div v-if="createError" class="alert alert-danger">
            {{ createError }}
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="showCreateModal = false"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="creating || !isFormValid"
              class="btn-primary"
            >
              <span v-if="creating" class="flex items-center">
                <span class="spinner w-5 h-5 mr-2"></span>
                Creating...
              </span>
              <span v-else>Create and Execute</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Overlay -->
    <div v-if="showCreateModal" class="modal-overlay"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { testRunsAPI, querySetsAPI } from '@/utils/api'
import { formatDate, formatDuration, getStatusBadgeClass, getMetricsLevelBadgeClass } from '@/utils/formatters'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const creating = ref(false)
const createError = ref(null)
const showCreateModal = ref(false)
const testRuns = ref([])
const querySets = ref([])

const filters = ref({
  status: '',
  setId: ''
})

const newRun = ref({
  runName: '',
  setId: '',
  iterations: 10,
  metricsLevel: 'STANDARD',
  description: ''
})

const isFormValid = computed(() => {
  return newRun.value.runName.trim().length > 0 &&
         newRun.value.setId &&
         newRun.value.iterations >= 1 &&
         newRun.value.iterations <= 1000 &&
         newRun.value.metricsLevel
})

onMounted(async () => {
  await Promise.all([
    loadTestRuns(),
    loadQuerySets()
  ])

  // Check if we should open create modal with a specific query set
  if (route.query.setId) {
    newRun.value.setId = parseInt(route.query.setId)
    showCreateModal.value = true
  }
})

async function loadTestRuns() {
  loading.value = true
  try {
    const params = {}
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.setId) params.setId = filters.value.setId

    const response = await testRunsAPI.getAll(params)
    testRuns.value = response.data.testRuns || []
  } catch (error) {
    console.error('Failed to load test runs:', error)
  } finally {
    loading.value = false
  }
}

async function loadQuerySets() {
  try {
    const response = await querySetsAPI.getAll()
    querySets.value = response.data.querySets || []
  } catch (error) {
    console.error('Failed to load query sets:', error)
  }
}

function applyFilters() {
  loadTestRuns()
}

async function createTestRun() {
  if (!isFormValid.value) return

  creating.value = true
  createError.value = null

  try {
    const data = {
      runName: newRun.value.runName.trim(),
      setId: parseInt(newRun.value.setId),
      iterations: newRun.value.iterations,
      metricsLevel: newRun.value.metricsLevel,
      description: newRun.value.description.trim() || undefined
    }

    const createResponse = await testRunsAPI.create(data)
    const runId = createResponse.data.runId

    // Execute the test run
    await testRunsAPI.execute(runId)

    showCreateModal.value = false
    resetForm()
    
    // Redirect to test run detail page
    router.push(`/test-runs/${runId}`)
  } catch (err) {
    createError.value = err.response?.data?.error || 'Failed to create test run'
  } finally {
    creating.value = false
  }
}

function resetForm() {
  newRun.value = {
    runName: '',
    setId: '',
    iterations: 10,
    metricsLevel: 'STANDARD',
    description: ''
  }
  createError.value = null
}

function viewTestRun(runId) {
  router.push(`/test-runs/${runId}`)
}

function viewResults(runId) {
  router.push(`/test-runs/${runId}`)
}

async function cancelTestRun(runId) {
  if (!confirm('Are you sure you want to cancel this test run?')) return

  try {
    await testRunsAPI.cancel(runId)
    await loadTestRuns()
  } catch (error) {
    console.error('Failed to cancel test run:', error)
    alert('Failed to cancel test run')
  }
}

async function deleteTestRun(runId) {
  if (!confirm('Are you sure you want to delete this test run? This action cannot be undone.')) return

  try {
    await testRunsAPI.remove(runId)
    await loadTestRuns()
  } catch (error) {
    console.error('Failed to delete test run:', error)
    alert('Failed to delete test run')
  }
}
</script>