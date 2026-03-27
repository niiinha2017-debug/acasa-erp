<!-- src/pages/financeiro/contas-receber/index.vue -->
<template>
  <PageShell :padded="false">
    <section class="contas-receber-page ds-page-context ds-page-context--list animate-page-in">
      <div class="contas-receber-page__top-bar">
        <h1 class="contas-receber-page__top-title">Contas a Receber</h1>

        <div class="contas-receber-page__top-filters">
          <SearchInput
            v-model="filtroTexto"
            placeholder="Buscar cliente, fornecedor..."
            class="contas-receber-page__top-search"
          />

          <MonthReferenceField
            v-model="mesReferencia"
            class="contas-receber-page__top-month"
            label=""
          />
        </div>
      </div>

      <div class="contas-receber-page__sub-bar">
        <nav class="contas-receber-page__tabs-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="contas-receber-page__tab"
            :class="{ 'contas-receber-page__tab--active': abaAtiva === tab.id }"
            @click="abaAtiva = tab.id"
          >
            <span>{{ tab.label }}</span>
            <span class="contas-receber-page__tab-count">{{ tab.count }}</span>
          </button>
        </nav>

        <div class="contas-receber-page__inline-totals">
          <span class="contas-receber-page__inline-stat contas-receber-page__inline-stat--total">
            Total <strong>{{ format.currency(totais.total) }}</strong>
          </span>
          <span class="contas-receber-page__inline-stat contas-receber-page__inline-stat--success">
            Recebido <strong>{{ format.currency(totais.recebido) }}</strong>
          </span>
          <span class="contas-receber-page__inline-stat contas-receber-page__inline-stat--warning">
            Aberto <strong>{{ format.currency(totais.aberto) }}</strong>
          </span>
        </div>
      </div>

      <div class="contas-receber-page__content ds-page-context__content">

        <section class="contas-receber-page__table">
          <Loading v-if="loading" />
          <Table
            v-else
            :columns="columns"
            :rows="rowsAbaAtiva"
            :loading="false"
            empty-text="Nenhuma conta a receber encontrada."
            :boxed="false"
            :flush="true"
          >
            <template #cell-partes="{ row }">
              <div class="contas-receber-page__identity">
                <div class="contas-receber-page__identity-copy">
                  <span class="contas-receber-page__primary">
                    {{ partePrincipal(row) }}
                  </span>
                  <span v-if="Array.isArray(row.ambientes_venda) && row.ambientes_venda.length" class="contas-receber-page__ambient-copy">
                    {{ row.ambientes_venda.slice(0, 3).join(', ') }}{{ row.ambientes_venda.length > 3 ? ` +${row.ambientes_venda.length - 3}` : '' }}
                  </span>
                </div>
              </div>
            </template>

            <template #cell-origem="{ row }">
              <div class="contas-receber-page__origin-stack">
                <span class="contas-receber-page__primary">{{ row.origem_tipo || '—' }}</span>
                <span class="contas-receber-page__secondary">{{ row.origem_id ? `#${row.origem_id}` : '—' }}</span>
                <span v-if="labelFormas(row)" class="contas-receber-page__secondary">{{ labelFormas(row) }}</span>
              </div>
            </template>

            <template #cell-vencimento="{ row }">
              <div class="contas-receber-page__date-stack">
                <span class="contas-receber-page__date-value">{{ format.date(row.vencimento_em) }}</span>
                <div
                  v-if="Array.isArray(row.parcelas_venda) && row.parcelas_venda.length"
                  class="contas-receber-page__installments"
                >
                  <div
                    v-for="p in row.parcelas_venda"
                    :key="`parcela-${row.id}-${p.parcela}`"
                    class="contas-receber-page__installment-item"
                  >
                    {{ p.parcela }}x — {{ format.date(p.vencimento_em) }}
                  </div>
                </div>
                <span
                  v-if="String(row.forma_recebimento_chave || '').toUpperCase() === 'PIX' && row.recebido_em"
                  class="contas-receber-page__pix-copy"
                >
                  PIX: {{ format.date(row.recebido_em) }}
                </span>
              </div>
            </template>

            <template #cell-valor="{ row }">
              <div class="contas-receber-page__amount-stack">
                <span class="contas-receber-page__amount">{{ format.currency(Number(row.valor_original || 0)) }}</span>
                <span
                  v-if="row.antecipacao?.valor_liquido != null"
                  class="contas-receber-page__amount contas-receber-page__amount--success"
                >
                  Líquido: {{ format.currency(Number(row.antecipacao.valor_liquido || 0)) }}
                </span>
                <span
                  v-if="row.antecipacao?.valor_taxa != null"
                  class="contas-receber-page__amount contas-receber-page__amount--danger"
                >
                  Taxa: {{ format.currency(Number(row.antecipacao.valor_taxa || 0)) }}
                </span>
                <span class="contas-receber-page__secondary">Comp.: {{ format.currency(Number(row.valor_compensado || 0)) }}</span>
              </div>
            </template>

            <template #cell-status="{ row }">
              <StatusBadge :value="row.status" />
            </template>

            <template #cell-acoes="{ row }">
              <div class="contas-receber-page__actions-cell">
                <template v-if="isContaRecebida(row)">
                  <span class="contas-receber-page__done-pill">
                    <i class="pi pi-check text-[10px]"></i>
                    Pago
                  </span>
                  <span class="contas-receber-page__action-date">{{ formatarDataAcao(row.recebido_em) }}</span>
                  <button
                    v-if="!temParcelas(row)"
                    type="button"
                    class="contas-receber-page__parcela-button contas-receber-page__parcela-button--danger"
                    :disabled="acaoLoadingId === row.id"
                    @click="estornarConta(row)"
                  >
                    Excluir baixa
                  </button>
                  <div
                    v-if="temParcelas(row) && parcelasParaExcluirBaixa(row).length"
                    class="contas-receber-page__parcelas-actions"
                  >
                    <button
                      v-for="parcela in parcelasParaExcluirBaixa(row)"
                      :key="`estornar-parcela-${row.id}-${parcela.id || parcela.parcela}`"
                      type="button"
                      class="contas-receber-page__parcela-button contas-receber-page__parcela-button--danger"
                      :disabled="acaoLoadingId === row.id"
                      @click="estornarParcelaRapida(row, parcela)"
                    >
                      Excluir {{ parcela.parcela }}x
                    </button>
                  </div>
                </template>

                <template v-else-if="normalizeStatus(row.status) === 'CANCELADO'">
                  <span class="contas-receber-page__cancel-pill">Cancelado</span>
                </template>

                <button
                  v-else-if="!temParcelas(row)"
                  type="button"
                  class="contas-receber-page__action-button"
                  :disabled="acaoLoadingId === row.id"
                  @click="abrirReceber(row)"
                >
                  <i class="pi pi-check text-xs"></i>
                  Receber
                </button>
                <button
                  v-if="podeExcluirLancamento(row)"
                  type="button"
                  class="contas-receber-page__parcela-button contas-receber-page__parcela-button--danger"
                  :disabled="acaoLoadingId === row.id"
                  @click="excluirContaAberta(row)"
                >
                  Excluir lançamento
                </button>
                <div
                  v-if="!isContaRecebida(row) && parcelasPendentes(row).length"
                  class="contas-receber-page__parcelas-actions"
                >
                  <button
                    v-for="parcela in parcelasPendentes(row)"
                    :key="`receber-parcela-${row.id}-${parcela.id || parcela.parcela}`"
                    type="button"
                    class="contas-receber-page__parcela-button"
                    :disabled="acaoLoadingId === row.id"
                    @click="abrirReceberParcela(row, parcela)"
                  >
                    {{ parcela.parcela }}x
                  </button>
                </div>
                <div
                  v-if="!isContaRecebida(row) && parcelasPagas(row).length"
                  class="contas-receber-page__parcelas-actions"
                >
                  <button
                    v-for="parcela in parcelasPagas(row)"
                    :key="`estornar-parcela-open-${row.id}-${parcela.id || parcela.parcela}`"
                    type="button"
                    class="contas-receber-page__parcela-button contas-receber-page__parcela-button--danger"
                    :disabled="acaoLoadingId === row.id"
                    @click="estornarParcelaRapida(row, parcela)"
                  >
                    Excluir {{ parcela.parcela }}x
                  </button>
                </div>
              </div>
            </template>
          </Table>
        </section>

        <!-- MODAL: RECEBER -->
        <transition name="fade-slide">
          <div
            v-if="receberModal.open"
            class="contas-receber-page__dialog"
            @mousedown.self="fecharReceber"
          >
            <div class="contas-receber-page__dialog-backdrop"></div>

            <div class="contas-receber-page__dialog-card">
              <div class="contas-receber-page__dialog-header">
                <div class="contas-receber-page__dialog-header-main">
                  <div class="contas-receber-page__dialog-kicker">Receber</div>
                  <div class="contas-receber-page__dialog-title">
                    Conta a Receber #{{ receberModal.id }}
                  </div>
                </div>
                <button
                  type="button"
                  class="contas-receber-page__dialog-close"
                  aria-label="Fechar"
                  @click="fecharReceber"
                >
                  <i class="pi pi-times text-sm"></i>
                </button>
                <div
                  v-if="receberModal.preview"
                  class="contas-receber-page__dialog-alert contas-receber-page__dialog-alert--preview"
                >
                  Prévia visual em desenvolvimento. A confirmação fica desabilitada e nenhum dado real será gravado.
                </div>
              </div>

              <div class="contas-receber-page__dialog-body">
                <div class="contas-receber-page__dialog-grid">
                  <div v-if="receberModal.parcela_numero" class="col-span-12 md:col-span-6">
                    <Input
                      :modelValue="`${receberModal.parcela_numero}x`"
                      label="Parcela em baixa"
                      readonly
                    />
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <Input :modelValue="parteLabel" label="Parte" readonly />
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <Input :modelValue="origemLabel" label="Origem" readonly />
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <Input :modelValue="format.currency(Number(receberModal.valor_original || 0))" label="Valor" readonly />
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <Input :modelValue="format.date(receberModal.vencimento_em)" label="Vencimento" readonly />
                  </div>
                </div>

                <div class="contas-receber-page__dialog-divider"></div>

                <div class="contas-receber-page__dialog-grid">
                  <div class="col-span-12 md:col-span-6">
                    <label class="contas-receber-page__dialog-label">
                      Forma de recebimento
                    </label>
                    <select
                      v-model="receberModal.forma_recebimento_chave"
                      class="contas-receber-page__dialog-input"
                    >
                      <option
                        v-for="opt in formasPagamentoOptions"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </option>
                    </select>
                    <div
                      v-if="receberModal.formas_previstas.length > 1"
                      class="contas-receber-page__dialog-alert contas-receber-page__dialog-alert--warning"
                    >
                      Pagamento misto: {{ receberModal.formas_previstas.join(' + ') }}. Selecione a forma desta baixa.
                    </div>
                  </div>

                  <div class="col-span-12 md:col-span-6">
                    <label class="contas-receber-page__dialog-label">
                      {{ isPixNoModal ? 'Data do PIX' : 'Data de recebimento' }}
                    </label>
                    <input
                      type="datetime-local"
                      class="contas-receber-page__dialog-input"
                      v-model="receberModal.recebido_em_input"
                    />
                  </div>

                  <div class="col-span-12">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      class="contas-receber-page__dialog-toggle"
                      :disabled="!podeAnteciparNoModal && !receberModal.antecipacao_ativa"
                      @click="toggleAntecipacao"
                    >
                      {{ receberModal.antecipacao_ativa ? 'Remover antecipação' : 'Antecipar cartão (calcular taxa)' }}
                    </Button>
                    <div
                      v-if="!podeAnteciparNoModal && !receberModal.antecipacao_ativa"
                      class="contas-receber-page__dialog-note"
                    >
                      Antecipação disponível apenas para cartão (CREDITO/CARTAO).
                    </div>
                  </div>

                  <template v-if="receberModal.antecipacao_ativa">
                    <div
                      v-if="Array.isArray(receberModal.parcelas_venda) && receberModal.parcelas_venda.length"
                      class="col-span-12 contas-receber-page__anticipation-panel"
                    >
                      <div class="contas-receber-page__anticipation-title">
                        Selecione parcelas para antecipar
                      </div>
                      <div class="contas-receber-page__anticipation-toolbar">
                        <button
                          type="button"
                          class="contas-receber-page__anticipation-toolbar-button"
                          @click="selecionarTodasParcelasAntecipacao"
                        >
                          Selecionar todas
                        </button>
                        <button
                          type="button"
                          class="contas-receber-page__anticipation-toolbar-button"
                          @click="selecionarParcelasVencidasAntecipacao"
                        >
                          Selecionar vencidas
                        </button>
                        <button
                          type="button"
                          class="contas-receber-page__anticipation-toolbar-button contas-receber-page__anticipation-toolbar-button--muted"
                          @click="limparParcelasAntecipacao"
                        >
                          Limpar seleção
                        </button>
                      </div>
                      <div class="contas-receber-page__anticipation-list">
                        <label
                          v-for="p in receberModal.parcelas_venda"
                          :key="p.__key"
                          class="contas-receber-page__anticipation-item"
                          :class="parcelaElegivelAntecipacao(p) ? 'text-slate-700' : 'text-slate-400'"
                        >
                          <span class="contas-receber-page__anticipation-item-main">
                            <input
                              type="checkbox"
                              :checked="receberModal.parcelas_antecipacao_keys.includes(p.__key)"
                              :disabled="!parcelaElegivelAntecipacao(p)"
                              @change="toggleParcelaAntecipacao(p.__key)"
                            />
                            {{ p.parcela }}x — {{ format.date(p.vencimento_em) }} — {{ format.currency(Number(p.valor || 0)) }}
                          </span>
                          <span class="contas-receber-page__anticipation-item-tag">{{ p.forma_pagamento_chave || '—' }}</span>
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
                      <Input
                        v-model="receberModal.antecipacao_taxa_percentual"
                        type="number"
                        label="Taxa antecipação (%)"
                        :forceUpper="false"
                        step="0.01"
                        min="0"
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
                    <label class="contas-receber-page__dialog-label" for="receber-observacao">
                      Observação
                    </label>
                    <div class="ds-control-shell contas-receber-page__dialog-textarea-shell">
                      <textarea
                        id="receber-observacao"
                        v-model="receberModal.observacao"
                        class="ds-control-input contas-receber-page__dialog-textarea"
                        placeholder="Opcional..."
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div class="contas-receber-page__dialog-footer">
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
                  {{ receberModal.preview ? 'Prévia bloqueada' : 'Confirmar' }}
                </Button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, watch } from 'vue'
