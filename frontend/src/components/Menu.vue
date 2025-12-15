<template>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand" @click="router.push('/')">
        ACASA-ERP
      </div>

      <nav class="nav">
        <router-link to="/">Dashboard</router-link>
        <router-link to="/clientes">Clientes</router-link>
      </nav>

      <div class="user-area">
        <span>Olá, Ana</span>
        <button class="btn-logout" @click="logout">
          Sair
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function logout() {
  localStorage.removeItem('acasa_token')
  localStorage.removeItem('acasa_user')
  router.push('/login')
}
</script>
