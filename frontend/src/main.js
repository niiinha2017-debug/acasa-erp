// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// CSS base + estrutural
import './assets/CSS/Main.css'
import './assets/CSS/Menu.css'

// ===============================
// APP
// ===============================
const app = createApp(App)
app.use(router)
app.mount('#app')
