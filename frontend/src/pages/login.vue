<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 py-8 font-sans">
    <div class="w-full max-w-md">
      <!-- CARD -->
      <div class="bg-white border border-gray-200 rounded-[2rem] shadow-2xl overflow-hidden">
        <header class="p-8 pb-6">
          <h1 class="text-4xl font-black text-gray-900 tracking-tight leading-none">Acesso</h1>
          <p class="text-gray-500 mt-3 text-base font-medium">Entre com suas credenciais para continuar</p>
        </header>

        <div class="px-8 pb-8">
          <form class="space-y-6" @submit.prevent="handleLoginSubmit">
            <div class="space-y-2">
              <label class="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Usuário ou E-mail</label>
              <input
                v-model="formLogin.usuario"
                type="text"
                class="w-full h-14 px-5 bg-white border border-gray-200 rounded-2xl outline-none transition-all shadow-sm
                       focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-base"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div class="space-y-2">
              <label class="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Senha</label>
              <div class="relative">
                <input
                  v-model="formLogin.senha"
                  :type="showPassword ? 'text' : 'password'"
                  class="w-full h-14 px-5 pr-14 bg-white border border-gray-200 rounded-2xl outline-none transition-all shadow-sm
                         focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-base"
                  required
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary"
                  aria-label="Mostrar/ocultar senha"
                >
                  <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-xl"></i>
                </button>
              </div>
            </div>

            <div class="flex items-center gap-3 px-1">
              <input
                type="checkbox"
                id="remember"
                v-model="lembrarUsuario"
                class="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <label for="remember" class="text-sm font-bold text-gray-600 cursor-pointer select-none">
                Manter conectado
              </label>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full h-14 bg-brand-primary hover:bg-brand-dark text-white rounded-2xl font-black
                     shadow-xl shadow-brand-primary/20 transition-all flex items-center justify-center gap-3
                     active:scale-[0.98] disabled:opacity-50 text-base uppercase"
            >
              <i v-if="loading" class="pi pi-spin pi-spinner text-xl"></i>
              {{ loading ? 'Autenticando...' : 'Entrar no Sistema' }}
            </button>

            <div class="flex items-center justify-center gap-4 pt-2 text-[13px] font-bold text-gray-400">
              <button
                type="button"
                @click="showModalRecuperacao = true"
                class="hover:text-brand-primary transition-colors"
              >
                Esqueci a senha
              </button>
              <span class="opacity-30">|</span>
              <button
                type="button"
                @click="showModalCadastro = true"
                class="text-brand-primary hover:text-brand-dark transition-colors"
              >
                Solicitar cadastro
              </button>
            </div>

            <div
              v-if="error"
              class="p-4 bg-red-50 border border-red-100 text-danger text-sm font-bold rounded-2xl flex items-center gap-3 mt-2"
            >
              <i class="pi pi-exclamation-circle"></i> {{ error }}
            </div>
          </form>
        </div>
      </div>

      <!-- BRAND MINI -->
      <p class="text-center text-xs text-gray-400 mt-5">
        A Casa • Sistema de Gestão
      </p>
    </div>

    <!-- MODAL CENTRALIZADO (sempre no centro da viewport) -->
    <Teleport to="body">
      <div
        v-if="showModalRecuperacao || showModalCadastro"
        class="fixed inset-0 left-0 top-0 z-[9999] bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      >
        <div
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                 w-[min(92vw,34rem)] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden
                 border border-white/20"
        >
          <header class="p-7 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 class="text-lg font-black text-gray-800 uppercase tracking-widest leading-none">
              {{ showModalRecuperacao ? 'Recuperar Senha' : 'Novo Cadastro' }}
            </h3>
            <button
              @click="fecharTudo"
              class="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-danger transition-all"
              aria-label="Fechar"
            >
              <i class="pi pi-times text-xl"></i>
            </button>
          </header>

          <!-- CADASTRO -->
          <form v-if="showModalCadastro" @submit.prevent="handleCadastroSubmit" class="p-7 space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2 space-y-1">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input
                  v-model="formCadastro.nome"
                  type="text"
                  class="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-primary outline-none"
                  required
                />
              </div>

              <div class="sm:col-span-2 space-y-1">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <input
                  v-model="formCadastro.email"
                  type="email"
                  class="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-primary outline-none"
                  required
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Usuário</label>
                <input
                  v-model="formCadastro.usuario"
                  type="text"
                  class="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-primary outline-none"
                  required
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
                <input
                  v-model="formCadastro.senha"
                  type="password"
                  class="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-primary outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              class="w-full h-12 bg-brand-primary text-white rounded-2xl font-black shadow-lg hover:bg-brand-dark transition-all uppercase"
            >
              Solicitar acesso
            </button>
          </form>

          <!-- RECUPERAÇÃO -->
          <div v-else class="p-7 text-center">
            <p class="text-gray-500 mb-5 font-medium">Informe seu e-mail para receber as instruções.</p>
            <input
              v-model="emailRecuperacao"
              type="email"
              class="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-primary outline-none mb-5"
              placeholder="seu@email.com"
            />
            <div class="flex flex-col sm:flex-row gap-3">
              <button
                @click="showModalRecuperacao = false"
                class="flex-1 h-12 bg-gray-100 text-gray-600 rounded-2xl font-bold"
                type="button"
              >
                Cancelar
              </button>
              <button
                @click="handleRecuperarSenha"
                class="flex-[2] h-12 bg-brand-primary text-white rounded-2xl font-bold"
                type="button"
              >
                Enviar link
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/useauth'

const router = useRouter()
const { login, solicitarCadastro, loading, error } = useAuth()

const showPassword = ref(false)
const showModalCadastro = ref(false)
const showModalRecuperacao = ref(false)
const emailRecuperacao = ref('')
const lembrarUsuario = ref(false)

const formLogin = reactive({ usuario: '', senha: '' })
const formCadastro = reactive({ nome: '', email: '', usuario: '', senha: '' })

onMounted(() => {
  const salvo = localStorage.getItem('erp_lembrar_usuario')
  if (salvo) {
    formLogin.usuario = salvo
    lembrarUsuario.value = true
  }
  setTimeout(() => {
    if (!lembrarUsuario.value) formLogin.usuario = ''
    formLogin.senha = ''
  }, 100)
})

async function handleLoginSubmit() {
  try {
    await login(formLogin)
    if (lembrarUsuario.value) {
      localStorage.setItem('erp_lembrar_usuario', formLogin.usuario)
    } else {
      localStorage.removeItem('erp_lembrar_usuario')
    }
    router.push('/')
  } catch (e) {
    console.error('Login falhou')
  }
}

async function handleCadastroSubmit() {
  try {
    await solicitarCadastro({
      ...formCadastro,
      setor: 'PENDENTE',
      funcao: 'Aguardando',
      status: 'PENDENTE'
    })
    fecharTudo()
    alert('Solicitação enviada!')
  } catch (e) {
    alert('Erro no cadastro.')
  }
}

function fecharTudo() {
  showModalCadastro.value = false
  showModalRecuperacao.value = false
  Object.assign(formCadastro, { nome: '', email: '', usuario: '', senha: '' })
}

function handleRecuperarSenha() {
  alert('Instruções enviadas!')
  showModalRecuperacao.value = false
}
</script>
