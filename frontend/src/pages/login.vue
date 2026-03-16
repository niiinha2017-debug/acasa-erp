<template>
  <div class="login-screen">
    <div class="login-shell">
      <section class="login-brand-panel">
        <div class="login-brand-panel__inner">
          <div class="login-mark">
            <img src="/logo.png" alt="Logo" class="login-mark__logo" />
            <div>
              <p class="login-mark__eyebrow">Plataforma Operacional</p>
              <h1 class="login-mark__title login-mark__title--single-line">A Casa Móveis Planejados LTDA</h1>
            </div>
          </div>

          <div class="login-copy">
            <h2 class="login-copy__headline login-copy__headline--single-line">Gestão comercial e finanças.</h2>
          </div>

          <div class="login-highlights">
            <div class="login-highlight-card">
              <div class="login-highlight-card__icon">
                <i class="pi pi-chart-line" aria-hidden="true"></i>
              </div>
              <div>
                <strong>Comercial</strong>
                <p>Clientes, propostas e contratos em um só lugar.</p>
              </div>
            </div>

            <div class="login-highlight-card">
              <div class="login-highlight-card__icon">
                <i class="pi pi-cog" aria-hidden="true"></i>
              </div>
              <div>
                <strong>Operação</strong>
                <p>Agenda, produção e acompanhamento de pedidos em tempo real.</p>
              </div>
            </div>

            <div class="login-highlight-card">
              <div class="login-highlight-card__icon">
                <i class="pi pi-check-circle" aria-hidden="true"></i>
              </div>
              <div>
                <strong>Controle</strong>
                <p>Compras, estoque e gestão financeira integrados.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="login-access-panel">
        <div class="login-access-panel__header">
          <p class="login-access-panel__eyebrow">Acesso ao sistema</p>
          <h3 class="login-access-panel__title">Entrar</h3>
          <p class="login-access-panel__subtitle">Use seu usuário corporativo para acessar o ambiente operacional.</p>
        </div>

        <form autocomplete="off" @submit.prevent="handleLoginSubmit" class="login-form">
          <div class="login-field-list">
            <label class="login-field">
              <span class="login-field__label">Usuário</span>
              <span class="login-field__control">
                <i class="pi pi-envelope login-field__icon" aria-hidden="true"></i>
                <input
                  v-model="formLogin.usuario"
                  name="acasa_login_user"
                  type="text"
                  :disabled="loading"
                  autocomplete="username"
                  autocapitalize="none"
                  autocorrect="off"
                  spellcheck="false"
                  inputmode="email"
                  class="login-field__input"
                  placeholder="Usuário ou e-mail"
                />
              </span>
            </label>

            <label class="login-field login-field--password">
              <span class="login-field__label">Senha</span>
              <span class="login-field__control">
                <i class="pi pi-lock login-field__icon" aria-hidden="true"></i>
                <input
                  v-model="formLogin.senha"
                  name="acasa_login_pass"
                  :type="showPassword ? 'text' : 'password'"
                  :disabled="loading"
                  autocomplete="current-password"
                  autocapitalize="none"
                  autocorrect="off"
                  spellcheck="false"
                  inputmode="text"
                  class="login-field__input"
                  placeholder="Sua senha"
                />
              </span>
              <button
                type="button"
                @click="togglePassword"
                class="login-field__toggle"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              >
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-base" />
              </button>
            </label>
          </div>

          <div class="login-row">
            <button type="button" @click="openRecuperacao" class="login-link">
              Esqueci a senha
            </button>
          </div>

          <div v-if="msgSenhaExpirada" class="login-alert login-alert--warning">
            Senha provisória expirada. Peça ao administrador para resetar seu acesso na tela de Equipe.
          </div>

          <div v-if="error" class="login-alert login-alert--error">
            {{ error }}
          </div>

          <Button
            type="submit"
            :loading="loading"
            fullWidth
            class="login-submit"
            :disabled="loading || !canSubmit"
          >
            Entrar no sistema
          </Button>
        </form>
      </section>
    </div>

    <Teleport to="body">
      <Transition name="fade-scale">
        <div v-if="showModalRecuperacao" class="login-modal-layer">
          <div class="login-modal-layer__backdrop" @click="fecharRecuperacao"></div>

          <div class="login-modal">
            <div class="login-modal__header">
              <div>
                <p class="login-modal__eyebrow">Recuperação</p>
                <h3 class="login-modal__title">Redefinir acesso</h3>
              </div>
              <button @click="fecharRecuperacao" class="login-modal__close" aria-label="Fechar recuperação de senha">
                <i class="pi pi-times text-lg"></i>
              </button>
            </div>

            <div class="login-modal__body">
              <form @submit.prevent="handleRecuperacaoSubmit" class="login-form login-form--modal">
                <label class="login-field">
                  <span class="login-field__label">E-mail</span>
                  <span class="login-field__control">
                    <i class="pi pi-envelope login-field__icon" aria-hidden="true"></i>
                    <input
                      v-model="emailRecuperacao"
                      type="email"
                      required
                      :disabled="recuperacaoLoading"
                      autocomplete="email"
                      autocapitalize="none"
                      autocorrect="off"
                      spellcheck="false"
                      inputmode="email"
                      class="login-field__input"
                      placeholder="nome@empresa.com"
                    />
                  </span>
                </label>

                <p class="login-modal__text">Enviaremos uma senha provisória para o e-mail informado.</p>

                <div v-if="recuperacaoError" class="login-alert login-alert--error">
                  {{ recuperacaoError }}
                </div>

                <div class="login-modal__actions">
                  <Button type="button" variant="secondary" @click="fecharRecuperacao" class="login-modal__button" :disabled="recuperacaoLoading">Cancelar</Button>
                  <Button type="submit" :loading="recuperacaoLoading" class="login-modal__button login-modal__button--submit" :disabled="recuperacaoLoading || !emailRecuperacao">Enviar</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/services/useauth'
