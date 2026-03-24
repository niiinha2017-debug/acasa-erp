<template>
  <div class="login-screen login-font">
    <div class="login-screen__backdrop"></div>

    <div class="login-layout animate-page-in">
      <section class="login-brand">
        <div class="login-brand__inner">
          <div class="login-mark">
            <div class="login-mark__badge">
              <img src="/logo.png" alt="Logo A Casa" class="login-mark__logo" />
            </div>

            <div class="login-mark__copy">
              <p class="login-mark__eyebrow">Plataforma operacional</p>
              <h1 class="login-mark__title">A Casa Marcenaria</h1>
            </div>
          </div>

          <div class="login-brand__content">
            <p class="login-brand__lead">ERP interno para comercial, produção e financeiro.</p>
            <p class="login-brand__copytext">
              Acesse o ambiente da equipe para acompanhar clientes, agenda, fábrica, contratos, compras e rotina financeira.
            </p>
          </div>

          <div class="login-brand__tags">
            <span class="login-brand__tag">Comercial</span>
            <span class="login-brand__tag">Produção</span>
            <span class="login-brand__tag">Financeiro</span>
          </div>
        </div>
      </section>

      <section class="login-access">
        <div class="login-access__panel">
          <div class="login-panel__header">
            <p class="login-panel__eyebrow">Acesso ao sistema</p>
            <h2 class="login-panel__title">Entrar</h2>
            <p class="login-panel__subtitle">Use seu usuário corporativo para acessar o ambiente operacional.</p>
          </div>

          <form autocomplete="off" class="login-form" @submit.prevent="handleLoginSubmit">
            <div class="login-form__fields">
              <Input
                v-model="formLogin.usuario"
                label="Usuário"
                name="acasa_login_user"
                type="text"
                placeholder="Usuário ou e-mail"
                :disabled="loading"
                autocomplete="username"
                :spellcheck="false"
                :force-upper="false"
                variant="line"
              />

              <Input
                v-model="formLogin.senha"
                label="Senha"
                name="acasa_login_pass"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Sua senha"
                :disabled="loading"
                autocomplete="current-password"
                :spellcheck="false"
                :force-upper="false"
                variant="line"
              >
                <template #suffix>
                  <button
                    type="button"
                    class="login-password-toggle"
                    :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                    @click="togglePassword"
                  >
                    <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                  </button>
                </template>
              </Input>
            </div>

            <div class="login-form__meta">
              <button type="button" class="login-link" @click="openRecuperacao">
                Esqueci a senha
              </button>
            </div>

            <div v-if="msgSenhaExpirada" class="ds-alert ds-alert--warning login-alert-block">
              Senha provisória expirada. Peça ao administrador para resetar seu acesso na tela de Equipe.
            </div>

            <div v-if="error" class="ds-alert ds-alert--danger login-alert-block">
              {{ error }}
            </div>

            <Button
              type="submit"
              :loading="loading"
              :disabled="loading || !canSubmit"
              fullWidth
              class="login-submit"
            >
              Entrar no sistema
            </Button>
          </form>

          <div class="login-panel__footer">
            <span class="login-panel__footer-label">Ambiente interno</span>
            <span class="login-panel__footer-copy">Acesso restrito para equipe autorizada.</span>
          </div>
        </div>
      </section>
    </div>

    <Teleport to="body">
      <Transition name="fade-scale">
        <div v-if="showModalRecuperacao" class="ds-modal-overlay login-modal-overlay" @click.self="fecharRecuperacao">
          <div class="login-modal">
            <div class="login-modal__header">
              <div>
                <p class="login-panel__eyebrow">Recuperação</p>
                <h3 class="login-modal__title">Redefinir acesso</h3>
                <p class="login-modal__subtitle">Informe seu e-mail corporativo para receber uma senha provisória.</p>
              </div>

              <button
                type="button"
                class="login-modal__close"
                aria-label="Fechar recuperação de senha"
                @click="fecharRecuperacao"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>

            <form v-if="!recuperacaoEnviada" class="login-modal__body" @submit.prevent="handleRecuperacaoSubmit">
              <Input
                v-model="emailRecuperacao"
                label="E-mail"
                type="email"
                required
                placeholder="nome@empresa.com"
                :disabled="recuperacaoLoading"
                autocomplete="email"
                :spellcheck="false"
                :force-upper="false"
                variant="line"
              />

              <div v-if="recuperacaoError" class="ds-alert ds-alert--danger login-alert-block">
                {{ recuperacaoError }}
              </div>

              <div class="login-modal__actions">
                <Button
                  type="button"
                  variant="ghost"
                  :disabled="recuperacaoLoading"
                  @click="fecharRecuperacao"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  :loading="recuperacaoLoading"
                  :disabled="recuperacaoLoading || !emailRecuperacao"
                >
                  Enviar
                </Button>
              </div>
            </form>

            <div v-else class="login-modal__body login-modal__body--success">
              <div class="login-modal__success-card">
                <p class="login-modal__success-title">Senha provisoria enviada</p>
                <p class="login-modal__success-copy">
                  Se o e-mail existir na base, voce vai receber a senha provisoria para <strong>{{ emailRecuperacao }}</strong>.
                </p>
              </div>

              <div class="login-modal__actions">
                <Button
                  type="button"
                  variant="ghost"
                  @click="fecharRecuperacao"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AGENDA_ROUTE_PATH, hasAgendaAccess } from '@/constantes/agenda-route'