import { FinanceiroService, VendaService } from '@/services/index'
import { format } from '@/utils/format'
import { ANTECIPACAO, FORMAS_PAGAMENTO, getTaxaAntecipacaoPercentual } from '@/constantes'
import MonthReferenceField from '@/components/ui/MonthReferenceField.vue'

definePage({ meta: { perm: 'contas_receber.ver' } })

// ✅ sem importar componentes (já estão no main.js)

const loading = ref(true)
const rows = ref([])

const filtroTexto = ref('')
const abaAtiva = ref('A_RECEBER')

const acaoLoadingId = ref(null)

function getMesReferenciaAtual() {
  const dataAtual = new Date()
  const ano = dataAtual.getFullYear()
  const mes = String(dataAtual.getMonth() + 1).padStart(2, '0')
  return `${ano}-${mes}`
}

function intervaloDoMesReferencia(mesRef) {
  const [anoStr, mesStr] = String(mesRef || '').split('-')
  const ano = Number(anoStr)
  const mes = Number(mesStr)

  if (!ano || !mes) {
    const fallback = getMesReferenciaAtual()
    return intervaloDoMesReferencia(fallback)
  }

  const inicio = new Date(ano, mes - 1, 1)
  const fim = new Date(ano, mes, 0)
  return {
    data_ini: inicio.toISOString().slice(0, 10),
    data_fim: fim.toISOString().slice(0, 10),
    ano,
    mes,
  }
}

