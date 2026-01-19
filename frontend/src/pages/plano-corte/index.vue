<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-700">
    
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    
    <Card hoverable class="p-6 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
        <i class="pi pi-list text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Planos</p>
        <p class="text-2xl font-black text-[var(--text-main)]">{{ planos.length }}</p>
      </div>
    </Card>

    <Card hoverable class="p-6 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
        <i class="pi pi-check-circle text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Finalizados</p>
        <p class="text-2xl font-black text-[var(--text-main)]">{{ totalFinalizados }}</p>
      </div>
    </Card>

    <Card 
      hoverable 
      :active="totalEmAberto > 0"
      class="p-6 flex items-center gap-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
        <i class="pi pi-clock text-xl animate-pulse"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-amber-500">Em Aberto / Produção</p>
        <p class="text-2xl font-black text-amber-600">{{ totalEmAberto }}</p>
      </div>
    </Card>

  </div>

    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-[var(--border-ui)]">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-8 border-b border-[var(--border-ui)] bg-slate-500/5">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <i class="pi pi-box"></i>
          </div>
          <div>
            <h2 class="text-xl font-black tracking-tight text-[var(--text-main)] uppercase">Plano de Corte</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vendas e Industrialização por Fornecedor</p>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="relative flex-1 md:w-80">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              v-model="busca" 
              type="text" 
              placeholder="Buscar fornecedor ou pedido..."
              class="w-full pl-10 pr-4 h-11 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
            />
          </div>
          
          <Button variant="primary" class="!h-11 !rounded-2xl !px-6 shadow-xl shadow-brand-primary/20" @click="router.push('/plano-corte/novo')">
            <i class="pi pi-plus mr-2 text-xs"></i>
            Novo Plano
          </Button>
        </div>
      </header>

      <div class="p-4">
        <Table
          :columns="columns"
          :rows="rowsFiltrados"
          :loading="loading"
          empty-text="Nenhum plano de corte encontrado."
          class="!border-none"
        >
          <template #cell-fornecedor="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">
                {{ row.fornecedor?.razao_social || 'Fornecedor não Identificado' }}
              </span>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[9px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md uppercase">
                  Pedido #{{ row.numero_pedido || 'S/N' }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-data="{ row }">
            <div class="flex flex-col">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-tighter">Data Emissão</span>
              <span class="text-sm font-black text-[var(--text-main)]">
                {{ row.data ? new Date(row.data).toLocaleDateString('pt-BR') : '-' }}
              </span>
            </div>
          </template>

          <template #cell-total="{ row }">
            <div class="flex flex-col">
              <span class="text-[9px] font-black text-brand-primary uppercase tracking-widest">Valor Total</span>
              <span class="text-base font-black text-[var(--text-main)] tracking-tight">
                {{ maskMoneyBR(row.valor_total || 0) }}
              </span>
            </div>
          </template>

          <template #cell-status="{ row }">
            <div 
              class="inline-flex items-center gap-2 rounded-xl px-4 py-2 border transition-all"
              :class="statusClassTailwind(row.status)"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
              <span class="text-[10px] font-black uppercase tracking-widest">
                {{ row.status }}
              </span>
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <button 
                @click="router.push(`/plano-corte/${row.id}`)"
                class="p-2.5 rounded-xl bg-slate-500/10 text-slate-500 hover:bg-brand-primary hover:text-white transition-all shadow-sm"
              >
                <i class="pi pi-pencil text-xs"></i>
              </button>
              <button 
                @click="excluir(row)"
                class="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          </template>
        </Table>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { maskMoneyBR } from '@/utils/masks'

const router = useRouter()
const busca = ref('')
const loading = ref(false)
const planos = ref([])

const columns = [
  { key: 'fornecedor', label: 'Fornecedor / Detalhes' },
  { key: 'data', label: 'Emissão', width: '150px' },
  { key: 'total', label: 'Financeiro', width: '160px' },
  { key: 'status', label: 'Situação', width: '160px', align: 'center' },
  { key: 'acoes', label: '', width: '120px', align: 'right' }
]

// INDICADORES DE DASHBOARD
const totalFinalizados = computed(() => {
  return planos.value.filter(p => ['CONCLUIDO', 'FINALIZADO'].includes(p.status?.toUpperCase())).length
})

const totalEmAberto = computed(() => {
  return planos.value.length - totalFinalizados.value
})

const rowsFiltrados = computed(() => {
  const termo = (busca.value || '').toLowerCase().trim()
  if (!termo) return planos.value
  return planos.value.filter(p => {
    return (p.fornecedor?.razao_social?.toLowerCase().includes(termo)) || 
           (p.status?.toLowerCase().includes(termo)) || 
           (String(p.numero_pedido).includes(termo))
  })
})

function statusClassTailwind(status) {
  const s = String(status || '').toUpperCase()
  if (['CONCLUIDO', 'FINALIZADO'].includes(s)) 
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  if (s === 'CANCELADO') 
    return 'bg-red-500/10 text-red-500 border-red-500/20'
  if (['EM_PRODUCAO', 'EM PRODUCAO', 'ABERTO'].includes(s)) 
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
}

async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get('/plano-corte')
    planos.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function excluir(plano) {
  if (!confirm(`Excluir plano #${plano.numero_pedido}?`)) return
  try {
    await api.delete(`/plano-corte/${plano.id}`)
    planos.value = planos.value.filter(p => p.id !== plano.id)
  } catch (err) {
    alert('Erro ao excluir.')
  }
}

onMounted(carregar)
</script>