import { getApiBaseUrl } from '@/services/api'
import { useAuth } from '@/services/useauth'

definePage({ meta: { public: true, layout: 'auth' } })

const router = useRouter()
const route = useRoute()
const msgSenhaExpirada = computed(() => route.query?.msg === 'senha_expirada')
const { login, esqueciSenha, loading } = useAuth()

function getAgendaPath() {
  if (hasAgendaAccess()) return AGENDA_ROUTE_PATH
  return '/'
}

const showModalRecuperacao = ref(false)
const recuperacaoLoading = ref(false)
const recuperacaoError = ref('')
const recuperacaoEnviada = ref(false)
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
  recuperacaoEnviada.value = false
  emailRecuperacao.value = ''
  showModalRecuperacao.value = true
}

function fecharRecuperacao() {
  showModalRecuperacao.value = false
  recuperacaoError.value = ''
  recuperacaoEnviada.value = false
  emailRecuperacao.value = ''
}

async function handleLoginSubmit() {
  error.value = ''
  try {
    const data = await login({ usuario: formLogin.usuario, senha: formLogin.senha })
    localStorage.setItem('erp_lembrar_usuario', formLogin.usuario)

    if (data?.precisa_trocar_senha) {
      router.push('/pendente')
      return
    }

    router.push(getAgendaPath())
  } catch (e) {
    const msg = e?.response?.data?.message
    if (msg) {
      error.value = Array.isArray(msg) ? msg.join(' | ') : msg
      return
    }

    if (!e?.response && e?.message && /network|fetch|timeout|failed/i.test(String(e.message))) {
      const apiBase = getApiBaseUrl()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const requestUrl = `${apiBase.replace(/\/+$/, '')}/auth/login`
      error.value = [
        'Falha ao conectar com o servidor.',
        `API: ${requestUrl}`,
        origin ? `Origem: ${origin}` : '',
        e?.code ? `Codigo: ${e.code}` : '',
        e?.message ? `Erro: ${String(e.message)}` : '',
      ].filter(Boolean).join(' ')
      return
    }

    error.value = 'Usuário ou senha inválidos.'
  }
}

async function handleRecuperacaoSubmit() {
  recuperacaoError.value = ''
  if (recuperacaoLoading.value) return

  recuperacaoLoading.value = true
  try {
    await esqueciSenha(emailRecuperacao.value)
    recuperacaoEnviada.value = true
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
  padding: 0;
  overflow: hidden;
  background: var(--ds-color-page);
  color: var(--ds-color-text);
}

.login-screen__backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 14% 22%, rgba(44, 111, 163, 0.12), transparent 26%),
    radial-gradient(circle at 86% 10%, rgba(22, 124, 92, 0.08), transparent 20%),
    linear-gradient(135deg, #f2f6f8 0%, #eef3f7 48%, #f6f8fa 100%);
}

