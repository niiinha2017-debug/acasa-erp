<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-700">
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card hoverable class="p-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-slate-900/10 text-slate-900 flex items-center justify-center">
          <i class="pi pi-file-edit text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Projetos</p>
          <p class="text-xl font-black text-[var(--text-main)]">{{ rows.length }}</p>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
          <i class="pi pi-users text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-blue-500">Clientes Ativos</p>
          <p class="text-xl font-black text-[var(--text-main)]">{{ grupos.length }}</p>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <i class="pi pi-dollar text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-emerald-500">Valor Acumulado</p>
          <p class="text-xl font-black text-[var(--text-main)]">
            {{ format.currency(rows.reduce((acc, o) => acc + (Number(o.total_itens) || 0), 0)) }}
          </p>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <i class="pi pi-clock text-xl animate-pulse"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-amber-500">Recentes</p>
          <p class="text-xl font-black text-[var(--text-main)]">{{ rows.slice(0, 5).length }}</p>
        </div>
      </Card>
    </div>

    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-[var(--border-ui)]">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-8 border-b border-[var(--border-ui)] bg-slate-500/5">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <i class="pi pi-briefcase text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-black tracking-tight text-[var(--text-main)] uppercase">Orçamentos</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestão de propostas e itens técnicos</p>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="relative flex-1 md:w-96">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              v-model="filtro" 
              type="text" 
              placeholder="BUSCAR POR CLIENTE OU CPF..."
              class="w-full pl-10 pr-4 h-11 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all uppercase"
            />
          </div>
          
          <Button variant="primary" class="!h-11 !rounded-2xl !px-6 shadow-xl shadow-brand-primary/20" @click="router.push('/orcamentos/novo')">
            <i class="pi pi-plus mr-2 text-xs"></i>
            Novo Orçamento
          </Button>
        </div>
      </header>

      <div class="p-4">
        <Table
          :columns="columns"
          :rows="grupos"
          :loading="loading"
          empty-text="Nenhum orçamento encontrado."
          class="!border-none"
        >
          <template #cell-cliente="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-[14px] font-black text-gray-900 leading-tight uppercase tracking-tight">
                {{ row.cliente_nome_snapshot || 'CLIENTE NÃO IDENTIFICADO' }}
              </span>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {{ row.cliente_cpf_snapshot || 'SEM CPF/CNPJ' }}
              </span>
            </div>
          </template>

          <template #cell-orcamentos="{ row }">
            <div class="flex flex-wrap gap-2 justify-end">
              <button
                v-for="o in row.orcamentos"
                :key="o.id"
                class="px-3 py-1.5 rounded-xl border border-slate-200 text-[10px] font-black text-slate-700
                       hover:border-brand-primary hover:text-brand-primary transition-all bg-white shadow-sm"
                @click="router.push(`/orcamentos/${o.id}`)"
              >
                #{{ o.id }}
              </button>
            </div>
          </template>

          <template #cell-total="{ row }">
            <div class="flex flex-col items-end py-1">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Acumulado</span>
              <span class="text-sm font-black text-brand-primary">
                {{ format.currency(row.total || 0) }}
              </span>
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <button 
                @click="novoParaCliente(row.cliente_id)"
                class="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                title="Novo Orçamento para este cliente"
              >
                <i class="pi pi-plus text-xs font-bold"></i>
              </button>
              <button 
                @click="abrirListaDoCliente(row.cliente_id)"
                class="p-2.5 rounded-xl bg-slate-500/10 text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                title="Ver todos deste cliente"
              >
                <i class="pi pi-list text-xs"></i>
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
      map.set(cid, {
        cliente_id: cid,
        cliente_nome_snapshot: o.cliente_nome_snapshot || '',
        cliente_cpf_snapshot: o.cliente_cpf_snapshot || '',
        orcamentos: [],
      })
    }
    map.get(cid).orcamentos.push(o)
  }

  let lista = Array.from(map.values()).map(g => ({
    ...g,
    total: g.orcamentos.reduce((acc, o) => acc + (Number(o.total_itens) || 0), 0)
  }))

  if (f) {
    lista = lista.filter(g => 
      g.cliente_nome_snapshot.toLowerCase().includes(f) || 
      g.cliente_cpf_snapshot.toLowerCase().includes(f)
    )
  }
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