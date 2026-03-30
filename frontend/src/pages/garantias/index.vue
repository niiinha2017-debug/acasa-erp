<template>
  <PageShell :padded="false">
    <section class="garantias-list ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Garantias & Assistências"
        subtitle="Gerencie garantias, assistências técnicas e seus agendamentos"
        icon="pi pi-wrench"
      >
        <template #actions>
          <div class="garantias-list__actions ds-page-context__actions">
            <div class="garantias-list__search ds-page-context__search">
              <SearchInput v-model="filtro" placeholder="Buscar cliente, título..." />
            </div>
            <div class="garantias-list__month-filter flex items-center gap-2">
              <MonthReferenceField
                v-model="filtroMes"
                class="garantias-list__month-field"
                label="Mês de referência"
                placeholder="Todos os meses"
              />
              <Button
                v-if="filtroMes"
                type="button"
                variant="ghost"
                size="sm"
                @click="filtroMes = ''"
              >
                Todos
              </Button>
            </div>

            <Button variant="primary" @click="router.push('/garantias/novo')">
              <i class="pi pi-plus" />
              Nova Garantia
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="garantias-list__content ds-page-context__content px-4 md:px-8 pb-8">
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
            <div class="garantias-list__row-actions">
              <button
                type="button"
                class="ds-table-action inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-semibold text-brand-primary hover:bg-[var(--ds-color-surface-muted)]"
                @click="router.push(`/garantias/${row.id}`)"
              >
                <i class="pi pi-pencil" />
                Editar
              </button>
              <button
                v-if="podeExcluirGarantia"
                type="button"
                class="ds-table-action inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-[var(--ds-color-surface-muted)]"
                @click="excluir(row)"
              >
                <i class="pi pi-trash" />
                Excluir
              </button>
            </div>
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
import MonthReferenceField from '@/components/ui/MonthReferenceField.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageShell from '@/components/ui/PageShell.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import Table from '@/components/ui/Table.vue'
import { GarantiaService } from '@/services'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'garantias.ver' } })

const router = useRouter()
const filtro = ref('')
const filtroMes = ref('')
const loading = ref(false)
const garantias = ref([])
const podeExcluirGarantia = can('garantias.deletar')

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

async function excluir(row) {
  const titulo = row?.titulo || 'esta garantia'
  const ok = await confirm.show('Excluir garantia', `Deseja excluir "${titulo}"?`)
  if (!ok) return

  try {
    await GarantiaService.remover(row.id)
    notify.success('Garantia excluída.')
    await carregar()
  } catch (e) {
    console.error(e)
    notify.error(e?.response?.data?.message || 'Falha ao excluir garantia.')
  }
}

onMounted(carregar)
</script>

<style scoped>
.garantias-list__content {
  padding-top: 0.25rem;
}

.garantias-list__row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.35rem;
}

@media (max-width: 767px) {
  .garantias-list__month-filter,
  .garantias-list__search,
  .garantias-list__month-field {
    min-width: 100%;
    max-width: none;
    width: 100%;
  }

  .garantias-list__month-filter {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
}
</style>
