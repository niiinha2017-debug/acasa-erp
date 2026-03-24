<template>
  <component :is="isEmbedded ? 'div' : PageShell" :padded="isEmbedded ? undefined : false">
    <section class="operational-flow-page ds-page-context animate-page-in">
      <PageHeader
        v-if="!isEmbedded"
        title="Fluxo Operacional"
        :subtitle="pageSubtitle"
        icon="pi pi-sitemap"
      >
        <template #actions>
          <div class="operational-flow-page__actions">
            <SearchInput
              v-model="searchTerm"
              placeholder="Buscar cliente, etapa ou status"
            />
            <button
              type="button"
              class="operational-flow-page__refresh"
              :disabled="loading"
              @click="carregar"
            >
              <i class="pi" :class="loading ? 'pi-spin pi-spinner' : 'pi-refresh'" />
              Atualizar
            </button>
          </div>
        </template>
      </PageHeader>

      <div class="operational-flow-page__body ds-page-context__content">
        <!-- Cartões de resumo -->
        <div class="operational-flow-page__metrics">
          <MetricCard
            v-for="card in summaryCards"
            :key="card.label"
            :label="card.label"
            :value="card.value"
            :icon="card.icon"
            :color="card.color"
          />
        </div>

        <div v-if="loading" class="operational-flow-page__loading">
          <i class="pi pi-spin pi-spinner text-2xl text-text-soft"></i>
        </div>

        <template v-else>
          <!-- Seção LOJA — visível para quem tem agendamentos.vendas -->
          <section v-if="showLoja" class="operational-flow-panel">
            <div class="operational-flow-panel__header">
              <div>
                <p class="operational-flow-panel__eyebrow">Loja</p>
                <h2 class="operational-flow-panel__title">Fluxo comercial</h2>
              </div>
              <span class="operational-flow-panel__count">{{ lojaFiltrada.length }}</span>
            </div>

            <div v-if="lojaFiltrada.length" class="operational-flow-table">
              <div class="operational-flow-table__head operational-flow-table__grid--loja">
                <span>Cliente</span>
                <span>Etapa</span>
                <span>Próxima ação</span>
                <span>Valor</span>
                <span>Atualizado</span>
                <span class="text-right">Ações</span>
              </div>
              <article
                v-for="item in lojaFiltrada"
                :key="item.id"
                class="operational-flow-row operational-flow-table__grid--loja"
              >
                <div>
                  <p class="operational-flow-row__title">{{ nomeCliente(item) }}</p>
                  <p class="operational-flow-row__caption">Venda #{{ item.venda_id }}</p>
                </div>
                <div>
                  <span class="operational-chip operational-chip--store">{{ etapaLabel(item) }}</span>
                  <p class="operational-flow-row__caption">{{ subetapaLabel(item) }}</p>
                </div>
                <div>
                  <p class="operational-flow-row__text">{{ proximaAcao(item) }}</p>
                </div>
                <div>
                  <p class="operational-flow-row__text">{{ valorLabel(item) }}</p>
                </div>
                <div>
                  <p class="operational-flow-row__text">{{ dataLabel(item.atualizado_em) }}</p>
                </div>
                <div class="operational-flow-row__actions">
                  <button type="button" class="operational-link" @click="abrirVenda(item)">
                    Abrir
                  </button>
                </div>
              </article>
            </div>
            <div v-else class="operational-flow-panel__empty">
              Nenhuma venda ativa no fluxo comercial.
            </div>
          </section>

          <!-- Seção FÁBRICA — visível para quem tem agendamentos.producao -->
          <section v-if="showFabrica" class="operational-flow-panel">
            <div class="operational-flow-panel__header">
              <div>
                <p class="operational-flow-panel__eyebrow">Fábrica</p>
                <h2 class="operational-flow-panel__title">Fila de execução</h2>
              </div>
              <span class="operational-flow-panel__count">{{ fabricaFiltrada.length }}</span>
            </div>

            <div v-if="fabricaFiltrada.length" class="operational-flow-table">
              <div class="operational-flow-table__head operational-flow-table__grid--fabrica">
                <span>Cliente</span>
                <span>Etapa</span>
                <span>Obrigação</span>
                <span>Atualizado</span>
                <span class="text-right">Ações</span>
              </div>
              <article
                v-for="item in fabricaFiltrada"
                :key="item.id"
                class="operational-flow-row operational-flow-table__grid--fabrica"
              >
                <div>
                  <p class="operational-flow-row__title">{{ nomeCliente(item) }}</p>
                  <p class="operational-flow-row__caption">Venda #{{ item.venda_id }}</p>
                </div>
                <div>
                  <span class="operational-chip operational-chip--factory">{{ etapaLabel(item) }}</span>
                  <p class="operational-flow-row__caption">{{ subetapaLabel(item) }}</p>
                </div>
                <div>
                  <p class="operational-flow-row__text">{{ proximaAcao(item) }}</p>
                </div>
                <div>
                  <p class="operational-flow-row__text">{{ dataLabel(item.atualizado_em) }}</p>
                </div>
                <div class="operational-flow-row__actions">
                  <button type="button" class="operational-link" @click="abrirVenda(item)">
                    Abrir
                  </button>
                </div>
              </article>
            </div>
            <div v-else class="operational-flow-panel__empty">
              Nenhuma venda aguardando execução na fábrica.
            </div>
          </section>

          <!-- Alertas de transição — só admin (vê loja + fábrica) -->
          <section v-if="showAdmin && transicoesCriticas.length" class="operational-flow-panel">
            <div class="operational-flow-panel__header">
              <div>
                <p class="operational-flow-panel__eyebrow">Administração</p>
                <h2 class="operational-flow-panel__title">Transições críticas</h2>
              </div>
              <span class="operational-flow-panel__count">{{ transicoesCriticas.length }}</span>
            </div>
            <div class="operational-transition-list">
              <article
                v-for="t in transicoesCriticas"
                :key="t.vendaId"
                class="operational-transition-row"
              >
                <div>
                  <p class="operational-transition-row__client">{{ t.clienteNome }}</p>
                  <p class="operational-transition-row__reason">{{ t.motivo }}</p>
                </div>
                <div class="operational-transition-row__meta">
                  <span class="operational-chip operational-chip--attention">{{ t.label }}</span>
                  <button type="button" class="operational-link" @click="router.push(`/vendas/${t.vendaId}`)">
                    Abrir venda
                  </button>
                </div>
              </article>
            </div>
          </section>

          <div v-if="!showLoja && !showFabrica" class="operational-flow-page__empty">
            Sem permissão para visualizar o fluxo operacional.
          </div>
        </template>
      </div>
    </section>
  </component>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MetricCard from '@/components/ui/MetricCard.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageShell from '@/components/ui/PageShell.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { VendaService } from '@/services'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { format } from '@/utils/format'
