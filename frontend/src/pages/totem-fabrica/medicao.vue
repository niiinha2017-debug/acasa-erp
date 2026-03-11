<template>
  <div class="w-full min-h-full bg-slate-50 dark:bg-slate-900/50 font-sans antialiased text-slate-900 dark:text-slate-100">
    <div class="mx-auto max-w-2xl px-4 py-6 md:py-8">
      <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div class="h-1 w-full bg-emerald-600" aria-hidden />

        <div class="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
          <div class="min-w-0">
            <h1 class="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
              Medição Fina
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {{ tituloTarefa || 'Tarefa de medição' }}
            </p>
          </div>
          <router-link
            :to="{ path: '/totem-fabrica' }"
            class="shrink-0 min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition touch-manipulation flex items-center gap-2"
          >
            <i class="pi pi-arrow-left" />
            Voltar
          </router-link>
        </div>

        <div v-if="erroCarregamento" class="p-6 text-center">
          <p class="text-rose-600 dark:text-rose-400 font-medium">{{ erroCarregamento }}</p>
          <p class="text-sm text-slate-500 mt-2">Verifique o vínculo da tarefa com um projeto.</p>
          <router-link to="/totem-fabrica" class="inline-block mt-4 text-emerald-600 dark:text-emerald-400 font-medium">
            Voltar ao Totem
          </router-link>
        </div>

        <template v-else>
          <div v-if="loading" class="flex items-center justify-center py-16">
            <i class="pi pi-spin pi-spinner text-3xl text-emerald-600" />
          </div>

          <form v-else class="p-4 md:p-6 space-y-6" @submit.prevent="finalizar">
            <!-- Cards de Medidas: Largura e Pé-Direito (mm) - inputs grandes -->
            <section class="space-y-4">
              <h2 class="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Medidas principais
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Largura (mm)
                  </label>
                  <input
                    v-model.number="form.largura_mm"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Ex: 2400"
                    class="w-full text-2xl font-semibold rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    :class="{ 'border-rose-500 dark:border-rose-400': submitted && !medidasOk }"
                  />
                </div>
                <div class="rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Pé-Direito (mm)
                  </label>
                  <input
                    v-model.number="form.pe_direito_mm"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Ex: 2700"
                    class="w-full text-2xl font-semibold rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    :class="{ 'border-rose-500 dark:border-rose-400': submitted && !medidasOk }"
                  />
                </div>
              </div>
              <p v-if="submitted && !medidasOk" class="text-sm text-rose-600 dark:text-rose-400">
                Preencha Largura e Pé-Direito para finalizar a medição.
              </p>
            </section>

            <!-- Checklist de Conferência: Pontos de Água, Luz, Gás, Ar-condicionado -->
            <section class="space-y-3">
              <h2 class="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Checklist de conferência
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Marque os pontos existentes no local.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label class="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition">
                  <input
                    v-model="form.conferencia_agua"
                    type="checkbox"
                    class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                  />
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Pontos de Água</span>
                </label>
                <label class="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition">
                  <input
                    v-model="form.conferencia_luz"
                    type="checkbox"
                    class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                  />
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Luz</span>
                </label>
                <label class="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition">
                  <input
                    v-model="form.conferencia_gas"
                    type="checkbox"
                    class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                  />
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Gás</span>
                </label>
                <label class="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition">
                  <input
                    v-model="form.conferencia_ar_condicionado"
                    type="checkbox"
                    class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                  />
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Ar-condicionado</span>
                </label>
              </div>
            </section>

            <!-- Upload de Projeto: Promob e imagens da obra -->
            <section class="space-y-3">
              <h2 class="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Upload de projeto
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Arquivos do Promob (.gltf, .glb, .obj, .pdf, .csv) e imagens da obra.
              </p>
              <template v-if="medicaoId">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    class="flex flex-col items-center justify-center w-full min-h-[100px] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 cursor-pointer transition"
                    :class="{ 'pointer-events-none opacity-70': uploadProgress > 0 && uploadProgress < 100 }"
                  >
                    <input
                      type="file"
                      accept=".gltf,.glb,.obj,.pdf,.csv,image/*"
                      class="hidden"
                      @change="onFileSelect"
                    />
                    <i class="pi pi-upload text-2xl text-slate-400 mb-2" />
                    <span class="text-xs text-slate-600 dark:text-slate-400 text-center px-2">Promob / Imagens</span>
                  </label>
                </div>
                <div v-if="uploadProgress > 0 && uploadProgress < 100" class="mt-2">
                  <div class="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div class="h-full bg-emerald-500 transition-all duration-300" :style="{ width: `${uploadProgress}%` }" />
                  </div>
                  <p class="text-xs text-slate-500 mt-1">Enviando... {{ uploadProgress }}%</p>
                </div>
                <ul v-if="arquivosLista.length" class="mt-3 space-y-1.5">
                  <li
                    v-for="f in arquivosLista"
                    :key="f.id"
                    class="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-700/50"
                  >
                    <span class="truncate">{{ f.nome || f.filename || 'Arquivo' }}</span>
                    <button
                      type="button"
                      class="shrink-0 text-slate-400 hover:text-rose-500 p-1"
                      title="Remover"
                      @click="removerArquivo(f)"
                    >
                      <i class="pi pi-trash" />
                    </button>
                  </li>
                </ul>
              </template>
              <p v-else class="text-xs text-slate-500">Carregando... (os uploads estarão disponíveis em instantes)</p>
            </section>

            <!-- Botão Finalizar -->
            <section class="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="submit"
                class="w-full min-h-[56px] py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base flex items-center justify-center gap-2 transition touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="finalizando"
              >
                <i v-if="finalizando" class="pi pi-spin pi-spinner text-xl" />
                <i v-else class="pi pi-send" />
                {{ finalizando ? 'Enviando...' : 'Finalizar Medição e Enviar para Engenharia' }}
              </button>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                A tarefa será atualizada para <strong>Medido - Aguardando Técnico</strong> na Agenda e na Timeline.
              </p>
            </section>
          </form>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { MedicaoFinaService, ArquivosService } from '@/services'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'agendamentos.producao' } })

