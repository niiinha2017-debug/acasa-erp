<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Fluxo Financeiro"
        subtitle="Registro de despesas e movimentações"
        icon="pi pi-chart-line"
        :show-back="false"
      >
        <template #actions>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-64 order-1 sm:order-0">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar descrição ou categoria..."
              />
            </div>

            <Button
              v-if="can('despesas.criar')"
              variant="primary"
              @click="novo"
            >
              <i class="pi pi-plus mr-2"></i>
              Nova
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Saldo"
            :value="format.currency(totalEntradas - totalSaidas)"
            icon="pi pi-wallet"
            color="slate"
          />
          <MetricCard
            label="Entradas"
            :value="format.currency(totalEntradas)"
            icon="pi pi-arrow-up"
            color="emerald"
          />
          <MetricCard
            label="Saídas"
            :value="format.currency(totalSaidas)"
            icon="pi pi-arrow-down"
            color="rose"
          />
          <MetricCard
            label="Média Mensal"
            :value="format.currency((totalEntradas - totalSaidas) / 12)"
            icon="pi pi-calendar"
            color="blue"
          />
        </div>

        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          empty-text="Nenhuma movimentação registrada."
          :boxed="false"
        >
          <template #cell-descricao="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-sm font-bold text-text-main uppercase tracking-tight">{{ row.descricao }}</span>
              <span class="text-[10px] font-medium text-text-muted uppercase tracking-wider">{{ row.categoria || 'Geral' }}</span>
            </div>
          </template>

          <template #cell-tipo="{ row }">
            <span
              class="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border"
              :class="row.tipo === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'"
            >
              {{ row.tipo }}
            </span>
          </template>

          <template #cell-data="{ row }">
            <span class="text-xs font-bold text-text-main">{{ format.date(row.data) }}</span>
          </template>

          <template #cell-valor="{ row }">
            <span
              class="text-sm font-bold tabular-nums"
              :class="row.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'"
            >
              {{ row.tipo === 'SAIDA' ? '-' : '' }}{{ format.currency(row.valor) }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-center">
              <TableActions
                :id="row.id"
                perm-edit="despesas.editar"
                perm-delete="despesas.excluir"
                @edit="() => editar(row)"
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
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import api from '@/services/api' // Ajuste se usar Service específico
import { format } from '@/utils/format'

definePage({ meta: { perm: 'despesas.ver' } })

const router = useRouter()
const loading = ref(false)
const despesas = ref([])
const filtro = ref('')

const columns = [
  { key: 'descricao', label: 'DESCRIÇÃO', width: '40%' },
  { key: 'tipo', label: 'TIPO', width: '15%' },
  { key: 'data', label: 'DATA', width: '15%' },
  { key: 'valor', label: 'VALOR', width: '15%', align: 'right' },
  { key: 'acoes', label: '', align: 'right', width: '15%' }
]

const filtradas = computed(() => {
  const f = String(filtro.value || '').toLowerCase().trim()
  if (!f) return despesas.value
  return despesas.value.filter(d => {
    const desc = String(d.descricao || '').toLowerCase()
    const cat = String(d.categoria || '').toLowerCase()
    return desc.includes(f) || cat.includes(f)
  })
})

const totalEntradas = computed(() => despesas.value.filter(d => d.tipo === 'ENTRADA').reduce((a, b) => a + Number(b.valor || 0), 0))
const totalSaidas = computed(() => despesas.value.filter(d => d.tipo === 'SAIDA').reduce((a, b) => a + Number(b.valor || 0), 0))

async function carregar() {
  if (!can('despesas.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const { data } = await api.get('/despesas')
    despesas.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar despesas.')
  } finally {
    loading.value = false
  }
}

function novo() {
  // Ajuste a rota conforme seu router
  router.push('/despesas/novo')
}

function editar(row) {
  router.push(`/despesas/${row.id}`)
}

async function confirmarExcluir(row) {
  if (!can('despesas.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir Registro', `Deseja remover "${row.descricao}"?`)
  if (!ok) return

  try {
    await api.delete(`/despesas/${row.id}`)
    notify.success('Registro removido.')
    await carregar()
  } catch {
    notify.error('Erro ao excluir.')
  }
}

onMounted(carregar)
</script>
