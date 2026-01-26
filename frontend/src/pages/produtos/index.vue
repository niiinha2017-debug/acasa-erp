<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card hoverable class="p-6 flex items-center gap-5 border-none shadow-sm bg-white/80 backdrop-blur">
        <div class="w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shadow-inner">
          <i class="pi pi-box text-2xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total de Itens</p>
          <p class="text-3xl font-black text-slate-800">{{ produtos.length }}</p>
        </div>
      </Card>
      
      </div>

    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-border-ui shadow-2xl bg-white">
      <header class="flex flex-col lg:flex-row items-center justify-between gap-6 p-8 lg:p-10 border-b border-border-ui bg-slate-50/50">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl rotate-3">
            <i class="pi pi-shopping-cart text-xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-black tracking-tight text-slate-800 uppercase">Insumos & Materiais</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Base de Dados para Industrialização</p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div class="relative w-full sm:w-80 group">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors"></i>
            <input 
              v-model="filtro" 
              type="text" 
              placeholder="BUSCAR MATERIAL, COR OU MARCA..."
              class="w-full pl-11 pr-4 h-14 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-sm uppercase tracking-widest"
            />
          </div>
          
          <Button 
            variant="primary" 
            class="h-14 !rounded-2xl !px-8 w-full sm:w-auto shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all" 
            @click="router.push('/produtos/novo')"
          >
            <i class="pi pi-plus mr-2 text-xs"></i>
            ADICIONAR PRODUTO
          </Button>
        </div>
      </header>

      <div class="p-2">
        <Table :columns="columns" :rows="rows" :loading="loading" class="!border-none">
          
          <template #cell-nome_produto="{ row }">
            <div class="flex items-center gap-3 py-2">
              <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px] shadow-inner uppercase italic">
                {{ row.nome_produto.substring(0,2) }}
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-black text-slate-700 uppercase leading-none mb-1">
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
              class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5"
              :class="row.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="row.status === 'ATIVO' ? 'bg-emerald-500' : 'bg-slate-400'"></span>
              {{ row.status || 'INATIVO' }}
            </span>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-3 px-4">
              <button @click="router.push(`/produtos/${row.id}`)" class="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-brand-primary hover:text-white transition-all shadow-sm flex items-center justify-center group">
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
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { maskMoneyBR } from '@/utils/masks'
import { useRouter } from 'vue-router'

const produtos = ref([])
const loading = ref(false)
const router = useRouter()
const filtro = ref('')




const columns = [
  { key: 'nome_produto', label: 'Produto', width: '250px' },
  { key: 'fornecedor_nome', label: 'Fornecedor' },
  { key: 'unidade', label: 'Un.', width: '70px', align: 'center' },
  { key: 'quantidade', label: 'Qtd', width: '80px', align: 'center' },
  { key: 'valor_total', label: 'Valor Total', width: '130px', align: 'right' },
  { key: 'status', label: 'Status', width: '110px', align: 'center' },
  { key: 'acoes', label: 'Ações', width: '160px', align: 'center' },
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

function excluir(row) {
  console.log('excluir:', row)
}

onMounted(() => {
  buscarDadosDoBanco()
})
</script>
