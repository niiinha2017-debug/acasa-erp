<template>
  <header class="topbar" :class="{ scrolled: isScrolled }">
    <div class="topbar-inner">
      <div class="brand" @click="router.push('/')">
        A CASA-ERP
      </div>

      <nav class="nav">
        <!-- Financeiro -->
        <div
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'financeiro' }"
          @click="toggleDropdown('financeiro')"
        >
          <button type="button" class="dropdown-toggle">Financeiro</button>
          <div class="dropdown-content" @click.stop>
            <!-- Por enquanto só Home existe. Deixa como placeholder sem navegar. -->
            <a href="#" @click.prevent="avisar('Despesas')">Despesas</a>
          </div>
        </div>

        <!-- Cadastros -->
        <div
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'cadastros' }"
          @click="toggleDropdown('cadastros')"
        >
          <button type="button" class="dropdown-toggle">Cadastros</button>
          <div class="dropdown-content" @click.stop>
            <a href="#" @click.prevent="avisar('Clientes')">Clientes</a>
            <a href="#" @click.prevent="avisar('Fornecedores')">Fornecedores</a>
            <a href="#" @click.prevent="avisar('Funcionários')">Funcionários</a>
            <a href="#" @click.prevent="avisar('Produtos')">Produtos</a>
          </div>
        </div>

        <!-- Produção -->
        <div
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'producao' }"
          @click="toggleDropdown('producao')"
        >
          <button type="button" class="dropdown-toggle">Produção</button>
          <div class="dropdown-content" @click.stop>
            <a href="#" @click.prevent="avisar('Plano de Corte')">Plano de Corte</a>
          </div>
        </div>

        <!-- Configurações -->
        <div
          class="dropdown-menu"
          :class="{ active: activeDropdown === 'config' }"
          @click="toggleDropdown('config')"
        >
          <button type="button" class="dropdown-toggle">Configurações</button>
          <div class="dropdown-content" @click.stop>
            <a href="#" @click.prevent="avisar('Constantes')">Constantes</a>
            <a href="#" @click.prevent="avisar('Usuários')">Usuários</a>
          </div>
        </div>

        <!-- Link direto para Home -->
        <RouterLink to="/">Início</RouterLink>
      </nav>

      <div class="user-area">
        <span>Olá, {{ user?.nome || 'Usuário' }}</span>
        <button class="btn-logout" type="button" @click="logout">
          Sair
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import '@/assets/CSS/Menu.css'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storage } from '@/utils/storage'

const router = useRouter()

const user = computed(() => storage.getUser())
const isScrolled = ref(false)
const activeDropdown = ref(null)

function toggleDropdown(menu) {
  activeDropdown.value = activeDropdown.value === menu ? null : menu
}

function closeDropdownOnClickOutside(event) {
  const navElement = document.querySelector('.nav')
  if (navElement && !navElement.contains(event.target)) {
    activeDropdown.value = null
  }
}

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

function logout() {
  storage.removeToken()
  storage.removeUser()
  router.push('/login')
}

// enquanto as páginas não existem, não navega
function avisar(modulo) {
  activeDropdown.value = null
  alert(`${modulo}: página ainda não criada.`)
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('click', closeDropdownOnClickOutside)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', closeDropdownOnClickOutside)
})
</script>
