<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import Card from '@/components/ui/Card.vue'
import Table from '@/components/ui/Table.vue'
import Button from '@/components/ui/Button.vue'
import LoadingOverlay from '@/components/ui/LoadingOverlay.vue'

import { api } from '@/services/api'
import { format } from '@/utils/format'

const router = useRouter()

const loading = ref(false)
const rows = ref([])

// ✅ ajuste aqui se seu endpoint for outro
const ENDPOINT = '/financeiro/contas-pagar/consolidado'

// ✅ colunas: mantém simples (ajuste se quiser)
const columns = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'referencia', label: 'Referência' },
  { key: 'fornecedor', label: 'Fornecedor' },
  { key: 'vencimento', label: 'Vencimento' },
  { key: 'valor', label: 'Valor' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: 'Ações' },
]

// ✅ normaliza o que vier do backend pra tabela (sem inventar regra)
function mapRow(r) {
  // ajuste os nomes aqui conforme seu payload real
  const tipo = r.tipo || r.origem || (r.fornecedor_id ? 'COMPRA' : 'DESPESA')
  const referencia =
    r.descricao ||
    r.titulo ||
    r.referencia ||
    (r.id ? `${tipo} #${r.id}` : tipo)

  const fornecedor =
    r.fornecedor?.nome ||
    r.fornecedor_nome ||
    (r.fornecedor_id ? `Fornecedor #${r.fornecedor_id}` : '—')

  const vencimento = r.data_vencimento || r.vencimento || r.data || null
  const valor =
    r.valor_total ??
    r.valor ??
    r.valor_original ??
    r.total ??
    0

  const status = r.status || r.status_financeiro || 'EM_ABERTO'

  return {
    raw: r,
    tipo,
    referencia,
    fornecedor,
    vencimento,
    valor,
    status,
  }
}

async function fetchData() {
  loading.value = true
  try {
    const { data } = await api.get(ENDPOINT)
    const lista = Array.isArray(data) ? data : (data?.rows || data?.data || [])
    rows.value = lista.map(mapRow)
  } finally {
    loading.value = false
  }
}

// ✅ agrupamento por 3 tabelas
const rowsAtrasados = computed(() =>
  rows.value.filter(r => String(r.status).toUpperCase() === 'ATRASADO')
)

const rowsEmAberto = computed(() =>
  rows.value.filter(r => String(r.status).toUpperCase() === 'EM_ABERTO')
)

const rowsPagos = computed(() =>
  rows.value.filter(r => String(r.status).toUpperCase() === 'PAGO')
)

onMounted(fetchData)

// ações (placeholder) — você manda o que existe de verdade
function verDetalhes(row) {
  // ajuste rota se tiver detalhes
  console.log('DETALHES', row.raw)
}
</script>

<template>
  <Card :shadow="true" class="w-full h-full">
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          Contas a Pagar
        </h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          Visão de todas as saídas da empresa (despesas + compras)
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="secondary" size="sm" type="button" @click="fetchData">
          Atualizar
        </Button>
      </div>
    </header>

    <!-- BODY -->
    <div class="relative p-6">
      <LoadingOverlay v-if="loading" :overlay="true" text="Carregando..." />

      <!-- 1) ATRASADOS -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-black uppercase tracking-widest text-gray-900">
            Atrasados
          </h3>
          <span class="text-xs font-extrabold uppercase tracking-widest text-gray-400">
            {{ rowsAtrasados.length }} itens
          </span>
        </div>

        <Table
          :columns="columns"
          :rows="rowsAtrasados"
          :loading="loading"
          empty-text="Nenhum pagamento atrasado."
        >
          <template #cell-vencimento="{ row }">
            <span class="text-sm font-semibold text-gray-900">
              {{ row.vencimento ? format.data(row.vencimento) : '—' }}
            </span>
          </template>

          <template #cell-valor="{ row }">
            <span class="text-sm font-black text-gray-900">
              {{ format.moeda(row.valor) }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex items-center gap-2">
              <Button variant="secondary" size="sm" type="button" @click="verDetalhes(row)">
                Ver
              </Button>
            </div>
          </template>
        </Table>
      </div>

      <div class="h-px w-full bg-gray-100 my-6"></div>

      <!-- 2) EM ABERTO -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-black uppercase tracking-widest text-gray-900">
            Em aberto
          </h3>
          <span class="text-xs font-extrabold uppercase tracking-widest text-gray-400">
            {{ rowsEmAberto.length }} itens
          </span>
        </div>

        <Table
          :columns="columns"
          :rows="rowsEmAberto"
          :loading="loading"
          empty-text="Nenhum pagamento em aberto."
        >
          <template #cell-vencimento="{ row }">
            <span class="text-sm font-semibold text-gray-900">
              {{ row.vencimento ? format.data(row.vencimento) : '—' }}
            </span>
          </template>

          <template #cell-valor="{ row }">
            <span class="text-sm font-black text-gray-900">
              {{ format.moeda(row.valor) }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex items-center gap-2">
              <Button variant="secondary" size="sm" type="button" @click="verDetalhes(row)">
                Ver
              </Button>
            </div>
          </template>
        </Table>
      </div>

      <div class="h-px w-full bg-gray-100 my-6"></div>

      <!-- 3) PAGOS -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-black uppercase tracking-widest text-gray-900">
            Pagos
          </h3>
          <span class="text-xs font-extrabold uppercase tracking-widest text-gray-400">
            {{ rowsPagos.length }} itens
          </span>
        </div>

        <Table
          :columns="columns"
          :rows="rowsPagos"
          :loading="loading"
          empty-text="Nenhum pagamento pago."
        >
          <template #cell-vencimento="{ row }">
            <span class="text-sm font-semibold text-gray-900">
              {{ row.vencimento ? format.data(row.vencimento) : '—' }}
            </span>
          </template>

          <template #cell-valor="{ row }">
            <span class="text-sm font-black text-gray-900">
              {{ format.moeda(row.valor) }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex items-center gap-2">
              <Button variant="secondary" size="sm" type="button" @click="verDetalhes(row)">
                Ver
              </Button>
            </div>
          </template>
        </Table>
      </div>
    </div>
  </Card>
</template>
