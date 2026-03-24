<!-- src/pages/financeiro/custos-estrutura/index.vue -->
<template>
  <PageShell :padded="false" variant="minimal">
    <section class="login-font ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        title="Custos de Estrutura"
        subtitle="Visão geral: custo da fábrica parada (fixo, do Financeiro/Despesas), custo por hora (taxa de máquina) e projeção total com Compras do mês (almoxarifado — MDF, ferragens)."
        icon="pi pi-building"
        variant="minimal"
      />

      <div class="ds-editor-body space-y-6 px-4 md:px-6 pb-6 pt-4">
        <!-- Parâmetros unificados: período (mês ou ano) e pesquisas -->
        <div class="ds-card ds-card--default p-4 flex flex-wrap items-end gap-4">
          <h2 class="text-sm font-semibold text-text-main w-full mb-0">Parâmetros</h2>
          <div class="flex flex-wrap items-end gap-3">
            <div class="w-32">
              <label class="text-xs font-medium text-text-muted block mb-1">Período</label>
              <select
                v-model="periodo"
                class="w-full h-10 rounded-lg border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] pl-2 pr-2 text-sm text-text-main"
                @change="carregar"
              >
                <option value="mes">Por mês</option>
                <option value="ano">Por ano</option>
              </select>
            </div>
            <template v-if="periodo === 'mes'">
              <div class="w-24">
                <label class="text-xs font-medium text-text-muted block mb-1">Mês</label>
                <select
                  v-model.number="mesAno.mes"
                  class="w-full h-10 rounded-lg border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] pl-2 pr-2 text-sm text-text-main"
                  @change="carregar"
                >
                  <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
                </select>
              </div>
            </template>
            <div class="w-28">
              <label class="text-xs font-medium text-text-muted block mb-1">Ano</label>
              <select
                v-model.number="mesAno.ano"
                class="w-full h-10 rounded-lg border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] pl-2 pr-2 text-sm text-text-main"
                @change="carregar"
              >
                <option v-for="y in anosDisponiveis" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <button
              type="button"
              class="h-10 px-4 rounded-lg border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] text-text-main text-sm hover:bg-black/5 dark:hover:bg-white/5"
              @click="carregar"
            >
              <i class="pi pi-refresh mr-2" />
              Atualizar
            </button>
          </div>
        </div>

        <!-- 3 métricas principais: somente valores automáticos (Despesas + Compras) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="ds-card ds-card--default p-4">
            <p class="text-[10px] font-semibold text-text-muted uppercase tracking-wide">{{ periodo === 'ano' ? 'Custo Fábrica (Anual)' : 'Custo Fábrica (Mensal)' }}</p>
            <p class="mt-1 text-xl font-bold text-text-main tabular-nums">{{ formatarMoeda(totalCustos) }}</p>
            <p class="text-xs text-text-muted mt-0.5">Despesas (Ocupação + Operacional + Manutenção) — automático</p>
          </div>
          <div class="ds-card ds-card--default p-4">
            <p class="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Custo Hora (Taxa de Máquina)</p>
            <p class="mt-1 text-xl font-bold text-brand-primary tabular-nums">{{ formatarMoeda(custoFixoPorHora) }}/h</p>
            <p class="text-xs text-text-muted mt-0.5">Custo Fábrica ÷ {{ horasUteisExibicao }}h úteis</p>
          </div>
          <div class="ds-card ds-card--default p-4">
            <p class="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Projeção de Custo Total</p>
            <p class="mt-1 text-xl font-bold text-text-main tabular-nums">{{ formatarMoeda(projecaoCustoTotal) }}</p>
            <p class="text-xs text-text-muted mt-0.5">Despesas fixas + Compras (MDF, ferragens — almoxarifado)</p>
          </div>
        </div>

        <p class="text-xs text-text-muted flex items-center gap-2">
          <i class="pi pi-info-circle" />
          Valores somente automáticos: Custo Fábrica do módulo Despesas; Compras do almoxarifado. Período do mês ou do ano nas pesquisas acima.
        </p>

        <!-- Gráfico de evolução -->
        <div class="ds-card ds-card--default overflow-hidden">
          <div class="px-4 py-3 border-b border-[color:var(--ds-color-border-ui)] bg-[var(--ds-color-surface-muted)] flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-text-main">Evolução dos custos de estrutura</h2>
            <div class="flex items-center gap-2">
              <label class="text-xs font-medium text-text-muted">Período</label>
              <select
                v-model.number="graficoMeses"
                class="h-9 w-28 rounded-lg border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] pl-2 pr-2 text-sm text-text-main"
                @change="carregarGrafico"
              >
                <option :value="6">6 meses</option>
                <option :value="12">12 meses</option>
                <option :value="24">24 meses</option>
              </select>
            </div>
          </div>
          <div class="p-4">
            <div v-if="graficoLoading" class="flex items-center justify-center py-12">
              <i class="pi pi-spin pi-spinner text-2xl text-brand-primary" />
            </div>
            <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p class="text-sm font-medium text-text-muted mb-2">Total custos (R$) por mês</p>
                <ChartWrapper
                  type="bar"
                  :data="graficoDataTotal"
                  height="220px"
                />
              </div>
              <div>
                <p class="text-sm font-medium text-text-muted mb-2">Custo fixo por hora (R$/h) por mês</p>
                <ChartWrapper
                  type="line"
                  :data="graficoDataCustoHora"
                  height="220px"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Valores do período: somente leitura (automáticos do módulo Despesas) -->
        <div class="ds-card ds-card--default overflow-hidden">
          <div class="px-4 py-3 border-b border-[color:var(--ds-color-border-ui)] bg-[var(--ds-color-surface-muted)]">
            <h2 class="text-base font-semibold text-text-main">Valores do {{ periodo === 'ano' ? 'ano' : 'mês' }} (Módulo Despesas)</h2>
            <p class="text-xs text-text-muted mt-0.5">Soma das despesas por categoria — somente automático.</p>
          </div>
          <div class="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 class="text-sm font-semibold text-text-main mb-1">Custos de Ocupação</h3>
              <p class="text-xs text-text-muted mb-1">Aluguel, IPTU, Seguros do imóvel.</p>
              <p class="text-base font-semibold text-text-main tabular-nums">{{ formatarMoeda(valores.custo_ocupacao) }}</p>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-text-main mb-1">Custos Operacionais</h3>
              <p class="text-xs text-text-muted mb-1">Energia, Água, Internet da fábrica.</p>
              <p class="text-base font-semibold text-text-main tabular-nums">{{ formatarMoeda(valores.custo_operacional) }}</p>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-text-main mb-1">Manutenção e Depreciação</h3>
              <p class="text-xs text-text-muted mb-1">Afiação, reparos, desgaste de máquinas.</p>
              <p class="text-base font-semibold text-text-main tabular-nums">{{ formatarMoeda(valores.custo_manutencao_depreciacao) }}</p>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-text-main mb-1">Horas úteis</h3>
              <p class="text-xs text-text-muted mb-1">Parâmetro do cadastro da Empresa ({{ constantes.horas_uteis_mes_padrao }} h/mês).</p>
              <p class="text-base font-semibold text-text-main tabular-nums">{{ horasUteisExibicao }} h</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { CustosEstruturaService } from '@/services/index'