const route = useRoute()

const agendaId = computed(() => Number(String(route.query?.agendaId || '').replace(/\D/g, '')) || null)
const tipo = computed(() => (route.query?.tipo === 'agenda_loja' ? 'agenda_loja' : 'agenda_fabrica'))
const projetoId = computed(() => Number(String(route.query?.projetoId || '').replace(/\D/g, '')) || null)
const tituloTarefa = computed(() => route.query?.titulo || '')

const loading = ref(true)
const erroCarregamento = ref('')
const medicaoId = ref(null)
const ambientePadrao = ref('')
const finalizando = ref(false)
const submitted = ref(false)
const uploadProgress = ref(0)
const arquivosLista = ref([])

const form = ref({
  largura_mm: null,
  pe_direito_mm: null,
  conferencia_agua: false,
  conferencia_luz: false,
  conferencia_gas: false,
  conferencia_ar_condicionado: false,
})

const medidasOk = computed(() => {
  const l = form.value.largura_mm
  const p = form.value.pe_direito_mm
  return l != null && Number(l) >= 1 && p != null && Number(p) >= 1
})

async function carregar() {
  if (!agendaId.value) {
    erroCarregamento.value = 'Tarefa não informada.'
    loading.value = false
    return
  }
  if (!projetoId.value) {
    erroCarregamento.value = 'Esta tarefa não está vinculada a um projeto. Conclua pelo Totem ou vincule um projeto na Agenda.'
    loading.value = false
    return
  }
  loading.value = true
  erroCarregamento.value = ''
  try {
    const [ambientesRes, dadosRes] = await Promise.all([
      MedicaoFinaService.listarAmbientes(projetoId.value),
      MedicaoFinaService.getProjetoDados(projetoId.value),
    ])
    const ambientes = Array.isArray(ambientesRes?.data) ? ambientesRes.data : []
    ambientePadrao.value = ambientes[0] || 'Ambiente'
    const primeiroAmbiente = ambientePadrao.value
    const medicaoRes = await MedicaoFinaService.buscarPorProjetoAmbiente(projetoId.value, primeiroAmbiente)
    const medicao = medicaoRes?.data ?? medicaoRes
    medicaoId.value = medicao?.id ?? null
    if (medicao?.largura_cm != null) form.value.largura_mm = Math.round(Number(medicao.largura_cm) * 10)
    if (medicao?.altura_cm != null) form.value.pe_direito_mm = Math.round(Number(medicao.altura_cm) * 10)
    if (medicao?.conferencia_hidraulica_ok != null) form.value.conferencia_agua = !!medicao.conferencia_hidraulica_ok
    if (medicao?.conferencia_eletrica_ok != null) form.value.conferencia_luz = !!medicao.conferencia_eletrica_ok
    if (medicao?.conferencia_gas_ok != null) form.value.conferencia_gas = !!medicao.conferencia_gas_ok
    if (Array.isArray(medicao?.interferencias) && medicao.interferencias.includes('AR_CONDICIONADO')) {
      form.value.conferencia_ar_condicionado = true
    }
    await carregarArquivos()
  } catch (e) {
    console.error(e)
    erroCarregamento.value = e?.response?.data?.message || 'Não foi possível carregar a medição.'
  } finally {
    loading.value = false
  }
}

