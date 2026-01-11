import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 1. Importe o CSS do Tailwind (crie este arquivo se não existir)
import '@/assets/CSS/tailwind.css' 

// 2. Importe o PrimeIcons que você instalou
import 'primeicons/primeicons.css' 

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