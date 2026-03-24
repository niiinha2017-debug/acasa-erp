<!-- src/pages/financeiro/contas-receber/index.vue -->
<template>
  <PageShell :padded="false">
    <section class="contas-receber-page ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Contas a Receber"
        subtitle="Receitas previstas, vencidas e recebidas por cliente ou fornecedor."
        icon="pi pi-arrow-up-right"
      >
        <template #actions>
          <div class="contas-receber-page__actions ds-page-context__actions">
            <Button v-if="mostrarPreviewReceber" @click="abrirReceberPreview" variant="secondary">
              <i class="pi pi-eye"></i>
              Pré-visualizar modal
            </Button>
            <Button @click="carregar" variant="primary">
              <i class="pi pi-refresh"></i>
              Atualizar dados
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="contas-receber-page__content ds-page-context__content">
        <section class="contas-receber-page__hero">
          <div class="contas-receber-page__hero-main">
            <span class="contas-receber-page__eyebrow">Competência {{ competenciaAtual }}</span>
            <h2 class="contas-receber-page__hero-title">{{ resumoAbaAtiva.titulo }}</h2>
            <p class="contas-receber-page__hero-copy">{{ resumoAbaAtiva.descricao }}</p>
          </div>

          <div class="contas-receber-page__hero-stats">
            <article class="contas-receber-page__hero-stat">
              <span class="contas-receber-page__hero-stat-label">Linhas exibidas</span>
              <strong class="contas-receber-page__hero-stat-value">{{ contagens.total }}</strong>
              <span class="contas-receber-page__hero-stat-help">Resultado da aba ativa após a busca local.</span>
            </article>
            <article class="contas-receber-page__hero-stat">
              <span class="contas-receber-page__hero-stat-label">Recebido</span>
              <strong class="contas-receber-page__hero-stat-value">{{ format.currency(totais.recebido) }}</strong>
              <span class="contas-receber-page__hero-stat-help">Valores já baixados dentro da competência.</span>
            </article>
            <article class="contas-receber-page__hero-stat">
              <span class="contas-receber-page__hero-stat-label">Em aberto</span>
              <strong class="contas-receber-page__hero-stat-value">{{ format.currency(totais.aberto) }}</strong>
              <span class="contas-receber-page__hero-stat-help">Saldo que ainda depende de recebimento.</span>
            </article>
          </div>
        </section>

        <section class="contas-receber-page__summary-grid">
          <article class="contas-receber-page__summary-card ds-surface">
            <div class="contas-receber-page__summary-head">
              <div>
                <p class="contas-receber-page__summary-label">Total da aba</p>
                <p class="contas-receber-page__summary-value">{{ format.currency(totais.total) }}</p>
              </div>
              <span class="ds-status-pill ds-status-pill--neutral contas-receber-page__summary-pill">{{ contagens.total }} registros</span>
            </div>
            <p class="contas-receber-page__summary-help">Consolidado financeiro da visão selecionada.</p>
          </article>

          <article class="contas-receber-page__summary-card ds-alert ds-alert--success">
            <div class="contas-receber-page__summary-head">
              <div>
                <p class="contas-receber-page__summary-label text-[color:var(--ds-color-success)]">Recebidos</p>
                <p class="contas-receber-page__summary-value text-[color:var(--ds-color-success)]">{{ format.currency(totais.recebido) }}</p>
              </div>
              <span class="ds-status-pill ds-status-pill--success contas-receber-page__summary-pill">{{ contagens.recebido }} baixas</span>
            </div>
            <p class="contas-receber-page__summary-help text-[color:var(--ds-color-success)]">Entradas já confirmadas no caixa.</p>
          </article>

          <article class="contas-receber-page__summary-card ds-alert ds-alert--warning">
            <div class="contas-receber-page__summary-head">
              <div>
                <p class="contas-receber-page__summary-label text-[color:var(--ds-color-warning)]">Em aberto</p>
                <p class="contas-receber-page__summary-value text-[color:var(--ds-color-warning)]">{{ format.currency(totais.aberto) }}</p>
              </div>
              <span class="ds-status-pill ds-status-pill--warning contas-receber-page__summary-pill">{{ contagens.aberto }} pendências</span>
            </div>
            <p class="contas-receber-page__summary-help text-[color:var(--ds-color-warning)]">Títulos que ainda dependem de recebimento.</p>
          </article>
        </section>

        <section class="contas-receber-page__filters">
          <div class="contas-receber-page__filters-header">
            <div>
              <span class="contas-receber-page__section-kicker">Filtro operacional</span>
              <h3 class="contas-receber-page__section-title">Recorte da central</h3>
            </div>
            <p class="contas-receber-page__section-copy">
              Busque cliente, fornecedor, ambiente ou observação e ajuste a competência para recalcular os recebimentos desta central.
            </p>
          </div>

          <div class="contas-receber-page__filters-grid">
            <div class="contas-receber-page__field contas-receber-page__field--search">
              <span class="contas-receber-page__field-label">Busca</span>
              <SearchInput
                v-model="filtroTexto"
                placeholder="Buscar cliente, fornecedor, ambiente ou observação..."
              />
            </div>

            <MonthReferenceField
              v-model="mesReferencia"
              class="contas-receber-page__date-field contas-receber-page__field--month"
              label="Mês de referência"
            />

            <div class="contas-receber-page__field contas-receber-page__field--action">
              <Button @click="carregar" variant="secondary" class="contas-receber-page__refresh-button">
                <i class="pi pi-search"></i>
                Aplicar filtros
              </Button>
            </div>
          </div>
        </section>

        <section class="contas-receber-page__tabs">
          <div class="contas-receber-page__tabs-scroll no-scrollbar-x">
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
          </div>
        </section>

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
                    Ambientes: {{ row.ambientes_venda.join(', ') }}
                  </span>
                  <span class="contas-receber-page__secondary">
                    {{ row.descricao || 'Sem descrição' }}
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
                </template>

                <template v-else-if="normalizeStatus(row.status) === 'CANCELADO'">
                  <span class="contas-receber-page__cancel-pill">Cancelado</span>
                </template>

                <button
                  v-else
                  type="button"
                  class="contas-receber-page__action-button"
                  :disabled="acaoLoadingId === row.id"
                  @click="abrirReceber(row)"
                >
                  <i class="pi pi-check text-xs"></i>
                  Receber
                </button>
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

                <div class="contas-receber-page__dialog-divider"></div>

                <div class="contas-receber-page__dialog-grid">
                  <div class="col-span-12 md:col-span-6">
                    <Input
                      v-model="receberModal.forma_recebimento_chave"
                      label="Forma de recebimento"
                      placeholder="Ex: PIX, DINHEIRO, CARTAO..."
                    />
                    <div
                      v-if="receberModal.formas_disponiveis.length > 1"
                      class="contas-receber-page__dialog-alert contas-receber-page__dialog-alert--warning"
                    >
                      Pagamento misto: {{ receberModal.formas_disponiveis.join(' + ') }}. Selecione a forma desta baixa.
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
import { ANTECIPACAO, getTaxaAntecipacaoPercentual } from '@/constantes'
import MonthReferenceField from '@/components/ui/MonthReferenceField.vue'

