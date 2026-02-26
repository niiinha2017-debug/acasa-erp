<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-lg">
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
              Este contrato será assinado eletronicamente dentro do portal da A Casa Marcenaria, com registro de evidências técnicas (data/hora, IP e dispositivo), conforme MP nº 2.200-2/2001 e Lei nº 14.063/2020.
            </p>
            <p class="mt-3 text-sm text-slate-700 dark:text-slate-300">
              Leia os termos completos do contrato abaixo antes de finalizar o aceite.
            </p>
            <div class="mt-4 rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-800 p-3 text-sm text-sky-700 dark:text-sky-300">
              Assinatura eletrônica segura pelo portal. Este fluxo não utiliza assinatura oficial GOV.BR.
            </div>
            <div class="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Evidências registradas no aceite
              </p>
              <div class="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                <div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2">
                  <span class="block text-[11px] text-slate-500">Data e hora local</span>
                  <span class="font-semibold">{{ dataHoraLocal }}</span>
                </div>
                <div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2">
                  <span class="block text-[11px] text-slate-500">Fuso horário</span>
                  <span class="font-semibold">{{ fusoHorario }}</span>
                </div>
                <div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2">
                  <span class="block text-[11px] text-slate-500">Dispositivo</span>
                  <span class="font-semibold">{{ dispositivoResumo }}</span>
                </div>
              </div>
            </div>
            <div
              v-if="jaAssinado"
              class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-3 text-sm text-emerald-700 dark:text-emerald-300"
            >
              Este contrato já foi assinado. Você ainda pode visualizar e baixar o PDF.
            </div>
            <div
              v-if="info?.linkPdf"
              class="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900"
            >
              <iframe
                :src="info.linkPdf"
                class="w-full h-[60vh]"
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
              Visualizar / Baixar PDF do contrato
            </a>

            <form v-if="!jaAssinado" @submit.prevent="enviarAceite" class="mt-6 space-y-4">
              <div
                v-if="erroAcao"
                class="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 p-3 text-sm text-rose-700 dark:text-rose-300"
              >
                {{ erroAcao }}
              </div>
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
              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  v-model="confirmacaoIdentidade"
                  type="checkbox"
                  class="mt-1 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300">
                  Confirmo que sou o titular deste contrato e autorizo o registro das evidências técnicas deste aceite.
                </span>
              </label>
              <button
                type="submit"
                :disabled="!podeEnviar || enviando"
                class="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <span v-if="enviando">Registrando...</span>
                <span v-else>Assinar eletronicamente</span>
              </button>
            </form>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

definePage({ meta: { public: true } })

const route = useRoute()
const router = useRouter()
const token = route.params.token
const info = ref(null)
const erroFatal = ref('')
const erroAcao = ref('')
const aceite = ref(false)
const confirmacaoIdentidade = ref(false)
const enviando = ref(false)
const dataHoraLocal = new Date().toLocaleString('pt-BR')
const fusoHorario = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Não identificado'
const dispositivoResumo = (() => {
  const ua = navigator.userAgent || ''
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/windows/i.test(ua)) return 'Windows'
  if (/mac os x/i.test(ua)) return 'macOS'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Navegador web'
})()
const screenResumo = (() => {
  const w = Number(window?.screen?.width || 0)
  const h = Number(window?.screen?.height || 0)
  if (!w || !h) return ''
  return `${w}x${h}`
})()
const jaAssinado = computed(() => {
  const raw = info.value || {}
  return !!raw?.assinaturaClienteRegistrada || raw?.podeAssinar === false || !!raw?.dataAssinaturaCliente
})
const podeEnviar = computed(() => !!aceite.value && !!confirmacaoIdentidade.value)

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

async function enviarAceite() {
  erroAcao.value = ''
  if (jaAssinado.value) {
    erroAcao.value = 'Este contrato já foi assinado.'
    return
  }
  if (!podeEnviar.value || enviando.value) return
  enviando.value = true
  try {
    await api.post(`/contratos-publico/${token}/aceitar`, {
      timezone: fusoHorario,
      acceptanceLocalTime: dataHoraLocal,
      deviceLabel: dispositivoResumo,
      screen: screenResumo,
    })
    await router.replace('/aceitar/obrigado')
  } catch (e) {
    erroAcao.value = e?.response?.data?.message || 'Não foi possível registrar o aceite.'
  } finally {
    enviando.value = false
  }
}
</script>
