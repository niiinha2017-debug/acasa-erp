<template>
  <div class="w-full h-full animate-page-in">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Feriados"
        subtitle="Marque em quais dias a equipe terá expediente. Vale para todos (adicional 100% na folha)."
        icon="pi pi-calendar"
        :show-back="false"
      />

      <div class="px-4 md:px-6 pb-6 pt-4 border-t border-border-ui">
        <div class="rounded-2xl border border-border-ui bg-bg-card overflow-hidden shadow-sm">
          <div class="bg-bg-page/60 px-5 py-4 border-b border-border-ui">
            <p class="text-[10px] font-black text-text-soft uppercase tracking-wider mb-3">Período</p>
            <div class="flex flex-wrap items-center gap-4">
              <div>
                <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Início</label>
                <input
                  v-model="dataIni"
                  type="date"
                  class="h-11 min-w-[160px] rounded-xl border border-border-ui bg-bg-card px-4 text-sm font-bold text-text-main outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary"
                  @change="carregarFeriadosPeriodo"
                />
              </div>
              <div>
                <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Fim</label>
                <input
                  v-model="dataFim"
                  type="date"
                  class="h-11 min-w-[160px] rounded-xl border border-border-ui bg-bg-card px-4 text-sm font-bold text-text-main outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary"
                  @change="carregarFeriadosPeriodo"
                />
              </div>
            </div>
            <p class="text-xs text-text-soft mt-2">Selecione até o final do ano para ver todos os feriados e se programar.</p>
          </div>

          <div class="p-5">
            <div v-if="loadingPeriodo" class="py-8 flex items-center justify-center gap-2 text-text-soft">
              <i class="pi pi-spin pi-spinner"></i>
              <span>Carregando feriados...</span>
            </div>

            <template v-else-if="!feriadosPeriodo.length">
              <div class="py-8 text-center rounded-xl bg-bg-page/50 border border-border-ui/50">
                <i class="pi pi-calendar text-3xl text-text-soft/70 mb-2 block"></i>
                <p class="text-sm font-medium text-text-main">Nenhum feriado nacional neste período.</p>
                <p class="text-xs text-text-soft mt-1">Ajuste as datas acima (ex.: até o final do ano).</p>
              </div>
            </template>

            <template v-else>
              <p class="text-xs text-text-soft mb-4">Marque os dias em que a equipe terá expediente (adicional 100% na folha).</p>
              <ul class="space-y-3">
                <li
                  v-for="f in feriadosPeriodo"
                  :key="f.date"
                  class="flex items-center justify-between gap-4 rounded-xl border border-border-ui bg-bg-page/40 px-4 py-3.5 hover:border-brand-primary/30 transition-colors"
                >
                  <div class="min-w-0">
                    <span class="font-bold text-text-main tabular-nums">{{ formatarFeriado(f.date) }}</span>
                    <span class="text-text-soft ml-2">{{ f.name || 'Feriado' }}</span>
                  </div>
                  <label class="flex items-center gap-2.5 cursor-pointer shrink-0 select-none py-1">
                    <input
                      v-model="feriadosTrabalhados[f.date]"
                      type="checkbox"
                      class="w-5 h-5 rounded border-2 border-border-ui accent-brand-primary cursor-pointer"
                    />
                    <span class="text-xs font-bold text-text-soft">Trabalha</span>
                  </label>
                </li>
              </ul>
              <div class="mt-5 pt-4 border-t border-border-ui flex justify-end">
                <Button
                  variant="primary"
                  class="h-10 px-6 rounded-xl font-black text-[10px] uppercase"
                  :loading="savingFeriados"
                  @click="salvarFeriados"
                >
                  <i class="pi pi-save mr-2"></i>
                  Salvar
                </Button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { PontoRelatorioService } from '@/services/index'
import { notify } from '@/services/notify'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'

definePage({ meta: { perm: 'ponto_relatorio.ver' } })
const feriadosPeriodo = ref([])
const feriadosTrabalhados = ref({})
const savingFeriados = ref(false)
const loadingPeriodo = ref(false)

const hoje = new Date()
function primeiroDiaMesAtual() {
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
}
function ultimoDiaDoAno() {
  return `${hoje.getFullYear()}-12-31`
}

const dataIni = ref(primeiroDiaMesAtual())
const dataFim = ref(ultimoDiaDoAno())

function parseYmd(ymd) {
  const [y, m, d] = String(ymd || '').split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function isWithinRange(dateStr, ini, fim) {
  const d = parseYmd(dateStr)
  const di = parseYmd(ini)
  const df = parseYmd(fim)
  if (!d || !di || !df) return false
  return d >= di && d <= df
}

function formatarFeriado(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function carregarFeriadosPeriodo() {
  const ini = dataIni.value
  const fim = dataFim.value
  if (!ini || !fim) {
    feriadosPeriodo.value = []
    feriadosTrabalhados.value = {}
    return
  }

  loadingPeriodo.value = true
  feriadosPeriodo.value = []
  feriadosTrabalhados.value = {}

  try {
    const anoIni = Number(String(ini).slice(0, 4))
    const anoFim = Number(String(fim).slice(0, 4))
    const anos = []
    for (let a = anoIni; a <= anoFim; a++) anos.push(a)

    const [responses, salvosRes] = await Promise.all([
      Promise.all(anos.map((ano) => PontoRelatorioService.listarFeriadosNacionais({ ano }))),
      PontoRelatorioService.listarFeriadosConfig({ data_ini: ini, data_fim: fim }),
    ])
    const todos = (responses || []).flatMap((r) => (Array.isArray(r?.data) ? r.data : []))
    const noPeriodo = todos
      .filter((f) => f?.date && isWithinRange(f.date, ini, fim))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    const feriadosSalvos = Array.isArray(salvosRes?.data) ? salvosRes.data : []
    const mapaSalvos = new Map(
      (feriadosSalvos || []).map((f) => [String(f?.date ?? ''), !!f?.trabalha]).filter(([k]) => k)
    )

    feriadosPeriodo.value = noPeriodo
    const atual = {}
    for (const f of noPeriodo) {
      atual[f.date] = mapaSalvos.has(f.date) ? mapaSalvos.get(f.date) : false
    }
    feriadosTrabalhados.value = atual
  } catch (e) {
    feriadosPeriodo.value = []
    feriadosTrabalhados.value = {}
    notify.error(e?.response?.data?.message || 'Erro ao carregar feriados.')
  } finally {
    loadingPeriodo.value = false
  }
}

async function salvarFeriados() {
  if (!feriadosPeriodo.value.length) return notify.warn('Nenhum feriado no período para salvar.')
  try {
    savingFeriados.value = true
    const itens = feriadosPeriodo.value.map((f) => ({
      date: f.date,
      name: f.name || '',
      type: f.type || '',
      trabalha: !!feriadosTrabalhados.value?.[f.date],
    }))
    await PontoRelatorioService.salvarFeriadosConfig(itens)
    notify.success('Salvo. O adicional será aplicado na folha.')
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao salvar.')
  } finally {
    savingFeriados.value = false
  }
}

onMounted(() => {
  carregarFeriadosPeriodo()
})

watch(
  () => [dataIni.value, dataFim.value],
  () => carregarFeriadosPeriodo(),
)
</script>
