<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-xl border border-border-ui bg-bg-card">
      <PageHeader
        title="Central de Consolidação"
        subtitle="Contas a Pagar — Compras de Fornecedores e Despesas Gerais"
        icon="pi pi-arrow-down-right"
      />

      <div class="px-4 md:px-6 pb-5 pt-4 border-t border-border-ui space-y-4">
        <!-- Cards do dashboard -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Total a Vencer (Mês)</p>
            <p class="mt-1 text-xl font-bold text-slate-800 tabular-nums">{{ formatarMoeda(dashboard.total_a_vencer_mes) }}</p>
          </div>
          <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Cheques a Compensar</p>
            <p class="mt-1 text-xl font-bold text-amber-700 tabular-nums">{{ formatarMoeda(dashboard.cheques_a_compensar) }}</p>
          </div>
          <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Créditos Disponíveis</p>
            <p class="mt-1 text-xl font-bold text-emerald-700 tabular-nums">{{ formatarMoeda(dashboard.creditos_disponiveis) }}</p>
          </div>
        </div>

        <!-- Filtros -->
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
          <div class="w-full sm:max-w-[180px]">
            <label class="text-[10px] font-semibold text-slate-500 uppercase mb-1 block tracking-wide">Fornecedor</label>
            <select
              v-model="filtros.fornecedor_id"
              class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-300 text-slate-700"
            >
              <option value="">Todos</option>
              <option v-for="f in fornecedorOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
          </div>
          <div class="w-full sm:max-w-[100px]">
            <label class="text-[10px] font-semibold text-slate-500 uppercase mb-1 block tracking-wide">Mês</label>
            <select
              v-model="filtros.mes"
              class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-300 text-slate-700"
            >
              <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
            </select>
          </div>
          <div class="w-full sm:max-w-[100px]">
            <label class="text-[10px] font-semibold text-slate-500 uppercase mb-1 block tracking-wide">Ano</label>
            <select
              v-model="filtros.ano"
              class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-300 text-slate-700"
            >
              <option v-for="y in anosDisponiveis" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <Button @click="buscar" variant="primary" class="!h-9">
            <i class="pi pi-search mr-1.5"></i>
            Buscar
          </Button>
        </div>

        <!-- Abas: Unificado | Para Fechar | Agendados | Pagos -->
        <div class="border-b border-slate-200 overflow-x-auto custom-scroll">
          <nav class="flex gap-0 min-w-max">
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

        <!-- Tabela unificada -->
        <div class="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div v-if="loading" class="p-8 text-center text-slate-500 text-sm">Carregando...</div>
          <template v-else>
            <!-- Vista Por Fornecedor: collapsible row minimalista -->
            <template v-if="abaAtiva === 'POR_FORNECEDOR'">
              <p class="text-[10px] text-slate-500 px-3 py-1 border-b border-slate-100">
                Competência: <strong>{{ String(filtros.mes).padStart(2, '0') }}/{{ filtros.ano }}</strong>
                — Fechamento e abatimento (Serviço de Corte) referem-se ao mês vigente. Cada linha = um fornecedor (ID).
              </p>
              <div class="overflow-x-auto custom-scroll">
                <table class="w-full text-xs min-w-[400px]" cellpadding="0" cellspacing="0">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-200">
                      <th class="text-left py-2 px-3 font-semibold text-slate-600 w-10"></th>
                      <th class="text-left py-2 px-3 font-semibold text-slate-600">Fornecedor (ID)</th>
                      <th class="text-right py-2 px-3 font-semibold text-slate-600 w-32">Total</th>
                      <th class="text-left py-2 px-3 font-semibold text-slate-600 w-28">Status</th>
                      <th v-if="mostrarAcoes" class="text-right py-2 px-3 font-semibold text-slate-600 w-28"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="(row, idx) in listaFiltrada" :key="row.fornecedor_id + '-' + row.mes + '-' + row.ano + '-' + idx">
                      <!-- Estado fechado: só fornecedor (com ID) | total | status -->
                      <tr
                        class="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer"
                        :class="{ 'bg-slate-50/40': rowExpandidoPorFornecedor === chaveExpandPorFornecedor(row) }"
                        @click="toggleExpandPorFornecedor(row)"
                      >
                        <td class="py-2.5 px-3">
                          <span class="text-slate-400 inline-flex">
                            <i :class="rowExpandidoPorFornecedor === chaveExpandPorFornecedor(row) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
                          </span>
                        </td>
                        <td class="py-2.5 px-3 font-medium text-slate-800">
                          <span class="text-slate-500 font-normal">ID {{ row.fornecedor_id }}</span>
                          <span class="mx-1.5 text-slate-300">·</span>
                          <span>[{{ row.fornecedor_nome || '—' }}]</span>
                        </td>
                        <td class="py-2.5 px-3 text-right font-semibold text-slate-800 tabular-nums">{{ formatarMoeda(row.valor_liquido) }}</td>
                        <td class="py-2.5 px-3">
                          <span
                            class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            :class="row.valor_liquido > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'"
                          >
                            {{ row.valor_liquido > 0 ? 'EM_ABERTO' : 'QUITADO' }}
                          </span>
                        </td>
                        <td v-if="mostrarAcoes" class="py-2.5 px-3 text-right" @click.stop>
                          <button
                            v-if="row.valor_liquido > 0"
                            type="button"
                            @click="abrirModalFechamento(row.fornecedor_id)"
                            class="h-7 px-2.5 rounded border border-slate-300 bg-white text-slate-700 text-[10px] font-semibold uppercase hover:bg-slate-50"
                          >
                            Fechamento
                          </button>
                        </td>
                      </tr>
                      <!-- Estado aberto: detalhamento (subtotal, abatimentos, valor líquido + itens) -->
                      <tr v-if="rowExpandidoPorFornecedor === chaveExpandPorFornecedor(row)" class="bg-slate-50/50 border-b border-slate-100">
                        <td :colspan="mostrarAcoes ? 5 : 4" class="py-3 px-3">
                          <div class="pl-5 border-l-2 border-slate-200 space-y-3">
                            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Detalhamento · Competência {{ String(row.mes).padStart(2, '0') }}/{{ row.ano }}</p>
                            <div class="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
                              <span>Subtotal (compras mês): <strong class="text-slate-800 tabular-nums">{{ formatarMoeda(row.subtotal) }}</strong></span>
                              <span class="text-emerald-700">Abatimentos (Serviço de Corte mês + crédito): <strong class="tabular-nums">{{ formatarMoeda(row.total_abatimentos) }}</strong></span>
                              <span>Valor líquido: <strong class="text-slate-800 tabular-nums">{{ formatarMoeda(row.valor_liquido) }}</strong></span>
                            </div>
                            <div v-if="row.itens && row.itens.length" class="pt-1">
                              <table class="w-full max-w-2xl text-xs">
                                <thead>
                                  <tr class="text-slate-500">
                                    <th class="text-left py-1 font-medium">Origem</th>
                                    <th class="text-left py-1 font-medium">Descrição</th>
                                    <th class="text-left py-1 font-medium">Data</th>
                                    <th class="text-right py-1 font-medium">Valor</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr v-for="item in row.itens" :key="item.id + '-' + item.origem" class="border-t border-slate-100">
                                    <td class="py-1.5">
                                      <span
                                        class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                        :class="item.origem === 'COMPRA' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'"
                                      >
                                        {{ item.origem === 'COMPRA' ? 'Compra' : 'Serviço de Corte' }}
                                      </span>
                                    </td>
                                    <td class="py-1.5 text-slate-700">{{ item.descricao || '—' }}</td>
                                    <td class="py-1.5 tabular-nums text-slate-600">{{ item.data_referencia || '—' }}</td>
                                    <td class="py-1.5 text-right font-medium tabular-nums">{{ formatarMoeda(item.valor) }}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
              <div v-if="listaFiltrada.length === 0" class="p-8 text-center text-slate-500 text-sm">
                Nenhum fornecedor com lançamentos no período.
              </div>
            </template>
            <!-- Vista Unificado / Para Fechar / etc. -->
            <template v-else>
            <div class="overflow-x-auto custom-scroll">
              <table class="w-full text-xs min-w-[600px]" cellpadding="0" cellspacing="0">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200">
                    <th class="text-left py-2 px-3 font-semibold text-slate-600 w-10"></th>
                    <th class="text-left py-2 px-3 font-semibold text-slate-600 w-24">Origem</th>
                    <th class="text-left py-2 px-3 font-semibold text-slate-600 w-24">Vencimento</th>
                    <th class="text-left py-2 px-3 font-semibold text-slate-600">Fornecedor / Descrição</th>
                    <th class="text-left py-2 px-3 font-semibold text-slate-600 w-28">Tipo / Forma</th>
                    <th class="text-right py-2 px-3 font-semibold text-slate-600 w-28">Valor</th>
                    <th class="text-left py-2 px-3 font-semibold text-slate-600 w-20">Status</th>
                    <th v-if="mostrarAcoes" class="text-right py-2 px-3 font-semibold text-slate-600 w-40"></th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(row, idx) in listaFiltrada" :key="row.id + '-' + (row.titulo_id || '') + '-' + idx">
                    <tr
                      class="border-b border-slate-100 hover:bg-slate-50/50"
                      :class="{ 'bg-slate-50/30': rowExpandido === row.id }"
                    >
                      <td class="py-2 px-3">
                        <button
                          v-if="row.titulos_vinculados && row.titulos_vinculados.length > 0"
                          type="button"
                          class="text-slate-500 hover:text-slate-700 p-0.5"
                          @click="toggleExpand(row.id)"
                        >
                          <i :class="rowExpandido === row.id ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
                        </button>
                      </td>
                      <td class="py-2 px-3 text-slate-700">{{ origemLabel(row.origem) }}</td>
                      <td class="py-2 px-3 text-slate-700 tabular-nums">{{ formatarData(row.vencimento_em) }}</td>
                      <td class="py-2 px-3">
                        <div class="flex flex-wrap items-center gap-1.5">
                          <span
                            v-if="row.classificacao_badge"
                            class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            :class="row.classificacao_badge === 'PRODUÇÃO' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'"
                          >
                            [{{ row.classificacao_badge }}]
                          </span>
                          <span class="font-medium text-slate-800">{{ row.fornecedor_nome || '—' }}</span>
                        </div>
                        <div class="text-slate-500 truncate max-w-xs">{{ row.relatorio_descritivo || row.descricao || '—' }}</div>
                      </td>
                      <td class="py-2 px-3">
                        <span
                          v-if="row.forma_pagamento_chave"
                          class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          :class="badgeFormaPagamento(row.forma_pagamento_chave)"
                        >
                          [{{ row.forma_pagamento_chave }}]
                        </span>
                        <span v-else class="text-slate-400">—</span>
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
                        <template v-else-if="(abaAtiva === 'AGENDADOS' || abaAtiva === 'UNIFICADO' || abaAtiva === 'COMPENSADOS') && row.titulo_id && row.status !== 'PAGO'">
                          <button
                            type="button"
                            @click="darBaixaTitulo(row)"
                            class="h-7 px-2.5 rounded border border-slate-300 bg-white text-slate-700 text-[10px] font-semibold uppercase hover:bg-slate-50"
                          >
                            Pagar
                          </button>
                        </template>
                        <template v-else-if="(abaAtiva === 'AGENDADOS' || abaAtiva === 'UNIFICADO') && row.id_despesa && !row.titulo_id && row.status !== 'PAGO'">
                          <button
                            type="button"
                            @click="darBaixaDespesa(row)"
                            class="h-7 px-2.5 rounded border border-slate-300 bg-white text-slate-700 text-[10px] font-semibold uppercase hover:bg-slate-50"
                          >
                            Pagar
                          </button>
                        </template>
                      </td>
                    </tr>
                    <!-- Linha expandida: pagamentos vinculados -->
                    <tr v-if="rowExpandido === row.id && row.titulos_vinculados && row.titulos_vinculados.length" class="bg-slate-50/50 border-b border-slate-100">
                      <td colspan="8" class="py-2 px-3">
                        <div class="pl-6 text-xs">
                          <p class="font-semibold text-slate-600 mb-1">Pagamentos vinculados</p>
                          <table class="w-full max-w-2xl text-xs">
                            <thead>
                              <tr class="text-slate-500">
                                <th class="text-left py-1">Parcela</th>
                                <th class="text-left py-1">Forma</th>
                                <th class="text-left py-1">Vencimento</th>
                                <th class="text-right py-1">Valor</th>
                                <th class="text-left py-1">Status</th>
                                <th class="text-right py-1"></th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="t in row.titulos_vinculados" :key="t.id" class="border-t border-slate-100">
                                <td class="py-1">{{ t.parcela_numero }}/{{ t.parcelas_total }}</td>
                                <td class="py-1"><span :class="badgeFormaPagamento(t.tipo)" class="px-1.5 py-0.5 rounded font-semibold">[{{ t.tipo }}]</span></td>
                                <td class="py-1 tabular-nums">{{ formatarData(t.vencimento_em) }}</td>
                                <td class="py-1 text-right font-medium">{{ formatarMoeda(t.valor) }}</td>
                                <td class="py-1">{{ t.status }}</td>
                                <td class="py-1">
                                  <button
                                    v-if="t.status !== 'PAGO'"
                                    type="button"
                                    @click="darBaixaTituloById(t.id, t.valor)"
                                    class="text-[10px] font-semibold text-indigo-600 hover:underline"
                                  >
                                    Pagar
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            <div v-if="listaFiltrada.length === 0 && abaAtiva !== 'POR_FORNECEDOR'" class="p-8 text-center text-slate-500 text-sm">
              Nenhum registro nesta aba para o período selecionado.
            </div>
            </template>
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

    <!-- Modal: confirmar pagamento com data do pagamento -->
    <Teleport to="body">
      <div
        v-if="modalPagamentoOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
        @click.self="fecharModalPagamento()"
      >
        <div class="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm mx-4">
          <h3 class="text-base font-semibold text-slate-800 mb-2">Confirmar pagamento</h3>
          <p class="text-sm text-slate-600 mb-4">
            Valor: <strong>{{ formatarMoeda(pagamentoContext?.valor) }}</strong>
          </p>
          <div class="mb-5">
            <label class="text-[10px] font-semibold text-slate-500 uppercase mb-1 block tracking-wide">Data do pagamento</label>
            <input
              v-model="dataPagamento"
              type="date"
              class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-slate-300 text-slate-700"
            />
          </div>
          <div class="flex gap-2 justify-end">
            <button
              type="button"
              class="h-9 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
              @click="fecharModalPagamento()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="h-9 px-4 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700"
              @click="confirmarPagamento()"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { FinanceiroService, FornecedorService } from '@/services/index'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'contas_pagar.ver' } })

