import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './assets/tailwind.css' // precisa existir e compilar

// Registro automático do Service Worker PWA
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js')
			.then(reg => {
				console.log('Service Worker registrado:', reg);
			})
			.catch(err => {
				console.warn('Erro ao registrar Service Worker:', err);
			});
	});
}

createApp(App).use(router).mount('#app')