import { getStatusVendaSubetapa, getSubetapaLabel } from '@/constantes/status-matrix'

const pageProps = defineProps({
  embedded: { type: Boolean, default: false },
})
const isEmbedded = computed(() => Boolean(pageProps?.embedded))

definePage({ meta: { perm: ['agendamentos.ver', 'agendamentos.vendas', 'agendamentos.producao'] } })

const router = useRouter()
const loading = ref(false)
const searchTerm = ref('')
const itens = ref([])

const showLoja    = computed(() => can('agendamentos.vendas') || can('agendamentos.ver'))
const showFabrica = computed(() => can('agendamentos.producao') || can('agendamentos.ver'))
const showAdmin   = computed(() => showLoja.value && showFabrica.value)

const pageSubtitle = computed(() => {
  if (showAdmin.value)   return 'Gestão integrada de loja e fábrica em uma única leitura operacional.'
  if (showLoja.value)    return 'Acompanhamento do fluxo comercial da loja.'
  return 'Fila de execução da fábrica.'
})

// Mapa de próxima ação por subetapa
const PROXIMA_ACAO = {
  CADASTRO:              'Agendar medição',
  MEDIDA:                'Elaborar orçamento',
  ORCAMENTO:             'Agendar apresentação',
  APRESENTACAO:          'Fechar venda',
  FECHAMENTO:            'Aguardando fábrica',
  MEDIDA_FINA:           'Executar medição fina',
  PROJETO_TECNICO:       'Elaborar projeto técnico',
  PRODUCAO:              'Fabricar',
  SERVICO_CORTE_FITA_BORDA: 'Serviço de corte',
  ENTREGA:               'Carregar material',
  MONTAGEM:              'Montar no cliente',
  GARANTIA:              'Garantia ativa',
  ASSISTENCIA:           'Assistência em andamento',
  MANUTENCAO:            'Manutenção em andamento',
}