const DATA_REFERENCIA = '2026-03-04'
const DATA_REFERENCIA_LABEL = (() => {
  const d = new Date(DATA_REFERENCIA + 'T12:00:00')
  return d.toLocaleDateString('pt-BR')
})()

const loading = ref(false)
const listaUnificado = ref([])
const listaParaFechar = ref([])
const listaCompensados = ref([])
const listaAgendados = ref([])
const listaPagos = ref([])
/** Fechamento agrupado por fornecedor (subtotal, abatimentos, valor líquido + itens) */
const listaFechamentoPorFornecedor = ref([])
const dashboard = reactive({
  total_a_vencer_mes: 0,
  cheques_a_compensar: 0,
  creditos_disponiveis: 0,
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
})
const filtroBusca = ref('')
const abaAtiva = ref('UNIFICADO')
const fornecedorOptions = ref([])
const fornecedorIdFechamentoRef = ref(null)
const modalFechamentoOpen = ref(false)
const fornecedorSelecionadoParaFechamento = ref(null)
const rowExpandido = ref(null)
/** Chave da linha expandida na aba Por Fornecedor: 'fornecedorId-mes-ano' */
const rowExpandidoPorFornecedor = ref(null)

// Modal de pagamento (data do pagamento)
const modalPagamentoOpen = ref(false)
const pagamentoContext = ref(null) // { tipo: 'titulo'|'despesa', id, valor }
const dataPagamento = ref('')