.login-layout {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.login-brand,
.login-access {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
}

.login-brand {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(139, 192, 239, 0.12), transparent 28%),
    linear-gradient(160deg, #153754 0%, #1b4566 55%, #204b6f 100%);
}

.login-brand::after {
  content: '';
  position: absolute;
  right: -6rem;
  bottom: -6rem;
  width: 18rem;
  height: 18rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  filter: blur(18px);
}

.login-brand__inner,
.login-access__panel {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.login-brand__inner {
  position: relative;
  z-index: 1;
  justify-content: center;
  gap: 2rem;
  padding: clamp(2rem, 5vw, 4.5rem);
}

.login-mark {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.login-mark__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.75rem;
  height: 4.75rem;
  flex-shrink: 0;
  border-radius: 1.35rem;
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.login-mark__copy {
  min-width: 0;
}

.login-mark__logo {
  width: 2.75rem;
  height: 2.75rem;
  object-fit: contain;
}

.login-mark__eyebrow,
.login-panel__eyebrow {
  margin: 0 0 0.45rem;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.login-mark__eyebrow {
  color: rgba(235, 243, 251, 0.72);
}

.login-mark__title {
  margin: 0;
  font-size: clamp(2rem, 1.7rem + 0.95vw, 3.1rem);
  line-height: 1;
  letter-spacing: -0.04em;
  font-weight: 750;
  color: #ffffff;
}

.login-brand__content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 34rem;
}

.login-brand__lead {
  margin: 0;
  color: #ffffff;
  font-size: clamp(1.3rem, 1.05rem + 0.55vw, 1.85rem);
  font-weight: 650;
  line-height: 1.25;
  letter-spacing: -0.03em;
}

.login-brand__copytext {
  margin: 0;
  color: rgba(235, 243, 251, 0.84);
  font-size: 0.88rem;
  line-height: 1.55;
}

.login-brand__tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.login-brand__tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.3rem;
  padding: 0 0.95rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.68rem;
}

.login-access {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.72);
  padding: clamp(1.5rem, 4vw, 3.5rem);
  backdrop-filter: blur(14px);
}

.login-access__panel {
  max-width: 28rem;
  width: 100%;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.login-panel__header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.login-panel__eyebrow {
  color: var(--ds-color-text-faint);
}

.login-panel__title,
.login-modal__title {
  margin: 0;
  color: var(--ds-color-text);
  font-size: clamp(2rem, 1.8rem + 0.5vw, 2.35rem);
  font-weight: 720;
  line-height: 1;
  letter-spacing: -0.04em;
}

.login-panel__subtitle,
.login-modal__copy {
  margin: 0;
  color: var(--ds-color-text-soft);
  font-size: 0.9rem;
  line-height: 1.65;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.25rem;
}

.login-access__panel :deep(.ds-field--line .ds-control-input--with-suffix) {
  padding-right: 2rem !important;
}

.login-modal :deep(.ds-field--line .ds-control-input--with-suffix) {
  padding-right: 2rem !important;
}

.login-form__fields {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.login-form__meta {
  display: flex;
  justify-content: flex-end;
  margin-top: -0.1rem;
}

.login-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--ds-color-text-faint);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.18s ease;
}

.login-link:hover {
  color: var(--ds-color-primary);
}

.login-alert-block {
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.55;
}

.login-password-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--ds-color-text-faint);
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.login-password-toggle:hover {
  background: rgba(44, 111, 163, 0.08);
  color: var(--ds-color-primary);
}

.login-submit {
  min-height: 3.35rem;
  border-radius: 1rem;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 18px 30px -24px rgba(44, 111, 163, 0.5);
}

.login-panel__footer {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: 1.15rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(214, 224, 234, 0.8);
}

.login-panel__footer-label {
  color: var(--ds-color-text-faint);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.login-panel__footer-copy {
  color: var(--ds-color-text-soft);
  font-size: 0.84rem;
}

.login-modal {
  position: relative;
  z-index: 1;
  width: min(100%, 32rem);
  padding: 1.5rem;
  border: 1px solid rgba(214, 224, 234, 0.88);
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 32px 70px -40px rgba(25, 43, 68, 0.42);
  backdrop-filter: blur(16px);
}

.login-modal-overlay {
  z-index: 1200;
}

.login-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ds-color-border);
}

