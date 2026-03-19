<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Insumos e Materiais"
        subtitle="Catálogo de materiais e controle de insumos"
        icon="pi pi-box"
        :show-back="false"
      >
        <template #actions>
          <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end [&>*]:min-h-10 [&>*]:sm:h-10">
            <div class="w-full sm:w-64 order-1 sm:order-0 flex items-center">
              <SearchInput
                v-model="filtro"
                mode="search"
                placeholder="Buscar por nome, cor, medida ou marca..."
              />
            </div>
            <!-- Novo Produto -->
            <Button
              v-if="can('produtos.criar')"
              variant="primary"
              class="order-4 h-10 min-h-10 px-4"
              @click="abrirNovoProduto"
            >
              <i class="pi pi-plus mr-2"></i>
              Novo Produto
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="pb-5 md:pb-6 pt-4 border-t border-border-ui space-y-4">
        <!-- Resumo, vista e contagem -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-4 text-sm">
            <span class="font-semibold text-text-main tabular-nums">
              {{ rows.length }} {{ rows.length === 1 ? 'produto' : 'produtos' }}
            </span>
            <span
              v-if="totalEstoqueBaixo > 0"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium"
            >
              <i class="pi pi-exclamation-triangle text-[10px]"></i>
              {{ totalEstoqueBaixo }} com estoque abaixo do mínimo
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Ver como</span>
            <button
              type="button"
              class="p-2 rounded-lg transition-colors"
              :class="viewMode === 'table' ? 'bg-brand-primary/15 text-brand-primary' : 'bg-slate-100 dark:bg-slate-700 text-text-muted hover:text-text-main'"
              title="Tabela"
              @click="viewMode = 'table'"
            >
              <i class="pi pi-list" />
            </button>
            <button
              type="button"
              class="p-2 rounded-lg transition-colors"
              :class="viewMode === 'cards' ? 'bg-brand-primary/15 text-brand-primary' : 'bg-slate-100 dark:bg-slate-700 text-text-muted hover:text-text-main'"
              title="Cards"
              @click="viewMode = 'cards'"
            >
              <i class="pi pi-th-large" />
            </button>
          </div>
        </div>

        <!-- Cards (galeria) -->
        <div v-if="viewMode === 'cards'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="row in rows"
            :key="row.id"
            class="rounded-xl border border-border-ui bg-bg-page overflow-hidden hover:border-brand-primary/40 transition-colors group"
          >
            <div class="aspect-square bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden relative">
              <img
                v-if="String(row.imagem_url || '').trim()"
                :src="row.imagem_url"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                alt=""
              />
              <span v-else class="text-4xl font-bold text-text-muted/60">{{ String(row.nome_produto || '').substring(0, 2).toUpperCase() }}</span>
              <div class="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 text-xs font-medium text-text-main shadow-sm">
                <i class="pi pi-box text-amber-600 dark:text-amber-400" title="Chapa inteira" />
                <span>Chapa</span>
              </div>
            </div>
            <div class="p-3">
              <div class="flex items-center gap-2 min-w-0">
                <h3 class="text-sm font-semibold text-text-main truncate" :title="row.nome_produto">{{ row.nome_produto || '-' }}</h3>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide border shrink-0"
                  :class="categoriaBaseBadgeClass(row?.categoria_base)"
                >
                  {{ getCategoriaBaseLabel(row?.categoria_base) }}
                </span>
              </div>
              <p class="text-[10px] text-text-muted mt-0.5">Ref. {{ String(row.id || 0).padStart(4, '0') }}</p>
              <div class="mt-2 flex items-center justify-between">
                <span class="text-sm font-semibold text-text-main tabular-nums">{{ format.currency(row.valor_unitario) }}</span>
                <div class="flex items-center gap-1">
                  <StatusBadge :value="row.status || 'INATIVO'" />
                  <TableActions
                    :id="row.id"
                    perm-edit="produtos.editar"
                    perm-delete="produtos.excluir"
                    @edit="(id) => router.push(`/produtos/${id}`)"
                    @delete="() => confirmarExcluirProduto(row)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabela em container definido -->
        <div v-else class="rounded-xl border border-border-ui bg-bg-page overflow-hidden">
          <Table
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :empty-text="emptyTableText"
            :boxed="false"
            :flush="true"
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
            <div class="flex justify-end">
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
            flush
            v-if="meta.total > 0"
            :page="meta.page"
            :page-size="meta.pageSize"
            :total="meta.total"
            @update:page="(p) => buscarDadosDoBanco(p)"
          />
        </div>
      </div>
    </div>
  </div>
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
const viewMode = ref('table') // 'table' | 'cards'

function abrirNovoProduto() {
  router.push('/produtos/novo')
}

const columns = [
  { key: 'nome_produto', label: 'Produto', width: '22%' },
  { key: 'fornecedor_nome', label: 'Fornecedor', width: '14%' },
  { key: 'marca', label: 'Marca', width: '10%' },
  { key: 'cor', label: 'Cor', width: '8%' },
  { key: 'medida', label: 'Medida', width: '9%' },
  { key: 'unidade', label: 'Un.', width: '52px', align: 'center' },
  { key: 'valor_unitario', label: 'Valor unit.', width: '10%', align: 'right' },
  { key: 'status', label: 'Status', width: '80px', align: 'center' },
  { key: 'acoes', label: '', align: 'right', width: '112px' },
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

const totalEstoqueBaixo = computed(() => {
  const min = (p) => Number(p.estoque_minimo ?? 0)
  const qtd = (p) => Number(p.quantidade ?? 0)
  return (filtrados.value || []).filter((p) => min(p) > 0 && qtd(p) < min(p)).length
})

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
