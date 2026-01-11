<template>
  <Card :shadow="true">
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">Compras</h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          Gerencie compras de insumos e vinculadas a ambientes/vendas.
        </p>
      </div>

      <Button variant="primary" size="sm" type="button" @click="router.push('/compras/novo')">
        <i class="pi pi-plus mr-2 text-xs"></i>
        Nova Compra
      </Button>
    </header>

    <!-- BODY -->
    <div class="p-6 space-y-5">
      <SearchInput
        v-model="filtro"
        placeholder="Buscar por fornecedor, status, tipo ou ID da venda..."
        :colSpan="12"
      />

      <div class="overflow-hidden rounded-2xl border border-gray-100">
        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          empty-text="Nenhuma compra encontrada."
        >
          <template #cell-tipo_compra="{ row }">
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider"
              :class="row.tipo_compra === 'INSUMOS'
                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                : 'bg-amber-50 text-amber-700 border border-amber-100'"
            >
              {{ row.tipo_compra === 'INSUMOS' ? 'INSUMOS' : 'CLIENTE/AMBIENTE' }}
            </span>
          </template>

          <template #cell-fornecedor="{ row }">
            <span class="font-black text-gray-900">
              {{ nomeFornecedor(row) }}
            </span>
          </template>

          <template #cell-venda_id="{ row }">
            <span
              v-if="row.venda_id"
              class="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-black text-gray-700"
            >
              #{{ row.venda_id }}
            </span>
            <span v-else class="text-sm font-semibold text-gray-400">-</span>
          </template>

          <template #cell-valor_total="{ row }">
            <span class="text-sm font-black text-gray-900">
              {{ format.currency(row.valor_total) }}
            </span>
          </template>

          <template #cell-data_compra="{ row }">
            <span class="text-sm font-semibold text-gray-600">
              {{ format.date(row.data_compra) }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border"
              :class="(row.status || 'RASCUNHO') === 'RASCUNHO'
                ? 'bg-gray-50 text-gray-700 border-gray-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100'"
            >
              {{ row.status || 'RASCUNHO' }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                @click="router.push(`/compras/${row.id}`)"
              >
                <i class="pi pi-pencil text-xs"></i>
              </Button>

              <Button
                variant="danger"
                size="sm"
                type="button"
                :loading="deletandoId === row.id"
                @click="excluir(row.id)"
              >
                <i class="pi pi-trash text-xs"></i>
              </Button>
            </div>
          </template>
        </Table>
      </div>
    </div>
  </Card>
</template>



<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { format } from '@/utils/format'

// Componentes UI
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const router = useRouter()

const compras = ref([])
const loading = ref(false)
const deletandoId = ref(null)
const filtro = ref('')

const columns = [
  { key: 'id', label: 'ID', width: '70px' },
  { key: 'tipo_compra', label: 'Tipo', width: '170px' },
  { key: 'venda_id', label: 'Venda', width: '90px' },
  { key: 'fornecedor', label: 'Fornecedor' },
  { key: 'status', label: 'Status', width: '130px', align: 'center' },
  { key: 'valor_total', label: 'Total', align: 'right', width: '140px' },
  { key: 'data_compra', label: 'Data', width: '120px' },
  { key: 'acoes', label: 'Ações', width: '120px', align: 'center' },
]

function nomeFornecedor(row) {
  const f = row?.fornecedor
  return f?.nome_fantasia || f?.razao_social || (row?.fornecedor_id ? `Fornecedor #${row.fornecedor_id}` : '-')
}

const filtradas = computed(() => {
  const t = filtro.value.toLowerCase().trim()
  if (!t) return compras.value

  return compras.value.filter((c) => {
    const tipo = (c?.tipo_compra === 'INSUMOS' ? 'insumos' : 'cliente/ambiente')
    const status = String(c?.status || '').toLowerCase()
    const forn = String(nomeFornecedor(c) || '').toLowerCase()
    const venda = c?.venda_id ? String(c.venda_id) : ''
    
    return tipo.includes(t) || status.includes(t) || forn.includes(t) || venda.includes(t)
  })
})

async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get('/compras')
    compras.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Erro ao carregar compras:", error)
  } finally {
    loading.value = false
  }
}

async function excluir(id) {
  if (!confirm('Deseja realmente excluir esta compra?')) return
  
  deletandoId.value = id
  try {
    await api.delete(`/compras/${id}`)
    compras.value = compras.value.filter(c => c.id !== id)
  } catch (error) {
    alert('Erro ao excluir compra')
  } finally {
    deletandoId.value = null
  }
}

onMounted(carregar)
</script>
>