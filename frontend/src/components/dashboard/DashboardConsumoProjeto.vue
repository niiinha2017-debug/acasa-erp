<template>
  <div class="rounded-2xl border border-border-ui bg-white dark:bg-slate-900/40 overflow-hidden shadow-sm">
    <div class="px-4 py-3 border-b border-border-ui bg-slate-50/50 dark:bg-slate-800/30">
      <h3 class="text-base font-semibold text-text-main flex items-center gap-2">
        <i class="pi pi-chart-pie text-slate-400" />
        Consumo do projeto — {{ codigo }}
      </h3>
      <p class="text-xs text-text-muted mt-0.5">Área útil (peças) × Retalhos × Perda real</p>
    </div>
    <div class="p-4">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <i class="pi pi-spin pi-spinner text-2xl text-brand-primary" />
      </div>
      <template v-else>
        <!-- Alerta: perda acima do esperado -->
        <div
          v-if="alertaPerdaAcima"
          class="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3"
        >
          <i class="pi pi-exclamation-triangle text-amber-600 dark:text-amber-400 text-xl mt-0.5 shrink-0" />
          <div>
            <p class="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Revisar plano de corte — Perda acima do esperado
            </p>
            <p class="text-xs text-amber-700 dark:text-amber-300 mt-1">
              A perda real ({{ perdaRealFormatada }} m²) está acima do esperado pela constante de perda padrão ({{ perdaPadraoPercentual }}%).
            </p>
          </div>
        </div>

        <!-- Gráfico de pizza -->
        <div class="flex flex-col sm:flex-row gap-4 items-center sm:items-stretch">
          <div class="w-full sm:max-w-[280px] shrink-0">
            <ChartWrapper
              type="doughnut"
              :data="chartData"
              :options="chartOptions"
              height="240px"
            />
          </div>
          <div class="flex-1 flex flex-col justify-center gap-2 min-w-0">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full shrink-0 bg-emerald-500/90" />
              <span class="text-sm text-text-main">Área útil (peças)</span>
              <span class="text-sm font-semibold tabular-nums text-text-main ml-auto">{{ areaPecasFormatada }} m²</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full shrink-0 bg-blue-500/90" />
              <span class="text-sm text-text-main">Retalhos</span>
              <span class="text-sm font-semibold tabular-nums text-text-main ml-auto">{{ retalhosFormatada }} m²</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full shrink-0 bg-slate-400/90" />
              <span class="text-sm text-text-main">Perda real</span>
              <span class="text-sm font-semibold tabular-nums text-text-main ml-auto">{{ perdaRealFormatada }} m²</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ChartWrapper from '@/components/charts/ChartWrapper.vue'
import { DreDetalhadaService } from '@/services'

const props = defineProps({
  projetoId: { type: Number, default: null },
  codigo: { type: String, default: '' },
})

// Cores suaves: verde (útil), azul (retalhos), cinza (perda)
const COR_UTIL = 'rgba(34, 197, 94, 0.82)'
const COR_RETALHOS = 'rgba(59, 130, 246, 0.82)'
const COR_PERDA = 'rgba(148, 163, 184, 0.82)'

const loading = ref(false)
const dados = ref({
  area_pecas_m2: 0,
  retalhos_m2: 0,
  perda_real_m2: 0,
  perda_padrao_percentual: null,
})

const areaPecasFormatada = computed(() => Number(dados.value.area_pecas_m2 ?? 0).toFixed(2))
const retalhosFormatada = computed(() => Number(dados.value.retalhos_m2 ?? 0).toFixed(2))
const perdaRealFormatada = computed(() => Number(dados.value.perda_real_m2 ?? 0).toFixed(2))
const perdaPadraoPercentual = computed(() => {
  const p = dados.value.perda_padrao_percentual
  return p != null ? Number(p).toFixed(1) : '—'
})

const total = computed(() => {
  const a = Number(dados.value.area_pecas_m2 ?? 0)
  const r = Number(dados.value.retalhos_m2 ?? 0)
  const p = Number(dados.value.perda_real_m2 ?? 0)
  return a + r + p
})

const chartData = computed(() => {
  const a = Number(dados.value.area_pecas_m2 ?? 0)
  const r = Number(dados.value.retalhos_m2 ?? 0)
  const p = Number(dados.value.perda_real_m2 ?? 0)
  if (total.value <= 0) {
    return {
      labels: ['Sem dados'],
      datasets: [{ data: [1], backgroundColor: [COR_PERDA], borderWidth: 0 }],
    }
  }
  const labels = []
  const data = []
  const colors = []
  if (a > 0) {
    labels.push('Área útil (Peças)')
    data.push(a)
    colors.push(COR_UTIL)
  }
  if (r > 0) {
    labels.push('Retalhos')
    data.push(r)
    colors.push(COR_RETALHOS)
  }
  if (p > 0) {
    labels.push('Perda real')
    data.push(p)
    colors.push(COR_PERDA)
  }
  if (data.length === 0) {
    return {
      labels: ['Sem dados'],
      datasets: [{ data: [1], backgroundColor: [COR_PERDA], borderWidth: 0 }],
    }
  }
  return {
    labels,
    datasets: [{ data, backgroundColor: colors, borderWidth: 0 }],
  }
})

const chartOptions = {
  cutout: '58%',
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 14, padding: 12, font: { size: 12 }, color: '#64748b' } },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const v = ctx.raw || 0
          const pct = total.value > 0 ? ((v / total.value) * 100).toFixed(1) : 0
          return ` ${v.toFixed(2)} m² (${pct}%)`
        },
      },
    },
  },
}

const alertaPerdaAcima = computed(() => {
  const perdaReal = Number(dados.value.perda_real_m2 ?? 0)
  const areaPecas = Number(dados.value.area_pecas_m2 ?? 0)
  const padrao = dados.value.perda_padrao_percentual != null ? Number(dados.value.perda_padrao_percentual) : null
  if (padrao == null || areaPecas <= 0) return false
  const perdaEsperada = areaPecas * (padrao / 100)
  return perdaReal > perdaEsperada
})

async function carregar() {
  if (!props.projetoId) return
  loading.value = true
  try {
    const res = await DreDetalhadaService.getDashboardProjeto(props.projetoId)
    const data = res?.data ?? res
    if (data) {
      dados.value = {
        area_pecas_m2: data.area_pecas_m2 ?? 0,
        retalhos_m2: data.retalhos_m2 ?? 0,
        perda_real_m2: data.perda_real_m2 ?? 0,
        perda_padrao_percentual: data.perda_padrao_percentual ?? null,
      }
    }
  } catch {
    dados.value = { area_pecas_m2: 0, retalhos_m2: 0, perda_real_m2: 0, perda_padrao_percentual: null }
  } finally {
    loading.value = false
  }
}

watch(() => props.projetoId, (id) => {
  if (id) carregar()
}, { immediate: true })
</script>

