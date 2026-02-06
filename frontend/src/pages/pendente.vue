<template>
  <div class="w-full h-full flex items-center justify-center p-6">
    <div class="w-full max-w-[520px] rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-950">
      
      <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-900/20">
        <h1 class="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">
          Primeiro Acesso
        </h1>
        <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
          Defina sua senha definitiva para ativar sua conta
        </p>
      </div>

      <div class="px-6 py-6 space-y-5">
        <div class="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-900/30 dark:bg-indigo-950/20">
          <p class="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
            Segurança da Conta
          </p>
          <p class="text-sm text-indigo-900/80 dark:text-indigo-200/70 mt-1">
            Para sua segurança, substitua a senha provisória enviada por e-mail por uma nova senha pessoal.
          </p>
        </div>

        <form @submit.prevent="handleTrocarSenha" class="space-y-4">
          <Input
            v-model="form.senhaAtual"
            label="Senha Provisória (a que recebeu)"
            type="password"
            required
            :disabled="loading"
          />

          <Input
            v-model="form.senhaNova"
            label="Nova Senha"
            type="password"
            required
            :disabled="loading"
          />

          <Input
            v-model="form.senhaConfirmacao"
            label="Confirmar Nova Senha"
            type="password"
            required
            :disabled="loading"
          />

          <div v-if="error" class="text-xs font-bold text-rose-500 px-1">
            {{ error }}
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <Button 
              type="submit" 
              label="Ativar Minha Conta" 
              class="w-full h-11 rounded-2xl font-black uppercase tracking-wider"
              :loading="loading" 
              :disabled="!canSubmit"
            />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useAuth } from '@/services/useauth' 
import { useRouter } from 'vue-router'

definePage({ 
  path: '/pendente', // Garante que o nome da rota seja este
  meta: { 
    public: false, // O usuário PRECISA estar logado (ter o token) para alterar a senha
    layout: 'auth' 
  } 
})

const { alterarSenha, syncMe, loading } = useAuth()
const router = useRouter()
const error = ref('')

const form = reactive({
  senhaAtual: '',
  senhaNova: '',
  senhaConfirmacao: ''
})

const canSubmit = computed(() => {
  return form.senhaAtual.length >= 3 && 
         form.senhaNova.length >= 6 && 
         form.senhaNova === form.senhaConfirmacao
})

async function handleTrocarSenha() {
  error.value = ''
  
  if (form.senhaNova !== form.senhaConfirmacao) {
    error.value = 'As senhas não conferem.'
    return
  }

  try {
    // 1. Chama o backend para trocar a senha e mudar status para ATIVO
    await alterarSenha({
      senha_atual: form.senhaAtual,
      senha_nova: form.senhaNova
    })

    // 2. Sincroniza o estado do usuário (para o router saber que ele é ATIVO agora)
    await syncMe()

    // 3. Manda para a home
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.message || 'Erro ao alterar senha. Verifique a senha atual.'
  }
}
</script>