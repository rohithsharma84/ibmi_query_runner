<template>
  <div>
    <div class="mb-8">
      <router-link to="/query-sets" class="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center">
        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Query Sets
      </router-link>
      <h1 class="text-3xl font-bold text-gray-900 mt-2">Query Set Details</h1>
    </div>

    <div class="card">
      <p class="text-gray-600">Query set detail view - Coming soon</p>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
const setId = route.params.id
</script>