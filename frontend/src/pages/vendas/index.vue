<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in">
    
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <i class="pi pi-dollar text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Vendas</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gestão comercial e pós-venda</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <div class="relative w-full sm:w-64">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input 
            v-model="filtro" 
            type="text" 
            placeholder="BUSCAR CLIENTE, STATUS OU ID..."
            class="w-full pl-9 pr-3 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all uppercase"
          />
        </div>
        
        <Button 
          variant="primary" 
          size="md"
          class="!h-10 !rounded-xl !px-4 text-xs font-black uppercase tracking-wider w-full sm:w-auto"
          @click="router.push('/vendas/novo')"
        >
          <i class="pi pi-plus mr-1.5 text-[10px]"></i>
          Nova Venda
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Total de Vendas</p>
        <p class="text-xl font-black text-slate-800">{{ vendas.length }}</p>
      </div>

      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Faturamento Total</p>
        <p class="text-xl font-black text-emerald-600">
          {{ format.currency(vendas.reduce((acc, v) => acc + Number(v.valor_vendido || 0), 0)) }}
        </p>
      </div>

      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Ticket Médio</p>
        <p class="text-xl font-black text-blue-600">
{{ format.currency(
  vendas.length
    ? (vendas.reduce((acc, v) => acc + Number(v.valor_total || 0), 0) / vendas.length)
    : 0
) }}


        </p>
      </div>

      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Em Produção</p>
        <div class="flex items-center gap-2">
          <p class="text-xl font-black text-amber-600">
            {{ vendas.filter(v => String(v.status).toUpperCase().includes('PRODU')).length }}
          </p>
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table 
        :columns="columns" 
        :rows="filtradas" 
        :loading="loading" 
        :boxed="false"
      >
        <template #cell-cliente="{ row }">
          <div class="flex flex-col py-1">
            <span class="text-sm font-bold text-slate-800 uppercase tracking-tight leading-tight">
              {{ row.cliente?.nome_completo || row.cliente?.razao_social || row.cliente?.nome || 'Consumidor' }}
            </span>
            <span class="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              {{ row.cliente?.cpf || row.cliente?.cnpj || 'Sem documento' }}
            </span>
          </div>
        </template>

        <template #cell-status="{ row }">
          <span 
            class="px-2 py-1 rounded text-[9px] font-black uppercase inline-flex items-center gap-1.5"
            :class="pillClassTailwind(row.status)"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
            {{ row.status }}
          </span>
        </template>

        <template #cell-valor_total="{ row }">
          <div class="flex flex-col items-end">
            <span class="text-sm font-black text-slate-800 tabular-nums">
              {{ format.currency(row.valor_total) }}
            </span>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Valor Final</span>
          </div>
        </template>

        <template #cell-data_venda="{ row }">
          <div class="flex flex-col">
            <span class="text-xs font-bold text-slate-700">
              {{ format.date(row.data_venda) }}
            </span>
            <span class="text-[9px] font-bold text-slate-400 uppercase">Data Venda</span>
          </div>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-end gap-1.5 px-2">
            <button 
              @click="router.push(`/vendas/${row.id}`)" 
              class="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-all border border-slate-200 flex items-center justify-center"
            >
              <i class="pi pi-pencil text-[10px]"></i>
            </button>
            <button 
              @click="excluir(row.id)" 
              class="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 flex items-center justify-center"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Table from '@/components/ui/Table.vue'
import Button from '@/components/ui/Button.vue'
import api from '@/services/api'
import { format } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const deletandoId = ref(null)
const vendas = ref([])
const filtro = ref('')

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'cliente', label: 'CLIENTE', width: '35%' },
  { key: 'status', label: 'SITUAÇÃO', width: '15%', align: 'center' },
  { key: 'forma_pagamento_chave', label: 'PAGAMENTO', width: '15%' },
  { key: 'data_venda', label: 'DATA', width: '15%' },
  { key: 'valor_total', label: 'TOTAL', align: 'right', width: '15%' },
  { key: 'acoes', label: '', width: '120px', align: 'right' },
]

const filtradas = computed(() => {
  const f = (filtro.value || '').toLowerCase().trim()
  if (!f) return vendas.value

  return vendas.value.filter((v) => {
    const cliente = (v?.cliente?.nome || v?.cliente?.razao_social || '').toLowerCase()
    const status = (v?.status || '').toLowerCase()
    const pag = (v?.forma_pagamento_chave || '').toLowerCase()
    const id = String(v?.id || '').toLowerCase()

    return cliente.includes(f) || status.includes(f) || pag.includes(f) || id.includes(f)
  })
})

function pillClassTailwind(status) {
  const s = String(status || '').toUpperCase()
  if (s.includes('FECH')) return 'bg-emerald-50 text-emerald-600 border-emerald-100'
  if (s.includes('CANCEL')) return 'bg-rose-50 text-rose-500 border-rose-100'
  if (s.includes('PRODU')) return 'bg-sky-50 text-sky-600 border-sky-100'
  return 'bg-slate-50 text-slate-500 border-slate-200'
}

async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get('/vendas')
    vendas.value = (data || []).map((v) => ({
      ...v,
      cliente: v.cliente || null,
    }))
  } finally {
    loading.value = false
  }
}

async function excluir(id) {
  if (!confirm('Deseja excluir esta venda?')) return
  deletandoId.value = id
  try {
    await api.delete(`/vendas/${id}`)
    await carregar()
  } finally {
    deletandoId.value = null
  }
}

onMounted(carregar)
</script>