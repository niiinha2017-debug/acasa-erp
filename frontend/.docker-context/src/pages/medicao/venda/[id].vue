<template>
  <div class="w-full h-full flex flex-col lg:flex-row gap-4">
    <div class="flex-1 min-w-0">
      <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
        <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />
        <PageHeader
          :title="nomeCliente || 'Medição para orçamento'"
          :subtitle="breadcrumb"
          icon="pi pi-ruler"
          class="border-b border-border-ui"
        >
          <template #actions>
            <!-- Indicador de sincronização -->
            <span
              class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
              :class="{
                'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300': syncStatus === 'synced',
                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400': syncStatus === 'saving',
                'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400': syncStatus === 'error',
              }"
              :title="syncStatus === 'synced' ? 'Dados sincronizados' : syncStatus === 'saving' ? 'Salvando...' : 'Erro ao salvar'"
            >
              <i v-if="syncStatus === 'saving'" class="pi pi-spin pi-spinner" />
              <i v-else-if="syncStatus === 'synced'" class="pi pi-cloud" />
              <i v-else class="pi pi-cloud" />
              {{ syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'saving' ? 'Salvando...' : 'Erro' }}
            </span>
            <Button
              variant="ghost"
              size="sm"
              class="!rounded-xl text-text-soft hover:text-brand-primary"
              title="Abre em nova aba"
              @click="abrirOrcamentoTecnico"
            >
              <i class="pi pi-file-edit mr-2" />
              Gerar Orçamento Técnico
            </Button>
            <Button variant="ghost" size="sm" class="!rounded-xl" @click="router.push('/totem-fabrica')">
              <i class="pi pi-arrow-left mr-2" />
              Voltar
            </Button>
          </template>
        </PageHeader>

        <div class="p-4 md:p-6 border-t border-border-ui bg-bg-page">
          <Loading v-if="loading" />
          <template v-else-if="erroCarregamento">
            <div class="py-8 text-center">
              <p class="font-medium text-rose-500">{{ erroCarregamento }}</p>
              <router-link to="/totem-fabrica" class="inline-block mt-3 text-sm text-brand-primary font-medium">Voltar ao Totem</router-link>
            </div>
          </template>
          <template v-else-if="!tarefa">
            <div class="py-8 text-center text-text-soft">
              Tarefa não encontrada. <router-link to="/totem-fabrica" class="text-brand-primary ml-1">Voltar</router-link>
            </div>
          </template>
          <template v-else>
            <!-- 1) Seletor de Ambiente -->
            <div class="mb-6">
              <p class="text-xs font-semibold text-text-soft mb-2">Ambiente</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="opt in opcoesAmbiente"
                  :key="opt.value"
                  type="button"
                  class="px-4 py-2.5 rounded-xl text-sm font-medium transition border"
                  :class="ambienteSelecionado === opt.value ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-card border-border-ui text-text-main hover:border-slate-400'"
                  @click="selecionarAmbiente(opt.value)"
                >
                  {{ opt.label }}
                </button>
                <button
                  type="button"
                  class="px-4 py-2.5 rounded-xl text-sm font-medium border border-dashed border-amber-500/60 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  @click="ambienteSelecionado = 'OUTRO'"
                >
                  + Outro
                </button>
              </div>
              <input
                v-if="ambienteSelecionado === 'OUTRO'"
                v-model="nomeOutroAmbiente"
                type="text"
                class="mt-2 w-full max-w-xs rounded-xl border border-border-ui bg-bg-card px-3 py-2 text-sm text-text-main"
                placeholder="Nome do ambiente"
              />
            </div>

            <!-- 2) Se o ambiente ainda não foi salvo: botão para criar ambiente -->
            <div v-if="!ambienteIdAtual" class="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <p class="text-sm text-amber-800 dark:text-amber-200 mb-3">Salve o ambiente para adicionar paredes e medidas.</p>
              <Button type="button" variant="primary" class="!rounded-xl" :loading="salvandoAmbiente" @click="salvarAmbientePrimeiraVez">
                <i v-if="!salvandoAmbiente" class="pi pi-plus mr-2" />
                Criar ambiente {{ nomeAmbienteAtual() }}
              </Button>
            </div>

            <!-- 3) Se temos ambiente salvo: abas Paredes + ficha da parede -->
            <template v-else>
              <!-- Abas: Paredes (Parede Pia, Parede Geladeira...) -->
              <div class="mb-4">
                <p class="text-xs font-semibold text-text-soft mb-2">{{ nomeAmbienteAtual() }} — Paredes / Lados</p>
                <div class="flex flex-wrap gap-2 items-center">
                  <button
                    v-for="p in listaParedes"
                    :key="p.id || p._key"
                    type="button"
                    class="px-4 py-2.5 rounded-xl text-sm font-medium transition border"
                    :class="paredeSelecionadaId === (p.id || p._key) ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-card border-border-ui text-text-main hover:border-slate-400'"
                    @click="selecionarParede(p)"
                  >
                    {{ p.nome || 'Parede' }}
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2.5 rounded-xl text-sm font-medium border border-dashed border-slate-400 text-text-soft hover:bg-slate-100 dark:hover:bg-slate-800"
                    @click="adicionarParede"
                  >
                    + Nova parede
                  </button>
                </div>
              </div>
              <!-- Cards resumidos das paredes já salvas na lista -->
              <div v-if="listaParedes.length > 0" class="mb-6 flex flex-wrap gap-2">
                <div
                  v-for="p in listaParedes"
                  :key="(p.id || p._key) + '-card'"
                  class="rounded-xl border border-border-ui bg-bg-card px-3 py-2 text-sm text-text-main shadow-sm"
                >
                  <span class="font-medium">{{ p.nome || 'Parede' }}</span>
                  <span class="text-text-soft ml-1">— {{ resumoMedidasParede(p) }}</span>
                </div>
              </div>

              <!-- Ficha da parede selecionada: Auto-save no blur -->
              <div v-if="mostrarFormParede" class="space-y-6">
                <input
                  ref="inputNomeParedeRef"
                  v-model="nomeParedeNova"
                  type="text"
                  class="w-full max-w-md rounded-xl border border-border-ui bg-bg-card px-3 py-2 text-sm text-text-main"
                  placeholder="Nome da parede (ex: Parede Pia, Parede Geladeira)"
                  @blur="onBlurSalvar"
                />
                <div class="grid grid-cols-12 gap-4">
                  <Input v-model.number="larguraMm" type="number" inputmode="numeric" class="col-span-12 md:col-span-4" label="Largura (mm)" placeholder="Ex: 3200" @blur="onBlurSalvar" />
                  <Input v-model.number="alturaMm" type="number" inputmode="numeric" class="col-span-12 md:col-span-4" label="Altura / Pé-direito (mm)" placeholder="Ex: 2700" @blur="onBlurSalvar" />
                  <Input v-model.number="profundidadeMm" type="number" inputmode="numeric" class="col-span-12 md:col-span-4" label="Profundidade (mm)" placeholder="Ex: 450" @blur="onBlurSalvar" />
                  <div class="col-span-12">
                    <Input v-model="observacoes" type="text" label="Observações (esta parede)" placeholder="Texto livre..." class="w-full" @blur="onBlurSalvar" />
                  </div>
                </div>
                <div class="border-t border-border-ui pt-6">
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <h3 class="text-sm font-semibold text-text-main">Medidas adicionais</h3>
                    <Button type="button" variant="secondary" size="sm" class="!rounded-xl" @click="adicionarMedida">
                      <i class="pi pi-plus mr-2" />
                      Adicionar medida
                    </Button>
                  </div>
                  <div class="rounded-xl border border-border-ui overflow-hidden">
                    <table class="w-full text-sm text-left">
                      <thead class="bg-bg-card border-b border-border-ui">
                        <tr>
                          <th class="px-3 py-2.5 font-semibold text-text-main">Descrição</th>
                          <th class="px-3 py-2.5 font-semibold text-text-main w-28">Valor (mm)</th>
                          <th class="px-3 py-2.5 font-semibold text-text-main w-12 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody class="bg-bg-page divide-y divide-border-ui">
                        <tr v-for="(m, idx) in medidas" :key="m._key" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td class="px-3 py-2">
                            <input v-model="m.descricao" type="text" class="w-full rounded-lg border border-border-ui bg-bg-card px-2.5 py-1.5 text-text-main placeholder:text-text-soft" placeholder="Ex: Vão janela, Altura pia" @blur="onBlurSalvar" />
                          </td>
                          <td class="px-3 py-2">
                            <input v-model.number="m.valor_mm" type="number" inputmode="numeric" class="w-full rounded-lg border border-border-ui bg-bg-card px-2.5 py-1.5 text-text-main" placeholder="mm" @blur="onBlurSalvar" />
                          </td>
                          <td class="px-3 py-2 text-center">
                            <button type="button" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30" title="Remover" @click="removerMedida(idx)">
                              <i class="pi pi-trash text-sm" />
                            </button>
                          </td>
                        </tr>
                        <tr v-if="medidas.length === 0" class="text-text-soft">
                          <td colspan="3" class="px-3 py-4 text-center">Nenhuma medida. Clique em &quot;Adicionar medida&quot; para incluir.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div class="border-t border-border-ui pt-6">
                  <h3 class="text-sm font-semibold text-text-main mb-3">Foto desta parede</h3>
                  <input ref="inputFotoRef" type="file" accept="image/*" capture="environment" class="hidden" multiple @change="onFotoSelect" />
                  <Button type="button" variant="secondary" class="!rounded-xl" :disabled="uploadingFoto || !paredeIdAtual" @click="inputFotoRef?.click()">
                    <i v-if="uploadingFoto" class="pi pi-spin pi-spinner mr-2" />
                    <i v-else class="pi pi-camera mr-2" />
                    {{ uploadingFoto ? 'Enviando...' : 'Tirar foto desta parede' }}
                  </Button>
                  <p v-if="!paredeIdAtual && !paredeNova" class="mt-1 text-xs text-text-soft">Salve a parede antes de enviar fotos.</p>
                  <div v-if="fotos.length" class="mt-3 flex flex-wrap gap-2">
                    <div v-for="(f, i) in fotos" :key="f.id || i" class="relative w-16 h-16 rounded-lg overflow-hidden border border-border-ui bg-bg-card">
                      <img v-if="f.url" :src="f.url" alt="Foto" class="w-full h-full object-cover" />
                      <span v-else class="absolute inset-0 flex items-center justify-center text-text-soft text-xs">OK</span>
                      <button type="button" class="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center hover:bg-rose-500" @click="removerFoto(i)">
                        <i class="pi pi-times" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border-ui mt-6">
                <Button type="button" variant="primary" class="!rounded-xl font-medium w-full sm:w-auto" :disabled="enviando" @click="finalizarMedicao">
                  <i v-if="enviando" class="pi pi-spin pi-spinner mr-2" />
                  <i v-else class="pi pi-check-circle mr-2" />
                  Finalizar medição
                </Button>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>

    <!-- Resumo lateral -->
    <aside class="w-full lg:w-72 flex-shrink-0">
      <div class="rounded-2xl border border-border-ui bg-bg-card p-4 sticky top-4">
        <h3 class="text-sm font-bold text-text-main mb-3">Resumo</h3>
        <ul class="space-y-2 text-sm">
          <li v-for="item in resumoAmbientesComParedes" :key="item.ambiente + '-' + item.parede" class="flex items-center gap-2" :class="item.medido ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-soft'">
            <i :class="item.medido ? 'pi pi-check-circle' : 'pi pi-circle'" class="flex-shrink-0" />
            <span>{{ item.ambiente }} › {{ item.parede }}</span>
            <span class="text-xs">({{ item.medido ? 'Medido' : 'Pendente' }})</span>
          </li>
        </ul>
        <p v-if="resumoAmbientesComParedes.length === 0" class="text-xs text-text-soft">Crie um ambiente e adicione paredes.</p>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TotemFabricaService, ArquivosService } from '@/services'
