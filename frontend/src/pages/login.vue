<template>
  <div class="h-dvh overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
    <div class="fixed inset-0 pointer-events-none">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.16),transparent_55%)]" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(236,72,153,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_bottom,rgba(236,72,153,0.12),transparent_60%)]" />
    </div>

    <div class="relative h-dvh grid place-items-center p-4">
      <div class="w-full max-w-[520px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 shadow-[0_26px_70px_-40px_rgba(2,6,23,0.55)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60">
        
        <div class="px-7 py-6 border-b border-slate-200/70 dark:border-slate-800/70">
          <div class="flex items-center gap-4">
            <div class="grid size-12 place-items-center rounded-2xl bg-white/80 ring-1 ring-slate-200 shadow-sm backdrop-blur dark:bg-slate-900/50 dark:ring-slate-800">
              <img src="/pwa-192.png" alt="Logo" class="size-8 object-contain" />
            </div>
            <div class="flex-1">
              <p class="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">sistema</p>
              <h1 class="text-xl md:text-2xl font-black tracking-tight">
                A Casa <span class="text-indigo-600 dark:text-indigo-400">Móveis Planejados.</span>
              </h1>
            </div>
          </div>
        </div>

        <div class="px-7 py-6">
          <form autocomplete="off" @submit.prevent="handleLoginSubmit" class="space-y-5">
            <div class="grid gap-4">
              <Input
                v-model="formLogin.usuario"
                name="acasa_login_user"
                label="Usuário ou E-mail"
                class="h-11"
                :forceUpper="false"
                :disabled="loading"
              />

              <Input
                v-model="formLogin.senha"
                name="acasa_login_pass"
                autocomplete="current-password"
                :type="showPassword ? 'text' : 'password'"
                label="Senha"
                class="h-11"
                :forceUpper="false"
                :disabled="loading"
              >
                <template #suffix>
                  <button type="button" @click="togglePassword" class="rounded-xl px-2 py-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400">
                    <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-base" />
                  </button>
                </template>
              </Input>
            </div>

            <div class="flex items-center justify-between gap-4">
              <CustomCheckbox v-model="lembrarUsuario" label="Lembrar" />
              <button type="button" @click="openRecuperacao" class="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">
                Esqueci a senha
              </button>
            </div>

            <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
              {{ error }}
            </div>

            <Button type="submit" :loading="loading" fullWidth class="h-11 rounded-2xl font-black uppercase tracking-[0.25em]" :disabled="loading || !canSubmit">
              Entrar
            </Button>

            <div class="pt-4 border-t border-slate-200/70 dark:border-slate-800/70 text-center">
              <p class="text-xs text-slate-400 dark:text-slate-500">
                © {{ new Date().getFullYear() }} A Casa Móveis Planejados.
              </p>
            </div>
          </form>
        </div>
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
      router.push('/alterar-senha')
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