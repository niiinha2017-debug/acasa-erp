<template>
  <div class="w-full h-full animate-page-in">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Cálculo de Horas Extras"
        subtitle="Acréscimo de 50% sobre o custo/hora do salário"
        icon="pi pi-calculator"
        :show-back="false"
      >
        <template #actions>
          <Button variant="outline" @click="router.push('/rh/ponto/relatorio')">
            <i class="pi pi-arrow-left mr-2"></i>
            Voltar ao relatório
          </Button>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-6 pt-4 border-t border-border-ui">
        <div class="rounded-2xl border border-border-ui bg-bg-page/40 p-5 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div class="md:col-span-4">
              <label class="text-[10px] font-black text-text-soft uppercase ml-2 mb-1 block">Funcionário (opcional)</label>
              <SearchInput
                v-model="filtros.funcionario_id"
                mode="select"
                placeholder="Todos os funcionários..."
                :options="funcionarioOptions"
                labelKey="label"
                valueKey="value"
              />
            </div>
            <div class="md:col-span-3">
              <label class="text-[10px] font-black text-text-soft uppercase ml-2 mb-1 block">Início</label>
              <input
                v-model="filtros.data_ini"
                type="date"
                class="w-full h-11 bg-bg-card border border-border-ui rounded-xl px-4 text-xs font-bold text-text-main outline-none"
              />
            </div>
            <div class="md:col-span-3">
              <label class="text-[10px] font-black text-text-soft uppercase ml-2 mb-1 block">Fim</label>
              <input
                v-model="filtros.data_fim"
                type="date"
                class="w-full h-11 bg-bg-card border border-border-ui rounded-xl px-4 text-xs font-bold text-text-main outline-none"
              />
            </div>
            <div class="md:col-span-2 flex justify-end">
              <Button
                variant="primary"
                class="h-11 px-5 rounded-xl font-black text-[10px] uppercase w-full md:w-auto"
                :loading="loading"
                @click="calcular"
              >
                <i class="pi pi-calculator mr-2 text-xs"></i>
                Calcular
              </Button>
            </div>
          </div>
        </div>

        <div v-if="filtros.data_ini && filtros.data_fim" class="rounded-2xl border border-border-ui bg-bg-page/30 p-4 mb-6">
          <div class="flex items-center justify-between gap-3 mb-3">
            <div>
              <p class="text-[10px] font-black uppercase tracking-wider text-text-soft">Base de cálculo (feriados)</p>
              <p class="text-xs text-text-soft">Marque se houve jornada normal no feriado. Isso impacta o cálculo de horas extras.</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase text-text-soft">
                Feriados no período: {{ feriadosPeriodo.length }}
              </span>
              <Button
                variant="secondary"
                class="h-8 px-3 rounded-lg font-black text-[10px] uppercase"
                :loading="savingFeriados"
                @click="salvarFeriados"
              >
                Salvar
              </Button>
            </div>
          </div>
          <div v-if="feriadosPeriodo.length" class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label
              v-for="f in feriadosPeriodo"
              :key="f.date"
              class="flex items-center justify-between rounded-xl border border-border-ui bg-bg-card px-3 py-2"
            >
              <div class="min-w-0 pr-3">
                <p class="text-xs font-bold text-text-main truncate">
                  {{ formatarFeriado(f.date) }} - {{ f.name || 'Feriado' }}
                </p>
                <p class="text-[10px] uppercase text-text-soft">Sem meta por padrão</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-[10px] font-bold uppercase text-text-soft">Trabalha</span>
                <input
                  v-model="feriadosTrabalhados[f.date]"
                  type="checkbox"
                  class="w-4 h-4 accent-brand-primary"
                />
              </div>
            </label>
          </div>
          <div v-else class="text-xs text-text-soft">
            Não há feriados nacionais neste intervalo.
          </div>
        </div>

        <div v-if="linhas.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div class="rounded-xl border border-border-ui bg-bg-card p-4">
            <p class="text-[10px] font-black uppercase text-text-soft">Funcionários</p>
            <p class="text-2xl font-black text-text-main tabular-nums">{{ linhas.length }}</p>
          </div>
          <div class="rounded-xl border border-border-ui bg-bg-card p-4">
            <p class="text-[10px] font-black uppercase text-text-soft">Horas extras</p>
            <p class="text-2xl font-black text-emerald-600 tabular-nums">{{ totalHorasExtrasHHMM }}</p>
          </div>
          <div class="rounded-xl border border-border-ui bg-bg-card p-4">
            <p class="text-[10px] font-black uppercase text-text-soft">Adicional 50%</p>
            <p class="text-lg font-black text-brand-primary tabular-nums">R$ {{ totalAdicional50Fmt }}</p>
          </div>
          <div class="rounded-xl border border-border-ui bg-bg-card p-4">
            <p class="text-[10px] font-black uppercase text-text-soft">Valor hora extra</p>
            <p class="text-lg font-black text-text-main tabular-nums">R$ {{ mediaHoraExtraFmt }}</p>
          </div>
          <div class="rounded-xl border border-border-ui bg-bg-card p-4">
            <p class="text-[10px] font-black uppercase text-text-soft">Total horas extras</p>
            <p class="text-lg font-black text-emerald-600 tabular-nums">R$ {{ totalHorasExtrasValorFmt }}</p>
          </div>
        </div>

        <div v-if="loading" class="p-8 text-center text-sm font-bold text-text-soft uppercase">
          Calculando horas extras...
        </div>
        <div v-else-if="!linhas.length" class="p-8 text-center text-sm font-bold text-text-soft uppercase rounded-xl border border-border-ui bg-bg-page/40">
          Defina período e clique em calcular.
        </div>
        <div v-else class="rounded-xl border border-border-ui bg-bg-card overflow-x-auto">
          <table class="w-full min-w-[980px]">
            <thead class="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th class="px-4 py-3 text-left text-[10px] font-black uppercase text-text-soft">Funcionário</th>
                <th class="px-4 py-3 text-right text-[10px] font-black uppercase text-text-soft">Horas extras</th>
                <th class="px-4 py-3 text-right text-[10px] font-black uppercase text-text-soft">Custo/hora</th>
                <th class="px-4 py-3 text-right text-[10px] font-black uppercase text-text-soft">Hora extra (150%)</th>
                <th class="px-4 py-3 text-right text-[10px] font-black uppercase text-text-soft">Adicional 50%</th>
                <th class="px-4 py-3 text-right text-[10px] font-black uppercase text-text-soft">Total extras</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in linhas"
                :key="row.funcionario_id"
                class="border-t border-border-ui/60"
              >
                <td class="px-4 py-3">
                  <p class="text-sm font-bold text-text-main uppercase">{{ row.nome }}</p>
                  <p class="text-[10px] text-text-soft">#{{ row.funcionario_id }}</p>
                </td>
                <td class="px-4 py-3 text-right tabular-nums font-bold text-emerald-600">{{ row.horas_extras_hhmm }}</td>
                <td class="px-4 py-3 text-right tabular-nums font-bold text-text-main">R$ {{ row.custo_hora_fmt }}</td>
                <td class="px-4 py-3 text-right tabular-nums font-bold text-text-main">R$ {{ row.valor_hora_extra_fmt }}</td>
                <td class="px-4 py-3 text-right tabular-nums font-bold text-brand-primary">R$ {{ row.adicional_hora_extra_fmt }}</td>
                <td class="px-4 py-3 text-right tabular-nums font-black text-emerald-600">R$ {{ row.valor_total_horas_extras_fmt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PontoRelatorioService } from '@/services/index'
import { notify } from '@/services/notify'
import { horasDecimalParaHHMM } from '@/utils/utils'
import { numeroParaMoeda } from '@/utils/number'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

definePage({ meta: { perm: 'ponto_relatorio.ver' } })

const router = useRouter()
const loading = ref(false)
const linhas = ref([])
const funcionarioOptions = ref([])
const feriadosPeriodo = ref([])
const feriadosTrabalhados = ref({})
const savingFeriados = ref(false)

const filtros = reactive({
  funcionario_id: '',
  data_ini: '',
  data_fim: '',
  apenas_ativos: true,
})

const totalHorasExtras = computed(() =>
  linhas.value.reduce((acc, row) => acc + Number(row.horas_extras || 0), 0),
)
const totalHorasExtrasHHMM = computed(() => horasDecimalParaHHMM(totalHorasExtras.value))
const totalAdicional50 = computed(() =>
  linhas.value.reduce((acc, row) => acc + Number(row.adicional_hora_extra || 0), 0),
)
const totalHorasExtrasValor = computed(() =>
  linhas.value.reduce((acc, row) => acc + Number(row.valor_total_horas_extras || 0), 0),
)
const mediaHoraExtra = computed(() => {
  if (!linhas.value.length) return 0
  const soma = linhas.value.reduce((acc, row) => acc + Number(row.valor_hora_extra || 0), 0)
  return soma / linhas.value.length
})

const totalAdicional50Fmt = computed(() => numeroParaMoeda(totalAdicional50.value))
const totalHorasExtrasValorFmt = computed(() => numeroParaMoeda(totalHorasExtrasValor.value))
const mediaHoraExtraFmt = computed(() => numeroParaMoeda(mediaHoraExtra.value))

function getHojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function getMesInicioISO() {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
}

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
  if (!filtros.data_ini || !filtros.data_fim) {
    feriadosPeriodo.value = []
    feriadosTrabalhados.value = {}
    return
  }
  const anoIni = Number(String(filtros.data_ini).slice(0, 4))
  const anoFim = Number(String(filtros.data_fim).slice(0, 4))
  if (!anoIni || !anoFim) return

  try {
    const anos = []
    for (let ano = anoIni; ano <= anoFim; ano += 1) anos.push(ano)
    const [responses, salvosRes] = await Promise.all([
      Promise.all(anos.map((ano) => PontoRelatorioService.listarFeriadosNacionais({ ano }))),
      PontoRelatorioService.listarFeriadosConfig({
        data_ini: filtros.data_ini,
        data_fim: filtros.data_fim,
      }),
    ])
    const todos = responses.flatMap((r) => (Array.isArray(r?.data) ? r.data : []))
    const noPeriodo = todos
      .filter((f) => f?.date && isWithinRange(f.date, filtros.data_ini, filtros.data_fim))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    const feriadosSalvos = Array.isArray(salvosRes?.data) ? salvosRes.data : []
    const mapaSalvos = new Map(
      feriadosSalvos.map((f) => [String(f.date), !!f.trabalha]),
    )

    feriadosPeriodo.value = noPeriodo
    const atual = { ...(feriadosTrabalhados.value || {}) }
    for (const f of noPeriodo) {
      atual[f.date] = mapaSalvos.has(f.date) ? mapaSalvos.get(f.date) : false
    }
    feriadosTrabalhados.value = atual
  } catch (e) {
    feriadosPeriodo.value = []
    feriadosTrabalhados.value = {}
  }
}

