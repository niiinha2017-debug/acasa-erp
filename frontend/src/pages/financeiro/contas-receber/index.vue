<!-- src/pages/financeiro/contas-receber/index.vue -->
<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Contas a Receber"
        subtitle="Receitas previstas e recebidas (cliente ou fornecedor)."
        icon="pi pi-arrow-up-right"
        :backTo="null"
      />

      <div class="pb-5 md:pb-6 pt-4 border-t border-border-ui space-y-6 relative">
        <Loading v-if="loading" />

        <template v-else>
          <!-- FILTROS -->
          <div class="flex flex-col sm:flex-row flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-0 sm:min-w-[220px]">
              <label class="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-wider">Buscar</label>
              <input
                v-model="filtroTexto"
                type="text"
                placeholder="Cliente, ambiente, venda, observação..."
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
            <Button @click="carregar" variant="primary" class="!h-10">
              <i class="pi pi-search mr-2"></i>
              Buscar
            </Button>
          </div>

          <!-- RESUMO -->
          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100">
              <div class="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400">Total</div>
              <div class="text-lg font-black text-gray-900">{{ format.currency(totais.total) }}</div>
              <div class="text-xs font-bold text-gray-500">{{ contagens.total }} registros</div>
            </div>

            <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-green-50 border border-green-100">
              <div class="text-[9px] font-black uppercase tracking-[0.22em] text-green-500">Recebidos</div>
              <div class="text-lg font-black text-green-700">{{ format.currency(totais.recebido) }}</div>
              <div class="text-xs font-bold text-green-600">{{ contagens.recebido }} registros</div>
            </div>

            <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100">
              <div class="text-[9px] font-black uppercase tracking-[0.22em] text-amber-500">Em aberto</div>
              <div class="text-lg font-black text-amber-700">{{ format.currency(totais.aberto) }}</div>
              <div class="text-xs font-bold text-amber-600">{{ contagens.aberto }} registros</div>
            </div>
          </div>

          <!-- TABELA -->
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

            <Table
              :columns="columns"
              :rows="rowsAbaAtiva"
              :loading="false"
              empty-text="Nenhuma conta a receber encontrada."
              :boxed="false"
              :flush="true"
            >
            <template #cell-partes="{ row }">
              <div class="font-black text-gray-900">
                <template v-if="row.cliente_nome">{{ row.cliente_nome }}</template>
                <template v-else-if="row.cliente_id">Cliente #{{ row.cliente_id }}</template>
                <template v-else-if="row.fornecedor_id">Fornecedor #{{ row.fornecedor_id }}</template>
                <template v-else>—</template>
              </div>
              <div v-if="Array.isArray(row.ambientes_venda) && row.ambientes_venda.length" class="text-xs font-bold text-indigo-600">
                Ambientes: {{ row.ambientes_venda.join(', ') }}
              </div>
              <div class="text-xs font-bold text-gray-400">
                <template v-if="row.descricao">{{ row.descricao }}</template>
                <template v-else>Sem descrição</template>
              </div>
            </template>

            <template #cell-origem="{ row }">
              <div class="font-black text-gray-900">{{ row.origem_tipo || '—' }}</div>
              <div class="text-xs font-bold text-gray-400">
                <template v-if="row.origem_id">#{{ row.origem_id }}</template>
                <template v-else>—</template>
              </div>
              <div v-if="labelFormas(row)" class="text-[10px] font-bold text-slate-500">
                {{ labelFormas(row) }}
              </div>
            </template>

            <template #cell-vencimento="{ row }">
              <div class="text-xs font-black text-gray-900">{{ format.date(row.vencimento_em) }}</div>
              <div
                v-if="Array.isArray(row.parcelas_venda) && row.parcelas_venda.length"
                class="mt-1 max-h-20 overflow-y-auto pr-1 space-y-0.5"
              >
                <div
                  v-for="p in row.parcelas_venda"
                  :key="`parcela-${row.id}-${p.parcela}`"
                  class="text-[10px] font-bold text-slate-500"
                >
                  {{ p.parcela }}x — {{ format.date(p.vencimento_em) }}
                </div>
              </div>
              <div
                v-if="String(row.forma_recebimento_chave || '').toUpperCase() === 'PIX' && row.recebido_em"
                class="text-xs font-bold text-blue-600"
              >
                PIX: {{ format.date(row.recebido_em) }}
              </div>
            </template>

            <template #cell-valor="{ row }">
              <div class="font-black text-gray-900 text-right">
                {{ format.currency(Number(row.valor_original || 0)) }}
              </div>
              <div
                v-if="row.antecipacao?.valor_liquido != null"
                class="text-xs font-bold text-emerald-600 text-right"
              >
                Liquido: {{ format.currency(Number(row.antecipacao.valor_liquido || 0)) }}
              </div>
              <div
                v-if="row.antecipacao?.valor_taxa != null"
                class="text-xs font-bold text-rose-500 text-right"
              >
                Taxa: {{ format.currency(Number(row.antecipacao.valor_taxa || 0)) }}
              </div>
              <div class="text-xs font-bold text-gray-400 text-right">
                Comp.: {{ format.currency(Number(row.valor_compensado || 0)) }}
              </div>
            </template>

            <template #cell-status="{ row }">
              <StatusBadge :value="row.status" />
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end items-center gap-2 flex-nowrap">
                <template v-if="isContaRecebida(row)">
                  <span class="h-8 px-3 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1.5 border border-emerald-200">
                    <i class="pi pi-check text-[10px]"></i>
                    Pago
                  </span>
                  <span class="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                    {{ formatarDataAcao(row.recebido_em) }}
                  </span>
                </template>

                <template v-else-if="normalizeStatus(row.status) === 'CANCELADO'">
                  <span class="h-8 px-3 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1.5 border border-slate-200">
                    Cancelado
                  </span>
                </template>

                <button
                  v-else
                  type="button"
                  class="h-8 px-3 rounded-lg bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-600 active:scale-[0.98] transition-all inline-flex items-center gap-1.5 shrink-0 disabled:opacity-60"
                  :disabled="acaoLoadingId === row.id"
                  @click="abrirReceber(row)"
                >
                  <i class="pi pi-check text-xs"></i>
                  Receber
                </button>
              </div>
            </template>
            </Table>
          </div>
        </template>

        <!-- MODAL: RECEBER -->
        <transition name="fade-slide">
          <div
            v-if="receberModal.open"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
            @mousedown.self="fecharReceber"
          >
            <div class="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

            <div class="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden">
              <div class="px-6 py-5 border-b border-gray-100 bg-gray-50/40">
                <div class="text-xs font-black uppercase tracking-[0.22em] text-gray-400">Receber</div>
                <div class="text-lg font-black text-gray-900">
                  Conta a Receber #{{ receberModal.id }}
                </div>
              </div>

              <div class="p-6 space-y-6">
                <div class="grid grid-cols-12 gap-4">
                  <div class="col-span-12 md:col-span-6">
                    <Input :modelValue="receberModal.parteLabel" label="Parte" readonly />
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <Input :modelValue="receberModal.origemLabel" label="Origem" readonly />
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <Input :modelValue="format.currency(Number(receberModal.valor_original || 0))" label="Valor" readonly />
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <Input :modelValue="format.date(receberModal.vencimento_em)" label="Vencimento" readonly />
                  </div>
                </div>

                <div class="h-px bg-slate-100"></div>

                <div class="grid grid-cols-12 gap-4">
                  <div class="col-span-12 md:col-span-6">
                    <SearchInput
                      v-model="receberModal.forma_recebimento_chave"
                      mode="search"
                      label="Forma de recebimento (chave)"
                      placeholder="Ex: PIX, DINHEIRO, CARTAO..."
                    />
                    <div
                      v-if="receberModal.formas_disponiveis.length > 1"
                      class="mt-1 text-[10px] font-bold text-amber-600"
                    >
                      Pagamento misto: {{ receberModal.formas_disponiveis.join(' + ') }}. Selecione a forma desta baixa.
                    </div>
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <label class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2 block">
                      {{ isPixNoModal ? 'Data do PIX' : 'Data de recebimento' }}
                    </label>
                    <input
                      type="datetime-local"
                      class="w-full h-12 px-4 rounded-2xl bg-gray-100 border-none font-bolding text-gray-700 font-bold"
                      v-model="receberModal.recebido_em_input"
                    />
                  </div>

                  <div class="col-span-12">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      :disabled="!podeAnteciparNoModal && !receberModal.antecipacao_ativa"
                      @click="toggleAntecipacao"
                    >
                      {{ receberModal.antecipacao_ativa ? 'Remover antecipação' : 'Antecipar cartão (calcular taxa)' }}
                    </Button>
                    <div
                      v-if="!podeAnteciparNoModal && !receberModal.antecipacao_ativa"
                      class="mt-1 text-[10px] font-bold text-slate-500"
                    >
                      Antecipação disponível apenas para cartão (CREDITO/CARTAO).
                    </div>
                  </div>

                  <template v-if="receberModal.antecipacao_ativa">
                    <div
                      v-if="Array.isArray(receberModal.parcelas_venda) && receberModal.parcelas_venda.length"
                      class="col-span-12 rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2"
                    >
                      <div class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Selecione parcelas para antecipar
                      </div>
                      <div class="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          class="h-7 px-2.5 rounded-lg bg-white border border-slate-200 text-[10px] font-black uppercase tracking-wide text-slate-600 hover:bg-slate-100"
                          @click="selecionarTodasParcelasAntecipacao"
                        >
                          Selecionar todas
                        </button>
                        <button
                          type="button"
                          class="h-7 px-2.5 rounded-lg bg-white border border-slate-200 text-[10px] font-black uppercase tracking-wide text-slate-600 hover:bg-slate-100"
                          @click="selecionarParcelasVencidasAntecipacao"
                        >
                          Selecionar vencidas
                        </button>
                        <button
                          type="button"
                          class="h-7 px-2.5 rounded-lg bg-white border border-slate-200 text-[10px] font-black uppercase tracking-wide text-slate-500 hover:bg-slate-100"
                          @click="limparParcelasAntecipacao"
                        >
                          Limpar seleção
                        </button>
                      </div>
                      <div class="max-h-36 overflow-y-auto pr-1 space-y-1">
                        <label
                          v-for="p in receberModal.parcelas_venda"
                          :key="p.__key"
                          class="flex items-center justify-between gap-2 text-xs font-bold"
                          :class="parcelaElegivelAntecipacao(p) ? 'text-slate-700' : 'text-slate-400'"
                        >
                          <span class="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              :checked="receberModal.parcelas_antecipacao_keys.includes(p.__key)"
                              :disabled="!parcelaElegivelAntecipacao(p)"
                              @change="toggleParcelaAntecipacao(p.__key)"
                            />
                            {{ p.parcela }}x — {{ format.date(p.vencimento_em) }} — {{ format.currency(Number(p.valor || 0)) }}
                          </span>
                          <span class="text-[10px] uppercase">{{ p.forma_pagamento_chave || '—' }}</span>
                        </label>
                      </div>
                    </div>

                    <div class="col-span-12 md:col-span-4">
                      <Input
                        :modelValue="format.currency(valorBaseAntecipacao)"
                        label="Valor base antecipado"
                        readonly
                      />
                    </div>
                    <div class="col-span-12 md:col-span-4">
                      <SearchInput
                        v-model="receberModal.antecipacao_taxa_percentual"
                        mode="search"
                        label="Taxa antecipação (%)"
                        placeholder="Ex: 3.5"
                      />
                    </div>
                    <div class="col-span-12 md:col-span-4">
                      <Input
                        :modelValue="format.currency(valorTaxaAntecipacao)"
                        label="Valor da taxa"
                        readonly
                      />
                    </div>
                    <div class="col-span-12 md:col-span-4">
                      <Input
                        :modelValue="format.currency(valorLiquidoAntecipacao)"
                        label="Valor líquido recebido"
                        readonly
                      />
                    </div>
                  </template>

                  <div class="col-span-12">
                    <SearchInput
                      v-model="receberModal.observacao"
                      mode="search"
                      label="Observação"
                      placeholder="Opcional..."
                    />
                  </div>
                </div>
              </div>

              <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/40 flex items-center justify-end gap-3">
                <Button variant="secondary" type="button" :disabled="receberModal.saving" @click="fecharReceber">
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  :loading="receberModal.saving"
                  :disabled="!podeConfirmarRecebimento"
                  @click="confirmarRecebimento"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { FinanceiroService, VendaService } from '@/services/index'
