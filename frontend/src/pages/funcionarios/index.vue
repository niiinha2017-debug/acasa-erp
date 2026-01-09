<template>
  <div class="page-container">
    <Card :shadow="true">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Funcionários</h2>
          <p class="cell-muted">Gestão e controle de colaboradores</p>
        </div>
        <div class="header-actions">
          <Button variant="primary" @click="router.push('/funcionarios/novo')">
            + Novo Funcionário
          </Button>
        </div>
      </header>

      <div class="card-filter">
        <div class="form-grid">
          <SearchInput 
            v-model="filtro" 
            placeholder="Buscar por nome, CPF ou cargo..." 
            col-span="col-span-12"
          />
        </div>
      </div>

      <div class="card-body--flush">
        <Table 
          :columns="columns" 
          :rows="funcionariosFiltrados" 
          :loading="loading"
          empty-text="Nenhum funcionário encontrado."
        >
          <template #cell-nome="{ row }">
            <div class="flex-column">
              <strong class="text-main">{{ row.nome }}</strong>
              <small class="cell-muted">{{ row.cpf }}</small>
            </div>
          </template>

          <template #cell-status="{ row }">
            <span class="badge-status" :class="row.demissao ? 'inactive' : 'active'">
              {{ row.demissao ? 'Inativo' : 'Ativo' }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="header-actions justify-center">
              <Button variant="secondary" size="sm" @click="router.push(`/funcionarios/${row.id}`)">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 🔄 Importação do serviço centralizado
import { FuncionarioService } from '@/services'

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const router = useRouter()
const loading = ref(true)
const filtro = ref('')
const funcionarios = ref([]) 

const columns = [
  { key: 'nome', label: 'Funcionário' },
  { key: 'setor', label: 'Setor' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'status', label: 'Status', align: 'center', width: '120px' },
  { key: 'acoes', label: 'Ações', align: 'center', width: '180px' }
]

/**
 * 🔍 FILTRO INTELIGENTE (COMPUTED)
 * Incluímos o opcional chaining (?.) para evitar quebra caso algum dado venha nulo do banco
 */
const funcionariosFiltrados = computed(() => {
  if (!Array.isArray(funcionarios.value)) return []
  
  const termo = filtro.value?.toLowerCase().trim()
  if (!termo) return funcionarios.value
  
  return funcionarios.value.filter(f => {
    return (
      f.nome?.toLowerCase().includes(termo) || 
      f.cpf?.includes(termo) ||
      f.cargo?.toLowerCase().includes(termo) ||
      f.setor?.toLowerCase().includes(termo)
    )
  })
})

/**
 * 📥 CARREGAMENTO DE DADOS
 */
async function carregar() {
  loading.value = true
  try {
    // Usando o Service em vez do api direto
    const { data } = await FuncionarioService.listar()
    funcionarios.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Erro na listagem:', err)
    funcionarios.value = [] 
  } finally {
    loading.value = false
  }
}

/**
 * 🗑️ EXCLUSÃO COM CONFIRMAÇÃO
 */
async function excluir(row) {
  // Confirm padrão do navegador (pode ser trocado por um Modal UI futuramente)
  if (!confirm(`Deseja realmente remover o funcionário ${row.nome}?`)) return
  
  try {
    // Usando o Service centralizado para remoção
    await FuncionarioService.remover(row.id)
    
    // Atualização otimista: remove da lista sem precisar recarregar tudo do banco
    funcionarios.value = funcionarios.value.filter(f => f.id !== row.id)
    
    // Opcional: Adicionar um Toast de sucesso aqui
  } catch (err) {
    alert(err.response?.data?.message || "Erro ao excluir funcionário.")
  }
}

// Inicializa a tabela
onMounted(carregar)
</script>

<style scoped>
.flex-column { display: flex; flex-direction: column; }
.text-main { color: var(--text-main); font-size: 0.875rem; }
.justify-center { justify-content: center; }

/* Badges Padronizadas */
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