<template>
  <div class="login-split">
    <!-- =========================
         LADO ESQUERDO (BRAND)
    ========================== -->
    <aside class="login-left-side">
      <div class="left-wrap">
        <header class="brand-header">
          <h1 class="brand-title">A Casa</h1>
          <p class="brand-subtitle">Sistema de Gestão</p>
        </header>

        <section class="features-grid" aria-label="Recursos do sistema">
          <article class="feature-card">
            <div class="feature-icon" aria-hidden="true">🏠</div>
            <div class="feature-content">
              <h3 class="feature-title">Financeiro</h3>
              <p class="feature-text">Receitas e despesas</p>
            </div>
          </article>

          <article class="feature-card">
            <div class="feature-icon" aria-hidden="true">🏭</div>
            <div class="feature-content">
              <h3 class="feature-title">Produção</h3>
              <p class="feature-text">Processos em tempo real</p>
            </div>
          </article>

          <article class="feature-card">
            <div class="feature-icon" aria-hidden="true">📊</div>
            <div class="feature-content">
              <h3 class="feature-title">Gestão</h3>
              <p class="feature-text">Controle e relatórios do negócio</p>
            </div>
          </article>
        </section>
      </div>
    </aside>

    <!-- =========================
         LADO DIREITO (FORM)
    ========================== -->
    <main class="login-right-side">
      <div class="right-wrap">
        <header class="form-header">
          <h2 class="form-title">Acesso</h2>
          <p class="form-subtitle">Entre com suas credenciais</p>
        </header>

        <form class="login-form" @submit.prevent="handleLogin" autocomplete="on">
          <div class="form-group">
            <label class="form-label" for="login-usuario">Usuário ou e-mail</label>
            <input
              id="login-usuario"
              type="text"
              class="form-input"
              v-model="usuario"
              placeholder= "Usuario ou seu@email.com"
              autocomplete="username"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="login-senha">Senha</label>

            <div class="input-container">
              <input
                id="login-senha"
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
                <svg
                  v-if="!showPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5
                       c4.478 0 8.268 2.943 9.542 7
                       -1.274 4.057-5.064 7-9.542 7
                       -4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>

                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19
                       c-4.478 0-8.268-2.943-9.542-7
                       a9.956 9.956 0 012.042-3.368"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6.223 6.223A9.957 9.957 0 0112 5
                       c4.478 0 8.268 2.943 9.542 7
                       a9.97 9.97 0 01-4.042 5.568"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 3l18 18"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="submit-button"
              :disabled="loading"
              :aria-busy="loading"
            >
              {{ loading ? 'Entrando...' : 'Entrar no sistema' }}
            </button>

            <div class="form-links">
              <a href="#" class="link" @click.prevent="abrirRecuperacao">
                Esqueci minha senha
              </a>

              <span class="link-sep" aria-hidden="true">•</span>

              <a href="#" class="link" @click.prevent="abrirCadastro">
                Solicitar cadastro
              </a>
            </div>
          </div>

          <div v-if="erro" class="error-message" role="alert">
            {{ erro }}
          </div>
        </form>
      </div>
    </main>

    <!-- =========================
         MODAL: SOLICITAR CADASTRO
    ========================== -->
    <div
      v-if="showModalCadastro"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Solicitar cadastro"
      @click.self="(showModalCadastro = false, resetCadastro())"

    >
      <div class="modal-container">
        <header class="modal-header">
          <h3 class="modal-title">Solicitar Cadastro</h3>
          <p class="modal-subtitle">Seus dados serão analisados pelo administrador.</p>
        </header>

        <form class="modal-body" @submit.prevent="handleCadastro" autocomplete="off">
          <div class="form-group">
            <label class="form-label" for="cad-nome">Nome Completo</label>
            <input id="cad-nome" class="form-input" v-model="cadastro.nome" required />
            <small v-if="cadastroErro.nome" class="error-message">{{ cadastroErro.nome }}</small>
          </div>

<div class="form-group">
  <label class="form-label" for="cad-email">E-mail</label>
  <input
    id="cad-email"
    type="email"
    class="form-input"
    v-model="cadastro.email"
    autocomplete="email"
    required
  />

  <small v-if="cadastroErro.email" class="error-message">
    {{ cadastroErro.email }}
  </small>
</div>


          <div class="form-group">
            <label class="form-label" for="cad-usuario">Usuário</label>
            <input
              id="cad-usuario"
              class="form-input"
              v-model="cadastro.usuario"
              autocomplete="username"
              required
            />
            <small v-if="cadastroErro.usuario" class="error-message">{{ cadastroErro.usuario }}</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="cad-senha">Senha</label>
            <input
              id="cad-senha"
              type="password"
              class="form-input"
              v-model="cadastro.senha"
              minlength="6"
              autocomplete="new-password"
              required
            />
            <small v-if="cadastroErro.senha" class="error-message">{{ cadastroErro.senha }}</small>
          </div>

<div v-if="cadastroErro.geral" class="error-message" style="margin-top: 8px;">
  {{ cadastroErro.geral }}
</div>

          <footer class="modal-footer">
            <button type="button" class="btn-cancel" @click="(showModalCadastro = false, resetCadastro())"
  >
              Cancelar
            </button>

            <button type="submit" class="submit-button" :disabled="cadastroLoading">
              {{ cadastroLoading ? 'Enviando...' : 'Enviar' }}
            </button>
          </footer>
        </form>
      </div>
    </div>

    <!-- =========================
         MODAL: RECUPERAR SENHA
    ========================== -->
    <div
      v-if="showModalRecuperacao"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Recuperar senha"
      @click.self="showModalRecuperacao = false"
    >
      <div class="modal-container">
        <header class="modal-header">
          <h3 class="modal-title">Recuperar Senha</h3>
          <p class="modal-subtitle">Digite seu e-mail cadastrado para receber as instruções.</p>
        </header>

        <form class="modal-body" @submit.prevent="handleRecuperacao" autocomplete="off">
