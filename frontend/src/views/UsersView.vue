<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
        <p class="text-gray-600 mt-2">Manage authorized users for the Query Runner application</p>
      </div>
      <button v-if="authStore.isAdmin" @click="showAddModal = true" class="btn-primary">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add User
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert-danger mb-6">
      {{ error }}
    </div>

    <!-- Success Alert -->
    <div v-if="success" class="alert alert-success mb-6">
      {{ success }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="spinner w-12 h-12 text-primary-600"></div>
      <span class="ml-3 text-gray-600">Loading users...</span>
    </div>

    <!-- Users Table -->
    <div v-else-if="users.length > 0" class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>User Profile</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Last Modified</th>
              <th class="w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.user_profile">
              <td>
                <div class="font-medium">{{ user.user_profile }}</div>
              </td>
              <td>
                <span class="badge" :class="user.is_admin ? 'badge-primary' : 'badge-secondary'">
                  {{ user.is_admin ? 'Admin' : 'User' }}
                </span>
              </td>
              <td>
                <span class="badge" :class="user.is_active ? 'badge-success' : 'badge-danger'">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="text-sm text-gray-600">{{ formatDate(user.created_at) }}</td>
              <td class="text-sm text-gray-600">{{ formatDate(user.modified_at) }}</td>
              <td>
                <div class="flex space-x-2">
                  <button
                    @click="editUser(user)"
                    class="text-primary-600 hover:text-primary-700"
                    title="Edit user"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    v-if="user.user_profile !== currentUser"
                    @click="deleteUser(user)"
                    class="text-danger-600 hover:text-danger-700"
                    title="Delete user"
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

    <!-- Empty State -->
    <div v-else class="card text-center py-12">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
      <p class="text-gray-600 mb-4">Get started by adding your first user.</p>
      <button v-if="authStore.isAdmin" @click="showAddModal = true" class="btn-primary">
        Add User
      </button>
    </div>

    <!-- Add/Edit User Modal -->
  <div v-if="authStore.isAdmin && (showAddModal || showEditModal)" class="modal" @click.self="closeModal">
      <div class="modal-content max-w-md">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">{{ showEditModal ? 'Edit User' : 'Add User' }}</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="showEditModal ? updateUser() : addUser()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              User Profile <span class="text-danger-600">*</span>
            </label>
            <input
              v-model="formData.user_profile"
              type="text"
              :disabled="showEditModal"
              class="input"
              :class="{ 'bg-gray-100': showEditModal }"
              placeholder="Enter IBM i user profile"
              required
              maxlength="10"
              @input="formData.user_profile = formData.user_profile.toUpperCase()"
            />
            <p class="text-xs text-gray-500 mt-1">IBM i user profile (max 10 characters)</p>
          </div>

          <div>
            <label class="flex items-center">
              <input
                v-model="formData.is_admin"
                type="checkbox"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="ml-2 text-sm font-medium text-gray-700">Administrator</span>
            </label>
            <p class="text-xs text-gray-500 mt-1">Admins can manage users and access all features</p>
          </div>

          <div>
            <label class="flex items-center">
              <input
                v-model="formData.is_active"
                type="checkbox"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="ml-2 text-sm font-medium text-gray-700">Active</span>
            </label>
            <p class="text-xs text-gray-500 mt-1">Inactive users cannot log in</p>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="closeModal" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              <span v-if="submitting" class="flex items-center">
                <div class="spinner w-4 h-4 mr-2"></div>
                {{ showEditModal ? 'Updating...' : 'Adding...' }}
              </span>
              <span v-else>{{ showEditModal ? 'Update User' : 'Add User' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usersAPI } from '@/utils/api'
import { formatDate } from '@/utils/formatters'

const authStore = useAuthStore()
const currentUser = authStore.user?.userProfile

const users = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const submitting = ref(false)

const formData = ref({
  user_profile: '',
  is_admin: false,
  is_active: true
})

onMounted(() => {
  loadUsers()
})

const loadUsers = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await usersAPI.getAll()
    users.value = response.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

const addUser = async () => {
  submitting.value = true
  error.value = ''
  success.value = ''
  
  try {
    await usersAPI.create({
      user_profile: formData.value.user_profile,
      userName: formData.value.user_profile,
      is_admin: formData.value.is_admin,
      is_active: formData.value.is_active
    })
    success.value = `User ${formData.value.user_profile} added successfully`
    closeModal()
    await loadUsers()
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.response?.data?.error || ''
    const code = err.response?.data?.error?.code
    // If validation error due to existence/permission, offer bypass
    if (code === 'VALIDATION_ERROR' && /does not exist|permission to verify/i.test(msg)) {
      const proceed = window.confirm('Either the IBM i user does not exist or you do not have permissions to verify the user. Do you want to add the user anyway?')
      if (proceed) {
        try {
          await usersAPI.create({
            user_profile: formData.value.user_profile,
            userName: formData.value.user_profile,
            is_admin: formData.value.is_admin,
            is_active: formData.value.is_active,
            allowBypass: true
          })
          success.value = `User ${formData.value.user_profile} added successfully`
          closeModal()
          await loadUsers()
          setTimeout(() => { success.value = '' }, 3000)
          return
        } catch (e2) {
          error.value = e2.response?.data?.error || 'Failed to add user'
        }
      } else {
        error.value = 'User not added'
      }
    } else {
      error.value = err.response?.data?.error || 'Failed to add user'
    }
  } finally {
    submitting.value = false
  }
}

const editUser = (user) => {
  formData.value = {
    user_profile: user.user_profile,
    is_admin: user.is_admin,
    is_active: user.is_active
  }
  showEditModal.value = true
}

const updateUser = async () => {
  submitting.value = true
  error.value = ''
  success.value = ''
  
  try {
    await usersAPI.update(formData.value.user_profile, {
      is_admin: formData.value.is_admin,
      is_active: formData.value.is_active
    })
    success.value = `User ${formData.value.user_profile} updated successfully`
    closeModal()
    await loadUsers()
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to update user'
  } finally {
    submitting.value = false
  }
}

const deleteUser = async (user) => {
  if (!confirm(`Are you sure you want to delete user ${user.user_profile}? This action cannot be undone.`)) {
    return
  }
  
  error.value = ''
  success.value = ''
  
  try {
    await usersAPI.remove(user.user_profile)
    success.value = `User ${user.user_profile} deleted successfully`
    await loadUsers()
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to delete user'
  }
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  formData.value = {
    user_profile: '',
    is_admin: false,
    is_active: true
  }
}
</script>