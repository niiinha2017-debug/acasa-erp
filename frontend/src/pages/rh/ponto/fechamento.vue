<template>
  <div class="w-full h-full animate-page-in">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Fechamento de Folha"
        subtitle="Resumo por funcionário no período: horas trabalhadas, extras e custo devido (pagamento)."
        icon="pi pi-wallet"
        :show-back="false"
      />

      <div class="px-4 md:px-6 pb-6 pt-4 border-t border-border-ui">
        <div class="rounded-2xl border border-border-ui bg-bg-page/40 p-5 mb-6">
          <p class="text-[10px] font-black text-text-soft uppercase tracking-wider mb-3">Período</p>
          <div class="flex flex-wrap items-end gap-4">
            <div>
              <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Data início</label>
              <input
                v-model="dataIni"
                type="date"
                class="h-11 min-w-[160px] rounded-xl border border-border-ui bg-bg-card px-4 text-sm font-bold text-text-main outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary"
                @change="buscar"
              />
            </div>
            <div>
              <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Data fim</label>
              <input
                v-model="dataFim"
                type="date"
                class="h-11 min-w-[160px] rounded-xl border border-border-ui bg-bg-card px-4 text-sm font-bold text-text-main outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary"
                @change="buscar"
              />
            </div>
            <Button
              variant="primary"
              class="h-11 px-5 rounded-xl font-black text-[10px] uppercase"
              :loading="loading"
              @click="buscar"
            >
              <i class="pi pi-refresh mr-2 text-xs"></i>
              Atualizar
            </Button>
          </div>
        </div>

        <div v-if="funcionariosSemCarga.length" class="mb-4 p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200">
          <p class="text-sm font-semibold flex items-center gap-2">
            <i class="pi pi-exclamation-triangle"></i>
            Funcionários sem carga horária cadastrada (não entram no fechamento):
          </p>
          <p class="text-xs mt-1">{{ funcionariosSemCarga.join(', ') }}</p>
          <p class="text-xs mt-2 opacity-90">Cadastre carga horária (dia/semana ou horários) em Cadastro de Funcionários para incluí-los.</p>
        </div>

        <div v-if="loading && !linhas.length" class="py-12 flex items-center justify-center gap-2 text-text-soft">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Carregando fechamento...</span>
        </div>

        <template v-else-if="linhas.length">
          <div class="native-table-flush border-y border-border-ui bg-bg-card overflow-hidden shadow-sm">
            <div class="native-table-flush-scroll overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-bg-page/60 border-b border-border-ui">
                  <tr>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft">Funcionário</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Horas trab.</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Horas extras</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Saldo devedor</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Feriados trab.</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-right">Custo devido</th>
                    <th class="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-text-soft text-center w-32">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in linhas"
                    :key="row.funcionario_id"
                    class="border-b border-border-ui/50 hover:bg-bg-page/30 transition-colors"
                    :class="row.sem_carga ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''"
                  >
                    <td class="px-4 py-3 font-semibold text-text-main">
                      {{ row.nome }}
                      <span v-if="row.sem_carga" class="ml-2 text-[10px] font-normal text-amber-700 dark:text-amber-400">(sem carga horária)</span>
                    </td>
                    <td class="px-4 py-3 text-text-main text-right tabular-nums">{{ row.horas_trabalhadas_hhmm }}</td>
                    <td class="px-4 py-3 text-text-main text-right tabular-nums">{{ row.horas_extras_hhmm }}</td>
                    <td class="px-4 py-3 text-text-main text-right tabular-nums">{{ row.saldo_devedor_hhmm }}</td>
                    <td class="px-4 py-3 text-text-main text-right tabular-nums">{{ row.feriados_trabalhados_qtd }}</td>
                    <td class="px-4 py-3 font-bold text-text-main text-right tabular-nums">{{ formatarMoeda(row.custo_devido) }}</td>
                    <td class="px-4 py-3 text-center">
                      <button
                        v-if="!row.sem_carga && Number(row.custo_devido) > 0"
                        type="button"
                        class="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl border border-brand-primary/50 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white font-semibold text-xs transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        :disabled="pagandoId === row.funcionario_id"
                        :title="'Efetuar pagamento – ' + formatarMoeda(row.custo_devido)"
                        @click="efetuarPagamento(row)"
                      >
                        <i v-if="pagandoId === row.funcionario_id" class="pi pi-spin pi-spinner" />
                        <i v-else class="pi pi-wallet" />
                        {{ pagandoId === row.funcionario_id ? 'Gerando...' : 'Efetuar Pagamento' }}
                      </button>
                      <span v-else-if="!row.sem_carga && Number(row.custo_devido) === 0" class="text-[10px] text-text-soft">—</span>
                      <span v-else class="text-[10px] text-text-soft">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <div v-else class="py-12 text-center rounded-2xl bg-bg-page/50 border border-border-ui/50">
          <i class="pi pi-wallet text-4xl text-text-soft/70 mb-3 block"></i>
          <p class="text-sm font-medium text-text-main">Nenhum dado no período.</p>
          <p class="text-xs text-text-soft mt-1">Ajuste as datas e clique em Atualizar.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { PontoRelatorioService } from '@/services/index'
import { notify } from '@/services/notify'
import { numeroParaMoeda } from '@/utils/number'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'

definePage({ meta: { perm: 'despesas.ver' } })

const loading = ref(false)
const linhas = ref([])
const funcionariosSemCarga = ref([])
const dataIni = ref('')
const dataFim = ref('')
const pagandoId = ref(null)

function primeiroDiaMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function ultimoDiaMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
}

function formatarMoeda(val) {
  return numeroParaMoeda(Number(val) || 0)
}

async function buscar() {
  const ini = dataIni.value || primeiroDiaMes()
  const fim = dataFim.value || ultimoDiaMes()
  if (!ini || !fim) return
  loading.value = true
  linhas.value = []
  funcionariosSemCarga.value = []
  try {
    const { data } = await PontoRelatorioService.fechamentoFolha({
      data_ini: ini,
      data_fim: fim,
      apenas_ativos: true,
    })
    linhas.value = data?.linhas ?? []
    funcionariosSemCarga.value = data?.funcionarios_sem_carga ?? []
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao carregar fechamento.')
    linhas.value = []
    funcionariosSemCarga.value = []
  } finally {
    loading.value = false
  }
}

function refMesAnoFromDataFim() {
  const s = (dataFim.value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date()
    return { ref_mes: d.getMonth() + 1, ref_ano: d.getFullYear() }
  }
  const [y, m] = s.split('-').map(Number)
  return { ref_mes: m, ref_ano: y }
}

async function efetuarPagamento(row) {
  const { ref_mes, ref_ano } = refMesAnoFromDataFim()
  pagandoId.value = row.funcionario_id
  try {
    await PontoRelatorioService.efetuarPagamentoFolha({
      funcionario_id: row.funcionario_id,
      nome: row.nome || '',
      custo_devido: Number(row.custo_devido) || 0,
      ref_mes,
      ref_ano,
    })
    notify.success('Pagamento efetuado. O lançamento foi criado no Financeiro (Despesas) e já aparece nos Custos de Estrutura.')
    await buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao efetuar pagamento.')
  } finally {
    pagandoId.value = null
  }
}

onMounted(() => {
  dataIni.value = primeiroDiaMes()
  dataFim.value = ultimoDiaMes()
  buscar()
})
</script>
