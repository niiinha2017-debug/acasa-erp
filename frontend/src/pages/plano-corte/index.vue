<template>
  <div class="page-container">
    <Card :shadow="true">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Plano de Corte</h2>
          <p class="cell-muted">Gestão de serviços e vendas por fornecedor.</p>
        </div>
        <div class="header-actions">
          <Button variant="primary" @click="router.push('/plano-corte/novo')">
            + Novo Plano
          </Button>
        </div>
      </header>

      <div class="card-filter">
        <div class="form-grid">
          <SearchInput 
            v-model="busca" 
            placeholder="Buscar por fornecedor, pedido ou status..." 
            col-span="col-span-12"
          />
        </div>
      </div>

      <div class="card-body--flush">
        <Table
          :columns="columns"
          :rows="rowsFiltrados"
          :loading="loading"
          empty-text="Nenhum plano de corte cadastrado."
        >
          <template #cell-fornecedor="{ row }">
            <div class="flex-column">
              <strong class="text-main">{{ row.fornecedor?.razao_social || 'N/A' }}</strong>
              <small class="cell-muted">Ped: {{ row.numero_pedido || 'Sem número' }}</small>
            </div>
          </template>

          <template #cell-data="{ row }">
            <span class="text-sm">
              {{ row.data ? new Date(row.data).toLocaleDateString('pt-BR') : '-' }}
            </span>
          </template>

          <template #cell-total="{ row }">
            <strong class="text-main">
              {{ maskMoneyBR(row.valor_total || 0) }}
            </strong>
          </template>

          <template #cell-status="{ row }">
            <span class="badge-status" :class="statusClass(row.status)">
              {{ row.status }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="header-actions justify-center">
              <Button variant="secondary" size="sm" @click="router.push(`/plano-corte/${row.id}`)">
                Editar
              </Button>
              <Button variant="danger" size="sm" @click="excluir(row)">
                Excluir
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
import { maskMoneyBR } from '@/utils/masks' 

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const router = useRouter()
const busca = ref('')
const loading = ref(false)
const planos = ref([])

const columns = [
  { key: 'fornecedor', label: 'Fornecedor / Pedido' },
  { key: 'data', label: 'Data', width: '120px' },
  { key: 'total', label: 'Valor Total', width: '140px' },
  { key: 'status', label: 'Status', width: '130px', align: 'center' },
  { key: 'acoes', label: 'Ações', width: '180px', align: 'center' }
]

const rowsFiltrados = computed(() => {
  const termo = busca.value.toLowerCase().trim()
  if (!termo) return planos.value
  
  return planos.value.filter(p => 
    p.fornecedor?.razao_social?.toLowerCase().includes(termo) ||
    p.status?.toLowerCase().includes(termo) ||
    p.numero_pedido?.toLowerCase().includes(termo)
  )
})

// Mapeamento de cores para o status
const statusClass = (status) => {
  const s = status?.toUpperCase()
  if (s === 'CONCLUIDO' || s === 'FINALIZADO') return 'active'
  if (s === 'CANCELADO') return 'inactive'
  return 'warning' // Para "Pendente" ou "Em Aberto"
}

async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get('/plano-corte')
    planos.value = data || []
  } catch (err) {
    console.error("Erro:", err)
  } finally {
    loading.value = false
  }
}

async function excluir(plano) {
  if (!confirm(`Deseja excluir o plano do pedido ${plano.numero_pedido}?`)) return
  try {
    await api.delete(`/plano-corte/${plano.id}`)
    planos.value = planos.value.filter(p => p.id !== plano.id)
  } catch (err) {
    alert("Erro ao excluir.")
  }
}

onMounted(carregar)
</script>

<style scoped>
/* Classes de utilidade padronizadas */
.flex-column { display: flex; flex-direction: column; }
.text-main { color: var(--text-main); font-size: 0.875rem; }
.text-sm { font-size: 0.8125rem; }
.justify-center { justify-content: center; }

/* Badge estilo pílula */
.badge-status {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
}
.badge-status.active { background: #dcfce7; color: #15803d; }
.badge-status.warning { background: #fef9c3; color: #854d0e; }
.badge-status.inactive { background: #fee2e2; color: #b91c1c; }
</style>