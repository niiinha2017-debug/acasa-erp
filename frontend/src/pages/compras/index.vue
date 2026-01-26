<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
    
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      
      <Card hoverable class="p-6 border-none shadow-sm bg-white ring-1 ring-slate-200/60">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
            <i class="pi pi-calculator text-xl"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Total Acumulado</p>
            <p class="text-2xl font-black text-slate-800 tracking-tight">{{ format.currency(totalGeral) }}</p>
          </div>
        </div>
      </Card>

      <Card hoverable class="p-6 border-none shadow-sm bg-white ring-1 ring-slate-200/60">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <i class="pi pi-box text-xl"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Insumos / Estoque</p>
            <p class="text-2xl font-black text-slate-800 tracking-tight">{{ format.currency(totalInsumos) }}</p>
          </div>
        </div>
      </Card>

      <Card hoverable class="p-6 border-none shadow-sm bg-white ring-1 ring-slate-200/60">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <i class="pi pi-percentage text-xl"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Rateio de Vendas</p>
            <p class="text-2xl font-black text-slate-800 tracking-tight">{{ format.currency(totalVendas) }}</p>
          </div>
        </div>
      </Card>

      <Card 
        hoverable 
        class="p-6 border-none shadow-xl bg-emerald-600 text-white ring-1 ring-emerald-500 relative overflow-hidden group"
      >
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
        
        <div class="flex items-center gap-4 relative z-10">
          <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-inner">
            <i class="pi pi-calendar text-xl animate-pulse"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-100">Gasto no Mês</p>
            <p class="text-2xl font-black text-white tracking-tight">{{ format.currency(totalMesAtual) }}</p>
          </div>
        </div>
      </Card>

    </div>

    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-none shadow-2xl shadow-slate-200/50 bg-white">
      <header class="flex flex-col lg:flex-row items-center justify-between gap-6 p-8 bg-slate-50/50 border-b border-slate-100">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
            <i class="pi pi-shopping-cart text-2xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-black tracking-tight text-slate-800 uppercase">Gestão de Compras</h2>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="w-2 h-2 rounded-full bg-brand-primary animate-ping"></span>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controle de entradas e rateios ativos</p>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div class="relative w-full sm:w-80 group">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors"></i>
            <input 
              v-model="filtro" 
              type="text" 
              placeholder="Buscar por fornecedor ou venda..."
              class="w-full pl-11 pr-4 h-13 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all uppercase tracking-tight shadow-sm"
            />
          </div>
          
          <Button 
            variant="primary" 
            class="w-full sm:w-auto !h-13 !rounded-2xl !px-8 shadow-xl shadow-brand-primary/25 hover:scale-[1.02] active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest"
            @click="router.push('/compras/novo')"
          >
            <i class="pi pi-plus mr-2 text-xs"></i>
            Nova Compra
          </Button>
        </div>
      </header>

      <div class="p-2">
        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          empty-text="Nenhuma compra encontrada no sistema."
          class="!border-none"
        >
          <template #cell-fornecedor="{ row }">
            <div class="flex flex-col py-2">
              <span class="text-sm font-black text-slate-800 leading-tight uppercase tracking-tight">
                {{ nomeFornecedor(row) }}
              </span>
              <div class="flex items-center gap-2 mt-1.5">
                <span 
                  class="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter"
                  :class="row.tipo_compra === 'INSUMOS' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'"
                >
                  {{ row.tipo_compra === 'INSUMOS' ? '📦 Estoque' : `🎯 Venda #${row.venda_id}` }}
                </span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  ID: #{{ row.id }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-status="{ row }">
            <div class="scale-90 origin-left">
              <StatusBadge :value="row.status || 'RASCUNHO'" />
            </div>
          </template>

          <template #cell-valor_total="{ row }">
            <div class="flex flex-col items-end">
              <span class="text-base font-black text-slate-900 tabular-nums">
                {{ format.currency(row.valor_total) }}
              </span>
              <span class="text-[9px] font-bold text-slate-400 uppercase">
                {{ row.itens?.length || 0 }} itens na nota
              </span>
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <button 
                @click="router.push(`/compras/${row.id}`)"
                v-tooltip.top="'Editar Registro'"
                class="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center"
              >
                <i class="pi pi-pencil text-xs"></i>
              </button>
              <button 
                @click="excluir(row.id)"
                v-tooltip.top="'Excluir'"
                class="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
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

<style scoped>
/* Altura customizada para o input premium */
.h-13 {
  height: 3.25rem;
}
</style>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { CompraService } from '@/services/index'
import { format } from '@/utils/format'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'

const router = useRouter()
const compras = ref([])
const loading = ref(false)
const filtro = ref('')

const columns = [
  { key: 'fornecedor', label: 'Fornecedor / Detalhes', width: '35%' },
  { key: 'tipo_compra', label: 'Origem' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'valor_total', label: 'Valor Total', align: 'right' },
  { key: 'data_compra', label: 'Data', width: '120px' },
  { key: 'acoes', label: '', align: 'right', width: '120px' },
]

async function carregar() {
  loading.value = true
  try {
    const res = await CompraService.listar()
    const data = res?.data ?? res
    compras.value = (Array.isArray(data) ? data : []).sort((a, b) => b.id - a.id)
  } catch (error) {
    notify.error('Erro ao carregar compras.')
  } finally {
    loading.value = false
  }
}

function nomeFornecedor(row) {
  const f = row?.fornecedor
  return f?.nome_fantasia || f?.razao_social || `Fornecedor #${row.fornecedor_id}`
}

const filtradas = computed(() => {
  const t = filtro.value?.toLowerCase().trim()
  if (!t) return compras.value
  return compras.value.filter(c => {
    const campos = [c.id, c.venda_id, nomeFornecedor(c), c.status, c.tipo_compra, format.date(c.data_compra)]
    return campos.some(campo => String(campo ?? '').toLowerCase().includes(t))
  })
})

// CÁLCULOS DOS CARDS (Reagindo ao filtro)
const totalGeral = computed(() => filtradas.value.reduce((acc, c) => acc + Number(c.valor_total || 0), 0))
const totalInsumos = computed(() => filtradas.value.filter(c => c.tipo_compra === 'INSUMOS').reduce((acc, c) => acc + Number(c.valor_total || 0), 0))
const totalVendas = computed(() => filtradas.value.filter(c => c.tipo_compra !== 'INSUMOS').reduce((acc, c) => acc + Number(c.valor_total || 0), 0))
const totalMesAtual = computed(() => {
  const mes = new Date().getMonth(), ano = new Date().getFullYear()
  return filtradas.value.filter(c => {
    const d = new Date(c.data_compra)
    return d.getMonth() === mes && d.getFullYear() === ano
  }).reduce((acc, c) => acc + Number(c.valor_total || 0), 0)
})

async function excluir(id) {
  if (await confirm.show('Excluir Compra', 'Esta ação não pode ser desfeita. Deseja continuar?')) {
    try {
      await CompraService.remover(id)
      compras.value = compras.value.filter(c => c.id !== id)
      notify.success('Compra removida com sucesso!')
    } catch (e) { notify.error('Erro ao excluir registro.') }
  }
}

onMounted(carregar)
</script>