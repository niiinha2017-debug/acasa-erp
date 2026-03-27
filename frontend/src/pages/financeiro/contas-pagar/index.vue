<template>
  <PageShell :padded="false">
    <section class="contas-pagar-page ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Central de Consolidação"
        subtitle="Contas a Pagar — Fechamentos de Fornecedor, Funcionário e Despesas Gerais"
        icon="pi pi-arrow-down-right"
      >
        <template #actions>
          <div class="contas-pagar-page__actions ds-page-context__actions">
            <Button @click="buscar" variant="primary">
              <i class="pi pi-refresh"></i>
              Atualizar dados
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="contas-pagar-page__content ds-page-context__content">
        <section class="contas-pagar-page__hero">
          <div class="contas-pagar-page__hero-main">
            <span class="contas-pagar-page__eyebrow">Competência {{ competenciaAtual }}</span>
            <h2 class="contas-pagar-page__hero-title">{{ resumoAbaAtiva.titulo }}</h2>
            <p class="contas-pagar-page__hero-copy">{{ resumoAbaAtiva.descricao }}</p>
          </div>

          <div class="contas-pagar-page__hero-stats">
            <article
              v-for="item in destaquesOperacionais"
              :key="item.id"
              class="contas-pagar-page__hero-stat"
            >
              <span class="contas-pagar-page__hero-stat-label">{{ item.label }}</span>
              <strong class="contas-pagar-page__hero-stat-value">{{ item.valor }}</strong>
              <span class="contas-pagar-page__hero-stat-help">{{ item.ajuda }}</span>
            </article>
          </div>
        </section>

        <section class="contas-pagar-page__summary-grid">
          <article
            v-for="card in cardsResumoAba"
            :key="card.id"
            class="contas-pagar-page__summary-card ds-alert"
            :class="card.className"
          >
            <div class="contas-pagar-page__summary-head">
              <div>
                <p class="contas-pagar-page__summary-label" :class="card.labelClass">{{ card.label }}</p>
                <p class="contas-pagar-page__summary-value" :class="card.valueClass">{{ card.valor }}</p>
              </div>
              <span class="ds-status-pill contas-pagar-page__summary-pill" :class="card.badgeClass">
                {{ card.quantidade }}
              </span>
            </div>
            <p class="contas-pagar-page__summary-help" :class="card.helpClass">{{ card.help }}</p>
          </article>
        </section>

        <section class="contas-pagar-page__filters">
          <div class="contas-pagar-page__filters-header">
            <div>
              <span class="contas-pagar-page__section-kicker">Filtro operacional</span>
              <h3 class="contas-pagar-page__section-title">Recorte da central</h3>
            </div>
            <p class="contas-pagar-page__section-copy">
              Busque fornecedor, funcionário ou despesa e ajuste a competência para recalcular os lançamentos desta central.
            </p>
          </div>

          <div class="contas-pagar-page__filters-grid">
            <div class="contas-pagar-page__field contas-pagar-page__field--search">
              <span class="contas-pagar-page__field-label">Busca</span>
              <SearchInput
                v-model="filtroBusca"
                placeholder="Buscar fornecedor, funcionário ou despesa..."
              />
            </div>

            <MonthReferenceField
              v-model="mesReferencia"
              class="contas-pagar-page__date-field contas-pagar-page__field--month"
              label="Mês de referência"
            />

            <div class="contas-pagar-page__field contas-pagar-page__field--action">
              <Button @click="buscar" variant="secondary" class="contas-pagar-page__refresh-button">
                <i class="pi pi-search"></i>
                Aplicar filtros
              </Button>
            </div>
          </div>
        </section>

        <section class="contas-pagar-page__tabs">
          <div class="contas-pagar-page__tabs-scroll no-scrollbar-x">
            <nav class="contas-pagar-page__tabs-nav">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                class="contas-pagar-page__tab"
                :class="{ 'contas-pagar-page__tab--active': abaAtiva === tab.id }"
                @click="mudarAba(tab.id)"
              >
                <span>{{ tab.label }}</span>
                <span class="contas-pagar-page__tab-count">{{ tab.count }}</span>
              </button>
            </nav>
          </div>
        </section>

        <section class="contas-pagar-page__table">
          <div v-if="loading" class="contas-pagar-page__state">Carregando...</div>
          <template v-else>
            <!-- Vista Por Fornecedor: collapsible row minimalista -->
            <template v-if="abaAtiva === 'POR_FORNECEDOR'">
              <div class="contas-pagar-page__table-scroll no-scrollbar-x">
                <table class="contas-pagar-page__grid contas-pagar-page__grid--fornecedor" cellpadding="0" cellspacing="0">
                  <thead>
                    <tr class="contas-pagar-page__head-row">
                      <th class="contas-pagar-page__head-cell contas-pagar-page__head-cell--icon"></th>
                      <th class="contas-pagar-page__head-cell">Fornecedor (ID)</th>
                      <th class="contas-pagar-page__head-cell contas-pagar-page__head-cell--numeric">Total</th>
                      <th class="contas-pagar-page__head-cell contas-pagar-page__head-cell--status">Status</th>
                      <th v-if="mostrarAcoes" class="contas-pagar-page__head-cell contas-pagar-page__head-cell--actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="(row, idx) in listaFiltrada" :key="row.fornecedor_id + '-' + row.mes + '-' + row.ano + '-' + idx">
                      <!-- Estado fechado: só fornecedor (com ID) | total | status -->
                      <tr
                        class="contas-pagar-page__body-row contas-pagar-page__body-row--clickable"
                        :class="{ 'contas-pagar-page__body-row--expanded': rowExpandidoPorFornecedor === chaveExpandPorFornecedor(row) }"
                        @click="toggleExpandPorFornecedor(row)"
                      >
                        <td class="contas-pagar-page__cell contas-pagar-page__cell--icon">
                          <span class="contas-pagar-page__chevron">
                            <i :class="rowExpandidoPorFornecedor === chaveExpandPorFornecedor(row) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
                          </span>
                        </td>
                        <td class="contas-pagar-page__cell contas-pagar-page__cell--identity">
                          <span class="contas-pagar-page__id-copy">ID {{ row.fornecedor_id }}</span>
                          <span class="contas-pagar-page__separator">·</span>
                          <span class="contas-pagar-page__primary-copy">[{{ row.fornecedor_nome || '—' }}]</span>
                        </td>
                        <td class="contas-pagar-page__cell contas-pagar-page__cell--numeric contas-pagar-page__amount">{{ formatarMoeda(row.valor_liquido) }}</td>
                        <td class="contas-pagar-page__cell contas-pagar-page__cell--status">
                          <span
                            class="ds-status-pill contas-pagar-page__pill"
                            :class="saldoFornecedorStatusClass(row.valor_liquido)"
                          >
                            {{ row.valor_liquido > 0 ? 'EM_ABERTO' : 'QUITADO' }}
                          </span>
                        </td>
                        <td v-if="mostrarAcoes" class="contas-pagar-page__cell contas-pagar-page__cell--actions" @click.stop>
                          <button
                            v-if="row.valor_liquido > 0"
                            type="button"
                            @click="abrirModalFechamento(row.fornecedor_id)"
                            class="contas-pagar-page__action-button"
                          >
                            Fechamento
                          </button>
                        </td>
                      </tr>
                      <!-- Estado aberto: detalhamento (subtotal, abatimentos, valor líquido + itens) -->
                      <tr v-if="rowExpandidoPorFornecedor === chaveExpandPorFornecedor(row)" class="contas-pagar-page__detail-row">
                        <td :colspan="mostrarAcoes ? 5 : 4" class="contas-pagar-page__detail-cell">
                          <div class="contas-pagar-page__detail-panel">
                            <p class="contas-pagar-page__detail-title">Detalhamento · Competência {{ String(row.mes).padStart(2, '0') }}/{{ row.ano }}</p>
                            <div class="contas-pagar-page__detail-metrics">
                              <span>Subtotal (compras mês): <strong class="contas-pagar-page__amount-inline">{{ formatarMoeda(row.subtotal) }}</strong></span>
                              <span class="contas-pagar-page__success-copy">Abatimentos (Serviço de Corte mês + crédito): <strong class="contas-pagar-page__amount-inline">{{ formatarMoeda(row.total_abatimentos) }}</strong></span>
                              <span>Valor líquido: <strong class="contas-pagar-page__amount-inline">{{ formatarMoeda(row.valor_liquido) }}</strong></span>
                            </div>
                            <div v-if="row.itens && row.itens.length" class="contas-pagar-page__nested-wrap">
                              <table class="contas-pagar-page__nested-table">
                                <thead>
                                  <tr class="contas-pagar-page__nested-head-row">
                                    <th class="contas-pagar-page__nested-head-cell">Origem</th>
                                    <th class="contas-pagar-page__nested-head-cell">Descrição</th>
                                    <th class="contas-pagar-page__nested-head-cell">Data</th>
                                    <th class="contas-pagar-page__nested-head-cell contas-pagar-page__nested-head-cell--numeric">Valor</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr v-for="item in row.itens" :key="item.id + '-' + item.origem" class="contas-pagar-page__nested-row">
                                    <td class="contas-pagar-page__nested-cell">
                                      <span
                                        class="contas-pagar-page__soft-badge"
                                        :class="origemItemBadgeClass(item.origem)"
                                      >
                                        {{ item.origem === 'COMPRA' ? 'Compra' : 'Serviço de Corte' }}
                                      </span>
                                    </td>
                                    <td class="contas-pagar-page__nested-cell contas-pagar-page__nested-cell--copy">{{ item.descricao || '—' }}</td>
                                    <td class="contas-pagar-page__nested-cell contas-pagar-page__nested-cell--muted contas-pagar-page__nested-cell--numeric">{{ item.data_referencia || '—' }}</td>
                                    <td class="contas-pagar-page__nested-cell contas-pagar-page__nested-cell--numeric contas-pagar-page__nested-cell--strong">{{ formatarMoeda(item.valor) }}</td>
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
              <div v-if="listaFiltrada.length === 0" class="contas-pagar-page__state">
                Nenhum fornecedor com lançamentos no período.
              </div>
            </template>
            <!-- Vista Unificado / Para Fechar / etc. -->
            <template v-else>
            <div class="contas-pagar-page__table-scroll no-scrollbar-x">
              <table class="contas-pagar-page__grid contas-pagar-page__grid--lancamentos" cellpadding="0" cellspacing="0">
                <thead>
                  <tr class="contas-pagar-page__head-row">
                    <th class="contas-pagar-page__head-cell contas-pagar-page__head-cell--icon"></th>
                    <th class="contas-pagar-page__head-cell">Natureza</th>
                    <th class="contas-pagar-page__head-cell">Vencimento</th>
                      <th class="contas-pagar-page__head-cell">Fornecedor / Funcionário / O que é</th>
                    <th class="contas-pagar-page__head-cell">Tipo / Forma</th>
                    <th class="contas-pagar-page__head-cell contas-pagar-page__head-cell--numeric">Valor</th>
                    <th class="contas-pagar-page__head-cell contas-pagar-page__head-cell--status">Situação</th>
                    <th v-if="mostrarAcoes" class="contas-pagar-page__head-cell contas-pagar-page__head-cell--actions"></th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(row, idx) in listaFiltrada" :key="row.id + '-' + (row.titulo_id || '') + '-' + idx">
                    <tr
                      class="contas-pagar-page__body-row"
                      :class="{ 'contas-pagar-page__body-row--expanded': rowExpandido === row.id }"
                    >
                      <td class="contas-pagar-page__cell contas-pagar-page__cell--icon">
                        <button
                          v-if="row.titulos_vinculados && row.titulos_vinculados.length > 0"
                          type="button"
                          class="contas-pagar-page__expand-button"
                          @click="toggleExpand(row.id)"
                        >
                          <i :class="rowExpandido === row.id ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
                        </button>
                      </td>
                      <td class="contas-pagar-page__cell">
                        <div class="contas-pagar-page__primary-copy">{{ origemLabel(row.origem) }}</div>
                        <div class="contas-pagar-page__secondary-copy">{{ origemDescricao(row.origem) }}</div>
                      </td>
                      <td class="contas-pagar-page__cell contas-pagar-page__cell--numeric contas-pagar-page__cell--date">{{ formatarData(row.vencimento_em) }}</td>
                      <td class="contas-pagar-page__cell">
                        <div class="contas-pagar-page__identity-stack">
                          <span
                            v-if="row.classificacao_badge"
                            class="contas-pagar-page__soft-badge"
                            :class="classificacaoBadgeClass(row.classificacao_badge)"
                          >
                            [{{ row.classificacao_badge }}]
                          </span>
                          <span
                            class="contas-pagar-page__soft-badge"
                            :class="titularBadgeClass(row)"
                          >
                            [{{ titularLabel(row) }}]
                          </span>
                          <span class="contas-pagar-page__primary-copy">{{ titularNome(row) }}</span>
                        </div>
                        <div class="contas-pagar-page__secondary-copy contas-pagar-page__secondary-copy--truncate">{{ descricaoPrincipal(row) }}</div>
                      </td>
                      <td class="contas-pagar-page__cell">
                        <span
                          v-if="row.forma_pagamento_chave"
                          class="ds-status-pill contas-pagar-page__pill"
                          :class="badgeFormaPagamento(row.forma_pagamento_chave)"
                        >
                          [{{ row.forma_pagamento_chave }}]
                        </span>
                        <span v-else class="contas-pagar-page__muted-copy">—</span>
                      </td>
                      <td class="contas-pagar-page__cell contas-pagar-page__cell--numeric contas-pagar-page__amount">{{ formatarMoeda(row.valor) }}</td>
                      <td class="contas-pagar-page__cell contas-pagar-page__cell--status contas-pagar-page__status-copy">{{ statusLabel(row.status) }}</td>
                      <td v-if="mostrarAcoes" class="contas-pagar-page__cell contas-pagar-page__cell--actions">
                        <template v-if="abaAtiva === 'PARA_FECHAR' && row.fornecedor_id">
                          <button
                            type="button"
                            @click="abrirModalFechamento(row.fornecedor_id)"
                            class="contas-pagar-page__action-button"
                          >
                            Fechamento
                          </button>
                        </template>
                        <template v-else-if="(abaAtiva === 'AGENDADOS' || abaAtiva === 'UNIFICADO') && row.titulo_id && row.status !== 'PAGO'">
                          <button
                            type="button"
                            @click="darBaixaTitulo(row)"
                            class="contas-pagar-page__action-button"
                          >
                            Pagar
                          </button>
                        </template>
                        <template v-else-if="(abaAtiva === 'AGENDADOS' || abaAtiva === 'UNIFICADO') && row.id_despesa && !row.titulo_id && row.status !== 'PAGO'">
                          <button
                            type="button"
                            @click="darBaixaDespesa(row)"
                            class="contas-pagar-page__action-button"
                          >
                            Pagar
                          </button>
                        </template>
                      </td>
                    </tr>
                    <!-- Linha expandida: pagamentos vinculados -->
                    <tr v-if="rowExpandido === row.id && row.titulos_vinculados && row.titulos_vinculados.length" class="contas-pagar-page__detail-row">
                      <td colspan="8" class="contas-pagar-page__detail-cell contas-pagar-page__detail-cell--wide">
                        <div class="contas-pagar-page__linked-panel">
                          <p class="contas-pagar-page__linked-title">Pagamentos vinculados</p>
                          <table class="contas-pagar-page__nested-table contas-pagar-page__nested-table--linked">
                            <thead>
                              <tr class="contas-pagar-page__nested-head-row">
                                <th class="contas-pagar-page__nested-head-cell">Parcela</th>
                                <th class="contas-pagar-page__nested-head-cell">Forma</th>
                                <th class="contas-pagar-page__nested-head-cell">Vencimento</th>
                                <th class="contas-pagar-page__nested-head-cell contas-pagar-page__nested-head-cell--numeric">Valor</th>
                                <th class="contas-pagar-page__nested-head-cell">Status</th>
                                <th class="contas-pagar-page__nested-head-cell contas-pagar-page__nested-head-cell--numeric"></th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="t in row.titulos_vinculados" :key="t.id" class="contas-pagar-page__nested-row">
                                <td class="contas-pagar-page__nested-cell">{{ t.parcela_numero }}/{{ t.parcelas_total }}</td>
                                <td class="contas-pagar-page__nested-cell"><span :class="badgeFormaPagamento(t.tipo)" class="ds-status-pill contas-pagar-page__pill">[{{ t.tipo }}]</span></td>
                                <td class="contas-pagar-page__nested-cell contas-pagar-page__nested-cell--numeric">{{ formatarData(t.vencimento_em) }}</td>
                                <td class="contas-pagar-page__nested-cell contas-pagar-page__nested-cell--numeric contas-pagar-page__nested-cell--strong">{{ formatarMoeda(t.valor) }}</td>
                                <td class="contas-pagar-page__nested-cell">{{ t.status }}</td>
                                <td class="contas-pagar-page__nested-cell contas-pagar-page__nested-cell--numeric">
                                  <button
                                    v-if="t.status !== 'PAGO'"
                                    type="button"
                                    @click="darBaixaTituloById(t.id, t.valor)"
                                    class="contas-pagar-page__inline-action"
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
            <div v-if="listaFiltrada.length === 0 && abaAtiva !== 'POR_FORNECEDOR'" class="contas-pagar-page__state">
              Nenhum registro nesta aba para o período selecionado.
            </div>
            </template>
          </template>
        </section>
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
          class="contas-pagar-page__dialog"
          @click.self="fecharModalPagamento()"
        >
          <div class="contas-pagar-page__dialog-card">
            <h3 class="contas-pagar-page__dialog-title">Confirmar pagamento</h3>
            <p class="contas-pagar-page__dialog-copy">
              Valor: <strong>{{ formatarMoeda(pagamentoContext?.valor) }}</strong>
            </p>
            <div class="contas-pagar-page__dialog-field">
              <label class="contas-pagar-page__field-label">Data do pagamento</label>
              <input
                v-model="dataPagamento"
                type="date"
                class="contas-pagar-page__control"
              />
            </div>
            <div class="contas-pagar-page__dialog-actions">
              <button
                type="button"
                class="contas-pagar-page__dialog-button contas-pagar-page__dialog-button--ghost"
                @click="fecharModalPagamento()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="contas-pagar-page__dialog-button contas-pagar-page__dialog-button--primary"
                @click="confirmarPagamento()"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import MonthReferenceField from '@/components/ui/MonthReferenceField.vue'
