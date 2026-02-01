<template>
  <!-- trava qualquer scroll -->
  <div class="h-dvh overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
    <!-- fundo BEM discreto (não compete) -->
    <div class="fixed inset-0 pointer-events-none">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.16),transparent_55%)]" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(236,72,153,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_bottom,rgba(236,72,153,0.12),transparent_60%)]" />
    </div>

    <!-- centraliza na viewport -->
    <div class="relative h-dvh grid place-items-center p-4">
      <!-- CARD ÚNICO -->
      <div
        class="w-full max-w-[520px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85
               shadow-[0_26px_70px_-40px_rgba(2,6,23,0.55)] backdrop-blur
               dark:border-slate-800/70 dark:bg-slate-950/60"
      >
        <!-- HEADER compacto -->
        <div class="px-7 py-6 border-b border-slate-200/70 dark:border-slate-800/70">
          <div class="flex items-center gap-4">
<div class="grid size-12 place-items-center rounded-2xl bg-white/80 ring-1 ring-slate-200 shadow-sm backdrop-blur
            dark:bg-slate-900/50 dark:ring-slate-800">
  <img src="/pwa-192.png" alt="Logo" class="size-8 object-contain" />
</div>


            <div class="flex-1">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                    sistema
                  </p>
                  <h1 class="text-xl md:text-2xl font-black tracking-tight">
                    A Casa <span class="text-indigo-600 dark:text-indigo-400">Móveis Planejados.</span>
                  </h1>
                </div>

                <span
                  class="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1
                         text-[10px] font-black uppercase tracking-[0.22em] text-slate-500
                         dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400"
                >
                  login
                </span>
              </div>

              <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Entre com suas credenciais para continuar.
              </p>
            </div>
          </div>
        </div>

        <!-- BODY: largura do form controlada -->
        <div class="px-7 py-6">
          <form @submit.prevent="handleLoginSubmit" class="space-y-5">
            <div class="grid gap-4">
<Input
  v-model="formLogin.usuario"
  label="Usuário ou E-mail"
  autocomplete="username"
  class="h-11"
  :forceUpper="false"
  :disabled="loading"
/>

<Input
  v-model="formLogin.senha"
  :type="showPassword ? 'text' : 'password'"
  label="Senha"
  autocomplete="current-password"
  class="h-11"
  :forceUpper="false"
  :disabled="loading"
>

                <template #suffix>
                  <button
                    type="button"
                    @click="togglePassword"
                    class="rounded-xl px-2 py-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition"
                    :disabled="loading"
                    aria-label="Mostrar/ocultar senha"
                  >
                    <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-base" />
                  </button>
                </template>
              </Input>
            </div>

            <div class="flex items-center justify-between gap-4">
              <CustomCheckbox v-model="lembrarUsuario" label="Lembrar" />

              <button
                type="button"
                @click="openRecuperacao"
                class="text-xs font-black uppercase tracking-normal text-indigo-600 hover:text-indigo-700
                       dark:text-indigo-400 dark:hover:text-indigo-300"
                :disabled="loading"
              >
                Esqueci a senha
              </button>
            </div>

            <div
              v-if="error"
              class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700
                     dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
            >
              {{ error }}
            </div>

<Button
  type="submit"
  :loading="loading"
  fullWidth
  class="h-11 rounded-2xl font-black uppercase tracking-[0.25em]"
  :disabled="loading || !canSubmit"
>
  Entrar
</Button>


            <div class="pt-4 border-t border-slate-200/70 dark:border-slate-800/70 text-center">
              <button
                type="button"
                @click="openCadastro"
                class="text-sm text-slate-600 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-300"
                :disabled="loading"
              >
                Não tem conta? <span class="font-black">Solicitar acesso</span>
              </button>

              <p class="mt-4 text-xs text-slate-400 dark:text-slate-500">
                © {{ new Date().getFullYear() }} A Casa Móveis Planejados. Todos os direitos reservados.
              </p>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: mantém seu bloco igual (não mexi) -->
      <Teleport to="body">
        <Transition name="fade-scale">
          <div
            v-if="showModalCadastro || showModalRecuperacao"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
            @keydown.esc="fecharTudo"
            tabindex="-1"
          >
            <div class="absolute inset-0 bg-black/55 backdrop-blur-sm" @click="fecharTudo"></div>

            <div
              class="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl
                     dark:border-slate-800 dark:bg-slate-950"
            >
              <div class="px-6 py-5 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                    {{ showModalCadastro ? 'cadastro' : 'recuperação' }}
                  </p>
                  <h3 class="text-lg font-black tracking-tight">
                    {{ showModalCadastro ? 'Solicitar acesso' : 'Recuperar senha' }}
                  </h3>
                </div>

                <button type="button" @click="fecharTudo" class="rounded-xl p-2 text-slate-400 hover:text-rose-500 transition">
                  <i class="pi pi-times text-lg"></i>
                </button>
              </div>

              <div class="px-6 py-6">
                <form
                  @submit.prevent="showModalCadastro ? handleCadastroSubmit() : handleRecuperacaoSubmit()"
                  class="space-y-4"
                >
                  <div v-if="showModalCadastro" class="space-y-4">
                    <Input v-model="formCadastro.nome" label="Nome Completo" required :disabled="loading" />
