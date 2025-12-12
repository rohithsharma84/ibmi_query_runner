import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { useAuthStore } from '@/stores/auth'
import { initAuthSession } from '@/utils/api'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app')

// After mount, hydrate token + session (guards tolerate token presence)
(async () => {
	const auth = useAuthStore()
	try {
		const session = await initAuthSession()
		if (session?.authenticated && session?.user && auth?.setUser) {
			auth.setUser(session.user)
		}
	} catch {
		// ignore
	}
})()