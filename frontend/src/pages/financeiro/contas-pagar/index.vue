<template>
  <PageHeader
    title="Contas a Pagar"
    subtitle="Lista agrupada por fornecedor e data"
    icon="pi pi-arrow-down-right"
  >
    <template #actions>
      <Button
        @click="abrirModalFechamento"
        variant="secondary"
        size="sm"
      >
        <i class="pi pi-calendar-times mr-2"></i>
        Novo Fechamento Mensal
      </Button>
    </template>
  </PageHeader>

  <div class="space-y-4">
    <div class="rounded-xl border border-slate-200 bg-white p-2 flex flex-wrap items-center gap-2">
      <button
        v-for="aba in abas"
        :key="aba.key"
        type="button"
        @click="selecionarAba(aba.key)"
        :class="[
          'h-9 px-4 rounded-lg text-xs font-black uppercase tracking-wider border transition-all',
          abaAtiva === aba.key
            ? 'bg-slate-900 text-white border-slate-900'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100',
        ]"
      >
        {{ aba.label }}
      </button>

      <Button
        @click="buscar"
        variant="primary"
        class="!h-9 !w-9 !flex items-center justify-center !p-0 ml-auto"
      >
        <i class="pi pi-refresh text-xs"></i>
      </Button>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-3 grid grid-cols-12 gap-3">
      <div class="col-span-12 md:col-span-3">
        <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Data inicial</label>
        <input
          v-model="filtros.data_ini"
          type="date"
          class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-slate-700"
        >
      </div>

      <div class="col-span-12 md:col-span-3">
        <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Data final</label>
        <input
          v-model="filtros.data_fim"
          type="date"
          class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-slate-700"
        >
      </div>

      <div class="col-span-12 md:col-span-6 flex items-end gap-2">
        <Button @click="aplicarMesVigente" variant="secondary" class="!h-10">
          Mes vigente
        </Button>
        <Button @click="buscar" variant="primary" class="!h-10">
          Aplicar filtro
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-3">
      <div class="col-span-12 md:col-span-3 rounded-xl border border-slate-200 bg-white p-3">
        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total periodo</div>
        <div class="text-lg font-black text-slate-900">{{ formatarMoeda(resumoPeriodo.totalValor) }}</div>
        <div class="text-xs font-bold text-slate-500">{{ resumoPeriodo.totalQtd }} lancamento(s)</div>
      </div>

      <div class="col-span-12 md:col-span-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Em aberto</div>
        <div class="text-lg font-black text-amber-700">{{ formatarMoeda(resumoPeriodo.abertoValor) }}</div>
        <div class="text-xs font-bold text-amber-600">{{ resumoPeriodo.abertoQtd }} lancamento(s)</div>
      </div>

      <div class="col-span-12 md:col-span-3 rounded-xl border border-red-100 bg-red-50 p-3">
        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Vencido</div>
        <div class="text-lg font-black text-red-700">{{ formatarMoeda(resumoPeriodo.vencidoValor) }}</div>
        <div class="text-xs font-bold text-red-600">{{ resumoPeriodo.vencidoQtd }} lancamento(s)</div>
      </div>

      <div class="col-span-12 md:col-span-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Pago</div>
        <div class="text-lg font-black text-emerald-700">{{ formatarMoeda(resumoPeriodo.pagoValor) }}</div>
        <div class="text-xs font-bold text-emerald-600">{{ resumoPeriodo.pagoQtd }} lancamento(s)</div>
      </div>
    </div>

    <div v-if="!loading && gruposContas.length === 0" class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table
        :columns="columns"
        :rows="[]"
        :loading="false"
        empty-text="Nenhum registro encontrado."
        :boxed="false"
      />
    </div>

    <div v-else class="space-y-4">
      <section
        v-for="grupo in gruposContas"
        :key="grupo.key"
        class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
      >
        <div class="px-4 py-3 border-b border-slate-200 bg-slate-50/70">
          <h3 class="text-sm font-black uppercase tracking-tight text-slate-800">{{ grupo.nome }}</h3>
        </div>

        <div class="space-y-3 p-3">
          <div
            v-for="blocoData in grupo.datas"
            :key="blocoData.key"
            class="rounded-lg border border-slate-200 overflow-hidden"
          >
            <div class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
              <p class="text-xs font-black uppercase tracking-wide text-slate-700">{{ blocoData.label }}</p>
              <div class="flex items-center gap-2">
                <button
                  v-if="blocoData.qtdCompras > 0"
                  type="button"
                  @click="toggleCompras(blocoData.keyGlobal)"
                  class="h-7 px-3 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all"
                  :class="comprasExpandidas[blocoData.keyGlobal]
                    ? 'bg-orange-100 text-orange-700 border-orange-200'
                    : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'"
                >
                  {{ comprasExpandidas[blocoData.keyGlobal] ? 'Ocultar compras' : `Mostrar compras (${blocoData.qtdCompras})` }}
                </button>
                <p class="text-xs font-bold text-slate-600 tabular-nums">{{ blocoData.rows.length }} lancamento(s)</p>
              </div>
            </div>

            <Table
              :columns="columns"
              :rows="getRowsVisiveis(blocoData)"
              :loading="loading"
              empty-text="Nenhum registro encontrado."
              :boxed="false"
            >
              <template #cell-data_ref="{ row }">
                <span class="text-xs font-bold text-slate-700">
                  {{ getDataReferenciaLabel(row) }}
                </span>
              </template>

              <template #cell-origem="{ row }">
                <span
                  :class="getOrigemClass(row.origem)"
                  class="px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider inline-block"
                >
                  {{ row.origem }}
                </span>
              </template>

              <template #cell-descricao="{ row }">
                <div class="flex flex-col">
                  <span class="text-sm font-bold text-slate-800 uppercase tracking-tight">
                    {{ row.descricao || '-' }}
                  </span>
                  <span class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                    {{ row.observacao || '-' }}
                  </span>
                </div>
              </template>

              <template #cell-valor="{ row }">
                <span class="text-sm font-black text-slate-800 tabular-nums">
                  {{ formatarMoeda(row.valor) }}
                </span>
              </template>

              <template #cell-status="{ row }">
                <StatusBadge :value="row.status" />
              </template>

              <template #cell-acoes="{ row }">
                <div class="flex justify-end gap-2">
                  <button
                    v-if="podeDarBaixa(row)"
                    @click="darBaixa(row)"
                    class="h-7 px-3 rounded-lg bg-emerald-500 text-white text-[9px] font-black uppercase hover:bg-emerald-600 shadow-sm transition-all"
                  >
                    Pagar
                  </button>

                  <button
                    class="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-slate-200 flex items-center justify-center"
                  >
                    <i class="pi pi-eye text-[10px]"></i>
                  </button>
                </div>
              </template>
            </Table>
          </div>
        </div>
      </section>
    </div>
  </div>

  <FinanceiroModal
    v-if="modalFechamentoOpen"
    :open="modalFechamentoOpen"
    :preview="fornecedorSelecionadoParaFechamento"
    :fornecedorNome="nomeFornecedorFechamento"
    @close="modalFechamentoOpen = false"
    @confirm="executarFechamentoFinal"
  />
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { FinanceiroService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'

definePage({ meta: { perm: 'contas_pagar.ver' } })

const loading = ref(false)
const rows = ref([])
const abaAtiva = ref('EM_ABERTO')
const comprasExpandidas = ref({})

const filtros = reactive({
  data_ini: '',
  data_fim: '',
})

const abas = [
  { key: 'VENCIDO', label: 'Vencidos' },
  { key: 'EM_ABERTO', label: 'A pagar' },
  { key: 'PAGO', label: 'Pagos' },
]

const columns = [
  { key: 'data_ref', label: 'DATA', width: '150px' },
  { key: 'origem', label: 'ORIGEM', width: '110px' },
  { key: 'descricao', label: 'DESCRICAO' },
  { key: 'valor', label: 'VALOR', width: '140px', align: 'right' },
  { key: 'status', label: 'STATUS', width: '100px' },
  { key: 'acoes', label: '', width: '140px', align: 'right' },
]

const modalFechamentoOpen = ref(false)
const fornecedorSelecionadoParaFechamento = ref(null)

const nomeFornecedorFechamento = computed(() => {
  if (!fornecedorSelecionadoParaFechamento.value) return ''
  return (
    fornecedorSelecionadoParaFechamento.value.fornecedor_nome
    || fornecedorSelecionadoParaFechamento.value.nome_fantasia
    || 'Desconhecido'
  )
})

function formatDateInput(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getMesVigenteRange() {
  const now = new Date()
  const ini = new Date(now.getFullYear(), now.getMonth(), 1)
  const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { data_ini: formatDateInput(ini), data_fim: formatDateInput(fim) }
}

function aplicarMesVigente() {
  const range = getMesVigenteRange()
  filtros.data_ini = range.data_ini
  filtros.data_fim = range.data_fim
  buscar()
}

function toDateSafe(value) {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const raw = String(value).trim()
  if (!raw) return null

  // Evita deslocamento de fuso para datas vindas em formato ISO do backend.
  // Para a tela financeira queremos a data "civil" (dia/mês/ano), não horário.
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const y = Number(isoMatch[1])
    const m = Number(isoMatch[2])
    const d = Number(isoMatch[3])
    const localDate = new Date(y, m - 1, d, 0, 0, 0, 0)
    return Number.isNaN(localDate.getTime()) ? null : localDate
  }

  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function getDataAgrupamento(row) {
  const raw = row?.origem === 'COMPRA'
    ? (row?.data_compra || row?.vencimento_em)
    : row?.vencimento_em

  const dt = toDateSafe(raw)
  if (!dt) return { key: 'SEM_DATA', label: 'Sem data', sort: Number.MAX_SAFE_INTEGER }

  return {
    key: dt.toISOString().slice(0, 10),
    label: dt.toLocaleDateString('pt-BR'),
    sort: dt.getTime(),
  }
}

function getDataReferenciaLabel(row) {
  const raw = row?.origem === 'COMPRA'
    ? (row?.data_compra || row?.vencimento_em)
    : row?.vencimento_em
  const dt = toDateSafe(raw)
  if (!dt) return row?.origem === 'COMPRA' ? 'Compra: -' : 'Venc.: -'
  const data = dt.toLocaleDateString('pt-BR')
  return row?.origem === 'COMPRA' ? `Compra: ${data}` : `Venc.: ${data}`
}

function parseFiltroDateISO(iso, fimDoDia = false) {
  const raw = String(iso || '').trim()
  if (!raw) return null
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const y = Number(m[1])
  const mm = Number(m[2])
  const dd = Number(m[3])
  const d = new Date(y, mm - 1, dd, 0, 0, 0, 0)
  if (fimDoDia) d.setHours(23, 59, 59, 999)
  return Number.isNaN(d.getTime()) ? null : d
}

const rowsPeriodo = computed(() => {
  const lista = Array.isArray(rows.value) ? rows.value : []
  const ini = parseFiltroDateISO(filtros.data_ini, false)
  const fim = parseFiltroDateISO(filtros.data_fim, true)

  if (!ini && !fim) return lista

  return lista.filter((row) => {
    const raw = row?.origem === 'COMPRA'
      ? (row?.data_compra || row?.vencimento_em)
      : row?.vencimento_em
    const dt = toDateSafe(raw)
    if (!dt) return false
    if (ini && dt < ini) return false
    if (fim && dt > fim) return false
    return true
  })
})

const gruposContas = computed(() => {
  const lista = Array.isArray(rowsPeriodo.value) ? rowsPeriodo.value : []
  const porFornecedor = new Map()

  for (const row of lista) {
    const ehDespesa = row?.origem === 'DESPESA'
    const categoriaDespesa = String(row?.descricao || 'SEM CATEGORIA').trim() || 'SEM CATEGORIA'
    const classificacaoDespesa = String(row?.observacao || 'GERAL').trim() || 'GERAL'

    const nomeFornecedor = ehDespesa
      ? `DESPESAS / ${categoriaDespesa} / ${classificacaoDespesa}`
      : (String(row?.fornecedor_nome || 'SEM FORNECEDOR').trim() || 'SEM FORNECEDOR')

    const chaveFornecedor = ehDespesa
      ? `DESPESA__${categoriaDespesa.toUpperCase()}__${classificacaoDespesa.toUpperCase()}`
      : nomeFornecedor.toUpperCase()

    if (!porFornecedor.has(chaveFornecedor)) {
      porFornecedor.set(chaveFornecedor, {
        key: chaveFornecedor,
        nome: nomeFornecedor,
        datasMap: new Map(),
      })
    }

    const grupoFornecedor = porFornecedor.get(chaveFornecedor)
    const dataGroup = getDataAgrupamento(row)

    if (!grupoFornecedor.datasMap.has(dataGroup.key)) {
      grupoFornecedor.datasMap.set(dataGroup.key, {
        key: dataGroup.key,
        label: dataGroup.label,
        sort: dataGroup.sort,
        rows: [],
      })
    }

    grupoFornecedor.datasMap.get(dataGroup.key).rows.push(row)
  }

  return Array.from(porFornecedor.values())
    .map((grupoFornecedor) => ({
      key: grupoFornecedor.key,
      nome: grupoFornecedor.nome,
      datas: Array.from(grupoFornecedor.datasMap.values())
        .map((blocoData) => ({
          ...blocoData,
          keyGlobal: `${grupoFornecedor.key}__${blocoData.key}`,
          qtdCompras: blocoData.rows.filter((r) => r?.origem === 'COMPRA').length,
          rows: blocoData.rows.slice().sort((a, b) => Number(b?.valor || 0) - Number(a?.valor || 0)),
        }))
        .sort((a, b) => a.sort - b.sort),
    }))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)))
})

