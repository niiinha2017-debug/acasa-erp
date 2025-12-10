<script setup>
console.log("🔥 ESTE É O NOVO APP.VUE!");

import { ref } from 'vue'

// Importa o Dashboard
import Dashboard from '@/pages/Dashboard.vue'

// Chama a API
import api from './services/api';

// ======= VARIÁVEIS IMPORTANTES (FALTAVAM) =======
const username = ref('')
const password = ref('')
const usuarioLogado = ref(false)

// ======= LOGIN =======
const handleLogin = async () => {
  console.log("USERNAME:", username.value);
  console.log("PASSWORD:", password.value);

  try {
    const response = await api.post('/users/login', {
      email: username.value,
      password: password.value
    });

    if (response.data.error) {
      alert(response.data.message);
      return;
    }

    localStorage.setItem('acasa_user', JSON.stringify(response.data.user));

    usuarioLogado.value = true;

  } catch (err) {
    console.error(err);
    alert("Erro ao tentar fazer login!");
  }
};

// ======= LOGOUT =======
const handleLogout = () => {
  usuarioLogado.value = false
  username.value = ''
  password.value = ''
}
</script>

<template>
  <Dashboard v-if="usuarioLogado" @logout="handleLogout" />

  <div v-else class="auth-container">

    <div class="login-wrapper">
      <div class="login-card">
        
        <div class="login-header">
          <h1><i class="fas fa-home"></i> A Casa</h1>
          <p>Sistema de Gestão Empresarial</p>
        </div>

        <div class="login-description">
          <h3>Entrar no Sistema</h3>
          <p>Bem-vindo de volta!</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">

          <div class="input-group">
            <label>Usuário</label>
            <input 
              type="email" 
              v-model="username" 
              placeholder="ex: admin@acasa.com"
              required
            >
          </div>

          <div class="input-group">
            <label>Senha</label>
            <input 
              type="password" 
              v-model="password" 
              placeholder="Digite sua senha"
              required
            >
          </div>

          <button class="btn-login" type="submit">
            ENTRAR
          </button>

          <div class="login-links">
            <a href="#">Esqueci a senha</a>
            <span>|</span>
            <a href="#">Solicitar Acesso</a>
          </div>

        </form>

      </div>
    </div>

  </div>
</template>