const nomeFornecedorFechamento = computed(() => {
  const id = fornecedorIdFechamentoRef.value
  if (!id) return ''
  const o = fornecedorOptions.value.find((x) => String(x.value) === String(id))
  return o?.label || 'Fornecedor'
})

/** Retorna primeiro e último dia do mês a partir de mes (1-12) e ano */
function periodoDoMes(mes, ano) {
  const m = Number(mes) || new Date().getMonth() + 1
  const a = Number(ano) || new Date().getFullYear()
  const ini = new Date(a, m - 1, 1)
  const fim = new Date(a, m, 0)
  return {
    data_ini: ini.toISOString().slice(0, 10),
    data_fim: fim.toISOString().slice(0, 10),
  }
}

const anoAtual = new Date().getFullYear()
const anosDisponiveis = [anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2]

const filtros = reactive({
  fornecedor_id: '',
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
})

const tabs = computed(() => [
  { id: 'POR_FORNECEDOR', label: 'Por Fornecedor', count: listaFechamentoPorFornecedor.value.length },
  { id: 'UNIFICADO', label: 'Unificado', count: listaUnificado.value.length },
  { id: 'PARA_FECHAR', label: 'Para Fechar', count: listaParaFechar.value.length },
  { id: 'COMPENSADOS', label: 'Compensados', count: listaCompensados.value.length },
  { id: 'AGENDADOS', label: 'Agendados', count: listaAgendados.value.length },
  { id: 'PAGOS', label: 'Pagos', count: listaPagos.value.length },
])