import { notify } from '@/services/notify'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Loading from '@/components/common/Loading.vue'

definePage({ meta: { perm: 'agendamentos.producao' } })

const OPCOES_AMBIENTE = [
  { value: 'COZINHA', label: 'Cozinha' },
  { value: 'DORMITORIO', label: 'Dormitório' },
  { value: 'SALA', label: 'Sala' },
  { value: 'BANHEIRO', label: 'Banheiro' },
  { value: 'SUITE', label: 'Suíte' },
  { value: 'AREA_SERVICO', label: 'Área de Serviço' },
  { value: 'VARANDA', label: 'Varanda' },
  { value: 'ESCRITORIO', label: 'Escritório' },
  { value: 'OUTRO', label: 'Outro' },
]

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(String(route.params?.id || '').replace(/\D/g, '')) || null)

const loading = ref(true)
const erroCarregamento = ref('')
const tarefa = ref(null)
const medicao = ref(null)
const salvandoAmbiente = ref(false)
const salvandoParede = ref(false)
const syncStatus = ref('synced') // 'synced' | 'saving' | 'error'
const enviando = ref(false)
const uploadingFoto = ref(false)
const inputFotoRef = ref(null)
const inputNomeParedeRef = ref(null)
let blurSaveTimeout = null

const ambienteSelecionado = ref('COZINHA')
const nomeOutroAmbiente = ref('')
const paredeSelecionada = ref(null)
const paredeSelecionadaId = ref(null)
const paredeNova = ref(false)
const nomeParedeNova = ref('')
/** Array de paredes por ambiente (id do ambiente). Preenchido no carregar e ao salvar cada parede na lista. */
const paredesPorAmbiente = ref({})

