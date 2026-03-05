<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-lg">
      <div v-if="erroFatal" class="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 p-6 text-center">
        <p class="font-semibold text-rose-700 dark:text-rose-300">{{ erroFatal }}</p>
        <p class="text-sm text-rose-600 dark:text-rose-400 mt-2">O link pode ter expirado (válido 24h). Peça um novo ao responsável.</p>
      </div>

      <div v-else class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
        <div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]"></div>
        <div class="p-6 sm:p-8 space-y-4">
          <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100">Enviar contrato assinado</h1>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            Envie o PDF do contrato já assinado (por exemplo, escaneado ou assinado digitalmente). O sistema irá salvar o arquivo e marcar o contrato como vigente.
          </p>

          <input
            ref="inputFile"
            type="file"
            accept=".pdf,application/pdf"
            class="hidden"
            @change="onFileChange"
          />

          <div class="flex flex-col gap-3">
            <button
              type="button"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-brand-primary hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
              @click="inputFile?.click?.()"
            >
              <i class="pi pi-upload"></i>
              {{ arquivo ? arquivo.name : 'Escolher arquivo PDF' }}
            </button>

            <button
              v-if="arquivo"
              type="button"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-primary text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              :disabled="enviando"
              @click="enviar"
            >
              <i v-if="enviando" class="pi pi-spin pi-spinner"></i>
              <i v-else class="pi pi-check"></i>
              {{ enviando ? 'Enviando...' : 'Enviar contrato assinado' }}
            </button>
          </div>

          <p v-if="sucesso" class="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Contrato recebido com sucesso. O documento foi salvo e o contrato está vigente.
          </p>
        </div>
      </div>
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
const inputFile = ref(null)
const arquivo = ref(null)
const enviando = ref(false)
const sucesso = ref(false)
const erroFatal = ref('')

function onFileChange(ev) {
  const f = ev.target?.files?.[0]
  if (f && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name))) {
    arquivo.value = f
  } else if (f) {
    arquivo.value = null
  }
  ev.target.value = ''
}

async function enviar() {
  if (!arquivo.value || enviando.value) return
  if (!token) {
    erroFatal.value = 'Link inválido.'
    return
  }
  enviando.value = true
  erroFatal.value = ''
  try {
    const form = new FormData()
    form.append('file', arquivo.value)
    await api.post(`/contratos-publico/${token}/incluir-assinado`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    sucesso.value = true
    arquivo.value = null
  } catch (e) {
    erroFatal.value = e?.response?.data?.message || 'Não foi possível enviar o contrato. Tente novamente.'
  } finally {
    enviando.value = false
  }
}

onMounted(() => {
  if (!token) erroFatal.value = 'Link inválido.'
})
</script>
