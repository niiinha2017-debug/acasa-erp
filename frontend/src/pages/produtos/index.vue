<template>
  <div class="page-container">
    <Card shadow>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Produtos</h2>
          <p class="cell-muted">Lista de produtos e materiais cadastrados.</p>
        </div>
        <Button variant="primary" @click="router.push('/produtos/novo')">
          + Novo Produto
        </Button>
      </header>

      <div class="card-filter">
        <SearchInput 
          v-model="search" 
          placeholder="Digite o nome do produto ou fornecedor..." 
        />
      </div>

      <div class="card-body--flush">
        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          empty-text="Nenhum produto cadastrado"
        >
          <template #cell-nome_produto="{ row }">
            <div class="cell-stack">
              <strong>{{ row.nome_produto }}</strong>
              <span class="cell-muted">Ref: {{ row.id.toString().padStart(4, '0') }}</span>
            </div>
          </template>

          <template #cell-status="{ row }">
            <span
              class="badge"
              :class="row.status === 'ATIVO' ? 'badge-success' : 'badge-warning'"
            >
              {{ row.status }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="table-actions">
              <Button
                variant="secondary"
                size="sm"
                @click="router.push(`/produtos/${row.id}`)"
                title="Editar"
              >
                ✏️
              </Button>
              <Button
                variant="danger"
                size="sm"
                @click="excluir(row)"
                title="Excluir"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import api from '@/services/api'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue' // Adicionado

import { maskMoneyBR } from '@/utils/masks'

const router = useRouter()
const search = ref('')
const produtos = ref([])
const loading = ref(false)

// Ajustado de 'field' para 'key' para bater com seu componente Table
const columns = [
  { key: 'nome_produto', label: 'Produto' },
  { key: 'fornecedor_nome', label: 'Fornecedor' },
  { key: 'unidade', label: 'Unidade' }, // <--- Adicionado
  { key: 'medida', label: 'Medida/Dimensão' }, // <--- Adicionado
  { key: 'quantidade', label: 'Qtd', align: 'center' },
  { key: 'valor_unitario', label: 'Valor Unit.', align: 'right' },
  { key: 'valor_total', label: 'Valor Total', align: 'right' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'acoes', label: 'Ações', align: 'center' },
]

const rows = computed(() => {
  const termo = search.value.toLowerCase().trim()

  return produtos.value
    .filter(p => {
      if (!termo) return true
      const nomeProduto = p.nome_produto?.toLowerCase() || ''
      const fornecedor = p.fornecedor?.razao_social?.toLowerCase() || ''
      return nomeProduto.includes(termo) || fornecedor.includes(termo)
    })
    .map(p => ({
      ...p,
      fornecedor_nome: p.fornecedor?.razao_social || '-',
      unidade: p.unidade || '-', // Garante o traço se estiver vazio
      medida: p.medida || '-',   // Garante o traço se estiver vazio
      valor_unitario: maskMoneyBR(p.valor_unitario),
      valor_total: maskMoneyBR(p.valor_total),
    }))
})


async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get('/produtos')
    produtos.value = data || []
  } catch (err) {
    alert('Erro ao carregar lista de produtos')
  } finally {
    loading.value = false
  }
}

async function excluir(produto) {
  if (!confirm(`Deseja excluir o produto "${produto.nome_produto}"?`)) return
  try {
    await api.delete(`/produtos/${produto.id}`)
    produtos.value = produtos.value.filter(p => p.id !== produto.id)
  } catch (err) {
    alert('Erro ao excluir produto')
  }
}

onMounted(carregar)
</script>
