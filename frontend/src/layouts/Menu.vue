<template>
  <header class="topbar" :class="{ scrolled: isScrolled }">
    <div class="topbar-inner">

      <!-- Logo -->
      <div class="brand" @click="router.push('/')">
        A CASA-ERP
      </div>

      <nav class="nav">
        <router-link to="/planos-corte" exact-active-class="router-link-exact-active">
          Plano de Corte
        </router-link>
        <router-link to="/clientes" exact-active-class="router-link-exact-active">
          Clientes
        </router-link>
        <router-link to="/fornecedores" exact-active-class="router-link-exact-active">
          Fornecedores
        </router-link>
        <router-link to="/funcionarios" exact-active-class="router-link-exact-active">
          Funcionários
        </router-link>
        <router-link to="/produtos" exact-active-class="router-link-exact-active">
          Produtos
        </router-link>
      </nav>

      <!-- Usuário -->
      <div class="user-area">
        <span>Olá, Ana</span>
        <button class="btn-logout" @click="handleLogout">
          Sair
        </button>

        <!-- Botão de alternar tema -->
        <button class="btn-theme" @click="toggleTheme">
          🌙
        </button>
      </div>

    </div>
  </header>
</template>


<script setup>
import '../assets/CSS/Menu.css'
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const auth = useAuth()
const isScrolled = ref(false)

function handleLogout() {
  auth.logout()          // ✅ limpa storage centralizado
  router.push('/login')  // ✅ dispara o guard
}


function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

// Quando o componente é montado, aplica o tema persistido
onMounted(() => {
  const theme = localStorage.getItem('theme') || 'light'
  const link = document.getElementById('theme-css')
  if (link) {
    link.href = `/assets/css/theme-${theme}.css`
  }

  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

// Quando desmontar, remove o eventListener
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
