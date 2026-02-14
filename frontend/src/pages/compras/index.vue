<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Compras"
        subtitle="Registro de entradas, insumos e rateios de custo"
        icon="pi pi-shopping-cart"
        :show-back="false"
      >
        <template #actions>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-64 order-1 sm:order-0">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar descrição, categoria ou valor..."
              />
            </div>

            <Button
              v-if="can('compras.criar')"
              variant="primary"
              @click="router.push('/compras/novo')"
            >
              <i class="pi pi-plus mr-2"></i>
              Nova Compra
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          empty-text="Nenhuma compra registrada."
          :boxed="false"
        >
          <template #cell-descricao="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-sm font-bold text-text-main uppercase tracking-tight leading-tight">
                {{ row.descricao }}
              </span>
              <span class="text-[10px] font-medium text-text-muted truncate">
                {{ row.fornecedor?.nome_fantasia || 'Fornecedor não informado' }}
              </span>
            </div>
          </template>

          <template #cell-categoria="{ row }">
            <span class="text-[10px] font-black uppercase text-text-muted tracking-wider border border-border-ui bg-bg-page px-2 py-1 rounded-lg">
              {{ row.categoria }}
            </span>
          </template>

          <template #cell-data="{ row }">
            <span class="text-xs font-bold text-text-main">{{ format.date(row.data_compra) }}</span>
          </template>

          <template #cell-valor="{ row }">
            <span class="text-sm font-bold text-text-main tabular-nums">
              {{ format.currency(row.valor_total) }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status || 'CONCLUIDO'" />
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
              <TableActions
                :id="row.id"
                perm-edit="compras.editar"
                perm-delete="compras.excluir"
                @edit="(id) => router.push(`/compras/${id}`)"
                @delete="(id) => confirmarExcluir(id)"
              />
            </div>
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
  { key: 'acoes', label: 'Ações', align: 'center', width: '10%' }
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

const totalGeral = computed(() => compras.value.reduce((acc, c) => acc + Number(c.valor_total || 0), 0))
const totalInsumos = computed(() => compras.value.filter(c => c.categoria === 'INSUMO').reduce((acc, c) => acc + Number(c.valor_total || 0), 0))
const totalDespesas = computed(() => compras.value.filter(c => c.categoria === 'DESPESA').reduce((acc, c) => acc + Number(c.valor_total || 0), 0))
const totalInvestimentos = computed(() => compras.value.filter(c => c.categoria === 'INVESTIMENTO').reduce((acc, c) => acc + Number(c.valor_total || 0), 0))

async function carregar() {
  if (!can('compras.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
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