async function carregarArquivos() {
  if (!medicaoId.value) {
    arquivosLista.value = []
    return
  }
  try {
    const res = await ArquivosService.listar({
      ownerType: 'MEDICAO_FINA',
      ownerId: medicaoId.value,
    })
    const list = Array.isArray(res?.data) ? res.data : res?.data?.data ?? []
    arquivosLista.value = list || []
  } catch {
    arquivosLista.value = []
  }
}

async function onFileSelect(event) {
  const file = event.target?.files?.[0]
  if (!file || !medicaoId.value) return
  event.target.value = ''
  const ext = (file.name || '').toLowerCase()
  const categoria = /\.(gltf|glb|obj)$/.test(ext)
    ? 'MODELO_3D'
    : /\.(pdf|csv)$/.test(ext)
      ? 'LISTA_CORTE_PROMOB'
      : 'OBRA'
  uploadProgress.value = 10
  try {
    await ArquivosService.upload({
      ownerType: 'MEDICAO_FINA',
      ownerId: medicaoId.value,
      file,
      categoria,
      onUploadProgress: (ev) => {
        if (ev.total) uploadProgress.value = Math.round((ev.loaded / ev.total) * 100)
      },
    })
    await carregarArquivos()
  } catch (e) {
    notify.error('Falha ao enviar arquivo.')
    console.error(e)
  } finally {
    uploadProgress.value = 0
  }
}

async function removerArquivo(f) {
  if (!f?.id) return
  try {
    await ArquivosService.remover(f.id)
    await carregarArquivos()
  } catch (e) {
    notify.error('Falha ao remover arquivo.')
  }
}

async function finalizar() {
  submitted.value = true
  if (!medidasOk.value) return
  if (!agendaId.value || !projetoId.value) {
    notify.error('Dados da tarefa incompletos.')
    return
  }
  finalizando.value = true
  try {
    await MedicaoFinaService.finalizarTotem({
      agenda_id: agendaId.value,
      tipo: tipo.value,
      projeto_id: projetoId.value,
      nome_ambiente: ambientePadrao.value || undefined,
      largura_mm: Number(form.value.largura_mm),
      pe_direito_mm: Number(form.value.pe_direito_mm),
      conferencia_agua: form.value.conferencia_agua,
      conferencia_luz: form.value.conferencia_luz,
      conferencia_gas: form.value.conferencia_gas,
      conferencia_ar_condicionado: form.value.conferencia_ar_condicionado,
    })
    notify.success('Medição finalizada. Status atualizado para Medido - Aguardando Técnico.')
    await new Promise((r) => setTimeout(r, 800))
    window.location.href = '/totem-fabrica'
  } catch (e) {
    const msg = e?.response?.data?.message || e?.response?.data?.error || 'Não foi possível finalizar a medição.'
    notify.error(msg)
  } finally {
    finalizando.value = false
  }
}

onMounted(() => carregar())
</script>
