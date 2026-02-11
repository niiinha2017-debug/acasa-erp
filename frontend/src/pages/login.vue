<template>
  <div class="login-shell min-h-screen text-slate-900">
    <div class="login-grid flex min-h-screen w-full items-center justify-center px-3 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
      <section class="flex w-full items-center justify-center">
        <div class="auth-card w-full max-w-[34rem] overflow-hidden rounded-[1.8rem] border border-slate-200/75 bg-white/95 p-5 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:min-h-[27.5rem] sm:p-7 md:p-8 lg:max-w-[34rem]">
          <div class="mobile-brand mb-4 rounded-2xl border border-slate-200 bg-slate-50/85 px-4 py-3 text-slate-700">
            <div class="flex items-center gap-3">
              <img src="/logo.png" alt="Logo ACASA" class="h-10 w-10 rounded-xl bg-white object-contain p-1.5" />
              <div>
                <p class="text-[10px] font-bold tracking-[0.1em] text-slate-500">A Casa Móveis Planejados</p>
                <p class="text-sm font-semibold leading-tight">Sistema de gestao interno</p>
              </div>
            </div>
          </div>

          <div class="mb-5 flex items-center justify-between sm:mb-6">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Acesso seguro</p>
              <h2 class="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Entrar na plataforma</h2>
            </div>
            <div class="hidden rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600 sm:block">
              Suporte interno
            </div>
          </div>

          <form autocomplete="off" @submit.prevent="handleLoginSubmit" class="space-y-5">
            <div class="space-y-4">
              <Input
                v-model="formLogin.usuario"
                name="acasa_login_user"
                label="Usuario ou E-mail"
                class="h-12 text-base"
                :forceUpper="false"
                :disabled="loading"
              />

              <Input
                v-model="formLogin.senha"
                name="acasa_login_pass"
                autocomplete="current-password"
                :type="showPassword ? 'text' : 'password'"
                label="Senha"
                class="h-12 text-base"
                :forceUpper="false"
                :disabled="loading"
              >
                <template #suffix>
                  <button
                    type="button"
                    @click="togglePassword"
                    class="rounded-xl px-2 py-2 text-slate-400 transition hover:text-[#3f88bd]"
                    aria-label="Mostrar ou ocultar senha"
                  >
                    <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-base" />
                  </button>
                </template>
              </Input>
            </div>

            <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CustomCheckbox v-model="lembrarUsuario" label="Lembrar usuario" />
              <button
                type="button"
                @click="openRecuperacao"
                class="text-xs font-bold uppercase tracking-[0.08em] text-[#3f88bd] transition hover:text-[#2f6d9d]"
              >
                Esqueci a senha
              </button>
            </div>

            <div
              v-if="error"
              class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
            >
              {{ error }}
            </div>

            <Button
              type="submit"
              :loading="loading"
              fullWidth
              class="h-12 rounded-2xl text-sm font-black uppercase tracking-[0.2em]"
              :disabled="loading || !canSubmit"
            >
              Entrar
            </Button>

            <p class="pt-2 text-center text-xs text-slate-500">
              {{ currentYear }} A Casa Móveis Planejados.
            </p>
          </form>
        </div>
      </section>
    </div>

    <Teleport to="body">
      <Transition name="fade-scale">
        <div v-if="showModalRecuperacao" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="fecharTudo"></div>

          <div class="modal-card relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_32px_80px_-36px_rgba(15,23,42,0.8)] sm:rounded-3xl">
            <div class="flex items-center justify-between border-b border-slate-200/80 px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Recuperacao</p>
                <h3 class="mt-1 text-lg font-black tracking-tight text-slate-900">Nova senha provisoria</h3>
              </div>

              <button @click="fecharTudo" class="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500" aria-label="Fechar modal">
                <i class="pi pi-times text-lg"></i>
              </button>
            </div>

            <div class="px-4 py-5 sm:px-6 sm:py-6">
              <form @submit.prevent="handleRecuperacaoSubmit" class="space-y-4">
                <Input
                  v-model="emailRecuperacao"
                  label="E-mail de acesso"
                  type="email"
                  required
                  :forceUpper="false"
                  :disabled="loading"
                />

                <p class="text-sm text-slate-600">Enviaremos uma senha provisoria para o e-mail informado.</p>

                <p v-if="recuperacaoError" class="text-xs font-bold text-rose-600">
                  {{ recuperacaoError }}
                </p>

                <div class="flex flex-col gap-3 pt-1 sm:flex-row">
                  <Button type="button" variant="secondary" @click="fecharTudo" class="h-11 flex-1 rounded-2xl">
                    Cancelar
                  </Button>
                  <Button type="submit" :loading="loading" class="h-11 flex-1 rounded-2xl text-xs font-black uppercase tracking-[0.2em]">
                    Enviar
                  </Button>
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
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/useauth'
import { notify } from '@/services/notify'