const larguraMm = ref('')
const alturaMm = ref('')
const profundidadeMm = ref('')
const observacoes = ref('')
const medidas = ref([])
const fotos = ref([])

const opcoesAmbiente = computed(() => OPCOES_AMBIENTE)

const nomeCliente = computed(() => {
  const c = tarefa.value?.cliente
  if (!c) return ''
  return c.nome_completo || c.razao_social || 'Cliente'
})

function nomeAmbienteAtual() {
  if (ambienteSelecionado.value === 'OUTRO') return (nomeOutroAmbiente.value || '').trim() || 'Outro'
  const opt = OPCOES_AMBIENTE.find((o) => o.value === ambienteSelecionado.value)
  return opt ? opt.label : ambienteSelecionado.value
}

const ambientesSalvos = computed(() => medicao.value?.ambientes ?? [])

const ambienteIdAtual = computed(() => {
  const nome = nomeAmbienteAtual()
  const a = ambientesSalvos.value.find((x) => x.nome_ambiente === nome)
  return a?.id ?? null
})

const ambienteAtual = computed(() => ambientesSalvos.value.find((a) => a.id === ambienteIdAtual.value))

/** Lista de paredes do ambiente atual (array local; persistência só ao Finalizar). */
const listaParedes = computed(() => {
  const aid = ambienteIdAtual.value
  if (!aid) return []
  return paredesPorAmbiente.value[aid] ?? []
})

