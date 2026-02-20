<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-lg">
      <div v-if="erro" class="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 p-6 text-center">
        <p class="font-semibold text-rose-700 dark:text-rose-300">{{ erro }}</p>
        <p class="text-sm text-rose-600 dark:text-rose-400 mt-2">O link pode ter expirado (válido 24h). Peça um novo ao responsável.</p>
      </div>

      <template v-else>
        <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
          <div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]"></div>
          <div class="p-6 sm:p-8">
            <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100">Contrato {{ info?.numero }}</h1>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Olá, {{ info?.nomeCliente }}.</p>
            <p class="mt-4 text-sm text-slate-700 dark:text-slate-300">
              As partes declaram-se cientes e concordam que este contrato será assinado por meio eletrônico, reconhecendo como válida a assinatura realizada através do sistema interno da A Casa Marcenaria, com base na Medida Provisória nº 2.200-2/2001 e na Lei nº 14.063/2020.
            </p>
            <a
              v-if="info?.linkPdf"
              :href="info.linkPdf"
              target="_blank"
              rel="noopener"
              class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"
            >
              <i class="pi pi-file-pdf"></i>
              Visualizar / Baixar PDF do contrato
            </a>

            <form @submit.prevent="enviarAceite" class="mt-6 space-y-4">
              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  v-model="aceite"
                  type="checkbox"
                  class="mt-1 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300">
                  Eu li e aceito todos os termos e o memorial descritivo deste contrato.
                </span>
              </label>
              <button
                type="submit"
                :disabled="!aceite || enviando"
                class="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <span v-if="enviando">Registrando...</span>
                <span v-else>Finalizar e Assinar Contrato</span>
              </button>
            </form>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

definePage({ meta: { public: true } })

const route = useRoute()
const router = useRouter()
const token = route.params.token
const info = ref(null)
const erro = ref('')
const aceite = ref(false)
const enviando = ref(false)

onMounted(async () => {
  if (!token) {
    erro.value = 'Link inválido.'
    return
  }
  try {
    const { data } = await api.get(`/contratos-publico/${token}/info`)
    info.value = data
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Link inválido ou expirado.'
  }
})

async function enviarAceite() {
  if (!aceite.value || enviando.value) return
  enviando.value = true
  try {
    await api.post(`/contratos-publico/${token}/aceitar`)
    await router.replace('/aceitar/obrigado')
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Não foi possível registrar o aceite.'
  } finally {
    enviando.value = false
  }
}
</script>
