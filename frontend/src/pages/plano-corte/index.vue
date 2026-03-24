<template>
  <PageShell :padded="false">
    <section class="plano-corte-list ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Serviço de Corte"
        subtitle="Corte para fornecedor — industrialização e controle de produção"
        icon="pi pi-sitemap"
        :show-back="false"
      >
        <template #actions>
          <div class="plano-corte-list__actions ds-page-context__actions">
            <div class="plano-corte-list__search ds-page-context__search">
              <SearchInput
                v-model="busca"
                placeholder="Buscar fornecedor, lote ou venda..."
              />
            </div>
            <div class="plano-corte-list__month-filter flex items-center gap-2">
              <MonthReferenceField
                v-model="mesFiltro"
                class="plano-corte-list__month-field"
                label="Mês de referência"
                placeholder="Todos os meses"
              />
              <Button
                v-if="mesFiltro"
                type="button"
                variant="ghost"
                size="sm"
                @click="mesFiltro = ''"
              >
                Todos
              </Button>
            </div>
            <Button
              v-if="can('plano_corte.criar')"
              variant="primary"
              @click="novo()"
            >
              <i class="pi pi-plus"></i>
              Novo Serviço
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="plano-corte-list__content ds-page-context__content">
        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          empty-text="Nenhum serviço de corte encontrado."
          :boxed="false"
          :flush="false"
        >
          <template #cell-fornecedor="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-sm font-bold text-text-main uppercase tracking-tight">
                {{ row.fornecedor?.nome_fantasia || 'Interno' }}
              </span>
              <span class="text-[10px] font-medium text-text-muted" v-if="row.venda_id">
                Venda #{{ row.venda_id }}
              </span>
            </div>
          </template>

          <template #cell-valor_total="{ row }">
            <span class="text-sm font-bold text-text-main tabular-nums">{{ format.currency(row.valor_total ?? 0) }}</span>
          </template>

          <template #cell-data="{ row }">
            <span class="text-xs font-bold text-text-main">{{ format.date(row.criado_em || row.created_at) }}</span>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status || 'EM_PROCESSO'" />
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
              <TableActions
                :id="row.id"
                perm-edit="plano_corte.editar"
                perm-delete="plano_corte.excluir"
                @edit="(id) => router.push(`/plano-corte/${id}`)"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MonthReferenceField from '@/components/ui/MonthReferenceField.vue'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import api from '@/services/api'
import { format } from '@/utils/format'

definePage({ meta: { perm: 'plano_corte.ver' } })

const router = useRouter()
const loading = ref(false)
const rows = ref([])
const busca = ref('')
const mesFiltro = ref('')

// Inicialmente "todos os meses" para exibir a lista inteira; usuário pode filtrar por mês
mesFiltro.value = ''

const columns = [
  { key: 'fornecedor', label: 'FORNECEDOR / ORIGEM', width: '35%' },
  { key: 'data', label: 'DATA', width: '15%' },
  { key: 'valor_total', label: 'VALOR TOTAL', width: '15%', align: 'right' },
  { key: 'status', label: 'STATUS', width: '15%' },
  { key: 'acoes', label: 'Ações', align: 'center', width: '15%' },
]

const filtradas = computed(() => {
  const f = String(busca.value || '').toLowerCase().trim()
  const dataRef = (r) => r.criado_em || r.created_at || ''
  return rows.value.filter((r) => {
    const dataStr = dataRef(r)
    const dataRow = dataStr ? String(dataStr).substring(0, 7) : ''
    if (mesFiltro.value && dataRow !== mesFiltro.value) return false
    if (!f) return true
    const forn = String(r.fornecedor?.nome_fantasia || '').toLowerCase()
    const lote = String(r.lote || '').toLowerCase()
    return forn.includes(f) || lote.includes(f)
  })
})

const totalVendido = computed(() => {
  return filtradas.value.reduce((a, b) => a + Number(b.valor_total ?? 0), 0)
})

async function carregar() {
  if (!can('plano_corte.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const { data } = await api.get('/plano-corte')
    rows.value = Array.isArray(data) ? data : []
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || 'Erro ao listar serviços de corte.'
    notify.error(msg)
    console.error('[Serviço de Corte] Erro ao carregar:', e?.response?.data || e)
  } finally {
    loading.value = false
  }
}

function novo() {
  router.push('/plano-corte/novo')
}

async function confirmarExcluir(row) {
  if (!can('plano_corte.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir Serviço de Corte', 'Deseja remover este serviço de corte?')
  if (!ok) return
  try {
    await api.delete(`/plano-corte/${row.id}`)
    notify.success('Serviço de corte removido.')
    await carregar()
  } catch {
    notify.error('Erro ao remover.')
  }
}

onMounted(carregar)
</script>

<style scoped>
.plano-corte-list__month-field {
  min-width: 9.5rem;
}
</style>
