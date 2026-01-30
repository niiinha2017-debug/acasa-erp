<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in">
    
    <!-- Header Compacto -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <i class="pi pi-id-card text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Clientes</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base estratégica de contatos</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <div class="relative w-full sm:w-56">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input 
            v-model="filtro" 
            type="text" 
            placeholder="Buscar por nome, CPF ou CNPJ..."
            class="w-full pl-9 pr-3 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
          />
        </div>
        
<Button
  v-if="can('clientes.criar')"
  variant="primary"
  size="md"
  class="!h-10 !rounded-xl !px-4 text-xs font-black uppercase tracking-wider"
  @click="router.push('/clientes/novo')"
>

          <i class="pi pi-plus mr-1.5 text-[10px]"></i>
          Novo
        </Button>
      </div>
    </div>

    <!-- Cards Compactos -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Total</p>
        <p class="text-xl font-black text-slate-800">{{ clientes.length }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600">Ativos</p>
        <p class="text-xl font-black text-emerald-700">{{ totalAtivos }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-white border border-blue-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">Cidades</p>
        <p class="text-xl font-black text-blue-700">{{ totalCidades }}</p>
      </div>
    </div>

    <!-- Tabela Compacta -->
    <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table
        :columns="columns"
        :rows="clientesFiltrados"
        :loading="carregando"
        :empty-text="filtro ? 'Nenhum cliente encontrado para sua busca' : 'Nenhum cliente cadastrado'"
        :boxed="false"
      >
        <template #cell-cliente="{ row }">
          <div class="flex items-center gap-3 py-1">
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
              {{ (row.nome_completo || row.razao_social || '?').substring(0,2).toUpperCase() }}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-bold text-slate-800 truncate">
                {{ row.nome_completo || row.razao_social }}
              </span>
              <span class="text-[10px] font-medium text-slate-500 truncate">
                {{ row.cpf || row.cnpj || 'Sem documento' }}
              </span>
            </div>
          </div>
        </template>

        <template #cell-status="{ row }">
          <span 
            class="px-2 py-1 rounded text-[9px] font-black uppercase inline-flex items-center gap-1"
            :class="getStatusClasses(row.status)"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDotClasses(row.status)"></span>
            {{ row.status || 'INATIVO' }}
          </span>
        </template>

        <template #cell-localizacao="{ row }">
          <div class="flex flex-col">
            <span class="text-sm font-medium text-slate-700">{{ row.cidade || '—' }}</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase">
              {{ row.estado || '—' }}
            </span>
          </div>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-end gap-1">
            <button 
                v-if="can('clientes.editar')"
                @click="editarCliente(row.id)"
              class="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center"
            >
              <i class="pi pi-pencil text-xs"></i>
            </button>
            <button 
  v-if="can('clientes.excluir')"
  @click="excluirCliente(row.id)"
              class="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
            >
              <i class="pi pi-trash text-xs"></i>
            </button>
          </div>
        </template>
      </Table>

      <!-- Footer Minimalista -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-2 p-4 border-t border-slate-200 text-[11px]">
        <div class="text-slate-500 font-medium">
          {{ clientesFiltrados.length }} de {{ clientes.length }} cliente{{ clientes.length !== 1 ? 's' : '' }}
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              v-model="mostrarInativos"
              class="w-3.5 h-3.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/20"
            >
            <span class="text-slate-600 text-[10px] font-medium">Mostrar inativos</span>
          </label>
          <button 
            @click="exportarClientes"
            class="text-slate-600 hover:text-brand-primary text-[10px] font-medium flex items-center gap-1"
          >
            <i class="pi pi-download text-[10px]"></i>
            Exportar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ClienteService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'clientes.ver' } })



const router = useRouter()

// Estado
const filtro = ref('')
const carregando = ref(false)
const mostrarInativos = ref(false)
const clientes = ref([])