import { FinanceiroService, FornecedorService } from '@/services/index'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'contas_pagar.ver' } })

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
const abaAtiva = ref('POR_FORNECEDOR')
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

const mesReferencia = computed({
  get: () => `${filtros.ano}-${String(filtros.mes).padStart(2, '0')}`,
  set: (valor) => {
    const [anoStr, mesStr] = String(valor || '').split('-')
    const ano = Number(anoStr)
    const mes = Number(mesStr)
    if (!ano || !mes) return
    filtros.ano = ano
    filtros.mes = mes
  },
})

const competenciaAtual = computed(() => `${String(filtros.mes).padStart(2, '0')}/${filtros.ano}`)

const destaquesOperacionais = computed(() => [
  {
    id: 'linhas',
    label: 'Linhas exibidas',
    valor: String(listaFiltrada.value.length),
    ajuda: 'Resultado após filtros locais e aba ativa.',
  },
  {
    id: 'a-vencer',
    label: 'A vencer no mês',
    valor: formatarMoeda(dashboard.total_a_vencer_mes),
    ajuda: 'Saldo previsto para esta competência.',
  },
  {
    id: 'cheques',
    label: 'Cheques a compensar',
    valor: formatarMoeda(dashboard.cheques_a_compensar),
    ajuda: 'Valores já programados aguardando compensação.',
  },
  {
    id: 'creditos',
    label: 'Créditos disponíveis',
    valor: formatarMoeda(dashboard.creditos_disponiveis),
    ajuda: 'Base para abatimentos no encontro de contas.',
  },
])

