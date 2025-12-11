<template>
  <div>
    <div class="mb-8">
      <router-link to="/query-sets" class="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center">
        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Query Sets
      </router-link>
      <h1 class="text-3xl font-bold text-gray-900 mt-2">Create Query Set</h1>
      <p class="text-gray-600 mt-2">Import queries from SQL plan cache or create manually</p>
    </div>

    <!-- Creation Method Selection -->
    <div class="card mb-6">
      <h2 class="text-xl font-semibold mb-4">Select Creation Method</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          @click="creationMethod = 'plan-cache'"
          class="p-6 border-2 rounded-lg transition-all"
          :class="creationMethod === 'plan-cache' 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-200 hover:border-primary-300'"
        >
          <div class="flex items-start">
            <div class="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div class="text-left">
              <h3 class="font-semibold text-gray-900 mb-1">From Plan Cache</h3>
              <p class="text-sm text-gray-600">Import queries executed by a specific user profile</p>
            </div>
          </div>
        </button>

        <button
          @click="creationMethod = 'manual'"
          class="p-6 border-2 rounded-lg transition-all"
          :class="creationMethod === 'manual' 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-200 hover:border-primary-300'"
        >
          <div class="flex items-start">
            <div class="w-12 h-12 bg-success-600 rounded-lg flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div class="text-left">
              <h3 class="font-semibold text-gray-900 mb-1">Manual Creation</h3>
              <p class="text-sm text-gray-600">Create an empty set and add queries manually</p>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Plan Cache Import Form -->
    <div v-if="creationMethod === 'plan-cache'" class="space-y-6">
      <!-- Basic Information -->
      <div class="card">
        <h2 class="text-xl font-semibold mb-4">Query Set Information</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Query Set Name <span class="text-danger-600">*</span>
            </label>
            <input
              v-model="form.setName"
              type="text"
              required
              maxlength="100"
              class="input"
              placeholder="e.g., Pre-Upgrade Baseline"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              maxlength="500"
              class="input"
              placeholder="Optional description of this query set"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Plan Cache Filters -->
      <div class="card">
        <h2 class="text-xl font-semibold mb-4">Plan Cache Filters</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              User Profile <span class="text-danger-600">*</span>
            </label>
            <input
              v-model="form.userProfile"
              type="text"
              required
              maxlength="10"
              class="input"
              placeholder="IBM i user profile"
              @input="form.userProfile = form.userProfile.toUpperCase()"
            />
            <p class="text-xs text-gray-500 mt-1">Import queries executed by this user</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Date From
              </label>
              <input
                v-model="form.dateFrom"
                type="date"
                class="input"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Date To
              </label>
              <input
                v-model="form.dateTo"
                type="date"
                class="input"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Minimum Execution Count
              </label>
              <input
                v-model.number="form.minExecutionCount"
                type="number"
                min="1"
                class="input"
                placeholder="e.g., 5"
              />
              <p class="text-xs text-gray-500 mt-1">Only include queries executed at least this many times</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Maximum Queries
              </label>
              <input
                v-model.number="form.limit"
                type="number"
                min="1"
                max="1000"
                class="input"
                placeholder="e.g., 100"
              />
              <p class="text-xs text-gray-500 mt-1">Limit the number of queries to import</p>
            </div>
          </div>

          <div class="flex justify-end">
            <button
              @click="previewQueries"
              :disabled="!canPreview || previewing"
              class="btn-primary"
            >
              <span v-if="previewing" class="flex items-center">
                <span class="spinner w-5 h-5 mr-2"></span>
                Loading Preview...
              </span>
              <span v-else>Preview Queries</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Results -->
      <div v-if="previewResults.length > 0" class="card">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">
            Preview Results
            <span class="ml-2 badge badge-primary">{{ previewResults.length }} queries</span>
          </h2>
          <button
            @click="clearPreview"
            class="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear Preview
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>SQL Statement</th>
                <th>Executions</th>
                <th>Avg Duration</th>
                <th>Last Used</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(query, index) in previewResults" :key="index">
                <td>
                  <div class="font-mono text-sm max-w-md truncate" :title="query.sql_text">
                    {{ formatSQL(query.sql_text, 80) }}
                  </div>
                </td>
                <td>{{ formatNumber(query.execution_count) }}</td>
                <td>{{ formatDuration(query.avg_duration) }}</td>
                <td>{{ formatDate(query.last_used, 'MMM dd, yyyy') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="creationMethod = null"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button
            @click="createFromPlanCache"
            :disabled="creating"
            class="btn-primary"
          >
            <span v-if="creating" class="flex items-center">
              <span class="spinner w-5 h-5 mr-2"></span>
              Creating...
            </span>
            <span v-else>Create Query Set ({{ previewResults.length }} queries)</span>
          </button>
        </div>
      </div>

      <!-- No Results Message -->
      <div v-else-if="previewAttempted && previewResults.length === 0" class="card text-center py-8">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No Queries Found</h3>
        <p class="text-gray-600">No queries match your filter criteria. Try adjusting the filters.</p>
      </div>
    </div>

    <!-- Manual Creation Form -->
    <div v-if="creationMethod === 'manual'" class="space-y-6">
      <div class="card">
        <h2 class="text-xl font-semibold mb-4">Query Set Information</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Query Set Name <span class="text-danger-600">*</span>
            </label>
            <input
              v-model="manualForm.setName"
              type="text"
              required
              maxlength="100"
              class="input"
              placeholder="e.g., Custom Test Set"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              v-model="manualForm.description"
              rows="3"
              maxlength="500"
              class="input"
              placeholder="Optional description of this query set"
            ></textarea>
          </div>

          <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-primary-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <div class="text-sm text-primary-800">
                <p class="font-medium mb-1">Manual Query Set</p>
                <p>An empty query set will be created. You can add queries manually after creation.</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3">
            <button
              @click="creationMethod = null"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button
              @click="createManual"
              :disabled="!manualForm.setName.trim() || creating"
              class="btn-primary"
            >
              <span v-if="creating" class="flex items-center">
                <span class="spinner w-5 h-5 mr-2"></span>
                Creating...
              </span>
              <span v-else>Create Empty Query Set</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert-danger">
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { planCacheAPI, querySetsAPI } from '@/utils/api'
import { formatDate, formatDuration, formatNumber, formatSQL } from '@/utils/formatters'

const router = useRouter()
const authStore = useAuthStore()

const creationMethod = ref(null)
const previewing = ref(false)
const creating = ref(false)
const previewAttempted = ref(false)
const previewResults = ref([])
const error = ref(null)

const form = ref({
  setName: '',
  description: '',
  userProfile: '',
  dateFrom: '',
  dateTo: '',
  minExecutionCount: null,
  limit: 100
})

const manualForm = ref({
  setName: '',
  description: ''
})

const canPreview = computed(() => {
  return form.value.setName.trim().length > 0 && 
         form.value.userProfile.trim().length > 0
})

async function previewQueries() {
  if (!canPreview.value) return

  previewing.value = true
  error.value = null
  previewAttempted.value = false

  try {
    const params = {
      userProfile: form.value.userProfile.trim(),
      dateFrom: form.value.dateFrom || undefined,
      dateTo: form.value.dateTo || undefined,
      minExecutionCount: form.value.minExecutionCount || undefined,
      limit: form.value.limit || 100
    }

    const response = await planCacheAPI.preview(params)
    previewResults.value = response.data.queries || []
    previewAttempted.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to preview queries'
    previewResults.value = []
  } finally {
    previewing.value = false
  }
}

function clearPreview() {
  previewResults.value = []
  previewAttempted.value = false
}

async function createFromPlanCache() {
  if (previewResults.value.length === 0) return

  creating.value = true
  error.value = null

  try {
    const data = {
      setName: form.value.setName.trim(),
      description: form.value.description.trim() || undefined,
      userProfile: form.value.userProfile.trim(),
      dateFrom: form.value.dateFrom || undefined,
      dateTo: form.value.dateTo || undefined,
      minExecutionCount: form.value.minExecutionCount || undefined,
      limit: form.value.limit || 100
    }

  const response = await querySetsAPI.createFromPlanCache(data)
  const setId = response.data.querySet?.setId || response.data.setId

    // Redirect to query set detail page
    router.push(`/query-sets/${setId}`)
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create query set'
  } finally {
    creating.value = false
  }
}

async function createManual() {
  if (!manualForm.value.setName.trim()) return

  creating.value = true
  error.value = null

  try {
    const data = {
      setName: manualForm.value.setName.trim(),
      description: manualForm.value.description.trim() || undefined
    }

    // Ensure backend receives the creating user's IBM i profile
    const userProfile = authStore.user?.user_profile || authStore.user?.userId || undefined
    if (userProfile) data.userProfile = String(userProfile).trim()

  const response = await querySetsAPI.createManual(data)
  const setId = response.data.querySet?.setId || response.data.setId

    // Redirect to query set detail page
    router.push(`/query-sets/${setId}`)
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create query set'
  } finally {
    creating.value = false
  }
}
</script>