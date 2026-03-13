<template>
  <div class="w-full h-full rounded-2xl border border-border-ui bg-bg-card overflow-hidden animate-page-in">
    <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>

    <PageHeader
      title="Estrategia de Precos"
      subtitle="Matriz Operacional de Insumos Base com processamento por abas"
      icon="pi pi-chart-line"
      :show-back="false"
      class="border-b border-border-ui"
    >
      <template #actions>
        <div class="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
          Estrategia ativa: <span class="text-brand-primary font-black">{{ strategyLabel(activeStrategy) }}</span>
        </div>
      </template>
    </PageHeader>

    <div class="p-4 md:p-6 space-y-6">
      <section>
        <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Regra do mes</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            v-for="item in strategies"
            :key="item.value"
            type="button"
            class="rounded-2xl border p-5 text-left transition-all min-h-[142px]"
            :class="[
              activeStrategy === item.value
                ? 'border-brand-primary bg-brand-primary/10 shadow-sm'
                : 'border-border-ui bg-bg-page hover:border-brand-primary/40 hover:bg-brand-primary/5',
              saving && pendingStrategy === item.value ? 'opacity-60' : ''
            ]"
            :disabled="saving"
            @click="selectStrategy(item.value)"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-[11px] font-black uppercase tracking-wider text-slate-500">{{ item.badge }}</p>
                <h4 class="text-lg font-black text-text-main mt-1">{{ item.title }}</h4>
              </div>
              <i
                :class="[
                  activeStrategy === item.value ? 'pi pi-check-circle text-brand-primary' : 'pi pi-circle text-slate-300',
                  'text-xl'
                ]"
              ></i>
            </div>
            <p class="text-sm text-text-muted mt-3 leading-relaxed">{{ item.description }}</p>
          </button>
        </div>
      </section>

      <section class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden">
        <!-- Header da Matriz -->
        <div class="px-4 md:px-5 py-3 border-b border-border-ui bg-slate-50/80 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-600">Matriz Operacional de Insumos Base</p>
            <p class="text-[11px] text-text-muted mt-0.5">
              O processamento soma Materiais + Insumos Fixos + Custos Internos para gerar Minimo, Medio e Maximo.
            </p>
          </div>
          <span v-if="matrizAtualizadoEm" class="text-[11px] text-text-muted whitespace-nowrap">
            Ultima atualizacao: <span class="font-semibold text-text-main">{{ formatDate(matrizAtualizadoEm) }}</span>
          </span>
        </div>

        <!-- Nav de abas principais -->
        <div class="px-4 md:px-5 py-4 border-b border-border-ui/60 bg-white">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              class="inline-flex items-center rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all"
              :class="activeTab === tab.id ? 'bg-brand-primary text-white shadow-sm' : 'border border-border-ui bg-bg-page text-slate-600 hover:border-brand-primary/30'"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="px-4 md:px-5 py-4 border-b border-border-ui/60 bg-white">
          <div v-if="activeTab === 'materiais'" class="space-y-4">
            <!-- Sub-abas Essencial / Design / Premium -->
            <div class="flex flex-wrap gap-2">
              <button
                v-for="cat in CATEGORIAS_ABA1"
                :key="cat.id"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all"
                :class="
                  activeSubTab === cat.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'border border-border-ui bg-bg-page text-slate-600 hover:border-slate-400/50'
                "
                @click="trocarSubTab(cat.id)"
              >
                <span
                  class="inline-block w-2 h-2 rounded-full"
                  :class="cat.id === 'essencial' ? 'bg-slate-400' : cat.id === 'design' ? 'bg-emerald-400' : 'bg-amber-400'"
                ></span>
                {{ cat.label }}
              </button>
            </div>

            <!-- Tabela de materiais da sub-aba ativa -->
            <div class="rounded-xl border border-border-ui overflow-hidden">
              <div class="px-3 py-2 bg-slate-50 border-b border-border-ui flex items-center justify-between">
                <span class="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Materiais MDF — {{ CATEGORIAS_ABA1.find((c) => c.id === activeSubTab)?.label }}
                </span>
                <span v-if="buscandoCategorias[activeSubTab]" class="text-[11px] text-slate-500 flex items-center gap-1">
                  <i class="pi pi-spin pi-spinner text-xs"></i> Carregando...
                </span>
                <span v-else class="text-[11px] text-text-muted">
                  {{ gruposMdfAtivo.length }} referencia(s)
                </span>
              </div>
              <div class="max-h-[300px] overflow-auto">
                <table class="w-full min-w-[620px]">
                  <thead>
                    <tr class="bg-white border-b border-border-ui text-left text-[11px] uppercase tracking-wider text-slate-500">
                      <th class="px-3 py-2">Selecionar</th>
                      <th class="px-3 py-2">Material</th>
                      <th class="px-3 py-2">Espessura</th>
                      <th class="px-3 py-2">% de Acrescimo (Fita/Desperdicio)</th>
                      <th class="px-3 py-2">Valor Ref. (x2)</th>
                      <th class="px-3 py-2 text-emerald-700">Custo Base / m2</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="buscandoCategorias[activeSubTab]">
                      <tr v-for="n in 4" :key="n" class="border-b border-border-ui/70 animate-pulse">
                        <td v-for="c in 6" :key="c" class="px-3 py-2">
                          <div class="h-3.5 rounded bg-slate-100 w-3/4"></div>
                        </td>
                      </tr>
                    </template>
                    <template v-else>
                      <tr
                        v-for="row in gruposMdfAtivo"
                        :key="row.key"
                        class="border-b border-border-ui/70 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                      >
                        <td class="px-3 py-2">
                          <input v-model="row.selected" type="checkbox" class="h-4 w-4 rounded border-border-ui" />
                        </td>
                        <td class="px-3 py-2 text-sm font-semibold text-text-main">{{ row.group }}</td>
                        <td class="px-3 py-2 text-sm text-text-main">{{ row.thickness }} mm</td>
                        <td class="px-3 py-2">
                          <input
                            v-model.number="row.acrescimo_pct"
                            type="number"
                            min="0"
                            step="0.01"
                            class="w-28 rounded-lg border border-border-ui bg-bg-page px-2 py-1.5 text-sm"
                          />
                        </td>
                        <td class="px-3 py-2 text-sm text-text-main tabular-nums">{{ formatCurrency(precoReferenciaComMargem(row)) }}</td>
                        <td class="px-3 py-2">
                          <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black bg-emerald-50 text-emerald-700 tabular-nums">
                            {{ formatCurrency(custoBaseCalculadoM2(row)) }}/m2
                          </span>
                        </td>
                      </tr>
                      <tr v-if="!gruposMdfAtivo.length">
                        <td colspan="6" class="px-3 py-8 text-center text-sm text-text-muted">
                          Nenhum material MDF encontrado para esta categoria.
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'insumos'" class="space-y-4">
            <div class="rounded-xl border border-border-ui overflow-hidden">
              <div class="px-3 py-2 bg-slate-50 border-b border-border-ui text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                Kit de montagem
              </div>
              <div class="max-h-[280px] overflow-auto">
                <table class="w-full min-w-[620px]">
                  <thead>
                    <tr class="bg-white border-b border-border-ui text-left text-[11px] uppercase tracking-wider text-slate-500">
                      <th class="px-3 py-2">Selecionar</th>
                      <th class="px-3 py-2">Item</th>
                      <th class="px-3 py-2">Etiqueta</th>
                      <th class="px-3 py-2">Valor (R$ / m2)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in kitItems" :key="item.id" class="border-b border-border-ui/70 last:border-b-0">
                      <td class="px-3 py-2">
                        <input v-model="item.selected" type="checkbox" class="h-4 w-4 rounded border-border-ui" />
                      </td>
                      <td class="px-3 py-2 text-sm text-text-main">{{ item.name }}</td>
                      <td class="px-3 py-2">
                        <span
                          class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide border"
                          :class="badgeTipoAplicacaoClass(item.tipo_aplicacao)"
                        >
                          {{ tipoAplicacaoLabel(item.tipo_aplicacao) }}
                        </span>
                      </td>
                      <td class="px-3 py-2">
                        <input
                          v-model.number="item.value"
                          type="number"
                          min="0"
                          step="0.01"
                          class="w-32 rounded-lg border border-border-ui bg-bg-page px-2 py-1.5 text-sm"
                        />
                      </td>
                    </tr>
                    <tr v-if="loadingInsumos">
                      <td colspan="4" class="px-3 py-8 text-center text-sm text-text-muted">
                        Carregando insumos...
                      </td>
                    </tr>
                    <tr v-else-if="!kitItems.length">
                      <td colspan="4" class="px-3 py-8 text-center text-sm text-text-muted">
                        Nenhum produto marcado como Insumo foi encontrado.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
              Total do Kit de Montagem: <strong>{{ formatCurrency(kitTotal) }}/m2</strong>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="rounded-xl border border-border-ui bg-bg-page p-3">
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Hora-Homem (R$ / m2)</label>
                <input
                  v-model.number="horaHomemValue"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-xl border border-border-ui bg-white px-3 py-2 text-sm"
                />
              </div>
              <div class="rounded-xl border border-border-ui bg-bg-page p-3">
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Custos fixos da fabrica (R$ / m2)</label>
                <input
                  v-model.number="custoFixoFabricaValue"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-xl border border-border-ui bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div class="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-700">
              Custos internos por m2: <strong>{{ formatCurrency(custosInternosTotal) }}/m2</strong>
            </div>
          </div>
        </div>

        <!-- Resumo + Botões -->
        <div class="px-4 md:px-5 py-3 border-b border-border-ui/60 bg-slate-50/40">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
            <!-- CMV por categoria -->
            <div class="md:col-span-3 rounded-xl border border-border-ui bg-white overflow-hidden">
              <div class="px-3 py-2 bg-slate-50 border-b border-border-ui text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                CMV por categoria (Mat. + Insumos + Custos)
              </div>
              <table class="w-full">
                <thead>
                  <tr class="border-b border-border-ui text-[10px] uppercase tracking-wider text-slate-400">
                    <th class="px-3 py-1.5 text-left font-semibold">Categoria</th>
                    <th class="px-3 py-1.5 text-right font-semibold">Mat. Med</th>
                    <th class="px-3 py-1.5 text-right font-semibold">+ Insumos</th>
                    <th class="px-3 py-1.5 text-right font-semibold">+ Custos</th>
                    <th class="px-3 py-1.5 text-right font-semibold text-slate-700">Total/m2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="cat in CATEGORIAS_ABA1" :key="cat.id" class="border-b border-border-ui/50 last:border-b-0">
                    <td class="px-3 py-2 text-xs font-semibold text-text-main">
                      <span class="inline-flex items-center gap-1.5">
                        <span
                          class="w-1.5 h-1.5 rounded-full inline-block"
                          :class="cat.id === 'essencial' ? 'bg-slate-400' : cat.id === 'design' ? 'bg-emerald-400' : 'bg-amber-400'"
                        ></span>
                        {{ cat.label }}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-xs text-right tabular-nums text-slate-700">
                      {{ formatCurrency(matrizPorCategoria[cat.id]?.avg_cost_base || 0) }}
                    </td>
                    <td class="px-3 py-2 text-xs text-right tabular-nums text-slate-500">
                      {{ formatCurrency(kitTotal) }}
                    </td>
                    <td class="px-3 py-2 text-xs text-right tabular-nums text-slate-500">
                      {{ formatCurrency(custosInternosTotal) }}
                    </td>
                    <td class="px-3 py-2 text-xs text-right tabular-nums font-black text-slate-900">
                      {{ formatCurrency((matrizPorCategoria[cat.id]?.avg_cost_base || 0) + kitTotal + custosInternosTotal) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="flex flex-col gap-2">
              <button
                type="button"
                class="w-full inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                :disabled="processando"
                @click="processarMatriz"
              >
                <i :class="processando ? 'pi pi-spin pi-spinner' : 'pi pi-calculator'" class="text-sm"></i>
                {{ processando ? 'Processando...' : 'Processar e Salvar' }}
              </button>
              <button
                type="button"
                class="w-full inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-border-ui text-text-main hover:bg-slate-50 transition-all"
                :disabled="loadingMatriz"
                @click="loadMatriz"
              >
                <i :class="loadingMatriz ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" class="text-sm"></i>
                Atualizar tabela
              </button>
            </div>
          </div>
        </div>

        <!-- Tabela de resultados salvos -->
        <div class="overflow-auto">
          <table class="w-full min-w-[620px]">
            <thead>
              <tr class="border-b border-border-ui bg-white text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th class="px-4 py-3 font-black">Categoria</th>
                <th class="px-4 py-3 font-black">Espessura</th>
                <th class="px-4 py-3 font-black text-emerald-600">Custo Minimo / m2</th>
                <th class="px-4 py-3 font-black text-amber-600">Custo Medio / m2</th>
                <th class="px-4 py-3 font-black text-red-500">Custo Maximo / m2</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="loadingMatriz">
                <tr v-for="n in 5" :key="n" class="border-b border-border-ui/70 animate-pulse">
                  <td v-for="c in 5" :key="c" class="px-4 py-3">
                    <div class="h-3.5 rounded bg-slate-100 w-3/4"></div>
                  </td>
                </tr>
              </template>

              <template v-else>
                <tr
                  v-for="row in matrizViewData"
                  :key="row.id"
                  class="border-b border-border-ui/70 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                >
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wide">
                      {{ categoriaLabel(row.category) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-[11px] text-text-muted font-semibold">
                    {{ row.thickness_label || 'Consolidado' }}
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black bg-emerald-50 text-emerald-700 tabular-nums">
                      {{ formatCurrency(row.min_cost_base) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black bg-amber-50 text-amber-700 tabular-nums">
                      {{ formatCurrency(row.avg_cost_base) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black bg-red-50 text-red-600 tabular-nums">
                      {{ formatCurrency(row.max_cost_base) }}
                    </span>
                  </td>
                </tr>

                <tr v-if="!matrizViewData.length">
                  <td colspan="5" class="px-4 py-12 text-center">
                    <div class="flex flex-col items-center gap-2 text-text-muted">
                      <i class="pi pi-table text-2xl opacity-40"></i>
                      <p class="text-sm">Nenhum dado na Matriz Operacional.</p>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { EstrategiaPrecosService } from '@/services/index'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'configuracoes.estrategia_precos.ver' } })

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

const strategies = [
  { value: 'MIN_PRICE', badge: 'OPCAO 01', title: 'Menor Preco', description: 'Prioriza o menor custo disponivel para o material filtrado.' },
  { value: 'AVG_PRICE', badge: 'OPCAO 02', title: 'Preco Medio', description: 'Usa a media de precos para reduzir extremos e manter equilibrio.' },
  { value: 'MAX_PRICE', badge: 'OPCAO 03', title: 'Maior Preco', description: 'Considera o maior custo encontrado dentro dos filtros aplicados.' },
]

const tabs = [
  { id: 'materiais', label: 'Aba 1 - Materiais' },
  { id: 'insumos', label: 'Aba 2 - Insumos Fixos' },
  { id: 'custos', label: 'Aba 3 - Custos Internos' },
]

const CATEGORIAS_ABA1 = [
  { id: 'essencial', label: 'Essencial', apiKey: 'PRIMARIA' },
  { id: 'design', label: 'Design', apiKey: 'SECUNDARIA' },
  { id: 'premium', label: 'Premium', apiKey: 'TERCIARIA' },
]

// ─── ESTADO ──────────────────────────────────────────────────────────────────

const activeStrategy = ref('AVG_PRICE')
const pendingStrategy = ref('')
const saving = ref(false)

const activeTab = ref('materiais')
const activeSubTab = ref('essencial')
const areaPadraoM2 = ref(5.06)
const lossMarginPct = ref(20)

const gruposMdfPorCategoria = ref({ essencial: [], design: [], premium: [] })
const buscandoCategorias = ref({ essencial: false, design: false, premium: false })
const categoriaCarregada = ref({ essencial: false, design: false, premium: false })

const kitItems = ref([])
const loadingInsumos = ref(false)

const horaHomemValue = ref(0)
const custoFixoFabricaValue = ref(0)

const processando = ref(false)
const loadingMatriz = ref(false)
const matrizData = ref([])
const matrizAtualizadoEm = ref(null)

// ─── COMPUTEDS ───────────────────────────────────────────────────────────────

const kitTotal = computed(() =>
  kitItems.value
    .filter((item) => item.selected)
    .reduce((acc, item) => acc + Number(item.value || 0), 0),
)

const custosInternosTotal = computed(
  () => Number(horaHomemValue.value || 0) + Number(custoFixoFabricaValue.value || 0),
)

const gruposMdfAtivo = computed(() => gruposMdfPorCategoria.value[activeSubTab.value] || [])

const materiaisSelecionados = computed(() =>
  CATEGORIAS_ABA1.flatMap((cat) => (gruposMdfPorCategoria.value[cat.id] || []).filter((item) => item.selected)),
)

const matrizPorCategoria = computed(() => {
  const result = {}
  for (const cat of CATEGORIAS_ABA1) {
    const items = (gruposMdfPorCategoria.value[cat.id] || []).filter((r) => r.selected)
    const values = items.map((r) => Number(precoReferenciaComAcrescimo(r) || 0)).filter((v) => v > 0)
    const min = values.length ? Math.min(...values) : 0
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
    const max = values.length ? Math.max(...values) : 0
    result[cat.id] = {
      min_cost_base: calcMatrizFormula(min),
      avg_cost_base: calcMatrizFormula(avg),
      max_cost_base: calcMatrizFormula(max),
      count: items.length,
    }
  }
  return result
})

const matrizViewData = computed(() =>
  (matrizData.value || []).map((row) => ({
    ...row,
    thickness_label: row?.thickness > 0 ? `${row.thickness} mm` : 'Consolidado',
  })),
)

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function strategyLabel(value) {
  if (value === 'MIN_PRICE') return 'Menor Preco'
  if (value === 'MAX_PRICE') return 'Maior Preco'
  return 'Preco Medio'
}

function formatCurrency(value) {
  const num = Number(value ?? 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(num) ? num : 0,
  )
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function normalizeCommercialCategory(value) {
  const text = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
  if (text.includes('SECUND')) return 'SECUNDARIA'
  if (text.includes('TERCI')) return 'TERCIARIA'
  return 'PRIMARIA'
}

function categoriaLabel(value) {
  const key = normalizeCommercialCategory(value)
  if (key === 'SECUNDARIA') return 'Design'
  if (key === 'TERCIARIA') return 'Premium'
  return 'Essencial'
}

function tipoAplicacaoLabel(value) {
  const tipo = String(value || '').trim().toUpperCase()
  if (tipo === 'INSUMO') return 'Insumo'
  return 'Materia-Prima'
}

function badgeTipoAplicacaoClass(value) {
  const tipo = String(value || '').trim().toUpperCase()
  if (tipo === 'INSUMO') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

function calcMatrizFormula(precoCompra) {
  const price = Number(precoCompra || 0)
  if (!price) return 0
  return ((price * 2) / 5.06) * 1.2
}

function custoBaseCalculadoM2(row) {
  const precoCompra = Number(precoReferenciaComAcrescimo(row) || 0)
  const areaVinculada = Number(row?.area_m2 || areaPadraoM2.value || 5.06)
  const margemPerda = Number(lossMarginPct.value || 0)
  if (!precoCompra || !areaVinculada) return 0
  return ((precoCompra * 2) / areaVinculada) * (1 + margemPerda / 100)
}

function precoReferenciaByStrategy(row) {
  if (activeStrategy.value === 'MIN_PRICE') {
    return Number(row?.min_purchase_price ?? row?.reference_purchase_price ?? row?.avg_purchase_price ?? 0)
  }
  if (activeStrategy.value === 'MAX_PRICE') {
    return Number(row?.max_purchase_price ?? row?.reference_purchase_price ?? row?.avg_purchase_price ?? 0)
  }
  return Number(row?.avg_purchase_price ?? row?.reference_purchase_price ?? 0)
}

function precoReferenciaComMargem(row) {
  return Number(precoReferenciaComAcrescimo(row) || 0) * 2
}

function precoReferenciaComAcrescimo(row) {
  const base = Number(precoReferenciaByStrategy(row) || 0)
  const acrescimoPct = Number(row?.acrescimo_pct || 0)
  return base * (1 + acrescimoPct / 100)
}

function keyMaterial(row) {
  return `${row.category}__${row.thickness}__${row.group}`
}

// ─── CARREGAMENTO DE CATEGORIAS ───────────────────────────────────────────────

function trocarSubTab(catId) {
  activeSubTab.value = catId
  carregarCategoria(catId)
}

async function carregarCategoria(catId) {
  if (categoriaCarregada.value[catId] || buscandoCategorias.value[catId]) return
  const cat = CATEGORIAS_ABA1.find((c) => c.id === catId)
  if (!cat) return
  buscandoCategorias.value[catId] = true
  try {
    const { data } = await EstrategiaPrecosService.buscarMdfPorCategoria(cat.apiKey, activeStrategy.value)
    const rows = Array.isArray(data) ? data : []
    gruposMdfPorCategoria.value[catId] = rows.map((row) => ({
      ...row,
      key: keyMaterial(row),
      selected: true,
      acrescimo_pct: Number(row?.acrescimo_pct || 0),
      area_m2: Number(areaPadraoM2.value || 5.06),
    }))
    categoriaCarregada.value[catId] = true
  } catch (err) {
    console.error(err)
    notify.error('Nao foi possivel carregar materiais da categoria.')
  } finally {
    buscandoCategorias.value[catId] = false
  }
}

// ─── KIT DE MONTAGEM ──────────────────────────────────────────────────────────

async function carregarInsumosFixos() {
  loadingInsumos.value = true
  try {
    const { data } = await EstrategiaPrecosService.listarInsumosFixos()
    const rows = Array.isArray(data) ? data : []
    kitItems.value = rows
      .filter((item) => String(item?.tipo_aplicacao || '').toUpperCase() === 'INSUMO')
      .map((item) => ({
        id: item.id,
        name: item.name,
        value: Number(item.value || 0),
        tipo_aplicacao: item.tipo_aplicacao || 'INSUMO',
        selected: item.selected !== false,
      }))
  } catch (err) {
    console.error(err)
    notify.error('Nao foi possivel carregar os insumos fixos da Aba 2.')
  } finally {
    loadingInsumos.value = false
  }
}

// ─── ESTRATÉGIA ───────────────────────────────────────────────────────────────

async function loadConfig() {
  try {
    const { data } = await EstrategiaPrecosService.buscarConfig()
    if (data?.search_strategy) activeStrategy.value = data.search_strategy
  } catch (err) {
    console.error(err)
  }
}

async function selectStrategy(strategy) {
  if (!strategy || strategy === activeStrategy.value) return
  pendingStrategy.value = strategy
  saving.value = true
  try {
    await EstrategiaPrecosService.atualizarConfig(strategy)
    activeStrategy.value = strategy
    categoriaCarregada.value = { essencial: false, design: false, premium: false }
    gruposMdfPorCategoria.value = { essencial: [], design: [], premium: [] }
    await carregarCategoria(activeSubTab.value)
    notify.success(`Estrategia ${strategyLabel(strategy)} ativada.`)
  } catch (err) {
    console.error(err)
    notify.error('Falha ao atualizar a estrategia de precos.')
  } finally {
    saving.value = false
    pendingStrategy.value = ''
  }
}

// ─── MATRIZ ───────────────────────────────────────────────────────────────────

async function loadMatriz() {
  loadingMatriz.value = true
  try {
    const { data } = await EstrategiaPrecosService.listarMatriz({})
    matrizData.value = Array.isArray(data) ? data : []
    if (matrizData.value.length) {
      matrizAtualizadoEm.value = matrizData.value[0]?.atualizado_em ?? null
    }
  } catch (err) {
    console.error(err)
    notify.error('Nao foi possivel carregar a Matriz Operacional.')
  } finally {
    loadingMatriz.value = false
  }
}

async function processarMatriz() {
  processando.value = true
  try {
    const payload = {
      area_chapa_m2: Number(areaPadraoM2.value || 5.06),
      markup_base_pct: 100,
      loss_margin_pct: Number(lossMarginPct.value || 20),
      material_links: materiaisSelecionados.value.map((m) => ({
        category: m.category,
        commercial_category: m.commercial_category,
        thickness: Number(m.thickness),
        group: m.group,
        acrescimo_pct: Number(m.acrescimo_pct || 0),
        min_purchase_price: Number(m.min_purchase_price || 0),
        avg_purchase_price: Number(m.avg_purchase_price || 0),
        max_purchase_price: Number(m.max_purchase_price || 0),
        reference_purchase_price: Number(precoReferenciaByStrategy(m) || 0),
        area_m2: Number(m.area_m2 || areaPadraoM2.value || 5.06),
        selected: !!m.selected,
      })),
      kit_items: kitItems.value.map((item) => ({
        id: item.id,
        name: item.name,
        tipo_aplicacao: item.tipo_aplicacao,
        value: Number(item.value || 0),
        selected: !!item.selected,
      })),
      hora_homem_value: Number(horaHomemValue.value || 0),
      custo_fixo_fabrica_value: Number(custoFixoFabricaValue.value || 0),
    }

    const { data } = await EstrategiaPrecosService.processarMatriz(payload)
    notify.success(`Matriz processada com sucesso! ${data?.processed ?? 0} grupos atualizados.`)
    await loadMatriz()
  } catch (err) {
    console.error(err)
    notify.error('Falha ao processar a Matriz Operacional.')
  } finally {
    processando.value = false
  }
}

onMounted(async () => {
  await loadConfig()
  await carregarInsumosFixos()
  await loadMatriz()
  await carregarCategoria('essencial')
})
</script>
