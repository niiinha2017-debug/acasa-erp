// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'


import './assets/CSS/main.css'   // se existir
import './assets/CSS/Menu.css'   // ← ESTE É O CARA

createApp(App).use(router).mount('#app')