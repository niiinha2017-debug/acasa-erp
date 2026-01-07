<template>
  <div class="page-container">
    <Card shadow>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Fornecedores</h2>
          <p class="cell-muted">Gestão de fornecedores e dados cadastrais.</p>
        </div>
        <Button variant="primary" @click="router.push('/fornecedores/novo')">
          + Novo Fornecedor
        </Button>
      </header>

      <div class="card-filter">
        <SearchInput 
          v-model="filtro" 
          placeholder="Buscar por razão social, nome fantasia ou CNPJ..." 
        />
      </div>

      <div class="card-body--flush">
        <Table
          :columns="columns"
          :rows="fornecedoresFiltrados"
          :loading="carregando"
          empty-text="Nenhum fornecedor encontrado."
        >
          <template #cell-razao_social="{ row }">
            <div class="cell-stack">
              <strong>{{ row.razao_social }}</strong>
              <span v-if="row.nome_fantasia" class="cell-muted">
                {{ row.nome_fantasia }}
              </span>
            </div>
          </template>

          <template #cell-cnpj="{ row }">
            <span class="badge badge-neutral">
              {{ row.cnpj || '-' }}
            </span>
          </template>

          <template #cell-contato="{ row }">
            <div class="cell-stack">
              <span>{{ row.whatsapp || row.telefone || '-' }}</span>
              <span class="cell-muted">
                {{ row.cidade ? `${row.cidade} - ${row.estado}` : 'Sem endereço' }}
              </span>
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <div class="table-actions">
              <Button variant="secondary" size="sm" @click="router.push(`/fornecedores/${row.id}`)">
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

// Importando os componentes (essencial para funcionar)
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const router = useRouter()
const fornecedores = ref([])
const carregando = ref(false)
const filtro = ref('')

// Definição das colunas para o componente Table
const columns = [
  { key: 'razao_social', label: 'Razão Social / Fantasia' },
  { key: 'cnpj', label: 'CNPJ', width: '180px' },
  { key: 'contato', label: 'Contato / Localização' },
  { key: 'acoes', label: 'Ações', width: '120px', align: 'center' },
]

// Lógica de busca reativa
const fornecedoresFiltrados = computed(() => {
  const termo = filtro.value.toLowerCase()
  if (!termo) return fornecedores.value
  
  return fornecedores.value.filter(f => 
    f.razao_social?.toLowerCase().includes(termo) ||
    f.nome_fantasia?.toLowerCase().includes(termo) ||
    f.cnpj?.includes(termo)
  )
})

async function carregar() {
  carregando.value = true
  try {
    const { data } = await api.get('/fornecedores')
    fornecedores.value = data || []
  } catch (err) {
    console.error('Erro ao carregar fornecedores:', err)
  } finally {
    carregando.value = false
  }
}

async function excluir(f) {
  if (!confirm(`Deseja excluir o fornecedor "${f.razao_social}"?`)) return
  try {
    await api.delete(`/fornecedores/${f.id}`)
    fornecedores.value = fornecedores.value.filter(item => item.id !== f.id)
  } catch (err) {
    alert('Erro ao excluir fornecedor')
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
</style>