<Input
  v-model="formCadastro.email"
  label="E-mail"
  type="email"
  required
  :forceUpper="false"
  :disabled="loading"
/>

<Input
  v-model="formCadastro.usuario"
  label="Usuário Desejado"
  required
  :forceUpper="false"
  :disabled="loading"
/>

<Input
  v-model="formCadastro.senha"
  label="Senha"
  type="password"
  required
  :forceUpper="false"
  :disabled="loading"
/>

                  </div>

                  <div v-else class="space-y-4">
<Input
  v-model="emailRecuperacao"
  label="E-mail de acesso"
  type="email"
  required
  placeholder="Digite seu e-mail cadastrado"
  :forceUpper="false"
  :disabled="loading"
/>

                    <p class="text-sm text-slate-600 dark:text-slate-400">
                      Enviaremos uma senha provisória para seu e-mail.
                    </p>
                  </div>

                  <div class="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button type="button" variant="secondary" @click="fecharTudo" class="flex-1 h-11 rounded-2xl" :disabled="loading">
                      Cancelar
                    </Button>
                    <Button type="submit" :loading="loading" class="flex-1 h-11 rounded-2xl font-black uppercase tracking-[0.25em]">
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
  </div>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active { transition: opacity 160ms ease, transform 160ms ease; }
.fade-scale-enter-from,
.fade-scale-leave-to { opacity: 0; transform: scale(0.98); }
</style>



<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/useauth'

definePage({ meta: { public: true, layout: 'auth' } })

const router = useRouter()
const { login, solicitarCadastro, esqueciSenha, loading } = useAuth()

const showModalCadastro = ref(false)
const showModalRecuperacao = ref(false)
const lembrarUsuario = ref(false)

const formLogin = reactive({ usuario: '', senha: '' })
const formCadastro = reactive({ nome: '', email: '', usuario: '', senha: '' })
const emailRecuperacao = ref('')

const showPassword = ref(false)
const error = ref('')

const togglePassword = () => { showPassword.value = !showPassword.value }

const canSubmit = computed(() => {
  return (formLogin.usuario || '').trim().length >= 3 && (formLogin.senha || '').length >= 3
})

onMounted(() => {
  const salvo = localStorage.getItem('erp_lembrar_usuario')
  if (salvo) {
    formLogin.usuario = salvo
    lembrarUsuario.value = true
  }
})

function resetLogin() {
  // ✅ sempre limpa senha
  formLogin.senha = ''
  // ✅ limpa usuário se NÃO estiver lembrando
  if (!lembrarUsuario.value) formLogin.usuario = ''
  showPassword.value = false
}

function resetCadastro() {
  formCadastro.nome = ''
  formCadastro.email = ''
  formCadastro.usuario = ''
  formCadastro.senha = ''
}

function resetRecuperacao() {
  emailRecuperacao.value = ''
}


function openCadastro() {
  error.value = ''
  resetCadastro() // ✅
  showModalCadastro.value = true
  showModalRecuperacao.value = false
}

function openRecuperacao() {
  error.value = ''
  resetRecuperacao() // ✅
  showModalRecuperacao.value = true
  showModalCadastro.value = false
}


function fecharTudo() {
  showModalCadastro.value = false
  showModalRecuperacao.value = false
  resetCadastro()     // ✅
  resetRecuperacao()  // ✅
}


async function handleLoginSubmit() {
  error.value = ''
  try {
    const data = await login({ usuario: formLogin.usuario, senha: formLogin.senha })

    if (lembrarUsuario.value) localStorage.setItem('erp_lembrar_usuario', formLogin.usuario)
    else localStorage.removeItem('erp_lembrar_usuario')

    resetLogin() // ✅ AQUI

    if (data?.precisa_trocar_senha) router.push('/alterar-senha')
    else router.push('/')
  } catch (e) {
    error.value = 'Usuário ou senha inválidos.'
  }
}


watch(lembrarUsuario, (v) => {
  if (!v) localStorage.removeItem('erp_lembrar_usuario')
})

async function handleCadastroSubmit() {
  try {
    await solicitarCadastro({
      nome: formCadastro.nome,
      email: formCadastro.email,
      usuario: formCadastro.usuario,
      senha: formCadastro.senha,
    })

    fecharTudo() // ✅ já limpa tudo
    alert('Solicitação enviada com sucesso!')
  } catch (e) {}
}



async function handleRecuperacaoSubmit() {
  try {
    await esqueciSenha(emailRecuperacao.value)
    fecharTudo() // ✅ já limpa tudo
    alert('Enviamos uma senha provisória para seu e-mail.')
  } catch (e) {}
}


</script>

