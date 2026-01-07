<template>
  <div class="page-container">
    <Card :shadow="true">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Clientes</h2>
          <p class="cell-muted">Gestão da base de clientes e contatos</p>
        </div>
        <div class="header-actions">
          <Button variant="primary" @click="router.push('/clientes/novo')">
            + Novo Cliente
          </Button>
        </div>
      </header>

      <div class="card-filter">
        <div class="form-grid">
          <SearchInput 
            v-model="filtro" 
            placeholder="Buscar por nome, documento ou e-mail..." 
            col-span="col-span-12"
          />
        </div>
      </div>

      <div class="card-body--flush">
        <Table
          :columns="columns"
          :rows="clientesFiltrados"
          :loading="carregando"
          empty-text="Nenhum cliente encontrado."
        >
          <template #cell-nome="{ row }">
            <div class="flex-column">
              <strong class="text-main">{{ row.nome }}</strong>
              <small class="cell-muted">{{ row.cpf_cnpj || 'Sem documento' }}</small>
            </div>
          </template>

          <template #cell-contato="{ row }">
            <div class="text-sm">
              <div>{{ row.telefone || row.whatsapp || '-' }}</div>
              <div class="cell-muted">{{ row.email || '' }}</div>
            </div>
          </template>

          <template #cell-status="{ row }">
            <span class="badge-status" :class="row.ativo ? 'active' : 'inactive'">
              {{ row.ativo ? 'Ativo' : 'Inativo' }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="header-actions justify-center">
              <Button variant="secondary" size="sm" @click="router.push(`/clientes/${row.id}`)">
                Editar
              </Button>
              <Button variant="danger" size="sm" @click="confirmarExclusao(row)">
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
const carregando = ref(true)
const filtro = ref('')
const clientes = ref([])

const columns = [
  { key: 'nome', label: 'Cliente' },
  { key: 'contato', label: 'Contato' },
  { key: 'cidade', label: 'Cidade/UF' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'acoes', label: 'Ações', align: 'center', width: '180px' }
]

const clientesFiltrados = computed(() => {
  const termo = filtro.value?.toLowerCase().trim()
  if (!termo) return clientes.value
  return clientes.value.filter(c => 
    c.nome?.toLowerCase().includes(termo) || 
    c.cpf_cnpj?.includes(termo) ||
    c.email?.toLowerCase().includes(termo)
  )
})

async function confirmarExclusao(cliente) {
  if (confirm(`Deseja realmente excluir ${cliente.nome}?`)) {
    try {
      await api.delete(`/clientes/${cliente.id}`)
      clientes.value = clientes.value.filter(c => c.id !== cliente.id)
    } catch (err) {
      alert('Erro ao excluir cliente.')
    }
  }
}

async function buscarClientes() {
  carregando.value = true
  try {
    const { data } = await api.get('/clientes')
    clientes.value = data
  } catch (err) {
    console.error(err)
  } finally {
    carregando.value = false
  }
}

onMounted(buscarClientes)
</script>

<style scoped>
/* Classes auxiliares para manter o padrão */
.flex-column {
  display: flex;
  flex-direction: column;
}

.text-main {
  color: var(--text-main);
  font-size: 0.875rem;
}

.text-sm {
  font-size: 0.8125rem;
}

.justify-center {
  justify-content: center;
}

.badge-status {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}
.badge-status.active { background: #dcfce7; color: #15803d; }
.badge-status.inactive { background: #fee2e2; color: #b91c1c; }
</style>