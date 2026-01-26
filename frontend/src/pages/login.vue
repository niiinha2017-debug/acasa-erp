<template>
  <div class="h-screen w-full bg-bg-page relative flex items-center justify-center p-4 overflow-hidden">
    
    <div class="pointer-events-none absolute -top-48 -right-48 h-[500px] w-[500px] rounded-full bg-brand-primary/10 blur-[100px]"></div>
    <div class="pointer-events-none absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-brand-dark/10 blur-[100px]"></div>

    <div
      class="w-full max-w-[1100px] h-auto max-h-[95vh] lg:max-h-[850px] bg-bg-card border border-border-ui rounded-[2.5rem] shadow-2xl flex flex-col md:grid md:grid-cols-12 overflow-hidden animate-page-in"
    >
      
      <div class="hidden md:flex md:col-span-5 lg:col-span-4 bg-slate-500/5 border-r border-border-ui flex-col items-center justify-center p-8 lg:p-12 text-center">
        <div class="relative h-20 w-20 lg:h-24 lg:w-24 rounded-[2rem] bg-bg-card border border-border-ui shadow-lg flex items-center justify-center p-4 mb-6">
           <img src="/pwa-192.png" alt="Logo" class="w-full h-full object-contain" />
        </div>
        <h1 class="text-2xl lg:text-3xl font-black text-text-main tracking-tighter uppercase">ACASA <span class="text-brand-primary">ERP</span></h1>
        <div class="mt-6 h-1 w-12 bg-brand-primary rounded-full"></div>
        
        <p class="mt-6 text-xs lg:text-sm text-slate-500 font-medium leading-relaxed px-4">
          Gerenciamento inteligente e controle absoluto. <br/>
          <span class="text-slate-400 italic">Sua estrutura, simplificada.</span>
        </p>
      </div>

      <div class="col-span-12 md:col-span-7 lg:col-span-8 p-8 lg:p-16 flex flex-col justify-center overflow-y-auto custom-scroll">
        
        <header class="mb-8 lg:mb-10">
          <h2 class="text-3xl lg:text-4xl font-black text-text-main tracking-tight">Acesso Restrito</h2>
          <p class="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Identifique-se para continuar</p>
        </header>

        <form @submit.prevent="handleLoginSubmit" class="space-y-5 lg:space-y-6" autocomplete="off">
          <div class="space-y-4">
            <Input 
              v-model="formLogin.usuario" 
              label="Usuário ou E-mail" 
              class="!h-14"
              autocomplete="off" 
            />
            <Input 
              v-model="formLogin.senha" 
              type="password" 
              label="Senha" 
              class="!h-14"
              autocomplete="new-password"
            />
          </div>

          <div class="flex items-center justify-between text-[11px]">
            <CustomCheckbox v-model="lembrarUsuario" label="Lembrar acesso" />
            <button 
              type="button" 
              @click="showModalRecuperacao = true"
              class="font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary transition-colors"
            >
              Recuperar Senha
            </button>
          </div>

          <Button 
            variant="primary" 
            type="submit"
            :loading="loading"
            fullWidth 
            class="h-14 lg:h-16 text-md !rounded-2xl shadow-xl shadow-brand-primary/20"
          >
            Entrar no Sistema
          </Button>

          <div class="pt-4 text-center">
            <button 
              type="button" 
              @click="showModalCadastro = true"
              class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary"
            >
              Novo por aqui? <span class="text-brand-primary">Solicitar Conta</span>
            </button>
          </div>

          <div class="pt-6 border-t border-slate-100 flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
            <span>Ambiente Criptografado</span>
            <span class="w-1 h-1 bg-slate-200 rounded-full"></span>
            <span>v2.4.0</span>
          </div>
        </form>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModalCadastro || showModalRecuperacao" class="fixed inset-0 z-[1100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" @click="fecharTudo"></div>
        
        <div class="relative w-full max-w-[500px] bg-bg-card rounded-[2.5rem] shadow-2xl animate-modal-in border border-border-ui overflow-hidden">
          
          <div v-if="showModalCadastro" class="p-10">
             <h3 class="text-3xl font-black text-text-main tracking-tight text-center mb-2">Solicitar Conta</h3>
             <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 text-center mb-8 border-b border-border-ui pb-6">Informe seus dados para análise</p>
             
             <form class="space-y-5" @submit.prevent="handleCadastroSubmit">
               <Input v-model="formCadastro.nome" label="Nome Completo" :force-upper="true" required />
               <Input v-model="formCadastro.email" label="E-mail" type="email" required />
               <Input v-model="formCadastro.usuario" label="Usuário Desejado" required />
               <Input v-model="formCadastro.senha" label="Senha" type="password" required />

               <div class="grid grid-cols-2 gap-4 pt-4">
                 <Button type="button" variant="secondary" @click="fecharTudo">Voltar</Button>
                 <Button type="submit" variant="primary" :loading="loading">Solicitar</Button>
               </div>
             </form>
          </div>

          <div v-if="showModalRecuperacao" class="p-10">
             <h3 class="text-3xl font-black text-text-main tracking-tight text-center mb-2">Recuperar</h3>
             <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 text-center mb-8 border-b border-border-ui pb-6">Enviaremos um link de redefinição</p>
             
             <form class="space-y-6" @submit.prevent="handleRecuperacaoSubmit">
               <Input v-model="emailRecuperacao" label="E-mail de acesso" placeholder="Ex: ana@exemplo.com" required />
               <div class="grid grid-cols-2 gap-4">
                 <Button type="button" variant="secondary" @click="fecharTudo">Cancelar</Button>
                 <Button type="submit" variant="primary" :loading="loading">Enviar</Button>
               </div>
             </form>
          </div>
        </div>
      </div>
    </Teleport>
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