const tabs = computed(() => [
  { id: 'POR_FORNECEDOR', label: 'Resumo por Fornecedor', count: listaFechamentoPorFornecedor.value.length },
  { id: 'UNIFICADO', label: 'Todos os Lançamentos', count: listaUnificado.value.length },
  { id: 'PARA_FECHAR', label: 'Pendentes de Fechamento', count: listaParaFechar.value.length },
  { id: 'COMPENSADOS', label: 'Compensados', count: listaCompensados.value.length },
  { id: 'AGENDADOS', label: 'Baixas Pendentes', count: listaAgendados.value.length },
  { id: 'PAGOS', label: 'Pagos', count: listaPagos.value.length },
])

const resumoAbaAtiva = computed(() => {
  if (abaAtiva.value === 'POR_FORNECEDOR') {
    return {
      titulo: 'Resumo do mês por fornecedor',
      descricao:
        'Cada linha mostra um fornecedor e quanto ainda falta acertar no fechamento do mês, já descontando créditos e serviços abatidos.',
    }
  }
  if (abaAtiva.value === 'PARA_FECHAR') {
    return {
      titulo: 'Compras que ainda aguardam fechamento de fornecedor',
      descricao:
        'Aqui ficam as compras lançadas no mês que ainda não viraram fechamento consolidado do fornecedor.',
    }
  }
  if (abaAtiva.value === 'AGENDADOS') {
    return {
      titulo: 'Baixas pendentes da competência',
      descricao:
        'Aqui entram parcelas de fechamentos de fornecedor, fechamentos de funcionário e despesas gerais que ainda serão baixadas nesta página.',
    }
  }
  if (abaAtiva.value === 'COMPENSADOS') {
    return {
      titulo: 'Lançamentos abatidos por crédito ou serviço',
      descricao:
        'Esses itens não exigem nova baixa porque já foram compensados no encontro de contas do período.',
    }
  }
  if (abaAtiva.value === 'PAGOS') {
    return {
      titulo: 'Pagamentos já baixados',
      descricao:
        'Histórico do que já foi quitado. Use para conferência financeira e rastreio do que já saiu do caixa.',
    }
  }
  return {
    titulo: 'Visão completa dos lançamentos',
    descricao:
      'Mistura fechamento de fornecedor, fechamento de funcionário, parcelas e despesas gerais. Use para auditoria completa.',
  }
})

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
    const funcionario = (r.funcionario_nome || '').toLowerCase()
    const descricao = (r.descricao || '').toLowerCase()
    const relatorio = (r.relatorio_descritivo || '').toLowerCase()
    return fornecedor.includes(q) || funcionario.includes(q) || descricao.includes(q) || relatorio.includes(q)
  })
})

