<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Despesas Gerais"
        subtitle="Registro de despesas e receitas"
        icon="pi pi-wallet"
      >
        <template #actions>
          <div class="flex flex-wrap items-end gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-48 order-1 sm:order-0">
              <SearchInput
                v-model="filtro"
                placeholder="Buscar descrição ou categoria..."
              />
            </div>
            <div class="w-full sm:w-40">
              <label class="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">Início</label>
              <input
                v-model="filtros.data_ini"
                type="date"
                class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/10 text-slate-700"
              />
            </div>
            <div class="w-full sm:w-40">
              <label class="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">Fim</label>
              <input
                v-model="filtros.data_fim"
                type="date"
                class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/10 text-slate-700"
              />
            </div>
            <Button @click="carregar" variant="outline" size="sm" class="!h-10">
              <i class="pi pi-search mr-2"></i>
              Buscar
            </Button>

            <Button
              v-if="can('despesas.criar')"
              variant="primary"
              size="sm"
              @click="novo"
            >
              <i class="pi pi-plus text-xs mr-2"></i>
              Novo lançamento
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            label="Saldo"
            :value="format.currency(totalEntradas - totalSaidas)"
            icon="pi pi-wallet"
            color="slate"
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
            <div class="flex flex-col py-1 gap-0.5">
              <span class="text-sm font-medium text-text-main">{{ row.descricao }}</span>
              <span class="text-xs text-text-soft">{{ row.categoria || 'Geral' }}</span>
            </div>
          </template>

          <template #cell-tipo="{ row }">
            <span
              class="text-xs font-medium px-2 py-1 rounded-lg border"
              :class="row.tipo === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'"
            >
              {{ row.tipo }}
            </span>
          </template>

          <template #cell-data="{ row }">
            <span class="text-sm text-text-main">{{ format.date(row.data) }}</span>
          </template>

          <template #cell-valor="{ row }">
            <span
              class="text-sm font-medium tabular-nums"
              :class="row.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'"
            >
              {{ row.tipo === 'SAIDA' ? '−' : '' }}{{ format.currency(row.valor) }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <span
              class="text-xs font-medium px-2 py-1 rounded-lg border"
              :class="row.status === 'PAGO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : row.status === 'VENCIDO' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-200'"
            >
              {{ row.status || 'EM_ABERTO' }}
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

function mesAtual() {
  const d = new Date()
  const ini = new Date(d.getFullYear(), d.getMonth(), 1)
  const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return {
    data_ini: ini.toISOString().slice(0, 10),
    data_fim: fim.toISOString().slice(0, 10),
  }
}

const router = useRouter()
const loading = ref(false)
const despesas = ref([])
const filtro = ref('')
const filtros = ref(mesAtual())

const columns = [
  { key: 'descricao', label: 'DESCRIÇÃO', width: '35%' },
  { key: 'tipo', label: 'TIPO', width: '12%' },
  { key: 'data', label: 'DATA', width: '13%' },
  { key: 'valor', label: 'VALOR', width: '13%', align: 'right' },
  { key: 'status', label: 'STATUS', width: '12%' },
  { key: 'acoes', label: '', align: 'right', width: '15%' }
]

const despesasExibir = computed(() =>
  despesas.value.map(d => {
    const base = d.local || d.categoria || '—'
    const parcela = d.parcelas_total > 1 && d.parcela_numero
      ? ` — ${d.parcela_numero}/${d.parcelas_total}`
      : ''
    return {
      ...d,
      descricao: base + parcela,
      tipo: d.tipo_movimento || d.tipo,
      data: d.data_vencimento || d.data_registro || d.data,
      valor: d.valor_total ?? d.valor,
    }
  })
)

const filtradas = computed(() => {
  const f = String(filtro.value || '').toLowerCase().trim()
  if (!f) return despesasExibir.value
  return despesasExibir.value.filter(d => {
    const desc = String(d.descricao || '').toLowerCase()
    const cat = String(d.categoria || '').toLowerCase()
    return desc.includes(f) || cat.includes(f)
  })
})

const totalEntradas = computed(() => despesasExibir.value.filter(d => (d.tipo || d.tipo_movimento) === 'ENTRADA').reduce((a, b) => a + Number((b.valor ?? b.valor_total) ?? 0), 0))
const totalSaidas = computed(() => despesasExibir.value.filter(d => (d.tipo || d.tipo_movimento) === 'SAIDA').reduce((a, b) => a + Number((b.valor ?? b.valor_total) ?? 0), 0))

async function carregar() {
  if (!can('despesas.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const params = {}
    if (filtros.value.data_ini) params.data_ini = filtros.value.data_ini
    if (filtros.value.data_fim) params.data_fim = filtros.value.data_fim
    const { data } = await api.get('/despesas', { params })
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
  const ok = await confirm.show('Excluir Registro', `Deseja remover "${row.local || row.categoria || row.descricao || 'este registro'}"?`)
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