import ChartWrapper from '@/components/charts/ChartWrapper.vue'

definePage({ meta: { perm: 'custos_estrutura.ver' } })

const formatarMoeda = (v) =>
  (v != null && v !== '')
    ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00'

const anoAtual = new Date().getFullYear()
const anosDisponiveis = [anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2]

const periodo = ref('mes')
const mesAno = ref({
  mes: new Date().getMonth() + 1,
  ano: anoAtual,
})

const constantes = ref({ horas_uteis_mes_padrao: 176 })
const resumo = ref(null)
const valores = ref({
  custo_ocupacao: 0,
  custo_operacional: 0,
  custo_manutencao_depreciacao: 0,
  horas_uteis_mes: 176,
})
const graficoMeses = ref(12)
const graficoLoading = ref(false)
const graficoRaw = ref({ labels: [], total_custos_estrutura: [], custo_hora_estrutura: [] })

const graficoDataTotal = computed(() => ({
  labels: graficoRaw.value.labels,
  datasets: [
    {
      label: 'Total custos (R$)',
      data: graficoRaw.value.total_custos_estrutura ?? [],
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
    },
  ],
}))

const graficoDataCustoHora = computed(() => ({
  labels: graficoRaw.value.labels,
  datasets: [
    {
      label: 'Custo/hora (R$/h)',
      data: graficoRaw.value.custo_hora_estrutura ?? [],
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.2,
    },
  ],
}))