const mostrarAcoes = computed(() => ['UNIFICADO', 'PARA_FECHAR', 'AGENDADOS', 'POR_FORNECEDOR'].includes(abaAtiva.value))

const cardsResumoAba = computed(() => {
  if (abaAtiva.value === 'POR_FORNECEDOR') {
    const linhas = listaFiltrada.value || []
    const fornecedoresComSaldo = linhas.filter((row) => Number(row?.valor_liquido || 0) > 0)
    const totalSaldo = fornecedoresComSaldo.reduce((acc, row) => acc + Number(row?.valor_liquido || 0), 0)
    const totalCompras = linhas.reduce((acc, row) => acc + Number(row?.subtotal || 0), 0)
    const totalAbatimentos = linhas.reduce((acc, row) => acc + Number(row?.total_abatimentos || 0), 0)
    const quitados = linhas.filter((row) => Number(row?.valor_liquido || 0) <= 0)

    return [
      {
        id: 'fornecedores-com-saldo',
        label: 'Fornecedores com saldo',
        valor: formatarMoeda(totalSaldo),
        quantidade: `${fornecedoresComSaldo.length} fornecedores`,
        help: 'Valor que ainda precisa ser acertado no fechamento do mês.',
        className: 'ds-alert--warning',
        labelClass: 'text-[color:var(--ds-color-warning)]',
        valueClass: 'text-[color:var(--ds-color-warning)]',
        badgeClass: 'ds-status-pill--warning',
        helpClass: 'text-[color:var(--ds-color-warning)]',
      },
      {
        id: 'compras-mes',
        label: 'Compras do mês',
        valor: formatarMoeda(totalCompras),
        quantidade: `${linhas.length} resumos`,
        help: 'Base operacional lançada antes dos abatimentos e compensações.',
        className: 'border-blue-200 bg-blue-50/70',
        labelClass: 'text-blue-700',
        valueClass: 'text-blue-900',
        badgeClass: 'bg-blue-100 text-blue-800',
        helpClass: 'text-blue-800/80',
      },
      {
        id: 'abatimentos',
        label: 'Abatimentos',
        valor: formatarMoeda(totalAbatimentos),
        quantidade: `${linhas.length} consolidações`,
        help: 'Créditos e serviços abatidos no encontro de contas do fornecedor.',
        className: 'ds-alert--success',
        labelClass: 'text-[color:var(--ds-color-success)]',
        valueClass: 'text-[color:var(--ds-color-success)]',
        badgeClass: 'ds-status-pill--success',
        helpClass: 'text-[color:var(--ds-color-success)]',
      },
      {
        id: 'quitados',
        label: 'Fornecedores quitados',
        valor: `${quitados.length}`,
        quantidade: `${linhas.length} no mês`,
        help: 'Fornecedores cujo saldo líquido do mês zerou após compensações.',
        className: 'border-slate-200 bg-white',
        labelClass: 'text-slate-500',
        valueClass: 'text-slate-900',
        badgeClass: 'bg-slate-100 text-slate-700',
        helpClass: 'text-slate-600',
      },
    ]
  }

  const rows = listaFiltrada.value || []
  const grupos = [
    {
      id: 'compras',
      label: 'Compras marcadas',
      matcher: (row) => row?.origem === 'COMPRA',
      help: 'Compras lançadas que ainda estão no fluxo operacional/fechamento.',
      className: 'border-blue-200 bg-blue-50/70',
      labelClass: 'text-blue-700',
      valueClass: 'text-blue-900',
      badgeClass: 'bg-blue-100 text-blue-800',
      helpClass: 'text-blue-800/80',
    },
    {
      id: 'fechamentos',
      label: 'Fechamentos',
      matcher: (row) => row?.origem === 'FECHAMENTO',
      help: 'Contas consolidadas de fornecedor ou funcionário após o fechamento do mês.',
      className: 'ds-surface',
      labelClass: 'text-text-main',
      valueClass: 'text-text-main',
      badgeClass: 'ds-status-pill--neutral',
      helpClass: 'text-text-soft',
    },
    {
      id: 'parcelas',
      label: 'Parcelas',
      matcher: (row) => row?.origem === 'TITULO_FECHAMENTO',
      help: 'Títulos financeiros gerados a partir dos fechamentos e baixados por aqui.',
      className: 'ds-alert--warning',
      labelClass: 'text-[color:var(--ds-color-warning)]',
      valueClass: 'text-[color:var(--ds-color-warning)]',
      badgeClass: 'ds-status-pill--warning',
      helpClass: 'text-[color:var(--ds-color-warning)]',
    },
    {
      id: 'despesas',
      label: 'Despesas gerais',
      matcher: (row) => row?.origem === 'DESPESA',
      help: 'Despesas administrativas, operacionais e baixas sem vínculo direto com fornecedor.',
      className: 'border-slate-200 bg-white',
      labelClass: 'text-slate-500',
      valueClass: 'text-slate-900',
      badgeClass: 'bg-slate-100 text-slate-700',
      helpClass: 'text-slate-600',
    },
  ]

  return grupos.map((grupo) => {
    const itens = rows.filter(grupo.matcher)
    const total = itens.reduce((acc, row) => acc + Number(row?.valor || 0), 0)
    return {
      ...grupo,
      valor: formatarMoeda(total),
      quantidade: `${itens.length} linhas`,
    }
  })
})

