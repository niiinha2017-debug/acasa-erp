<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-4xl">
      <div v-if="erroFatal" class="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 p-6 text-center">
        <p class="font-semibold text-rose-700 dark:text-rose-300">{{ erroFatal }}</p>
        <p class="text-sm text-rose-600 dark:text-rose-400 mt-2">O link pode ter expirado (válido 24h). Peça um novo ao responsável.</p>
      </div>

      <template v-else>
        <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
          <div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]"></div>
          <div class="p-6 sm:p-8">
            <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100">Contrato {{ info?.numero }}</h1>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Olá, {{ info?.nomeCliente }}.</p>
            <p class="mt-4 text-sm text-slate-700 dark:text-slate-300">
              Visualize e baixe o PDF do contrato abaixo. A assinatura será feita conforme combinado (impresso na loja ou por outro meio).
            </p>
            <div
              v-if="info?.linkPdf"
              class="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900"
            >
              <iframe
                :src="info.linkPdf"
                class="w-full h-[70vh]"
                title="Contrato em PDF"
              />
            </div>
            <div
              v-else
              class="mt-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-300"
            >
              Não foi possível carregar a visualização do PDF no momento.
            </div>
            <a
              v-if="info?.linkPdf"
              :href="info.linkPdf"
              target="_blank"
              rel="noopener"
              class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"
            >
              <i class="pi pi-file-pdf"></i>
              Abrir / Baixar PDF do contrato
            </a>
            <RouterLink
              v-if="token"
              :to="`/contrato/incluir/${token}`"
              class="mt-4 ml-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:underline"
            >
              <i class="pi pi-upload"></i>
              Já assinou? Enviar contrato assinado
            </RouterLink>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

definePage({ meta: { public: true } })

const route = useRoute()
const token = route.params.token
const info = ref(null)
const erroFatal = ref('')

onMounted(async () => {
  if (!token) {
    erroFatal.value = 'Link inválido.'
    return
  }
  try {
    const { data } = await api.get(`/contratos-publico/${token}/info`)
    info.value = data
  } catch (e) {
    erroFatal.value = e?.response?.data?.message || 'Link inválido ou expirado.'
  }
})
</script>
