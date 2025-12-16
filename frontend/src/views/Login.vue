<template>
  <div class="login-minimal">
    <!-- Container Central -->
    <div class="login-center">
      <!-- Logo Simples -->
      <div class="logo-minimal">
        <svg width="160" height="40" viewBox="0 0 160 40">
          <rect width="160" height="40" fill="#3A78A8" rx="6"/>
          <text x="80" y="26" text-anchor="middle" fill="white" 
                font-family="Inter" font-size="18" font-weight="500">A Casa</text>
        </svg>
        <p class="system-subtitle">Sistema de Gestão</p>
      </div>

      <!-- Features Grid Minimalista -->
      <div class="features-minimal">
        <div class="feature">
          <div class="feature-icon">💰</div>
          <div>
            <h3>Financeiro</h3>
            <p>Receitas e despesas</p>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-icon">⚙️</div>
          <div>
            <h3>Produção</h3>
            <p>Processos em tempo real</p>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-icon">📊</div>
          <div>
            <h3>Estratégico</h3>
            <p>Indicadores inteligentes</p>
          </div>
        </div>
      </div>

      <!-- Formulário Minimalista -->
      <div class="form-minimal">
        <h2>Acesso</h2>
        
        <!-- Email -->
        <div class="input-group">
          <label>E-mail</label>
          <div class="input-wrapper">
            <input 
              type="email" 
              v-model="email"
              placeholder="admin@acasa.com"
              class="input-clean"
            >
          </div>
        </div>

        <!-- Senha -->
        <div class="input-group">
          <div class="label-row">
            <label>Senha</label>
            <a href="#" class="link-minimal">Esqueceu?</a>
          </div>
          <div class="input-wrapper">
            <input 
              type="password" 
              v-model="password"
              placeholder="••••••••"
              class="input-clean"
            >
          </div>
        </div>

        <!-- Lembrar -->
        <div class="checkbox-minimal">
          <label>
            <input type="checkbox" v-model="rememberMe">
            <span>Manter conectado</span>
          </label>
        </div>

        <!-- Botão -->
        <button 
          @click="handleLogin"
          :disabled="isLoading"
          class="btn-primary"
        >
          {{ isLoading ? 'Entrando...' : 'Entrar no sistema' }}
        </button>

        <!-- Erro Minimalista -->
        <div v-if="errorMessage" class="error-minimal">
          {{ errorMessage }}
        </div>

        <!-- Footer -->
        <div class="footer-minimal">
          <p>Primeiro acesso? <a href="#" class="link-minimal">Solicitar conta</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const auth = useAuth()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
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
      password: password.value
    })

    if (result.success) {
      - router.push('/dashboard')
        + router.push('/')

    } else {
      errorMessage.value = result.message || 'Erro ao fazer login'
    }

  } catch (err) {
    errorMessage.value = 'Erro inesperado ao fazer login'
  } finally {
    isLoading.value = false
  }
}
</script>


<style scoped>
/* Reset Minimalista */
.login-minimal {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-50);
  padding: 2rem;
}

.login-center {
  width: 100%;
  max-width: 400px;
}

/* Logo */
.logo-minimal {
  text-align: center;
  margin-bottom: 3rem;
}

.system-subtitle {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-top: 0.5rem;
  letter-spacing: 0.5px;
}

/* Features */
.features-minimal {
  display: grid;
  gap: 1rem;
  margin-bottom: 3rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.feature:hover {
  border-color: var(--brand-primary);
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 1.25rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-primary-soft);
  color: var(--brand-primary);
  border-radius: 10px;
}

.feature h3 {
  font-size: 0.9375rem;
  color: var(--gray-900);
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.feature p {
  font-size: 0.8125rem;
  color: var(--gray-600);
  line-height: 1.4;
}

/* Formulário */
.form-minimal {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid var(--gray-200);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.form-minimal h2 {
  font-size: 1.25rem;
  color: var(--gray-900);
  font-weight: 500;
  margin-bottom: 1.5rem;
  text-align: center;
}

.input-group {
  margin-bottom: 1.25rem;
}

.input-group label {
  display: block;
  font-size: 0.8125rem;
  color: var(--gray-700);
  font-weight: 500;
  margin-bottom: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-wrapper {
  position: relative;
}

.input-clean {
  width: 100%;
  height: 48px;
  padding: 0 1rem;
  background: var(--gray-50);
  border: 1px solid var(--gray-300);
  border-radius: 10px;
  font-size: 0.9375rem;
  color: var(--gray-900);
  transition: all 0.2s ease;
}

.input-clean:focus {
  outline: none;
  border-color: var(--brand-primary);
  background: white;
  box-shadow: 0 0 0 3px rgba(58, 120, 168, 0.1);
}

/* Links */
.link-minimal {
  font-size: 0.8125rem;
  color: var(--brand-primary);
  text-decoration: none;
  font-weight: 500;
}

.link-minimal:hover {
  text-decoration: underline;
}

/* Checkbox */
.checkbox-minimal {
  margin: 1.5rem 0;
}

.checkbox-minimal label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--gray-700);
}

.checkbox-minimal input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--gray-400);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox-minimal input[type="checkbox"]:checked {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
}

/* Botão */
.btn-primary {
  width: 100%;
  height: 48px;
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:hover:not(:disabled) {
  background: var(--brand-primary-dark);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: var(--gray-400);
  cursor: not-allowed;
}

/* Erro */
.error-minimal {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #FEE2E2;
  color: #DC2626;
  border-radius: 8px;
  font-size: 0.8125rem;
  text-align: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Footer */
.footer-minimal {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--gray-200);
  text-align: center;
  font-size: 0.8125rem;
  color: var(--gray-600);
}

/* Responsivo */
@media (max-width: 480px) {
  .login-minimal {
    padding: 1rem;
  }
  
  .form-minimal {
    padding: 1.5rem;
  }
  
  .features-minimal {
    margin-bottom: 2rem;
  }
}
</style>