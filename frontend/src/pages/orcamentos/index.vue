<template>
    <PageHeader 
      title="Orçamentos"
      subtitle="Controle de propostas comerciais e negociações"
      icon="pi pi-briefcase"
    >
      <template #actions>
        <Button
          v-if="can('orcamentos.criar')"
          variant="primary"
          @click="novoGeral"
        >
          <i class="pi pi-plus mr-2"></i>
          Novo Orçamento
        </Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        label="Total Geral"
        :value="rows.length"
        icon="pi pi-file"
        color="slate"
      />
      
      <MetricCard
        label="Carteira Ativa"
        :value="grupos.length"
        icon="pi pi-folder-open"
        color="blue"
      />

       <MetricCard
        label="Volume Negociado"
        :value="format.currency(valorTotalGeral)"
        icon="pi pi-dollar"
        color="emerald"
      />

       <MetricCard
        label="Aprovados"
        :value="rows.filter(r => r.status === 'APROVADO').length"
        icon="pi pi-check-circle"
        color="amber"
      />
    </div>

    <div class="space-y-4">
      <div class="w-full md:w-96">
        <SearchInput
          v-model="filtro"
          placeholder="Buscar cliente, telefone ou ID..."
        />
      </div>

       <!-- Grupos de Orçamento (Accordion simplificado ou Cards) -->
       <!-- Como a lógica original agrupava por cliente, manterei a lógica de visualização mas padronizada -->
       
       <div v-if="loading" class="text-center py-10">
          <i class="pi pi-spin pi-spinner text-2xl text-slate-400"></i>
       </div>

       <div v-else-if="grupos.length === 0" class="text-center py-20 bg-white border border-slate-200 rounded-xl">
          <i class="pi pi-inbox text-4xl text-slate-200 mb-2"></i>
          <p class="text-slate-400 font-bold uppercase text-xs">Nenhum orçamento encontrado</p>
       </div>

       <div v-else class="space-y-4">
          <div 
            v-for="grupo in grupos" 
            :key="grupo.clienteId"
            class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <div class="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
               <div class="flex items-center gap-3">
                 <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-black text-xs">
                    {{ grupo.orcamentos.length }}
                 </div>
                 <div>
                    <h3 class="text-sm font-black text-slate-800 uppercase tracking-tight">{{ grupo.clienteNome }}</h3>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                       Histórico de negociações
                    </p>
                 </div>
               </div>
               <div class="text-right">
                  <span class="block text-xs font-black text-slate-700">{{ format.currency(grupo.total) }}</span>
               </div>
            </div>
            
            <div class="divide-y divide-slate-50">
               <div 
                 v-for="orc in grupo.orcamentos" 
                 :key="orc.id"
                 class="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
               >
                 <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                       <span class="text-xs font-bold text-slate-900">#{{ orc.id }}</span>
                       <StatusBadge :value="orc.status" />
                       <span class="text-[10px] text-slate-400 font-medium ml-2">{{ format.date(orc.created_at) }}</span>
                    </div>
                    <p v-if="orc.descricao" class="text-xs text-slate-500 line-clamp-1">{{ orc.descricao }}</p>
                 </div>
                 
                 <div class="flex items-center gap-4">
                    <span class="text-sm font-black text-slate-800">{{ format.currency(orc.valor_total) }}</span>
                    
                    <div class="flex gap-1.5">
                       <button 
                         @click="editar(orc.id)"
                         class="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center"
                         title="Editar"
                       >
                         <i class="pi pi-pencil text-[10px]"></i>
                       </button>
                       <button 
                         @click="gerarPdf(orc.id)"
                         class="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"
                         title="PDF"
                       >
                         <i class="pi pi-file-pdf text-[10px]"></i>
                       </button>
                       <button 
                          v-if="can('orcamentos.excluir')"
                          @click="confirmarExcluir(orc.id)"
                          class="w-7 h-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center"
                       >
                         <i class="pi pi-trash text-[10px]"></i>
                       </button>
                    </div>
                 </div>
               </div>
            </div>
          </div>
       </div>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import api from '@/services/api'
import { format } from '@/utils/format'

definePage({ meta: { perm: 'orcamentos.ver' } })

const router = useRouter()
const loading = ref(true)
const rows = ref([])
const filtro = ref('')

// Lógica de Agrupamento
const grupos = computed(() => {
  const termo = String(filtro.value || '').toLowerCase().trim()
  
  // Primeiro filtra flat
  const filtrados = rows.value.filter(o => {
      if (!termo) return true
      const cli = String(o.cliente?.nome_completo || o.cliente?.nome || '').toLowerCase()
      const tel = String(o.cliente?.telefone || '').toLowerCase()
      const id = String(o.id)
      return cli.includes(termo) || tel.includes(termo) || id.includes(termo)
  })

  // Depois agrupa
  const map = {}
  filtrados.forEach(orc => {
      const cliId = orc.cliente_id || 'avulso'
      if (!map[cliId]) {
          map[cliId] = {
              clienteId: cliId,
              clienteNome: orc.cliente?.nome_completo || orc.cliente?.nome || 'Cliente não identificado',
              orcamentos: [],
              total: 0
          }
      }
      map[cliId].orcamentos.push(orc)
      map[cliId].total += Number(orc.valor_total || 0)
  })
  
  return Object.values(map).sort((a,b) => b.orcamentos[0]?.id - a.orcamentos[0]?.id)
})


const valorTotalGeral = computed(() => rows.value.reduce((acc, r) => acc + Number(r.valor_total || 0), 0))

async function carregar() {
  if (!can('orcamentos.ver')) return notify.error('Acesso negado.')
  loading.value = true
  try {
    const { data } = await api.get('/orcamentos')
    rows.value = Array.isArray(data) ? data : []
  } catch (e) {
    notify.error('Erro ao carregar orçamentos.')
  } finally {
    loading.value = false
  }
}

function novoGeral() {
    router.push('/orcamentos/novo')
}

function editar(id) {
    router.push(`/orcamentos/${id}`)
}

async function gerarPdf(id) {
    router.push(`/orcamentos/${id}/pdf`)
}

async function confirmarExcluir(id) {
  if (!can('orcamentos.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir Orçamento', `Deseja excluir o orçamento #${id}?`)
  if (!ok) return
  
  try {
      await api.delete(`/orcamentos/${id}`)
      notify.success('Orçamento excluído')
      await carregar()
  } catch (e) {
      notify.error('Erro ao excluir')
  }
}

onMounted(carregar)
</script>
