<script setup>
import '@/assets/CSS/pages/Login.css'

import { ref, onMounted } from 'vue' // ← ADICIONAR onMounted aqui
import Dashboard from '@/pages/Dashboard.vue'
import api from './services/api'

const username = ref('')
const password = ref('')
const usuarioLogado = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Verificar se usuário já está logado ao carregar
onMounted(() => {
  const user = localStorage.getItem('acasa_user')
  if (user) {
    usuarioLogado.value = true
  }
})

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = 'Por favor, preencha todos os campos'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const response = await api.post('/users/login', {
      email: username.value.trim(),
      password: password.value
    })

    if (response.data.error) {
      errorMessage.value = response.data.message
      return
    }

    // Armazenar token JWT se a API retornar
    if (response.data.token) {
      localStorage.setItem('acasa_token', response.data.token)
    }
    
    localStorage.setItem('acasa_user', JSON.stringify(response.data.user))
    usuarioLogado.value = true

  } catch (err) {
    console.error('Login error:', err)
    errorMessage.value = err.response?.data?.message || 'Erro ao tentar fazer login!'
  } finally {
    isLoading.value = false
  }
}

const handleLogout = () => {
  localStorage.removeItem('acasa_user')
  localStorage.removeItem('acasa_token')
  usuarioLogado.value = false
  username.value = ''
  password.value = ''
}
</script>

<template>
  <Dashboard v-if="usuarioLogado" @logout="handleLogout" />

  <div v-else>
    <div class="login-wrapper">
      <div class="login-card">
        
        <!-- Cabeçalho (mantenha do seu código original) -->
        <div class="login-header">
          <h1><i class="fas fa-home"></i> A Casa</h1>
          <p>Sistema de Gestão Empresarial</p>
        </div>

        <div class="login-description">
          <h3>Entrar no Sistema</h3>
          <p>Bem-vindo de volta!</p>
        </div>

        <!-- Mensagem de erro -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          
          <!-- INPUT DE USUÁRIO/EMAIL (NÃO REMOVER!) -->
          <div class="input-group">
            <label>Usuário</label>
            <input 
              type="email" 
              v-model="username" 
              placeholder="ex: admin@acasa.com"
              required
              :disabled="isLoading"
            >
          </div>

          <!-- INPUT DE SENHA (NÃO REMOVER!) -->
          <div class="input-group">
            <label>Senha</label>
            <input 
              type="password" 
              v-model="password" 
              placeholder="Digite sua senha"
              required
              :disabled="isLoading"
            >
          </div>

          <button 
            class="btn-login" 
            type="submit"
            :disabled="isLoading"
          >
            <span v-if="isLoading">
              <i class="fas fa-spinner fa-spin"></i> Processando...
            </span>
            <span v-else>ENTRAR</span>
          </button>
          
          <!-- Links de recuperação (mantenha do original) -->
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

<style scoped>
/* Estilos do seu código original */
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f4f7fb;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  padding: 2.5rem;
  border-radius: 14px;
  box-shadow: 0px 8px 25px rgba(0,0,0,0.08);
  text-align: center;
  animation: fadeIn 0.4s ease;
}

.login-header h1 {
  font-size: 2rem;
  margin-bottom: 0.3rem;
  color: #1e3a8a;
}

.login-header p {
  color: #555;
  margin-bottom: 1.5rem;
}

.login-description h3 {
  font-size: 1.4rem;
  margin-bottom: .1rem;
}

.login-description p {
  color: #777;
  margin-bottom: 1.8rem;
}

.input-group {
  text-align: left;
  margin-bottom: 1.3rem;
}

.input-group label {
  font-weight: 600;
  font-size: .9rem;
  color: #444;
}

.input-group input {
  width: 100%;
  padding: 10px 14px;
  margin-top: 4px;
  border-radius: 8px;
  border: 1px solid #d2d6dc;
  background: #fefefe;
  font-size: 1rem;
  transition: 0.2s;
}

.input-group input:focus {
  border-color: #1e3a8a;
  box-shadow: 0 0 0 2px rgba(30,58,138,0.2);
  outline: none;
}

.input-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.btn-login {
  width: 100%;
  background: #1e3a8a;
  color: white;
  padding: 12px;
  border-radius: 8px;
  border: none;
  margin-top: 10px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: 0.2s ease;
}

.btn-login:hover:not(:disabled) {
  background: #1b2f70;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-links {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: .9rem;
}

.login-links a {
  color: #1e3a8a;
  text-decoration: none;
  transition: color 0.2s;
}

.login-links a:hover {
  color: #1b2f70;
  text-decoration: underline;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 1.2rem;
  font-size: 0.9rem;
  border-left: 4px solid #c33;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>