<template>
  <div class="login-split">
    <!-- Lado Esquerdo: Branding & Features -->
    <div class="login-left-side">
      <div class="left-content">
        <!-- Logo -->
        <div class="brand-header">
          <h1 class="brand-title">A Casa</h1>
          <h2 class="brand-subtitle">Sistema de Gestão</h2>
        </div>

        <!-- Features Grid -->
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L20 9V22H4V9L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="feature-content">
              <h3>Financeiro</h3>
              <p>Receitas e despesas</p>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="feature-content">
              <h3>Produção</h3>
              <p>Processos em tempo real</p>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" stroke-width="2"/>
                <path d="M8 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M8 14H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="18" cy="12" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div class="feature-content">
              <h3>Estratégico</h3>
              <p>Indicadores inteligentes</p>
            </div>
          </div>
        </div>

        <!-- Decoração do lado esquerdo -->
        <div class="left-decoration">
          <div class="decoration-circle"></div>
          <div class="decoration-circle"></div>
          <div class="decoration-circle"></div>
        </div>
      </div>
    </div>

    <!-- Lado Direito: Formulário de Login -->
    <div class="login-right-side">
      <div class="right-content">
        <!-- Header do Formulário -->
        <div class="form-header">
          <h2 class="form-title">Acesso</h2>
          <p class="form-subtitle">Entre com suas credenciais</p>
        </div>

        <!-- Formulário -->
        <form class="login-form" @submit.prevent="handleLogin">
          <!-- Email -->
          <div class="form-group">
            <label for="email" class="form-label">
              E-MAIL
            </label>
            <div class="input-container">
              <input
                id="email"
                type="email"
                v-model="email"
                placeholder="admin@acasa.com"
                class="form-input"
                required
              >
              <div class="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M22 6L12 13L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Senha -->
          <div class="form-group">
            <div class="form-label-row">
              <label for="password" class="form-label">
                SENHA
              </label>
              <a href="#" class="forgot-link">Esqueceu?</a>
            </div>
            <div class="input-container">
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                placeholder="••••••••"
                class="form-input"
                required
              >
              <div class="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12C2 12 5 7 12 7C19 7 22 12 22 12C22 12 19 17 12 17C5 17 2 12 2 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <button 
                type="button" 
                @click="showPassword = !showPassword"
                class="password-toggle"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path v-if="!showPassword" d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path v-if="!showPassword" d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path v-if="showPassword" d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path v-if="showPassword" d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line v-if="showPassword" x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Checkbox Manter Conectado -->
          <div class="checkbox-container">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="rememberMe"
                class="checkbox-input"
              >
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">Manter conectado</span>
            </label>
          </div>

          <!-- Botão de Entrar -->
          <button 
            type="submit" 
            :loading="auth.loading.value"
            class="submit-button"
          >
            <span v-if="!isLoading">Entrar no sistema</span>
            <span v-else class="loading-text">
              <span class="loading-dots"></span>
              Entrando...
            </span>
          </button>

          <!-- Mensagem de Erro -->
          <div v-if="errorMessage" class="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {{ errorMessage }}
          </div>

          <!-- Footer do Formulário -->
          <div class="form-footer">
            <p>
              Primeiro acesso? 
              <a href="#" class="footer-link">Solicitar conta</a>
            </p>
          </div>
        </form>
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
/* Reset e Configurações Base */
.login-split {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr; /* Duas colunas iguais */
  font-family: var(--font-sans, 'Inter', -apple-system, system-ui, sans-serif);
}

/* ============ LADO ESQUERDO ============ */
.login-left-side {
  background: linear-gradient(135deg, 
    var(--brand-primary, #2c5282),
    var(--brand-primary-light, #4299e1)
  );
  color: var(--text-on-primary, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.login-left-side::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%);
}

.left-content {
  max-width: 480px;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* Branding */
.brand-header {
  margin-bottom: 4rem;
}

.brand-title {
  font-size: var(--font-size-5xl, 3rem);
  font-weight: var(--font-weight-black, 900);
  line-height: 1.1;
  margin-bottom: 0.5rem;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  font-size: var(--font-size-xl, 1.25rem);
  font-weight: var(--font-weight-medium, 500);
  opacity: 0.9;
}

/* Features Grid */
.features-grid {
  display: grid;
  gap: 1.5rem;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-xl, 16px);
  transition: all 0.3s ease;
  cursor: pointer;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.3);
}

.feature-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-lg, 12px);
  flex-shrink: 0;
}

.feature-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.feature-content h3 {
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: var(--font-weight-semibold, 600);
  margin-bottom: 0.25rem;
}

.feature-content p {
  font-size: var(--font-size-sm, 0.875rem);
  opacity: 0.8;
  line-height: 1.4;
}

