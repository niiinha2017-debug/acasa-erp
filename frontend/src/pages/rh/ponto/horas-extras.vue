<template>
  <PageShell :padded="false">
    <section class="rh-feriados ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Feriados"
        subtitle="Defina quais feriados terão expediente da equipe no período selecionado."
        icon="pi pi-calendar"
        :show-back="false"
      />

      <div class="rh-feriados__body ds-page-context__content">
        <div class="rh-feriados__filters">
          <div class="rh-feriados__period grid gap-4 md:grid-cols-[minmax(0,180px)_minmax(0,180px)_1fr] md:items-end">
            <div>
              <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Início</label>
              <input
                v-model="dataIni"
                type="date"
                class="rh-feriados__date-input h-11 w-full text-sm font-bold text-text-main outline-none"
                @change="carregarFeriadosPeriodo"
              />
            </div>
            <div>
              <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Fim</label>
              <input
                v-model="dataFim"
                type="date"
                class="rh-feriados__date-input h-11 w-full text-sm font-bold text-text-main outline-none"
                @change="carregarFeriadosPeriodo"
              />
            </div>
            <p class="text-xs text-text-soft md:pb-2">Selecione o intervalo desejado. Para planejamento anual, use uma data final até dezembro.</p>
          </div>

          <div class="rh-feriados__metrics grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <div class="rh-feriados__metric">
              <p class="text-[10px] font-black uppercase tracking-wider text-text-soft">Feriados no período</p>
              <p class="mt-2 text-lg font-black text-text-main tabular-nums">{{ totalFeriados }}</p>
            </div>
            <div class="rh-feriados__metric">
              <p class="text-[10px] font-black uppercase tracking-wider text-text-soft">Com expediente</p>
              <p class="mt-2 text-lg font-black text-[color:var(--ds-color-primary)] tabular-nums">{{ totalComExpediente }}</p>
            </div>
            <div class="rh-feriados__metric">
              <p class="text-[10px] font-black uppercase tracking-wider text-text-soft">Sem expediente</p>
              <p class="mt-2 text-lg font-black text-text-main tabular-nums">{{ totalSemExpediente }}</p>
            </div>
            <div class="rh-feriados__metric">
              <p class="text-[10px] font-black uppercase tracking-wider text-text-soft">Situação</p>
              <p class="mt-2 text-sm font-bold text-text-main">{{ savingFeriados ? 'Salvando alterações...' : 'Ajustes disponíveis' }}</p>
            </div>
          </div>
        </div>

        <div v-if="loadingPeriodo" class="rh-feriados__loading py-10 flex items-center justify-center gap-2 text-text-soft">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Carregando feriados...</span>
        </div>

        <template v-else-if="!feriadosPeriodo.length">
          <div class="rh-feriados__empty py-10 text-center">
            <i class="pi pi-calendar text-3xl text-text-soft/70 mb-2 block"></i>
            <p class="text-sm font-medium text-text-main">Nenhum feriado nacional neste período.</p>
            <p class="text-xs text-text-soft mt-1">Ajuste o intervalo de datas para visualizar outras datas.</p>
          </div>
        </template>

        <template v-else>
          <div class="rh-feriados__list-head">
            <p class="text-xs text-text-soft">Marque os feriados com expediente. Os demais serão considerados folga da equipe no período.</p>
            <Button
              variant="primary"
              class="h-10 px-6 rounded-xl font-black text-[10px] uppercase"
              :loading="savingFeriados"
              @click="salvarFeriados"
            >
              <i class="pi pi-save mr-2"></i>
              Salvar ajustes
            </Button>
          </div>

          <ul class="rh-feriados__list">
            <li
              v-for="f in feriadosPeriodo"
              :key="f.date"
              class="rh-feriados__row"
            >
              <div class="min-w-0">
                <span class="font-bold text-text-main tabular-nums">{{ formatarFeriado(f.date) }}</span>
                <span class="text-text-soft ml-2">{{ f.name || 'Feriado' }}</span>
              </div>
              <label class="rh-feriados__toggle flex items-center gap-2.5 cursor-pointer shrink-0 select-none py-1">
                <input
                  v-model="feriadosTrabalhados[f.date]"
                  type="checkbox"
                  class="w-5 h-5 rounded border-2 border-border-ui accent-brand-primary cursor-pointer"
                />
                <span class="text-xs font-bold text-text-soft">Trabalha</span>
              </label>
            </li>
          </ul>
        </template>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { PontoRelatorioService } from '@/services/index'
import { notify } from '@/services/notify'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import PageShell from '@/components/ui/PageShell.vue'

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

const totalFeriados = computed(() => feriadosPeriodo.value.length)
const totalComExpediente = computed(() =>
  feriadosPeriodo.value.filter((f) => !!feriadosTrabalhados.value?.[f.date]).length,
)
const totalSemExpediente = computed(() => Math.max(totalFeriados.value - totalComExpediente.value, 0))

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

<style scoped>
.rh-feriados__body {
  width: min(100%, 1380px);
  margin: 0 auto;
  padding: 0.85rem 1rem 1.5rem;
}

.rh-feriados__filters {
  padding: 0 0 1.1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-primary) 10%, var(--ds-color-border) 90%);
}

.rh-feriados__date-input {
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: 0;
  background: transparent;
  padding: 0 0 0.1rem;
  box-shadow: none;
}

.rh-feriados__date-input:focus {
  border-bottom-color: color-mix(in srgb, var(--ds-color-primary) 45%, var(--ds-color-border) 55%);
  box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--ds-color-primary) 45%, var(--ds-color-border) 55%);
}

.rh-feriados__metrics {
  gap: 0.75rem;
}

.rh-feriados__metric {
  padding: 0.95rem 0 0.25rem;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-primary) 10%, var(--ds-color-border) 90%);
}

.rh-feriados__list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
}

.rh-feriados__list {
  border-top: 1px solid var(--ds-color-border);
}

.rh-feriados__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 86%, transparent);
}

.rh-feriados__toggle {
  min-width: 110px;
  justify-content: flex-end;
}

.rh-feriados__empty,
.rh-feriados__loading {
  border-top: 1px dashed color-mix(in srgb, var(--ds-color-primary) 16%, var(--ds-color-border) 84%);
  border-bottom: 1px dashed color-mix(in srgb, var(--ds-color-primary) 10%, var(--ds-color-border) 90%);
}

.rh-feriados :deep(.ds-shell-card) {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.rh-feriados :deep(.ds-header-block) {
  padding-left: 1rem;
  padding-right: 1rem;
}

.dark .rh-feriados__filters,
.dark .rh-feriados__metric,
.dark .rh-feriados__empty,
.dark .rh-feriados__loading {
  border-color: color-mix(in srgb, var(--ds-color-primary) 20%, var(--ds-color-border) 80%);
}

.dark .rh-feriados__row {
  border-bottom-color: color-mix(in srgb, var(--ds-color-border) 76%, transparent);
}

@media (max-width: 767px) {
  .rh-feriados__list-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .rh-feriados__row {
    align-items: flex-start;
    flex-direction: column;
  }

  .rh-feriados__toggle {
    justify-content: flex-start;
    min-width: 0;
  }
}

@media (min-width: 768px) {
  .rh-feriados__body {
    padding: 1rem 1.5rem 1.75rem;
  }

  .rh-feriados :deep(.ds-header-block) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .rh-feriados__body {
    padding: 1rem 2rem 2rem;
  }

  .rh-feriados :deep(.ds-header-block) {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
</style>
