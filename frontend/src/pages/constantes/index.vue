<template>
  <div class="page-container">
    <Card shadow>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Constantes</h2>
          <p class="cell-muted">
            Gestão de constantes do sistema (status, formas de pagamento, categorias, etc).
          </p>
        </div>

        <Button variant="primary" @click="router.push('/constantes/novo')">
          + Nova Constante
        </Button>
      </header>

      <!-- Filtro -->
      <div class="card-filter">
        <SearchInput
          v-model="filtro"
          placeholder="Buscar por categoria, chave ou rótulo..."
        />
      </div>

      <div class="card-body--flush">
        <Table
          :columns="columns"
          :rows="constantesFiltradas"
          :loading="loading"
          empty-text="Nenhuma constante encontrada."
        >
          <template #cell-ativo="{ row }">
            <span
              class="status"
              :class="row.ativo ? 'status--success' : 'status--danger'"
            >
              {{ row.ativo ? 'Ativo' : 'Inativo' }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="table-actions">
              <Button
                variant="secondary"
                size="sm"
                @click="router.push(`/constantes/${row.id}`)"
              >
                ✏️
              </Button>

              <Button
                variant="danger"
                size="sm"
                @click="excluir(row)"
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

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const router = useRouter()

const constantes = ref([])
const loading = ref(false)
const filtro = ref('')

const columns = [
  { key: 'categoria', label: 'Categoria' },
  { key: 'chave', label: 'Chave' },
  { key: 'rotulo', label: 'Rótulo' },
  { key: 'tipo', label: 'Tipo', width: '120px' },
  { key: 'ordem', label: 'Ordem', width: '80px', align: 'center' },
  { key: 'ativo', label: 'Status', width: '100px', align: 'center' },
  { key: 'acoes', label: 'Ações', width: '120px', align: 'center' },
]

const constantesFiltradas = computed(() => {
  const termo = filtro.value.toLowerCase().trim()
  if (!termo) return constantes.value

  return constantes.value.filter(c =>
    c.categoria?.toLowerCase().includes(termo) ||
    c.chave?.toLowerCase().includes(termo) ||
    c.rotulo?.toLowerCase().includes(termo)
  )
})

async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get('/constantes')
    constantes.value = data || []
  } finally {
    loading.value = false
  }
}

async function excluir(row) {
  if (!confirm(`Deseja excluir a constante "${row.rotulo}"?`)) return

  try {
    await api.delete(`/constantes/${row.id}`)
    constantes.value = constantes.value.filter(c => c.id !== row.id)
  } catch {
    alert('Erro ao excluir constante')
  }
}

onMounted(carregar)
</script>
