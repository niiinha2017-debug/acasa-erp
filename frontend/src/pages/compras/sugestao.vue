<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-amber-500 rounded-t-2xl" />

      <PageHeader
        title="Sugestão de Compra"
        subtitle="Produtos com estoque abaixo do mínimo (Estoque Atual &lt; Estoque Mínimo)"
        icon="pi pi-shopping-bag"
        :backTo="'/compras'"
      >
        <template #actions>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-64 order-1 sm:order-0">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar produto ou fornecedor..."
              />
            </div>
            <Button
              v-if="can('compras.criar')"
              variant="primary"
              @click="irNovaCompra"
            >
              <i class="pi pi-plus mr-2"></i>
              Nova Compra
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
        <div v-if="!loading && lista.length === 0" class="py-12 text-center rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-border-ui">
          <i class="pi pi-check-circle text-4xl text-emerald-500 mb-3 block"></i>
          <p class="text-sm font-bold text-text-main">Nenhum produto abaixo do estoque mínimo.</p>
          <p class="text-xs text-text-muted mt-1">Todos os insumos estão dentro do nível configurado.</p>
        </div>

        <div v-else class="native-table-flush overflow-visible">
        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          empty-text="Nenhum produto encontrado para os filtros."
          :boxed="false"
          :flush="true"
          row-class="bg-red-50/50 dark:bg-red-950/20"
        >
          <template #cell-nome_produto="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-sm font-bold text-text-main uppercase tracking-tight">
                {{ row.nome_produto || '-' }}
              </span>
              <span class="text-[10px] text-text-muted">
                {{ [row.marca, row.cor, row.medida].filter(Boolean).join(' • ') || '—' }}
              </span>
            </div>
          </template>

          <template #cell-fornecedor="{ row }">
            <span class="text-sm text-text-main">
              {{ row.fornecedor?.nome_fantasia || row.fornecedor?.razao_social || '-' }}
            </span>
          </template>

          <template #cell-estoque_atual="{ row }">
            <span class="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {{ Number(row.quantidade ?? 0) }}
            </span>
          </template>

          <template #cell-estoque_minimo="{ row }">
            <span class="text-sm font-semibold text-text-main tabular-nums">
              {{ Number(row.estoque_minimo ?? 0) }}
            </span>
          </template>

          <template #cell-sugestao_qtd="{ row }">
            <span class="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {{ sugerirQuantidade(row) }}
            </span>
          </template>

          <template #cell-valor_unitario="{ row }">
            <span class="text-sm text-text-main tabular-nums">
              {{ format.currency(row.valor_unitario) }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
              <Button
                v-if="can('compras.criar')"
                variant="ghost"
                size="sm"
                class="text-[10px] font-bold uppercase"
                @click="irNovaCompraComFornecedor(row.fornecedor_id)"
              >
                <i class="pi pi-shopping-cart mr-1"></i>
                Comprar
              </Button>
            </div>
          </template>
        </Table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ProdutosService } from '@/services/index'
import { notify } from '@/services/notify'
import { format } from '@/utils/format'
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'compras.ver' } })

const router = useRouter()
const loading = ref(false)
const lista = ref([])
const filtro = ref('')

const columns = [
  { key: 'nome_produto', label: 'PRODUTO', width: '25%' },
  { key: 'fornecedor', label: 'FORNECEDOR', width: '20%' },
  { key: 'estoque_atual', label: 'ESTOQUE ATUAL', width: '12%', align: 'center' },
  { key: 'estoque_minimo', label: 'EST. MÍNIMO', width: '12%', align: 'center' },
  { key: 'sugestao_qtd', label: 'SUGESTÃO QTD', width: '12%', align: 'center' },
  { key: 'valor_unitario', label: 'VALOR UNIT.', width: '12%', align: 'right' },
  { key: 'acoes', label: 'Ações', align: 'center', width: '100px' },
]

function sugerirQuantidade(row) {
  const atual = Number(row.quantidade ?? 0)
  const min = Number(row.estoque_minimo ?? 0)
  if (min <= 0) return 0
  return Math.max(0, min - atual)
}

const filtradas = computed(() => {
  const f = String(filtro.value || '').toLowerCase().trim()
  if (!f) return lista.value
  return lista.value.filter((p) => {
    const nome = String(p.nome_produto || '').toLowerCase()
    const forn = String(p.fornecedor?.nome_fantasia || p.fornecedor?.razao_social || '').toLowerCase()
    return nome.includes(f) || forn.includes(f)
  })
})

async function carregar() {
  if (!can('compras.ver')) return
  loading.value = true
  try {
    const res = await ProdutosService.listarAbaixoEstoqueMinimo()
    const data = res?.data ?? res
    lista.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar sugestão de compra.')
    lista.value = []
  } finally {
    loading.value = false
  }
}

function irNovaCompra() {
  router.push('/compras/novo')
}

function irNovaCompraComFornecedor(fornecedorId) {
  if (fornecedorId) {
    router.push({ path: '/compras/novo', query: { fornecedor_id: fornecedorId } })
  } else {
    router.push('/compras/novo')
  }
}

onMounted(() => {
  if (can('compras.ver')) carregar()
})
</script>
