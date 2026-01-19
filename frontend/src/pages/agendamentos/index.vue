<template>
  <Card class="max-w-5xl mx-auto overflow-hidden">
    <PageHeader
      title="Fluxo de Agendamentos"
      subtitle="Gerencie as datas críticas do processo de cada cliente"
      icon="pi pi-calendar-clock"
    >
      <template #actions>
        <Button variant="secondary" type="button" @click="limpar" class="!rounded-xl">
          <i class="pi pi-filter-slash mr-2"></i>
          Limpar Filtro
        </Button>
      </template>
    </PageHeader>

    <form class="p-8 space-y-8" @submit.prevent="salvar">
      
      <div class="bg-slate-500/5 p-6 rounded-[2rem] border border-[var(--border-ui)] space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center shadow-sm">
            <i class="pi pi-search text-xs"></i>
          </div>
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Localizar Cliente</span>
        </div>

        <SearchInput
          v-model="clienteSelecionadoId"
          mode="select"
          label="Selecione o Cliente para gerenciar"
          placeholder="Comece a digitar o nome do cliente..."
          :options="clientesOptions"
          labelKey="label"
          valueKey="value"
          class="w-full"
        />
        
        <div v-if="loadingClientes" class="flex items-center gap-2 text-[10px] font-bold text-brand-primary animate-pulse">
          <i class="pi pi-spin pi-spinner"></i> SINCRONIZANDO BASE DE DADOS...
        </div>
      </div>

      <div v-if="!clienteSelecionadoId" class="py-12 text-center space-y-3">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
          <i class="pi pi-user text-3xl"></i>
        </div>
        <p class="text-sm font-bold text-slate-400">Aguardando seleção de cliente para exibir o cronograma.</p>
      </div>

      <div v-else-if="loadingObra" class="py-12 text-center">
        <i class="pi pi-spin pi-spinner text-3xl text-brand-primary"></i>
        <p class="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Mapeando processo...</p>
      </div>

      <template v-else>
        
        <div v-if="!obraAtiva" class="bg-amber-500/5 border border-amber-500/20 p-8 rounded-[2rem] text-center space-y-4">
          <i class="pi pi-exclamation-triangle text-amber-500 text-3xl"></i>
          <h3 class="text-sm font-black uppercase text-amber-900">Processo não iniciado</h3>
          <p class="text-sm font-medium text-amber-700 max-w-xs mx-auto">
            Este cliente ainda não possui uma obra vinculada para agendamentos.
          </p>
          <Button
            variant="primary"
            class="!rounded-2xl shadow-lg shadow-amber-500/20"
            :loading="creating"
            @click="criarObra"
          >
            <i class="pi pi-plus-circle mr-2"></i>
            Iniciar Obra Agora
          </Button>
        </div>

        <div v-else class="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          <div class="flex items-center justify-between p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <i class="pi pi-briefcase text-xl"></i>
              </div>
              <div>
                <span class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Cliente em foco</span>
                <h3 class="text-lg font-black uppercase leading-none">{{ clienteNome }}</h3>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Status do Fluxo</span>
              <div class="flex items-center gap-2 mt-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-xs font-black uppercase tracking-wider text-emerald-400">{{ obraAtiva.status_processo }}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="(label, key) in fieldLabels" :key="key" 
                 class="p-5 rounded-3xl border border-slate-100 bg-white hover:border-brand-primary/30 transition-all group">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 group-hover:text-brand-primary transition-colors">
                {{ label }}
              </label>
              <input 
                type="date" 
                v-model="form[key]"
                class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-primary outline-none transition-all"
              />
            </div>
          </div>

          <div class="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex items-center gap-4">
            <i class="pi pi-info-circle text-blue-500"></i>
            <p class="text-[11px] font-semibold text-blue-700 uppercase tracking-tight">
              Dica: Ao preencher uma data e salvar, o sistema atualizará automaticamente o status do processo para a próxima etapa.
            </p>
          </div>
        </div>
      </template>

      <div class="pt-8 border-t border-slate-100 flex items-center justify-between">
        <div class="flex flex-col">
          <span v-if="obraAtiva" class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ação Necessária</span>
          <span class="text-sm font-bold text-slate-700">{{ obraAtiva ? 'Atualizar cronograma' : 'Selecione uma obra' }}</span>
        </div>
        
        <div class="flex gap-3">
          <Button 
            v-if="obraAtiva"
            variant="primary" 
            size="lg"
            type="submit"
            :loading="saving"
            class="!px-10 !rounded-2xl shadow-xl shadow-brand-primary/20"
          >
            <i class="pi pi-save mr-2"></i>
            Salvar Agendamentos
          </Button>
        </div>
      </div>
    </form>
  </Card>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ClienteService, ObrasService } from '@/services/index'

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
  creating.value = true
  try {
    await ObrasService.criar({ cliente_id: id, status_processo: 'MEDIDA_PENDENTE' })
    await carregarObras(id)
  } finally {
    creating.value = false
  }
}

async function salvar() {
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