function nomeCliente(item) {
  const c = item?.cliente
  return c?.nome_completo || c?.razao_social || c?.nome_fantasia || 'Sem identificação'
}

function etapaLabel(item) {
  const sub = getStatusVendaSubetapa(item.status)
  return getSubetapaLabel(sub) || item.status || '—'
}

function subetapaLabel(item) {
  return String(item.status || '').replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

function proximaAcao(item) {
  const sub = getStatusVendaSubetapa(item.status)
  return PROXIMA_ACAO[sub] || '—'
}

function valorLabel(item) {
  if (!item.valor_vendido) return '—'
  return format.currency(item.valor_vendido)
}

function dataLabel(dt) {
  return format.date(dt)
}

function abrirVenda(item) {
  if (!item?.venda_id) return
  router.push(`/vendas/${item.venda_id}`)
}

// Filtragem com busca textual
function matchBusca(item) {
  const q = searchTerm.value.trim().toLowerCase()
  if (!q) return true
  const hay = [nomeCliente(item), item.venda_id, etapaLabel(item), subetapaLabel(item)].join(' ').toLowerCase()
  return hay.includes(q)
}

const lojaFiltrada    = computed(() => itens.value.filter(i => i.setor === 'LOJA'    && matchBusca(i)))
const fabricaFiltrada = computed(() => itens.value.filter(i => i.setor === 'FABRICA' && matchBusca(i)))

// Transições críticas: vendas em FECHAMENTO sem correspondente na fábrica
const transicoesCriticas = computed(() => {
  if (!showAdmin.value) return []
  const lojaIds = new Set(lojaFiltrada.value.filter(i => getStatusVendaSubetapa(i.status) === 'FECHAMENTO').map(i => i.venda_id))
  const fabricaIds = new Set(fabricaFiltrada.value.map(i => i.venda_id))
  return lojaFiltrada.value
    .filter(i => lojaIds.has(i.venda_id) && !fabricaIds.has(i.venda_id))
    .map(i => ({
      vendaId: i.venda_id,
      clienteNome: nomeCliente(i),
      label: 'Loja → Fábrica',
      motivo: 'Venda fechada mas ainda sem etapa fabril iniciada.',
    }))
})

// Cartões de resumo
const summaryCards = computed(() => {
  if (showAdmin.value) return [
    { label: 'Loja ativa',           value: lojaFiltrada.value.length,    icon: 'pi pi-briefcase',          color: 'blue' },
    { label: 'Fábrica ativa',        value: fabricaFiltrada.value.length, icon: 'pi pi-building',           color: 'amber' },
    { label: 'Transições críticas',  value: transicoesCriticas.value.length, icon: 'pi pi-link',            color: 'rose' },
    { label: 'Total no fluxo',       value: itens.value.length,           icon: 'pi pi-list',               color: 'emerald' },
  ]
  if (showLoja.value) return [
    { label: 'No fluxo',    value: lojaFiltrada.value.length,                                                         icon: 'pi pi-list',               color: 'blue' },
    { label: 'Orçamento',   value: lojaFiltrada.value.filter(i => getStatusVendaSubetapa(i.status) === 'ORCAMENTO').length,    icon: 'pi pi-file',          color: 'blue' },
    { label: 'Fechamento',  value: lojaFiltrada.value.filter(i => getStatusVendaSubetapa(i.status) === 'FECHAMENTO').length,   icon: 'pi pi-file-check',    color: 'amber' },
    { label: 'Aguard. fábrica', value: transicoesCriticas.value.length,                                               icon: 'pi pi-clock',              color: 'rose' },
  ]
  return [
    { label: 'Na fila',          value: fabricaFiltrada.value.length,                                                                icon: 'pi pi-list',     color: 'amber' },
    { label: 'Medição fina',     value: fabricaFiltrada.value.filter(i => getStatusVendaSubetapa(i.status) === 'MEDIDA_FINA').length,    icon: 'pi pi-ruler',    color: 'blue' },
    { label: 'Produção',         value: fabricaFiltrada.value.filter(i => getStatusVendaSubetapa(i.status) === 'PRODUCAO').length,       icon: 'pi pi-cog',      color: 'amber' },
    { label: 'Montagem',         value: fabricaFiltrada.value.filter(i => getStatusVendaSubetapa(i.status) === 'MONTAGEM').length,       icon: 'pi pi-wrench',   color: 'emerald' },
  ]
})

async function carregar() {
  loading.value = true
  try {
    const { data } = await VendaService.listarFluxoOperacional()
    itens.value = Array.isArray(data) ? data : []
  } catch {
    notify.error('Erro ao carregar o fluxo operacional.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!showLoja.value && !showFabrica.value) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }
  await carregar()
})
</script>

<style scoped>
.operational-flow-page {
  padding: 0 0 2rem;
}

.operational-flow-page__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.operational-flow-page__actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  width: min(100%, 34rem);
}

.operational-flow-page__refresh {
  height: 2.75rem;
  padding: 0 1rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(15, 23, 42, 0.96);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.operational-flow-page__refresh:disabled { opacity: 0.6; cursor: not-allowed; }

.operational-flow-page__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;
}

.operational-flow-page__loading,
.operational-flow-page__empty,
.operational-flow-panel__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 10rem;
  border: 1px solid var(--border-ui, rgba(15, 23, 42, 0.08));
  border-radius: 1.25rem;
  background: var(--bg-card, #fff);
  color: var(--text-soft, #64748b);
  font-size: 0.92rem;
}

.operational-flow-panel {
  border: 1px solid var(--border-ui, rgba(15, 23, 42, 0.08));
  border-radius: 1.25rem;
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98));
  overflow: hidden;
}