// Computed
const clientesFiltrados = computed(() => {
  let filtrados = clientes.value
  
  // Filtrar inativos se necessário
  if (!mostrarInativos.value) {
    filtrados = filtrados.filter(c => c.status === 'ATIVO')
  }
  
  // Aplicar filtro de busca
  if (filtro.value) {
    const termo = filtro.value.toLowerCase().trim()
    filtrados = filtrados.filter(c => 
      (c.nome_completo && c.nome_completo.toLowerCase().includes(termo)) ||
      (c.razao_social && c.razao_social.toLowerCase().includes(termo)) ||
      (c.cpf && c.cpf.includes(termo)) ||
      (c.cnpj && c.cnpj.includes(termo)) ||
      (c.email && c.email.toLowerCase().includes(termo)) ||
      (c.whatsapp && c.whatsapp.includes(termo)) ||
      (c.cidade && c.cidade.toLowerCase().includes(termo)) ||
      (c.estado && c.estado.toLowerCase().includes(termo))
    )
  }
  
  return filtrados
})

const totalAtivos = computed(() => 
  clientes.value.filter(c => c.status === 'ATIVO').length
)

const totalCidades = computed(() => 
  new Set(clientes.value.map(c => c.cidade).filter(Boolean)).size
)

// Métodos utilitários
const getStatusClasses = (status) => {
  const statusMap = {
    'ATIVO': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    'INATIVO': 'bg-slate-100 text-slate-500 border border-slate-200',
    'PENDENTE': 'bg-amber-50 text-amber-600 border border-amber-100',
    'BLOQUEADO': 'bg-red-50 text-red-600 border border-red-100'
  }
  return statusMap[status] || statusMap['INATIVO']
}

const getStatusDotClasses = (status) => {
  const dotMap = {
    'ATIVO': 'bg-emerald-500',
    'INATIVO': 'bg-slate-400',
    'PENDENTE': 'bg-amber-500',
    'BLOQUEADO': 'bg-red-500'
  }
  return dotMap[status] || dotMap['INATIVO']
}

// Métodos de ação
const editarCliente = (id) => {
  if (!can('clientes.editar')) return notify.error('Acesso negado.')
  router.push(`/clientes/${id}`)
}

async function excluirCliente(id) {
    if (!can('clientes.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir Cliente?', 'Esta ação não pode ser desfeita.')
  if (!ok) return

  const cleanId = Number(id)

  try {
    await ClienteService.remover(cleanId)

    // atualiza lista local
    clientes.value = clientes.value.filter(c => Number(c.id) !== cleanId)

    notify.success('Cliente removido com sucesso')
  } catch (e) {
    console.error('Erro ao excluir cliente:', e)
    const apiMsg = e?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : (apiMsg || 'Não foi possível excluir o cliente'))
  }
}


const exportarClientes = () => {
  const dadosParaExportar = clientesFiltrados.value.map(c => ({
    'ID': c.id,
    'Nome/Razão Social': c.nome_completo || c.razao_social,
    'CPF/CNPJ': c.cpf || c.cnpj,
    'Status': c.status,
    'Cidade': c.cidade,
    'Estado': c.estado,
    'E-mail': c.email,
    'WhatsApp': c.whatsapp,
    'Telefone': c.telefone
  }))
  
  const csvContent = [
    Object.keys(dadosParaExportar[0] || {}).join(','),
    ...dadosParaExportar.map(row => Object.values(row).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

// Colunas da tabela
const columns = [
  { key: 'cliente', label: 'CLIENTE', width: '40%' },
  { key: 'status', label: 'STATUS', width: '15%' },
  { key: 'localizacao', label: 'LOCALIZAÇÃO', width: '25%' },
  { key: 'acoes', label: '', align: 'right', width: '20%' }
]

// Carregar dados da API
const carregarClientes = async () => {
  try {
    carregando.value = true
    const response = await ClienteService.listar()
    clientes.value = response.data || []
  } catch (error) {
    console.error('Erro ao carregar clientes:', error)
    clientes.value = []
  } finally {
    carregando.value = false
  }
}

// Carregar dados ao montar componente
onMounted(carregarClientes)
</script>