<template>
  <PageShell :padded="false">
    <section class="compras-sugestao ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Sugestão de Compra"
        subtitle="Produtos abaixo do ponto de reposição para nova compra"
        icon="pi pi-shopping-bag"
        :backTo="'/compras'"
      >
        <template #actions>
          <div class="compras-sugestao__actions ds-page-context__actions">
            <div class="compras-sugestao__search ds-page-context__search">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar produto, fornecedor ou medida..."
              />
            </div>

            <Button
              v-if="can('compras.criar')"
              variant="primary"
              @click="irNovaCompra"
            >
              <i class="pi pi-plus"></i>
              Nova Compra
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="compras-sugestao__content ds-page-context__content">
        <div v-if="!loading && lista.length === 0" class="compras-sugestao__empty">
          <p class="compras-sugestao__empty-title">Nenhum produto abaixo do ponto de reposição.</p>
          <p class="compras-sugestao__empty-copy">Todos os itens estão dentro do nível configurado.</p>
        </div>

        <Table
          v-else
          :columns="columns"
          :rows="rows"
          :loading="loading"
          empty-text="Nenhum produto encontrado para os filtros."
          :boxed="false"
          :flush="false"
        >
          <template #cell-nome_produto="{ row }">
            <div class="compras-sugestao__identity">
              <div class="compras-sugestao__initials">
                {{ row.sugestao_qtd }}
              </div>
              <div class="compras-sugestao__identity-copy">
                <span class="compras-sugestao__primary">{{ row.nome_produto || '-' }}</span>
                <span class="compras-sugestao__secondary">{{ row.detalhes_exibicao }}</span>
              </div>
            </div>
          </template>

          <template #cell-fornecedor="{ row }">
            <span class="compras-sugestao__fornecedor">{{ row.fornecedor_exibicao }}</span>
          </template>

          <template #cell-estoque_atual="{ row }">
            <span class="compras-sugestao__stock compras-sugestao__stock--atual">
              {{ Number(row.quantidade ?? 0) }}
            </span>
          </template>

          <template #cell-estoque_minimo="{ row }">
            <span class="compras-sugestao__stock">
              {{ Number(row.estoque_minimo ?? 0) }}
            </span>
          </template>

          <template #cell-sugestao_qtd="{ row }">
            <span class="compras-sugestao__stock compras-sugestao__stock--sugestao">
              {{ row.sugestao_qtd }}
            </span>
          </template>

          <template #cell-valor_unitario="{ row }">
            <span class="compras-sugestao__amount">
              {{ format.currency(row.valor_unitario) }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
              <Button
                v-if="can('compras.criar')"
                variant="ghost"
                size="sm"
                class="compras-sugestao__buy"
                @click="irNovaCompraComFornecedor(row.fornecedor_id)"
              >
                <i class="pi pi-shopping-cart"></i>
                Comprar
              </Button>
            </div>
          </template>
        </Table>
      </div>
    </section>
  </PageShell>
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
  { key: 'nome_produto', label: 'Produto', width: '30%' },
  { key: 'fornecedor', label: 'FORNECEDOR', width: '20%' },
  { key: 'estoque_atual', label: 'SALDO ATUAL', width: '12%', align: 'center' },
  { key: 'estoque_minimo', label: 'PONTO REP.', width: '12%', align: 'center' },
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

const rows = computed(() =>
  filtradas.value.map((row) => ({
    ...row,
    sugestao_qtd: sugerirQuantidade(row),
    detalhes_exibicao: [row.marca, row.cor, row.medida].filter(Boolean).join(' • ') || 'Sem variação informada',
    fornecedor_exibicao: row.fornecedor?.nome_fantasia || row.fornecedor?.razao_social || '-',
  })),
)

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

<style scoped>
.compras-sugestao {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.compras-sugestao__empty {
  padding: 3rem 1rem;
  text-align: center;
  border: 1px solid rgba(214, 224, 234, 0.82);
  border-radius: 1rem;
  background: rgba(250, 252, 255, 0.88);
}

.dark .compras-sugestao__empty {
  background: rgba(18, 30, 49, 0.45);
  border-color: rgba(51, 71, 102, 0.72);
}

.compras-sugestao__empty-title {
  color: var(--ds-color-text);
  font-size: 0.95rem;
  font-weight: 620;
}

.compras-sugestao__empty-copy {
  margin-top: 0.35rem;
  color: var(--ds-color-text-faint);
  font-size: 0.78rem;
}

.compras-sugestao__identity {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.compras-sugestao__initials {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.1rem;
  height: 2.1rem;
  padding: 0 0.45rem;
  border-radius: 0.72rem;
  border: 1px solid rgba(251, 191, 36, 0.28);
  background: rgba(255, 247, 237, 0.95);
  color: rgb(180, 83, 9);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.dark .compras-sugestao__initials {
  background: rgba(69, 26, 3, 0.42);
  border-color: rgba(217, 119, 6, 0.34);
  color: rgb(253, 186, 116);
}

.compras-sugestao__identity-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.compras-sugestao__primary {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 560;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compras-sugestao__secondary {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 430;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compras-sugestao__fornecedor {
  color: var(--ds-color-text);
  font-size: 0.84rem;
}

.compras-sugestao__stock {
  font-size: 0.86rem;
  font-weight: 620;
  font-variant-numeric: tabular-nums;
  color: var(--ds-color-text);
}

.compras-sugestao__stock--atual {
  color: rgb(190, 24, 93);
}

.compras-sugestao__stock--sugestao {
  color: rgb(180, 83, 9);
}

.dark .compras-sugestao__stock--atual {
  color: rgb(251, 113, 133);
}

.dark .compras-sugestao__stock--sugestao {
  color: rgb(253, 186, 116);
}

.compras-sugestao__amount {
  color: var(--ds-color-text);
  font-size: 0.88rem;
  font-weight: 620;
  font-variant-numeric: tabular-nums;
}

.compras-sugestao__buy {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

@media (max-width: 768px) {
  .compras-sugestao__identity {
    gap: 0.48rem;
  }

  .compras-sugestao__initials {
    min-width: 1.9rem;
    height: 1.9rem;
  }
}
</style>
