<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-page-in">
    
    <PageHeader 
      title="Fluxo Financeiro"
      subtitle="Registro de despesas e movimentações"
      icon="pi pi-chart-line"
    >
      <template #actions>
        <Button
          v-if="can('despesas.criar')"
          variant="primary"
          @click="novo"
        >
          <i class="pi pi-plus mr-2"></i>
          Nova
        </Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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

    <div class="space-y-4">
      <div class="w-full md:w-96">
        <SearchInput
          v-model="filtro"
          placeholder="Buscar descrição ou categoria..."
        />
      </div>

      <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          empty-text="Nenhuma movimentação registrada."
          :boxed="false"
        >
          <template #cell-descricao="{ row }">
             <div class="flex flex-col py-1">
               <span class="text-sm font-bold text-slate-800 uppercase tracking-tight">{{ row.descricao }}</span>
               <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ row.categoria || 'Geral' }}</span>
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
            <span class="text-xs font-bold text-slate-700">{{ format.date(row.data) }}</span>
          </template>

          <template #cell-valor="{ row }">
             <span 
               class="text-sm font-black tabular-nums"
               :class="row.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'"
             >
               {{ row.tipo === 'SAIDA' ? '-' : '' }}{{ format.currency(row.valor) }}
             </span>
          </template>

          <template #cell-acoes="{ row }">
             <TableActions
                :can-edit="can('despesas.editar')"
                :can-delete="can('despesas.excluir')"
                @edit="editar(row)"
                @delete="confirmarExcluir(row)"
              />
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