function toggleCompras(keyGlobal) {
  comprasExpandidas.value = {
    ...comprasExpandidas.value,
    [keyGlobal]: !comprasExpandidas.value[keyGlobal],
  }
}

function getRowsVisiveis(blocoData) {
  if (comprasExpandidas.value[blocoData.keyGlobal]) return blocoData.rows
  return blocoData.rows.filter((row) => row?.origem !== 'COMPRA')
}

const resumoPeriodo = computed(() => {
  const lista = Array.isArray(rowsPeriodo.value) ? rowsPeriodo.value : []
  const totalValor = lista.reduce((s, r) => s + Number(r?.valor || 0), 0)

  const aberto = lista.filter((r) => r?.status === 'EM_ABERTO')
  const vencido = lista.filter((r) => r?.status === 'VENCIDO')
  const pago = lista.filter((r) => r?.status === 'PAGO')

  return {
    totalQtd: lista.length,
    totalValor,
    abertoQtd: aberto.length,
    abertoValor: aberto.reduce((s, r) => s + Number(r?.valor || 0), 0),
    vencidoQtd: vencido.length,
    vencidoValor: vencido.reduce((s, r) => s + Number(r?.valor || 0), 0),
    pagoQtd: pago.length,
    pagoValor: pago.reduce((s, r) => s + Number(r?.valor || 0), 0),
  }
})

