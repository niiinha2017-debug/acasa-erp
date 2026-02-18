<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Plano de Corte"
        subtitle="Industrialização e controle de produção"
        icon="pi pi-sitemap"
        :show-back="false"
      >
        <template #actions>
          <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <div class="flex-1 sm:flex-initial sm:w-48 min-w-0 order-2 sm:order-1">
              <SearchInput
                v-model="busca"
                placeholder="Buscar..."
              />
            </div>
            <input
              v-model="mesFiltro"
              type="month"
              class="h-9 px-3 rounded-lg text-xs font-medium text-text-main bg-bg-card border border-border-ui focus:ring-1 focus:ring-brand-primary/20 focus:border-brand-primary/50 outline-none transition-colors order-1 sm:order-2"
            />
            <Button
              v-if="can('plano_corte.criar')"
              variant="ghost"
              size="sm"
              @click="novo()"
              class="order-3 text-text-soft hover:text-brand-primary"
            >
              <i class="pi pi-plus"></i>
              Novo
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Planos Ativos"
            :value="rows.length"
            icon="pi pi-cog"
            color="slate"
          />
          <MetricCard
            label="Vínculados a Vendas"
            :value="rows.filter(r => r.venda_id).length"
            icon="pi pi-shopping-cart"
            color="blue"
          />
          <MetricCard
            label="Total Vendido"
            :value="format.currency(totalVendido)"
            icon="pi pi-dollar"
            color="emerald"
          />
          <MetricCard
            label="Finalizados"
            :value="rows.filter(r => r.status === 'FINALIZADO').length"
            icon="pi pi-check"
            color="amber"
          />
        </div>

        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          empty-text="Nenhum plano de corte encontrado."
          :boxed="false"
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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

const hoje = new Date()
const mes = String(hoje.getMonth() + 1).padStart(2, '0')
const ano = hoje.getFullYear()
mesFiltro.value = `${ano}-${mes}`

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
    notify.error('Erro ao listar planos de corte.')
  } finally {
    loading.value = false
  }
}

function novo() {
  router.push('/plano-corte/novo')
}

async function confirmarExcluir(row) {
  if (!can('plano_corte.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir Plano', 'Deseja remover este plano de corte?')
  if (!ok) return
  try {
    await api.delete(`/plano-corte/${row.id}`)
    notify.success('Plano removido.')
    await carregar()
  } catch {
    notify.error('Erro ao remover.')
  }
}

onMounted(carregar)
</script>
