<template>
  <div class="page-container">
    <Card>
      <!-- HEADER -->
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Constantes</h2>
          <p class="cell-muted">
            Gestão de constantes do sistema (formas de pagamento, status, categorias, etc).
          </p>
        </div>

        <Button
          variant="primary"
          @click="router.push('/constantes/novo')"
        >
          + Nova Constante
        </Button>
      </header>

      <!-- FILTRO -->
      <div class="card-filter">
        <SearchInput
          v-model="filtro"
          placeholder="Buscar por categoria, chave ou rótulo..."
        />
      </div>

      <!-- TABELA -->
      <div class="card-body--flush">
        <Table
          :columns="columns"
          :rows="constantesFiltradas"
          :loading="loading"
          empty-text="Nenhuma constante encontrada."
        >
          <!-- STATUS -->
          <template #cell-ativo="{ row }">
            <span
              class="status"
              :class="row.ativo ? 'status--success' : 'status--danger'"
            >
              {{ row.ativo ? 'Ativo' : 'Inativo' }}
            </span>
          </template>

          <!-- AÇÕES -->
          <template #cell-acoes="{ row }">
            <div class="table-actions">
              <Button
                variant="secondary"
                size="sm"
                @click="router.push(`/constantes/${row.id}`)"
              >
                Editar
              </Button>

              <Button
                variant="danger"
                size="sm"
                @click="excluir(row)"
              >
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const router = useRouter()

const loading = ref(false)
const filtro = ref('')
const constantes = ref([])

/* =========================
   COLUNAS DA TABELA (Simplificadas)
========================= */
const columns = [
  { key: 'categoria', label: 'Categoria' },
  { key: 'chave',     label: 'Chave' },
  { key: 'valor',     label: 'Valor' }, // Agora exibindo o conteúdo do campo valor
  { key: 'ordem',     label: 'Ordem',  width: '80px', align: 'center' },
  { key: 'ativo',     label: 'Status', width: '100px', align: 'center' },
  { key: 'acoes',     label: 'Ações',  width: '140px', align: 'center' },
]

/* =========================
   FILTRO
========================= */
const constantesFiltradas = computed(() => {
  const termo = (filtro.value || '').toLowerCase().trim()
  if (!termo) return constantes.value

  return constantes.value.filter(c =>
    c.categoria?.toLowerCase().includes(termo) ||
    c.chave?.toLowerCase().includes(termo) ||
    c.valor?.toLowerCase().includes(termo) // Filtra pelo valor que aparece na lista
  )
})
/* =========================
   LOAD
========================= */
async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get('/constantes')
    constantes.value = Array.isArray(data) ? data : []
  } catch (e) {
    constantes.value = []
  } finally {
    loading.value = false
  }
}

/* =========================
   EXCLUIR
========================= */
async function excluir(row) {
  if (!confirm(`Deseja excluir a constante "${row.rotulo}"?`)) return

  try {
    await api.delete(`/constantes/${row.id}`)
    constantes.value = constantes.value.filter(c => c.id !== row.id)
  } catch (e) {
    alert('Erro ao excluir constante.')
  }
}

onMounted(carregar)
</script>

<style scoped>
.table-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.status {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status--success {
  background: #dcfce7;
  color: #15803d;
}

.status--danger {
  background: #fee2e2;
  color: #b91c1c;
}
</style>
