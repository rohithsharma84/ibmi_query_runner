<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
    <div class="max-w-md w-full">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">IBM i Query Runner</h1>
        <p class="text-gray-600 mt-2">Performance Testing & Analysis Tool</p>
      </div>

      <!-- Login Card -->
      <div class="card">
        <h2 class="text-xl font-semibold mb-6 text-center">Sign In</h2>

        <!-- Error Alert -->
        <div v-if="authStore.error" class="alert alert-danger mb-4">
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span>{{ authStore.error }}</span>
          </div>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label for="userProfile" class="block text-sm font-medium text-gray-700 mb-2">
              IBM i User Profile
            </label>
            <input
              id="userProfile"
              v-model="form.userProfile"
              type="text"
              required
              maxlength="10"
              class="input"
              :class="{ 'input-error': authStore.error }"
              placeholder="Enter user profile"
              :disabled="authStore.loading"
              @input="handleInput"
            />
            <p class="text-xs text-gray-500 mt-1">Maximum 10 characters</p>
          </div>

          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="input"
              :class="{ 'input-error': authStore.error }"
              placeholder="Enter password"
              :disabled="authStore.loading"
              @input="handleInput"
            />
          </div>

          <button
            type="submit"
            class="btn-primary w-full"
            :disabled="authStore.loading || !isFormValid"
          >
            <span v-if="authStore.loading" class="flex items-center justify-center">
              <span class="spinner w-5 h-5 mr-2"></span>
              Signing in...
            </span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <!-- Info -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <div class="text-sm text-gray-600 space-y-2">
            <p class="flex items-start">
              <svg class="w-5 h-5 mr-2 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <span>Use your IBM i user profile credentials to sign in.</span>
            </p>
            <p class="flex items-start">
              <svg class="w-5 h-5 mr-2 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
              </svg>
              <span>Your credentials are validated against the IBM i system.</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8 text-sm text-gray-600">
        <p>&copy; 2024 IBM i Query Runner. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  userProfile: '',
  password: ''
})

const isFormValid = computed(() => {
  return form.value.userProfile.trim().length > 0 && 
         form.value.password.length > 0 &&
         form.value.userProfile.length <= 10
})

function handleInput() {
  // Clear error when user starts typing
  if (authStore.error) {
    authStore.clearError()
  }
  
  // Convert user profile to uppercase
  form.value.userProfile = form.value.userProfile.toUpperCase()
}

async function handleLogin() {
  const result = await authStore.login({
    userProfile: form.value.userProfile.trim(),
    password: form.value.password
  })

  if (result.success) {
    // Redirect to the page user was trying to access, or dashboard
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  }
}
</script>