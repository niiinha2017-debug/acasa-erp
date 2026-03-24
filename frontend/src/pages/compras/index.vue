<template>
  <PageShell :padded="false">
    <section class="compras-list ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Compras"
        subtitle="Registro de entradas, compras vinculadas e rateios de custo"
        icon="pi pi-shopping-cart"
      >
        <template #actions>
          <div class="compras-list__actions ds-page-context__actions">
            <div class="compras-list__search ds-page-context__search">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar compra, fornecedor, categoria, status ou valor..."
              />
            </div>

            <Button
              variant="secondary"
              @click="router.push('/compras/sugestao')"
            >
              <i class="pi pi-shopping-bag"></i>
              Sugestão de Compra
            </Button>

            <Button
              v-if="can('compras.criar')"
              variant="primary"
              @click="router.push('/compras/novo')"
            >
              <i class="pi pi-plus"></i>
              Nova Compra
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="compras-list__content ds-page-context__content space-y-6">
        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          empty-text="Nenhuma compra registrada."
          :boxed="false"
          :flush="false"
        >
          <template #cell-descricao="{ row }">
            <div class="compras-list__identity">
              <div class="compras-list__initials">
                {{ row.tipo_abrev }}
              </div>
              <div class="compras-list__identity-copy">
                <span class="compras-list__primary">
                  {{ row.descricao_exibicao }}
                </span>
                <span class="compras-list__secondary">
                  {{ row.fornecedor_exibicao }}
                  <span v-if="row.vinculo_exibicao" class="compras-list__secondary-detail">{{ row.vinculo_exibicao }}</span>
                </span>
              </div>
            </div>
          </template>

          <template #cell-categoria="{ row }">
            <span class="ds-status-pill" :class="row.categoria_class">
              {{ row.categoria_exibicao }}
            </span>
          </template>

          <template #cell-data="{ row }">
            <span class="compras-list__date">{{ format.date(row.data_compra) }}</span>
          </template>

          <template #cell-valor="{ row }">
            <span class="compras-list__amount">
              {{ format.currency(row.valor_total) }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="statusExibicao(row)" />
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
              <TableActions
                :id="row.id"
                perm-edit="compras.editar"
                perm-delete="compras.excluir"
                @edit="(id) => router.push(`/compras/${id}`)"
                @delete="(id) => confirmarExcluir(id)"
              />
            </div>
          </template>
        </Table>

        <TablePagination
          v-if="total > 0"
          :page="page"
          :page-size="pageSize"
          :total="total"
          @update:page="setPage"
        />
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import api from '@/services/api'
import { format } from '@/utils/format'
import { usePagination } from '@/composables/usePagination'

definePage({ meta: { perm: 'compras.ver' } })

const router = useRouter()
const loading = ref(false)
const compras = ref([])
const filtro = ref('')

const columns = [
  { key: 'descricao', label: 'Compra', width: '40%' },
  { key: 'categoria', label: 'CATEGORIA', width: '15%' },
  { key: 'data', label: 'DATA', width: '15%' },
  { key: 'valor', label: 'VALOR', width: '15%', align: 'right' },
  { key: 'status', label: 'STATUS', width: '10%' },
  { key: 'acoes', label: 'Ações', align: 'center', width: '10%' }
]

const filtradas = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  if (!termo) return compras.value
  const palavras = termo.split(/\s+/).filter(Boolean)
  const valorFmt = (v) => (v != null && v !== '') ? format.currency(v) : ''
  return compras.value.filter((c) => {
    const desc = String(c.descricao || '').toLowerCase()
    const cat = String(c.categoria || '').toLowerCase()
    const forn = String(c.fornecedor?.nome_fantasia || c.fornecedor?.razao_social || '').toLowerCase()
    const statusStr = String(c.status || '').toLowerCase()
    const valorStr = valorFmt(c.valor_total).toLowerCase().replace(/\s/g, '')
    const valorNum = String(c.valor_total ?? '').toLowerCase()
    const dataStr = c.data_compra ? format.date(c.data_compra).toLowerCase() : ''
    const textoBusca = [desc, cat, forn, statusStr, valorStr, valorNum, dataStr].join(' ')
    return palavras.every((p) => textoBusca.includes(p))
  })
})

