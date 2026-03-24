<template>
  <PageShell :padded="false">
    <section class="orcamentos-list ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Orçamentos"
        subtitle="Controle de propostas comerciais e negociações"
        icon="pi pi-briefcase"
      >
        <template #actions>
          <div class="orcamentos-list__actions ds-page-context__actions">
            <div class="orcamentos-list__search ds-page-context__search">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar por nome do cliente..."
              />
            </div>
            <Button
              v-if="can('orcamentos.criar')"
              variant="primary"
              @click="novoGeral"
            >
              <i class="pi pi-plus"></i>
              Novo Orçamento
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="orcamentos-list__content ds-page-context__content">
        <div v-if="loading" class="text-center py-10">
          <i class="pi pi-spin pi-spinner text-2xl text-text-soft"></i>
        </div>

        <template v-else>
          <div class="orcamentos-list__clientes">
            <h2 class="orcamentos-list__eyebrow">Clientes com orçamentos</h2>

            <div v-if="gruposFiltrados.length > 0" class="orcamentos-list__total-bar">
              <span class="orcamentos-list__total-label">Valor total da lista</span>
              <span class="orcamentos-list__total-value">{{ format.currency(valorTotalLista) }}</span>
            </div>

            <div v-if="gruposFiltrados.length === 0" class="orcamentos-list__empty">
              <p>{{ filtro ? 'Nenhum cliente encontrado para a busca.' : 'Nenhum cliente com orçamento.' }}</p>
            </div>

            <div v-else class="orcamentos-list__grupo-list">
              <div
                v-for="grupo in rowsToShow"
                :key="grupo.clienteId"
                class="orcamentos-list__grupo-row"
              >
                <div class="orcamentos-list__grupo-identity">
                  <div class="orcamentos-list__grupo-count">
                    {{ grupo.orcamentos.length }}
                  </div>
                  <div class="orcamentos-list__grupo-copy">
                    <span class="orcamentos-list__grupo-primary">{{ grupo.clienteNome }}</span>
                    <span class="orcamentos-list__grupo-secondary">
                      {{ grupo.orcamentos.length }} orçamento(s) · {{ format.currency(grupo.total) }}
                    </span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  @click="router.push(`/orcamentos/cliente/${grupo.clienteId}`)"
                >
                  <i class="pi pi-list mr-1"></i>
                  Abrir lista
                </Button>
              </div>
              <TablePagination
                flush
                v-if="total > 0"
                :page="page"
                :page-size="pageSize"
                :total="total"
                @update:page="setPage"
              />
            </div>
          </div>
        </template>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import api from '@/services/api'
import { format } from '@/utils/format'
import { usePagination } from '@/composables/usePagination'

definePage({ meta: { perm: 'orcamentos.ver' } })

const router = useRouter()
const loading = ref(true)
const rows = ref([])
const filtro = ref('')

const grupos = computed(() => {
  const map = {}
  ;(rows.value || []).forEach(orc => {
    const cliId = orc.cliente_id || 'avulso'
    if (!map[cliId]) {
      map[cliId] = {
        clienteId: cliId,
        clienteNome: orc.cliente?.nome_completo || orc.cliente?.nome || 'Cliente não identificado',
        orcamentos: [],
        total: 0,
      }
    }
    map[cliId].orcamentos.push(orc)
    map[cliId].total += Number(orc.total_itens ?? orc.valor_total ?? 0)
  })
  return Object.values(map).sort((a, b) => (b.orcamentos[0]?.id || 0) - (a.orcamentos[0]?.id || 0))
})

const gruposFiltrados = computed(() => {
  const termo = String(filtro.value || '').trim().toLowerCase()
  if (!termo) return grupos.value
  return grupos.value.filter((g) => (g.clienteNome || '').toLowerCase().includes(termo))
})

const { page, setPage, total, totalPages, pageSize, rowsToShow } = usePagination(
  gruposFiltrados,
  { pageSize: 15 },
)
watch(filtro, () => setPage(1))

const valorTotalGeral = computed(() =>
  rows.value.reduce((acc, r) => acc + Number(r.total_itens ?? r.valor_total ?? 0), 0)
)

const valorTotalLista = computed(() =>
  gruposFiltrados.value.reduce((acc, g) => acc + Number(g.total || 0), 0)
)

async function carregar() {
  if (!can('orcamentos.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const { data } = await api.get('/orcamentos')
    rows.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar orçamentos.')
  } finally {
    loading.value = false
  }
}

function novoGeral() {
  router.push('/orcamentos/novo')
}

onMounted(carregar)
</script>

<style scoped>
.orcamentos-list {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: var(--ds-font-sans);
}

.orcamentos-list__clientes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.orcamentos-list__eyebrow {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.orcamentos-list__total-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--ds-color-border);
  background: color-mix(in srgb, var(--ds-color-page) 50%, transparent);
}

.orcamentos-list__total-label {
  color: var(--ds-color-text-soft);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.orcamentos-list__total-value {
  color: var(--ds-color-text);
  font-size: 1.1rem;
  font-weight: 800;
}

.orcamentos-list__empty {
  padding: 3rem 1rem;
  text-align: center;
  border-radius: 0.75rem;
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-page);
  color: var(--ds-color-text-soft);
  font-size: 0.875rem;
}

.orcamentos-list__grupo-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.orcamentos-list__grupo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.25rem;
  border-bottom: 1px solid var(--ds-color-border);
  transition: background-color 0.18s ease;
}

.orcamentos-list__grupo-row:last-child {
  border-bottom: none;
}

.orcamentos-list__grupo-row:hover {
  background: color-mix(in srgb, var(--ds-color-primary) 4%, transparent);
}

.orcamentos-list__grupo-identity {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.orcamentos-list__grupo-count {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  font-size: 0.875rem;
  font-weight: 800;
  flex-shrink: 0;
}

.orcamentos-list__grupo-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.orcamentos-list__grupo-primary {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 540;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.orcamentos-list__grupo-secondary {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 430;
  line-height: 1.45;
}

@media (max-width: 768px) {
  .orcamentos-list__grupo-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
