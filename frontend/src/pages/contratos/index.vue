<template>
  <PageShell :padded="false">
    <section class="contratos-list ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Contratos"
        subtitle="Gestão de contratos comerciais"
        icon="pi pi-file"
      >
        <template #actions>
          <div class="contratos-list__actions ds-page-context__actions">
            <div class="contratos-list__search ds-page-context__search">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar por nome do cliente..."
              />
            </div>
            <Button
              v-if="can('contratos.criar')"
              variant="primary"
              @click="router.push('/contratos/novo')"
            >
              <i class="pi pi-plus" />
              Novo contrato
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="contratos-list__content ds-page-context__content">
        <div v-if="loading" class="text-center py-10">
          <i class="pi pi-spin pi-spinner text-2xl text-text-soft" />
        </div>

        <template v-else>
          <!-- Resumo no mesmo “tom” da barra de totais de Orçamentos -->
          <div class="contratos-list__summary-strip" aria-label="Resumo de contratos">
            <div class="contratos-list__summary-item">
              <span class="contratos-list__summary-label">Total de contratos</span>
              <span class="contratos-list__summary-value">{{ contratos.length }}</span>
            </div>
            <div class="contratos-list__summary-item">
              <span class="contratos-list__summary-label">Valor total</span>
              <span class="contratos-list__summary-value contratos-list__summary-value--accent">
                {{ format.currency(valorTotalGeral) }}
              </span>
            </div>
            <div class="contratos-list__summary-item">
              <span class="contratos-list__summary-label">Vigentes</span>
              <span class="contratos-list__summary-value">{{ resumo.vigentes }}</span>
            </div>
            <div class="contratos-list__summary-item">
              <span class="contratos-list__summary-label">Encerrados</span>
              <span class="contratos-list__summary-value">{{ resumo.encerrados }}</span>
            </div>
          </div>

          <div class="contratos-list__clientes">
            <h2 class="contratos-list__eyebrow">Clientes com contratos</h2>

            <div v-if="gruposFiltrados.length > 0" class="contratos-list__total-bar">
              <span class="contratos-list__total-label">Valor total da lista</span>
              <span class="contratos-list__total-value">{{ format.currency(valorTotalLista) }}</span>
            </div>

            <div v-if="gruposFiltrados.length === 0" class="contratos-list__empty">
              <p>
                {{ filtro ? 'Nenhum cliente encontrado para a busca.' : 'Nenhum cliente com contrato.' }}
              </p>
            </div>

            <div v-else class="contratos-list__grupo-list">
              <div
                v-for="grupo in rowsToShow"
                :key="grupo.clienteId"
                class="contratos-list__grupo-row"
              >
                <div class="contratos-list__grupo-identity">
                  <div class="contratos-list__grupo-count">
                    {{ grupo.contratos.length }}
                  </div>
                  <div class="contratos-list__grupo-copy">
                    <span class="contratos-list__grupo-primary">{{ grupo.clienteNome }}</span>
                    <span class="contratos-list__grupo-secondary">
                      {{ grupo.contratos.length }} contrato(s) · {{ format.currency(grupo.total) }}
                    </span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  @click="router.push(`/contratos/cliente/${grupo.clienteId}`)"
                >
                  <i class="pi pi-list mr-1" />
                  Abrir lista
                </Button>
              </div>
              <TablePagination
                v-if="total > 0"
                flush
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
import { ContratosService } from '@/services/index'
import { format } from '@/utils/format'
import { usePagination } from '@/composables/usePagination'

definePage({ meta: { perm: 'contratos.ver' } })

const router = useRouter()
const loading = ref(false)
const contratos = ref([])
const filtro = ref('')

const grupos = computed(() => {
  const map = {}
  ;(contratos.value || []).forEach((c) => {
    const cliId = c.cliente_id ?? 'avulso'
    if (!map[cliId]) {
      map[cliId] = {
        clienteId: cliId,
        clienteNome:
          c.cliente?.nome_completo || c.cliente?.razao_social || c.cliente?.nome || 'Cliente não identificado',
        contratos: [],
        total: 0,
      }
    }
    map[cliId].contratos.push(c)
    map[cliId].total += Number(c.valor || 0)
  })
  return Object.values(map).sort((a, b) => (b.contratos[0]?.id || 0) - (a.contratos[0]?.id || 0))
})

const gruposFiltrados = computed(() => {
  const termo = String(filtro.value || '').trim().toLowerCase()
  if (!termo) return grupos.value
  return grupos.value.filter((g) => (g.clienteNome || '').toLowerCase().includes(termo))
})

const { page, setPage, total, pageSize, rowsToShow } = usePagination(gruposFiltrados, { pageSize: 15 })
watch(filtro, () => setPage(1))

const valorTotalGeral = computed(() =>
  contratos.value.reduce((acc, c) => acc + Number(c.valor || 0), 0),
)

const valorTotalLista = computed(() =>
  gruposFiltrados.value.reduce((acc, g) => acc + Number(g.total || 0), 0),
)

const resumo = computed(() => ({
  vigentes: contratos.value.filter((c) => String(c.status).toUpperCase() === 'VIGENTE').length,
  encerrados: contratos.value.filter((c) => String(c.status).toUpperCase() === 'ENCERRADO').length,
}))

async function carregar() {
  if (!can('contratos.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const { data } = await ContratosService.listar()
    contratos.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar contratos.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!can('contratos.ver')) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }
  await carregar()
})
</script>

<style scoped>
.contratos-list {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: var(--ds-font-sans);
}

.contratos-list__summary-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  align-items: flex-end;
  padding: 0.65rem 1rem;
  margin-bottom: 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--ds-color-border);
  background: color-mix(in srgb, var(--ds-color-page) 50%, transparent);
}

.contratos-list__summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 7.5rem;
}

.contratos-list__summary-label {
  color: var(--ds-color-text-soft);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.contratos-list__summary-value {
  color: var(--ds-color-text);
  font-size: 1.05rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.contratos-list__summary-value--accent {
  color: var(--ds-color-primary);
}

.contratos-list__clientes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contratos-list__eyebrow {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.contratos-list__total-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--ds-color-border);
  background: color-mix(in srgb, var(--ds-color-page) 50%, transparent);
}

.contratos-list__total-label {
  color: var(--ds-color-text-soft);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.contratos-list__total-value {
  color: var(--ds-color-text);
  font-size: 1.1rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.contratos-list__empty {
  padding: 3rem 1rem;
  text-align: center;
  border-radius: 0.75rem;
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-page);
  color: var(--ds-color-text-soft);
  font-size: 0.875rem;
}

.contratos-list__grupo-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contratos-list__grupo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.25rem;
  border-bottom: 1px solid var(--ds-color-border);
  transition: background-color 0.18s ease;
}

.contratos-list__grupo-row:last-child {
  border-bottom: none;
}

.contratos-list__grupo-row:hover {
  background: color-mix(in srgb, var(--ds-color-primary) 4%, transparent);
}

.contratos-list__grupo-identity {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.contratos-list__grupo-count {
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

.contratos-list__grupo-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.contratos-list__grupo-primary {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 540;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contratos-list__grupo-secondary {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 430;
  line-height: 1.45;
}

@media (max-width: 768px) {
  .contratos-list__grupo-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
