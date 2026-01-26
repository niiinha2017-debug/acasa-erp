<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in">
    
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <i class="pi pi-briefcase text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Orçamentos</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Controle de propostas comerciais</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <div class="relative w-full sm:w-64">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input 
            v-model="filtro" 
            type="text" 
            placeholder="BUSCAR CLIENTE OU TELEFONE..."
            class="w-full pl-9 pr-3 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all uppercase"
          />
        </div>
        
        <Button 
          variant="primary" 
          size="md"
          class="!h-10 !rounded-xl !px-4 text-xs font-black uppercase tracking-wider w-full sm:w-auto shadow-sm"
          @click="router.push('/orcamentos/novo')"
        >
          <i class="pi pi-plus mr-1.5 text-[10px]"></i>
          Novo Orçamento
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Total Geral</p>
        <p class="text-xl font-black text-slate-800">{{ rows.length }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Carteira Ativa</p>
        <p class="text-xl font-black text-blue-600">{{ grupos.length }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Volume Negociado</p>
        <p class="text-lg font-black text-emerald-600 truncate">
          {{ format.currency(rows.reduce((acc, o) => acc + (Number(o.total_itens) || 0), 0)) }}
        </p>
      </div>

      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Recentes</p>
        <div class="flex items-center gap-2">
          <p class="text-xl font-black text-amber-600">{{ rows.slice(0, 5).length }}</p>
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table
        :columns="columns"
        :rows="grupos"
        :loading="loading"
        empty-text="Nenhum orçamento encontrado."
        :boxed="false"
      >
        <template #cell-cliente="{ row }">
          <div class="flex flex-col py-1">
            <span class="text-sm font-bold text-slate-800 uppercase tracking-tight">
              {{ row.cliente_nome || 'CLIENTE NÃO IDENTIFICADO' }}
            </span>
            <span class="text-[10px] font-bold text-slate-400 tracking-wider">
               {{ row.cliente_telefone || 'SEM CONTATO' }}
            </span>
          </div>
        </template>

        <template #cell-orcamentos="{ row }">
          <div class="flex flex-wrap gap-1 justify-end">
            <button
              v-for="o in row.orcamentos"
              :key="o.id"
              class="h-6 px-2 rounded bg-slate-50 border border-slate-200 text-[9px] font-black text-slate-500 hover:bg-slate-900 hover:text-white transition-all uppercase"
              @click="router.push(`/orcamentos/${o.id}`)"
            >
              #{{ o.id }}
            </button>
          </div>
        </template>

        <template #cell-total="{ row }">
          <div class="flex flex-col items-end">
            <span class="text-sm font-black text-slate-800 tabular-nums">
              {{ format.currency(row.total || 0) }}
            </span>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Acumulado</span>
          </div>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-end gap-1.5 px-2">
            <button 
              @click="novoParaCliente(row.cliente_id)"
              class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 flex items-center justify-center"
              title="Novo Orçamento"
            >
              <i class="pi pi-plus text-[10px]"></i>
            </button>
            <button 
              @click="abrirListaDoCliente(row.cliente_id)"
              class="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-all border border-slate-200 flex items-center justify-center"
              title="Histórico"
            >
              <i class="pi pi-list text-[10px]"></i>
            </button>
          </div>
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { format } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const filtro = ref('')
const rows = ref([])

const columns = [
  { key: 'cliente', label: 'CLIENTE / CONTATO', width: '40%' },
  { key: 'orcamentos', label: 'PROJETOS', width: '25%', align: 'right' },
  { key: 'total', label: 'TOTAL', width: '20%', align: 'right' },
  { key: 'acoes', label: '', width: '15%', align: 'right' },
]

async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get('/orcamentos')
    rows.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const grupos = computed(() => {
  const f = (filtro.value || '').trim().toLowerCase()
  const map = new Map()

  for (const o of rows.value || []) {
    const cid = o.cliente_id || o.clienteId
    if (!cid) continue

    if (!map.has(cid)) {
      const cli = o.cliente || {}
      const nome = cli.nome_completo || cli.razao_social || cli.nome_fantasia || o.cliente_nome_snapshot || 'CLIENTE S/N'
      const tel = cli.whatsapp || cli.telefone || cli.contato || cli.celular || ''

      map.set(cid, {
        cliente_id: cid,
        cliente_nome: nome,
        cliente_telefone: tel,
        orcamentos: [],
      })
    }
    map.get(cid).orcamentos.push(o)
  }

  let lista = Array.from(map.values()).map(g => ({
    ...g,
    total: g.orcamentos.reduce((acc, o) => acc + (Number(o.total_itens) || 0), 0),
  }))

  return lista.filter(g =>
    String(g.cliente_nome).toLowerCase().includes(f) ||
    String(g.cliente_telefone).toLowerCase().includes(f)
  )
})

function novoParaCliente(clienteId) {
  router.push({ path: '/orcamentos/novo', query: { cliente_id: String(clienteId) } })
}

function abrirListaDoCliente(clienteId) {
  router.push(`/orcamentos/cliente/${clienteId}`)
}

onMounted(carregar)
</script>