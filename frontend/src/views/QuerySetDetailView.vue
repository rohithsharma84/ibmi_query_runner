<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <router-link to="/query-sets" class="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center">
        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Query Sets
      </router-link>
      
      <div v-if="loading" class="flex items-center mt-2">
        <div class="spinner w-8 h-8 text-primary-600"></div>
        <span class="ml-3 text-gray-600">Loading query set...</span>
      </div>

      <div v-else-if="querySet" class="flex justify-between items-start mt-2">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ querySet.set_name }}</h1>
          <p v-if="querySet.description" class="text-gray-600 mt-2">{{ querySet.description }}</p>
          <div class="flex items-center space-x-4 mt-3 text-sm text-gray-500">
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {{ querySet.user_profile }}
            </span>
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Created {{ formatDate(querySet.created_at) }}
            </span>
            <span class="badge badge-primary">{{ queries.length }} queries</span>
          </div>
        </div>

        <div class="flex space-x-2">
          <button
            @click="refreshQuerySet"
            :disabled="refreshing"
            class="btn-secondary"
            title="Refresh from plan cache"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ refreshing ? 'Refreshing from plan cache...' : 'Refresh from plan cache' }}
          </button>
          <button
            @click="createTestRun"
            class="btn-primary"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run Test
          </button>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert-danger mb-6">
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- Queries List -->
    <div v-if="!loading && querySet" class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Queries</h2>
        <button
          @click="showAddQueryModal = true"
          class="btn-secondary btn-sm"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Query
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="queries.length === 0" class="text-center py-12">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No Queries</h3>
        <p class="text-gray-600 mb-4">This query set doesn't have any queries yet.</p>
        <button
          @click="showAddQueryModal = true"
          class="btn-primary"
        >
          Add Your First Query
        </button>
      </div>

      <!-- Queries Table -->
      <div v-else class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th class="w-12">#</th>
              <th>SQL Statement</th>
              <th class="w-32">Hash</th>
              <th class="w-32">Status</th>
              <th class="w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="query in queries" :key="query.query_id">
              <td class="font-medium">{{ query.sequence_number }}</td>
              <td>
                <div class="font-mono text-sm" :title="query.sql_text">
                  {{ formatSQL(query.sql_text, 100) }}
                </div>
              </td>
              <td>
                <code class="text-xs text-gray-600">{{ query.query_hash.substring(0, 12) }}...</code>
              </td>
              <td>
                <span class="badge" :class="query.is_active ? 'badge-success' : 'badge-gray'">
                  {{ query.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="flex space-x-2">
                  <button
                    @click="viewQuery(query)"
                    class="text-primary-600 hover:text-primary-700"
                    title="View details"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    @click="deleteQuery(query.query_id)"
                    class="text-danger-600 hover:text-danger-700"
                    title="Delete query"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- View Query Modal -->
    <div v-if="selectedQuery" class="modal" @click.self="selectedQuery = null">
      <div class="modal-content max-w-4xl">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">Query Details</h3>
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
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Query Hash</label>
              <code class="block bg-gray-50 p-2 rounded text-xs">{{ selectedQuery.query_hash }}</code>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sequence Number</label>
              <p class="text-gray-900">{{ selectedQuery.sequence_number }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <span class="badge" :class="selectedQuery.is_active ? 'badge-success' : 'badge-gray'">
              {{ selectedQuery.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button @click="selectedQuery = null" class="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Add Query Modal -->
    <div v-if="showAddQueryModal" class="modal" @click.self="showAddQueryModal = false">
      <div class="modal-content">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">Add Query</h3>
          <button
            @click="showAddQueryModal = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              SQL Statement <span class="text-danger-600">*</span>
            </label>
            <textarea
              v-model="newQuery.sqlText"
              rows="8"
              required
              class="input font-mono text-sm"
              placeholder="Enter SQL statement..."
            ></textarea>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="showAddQueryModal = false"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button
            @click="addQuery"
            :disabled="!newQuery.sqlText.trim() || adding"
            class="btn-primary"
          >
            <span v-if="adding" class="flex items-center">
              <span class="spinner w-5 h-5 mr-2"></span>
              Adding...
            </span>
            <span v-else>Add Query</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Overlay -->
    <div v-if="selectedQuery || showAddQueryModal" class="modal-overlay"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { querySetsAPI, queriesAPI } from '@/utils/api'
import { formatDate, formatSQL } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()
const setId = route.params.id

const loading = ref(true)
const refreshing = ref(false)
const adding = ref(false)
const error = ref(null)
const querySet = ref(null)
const queries = ref([])
const selectedQuery = ref(null)
const showAddQueryModal = ref(false)
const newQuery = ref({
  sqlText: ''
})

onMounted(async () => {
  await loadQuerySet()
})

async function loadQuerySet() {
  loading.value = true
  error.value = null

  try {
    const response = await querySetsAPI.getById(setId)
    querySet.value = response.data.querySet
    queries.value = response.data.queries || []
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load query set'
  } finally {
    loading.value = false
  }
}

async function refreshQuerySet() {
  if (!confirm('Refresh this query set from the plan cache? This will add new queries and deactivate removed ones.')) {
    return
  }

  refreshing.value = true
  error.value = null

  try {
    await querySetsAPI.refresh(setId)
    await loadQuerySet()
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to refresh query set'
  } finally {
    refreshing.value = false
  }
}

function viewQuery(query) {
  selectedQuery.value = query
}

async function addQuery() {
  if (!newQuery.value.sqlText.trim()) return

  adding.value = true
  error.value = null

  try {
    await queriesAPI.addToSet(parseInt(setId), {
      // Backend expects 'queryText'
      queryText: newQuery.value.sqlText.trim()
    })

    showAddQueryModal.value = false
    newQuery.value.sqlText = ''
    await loadQuerySet()
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to add query'
  } finally {
    adding.value = false
  }
}

async function deleteQuery(queryId) {
  if (!confirm('Are you sure you want to delete this query?')) return

  try {
    await queriesAPI.remove(queryId)
    await loadQuerySet()
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to delete query'
  }
}

function createTestRun() {
  // Navigate to test run creation with this query set
  router.push({
    name: 'test-runs',
    query: { setId }
  })
}
</script>