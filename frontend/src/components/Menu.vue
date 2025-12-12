<template>
  <header class="topbar">
    <button class="menu-hamburger" @click="toggleMobile">
      ☰
    </button>

    <h1 class="logo" @click="$router.push('/')">
      ACASA-ERP
    </h1>

    <nav id="topbarMenu" :class="{ active: mobileOpen }">
      <div class="menu-container">
        <!-- DASHBOARD -->
        <div class="menu-category">
          <button class="category-btn" @click="$router.push('/')">
            Dashboard
          </button>
        </div>

        <!-- CLIENTES -->
        <div class="menu-category"
             @mouseenter="open('clientes')"
             @mouseleave="close">
          <button class="category-btn">
            Clientes
          </button>

          <div class="category-dropdown" v-show="openMenu === 'clientes'">
            <router-link to="/clientes">Listar Clientes</router-link>
            <router-link to="/clientes/novo">Novo Cliente</router-link>
          </div>
        </div>
      </div>

      <div class="user-area">
        <span id="userNameDisplay">Admin</span>
        <button id="logoutBtn" @click="logout">
          Sair
        </button>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const openMenu = ref(null)
const mobileOpen = ref(false)

function open(name) {
  openMenu.value = name
}

function close() {
  openMenu.value = null
}

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value
}

function logout() {
  localStorage.clear()
  router.push('/login')
}
</script>


<style scoped>
/* Importa o CSS do Menu que já organizamos na pasta assets */
@import '../assets/css/layout/Menu.css';
</style>