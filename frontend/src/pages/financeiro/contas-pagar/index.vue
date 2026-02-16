<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="w-full h-2 rounded-t-2xl shrink-0 bg-brand-primary"></div>

      <PageHeader
        title="Contas a Pagar"
        subtitle="Soma de todas as compras do período e relatório descritivo por item"
        icon="pi pi-arrow-down-right"
      />

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui space-y-6">
        <div class="flex flex-col sm:flex-row flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-0 sm:min-w-[220px]">
            <label class="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-wider">Buscar</label>
            <input 
              v-model="filtroBusca" 
              type="text"
              placeholder="Fornecedor, descrição, origem..."
              class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-slate-700 placeholder:text-slate-400"
            />
          </div>
            <div class="w-full sm:max-w-[160px]">
              <label class="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-wider">Período (início)</label>
              <input 
                v-model="filtros.data_ini" 
                type="date"
                class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-slate-700"
                @change="ajustarFimAoInicio"
              />
            </div>
            <div class="w-full sm:max-w-[160px]">
              <label class="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-wider">Período (fim)</label>
              <input 
                v-model="filtros.data_fim" 
                type="date"
                class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-slate-700"
                @change="ajustarInicioAoFim"
              />
            </div>
          <Button @click="buscar" variant="primary" class="!h-10">
            <i class="pi pi-search mr-2"></i>
            Buscar
          </Button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
          <p class="text-[10px] font-black text-orange-600 uppercase tracking-wider mb-1">Soma de todas as compras do período</p>
          <p class="text-xl font-black text-slate-800 tabular-nums">{{ formatarMoeda(totais.compras) }}</p>
        </div>
        <div class="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <p class="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1">Fechamentos</p>
          <p class="text-xl font-black text-slate-800 tabular-nums">{{ formatarMoeda(totais.fechamentos) }}</p>
        </div>
        <div class="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
          <p class="text-[10px] font-black text-purple-600 uppercase tracking-wider mb-1">Despesas do período</p>
          <p class="text-xl font-black text-slate-800 tabular-nums">{{ formatarMoeda(totais.despesas) }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Total período</p>
          <p class="text-xl font-black text-slate-800 tabular-nums">{{ formatarMoeda(totais.total) }}</p>
        </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div class="flex border-b border-slate-200">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="flex-1 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors"
            :class="abaAtiva === tab.id
              ? tab.activeClass
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'"
            @click="abaAtiva = tab.id"
          >
            {{ tab.label }}
            <span class="ml-1 opacity-80">({{ tab.count }})</span>
          </button>
          </div>

          <div class="p-0">
          <div v-if="loading" class="p-8 text-center text-slate-500 font-bold">Carregando...</div>
          <template v-else>
            <!-- Conteúdo agrupado por data, compras separadas por fornecedor -->
            <div v-for="(itens, dataStr) in rowsPorData" :key="dataStr" class="border-t-2 border-slate-200 first:border-t-0">
              <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-black text-slate-600 uppercase tracking-wider">{{ dataStr }}</span>
                  <span class="text-xs font-bold text-slate-500">— {{ itens.length }} item(ns) · {{ formatarMoeda(somaGrupo(itens)) }}</span>
                </div>
                <button
                  type="button"
                  @click="toggleGrupo(dataStr)"
                  class="h-8 px-3 rounded-lg border border-slate-300 bg-white text-slate-600 text-[10px] font-bold uppercase hover:bg-slate-100 inline-flex items-center gap-1.5"
                  :title="estaExpandido(dataStr) ? 'Ocultar detalhes' : 'Exibir detalhes'"
                >
                  <i :class="estaExpandido(dataStr) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-xs"></i>
                  {{ estaExpandido(dataStr) ? 'Ocultar' : 'Exibir' }}
                </button>
              </div>
              <!-- Vista resumida: nome do fornecedor + valor total -->
              <div v-if="!estaExpandido(dataStr)" class="px-4 py-3 bg-white border-b border-slate-100">
                <div class="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                  <span v-for="(r, idx) in resumoPorFornecedor(itens)" :key="idx" class="inline-flex items-baseline gap-1.5">
                    <span class="font-bold text-slate-700">{{ r.nome }}</span>
                    <span class="font-black text-slate-800 tabular-nums">— {{ formatarMoeda(r.valor) }}</span>
                  </span>
                </div>
              </div>
              <!-- Vista expandida: um bloco por fornecedor (separador + tabela) -->
              <template v-else>
                <div
                  v-for="(bloco, idx) in (rowsPorDataPorFornecedor[dataStr] || [])"
                  :key="bloco.fornecedor + idx"
                  class="border-b border-slate-100 last:border-b-0"
                >
                  <div class="bg-slate-100/80 px-4 py-2 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                    <span class="text-[10px] font-black text-slate-600 uppercase tracking-wider">{{ bloco.fornecedor }}</span>
                    <span class="ml-2 text-[10px] font-bold text-slate-500">— {{ bloco.itens.length }} item(ns) · {{ formatarMoeda(bloco.total) }}</span>
                    <div class="flex items-center gap-2 flex-wrap">
                      <button
                        v-if="fornecedorIdDoBloco(bloco) && blocoItensComPendentes(bloco)"
                        type="button"
                        @click="abrirModalFechamento(fornecedorIdDoBloco(bloco))"
                        class="h-8 px-3 rounded-lg bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-indigo-600 active:scale-[0.98] transition-all inline-flex items-center gap-1.5 shrink-0"
                        title="Fechamento único do mês deste fornecedor"
                      >
                        <i class="pi pi-calendar-times text-xs"></i>
                        <span>Fechamento do mês</span>
                      </button>
                      <button
                        v-if="getFechamentoAbertoDoBloco(bloco)"
                        type="button"
                        @click="darBaixa(getFechamentoAbertoDoBloco(bloco))"
                        class="h-8 px-3 rounded-lg bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-600 active:scale-[0.98] transition-all inline-flex items-center gap-1.5 shrink-0"
                        title="Pagar a conta do mês (fechamento)"
                      >
                        <i class="pi pi-check text-xs"></i>
                        <span>Pagar conta do mês</span>
                      </button>
                    </div>
                  </div>
                  <Table 
                    :columns="columns" 
                    :rows="bloco.itens" 
                    :loading="false"
                    empty-text="Nenhum item."
                    :boxed="false"
                  >
                <template #cell-origem="{ row }">
                  <span 
                    :class="getOrigemClass(row.origem)" 
                    class="px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider inline-block"
                  >
                    {{ row.origem }}
                  </span>
                </template>
                <template #cell-vencimento="{ row }">
                  <span class="text-sm font-bold text-slate-700 tabular-nums">
                    {{ formatarData(row.vencimento_em) }}
                  </span>
                </template>
                <template #cell-fornecedor="{ row }">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-sm font-bold text-slate-800 uppercase tracking-tight">
                      {{ row.fornecedor_nome || 'DESPESA OPERACIONAL' }}
                    </span>
                    <span class="text-[10px] font-medium text-slate-600 tracking-wide">
                      {{ relatorioDescritivo(row) }}
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
                  <div class="flex justify-end items-center gap-2 flex-nowrap">
                    <button 
                      v-if="row.fornecedor_id && row.status !== 'PAGO'"
                      @click="abrirModalFechamento(row.fornecedor_id)"
                      type="button"
                      class="h-8 px-3 rounded-lg bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-indigo-600 active:scale-[0.98] transition-all inline-flex items-center gap-1.5 shrink-0"
                      title="Fechamento mensal deste fornecedor"
                    >
                      <i class="pi pi-calendar-times text-xs"></i>
                      <span>Fechamento</span>
                    </button>
                    <button 
                      v-if="row.status !== 'PAGO'"
                      @click="darBaixa(row)"
                      type="button"
                      class="h-8 px-3 rounded-lg bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-600 active:scale-[0.98] transition-all inline-flex items-center gap-1.5 shrink-0"
                      title="Dar baixa no pagamento"
                    >
                      <i class="pi pi-check text-xs"></i>
                      <span>Pagar</span>
                    </button>
                    <button 
                      type="button"
                      class="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 border border-slate-200 inline-flex items-center justify-center shrink-0 transition-all"
                      title="Ver detalhes"
                    >
                      <i class="pi pi-eye text-xs"></i>
                    </button>
                  </div>
                </template>
                  </Table>
                </div>
              </template>
            </div>
            <div v-if="Object.keys(rowsPorData).length === 0" class="p-8 text-center text-slate-500 text-sm font-bold">
              Nenhum registro nesta aba para o período selecionado.
            </div>
          </template>
          </div>
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

const loading = ref(false)
const listaCompleta = ref([])
const filtroBusca = ref('')
const abaAtiva = ref('A_PAGAR') // VENCIDOS | A_PAGAR | PAGOS
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

// Lista filtrada pela busca (fornecedor, descrição, origem, relatório descritivo, produtos)
const listaFiltrada = computed(() => {
  const q = (filtroBusca.value || '').trim().toLowerCase()
  if (!q) return listaCompleta.value
  return listaCompleta.value.filter((r) => {
    const fornecedor = (r.fornecedor_nome || '').toLowerCase()
    const descricao = (r.descricao || '').toLowerCase()
    const origem = (r.origem || '').toLowerCase()
    const observacao = (r.observacao || '').toLowerCase()
    const relatorio = (r.relatorio_descritivo || '').toLowerCase()
    const produtos = (r.detalhe_produtos || []).join(' ').toLowerCase()
    return fornecedor.includes(q) || descricao.includes(q) || origem.includes(q) || observacao.includes(q) || relatorio.includes(q) || produtos.includes(q)
  })
})

// Período = sempre um mês completo (1º ao último dia)
const periodoPadrao = () => {
  const hoje = new Date()
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  return {
    data_ini: ini.toISOString().slice(0, 10),
    data_fim: fim.toISOString().slice(0, 10),
  }
}

const filtros = reactive({
  data_ini: periodoPadrao().data_ini,
  data_fim: periodoPadrao().data_fim,
})

// Ao mudar início: fim = último dia do mesmo mês. Ao mudar fim: início = 1º dia do mesmo mês.
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

const columns = [
  { key: 'origem', label: 'ORIGEM', width: '100px' },
  { key: 'vencimento', label: 'VENCIMENTO', width: '120px' },
  { key: 'fornecedor', label: 'FORNECEDOR/DESCRIÇÃO' },
  { key: 'valor', label: 'VALOR', width: '140px', align: 'right' },
  { key: 'status', label: 'STATUS', width: '100px' },
  { key: 'acoes', label: '', width: '220px', align: 'right' },
]

const tabs = computed(() => [
  { id: 'VENCIDOS', label: 'Vencidos', count: rowsVencidos.value.length, activeClass: 'bg-rose-100 text-rose-700 border-b-2 border-rose-500' },
  { id: 'A_PAGAR', label: 'A pagar', count: rowsAPagar.value.length, activeClass: 'bg-amber-100 text-amber-800 border-b-2 border-amber-500' },
  { id: 'PAGOS', label: 'Pagos', count: rowsPagos.value.length, activeClass: 'bg-emerald-100 text-emerald-700 border-b-2 border-emerald-500' },
])

// Separa por status a partir da lista já filtrada pela busca
const rowsVencidos = computed(() => listaFiltrada.value.filter(r => r.status === 'VENCIDO'))
const rowsAPagar = computed(() => listaFiltrada.value.filter(r => r.status === 'EM_ABERTO'))
const rowsPagos = computed(() => listaFiltrada.value.filter(r => r.status === 'PAGO'))

const rowsAbaAtiva = computed(() => {
  if (abaAtiva.value === 'VENCIDOS') return rowsVencidos.value
  if (abaAtiva.value === 'A_PAGAR') return rowsAPagar.value
  return rowsPagos.value
})

// Agrupar por data de vencimento
const rowsPorData = computed(() => {
  const list = rowsAbaAtiva.value
  const map = {}
  for (const row of list) {
    const dataStr = formatarData(row.vencimento_em)
    if (!map[dataStr]) map[dataStr] = []
    map[dataStr].push(row)
  }
  const entries = Object.entries(map)
  entries.sort(([, a], [, b]) => {
    const t1 = a[0]?.vencimento_em ? new Date(a[0].vencimento_em).getTime() : 0
    const t2 = b[0]?.vencimento_em ? new Date(b[0].vencimento_em).getTime() : 0
    return t1 - t2
  })
  const sorted = {}
  entries.forEach(([k, v]) => { sorted[k] = v })
  return sorted
})

// Nome do grupo: compras/fechamento = fornecedor; despesas = categoria (descricao)
function nomeGrupo(row) {
  if (row.origem === 'DESPESA') return row.descricao || row.observacao || 'Despesa'
  return row.fornecedor_nome || 'Outros'
}

// Dentro de cada data: compras por fornecedor, despesas por categoria
const rowsPorDataPorFornecedor = computed(() => {
  const result = {}
  for (const [dataStr, itens] of Object.entries(rowsPorData.value)) {
    const porGrupo = {}
    for (const row of itens) {
      const nome = nomeGrupo(row)
      if (!porGrupo[nome]) porGrupo[nome] = []
      porGrupo[nome].push(row)
    }
    result[dataStr] = Object.entries(porGrupo).map(([fornecedor, rows]) => ({
      fornecedor,
      itens: rows,
      total: rows.reduce((s, r) => s + Number(r.valor || 0), 0),
    }))
  }
  return result
})

// Totais: soma de todas as compras do período (só COMPRA), fechamentos, despesas e total
const totais = computed(() => {
  const list = listaFiltrada.value
  let compras = 0
  let fechamentos = 0
  let despesas = 0
  for (const r of list) {
    if (r.origem === 'COMPRA') compras += Number(r.valor || 0)
    else if (r.origem === 'FECHAMENTO') fechamentos += Number(r.valor || 0)
    else if (r.origem === 'DESPESA') despesas += Number(r.valor || 0)
  }
  return {
    compras,
    fechamentos,
    despesas,
    total: compras + fechamentos + despesas,
  }
})

function somaGrupo(itens) {
  return itens.reduce((s, r) => s + Number(r.valor || 0), 0)
}

// Relatório descritivo: usa o texto vindo do backend (COMPRA/FECHAMENTO) ou monta para DESPESA
function relatorioDescritivo(row) {
  if (row.relatorio_descritivo) return row.relatorio_descritivo
  const partes = [row.descricao || row.observacao].filter(Boolean)
  if (row.parcela_info) partes.push(row.parcela_info)
  return partes.join(' · ') || '—'
}

// Fechamento único do mês: id do fornecedor do bloco (primeiro item com fornecedor_id)
function fornecedorIdDoBloco(bloco) {
  const item = (bloco?.itens || []).find((i) => i.fornecedor_id)
  return item ? item.fornecedor_id : null
}

// Bloco tem itens pendentes (fornecedor + não pagos) para mostrar botão Fechamento do mês
function blocoItensComPendentes(bloco) {
  return (bloco?.itens || []).some((i) => i.fornecedor_id && i.status !== 'PAGO')
}

// Fechamento (conta do mês) em aberto no bloco — para mostrar botão "Pagar conta do mês"
function getFechamentoAbertoDoBloco(bloco) {
  return (bloco?.itens || []).find((i) => i.origem === 'FECHAMENTO' && i.status !== 'PAGO') || null
}

// Resumo do grupo (fornecedor ou categoria + total) para vista oculta
function resumoPorFornecedor(itens) {
  const map = {}
  for (const r of itens) {
    const nome = nomeGrupo(r)
    if (!map[nome]) map[nome] = 0
    map[nome] += Number(r.valor || 0)
  }
  return Object.entries(map).map(([nome, valor]) => ({ nome, valor }))
}

const gruposExpandidos = ref({})
function toggleGrupo(dataStr) {
  gruposExpandidos.value[dataStr] = !gruposExpandidos.value[dataStr]
}
function estaExpandido(dataStr) {
  return gruposExpandidos.value[dataStr] !== false
}

function fecharModalFechamento() {
  modalFechamentoOpen.value = false
  fornecedorSelecionadoParaFechamento.value = null
  fornecedorIdFechamentoRef.value = null
}

async function abrirModalFechamento(fornecedorId) {
  const id = fornecedorId ?? fornecedorIdFechamentoRef.value
  if (!id) {
    return notify.warn('Fornecedor não informado')
  }
  try {
    loading.value = true
    fornecedorIdFechamentoRef.value = id
    const res = await FinanceiroService.previewFechamentoFornecedor({
      fornecedor_id: id,
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
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
    buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao confirmar fechamento')
  } finally {
    loading.value = false
  }
}

async function darBaixa(item) {
  const confirmacao = await confirm.show('Confirmar Pagamento', `Deseja confirmar o pagamento de ${formatarMoeda(item.valor)}?`)
  if (confirmacao) {
    try {
      if (item.titulo_id) {
        await FinanceiroService.pagarTitulo(item.titulo_id)
      } else if (item.origem === 'DESPESA') {
        await FinanceiroService.pagarDespesa(item.id)
      } else {
        await FinanceiroService.pagarContaPagar(item.id, {
          unidade: 'FÁBRICA',
          categoria: 'PAGAMENTO_FORNECEDOR'
        })
      }
      notify.success('Pagamento registrado com sucesso!')
      buscar()
    } catch (e) {
      notify.error(e?.response?.data?.message || 'Erro ao registrar pagamento')
    }
  }
}

async function buscar() {
  try {
    loading.value = true
    const res = await FinanceiroService.listarContasPagarConsolidado({
      data_ini: filtros.data_ini,
      data_fim: filtros.data_fim,
    })
    const data = res?.data ?? res
    listaCompleta.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar contas a pagar')
    listaCompleta.value = []
  } finally {
    loading.value = false
  }
}

const formatarMoeda = (v) => (v != null && v !== '') ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'
const formatarData = (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '-'

const getOrigemClass = (origem) => {
  const map = {
    'DESPESA': 'text-purple-600 bg-purple-50 border-purple-100',
    'COMPRA': 'text-orange-600 bg-orange-50 border-orange-100',
    'FECHAMENTO': 'text-blue-600 bg-blue-50 border-blue-100',
  }
  return map[origem] || 'text-slate-600 bg-slate-50 border-slate-200'
}

// Ao alterar as datas, atualiza os dados da página automaticamente
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
  buscar()
})
</script>
