<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-5 animate-page-in">
    <div class="bg-bg-card border border-border-ui rounded-2xl shadow-sm overflow-hidden">
      <header class="p-6 border-b border-border-ui bg-bg-page/60">
        <h1 class="text-xl font-black text-text-main uppercase tracking-wide">Fechamento da Folha</h1>
        <p class="text-[11px] font-bold text-text-soft uppercase mt-2 tracking-wider">
          Horas extras sao pagas. Saldo devedor e registrado sem desconto automatico.
        </p>
      </header>

      <div class="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div class="md:col-span-3">
          <label class="text-[10px] font-black text-text-soft uppercase ml-1 mb-1 block">Inicio</label>
          <input
            v-model="filtros.data_ini"
            type="date"
            class="w-full h-11 bg-bg-page border border-border-ui rounded-xl px-4 text-xs font-bold outline-none"
          />
        </div>

        <div class="md:col-span-3">
          <label class="text-[10px] font-black text-text-soft uppercase ml-1 mb-1 block">Fim</label>
          <input
            v-model="filtros.data_fim"
            type="date"
            class="w-full h-11 bg-bg-page border border-border-ui rounded-xl px-4 text-xs font-bold outline-none"
          />
        </div>

        <div class="md:col-span-3">
          <label class="text-[10px] font-black text-text-soft uppercase ml-1 mb-1 block">Status</label>
          <select
            v-model="filtros.apenas_ativos"
            class="w-full h-11 bg-bg-page border border-border-ui rounded-xl px-4 text-xs font-bold outline-none"
          >
            <option :value="true">Somente ativos</option>
            <option :value="false">Todos</option>
          </select>
        </div>

        <div class="md:col-span-3 flex gap-2">
          <button
            type="button"
            @click="gerarFechamento"
            :disabled="loading"
            class="flex-1 h-11 rounded-xl bg-brand-primary text-white font-black text-[10px] uppercase tracking-widest"
          >
            <i class="pi pi-calculator mr-2" v-if="!loading"></i>
            <i class="pi pi-spin pi-spinner mr-2" v-else></i>
            Calcular
          </button>
          <button
            type="button"
            @click="router.push('/rh/ponto/relatorio')"
            class="h-11 px-4 rounded-xl border border-border-ui bg-bg-card text-text-muted font-black text-[10px] uppercase"
          >
            Voltar
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-6 gap-3 p-6 pt-0" v-if="linhas.length">
        <div class="rounded-xl border border-border-ui bg-bg-card p-4">
          <p class="text-[10px] font-black text-text-soft uppercase">Funcionarios</p>
          <p class="text-2xl font-black text-text-muted">{{ linhas.length }}</p>
        </div>
        <div class="rounded-xl border border-border-ui bg-bg-card p-4">
          <p class="text-[10px] font-black text-text-soft uppercase">Horas trabalhadas</p>
          <p class="text-2xl font-black text-text-muted tabular-nums">{{ totalHorasTrabalhadasHHMM }}</p>
        </div>
        <div class="rounded-xl border border-border-ui bg-bg-card p-4">
          <p class="text-[10px] font-black text-text-soft uppercase">Horas extras</p>
          <p class="text-2xl font-black text-emerald-600 tabular-nums">{{ totalHorasExtrasHHMM }}</p>
        </div>
        <div class="rounded-xl border border-border-ui bg-bg-card p-4">
          <p class="text-[10px] font-black text-text-soft uppercase">Saldo devedor</p>
          <p class="text-2xl font-black text-rose-600 tabular-nums">{{ totalSaldoDevedorHHMM }}</p>
        </div>
        <div class="rounded-xl border border-border-ui bg-bg-card p-4">
          <p class="text-[10px] font-black text-text-soft uppercase">Salario contratado</p>
          <p class="text-2xl font-black text-text-muted tabular-nums">R$ {{ totalSalarioContratado }}</p>
        </div>
        <div class="rounded-xl border border-border-ui bg-bg-card p-4">
          <p class="text-[10px] font-black text-text-soft uppercase">Salario apurado</p>
          <p class="text-2xl font-black text-brand-primary tabular-nums">R$ {{ totalSalarioApurado }}</p>
        </div>
      </div>

      <div class="p-6 pt-0">
        <div v-if="loading" class="p-10 text-center text-[11px] text-text-soft font-black uppercase">
          Calculando fechamento...
        </div>

        <div
          v-else-if="!linhas.length"
          class="p-10 rounded-2xl border border-border-ui bg-bg-page/60 text-center text-[11px] text-text-soft font-black uppercase"
        >
          Defina o periodo e clique em calcular.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full border-separate border-spacing-y-2">
            <thead>
              <tr class="text-[10px] font-black text-text-soft uppercase tracking-widest">
                <th class="px-4 py-2 text-left">Funcionario</th>
                <th class="px-4 py-2 text-right">Trabalhadas</th>
                <th class="px-4 py-2 text-right">Extras</th>
                <th class="px-4 py-2 text-right">Devedor</th>
                <th class="px-4 py-2 text-right">Custo/hora</th>
                <th class="px-4 py-2 text-right">Salario contratado</th>
                <th class="px-4 py-2 text-right">Apurado</th>
              </tr>
            </thead>
            <tbody> ? <tr ? v-for="row in linhas"
                :key="row.funcionario_id"
                class="bg-bg-card border border-border-ui hover:bg-bg-page"
              >
                <td class="px-4 py-3 rounded-l-2xl">
                  <p class="text-sm font-black text-text-muted uppercase">{{ row.nome }}</p>
                  <p class="text-[10px] font-bold text-text-soft uppercase">#{{ row.funcionario_id }}</p>
                </td>
                <td class="px-4 py-3 text-right font-black text-text-muted tabular-nums">{{ row.horas_trabalhadas_hhmm }}</td>
                <td class="px-4 py-3 text-right font-black text-emerald-600 tabular-nums">{{ row.horas_extras_hhmm }}</td>
                <td class="px-4 py-3 text-right font-black text-rose-600 tabular-nums">{{ row.saldo_devedor_hhmm }}</td>
                <td class="px-4 py-3 text-right font-black text-text-muted tabular-nums">R$ {{ row.custo_hora_fmt }}</td>
                <td class="px-4 py-3 text-right font-black text-text-muted tabular-nums">R$ {{ row.salario_contratado_fmt }}</td>
                <td class="px-4 py-3 text-right font-black text-brand-primary tabular-nums rounded-r-2xl">R$ {{ row.salario_apurado_fmt }}</td>
              </tr>
            </tbody>
          </table>
          <p class="mt-4 text-[10px] font-black uppercase text-text-soft">
            Saldo devedor foi registrado no banco sem desconto no fechamento.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PontoRelatorioService } from '@/services/index'
