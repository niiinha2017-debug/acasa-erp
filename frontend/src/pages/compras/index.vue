<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-700">
    
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    
    <Card hoverable class="p-6 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-slate-900/10 text-slate-900 flex items-center justify-center">
        <i class="pi pi-calculator text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Geral</p>
        <p class="text-xl font-black text-[var(--text-main)]">{{ format.currency(totalGeral) }}</p>
      </div>
    </Card>

    <Card hoverable class="p-6 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
        <i class="pi pi-box text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Insumos</p>
        <p class="text-xl font-black text-[var(--text-main)]">{{ format.currency(totalInsumos) }}</p>
      </div>
    </Card>

    <Card hoverable class="p-6 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
        <i class="pi pi-percentage text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Vendas / Rateio</p>
        <p class="text-xl font-black text-[var(--text-main)]">{{ format.currency(totalVendas) }}</p>
      </div>
    </Card>

    <Card 
      hoverable 
      active
      class="p-6 flex items-center gap-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
        <i class="pi pi-calendar text-xl animate-pulse"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-emerald-500">Mês Atual</p>
        <p class="text-xl font-black text-emerald-600">{{ format.currency(totalMesAtual) }}</p>
      </div>
    </Card>

  </div>

    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-[var(--border-ui)]">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-8 border-b border-[var(--border-ui)] bg-slate-500/5">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <i class="pi pi-shopping-cart text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-black tracking-tight text-[var(--text-main)] uppercase">Gestão de Compras</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Insumos e rateios por ambiente</p>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="relative flex-1 md:w-96">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              v-model="filtro" 
              type="text" 
              placeholder="BUSCAR FORNECEDOR, VENDA, STATUS OU ORIGEM..."
              class="w-full pl-10 pr-4 h-11 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all uppercase tracking-tighter"
            />
          </div>
          
          <Button variant="primary" class="!h-11 !rounded-2xl !px-6 shadow-xl shadow-brand-primary/20" @click="router.push('/compras/novo')">
            <i class="pi pi-plus mr-2 text-xs"></i>
            Nova Compra
          </Button>
        </div>
      </header>

      <div class="p-4">
        <Table
          :columns="columns"
          :rows="filtradas"
          :loading="loading"
          empty-text="Nenhuma compra encontrada no sistema."
          class="!border-none"
        >
          <template #cell-fornecedor="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-[14px] font-black text-gray-900 leading-tight uppercase">
                {{ nomeFornecedor(row) }}
              </span>
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                {{ row.tipo_compra === 'INSUMOS' ? '📦 Estoque Geral' : `🎯 Venda #${row.venda_id || '---'}` }}
              </span>
            </div>
          </template>

          <template #cell-tipo_compra="{ row }">
            <div class="flex items-center gap-2">
              <div 
                class="w-1.5 h-1.5 rounded-full" 
                :class="row.tipo_compra === 'INSUMOS' ? 'bg-blue-500' : 'bg-amber-500'"
              ></div>
              <span class="text-[11px] font-black uppercase tracking-tighter text-slate-600">
                {{ row.tipo_compra === 'INSUMOS' ? 'Insumos' : 'Cliente' }}
              </span>
            </div>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status || 'RASCUNHO'" />
          </template>

          <template #cell-valor_total="{ row }">
            <span class="text-sm font-black text-gray-900">
              {{ format.currency(row.valor_total) }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <button 
                @click="router.push(`/compras/${row.id}`)"
                class="p-2.5 rounded-xl bg-slate-500/10 text-slate-500 hover:bg-brand-primary hover:text-white transition-all shadow-sm"
              >
                <i class="pi pi-pencil text-xs"></i>
              </button>
              <button 
                @click="excluir(row.id)"
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