<div class="form-group">
  <label class="form-label" for="rec-email">E-mail</label>
  <input
    id="rec-email"
    type="email"
    class="form-input"
    v-model="recuperacaoEmail"
    placeholder="seu@email.com"
    autocomplete="email"
    required
  />

  <small v-if="recuperacaoErro" class="error-message">
    {{ recuperacaoErro }}
  </small>

  <small v-if="recuperacaoSucesso" class="success-message">
    {{ recuperacaoSucesso }}
  </small>
</div>
          <footer class="modal-footer">
            <button type="button" class="btn-cancel" @click="showModalRecuperacao = false">
              Cancelar
            </button>

            <button type="submit" class="submit-button" :disabled="recuperacaoLoading">
              {{ recuperacaoLoading ? 'Enviando...' : 'Enviar link' }}
            </button>
          </footer>
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

const cadastroErro = reactive({
  nome: '',
  email: '',
  usuario: '',
  senha: '',
  geral: '',
})

function limparErrosCadastro() {
  cadastroErro.nome = ''
  cadastroErro.email = ''
  cadastroErro.usuario = ''
  cadastroErro.senha = ''
  cadastroErro.geral = ''
}

function resetCadastro() {
  cadastro.nome = ''
  cadastro.email = ''
  cadastro.usuario = ''
  cadastro.senha = ''
  limparErrosCadastro()
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim())
}

function normalizarUsuario(u) {
  return String(u || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

function validarCadastro() {
  limparErrosCadastro()

  const nome = String(cadastro.nome || '').trim()
  const email = String(cadastro.email || '').trim().toLowerCase()
  const usuarioNorm = normalizarUsuario(cadastro.usuario)
  const senhaStr = String(cadastro.senha || '')

  cadastro.nome = nome
  cadastro.email = email
  cadastro.usuario = usuarioNorm

  let ok = true

  if (!nome || nome.length < 3) {
    cadastroErro.nome = 'Informe seu nome (mínimo 3 letras).'
    ok = false
  }

  if (!email || !emailValido(email)) {
    cadastroErro.email = 'Informe um e-mail válido.'
    ok = false
  }

  if (!usuarioNorm) {
    cadastroErro.usuario = 'Informe um usuário.'
    ok = false
  } else {
    if (usuarioNorm.length < 3 || usuarioNorm.length > 20) {
      cadastroErro.usuario = 'Usuário deve ter entre 3 e 20 caracteres.'
      ok = false
    }
    if (!/^[a-z0-9._]+$/.test(usuarioNorm)) {
      cadastroErro.usuario = 'Use apenas letras, números, ponto e underline.'
      ok = false
    }
  }

// SENHA (modelo)
if (!senhaStr || senhaStr.length < 6) {
  cadastroErro.senha = 'Senha deve ter no mínimo 6 caracteres.'
  ok = false
} else if (senhaStr.length > 50) {
  cadastroErro.senha = 'Senha muito longa.'
  ok = false
} else if (/\s/.test(senhaStr)) {
  cadastroErro.senha = 'Senha não pode conter espaços.'
  ok = false
} else if (!/[A-Za-z]/.test(senhaStr) || !/[0-9]/.test(senhaStr)) {
  cadastroErro.senha = 'A senha deve conter letras e números.'
  ok = false
}
  return ok
}

function abrirCadastro() {
  resetCadastro()
  showModalCadastro.value = true
}

async function handleCadastro() {
  cadastroErro.geral = ''

  if (!validarCadastro()) return

  cadastroLoading.value = true
  try {
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

    cadastroErro.geral = ''
    showModalCadastro.value = false
    resetCadastro()

    // se quiser manter alert, ok:
    alert('Solicitação enviada! Aguarde aprovação do administrador.')
  } catch (e) {
    const msg = e?.response?.data?.message || 'Erro ao solicitar cadastro'
    cadastroErro.geral = msg
  } finally {
    cadastroLoading.value = false
  }
}

// MODAL RECUPERAÇÃO
const showModalRecuperacao = ref(false)
const recuperacaoEmail = ref('')
const recuperacaoLoading = ref(false)
const recuperacaoErro = ref('')
const recuperacaoSucesso = ref('')

function abrirRecuperacao() {
  recuperacaoEmail.value = ''
  recuperacaoErro.value = ''
  recuperacaoSucesso.value = ''
  showModalRecuperacao.value = true
}

function validarRecuperacao() {
  recuperacaoErro.value = ''
  recuperacaoSucesso.value = ''

  const email = String(recuperacaoEmail.value || '').trim().toLowerCase()
  recuperacaoEmail.value = email

  if (!emailValido(email)) {
    recuperacaoErro.value = 'Informe um e-mail válido.'
    return false
  }

  return true
}

async function handleRecuperacao() {
  if (!validarRecuperacao()) return

  recuperacaoLoading.value = true
  try {
    await api.post('/recuperacao-senha/solicitar', { email: recuperacaoEmail.value })

    // mensagem segura (não revela se existe)
    recuperacaoSucesso.value = 'Se o e-mail existir, você receberá instruções em instantes.'
    showModalRecuperacao.value = false

    // se quiser manter alert, ok:
    alert('Se o e-mail existir, você receberá instruções em instantes.')
  } catch (e) {
    recuperacaoErro.value = 'Erro ao solicitar recuperação. Tente novamente.'
  } finally {
    recuperacaoLoading.value = false
  }
}

</script>

<route lang="yaml">
meta:
  public: true
</route>
