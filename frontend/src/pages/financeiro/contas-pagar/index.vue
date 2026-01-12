<script setup>
import { ref, computed, onMounted } from 'vue'

import Card from '@/components/ui/Card.vue'
import Table from '@/components/ui/Table.vue'
import Button from '@/components/ui/Button.vue'
import LoadingOverlay from '@/components/common/Loading.vue'

import format from '@/utils/format'
import { FinanceiroService } from '@/services/index' // ✅ ajuste o caminho se seu arquivo tiver outro nome

const loading = ref(false)
const rows = ref([])

const columns = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'referencia', label: 'Referência' },
  { key: 'fornecedor', label: 'Fornecedor' },
  { key: 'vencimento', label: 'Vencimento' },
  { key: 'valor', label: 'Valor' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: 'Ações' },
]

// ⚠️ não inventa regra: só tenta ler campos comuns
function mapRow(r) {
  return {
    raw: r,
    tipo: r.tipo || r.origem || '—',
    referencia: r.descricao || r.titulo || r.referencia || '—',
    fornecedor: r.fornecedor?.nome || r.fornecedor_nome || '—',
    vencimento: r.data_vencimento || r.vencimento || null,
    valor: r.valor_total ?? r.valor ?? r.total ?? 0,
    status: r.status || r.status_financeiro || 'EM_ABERTO',
  }
}

async function fetchData() {
  loading.value = true
  try {
    const { data } = await FinanceiroService.listarPagar({})
    const lista = Array.isArray(data) ? data : (data?.rows || data?.data || [])
    rows.value = lista.map(mapRow)
  } finally {
    loading.value = false
  }
}

const rowsAtrasados = computed(() =>
  rows.value.filter(r => String(r.status).toUpperCase() === 'ATRASADO')
)

const rowsEmAberto = computed(() =>
  rows.value.filter(r => String(r.status).toUpperCase() === 'EM_ABERTO')
)

const rowsPagos = computed(() =>
  rows.value.filter(r => String(r.status).toUpperCase() === 'PAGO')
)

function ver(row) {
  console.log('VER', row.raw)
}

onMounted(fetchData)
</script>

<template>
  <Card :shadow="true" class="w-full h-full">
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          Contas a Pagar
        </h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          Visão de todas as saídas da empresa
        </p>
      </div>

      <Button variant="secondary" size="sm" type="button" @click="fetchData">
        Atualizar
      </Button>
    </header>

    <div class="relative p-6">
      <LoadingOverlay v-if="loading" :overlay="true" text="Carregando..." />

      <!-- 1) ATRASADOS -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-black uppercase tracking-widest text-gray-900">Atrasados</h3>
          <span class="text-xs font-extrabold uppercase tracking-widest text-gray-400">
            {{ rowsAtrasados.length }} itens
          </span>
        </div>

        <Table :columns="columns" :rows="rowsAtrasados" :loading="loading" empty-text="Nenhum atraso.">
          <template #cell-vencimento="{ row }">
            <span class="text-sm font-semibold text-gray-900">
              {{ row.vencimento ? format.date(row.vencimento) : '—' }}
            </span>
          </template>

          <template #cell-valor="{ row }">
            <span class="text-sm font-black text-gray-900">
              {{ format.currency(row.valor) }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <Button variant="secondary" size="sm" type="button" @click="ver(row)">Ver</Button>
          </template>
        </Table>
      </div>

      <div class="h-px w-full bg-gray-100 my-6"></div>

      <!-- 2) EM ABERTO -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-black uppercase tracking-widest text-gray-900">Em aberto</h3>
          <span class="text-xs font-extrabold uppercase tracking-widest text-gray-400">
            {{ rowsEmAberto.length }} itens
          </span>
        </div>

        <Table :columns="columns" :rows="rowsEmAberto" :loading="loading" empty-text="Nenhum em aberto.">
          <template #cell-vencimento="{ row }">
            <span class="text-sm font-semibold text-gray-900">
              {{ row.vencimento ? format.date(row.vencimento) : '—' }}
            </span>
          </template>

          <template #cell-valor="{ row }">
            <span class="text-sm font-black text-gray-900">
              {{ format.currency(row.valor) }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <Button variant="secondary" size="sm" type="button" @click="ver(row)">Ver</Button>
          </template>
        </Table>
      </div>

      <div class="h-px w-full bg-gray-100 my-6"></div>

      <!-- 3) PAGOS -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-black uppercase tracking-widest text-gray-900">Pagos</h3>
          <span class="text-xs font-extrabold uppercase tracking-widest text-gray-400">
            {{ rowsPagos.length }} itens
          </span>
        </div>

        <Table :columns="columns" :rows="rowsPagos" :loading="loading" empty-text="Nenhum pago.">
          <template #cell-vencimento="{ row }">
            <span class="text-sm font-semibold text-gray-900">
              {{ row.vencimento ? format.date(row.vencimento) : '—' }}
            </span>
          </template>

          <template #cell-valor="{ row }">
            <span class="text-sm font-black text-gray-900">
              {{ format.currency(row.valor) }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <Button variant="secondary" size="sm" type="button" @click="ver(row)">Ver</Button>
          </template>
        </Table>
      </div>
    </div>
  </Card>
</template>