/** Total = soma dos três custos (em tempo real). */
const totalCustos = computed(() => {
  const o = Number(valores.value.custo_ocupacao) || 0
  const p = Number(valores.value.custo_operacional) || 0
  const m = Number(valores.value.custo_manutencao_depreciacao) || 0
  return Math.round((o + p + m) * 100) / 100
})

/** Horas úteis: valor digitado ou constante. */
const horasUteisExibicao = computed(() => {
  const h = Number(valores.value.horas_uteis_mes)
  return Number.isFinite(h) && h > 0 ? h : constantes.value.horas_uteis_mes_padrao
})

/** Custo fixo por hora = Total / Horas úteis (em tempo real). Taxa de Máquina. */
const custoFixoPorHora = computed(() => {
  const h = horasUteisExibicao.value
  if (!h || h <= 0) return 0
  return Math.round((totalCustos.value / h) * 10000) / 10000
})

/** Projeção de custo total = Custo Fábrica (Despesas) + total de Compras do mês (almoxarifado). Usa total_compras_mes ou projecao_total do backend. */
const projecaoCustoTotal = computed(() => {
  const r = resumo.value
  if (r?.projecao_total != null && Number.isFinite(Number(r.projecao_total))) return Math.round(Number(r.projecao_total) * 100) / 100
  const fixo = totalCustos.value
  const compras = Number(r?.total_compras_mes) || 0
  return Math.round((fixo + compras) * 100) / 100
})

async function carregarConstantes() {
  try {
    const { data } = await CustosEstruturaService.getConstantes()
    if (data?.horas_uteis_mes_padrao != null) {
      constantes.value = { horas_uteis_mes_padrao: Number(data.horas_uteis_mes_padrao) || 176 }
      if (!valores.value.horas_uteis_mes || valores.value.horas_uteis_mes <= 0) {
        valores.value.horas_uteis_mes = constantes.value.horas_uteis_mes_padrao
      }
    }
  } catch (_) {
    constantes.value = { horas_uteis_mes_padrao: 176 }
  }
}

async function carregar() {
  try {
    await carregarConstantes()
    const params = {
      periodo: periodo.value,
      ano: mesAno.value.ano,
    }
    if (periodo.value === 'mes') params.mes = mesAno.value.mes
    const { data } = await CustosEstruturaService.getResumo(params)
    resumo.value = data ?? null
    if (data) {
      valores.value = {
        custo_ocupacao: Number(data.custo_ocupacao) ?? 0,
        custo_operacional: Number(data.custo_operacional) ?? 0,
        custo_manutencao_depreciacao: Number(data.custo_manutencao_depreciacao) ?? 0,
        horas_uteis_mes: Number(data.horas_uteis_mes) || constantes.value.horas_uteis_mes_padrao,
      }
    }
  } catch (e) {
    console.error('[CustosEstrutura] Erro ao carregar resumo:', e)
    resumo.value = null
    valores.value = {
      custo_ocupacao: 0,
      custo_operacional: 0,
      custo_manutencao_depreciacao: 0,
      horas_uteis_mes: constantes.value.horas_uteis_mes_padrao,
    }
  }
  await carregarGrafico()
}

async function carregarGrafico() {
  graficoLoading.value = true
  try {
    const { data } = await CustosEstruturaService.getGrafico({ ultimos_meses: graficoMeses.value })
    graficoRaw.value = data ?? { labels: [], total_custos_estrutura: [], custo_hora_estrutura: [] }
  } catch (_) {
    graficoRaw.value = { labels: [], total_custos_estrutura: [], custo_hora_estrutura: [] }
  } finally {
    graficoLoading.value = false
  }
}

onMounted(() => {
  carregar()
})
</script>
