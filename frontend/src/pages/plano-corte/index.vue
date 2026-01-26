<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in">
    
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <i class="pi pi-box text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Plano de Corte</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Industrialização por fornecedor</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <div class="relative w-full sm:w-64">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input 
            v-model="busca" 
            type="text" 
            placeholder="Buscar fornecedor ou lote..."
            class="w-full pl-9 pr-3 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all uppercase"
          />
        </div>
        
        <Button 
          variant="primary" 
          size="md"
          class="!h-10 !rounded-xl !px-4 text-xs font-black uppercase tracking-wider w-full sm:w-auto"
          @click="router.push('/plano-corte/novo')"
        >
          <i class="pi pi-plus mr-1.5 text-[10px]"></i>
          Novo Plano
        </Button>
      </div>
    </div>

<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
  <div class="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-center min-h-[100px]">
    <p class="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Total de Planos</p>
    <p class="text-3xl font-black text-slate-800">{{ planos.length }}</p>
  </div>
  
  <div class="p-5 rounded-xl bg-white border border-emerald-100 shadow-sm flex flex-col justify-center min-h-[100px]">
    <p class="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 mb-1">Finalizados</p>
    <p class="text-3xl font-black text-emerald-700">{{ totalFinalizados }}</p>
  </div>
  
  <div class="p-5 rounded-xl bg-white border border-amber-100 shadow-sm flex flex-col justify-center min-h-[100px]">
    <p class="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600 mb-1">Em Aberto</p>
    <div class="flex items-center gap-2">
      <p class="text-3xl font-black text-amber-700">{{ totalEmAberto }}</p>
      <span class="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse mt-2"></span>
    </div>
  </div>
</div>

    <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table 
        :columns="columns" 
        :rows="rowsFiltrados" 
        :loading="loading" 
        :boxed="false"
      >
        <template #cell-fornecedor="{ row }">
          <div class="flex items-center gap-3 py-1">
            <div class="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px] uppercase">
              {{ (row.fornecedor?.razao_social || 'F').substring(0,2) }}
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-bold text-slate-800 uppercase tracking-tight leading-tight">
                {{ row.fornecedor?.razao_social || 'Fornecedor não Identificado' }}
              </span>
              <span class="text-[10px] font-bold text-brand-primary tracking-wider uppercase">
                Pedido #{{ row.numero_pedido || 'S/N' }}
              </span>
            </div>
          </div>
        </template>

        <template #cell-data="{ row }">
          <div class="flex flex-col">
            <span class="text-xs font-bold text-slate-700">
              {{ row.data ? new Date(row.data).toLocaleDateString('pt-BR') : '-' }}
            </span>
            <span class="text-[9px] font-bold text-slate-400 uppercase">Emissão</span>
          </div>
        </template>

        <template #cell-total="{ row }">
          <div class="flex flex-col">
            <span class="text-sm font-black text-slate-800">
              {{ maskMoneyBR(row.valor_total || 0) }}
            </span>
            <span class="text-[9px] font-bold text-slate-400 uppercase">Total</span>
          </div>
        </template>

        <template #cell-status="{ row }">
          <span 
            class="px-2 py-1 rounded text-[9px] font-black uppercase inline-flex items-center gap-1.5"
            :class="statusClassTailwind(row.status)"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
            {{ row.status }}
          </span>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-end gap-1 px-2">
            <button 
              @click="router.push(`/plano-corte/${row.id}`)" 
              class="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center"
              title="Editar"
            >
              <i class="pi pi-pencil text-[10px]"></i>
            </button>
            <button 
              @click="excluir(row)" 
              class="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
              title="Excluir"
            >
              <i class="pi pi-trash text-[10px]"></i>
            </button>
          </div>
        </template>
      </Table>
    </div>
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
  { key: 'fornecedor', label: 'FORNECEDOR / PEDIDO', width: '40%' },
  { key: 'data', label: 'EMISSÃO', width: '15%' },
  { key: 'total', label: 'VALOR', width: '15%' },
  { key: 'status', label: 'SITUAÇÃO', width: '20%' },
  { key: 'acoes', label: '', width: '10%', align: 'right' }
]

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
    return 'bg-emerald-50 text-emerald-600 border border-emerald-100'
  if (s === 'CANCELADO') 
    return 'bg-red-50 text-red-500 border border-red-100'
  if (['EM_PRODUCAO', 'EM PRODUCAO', 'ABERTO'].includes(s)) 
    return 'bg-amber-50 text-amber-600 border border-amber-100'
  return 'bg-blue-50 text-blue-600 border border-blue-100'
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