async function abrirModalFechamento() {
  const itemFornecedor = (rows.value || []).find((r) => Number(r?.fornecedor_id) > 0)
  if (!itemFornecedor) {
    return notify.warn('Nenhum fornecedor disponivel na lista atual para iniciar fechamento.')
  }

  try {
    loading.value = true
    const response = await FinanceiroService.previewFechamentoFornecedor({
      fornecedor_id: itemFornecedor.fornecedor_id,
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
    })

    const previewData = response?.data || response
    fornecedorSelecionadoParaFechamento.value = {
      ...previewData,
      fornecedor_nome: itemFornecedor.fornecedor_nome || '',
    }
    modalFechamentoOpen.value = true
  } catch (e) {
    notify.error('Nao foi possivel gerar o preview de fechamento')
  } finally {
    loading.value = false
  }
}

async function executarFechamentoFinal(payload) {
  try {
    await FinanceiroService.fecharMesFornecedor(payload)
    notify.success('Fechamento realizado com sucesso!')
    modalFechamentoOpen.value = false
    buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao fechar mes do fornecedor')
  }
}

const podeDarBaixa = (row) => row.origem === 'FECHAMENTO' && row.status !== 'PAGO'

async function buscarProximoTituloAberto(contaPagarId) {
  const resp = await FinanceiroService.listarTitulosContaPagar(contaPagarId)
  const titulos = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : [])
  return titulos.find((t) => t.status !== 'PAGO' && t.status !== 'CANCELADO') || null
}