async function salvarFeriados() {
  if (!feriadosPeriodo.value.length) return notify.warn('Sem feriados no período para salvar.')
  try {
    savingFeriados.value = true
    const itens = feriadosPeriodo.value.map((f) => ({
      date: f.date,
      name: f.name || '',
      type: f.type || '',
      trabalha: !!feriadosTrabalhados.value?.[f.date],
    }))
    await PontoRelatorioService.salvarFeriadosConfig(itens)
    notify.success('Base de feriados salva.')
    await calcular()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao salvar feriados.')
  } finally {
    savingFeriados.value = false
  }
}

function normalizarLinhas(lista = []) {
  return (lista || []).map((row) => {
    const horasExtras = Number(row.horas_extras || 0)
    const custoHora = Number(row.custo_hora || 0)
    const valorHoraExtra = Number(row.valor_hora_extra || 0)
    const adicionalHoraExtra = Number(row.adicional_hora_extra || 0)
    const valorTotalHorasExtras = Number(row.valor_total_horas_extras || 0)

    return {
      ...row,
      horas_extras: horasExtras,
      custo_hora: custoHora,
      valor_hora_extra: valorHoraExtra,
      adicional_hora_extra: adicionalHoraExtra,
      valor_total_horas_extras: valorTotalHorasExtras,
      horas_extras_hhmm: horasDecimalParaHHMM(horasExtras),
      custo_hora_fmt: numeroParaMoeda(custoHora),
      valor_hora_extra_fmt: numeroParaMoeda(valorHoraExtra),
      adicional_hora_extra_fmt: numeroParaMoeda(adicionalHoraExtra),
      valor_total_horas_extras_fmt: numeroParaMoeda(valorTotalHorasExtras),
    }
  })
}