/* Decoração */
.left-decoration {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  gap: 0.5rem;
}

.decoration-circle {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.decoration-circle:nth-child(2) {
  animation-delay: 0.4s;
}

.decoration-circle:nth-child(3) {
  animation-delay: 0.8s;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* ============ LADO DIREITO ============ */
.login-right-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg-page, #f8fafc);
}

.right-content {
  max-width: 420px;
  width: 100%;
}

/* Form Header */
.form-header {
  margin-bottom: 3rem;
  text-align: center;
}

.form-title {
  font-size: var(--font-size-3xl, 1.875rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--text-primary, #1a202c);
  margin-bottom: 0.5rem;
}

.form-subtitle {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-secondary, #718096);
}

/* Form Groups */
.form-group {
  margin-bottom: 1.75rem;
}

.form-label {
  display: block;
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-secondary, #718096);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.forgot-link {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--brand-primary, #4299e1);
  text-decoration: none;
  font-weight: var(--font-weight-medium, 500);
  transition: color 0.2s ease;
}

.forgot-link:hover {
  color: var(--brand-primary-dark, #3182ce);
  text-decoration: underline;
}

/* Input Container */
.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  height: 56px;
  padding: 0 3rem 0 3rem;
  background: var(--bg-card, #ffffff);
  border: 2px solid var(--border-color, #e2e8f0);
  border-radius: var(--border-radius-lg, 12px);
  font-size: var(--font-size-base, 1rem);
  color: var(--text-primary, #1a202c);
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--brand-primary, #4299e1);
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
}

.form-input::placeholder {
  color: var(--text-tertiary, #a0aec0);
}

.input-icon {
  position: absolute;
  left: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary, #a0aec0);
}

.input-icon svg {
  width: 20px;
  height: 20px;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: var(--text-tertiary, #a0aec0);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: var(--brand-primary, #4299e1);
}

/* Checkbox */
.checkbox-container {
  margin: 2rem 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color, #e2e8f0);
  border-radius: var(--border-radius-sm, 6px);
  background: var(--bg-card, #ffffff);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-input:checked + .checkbox-custom {
  background: var(--brand-primary, #4299e1);
  border-color: var(--brand-primary, #4299e1);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-text {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-primary, #1a202c);
  font-weight: var(--font-weight-medium, 500);
}

/* Submit Button */
.submit-button {
  width: 100%;
  height: 56px;
  background: var(--brand-primary, #4299e1);
  color: white;
  border: none;
  border-radius: var(--border-radius-lg, 12px);
  font-size: var(--font-size-base, 1rem);
  font-weight: var(--font-weight-semibold, 600);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.5rem;
}

.submit-button:hover:not(:disabled) {
  background: var(--brand-primary-dark, #3182ce);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  background: var(--bg-disabled, #cbd5e0);
  cursor: not-allowed;
  transform: none !important;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-dots {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: white;
  animation: bounce 1.4s infinite;
}

.loading-dots:nth-child(2) {
  animation-delay: -0.16s;
}

.loading-dots:nth-child(3) {
  animation-delay: -0.32s;
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Error Message */
.error-message {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--danger-bg, #fed7d7);
  color: var(--danger, #c53030);
  border-radius: var(--border-radius-lg, 12px);
  font-size: var(--font-size-sm, 0.875rem);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Form Footer */
.form-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color, #e2e8f0);
  text-align: center;
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-secondary, #718096);
}

.footer-link {
  color: var(--brand-primary, #4299e1);
  text-decoration: none;
  font-weight: var(--font-weight-medium, 500);
  margin-left: 0.25rem;
}

.footer-link:hover {
  text-decoration: underline;
}

/* ============ RESPONSIVIDADE ============ */
@media (max-width: 1024px) {
  .login-split {
    grid-template-columns: 1fr;
  }
  
  .login-left-side {
    min-height: 40vh;
    padding: 3rem 2rem;
  }
  
  .left-content {
    max-width: 600px;
  }
  
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .feature-card {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem 1rem;
  }
  
  .feature-icon {
    margin-bottom: 1rem;
  }
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .feature-card {
    flex-direction: row;
    text-align: left;
    padding: 1.25rem;
  }
  
  .feature-icon {
    margin-bottom: 0;
  }
  
  .form-input, .submit-button {
    height: 52px;
  }
}

@media (max-width: 480px) {
  .login-split {
    min-height: 100vh;
  }
  
  .login-left-side,
  .login-right-side {
    padding: 1.5rem;
  }
  
  .brand-title {
    font-size: 2.5rem;
  }
  
  .feature-card {
    padding: 1rem;
  }
  
  .form-input, .submit-button {
    height: 48px;
  }
  
  .form-title {
    font-size: 1.5rem;
  }
}
</style>