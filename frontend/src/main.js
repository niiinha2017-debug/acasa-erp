import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import '@/assets/CSS/base/tokens.css'


createApp(App)
  .use(router)   // 👈 ESSENCIAL
  .mount('#app')
