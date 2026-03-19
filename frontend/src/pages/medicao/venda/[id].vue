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
            <Button variant="ghost" size="sm" class="!rounded-xl" @click="router.push(rotaVoltar)">
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
              </div>
            </div>

            <!-- 2) Sem ambiente disponível: orientar ajuste no pré-medição -->
            <div v-if="!ambienteIdAtual" class="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <p class="text-sm text-amber-800 dark:text-amber-200">Nenhum ambiente disponível na medição. Crie os ambientes no pré-medição para continuar.</p>
            </div>

            <!-- 3) Se temos ambiente salvo: abas Paredes + ficha da parede -->
            <template v-else>
              <!-- Abas: Paredes (Parede Pia, Parede Geladeira...) -->
              <div class="mb-4">
                <p class="mb-2 text-xs font-semibold text-text-soft">{{ nomeAmbienteAtual() }} — Paredes / Lados</p>
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
                </div>
                <div class="border-t border-border-ui pt-6">
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <h3 class="text-sm font-semibold text-text-main">Medidas do ambiente</h3>
                    <Button type="button" variant="secondary" size="sm" class="!rounded-xl" @click="adicionarMedida">
                      <i class="pi pi-plus mr-2" />
                      Adicionar medida
                    </Button>
                  </div>
                  <div class="space-y-3">
                    <div
                      v-for="(m, idx) in medidas"
                      :key="m._key"
                        class="relative rounded-xl border border-border-ui bg-bg-card p-3 md:p-4"
                    >
                        <button
                          type="button"
                          class="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:text-red-600 active:text-red-600"
                          title="Excluir medida"
                          @click="removerMedida(idx)"
                        >
                          <i class="pi pi-trash text-sm" />
                        </button>
                        <div class="pr-10">
                          <div class="flex-1">
                          <label class="block text-xs font-semibold text-text-soft mb-1">Nome</label>
                          <input
                            v-model="m.nome"
                            type="text"
                            class="w-full rounded-lg border border-border-ui bg-bg-card px-2.5 py-1.5 text-text-main placeholder:text-text-soft"
                            placeholder="Ex: Pia, Fogão, Janela"
                            @blur="onBlurSalvar"
                          />
                        </div>
                      </div>
                      <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label class="block text-xs font-semibold text-text-soft mb-1">Largura (mm)</label>
                          <input
                            v-model.number="m.largura_mm"
                            type="number"
                            inputmode="numeric"
                            class="w-full rounded-lg border border-border-ui bg-bg-card px-2.5 py-1.5 text-text-main"
                            placeholder="Ex: 1200"
                            @blur="onBlurSalvar"
                          />
                        </div>
                        <div>
                          <label class="block text-xs font-semibold text-text-soft mb-1">Altura (mm)</label>
                          <input
                            v-model.number="m.altura_mm"
                            type="number"
                            inputmode="numeric"
                            class="w-full rounded-lg border border-border-ui bg-bg-card px-2.5 py-1.5 text-text-main"
                            placeholder="Ex: 900"
                            @blur="onBlurSalvar"
                          />
                        </div>
                        <div>
                          <label class="block text-xs font-semibold text-text-soft mb-1">Profundidade (mm)</label>
                          <input
                            v-model.number="m.profundidade_mm"
                            type="number"
                            inputmode="numeric"
                            class="w-full rounded-lg border border-border-ui bg-bg-card px-2.5 py-1.5 text-text-main"
                            placeholder="Ex: 600"
                            @blur="onBlurSalvar"
                          />
                        </div>
                      </div>
                    </div>
                    <div v-if="medidas.length === 0" class="rounded-xl border border-dashed border-border-ui px-3 py-4 text-center text-sm text-text-soft bg-bg-page">
                      Nenhuma medida. Clique em &quot;Adicionar medida&quot; para incluir.
                    </div>
                  </div>
                  <div class="mt-4">
                    <Input v-model="observacoes" type="text" label="Observações gerais do ambiente" placeholder="Texto livre..." class="w-full" @blur="onBlurSalvar" />
                  </div>
                </div>
                <div class="border-t border-border-ui pt-6">
                  <div class="mb-3 flex items-center gap-2">
                    <h3 class="text-sm font-semibold text-text-main">Foto desta parede</h3>
                    <span class="text-xs text-text-soft">(opcional)</span>
                  </div>
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
                <Button
                  v-if="podeGerarOrcamento"
                  type="button"
                  variant="secondary"
                  class="!rounded-xl font-medium w-full sm:w-auto"
                  :loading="gerandoOrcamento"
                  @click="gerarOrcamentoTecnico"
                >
                  <i v-if="!gerandoOrcamento" class="pi pi-file-edit mr-2" />
                  Gerar Orçamento Técnico
                </Button>
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
        <div v-if="resumoAmbientes.length > 0" class="space-y-2 text-sm">
          <div
            v-for="amb in resumoAmbientes"
            :key="amb.id"
            class="rounded-xl border border-border-ui bg-bg-page overflow-hidden"
          >
            <div class="relative flex items-center gap-2 px-3 pr-24 min-h-[44px]">
              <button
                type="button"
                class="flex min-h-[44px] flex-1 items-center gap-2 text-left"
                @click="toggleResumoAmbiente(amb.id)"
              >
                <i
                  class="pi text-xs text-text-soft transition-transform"
                  :class="ambienteResumoExpandidoId === amb.id ? 'pi-chevron-down' : 'pi-chevron-right'"
                />
                <span class="flex-1 font-medium text-text-main">{{ amb.nome_ambiente }}</span>
              </button>
              <span class="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 text-[11px] font-medium text-text-soft">
                {{ amb.paredes.length }}
              </span>
            </div>
            <div v-if="ambienteResumoExpandidoId === amb.id" class="border-t border-border-ui bg-bg-card px-2 pb-2 pt-1">
              <div
                v-for="parede in amb.paredes"
                :key="parede.id || parede._key"
                class="ml-5 flex w-auto items-center gap-2 rounded-lg border-l-2 border-slate-200 bg-transparent pl-3 pr-1 min-h-[44px] text-left"
              >
                <i
                  :class="parede.medido ? 'pi pi-check-circle text-emerald-600 dark:text-emerald-400' : 'pi pi-circle text-text-soft'"
                  class="flex-shrink-0"
                />
                <button
                  type="button"
                  class="flex min-h-[44px] flex-1 items-center rounded-md px-2 text-left text-sm transition"
                  :class="(ambienteIdAtual === amb.id && paredeSelecionadaId === (parede.id || parede._key))
                    ? 'bg-brand-primary/15 text-brand-primary font-semibold'
                    : 'text-text-main hover:bg-slate-100/70 dark:hover:bg-slate-800/60'"
                  @click="selecionarParedeDoResumo(amb, parede)"
                >
                  {{ parede.nome || 'Parede' }}
                </button>
                <button
                  type="button"
                  class="inline-flex h-11 w-11 items-center justify-center text-rose-500 transition hover:text-red-600 active:text-red-600"
                  title="Excluir parede"
                  @click.stop="excluirParede(amb, parede)"
                >
                  <i class="pi pi-trash" />
                </button>
              </div>
              <div v-if="amb.paredes.length === 0" class="ml-5 flex min-h-[44px] items-center pl-3 text-xs text-text-soft">
                Nenhuma parede neste ambiente.
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-xs text-text-soft">Nenhum ambiente carregado do pré-medição.</p>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TotemFabricaService, ArquivosService, OrcamentoTecnicoService, FuncionariosService } from '@/services'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Loading from '@/components/common/Loading.vue'
import storage from '@/utils/storage'

