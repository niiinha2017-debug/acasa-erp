<script setup>
  console.log("🔥 ESTE É O NOVO APP.VUE!");

import { ref } from 'vue'

// Importamos a página do Painel
import Dashboard from '@/pages/Dashboard.vue'

// Importamos o CSS do Login V3 (Caminho corrigido com ponto no início)
import '@/assets/CSS/pages/Login.css'

// Controle de estado (Logado ou Não)
const usuarioLogado = ref(false)

// Variáveis do formulário
const username = ref('')
const password = ref('')


const handleLogin = () => {
  console.log("USERNAME:", username.value);
  console.log("PASSWORD:", password.value); 

  if (!username.value || !password.value) {
    alert("Preencha usuário e senha.");
    return;
  }

  usuarioLogado.value = true;
};



// Função de Logout (passada para o Dashboard)
const handleLogout = () => {
  usuarioLogado.value = false
  username.value = ''
  password.value = ''
}
</script>

<template>
  <Dashboard v-if="usuarioLogado" @logout="handleLogout" />

  <div v-else class="auth-container">
    
    <aside class="auth-left">
      <div class="auth-left-content">
        <div class="auth-logo">
          <h1><i class="fas fa-home"></i> A Casa</h1>
          <p>Sistema de Gestão Empresarial</p>
        </div>

        <section class="auth-features">
          <div class="auth-feature">
            <i class="fas fa-money-bill-wave fa-lg"></i>
            <div>
              <h3>Gestão Financeira</h3>
              <p>Controle de receitas e despesas.</p>
            </div>
          </div>
          <div class="auth-feature">
            <i class="fas fa-cogs fa-lg"></i>
            <div>
              <h3>Controle de Produção</h3>
              <p>Acompanhe processos em tempo real.</p>
            </div>
          </div>
          <div class="auth-feature">
            <i class="fas fa-chart-line fa-lg"></i>
            <div>
              <h3>Gestão Estratégica</h3>
              <p>Indicadores para decisões inteligentes.</p>
            </div>
          </div>
        </section>
      </div>
    </aside>

    <main class="auth-right">
      <div class="auth-card">
        <header>
          <h2 class="auth-title">Entrar no Sistema</h2>
          <p class="auth-subtitle">Bem-vindo de volta!</p>
        </header>

        <form @submit.prevent="handleLogin">
          <div class="auth-group">
            <label class="auth-label" for="username">Usuário</label>
            <input 
              type="text" 
              id="username" 
              class="auth-input" 
              v-model="username" 
              placeholder="Digite seu usuário" 
              required
            >
          </div>

          <div class="auth-group">
            <label class="auth-label" for="password">Senha</label>
            <input 
              type="password" 
              id="password" 
              class="auth-input" 
              v-model="password" 
              placeholder="Sua senha" 
              required
            >
          </div>

          <button type="submit" class="auth-btn">
            ENTRAR
          </button>

          <div class="auth-links">
            <a href="#" class="auth-link">Esqueci a senha</a>
            <span>|</span>
            <a href="#" class="auth-link">Solicitar Acesso</a>
          </div>
        </form>
      </div>
    </main>

  </div>
</template>

<style scoped>
/* Nenhum estilo extra necessário aqui, pois tudo vem do Login.css importado no script */
</style>