function origemLabel(origem) {
  const map = {
    COMPRA: 'Compra',
    TITULO_FECHAMENTO: 'Parcela',
    FECHAMENTO: 'Fechamento',
    DESPESA: 'Despesa geral',
    PLANO_CORTE: 'Serviço de Corte',
  }
  return map[origem] || origem || '—'
}

function origemDescricao(origem) {
  const map = {
    COMPRA: 'Material lançado para entrar no fechamento do fornecedor',
    TITULO_FECHAMENTO: 'Parcela financeira criada a partir do fechamento de fornecedor ou funcionário',
    FECHAMENTO: 'Conta consolidada do mês para fornecedor ou funcionário',
    DESPESA: 'Despesa administrativa ou operacional baixada nesta central',
    PLANO_CORTE: 'Crédito/abatimento de serviço usado no encontro de contas',
  }
  return map[origem] || 'Lançamento financeiro'
}

function statusLabel(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'EM_ABERTO') return 'Em aberto'
  if (s === 'PAGO') return 'Pago'
  if (s === 'VENCIDO') return 'Vencido'
  if (s === 'COMPENSADO') return 'Compensado'
  if (s === 'CANCELADO') return 'Cancelado'
  return status || '—'
}

function descricaoPrincipal(row) {
  if (row?.relatorio_descritivo) return row.relatorio_descritivo
  if (row?.descricao) return row.descricao
  if (row?.origem === 'COMPRA') return 'Compra lançada para fechamento mensal'
  if (row?.origem === 'FECHAMENTO') return 'Fechamento consolidado de fornecedor ou funcionário'
  if (row?.origem === 'TITULO_FECHAMENTO') return 'Parcela vinculada ao fechamento de fornecedor ou funcionário'
  return '—'
}

function badgeFormaPagamento(tipo) {
  const t = (tipo || '').toUpperCase()
  if (t === 'CHEQUE') return 'ds-status-pill--warning'
  if (t === 'BOLETO') return 'ds-status-pill--warning'
  if (t === 'CARTAO' || t === 'CREDITO') return 'ds-status-pill--success'
  return 'ds-status-pill--neutral'
}

