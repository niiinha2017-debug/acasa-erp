<template>
  <div class="w-full max-w-[1100px] mx-auto space-y-6 animate-page-in">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="w-full h-2 rounded-t-2xl shrink-0 bg-brand-primary" />
      <PageHeader
        title="Painel de Obras Vigentes"
        subtitle="Vigência começa em Agendar Medida Fina. Saldo do Contas a Receber (parcelas vencidas até hoje)."
        icon="pi pi-wallet"
      />

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui space-y-6">
        <p class="text-xs font-bold text-slate-500 dark:text-slate-400">
          Obras que atingiram <strong>Agendar Medida Fina</strong> ou etapas seguintes (medição, produção, montagem). Saldo e totais lidos do Contas a Receber.
        </p>

        <div v-if="loading" class="py-12 text-center text-slate-500 font-bold">
          <i class="pi pi-spin pi-spinner text-2xl" />
          <p class="mt-2">Carregando painel...</p>
        </div>

        <template v-else>
          <div class="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 overflow-hidden">
            <Table
              :columns="columns"
              :rows="obras"
              :loading="false"
              empty-text="Nenhuma obra vigente no momento."
              :boxed="false"
            >
              <template #cell-cliente_contrato="{ row }">
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm font-black text-slate-800 dark:text-white">
                    {{ row.cliente_nome || '—' }}
                  </span>
                  <span v-if="row.contrato_numero" class="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Contrato {{ row.contrato_numero }}
                  </span>
                  <span v-if="row.receber_no_ato" class="text-xs font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                    💎 RECEBER NO ATO
                  </span>
                </div>
              </template>
              <template #cell-valor_total="{ row }">
                <span class="text-sm font-black text-slate-800 dark:text-white tabular-nums">
                  {{ formatarMoeda(row.valor_total) }}
                </span>
              </template>
              <template #cell-total_pago="{ row }">
                <span class="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {{ formatarMoeda(row.total_pago) }}
                </span>
              </template>
              <template #cell-saldo_a_receber="{ row }">
                <span class="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  {{ formatarMoeda(row.saldo_a_receber) }}
                </span>
              </template>
              <template #cell-status_venda="{ row }">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ labelStatus(row.status_venda) }}
                </span>
              </template>
            </Table>
          </div>

          <div v-if="obras.length > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-4">
              <p class="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Total contratos</p>
              <p class="text-xl font-black text-slate-800 dark:text-white tabular-nums">{{ formatarMoeda(totais.valor_total) }}</p>
            </div>
            <div class="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
              <p class="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Total já pago</p>
              <p class="text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{{ formatarMoeda(totais.total_pago) }}</p>
            </div>
            <div class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4">
              <p class="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Saldo a receber</p>
              <p class="text-xl font-black text-amber-700 dark:text-amber-300 tabular-nums">{{ formatarMoeda(totais.saldo_a_receber) }}</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { FinanceiroService } from '@/services/index'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'contas_pagar.ver' } })

const loading = ref(true)
const obras = ref([])

const columns = [
  { key: 'cliente_contrato', label: 'Cliente / Contrato' },
  { key: 'valor_total', label: 'Valor total do contrato', width: '160px', align: 'right' },
  { key: 'total_pago', label: 'Total já pago', width: '140px', align: 'right' },
  { key: 'saldo_a_receber', label: 'Saldo a receber', width: '140px', align: 'right' },
  { key: 'status_venda', label: 'Status obra', width: '140px' },
]

const totais = computed(() => {
  const list = obras.value || []
  return {
    valor_total: list.reduce((s, r) => s + Number(r.valor_total || 0), 0),
    total_pago: list.reduce((s, r) => s + Number(r.total_pago || 0), 0),
    saldo_a_receber: list.reduce((s, r) => s + Number(r.saldo_a_receber || 0), 0),
  }
})

const formatarMoeda = (v) =>
  v != null && v !== ''
    ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00'

function labelStatus(status) {
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
  return map[s] || s.replace(/_/g, ' ')
}

async function carregar() {
  loading.value = true
  try {
    const res = await FinanceiroService.painelObrasVigentes()
    const data = res?.data ?? res
    obras.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar painel de obras vigentes.')
    obras.value = []
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
</script>
