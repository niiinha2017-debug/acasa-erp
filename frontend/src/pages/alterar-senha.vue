<template>
  <div class="w-full max-w-[720px] mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-black text-slate-800">Alterar Senha</h1>
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Atualize sua senha de acesso</p>
      </div>
      <Button
        variant="primary"
        class="!h-10 !rounded-xl !px-6 text-[10px] font-black uppercase tracking-widest"
        :loading="loading"
        :disabled="!canSubmit"
        @click="handleSalvar"
      >
        Atualizar Senha
      </Button>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
        <p class="text-sm font-semibold text-indigo-900">Dica de segurança</p>
        <p class="text-sm text-indigo-900/80 mt-1">
          Use uma senha forte com letras e números. Evite repetir senhas antigas.
        </p>
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="handleSalvar">
        <Input
          v-model="form.senhaAtual"
          label="Senha Atual"
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

        <div v-if="error" class="text-xs font-bold text-rose-500">
          {{ error }}
        </div>

        <div class="pt-2">
          <Button
            type="submit"
            fullWidth
            class="h-11 rounded-2xl font-black uppercase tracking-wider"
            :loading="loading"
            :disabled="!canSubmit"
          >
            Salvar Alteração
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useAuth } from '@/services/useauth'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'alterar-senha' } })

const { alterarSenha, loading } = useAuth()
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

async function handleSalvar() {
  error.value = ''

  if (form.senhaNova !== form.senhaConfirmacao) {
    error.value = 'As senhas não conferem.'
    return
  }

  try {
    await alterarSenha({
      senha_atual: form.senhaAtual,
      senha_nova: form.senhaNova,
    })

    notify.success('Senha atualizada com sucesso.')
    form.senhaAtual = ''
    form.senhaNova = ''
    form.senhaConfirmacao = ''
  } catch (e) {
    error.value = e?.response?.data?.message || 'Erro ao alterar senha.'
  }
}
</script>
