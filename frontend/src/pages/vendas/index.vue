<template>
  <div class="page-container">
    <div class="card card--shadow">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Vendas</h2>
          <p class="card-subtitle">
            Gestão de vendas (módulo antigo) com cálculos de pós-venda.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          label="+ Nova Venda"
          @click="router.push('/vendas/novo')"
        />
      </header>

      <div class="card-filter">
        <SearchInput
          v-model="filtro"
          label="Buscar"
          placeholder="Buscar por cliente, status, forma de pagamento..."
          :colSpan="'col-span-12'"
        />
      </div>

      <div class="card-body card-body--flush">
        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          emptyText="Nenhuma venda encontrada"
        >
          <template #cell-status="{ row }">
            <span class="pill" :class="pillClass(row.status)">
              {{ row.status }}
            </span>
          </template>

          <template #cell-valor_total="{ row }">
            {{ format(row.valor_total) }}
          </template>

          <template #cell-data_venda="{ row }">
            {{ formatarData(row.data_venda) }}
          </template>

          <template #cell-acoes="{ row }">
            <div class="table-actions">
              <Button
                variant="secondary"
                size="sm"
                label="Editar"
                @click="router.push(`/vendas/${row.id}`)"
              />
              <Button
                variant="danger"
                size="sm"
                label="Excluir"
                :loading="deletandoId === row.id"
                loadingText="Excluindo..."
                @click="excluir(row.id)"
              />
            </div>
          </template>
        </Table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
  { key: 'id', label: 'ID' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'status', label: 'Status' },
  { key: 'forma_pagamento_chave', label: 'Pagamento' },
  { key: 'data_venda', label: 'Data' },
  { key: 'valor_total', label: 'Total' },
  { key: 'acoes', label: 'Ações', width: '220px' },
]

const filtradas = computed(() => {
  const f = (filtro.value || '').toLowerCase().trim()
  if (!f) return vendas.value

  return vendas.value.filter((v) => {
    const cliente = (v?.cliente?.nome || v?.cliente?.razao_social || '').toLowerCase()
    const status = (v?.status || '').toLowerCase()
    const pag = (v?.forma_pagamento_chave || '').toLowerCase()
    const id = String(v?.id || '')

    return (
      cliente.includes(f) ||
      status.includes(f) ||
      pag.includes(f) ||
      id.includes(f)
    )
  })
})

function pillClass(status) {
  const s = (status || '').toUpperCase()
  if (s === 'FECHADA') return 'pill--success'
  if (s === 'CANCELADA') return 'pill--danger'
  return 'pill--muted'
}

// helpers para template (se estiver usando nos slots)
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