definePage({ meta: { perm: 'agendamentos.producao' } })

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(String(route.params?.id || '').replace(/\D/g, '')) || null)

const loading = ref(true)
const erroCarregamento = ref('')
const tarefa = ref(null)
const medicao = ref(null)
const salvandoParede = ref(false)
const syncStatus = ref('synced') // 'synced' | 'saving' | 'error'
const enviando = ref(false)
const gerandoOrcamento = ref(false)
const uploadingFoto = ref(false)
const inputFotoRef = ref(null)
const inputNomeParedeRef = ref(null)
let blurSaveTimeout = null

const ambienteSelecionado = ref('')
const paredeSelecionada = ref(null)
const paredeSelecionadaId = ref(null)
const paredeNova = ref(false)
const nomeParedeNova = ref('')
const ambienteResumoExpandidoId = ref(null)
/** Array de paredes por ambiente (id do ambiente). Preenchido no carregar e ao salvar cada parede na lista. */
const paredesPorAmbiente = ref({})

const larguraMm = ref('')
const alturaMm = ref('')
const profundidadeMm = ref('')
const observacoes = ref('')
const medidas = ref([])
const fotos = ref([])
const usuarioLogado = ref(storage.getUser())
const unidadeUsuario = ref('')

const opcoesAmbiente = computed(() => {
  return ambientesSalvos.value.map((amb) => ({
    value: String(amb.id),
    label: amb.nome_ambiente,
  }))
})

