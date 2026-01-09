<template>
  <div class="page-container">
    <div class="card card--shadow">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Orçamentos</h2>
          <p class="card-subtitle">
            Criação e gestão de orçamentos (sem financeiro).
          </p>
        </div>

        <Button
          label="+ Novo Orçamento"
          variant="primary"
          @click="router.push('/orcamentos/novo')"
        />
      </header>

      <div class="card-filter">
        <SearchInput
          v-model="filtro"
          label="Buscar"
          placeholder="Buscar por cliente ou ID..."
          :colSpan="'col-span-4'"
        />
      </div>

      <div class="card-body card-body--flush">
        <Table
          :columns="columns"
          :rows="filtrados"
          :loading="loading"
          emptyText="Nenhum orçamento encontrado."
        >
          <template #cell-id="{ row }">
            <span class="muted">#{{ row.id }}</span>
          </template>

          <template #cell-cliente="{ row }">
            <div class="cell-main">
              <div class="cell-title">{{ row.cliente_nome_snapshot }}</div>
              <div class="cell-subtitle muted">
                CPF: {{ row.cliente_cpf_snapshot || '-' }}
              </div>
            </div>
          </template>

          <template #cell-total="{ row }">
            {{ format(row.total_itens || 0) }}
          </template>

          <template #cell-acoes="{ row }">
            <div class="table-actions">
              <Button
                label="Abrir"
                size="sm"
                variant="secondary"
                @click="router.push(`/orcamentos/${row.id}`)"
              />
              <Button
                label="PDF"
                size="sm"
                variant="outline"
                @click="abrirPdf(row.id)"
              />
            </div>
          </template>
        </Table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import api from '@/services/api'
import Table from '@/components/ui/Table.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { format } from '@/utils/format'

const router = useRouter()

const loading = ref(false)
const filtro = ref('')
const rows = ref([])

const columns = [
  { key: 'id', label: 'ID', width: '90px' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'total', label: 'Total', width: '140px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '180px', align: 'right' },
]

const filtrados = computed(() => {
  const f = (filtro.value || '').trim().toLowerCase()
  if (!f) return rows.value

  return rows.value.filter((r) => {
    const id = String(r.id || '')
    const nome = String(r.cliente_nome_snapshot || '').toLowerCase()
    const cpf = String(r.cliente_cpf_snapshot || '').toLowerCase()
    return id.includes(f) || nome.includes(f) || cpf.includes(f)
  })
})

async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get('/orcamentos')
    rows.value = data || []
  } finally {
    loading.value = false
  }
}

function abrirPdf(id) {
  window.open(`${import.meta.env.VITE_API_URL}/orcamentos/${id}/pdf`, '_blank')
}

onMounted(carregar)
</script>
