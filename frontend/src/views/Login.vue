<template>
  <div class="login-split">
    <!-- Lado Esquerdo -->
    <div class="login-left-side">
      <div class="left-content">

        <div class="brand-header">
          <h1 class="brand-title">A Casa</h1>
          <h2 class="brand-subtitle">Sistema de Gestão</h2>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🏠</div>
            <div class="feature-content">
              <h3>Financeiro</h3>
              <p>Receitas e despesas</p>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🏭</div>
            <div class="feature-content">
              <h3>Produção</h3>
              <p>Processos em tempo real</p>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <div class="feature-content">
              <h3>Estratégico</h3>
              <p>Indicadores inteligentes</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Lado Direito -->
    <div class="login-right-side">
      <div class="right-content">

        <div class="form-header">
          <h2 class="form-title">Acesso</h2>
          <p class="form-subtitle">Entre com suas credenciais</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">

          <!-- EMAIL -->
          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input
              type="email"
              class="form-input"
              v-model="email"
              placeholder="admin@acasa.com"
              required
            />
          </div>

          <!-- SENHA -->
          <div class="form-group">
            <label class="form-label">Senha</label>

            <div class="input-container">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                v-model="password"
                placeholder="••••••••"
                required
              />

              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <!-- MANTER CONECTADO -->
          <div class="checkbox-container">
            <label class="checkbox-label">
              <input type="checkbox" v-model="rememberMe" />
              <span>Manter conectado</span>
            </label>
          </div>

          <!-- BOTÃO -->
          <button
            type="submit"
            class="submit-button"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Entrar no sistema</span>
            <span v-else>Entrando...</span>
          </button>

          <!-- ERRO -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

        </form>

      </div>
    </div>
  </div>
</template>

<script setup>
import '../assets/CSS/Main.css';
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const auth = useAuth()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)

const showPassword = ref(false)   // ✅ FALTAVA ISSO
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Preencha e-mail e senha'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await auth.login({
      email: email.value,
      password: password.value,
    })

    if (result?.success !== false) {
      router.push('/')
    } else {
      errorMessage.value = result?.message || 'Erro ao fazer login'
    }

  } catch (err) {
    errorMessage.value = 'Erro inesperado ao fazer login'
  } finally {
    isLoading.value = false
  }
}
</script>