const listaAbaAtiva = computed(() => {
  if (abaAtiva.value === 'POR_FORNECEDOR') return listaFechamentoPorFornecedor.value
  if (abaAtiva.value === 'UNIFICADO') return listaUnificado.value
  if (abaAtiva.value === 'PARA_FECHAR') return listaParaFechar.value
  if (abaAtiva.value === 'COMPENSADOS') return listaCompensados.value
  if (abaAtiva.value === 'AGENDADOS') return listaAgendados.value
  return listaPagos.value
})

const listaFiltrada = computed(() => {
  const q = (filtroBusca.value || '').trim().toLowerCase()
  const list = listaAbaAtiva.value
  if (!q) return list
  if (abaAtiva.value === 'POR_FORNECEDOR') {
    return list.filter((r) => (r.fornecedor_nome || '').toLowerCase().includes(q))
  }
  return list.filter((r) => {
    const fornecedor = (r.fornecedor_nome || '').toLowerCase()
    const descricao = (r.descricao || '').toLowerCase()
    const relatorio = (r.relatorio_descritivo || '').toLowerCase()
    return fornecedor.includes(q) || descricao.includes(q) || relatorio.includes(q)
  })
})

const mostrarAcoes = computed(() => ['UNIFICADO', 'PARA_FECHAR', 'COMPENSADOS', 'AGENDADOS', 'POR_FORNECEDOR'].includes(abaAtiva.value))

