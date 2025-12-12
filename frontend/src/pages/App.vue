<script setup>
import { ref, computed } from 'vue';
import Dashboard from './Dashboard.vue';

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const token = ref(localStorage.getItem('acasa_token'));

const isAuthenticated = computed(() => !!token.value);

/* LOGIN */
const handleLogin = async () => {
  errorMessage.value = '';
  loading.value = true;

  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao autenticar');
    }

    localStorage.setItem('acasa_token', data.token);
    localStorage.setItem('acasa_user', JSON.stringify(data.user));

    token.value = data.token;

    email.value = '';
    password.value = '';
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
};

/* LOGOUT */
const handleLogout = () => {
  localStorage.removeItem('acasa_token');
  localStorage.removeItem('acasa_user');
  token.value = null;
};
</script>

<template>
  <!-- DASHBOARD -->
  <Dashboard v-if="isAuthenticated" @logout="handleLogout" />

  <!-- LOGIN -->
  <div v-else class="login-wrapper">
    <div class="login-card">
      
      <!-- HEADER -->
      <div class="login-header">
        <h1>A Casa</h1>
        <p>Móveis Planejados</p>
      </div>

      <!-- DESCRIÇÃO -->
      <div class="login-description">
        <h3>Acesso ao Sistema</h3>
        <p>Gestão interna e projetos</p>
      </div>

      <!-- ERRO -->
      <div v-if="errorMessage" class="login-error">
        {{ errorMessage }}
      </div>

      <!-- FORM -->
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label>E-mail</label>
          <input
            type="email"
            v-model="email"
            placeholder="ex: admin@acasa.com"
            required
            :disabled="loading"
          />
        </div>

        <div class="input-group">
          <label>Senha</label>
          <input
            type="password"
            v-model="password"
            placeholder="Digite sua senha"
            required
            :disabled="loading"
          />
        </div>

        <button class="btn-login" type="submit" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <!-- LINKS -->
      <div class="login-links">
        <a href="#">Esqueci a senha</a>
        <span>|</span>
        <a href="#">Solicitar acesso</a>
      </div>
    </div>
  </div>
</template>

<style>
@import '../assets/css/pages/Login.css';
</style>
