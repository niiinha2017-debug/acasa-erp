<template>
  <Card :shadow="true">
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 border-b border-gray-100 p-6">
      <div class="min-w-0">
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">Vendas</h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          Gestão de vendas (módulo antigo) com cálculos de pós-venda.
        </p>
      </div>

      <Button
        variant="primary"
        size="sm"
        type="button"
        @click="router.push('/vendas/novo')"
      >
        <i class="pi pi-plus mr-2 text-xs"></i>
        Nova Venda
      </Button>
    </header>

    <!-- BODY -->
    <div class="p-6 space-y-5">
      <SearchInput
        v-model="filtro"
        label="Buscar"
        placeholder="Buscar por cliente, status, forma de pagamento..."
        colSpan="12"
      />

      <Table
        :columns="columns"
        :rows="filtradas"
        :loading="loading"
        empty-text="Nenhuma venda encontrada"
      >

      <template #cell-cliente="{ row }">
  <div class="flex flex-col">
    <strong class="text-sm font-black text-gray-900">
      {{ row.cliente?.nome_completo || row.cliente?.razao_social || row.cliente?.nome_fantasia || row.cliente?.nome || 'Consumidor' }}
    </strong>
    <span class="text-xs font-semibold text-gray-400">
      {{ row.cliente?.cpf || row.cliente?.cnpj || 'Sem documento' }}
    </span>
  </div>
</template>
        <template #cell-status="{ row }">
          <span
            class="inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border"
            :class="pillClassTailwind(row.status)"
          >
            {{ row.status }}
          </span>
        </template>

        <template #cell-valor_total="{ row }">
          <span class="text-sm font-black text-gray-900">
            {{ moeda(row.valor_total) }}
          </span>
        </template>

        <template #cell-data_venda="{ row }">
          <span class="text-sm font-semibold text-gray-700">
            {{ dataBr(row.data_venda) }}
          </span>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              @click="router.push(`/vendas/${row.id}`)"
            >
              Editar
            </Button>

            <Button
              variant="danger"
              size="sm"
              type="button"
              :loading="deletandoId === row.id"
              loadingText="Excluindo..."
              @click="excluir(row.id)"
            >
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
import { useRouter } from 'vue-router'
import Card from '@/components/ui/Card.vue'
import Table from '@/components/ui/Table.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import api from '@/services/api'
import { format } from '@/utils/format'

const router = useRouter()

const loading = ref(false)
const deletandoId = ref(null)
const vendas = ref([])
const filtro = ref('')

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'status', label: 'Status', width: '120px', align: 'center' },
  { key: 'forma_pagamento_chave', label: 'Pagamento' },
  { key: 'data_venda', label: 'Data', width: '110px' },
  { key: 'valor_total', label: 'Total', align: 'right', width: '130px' },
  { key: 'acoes', label: 'Ações', width: '180px', align: 'center' },
]

const filtradas = computed(() => {
  const f = (filtro.value || '').toLowerCase().trim()
  if (!f) return vendas.value

  return vendas.value.filter((v) => {
    const cliente = (v?.cliente?.nome || v?.cliente?.razao_social || '').toLowerCase()
    const status = (v?.status || '').toLowerCase()
    const pag = (v?.forma_pagamento_chave || '').toLowerCase()
    const id = String(v?.id || '').toLowerCase()

    return cliente.includes(f) || status.includes(f) || pag.includes(f) || id.includes(f)
  })
})

function pillClassTailwind(status) {
  const s = String(status || '').toUpperCase()
  if (s.includes('FECH')) return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (s.includes('CANCEL')) return 'bg-rose-50 text-rose-700 border-rose-100'
  if (s.includes('PRODU')) return 'bg-sky-50 text-sky-700 border-sky-100'
  return 'bg-gray-50 text-gray-700 border-gray-200'
}


// helpers para template
function moeda(v) {
  return format.currency(v)
}
function dataBr(v) {
  return format.date(v)
}

async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get('/vendas')
    vendas.value = (data || []).map((v) => ({
      ...v,
      cliente: v.cliente || null,
    }))
  } finally {
    loading.value = false
  }
}

async function excluir(id) {
  if (!confirm('Deseja excluir esta venda?')) return
  deletandoId.value = id
  try {
    await api.delete(`/vendas/${id}`)
    await carregar()
  } finally {
    deletandoId.value = null
  }
}

onMounted(carregar)
</script>