function origemLabel(origem) {
  const map = {
    COMPRA: 'Compra',
    TITULO_FECHAMENTO: 'Parcela',
    FECHAMENTO: 'Fechamento',
    DESPESA: 'Despesa',
    PLANO_CORTE: 'Serviço de Corte',
  }
  return map[origem] || origem || '—'
}

function badgeFormaPagamento(tipo) {
  const t = (tipo || '').toUpperCase()
  if (t === 'CHEQUE') return 'bg-amber-100 text-amber-800'
  if (t === 'BOLETO') return 'bg-sky-100 text-sky-800'
  if (t === 'CARTAO' || t === 'CREDITO') return 'bg-violet-100 text-violet-800'
  return 'bg-slate-100 text-slate-700'
}

function toggleExpand(id) {
  rowExpandido.value = rowExpandido.value === id ? null : id
}

function chaveExpandPorFornecedor(row) {
  return `${row.fornecedor_id}-${row.mes}-${row.ano}`
}

function toggleExpandPorFornecedor(row) {
  const key = chaveExpandPorFornecedor(row)
  rowExpandidoPorFornecedor.value = rowExpandidoPorFornecedor.value === key ? null : key
}

function mudarAba(id) {
  abaAtiva.value = id
  rowExpandido.value = null
  rowExpandidoPorFornecedor.value = null
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
    const mes = filtros.mes || new Date().getMonth() + 1
    const ano = filtros.ano || new Date().getFullYear()
    const res = await FinanceiroService.previewFechamentoFornecedor({
      fornecedor_id: fornecedorId,
      mes,
      ano,
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

function abrirModalPagamento(tipo, id, valor) {
  pagamentoContext.value = { tipo, id, valor }
  const hoje = new Date()
  dataPagamento.value = hoje.toISOString().slice(0, 10)
  modalPagamentoOpen.value = true
}

function fecharModalPagamento() {
  modalPagamentoOpen.value = false
  pagamentoContext.value = null
}

async function confirmarPagamento() {
  const ctx = pagamentoContext.value
  if (!ctx) return
  const dataPag = dataPagamento.value ? `${dataPagamento.value}T12:00:00.000Z` : null
  const payload = dataPag ? { data_pagamento: dataPag } : {}
  try {
    if (ctx.tipo === 'titulo') {
      await FinanceiroService.pagarTitulo(ctx.id, payload)
    } else {
      await FinanceiroService.pagarDespesa(ctx.id, payload)
    }
    notify.success('Pagamento registrado com sucesso.')
    fecharModalPagamento()
    await buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao registrar pagamento')
  }
}

async function darBaixaTitulo(row) {
  abrirModalPagamento('titulo', row.titulo_id, row.valor)
}

async function darBaixaDespesa(row) {
  if (!row.id_despesa) return
  abrirModalPagamento('despesa', row.id_despesa, row.valor)
}

async function darBaixaTituloById(tituloId, valor) {
  abrirModalPagamento('titulo', tituloId, valor)
}

async function carregarDashboard() {
  try {
    const mes = filtros.mes || new Date().getMonth() + 1
    const ano = filtros.ano || new Date().getFullYear()
    const res = await FinanceiroService.getContasPagarDashboard({ mes, ano })
    const data = res?.data ?? res
    dashboard.total_a_vencer_mes = data.total_a_vencer_mes ?? 0
    dashboard.cheques_a_compensar = data.cheques_a_compensar ?? 0
    dashboard.creditos_disponiveis = data.creditos_disponiveis ?? 0
    dashboard.mes = data.mes ?? mes
    dashboard.ano = data.ano ?? ano
  } catch (e) {
    console.error('Erro ao carregar dashboard:', e)
  }
}

async function buscar() {
  try {
    loading.value = true
    const { data_ini, data_fim } = periodoDoMes(filtros.mes, filtros.ano)
    const params = {
      data_ini,
      data_fim,
      fornecedor_id: filtros.fornecedor_id || undefined,
      mes: filtros.mes || undefined,
      ano: filtros.ano || undefined,
    }

    const [resUnif, resPF, resComp, resAg, resPg] = await Promise.all([
      FinanceiroService.listarContasPagarConsolidado(params),
      FinanceiroService.listarContasPagarConsolidado({ ...params, visao: 'PARA_FECHAR' }),
      FinanceiroService.listarContasPagarConsolidado({ ...params, visao: 'COMPENSADOS' }),
      FinanceiroService.listarContasPagarConsolidado({ ...params, visao: 'AGENDADOS' }),
      FinanceiroService.listarContasPagarConsolidado({ ...params, visao: 'PAGOS' }),
    ])

    listaUnificado.value = Array.isArray(resUnif?.data) ? resUnif.data : (Array.isArray(resUnif) ? resUnif : [])
    listaParaFechar.value = Array.isArray(resPF?.data) ? resPF.data : (Array.isArray(resPF) ? resPF : [])
    listaCompensados.value = Array.isArray(resComp?.data) ? resComp.data : (Array.isArray(resComp) ? resComp : [])
    listaAgendados.value = Array.isArray(resAg?.data) ? resAg.data : (Array.isArray(resAg) ? resAg : [])
    listaPagos.value = Array.isArray(resPg?.data) ? resPg.data : (Array.isArray(resPg) ? resPg : [])

    const resFech = await FinanceiroService.getFechamentoPorFornecedor({
      mes: filtros.mes || new Date().getMonth() + 1,
      ano: filtros.ano || new Date().getFullYear(),
      fornecedor_id: filtros.fornecedor_id || undefined,
    })
    listaFechamentoPorFornecedor.value = Array.isArray(resFech?.data) ? resFech.data : (Array.isArray(resFech) ? resFech : [])

    await carregarDashboard()
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || 'Erro ao carregar contas a pagar'
    notify.error(msg)
    console.error('[Contas a pagar] Erro ao buscar:', e?.response?.data || e)
    listaUnificado.value = []
    listaParaFechar.value = []
    listaCompensados.value = []
    listaAgendados.value = []
    listaPagos.value = []
    listaFechamentoPorFornecedor.value = []
  } finally {
    loading.value = false
  }
}

const formatarMoeda = (v) => (v != null && v !== '') ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'
const formatarData = (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '—'

watch(
  () => [filtros.mes, filtros.ano],
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
