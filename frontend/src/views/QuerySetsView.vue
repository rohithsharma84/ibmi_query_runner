<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Query Sets</h1>
        <p class="text-gray-600 mt-2">Manage and organize your SQL query collections</p>
      </div>
      <router-link to="/query-sets/create" class="btn-primary">
        <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create Query Set
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="spinner w-12 h-12 text-primary-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="querySets.length === 0" class="card text-center py-12">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Query Sets</h3>
      <p class="text-gray-600 mb-6">Get started by creating your first query set</p>
      <router-link to="/query-sets/create" class="btn-primary">
        Create Query Set
      </router-link>
    </div>

    <!-- Query Sets List -->
    <div v-else class="space-y-4">
      <div
        v-for="querySet in querySets"
        :key="querySet.set_id"
        class="card hover:shadow-lg transition-shadow cursor-pointer"
        @click="viewQuerySet(querySet.set_id)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center">
              <h3 class="text-lg font-semibold text-gray-900">{{ querySet.set_name }}</h3>
              <span class="ml-3 badge badge-primary">{{ querySet.query_count }} queries</span>
            </div>
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
                {{ formatDate(querySet.created_at) }}
              </span>
            </div>
          </div>
          <div class="flex space-x-2 ml-4">
            <button
              @click.stop="refreshQuerySet(querySet.set_id)"
              class="btn-secondary btn-sm"
              title="Refresh from plan cache"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              @click.stop="deleteQuerySet(querySet.set_id)"
              class="btn-danger btn-sm"
              title="Delete query set"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { querySetsAPI } from '@/utils/api'
import { formatDate } from '@/utils/formatters'

const router = useRouter()
const querySets = ref([])
const loading = ref(true)

onMounted(async () => {
  await loadQuerySets()
})

async function loadQuerySets() {
  loading.value = true
  try {
    const response = await querySetsAPI.getAll()
    querySets.value = response.data.querySets || []
  } catch (error) {
    console.error('Failed to load query sets:', error)
  } finally {
    loading.value = false
  }
}

function viewQuerySet(setId) {
  router.push(`/query-sets/${setId}`)
}

async function refreshQuerySet(setId) {
  if (!confirm('Refresh this query set from the plan cache?')) return
  
  try {
    await querySetsAPI.refresh(setId)
    await loadQuerySets()
  } catch (error) {
    console.error('Failed to refresh query set:', error)
    alert('Failed to refresh query set')
  }
}

async function deleteQuerySet(setId) {
  if (!confirm('Are you sure you want to delete this query set?')) return
  
  try {
    await querySetsAPI.remove(setId)
    await loadQuerySets()
  } catch (error) {
    console.error('Failed to delete query set:', error)
    alert('Failed to delete query set')
  }
}
</script>