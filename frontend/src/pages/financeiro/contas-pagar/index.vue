<template>
  <Card :shadow="true">
    <PageHeader
      title="Contas a Pagar"
      subtitle="Consolidado: despesas, compras e fechamentos (com compensação do plano de corte)."
      icon="pi pi-arrow-down-right"
      :backTo="null"
    />

    <div class="p-6 relative space-y-6">
      <Loading v-if="loading" />

      <template v-else>
        <!-- FILTROS (simples) -->
        <div class="grid grid-cols-12 gap-4">
          <SearchInput
            class="col-span-12 md:col-span-8"
            v-model="filtroTexto"
            mode="search"
            label="Buscar"
            placeholder="Buscar por fornecedor, origem, status..."
          />

          <SearchInput
            class="col-span-12 md:col-span-4"
            v-model="filtroStatus"
            mode="select"
            label="Status"
            placeholder="Selecione..."
            :options="STATUS_OPTIONS"
          />
        </div>

        <!-- ANÁLISE DE STATUS -->
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
            <div class="text-[9px] font-black uppercase tracking-[0.22em] text-red-400">Vencidos</div>
            <div class="text-lg font-black text-red-700">{{ format.currency(totais.vencido) }}</div>
            <div class="text-xs font-bold text-red-500">{{ contagens.vencido }} itens</div>
          </div>

          <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100">
            <div class="text-[9px] font-black uppercase tracking-[0.22em] text-amber-500">Em aberto</div>
            <div class="text-lg font-black text-amber-700">{{ format.currency(totais.em_aberto) }}</div>
            <div class="text-xs font-bold text-amber-600">{{ contagens.em_aberto }} itens</div>
          </div>

          <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-green-50 border border-green-100">
            <div class="text-[9px] font-black uppercase tracking-[0.22em] text-green-500">Pagos</div>
            <div class="text-lg font-black text-green-700">{{ format.currency(totais.pago) }}</div>
            <div class="text-xs font-bold text-green-600">{{ contagens.pago }} itens</div>
          </div>
        </div>

        <!-- TABELA -->
        <Table
          :columns="columns"
          :rows="rowsFiltrados"
          :loading="false"
          emptyText="Nenhum lançamento encontrado."
          :boxed="true"
        >
          <template #cell-origem="{ row }">
            <div class="font-black text-gray-900">{{ row.origem }}</div>
            <div class="text-xs font-bold text-gray-400">#{{ row.id }}</div>
          </template>

          <template #cell-fornecedor="{ row }">
            <div class="font-black text-gray-900">{{ row.fornecedor_nome || '—' }}</div>
            <div class="text-xs font-bold text-gray-400">
              {{ row.descricao || '—' }}
            </div>
          </template>

          <template #cell-vencimento="{ row }">
            <div class="text-xs font-black text-gray-900">{{ format.date(row.vencimento_em) }}</div>
          </template>

          <template #cell-compensado="{ row }">
            <div class="font-black text-gray-900 text-right">
              {{ format.currency(Number(row.valor_compensado || 0)) }}
            </div>
            <div v-if="Number(row.valor_compensado || 0) > 0" class="text-[10px] font-black text-gray-400 uppercase text-right">
              plano corte
            </div>
          </template>

          <template #cell-valor="{ row }">
            <div class="font-black text-gray-900 text-right">
              {{ format.currency(Number(row.valor || 0)) }}
            </div>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status" />
          </template>

          <template #cell-extra="{ row }">
            <div class="text-xs font-bold text-gray-500 text-right">
              <template v-if="row.origem === 'FECHAMENTO'">
                Cheques: {{ row.cheques_total || 0 }}
              </template>
              <template v-else>
                —
              </template>
            </div>
          </template>
        </Table>
      </template>
    </div>
  </Card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FinanceiroService } from '@/services/index'
import { format } from '@/utils/format'

// ✅ sem importar componentes (já estão no main.js)

const loading = ref(true)
const rows = ref([])

const filtroTexto = ref('')
const filtroStatus = ref(null)

const STATUS_OPTIONS = [
  { label: 'EM_ABERTO', value: 'EM_ABERTO' },
  { label: 'VENCIDO', value: 'VENCIDO' },
  { label: 'PAGO', value: 'PAGO' },
]

const columns = [
  { key: 'origem', label: 'Origem', width: '160px' },
  { key: 'fornecedor', label: 'Fornecedor / Descrição' },
  { key: 'vencimento', label: 'Vencimento', width: '160px' },
  { key: 'compensado', label: 'Compensado', width: '160px', align: 'right' },
  { key: 'valor', label: 'Valor', width: '160px', align: 'right' },
  { key: 'status', label: 'Status', width: '160px' },
  { key: 'extra', label: 'Info', width: '140px', align: 'right' },
]

const rowsFiltrados = computed(() => {
  const txt = String(filtroTexto.value || '').trim().toLowerCase()
  const st = filtroStatus.value ? String(filtroStatus.value).trim() : null

  return (rows.value || []).filter((r) => {
    if (st && String(r.status || '').trim() !== st) return false

    if (!txt) return true

    const hay = [
      r.origem,
      r.status,
      r.fornecedor_nome,
      r.descricao,
      r.observacao,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return hay.includes(txt)
  })
})

const contagens = computed(() => {
  const base = rowsFiltrados.value || []
  const c = { vencido: 0, em_aberto: 0, pago: 0 }
  for (const r of base) {
    const s = String(r.status || '').toUpperCase()
    if (s === 'VENCIDO') c.vencido++
    else if (s === 'EM_ABERTO') c.em_aberto++
    else if (s === 'PAGO') c.pago++
  }
  return c
})

const totais = computed(() => {
  const base = rowsFiltrados.value || []
  const t = { vencido: 0, em_aberto: 0, pago: 0 }
  for (const r of base) {
    const s = String(r.status || '').toUpperCase()
    const v = Number(r.valor || 0)
    if (s === 'VENCIDO') t.vencido += v
    else if (s === 'EM_ABERTO') t.em_aberto += v
    else if (s === 'PAGO') t.pago += v
  }
  return t
})

async function carregar() {
  loading.value = true
  try {
    const { data } = await FinanceiroService.listarPagar({})
    rows.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
</script>
