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
                placeholder="Buscar descrição, fornecedor, categoria, status ou valor..."
              />
            </div>

            <Button
              variant="secondary"
              @click="router.push('/compras/sugestao')"
            >
              <i class="pi pi-shopping-bag mr-2"></i>
              Sugestão de Compra
            </Button>
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
          :rows="rowsToShow"
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
            <StatusBadge :value="statusExibicao(row)" />
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
        <TablePagination
          v-if="total > 0"
          :page="page"
          :page-size="pageSize"
          :total="total"
          @update:page="setPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import api from '@/services/api'
import { format } from '@/utils/format'
import { usePagination } from '@/composables/usePagination'

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
  const termo = String(filtro.value || '').toLowerCase().trim()
  if (!termo) return compras.value
  const palavras = termo.split(/\s+/).filter(Boolean)
  const valorFmt = (v) => (v != null && v !== '') ? format.currency(v) : ''
  return compras.value.filter((c) => {
    const desc = String(c.descricao || '').toLowerCase()
    const cat = String(c.categoria || '').toLowerCase()
    const forn = String(c.fornecedor?.nome_fantasia || c.fornecedor?.razao_social || '').toLowerCase()
    const statusStr = String(c.status || '').toLowerCase()
    const valorStr = valorFmt(c.valor_total).toLowerCase().replace(/\s/g, '')
    const valorNum = String(c.valor_total ?? '').toLowerCase()
    const dataStr = c.data_compra ? format.date(c.data_compra).toLowerCase() : ''
    const textoBusca = [desc, cat, forn, statusStr, valorStr, valorNum, dataStr].join(' ')
    return palavras.every((p) => textoBusca.includes(p))
  })
})

const { page, setPage, total, totalPages, pageSize, rowsToShow } = usePagination(
  filtradas,
  { pageSize: 15 },
)
watch(filtro, () => setPage(1))

const totalGeral = computed(() => compras.value.reduce((acc, c) => acc + Number(c.valor_total || 0), 0))
const totalInsumos = computed(() => compras.value.filter(c => c.categoria === 'INSUMO').reduce((acc, c) => acc + Number(c.valor_total || 0), 0))
const totalDespesas = computed(() => compras.value.filter(c => c.categoria === 'DESPESA').reduce((acc, c) => acc + Number(c.valor_total || 0), 0))
const totalInvestimentos = computed(() => compras.value.filter(c => c.categoria === 'INVESTIMENTO').reduce((acc, c) => acc + Number(c.valor_total || 0), 0))

/** Verde = já chegou/pago. Vermelho = atrasado (vencimento passado e em aberto). */
function statusExibicao(row) {
  const status = String(row.status || '').toUpperCase()
  const vencimento = row.vencimento_em ? new Date(row.vencimento_em) : null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  if (vencimento && status === 'EM_ABERTO') {
    vencimento.setHours(0, 0, 0, 0)
    if (vencimento < hoje) return 'ATRASADO'
  }
  return row.status || 'EM_ABERTO'
}

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
