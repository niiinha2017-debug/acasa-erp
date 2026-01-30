<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in">
    
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <i class="pi pi-calendar-clock text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Fluxo de Agendamentos</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gestão de datas críticas e cronograma</p>
        </div>
      </div>

      <Button variant="secondary" @click="confirmarLimpar"class="!h-10 !rounded-xl !px-4 text-[10px] font-black uppercase border-slate-200">
        <i class="pi pi-filter-slash mr-2"></i> Limpar Filtro
      </Button>
    </div>

    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      
      <div class="p-6 border-b border-slate-100 bg-slate-50/30">
        <div class="max-w-2xl">
          <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
            <span class="w-1 h-3 bg-brand-primary rounded-full"></span>
            Localizar Cliente
          </label>
          <SearchInput
            v-model="clienteSelecionadoId"
            mode="select"
            placeholder="DIGITE O NOME DO CLIENTE OU RAZÃO SOCIAL..."
            :options="clientesOptions"
            labelKey="label"
            valueKey="value"
            class="w-full"
          />
          <div v-if="loadingClientes" class="mt-2 flex items-center gap-2 text-[9px] font-black text-brand-primary animate-pulse">
            <i class="pi pi-spin pi-spinner"></i> SINCRONIZANDO BASE...
          </div>
        </div>
      </div>

      <div class="p-8 min-h-[400px]">
        
        <div v-if="!clienteSelecionadoId" class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 text-slate-300">
            <i class="pi pi-search text-2xl"></i>
          </div>
          <h4 class="text-[11px] font-black text-slate-800 uppercase tracking-widest">Aguardando Cliente</h4>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Selecione um registro acima para gerenciar o cronograma.</p>
        </div>

        <div v-else-if="loadingObra" class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-10 h-10 border-3 border-slate-100 border-t-brand-primary rounded-full animate-spin mb-4"></div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Mapeando processo...</p>
        </div>

        <template v-else>
          <div v-if="!obraAtiva" class="max-w-md mx-auto py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl p-8">
            <div class="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <i class="pi pi-exclamation-triangle text-xl"></i>
            </div>
            <h3 class="text-xs font-black uppercase text-slate-800 tracking-widest">Processo não iniciado</h3>
            <p class="text-[10px] font-bold text-slate-400 uppercase mt-2 mb-6 leading-relaxed">Este cliente não possui um fluxo de obra ativo.</p>
            <Button
            v-if="!obraAtiva && can('agendamentos.criar')" 
            variant="primary" class="!h-11 !rounded-xl !px-8 shadow-lg shadow-brand-primary/20" :loading="creating" @click="confirmarCriarObra">
              
              Iniciar Obra Agora
            </Button>
          </div>

          <div v-else class="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            
            <div class="flex items-center justify-between p-5 bg-slate-900 rounded-xl text-white">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <i class="pi pi-briefcase text-sm"></i>
                </div>
                <div>
                  <span class="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Cliente Selecionado</span>
                  <h3 class="text-xs font-black uppercase tracking-wide">{{ clienteNome }}</h3>
                </div>
              </div>
              <div class="text-right border-l border-white/10 pl-6">
                <span class="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Etapa Atual</span>
                <div class="flex items-center gap-2 mt-1 justify-end">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span class="text-[10px] font-black uppercase text-emerald-400 tracking-widest">{{ obraAtiva.status_processo }}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div v-for="(label, key) in fieldLabels" :key="key" 
                   class="p-5 rounded-2xl border border-slate-100 bg-white hover:border-brand-primary/20 transition-all group">
                <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2.5 group-hover:text-brand-primary transition-colors">
                  {{ label }}
                </label>
                <div class="relative">
                  <input 
                    type="date" 
                    v-model="form[key]"
                    class="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-xs font-black text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all uppercase"
                  />
                </div>
              </div>
            </div>

            <div class="bg-brand-primary/5 border border-brand-primary/10 p-4 rounded-xl flex items-center gap-3">
              <i class="pi pi-info-circle text-brand-primary text-sm"></i>
              <p class="text-[9px] font-black text-brand-primary uppercase tracking-tight">
                As etapas do processo são atualizadas automaticamente conforme o preenchimento das datas.
              </p>
            </div>
          </div>
        </template>
      </div>

      <div v-if="obraAtiva" class="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest block leading-none">Última alteração</span>
          <span class="text-[10px] font-bold text-slate-600">Sincronizado com o servidor</span>
        </div>
        
        <Button 
         v-if="obraAtiva && can('agendamentos.editar')"
          variant="primary" 
         @click="confirmarSalvar"
          :loading="saving"
          class="!h-12 !px-10 !rounded-xl shadow-xl shadow-brand-primary/20 text-[10px] font-black uppercase tracking-widest"
        >
          <i class="pi pi-save mr-2"></i> Salvar Agendamentos
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ClienteService, ObrasService } from '@/services/index'
import { confirm } from '@/services/confirm' 
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'


