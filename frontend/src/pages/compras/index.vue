<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in">
    
    <!-- Header Compacto -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <i class="pi pi-shopping-cart text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Compras</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entradas e rateios</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <div class="relative w-full sm:w-56">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input 
            v-model="filtro" 
            type="text" 
            placeholder="Buscar..."
            class="w-full pl-9 pr-3 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
          />
        </div>
        
        <Button 
          variant="primary" 
          size="md"
          class="!h-10 !rounded-xl !px-4 text-xs font-black uppercase tracking-wider"
          @click="router.push('/compras/novo')"
        >
          <i class="pi pi-plus mr-1.5 text-[10px]"></i>
          Nova
        </Button>
      </div>
    </div>

    <!-- Cards Compactos -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Total</p>
        <p class="text-xl font-black text-slate-800">{{ format.currency(totalGeral) }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Estoque</p>
        <p class="text-xl font-black text-slate-800">{{ format.currency(totalInsumos) }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Vendas</p>
        <p class="text-xl font-black text-slate-800">{{ format.currency(totalVendas) }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600">Este Mês</p>
        <p class="text-xl font-black text-emerald-700">{{ format.currency(totalMesAtual) }}</p>
      </div>
    </div>

    <!-- Tabela Compacta -->
    <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table
        :columns="columns"
        :rows="filtradas"
        :loading="loading"
        empty-text="Nenhuma compra encontrada."
        :boxed="false"
      >
        <template #cell-fornecedor="{ row }">
          <div class="py-1">
            <span class="text-sm font-bold text-slate-800 block truncate">
              {{ nomeFornecedor(row) }}
            </span>
            <div class="flex items-center gap-2 mt-0.5">
              <span 
                class="text-[8px] font-black px-1.5 py-0.5 rounded border"
                :class="row.tipo_compra === 'INSUMOS' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'"
              >
                {{ row.tipo_compra === 'INSUMOS' ? '📦' : `🎯 #${row.venda_id}` }}
              </span>
              <span class="text-[8px] font-bold text-slate-400">
                #{{ row.id }}
              </span>
            </div>
          </div>
        </template>

        <template #cell-status="{ row }">
          <div class="scale-90">
            <StatusBadge :value="row.status || 'RASCUNHO'" />
          </div>
        </template>

        <template #cell-valor_total="{ row }">
          <span class="text-sm font-bold text-slate-800 tabular-nums">
            {{ format.currency(row.valor_total) }}
          </span>
        </template>

        <template #cell-data_compra="{ row }">
          <span class="text-xs font-bold text-slate-600">
            {{ format.date(row.data_compra) }}
          </span>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-end gap-1">
            <button 
              @click="router.push(`/compras/${row.id}`)"
              class="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center"
            >
              <i class="pi pi-pencil text-xs"></i>
            </button>
<button 
  @click="confirmarExcluirCompra(row.id)"
  class="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
>
  <i class="pi pi-trash text-xs"></i>
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
import { CompraService } from '@/services/index'
import { format } from '@/utils/format'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'

const router = useRouter()
const compras = ref([])
const loading = ref(false)
const filtro = ref('')

const columns = [
  { key: 'fornecedor', label: 'Fornecedor', width: '35%' },
  { key: 'tipo_compra', label: 'Tipo', width: '12%' },
  { key: 'status', label: 'Status', align: 'center', width: '10%' },
  { key: 'valor_total', label: 'Valor', align: 'right', width: '18%' },
  { key: 'data_compra', label: 'Data', align: 'center', width: '15%' },
  { key: 'acoes', label: '', align: 'right', width: '10%' },
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

async function confirmarExcluirCompra(id) {
  const ok = await confirm.show(
    'Excluir Compra',
    'Esta ação não pode ser desfeita. Deseja continuar?',
  )
  if (!ok) return

  try {
    await CompraService.remover(id)
    compras.value = compras.value.filter(c => c.id !== id)
    notify.success('Compra removida com sucesso!')
  } catch (e) {
    notify.error('Erro ao excluir registro.')
  }
}


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