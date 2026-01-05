<template>
  <div class="login-split">

    <!-- LADO ESQUERDO -->
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
              <h3>Gestão</h3>
              <p>Controle e relatórios do negócio</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- LADO DIREITO -->
    <div class="login-right-side">
      <div class="right-content">

        <div class="form-header">
          <h2 class="form-title">Acesso</h2>
          <p class="form-subtitle">Entre com suas credenciais</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">

          <div class="form-group">
            <label class="form-label">Usuário</label>
            <input
              type="text"
              class="form-input"
              v-model="usuario"
              placeholder="admin"
              autocomplete="username"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Senha</label>
            <div class="input-container">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                v-model="senha"
                autocomplete="current-password"
                required
              />
<button
  type="button"
  class="password-toggle"
  @click="showPassword = !showPassword"
  :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
>
  <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
       viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M2.458 12C3.732 7.943 7.523 5 12 5
         c4.478 0 8.268 2.943 9.542 7
         -1.274 4.057-5.064 7-9.542 7
         -4.477 0-8.268-2.943-9.542-7z" />
  </svg>

  <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
       viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M13.875 18.825A10.05 10.05 0 0112 19
         c-4.478 0-8.268-2.943-9.542-7
         a9.956 9.956 0 012.042-3.368" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M6.223 6.223A9.957 9.957 0 0112 5
         c4.478 0 8.268 2.943 9.542 7
         a9.97 9.97 0 01-4.042 5.568" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M3 3l18 18" />
  </svg>
</button>

            </div>
          </div>

          <!-- ESQUECI MINHA SENHA -->
          <div class="mt-1">
            <a href="#" class="request-access-link" @click.prevent="abrirRecuperacao">
              Esqueci minha senha
            </a>
          </div>

          <button
            type="submit"
            class="submit-button"
            :disabled="loading"
            :aria-busy="loading"
          >
            {{ loading ? 'Entrando...' : 'Entrar no sistema' }}
          </button>

          <!-- SOLICITAR CADASTRO -->
          <p class="request-access-link">
            Ainda não tem acesso?
            <a href="#" @click.prevent="abrirCadastro">Solicitar Cadastro</a>
          </p>

          <div v-if="erro" class="error-message">
            {{ erro }}
          </div>

        </form>

      </div>
    </div>

    <!-- MODAL: SOLICITAR CADASTRO -->
    <div v-if="showModalCadastro" class="modal-overlay" @click.self="showModalCadastro = false">
      <div class="modal-container">

        <div class="modal-header">
          <h3>Solicitar Cadastro</h3>
          <p>Seus dados serão analisados pelo administrador.</p>
        </div>

        <form @submit.prevent="handleCadastro">
          <div class="form-group">
            <label class="form-label">Nome Completo</label>
            <input class="form-input" v-model="cadastro.nome" required />
          </div>

          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input type="email" class="form-input" v-model="cadastro.email" required />
          </div>

          <div class="form-group">
            <label class="form-label">Usuário</label>
            <input class="form-input" v-model="cadastro.usuario" required />
          </div>

          <div class="form-group">
            <label class="form-label">Senha</label>
            <input type="password" class="form-input" v-model="cadastro.senha" minlength="6" required />
          </div>

          <div class="modal-footer modal-footer-actions">
            <button type="button" class="btn-cancel" @click="showModalCadastro = false">
              Cancelar
            </button>

            <button type="submit" class="submit-button" :disabled="cadastroLoading">
              {{ cadastroLoading ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>
        </form>

      </div>
    </div>

    <!-- MODAL: RECUPERAR SENHA -->
    <div v-if="showModalRecuperacao" class="modal-overlay" @click.self="showModalRecuperacao = false">
      <div class="modal-container">

        <div class="modal-header">
          <h3>Recuperar Senha</h3>
          <p>Digite seu e-mail cadastrado para receber as instruções.</p>
        </div>

        <form @submit.prevent="handleRecuperacao">
          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input
              type="email"
              class="form-input"
              v-model="recuperacaoEmail"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div class="modal-footer modal-footer-actions">
            <button type="button" class="btn-cancel" @click="showModalRecuperacao = false">
              Cancelar
            </button>

            <button type="submit" class="submit-button" :disabled="recuperacaoLoading">
              {{ recuperacaoLoading ? 'Enviando...' : 'Enviar link' }}
            </button>
          </div>
        </form>

      </div>
    </div>

  </div>
</template>

<script setup>
import '../assets/CSS/Login.css'
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { storage } from '@/utils/storage'

const router = useRouter()

// LOGIN
const usuario = ref('')
const senha = ref('')
const showPassword = ref(false)
const loading = ref(false)
const erro = ref('')

async function handleLogin() {
  loading.value = true
  erro.value = ''

  try {
    const { data } = await api.post('/auth/login', {
      usuario: usuario.value,
      senha: senha.value,
    })

    storage.setToken(data.token)
    storage.setUser(data.usuario)

    router.push('/')
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao fazer login'
  } finally {
    loading.value = false
  }
}

// MODAL CADASTRO
const showModalCadastro = ref(false)
const cadastroLoading = ref(false)
const cadastro = reactive({
  nome: '',
  email: '',
  usuario: '',
  senha: '',
})

function abrirCadastro() {
  // limpa e abre
  cadastro.nome = ''
  cadastro.email = ''
  cadastro.usuario = ''
  cadastro.senha = ''
  showModalCadastro.value = true
}

async function handleCadastro() {
  cadastroLoading.value = true

  try {
    // backend atual exige: setor/funcao/status (usuario não escolhe)
    await api.post('/auth/cadastro', {
      nome: cadastro.nome,
      usuario: cadastro.usuario,
      email: cadastro.email,
      senha: cadastro.senha,

      // provisório para satisfazer o DTO atual
      setor: 'PENDENTE',
      funcao: 'PENDENTE',
      status: 'PENDENTE',
    })

    alert('Solicitação enviada! Aguarde aprovação do administrador.')
    showModalCadastro.value = false
  } catch (e) {
    const msg = e?.response?.data?.message || 'Erro ao solicitar cadastro'
    alert(msg)
  } finally {
    cadastroLoading.value = false
  }
}

// MODAL RECUPERAÇÃO
const showModalRecuperacao = ref(false)
const recuperacaoEmail = ref('')
const recuperacaoLoading = ref(false)

function abrirRecuperacao() {
  recuperacaoEmail.value = ''
  showModalRecuperacao.value = true
}

async function handleRecuperacao() {
  recuperacaoLoading.value = true
  try {
    await api.post('/recuperacao-senha/solicitar', { email: recuperacaoEmail.value })
    alert('Se o e-mail existir, você receberá instruções em instantes.')
    showModalRecuperacao.value = false
  } catch (e) {
    alert('Erro ao solicitar recuperação. Tente novamente.')
  } finally {
    recuperacaoLoading.value = false
  }
}
</script>

<route lang="yaml">
meta:
  public: true
</route>