const mostrarFormParede = computed(() => ambienteIdAtual.value && (paredeSelecionadaId.value != null || paredeNova.value))

const paredeIdAtual = computed(() => {
  if (paredeNova.value) return null
  const p = paredeSelecionada.value
  return p?.id ?? null
})

const breadcrumb = computed(() => {
  const amb = nomeAmbienteAtual()
  if (!ambienteIdAtual.value) return `Ambiente: ${amb}`
  const p = paredeSelecionada.value
  const nomeP = paredeNova.value ? (nomeParedeNova.value || 'Nova parede') : (p?.nome || '')
  return nomeP ? `${amb} › ${nomeP}` : `Ambiente: ${amb}`
})

const resumoAmbientesComParedes = computed(() => {
  const out = []
  for (const a of ambientesSalvos.value) {
    const paredes = paredesPorAmbiente.value[a.id] ?? []
    if (paredes.length === 0) {
      out.push({ ambiente: a.nome_ambiente, parede: '—', medido: false })
    } else {
      for (const p of paredes) {
        const medido = p.largura_m != null || p.pe_direito_m != null || p.profundidade_m != null
        out.push({ ambiente: a.nome_ambiente, parede: p.nome || 'Parede', medido })
      }
    }
  }
  return out
})

function resumoMedidasParede(p) {
  const L = p.largura_m != null ? Math.round(Number(p.largura_m) * 1000) : null
  const A = p.pe_direito_m != null ? Math.round(Number(p.pe_direito_m) * 1000) : null
  const P = p.profundidade_m != null ? Math.round(Number(p.profundidade_m) * 1000) : null
  const parts = [L, A, P].filter((x) => x != null)
  return parts.length ? `${parts.join('×')} mm` : 'sem medidas'
}

