<template>
  <header class="topbar" :class="{ scrolled: isScrolled }">
    <div class="topbar-inner">

      <div class="brand" @click="router.push('/')">
        A CASA-ERP
      </div>

      <nav class="nav">
        <div 
          class="dropdown-menu" 
          :class="{ active: activeDropdown === 'financeiro' }" 
          @click="toggleDropdown('financeiro')"
        >
          <button class="dropdown-toggle">Financeiro</button>
          <div class="dropdown-content" @click.stop>
            <router-link to="/despesas/novo" exact-active-class="router-link-exact-active">
              Despesas
            </router-link>
            <router-link to="/contas-a-receber" exact-active-class="router-link-exact-active">
              Contas a Receber
            </router-link>
            <router-link to="/fluxo-de-caixa" exact-active-class="router-link-exact-active">
              Fluxo de Caixa
            </router-link>
          </div>
        </div>

        <div 
          class="dropdown-menu" 
          :class="{ active: activeDropdown === 'cadastro' }" 
          @click="toggleDropdown('cadastro')"
        >
          <button class="dropdown-toggle">Cadastro</button>
          <div class="dropdown-content" @click.stop>
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
            <router-link to="/orcamentos" exact-active-class="router-link-exact-active">
  Orçamentos
</router-link>

<router-link to="/vendas" exact-active-class="router-link-exact-active">
  Vendas
</router-link>

          </div>
        </div>
        
        <div 
          class="dropdown-menu" 
          :class="{ active: activeDropdown === 'producao' }" 
          @click="toggleDropdown('producao')"
        >
          <button class="dropdown-toggle">Produção</button>
          <div class="dropdown-content" @click.stop>
            <router-link to="/planos-corte" exact-active-class="router-link-exact-active">
              Plano de Corte
            </router-link>
            <router-link to="/ordens-servico" exact-active-class="router-link-exact-active">
              Ordens de Serviço
            </router-link>
          </div>
        </div>

        <router-link to="/vendas" exact-active-class="router-link-exact-active">
          Vendas
        </router-link>

        <router-link to="/relatorios" exact-active-class="router-link-exact-active">
          Relatórios
        </router-link>
      </nav>

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
import { useAuth } from '@/composables/useAuth' 

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