<template>
  <div class="w-full max-w-[1100px] mx-auto space-y-6 animate-page-in">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="w-full h-2 rounded-t-2xl shrink-0 bg-brand-primary" />
      <PageHeader
        title="Contratos em obra"
        subtitle="Contratos ativos (vigentes). Ao finalizar, o contrato sai desta lista."
        icon="pi pi-file-edit"
      />

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
        <div v-if="loading" class="py-12 text-center text-slate-500 font-bold">
          <i class="pi pi-spin pi-spinner text-2xl" />
          <p class="mt-2">Carregando contratos...</p>
        </div>

        <template v-else>
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4">
            Apenas contratos com status <strong>Vigente</strong> (em obra). Data de referência: dia atual.
          </p>

          <div class="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 overflow-hidden">
            <Table
              :columns="columns"
              :rows="contratos"
              :loading="false"
              empty-text="Nenhum contrato em obra no momento."
              :boxed="false"
            >
              <template #cell-cliente="{ row }">
                <div class="flex flex-col gap-1">
                  <span class="text-sm font-bold text-slate-800 dark:text-white">
                    {{ row.cliente?.nome_completo || row.cliente?.razao_social || row.cliente?.nome || '—' }}
                  </span>
                  <span
                    v-if="row.aguardando_financeiro"
                    class="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold"
                    title="Medição finalizada, mas há parcela(s) com vencimento já passado não paga(s). Não liberar corte/produção."
                  >
                    <i class="pi pi-exclamation-triangle" />
                    AGUARDANDO FINANCEIRO
                  </span>
                </div>
              </template>
              <template #cell-numero="{ row }">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-200">{{ row.numero || '—' }}</span>
              </template>
              <template #cell-valor="{ row }">
                <span class="text-sm font-black text-slate-800 dark:text-white tabular-nums">
                  {{ format.currency(row.valor) }}
                </span>
              </template>
              <template #cell-historico_pagamentos="{ row }">
                <div v-if="row.resumo_financeiro != null" class="flex flex-col gap-0.5">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Pago desde o início:
                  </span>
                  <span class="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {{ format.currency(row.resumo_financeiro.total_pago) }}
                  </span>
                </div>
                <span v-else class="text-xs text-slate-400">—</span>
              </template>
              <template #cell-status_pagamento="{ row }">
                <span
                  v-if="row.status_pagamento === 'OK'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                >
                  <i class="pi pi-check" />
                  OK
                </span>
                <span
                  v-else-if="row.status_pagamento === 'PENDENTE'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
                >
                  <i class="pi pi-clock" />
                  PENDENTE
                </span>
                <span v-else class="text-xs text-slate-400">—</span>
              </template>
              <template #cell-financeiro="{ row }">
                <template v-if="row.resumo_financeiro != null">
                  <span
                    v-if="row.resumo_financeiro.quitado"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                  >
                    <i class="pi pi-check" />
                    Quitado
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
                  >
                    <i class="pi pi-clock" />
                    Com parcelas em aberto
                  </span>
                </template>
                <span v-else class="text-xs text-slate-400">—</span>
              </template>
              <template #cell-acoes="{ row }">
                <div class="flex items-center gap-2 justify-end">
                  <RouterLink
                    :to="`/contratos/${row.id}`"
                    class="h-8 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase hover:bg-brand-primary/10 hover:text-brand-primary inline-flex items-center gap-1.5 transition-colors"
                  >
                    <i class="pi pi-eye text-xs" />
                    Ver contrato
                  </RouterLink>
                  <RouterLink
                    v-if="row.cliente_id"
                    :to="`/contratos/cliente/${row.cliente_id}`"
                    class="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase hover:border-brand-primary/50 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <i class="pi pi-list text-xs" />
                    Lista cliente
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
import { onMounted, ref } from 'vue'
import { ContratosService } from '@/services/index'
import { format } from '@/utils/format'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'contratos.ver' } })

const loading = ref(true)
const contratos = ref([])

const columns = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'numero', label: 'Número', width: '140px' },
  { key: 'valor', label: 'Valor', width: '120px', align: 'right' },
  { key: 'historico_pagamentos', label: 'Histórico de pagamentos', width: '180px' },
  { key: 'status_pagamento', label: 'Status de Pagamento', width: '160px' },
  { key: 'financeiro', label: 'Financeiro', width: '200px' },
  { key: 'acoes', label: 'Ações', width: '220px', align: 'right' },
]

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
