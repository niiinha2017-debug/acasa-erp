<template>
  <Card :shadow="true">
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">Plano de Corte</h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          Gestão de serviços e vendas por fornecedor.
        </p>
      </div>

      <Button variant="primary" size="sm" type="button" @click="router.push('/plano-corte/novo')">
        <i class="pi pi-plus mr-2 text-xs"></i>
        Novo Plano
      </Button>
    </header>

    <div class="p-6 space-y-5">
      <SearchInput
        v-model="busca"
        placeholder="Buscar por fornecedor, pedido ou status..."
        colSpan="12"
      />

      <div class="overflow-hidden rounded-2xl border border-gray-100">
        <Table
          :columns="columns"
          :rows="rowsFiltrados"
          :loading="loading"
          empty-text="Nenhum plano de corte cadastrado."
        >
          <template #cell-fornecedor="{ row }">
            <div class="flex flex-col">
              <strong class="text-sm font-black text-gray-900">
                {{ row.fornecedor?.razao_social || 'N/A' }}
              </strong>
              <small class="text-xs font-semibold text-gray-400">
                Ped: {{ row.numero_pedido || 'Sem número' }}
              </small>
            </div>
          </template>

          <template #cell-data="{ row }">
            <span class="text-sm font-semibold text-gray-700">
              {{ row.data ? new Date(row.data).toLocaleDateString('pt-BR') : '-' }}
            </span>
          </template>

          <template #cell-total="{ row }">
            <span class="text-sm font-black text-gray-900">
              {{ maskMoneyBR(row.valor_total || 0) }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border"
              :class="statusClassTailwind(row.status)"
            >
              {{ row.status }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                @click="router.push(`/plano-corte/${row.id}`)"
              >
                Editar
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="button"
                @click="excluir(row)"
              >
                Excluir
              </Button>
            </div>
          </template>
        </Table>
      </div>
    </div>
  </Card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { maskMoneyBR } from '@/utils/masks'

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const router = useRouter()
const busca = ref('')
const loading = ref(false)
const planos = ref([])

const columns = [
  { key: 'fornecedor', label: 'Fornecedor / Pedido' },
  { key: 'data', label: 'Data', width: '120px' },
  { key: 'total', label: 'Valor Total', width: '140px' },
  { key: 'status', label: 'Status', width: '130px', align: 'center' },
  { key: 'acoes', label: 'Ações', width: '180px', align: 'center' }
]

const rowsFiltrados = computed(() => {
  const termo = (busca.value || '').toLowerCase().trim()
  if (!termo) return planos.value

  return planos.value.filter(p => {
    // Buscamos em múltiplos campos do fornecedor e do pedido
    const razao = p.fornecedor?.razao_social?.toLowerCase() || ''
    const fantasia = p.fornecedor?.nome_fantasia?.toLowerCase() || ''
    const status = p.status?.toLowerCase() || ''
    const pedido = String(p.numero_pedido || '').toLowerCase()

    return razao.includes(termo) || 
           fantasia.includes(termo) || 
           status.includes(termo) || 
           pedido.includes(termo)
  })
})

function statusClassTailwind(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'CONCLUIDO' || s === 'FINALIZADO') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (s === 'CANCELADO') return 'bg-gray-50 text-gray-700 border-gray-200'
  if (s === 'EM_PRODUCAO' || s === 'EM PRODUCAO') return 'bg-amber-50 text-amber-700 border-amber-100'
  return 'bg-blue-50 text-blue-700 border-blue-100'
}

async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get('/plano-corte')
    planos.value = Array.isArray(data) ? data : []
  } catch (err) {
    planos.value = []
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function excluir(plano) {
  const pedido = plano?.numero_pedido || plano?.id
  if (!confirm(`Deseja excluir o plano do pedido ${pedido}?`)) return

  try {
    await api.delete(`/plano-corte/${plano.id}`)
    planos.value = planos.value.filter(p => p.id !== plano.id)
  } catch (err) {
    alert('Erro ao excluir.')
  }
}

onMounted(carregar)
</script>