const mesReferencia = ref(getMesReferenciaAtual())
const filtros = ref(intervaloDoMesReferencia(mesReferencia.value))
const inicioCompetenciaAtiva = computed(() => {
  const raw = filtros.value?.data_ini
  if (!raw) return null
  const d = new Date(`${raw}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
})
const competenciaAtual = computed(() => {
  const { mes, ano } = intervaloDoMesReferencia(mesReferencia.value)
  return `${String(mes).padStart(2, '0')}/${ano}`
})

// colunas
const columns = [
  { key: 'partes', label: 'Parte' },
  { key: 'origem', label: 'Origem' },
  { key: 'vencimento', label: 'Vencimento' },
  { key: 'valor', label: 'Valor', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: 'Ações', align: 'right' },
]

// filtros em memória
const rowsFiltrados = computed(() => {
  const txt = String(filtroTexto.value || '').trim().toLowerCase()

  return (rows.value || []).filter((r) => {
    if (!txt) return true

    const hay = [
      r.descricao,
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
function isLinhaVencida(row) {
  if (isStatusRecebido(row?.status)) return false
  const status = normalizeStatus(row?.status)
  if (status === 'VENCIDO') return true
  const inicio = inicioCompetenciaAtiva.value
  if (!inicio || !row?.vencimento_em) return false
  const venc = new Date(row.vencimento_em)
  if (Number.isNaN(venc.getTime())) return false
  return venc.getTime() < inicio.getTime()
}
const rowsVencidos = computed(() =>
  rowsFiltrados.value.filter((r) => isLinhaVencida(r)),
)
const rowsAPagar = computed(() =>
  rowsFiltrados.value.filter((r) => !isStatusRecebido(r?.status) && !isLinhaVencida(r)),
)
const rowsPagos = computed(() =>
  rowsFiltrados.value.filter((r) => {
    const s = normalizeStatus(r.status)
    return s === 'PAGO' || s === 'RECEBIDO'
  }),
)
const rowsAbaAtiva = computed(() => {
  if (abaAtiva.value === 'VENCIDOS') return rowsVencidos.value
  if (abaAtiva.value === 'A_RECEBER') return rowsAPagar.value
  return rowsPagos.value
})
const tabs = computed(() => [
  { id: 'VENCIDOS', label: 'Vencidas', count: rowsVencidos.value.length },
  { id: 'A_RECEBER', label: 'Em aberto', count: rowsAPagar.value.length },
  { id: 'PAGOS', label: 'Pagos', count: rowsPagos.value.length },
])

const resumoAbaAtiva = computed(() => {
  if (abaAtiva.value === 'VENCIDOS') {
    return {
      titulo: 'Receitas vencidas acumuladas ate a competência',
      descricao: 'Veja com clareza o que segue em aberto de meses anteriores para priorizar a cobrança.',
    }
  }

  if (abaAtiva.value === 'PAGOS') {
    return {
      titulo: 'Histórico de recebimentos confirmados',
      descricao: 'Use esta visão para auditoria das entradas já baixadas e conferência das antecipações.',
    }
  }

  return {
    titulo: 'Receitas em aberto da competência',
    descricao: 'Acompanhe separadamente o que vence no mês selecionado e o que já ficou vencido de períodos anteriores.',
  }
})

function normalizeStatus(status) {
  return String(status || '').trim().toUpperCase()
}
function isStatusRecebido(status) {
  const s = normalizeStatus(status)
  return s === 'PAGO' || s === 'RECEBIDO'
}
function isContaRecebida(row) {
  return isStatusRecebido(row?.status)
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
const formasPagamentoOptions = (FORMAS_PAGAMENTO || []).map((item) => ({
  label: item.label,
  value: String(item.key || '').trim().toUpperCase(),
}))
const formasPagamentoKeys = formasPagamentoOptions.map((item) => item.value)
function labelFormas(row) {
  const formas = formasDaLinha(row)
  if (!formas.length) return ''
  if (formas.length === 1) return `Forma: ${formas[0]}`
  return `Formas: ${formas.join(' + ')}`
}
function parcelasPendentes(row) {
  const parcelas = Array.isArray(row?.parcelas_venda) ? row.parcelas_venda : []
  return parcelas.filter((p) => !isStatusRecebido(p?.status))
}
function parcelasPagas(row) {
  const parcelas = Array.isArray(row?.parcelas_venda) ? row.parcelas_venda : []
  return parcelas.filter((p) => isStatusRecebido(p?.status))
}
function parcelasParaExcluirBaixa(row) {
  const parcelas = Array.isArray(row?.parcelas_venda) ? row.parcelas_venda : []
  if (!parcelas.length) return []
  const pagas = parcelasPagas(row)
  // Fallback: quando a conta está PAGA mas a API não marcou parcela a parcela.
  return pagas.length ? pagas : parcelas
}
function temParcelas(row) {
  return Array.isArray(row?.parcelas_venda) && row.parcelas_venda.length > 0
}
function podeExcluirLancamento(row) {
  if (isContaRecebida(row)) return false
  if (normalizeStatus(row?.status) === 'CANCELADO') return false
  return Number(row?.valor_compensado || 0) <= 0
}

function partePrincipal(row) {
  if (row?.cliente_nome) {
    const partesNome = String(row.cliente_nome)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
    if (partesNome.length <= 2) return partesNome.join(' ')
    return `${partesNome[0]} ${partesNome[1]}`
  }
  if (row?.cliente_id) return `Cliente #${row.cliente_id}`
  if (row?.fornecedor_id) return `Fornecedor #${row.fornecedor_id}`
  return '—'
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
      data_ini: filtros.value.data_ini || undefined,
      data_fim: filtros.value.data_fim || undefined,
    }

    const { data } = await FinanceiroService.listarReceber(params)
    const baseRows = Array.isArray(data) ? data : []
    rows.value = await enriquecerRowsComVenda(baseRows)
  } finally {
    loading.value = false
  }
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
        const pagamentosOrdenados = [...pagamentos].sort((a, b) => {
          const av = a?.data_prevista_recebimento
            ? new Date(a.data_prevista_recebimento).getTime()
            : Number.POSITIVE_INFINITY
          const bv = b?.data_prevista_recebimento
            ? new Date(b.data_prevista_recebimento).getTime()
            : Number.POSITIVE_INFINITY
          if (av !== bv) return av - bv
          return Number(a?.id || 0) - Number(b?.id || 0)
        })
        const parcelas = pagamentosOrdenados.map((p, idx) => ({
          id: Number(p?.id || 0) || null,
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
  preview: false,

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
  formas_previstas: [],
  recebido_em_input: '',
  venda_pagamento_id: null,
  parcela_numero: null,
  parcelas_venda: [],
  parcelas_antecipacao_keys: [],
  antecipacao_ativa: false,
  antecipacao_taxa_percentual: 0,
})

const mostrarPreviewReceber = import.meta.env.DEV

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
  if (receberModal.preview) return false
  if (!receberModal.id) return false
  // data de recebimento pode ser agora se vazio, mas vou exigir preenchido pra não inventar
  if (!String(receberModal.recebido_em_input || '').trim()) return false
  if (receberModal.antecipacao_ativa && toPercentNumber(receberModal.antecipacao_taxa_percentual) < 0) return false
  if (receberModal.antecipacao_ativa && Number(valorBaseAntecipacao.value || 0) <= 0) return false
  // forma_recebimento é opcional no model, então não obrigo
  return true
})

