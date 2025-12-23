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
            <router-link to="/despesas">Despesas</router-link>
          </div>
        </div>

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
const { logout } = useAuth() 
const isScrolled = ref(false)
const activeDropdown = ref(null)

const handleLogout = () => {
  logout()
  router.push('/login')
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

const toggleDropdown = (menu) => {
  activeDropdown.value = activeDropdown.value === menu ? null : menu
}

const closeDropdownOnClickOutside = (event) => {
  const navElement = document.querySelector('.nav')
  if (navElement && !navElement.contains(event.target)) {
    activeDropdown.value = null
  }
}

onMounted(() => {
  const theme = localStorage.getItem('theme') || 'light'
  const link = document.getElementById('theme-css')
  if (link) {
    link.href = `/assets/css/theme-${theme}.css`
  }

  window.addEventListener('scroll', handleScroll)
  document.addEventListener('click', closeDropdownOnClickOutside)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', closeDropdownOnClickOutside)
})
</script>