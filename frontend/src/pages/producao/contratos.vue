<template>
  <div class="w-full max-w-7xl mx-auto space-y-6 animate-page-in px-2 md:px-4 pb-8">
    <div class="relative rounded-2xl border border-border-ui bg-bg-card overflow-visible">
      <div class="w-full h-2 rounded-t-2xl shrink-0 bg-brand-primary overflow-hidden" />
      <PageHeader
        title="Contratos em obra"
        subtitle="Contratos ativos (vigentes). Ao finalizar, o contrato sai desta lista."
        icon="pi pi-file-edit"
      />

      <div class="px-4 md:px-8 pb-6 md:pb-8 pt-5 border-t border-border-ui overflow-visible">
        <div v-if="loading" class="py-12 text-center text-slate-500 font-bold text-base">
          <i class="pi pi-spin pi-spinner text-2xl" />
          <p class="mt-2">Carregando contratos...</p>
        </div>

        <template v-else>
          <p class="text-sm font-bold text-slate-500 dark:text-slate-400 mb-5">
            Contratos com status <strong>Vigente</strong> (em obra). As colunas de valor e financeiro referem-se a <strong>contas a receber</strong> (pagamentos do cliente). Data de referência: dia atual.
          </p>

          <div v-if="contratos.length > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div class="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-4">
              <p class="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Total contratos</p>
              <p class="text-xl font-black text-slate-800 dark:text-white tabular-nums">{{ format.currency(totais.valor_total) }}</p>
            </div>
            <div class="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
              <p class="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Total já pago</p>
              <p class="text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{{ format.currency(totais.total_pago) }}</p>
            </div>
            <div class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4">
              <p class="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Saldo a receber</p>
              <p class="text-xl font-black text-amber-700 dark:text-amber-300 tabular-nums">{{ format.currency(totais.saldo_a_receber) }}</p>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 overflow-x-auto overflow-y-visible contratos-table">
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
                  <span class="text-sm font-semibold text-slate-800 dark:text-white leading-snug">
                    {{ row.cliente?.nome_completo || row.cliente?.razao_social || row.cliente?.nome || '—' }}
                  </span>
                  <span v-if="row.numero" class="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {{ row.numero }}
                  </span>
                  <span
                    v-if="row.aguardando_financeiro"
                    class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium leading-snug"
                    title="Medição finalizada, mas há parcela(s) com vencimento já passado não paga(s). Não liberar corte/produção."
                  >
                    <i class="pi pi-exclamation-triangle text-[10px]" />
                    AGUARDANDO FINANCEIRO
                  </span>
                </div>
              </template>
              <template #cell-status_obra="{ row }">
                <span class="contratos-cell text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ labelStatusObra(row.venda?.status) }}
                </span>
              </template>
              <template #cell-valor="{ row }">
                <span class="contratos-cell text-sm font-semibold text-slate-800 dark:text-white tabular-nums leading-snug block text-right">
                  {{ format.currency(row.valor) }}
                </span>
              </template>
              <template #cell-historico_pagamentos="{ row }">
                <div v-if="row.resumo_financeiro != null" class="contratos-cell flex flex-col gap-0.5 leading-snug text-right">
                  <span class="text-xs text-slate-500 dark:text-slate-400">
                    Pago desde o início:
                  </span>
                  <span class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {{ format.currency(row.resumo_financeiro.total_pago) }}
                  </span>
                </div>
                <span v-else class="contratos-cell text-sm text-slate-400 leading-snug">—</span>
              </template>
              <template #cell-status_pagamento="{ row }">
                <span
                  v-if="row.status_pagamento === 'OK'"
                  class="badge-compact inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-700/80"
                >
                  <i class="pi pi-check text-[9px]" />
                  OK
                </span>
                <span
                  v-else-if="row.status_pagamento === 'PENDENTE'"
                  class="badge-compact inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/80"
                >
                  <i class="pi pi-clock text-[9px]" />
                  PENDENTE
                </span>
                <span v-else class="contratos-cell text-sm text-slate-400 leading-snug">—</span>
              </template>
              <template #cell-financeiro="{ row }">
                <template v-if="row.resumo_financeiro != null">
                  <span
                    v-if="row.resumo_financeiro.quitado"
                    class="badge-compact inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-700/80 whitespace-nowrap"
                  >
                    <i class="pi pi-check text-[9px]" />
                    Quitado
                  </span>
                  <span
                    v-else
                    class="badge-compact inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/80 whitespace-nowrap"
                  >
                    <i class="pi pi-clock text-[9px]" />
                    Parcelas em aberto
                  </span>
                </template>
                <span v-else class="contratos-cell text-sm text-slate-400 leading-snug">—</span>
              </template>
              <template #cell-acoes="{ row }">
                <div class="contratos-cell flex items-center gap-1 justify-end">
                  <RouterLink
                    :to="`/contratos/${row.id}`"
                    class="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200 hover:text-brand-primary transition-colors"
                    title="Ver contrato"
                  >
                    <i class="pi pi-eye text-sm" />
                  </RouterLink>
                  <RouterLink
                    v-if="row.cliente_id"
                    :to="`/contratos/cliente/${row.cliente_id}`"
                    class="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200 hover:text-brand-primary transition-colors"
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
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ContratosService } from '@/services/index'
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

function labelStatusObra(status) {
  const s = String(status || '').trim()
  const map = {
    AGENDAR_MEDIDA_FINA: 'Agendar medida fina',
    MEDIDA_FINA_AGENDADA: 'Medição (agendada)',
    MEDIDA_FINA_REALIZADA: 'Medição (realizada)',
    AGUARDANDO_PROJETO_TECNICO: 'Aguard. projeto',
    PROJETO_TECNICO_EM_ANDAMENTO: 'Projeto em andamento',
    PROJETO_TECNICO_CONCLUIDO: 'Projeto concluído',
    PRODUCAO_AGENDADA: 'Produção (agendada)',
    EM_PRODUCAO: 'Em produção',
    PRODUCAO_FINALIZADA: 'Produção finalizada',
    MONTAGEM_AGENDADA: 'Montagem (agendada)',
    EM_MONTAGEM: 'Em montagem',
  }
  return map[s] || s.replace(/_/g, ' ') || '—'
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
  color: #64748b;
}
.dark .contratos-table :deep(thead th) {
  color: #94a3b8;
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
