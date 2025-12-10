<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Comparisons</h1>
        <p class="text-gray-600 mt-2">Compare test run results to identify performance changes</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="btn-primary"
      >
        <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create Comparison
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="spinner w-12 h-12 text-primary-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="comparisons.length === 0" class="card text-center py-12">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Comparisons</h3>
      <p class="text-gray-600 mb-6">Create your first comparison to analyze performance changes</p>
      <button
        @click="showCreateModal = true"
        class="btn-primary"
      >
        Create Comparison
      </button>
    </div>

    <!-- Comparisons List -->
    <div v-else class="space-y-4">
      <div
        v-for="comparison in comparisons"
        :key="comparison.comparison_id"
        class="card hover:shadow-lg transition-shadow cursor-pointer"
        @click="viewComparison(comparison.comparison_id)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ comparison.baseline_run_name }} vs {{ comparison.comparison_run_name }}
              </h3>
              <span class="ml-3 badge badge-primary">
                {{ comparison.queries_with_deviations }} deviations
              </span>
            </div>
            
            <div class="flex items-center space-x-6 mt-3 text-sm text-gray-500">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {{ comparison.total_queries }} queries compared
              </span>
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Threshold: {{ comparison.deviation_threshold }}%
              </span>
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ formatDate(comparison.created_at) }}
              </span>
            </div>

            <!-- Performance Summary -->
            <div v-if="comparison.avg_duration_change !== null" class="mt-4 grid grid-cols-3 gap-4">
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-xs text-gray-600 mb-1">Avg Duration Change</div>
                <div class="font-semibold" :class="getChangeColorClass(comparison.avg_duration_change)">
                  {{ formatPercentageChange(comparison.avg_duration_change).text }}
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-xs text-gray-600 mb-1">Improved Queries</div>
                <div class="font-semibold text-success-600">
                  {{ comparison.queries_improved }}
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-xs text-gray-600 mb-1">Degraded Queries</div>
                <div class="font-semibold text-danger-600">
                  {{ comparison.queries_degraded }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex space-x-2 ml-4">
            <button
              @click.stop="deleteComparison(comparison.comparison_id)"
              class="btn-danger btn-sm"
              title="Delete comparison"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Comparison Modal -->
    <div v-if="showCreateModal" class="modal" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">Create Comparison</h3>
          <button
            @click="showCreateModal = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p class="text-gray-600 mb-4">Compare two test runs to identify performance changes.</p>

        <form @submit.prevent="createComparison" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Baseline Test Run <span class="text-danger-600">*</span>
            </label>
            <select
              v-model="newComparison.baselineRunId"
              required
              class="input"
              @change="loadComparisonRuns"
            >
              <option value="">Select baseline test run</option>
              <option v-for="run in testRuns" :key="run.run_id" :value="run.run_id">
                {{ run.run_name }} - {{ formatDate(run.created_at) }}
              </option>
            </select>
            <p class="text-xs text-gray-500 mt-1">The original test run (e.g., before upgrade)</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Comparison Test Run <span class="text-danger-600">*</span>
            </label>
            <select
              v-model="newComparison.comparisonRunId"
              required
              class="input"
              :disabled="!newComparison.baselineRunId"
            >
              <option value="">Select comparison test run</option>
              <option
                v-for="run in availableComparisonRuns"
                :key="run.run_id"
                :value="run.run_id"
              >
                {{ run.run_name }} - {{ formatDate(run.created_at) }}
              </option>
            </select>
            <p class="text-xs text-gray-500 mt-1">The new test run (e.g., after upgrade)</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Deviation Threshold (%)
            </label>
            <input
              v-model.number="newComparison.deviationThreshold"
              type="number"
              min="0"
              max="100"
              class="input"
              placeholder="e.g., 10"
            />
            <p class="text-xs text-gray-500 mt-1">Flag queries with performance changes exceeding this percentage</p>
          </div>

          <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-primary-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <div class="text-sm text-primary-800">
                <p class="font-medium mb-1">Comparison Analysis</p>
                <p>The system will compare execution times and identify queries with significant performance changes.</p>
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
              <span v-else>Create Comparison</span>
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
import { useRouter } from 'vue-router'
import { comparisonsAPI, testRunsAPI } from '@/utils/api'
import { formatDate, formatPercentageChange } from '@/utils/formatters'

const router = useRouter()

const loading = ref(true)
const creating = ref(false)
const createError = ref(null)
const showCreateModal = ref(false)
const comparisons = ref([])
const testRuns = ref([])
const availableComparisonRuns = ref([])

const newComparison = ref({
  baselineRunId: '',
  comparisonRunId: '',
  deviationThreshold: 10
})

const isFormValid = computed(() => {
  return newComparison.value.baselineRunId &&
         newComparison.value.comparisonRunId &&
         newComparison.value.baselineRunId !== newComparison.value.comparisonRunId
})

onMounted(async () => {
  await Promise.all([
    loadComparisons(),
    loadTestRuns()
  ])
})

async function loadComparisons() {
  loading.value = true
  try {
    const response = await comparisonsAPI.getAll()
    comparisons.value = response.data.comparisons || []
  } catch (error) {
    console.error('Failed to load comparisons:', error)
  } finally {
    loading.value = false
  }
}

async function loadTestRuns() {
  try {
    const response = await testRunsAPI.getAll({ status: 'COMPLETED' })
    testRuns.value = response.data.testRuns || []
  } catch (error) {
    console.error('Failed to load test runs:', error)
  }
}

async function loadComparisonRuns() {
  if (!newComparison.value.baselineRunId) {
    availableComparisonRuns.value = []
    return
  }

  try {
    const baselineRun = testRuns.value.find(r => r.run_id === parseInt(newComparison.value.baselineRunId))
    if (baselineRun) {
      const response = await testRunsAPI.getBySetId(baselineRun.set_id)
      availableComparisonRuns.value = (response.data.testRuns || [])
        .filter(run => 
          run.run_id !== parseInt(newComparison.value.baselineRunId) && 
          run.status === 'COMPLETED'
        )
    }
  } catch (error) {
    console.error('Failed to load comparison runs:', error)
  }
}

function getChangeColorClass(change) {
  if (change === null || change === undefined) return 'text-gray-600'
  if (change > 0) return 'text-danger-600'
  if (change < 0) return 'text-success-600'
  return 'text-gray-600'
}

async function createComparison() {
  if (!isFormValid.value) return

  creating.value = true
  createError.value = null

  try {
    const data = {
      baselineRunId: parseInt(newComparison.value.baselineRunId),
      comparisonRunId: parseInt(newComparison.value.comparisonRunId),
      deviationThreshold: newComparison.value.deviationThreshold || 10
    }

    const response = await comparisonsAPI.create(data)
    const comparisonId = response.data.comparisonId

    showCreateModal.value = false
    resetForm()
    
    // Redirect to comparison detail page
    router.push(`/comparisons/${comparisonId}`)
  } catch (err) {
    createError.value = err.response?.data?.error || 'Failed to create comparison'
  } finally {
    creating.value = false
  }
}

function resetForm() {
  newComparison.value = {
    baselineRunId: '',
    comparisonRunId: '',
    deviationThreshold: 10
  }
  availableComparisonRuns.value = []
  createError.value = null
}

function viewComparison(comparisonId) {
  router.push(`/comparisons/${comparisonId}`)
}

async function deleteComparison(comparisonId) {
  if (!confirm('Are you sure you want to delete this comparison?')) return

  try {
    await comparisonsAPI.remove(comparisonId)
    await loadComparisons()
  } catch (error) {
    console.error('Failed to delete comparison:', error)
    alert('Failed to delete comparison')
  }
}
</script>