const { page, setPage, total, totalPages, pageSize, rowsToShow } = usePagination(
  filtradas,
  { pageSize: 15 },
)
watch(filtro, () => setPage(1))

const rows = computed(() =>
  rowsToShow.value.map((row) => {
    const tipo = String(row.tipo_compra || '').toUpperCase()
    const categoria = String(row.categoria || '').toUpperCase()
    const fornecedor = row.fornecedor?.nome_fantasia || row.fornecedor?.razao_social || 'Fornecedor não informado'
    const vendaId = Number(row.venda_id || 0)

    return {
      ...row,
      tipo_abrev: tipo === 'CLIENTE_AMBIENTE' ? 'VD' : 'ES',
      descricao_exibicao: row.descricao || (tipo === 'CLIENTE_AMBIENTE' ? `Compra vinculada #${row.id}` : `Compra de estoque #${row.id}`),
      fornecedor_exibicao: fornecedor,
      vinculo_exibicao: vendaId > 0 ? `Venda #${vendaId}` : 'Estoque interno',
      categoria_exibicao: categoria || 'SEM CATEGORIA',
      categoria_class: categoriaClass(categoria),
    }
  }),
)

/** Verde = já chegou/pago. Vermelho = atrasado (vencimento passado e em aberto). */
function statusExibicao(row) {
  const status = String(row.status || '').toUpperCase()
  const vencimento = row.vencimento_em ? new Date(row.vencimento_em) : null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  if (vencimento && status === 'EM_ABERTO') {
    vencimento.setHours(0, 0, 0, 0)
    if (vencimento < hoje) return 'ATRASADO'
  }
  return row.status || 'EM_ABERTO'
}

function categoriaClass(value) {
  const categoria = String(value || '').toUpperCase()
  if (categoria === 'INSUMO') return 'ds-status-pill--info'
  if (categoria === 'DESPESA') return 'ds-status-pill--danger'
  if (categoria === 'INVESTIMENTO') return 'ds-status-pill--success'
  return 'ds-status-pill--neutral'
}

async function carregar() {
  if (!can('compras.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const { data } = await api.get('/compras')
    compras.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar compras.')
  } finally {
    loading.value = false
  }
}

async function confirmarExcluir(id) {
  if (!can('compras.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show(
    'Excluir Compra',
    `Deseja excluir permanentemente a compra #${id}?`,
  )
  if (!ok) return
  try {
    await api.delete(`/compras/${id}`)
    notify.success('Compra removida.')
    await carregar()
  } catch (e) {
    notify.error('Erro ao excluir.')
  }
}

onMounted(async () => {
  if (can('compras.ver')) await carregar()
})
</script>

<style scoped>
.compras-list {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.compras-list__identity {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.compras-list__initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.05rem;
  height: 2.05rem;
  border-radius: 0.72rem;
  border: 1px solid rgba(214, 224, 234, 0.78);
  background: rgba(245, 248, 251, 0.92);
  color: var(--ds-color-text-faint);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.dark .compras-list__initials {
  background: rgba(18, 30, 49, 0.62);
  border-color: rgba(51, 71, 102, 0.76);
}

.compras-list__identity-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.compras-list__primary {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 560;
  line-height: 1.35;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compras-list__secondary {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 430;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compras-list__secondary-detail {
  margin-left: 0.5rem;
}

.compras-list__date {
  color: var(--ds-color-text);
  font-size: 0.8rem;
  font-weight: 520;
}

.compras-list__amount {
  color: var(--ds-color-text);
  font-size: 0.88rem;
  font-weight: 620;
  font-variant-numeric: tabular-nums;
}

.compras-list :deep(.ds-status-pill) {
  max-width: 100%;
  justify-content: center;
  padding-inline: 0.55rem;
  font-size: 0.6rem;
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .compras-list__identity {
    gap: 0.48rem;
  }

  .compras-list__initials {
    width: 1.9rem;
    height: 1.9rem;
  }
}
</style>