function novaMedida() {
  return { _key: `m-${Date.now()}-${Math.random().toString(36).slice(2)}`, descricao: '', valor_mm: null }
}

function adicionarMedida() {
  medidas.value.push(novaMedida())
}

function removerMedida(idx) {
  medidas.value.splice(idx, 1)
}

async function selecionarAmbiente(value) {
  await salvarParedeNaApiAntesDeSair()
  ambienteSelecionado.value = value
  paredeSelecionada.value = null
  paredeSelecionadaId.value = null
  paredeNova.value = false
  limparFormParede()
}

/** Cria uma nova parede no banco com nome padrão e foca o campo nome. */
async function adicionarParede() {
  const ambienteId = ambienteIdAtual.value
  if (!ambienteId) return
  const num = (listaParedes.value.length || 0) + 1
  const nomePadrao = `Parede ${num}`
  salvandoParede.value = true
  syncStatus.value = 'saving'
  try {
    const res = await TotemFabricaService.salvarParedeMedicao(ambienteId, { nome: nomePadrao })
    const data = res?.data ?? res
    const id = data?.parede?.id
    const nome = data?.parede?.nome ?? nomePadrao
    if (!id) throw new Error('Resposta sem id da parede')
    const novaParede = { id, nome, largura_m: null, pe_direito_m: null, profundidade_m: null, observacoes: null, medidas_json: null }
    const list = [...(paredesPorAmbiente.value[ambienteId] ?? []), novaParede]
    paredesPorAmbiente.value = { ...paredesPorAmbiente.value, [ambienteId]: list }
    paredeSelecionada.value = novaParede
    paredeSelecionadaId.value = id
    paredeNova.value = false
    nomeParedeNova.value = nome
    limparFormParede()
    larguraMm.value = ''
    alturaMm.value = ''
    profundidadeMm.value = ''
    observacoes.value = ''
    medidas.value = []
    fotos.value = []
    syncStatus.value = 'synced'
    await nextTick()
    inputNomeParedeRef.value?.focus()
  } catch (e) {
    syncStatus.value = 'error'
    notify.error(e?.response?.data?.message || 'Não foi possível criar a parede.')
  } finally {
    salvandoParede.value = false
  }
}

function formParedeTemDados() {
  const nome = (nomeParedeNova.value || '').trim() || (paredeSelecionada.value?.nome || '').trim()
  if (nome) return true
  if (larguraMm.value !== '' && larguraMm.value != null) return true
  if (alturaMm.value !== '' && alturaMm.value != null) return true
  if (profundidadeMm.value !== '' && profundidadeMm.value != null) return true
  if ((observacoes.value || '').trim()) return true
  if (medidas.value.some((m) => (m.descricao || '').trim() || (m.valor_mm != null && m.valor_mm !== ''))) return true
  return false
}

async function selecionarParede(p) {
  await salvarParedeNaApiAntesDeSair()
  paredeSelecionada.value = p
  paredeSelecionadaId.value = p.id ?? p._key
  paredeNova.value = !p.id
  nomeParedeNova.value = p.nome || ''
  preencherFormParede(p)
  if (p.id) carregarFotosParede(p.id)
  else fotos.value = []
}

