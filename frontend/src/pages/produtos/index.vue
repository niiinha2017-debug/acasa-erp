<template>
  <Card :shadow="true">
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 border-b border-gray-100 p-6">
      <div class="min-w-0">
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">Produtos</h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          Lista de produtos e materiais cadastrados.
        </p>
      </div>

      <Button variant="primary" size="sm" type="button" @click="router.push('/produtos/novo')">
        <i class="pi pi-plus mr-2 text-xs"></i>
        Novo Produto
      </Button>
    </header>

    <!-- BODY -->
    <div class="p-6">
      <Table
        :columns="columns"
        :rows="rows"
        :loading="loading"
        empty-text="Nenhum produto cadastrado"
      >
        <template #cell-nome_produto="{ row }">
          <div class="flex flex-col">
            <strong class="text-sm font-black text-gray-900">{{ row.nome_produto }}</strong>
            <span class="text-xs font-semibold text-gray-400">
              Ref: {{ String(row.id || 0).padStart(4, '0') }}
            </span>
          </div>
        </template>

        <template #cell-status="{ row }">
          <span
            class="inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border"
            :class="row.status === 'ATIVO'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-100'"
          >
            {{ row.status }}
          </span>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-center gap-2">
            <Button variant="secondary" size="sm" type="button" @click="router.push(`/produtos/${row.id}`)">
              Editar
            </Button>
            <Button variant="danger" size="sm" type="button" @click="excluir(row)">
              Excluir
            </Button>
          </div>
        </template>
      </Table>
    </div>
  </Card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { maskMoneyBR } from '@/utils/masks'
import { useRouter } from 'vue-router'

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'

const produtos = ref([])
const loading = ref(false)
const router = useRouter()

const columns = [
  { key: 'nome_produto', label: 'Produto', width: '250px' },
  { key: 'fornecedor_nome', label: 'Fornecedor' },
  { key: 'unidade', label: 'Un.', width: '70px', align: 'center' },
  { key: 'quantidade', label: 'Qtd', width: '80px', align: 'center' },
  { key: 'valor_total', label: 'Valor Total', width: '130px', align: 'right' },
  { key: 'status', label: 'Status', width: '110px', align: 'center' },
  { key: 'acoes', label: 'Ações', width: '160px', align: 'center' },
]

const rows = computed(() =>
  (produtos.value || []).map((p) => ({
    ...p,
    fornecedor_nome: p.fornecedor?.razao_social || '-',
    valor_total: maskMoneyBR(Number(p.valor_total || 0)),
  }))
)

async function buscarDadosDoBanco() {
  loading.value = true
  try {
    const resp = await api.get('/produtos')
    produtos.value = resp.data || []
  } catch (err) {
    console.error('Erro ao buscar produtos:', err?.response || err)
  } finally {
    loading.value = false
  }
}

function excluir(row) {
  console.log('excluir:', row)
}

onMounted(() => {
  buscarDadosDoBanco()
})
</script>