const nomeCliente = computed(() => {
  const c = tarefa.value?.cliente
  if (!c) return ''
  return c.nome_completo || c.razao_social || 'Cliente'
})

function normalizarNomeAmbiente(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function nomeAmbienteAtual() {
  const opt = opcoesAmbiente.value.find((o) => o.value === String(ambienteSelecionado.value || ''))
  return opt ? opt.label : ambienteSelecionado.value
}

function aplicarSelecaoAmbientePorNome(nome) {
  const nomeRef = normalizarNomeAmbiente(nome)
  const amb = ambientesSalvos.value.find((item) => normalizarNomeAmbiente(item.nome_ambiente) === nomeRef)
  if (amb?.id) {
    ambienteSelecionado.value = String(amb.id)
    return
  }
  ambienteSelecionado.value = ambientesSalvos.value[0]?.id ? String(ambientesSalvos.value[0].id) : ''
}

const ambientesSalvos = computed(() => medicao.value?.ambientes ?? [])

const ambienteIdAtual = computed(() => {
  const idAmbiente = Number(ambienteSelecionado.value || 0)
  return idAmbiente > 0 ? idAmbiente : null
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

const isAdmin = computed(() => {
  const user = usuarioLogado.value
  return Boolean(user?.is_admin) || (Array.isArray(user?.permissoes) && user.permissoes.includes('ADMIN'))
})

const isFabrica = computed(() => {
  if (isAdmin.value) return false
  const unidade = String(unidadeUsuario.value || '').toUpperCase()
  if (unidade === 'FABRICA' || unidade === 'PRODUCAO') return true
  const perms = Array.isArray(usuarioLogado.value?.permissoes) ? usuarioLogado.value.permissoes : []
  return perms.includes('agendamentos.producao') && !perms.includes('agendamentos.vendas')
})

const podeVerAcoesComerciais = computed(() => !isFabrica.value)

function ambienteTemMedidas(ambiente) {
  const diretas = [ambiente?.largura_m, ambiente?.pe_direito_m, ambiente?.profundidade_m]
    .map((valor) => (valor == null ? null : Number(valor)))
    .some((valor) => valor != null && Number.isFinite(valor) && valor > 0)
  if (diretas) return true

  const paredes = Array.isArray(ambiente?.paredes) ? ambiente.paredes : []
  return paredes.some((parede) => {
    const medidasParede = [parede?.largura_m, parede?.pe_direito_m, parede?.profundidade_m]
      .map((valor) => (valor == null ? null : Number(valor)))
      .some((valor) => valor != null && Number.isFinite(valor) && valor > 0)
    if (medidasParede) return true
    if (!parede?.medidas_json) return false
    try {
      const parsed = JSON.parse(String(parede.medidas_json))
      return Array.isArray(parsed) && parsed.length > 0
    } catch {
      return false
    }
  })
}

const ambienteIdsProntosParaOrcamento = computed(() => {
  const ambientes = Array.isArray(medicao.value?.ambientes) ? medicao.value.ambientes : []
  return ambientes.filter((ambiente) => ambienteTemMedidas(ambiente)).map((ambiente) => Number(ambiente.id)).filter((id) => id > 0)
})

const podeGerarOrcamento = computed(() => {
  return podeVerAcoesComerciais.value && ambienteIdsProntosParaOrcamento.value.length > 0 && !gerandoOrcamento.value
})

const rotaVoltar = computed(() => (isFabrica.value ? '/totem-fabrica' : '/agendamentos/loja'))

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

const resumoAmbientes = computed(() => {
  return ambientesSalvos.value.map((amb) => {
    const paredes = (paredesPorAmbiente.value[amb.id] ?? []).map((parede) => ({
      ...parede,
      medido: parede.largura_m != null || parede.pe_direito_m != null || parede.profundidade_m != null,
    }))
    return {
      ...amb,
      paredes,
    }
  })
})

function resumoMedidasParede(p) {
  const L = p.largura_m != null ? Math.round(Number(p.largura_m) * 1000) : null
  const A = p.pe_direito_m != null ? Math.round(Number(p.pe_direito_m) * 1000) : null
  const P = p.profundidade_m != null ? Math.round(Number(p.profundidade_m) * 1000) : null
  const parts = [L, A, P].filter((x) => x != null)
  return parts.length ? `${parts.join('×')} mm` : 'sem medidas'
}

function novaMedida() {
  return {
    _key: `m-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    nome: '',
    largura_mm: null,
    altura_mm: null,
    profundidade_mm: null,
  }
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

async function selecionarAmbienteSalvo(ambiente) {
  await salvarParedeNaApiAntesDeSair()
  ambienteSelecionado.value = ambiente?.id ? String(ambiente.id) : ''
  ambienteResumoExpandidoId.value = ambiente?.id ?? null
  paredeSelecionada.value = null
  paredeSelecionadaId.value = null
  paredeNova.value = false
  limparFormParede()
}

function toggleResumoAmbiente(ambienteId) {
  ambienteResumoExpandidoId.value = ambienteResumoExpandidoId.value === ambienteId ? null : ambienteId
}

/** Cria uma nova parede no banco com nome padrão e foca o campo nome. */
async function adicionarParede() {
  const ambienteId = ambienteIdAtual.value
  if (!ambienteId) {
    notify.error('Selecione um ambiente criado no pré-medição para adicionar paredes.')
    return
  }
  const num = (listaParedes.value.length || 0) + 1
  const nomePadrao = `Parede ${num}`
  salvandoParede.value = true
  syncStatus.value = 'saving'
  try {
    const res = await TotemFabricaService.salvarParedeMedicao(ambienteId, {
      nome: nomePadrao,
      agenda_loja_id: id.value || undefined,
      nome_ambiente: nomeAmbienteAtual(),
    })
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
  if (medidas.value.some((m) => {
    const nomeMedida = (m.nome || '').trim()
    const largura = m.largura_mm != null && m.largura_mm !== ''
    const altura = m.altura_mm != null && m.altura_mm !== ''
    const profundidade = m.profundidade_mm != null && m.profundidade_mm !== ''
    return nomeMedida || largura || altura || profundidade
  })) return true
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
    const parsed = p.medidas_json ? JSON.parse(p.medidas_json) : []
    medidas.value = (Array.isArray(parsed) ? parsed : []).map((m) => ({
      _key: `m-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      // Compatibilidade com formato antigo: { descricao, valor_mm }
      nome: m?.nome ?? m?.descricao ?? '',
      largura_mm: m?.largura_mm ?? m?.valor_mm ?? null,
      altura_mm: m?.altura_mm ?? null,
      profundidade_mm: m?.profundidade_mm ?? null,
    }))
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

    const ambientes = Array.isArray(medicao.value?.ambientes) ? medicao.value.ambientes : []
    const ambienteSelecionadoExiste = ambientes.some((amb) => String(amb.id) === String(ambienteSelecionado.value || ''))
    if (ambientes.length > 0 && !ambienteSelecionadoExiste) {
      ambienteSelecionado.value = String(ambientes[0]?.id || '')
    }
    if (ambientes.length === 0) {
      ambienteSelecionado.value = ''
    }

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

async function carregarContextoUsuario() {
  const user = storage.getUser()
  usuarioLogado.value = user
  unidadeUsuario.value = ''
  if (user?.is_admin) return
  const funcionarioId = Number(user?.funcionario_id || 0)
  if (!funcionarioId) return
  try {
    const res = await FuncionariosService.buscarPorId(funcionarioId)
    const data = res?.data ?? res ?? null
    unidadeUsuario.value = String(data?.unidade || data?.setor || '').toUpperCase()
  } catch {
    unidadeUsuario.value = ''
  }
}

async function gerarOrcamentoTecnico() {
  if (!id.value || ambienteIdsProntosParaOrcamento.value.length === 0) {
    notify.error('Preencha ao menos uma medida antes de gerar o orçamento técnico.')
    return
  }
  gerandoOrcamento.value = true
  try {
    const res = await OrcamentoTecnicoService.criarNovo({
      agenda_loja_id: id.value,
      ambiente_ids: ambienteIdsProntosParaOrcamento.value,
    })
    const created = res?.data ?? res ?? null
    const orcamentoTecnicoId = Number(created?.id || 0)
    notify.success('Orçamento técnico gerado com sucesso.')
    if (orcamentoTecnicoId > 0) {
      router.push(`/orcamento-tecnico/${orcamentoTecnicoId}`)
      return
    }
    router.push('/orcamento-tecnico')
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível gerar o orçamento técnico.')
  } finally {
    gerandoOrcamento.value = false
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

async function excluirParede(ambiente, parede) {
  const ambienteId = ambiente?.id
  const paredeId = parede?.id
  if (!ambienteId || !paredeId) return
  const nome = parede?.nome || 'esta parede'
  const ok = await confirm.show('Excluir parede', `Deseja excluir ${nome}?`)
  if (!ok) return
  try {
    await TotemFabricaService.removerParedeMedicao(ambienteId, paredeId)
    const list = [...(paredesPorAmbiente.value[ambienteId] ?? [])].filter((p) => p.id !== paredeId)
    paredesPorAmbiente.value = { ...paredesPorAmbiente.value, [ambienteId]: list }
    if (paredeSelecionada.value?.id === paredeId) {
      paredeSelecionada.value = null
      paredeSelecionadaId.value = null
      paredeNova.value = false
      nomeParedeNova.value = ''
      limparFormParede()
    }
  } catch (e) {
    console.warn(e?.response?.data?.message || 'Não foi possível excluir a parede.')
  }
}

async function selecionarParedeDoResumo(ambiente, parede) {
  await selecionarAmbienteSalvo(ambiente)
  await selecionarParede(parede)
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

function buildWallFromForm() {
  // Sempre usar o nome digitado no campo (nomeParedeNova); fallback para o nome da parede selecionada
  const nome = (nomeParedeNova.value || '').trim() || (paredeSelecionada.value?.nome || '').trim() || 'Parede'
  const larguraM = larguraMm.value !== '' && Number(larguraMm.value) >= 0 ? Number(larguraMm.value) / 1000 : null
  const alturaM = alturaMm.value !== '' && Number(alturaMm.value) >= 0 ? Number(alturaMm.value) / 1000 : null
  const profundidadeM = profundidadeMm.value !== '' && Number(profundidadeMm.value) >= 0 ? Number(profundidadeMm.value) / 1000 : null
  const medidasPayload = medidas.value
    .filter((m) => {
      const nome = (m.nome || '').trim()
      const largura = m.largura_mm != null && m.largura_mm !== ''
      const altura = m.altura_mm != null && m.altura_mm !== ''
      const profundidade = m.profundidade_mm != null && m.profundidade_mm !== ''
      return nome || largura || altura || profundidade
    })
    .map((m) => ({
      nome: (m.nome || '').trim() || 'Medida',
      largura_mm: m.largura_mm != null && m.largura_mm !== '' ? Number(m.largura_mm) : null,
      altura_mm: m.altura_mm != null && m.altura_mm !== '' ? Number(m.altura_mm) : null,
      profundidade_mm: m.profundidade_mm != null && m.profundidade_mm !== '' ? Number(m.profundidade_mm) : null,
    }))
  return {
    nome: nome || 'Parede',
    agenda_loja_id: id.value || undefined,
    nome_ambiente: ambienteAtual.value?.nome_ambiente || nomeAmbienteAtual(),
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
    console.warn('Informe o nome da parede.')
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
    console.warn('Informe o nome da parede.')
    return
  }
  salvandoParede.value = true
  try {
    salvarParedeNaLista()
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

watch(ambienteSelecionado, () => {
  paredeSelecionadaId.value = null
  paredeNova.value = false
})

onMounted(() => {
  carregarContextoUsuario()
  carregar()
})
</script>
