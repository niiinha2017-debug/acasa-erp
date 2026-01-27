<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in">
    
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <i class="pi pi-shopping-cart text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Insumos & Materiais</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base de dados para industrialização</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <div class="relative w-full sm:w-64">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input 
            v-model="filtro" 
            type="text" 
            placeholder="BUSCAR MATERIAL OU FORNECEDOR..."
            class="w-full pl-9 pr-3 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all uppercase"
          />
        </div>
        
        <Button 
          variant="primary" 
          size="md"
          class="!h-10 !rounded-xl !px-4 text-xs font-black uppercase tracking-wider w-full sm:w-auto"
          @click="router.push('/produtos/novo')"
        >
          <i class="pi pi-plus mr-1.5 text-[10px]"></i>
          Novo Produto
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Total de Itens</p>
        <p class="text-xl font-black text-slate-800">{{ produtos.length }}</p>
      </div>

      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Valor em Estoque</p>
        <p class="text-xl font-black text-emerald-600">
          {{ maskMoneyBR(produtos.reduce((acc, p) => acc + Number(p.valor_total || 0), 0)) }}
        </p>
      </div>

      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Produtos Ativos</p>
        <p class="text-xl font-black text-blue-600">
          {{ produtos.filter(p => p.status === 'ATIVO').length }}
        </p>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table 
        :columns="columns" 
        :rows="rows" 
        :loading="loading" 
        :boxed="false"
      >
        <template #cell-nome_produto="{ row }">
          <div class="flex items-center gap-3 py-1">
            <div class="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px] uppercase">
              {{ row.nome_produto.substring(0,2) }}
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-bold text-slate-800 uppercase tracking-tight leading-tight">
                {{ row.nome_produto }}
              </span>
              <span class="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Ref: {{ String(row.id || 0).padStart(4, '0') }} • {{ row.marca || 'S/ Marca' }}
              </span>
            </div>
          </div>
        </template>

        <template #cell-status="{ row }">
          <span 
            class="px-2 py-1 rounded text-[9px] font-black uppercase inline-flex items-center gap-1.5"
            :class="row.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
            {{ row.status || 'INATIVO' }}
          </span>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-end gap-1 px-2">
            <button 
              @click="router.push(`/produtos/${row.id}`)" 
              class="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center"
            >
              <i class="pi pi-pencil text-[10px]"></i>
            </button>
            <button 
              @click="confirmarExcluirProduto(row)" 
              class="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
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
import api from '@/services/api'
import { maskMoneyBR } from '@/utils/masks'
import { useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'

const produtos = ref([])
const loading = ref(false)
const router = useRouter()
const filtro = ref('')

const columns = [
  { key: 'nome_produto', label: 'PRODUTO / REF', width: '30%' },
  { key: 'fornecedor_nome', label: 'FORNECEDOR', width: '20%' },
  { key: 'unidade', label: 'UN', width: '5%', align: 'center' },
  { key: 'quantidade', label: 'QTD', width: '10%', align: 'center' },
  { key: 'valor_total', label: 'VLR TOTAL', width: '15%', align: 'right' },
  { key: 'status', label: 'STATUS', width: '10%', align: 'center' },
  { key: 'acoes', label: '', width: '10%', align: 'right' }
]

const rows = computed(() => {
  const f = String(filtro.value || '').trim().toUpperCase()
  return (produtos.value || [])
    .filter(p => {
      if (!f) return true
      const nome = String(p.nome_produto || '').toUpperCase()
      const forn = String(p.fornecedor?.razao_social || '').toUpperCase()
      const id = String(p.id || '').toUpperCase()
      return nome.includes(f) || forn.includes(f) || id.includes(f)
    })
    .map(p => ({
      ...p,
      fornecedor_nome: p.fornecedor?.razao_social || '-',
      valor_total: maskMoneyBR(Number(p.valor_total || 0)),
    }))
})

async function buscarDadosDoBanco() {
  loading.value = true
  try {
    const resp = await api.get('/produtos')
    produtos.value = resp.data || []
  } catch (err) {
    console.error('Erro ao buscar produtos:', err?.response || err)
  } finally {
    loading.value = false
  }
}

async function confirmarExcluirProduto(row) {
  const ok = await confirm.show(
    'Excluir Produto',
    `Deseja excluir o produto "${row?.nome_produto}"? Esta ação não pode ser desfeita.`,
  )
  if (!ok) return
  await excluir(row)
}
async function excluir(row) {
  try {
    await api.delete(`/produtos/${row.id}`)
    produtos.value = produtos.value.filter(p => p.id !== row.id)
  } catch (err) {
    alert('Erro ao excluir.')
  }
}

onMounted(() => {
  buscarDadosDoBanco()
})
</script>