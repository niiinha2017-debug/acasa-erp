<template>
  <Card :shadow="true">
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          Despesas
        </h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          Lançamento e controle de despesas/saídas.
        </p>
      </div>

      <Button variant="primary" @click="router.push('/despesas/novo')">
        <i class="pi pi-plus mr-2 text-xs"></i>
        Nova Despesa
      </Button>
    </header>

    <!-- SEARCH -->
    <div class="p-6 border-b border-gray-100">
      <SearchInput
        v-model="filtro"
        placeholder="Buscar por categoria, classificação, local ou status..."
        :colSpan="12"
      />
    </div>

    <!-- TABLE -->
    <div class="p-6">
      <Table
        :columns="columns"
        :rows="despesasFiltradas"
        :loading="carregando"
        empty-text="Nenhuma despesa encontrada."
      >
        <template #cell-valor_total="{ row }">
          <span class="font-extrabold text-gray-900">
            {{ formatarMoeda(row.valor_total) }}
          </span>
        </template>

        <template #cell-data_vencimento="{ row }">
          <span class="text-sm font-semibold text-gray-700">
            {{ formatarData(row.data_vencimento) }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <span
            class="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1
                   text-[11px] font-black uppercase tracking-[0.18em] text-gray-600"
          >
            {{ row.status || '-' }}
          </span>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" @click="router.push(`/despesas/${row.id}`)">
              <i class="pi pi-pencil text-xs"></i>
            </Button>

            <Button variant="danger" size="sm" @click="excluir(row)">
              <i class="pi pi-trash text-xs"></i>
            </Button>
          </div>
        </template>
      </Table>
    </div>
  </Card>
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
    // 1. Incluímos o valor e o ID para aumentar a precisão da busca
    // 2. Usamos String() para garantir que números não quebrem o .toLowerCase()
    const campos = [
      d.id,
      d.tipo_movimento,
      d.categoria,
      d.classificacao,
      d.local,
      d.status,
      d.valor_total
    ]

    // 3. Transformamos tudo em uma única string ignorando valores nulos
    return campos.some(campo => 
      String(campo ?? '').toLowerCase().includes(termo)
    )
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