definePage({ meta: { public: true, layout: 'auth' } })

const router = useRouter()
const { login, esqueciSenha, loading } = useAuth()

const showModalRecuperacao = ref(false)
const lembrarUsuario = ref(false)
const formLogin = reactive({ usuario: '', senha: '' })
const emailRecuperacao = ref('')
const recuperacaoError = ref('')
const showPassword = ref(false)
const error = ref('')

const currentYear = new Date().getFullYear()
const togglePassword = () => { showPassword.value = !showPassword.value }
const canSubmit = computed(() => (formLogin.usuario || '').trim().length >= 3 && (formLogin.senha || '').length >= 3)

onMounted(() => {
  const salvo = localStorage.getItem('erp_lembrar_usuario')
  if (salvo) {
    formLogin.usuario = salvo
    lembrarUsuario.value = true
  }
})

function fecharTudo() {
  showModalRecuperacao.value = false
  emailRecuperacao.value = ''
  recuperacaoError.value = ''
}

function openRecuperacao() {
  error.value = ''
  recuperacaoError.value = ''
  showModalRecuperacao.value = true
}

async function handleLoginSubmit() {
  error.value = ''
  try {
    const data = await login({ usuario: formLogin.usuario, senha: formLogin.senha })

    if (lembrarUsuario.value) {
      localStorage.setItem('erp_lembrar_usuario', formLogin.usuario)
    } else {
      localStorage.removeItem('erp_lembrar_usuario')
    }

    if (data?.precisa_trocar_senha) {
      router.push('/pendente')
    } else {
      router.push('/')
    }
  } catch (e) {
    const msg = e?.response?.data?.message
    error.value = msg ? (Array.isArray(msg) ? msg.join(' | ') : msg) : 'Usuario ou senha invalidos.'
  }
}

async function handleRecuperacaoSubmit() {
  recuperacaoError.value = ''

  try {
    const email = String(emailRecuperacao.value || '').trim().toLowerCase()
    if (!email || !email.includes('@')) {
      recuperacaoError.value = 'Informe um e-mail valido.'
      return
    }

    await esqueciSenha(email)
    fecharTudo()
    notify.success('Enviamos uma senha provisoria para seu e-mail.')
  } catch (e) {
    const msg = e?.response?.data?.message || 'Erro ao enviar recuperacao.'
    recuperacaoError.value = Array.isArray(msg) ? msg.join(' | ') : msg
  }
}

watch(lembrarUsuario, (v) => {
  if (!v) localStorage.removeItem('erp_lembrar_usuario')
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap');

.login-shell {
  --login-bg-1: #d8dbdf;
  --login-bg-2: #eef1f4;
  --login-brand-1: #2f6d9d;
  --login-brand-2: #3f88bd;
  --color-brand-primary: #3f88bd;
  --color-brand-dark: #2f6d9d;
  background:
    radial-gradient(circle at 12% 16%, rgba(63, 136, 189, 0.2), transparent 34%),
    radial-gradient(circle at 92% 8%, rgba(63, 136, 189, 0.1), transparent 28%),
    linear-gradient(165deg, var(--login-bg-1) 0%, var(--login-bg-2) 48%, #f8fbff 100%);
  font-family: 'Manrope', 'Segoe UI', sans-serif;
}

.auth-card {
  animation: slideUp 0.55s ease-out;
}

.modal-card {
  animation: popup 0.24s ease-out;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.22s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes popup {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
