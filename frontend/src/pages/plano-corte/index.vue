<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card hoverable class="p-6 flex items-center gap-5 border-none shadow-sm bg-white/80 backdrop-blur">
        <div class="w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shadow-inner">
          <i class="pi pi-list text-2xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total de Planos</p>
          <p class="text-3xl font-black text-slate-800">{{ planos.length }}</p>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-5 border-none shadow-sm bg-white/80 backdrop-blur">
        <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
          <i class="pi pi-check-circle text-2xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Finalizados</p>
          <p class="text-3xl font-black text-slate-800">{{ totalFinalizados }}</p>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-5 border-none shadow-sm bg-white/80 backdrop-blur">
        <div class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
          <i class="pi pi-clock text-2xl animate-pulse"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Em Aberto</p>
          <p class="text-3xl font-black text-slate-800">{{ totalEmAberto }}</p>
        </div>
      </Card>
    </div>

    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-border-ui shadow-2xl bg-white">
      <header class="flex flex-col lg:flex-row items-center justify-between gap-6 p-8 lg:p-10 border-b border-border-ui bg-slate-50/50">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl rotate-3">
            <i class="pi pi-box text-xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-black tracking-tight text-slate-800 uppercase">Plano de Corte</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Industrialização por Fornecedor</p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div class="relative w-full sm:w-80 group">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors"></i>
            <input 
              v-model="busca" 
              type="text" 
              placeholder="Buscar fornecedor ou lote..."
              class="w-full pl-11 pr-4 h-14 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-sm"
            />
          </div>
          
          <Button 
            variant="primary" 
            class="h-14 !rounded-2xl !px-8 w-full sm:w-auto shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all" 
            @click="router.push('/plano-corte/novo')"
          >
            <i class="pi pi-plus mr-2 text-xs"></i>
            NOVO PLANO
          </Button>
        </div>
      </header>

      <div class="p-2">
        <Table :columns="columns" :rows="rowsFiltrados" :loading="loading" class="!border-none">
          
          <template #cell-fornecedor="{ row }">
            <div class="flex items-center gap-3 py-2">
              <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px] shadow-inner uppercase italic">
                {{ (row.fornecedor?.razao_social || 'F').substring(0,2) }}
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-black text-slate-700 uppercase leading-none mb-1">
                  {{ row.fornecedor?.razao_social || 'Fornecedor não Identificado' }}
                </span>
                <span class="text-[10px] font-bold text-slate-400 tracking-wider">
                  Pedido #{{ row.numero_pedido || 'S/N' }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-data="{ row }">
            <div class="flex flex-col">
              <span class="text-xs font-black text-slate-700">
                {{ row.data ? new Date(row.data).toLocaleDateString('pt-BR') : '-' }}
              </span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Data Emissão</span>
            </div>
          </template>

          <template #cell-total="{ row }">
            <div class="flex flex-col">
              <span class="text-sm font-black text-brand-primary italic">
                {{ maskMoneyBR(row.valor_total || 0) }}
              </span>
              <span class="text-[9px] font-bold text-slate-400 uppercase">Valor Total</span>
            </div>
          </template>

          <template #cell-status="{ row }">
            <span 
              class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5"
              :class="statusClassTailwind(row.status)"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
              {{ row.status }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-3 px-4">
              <button @click="router.push(`/plano-corte/${row.id}`)" class="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-brand-primary hover:text-white transition-all shadow-sm flex items-center justify-center group">
                <i class="pi pi-pencil text-xs group-hover:scale-110 transition-transform"></i>
              </button>
              <button @click="excluir(row)" class="h-10 w-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center group">
                <i class="pi pi-trash text-xs group-hover:rotate-12 transition-transform"></i>
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