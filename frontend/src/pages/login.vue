<template>
  <div class="login-font min-h-screen flex items-center justify-center bg-bg-page text-text-main px-3 sm:px-4 md:px-6">
    <div class="pointer-events-none fixed inset-0 opacity-70">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(47,127,179,0.15),transparent_55%)]"></div>
      <div class="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(15,23,42,0.04)_45%,transparent_100%)] dark:bg-[linear-gradient(120deg,transparent_0%,rgba(148,163,184,0.06)_45%,transparent_100%)]"></div>
    </div>

    <div class="relative w-full max-w-[560px] lg:max-w-[640px] rounded-3xl border border-border-ui bg-bg-card shadow-2xl overflow-hidden">
      <div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]"></div>

      <div class="px-5 sm:px-8 md:px-10 pt-7 sm:pt-8 pb-4 text-center">
        <img src="/logo.png" alt="Logo" class="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-contain border border-border-ui bg-bg-card" />
        <h1 class="mt-3 text-xl sm:text-2xl md:text-[28px] font-black tracking-tight">
          <span class="text-text-main">A Casa</span>
          <span class="text-brand-primary"> Moveis Planejados</span>
        </h1>
        <p class="mt-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-text-soft">Acesso ao sistema</p>
      </div>

      <div class="px-5 sm:px-8 md:px-10 pb-7 sm:pb-8">
        <form autocomplete="off" @submit.prevent="handleLoginSubmit" class="space-y-5 sm:space-y-6">
          <div class="space-y-4">
            <div class="relative">
              <input
                v-model="formLogin.usuario"
                name="acasa_login_user"
                type="text"
                :disabled="loading"
                autocomplete="username"
                class="w-full h-11 sm:h-12 bg-transparent border-0 border-b-2 border-border-ui text-sm sm:text-base font-semibold text-text-main placeholder:text-slate-400 focus:border-brand-primary focus:outline-none transition-colors"
                placeholder="Usuario ou e-mail"
              />
            </div>

            <div class="relative">
              <input
                v-model="formLogin.senha"
                name="acasa_login_pass"
                :type="showPassword ? 'text' : 'password'"
                :disabled="loading"
                autocomplete="current-password"
                class="w-full h-11 sm:h-12 bg-transparent border-0 border-b-2 border-border-ui text-sm sm:text-base font-semibold text-text-main placeholder:text-slate-400 focus:border-brand-primary focus:outline-none transition-colors pr-10"
                placeholder="Senha"
              />
              <button
                type="button"
                @click="togglePassword"
                class="absolute right-0 top-0 h-11 sm:h-12 px-2 text-slate-500 hover:text-brand-primary"
              >
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-base" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3 sm:gap-4">
            <CustomCheckbox v-model="lembrarUsuario" label="Lembrar" />
            <button type="button" @click="openRecuperacao" class="text-xs font-bold uppercase text-brand-primary hover:underline focus:outline-none">
              Esqueci a senha
            </button>
          </div>

          <div v-if="error" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
            {{ error }}
          </div>

          <Button
            type="submit"
            :loading="loading"
            fullWidth
            class="h-11 sm:h-12 rounded-xl font-black uppercase tracking-[0.16em] sm:tracking-[0.18em] text-[11px] sm:text-xs"
            :disabled="loading || !canSubmit"
          >
            Entrar
          </Button>

          <div class="pt-2 text-center">
            <p class="text-xs text-text-soft">© {{ new Date().getFullYear() }} A Casa Moveis Planejados</p>
          </div>
        </form>
      </div>

      <Teleport to="body">
        <Transition name="fade-scale">
          <div v-if="showModalRecuperacao" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/55 backdrop-blur-sm" @click="fecharTudo"></div>

            <div class="relative w-full max-w-[560px] overflow-hidden rounded-3xl border border-border-ui bg-bg-card shadow-2xl">
              <div class="px-5 sm:px-6 py-5 border-b border-border-ui flex items-center justify-between">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.35em] text-text-soft">recuperacao</p>
                  <h3 class="text-lg font-black tracking-tight text-text-main">Recuperar senha</h3>
                </div>
                <button @click="fecharTudo" class="rounded-xl p-2 text-slate-400 hover:text-rose-500">
                  <i class="pi pi-times text-lg"></i>
                </button>
              </div>

              <div class="px-5 sm:px-6 py-6">
                <form @submit.prevent="handleRecuperacaoSubmit" class="space-y-4">
                  <div>
                    <input
                      v-model="emailRecuperacao"
                      type="email"
                      required
                      :disabled="loading"
                      class="w-full h-11 sm:h-12 bg-transparent border-0 border-b-2 border-border-ui text-sm sm:text-base font-semibold text-text-main placeholder:text-slate-400 focus:border-brand-primary focus:outline-none transition-colors"
                      placeholder="nome@empresa.com"
                    />
                  </div>

                  <p class="text-sm text-text-soft">Enviaremos uma senha provisoria para seu e-mail.</p>

                  <div class="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button type="button" variant="secondary" @click="fecharTudo" class="flex-1 h-11 rounded-2xl" :disabled="recuperacaoLoading">Cancelar</Button>
                    <Button type="submit" :loading="recuperacaoLoading" class="flex-1 h-11 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]" :disabled="recuperacaoLoading || !emailRecuperacao">Enviar</Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/useauth'

definePage({ meta: { public: true, layout: 'auth' } })

const router = useRouter()
const { login, esqueciSenha, loading } = useAuth()
const AGENDA_GERAL_PATH = '/agendamentos?visao=geral'

const showModalRecuperacao = ref(false)
const recuperacaoLoading = ref(false)
const lembrarUsuario = ref(false)
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
    lembrarUsuario.value = true
  }
})

function fecharTudo() {
  showModalRecuperacao.value = false
  emailRecuperacao.value = ''
}

function openRecuperacao() {
  error.value = ''
  showModalRecuperacao.value = true
}

async function handleLoginSubmit() {
  error.value = ''
  try {
    const data = await login({ usuario: formLogin.usuario, senha: formLogin.senha })
    if (lembrarUsuario.value) localStorage.setItem('erp_lembrar_usuario', formLogin.usuario)
    else localStorage.removeItem('erp_lembrar_usuario')

    if (data?.precisa_trocar_senha) {
      router.push('/pendente')
    } else {
      router.push(AGENDA_GERAL_PATH)
    }
  } catch (e) {
    const msg = e?.response?.data?.message
    error.value = msg ? (Array.isArray(msg) ? msg.join(' | ') : msg) : 'Usuario ou senha invalidos.'
  }
}

async function handleRecuperacaoSubmit() {
  try {
    if (recuperacaoLoading.value) return
    recuperacaoLoading.value = true
    await esqueciSenha(emailRecuperacao.value)
    fecharTudo()
    alert('Enviamos uma senha provisoria para seu e-mail.')
  } catch (e) {}
  finally {
    recuperacaoLoading.value = false
  }
}

watch(lembrarUsuario, (v) => {
  if (!v) localStorage.removeItem('erp_lembrar_usuario')
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.login-font {
  font-family: 'Manrope', 'Segoe UI', sans-serif;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
