import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './assets/tailwind.css' // precisa existir e compilar

createApp(App).use(router).mount('#app')