definePage({ meta: { perm: 'agendamentos.ver' } })


// Mapeamento de labels para facilitar o v-for e manter o código limpo
const fieldLabels = {
  data_medida: 'Data da Medida',
  data_orcamento: 'Data do Orçamento',
  data_medida_fina: 'Data da Medida Fina',
  data_producao: 'Data da Produção',
  data_montagem: 'Data da Montagem'
}

const loadingClientes = ref(false)
const loadingObra = ref(false)
const saving = ref(false)
const creating = ref(false)
const clientes = ref([])
const clienteSelecionadoId = ref(null)
const obrasDoCliente = ref([])

const obraAtiva = computed(() => (obrasDoCliente.value?.length ? obrasDoCliente.value[0] : null))

const clienteNome = computed(() => {
  const id = Number(clienteSelecionadoId.value)
  const c = clientes.value.find(x => Number(x.id) === id)
  return c?.nome || c?.nome_completo || c?.razao_social || 'Desconhecido'
})

const clientesOptions = computed(() => {
  return (clientes.value || []).map(c => ({
    label: (c.nome || c.nome_completo || c.razao_social || `ID: ${c.id}`).toUpperCase(),
    value: c.id,
  }))
})

const form = reactive({
  data_medida: '',
  data_orcamento: '',
  data_medida_fina: '',
  data_producao: '',
  data_montagem: '',
})

// Helper para converter ISO para YYYY-MM-DD (Input Date)
function toInputDate(value) {
  if (!value) return ''
  return value.split('T')[0]
}

async function carregarClientes() {
  loadingClientes.value = true
  try {
    const res = await ClienteService.listar()
    clientes.value = res?.data || []
  } finally {
    loadingClientes.value = false
  }
}

async function carregarObras(clienteId) {
  loadingObra.value = true
  try {
    const res = await ObrasService.listarPorCliente(clienteId)
    obrasDoCliente.value = res?.data || []
    aplicarObraNoForm()
  } finally {
    loadingObra.value = false
  }
}

function aplicarObraNoForm() {
  const o = obraAtiva.value
  Object.keys(fieldLabels).forEach(key => {
    form[key] = o ? toInputDate(o[key]) : ''
  })
}

async function criarObra() {
  const id = Number(clienteSelecionadoId.value)
  if (!id) return

  if (!can('agendamentos.criar')) return notify.error('Acesso negado.')

  creating.value = true
  try {
    await ObrasService.criar({ cliente_id: id, status_processo: 'MEDIDA_PENDENTE' })
    await carregarObras(id)
  } finally {
    creating.value = false
  }
}


async function salvar() {
   if (!can('agendamentos.editar')) return notify.error('Acesso negado.')
  const o = obraAtiva.value
  if (!o?.id) return
  saving.value = true
  try {
    // Envia as datas; o backend se encarrega de converter para ISO
    await ObrasService.salvar(o.id, { ...form })
    await carregarObras(Number(clienteSelecionadoId.value))
  } finally {
    saving.value = false
  }
}

// LIMPAR
async function confirmarLimpar() {
  const ok = await confirm({
    title: 'LIMPAR FILTRO',
    message: 'Isso vai remover o cliente selecionado e limpar os dados exibidos na tela.',
    confirmText: 'LIMPAR',
    cancelText: 'CANCELAR',
    danger: true,
  })
  if (!ok) return
  limpar()
}

// CRIAR OBRA
async function confirmarCriarObra() {
  const id = Number(clienteSelecionadoId.value)
  if (!id) return

  const ok = await confirm({
    title: 'INICIAR OBRA',
    message: 'Deseja iniciar o fluxo de obra para este cliente agora?',
    confirmText: 'INICIAR',
    cancelText: 'CANCELAR',
  })
  if (!ok) return
  await criarObra()
}


// SALVAR
async function confirmarSalvar() {
  const ok = await confirm({
    title: 'SALVAR AGENDAMENTOS',
    message: 'Deseja salvar as datas informadas para este cliente?',
    confirmText: 'SALVAR',
    cancelText: 'CANCELAR',
  })
  if (!ok) return
  await salvar()
}


function limpar() {
  clienteSelecionadoId.value = null
  obrasDoCliente.value = []
}

onMounted(carregarClientes)

watch(clienteSelecionadoId, async (val) => {
  if (val) await carregarObras(Number(val))
  else aplicarObraNoForm()
})
</script>