import { getApiBaseUrl } from '@/services/api'

definePage({ meta: { public: true, layout: 'auth' } })

const router = useRouter()
const route = useRoute()
const msgSenhaExpirada = computed(() => route.query?.msg === 'senha_expirada')
const { login, esqueciSenha, loading } = useAuth()
const AGENDA_GERAL_PATH = '/agendamentos/loja'

const showModalRecuperacao = ref(false)
const recuperacaoLoading = ref(false)
const recuperacaoError = ref('')
const formLogin = reactive({ usuario: '', senha: '' })
const emailRecuperacao = ref('')
const showPassword = ref(false)
const error = ref('')

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const canSubmit = computed(() =>
  (formLogin.usuario || '').trim().length >= 3 && (formLogin.senha || '').length >= 3,
)

onMounted(() => {
  const salvo = localStorage.getItem('erp_lembrar_usuario')
  if (salvo) {
    formLogin.usuario = salvo
  }
})

function openRecuperacao() {
  recuperacaoError.value = ''
  emailRecuperacao.value = ''
  showModalRecuperacao.value = true
}

function fecharRecuperacao() {
  showModalRecuperacao.value = false
  recuperacaoError.value = ''
  emailRecuperacao.value = ''
}

async function handleLoginSubmit() {
  error.value = ''
  try {
    const data = await login({ usuario: formLogin.usuario, senha: formLogin.senha })
    localStorage.setItem('erp_lembrar_usuario', formLogin.usuario)

    if (data?.precisa_trocar_senha) {
      router.push('/pendente')
    } else {
      router.push(AGENDA_GERAL_PATH)
    }
  } catch (e) {
    const msg = e?.response?.data?.message
    if (msg) {
      error.value = Array.isArray(msg) ? msg.join(' | ') : msg
    } else if (!e?.response && e?.message && /network|fetch|timeout|failed/i.test(String(e.message))) {
      const apiBase = getApiBaseUrl()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const requestUrl = `${apiBase.replace(/\/+$/, '')}/auth/login`
      const detail = [
        'Falha ao conectar com o servidor.',
        `API: ${requestUrl}`,
        origin ? `Origem: ${origin}` : '',
        e?.code ? `Codigo: ${e.code}` : '',
        e?.message ? `Erro: ${String(e.message)}` : '',
      ].filter(Boolean).join(' ')
      error.value = detail
    } else {
      error.value = 'Usuário ou senha inválidos.'
    }
  }
}

async function handleRecuperacaoSubmit() {
  recuperacaoError.value = ''
  if (recuperacaoLoading.value) return

  recuperacaoLoading.value = true
  try {
    await esqueciSenha(emailRecuperacao.value)
    alert('Enviamos uma senha provisória para o e-mail informado.')
    fecharRecuperacao()
  } catch (e) {
    const msg = e?.response?.data?.message
    recuperacaoError.value = msg
      ? (Array.isArray(msg) ? msg.join(' | ') : msg)
      : 'Não foi possível enviar a recuperação. Verifique o e-mail e tente novamente.'
  } finally {
    recuperacaoLoading.value = false
  }
}
</script>