function preencherReceberModal(row, { preview = false } = {}) {
  receberModal.open = true
  receberModal.saving = false
  receberModal.preview = preview

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

  const formasPrevistas = formasDaLinha(row)
  const formaLinha = String(row?.forma_recebimento_chave || '').trim().toUpperCase()
  const formaInicial = (
    formasPrevistas.find((forma) => formasPagamentoKeys.includes(forma)) ||
    (formasPagamentoKeys.includes(formaLinha) ? formaLinha : '') ||
    formasPagamentoKeys[0] ||
    ''
  )
  receberModal.formas_previstas = formasPrevistas
  receberModal.formas_disponiveis = [...formasPagamentoKeys]
  receberModal.forma_recebimento_chave = formaInicial
  receberModal.venda_pagamento_id = null
  receberModal.parcela_numero = null
  receberModal.parcelas_venda = (Array.isArray(row?.parcelas_venda) ? row.parcelas_venda : []).map((p, idx) => ({
    ...p,
    __key: `${p?.parcela ?? idx + 1}-${p?.vencimento_em ?? ''}-${idx}`,
  }))
  receberModal.parcelas_antecipacao_keys = []
  receberModal.recebido_em_input = toInputDateTime(new Date().toISOString())
  receberModal.antecipacao_ativa = false
  receberModal.antecipacao_taxa_percentual = 0
}

