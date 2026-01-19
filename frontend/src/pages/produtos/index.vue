<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card hoverable class="p-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
          <i class="pi pi-box text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Itens</p>
          <p class="text-2xl font-black text-[var(--text-main)]">{{ produtos.length }}</p>
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
            <h2 class="text-xl font-black tracking-tight text-[var(--text-main)] uppercase">Produtos & Materiais</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Coração do ERP - Gestão de Insumos</p>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="relative flex-1 md:w-80">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              v-model="filtro" 
              type="text" 
              placeholder="BUSCAR PRODUTO OU REFERÊNCIA..."
              class="w-full pl-10 pr-4 h-11 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl text-[10px] font-black focus:ring-2 focus:ring-brand-primary outline-none transition-all uppercase tracking-widest"
            />
          </div>
          
          <Button 
  variant="primary"
  class="!h-11 !rounded-2xl !px-6 shadow-xl shadow-brand-primary/20"
  @click="router.push('/produtos/novo')"
>
            <i class="pi pi-plus mr-2 text-xs"></i>
            Novo Produto
          </Button>
        </div>
      </header>

      <div class="p-4">
        <Table :columns="columns" :rows="rows" :loading="loading">
          <template #cell-nome_produto="{ row }">
            <div class="flex flex-col">
              <strong class="text-sm font-black text-[var(--text-main)] uppercase">{{ row.nome_produto }}</strong>
              <span class="text-[10px] font-bold text-slate-400 mt-1 tracking-widest uppercase">
                Ref: {{ String(row.id || 0).padStart(4, '0') }}
              </span>
            </div>
          </template>

          <template #cell-status="{ row }">
            <div 
              class="inline-flex items-center gap-2 rounded-xl px-4 py-2 border transition-all"
              :class="row.status === 'ATIVO' 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-500 border-amber-100'"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-current" :class="{ 'animate-pulse': row.status === 'ATIVO' }"></span>
              <span class="text-[9px] font-black uppercase tracking-widest">{{ row.status }}</span>
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
<button
  @click="router.push(`/produtos/${row.id}`)"
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
