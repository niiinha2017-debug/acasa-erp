<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>

      <div class="flex flex-row flex-nowrap items-center gap-4 px-4 md:px-6 py-4 border-b border-border-ui">
        <h1 class="text-xl font-semibold text-text-main shrink-0 flex items-center gap-2">
          <i class="pi pi-chart-bar text-text-muted"></i>
          Relatórios
        </h1>
        <div class="flex flex-1 flex-nowrap items-center justify-end gap-3 min-w-0 ml-auto">
          <div class="flex items-center gap-2 shrink-0">
            <label class="text-xs font-medium text-text-muted">Mês</label>
            <select
              v-model="mes"
              class="h-10 w-[72px] rounded-lg border border-border-ui bg-bg-page pl-2 pr-2 text-sm text-text-main"
              @change="carregar"
            >
              <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <label class="text-xs font-medium text-text-muted">Ano</label>
            <select
              v-model="ano"
              class="h-10 w-[80px] rounded-lg border border-border-ui bg-bg-page pl-2 pr-2 text-sm text-text-main"
              @change="carregar"
            >
              <option v-for="y in anosDisponiveis" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <label class="text-xs font-medium text-text-muted">Meta (R$)</label>
            <input
              v-model.number="metaComissao"
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              class="h-10 w-[100px] rounded-lg border border-border-ui bg-bg-page px-2 text-sm text-text-main"
              @change="carregar"
            />
          </div>
        </div>
      </div>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 space-y-6">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-2xl text-brand-primary" />
        </div>

        <template v-else>
          <section class="space-y-2">
            <h2 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
              Gráficos de Validação
            </h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Gráfico 1: Composição do Custo (Doughnut) -->
              <div class="rounded-xl border border-border-ui bg-white dark:bg-slate-900/40 p-4">
                <p class="text-sm font-medium text-text-main mb-3">
                  Composição do Custo
                </p>
                <p class="text-xs text-text-muted mb-3">
                  Materiais, Custo Hora, Impostos e Lucro sobre o valor total
                </p>
                <ChartWrapper
                  type="doughnut"
                  :data="chartComposicao"
                  :options="optsDoughnut"
                  height="260px"
                />
              </div>

              <!-- Gráfico 2: Lucro por Ambiente (Barras) -->
              <div class="rounded-xl border border-border-ui bg-white dark:bg-slate-900/40 p-4">
                <p class="text-sm font-medium text-text-main mb-3">
                  Desempenho de Lucro por Ambiente
                </p>
                <p class="text-xs text-text-muted mb-3">
                  Comparação de rentabilidade por tipo de ambiente
                </p>
                <ChartWrapper
                  type="bar"
                  :data="chartLucroAmbiente"
                  :options="optsBar"
                  height="260px"
                />
              </div>
            </div>

            <!-- Gráfico 3: Meta de Produção (Barra progressiva) -->
            <div class="rounded-xl border border-border-ui bg-white dark:bg-slate-900/40 p-4">
              <p class="text-sm font-medium text-text-main mb-3">
                Evolução da Meta de Produção
              </p>
              <p class="text-xs text-text-muted mb-3">
                Comissão da fábrica gerada no mês em relação à meta
              </p>
              <div class="flex flex-col gap-2 max-w-md">
                <div class="flex justify-between text-xs text-text-muted">
                  <span>{{ formatarMoeda(dados.meta_producao.comissao_gerada) }} gerado</span>
                  <span>Meta {{ formatarMoeda(dados.meta_producao.meta) }}</span>
                </div>
                <div class="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-brand-primary transition-all duration-500"
                    :style="{ width: `${Math.min(100, dados.meta_producao.percentual)}%` }"
                  ></div>
                </div>
                <p class="text-sm font-medium text-text-main tabular-nums">
                  {{ dados.meta_producao.percentual }}% da meta
                </p>
              </div>
            </div>

            <!-- Gráficos analíticos -->
            <h2 class="text-sm font-semibold text-text-muted uppercase tracking-wide pt-2">
              Gráficos analíticos
            </h2>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Previsto vs. Real (Barras) -->
              <div class="rounded-xl border border-border-ui bg-white dark:bg-slate-900/40 p-4">
                <p class="text-sm font-medium text-text-main mb-3">
                  Previsto vs. Real
                </p>
                <p class="text-xs text-text-muted mb-3">
                  Horas orçadas (estimativa) vs. horas reais apontadas por projeto
                </p>
                <ChartWrapper
                  type="bar"
                  :data="chartPrevistoReal"
                  :options="optsPrevistoReal"
                  height="260px"
                />
              </div>

              <!-- Margem por Categoria (Pizza) -->
              <div class="rounded-xl border border-border-ui bg-white dark:bg-slate-900/40 p-4">
                <p class="text-sm font-medium text-text-main mb-3">
                  Margem por Categoria
                </p>
                <p class="text-xs text-text-muted mb-3">
                  Margem de contribuição por tipo de material/acabamento
                </p>
                <ChartWrapper
                  type="doughnut"
                  :data="chartMargemCategoria"
                  :options="optsDoughnut"
                  height="260px"
                />
              </div>

              <!-- Índice de Produtividade (Linhas) -->
              <div class="rounded-xl border border-border-ui bg-white dark:bg-slate-900/40 p-4 lg:col-span-1">
                <p class="text-sm font-medium text-text-main mb-3">
                  Índice de Produtividade
                </p>
                <p class="text-xs text-text-muted mb-3">
                  Evolução do lucro líquido gerado pela fábrica, semana a semana
                </p>
                <ChartWrapper
                  type="line"
                  :data="chartLucroSemana"
                  :options="optsLine"
                  height="260px"
                />
              </div>
            </div>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { DreDetalhadaService } from '@/services/index'