async function calcular() {
  if (!filtros.data_ini || !filtros.data_fim) {
    notify.warn('Informe início e fim do período.')
    return
  }
  try {
    loading.value = true
    const { data } = await PontoRelatorioService.fechamentoFolha({
      data_ini: filtros.data_ini,
      data_fim: filtros.data_fim,
      apenas_ativos: filtros.apenas_ativos,
      funcionario_id: filtros.funcionario_id || undefined,
    })
    const lista = data?.linhas || []
    linhas.value = normalizarLinhas(
      lista.filter((row) => Number(row?.horas_extras || 0) > 0),
    )
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao calcular horas extras.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  filtros.data_ini = getMesInicioISO()
  filtros.data_fim = getHojeISO()
  try {
    const { data } = await PontoRelatorioService.listarFuncionariosAtivos()
    const lista = data?.data || data || []
    funcionarioOptions.value = (Array.isArray(lista) ? lista : []).map((f) => ({
      label: `${String(f.nome || '').toUpperCase()} #${f.id}`,
      value: f.id,
    }))
  } catch (e) {
    funcionarioOptions.value = []
  }
  await carregarFeriadosPeriodo()
})

watch(
  () => [filtros.data_ini, filtros.data_fim],
  async ([ini, fim], [oldIni, oldFim]) => {
    if (ini === oldIni && fim === oldFim) return
    await carregarFeriadosPeriodo()
  },
)
</script>
