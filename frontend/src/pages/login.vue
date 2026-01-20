<template>
  <div class="min-h-screen w-full bg-slate-50 relative overflow-hidden">
    <!-- fundo leve -->
    <div class="pointer-events-none absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-brand-primary/10 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full bg-brand-dark/10 blur-3xl"></div>

    <div class="min-h-screen w-full flex items-center justify-center px-4 py-10">
      <!-- CARD ÚNICO (responsivo) -->
      <div
        class="w-full max-w-[980px] bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_20px_60px_rgba(2,6,23,0.08)] overflow-hidden"
      >
        <div class="grid grid-cols-12">
          <!-- ESQUERDA (some no mobile) -->
          <div class="hidden md:flex md:col-span-5 bg-slate-50 border-r border-slate-100 p-10 items-center justify-center">
            <div class="text-center">
              <div class="relative inline-flex items-center justify-center">
                <div class="absolute inset-0 bg-brand-primary/15 blur-2xl rounded-full"></div>
                <div class="relative h-24 w-24 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                  <img src="/pwa-192.png" alt="ACASA" class="h-14 w-14 object-contain" />
                </div>
              </div>

              <div class="mt-7">
                <div class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">ACASA</div>
                <div class="text-2xl font-black tracking-tight text-slate-900 uppercase">ERP</div>
              </div>

              <div class="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                Painel Administrativo
              </div>

              <div class="mt-8 h-px w-14 mx-auto bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

              <p class="mt-6 text-sm text-slate-500 leading-relaxed max-w-[260px] mx-auto">
                Acesso restrito. Use suas credenciais para entrar no sistema.
              </p>
            </div>
          </div>

          <!-- DIREITA (form) -->
          <div class="col-span-12 md:col-span-7 p-8 sm:p-10">
            <!-- topo mobile -->
            <div class="md:hidden flex flex-col items-center mb-8">
              <div class="relative">
                <div class="absolute inset-0 bg-brand-primary/15 blur-2xl rounded-full"></div>
                <div class="relative h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                  <img src="/pwa-192.png" alt="ACASA" class="h-10 w-10 object-contain" />
                </div>
              </div>
              <div class="mt-4 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">ACASA ERP</div>
              <div class="mt-4 h-px w-12 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
            </div>

            <header class="text-center md:text-left">
              <h2 class="text-3xl font-black text-slate-900 tracking-tight leading-none">
                Acesso Restrito
              </h2>
              <p class="text-slate-400 mt-3 text-[11px] font-black uppercase tracking-[0.2em]">
                Entre para continuar
              </p>
            </header>

            <form class="mt-8 space-y-6" @submit.prevent="handleLoginSubmit">
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

              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CustomCheckbox v-model="lembrarUsuario" label="Lembrar acesso" />

                <button
                  type="button"
                  @click="openRecuperacao()"
                  class="text-[10px] font-black uppercase text-slate-400 hover:text-brand-primary tracking-widest transition-colors text-left sm:text-right"
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
                class="h-14 shadow-2xl shadow-brand-primary/25"
              >
                {{ loading ? 'Autenticando...' : 'Entrar no Sistema' }}
              </Button>

              <div class="pt-2 text-center">
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

              <div class="pt-6 flex items-center justify-center md:justify-start gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
                <span>Conexão Segura</span>
                <span class="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span>v2.4.0</span>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- MODAIS: mantém os seus exatamente como estão (não mexi) -->
      <!-- ========================= MODAL CADASTRO ========================= -->
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

      <!-- ========================= MODAL RECUPERAÇÃO ========================= -->
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
      <!-- ================================================================ -->
    </div>
  </div>
</template>


<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/useauth'

const router = useRouter()
const { login, solicitarCadastro, esqueciSenha, loading, error } = useAuth()

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
    const resp = await login({ usuario: formLogin.usuario, senha: formLogin.senha })

    if (lembrarUsuario.value) localStorage.setItem('erp_lembrar_usuario', formLogin.usuario)
    else localStorage.removeItem('erp_lembrar_usuario')

    // resp pode ser (data) ou (axios response). Blindagem:
const data = await login({ usuario: formLogin.usuario, senha: formLogin.senha })

if (lembrarUsuario.value) localStorage.setItem('erp_lembrar_usuario', formLogin.usuario)
else localStorage.removeItem('erp_lembrar_usuario')

if (data?.precisa_trocar_senha) router.push('/alterar-senha')
else router.push('/')

  } catch (e) {}
}

watch(lembrarUsuario, (v) => {
  if (!v) localStorage.removeItem('erp_lembrar_usuario')
})

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
await esqueciSenha(emailRecuperacao.value)
alert('Enviamos uma senha provisória para seu e-mail.')
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