import ChartWrapper from '@/components/charts/ChartWrapper.vue'

definePage({ meta: { perm: 'dashboard.visualizar' } })

const formatarMoeda = (v) =>
  (v != null && v !== '')
    ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00'

const loading = ref(false)
const mes = ref(new Date().getMonth() + 1)
const ano = ref(new Date().getFullYear())
const metaComissao = ref(0)

const anoAtual = new Date().getFullYear()
const anosDisponiveis = [anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2]

const dados = ref({
  composicao_custo: {
    valor_total: 0,
    materiais: 0,
    custo_hora: 0,
    impostos: 0,
    lucro_liquido: 0,
  },
  lucro_por_ambiente: [],
  meta_producao: { comissao_gerada: 0, meta: 0, percentual: 0 },
  previsto_vs_real: [],
  margem_por_categoria: [],
  lucro_por_semana: [],
})

const coresSobrias = {
  materiais: 'rgb(100, 116, 139)',
  custoHora: 'rgb(71, 85, 105)',
  impostos: 'rgb(148, 163, 184)',
  lucro: 'rgb(34, 197, 94)',
  barras: 'rgb(59, 130, 246)',
}

const coresPastel = [
  'rgba(167, 139, 250, 0.85)',  // violeta pastel
  'rgba(134, 239, 172, 0.85)',  // verde menta
  'rgba(253, 186, 116, 0.85)',  // laranja suave
  'rgba(252, 211, 77, 0.85)',   // amarelo pastel
  'rgba(248, 113, 113, 0.85)',  // coral
  'rgba(129, 140, 248, 0.85)',  // índigo
  'rgba(94, 234, 212, 0.85)',   // teal
  'rgba(251, 191, 36, 0.85)',   // âmbar
]

const chartComposicao = computed(() => {
  const c = dados.value.composicao_custo
  const allLabels = ['Materiais', 'Custo Hora (Mão de Obra)', 'Impostos', 'Lucro Líquido']
  const allColors = [coresSobrias.materiais, coresSobrias.custoHora, coresSobrias.impostos, coresSobrias.lucro]
  const allVals = [
    Number(c.materiais) || 0,
    Number(c.custo_hora) || 0,
    Number(c.impostos) || 0,
    Number(c.lucro_liquido) || 0,
  ]
  const labels = []
  const vals = []
  const colors = []
  allVals.forEach((v, i) => {
    if (v > 0) {
      labels.push(allLabels[i])
      vals.push(v)
      colors.push(allColors[i])
    }
  })
  if (vals.length === 0) {
    return { labels: ['Sem dados'], datasets: [{ data: [1], backgroundColor: ['#e2e8f0'], borderWidth: 0 }] }
  }
  return {
    labels,
    datasets: [{ data: vals, backgroundColor: colors, borderWidth: 0 }],
  }
})

const chartLucroAmbiente = computed(() => {
  const list = dados.value.lucro_por_ambiente || []
  if (!list.length) {
    return { labels: ['Sem dados'], datasets: [{ data: [0], backgroundColor: coresSobrias.barras }] }
  }
  return {
    labels: list.map((a) => a.nome_ambiente || 'Ambiente'),
    datasets: [{
      label: 'Lucro Líquido',
      data: list.map((a) => Number(a.lucro_liquido) || 0),
      backgroundColor: coresSobrias.barras,
      borderRadius: 4,
    }],
  }
})

