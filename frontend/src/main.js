import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Importações base
import '@/assets/CSS/base/tokens.css'
import '@/assets/CSS/base/ui.css' 

// Reset Global para garantir tela cheia
const style = document.createElement('style')
style.innerHTML = `
  body, html, #app {
    margin: 0;
    padding: 0;
    height: 100vh;
    width: 100vw;
    overflow-x: hidden;
  }
`
document.head.appendChild(style)

createApp(App)
  .use(router)
  .mount('#app')