function limparFormParede() {
  larguraMm.value = ''
  alturaMm.value = ''
  profundidadeMm.value = ''
  observacoes.value = ''
  medidas.value = []
  fotos.value = []
}

function preencherFormParede(p) {
  if (!p) {
    limparFormParede()
    return
  }
  larguraMm.value = p.largura_m != null ? Number(p.largura_m) * 1000 : ''
  alturaMm.value = p.pe_direito_m != null ? Number(p.pe_direito_m) * 1000 : ''
  profundidadeMm.value = p.profundidade_m != null ? Number(p.profundidade_m) * 1000 : ''
  observacoes.value = p.observacoes ?? ''
  try {
    medidas.value = (p.medidas_json ? JSON.parse(p.medidas_json) : []).map((m) => ({ ...m, _key: `m-${Date.now()}-${Math.random().toString(36).slice(2)}` }))
  } catch {
    medidas.value = []
  }
}

async function carregar() {
  if (!id.value) {
    erroCarregamento.value = 'ID da tarefa não informado.'
    loading.value = false
    return
  }
  loading.value = true
  erroCarregamento.value = ''
  try {
    const [tarefaRes, medicaoRes] = await Promise.all([
      TotemFabricaService.getTarefa(id.value, 'agenda_loja'),
      TotemFabricaService.getMedicaoOrcamento(id.value).catch(() => ({ data: null })),
    ])
    tarefa.value = tarefaRes.data
    medicao.value = medicaoRes?.data ?? null
    const next = { ...paredesPorAmbiente.value }
    for (const a of medicao.value?.ambientes ?? []) {
      if (next[a.id] === undefined) next[a.id] = [...(a.paredes || [])]
    }
    paredesPorAmbiente.value = next
    if (ambienteIdAtual.value && paredeSelecionadaId.value) {
      const p = listaParedes.value.find((x) => (x.id || x._key) === paredeSelecionadaId.value)
      if (p) preencherFormParede(p)
      if (paredeIdAtual.value) carregarFotosParede(paredeIdAtual.value)
    }
  } catch (e) {
    erroCarregamento.value = e?.response?.data?.message || 'Não foi possível carregar a tarefa.'
    tarefa.value = null
    medicao.value = null
  } finally {
    loading.value = false
  }
}

async function carregarFotosParede(paredeId) {
  if (!paredeId) {
    fotos.value = []
    return
  }
  try {
    const res = await ArquivosService.listar({ ownerType: 'MEDICAO_ORCAMENTO_PAREDE', ownerId: paredeId })
    const raw = res?.data ?? res
    const list = Array.isArray(raw) ? raw : (raw?.data ?? [])
    fotos.value = list.map((f) => ({ id: f.id, url: f.url || null }))
  } catch {
    fotos.value = []
  }
}

async function onFotoSelect(ev) {
  const files = ev.target?.files
  if (!files?.length || !paredeIdAtual.value) return
  ev.target.value = ''
  for (const file of files) {
    uploadingFoto.value = true
    try {
      await ArquivosService.upload({
        ownerType: 'MEDICAO_ORCAMENTO_PAREDE',
        ownerId: paredeIdAtual.value,
        file,
      })
      await carregarFotosParede(paredeIdAtual.value)
    } catch (e) {
      notify.error(e?.response?.data?.message || 'Erro ao enviar foto.')
    } finally {
      uploadingFoto.value = false
    }
  }
}

async function removerFoto(idx) {
  const f = fotos.value[idx]
  if (!f?.id) {
    fotos.value.splice(idx, 1)
    return
  }
  try {
    await ArquivosService.remover(f.id)
    await carregarFotosParede(paredeIdAtual.value)
  } catch {
    notify.error('Não foi possível remover a foto.')
  }
}

