/**
 * WebSocket Composable
 * Provides reactive WebSocket connection for real-time updates
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useWebSocket() {
  const authStore = useAuthStore()
  const ws = ref(null)
  const connected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000
  let reconnectTimeout = null

  /**
   * Connect to WebSocket server
   */
  const connect = () => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, '') || window.location.host
    const wsUrl = `${protocol}//${host}/ws`

    try {
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        console.log('WebSocket connected')
        connected.value = true
        reconnectAttempts.value = 0

        // Authenticate
        if (authStore.user) {
          send({
            type: 'auth',
            userId: authStore.user.userProfile
          })
        }
      }

      ws.value.onclose = () => {
        console.log('WebSocket disconnected')
        connected.value = false
        
        // Attempt to reconnect
        if (reconnectAttempts.value < maxReconnectAttempts) {
          reconnectAttempts.value++
          console.log(`Reconnecting... (attempt ${reconnectAttempts.value}/${maxReconnectAttempts})`)
          reconnectTimeout = setTimeout(connect, reconnectDelay)
        }
      }

      ws.value.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    if (ws.value) {
      ws.value.close()
      ws.value = null
    }

    connected.value = false
  }

  /**
   * Send message to server
   */
  const send = (data) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data))
    }
  }

  /**
   * Subscribe to test run updates
   */
  const subscribeToTestRun = (testRunId, callback) => {
    if (!ws.value) {
      connect()
    }

    // Send subscription message
    send({
      type: 'subscribe',
      testRunId
    })

    // Set up message handler
    const messageHandler = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        if (message.type === 'testRunUpdate' && message.testRunId === testRunId) {
          callback(message.data)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    if (ws.value) {
      ws.value.addEventListener('message', messageHandler)
    }

    // Return unsubscribe function
    return () => {
      send({
        type: 'unsubscribe',
        testRunId
      })

      if (ws.value) {
        ws.value.removeEventListener('message', messageHandler)
      }
    }
  }

  return {
    connected,
    connect,
    disconnect,
    send,
    subscribeToTestRun
  }
}