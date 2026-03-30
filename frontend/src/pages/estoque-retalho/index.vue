<template>
  <PageShell :padded="false">
    <section class="sobras-index ds-page-context ds-page-context--list animate-page-in">

      <PageHeader
        title="Controle de Estoque"
        subtitle="Contagem e reaproveitamento de sobras e retalhos"
        icon="pi pi-box"
      >
        <template #actions>
          <div class="sobras-index__actions ds-page-context__actions">
            <div class="sobras-index__search ds-page-context__search">
              <SearchInput
                v-model="filtro"
                mode="search"
                placeholder="Buscar por material, cor, dimensão ou status..."
              />
            </div>
            <Button
              v-if="can('produtos.criar')"
              variant="primary"
              class="sobras-index__toolbar-btn"
              @click="abrirNovaSobra"
            >
              <i class="pi pi-plus mr-2"></i>
              Lançar Sobra
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="sobras-index__body ds-page-context__content">
        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          :empty-text="'Nenhuma sobra encontrada.'"
          :boxed="false"
          :flush="false"
        >
            <template #cell-material="{ row }">
              <div class="flex items-center gap-3 py-1 min-w-0">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-text-muted text-xs bg-slate-100 dark:bg-slate-700/50 border border-border-ui overflow-hidden shrink-0">
                  <img
                    v-if="row.imagem_url || row.produto_imagem"
                    :src="row.imagem_url || row.produto_imagem"
                    class="w-full h-full object-cover"
                    alt=""
                  />
                  <i v-else class="pi pi-box text-amber-500 text-sm" />
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-sm font-semibold text-text-main truncate" :title="row.nome_produto">
                    {{ row.nome_produto || '-' }}
                  </span>
                  <span class="text-[10px] text-text-muted mt-0.5">
                    Sobra #{{ String(row.id || 0).padStart(4, '0') }}
                  </span>
                </div>
              </div>
            </template>

            <template #cell-cor="{ row }">
              <span class="text-sm text-text-main">{{ row.cor || '-' }}</span>
            </template>

            <template #cell-dimensoes="{ row }">
              <span class="text-sm text-text-main tabular-nums">
                {{ row.largura_mm }} × {{ row.comprimento_mm }} mm
              </span>
            </template>

            <template #cell-area="{ row }">
              <span class="text-sm font-semibold text-text-main tabular-nums">
                {{ Number(row.quantidade_m2 || 0).toFixed(4) }} m²
              </span>
            </template>

            <template #cell-status="{ row }">
              <StatusBadge :value="row.status || 'DISPONIVEL'" />
            </template>

            <template #cell-data="{ row }">
              <span class="text-sm text-text-muted">
                {{ row.criado_em ? new Date(row.criado_em).toLocaleDateString('pt-BR') : '—' }}
              </span>
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex items-center justify-center gap-1">
                <button
                  v-if="can('produtos.ver')"
                  class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  title="Imprimir etiqueta"
                  @click.stop="imprimirEtiqueta(row)"
                >
                  <i class="pi pi-print text-xs text-text-muted" />
                </button>
                <TableActions
                  :id="row.id"
                  perm-edit="produtos.editar"
                  perm-delete="produtos.excluir"
                  @edit="(id) => router.push(`/estoque-retalho/${id}`)"
                  @delete="() => confirmarExcluir(row)"
                />
              </div>
            </template>
        </Table>
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
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'produtos.ver' } })

const sobras = ref([])
const loading = ref(false)
const router = useRouter()
const filtro = ref('')

function abrirNovaSobra() {
  router.push('/estoque-retalho/novo')
}

const columns = [
  { key: 'material', label: 'Material', width: '28%' },
  { key: 'cor', label: 'Cor', width: '12%' },
  { key: 'dimensoes', label: 'Dimensões', width: '16%' },
  { key: 'area', label: 'Área', width: '12%', align: 'right' },
  { key: 'status', label: 'Status', width: '10%', align: 'center' },
  { key: 'data', label: 'Data', width: '12%' },
  { key: 'acoes', label: '', align: 'center', width: '10%' },
]

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
  if (!busca) return sobras.value || []
  const termos = busca.split(' ').filter(Boolean)
  return (sobras.value || []).filter((s) => {
    const alvo = normalizarBusca(
      [
        s.produto?.nome_produto,
        s.produto?.cor,
        s.produto?.medida,
        s.status === 'DISPONIVEL' ? 'Disponivel' : s.status === 'RESERVADO' ? 'Reservado' : s.status,
        `${s.largura_mm}`,
        `${s.comprimento_mm}`,
      ]
        .filter(Boolean)
        .join(' '),
    )
    return termos.every((t) => alvo.includes(t))
  })
})

const rows = computed(() =>
  filtrados.value.map((s) => ({
    ...s,
    nome_produto: s.produto?.nome_produto || '-',
    cor: s.produto?.cor || '-',
    produto_imagem: s.produto?.imagem_url || '',
  })),
)

async function buscarDados() {
  loading.value = true
  try {
    const resp = await api.get('/estoque/retalhos')
    const arr = resp?.data ?? resp
    sobras.value = Array.isArray(arr) ? arr : []
  } catch (err) {
    console.error('Erro ao buscar sobras:', err?.response || err)
    notify.error('Erro ao carregar sobras.')
  } finally {
    loading.value = false
  }
}

async function confirmarExcluir(row) {
  if (!can('produtos.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show(
    'Excluir Sobra',
    `Deseja excluir a sobra #${row?.id}? Esta ação não pode ser desfeita.`,
  )
  if (!ok) return
  try {
    await api.delete(`/estoque/retalhos/${row.id}`)
    sobras.value = sobras.value.filter((s) => s.id !== row.id)
    notify.success('Sobra excluída!')
  } catch (err) {
    notify.error('Erro ao excluir.')
  }
}

function imprimirEtiqueta(row) {
  const url = `${api.defaults.baseURL || '/api'}/estoque/retalhos/${row.id}/etiqueta`
  window.open(url, '_blank')
}

onMounted(async () => {
  if (!can('produtos.ver')) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }
  buscarDados()
})
</script>

<style scoped>
.sobras-index {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.sobras-index__toolbar-btn {
  min-height: 2.55rem;
  padding-inline: 1rem;
  border-radius: 0.9rem;
}

.sobras-index__body {
  padding-top: 0.2rem;
  padding-bottom: 1.5rem;
}

.sobras-index :deep(.ds-table__element) {
  table-layout: fixed;
  min-width: 900px;
}

.sobras-index :deep(.ds-table-head-row) {
  background: transparent;
  border-bottom-color: rgba(214, 224, 234, 0.55);
}

.sobras-index :deep(.ds-table__head-cell) {
  padding-top: 0.62rem;
  padding-bottom: 0.45rem;
  color: var(--ds-color-text-faint);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: none;
  white-space: normal;
}

.sobras-index :deep(.ds-table__head-cell),
.sobras-index :deep(.ds-table__cell) {
  padding-left: 0.72rem;
  padding-right: 0.72rem;
}

.sobras-index :deep(.ds-table__cell) {
  padding-top: 0.64rem;
  padding-bottom: 0.64rem;
  border-bottom: 1px solid rgba(214, 224, 234, 0.42);
}

.sobras-index :deep(.ds-table__row:hover) {
  background: rgba(255, 255, 255, 0.38);
}
</style>