.login-modal__title {
  font-size: 1.45rem;
}

.login-modal__subtitle {
  margin: 0.45rem 0 0;
  color: var(--ds-color-text-soft);
  font-size: 0.88rem;
  line-height: 1.6;
}

.login-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.3rem;
  height: 2.3rem;
  border: 0;
  border-radius: 0.85rem;
  background: transparent;
  color: var(--ds-color-text-faint);
  cursor: pointer;
}

.login-modal__close:hover {
  background: rgba(44, 111, 163, 0.08);
  color: var(--ds-color-primary);
}

.login-modal__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1.2rem;
}

.login-modal__body--success {
  gap: 1.1rem;
}

.login-modal__success-card {
  padding: 1rem 1.05rem;
  border: 1px solid rgba(44, 111, 163, 0.18);
  border-radius: 1.1rem;
  background: rgba(44, 111, 163, 0.06);
}

.login-modal__success-title {
  margin: 0;
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 700;
}

.login-modal__success-copy {
  margin: 0.45rem 0 0;
  color: var(--ds-color-text-soft);
  font-size: 0.84rem;
  line-height: 1.65;
}

.login-modal__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.25rem;
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

@media (max-width: 960px) {
  .login-layout {
    grid-template-columns: 1fr;
  }

  .login-brand,
  .login-access {
    min-height: auto;
  }

  .login-brand {
    min-height: 42vh;
  }

  .login-brand__inner {
    padding: 1.5rem;
  }

  .login-access {
    padding: 1rem 1.5rem 1.5rem;
    border-left: 0;
    background: rgba(255, 255, 255, 0.78);
  }

  .login-access__panel {
    max-width: 32rem;
  }
}

@media (max-width: 640px) {
  .login-mark {
    align-items: flex-start;
  }

  .login-mark__badge {
    width: 4rem;
    height: 4rem;
  }

  .login-mark__logo {
    width: 2.5rem;
    height: 2.5rem;
  }

  .login-brand__content {
    max-width: 100%;
  }

  .login-access {
    padding: 0.85rem;
    backdrop-filter: blur(10px);
  }

  .login-access__panel {
    max-width: 100%;
  }

  .login-modal {
    width: 100%;
    max-width: 100%;
    padding: 1.2rem;
  }

  .login-modal__actions {
    flex-direction: column-reverse;
    justify-content: stretch;
  }

}

:global(html.dark) .login-screen__backdrop {
  background:
    radial-gradient(circle at 12% 14%, rgba(101, 166, 223, 0.16), transparent 28%),
    radial-gradient(circle at 86% 10%, rgba(56, 180, 135, 0.1), transparent 22%),
    linear-gradient(180deg, rgba(13, 21, 35, 0.75) 0%, rgba(13, 21, 35, 0.94) 100%);
}

:global(html.dark) .login-brand__tag {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
}

:global(html.dark) .login-access__panel {
  background: transparent;
  box-shadow: none;
}

:global(html.dark) .login-access {
  background: rgba(18, 30, 49, 0.72);
}

:global(html.dark) .login-modal {
  background: rgba(18, 30, 49, 0.94);
  border-color: rgba(51, 71, 102, 0.82);
  box-shadow: 0 32px 70px -40px rgba(2, 6, 23, 0.84);
}

:global(html.dark) .login-modal__success-card {
  background: rgba(24, 37, 58, 0.92);
  border-color: rgba(51, 71, 102, 0.72);
}

:global(html.dark) .login-panel__footer {
  border-top-color: rgba(51, 71, 102, 0.68);
}

:global(html.dark) .login-link,
:global(html.dark) .login-password-toggle,
:global(html.dark) .login-modal__close {
  color: var(--ds-color-text-soft);
}

:global(html.dark) .login-link:hover,
:global(html.dark) .login-password-toggle:hover,
:global(html.dark) .login-modal__close:hover {
  color: var(--ds-color-primary-strong);
  background: rgba(101, 166, 223, 0.12);
}

:global(html.dark) .login-modal__header {
  border-bottom-color: rgba(51, 71, 102, 0.55);
}
</style>
