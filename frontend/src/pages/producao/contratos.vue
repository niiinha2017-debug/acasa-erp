<template>
  <PageShell :padded="false" variant="minimal">
    <section class="login-font ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Contratos em obra"
        subtitle="Contratos ativos (vigentes). Ao finalizar, o contrato sai desta lista."
        icon="pi pi-file-edit"
        variant="minimal"
      />

      <div class="ds-page-context__content px-4 md:px-8 pb-6 md:pb-8 pt-5 overflow-visible">
        <div v-if="loading" class="py-12 text-center text-text-muted font-bold text-base">
          <i class="pi pi-spin pi-spinner text-2xl" />
          <p class="mt-2">Carregando contratos...</p>
        </div>

        <template v-else>
          <div class="mb-5 ds-card ds-card--default px-4 py-3 text-sm font-medium text-text-muted">
            Contratos com status <strong class="text-text-main">Vigente</strong> (em obra). As colunas de valor e financeiro referem-se a <strong class="text-text-main">contas a receber</strong> (pagamentos do cliente). Data de referência: dia atual.
          </div>

          <div v-if="contratos.length > 0" class="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total contratos"
              :value="quantidadeContratos"
              icon="pi pi-file"
              color="slate"
            />
            <MetricCard
              label="Valor total em obra"
              :value="format.currency(totais.valor_total)"
              icon="pi pi-wallet"
              color="slate"
            />
            <MetricCard
              label="Total já pago"
              :value="format.currency(totais.total_pago)"
              icon="pi pi-check-circle"
              color="emerald"
            />
            <MetricCard
              label="Saldo a receber"
              :value="format.currency(totais.saldo_a_receber)"
              icon="pi pi-clock"
              color="amber"
            />
          </div>

          <div class="ds-card ds-card--default overflow-x-auto overflow-y-visible contratos-table">
            <Table
              :columns="columns"
              :rows="contratos"
              :loading="false"
              empty-text="Nenhum contrato em obra no momento."
              :boxed="false"
              :flush="true"
            >
              <template #cell-cliente="{ row }">
                <div class="contratos-cell flex flex-col gap-1">
                  <span class="text-sm font-semibold text-text-main leading-snug">
                    {{ row.cliente?.nome_completo || row.cliente?.razao_social || row.cliente?.nome || '—' }}
                  </span>
                  <span v-if="row.numero" class="text-xs font-bold text-text-muted">
                    {{ row.numero }}
                  </span>
                  <StatusBadge
                    v-if="row.aguardando_financeiro"
                    value="pendente"
                    label="Aguardando financeiro"
                    class="w-fit"
                    title="Medição finalizada, mas há parcela(s) com vencimento já passado não paga(s). Não liberar corte/produção."
                  />
                </div>
              </template>
              <template #cell-status_obra="{ row }">
                <span class="contratos-cell text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {{ labelStatusObra(row.venda?.status) }}
                </span>
              </template>
              <template #cell-valor="{ row }">
                <span class="contratos-cell text-sm font-semibold text-text-main tabular-nums leading-snug block text-right">
                  {{ format.currency(row.valor) }}
                </span>
              </template>
              <template #cell-historico_pagamentos="{ row }">
                <div v-if="row.resumo_financeiro != null" class="contratos-cell flex flex-col gap-0.5 leading-snug text-right">
                  <span class="text-xs text-text-muted">
                    Pago desde o início:
                  </span>
                  <span class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {{ format.currency(row.resumo_financeiro.total_pago) }}
                  </span>
                </div>
                <span v-else class="contratos-cell text-sm text-text-muted leading-snug">—</span>
              </template>
              <template #cell-status_pagamento="{ row }">
                <StatusBadge
                  v-if="row.status_pagamento === 'OK'"
                  value="pago"
                  label="OK"
                />
                <StatusBadge
                  v-else-if="row.status_pagamento === 'PENDENTE'"
                  value="pendente"
                  label="Pendente"
                />
                <span v-else class="contratos-cell text-sm text-text-muted leading-snug">—</span>
              </template>
              <template #cell-financeiro="{ row }">
                <template v-if="row.resumo_financeiro != null">
                  <StatusBadge
                    v-if="row.resumo_financeiro.quitado"
                    value="pago"
                    label="Quitado"
                  />
                  <StatusBadge
                    v-else
                    value="pendente"
                    label="Parcelas em aberto"
                  />
                </template>
                <span v-else class="contratos-cell text-sm text-text-muted leading-snug">—</span>
              </template>
              <template #cell-acoes="{ row }">
                <div class="contratos-cell flex items-center gap-1 justify-end">
                  <RouterLink
                    :to="`/contratos/${row.id}`"
                    class="p-2 rounded-lg text-text-muted hover:bg-[var(--ds-color-surface-muted)] hover:text-brand-primary transition-colors"
                    title="Ver contrato"
                  >
                    <i class="pi pi-eye text-sm" />
                  </RouterLink>
                  <RouterLink
                    v-if="row.cliente_id"
                    :to="`/contratos/cliente/${row.cliente_id}`"
                    class="p-2 rounded-lg text-text-muted hover:bg-[var(--ds-color-surface-muted)] hover:text-brand-primary transition-colors"
                    title="Lista cliente"
                  >
                    <i class="pi pi-list text-sm" />
                  </RouterLink>
                </div>
              </template>
            </Table>
          </div>
        </template>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ContratosService } from '@/services/index'
import { getStatusVendaOperacionalLabel } from '@/constantes'
import { format } from '@/utils/format'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'contratos.ver' } })

const loading = ref(true)
const contratos = ref([])

const columns = [
  { key: 'cliente', label: 'CLIENTE / CONTRATO' },
  { key: 'valor', label: 'VALOR', width: '120px', align: 'right' },
  { key: 'historico_pagamentos', label: 'HISTÓRICO DE PAGAMENTOS', width: '180px', align: 'right' },
  { key: 'status_pagamento', label: 'STATUS', width: '100px' },
  { key: 'financeiro', label: 'A RECEBER', width: '160px' },
  { key: 'status_obra', label: 'STATUS OBRA', width: '160px' },
  { key: 'acoes', label: '', width: '88px', align: 'right' },
]

const totais = computed(() => {
  const list = contratos.value || []
  let valor_total = 0
  let total_pago = 0
  for (const c of list) {
    valor_total += Number(c.valor || 0)
    total_pago += Number(c.resumo_financeiro?.total_pago ?? 0)
  }
  return {
    valor_total,
    total_pago,
    saldo_a_receber: Math.max(0, valor_total - total_pago),
  }
})

const quantidadeContratos = computed(() => (contratos.value?.length || 0).toLocaleString('pt-BR'))

function labelStatusObra(status) {
  return getStatusVendaOperacionalLabel(status) || '—'
}

async function carregar() {
  loading.value = true
  try {
    const { data } = await ContratosService.listar({ status: 'VIGENTE' })
    contratos.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar contratos em obra.')
    contratos.value = []
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
</script>

<style scoped>
.contratos-table :deep(thead th) {
  padding: 0.625rem 1rem;
  font-size: 0.6875rem;
  font-weight: 500;
  line-height: 1.3;
  vertical-align: top;
  letter-spacing: 0.04em;
  color: var(--ds-color-text-muted);
}
.contratos-table :deep(tbody td) {
  padding: 0.875rem 1rem;
  font-size: 0.8125rem;
  line-height: 1.35;
  vertical-align: middle;
}
.contratos-table :deep(tbody td) > * {
  vertical-align: middle;
}
</style>
