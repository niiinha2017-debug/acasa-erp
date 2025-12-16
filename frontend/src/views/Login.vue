<template>
  <div class="login-page">
    <div class="login-box">
      <!-- Cabeçalho -->
      <div class="login-header">
        <h1 class="login-brand">A CASA-ERP</h1>
        <p class="login-subtitle">Sistema de Gestão Empresarial</p>
      </div>

      <!-- Título -->
      <h2 class="login-title">Acessar Sistema</h2>

      <!-- Formulário -->
      <form @submit.prevent="handleSubmit" class="login-form" novalidate>
        <!-- Email -->
        <div class="input-group email" :class="{ 'has-error': errors.email }">
          <label for="email">E-mail</label>
          <input
            id="email"
            type="email"
            v-model="form.email"
            :disabled="auth.loading.value"
            placeholder="seu@email.com"
            @blur="validateField('email')"
            @input="clearError('email')"
            autocomplete="email"
            required
          />
          <span v-if="errors.email" class="input-error">
            {{ errors.email }}
          </span>
        </div>

        <!-- Senha -->
        <div class="input-group password" :class="{ 'has-error': errors.password }">
          <label for="password">Senha</label>
          <input
            id="password"
            type="password"
            v-model="form.password"
            :disabled="auth.loading.value"
            placeholder="••••••••"
            @blur="validateField('password')"
            @input="clearError('password')"
            autocomplete="current-password"
            required
          />
          <span v-if="errors.password" class="input-error">
            {{ errors.password }}
          </span>
        </div>

        <!-- Opções -->
        <div class="login-options">
          <label class="remember-me">
            <input
              type="checkbox"
              v-model="form.remember"
              :disabled="auth.loading.value"
            />
            <span>Lembrar-me</span>
          </label>

          <a
            href="#"
            class="forgot-password"
            @click.prevent="handleForgotPassword"
          >
            Esqueceu a senha?
          </a>
        </div>

        <!-- Botão -->
        <button
          type="submit"
          class="btn-login"
          :disabled="auth.loading.value || !isFormValid"
        >
          <span v-if="!auth.loading.value">Entrar no Sistema</span>
          <span v-else>Conectando...</span>
        </button>

        <!-- Erro -->
        <div v-if="auth.error && auth.error.length" class="login-error">
          {{ auth.error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import '../assets/CSS/Login.css'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const auth = useAuth()

const form = reactive({
  email: '',
  password: '',
  remember: false
})

const errors = reactive({
  email: '',
  password: ''
})

const isFormValid = computed(() => {
  return (
    form.email &&
    form.password &&
    !errors.email &&
    !errors.password
  )
})

const validateEmail = (email) => {
  if (!email) return 'E-mail é obrigatório'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'E-mail inválido'
  return ''
}

const validatePassword = (password) => {
  if (!password) return 'Senha é obrigatória'
  if (password.length < 6) return 'Senha deve ter no mínimo 6 caracteres'
  return ''
}

const validateField = (field) => {
  if (field === 'email') errors.email = validateEmail(form.email)
  if (field === 'password') errors.password = validatePassword(form.password)
}

const validateForm = () => {
  validateField('email')
  validateField('password')
  return !errors.email && !errors.password
}

const handleSubmit = async () => {
  if (!validateForm()) return

  const result = await auth.login({
    email: form.email.trim(),
    password: form.password
  })

  if (result?.success) {
    router.push('/')
  }
}

const handleForgotPassword = () => {
  alert('Funcionalidade de recuperação de senha não implementada.')
}

const clearError = (field) => {
  errors[field] = ''
  auth.error = ''
}

const emailInput = ref(null)

onMounted(() => {
  emailInput.value?.focus()
})
</script>