function saldoFornecedorStatusClass(valorLiquido) {
  return Number(valorLiquido || 0) > 0 ? 'ds-status-pill--warning' : 'ds-status-pill--neutral'
}

function origemItemBadgeClass(origem) {
  return String(origem || '').toUpperCase() === 'COMPRA' ? 'contas-pagar-page__soft-badge--info' : 'contas-pagar-page__soft-badge--neutral'
}

function classificacaoBadgeClass(classificacao) {
  return String(classificacao || '').toUpperCase() === 'PRODUÇÃO'
    ? 'contas-pagar-page__soft-badge--info'
    : 'contas-pagar-page__soft-badge--neutral'
}

function titularLabel(row) {
  if (row?.funcionario_id || row?.funcionario_nome) return 'FUNCIONÁRIO'
  if (row?.fornecedor_id || row?.fornecedor_nome) return 'FORNECEDOR'
  return 'DESPESA GERAL'
}

function titularNome(row) {
  return row?.fornecedor_nome || row?.funcionario_nome || 'Despesa geral'
}

function titularBadgeClass(row) {
  if (row?.funcionario_id || row?.funcionario_nome) return 'contas-pagar-page__soft-badge--warning'
  if (row?.fornecedor_id || row?.fornecedor_nome) return 'contas-pagar-page__soft-badge--info'
  return 'contas-pagar-page__soft-badge--neutral'
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
  // Interpreta a data digitada como meia-noite no horário local (sem sufixo Z),
  // evitando que diferenças de fuso deslocam o dia registrado.
  const dataPag = dataPagamento.value ? new Date(`${dataPagamento.value}T00:00:00`).toISOString() : null
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
    const params = {
      fornecedor_id: filtros.fornecedor_id || undefined,
      mes: filtros.mes || undefined,
      ano: filtros.ano || undefined,
    }

    const [resAbas, resFech] = await Promise.all([
      FinanceiroService.listarTodasAbas(params),
      FinanceiroService.getFechamentoPorFornecedor({
        mes: filtros.mes || new Date().getMonth() + 1,
        ano: filtros.ano || new Date().getFullYear(),
        fornecedor_id: filtros.fornecedor_id || undefined,
      }),
    ])

    const abas = resAbas?.data ?? resAbas ?? {}
    listaUnificado.value = Array.isArray(abas.unificado) ? abas.unificado : []
    listaParaFechar.value = Array.isArray(abas.paraFechar) ? abas.paraFechar : []
    listaCompensados.value = Array.isArray(abas.compensados) ? abas.compensados : []
    listaAgendados.value = Array.isArray(abas.agendados) ? abas.agendados : []
    listaPagos.value = Array.isArray(abas.pagos) ? abas.pagos : []
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
  () => {
    buscar()
  },
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

<style scoped>
.contas-pagar-page {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.contas-pagar-page__content {
  width: min(100%, 1460px);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.35rem 1rem 1.75rem;
}

.contas-pagar-page__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

.contas-pagar-page__hero {
  display: grid;
  gap: 1.25rem;
  padding: 1.2rem 0 1.1rem;
  border-top: 1px solid rgba(214, 224, 234, 0.58);
  border-bottom: 1px solid rgba(214, 224, 234, 0.58);
}

.contas-pagar-page__hero-main {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.contas-pagar-page__eyebrow,
.contas-pagar-page__section-kicker,
.contas-pagar-page__field-label {
  color: var(--ds-color-text-faint);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.contas-pagar-page__hero-title,
.contas-pagar-page__section-title {
  color: var(--ds-color-text);
  font-size: 1.18rem;
  font-weight: 640;
  letter-spacing: -0.02em;
}

.contas-pagar-page__hero-copy,
.contas-pagar-page__section-copy {
  max-width: 54rem;
  color: var(--ds-color-text-soft);
  font-size: 0.84rem;
  line-height: 1.6;
}

.contas-pagar-page__hero-stats,
.contas-pagar-page__summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.85rem;
}

.contas-pagar-page__hero-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(214, 224, 234, 0.82);
  border-radius: 1rem;
  background: rgba(245, 248, 251, 0.9);
}

.contas-pagar-page__hero-stat-label,
.contas-pagar-page__summary-label {
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.contas-pagar-page__hero-stat-value,
.contas-pagar-page__summary-value {
  color: var(--ds-color-text);
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.03em;
}

.contas-pagar-page__hero-stat-help,
.contas-pagar-page__summary-help {
  color: var(--ds-color-text-soft);
  font-size: 0.75rem;
  line-height: 1.5;
}

.contas-pagar-page__summary-card {
  padding: 1rem 1.05rem;
}

.contas-pagar-page__summary-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
}

.contas-pagar-page__summary-pill {
  justify-content: center;
  padding-inline: 0.6rem;
  font-size: 0.58rem;
}

.contas-pagar-page__filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.2rem 0 1.15rem;
  border-top: 1px solid rgba(214, 224, 234, 0.58);
  border-bottom: 1px solid rgba(214, 224, 234, 0.58);
}

.contas-pagar-page__filters-header {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 0.9rem 1.25rem;
}

.contas-pagar-page__filters-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0.9rem;
  align-items: end;
}

.contas-pagar-page__field {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  min-width: 0;
}

.contas-pagar-page__field--search {
  grid-column: span 7;
}

.contas-pagar-page__field--grow {
  grid-column: span 4;
}

.contas-pagar-page__field--month {
  grid-column: span 3;
}

.contas-pagar-page__field--action {
  grid-column: span 2;
}

.contas-pagar-page__date-field {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.35rem;
  min-width: 11rem;
}

.contas-pagar-page__date-label {
  color: var(--ds-color-text-faint);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding-left: 0.2rem;
}

.contas-pagar-page__date-shell {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.75rem;
  padding: 0 0.9rem;
  border-radius: 1rem;
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface-raised, #fff);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.contas-pagar-page__date-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-color-text-faint);
  font-size: 0.82rem;
  flex-shrink: 0;
}

.contas-pagar-page__date-input {
  height: 2.75rem;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ds-color-text);
  font-size: 0.78rem;
  font-weight: 700;
  outline: none;
}

