<template>
  <div class="p-6">
    <Card>
      <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
        <div>
          <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
            Orçamentos
          </h2>
          <p class="text-sm font-semibold text-gray-500 mt-1">
            Gestão de orçamentos e projetos.
          </p>
        </div>

        <Button
          variant="primary"
          @click="router.push('/orcamentos/novo')"
        >
          + Novo Orçamento
        </Button>
      </header>

      <div class="p-6 pb-0">
        <div class="grid grid-cols-12">
          <div class="col-span-12 md:col-span-4">
            <SearchInput
              v-model="filtro"
              label="Buscar"
              placeholder="Cliente ou ID..."
            />
          </div>
        </div>
      </div>

      <div class="p-6">
        <Table
          :columns="columns"
          :rows="filtrados"
          :loading="loading"
          emptyText="Nenhum orçamento encontrado."
        >
          <template #cell-id="{ row }">
            <span class="text-gray-400 font-bold">#{{ row.id }}</span>
          </template>

          <template #cell-cliente="{ row }">
            <div class="flex flex-col">
              <span class="font-bold text-gray-900">{{ row.cliente_nome_snapshot || 'Cliente não identificado' }}</span>
              <span class="text-xs text-gray-500">{{ row.cliente_cpf_snapshot || 'Sem CPF/CNPJ' }}</span>
            </div>
          </template>

          <template #cell-total="{ row }">
            <span class="font-bold text-brand-primary">
              {{ format.currency(row.total_itens || 0) }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <Button
                size="sm"
                variant="secondary"
                @click="router.push(`/orcamentos/${row.id}`)"
              >
                Abrir
              </Button>
              <Button
                size="sm"
                variant="outline"
                @click="abrirPdf(row.id)"
              >
                PDF
              </Button>
            </div>
          </template>
        </Table>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import api from '@/services/api'
import Table from '@/components/ui/Table.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import Card from '@/components/ui/Card.vue' // <-- Faltava esta importação
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
  } catch (e) {
    console.error("Erro ao carregar orçamentos:", e)
  } finally {
    loading.value = false
  }
}

function abrirPdf(id) {
  const base = import.meta.env.VITE_API_URL
  window.open(`${base}/orcamentos/${id}/pdf`, '_blank')
}

onMounted(carregar)
</script>