async function salvarAmbientePrimeiraVez() {
  if (!id.value) return
  const nome = nomeAmbienteAtual()
  if (!nome) {
    notify.warning('Informe o nome do ambiente.')
    return
  }
  salvandoAmbiente.value = true
  try {
    await TotemFabricaService.salvarAmbienteMedicao(id.value, { nome_ambiente: nome })
    notify.success(`Ambiente "${nome}" criado. Adicione paredes e medidas.`)
    await carregar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível criar o ambiente.')
  } finally {
    salvandoAmbiente.value = false
  }
}

function buildWallFromForm() {
  // Sempre usar o nome digitado no campo (nomeParedeNova); fallback para o nome da parede selecionada
  const nome = (nomeParedeNova.value || '').trim() || (paredeSelecionada.value?.nome || '').trim() || 'Parede'
  const larguraM = larguraMm.value !== '' && Number(larguraMm.value) >= 0 ? Number(larguraMm.value) / 1000 : null
  const alturaM = alturaMm.value !== '' && Number(alturaMm.value) >= 0 ? Number(alturaMm.value) / 1000 : null
  const profundidadeM = profundidadeMm.value !== '' && Number(profundidadeMm.value) >= 0 ? Number(profundidadeMm.value) / 1000 : null
  const medidasPayload = medidas.value
    .filter((m) => (m.descricao || '').trim() || (m.valor_mm != null && m.valor_mm !== ''))
    .map((m) => ({ descricao: (m.descricao || '').trim() || 'Medida', valor_mm: Number(m.valor_mm) || 0 }))
  return {
    nome: nome || 'Parede',
    largura_m: larguraM,
    pe_direito_m: alturaM,
    profundidade_m: profundidadeM,
    observacoes: (observacoes.value || '').trim() || null,
    medidas: medidasPayload.length ? medidasPayload : undefined,
    parede_id: paredeIdAtual.value || undefined,
  }
}

/** Salva a parede atual no backend (auto-save). */
async function salvarParedeNaApi() {
  const ambienteId = ambienteIdAtual.value
  if (!ambienteId) return
  const body = buildWallFromForm()
  syncStatus.value = 'saving'
  try {
    const res = await TotemFabricaService.salvarParedeMedicao(ambienteId, body)
    const data = res?.data ?? res
    const id = data?.parede?.id
    const nome = data?.parede?.nome
    if (id && paredeSelecionada.value) {
      const list = [...(paredesPorAmbiente.value[ambienteId] ?? [])]
      const idx = list.findIndex((p) => p.id === id || p.id === paredeSelecionada.value?.id)
      if (idx >= 0) {
        const nomeAtualizado = nome ?? body.nome ?? list[idx].nome
        list[idx] = { ...list[idx], nome: nomeAtualizado, largura_m: body.largura_m, pe_direito_m: body.pe_direito_m, profundidade_m: body.profundidade_m, observacoes: body.observacoes, medidas_json: body.medidas ? JSON.stringify(body.medidas) : null }
        paredesPorAmbiente.value = { ...paredesPorAmbiente.value, [ambienteId]: list }
      }
    }
    syncStatus.value = 'synced'
  } catch (e) {
    syncStatus.value = 'error'
    notify.error(e?.response?.data?.message || 'Erro ao salvar. Tente novamente.')
  }
}

function onBlurSalvar() {
  if (blurSaveTimeout) clearTimeout(blurSaveTimeout)
  blurSaveTimeout = setTimeout(() => {
    if (ambienteIdAtual.value && (paredeIdAtual.value || (paredeSelecionada.value && paredeSelecionada.value.id))) {
      salvarParedeNaApi()
    } else if (ambienteIdAtual.value && paredeNova.value && (nomeParedeNova.value || larguraMm.value || alturaMm.value || profundidadeMm.value)) {
      salvarParedeNaApi()
    }
    blurSaveTimeout = null
  }, 400)
}