const optsDoughnut = {
  cutout: '60%',
  plugins: {
    legend: { position: 'bottom' },
  },
}

const optsBar = {
  indexAxis: 'y',
  plugins: { legend: { display: false } },
}

const chartPrevistoReal = computed(() => {
  const list = dados.value.previsto_vs_real || []
  if (!list.length) {
    return { labels: ['Sem dados'], datasets: [{ data: [0], backgroundColor: coresPastel[0] }] }
  }
  return {
    labels: list.map((r) => r.projeto_codigo || 'Projeto'),
    datasets: [
      {
        label: 'Horas previstas',
        data: list.map((r) => Number(r.horas_previstas) || 0),
        backgroundColor: 'rgba(167, 139, 250, 0.75)',
        borderRadius: 4,
      },
      {
        label: 'Horas reais',
        data: list.map((r) => Number(r.horas_reais) || 0),
        backgroundColor: 'rgba(94, 234, 212, 0.75)',
        borderRadius: 4,
      },
    ],
  }
})

const optsPrevistoReal = {
  plugins: { legend: { position: 'bottom' } },
  scales: {
    x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 11, weight: '400' }, color: '#94a3b8' } },
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11, weight: '400' }, color: '#94a3b8' } },
  },
}

const chartMargemCategoria = computed(() => {
  const list = dados.value.margem_por_categoria || []
  if (!list.length) {
    return { labels: ['Sem dados'], datasets: [{ data: [1], backgroundColor: [coresPastel[0]], borderWidth: 0 }] }
  }
  const labels = list.map((c) => c.categoria || 'Outros')
  const vals = list.map((c) => Math.max(0, Number(c.margem_contribuicao) || 0))
  const totais = list.map((c) => Number(c.custo_total) || 0)
  const data = vals.some((v) => v > 0) ? vals : totais
  const colors = labels.map((_, i) => coresPastel[i % coresPastel.length])
  return {
    labels,
    datasets: [{ data, backgroundColor: colors, borderWidth: 0 }],
  }
})

const chartLucroSemana = computed(() => {
  const list = dados.value.lucro_por_semana || []
  if (!list.length) {
    return { labels: [], datasets: [{ label: 'Lucro Líquido', data: [], borderColor: 'rgba(134, 239, 172, 0.9)', backgroundColor: 'rgba(134, 239, 172, 0.2)', fill: true }] }
  }
  return {
    labels: list.map((s) => s.label || `Sem ${s.semana}`),
    datasets: [{
      label: 'Lucro Líquido',
      data: list.map((s) => Number(s.lucro_liquido) || 0),
      borderColor: 'rgba(134, 239, 172, 0.9)',
      backgroundColor: 'rgba(134, 239, 172, 0.15)',
      fill: true,
      tension: 0.3,
      pointBackgroundColor: 'rgba(134, 239, 172, 0.9)',
      pointRadius: 4,
    }],
  }
})

const optsLine = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11, weight: '400' }, color: '#94a3b8' } },
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11, weight: '400' }, color: '#94a3b8' } },
  },
}

async function carregar() {
  loading.value = true
  try {
    const res = await DreDetalhadaService.getGraficosValidacao({
      mes: mes.value,
      ano: ano.value,
      meta: metaComissao.value > 0 ? metaComissao.value : undefined,
    })
    const data = res?.data ?? res
    dados.value = {
      composicao_custo: data?.composicao_custo ?? dados.value.composicao_custo,
      lucro_por_ambiente: Array.isArray(data?.lucro_por_ambiente) ? data.lucro_por_ambiente : [],
      meta_producao: data?.meta_producao ?? dados.value.meta_producao,
      previsto_vs_real: Array.isArray(data?.previsto_vs_real) ? data.previsto_vs_real : [],
      margem_por_categoria: Array.isArray(data?.margem_por_categoria) ? data.margem_por_categoria : [],
      lucro_por_semana: Array.isArray(data?.lucro_por_semana) ? data.lucro_por_semana : [],
    }
  } catch (e) {
    dados.value = {
      composicao_custo: { valor_total: 0, materiais: 0, custo_hora: 0, impostos: 0, lucro_liquido: 0 },
      lucro_por_ambiente: [],
      meta_producao: { comissao_gerada: 0, meta: metaComissao.value || 0, percentual: 0 },
      previsto_vs_real: [],
      margem_por_categoria: [],
      lucro_por_semana: [],
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => carregar())
</script>
