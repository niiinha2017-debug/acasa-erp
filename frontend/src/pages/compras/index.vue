<template>
  <div class="page-container">
    <Card shadow>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Compras</h2>
          <p class="cell-muted">
            Gerencie compras de insumos e vinculadas a ambientes/vendas.
          </p>
        </div>

        <Button variant="primary" @click="router.push('/compras/novo')">
          + Nova Compra
        </Button>
      </header>

      <div class="card-filter">
        <SearchInput
          v-model="filtro"
          placeholder="Buscar por fornecedor, status, tipo ou ID da venda..."
        />
      </div>

      <div class="card-body--flush">
        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          empty-text="Nenhuma compra encontrada."
        >
          <template #cell-tipo_compra="{ row }">
            <span 
              :class="['badge', row.tipo_compra === 'INSUMOS' ? 'badge--info' : 'badge--warning']"
            >
              {{ row.tipo_compra === 'INSUMOS' ? 'INSUMOS' : 'CLIENTE/AMBIENTE' }}
            </span>
          </template>

          <template #cell-fornecedor="{ row }">
            <strong>{{ nomeFornecedor(row) }}</strong>
          </template>

          <template #cell-venda_id="{ row }">
            <span v-if="row.venda_id" class="text-code">#{{ row.venda_id }}</span>
            <span v-else class="cell-muted">-</span>
          </template>

          <template #cell-valor_total="{ row }">
            <span class="text-primary font-bold">
              {{ format.currency(row.valor_total) }}
            </span>
          </template>

          <template #cell-data_compra="{ row }">
            {{ format.date(row.data_compra) }}
          </template>

          <template #cell-status="{ row }">
             <span class="status status--info">
              {{ row.status || 'RASCUNHO' }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="table-actions">
              <Button
                variant="secondary"
                size="sm"
                @click="router.push(`/compras/${row.id}`)"
              >
                ✏️
              </Button>

              <Button
                variant="danger"
                size="sm"
                :loading="deletandoId === row.id"
                @click="excluir(row.id)"
              >
                🗑️
              </Button>
            </div>
          </template>
        </Table>
      </div>
    </Card>
  </div>
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