function abrirReceber(row) {
  const status = String(row?.status || '').toUpperCase()
  if (status === 'PAGO' || status === 'RECEBIDO' || status === 'CANCELADO') return
  preencherReceberModal(row)
}

function abrirReceberParcela(row, parcela) {
  const status = String(row?.status || '').toUpperCase()
  if (status === 'PAGO' || status === 'RECEBIDO' || status === 'CANCELADO') return
  if (!parcela) return

  preencherReceberModal(row)
  receberModal.venda_pagamento_id = Number(parcela?.id || 0) || null
  receberModal.parcela_numero = Number(parcela?.parcela || 0) || null
  if (Number(parcela?.valor || 0) > 0) {
    receberModal.valor_original = Number(parcela.valor)
  }
  if (parcela?.forma_pagamento_chave) {
    const formaParcela = String(parcela.forma_pagamento_chave).trim().toUpperCase()
    if (formasPagamentoKeys.includes(formaParcela)) {
      receberModal.forma_recebimento_chave = formaParcela
    }
  }
}

function abrirReceberPreview() {
  preencherReceberModal(
    {
      id: 'PREVIEW',
      cliente_id: 184,
      fornecedor_id: null,
      origem_tipo: 'VENDA',
      origem_id: 9821,
      descricao: 'Prévia visual do modal',
      observacao: 'Cliente pediu antecipação parcial no cartão.',
      valor_original: 4280.5,
      valor_compensado: 0,
      vencimento_em: new Date().toISOString(),
      forma_recebimento_chave: 'CARTAO',
      parcelas_venda: [
        {
          parcela: 1,
          valor: 1426.83,
          forma_pagamento_chave: 'CARTAO',
          status: 'PENDENTE',
          vencimento_em: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          parcela: 2,
          valor: 1426.83,
          forma_pagamento_chave: 'CARTAO',
          status: 'PENDENTE',
          vencimento_em: new Date(Date.now() + 86400000 * 12).toISOString(),
        },
        {
          parcela: 3,
          valor: 1426.84,
          forma_pagamento_chave: 'PIX',
          status: 'PENDENTE',
          vencimento_em: new Date(Date.now() + 86400000 * 28).toISOString(),
        },
      ],
    },
    { preview: true },
  )
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
  receberModal.preview = false
}

