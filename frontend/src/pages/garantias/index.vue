<template>
  <PageShell :padded="false">
    <section class="ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Garantias & Assistências"
        subtitle="Gerencie garantias, assistências técnicas e seus agendamentos"
        icon="pi pi-wrench"
      >
        <template #actions>
          <div class="garantias-list__actions">
            <div class="garantias-list__search-cluster">
              <div class="garantias-list__search">
                <SearchInput v-model="filtro" placeholder="Buscar cliente, título..." />
              </div>

              <button
                type="button"
                class="garantias-list__month-trigger"
                title="Filtrar por mês"
                @click="abrirSeletorMes"
              >
                <i class="pi pi-calendar" />
                <span>{{ filtroMesLabel }}</span>
                <input
                  ref="monthInputRef"
                  v-model="filtroMes"
                  type="month"
                  class="garantias-list__month-input"
                  @click.stop
                />
              </button>
            </div>

            <Button variant="primary" @click="router.push('/garantias/nova')">
              <i class="pi pi-plus" />
              Nova Garantia
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="ds-page-context__content px-4 md:px-8 pb-8">
        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          empty-text="Nenhuma garantia encontrada."
          :boxed="false"
          :flush="true"
        >
          <template #cell-cliente="{ row }">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-[var(--ds-color-surface-muted)] flex items-center justify-center text-xs font-black text-text-muted">
                {{ String(row.cliente_nome || '?').substring(0, 2).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <div class="text-sm font-semibold text-text-main truncate">{{ row.cliente_nome }}</div>
                <div class="text-[11px] text-text-muted truncate">{{ row.cliente_contato }}</div>
              </div>
            </div>
          </template>

          <template #cell-titulo="{ row }">
            <div class="text-sm font-medium text-text-main">{{ row.titulo }}</div>
            <div class="text-[11px] text-text-muted truncate max-w-[250px]">{{ row.descricao || '—' }}</div>
          </template>

          <template #cell-tipo="{ row }">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
              :class="row.tipo === 'GARANTIA'
                ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'"
            >
              {{ row.tipo === 'ASSISTENCIA' ? 'Assistência' : 'Garantia' }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
              :class="statusClass(row.status)"
            >
              {{ statusLabel(row.status) }}
            </span>
          </template>

          <template #cell-valores="{ row }">
            <div class="text-sm text-text-main">
              <span class="text-text-muted">Custo:</span> {{ moeda(row.custo) }}
            </div>
            <div class="text-sm text-text-main">
              <span class="text-text-muted">Venda:</span> {{ moeda(row.valor_venda) }}
            </div>
          </template>

          <template #cell-data="{ row }">
            <div class="text-sm text-text-main">{{ formatDate(row.data_abertura) }}</div>
            <div v-if="row.data_previsao" class="text-[11px] text-text-muted">
              Prev: {{ formatDate(row.data_previsao) }}
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <button
              type="button"
              class="ds-table-action inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-semibold text-brand-primary hover:bg-[var(--ds-color-surface-muted)]"
              @click="router.push(`/garantias/${row.id}`)"
            >
              <i class="pi pi-eye" />
              Detalhes
            </button>
          </template>
        </Table>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageShell from '@/components/ui/PageShell.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import Table from '@/components/ui/Table.vue'
import { GarantiaService } from '@/services'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'garantias.ver' } })

const router = useRouter()
const filtro = ref('')
const filtroMes = ref('')
const loading = ref(false)
const garantias = ref([])
const monthInputRef = ref(null)

const columns = [
  { key: 'cliente', label: 'CLIENTE' },
  { key: 'titulo', label: 'TÍTULO' },
  { key: 'tipo', label: 'TIPO' },
  { key: 'status', label: 'STATUS' },
  { key: 'valores', label: 'VALORES' },
  { key: 'data', label: 'DATA' },
  { key: 'acoes', label: '', align: 'right' },
]

const filteredGarantias = computed(() => {
  let list = garantias.value
  if (filtroMes.value) {
    list = list.filter((g) => sameMonth(g.data_abertura || g.data_previsao, filtroMes.value))
  }

  const termo = String(filtro.value || '').toLowerCase().trim()
  if (!termo) return list
  return list.filter(g => {
    const texto = [g.titulo, g.cliente?.nome_completo, g.descricao, g.processo]
      .filter(Boolean).join(' ').toLowerCase()
    return texto.includes(termo)
  })
})

const rows = computed(() =>
  filteredGarantias.value.map(g => ({
    ...g,
    cliente_nome: g.cliente?.nome_completo || 'Cliente',
    cliente_contato: g.cliente?.whatsapp || g.cliente?.telefone || '—',
  }))
)

const filtroMesLabel = computed(() => {
  if (!filtroMes.value) return 'Mes'
  const [ano, mes] = String(filtroMes.value).split('-')
  if (!ano || !mes) return 'Mes'
  return `${mes}/${ano}`
})

function statusLabel(s) {
  const map = { PENDENTE: 'Pendente', AGENDADA: 'Agendada', EM_ANDAMENTO: 'Em andamento', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada' }
  return map[s] || s
}

function statusClass(s) {
  const map = {
    PENDENTE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    AGENDADA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    EM_ANDAMENTO: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    CONCLUIDA: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    CANCELADA: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }
  return map[s] || 'bg-slate-100 text-slate-600'
}

function moeda(v) {
  const n = Number(v || 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function sameMonth(dateValue, monthValue) {
  if (!dateValue || !monthValue) return true
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}` === monthValue
}

function abrirSeletorMes() {
  const input = monthInputRef.value
  if (!input) return
  if (typeof input.showPicker === 'function') {
    input.showPicker()
    return
  }
  input.focus()
  input.click()
}

async function carregar() {
  loading.value = true
  try {
    const { data } = await GarantiaService.listar()
    garantias.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
    notify.error('Falha ao carregar garantias.')
    garantias.value = []
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
</script>

<style scoped>
.garantias-list__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

.garantias-list__search-cluster {
  display: flex;
  align-items: stretch;
  flex: 1 1 32rem;
  min-width: 20rem;
  max-width: 38rem;
}

.garantias-list__search {
  flex: 1 1 auto;
  min-width: 0;
}

.garantias-list__month-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 7.5rem;
  padding: 0 0.9rem;
  margin-left: 0.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: 0.9rem;
  background: var(--ds-color-surface);
  color: var(--ds-color-text-soft);
  font-size: 0.9rem;
  white-space: nowrap;
  cursor: pointer;
  outline: none;
}

.garantias-list__month-trigger:hover {
  border-color: var(--ds-color-border-strong);
  color: var(--ds-color-text);
}

.garantias-list__month-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

@media (max-width: 767px) {
  .garantias-list__actions {
    justify-content: stretch;
  }

  .garantias-list__search-cluster,
  .garantias-list__search,
  .garantias-list__month-trigger {
    min-width: 100%;
    max-width: none;
    width: 100%;
  }

  .garantias-list__month-trigger {
    min-height: 2.5rem;
    margin-left: 0.5rem;
  }
}
</style>