/** Salva imediatamente antes de trocar de aba/ambiente (sem debounce). */
async function salvarParedeNaApiAntesDeSair() {
  if (blurSaveTimeout) {
    clearTimeout(blurSaveTimeout)
    blurSaveTimeout = null
  }
  const ambienteId = ambienteIdAtual.value
  if (!ambienteId) return
  if (!paredeSelecionadaId.value && !paredeSelecionada.value?.id && paredeNova.value && !nomeParedeNova.value && !larguraMm.value && !alturaMm.value) return
  await salvarParedeNaApi()
}

/** Salva a parede atual no array local (listaParedes). Não chama API. */
function salvarParedeNaLista() {
  const ambienteId = ambienteIdAtual.value
  if (!ambienteId) return
  const nome = paredeNova.value ? (nomeParedeNova.value || '').trim() || 'Parede' : (paredeSelecionada.value?.nome || 'Parede')
  if (!nome) {
    notify.warning('Informe o nome da parede.')
    return
  }
  const wall = buildWallFromForm()
  const list = [...(paredesPorAmbiente.value[ambienteId] ?? [])]
  const idx = list.findIndex((p) => (p.id != null && p.id === paredeSelecionadaId.value) || (p._key != null && p._key === paredeSelecionadaId.value))
  if (idx >= 0) {
    list[idx] = { ...list[idx], nome: wall.nome, largura_m: wall.largura_m, pe_direito_m: wall.pe_direito_m, profundidade_m: wall.profundidade_m, observacoes: wall.observacoes, medidas_json: wall.medidas ? JSON.stringify(wall.medidas) : null }
  } else {
    list.push({ ...wall, id: undefined, _key: `local-${Date.now()}`, nome: wall.nome, largura_m: wall.largura_m, pe_direito_m: wall.pe_direito_m, profundidade_m: wall.profundidade_m, observacoes: wall.observacoes, medidas_json: wall.medidas ? JSON.stringify(wall.medidas) : null })
  }
  paredesPorAmbiente.value = { ...paredesPorAmbiente.value, [ambienteId]: list }
}

async function salvarParede() {
  const ambienteId = ambienteIdAtual.value
  if (!ambienteId) return
  const nome = paredeNova.value ? (nomeParedeNova.value || '').trim() : (paredeSelecionada.value?.nome || '')
  if (!nome) {
    notify.warning('Informe o nome da parede.')
    return
  }
  salvandoParede.value = true
  try {
    salvarParedeNaLista()
    notify.success(`Parede "${nome}" adicionada à lista.`)
    paredeSelecionada.value = null
    paredeSelecionadaId.value = null
    paredeNova.value = true
    nomeParedeNova.value = ''
    limparFormParede()
  } finally {
    salvandoParede.value = false
  }
}

async function finalizarMedicao() {
  if (!id.value) return
  enviando.value = true
  try {
    const ambientesPayload = (medicao.value?.ambientes ?? []).map((a) => {
      const paredes = (paredesPorAmbiente.value[a.id] ?? []).map((p) => ({
        nome: p.nome || 'Parede',
        largura_m: p.largura_m != null ? Number(p.largura_m) : undefined,
        pe_direito_m: p.pe_direito_m != null ? Number(p.pe_direito_m) : undefined,
        profundidade_m: p.profundidade_m != null ? Number(p.profundidade_m) : undefined,
        observacoes: p.observacoes || undefined,
        medidas: p.medidas_json ? JSON.parse(p.medidas_json) : undefined,
      }))
      return {
        nome_ambiente: a.nome_ambiente,
        paredes,
      }
    })
    await TotemFabricaService.concluirMedicaoOrcamento(id.value, { ambientes: ambientesPayload })
    notify.success('Medição finalizada. Voltando ao Totem.')
    router.push('/totem-fabrica')
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível finalizar.')
  } finally {
    enviando.value = false
  }
}

function abrirOrcamentoTecnico() {
  if (!id.value) return
  const path = `/orcamento-tecnico/novo/${id.value}`
  window.open(path, '_blank', 'noopener,noreferrer')
}

watch(ambienteSelecionado, () => {
  paredeSelecionadaId.value = null
  paredeNova.value = false
})

onMounted(() => {
  carregar()
})
</script>
