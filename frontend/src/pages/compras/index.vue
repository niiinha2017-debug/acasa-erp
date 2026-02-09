<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-page-in">
    
    <PageHeader 
      title="Compras"
      subtitle="Registro de entradas, insumos e rateios de custo"
      icon="pi pi-shopping-cart"
    >
      <template #actions>
        <Button
          v-if="can('compras.criar')"
          variant="primary"
          @click="router.push('/compras/novo')"
        >
          <i class="pi pi-plus mr-2"></i>
          Nova Compra
        </Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total Geral"
        :value="format.currency(totalGeral)"
        icon="pi pi-dollar"
        color="slate"
      />
      
      <MetricCard
        label="Estoque/Insumos"
        :value="format.currency(totalInsumos)"
        icon="pi pi-box"
        color="blue"
      />

       <MetricCard
        label="Despesas Fixas"
        :value="format.currency(totalDespesas)"
        icon="pi pi-wallet"
        color="rose"
      />

       <MetricCard
        label="Investimentos"
        :value="format.currency(totalInvestimentos)"
        icon="pi pi-chart-line"
        color="emerald"
      />
    </div>

    <div class="space-y-4">
      <div class="w-full md:w-96">
        <SearchInput
          v-model="filtro"
          placeholder="Buscar descrição, categoria ou valor..."
        />
      </div>

      <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          empty-text="Nenhuma compra registrada."
          :boxed="false"
        >
          <template #cell-descricao="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-sm font-bold text-slate-800 uppercase tracking-tight leading-tight">
                {{ row.descricao }}
              </span>
              <span class="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {{ row.fornecedor?.nome_fantasia || 'Fornecedor não informado' }}
              </span>
            </div>
          </template>

          <template #cell-categoria="{ row }">
             <span class="text-[10px] font-black uppercase text-slate-500 tracking-wider border border-slate-100 bg-slate-50 px-2 py-1 rounded-lg">
               {{ row.categoria }}
             </span>
          </template>

          <template #cell-data="{ row }">
            <div class="flex flex-col">
              <span class="text-xs font-bold text-slate-700">{{ format.date(row.data_compra) }}</span>
            </div>
          </template>

          <template #cell-valor="{ row }">
             <span class="text-sm font-black text-slate-800 tabular-nums">
               {{ format.currency(row.valor_total) }}
             </span>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status || 'CONCLUIDO'" />
          </template>

          <template #cell-acoes="{ row }">
             <TableActions
                :can-edit="can('compras.editar')"
                :can-delete="can('compras.excluir')"
                @edit="router.push(`/compras/${row.id}`)"
                @delete="confirmarExcluir(row.id)"
              />
          </template>
        </Table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import api from '@/services/api'
import { format } from '@/utils/format'

definePage({ meta: { perm: 'compras.ver' } })

const router = useRouter()
const loading = ref(false)
const compras = ref([])
const filtro = ref('')

const columns = [
  { key: 'descricao', label: 'DESCRIÇÃO / FORNECEDOR', width: '35%' },
  { key: 'categoria', label: 'CATEGORIA', width: '15%' },
  { key: 'data', label: 'DATA', width: '15%' },
  { key: 'valor', label: 'VALOR', width: '15%', align: 'right' },
  { key: 'status', label: 'STATUS', width: '10%' },
  { key: 'acoes', label: '', align: 'right', width: '10%' }
]

const filtradas = computed(() => {
  const f = String(filtro.value || '').toLowerCase().trim()
  if (!f) return compras.value

  return compras.value.filter(c => {
    const desc = String(c.descricao || '').toLowerCase()
    const cat = String(c.categoria || '').toLowerCase()
    const forn = String(c.fornecedor?.nome_fantasia || '').toLowerCase()
    return desc.includes(f) || cat.includes(f) || forn.includes(f)
  })
})

// Metrics
const totalGeral = computed(() => compras.value.reduce((acc, c) => acc + Number(c.valor_total || 0), 0))
const totalInsumos = computed(() => compras.value.filter(c => c.categoria === 'INSUMO').reduce((acc, c) => acc + Number(c.valor_total || 0), 0))
const totalDespesas = computed(() => compras.value.filter(c => c.categoria === 'DESPESA').reduce((acc, c) => acc + Number(c.valor_total || 0), 0))
const totalInvestimentos = computed(() => compras.value.filter(c => c.categoria === 'INVESTIMENTO').reduce((acc, c) => acc + Number(c.valor_total || 0), 0))

async function carregar() {
  if (!can('compras.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    // Ajuste endpoint conforme backend
    const { data } = await api.get('/compras')
    compras.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar compras.')
  } finally {
    loading.value = false
  }
}

async function confirmarExcluir(id) {
  if (!can('compras.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show(
    'Excluir Compra',
    `Deseja excluir permanentemente a compra #${id}?`,
  )
  if (!ok) return

  try {
    await api.delete(`/compras/${id}`)
    notify.success('Compra removida.')
    await carregar()
  } catch (e) {
    notify.error('Erro ao excluir.')
  }
}

onMounted(async () => {
  if (can('compras.ver')) await carregar()
})
</script>
