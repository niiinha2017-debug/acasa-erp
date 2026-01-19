<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] px-4 py-8 font-sans relative overflow-hidden">
    <!-- blobs -->
    <div class="absolute -top-24 -right-24 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-dark/5 rounded-full blur-3xl"></div>

    <div class="w-full max-w-[440px] z-10">
      <!-- logo -->
      <div class="flex flex-col items-center mb-10">
        <div class="relative group">
          <div class="absolute inset-0 bg-brand-primary/20 blur-2xl rounded-full scale-75 group-hover:scale-110 transition-transform duration-700"></div>
          <img
            src="/pwa-192.png"
            alt="Logo ERP"
            class="relative h-20 w-auto object-contain drop-shadow-2xl transform transition-transform duration-500 hover:scale-105"
          />
        </div>
        <div class="h-px w-12 bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-6"></div>
      </div>

      <!-- card -->
      <div class="bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
        <header class="p-10 pb-6 text-center">
          <h2 class="text-3xl font-black text-slate-900 tracking-tight leading-none">Acesso Restrito</h2>
          <p class="text-slate-400 mt-3 text-[11px] font-black uppercase tracking-[0.2em]">Painel Administrativo</p>
        </header>

        <div class="px-10 pb-10">
          <form class="space-y-6" @submit.prevent="handleLoginSubmit">
            <div class="space-y-5">
              <Input
                v-model="formLogin.usuario"
                label="Usuário ou E-mail"
                placeholder="Identificação"
                :force-upper="false"
                required
              />

              <Input
                v-model="formLogin.senha"
                label="Senha"
                :type="showPassword ? 'text' : 'password'"
                :force-upper="false"
                required
              >
                <template #suffix>
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="pr-2 text-slate-300 hover:text-brand-primary transition-colors"
                  >
                    <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-lg"></i>
                  </button>
                </template>
              </Input>
            </div>

            <div class="flex items-center justify-between px-1">
              <CustomCheckbox v-model="lembrarUsuario" label="Lembrar acesso" />

              <button
                type="button"
                @click="openRecuperacao()"
                class="text-[10px] font-black uppercase text-slate-400 hover:text-brand-primary tracking-widest transition-colors"
              >
                Recuperar Senha
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              :loading="loading"
              class="h-14 shadow-2xl shadow-brand-primary/30"
            >
              {{ loading ? 'Autenticando...' : 'Entrar no Sistema' }}
            </Button>

            <div class="pt-4 text-center">
              <button
                type="button"
                @click="openCadastro()"
                class="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-600 transition-all"
              >
                Novo por aqui? <span class="text-brand-primary">Solicitar Conta</span>
              </button>
            </div>

            <p v-if="error" class="text-center text-xs font-bold text-red-500">
              {{ error }}
            </p>
          </form>
        </div>
      </div>

      <div class="mt-8 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
        <span>Conexão Segura</span>
        <span class="w-1 h-1 bg-slate-200 rounded-full"></span>
        <span>v2.4.0</span>
      </div>
    </div>

    <!-- =========================
         MODAL CADASTRO
         ========================= -->
    <div
      v-if="showModalCadastro"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @keydown.esc="fecharTudo"
      tabindex="-1"
    >
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="fecharTudo"></div>

      <div class="relative w-full max-w-[520px] bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_30px_80px_rgba(0,0,0,0.18)] overflow-hidden">
        <header class="p-8 pb-5 text-center border-b border-slate-100">
          <h3 class="text-2xl font-black text-slate-900 tracking-tight">Solicitar Conta</h3>
          <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mt-2">
            Preencha seus dados para aprovação
          </p>
        </header>

        <div class="p-8">
          <form class="space-y-5" @submit.prevent="handleCadastroSubmit">
            <Input v-model="formCadastro.nome" label="Nome" placeholder="Seu nome" :force-upper="true" required />
            <Input v-model="formCadastro.email" label="E-mail" placeholder="email@dominio.com" :force-upper="false" required />
            <Input v-model="formCadastro.usuario" label="Usuário" placeholder="Ex: Ana.P" :force-upper="false" required />
            <Input v-model="formCadastro.senha" label="Senha" type="password" :force-upper="false" required />

            <div class="pt-2 grid grid-cols-2 gap-3">
              <Button type="button" variant="secondary" fullWidth @click="fecharTudo">Cancelar</Button>
              <Button type="submit" variant="primary" fullWidth :loading="loading">
                {{ loading ? 'Enviando...' : 'Enviar Solicitação' }}
              </Button>
            </div>

            <p v-if="error" class="text-center text-xs font-bold text-red-500">
              {{ error }}
            </p>
          </form>
        </div>
      </div>
    </div>

    <!-- =========================
         MODAL RECUPERAÇÃO
         (UI pronta; backend depende do seu endpoint)
         ========================= -->
    <div
      v-if="showModalRecuperacao"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @keydown.esc="fecharTudo"
      tabindex="-1"
    >
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="fecharTudo"></div>

      <div class="relative w-full max-w-[520px] bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_30px_80px_rgba(0,0,0,0.18)] overflow-hidden">
        <header class="p-8 pb-5 text-center border-b border-slate-100">
          <h3 class="text-2xl font-black text-slate-900 tracking-tight">Recuperar Senha</h3>
          <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mt-2">
            Enviaremos instruções para o e-mail
          </p>
        </header>

        <div class="p-8">
          <form class="space-y-5" @submit.prevent="handleRecuperacaoSubmit">
            <Input v-model="emailRecuperacao" label="E-mail" placeholder="email@dominio.com" :force-upper="false" required />

            <div class="pt-2 grid grid-cols-2 gap-3">
              <Button type="button" variant="secondary" fullWidth @click="fecharTudo">Cancelar</Button>
              <Button type="submit" variant="primary" fullWidth :loading="loading">
                {{ loading ? 'Enviando...' : 'Enviar' }}
              </Button>
            </div>

            <p class="text-center text-[10px] font-black uppercase tracking-widest text-slate-300">
              (precisa ligar no endpoint de recuperação)
            </p>

            <p v-if="error" class="text-center text-xs font-bold text-red-500">
              {{ error }}
            </p>
          </form>
        </div>
      </div>
    </div>

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