function handleReceberModalKeydown(event) {
  if (event.key !== 'Escape') return
  if (!receberModal.open) return
  fecharReceber()
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

// parteLabel e origemLabel são computed refs — usar diretamente no template

async function confirmarRecebimento() {
  if (!podeConfirmarRecebimento.value) return
  acaoLoadingId.value = receberModal.id
  receberModal.saving = true

  try {
    const payload = {
      recebido_em: inputToISO(receberModal.recebido_em_input),
      venda_pagamento_id: receberModal.venda_pagamento_id || undefined,
      parcela: receberModal.parcela_numero || undefined,
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

async function receberParcelaRapida(row, parcela) {
  if (!row?.id || !parcela) return
  acaoLoadingId.value = row.id
  try {
    await FinanceiroService.receber(row.id, {
      recebido_em: new Date().toISOString(),
      venda_pagamento_id: parcela.id || undefined,
      parcela: parcela.parcela || undefined,
      forma_recebimento_chave: parcela.forma_pagamento_chave || row.forma_recebimento_chave || null,
    })
    await carregar()
  } finally {
    acaoLoadingId.value = null
  }
}

async function estornarParcelaRapida(row, parcela) {
  if (!row?.id || !parcela) return
  acaoLoadingId.value = row.id
  try {
    await FinanceiroService.estornarReceber(row.id, {
      venda_pagamento_id: parcela.id || undefined,
      parcela: parcela.parcela || undefined,
    })
    await carregar()
  } finally {
    acaoLoadingId.value = null
  }
}

async function estornarConta(row) {
  if (!row?.id) return
  acaoLoadingId.value = row.id
  try {
    await FinanceiroService.estornarReceber(row.id)
    await carregar()
  } finally {
    acaoLoadingId.value = null
  }
}

async function excluirContaAberta(row) {
  if (!row?.id) return
  if (!podeExcluirLancamento(row)) return
  const ok = window.confirm(
    'Excluir este lançamento de contas a receber? Esta ação não pode ser desfeita.',
  )
  if (!ok) return
  acaoLoadingId.value = row.id
  try {
    await FinanceiroService.removerReceber(row.id)
    await carregar()
  } finally {
    acaoLoadingId.value = null
  }
}

onMounted(() => {
  carregar()
  window.addEventListener('keydown', handleReceberModalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleReceberModalKeydown)
})

watch(mesReferencia, async (novoMes) => {
  filtros.value = intervaloDoMesReferencia(novoMes)
  await carregar()
})
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
.contas-receber-page {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-x: hidden;
}

.contas-receber-page :deep(.ds-shell-card) {
  overflow: visible !important;
}

.contas-receber-page__top-bar {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 0.75rem 1rem;
}

.contas-receber-page__top-title {
  color: var(--ds-color-text);
  font-size: 1.15rem;
  font-weight: 750;
  letter-spacing: -0.025em;
  white-space: nowrap;
  flex-shrink: 0;
}

.contas-receber-page__top-filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.contas-receber-page__top-search {
  flex: 1;
  min-width: 140px;
  max-width: 320px;
}

.contas-receber-page__top-month {
  flex-shrink: 0;
}

.contas-receber-page__sub-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 60%, transparent);
}

.contas-receber-page__inline-totals {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-shrink: 0;
}

.contas-receber-page__inline-stat {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--ds-color-text-soft);
}

.contas-receber-page__inline-stat strong {
  font-weight: 800;
  font-size: 0.82rem;
  letter-spacing: -0.01em;
  text-transform: none;
}

.contas-receber-page__inline-stat--success strong {
  color: var(--ds-color-success, #16a34a);
}

.contas-receber-page__inline-stat--warning strong {
  color: var(--ds-color-warning, #d97706);
}

.contas-receber-page__content {
  width: 100%;
  max-width: none;
  margin-inline: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 0 1.75rem;
}

.contas-receber-page__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
}

.contas-receber-page__hero {
  display: grid;
  gap: 1.25rem;
  padding: 1.2rem 0 1.1rem;
  border-top: 1px solid rgba(214, 224, 234, 0.58);
  border-bottom: 1px solid rgba(214, 224, 234, 0.58);
}

.contas-receber-page__hero-main {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.contas-receber-page__eyebrow,
.contas-receber-page__section-kicker,
.contas-receber-page__field-label {
  color: var(--ds-color-text-faint);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.contas-receber-page__hero-title,
.contas-receber-page__section-title {
  color: var(--ds-color-text);
  font-size: 1.18rem;
  font-weight: 640;
  letter-spacing: -0.02em;
}

.contas-receber-page__hero-copy,
.contas-receber-page__section-copy {
  max-width: 54rem;
  color: var(--ds-color-text-soft);
  font-size: 0.84rem;
  line-height: 1.6;
}

.contas-receber-page__hero-stats,
.contas-receber-page__summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.85rem;
}

.contas-receber-page__hero-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(214, 224, 234, 0.82);
  border-radius: 1rem;
  background: rgba(245, 248, 251, 0.9);
}

.contas-receber-page__hero-stat-label,
.contas-receber-page__summary-label {
  color: var(--ds-color-text-faint);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.contas-receber-page__hero-stat-value,
.contas-receber-page__summary-value {
  color: var(--ds-color-text);
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.03em;
}

.contas-receber-page__hero-stat-help,
.contas-receber-page__summary-help {
  color: var(--ds-color-text-soft);
  font-size: 0.75rem;
  line-height: 1.5;
}

.contas-receber-page__summary-card {
  padding: 1rem 1.05rem;
}

.contas-receber-page__summary-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
}

.contas-receber-page__summary-pill {
  justify-content: center;
  padding-inline: 0.6rem;
  font-size: 0.58rem;
}

.contas-receber-page__filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.2rem 0 1.15rem;
  border-top: 1px solid rgba(214, 224, 234, 0.58);
  border-bottom: 1px solid rgba(214, 224, 234, 0.58);
}

.contas-receber-page__filters-header {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 0.9rem 1.25rem;
}

.contas-receber-page__filters-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0.9rem;
  align-items: end;
}

.contas-receber-page__field {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  min-width: 0;
}

.contas-receber-page__field--search {
  grid-column: span 7;
}

.contas-receber-page__field--month {
  grid-column: span 3;
}

.contas-receber-page__field--action {
  grid-column: span 2;
}

.contas-receber-page__refresh-button {
  width: 100%;
}

.contas-receber-page__tabs-nav {
  display: flex;
  gap: 0;
  min-width: max-content;
}

.contas-receber-page__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.5rem;
  padding: 0 0.85rem;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--ds-color-text-soft);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: color 0.15s ease, border-color 0.15s ease;
  cursor: pointer;
}

.contas-receber-page__tab:hover {
  color: var(--ds-color-text);
}

