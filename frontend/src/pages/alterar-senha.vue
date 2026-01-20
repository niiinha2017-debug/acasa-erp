<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-6">
    <div class="w-full max-w-md bg-white rounded-xl p-6 shadow">
      <h1 class="text-xl font-black mb-4">Alterar Senha</h1>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <input
          v-model="senhaAtual"
          type="password"
          placeholder="Senha atual"
          class="w-full border p-3 rounded"
        />

        <input
          v-model="senhaNova"
          type="password"
          placeholder="Nova senha"
          class="w-full border p-3 rounded"
        />

        <input
          v-model="confirmarSenha"
          type="password"
          placeholder="Confirmar nova senha"
          class="w-full border p-3 rounded"
        />

        <p v-if="erroLocal" class="text-red-500 text-sm">{{ erroLocal }}</p>
        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

        <button
          type="submit"
          class="w-full bg-brand-primary text-white py-3 rounded font-bold"
          :disabled="loading"
        >
          {{ loading ? 'Salvando...' : 'Salvar nova senha' }}
        </button>
      </form>
    </div>
  </div>
</template>


<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/useauth'

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
