<template>
  <div class="h-screen w-full bg-bg-page relative flex items-center justify-center p-4 overflow-hidden">
    
    <div class="pointer-events-none absolute -top-48 -right-48 h-[500px] w-[500px] rounded-full bg-brand-primary/10 blur-[100px]"></div>
    <div class="pointer-events-none absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-brand-dark/10 blur-[100px]"></div>

    <div
      class="w-full max-w-[500px] bg-bg-card border border-border-ui rounded-[2.5rem] shadow-2xl p-8 lg:p-12 animate-page-in relative z-10"
    >
      <header class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary mb-4">
          <i class="pi pi-lock text-2xl"></i>
        </div>
        <h1 class="text-3xl font-black text-text-main tracking-tight">Segurança</h1>
        <p class="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Atualize sua senha de acesso</p>
      </header>

      <form class="space-y-5" @submit.prevent="handleSubmit" autocomplete="off">
        <div class="space-y-4">
          <Input
            v-model="senhaAtual"
            type="password"
            label="Senha Atual"
            placeholder="Digite a senha atual"
            autocomplete="current-password"
            required
          />

          <div class="h-px w-full bg-gradient-to-r from-transparent via-border-ui to-transparent my-2"></div>

          <Input
            v-model="senhaNova"
            type="password"
            label="Nova Senha"
            placeholder="Crie uma senha forte"
            autocomplete="new-password"
            required
          />

          <Input
            v-model="confirmarSenha"
            type="password"
            label="Confirmar Nova Senha"
            placeholder="Repita a nova senha"
            autocomplete="new-password"
            required
          />
        </div>

        <div v-if="erroLocal || error" class="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
          <i class="pi pi-exclamation-circle text-red-500"></i>
          <p class="text-red-500 text-xs font-bold leading-tight">{{ erroLocal || error }}</p>
        </div>

        <div class="pt-4">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            :loading="loading"
            class="h-16 !rounded-2xl shadow-xl shadow-brand-primary/20"
          >
            {{ loading ? 'Processando...' : 'Confirmar Alteração' }}
          </Button>
        </div>

        <p class="text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 pt-4">
          <i class="pi pi-shield-check mr-1"></i> Proteção de conta ativa
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/useauth'
import { confirm } from '@/services/confirm'


const router = useRouter()
const { alterarSenha, loading, error, logout } = useAuth()

const senhaAtual = ref('')
const senhaNova = ref('')
const confirmarSenha = ref('')
const erroLocal = ref('')

async function handleSubmit() {
  erroLocal.value = ''

  if (!senhaAtual.value || !senhaNova.value || !confirmarSenha.value) {
    erroLocal.value = 'Preencha todos os campos'
    return
  }

  if (senhaNova.value !== confirmarSenha.value) {
    erroLocal.value = 'As senhas não conferem'
    return
  }

  const ok = await confirm.show(
    'Alterar Senha',
    'Deseja confirmar a alteração da sua senha de acesso?',
  )
  if (!ok) return

  try {
    await alterarSenha(senhaAtual.value, senhaNova.value)
    router.push('/')
  } catch (e) {}
}

</script>

<route lang="json">
{
  "meta": {
    "public": false
  }
}
</route>
