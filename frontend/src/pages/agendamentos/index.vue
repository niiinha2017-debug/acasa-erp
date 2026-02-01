<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-6 animate-page-in pb-10">
    
    <header class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-2">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-200 rotate-2 hover:rotate-0 transition-all duration-300">
          <i class="pi pi-calendar-clock text-xl"></i>
        </div>
        <div>
          <h1 class="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Fluxo de Agendamentos</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">Cronograma de datas críticas e produção</p>
        </div>
      </div>

      <button 
        @click="confirmarLimpar"
        class="group flex items-center gap-2 h-11 px-5 rounded-xl border border-slate-200 bg-white text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95"
      >
        <i class="pi pi-filter-slash text-[8px] group-hover:rotate-12 transition-transform"></i> 
        Limpar Filtro
      </button>
    </header>

    <div class="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden transition-all duration-500" :class="{ 'shadow-xl shadow-brand-primary/5 border-brand-primary/20': clienteSelecionadoId }">
      
      <div class="p-8 border-b border-slate-100 bg-slate-50/30">
        <div class="max-w-2xl relative">
          <div class="flex items-center gap-3 mb-4 ml-1">
            <span class="flex h-2 w-2 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
            </span>
            <label class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Selecione o Cliente para o Fluxo
            </label>
          </div>
          
          <SearchInput
            v-model="clienteSelecionadoId"
            mode="select"
            placeholder="PESQUISAR CLIENTE OU NOME DA EMPRESA..."
            :options="clientesOptions"
            labelKey="label"
            valueKey="value"
            class="w-full transform transition-transform focus-within:scale-[1.01]"
          />
          
          <div v-if="loadingClientes" class="absolute -bottom-6 left-1 flex items-center gap-2 text-[9px] font-black text-brand-primary italic">
            <i class="pi pi-spin pi-spinner text-[8px]"></i> Sincronizando base de dados...
          </div>
        </div>
      </div>

      <div class="p-10 min-h-[450px] relative">
        
        <div v-if="!clienteSelecionadoId" class="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
          <div class="w-24 h-24 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
            <i class="pi pi-users text-4xl text-slate-200"></i>
          </div>
          <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest">Aguardando Seleção</h4>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-2 max-w-[280px] leading-relaxed">
            Localize um parceiro comercial acima para gerenciar as datas do projeto.
          </p>
        </div>

        <div v-else-if="loadingObra" class="flex flex-col items-center justify-center py-24 text-center">
          <div class="w-12 h-12 border-4 border-slate-100 border-t-brand-primary rounded-full animate-spin mb-6"></div>
          <p class="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Cruzando dados da obra...</p>
        </div>

        <template v-else>
          <div v-if="!obraAtiva" class="max-w-xl mx-auto py-16 text-center border-2 border-dashed border-slate-100 rounded-[3rem] p-10 bg-slate-50/50">
            <div class="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <i class="pi pi-calendar-plus text-3xl"></i>
            </div>
            <h3 class="text-sm font-black uppercase text-slate-800 tracking-widest">Nenhum Cronograma Ativo</h3>
            <p class="text-[10px] font-bold text-slate-400 uppercase mt-3 mb-8 leading-relaxed px-10">
              Este cliente ainda não possui um fluxo de produção iniciado no sistema.
            </p>
            <button
              v-if="can('agendamentos.criar')" 
              @click="confirmarCriarObra"
              class="h-14 px-10 rounded-2xl bg-brand-primary text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/30 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3 mx-auto"
            >
              <i v-if="creating" class="pi pi-spin pi-spinner"></i>
              <i v-else class="pi pi-rocket"></i>
              Configurar Fluxo de Obra
            </button>
          </div>

          <div v-else class="space-y-10 animate-in slide-in-from-bottom-5 duration-700">
            
            <div class="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-900 rounded-[2rem] text-white shadow-2xl shadow-slate-200">
              <div class="flex items-center gap-5 mb-4 md:mb-0">
                <div class="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                  <i class="pi pi-briefcase text-xl text-brand-primary"></i>
                </div>
                <div>
                  <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Fluxo de Produção</span>
                  <h3 class="text-sm font-black uppercase tracking-wide mt-0.5">{{ clienteNome }}</h3>
                </div>
              </div>
              
              <div class="text-center md:text-right border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8 flex flex-col items-center md:items-end">
                <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Status do Processo</span>
                <div class="inline-flex items-center gap-2.5 mt-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                  <span class="text-[11px] font-black uppercase text-emerald-400 tracking-[0.15em]">{{ obraAtiva.status_processo }}</span>
                </div>
              </div>
            </div>

            <div class="relative">
              <div class="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
                <div v-for="(label, key) in fieldLabels" :key="key" 
                     class="p-6 rounded-3xl border border-slate-100 bg-white hover:border-brand-primary/30 hover:shadow-xl hover:shadow-slate-100/50 transition-all group flex flex-col items-center text-center">
                  
                  <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                    <i class="pi pi-calendar text-xs"></i>
                  </div>

                  <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 group-hover:text-slate-600 transition-colors">
                    {{ label }}
                  </label>
                  
                  <div class="w-full relative">
                    <input 
                      type="date" 
                      v-model="form[key]"
                      class="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 text-[11px] font-black text-slate-800 focus:bg-white focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all uppercase appearance-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <i class="pi pi-info-circle text-brand-primary text-sm"></i>
              </div>
              <p class="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                <strong class="text-slate-700">Inteligência de Processo:</strong> As etapas são alteradas automaticamente. 
                Sempre clique em <span class="text-brand-primary">Salvar</span> para registrar as mudanças.
              </p>
            </div>
          </div>
        </template>
      </div>

      <footer v-if="obraAtiva" class="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div class="text-center sm:text-left">
          <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Status da Sincronização</span>
          <div class="flex items-center gap-2">
            <i class="pi pi-check-circle text-emerald-500 text-xs"></i>
            <span class="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Dados Prontos para Gravação</span>
          </div>
        </div>
        
        <button 
          v-if="can('agendamentos.editar')"
          @click="confirmarSalvar"
          class="w-full sm:w-auto h-14 px-12 rounded-2xl bg-brand-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-primary/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
          :disabled="saving"
        >
          <i v-if="saving" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-save"></i>
          Finalizar Agendamentos
        </button>
      </footer>
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
  const opt = clientes.value.find(o => Number(o.value) === id)
  return opt?.label || 'Desconhecido'

  })

  const clientesOptions = computed(() => clientes.value || [])


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
  const res = await ClienteService.select()
  clientes.value = Array.isArray(res?.data) ? res.data : []
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
    const ok = await confirm.show(
      'LIMPAR FILTRO',
      'Isso vai remover o cliente selecionado e limpar os dados exibidos na tela.'
    )

    if (!ok) return
    limpar()
  }


  // CRIAR OBRA
  async function confirmarCriarObra() {
    const id = Number(clienteSelecionadoId.value)
    if (!id) return

    const ok = await confirm.show(
      'INICIAR OBRA',
      'Deseja iniciar o fluxo de obra para este cliente agora?'
    )

    if (!ok) return
    await criarObra()
  }




  // SALVAR
  async function confirmarSalvar() {
    const ok = await confirm.show(
      'SALVAR AGENDAMENTOS',
      'Deseja salvar as datas informadas para este cliente?'
    )

    if (!ok) return
    await salvar()
  }


  function limpar() {
    clienteSelecionadoId.value = null
    obrasDoCliente.value = []
  }

  onMounted(carregarClientes)

watch(clienteSelecionadoId, async (val) => {
  const id = Number(val)
  if (id) await carregarObras(id)
  else {
    obrasDoCliente.value = []
    aplicarObraNoForm()
  }
})

  </script>