.operational-flow-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-ui, rgba(15, 23, 42, 0.08));
}

.operational-flow-panel__eyebrow {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #8a6a3f;
}

.operational-flow-panel__title {
  margin: 0.15rem 0 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-main, #0f172a);
}

.operational-flow-panel__count {
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0 0.75rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: var(--text-main, #0f172a);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 900;
}

.operational-flow-table__head,
.operational-flow-row {
  padding: 0.95rem 1.25rem;
}

.operational-flow-table__head {
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-soft, #64748b);
  background: rgba(248, 250, 252, 0.92);
}

/* Grid de 6 colunas para LOJA */
.operational-flow-table__grid--loja {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 0.75fr) auto;
  gap: 1rem;
  align-items: center;
}

/* Grid de 5 colunas para FÁBRICA */
.operational-flow-table__grid--fabrica {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 0.75fr) auto;
  gap: 1rem;
  align-items: center;
}

.operational-flow-row {
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.operational-flow-row__title,
.operational-flow-row__text,
.operational-transition-row__client,
.operational-transition-row__reason { margin: 0; }

.operational-flow-row__title,
.operational-transition-row__client {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-main, #0f172a);
}

.operational-flow-row__text {
  font-size: 0.83rem;
  font-weight: 700;
  color: var(--text-main, #0f172a);
}

.operational-flow-row__caption,
.operational-transition-row__reason {
  margin-top: 0.2rem;
  font-size: 0.74rem;
  color: var(--text-soft, #64748b);
}

.operational-flow-row__actions,
.operational-transition-row__meta {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
}

.operational-transition-list { padding: 0 1.25rem; }
.operational-transition-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}
.operational-transition-row:last-child { border-bottom: none; }

.operational-chip {
  display: inline-flex;
  align-items: center;
  min-height: 1.85rem;
  padding: 0 0.75rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 1px solid transparent;
}

.operational-chip--store {
  background: rgba(24, 119, 242, 0.1);
  color: #1256b6;
  border-color: rgba(24, 119, 242, 0.18);
}

.operational-chip--factory {
  background: rgba(180, 83, 9, 0.12);
  color: #9a4b06;
  border-color: rgba(180, 83, 9, 0.18);
}

.operational-chip--attention {
  background: rgba(220, 38, 38, 0.1);
  color: #b42318;
  border-color: rgba(220, 38, 38, 0.18);
}

.operational-link {
  border: 0;
  background: transparent;
  color: #1256b6;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
}

@media (max-width: 768px) {
  .operational-flow-page__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .operational-flow-table__grid--loja,
  .operational-flow-table__grid--fabrica {
    grid-template-columns: 1fr;
  }
  .operational-flow-table__head { display: none; }
}
</style>