<style scoped>
.login-screen {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  padding:
    env(safe-area-inset-top)
    env(safe-area-inset-right)
    env(safe-area-inset-bottom)
    env(safe-area-inset-left);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #e8eef5;
  color: #0f172a;
  font-family: 'Segoe UI Variable', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.login-shell {
  position: relative;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  max-height: none;
  display: flex;
  flex-direction: row;
  border: 0;
  border-radius: 0;
  overflow: hidden;
  background: #ffffff;
  box-shadow: none;
}

.login-brand-panel {
  flex: 1.1 1 0;
  min-width: 0;
  padding: clamp(3rem, 6vw, 6rem);
  display: flex;
  align-items: center;
  background: linear-gradient(160deg, #123b65 0%, #0f3256 55%, #0d2a4e 100%);
  color: #ffffff;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.login-brand-panel__inner {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2.15rem;
  width: min(100%, 30rem);
  margin: 0 auto;
}

.login-mark {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.login-mark__logo {
  width: 4rem;
  height: 4rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  object-fit: contain;
}

.login-mark__eyebrow,
.login-modal__eyebrow,
.login-access-panel__eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.login-mark__eyebrow {
  color: rgba(226, 232, 240, 0.78);
}

.login-mark__title {
  margin: 0;
  font-size: clamp(1.55rem, 1.2rem + 1vw, 2.25rem);
  line-height: 1.08;
  letter-spacing: -0.02em;
  font-weight: 800;
  color: #ffffff;
}

.login-mark__title--single-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.login-copy__headline {
  margin: 0;
  font-size: clamp(1.5rem, 1.2rem + 0.8vw, 2rem);
  line-height: 1.28;
  letter-spacing: -0.01em;
  max-width: 26ch;
  font-weight: 700;
  color: #ffffff;
}

.login-copy__headline--single-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.login-copy__text {
  margin: 0.4rem 0 0;
  max-width: 32ch;
  color: rgba(226, 232, 240, 0.88);
  font-size: 0.9rem;
  line-height: 1.6;
  font-weight: 400;
}

.login-highlights {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.login-highlight-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.78rem 0.85rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.login-highlight-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  flex-shrink: 0;
  border-radius: 0.35rem;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 0.75rem;
}

.login-highlight-card strong {
  display: block;
  margin-bottom: 0.1rem;
  color: rgba(248, 250, 252, 0.96);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.login-highlight-card p {
  margin: 0;
  color: rgba(226, 232, 240, 0.86);
  font-size: 0.8rem;
  line-height: 1.35;
}

.login-access-panel {
  flex: 0.9 1 0;
  min-width: 0;
  padding: clamp(3rem, 6vw, 6rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #fbfcfd;
}

.login-access-panel__header {
  margin-bottom: 1.35rem;
}

.login-access-panel__eyebrow {
  color: #9ca3af;
  font-size: 0.6875rem;
}

.login-access-panel__title,
.login-modal__title {
  margin: 0;
  color: #111827;
  font-size: clamp(2rem, 1.65rem + 0.75vw, 2.5rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
}

.login-access-panel__subtitle,
.login-modal__text {
  margin: 0.65rem 0 0;
  color: #9ca3af;
  font-size: 0.875rem;
  line-height: 1.6;
}

.login-form,
.login-field-list {
  display: flex;
  flex-direction: column;
}

.login-form {
  gap: 1.1rem;
  width: min(100%, 25rem);
  margin: 0 auto;
}

.login-form--modal {
  width: 100%;
}

.login-field-list {
  gap: 1.1rem;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.login-field__label {
  color: #6b7280;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.login-field__control {
  position: relative;
  display: flex;
  align-items: center;
  border: 0;
  border-bottom: 1px solid #d4dbe4;
  border-radius: 0;
  background: transparent;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.login-field__control:focus-within {
  border-bottom-color: #2563a8;
  box-shadow: none;
}

.login-field__icon {
  position: absolute;
  left: 0.95rem;
  z-index: 1;
  color: #aeb7c2;
  font-size: 0.85rem;
  pointer-events: none;
}

.login-field__input {
  width: 100%;
  min-height: 3.15rem;
  padding: 0.85rem 0 0.85rem 2.2rem;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #0f172a;
  font-size: clamp(0.95rem, 0.9rem + 0.15vw, 1rem);
  font-weight: 500;
  outline: none;
  transition: color 0.2s ease, background 0.2s ease;
}

.login-field__input::placeholder {
  color: #b8c0cb;
  font-weight: 500;
}

.login-field__input:focus {
  box-shadow: none;
  background: transparent;
}

.login-field--password {
  position: relative;
}

.login-field--password .login-field__input {
  padding-right: 2.5rem;
}

.login-field__toggle {
  position: absolute;
  right: -0.15rem;
  bottom: 0.45rem;
  width: 1.9rem;
  height: 1.9rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.login-field__toggle:hover {
  color: #1d4f82;
  background: rgba(148, 163, 184, 0.12);
}

.login-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.login-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: #60a5fa;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
}

.login-link:hover {
  color: #1d4f82;
  text-decoration: underline;
}

.login-alert {
  padding: 0.95rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid;
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1.55;
}

.login-alert--warning {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #9a3412;
}

.login-alert--error {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #be123c;
}

.login-submit {
  width: 100%;
  min-height: 3.5rem;
  border-radius: 0.5rem;
  background: #004a99;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.0625rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease;
}

.login-submit:hover {
  background: #003f82;
}

.login-modal-layer {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-modal-layer__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
}

.login-modal {
  position: relative;
  width: min(28rem, 100%);
  border-radius: 0.75rem;
  border: 1px solid #dbe3ea;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.login-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid #eef2f7;
}

.login-modal__eyebrow {
  color: #64748b;
}

.login-modal__title {
  font-size: 1.35rem;
}

.login-modal__close {
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.login-modal__close:hover {
  background: #f3f6f9;
  color: #0f172a;
}

.login-modal__body {
  padding: 1.25rem;
}

.login-modal__text {
  margin: 0;
}

.login-modal__actions {
  display: flex;
  gap: 0.75rem;
}

.login-modal__button {
  flex: 1 1 0;
  min-height: 3.25rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.login-modal__button--submit {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.0625rem;
  text-transform: uppercase;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.985);
}

@media (max-width: 768px) {
  .login-screen {
    padding:
      env(safe-area-inset-top)
      env(safe-area-inset-right)
      env(safe-area-inset-bottom)
      env(safe-area-inset-left);
  }

  .login-shell {
    min-height: 100dvh;
    max-height: none;
    flex-direction: column;
  }

  .login-brand-panel,
  .login-access-panel {
    padding: 2rem 1.5rem;
    text-align: center;
  }

  .login-brand-panel {
    min-height: auto;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  .login-brand-panel__inner {
    width: 100%;
    gap: 1rem;
    align-items: center;
  }

  .login-copy__text {
    max-width: 42ch;
  }

  .login-mark {
    justify-content: center;
  }

  .login-copy__headline {
    max-width: 100%;
  }

  .login-form,
  .login-access-panel__header {
    text-align: center;
  }

  .login-row {
    justify-content: center;
  }

  .login-highlights {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .login-brand-panel,
  .login-access-panel {
    padding: 1.35rem;
  }

  .login-mark {
    align-items: flex-start;
  }

  .login-mark__logo {
    width: 3.5rem;
    height: 3.5rem;
  }

  .login-copy__headline {
    max-width: 100%;
  }

  .login-highlight-card {
    text-align: left;
  }

  .login-row,
  .login-modal__actions {
    justify-content: stretch;
  }

  .login-field__input,
  .login-submit,
  .login-modal__button {
    min-height: 3.4rem;
  }

  .login-field__input {
    padding: 0.9rem 0 0.9rem 2.3rem;
  }

  .login-modal {
    width: 100%;
  }
}

@media (prefers-color-scheme: dark) {
  .login-screen {
    background: #0b1220;
    color: #e8eef7;
  }

  .login-shell {
    background: #111827;
    border-color: rgba(51, 65, 85, 0.9);
    box-shadow: 0 22px 44px rgba(2, 6, 23, 0.32);
  }

  .login-access-panel {
    background: #111827;
  }

  .login-modal {
    background: #111827;
    border-color: rgba(51, 65, 85, 0.9);
    box-shadow: 0 22px 44px rgba(2, 6, 23, 0.32);
  }

  .login-access-panel__eyebrow,
  .login-modal__eyebrow,
  .login-access-panel__subtitle,
  .login-modal__text,
  .login-field__label {
    color: #94a3b8;
  }

  .login-field__input {
    background: transparent;
    border-color: transparent;
    color: #e8eef7;
  }

  .login-field__control {
    background: transparent;
    border-bottom-color: rgba(71, 85, 105, 0.8);
  }

  .login-field__input::placeholder {
    color: #64748b;
  }

  .login-field__input:focus {
    background: rgba(15, 23, 42, 0.98);
    box-shadow: 0 0 0 0.18rem rgba(74, 144, 217, 0.16);
  }

  .login-field__toggle,
  .login-mark__eyebrow {
    color: #94a3b8;
  }

  .login-link,
  .login-modal__close {
    color: #93c5fd;
  }

  .login-modal__close:hover {
    color: #e5eefc;
    background: rgba(148, 163, 184, 0.12);
  }

  .login-alert--warning {
    background: rgba(120, 53, 15, 0.32);
    border-color: rgba(180, 83, 9, 0.45);
    color: #fdba74;
  }

  .login-alert--error {
    background: rgba(76, 5, 25, 0.35);
    border-color: rgba(136, 19, 55, 0.5);
    color: #fda4af;
  }

  .login-modal__header {
    border-bottom-color: rgba(51, 65, 85, 0.55);
  }
}
</style>