definePage({ meta: { perm: 'contas_receber.ver' } })

// ✅ sem importar componentes (já estão no main.js)

const loading = ref(true)
const rows = ref([])

const filtroTexto = ref('')
const abaAtiva = ref('A_PAGAR')

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
const competenciaAtual = computed(() => {
  const { mes, ano } = intervaloDoMesReferencia(mesReferencia.value)
  return `${String(mes).padStart(2, '0')}/${ano}`
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
  { id: 'VENCIDOS', label: 'Vencidas', count: rowsVencidos.value.length },
  { id: 'A_PAGAR', label: 'Em aberto', count: rowsAPagar.value.length },
  { id: 'PAGOS', label: 'Pagos', count: rowsPagos.value.length },
])

const resumoAbaAtiva = computed(() => {
  if (abaAtiva.value === 'VENCIDOS') {
    return {
      titulo: 'Receitas vencidas que exigem ação comercial',
      descricao: 'Acompanhe os títulos já vencidos e priorize os recebimentos mais sensíveis do período.',
    }
  }

  if (abaAtiva.value === 'PAGOS') {
    return {
      titulo: 'Histórico de recebimentos confirmados',
      descricao: 'Use esta visão para auditoria das entradas já baixadas e conferência das antecipações.',
    }
  }

  return {
    titulo: 'Receitas previstas para a competência',
    descricao: 'Visualize o que ainda está em aberto e avance nas baixas de cliente ou fornecedor sem sair da central.',
  }
})

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

function partePrincipal(row) {
  if (row?.cliente_nome) return row.cliente_nome
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
  recebido_em_input: '',
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

function abrirReceber(row) {
  const status = String(row?.status || '').toUpperCase()
  if (status === 'PAGO' || status === 'RECEBIDO' || status === 'CANCELADO') return
  preencherReceberModal(row)
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
}

.contas-receber-page__content {
  width: min(100%, 1460px);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.35rem 1rem 1.75rem;
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

.contas-receber-page__tabs {
  overflow: hidden;
  padding: 0.25rem 0 0.1rem;
  border-top: 1px solid rgba(214, 224, 234, 0.58);
}

.contas-receber-page__tabs-scroll {
  overflow-x: auto;
}

.contas-receber-page__tabs-nav {
  display: flex;
  gap: 0.75rem;
  min-width: max-content;
}

.contas-receber-page__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.5rem;
  padding: 0 1rem;
  border: 1px solid rgba(214, 224, 234, 0.86);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: var(--ds-color-text-soft);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;
}

.contas-receber-page__tab:hover {
  color: var(--ds-color-text);
  border-color: rgba(177, 191, 205, 0.92);
}

.contas-receber-page__tab--active {
  color: #fff;
  border-color: rgba(24, 72, 124, 0.9);
  background: linear-gradient(135deg, #204870 0%, #2b6aa0 100%);
}

.contas-receber-page__tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.35rem;
  min-height: 1.35rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 0.6rem;
}

.contas-receber-page__table {
  overflow: hidden;
  border-top: 1px solid rgba(214, 224, 234, 0.58);
  border-bottom: 1px solid rgba(214, 224, 234, 0.58);
}

.contas-receber-page__identity,
.contas-receber-page__identity-copy,
.contas-receber-page__origin-stack,
.contas-receber-page__date-stack,
.contas-receber-page__amount-stack {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.contas-receber-page__identity,
.contas-receber-page__origin-stack,
.contas-receber-page__date-stack,
.contas-receber-page__amount-stack {
  gap: 0.2rem;
}

.contas-receber-page__primary,
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
    padding-inline: 0.75rem;
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
    padding-inline: 1.5rem;
    padding-bottom: 1.9rem;
  }
}

@media (min-width: 1024px) {
  .contas-receber-page__content {
    padding-inline: 2rem;
    padding-bottom: 2rem;
  }
}
</style>