import { format } from '@/utils/format'
import { ANTECIPACAO, getTaxaAntecipacaoPercentual } from '@/constantes'

definePage({ meta: { perm: 'contas_receber.ver' } })

// ✅ sem importar componentes (já estão no main.js)

const loading = ref(true)
const rows = ref([])

const filtroTexto = ref('')
const abaAtiva = ref('A_PAGAR')

const acaoLoadingId = ref(null)
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

// colunas
const columns = [
  { key: 'partes', label: 'Parte / Descrição' },
  { key: 'origem', label: 'Origem', width: '180px' },
  { key: 'vencimento', label: 'Vencimento', width: '160px' },
  { key: 'valor', label: 'Valor', width: '200px', align: 'right' },
  { key: 'status', label: 'Status', width: '160px' },
  { key: 'acoes', label: 'Ações', width: '160px', align: 'right' },
]

// filtros em memória
const rowsFiltrados = computed(() => {
  const txt = String(filtroTexto.value || '').trim().toLowerCase()

  return (rows.value || []).filter((r) => {
    if (!txt) return true

    const hay = [
      r.descricao,
      r.observacao,
      r.cliente_nome,
      r.origem_tipo,
      r.origem_id,
      r.status,
      r.forma_recebimento_chave,
      r.cliente_id,
      r.fornecedor_id,
      ...(Array.isArray(r.ambientes_venda) ? r.ambientes_venda : []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return hay.includes(txt)
  })
})
const rowsVencidos = computed(() =>
  rowsFiltrados.value.filter((r) => normalizeStatus(r.status) === 'VENCIDO'),
)
const rowsAPagar = computed(() =>
  rowsFiltrados.value.filter((r) => normalizeStatus(r.status) === 'EM_ABERTO'),
)
const rowsPagos = computed(() =>
  rowsFiltrados.value.filter((r) => {
    const s = normalizeStatus(r.status)
    return s === 'PAGO' || s === 'RECEBIDO'
  }),
)
const rowsAbaAtiva = computed(() => {
  if (abaAtiva.value === 'VENCIDOS') return rowsVencidos.value
  if (abaAtiva.value === 'A_PAGAR') return rowsAPagar.value
  return rowsPagos.value
})
const tabs = computed(() => [
  { id: 'VENCIDOS', label: 'Vencidas', count: rowsVencidos.value.length, activeClass: 'bg-rose-100 text-rose-700 border-b-2 border-rose-500' },
  { id: 'A_PAGAR', label: 'A pagar', count: rowsAPagar.value.length, activeClass: 'bg-amber-100 text-amber-800 border-b-2 border-amber-500' },
  { id: 'PAGOS', label: 'Pagos', count: rowsPagos.value.length, activeClass: 'bg-emerald-100 text-emerald-700 border-b-2 border-emerald-500' },
])

function normalizeStatus(status) {
  return String(status || '').trim().toUpperCase()
}
function isContaRecebida(row) {
  const s = normalizeStatus(row?.status)
  return s === 'PAGO' || s === 'RECEBIDO'
}
function formatarDataAcao(value) {
  if (!value) return 'sem data'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'sem data'
  return `em ${d.toLocaleDateString('pt-BR')}`
}
function formasDaLinha(row) {
  const formas = Array.from(
    new Set(
      (Array.isArray(row?.parcelas_venda) ? row.parcelas_venda : [])
        .map((p) => String(p?.forma_pagamento_chave || '').trim().toUpperCase())
        .filter(Boolean),
    ),
  )
  if (!formas.length && row?.forma_recebimento_chave) {
    formas.push(String(row.forma_recebimento_chave).trim().toUpperCase())
  }
  return formas
}
function labelFormas(row) {
  const formas = formasDaLinha(row)
  if (!formas.length) return ''
  if (formas.length === 1) return `Forma: ${formas[0]}`
  return `Formas: ${formas.join(' + ')}`
}

const contagens = computed(() => {
  const base = rowsAbaAtiva.value || []
  const c = { total: base.length, recebido: 0, aberto: 0 }
  for (const r of base) {
    const s = String(r.status || '').toUpperCase()
    if (s === 'PAGO' || s === 'RECEBIDO') c.recebido += 1
    else c.aberto += 1
  }
  return c
})

const totais = computed(() => {
  const base = rowsAbaAtiva.value || []
  const t = { total: 0, recebido: 0, aberto: 0 }

  for (const r of base) {
    const s = String(r.status || '').toUpperCase()
    const v = Number(r.valor_original || 0)
    t.total += v
    if (s === 'PAGO' || s === 'RECEBIDO') t.recebido += v
    else t.aberto += v
  }
  return t
})

async function carregar() {
  loading.value = true
  try {
    const params = {
      data_ini: filtros.data_ini || undefined,
      data_fim: filtros.data_fim || undefined,
    }

    const { data } = await FinanceiroService.listarReceber(params)
    const baseRows = Array.isArray(data) ? data : []
    rows.value = await enriquecerRowsComVenda(baseRows)
  } finally {
    loading.value = false
  }
}
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

async function enriquecerRowsComVenda(baseRows) {
  const rowsIn = Array.isArray(baseRows) ? baseRows : []
  const precisaVendaIds = Array.from(
    new Set(
      rowsIn
        .filter((r) => {
          const origem = String(r?.origem_tipo || '').toUpperCase()
          const vendaId = Number(r?.origem_id || 0)
          if (!origem.includes('VENDA') || !vendaId) return false
          const semCliente = !String(r?.cliente_nome || '').trim()
          const semAmbientes = !Array.isArray(r?.ambientes_venda) || r.ambientes_venda.length === 0
          const semParcelas = !Array.isArray(r?.parcelas_venda) || r.parcelas_venda.length === 0
          return semCliente || semAmbientes || semParcelas
        })
        .map((r) => Number(r?.origem_id || 0))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  )
  if (!precisaVendaIds.length) return rowsIn

  const vendaMap = new Map()
  await Promise.all(
    precisaVendaIds.map(async (id) => {
      try {
        const resp = await VendaService.buscar(id)
        const venda = resp?.data ?? resp
        const clienteNome = venda?.cliente?.nome_completo || venda?.cliente?.razao_social || null
        const ambientes = Array.from(
          new Set(
            (Array.isArray(venda?.itens) ? venda.itens : [])
              .map((it) => String(it?.nome_ambiente || '').trim())
              .filter(Boolean),
          ),
        )
        const pagamentos = Array.isArray(venda?.pagamentos) ? venda.pagamentos : []
        const parcelas = pagamentos.map((p, idx) => ({
          parcela: idx + 1,
          valor: Number(p?.valor || 0),
          forma_pagamento_chave: p?.forma_pagamento_chave || null,
          status: p?.status_financeiro_chave || null,
          vencimento_em: p?.data_prevista_recebimento || p?.data_recebimento || null,
        }))
        vendaMap.set(id, {
          cliente_nome: clienteNome,
          ambientes_venda: ambientes,
          parcelas_venda: parcelas,
        })
      } catch (_) {
        // mantém dados como vieram da API financeira
      }
    }),
  )

  return rowsIn.map((r) => {
    const vendaId = Number(r?.origem_id || 0)
    const extra = vendaMap.get(vendaId)
    if (!extra) return r
    return {
      ...r,
      cliente_nome: r?.cliente_nome || extra.cliente_nome,
      ambientes_venda:
        Array.isArray(r?.ambientes_venda) && r.ambientes_venda.length
          ? r.ambientes_venda
          : extra.ambientes_venda,
      parcelas_venda:
        Array.isArray(r?.parcelas_venda) && r.parcelas_venda.length
          ? r.parcelas_venda
          : extra.parcelas_venda,
    }
  })
}

// =======================
// MODAL RECEBER
// =======================
const receberModal = reactive({
  open: false,
  saving: false,

  id: null,

  cliente_id: null,
  fornecedor_id: null,

  origem_tipo: null,
  origem_id: null,

  descricao: '',
  observacao: '',

  valor_original: 0,
  valor_compensado: 0,

  vencimento_em: null,

  forma_recebimento_chave: '',
  formas_disponiveis: [],
  recebido_em_input: '',
  parcelas_venda: [],
  parcelas_antecipacao_keys: [],
  antecipacao_ativa: false,
  antecipacao_taxa_percentual: 0,
})

function round2(v) {
  return Math.round((Number(v || 0) + Number.EPSILON) * 100) / 100
}
function toPercentNumber(v) {
  const n = Number(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

const valorTaxaAntecipacao = computed(() => {
  if (!receberModal.antecipacao_ativa) return 0
  const valor = Number(valorBaseAntecipacao.value || 0)
  const taxa = toPercentNumber(receberModal.antecipacao_taxa_percentual)
  return round2((valor * taxa) / 100)
})

const valorLiquidoAntecipacao = computed(() => {
  if (!receberModal.antecipacao_ativa) return Number(receberModal.valor_original || 0)
  const valor = Number(valorBaseAntecipacao.value || 0)
  return round2(Math.max(valor - valorTaxaAntecipacao.value, 0))
})
const valorBaseAntecipacao = computed(() => {
  if (!receberModal.antecipacao_ativa) return Number(receberModal.valor_original || 0)
  const parcelas = Array.isArray(receberModal.parcelas_venda) ? receberModal.parcelas_venda : []
  if (!parcelas.length) return Number(receberModal.valor_original || 0)
  const selecionadas = parcelas.filter((p) => receberModal.parcelas_antecipacao_keys.includes(p.__key))
  if (!selecionadas.length) return 0
  return round2(selecionadas.reduce((s, p) => s + Number(p?.valor || 0), 0))
})
const isPixNoModal = computed(
  () => String(receberModal.forma_recebimento_chave || '').trim().toUpperCase() === 'PIX',
)
const podeAnteciparNoModal = computed(() => {
  const forma = String(receberModal.forma_recebimento_chave || '').trim().toUpperCase()
  return forma === 'CREDITO' || forma === 'CARTAO'
})

function toInputDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${hh}:${mm}`
}
function inputToISO(v) {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

const podeConfirmarRecebimento = computed(() => {
  if (receberModal.saving) return false
  if (!receberModal.id) return false
  // data de recebimento pode ser agora se vazio, mas vou exigir preenchido pra não inventar
  if (!String(receberModal.recebido_em_input || '').trim()) return false
  if (receberModal.antecipacao_ativa && toPercentNumber(receberModal.antecipacao_taxa_percentual) < 0) return false
  if (receberModal.antecipacao_ativa && Number(valorBaseAntecipacao.value || 0) <= 0) return false
  // forma_recebimento é opcional no model, então não obrigo
  return true
})

function abrirReceber(row) {
  const status = String(row?.status || '').toUpperCase()
  if (status === 'PAGO' || status === 'RECEBIDO' || status === 'CANCELADO') return

  receberModal.open = true
  receberModal.saving = false

  receberModal.id = row.id

  receberModal.cliente_id = row.cliente_id ?? null
  receberModal.fornecedor_id = row.fornecedor_id ?? null

  receberModal.origem_tipo = row.origem_tipo ?? null
  receberModal.origem_id = row.origem_id ?? null

  receberModal.descricao = row.descricao ?? ''
  receberModal.observacao = row.observacao ?? ''

  receberModal.valor_original = Number(row.valor_original || 0)
  receberModal.valor_compensado = Number(row.valor_compensado || 0)

  receberModal.vencimento_em = row.vencimento_em ?? null

  const formas = formasDaLinha(row)
  receberModal.formas_disponiveis = formas
  receberModal.forma_recebimento_chave = formas.length === 1 ? formas[0] : (row.forma_recebimento_chave ?? '')
  receberModal.parcelas_venda = (Array.isArray(row?.parcelas_venda) ? row.parcelas_venda : []).map((p, idx) => ({
    ...p,
    __key: `${p?.parcela ?? idx + 1}-${p?.vencimento_em ?? ''}-${idx}`,
  }))
  receberModal.parcelas_antecipacao_keys = []
  receberModal.recebido_em_input = toInputDateTime(new Date().toISOString())
  receberModal.antecipacao_ativa = false
  receberModal.antecipacao_taxa_percentual = 0
}

function toggleAntecipacao() {
  if (!receberModal.antecipacao_ativa && !podeAnteciparNoModal.value) return
  receberModal.antecipacao_ativa = !receberModal.antecipacao_ativa
  if (!receberModal.antecipacao_ativa) return

  if (!receberModal.parcelas_antecipacao_keys.length && Array.isArray(receberModal.parcelas_venda)) {
    receberModal.parcelas_antecipacao_keys = receberModal.parcelas_venda
      .filter((p) => parcelaElegivelAntecipacao(p))
      .map((p) => p.__key)
  }

  const forma = String(receberModal.forma_recebimento_chave || '').trim().toUpperCase() || ANTECIPACAO.modalidade_padrao
  receberModal.antecipacao_taxa_percentual = getTaxaAntecipacaoPercentual(forma)
}
function parcelaElegivelAntecipacao(parcela) {
  const forma = String(parcela?.forma_pagamento_chave || '').trim().toUpperCase()
  return forma === 'CREDITO' || forma === 'CARTAO'
}
function toggleParcelaAntecipacao(key) {
  const atual = Array.isArray(receberModal.parcelas_antecipacao_keys)
    ? receberModal.parcelas_antecipacao_keys
    : []
  if (atual.includes(key)) {
    receberModal.parcelas_antecipacao_keys = atual.filter((k) => k !== key)
  } else {
    receberModal.parcelas_antecipacao_keys = [...atual, key]
  }
}
function selecionarTodasParcelasAntecipacao() {
  const parcelas = Array.isArray(receberModal.parcelas_venda) ? receberModal.parcelas_venda : []
  receberModal.parcelas_antecipacao_keys = parcelas
    .filter((p) => parcelaElegivelAntecipacao(p))
    .map((p) => p.__key)
}
function limparParcelasAntecipacao() {
  receberModal.parcelas_antecipacao_keys = []
}
function selecionarParcelasVencidasAntecipacao() {
  const agora = Date.now()
  const parcelas = Array.isArray(receberModal.parcelas_venda) ? receberModal.parcelas_venda : []
  receberModal.parcelas_antecipacao_keys = parcelas
    .filter((p) => {
      if (!parcelaElegivelAntecipacao(p)) return false
      const d = p?.vencimento_em ? new Date(p.vencimento_em) : null
      if (!d || Number.isNaN(d.getTime())) return false
      return d.getTime() < agora
    })
    .map((p) => p.__key)
}

function fecharReceber() {
  receberModal.open = false
}

const parteLabel = computed(() => {
  if (receberModal.cliente_id) return `Cliente #${receberModal.cliente_id}`
  if (receberModal.fornecedor_id) return `Fornecedor #${receberModal.fornecedor_id}`
  return '—'
})
const origemLabel = computed(() => {
  const t = receberModal.origem_tipo ? String(receberModal.origem_tipo) : ''
  const id = receberModal.origem_id ? `#${receberModal.origem_id}` : '—'
  return t ? `${t} ${id}` : '—'
})

Object.defineProperty(receberModal, 'parteLabel', { get: () => parteLabel.value })
Object.defineProperty(receberModal, 'origemLabel', { get: () => origemLabel.value })

async function confirmarRecebimento() {
  if (!podeConfirmarRecebimento.value) return
  acaoLoadingId.value = receberModal.id
  receberModal.saving = true

  try {
    const payload = {
      recebido_em: inputToISO(receberModal.recebido_em_input),
      forma_recebimento_chave: receberModal.forma_recebimento_chave
        ? String(receberModal.forma_recebimento_chave).trim()
        : null,
      observacao: (() => {
        const base = receberModal.observacao ? String(receberModal.observacao).trim() : ''
        if (!receberModal.antecipacao_ativa) return base || null

        const taxa = round2(toPercentNumber(receberModal.antecipacao_taxa_percentual))
        const valorTaxa = valorTaxaAntecipacao.value
        const valorLiquido = valorLiquidoAntecipacao.value
        const parcelas = (Array.isArray(receberModal.parcelas_venda) ? receberModal.parcelas_venda : [])
          .filter((p) => receberModal.parcelas_antecipacao_keys.includes(p.__key))
          .map((p) => p.parcela)
          .filter((n) => Number.isFinite(Number(n)))
          .join(',')
        const detalhe = `ANTECIPACAO_CARTAO parcelas=${parcelas || 'todas'} valor_base=${valorBaseAntecipacao.value} taxa=${taxa}% valor_taxa=${valorTaxa} valor_liquido=${valorLiquido}`
        return base ? `${base} | ${detalhe}` : detalhe
      })(),
    }

    await FinanceiroService.receber(receberModal.id, payload)
    fecharReceber()
    await carregar()
  } finally {
    receberModal.saving = false
    acaoLoadingId.value = null
  }
}

onMounted(carregar)
watch(
  () => receberModal.forma_recebimento_chave,
  () => {
    if (!receberModal.antecipacao_ativa) return
    const forma = String(receberModal.forma_recebimento_chave || '').trim().toUpperCase() || ANTECIPACAO.modalidade_padrao
    receberModal.antecipacao_taxa_percentual = getTaxaAntecipacaoPercentual(forma)
  },
)
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.16s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
