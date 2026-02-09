<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-primary/10 via-white to-brand-secondary/10 dark:from-brand-primary/20 dark:via-slate-950 dark:to-brand-secondary/20 text-slate-900 dark:text-slate-50">
    <!-- Removido backdrop-blur-xl e ajustado bg para solid/opaque para performance no Android -->
    <div class="w-full max-w-md mx-auto rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-0 overflow-hidden">
      <div class="flex flex-col items-center gap-2 px-8 pt-8 pb-4">
        <img src="/logo.png" alt="Logo" class="w-14 h-14 rounded-2xl shadow-md bg-white dark:bg-slate-900 object-contain" />
        <h1 class="text-2xl font-black tracking-tight text-center">
          <span class="text-slate-900 dark:text-white">A Casa</span> <span class="text-brand-primary">Móveis Planejados.</span>
        </h1>
        <p class="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 mt-1">Acesso ao sistema</p>
      </div>
      <div class="px-8 pb-8">
        <form autocomplete="off" @submit.prevent="handleLoginSubmit" class="space-y-5">
          <div class="grid gap-4">
            <Input
              v-model="formLogin.usuario"
              name="acasa_login_user"
              label="Usuário ou E-mail"
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
                <button type="button" @click="togglePassword" class="rounded-xl px-2 py-2 text-slate-500 hover:text-brand-primary dark:text-slate-400">
                  <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-base" />
                </button>
              </template>
            </Input>
          </div>
          <div class="flex items-center justify-between gap-4 mt-2">
            <CustomCheckbox v-model="lembrarUsuario" label="Lembrar" />
            <button type="button" @click="openRecuperacao" class="text-xs font-bold uppercase text-brand-primary hover:underline focus:outline-none">
              Esqueci a senha
            </button>
          </div>
          <div v-if="error" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
            {{ error }}
          </div>
          <Button type="submit" :loading="loading" fullWidth class="h-12 rounded-xl font-black uppercase tracking-[0.18em] bg-brand-primary text-white hover:bg-brand-primary/90 transition-all text-base shadow-md" :disabled="loading || !canSubmit">
            Entrar
          </Button>
          <div class="pt-4 text-center">
            <p class="text-xs text-slate-400 dark:text-slate-500">
              © {{ new Date().getFullYear() }} A Casa Móveis Planejados.
            </p>
          </div>
        </form>
      </div>
      <Teleport to="body">
        <Transition name="fade-scale">
          <div v-if="showModalRecuperacao" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/55 backdrop-blur-sm" @click="fecharTudo"></div>
            <div class="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
              <div class="px-6 py-5 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">recuperação</p>
                  <h3 class="text-lg font-black tracking-tight">Recuperar senha</h3>
                </div>
                <button @click="fecharTudo" class="rounded-xl p-2 text-slate-400 hover:text-rose-500">
                  <i class="pi pi-times text-lg"></i>
                </button>
              </div>
              <div class="px-6 py-6">
                <form @submit.prevent="handleRecuperacaoSubmit" class="space-y-4">
                  <Input v-model="emailRecuperacao" label="E-mail de acesso" type="email" required :forceUpper="false" :disabled="loading" />
                  <p class="text-sm text-slate-600 dark:text-slate-400">Enviaremos uma senha provisória para seu e-mail.</p>
                  <div class="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" @click="fecharTudo" class="flex-1 h-11 rounded-2xl">Cancelar</Button>
                    <Button type="submit" :loading="loading" class="flex-1 h-11 rounded-2xl font-black uppercase tracking-[0.25em]">Enviar</Button>
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

const showModalRecuperacao = ref(false)
const lembrarUsuario = ref(false)
const formLogin = reactive({ usuario: '', senha: '' })
const emailRecuperacao = ref('')
const showPassword = ref(false)
const error = ref('')

const togglePassword = () => { showPassword.value = !showPassword.value }
const canSubmit = computed(() => (formLogin.usuario || '').trim().length >= 3 && (formLogin.senha || '').length >= 3)

onMounted(() => {
  const salvo = localStorage.getItem('erp_lembrar_usuario')
  if (salvo) { formLogin.usuario = salvo; lembrarUsuario.value = true }
})

function fecharTudo() { showModalRecuperacao.value = false; emailRecuperacao.value = '' }
function openRecuperacao() { error.value = ''; showModalRecuperacao.value = true }

async function handleLoginSubmit() {
  error.value = ''
  try {
    const data = await login({ usuario: formLogin.usuario, senha: formLogin.senha })
    if (lembrarUsuario.value) localStorage.setItem('erp_lembrar_usuario', formLogin.usuario)
    else localStorage.removeItem('erp_lembrar_usuario')

    // Lógica crucial: Se a senha for provisória, manda trocar
    if (data?.precisa_trocar_senha) {
      router.push('/pendente')
    } else {
      router.push('/')
    }
  } catch (e) {
    error.value = 'Usuário ou senha inválidos.'
  }
}

async function handleRecuperacaoSubmit() {
  try {
    await esqueciSenha(emailRecuperacao.value)
    fecharTudo()
    alert('Enviamos uma senha provisória para seu e-mail.')
  } catch (e) {}
}

watch(lembrarUsuario, (v) => { if (!v) localStorage.removeItem('erp_lembrar_usuario') })
</script>