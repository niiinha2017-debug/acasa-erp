<template>
  <div class="p-6 bg-slate-50 min-h-screen">
    
    <header class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Contas a Pagar</h1>
        <p class="text-xs text-slate-500 font-bold uppercase">Gestão Consolidada de Saídas</p>
      </div>
      
      <div class="flex gap-3">
        <button @click="abrirModalFechamento" class="bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase italic hover:bg-slate-800 transition-all shadow-lg">
          Novo Fechamento Mensal
        </button>
      </div>
    </header>

    <section class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4 items-end">
      <div class="flex-1 max-w-sm">
        <label class="text-[10px] font-black text-slate-400 uppercase mb-1 block">Fornecedor</label>
        <select v-model="filtros.fornecedor_id" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase outline-none focus:border-blue-500">
          <option value="">TODOS OS FORNECEDORES</option>
          <option v-for="o in fornecedorOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>

      <div class="w-48">
        <label class="text-[10px] font-black text-slate-400 uppercase mb-1 block">Status</label>
        <select v-model="filtros.status" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase outline-none focus:border-blue-500">
          <option value="EM_ABERTO">EM ABERTO</option>
          <option value="VENCIDO">VENCIDOS</option>
          <option value="PAGO">PAGOS</option>
        </select>
      </div>

      <button @click="buscar" class="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-all">
        <i class="pi pi-search text-sm"></i>
      </button>
    </section>

    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead class="bg-slate-800 text-white">
          <tr>
            <th v-for="col in columns" :key="col.key" :style="{ width: col.width, textAlign: col.align }" class="p-4 text-[10px] font-black uppercase tracking-widest">
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="row in rows" :key="`${row.origem}-${row.id}`" class="hover:bg-slate-50 transition-colors group">
            
            <td class="p-4">
              <span :class="getOrigemClass(row.origem)" class="text-[9px] font-black px-2 py-1 rounded border uppercase italic">
                {{ row.origem }}
              </span>
            </td>

            <td class="p-4">
              <div class="flex flex-col">
                <span class="text-sm font-black text-slate-700">{{ formatarData(row.vencimento_em) }}</span>
                <span v-if="row.status === 'VENCIDO'" class="text-[9px] text-rose-500 font-bold uppercase italic">Atrasado</span>
              </div>
            </td>

            <td class="p-4">
              <div class="flex flex-col">
                <span class="text-sm font-black text-slate-800 uppercase italic">{{ row.fornecedor_nome || 'DESPESA OPERACIONAL' }}</span>
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{{ row.descricao }}</span>
              </div>
            </td>

            <td class="p-4 text-right">
              <div class="flex flex-col items-end">
                <span class="text-sm font-black text-slate-800 italic">{{ formatarMoeda(row.valor) }}</span>
                <span v-if="row.valor_compensado > 0" class="text-[9px] text-emerald-500 font-bold uppercase tracking-tighter">
                  Compensado: {{ formatarMoeda(row.valor_compensado) }}
                </span>
              </div>
            </td>

            <td class="p-4">
              <span :class="getStatusClass(row.status)" class="text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-tighter">
                {{ row.status }}
              </span>
            </td>

            <td class="p-4 text-right">
              <button class="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center">
                <i class="pi pi-eye"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!loading && rows.length === 0" class="p-20 text-center">
        <i class="pi pi-inbox text-4xl text-slate-200 mb-4"></i>
        <p class="text-slate-400 font-bold uppercase italic text-sm italic">Nenhum registro encontrado para estes filtros</p>
      </div>
    </div>
  </div>
</template>



<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { FinanceiroService, FornecedorService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'

// =======================
// STATE
// =======================
const loading = ref(false)
const rows = ref([])
const fornecedorOptions = ref([])

const filtros = reactive({
  fornecedor_id: '',
  status: 'EM_ABERTO', // Padrão para não poluir
})

const columns = [
  { key: 'origem', label: 'ORIGEM', width: '100px' },
  { key: 'vencimento', label: 'VENCIMENTO', width: '120px' },
  { key: 'fornecedor', label: 'FORNECEDOR/DESCRIÇÃO' },
  { key: 'valor', label: 'VALOR TOTAL', width: '140px', align: 'right' },
  { key: 'status', label: 'STATUS', width: '100px' },
  { key: 'acoes', label: '', width: '80px', align: 'right' },
]

// =======================
// MÉTODOS
// =======================
async function buscar() {
  try {
    loading.value = true
    const data = await FinanceiroService.listarContasPagarConsolidado(filtros)
    rows.value = data || []
  } catch (e) {
    notify.error('Erro ao carregar contas a pagar')
  } finally {
    loading.value = false
  }
}

const formatarMoeda = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const formatarData = (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '-'

// Estilização dinâmica de badges
const getStatusClass = (status) => {
  const map = {
    'EM_ABERTO': 'bg-blue-100 text-blue-700 border-blue-200',
    'VENCIDO': 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse',
    'PAGO': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }
  return map[status] || 'bg-slate-100 text-slate-700'
}

const getOrigemClass = (origem) => {
  const map = {
    'DESPESA': 'text-purple-600 bg-purple-50 border-purple-100',
    'COMPRA': 'text-orange-600 bg-orange-50 border-orange-100',
    'FECHAMENTO': 'text-blue-600 bg-blue-50 border-blue-100',
  }
  return map[origem] || 'text-slate-600 bg-slate-50'
}

onMounted(async () => {
  const forns = await FornecedorService.listarAtivos()
  fornecedorOptions.value = forns.map(f => ({ label: f.nome_fantasia, value: f.id }))
  buscar()
})
</script>