.contas-receber-page__tab--active {
  color: var(--ds-color-text);
  border-bottom-color: var(--ds-color-primary, #2b6aa0);
}

.contas-receber-page__tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2rem;
  min-height: 1.2rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ds-color-border) 60%, transparent);
  font-size: 0.6rem;
  font-weight: 800;
}

.contas-receber-page__tab--active .contas-receber-page__tab-count {
  background: color-mix(in srgb, var(--ds-color-primary, #2b6aa0) 15%, transparent);
  color: var(--ds-color-primary, #2b6aa0);
}

.contas-receber-page__table {
  overflow-x: auto;
  overflow-y: hidden;
}

.contas-receber-page__table :deep(.ds-table--flush) {
  width: 100% !important;
  max-width: 100% !important;
  margin-inline: 0 !important;
}

.contas-receber-page__table :deep(.ds-table__scroll) {
  overflow-x: hidden;
  width: 100% !important;
}

.contas-receber-page__table :deep(.ds-table__element) {
  table-layout: fixed !important;
  min-width: 0 !important;
  width: 100% !important;
}

.contas-receber-page__table :deep(.ds-table__head-cell:first-child),
.contas-receber-page__table :deep(.ds-table__cell:first-child) {
  width: 25%;
}

.contas-receber-page__table :deep(.ds-table__head-cell:nth-child(2)),
.contas-receber-page__table :deep(.ds-table__cell:nth-child(2)) {
  width: 15%;
}

.contas-receber-page__table :deep(.ds-table__head-cell:nth-child(3)),
.contas-receber-page__table :deep(.ds-table__cell:nth-child(3)) {
  width: 15%;
}

.contas-receber-page__table :deep(.ds-table__head-cell:nth-child(4)),
.contas-receber-page__table :deep(.ds-table__cell:nth-child(4)) {
  width: 17%;
}

.contas-receber-page__table :deep(.ds-table__head-cell:nth-child(5)),
.contas-receber-page__table :deep(.ds-table__cell:nth-child(5)) {
  width: 14%;
}

.contas-receber-page__table :deep(.ds-table__head-cell:nth-child(6)),
.contas-receber-page__table :deep(.ds-table__cell:nth-child(6)) {
  width: 14%;
}

.contas-receber-page__identity,
.contas-receber-page__identity-copy,
.contas-receber-page__origin-stack,
.contas-receber-page__date-stack,
.contas-receber-page__amount-stack {
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.contas-receber-page__identity,
.contas-receber-page__origin-stack,
.contas-receber-page__date-stack,
.contas-receber-page__amount-stack {
  gap: 0.2rem;
}

.contas-receber-page__primary {
  color: var(--ds-color-text);
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.4;
  word-break: break-word;
  white-space: normal;
}

.contas-receber-page__date-value,
.contas-receber-page__amount {
  color: var(--ds-color-text);
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.4;
}

.contas-receber-page__secondary,
.contas-receber-page__ambient-copy,
.contas-receber-page__installment-item,
.contas-receber-page__action-date {
  color: var(--ds-color-text-soft);
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.45;
}

.contas-receber-page__ambient-copy {
  color: #3457a2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contas-receber-page__pix-copy {
  color: #2563eb;
  font-size: 0.68rem;
  font-weight: 700;
}

.contas-receber-page__installments {
  max-height: 5rem;
  overflow-y: auto;
  padding-right: 0.2rem;
}

.contas-receber-page__amount-stack {
  text-align: right;
}

.contas-receber-page__amount--success {
  color: var(--ds-color-success);
}

.contas-receber-page__amount--danger {
  color: var(--ds-color-danger);
}

.contas-receber-page__actions-cell {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.contas-receber-page__parcelas-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.contas-receber-page__parcela-button {
  min-height: 1.7rem;
  padding: 0 0.5rem;
  border: 1px solid rgba(25, 118, 82, 0.2);
  border-radius: 0.6rem;
  background: rgba(22, 124, 92, 0.08);
  color: #0f766e;
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.contas-receber-page__parcela-button--danger {
  border-color: rgba(185, 28, 28, 0.2);
  background: rgba(185, 28, 28, 0.08);
  color: #991b1b;
}

.contas-receber-page__done-pill,
.contas-receber-page__cancel-pill {
  min-height: 1.95rem;
  padding: 0 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid transparent;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.contas-receber-page__done-pill {
  background: rgba(22, 124, 92, 0.1);
  border-color: rgba(22, 124, 92, 0.2);
  color: var(--ds-color-success);
}

.contas-receber-page__cancel-pill {
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(203, 213, 225, 0.86);
  color: #64748b;
}

.contas-receber-page__action-button {
  min-height: 1.95rem;
  padding: 0 0.8rem;
  border: 1px solid rgba(25, 118, 82, 0.1);
  border-radius: 0.75rem;
  background: var(--ds-color-success);
  color: #fff;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.contas-receber-page__action-button:hover {
  opacity: 0.92;
}

.contas-receber-page__action-button:active {
  transform: scale(0.98);
}

.contas-receber-page__dialog {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.contas-receber-page__dialog-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.2);
  backdrop-filter: blur(6px);
}

.contas-receber-page__dialog-card {
  position: relative;
  width: min(100%, 56rem);
  max-height: calc(100vh - 2rem);
  overflow: auto;
  border-radius: 1.7rem;
  background: #fff;
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.18);
}

.contas-receber-page__dialog-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.9rem;
  padding: 1.35rem 1.5rem 1.1rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.82);
  background: rgba(248, 250, 252, 0.8);
}

.contas-receber-page__dialog-header-main {
  min-width: 0;
}

.contas-receber-page__dialog-kicker {
  color: var(--ds-color-text-faint);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.contas-receber-page__dialog-title {
  margin-top: 0.3rem;
  color: var(--ds-color-text);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.25;
  max-width: 32rem;
}

.contas-receber-page__dialog-close {
  width: 2.2rem;
  height: 2.2rem;
  border: 1px solid rgba(214, 224, 234, 0.92);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--ds-color-text-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.18s ease, color 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
}

.contas-receber-page__dialog-close:hover {
  border-color: rgba(44, 111, 163, 0.22);
  color: var(--ds-color-primary);
  background: #fff;
}

.contas-receber-page__dialog-close:active {
  transform: scale(0.97);
}

.contas-receber-page__dialog-body {
  padding: 1.35rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
}

.contas-receber-page__dialog-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;
}

.contas-receber-page__dialog-divider {
  height: 1px;
  background: rgba(226, 232, 240, 0.78);
}

.contas-receber-page__dialog-label {
  display: block;
  margin-bottom: 0.55rem;
  color: var(--ds-color-text-faint);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.contas-receber-page__dialog-input {
  width: 100%;
  min-height: 3rem;
  padding: 0 1rem;
  border: 1px solid rgba(214, 224, 234, 0.92);
  border-radius: 1rem;
  background: rgba(245, 248, 251, 0.88);
  color: var(--ds-color-text);
  font-size: 0.85rem;
  font-weight: 700;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.contas-receber-page__dialog-input:focus {
  border-color: rgba(44, 111, 163, 0.38);
  box-shadow: 0 0 0 3px rgba(44, 111, 163, 0.12);
}

.contas-receber-page__dialog-textarea-shell {
  align-items: stretch;
}

.contas-receber-page__dialog-textarea {
  min-height: 6.4rem;
  padding-top: 0.9rem;
  padding-bottom: 0.9rem;
  resize: vertical;
  line-height: 1.5;
}

.contas-receber-page__dialog-alert,
.contas-receber-page__dialog-note {
  margin-top: 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.45;
}

.contas-receber-page__dialog-alert--preview {
  grid-column: 1 / -1;
}

.contas-receber-page__dialog-alert--warning {
  color: var(--ds-color-warning);
}

.contas-receber-page__dialog-note {
  color: var(--ds-color-text-soft);
}

.contas-receber-page__dialog-toggle {
  min-height: 2rem;
}

.contas-receber-page__anticipation-panel {
  padding: 0.95rem 1rem;
  border: 1px solid rgba(214, 224, 234, 0.9);
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.9);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contas-receber-page__anticipation-title {
  color: var(--ds-color-text-faint);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.contas-receber-page__anticipation-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.contas-receber-page__anticipation-toolbar-button {
  min-height: 1.8rem;
  padding: 0 0.7rem;
  border-radius: 0.7rem;
  border: 1px solid rgba(214, 224, 234, 0.92);
  background: #fff;
  color: #475569;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.contas-receber-page__anticipation-toolbar-button--muted {
  color: #64748b;
}

.contas-receber-page__anticipation-list {
  max-height: 9rem;
  overflow-y: auto;
  padding-right: 0.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.contas-receber-page__anticipation-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
  font-size: 0.74rem;
  font-weight: 700;
}

.contas-receber-page__anticipation-item-main {
  display: inline-flex;
  align-items: flex-start;
  flex-wrap: wrap;
  flex: 1;
  gap: 0.55rem;
}

.contas-receber-page__anticipation-item-tag {
  flex-shrink: 0;
  color: var(--ds-color-text-soft);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.contas-receber-page__dialog-footer {
  padding: 1rem 1.5rem 1.1rem;
  border-top: 1px solid rgba(226, 232, 240, 0.82);
  background: rgba(248, 250, 252, 0.8);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .contas-receber-page__dialog {
    padding: 0.75rem;
    align-items: flex-end;
  }

  .contas-receber-page__dialog-card {
    width: 100%;
    max-height: calc(100vh - 1rem);
    border-radius: 1.25rem;
  }

  .contas-receber-page__dialog-header,
  .contas-receber-page__dialog-body,
  .contas-receber-page__dialog-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .contas-receber-page__dialog-header {
    padding-top: 1rem;
    padding-bottom: 0.9rem;
  }

  .contas-receber-page__dialog-body {
    padding-top: 1rem;
    padding-bottom: 1rem;
    gap: 1rem;
  }

  .contas-receber-page__dialog-grid {
    gap: 0.85rem;
  }

  .contas-receber-page__anticipation-panel {
    padding: 0.85rem;
  }

  .contas-receber-page__anticipation-toolbar-button {
    flex: 1 1 100%;
    justify-content: center;
  }

  .contas-receber-page__anticipation-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .contas-receber-page__dialog-footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .contas-receber-page__dialog-footer :deep(button) {
    width: 100%;
  }
}

.no-scrollbar-x {
  scrollbar-width: none;
}

.no-scrollbar-x::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.16s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 900px) {
  .contas-receber-page__field--search {
    grid-column: span 12;
  }

  .contas-receber-page__field--month,
  .contas-receber-page__field--action {
    grid-column: span 6;
  }
}

@media (max-width: 768px) {
  .contas-receber-page__content {
    padding-inline: 0.5rem;
    padding-bottom: 1.15rem;
  }

  .contas-receber-page__hero,
  .contas-receber-page__filters {
    padding: 1.05rem 0;
  }

  .contas-receber-page__field--month,
  .contas-receber-page__field--action {
    grid-column: span 12;
  }
}

@media (min-width: 768px) {
  .contas-receber-page__content {
    padding-inline: 0.9rem;
    padding-bottom: 1.9rem;
  }
}

@media (min-width: 1024px) {
  .contas-receber-page__content {
    padding-inline: 1.1rem;
    padding-bottom: 2rem;
  }
}
</style>