import { notify } from '@/services/notify'
import { horasDecimalParaHHMM } from '@/utils/utils'
import { numeroParaMoeda } from '@/utils/number'

definePage({ meta: { perm: 'ponto_relatorio.ver' } })

const router = useRouter()
const loading = ref(false)
const linhas = ref([])

const filtros = reactive({
  data_ini: '',
  data_fim: '',
  apenas_ativos: true,
})

const totalHorasTrabalhadas = computed(() => linhas.value.reduce((acc, row) => acc + row.horas_trabalhadas, 0))
const totalHorasExtras = computed(() => linhas.value.reduce((acc, row) => acc + row.horas_extras, 0))
const totalSaldoDevedor = computed(() => linhas.value.reduce((acc, row) => acc + row.saldo_devedor_horas, 0))
const totalHorasTrabalhadasHHMM = computed(() => horasDecimalParaHHMM(totalHorasTrabalhadas.value))
const totalHorasExtrasHHMM = computed(() => horasDecimalParaHHMM(totalHorasExtras.value))
const totalSaldoDevedorHHMM = computed(() => horasDecimalParaHHMM(totalSaldoDevedor.value))
const totalSalarioContratado = computed(() => {
  const total = linhas.value.reduce((acc, row) => acc + row.salario_contratado, 0)
  return numeroParaMoeda(total)
})
const totalSalarioApurado = computed(() => {
  const total = linhas.value.reduce((acc, row) => acc + row.salario_apurado, 0)
  return numeroParaMoeda(total)
})

function getHojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function getMesInicioISO() {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
}

function normalizarLinhas(lista = []) {
  return (lista || []).map((row) => {
    const horasTrabalhadas = Number(row.horas_trabalhadas || 0)
    const horasExtras = Number(row.horas_extras || 0)
    const saldoDevedor = Number(row.saldo_devedor_horas || 0)
    const custoHora = Number(row.custo_hora || 0)
    const salarioContratado = Number(row.salario_contratado || 0)
    const salarioApurado = Number(row.salario_apurado || 0)

    return {
      ...row,
      horas_trabalhadas: horasTrabalhadas,
      horas_extras: horasExtras,
      saldo_devedor_horas: saldoDevedor,
      custo_hora: custoHora,
      salario_contratado: salarioContratado,
      salario_apurado: salarioApurado,
      horas_trabalhadas_hhmm: horasDecimalParaHHMM(horasTrabalhadas),
      horas_extras_hhmm: horasDecimalParaHHMM(horasExtras),
      saldo_devedor_hhmm: horasDecimalParaHHMM(saldoDevedor),
      custo_hora_fmt: numeroParaMoeda(custoHora),
      salario_contratado_fmt: numeroParaMoeda(salarioContratado),
      salario_apurado_fmt: numeroParaMoeda(salarioApurado),
    }
  })
}

async function gerarFechamento() {
  if (!filtros.data_ini || !filtros.data_fim) {
    notify.warn('Informe inicio e fim do periodo.')
    return
  }

  try {
    loading.value = true
    const { data } = await PontoRelatorioService.fechamentoFolha({
      data_ini: filtros.data_ini,
      data_fim: filtros.data_fim,
      apenas_ativos: filtros.apenas_ativos,
    })

    linhas.value = normalizarLinhas(data.linhas || [])
    notify.success('Fechamento calculado e registrado no banco.')
  } catch (e) {
    notify.error(e.response.data.message || 'Erro ao calcular fechamento.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  filtros.data_ini = getMesInicioISO()
  filtros.data_fim = getHojeISO()
})
</script>

