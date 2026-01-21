<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-700">

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    
    <Card hoverable class="p-6 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
        <i class="pi pi-users text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Clientes</p>
        <p class="text-2xl font-black text-[var(--text-main)]">{{ clientes.length }}</p>
      </div>
    </Card>

    <Card hoverable class="p-6 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
        <i class="pi pi-user-plus text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Ativos</p>
        <p class="text-2xl font-black text-[var(--text-main)]">{{ totalAtivos }}</p>
      </div>
    </Card>

    <Card hoverable class="p-6 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
        <i class="pi pi-map-marker text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Cidades Atendidas</p>
        <p class="text-2xl font-black text-[var(--text-main)]">{{ totalCidades }}</p>
      </div>
    </Card>

  </div>

    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-[var(--border-ui)]">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-8 border-b border-[var(--border-ui)] bg-slate-500/5">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <i class="pi pi-id-card"></i>
          </div>
          <div>
            <h2 class="text-xl font-black tracking-tight text-[var(--text-main)] uppercase">Clientes</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Base de dados e contatos comerciais</p>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="relative flex-1 md:w-80">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
<input 
  v-model="filtro" 
  type="text" 
  placeholder="Buscar por nome ou CPF/CNPJ..."
  class="w-full pl-10 pr-4 h-11 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
/>
          </div>
          
          <Button variant="primary" class="!h-11 !rounded-2xl !px-6 shadow-xl shadow-brand-primary/20" @click="router.push('/clientes/novo')">
            <i class="pi pi-plus mr-2 text-xs"></i>
            Novo Cliente
          </Button>
        </div>
      </header>

      <div class="p-4">
        <Table :columns="columns" :rows="clientesFiltrados" :loading="carregando" class="!border-none">
          <template #cell-cliente="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">
                {{ row.nome_completo || row.razao_social }}
              </span>
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                {{ row.cpf || row.cnpj || '---' }}
              </span>
            </div>
          </template>

          <template #cell-contato="{ row }">
            <div class="flex flex-col">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-tighter">WhatsApp</span>
              <span class="text-sm font-black text-[var(--text-main)] italic">{{ row.celular || '---' }}</span>
            </div>
          </template>

          <template #cell-localizacao="{ row }">
            <div class="flex flex-col">
              <span class="text-[9px] font-black text-brand-primary uppercase tracking-widest">Cidade/UF</span>
              <span class="text-sm font-black text-[var(--text-main)] uppercase">{{ row.cidade }} / {{ row.uf }}</span>
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <button @click="router.push(`/clientes/${row.id}`)" class="p-2.5 rounded-xl bg-slate-500/10 text-slate-500 hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                <i class="pi pi-pencil text-xs"></i>
              </button>
              <button @click="excluir(row)" class="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
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
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const filtro = ref('')
const carregando = ref(false)
const clientes = ref([])

const columns = [
  { key: 'cliente', label: 'Nome do Cliente / Detalhes' },
  { key: 'localizacao', label: 'Localização', width: '250px' },
  { key: 'status', label: 'Situação', width: '150px', align: 'center' },
  { key: 'acoes', label: '', width: '120px', align: 'right' }
]

// KPI COMPUTED
const totalAtivos = computed(() => clientes.value.filter(c => c.status === 'ATIVO').length)
const totalCidades = computed(() => new Set(clientes.value.map(c => c.cidade).filter(Boolean)).size)
const novosNoMes = computed(() => {
  const trintaDiasAtras = new Date()
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
  return clientes.value.filter(c => new Date(c.created_at) >= trintaDiasAtras).length
})

const clientesFiltrados = computed(() => {
  const termo = filtro.value.toLowerCase().trim()
  if (!termo) return clientes.value
  return clientes.value.filter(c => 
    (c.nome_completo || '').toLowerCase().includes(termo) ||
    (c.cpf || '').includes(termo) ||
    (c.cnpj || '').includes(termo)
  )
})

async function carregar() {
  carregando.value = true
  try {
    const { data } = await api.get('/clientes')
    clientes.value = data || []
  } finally {
    carregando.value = false
  }
}

async function excluir(row) {
  if (confirm(`Deseja excluir o cliente ${row.nome_completo}?`)) {
    await api.delete(`/clientes/${row.id}`)
    carregar()
  }
}

onMounted(carregar)
</script>