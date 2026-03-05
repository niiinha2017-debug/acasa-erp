<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-xl border border-border-ui bg-bg-card">
      <PageHeader
        title="Contas a Pagar"
        subtitle="Para Fechar (compras brutas), Agendados (parcelas do fechamento) e Pagos (histórico)"
        icon="pi pi-arrow-down-right"
      />

      <div class="px-4 md:px-6 pb-5 pt-4 border-t border-border-ui space-y-4">
        <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-0 sm:min-w-[200px]">
            <label class="text-[10px] font-semibold text-slate-500 uppercase mb-1 block tracking-wide">Buscar</label>
            <input
              v-model="filtroBusca"
              type="text"
              placeholder="Fornecedor, descrição..."
              class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-300 transition-all text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div class="w-full sm:max-w-[140px]">
            <label class="text-[10px] font-semibold text-slate-500 uppercase mb-1 block tracking-wide">Período (início)</label>
            <input
              v-model="filtros.data_ini"
              type="date"
              class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-300 text-slate-700"
              @change="ajustarFimAoInicio"
            />
          </div>
          <div class="w-full sm:max-w-[140px]">
            <label class="text-[10px] font-semibold text-slate-500 uppercase mb-1 block tracking-wide">Período (fim)</label>
            <input
              v-model="filtros.data_fim"
              type="date"
              class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-300 text-slate-700"
              @change="ajustarInicioAoFim"
            />
          </div>
          <div class="text-[10px] font-medium text-slate-500 self-center">
            Data de referência: {{ DATA_REFERENCIA_LABEL }}
          </div>
          <Button @click="buscar" variant="primary" class="!h-9">
            <i class="pi pi-search mr-1.5"></i>
            Buscar
          </Button>
        </div>

        <!-- Abas: Para Fechar | Agendados | Pagos -->
        <div class="border-b border-slate-200">
          <nav class="flex gap-0">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              class="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors"
              :class="abaAtiva === tab.id
                ? 'border-slate-700 text-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
              @click="mudarAba(tab.id)"
            >
              {{ tab.label }}
              <span class="ml-1 text-slate-400">({{ tab.count }})</span>
            </button>
          </nav>
        </div>

        <!-- Tabela única densa -->
        <div class="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div v-if="loading" class="p-8 text-center text-slate-500 text-sm">Carregando...</div>
          <template v-else>
            <table class="w-full text-xs" cellpadding="0" cellspacing="0">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th class="text-left py-2 px-3 font-semibold text-slate-600 w-24">Origem</th>
                  <th class="text-left py-2 px-3 font-semibold text-slate-600 w-24">Vencimento</th>
                  <th class="text-left py-2 px-3 font-semibold text-slate-600">Fornecedor / Descrição</th>
                  <th class="text-right py-2 px-3 font-semibold text-slate-600 w-28">Valor</th>
                  <th class="text-left py-2 px-3 font-semibold text-slate-600 w-20">Status</th>
                  <th v-if="mostrarAcoes" class="text-right py-2 px-3 font-semibold text-slate-600 w-40"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in listaFiltrada"
                  :key="row.id + '-' + (row.titulo_id || '')"
                  class="border-b border-slate-100 hover:bg-slate-50/50"
                >
                  <td class="py-2 px-3 text-slate-700">{{ origemLabel(row.origem) }}</td>
                  <td class="py-2 px-3 text-slate-700 tabular-nums">{{ formatarData(row.vencimento_em) }}</td>
                  <td class="py-2 px-3">
                    <div class="font-medium text-slate-800">{{ row.fornecedor_nome || '—' }}</div>
                    <div class="text-slate-500 truncate max-w-xs">{{ row.relatorio_descritivo || row.descricao || '—' }}</div>
                  </td>
                  <td class="py-2 px-3 text-right font-semibold text-slate-800 tabular-nums">{{ formatarMoeda(row.valor) }}</td>
                  <td class="py-2 px-3 text-slate-600">{{ row.status }}</td>
                  <td v-if="mostrarAcoes" class="py-2 px-3 text-right">
                    <template v-if="abaAtiva === 'PARA_FECHAR' && row.fornecedor_id">
                      <button
                        type="button"
                        @click="abrirModalFechamento(row.fornecedor_id)"
                        class="h-7 px-2.5 rounded border border-slate-300 bg-white text-slate-700 text-[10px] font-semibold uppercase hover:bg-slate-50"
                      >
                        Fechamento
                      </button>
                    </template>
                    <template v-else-if="abaAtiva === 'AGENDADOS' && row.titulo_id && row.status !== 'PAGO'">
                      <button
                        type="button"
                        @click="darBaixaTitulo(row)"
                        class="h-7 px-2.5 rounded border border-slate-300 bg-white text-slate-700 text-[10px] font-semibold uppercase hover:bg-slate-50"
                      >
                        Pagar
                      </button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="listaFiltrada.length === 0" class="p-8 text-center text-slate-500 text-sm">
              Nenhum registro nesta aba para o período selecionado.
            </div>
          </template>
        </div>
      </div>
    </div>

    <FinanceiroModal
      v-if="modalFechamentoOpen"
      :open="modalFechamentoOpen"
      :preview="fornecedorSelecionadoParaFechamento"
      :fornecedorNome="nomeFornecedorFechamento"
      :fornecedorOptions="fornecedorOptions"
      @close="fecharModalFechamento()"
      @confirm="executarFechamentoFinal"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { FinanceiroService, FornecedorService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'

definePage({ meta: { perm: 'contas_pagar.ver' } })

const DATA_REFERENCIA = '2026-03-04'
const DATA_REFERENCIA_LABEL = (() => {
  const d = new Date(DATA_REFERENCIA + 'T12:00:00')
  return d.toLocaleDateString('pt-BR')
})()

const loading = ref(false)
const listaParaFechar = ref([])
const listaAgendados = ref([])
const listaPagos = ref([])
const filtroBusca = ref('')
const abaAtiva = ref('PARA_FECHAR')
const fornecedorOptions = ref([])
const fornecedorIdFechamentoRef = ref(null)
const modalFechamentoOpen = ref(false)
const fornecedorSelecionadoParaFechamento = ref(null)
const nomeFornecedorFechamento = computed(() => {
  const id = fornecedorIdFechamentoRef.value
  if (!id) return ''
  const o = fornecedorOptions.value.find((x) => String(x.value) === String(id))
  return o?.label || 'Fornecedor'
})

const periodoPadrao = () => {
  const d = new Date(DATA_REFERENCIA + 'T12:00:00')
  const ini = new Date(d.getFullYear(), d.getMonth(), 1)
  const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return {
    data_ini: ini.toISOString().slice(0, 10),
    data_fim: fim.toISOString().slice(0, 10),
  }
}

const filtros = reactive({
  data_ini: periodoPadrao().data_ini,
  data_fim: periodoPadrao().data_fim,
})

function ajustarFimAoInicio() {
  if (!filtros.data_ini) return
  const d = new Date(filtros.data_ini + 'T12:00:00')
  const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  filtros.data_fim = fim.toISOString().slice(0, 10)
}
function ajustarInicioAoFim() {
  if (!filtros.data_fim) return
  const d = new Date(filtros.data_fim + 'T12:00:00')
  const ini = new Date(d.getFullYear(), d.getMonth(), 1)
  filtros.data_ini = ini.toISOString().slice(0, 10)
}

const tabs = computed(() => [
  { id: 'PARA_FECHAR', label: 'Para Fechar', count: listaParaFechar.value.length },
  { id: 'AGENDADOS', label: 'Agendados', count: listaAgendados.value.length },
  { id: 'PAGOS', label: 'Pagos', count: listaPagos.value.length },
])

const listaAbaAtiva = computed(() => {
  if (abaAtiva.value === 'PARA_FECHAR') return listaParaFechar.value
  if (abaAtiva.value === 'AGENDADOS') return listaAgendados.value
  return listaPagos.value
})

const listaFiltrada = computed(() => {
  const q = (filtroBusca.value || '').trim().toLowerCase()
  const list = listaAbaAtiva.value
  if (!q) return list
  return list.filter((r) => {
    const fornecedor = (r.fornecedor_nome || '').toLowerCase()
    const descricao = (r.descricao || '').toLowerCase()
    const relatorio = (r.relatorio_descritivo || '').toLowerCase()
    return fornecedor.includes(q) || descricao.includes(q) || relatorio.includes(q)
  })
})

const mostrarAcoes = computed(() => abaAtiva.value === 'PARA_FECHAR' || abaAtiva.value === 'AGENDADOS')

function origemLabel(origem) {
  const map = { COMPRA: 'Compra', TITULO_FECHAMENTO: 'Parcela', FECHAMENTO: 'Fechamento', DESPESA: 'Despesa' }
  return map[origem] || origem || '—'
}

function mudarAba(id) {
  abaAtiva.value = id
}

function fecharModalFechamento() {
  modalFechamentoOpen.value = false
  fornecedorSelecionadoParaFechamento.value = null
  fornecedorIdFechamentoRef.value = null
}

async function abrirModalFechamento(fornecedorId) {
  if (!fornecedorId) return notify.warn('Fornecedor não informado')
  try {
    loading.value = true
    fornecedorIdFechamentoRef.value = fornecedorId
    const d = new Date(DATA_REFERENCIA + 'T12:00:00')
    const res = await FinanceiroService.previewFechamentoFornecedor({
      fornecedor_id: fornecedorId,
      mes: d.getMonth() + 1,
      ano: d.getFullYear(),
    })
    const data = res?.data ?? res
    fornecedorSelecionadoParaFechamento.value = data
    modalFechamentoOpen.value = true
  } catch (e) {
    notify.error('Não foi possível carregar o preview do fechamento')
  } finally {
    loading.value = false
  }
}

async function executarFechamentoFinal(payload) {
  try {
    loading.value = true
    await FinanceiroService.fecharMesFornecedor(payload)
    fecharModalFechamento()
    notify.success('Fechamento realizado com sucesso')
    await buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao confirmar fechamento')
  } finally {
    loading.value = false
  }
}

async function darBaixaTitulo(row) {
  const ok = await confirm.show('Confirmar Pagamento', `Deseja confirmar o pagamento de ${formatarMoeda(row.valor)}?`)
  if (!ok) return
  try {
    await FinanceiroService.pagarTitulo(row.titulo_id)
    notify.success('Pagamento registrado com sucesso.')
    await buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao registrar pagamento')
  }
}

async function buscar() {
  try {
    loading.value = true
    const params = { data_ini: filtros.data_ini, data_fim: filtros.data_fim }

    const [resPF, resAg, resPg] = await Promise.all([
      FinanceiroService.listarContasPagarConsolidado({ ...params, visao: 'PARA_FECHAR' }),
      FinanceiroService.listarContasPagarConsolidado({ ...params, visao: 'AGENDADOS' }),
      FinanceiroService.listarContasPagarConsolidado({ ...params, visao: 'PAGOS' }),
    ])

    listaParaFechar.value = Array.isArray(resPF?.data) ? resPF.data : (Array.isArray(resPF) ? resPF : [])
    listaAgendados.value = Array.isArray(resAg?.data) ? resAg.data : (Array.isArray(resAg) ? resAg : [])
    listaPagos.value = Array.isArray(resPg?.data) ? resPg.data : (Array.isArray(resPg) ? resPg : [])
  } catch (e) {
    notify.error('Erro ao carregar contas a pagar')
    listaParaFechar.value = []
    listaAgendados.value = []
    listaPagos.value = []
  } finally {
    loading.value = false
  }
}

const formatarMoeda = (v) => (v != null && v !== '') ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'
const formatarData = (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '—'

watch(
  () => [filtros.data_ini, filtros.data_fim],
  () => { buscar() },
  { deep: true }
)

onMounted(async () => {
  try {
    const res = await FornecedorService.listar()
    const lista = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    fornecedorOptions.value = (lista || []).map((f) => ({
      label: f.nome_fantasia || f.razao_social || String(f.id),
      value: f.id,
    }))
  } catch (e) {
    console.error('Erro ao carregar fornecedores:', e)
    fornecedorOptions.value = []
  }
  await buscar()
})
</script>