async function darBaixa(item) {
  if (!podeDarBaixa(item)) {
    return notify.warn('Baixa disponivel apenas para registros de FECHAMENTO nesta tela.')
  }

  try {
    const proximoTitulo = await buscarProximoTituloAberto(item.id)
    if (!proximoTitulo) {
      return notify.info('Nenhuma parcela pendente para baixa.')
    }

    const labelParcela = proximoTitulo.parcela_numero
      ? `parcela ${proximoTitulo.parcela_numero}`
      : 'titulo'
    const valorTitulo = Number(proximoTitulo.valor || 0)

    const confirmacao = await confirm.show(
      'Confirmar Pagamento',
      `Deseja confirmar o pagamento da ${labelParcela} no valor de ${formatarMoeda(valorTitulo)}?`,
    )

    if (!confirmacao) return

    await FinanceiroService.pagarTituloContaPagar(item.id, proximoTitulo.id, {
      observacao: 'Baixa manual em contas a pagar',
    })

    notify.success(`Baixa da ${labelParcela} registrada com sucesso!`)
    buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao registrar baixa')
  }
}

function selecionarAba(statusKey) {
  if (abaAtiva.value === statusKey) return
  abaAtiva.value = statusKey
  buscar()
}

async function buscar() {
  try {
    loading.value = true
    const response = await FinanceiroService.listarPagarConsolidado({
      status: abaAtiva.value,
      data_ini: filtros.data_ini || undefined,
      data_fim: filtros.data_fim || undefined,
    })
    const data = response?.data || response
    rows.value = Array.isArray(data) ? data : []
    comprasExpandidas.value = {}
  } catch (e) {
    notify.error('Erro ao carregar contas a pagar')
  } finally {
    loading.value = false
  }
}

const formatarMoeda = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const getOrigemClass = (origem) => {
  const map = {
    DESPESA: 'text-purple-600 bg-purple-50 border-purple-100',
    COMPRA: 'text-orange-600 bg-orange-50 border-orange-100',
    FECHAMENTO: 'text-blue-600 bg-blue-50 border-blue-100',
  }
  return map[origem] || 'text-slate-600 bg-slate-50 border-slate-200'
}

onMounted(() => {
  const range = getMesVigenteRange()
  filtros.data_ini = range.data_ini
  filtros.data_fim = range.data_fim
  buscar()
})
</script>
