<script setup>
import { ref } from 'vue'
import { api } from '../services/api'

const email = ref('admin@acasa.com')
const senha = ref('123456')
const carregando = ref(false)

const fazerLogin = async () => {
  carregando.value = true

  try {
    const response = await api.post('/auth/login', {
      email: email.value,
      password: senha.value
    })

    const token = response.token
    const usuario = response.user

    localStorage.setItem('acasa_token', token)
    localStorage.setItem('acasa_user', JSON.stringify(usuario))

    window.location.href = '/'
  } catch (error) {
    const msg = error?.message || 'Erro desconhecido'
    alert('❌ Falha no login: ' + msg)
  } finally {
    carregando.value = false
  }
}
</script>


<template>
  <div class="login-page">
    <div class="login-box">
      <h1 class="login-title">ACASA ERP</h1>

      <form class="login-form" @submit.prevent="fazerLogin">
        <input
          type="email"
          placeholder="E-mail"
          v-model="email"
        />

        <input
          type="password"
          placeholder="Senha"
          v-model="senha"
        />

        <button
          type="submit"
          class="btn-gradient"
          :disabled="carregando"
        >
          {{ carregando ? 'Conectando…' : 'Entrar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
@import '../assets/CSS/Login.css';
</style>