const lembrarUsuario = ref(false)

const formLogin = reactive({ usuario: '', senha: '' })
const formCadastro = reactive({ nome: '', email: '', usuario: '', senha: '' })
const emailRecuperacao = ref('')

onMounted(() => {
  const salvo = localStorage.getItem('erp_lembrar_usuario')
  if (salvo) {
    formLogin.usuario = salvo
    lembrarUsuario.value = true
  }
})

function openCadastro() {
  showModalCadastro.value = true
  showModalRecuperacao.value = false
}

function openRecuperacao() {
  showModalRecuperacao.value = true
  showModalCadastro.value = false
}

function fecharTudo() {
  showModalCadastro.value = false
  showModalRecuperacao.value = false
}

async function handleLoginSubmit() {
  try {
    await login({ usuario: formLogin.usuario, senha: formLogin.senha })

    if (lembrarUsuario.value) localStorage.setItem('erp_lembrar_usuario', formLogin.usuario)
    else localStorage.removeItem('erp_lembrar_usuario')

    router.push('/')
  } catch (e) {}
}

async function handleCadastroSubmit() {
  try {
    await solicitarCadastro({
      ...formCadastro,
      setor: 'PENDENTE',
      funcao: 'Aguardando',
      status: 'PENDENTE',
    })
    fecharTudo()
    alert('Solicitação enviada com sucesso!')
  } catch (e) {}
}

async function handleRecuperacaoSubmit() {
  try {
    // TODO: ligar no seu endpoint quando existir (ex: auth/recuperar)
    // await recuperarSenha({ email: emailRecuperacao.value })
    alert('Endpoint de recuperação ainda não foi ligado.')
    fecharTudo()
  } catch (e) {}
}
</script>


<route lang="json">
{
  "meta": {
    "layout": "auth",
    "public": true
  }
}
</route>
