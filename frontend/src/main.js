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

// Bootstrap auth before mounting to prevent redirect on hard refresh
(async () => {
	const auth = useAuthStore()
	// hydrate token from localStorage and validate session
	try {
		const session = await initAuthSession()
		if (session?.authenticated && session?.user && auth?.setUser) {
			auth.setUser(session.user)
		}
	} catch (e) {
		// ignore bootstrap errors; router guard will handle unauthenticated state
	}

	app.use(router)
	app.mount('#app')
})()