.contas-pagar-page__date-shell:focus-within {
  border-color: rgba(16, 88, 168, 0.35);
  box-shadow: 0 0 0 3px rgba(16, 88, 168, 0.08);
}

.contas-pagar-page__date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.7;
}

.contas-pagar-page__control {
  width: 100%;
  min-height: 2.7rem;
  padding: 0 0.9rem;
  border: 1px solid rgba(214, 224, 234, 0.92);
  border-radius: 0.95rem;
  background: rgba(255, 255, 255, 0.92);
  color: var(--ds-color-text);
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.contas-pagar-page__control:focus,
.contas-pagar-page__select:focus {
  border-color: rgba(44, 111, 163, 0.38);
  box-shadow: 0 0 0 3px rgba(44, 111, 163, 0.12);
}

.contas-pagar-page__select {
  appearance: none;
}

.contas-pagar-page__refresh-button {
  width: 100%;
}

.contas-pagar-page__tabs {
  overflow: hidden;
  padding: 0.25rem 0 0.1rem;
  border-top: 1px solid rgba(214, 224, 234, 0.58);
}

.contas-pagar-page__state {
  padding: 2rem;
  text-align: center;
  color: var(--ds-color-text-soft);
  font-size: 0.85rem;
}

.contas-pagar-page__table {
  overflow: hidden;
  border-top: 1px solid rgba(214, 224, 234, 0.58);
  border-bottom: 1px solid rgba(214, 224, 234, 0.58);
}

.contas-pagar-page__table-scroll {
  overflow-x: auto;
}

.contas-pagar-page__grid {
  width: 100%;
  font-size: 0.76rem;
}

.contas-pagar-page__grid--fornecedor {
  min-width: 400px;
}

.contas-pagar-page__grid--lancamentos {
  min-width: 600px;
}

.contas-pagar-page__head-row {
  background: rgba(248, 250, 252, 0.88);
  border-bottom: 1px solid rgba(214, 224, 234, 0.86);
}

.contas-pagar-page__head-cell {
  padding: 0.7rem 0.85rem;
  color: var(--ds-color-text-soft);
  font-size: 0.72rem;
  font-weight: 700;
  text-align: left;
}

.contas-pagar-page__head-cell--icon {
  width: 2.5rem;
}

.contas-pagar-page__head-cell--numeric,
.contas-pagar-page__head-cell--actions {
  text-align: right;
}

.contas-pagar-page__body-row {
  border-bottom: 1px solid rgba(214, 224, 234, 0.48);
  transition: background-color 0.18s ease;
}

.contas-pagar-page__body-row:hover {
  background: rgba(248, 250, 252, 0.7);
}

.contas-pagar-page__body-row--clickable {
  cursor: pointer;
}

.contas-pagar-page__body-row--expanded {
  background: rgba(248, 250, 252, 0.82);
}

.contas-pagar-page__cell {
  padding: 0.72rem 0.85rem;
  color: var(--ds-color-text);
  vertical-align: middle;
}

.contas-pagar-page__cell--icon {
  width: 2.5rem;
}

.contas-pagar-page__cell--numeric,
.contas-pagar-page__cell--actions {
  text-align: right;
}

.contas-pagar-page__cell--status {
  white-space: nowrap;
}

.contas-pagar-page__cell--date,
.contas-pagar-page__amount,
.contas-pagar-page__amount-inline,
.contas-pagar-page__nested-cell--numeric {
  font-variant-numeric: tabular-nums;
}

.contas-pagar-page__amount,
.contas-pagar-page__amount-inline {
  color: var(--ds-color-text);
  font-weight: 650;
}

.contas-pagar-page__chevron,
.contas-pagar-page__expand-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-color-text-faint);
}

.contas-pagar-page__expand-button {
  padding: 0.15rem;
  border: 0;
  background: transparent;
}

.contas-pagar-page__expand-button:hover {
  color: var(--ds-color-text);
}

.contas-pagar-page__id-copy,
.contas-pagar-page__secondary-copy,
.contas-pagar-page__muted-copy,
.contas-pagar-page__status-copy {
  color: var(--ds-color-text-soft);
}

.contas-pagar-page__primary-copy {
  color: var(--ds-color-text);
  font-weight: 600;
}

.contas-pagar-page__secondary-copy {
  font-size: 0.7rem;
  line-height: 1.45;
}

