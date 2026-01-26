<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card hoverable class="p-6 flex items-center gap-5 border-none shadow-sm bg-white/80 backdrop-blur">
        <div class="w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shadow-inner">
          <i class="pi pi-users text-2xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total de Clientes</p>
          <p class="text-3xl font-black text-slate-800">{{ clientes.length }}</p>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-5 border-none shadow-sm bg-white/80 backdrop-blur">
        <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
          <i class="pi pi-user-plus text-2xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ativos</p>
          <p class="text-3xl font-black text-slate-800">{{ totalAtivos }}</p>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-5 border-none shadow-sm bg-white/80 backdrop-blur">
        <div class="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner">
          <i class="pi pi-map-marker text-2xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cidades</p>
          <p class="text-3xl font-black text-slate-800">{{ totalCidades }}</p>
        </div>
      </Card>
    </div>

    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-border-ui shadow-2xl bg-white">
      <header class="flex flex-col lg:flex-row items-center justify-between gap-6 p-8 lg:p-10 border-b border-border-ui bg-slate-50/50">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl rotate-3">
            <i class="pi pi-id-card text-xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-black tracking-tight text-slate-800 uppercase">Gestão de Clientes</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sua base estratégica de contatos</p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div class="relative w-full sm:w-80 group">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors"></i>
            <input 
              v-model="filtro" 
              type="text" 
              placeholder="Ex: Nome, CPF ou CNPJ..."
              class="w-full pl-11 pr-4 h-14 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all shadow-sm"
            />
          </div>
          
          <Button 
            variant="primary" 
            class="h-14 !rounded-2xl !px-8 w-full sm:w-auto shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all" 
            @click="router.push('/clientes/novo')"
          >
            <i class="pi pi-plus mr-2 text-xs"></i>
            ADICIONAR NOVO
          </Button>
        </div>
      </header>

      <div class="p-2">
        <Table :columns="columns" :rows="clientesFiltrados" :loading="carregando" class="!border-none">
          
          <template #cell-cliente="{ row }">
            <div class="flex items-center gap-3 py-2">
              <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shadow-inner">
                {{ (row.nome_completo || row.razao_social || '?').substring(0,2).toUpperCase() }}
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-black text-slate-700 uppercase leading-none mb-1">
                  {{ row.nome_completo || row.razao_social }}
                </span>
                <span class="text-[10px] font-bold text-slate-400 tracking-wider">
                  {{ row.cpf || row.cnpj || 'DOC. NÃO INFORMADO' }}
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

          <template #cell-localizacao="{ row }">
            <div class="flex flex-col">
              <span class="text-sm font-black text-slate-600 uppercase">{{ row.cidade }}</span>
              <span class="text-[10px] font-bold text-brand-primary opacity-70 tracking-tighter uppercase">{{ row.estado }}</span>
            </div>
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-3 px-4">
              <button @click="router.push(`/clientes/${row.id}`)" class="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-brand-primary hover:text-white transition-all shadow-sm flex items-center justify-center group">
                <i class="pi pi-pencil text-xs group-hover:scale-110 transition-transform"></i>
              </button>
              <button @click="excluir(row)" class="h-10 w-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center group">
                <i class="pi pi-trash text-xs group-hover:rotate-12 transition-transform"></i>
              </button>
            </div>
          </template>

        </Table>

        <div v-if="clientesFiltrados.length === 0 && !carregando" class="py-20 text-center">
          <i class="pi pi-search text-4xl text-slate-200 mb-4"></i>
          <p class="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">Nenhum cliente encontrado para sua busca</p>
        </div>
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