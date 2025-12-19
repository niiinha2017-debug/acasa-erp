<template>
  <header class="topbar" :class="{ scrolled: isScrolled }">
    <div class="topbar-inner">

      <!-- BRAND -->
      <div class="brand" @click="router.push('/')">
        A CASA-ERP
      </div>

      <!-- NAV -->
      <nav class="nav">

        <!-- FINANCEIRO -->
        <div
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'financeiro' }"
          @click="toggleDropdown('financeiro')"
        >
          <button class="dropdown-toggle">Financeiro</button>
          <div class="dropdown-content" @click.stop>
            <router-link to="/despesas">Despesas</router-link>
            <router-link to="/contas-a-receber">Contas a Receber</router-link>
            <router-link to="/fluxo-de-caixa">Fluxo de Caixa</router-link>
          </div>
        </div>

        <!-- CADASTROS -->
        <div
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'cadastro' }"
          @click="toggleDropdown('cadastro')"
        >
          <button class="dropdown-toggle">Cadastros</button>
          <div class="dropdown-content" @click.stop>
            <router-link to="/clientes">Clientes</router-link>
            <router-link to="/fornecedores">Fornecedores</router-link>
            <router-link to="/funcionarios">Funcionários</router-link>
            <router-link to="/produtos">Produtos</router-link>
          </div>
        </div>

        <!-- PRODUÇÃO -->
        <div
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'producao' }"
          @click="toggleDropdown('producao')"
        >
          <button class="dropdown-toggle">Produção</button>
          <div class="dropdown-content" @click.stop>
            <router-link to="/planodecorte">Plano de Corte</router-link>
          </div>
        </div>

        <!-- CONFIGURAÇÕES -->
        <div
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'configuracoes' }"
          @click="toggleDropdown('configuracoes')"
        >
          <button class="dropdown-toggle">Configurações</button>
          <div class="dropdown-content" @click.stop>
            <router-link to="/constantes">Constantes</router-link>
            <router-link to="/usuarios">Liberar Usuários</router-link>
          </div>
        </div>

      </nav>

      <!-- USER -->
      <div class="user-area">
        <span>Olá, Ana</span>
        <button class="btn-logout" @click="handleLogout">
          Sair
        </button>
      </div>

    </div>
  </header>
</template>


<script setup>
import '../assets/CSS/Menu.css'
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from '@/services/useauth' 

const router = useRouter()
const { logout } = useAuth() // Desestrutura para pegar apenas o logout
const isScrolled = ref(false)
const activeDropdown = ref(null)

const handleLogout = () => {
  logout()
  router.push('/login')
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

// Alterna o estado do dropdown
const toggleDropdown = (menu) => {
  activeDropdown.value = activeDropdown.value === menu ? null : menu
}

// Fecha o dropdown se o clique ocorrer fora do menu de navegação
const closeDropdownOnClickOutside = (event) => {
  const navElement = document.querySelector('.nav')
  if (navElement && !navElement.contains(event.target)) {
    activeDropdown.value = null
  }
}

onMounted(() => {
  // Lógica de tema persistida
  const theme = localStorage.getItem('theme') || 'light'
  const link = document.getElementById('theme-css')
  if (link) {
    link.href = `/assets/css/theme-${theme}.css`
  }

  // Listeners de scroll e clique
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('click', closeDropdownOnClickOutside)
  
  // Verifica scroll inicial
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', closeDropdownOnClickOutside)
})
</script>