.contas-pagar-page__secondary-copy--truncate {
  max-width: 20rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contas-pagar-page__separator {
  margin-inline: 0.35rem;
  color: rgba(148, 163, 184, 0.9);
}

.contas-pagar-page__pill {
  min-height: 1.45rem;
  padding-inline: 0.55rem;
  font-size: 0.58rem;
}

.contas-pagar-page__identity-stack {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.contas-pagar-page__soft-badge {
  display: inline-flex;
  align-items: center;
  min-height: 1.35rem;
  padding: 0 0.45rem;
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 700;
}

.contas-pagar-page__soft-badge--info {
  background: rgba(59, 130, 246, 0.12);
  color: rgb(30 64 175);
}

.contas-pagar-page__soft-badge--warning {
  background: rgba(245, 158, 11, 0.14);
  color: rgb(146 64 14);
}

.contas-pagar-page__soft-badge--neutral {
  background: rgba(148, 163, 184, 0.14);
  color: rgb(71 85 105);
}

.contas-pagar-page__action-button {
  min-height: 1.9rem;
  padding: 0 0.7rem;
  border: 1px solid rgba(214, 224, 234, 0.92);
  border-radius: 0.7rem;
  background: #fff;
  color: var(--ds-color-text);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;
}

.contas-pagar-page__action-button:hover {
  border-color: rgba(44, 111, 163, 0.22);
  background: rgba(44, 111, 163, 0.06);
}

.contas-pagar-page__detail-row {
  background: rgba(248, 250, 252, 0.62);
  border-bottom: 1px solid rgba(214, 224, 234, 0.48);
}

.contas-pagar-page__detail-cell {
  padding: 0.9rem 0.85rem;
}

.contas-pagar-page__detail-cell--wide {
  padding-left: 1rem;
}

.contas-pagar-page__detail-panel,
.contas-pagar-page__linked-panel {
  padding-left: 1rem;
  border-left: 2px solid rgba(214, 224, 234, 0.92);
}

.contas-pagar-page__detail-title,
.contas-pagar-page__linked-title {
  margin-bottom: 0.7rem;
  color: var(--ds-color-text-soft);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.contas-pagar-page__detail-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 1.4rem;
  color: var(--ds-color-text-soft);
}

.contas-pagar-page__success-copy {
  color: var(--ds-color-success);
}

.contas-pagar-page__nested-wrap {
  padding-top: 0.25rem;
}

.contas-pagar-page__nested-table {
  width: 100%;
  max-width: 42rem;
  font-size: 0.72rem;
}

.contas-pagar-page__nested-head-row {
  color: var(--ds-color-text-soft);
}

.contas-pagar-page__nested-head-cell,
.contas-pagar-page__nested-cell {
  padding: 0.35rem 0;
  text-align: left;
}

.contas-pagar-page__nested-head-cell {
  font-weight: 600;
}

.contas-pagar-page__nested-head-cell--numeric,
.contas-pagar-page__nested-cell--numeric {
  text-align: right;
}

.contas-pagar-page__nested-row {
  border-top: 1px solid rgba(214, 224, 234, 0.5);
}

.contas-pagar-page__nested-cell--copy {
  color: var(--ds-color-text);
}

.contas-pagar-page__nested-cell--muted {
  color: var(--ds-color-text-soft);
}

.contas-pagar-page__nested-cell--strong {
  color: var(--ds-color-text);
  font-weight: 600;
}

.contas-pagar-page__inline-action {
  color: var(--ds-color-primary);
  font-size: 0.62rem;
  font-weight: 700;
}

.contas-pagar-page__inline-action:hover {
  text-decoration: underline;
}

.contas-pagar-page__tabs-scroll {
  overflow-x: auto;
}

.contas-pagar-page__tabs-nav {
  display: flex;
  gap: 0.45rem;
  min-width: max-content;
}

.contas-pagar-page__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.65rem;
  padding: 0 1rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--ds-color-text-soft);
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.contas-pagar-page__tab:hover {
  border-color: rgba(44, 111, 163, 0.18);
  background: rgba(44, 111, 163, 0.08);
  color: var(--ds-color-text);
}

.contas-pagar-page__tab--active {
  border-color: rgba(44, 111, 163, 0.22);
  background: rgba(44, 111, 163, 0.12);
  color: var(--ds-color-text);
  box-shadow: 0 12px 24px -22px rgba(25, 43, 68, 0.48);
}

.contas-pagar-page__tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.7rem;
  height: 1.7rem;
  padding: 0 0.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: inherit;
  font-size: 0.66rem;
  font-weight: 800;
}

.contas-pagar-page__dialog {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.5);
  padding: 1rem;
}

.contas-pagar-page__dialog-card {
  width: min(100%, 25rem);
  padding: 1.4rem;
  border: 1px solid rgba(214, 224, 234, 0.92);
  border-radius: 1.1rem;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 28px 52px -28px rgba(15, 23, 42, 0.42);
}

.contas-pagar-page__dialog-title {
  color: var(--ds-color-text);
  font-size: 1rem;
  font-weight: 650;
}

.contas-pagar-page__dialog-copy {
  margin-top: 0.5rem;
  color: var(--ds-color-text-soft);
  font-size: 0.86rem;
}

.contas-pagar-page__dialog-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 1rem;
}

.contas-pagar-page__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-top: 1.25rem;
}

.contas-pagar-page__dialog-button {
  min-height: 2.7rem;
  padding: 0 1rem;
  border-radius: 0.9rem;
  border: 1px solid transparent;
  font-size: 0.84rem;
  font-weight: 650;
  transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
}

.contas-pagar-page__dialog-button:hover {
  transform: translateY(-1px);
}

.contas-pagar-page__dialog-button--ghost {
  border-color: rgba(214, 224, 234, 0.92);
  background: #fff;
  color: var(--ds-color-text-soft);
}

.contas-pagar-page__dialog-button--primary {
  background: linear-gradient(135deg, #19263a 0%, #243854 100%);
  color: #fff;
}

.dark .contas-pagar-page__hero,
.dark .contas-pagar-page__filters,
.dark .contas-pagar-page__tabs,
.dark .contas-pagar-page__table {
  border-color: rgba(51, 71, 102, 0.58);
}

.no-scrollbar-x {
  -ms-overflow-style: none;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.no-scrollbar-x::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

@media (max-width: 900px) {
  .contas-pagar-page__field--search,
  .contas-pagar-page__field--grow {
    grid-column: span 12;
  }

  .contas-pagar-page__field--month,
  .contas-pagar-page__field--action {
    grid-column: span 6;
  }
}

@media (max-width: 768px) {
  .contas-pagar-page__actions {
    width: 100%;
  }

  .contas-pagar-page__content {
    padding-inline: 0.75rem;
    padding-bottom: 1.15rem;
  }

  .contas-pagar-page__hero,
  .contas-pagar-page__filters,
  .contas-pagar-page__dialog-card {
    padding: 1.05rem;
  }

  .contas-pagar-page__tabs,
  .contas-pagar-page__table {
    padding-left: 0;
    padding-right: 0;
  }

  .contas-pagar-page__field--search,
  .contas-pagar-page__field--month,
  .contas-pagar-page__field--action {
    grid-column: span 12;
  }

  .contas-pagar-page__dialog-actions {
    flex-direction: column-reverse;
  }

  .contas-pagar-page__dialog-button {
    width: 100%;
  }

  .contas-pagar-page__secondary-copy--truncate {
    max-width: 12rem;
  }
}

@media (min-width: 768px) {
  .contas-pagar-page__content {
    padding-inline: 1.5rem;
    padding-bottom: 1.9rem;
  }
}

@media (min-width: 1024px) {
  .contas-pagar-page__content {
    padding-inline: 2rem;
    padding-bottom: 2rem;
  }
}
</style>
