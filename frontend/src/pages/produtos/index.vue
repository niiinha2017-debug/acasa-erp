<template>
  <PageShell :padded="false">
    <section class="produtos-index ds-page-context ds-page-context--list animate-page-in">

      <PageHeader
        title="Insumos e Materiais"
        subtitle="Catálogo de materiais e controle de insumos"
        icon="pi pi-box"
      >
        <template #actions>
          <div class="produtos-index__actions ds-page-context__actions">
            <div class="produtos-index__search ds-page-context__search">
              <SearchInput
                v-model="filtro"
                mode="search"
                placeholder="Buscar por nome, cor, medida ou marca..."
              />
            </div>
            <Button
              v-if="can('produtos.criar')"
              variant="primary"
              class="produtos-index__toolbar-btn"
              @click="abrirNovoProduto"
            >
              <i class="pi pi-plus mr-2"></i>
              Novo Produto
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="produtos-index__body ds-page-context__content">
        <div class="produtos-index__table-wrap">
          <Table
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :empty-text="emptyTableText"
            :boxed="false"
            :flush="false"
            :row-class="rowClassEstoque"
          >
          <template #cell-nome_produto="{ row }">
            <div class="flex items-center gap-3 py-1 min-w-0">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-text-muted text-xs bg-slate-100 dark:bg-slate-700/50 border border-border-ui overflow-hidden shrink-0">
                <img
                  v-if="String(row.imagem_url || '').trim()"
                  :src="row.imagem_url"
                  class="w-full h-full object-cover"
                  alt="Produto"
                />
                <span v-else>{{ String(row.nome_produto || '').substring(0, 2).toUpperCase() }}</span>
              </div>
              <div class="flex items-center gap-2 min-w-0">
                <i class="pi pi-box text-amber-600 dark:text-amber-400 text-xs shrink-0" title="Chapa inteira" />
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-sm font-semibold text-text-main truncate" :title="row.nome_produto">
                      {{ row.nome_produto || '-' }}
                    </span>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide border shrink-0"
                      :class="categoriaBaseBadgeClass(row?.categoria_base)"
                    >
                      {{ getCategoriaBaseLabel(row?.categoria_base) }}
                    </span>
                  </div>
                  <span class="text-[10px] text-text-muted mt-0.5">
                    Ref. {{ String(row.id || 0).padStart(4, '0') }}
                  </span>
                </div>
              </div>
            </div>
          </template>

          <template #cell-fornecedor_nome="{ row }">
            <span class="text-sm text-text-main truncate block max-w-[140px]" :title="row.fornecedor_nome">
              {{ row.fornecedor_nome || '-' }}
            </span>
          </template>

          <template #cell-marca="{ row }">
            <span class="text-sm text-text-main">
              {{ row.marca || '-' }}
            </span>
          </template>

          <template #cell-cor="{ row }">
            <span class="text-sm text-text-main">
              {{ row.cor || '-' }}
            </span>
          </template>

          <template #cell-medida="{ row }">
            <span class="text-sm text-text-main">
              {{ row.medida || '-' }}
            </span>
          </template>

          <template #cell-valor_unitario="{ row }">
            <span class="text-sm font-semibold text-text-main tabular-nums">
              {{ format.currency(row.valor_unitario) }}
            </span>
          </template>

          <template #cell-unidade="{ row }">
            <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-xs font-medium text-text-muted">
              {{ row.unidade || '-' }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status || 'INATIVO'" />
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
              <TableActions
                :id="row.id"
                perm-edit="produtos.editar"
                perm-delete="produtos.excluir"
                @edit="(id) => router.push(`/produtos/${id}`)"
                @delete="() => confirmarExcluirProduto(row)"
              />
            </div>
          </template>
          </Table>
          <TablePagination
            v-if="meta.total > 0"
            :page="meta.page"
            :page-size="meta.pageSize"
            :total="meta.total"
            @update:page="(p) => buscarDadosDoBanco(p)"
          />
        </div>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { format } from '@/utils/format'
import { can } from '@/services/permissions'
import { getCategoriaBaseLabel } from '@/constantes/categorias-base'

definePage({ meta: { perm: 'produtos.ver' } })

const produtos = ref([])
const meta = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
const loading = ref(false)
const router = useRouter()
const filtro = ref('')

function abrirNovoProduto() {
  router.push('/produtos/novo')
}

const columns = [
  { key: 'nome_produto', label: 'Produto', width: '24%' },
  { key: 'fornecedor_nome', label: 'Fornecedor', width: '16%' },
  { key: 'marca', label: 'Marca', width: '10%' },
  { key: 'cor', label: 'Cor', width: '8%' },
  { key: 'medida', label: 'Medida', width: '10%' },
  { key: 'unidade', label: 'Un.', width: '6%', align: 'center' },
  { key: 'valor_unitario', label: 'Valor unit.', width: '10%', align: 'right' },
  { key: 'status', label: 'Status', width: '8%', align: 'center' },
  { key: 'acoes', label: '', align: 'center', width: '8%' },
]

function rowClassEstoque(row) {
  const qtd = Number(row.quantidade ?? 0)
  const min = Number(row.estoque_minimo ?? 0)
  if (min > 0 && qtd < min) return 'bg-red-50 dark:bg-red-950/40'
  return ''
}

function categoriaBaseBadgeClass(value) {
  const key = String(value || '').trim().toUpperCase()
  if (key === 'TERCIARIA') {
    return 'bg-amber-50 text-amber-800 border-amber-200'
  }
  if (key === 'SECUNDARIA') {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  }
  if (key === 'FITA_BORDA') {
    return 'bg-orange-50 text-orange-800 border-orange-200'
  }
  if (key === 'INSUMO') {
    return 'bg-blue-50 text-blue-800 border-blue-200'
  }
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

function normalizarBusca(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

const filtrados = computed(() => {
  const busca = normalizarBusca(filtro.value)
  if (!busca) return produtos.value || []

  const termos = busca.split(' ').filter(Boolean)
  return (produtos.value || []).filter((p) => {
    const alvoNormalizado = normalizarBusca([
      p.nome_produto,
      p.cor,
      p.medida,
      p.marca,
    ]
      .filter(Boolean)
      .join(' '))

    return termos.every((termo) => alvoNormalizado.includes(termo))
  })
})

const rows = computed(() =>
  filtrados.value.map((p) => ({
    ...p,
    fornecedor_nome: p.fornecedor?.razao_social || p.fornecedor?.nome_fantasia || '-',
    valor_unitario: Number(p.valor_unitario || 0),
    status: String(p.status || 'INATIVO').toUpperCase(),
  })),
)

const emptyTableText = computed(() => {
  return 'Nenhum produto encontrado.'
})

async function buscarDadosDoBanco(page = 1) {
  loading.value = true
  try {
    const params = { page, pageSize: 20 }
    const resp = await api.get('/produtos', { params })
    const payload = resp.data
    const arr = payload?.data ?? payload
    produtos.value = Array.isArray(arr) ? arr : []
    meta.value =
      payload?.meta || {
        page: 1,
        pageSize: 20,
        total: Array.isArray(arr) ? arr.length : 0,
        totalPages: 1,
      }
  } catch (err) {
    console.error('Erro ao buscar produtos:', err?.response || err)
    notify.error('Erro ao carregar produtos.')
  } finally {
    loading.value = false
  }
}

async function confirmarExcluirProduto(row) {
  if (!can('produtos.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show(
    'Excluir Produto',
    `Deseja excluir o produto "${row?.nome_produto}"? Esta ação não pode ser desfeita.`,
  )
  if (!ok) return
  try {
    await api.delete(`/produtos/${row.id}`)
    produtos.value = produtos.value.filter((p) => p.id !== row.id)
    notify.success('Produto excluído!')
  } catch (err) {
    notify.error('Erro ao excluir.')
  }
}

onMounted(async () => {
  if (!can('produtos.ver')) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }
  buscarDadosDoBanco(1)
})
</script>

<style scoped>
.produtos-index {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.produtos-index__toolbar-btn {
  min-height: 2.55rem;
  padding-inline: 1rem;
  border-radius: 0.9rem;
}

.produtos-index__body {
  padding-top: 0.2rem;
  padding-bottom: 1.5rem;
}

.produtos-index__table-wrap {
  width: 100%;
  overflow: hidden;
}

.produtos-index :deep(.ds-table__element) {
  table-layout: fixed;
  min-width: 1120px;
}

.produtos-index :deep(.ds-table-head-row) {
  background: transparent;
  border-bottom-color: rgba(214, 224, 234, 0.55);
}

.produtos-index :deep(.ds-table__head-cell) {
  padding-top: 0.62rem;
  padding-bottom: 0.45rem;
  color: var(--ds-color-text-faint);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: none;
  white-space: normal;
}

.produtos-index :deep(.ds-table__head-cell),
.produtos-index :deep(.ds-table__cell) {
  padding-left: 0.72rem;
  padding-right: 0.72rem;
}

.produtos-index :deep(.ds-table__head-cell:last-child),
.produtos-index :deep(.ds-table__cell:last-child) {
  padding-right: 0.75rem;
}

.produtos-index :deep(.ds-table__cell) {
  padding-top: 0.64rem;
  padding-bottom: 0.64rem;
  border-bottom: 1px solid rgba(214, 224, 234, 0.42);
}

.produtos-index :deep(.ds-table__row:hover) {
  background: rgba(255, 255, 255, 0.38);
}

.dark .produtos-index :deep(.ds-table__row:hover) {
  background: rgba(18, 30, 49, 0.32);
}

.produtos-index :deep(.ds-table__row:hover td:first-child) {
  box-shadow: inset 2px 0 0 0 rgba(188, 203, 221, 0.9);
}

.produtos-index :deep(.ds-table-pagination) {
  padding-inline: 1rem;
}

@media (min-width: 768px) {
  .produtos-index__body {
    padding-bottom: 1.75rem;
  }
}

@media (min-width: 1024px) {
  .produtos-index__body {
    padding-bottom: 2rem;
  }
}

@media (max-width: 768px) {
  .produtos-index__toolbar-btn {
    width: 100%;
    max-width: none;
  }

  .produtos-index__body {
    padding-bottom: 1.1rem;
  }

  .produtos-index :deep(.ds-table__element) {
    min-width: 900px;
  }

  .produtos-index :deep(.ds-table__head-cell),
  .produtos-index :deep(.ds-table__cell) {
    padding-left: 0.56rem;
    padding-right: 0.56rem;
  }

  .produtos-index :deep(.ds-table__head-cell) {
    font-size: 11px;
  }
}

@media (max-width: 1280px) {
  .produtos-index :deep(.ds-table__element) {
    min-width: 1120px;
  }
}

@media (max-width: 1100px) {
  .produtos-index :deep(.ds-table__head-cell),
  .produtos-index :deep(.ds-table__cell) {
    padding-left: 0.62rem;
    padding-right: 0.62rem;
  }

  .produtos-index :deep(.ds-table__head-cell) {
    font-size: 11px;
  }

  .produtos-index :deep(.ds-table__element) {
    min-width: 980px;
  }
}
</style>
