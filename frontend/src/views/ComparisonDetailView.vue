<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <router-link to="/comparisons" class="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center">
        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Comparisons
      </router-link>
      
      <div v-if="loading" class="flex items-center mt-2">
        <div class="spinner w-8 h-8 text-primary-600"></div>
        <span class="ml-3 text-gray-600">Loading comparison...</span>
      </div>

      <div v-else-if="comparison" class="flex justify-between items-start mt-2">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            {{ comparison.baseline_run_name }} vs {{ comparison.comparison_run_name }}
          </h1>
          <div class="flex items-center space-x-4 mt-3 text-sm text-gray-500">
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ formatDate(comparison.created_at) }}
            </span>
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Threshold: {{ comparison.deviation_threshold }}%
            </span>
          </div>
        </div>

        <button
          @click="exportReport"
          class="btn-secondary"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Report
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert-danger mb-6">
      {{ error }}
    </div>

    <!-- Summary Cards -->
    <div v-if="!loading && comparison" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="card">
        <div class="text-sm font-medium text-gray-600 mb-1">Total Queries</div>
        <div class="text-3xl font-bold text-gray-900">{{ formatNumber(comparison.total_queries) }}</div>
        <div class="text-sm text-gray-500 mt-1">Compared</div>
      </div>

      <div class="card">
        <div class="text-sm font-medium text-gray-600 mb-1">Avg Duration Change</div>
        <div class="text-3xl font-bold" :class="getChangeColorClass(comparison.avg_duration_change)">
          {{ formatPercentageChange(comparison.avg_duration_change).text }}
        </div>
        <div class="text-sm text-gray-500 mt-1">
          {{ comparison.avg_duration_change > 0 ? 'Slower' : comparison.avg_duration_change < 0 ? 'Faster' : 'No change' }}
        </div>
      </div>

      <div class="card">
        <div class="text-sm font-medium text-gray-600 mb-1">Improved Queries</div>
        <div class="text-3xl font-bold text-success-600">{{ formatNumber(comparison.queries_improved) }}</div>
        <div class="text-sm text-gray-500 mt-1">
          {{ formatPercentage(calculatePercentage(comparison.queries_improved, comparison.total_queries), 0) }}
        </div>
      </div>

      <div class="card">
        <div class="text-sm font-medium text-gray-600 mb-1">Degraded Queries</div>
        <div class="text-3xl font-bold text-danger-600">{{ formatNumber(comparison.queries_degraded) }}</div>
        <div class="text-sm text-gray-500 mt-1">
          {{ formatPercentage(calculatePercentage(comparison.queries_degraded, comparison.total_queries), 0) }}
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div v-if="!loading && comparison" class="card mb-6">
      <div class="flex space-x-2">
        <button
          @click="filter = 'all'"
          class="px-4 py-2 rounded-lg font-medium transition-colors"
          :class="filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
        >
          All Queries ({{ formatNumber(queryDetails.length) }})
        </button>
        <button
          @click="filter = 'deviations'"
          class="px-4 py-2 rounded-lg font-medium transition-colors"
          :class="filter === 'deviations' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
        >
          Deviations ({{ formatNumber(comparison.queries_with_deviations) }})
        </button>
        <button
          @click="filter = 'improved'"
          class="px-4 py-2 rounded-lg font-medium transition-colors"
          :class="filter === 'improved' ? 'bg-success-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
        >
          Improved ({{ formatNumber(comparison.queries_improved) }})
        </button>
        <button
          @click="filter = 'degraded'"
          class="px-4 py-2 rounded-lg font-medium transition-colors"
          :class="filter === 'degraded' ? 'bg-danger-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
        >
          Degraded ({{ formatNumber(comparison.queries_degraded) }})
        </button>
      </div>
    </div>

    <!-- Query Comparison Details -->
    <div v-if="!loading && comparison" class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Query Comparison Details</h2>
        <div class="flex space-x-2">
          <button
            @click="sortBy = 'sequence'"
            class="btn-secondary btn-sm"
            :class="{ 'bg-primary-100': sortBy === 'sequence' }"
          >
            Sequence
          </button>
          <button
            @click="sortBy = 'change'"
            class="btn-secondary btn-sm"
            :class="{ 'bg-primary-100': sortBy === 'change' }"
          >
            Change
          </button>
          <button
            @click="sortBy = 'baseline'"
            class="btn-secondary btn-sm"
            :class="{ 'bg-primary-100': sortBy === 'baseline' }"
          >
            Baseline
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th class="w-12">#</th>
              <th>SQL Statement</th>
              <th class="w-32">Baseline</th>
              <th class="w-32">Comparison</th>
              <th class="w-32">Change</th>
              <th class="w-32">Classification</th>
              <th class="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="query in filteredAndSortedQueries" :key="query.query_id">
              <td class="font-medium">{{ query.sequence_number }}</td>
              <td>
                <div class="font-mono text-sm" :title="query.sql_text">
                  {{ formatSQL(query.sql_text, 60) }}
                </div>
              </td>
              <td>{{ formatDuration(query.baseline_avg_duration) }}</td>
              <td>{{ formatDuration(query.comparison_avg_duration) }}</td>
              <td>
                <span
                  class="font-semibold"
                  :class="getChangeColorClass(query.duration_change_percent)"
                >
                  {{ formatPercentageChange(query.duration_change_percent).text }}
                </span>
              </td>
              <td>
                <span
                  v-if="query.has_deviation"
                  class="badge"
                  :class="query.classification === 'IMPROVEMENT' ? 'badge-success' : 'badge-danger'"
                >
                  {{ query.classification }}
                </span>
                <span v-else class="badge badge-gray">
                  NO CHANGE
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

      <div v-if="filteredAndSortedQueries.length === 0" class="text-center py-8 text-gray-500">
        No queries match the selected filter
      </div>
    </div>

    <!-- Query Details Modal -->
    <div v-if="selectedQuery" class="modal" @click.self="selectedQuery = null">
      <div class="modal-content max-w-4xl">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">Query Comparison Details</h3>
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
              <div class="text-sm font-medium text-gray-600 mb-2">Baseline Run</div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Avg Duration:</span>
                  <span class="font-medium">{{ formatDuration(selectedQuery.baseline_avg_duration) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Min Duration:</span>
                  <span class="font-medium">{{ formatDuration(selectedQuery.baseline_min_duration) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Max Duration:</span>
                  <span class="font-medium">{{ formatDuration(selectedQuery.baseline_max_duration) }}</span>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="text-sm font-medium text-gray-600 mb-2">Comparison Run</div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Avg Duration:</span>
                  <span class="font-medium">{{ formatDuration(selectedQuery.comparison_avg_duration) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Min Duration:</span>
                  <span class="font-medium">{{ formatDuration(selectedQuery.comparison_min_duration) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Max Duration:</span>
                  <span class="font-medium">{{ formatDuration(selectedQuery.comparison_max_duration) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="text-sm font-medium text-gray-600 mb-2">Performance Change</div>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Duration Change:</span>
                <span
                  class="text-2xl font-bold"
                  :class="getChangeColorClass(selectedQuery.duration_change_percent)"
                >
                  {{ formatPercentageChange(selectedQuery.duration_change_percent).text }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Classification:</span>
                <span
                  v-if="selectedQuery.has_deviation"
                  class="badge"
                  :class="selectedQuery.classification === 'IMPROVEMENT' ? 'badge-success' : 'badge-danger'"
                >
                  {{ selectedQuery.classification }}
                </span>
                <span v-else class="badge badge-gray">NO CHANGE</span>
              </div>
              <div v-if="selectedQuery.has_deviation" class="flex justify-between items-center">
                <span class="text-gray-600">Deviation:</span>
                <span class="badge badge-warning">Exceeds {{ comparison.deviation_threshold }}% threshold</span>
              </div>
            </div>
          </div>

          <div v-if="selectedQuery.insights" class="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-primary-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <div class="text-sm text-primary-800">
                <p class="font-medium mb-1">Insights</p>
                <p>{{ selectedQuery.insights }}</p>
              </div>
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

    <!-- Modal Overlay -->
    <div v-if="selectedQuery" class="modal-overlay"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { comparisonsAPI } from '@/utils/api'
import { formatDate, formatDuration, formatNumber, formatPercentage, formatPercentageChange, formatSQL, calculatePercentage } from '@/utils/formatters'

const route = useRoute()
const comparisonId = route.params.id

const loading = ref(true)
const error = ref(null)
const comparison = ref(null)
const queryDetails = ref([])
const selectedQuery = ref(null)
const filter = ref('all')
const sortBy = ref('sequence')

const filteredAndSortedQueries = computed(() => {
  let queries = [...queryDetails.value]

  // Apply filter
  switch (filter.value) {
    case 'deviations':
      queries = queries.filter(q => q.has_deviation)
      break
    case 'improved':
      queries = queries.filter(q => q.classification === 'IMPROVEMENT')
      break
    case 'degraded':
      queries = queries.filter(q => q.classification === 'DEGRADATION')
      break
  }

  // Apply sort
  switch (sortBy.value) {
    case 'change':
      queries.sort((a, b) => Math.abs(b.duration_change_percent) - Math.abs(a.duration_change_percent))
      break
    case 'baseline':
      queries.sort((a, b) => b.baseline_avg_duration - a.baseline_avg_duration)
      break
    default: // sequence
      queries.sort((a, b) => a.sequence_number - b.sequence_number)
  }

  return queries
})

onMounted(async () => {
  await loadComparison()
})

async function loadComparison() {
  loading.value = true
  error.value = null

  try {
    const [summaryResponse, detailsResponse] = await Promise.all([
      comparisonsAPI.getSummary(comparisonId),
      comparisonsAPI.getDeviations(comparisonId, { includeAll: true })
    ])

    comparison.value = summaryResponse.data.comparison
    queryDetails.value = detailsResponse.data.queryDetails || []
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load comparison'
  } finally {
    loading.value = false
  }
}

function getChangeColorClass(change) {
  if (change === null || change === undefined) return 'text-gray-600'
  if (change > 0) return 'text-danger-600'
  if (change < 0) return 'text-success-600'
  return 'text-gray-600'
}

function viewQueryDetails(query) {
  selectedQuery.value = query
}

const exportReport = () => {
  if (!comparison.value || !queryDetails.value) return
  
  const html = generateComparisonReport(comparison.value, queryDetails.value)
  const filename = `comparison-${comparison.value.comparison_id}-${Date.now()}.html`
  downloadReport(html, filename)
}
</script>