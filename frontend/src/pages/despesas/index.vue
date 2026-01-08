<template>
  <div class="page-container">
    <Card shadow>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Despesas</h2>
          <p class="cell-muted">Lançamento e controle de despesas/saídas.</p>
        </div>

        <Button variant="primary" @click="router.push('/despesas/novo')">
          + Nova Despesa
        </Button>
      </header>

      <div class="card-filter">
        <SearchInput
          v-model="filtro"
          placeholder="Buscar por categoria, classificação, local ou status..."
        />
      </div>

      <div class="card-body--flush">
        <Table
          :columns="columns"
          :rows="despesasFiltradas"
          :loading="carregando"
          empty-text="Nenhuma despesa encontrada."
        >
          <template #cell-valor_total="{ row }">
            <strong>{{ formatarMoeda(row.valor_total) }}</strong>
          </template>

          <template #cell-data_vencimento="{ row }">
            <span>{{ formatarData(row.data_vencimento) }}</span>
          </template>

          <template #cell-status="{ row }">
            <span class="badge badge-neutral">
              {{ row.status || '-' }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="table-actions">
              <Button variant="secondary" size="sm" @click="router.push(`/despesas/${row.id}`)">
                ✏️
              </Button>
              <Button variant="danger" size="sm" @click="excluir(row)">
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

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

import { format } from '@/utils/format' // usa format.currency e format.date (você já tem isso)

const router = useRouter()

const despesas = ref([])
const carregando = ref(false)
const filtro = ref('')

const columns = [
  { key: 'tipo_movimento', label: 'Mov.' , width: '90px', align: 'center' },
  { key: 'categoria', label: 'Categoria' },
  { key: 'classificacao', label: 'Classificação' },
  { key: 'local', label: 'Local', width: '110px', align: 'center' },
  { key: 'valor_total', label: 'Valor', width: '130px', align: 'right' },
  { key: 'data_vencimento', label: 'Vencimento', width: '130px', align: 'center' },
  { key: 'status', label: 'Status', width: '120px', align: 'center' },
  { key: 'acoes', label: 'Ações', width: '120px', align: 'center' },
]

const despesasFiltradas = computed(() => {
  const termo = filtro.value.toLowerCase().trim()
  if (!termo) return despesas.value

  return despesas.value.filter(d => {
    const txt = `${d.tipo_movimento ?? ''} ${d.categoria ?? ''} ${d.classificacao ?? ''} ${d.local ?? ''} ${d.status ?? ''}`
      .toLowerCase()
    return txt.includes(termo)
  })
})

function formatarMoeda(v) {
  return format.currency(v)
}
function formatarData(v) {
  return format.date(v)
}

async function carregar() {
  carregando.value = true
  try {
    const { data } = await api.get('/despesas')
    despesas.value = data || []
  } finally {
    carregando.value = false
  }
}

async function excluir(row) {
  if (!confirm(`Deseja excluir a despesa #${row.id}?`)) return
  try {
    await api.delete(`/despesas/${row.id}`)
    despesas.value = despesas.value.filter(d => d.id !== row.id)
  } catch {
    alert('Erro ao excluir despesa')
  }
}

onMounted(carregar)
</script>
