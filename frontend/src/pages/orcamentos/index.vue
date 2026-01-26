<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      <Card hoverable class="p-6 flex items-center gap-5 bg-white border-none shadow-xl shadow-slate-200/50">
        <div class="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
          <i class="pi pi-briefcase text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Geral</p>
          <div class="flex items-baseline gap-2">
            <p class="text-3xl font-black text-slate-800 tracking-tighter">{{ rows.length }}</p>
            <span class="text-[9px] font-bold text-slate-400 uppercase italic">Projetos</span>
          </div>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-5 bg-white border-none shadow-xl shadow-slate-200/50">
        <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
          <i class="pi pi-users text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Carteira Ativa</p>
          <p class="text-3xl font-black text-blue-600 tracking-tighter">{{ grupos.length }}</p>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-5 bg-white border-none shadow-xl shadow-slate-200/50">
        <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
          <i class="pi pi-dollar text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Volume Negociado</p>
          <p class="text-xl font-black text-emerald-600 tracking-tighter">
            {{ format.currency(rows.reduce((acc, o) => acc + (Number(o.total_itens) || 0), 0)) }}
          </p>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-5 bg-white border-none shadow-xl shadow-slate-200/50">
        <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
          <i class="pi pi-clock text-xl animate-pulse"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Recentes</p>
          <p class="text-3xl font-black text-amber-600 tracking-tighter">{{ rows.slice(0, 5).length }}</p>
        </div>
      </Card>
    </div>

    <Card :shadow="true" class="!rounded-[3rem] overflow-hidden border-none shadow-2xl shadow-slate-200/60 bg-white">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-10 bg-slate-50/50 border-b border-slate-100">
        <div class="flex items-center gap-5">
          <div class="w-12 h-12 rounded-[1.2rem] bg-slate-800 flex items-center justify-center text-white shadow-lg">
            <i class="pi pi-briefcase text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-black tracking-tight text-slate-800 uppercase italic">Orçamentos</h2>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controle de propostas comerciais</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4 w-full md:w-auto">
          <div class="relative flex-1 md:w-96 group">
            <i class="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-brand-primary transition-colors"></i>
            <input 
              v-model="filtro" 
              type="text" 
              placeholder="BUSCAR CLIENTE OU CPF..."
              class="w-full pl-12 pr-4 h-14 bg-white border border-slate-200 rounded-[1.2rem] text-[10px] font-black focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all uppercase tracking-widest"
            />
          </div>
          
          <Button variant="primary" class="!h-14 !rounded-[1.2rem] !px-8 shadow-xl shadow-brand-primary/20 font-black text-[10px] uppercase tracking-widest" @click="router.push('/orcamentos/novo')">
            <i class="pi pi-plus mr-3"></i> Novo Orçamento
          </Button>
        </div>
      </header>

      <div class="p-6">
        <Table
          :columns="columns"
          :rows="grupos"
          :loading="loading"
          empty-text="Nenhum orçamento encontrado."
          class="!border-none"
        >
          <template #cell-cliente="{ row }">
            <div class="flex flex-col py-2">
              <span class="text-[12px] font-black text-slate-800 leading-tight uppercase tracking-tight">
                {{ row.cliente_nome || 'CLIENTE NÃO IDENTIFICADO' }}
              </span>
              <div class="flex items-center gap-2 mt-1">
                <i class="pi pi-phone text-[8px] text-slate-300"></i>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {{ row.cliente_telefone || 'SEM TELEFONE' }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-orcamentos="{ row }">
            <div class="flex flex-wrap gap-2 justify-end">
              <button
                v-for="o in row.orcamentos"
                :key="o.id"
                class="h-8 px-3 rounded-lg border border-slate-100 text-[9px] font-black text-slate-500
                       hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all bg-slate-50 shadow-sm flex items-center"
                @click="router.push(`/orcamentos/${o.id}`)"
              >
                #{{ o.id }}
              </button>
            </div>
          </template>

          <template #cell-total="{ row }">
            <div class="flex flex-col items-end py-1">
              <span class="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Acumulado</span>
              <span class="text-[13px] font-black text-emerald-600 tabular-nums">
                {{ format.currency(row.total || 0) }}
              </span>
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <button 
                @click="novoParaCliente(row.cliente_id)"
                class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100 flex items-center justify-center shadow-sm"
                title="Novo Orçamento para este cliente"
              >
                <i class="pi pi-plus text-[10px] font-bold"></i>
              </button>
              
              <button 
                @click="abrirListaDoCliente(row.cliente_id)"
                class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-slate-100 flex items-center justify-center shadow-sm"
                title="Ver histórico"
              >
                <i class="pi pi-list text-[10px]"></i>
              </button>
            </div>
          </template>
        </Table>
      </div>
    </Card>
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
  { key: 'cliente', label: 'Cliente / Documento', width: '40%' },
  { key: 'orcamentos', label: 'Projetos Vinculados', width: '26%', align: 'right' },
  { key: 'total', label: 'Financeiro', width: '18%', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '16%', align: 'right' },
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

  const nome = String(
    cli.nome_completo ||
    cli.razao_social ||
    cli.nome_fantasia ||
    o.cliente_nome_snapshot ||
    ''
  )

  const tel = String(
    cli.whatsapp ||
    cli.telefone ||
    cli.contato ||
    cli.celular ||
    ''
  )

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

lista = lista.filter(g =>
  String(g.cliente_nome || '').toLowerCase().includes(f) ||
  String(g.cliente_telefone || '').toLowerCase().includes(f)
)

  return lista
})


function novoParaCliente(clienteId) {
  router.push({ path: '/orcamentos/novo', query: { cliente_id: String(clienteId) } })
}

function abrirListaDoCliente(clienteId) {
  router.push(`/orcamentos/cliente/${clienteId}`)
}

onMounted(carregar)
</script>