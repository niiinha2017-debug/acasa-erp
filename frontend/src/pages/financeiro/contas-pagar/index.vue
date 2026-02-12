<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-page-in">
    
    <PageHeader 
      title="Contas a Pagar"
      subtitle="Gestão consolidada de saídas financeiras"
      icon="pi pi-arrow-down-right"
    >
      <template #actions>
        <Button 
          @click="abrirModalFechamento" 
          variant="secondary"
          size="sm"
        >
          <i class="pi pi-calendar-times mr-2"></i>
          Novo Fechamento Mensal
        </Button>
      </template>
    </PageHeader>

    <div class="space-y-4">
      <!-- Filtros -->
      <div class="flex flex-col sm:flex-row gap-4 items-end">
        <div class="w-full sm:max-w-xs">
          <label class="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-wider">Fornecedor</label>
          <select 
            v-model="filtros.fornecedor_id" 
            class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-slate-700"
          >
            <option value="">TODOS OS FORNECEDORES</option>
            <option v-for="o in fornecedorOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <div class="w-full sm:max-w-[180px]">
          <label class="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-wider">Status</label>
          <select 
            v-model="filtros.status" 
            class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-slate-700"
          >
            <option value="EM_ABERTO">EM ABERTO</option>
            <option value="VENCIDO">VENCIDOS</option>
            <option value="PAGO">PAGOS</option>
          </select>
        </div>

        <Button 
          @click="buscar" 
          variant="primary"
          class="!h-10 !w-10 !flex items-center justify-center !p-0"
        >
          <i class="pi pi-search"></i>
        </Button>
      </div>

      <!-- Tabela -->
      <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table 
          :columns="columns" 
          :rows="rows" 
          :loading="loading" 
          empty-text="Nenhum registro encontrado."
          :boxed="false"
        >
          <template #cell-origem="{ row }">
            <span 
              :class="getOrigemClass(row.origem)" 
              class="px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider inline-block"
            >
              {{ row.origem }}
            </span>
          </template>

          <template #cell-vencimento="{ row }">
            <span class="text-sm font-bold text-slate-700 tabular-nums">
              {{ formatarData(row.vencimento_em) }}
            </span>
          </template>

          <template #cell-fornecedor="{ row }">
            <div class="flex flex-col">
              <span class="text-sm font-bold text-slate-800 uppercase tracking-tight">
                {{ row.fornecedor_nome || 'DESPESA OPERACIONAL' }}
              </span>
              <span class="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                {{ row.descricao }}
              </span>
            </div>
          </template>

          <template #cell-valor="{ row }">
             <span class="text-sm font-black text-slate-800 tabular-nums">
               {{ formatarMoeda(row.valor) }}
             </span>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status" />
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <button 
                v-if="row.status !== 'PAGO'"
                @click="darBaixa(row)"
                class="h-7 px-3 rounded-lg bg-emerald-500 text-white text-[9px] font-black uppercase hover:bg-emerald-600 shadow-sm transition-all"
              >
                Pagar
              </button>
              
              <!-- Placeholder actions that mimic TableActions simplicity for custom buttons -->
               <button 
                class="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-slate-200 flex items-center justify-center"
              >
                <i class="pi pi-eye text-[10px]"></i>
              </button>
            </div>
          </template>
        </Table>
      </div>
    </div>

    <ModalFechamento 
      v-if="modalFechamentoOpen"
      :open="modalFechamentoOpen"
      :preview="fornecedorSelecionadoParaFechamento"
      :fornecedorNome="nomeFornecedorFechamento"
      @close="modalFechamentoOpen = false"
      @confirm="executarFechamentoFinal"
    />

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { FinanceiroService, FornecedorService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { useRouter } from 'vue-router'

definePage({ meta: { perm: 'contas_pagar.ver' } })

const loading = ref(false)
const rows = ref([])
const fornecedorOptions = ref([])
const router = useRouter()

const filtros = reactive({
  fornecedor_id: '',
  status: 'EM_ABERTO', 
})

const columns = [
  { key: 'origem', label: 'ORIGEM', width: '100px' },
  { key: 'vencimento', label: 'VENCIMENTO', width: '120px' },
  { key: 'fornecedor', label: 'FORNECEDOR/DESCRIÇÃO' },
  { key: 'valor', label: 'VALOR TOTAL', width: '140px', align: 'right' },
  { key: 'status', label: 'STATUS', width: '100px' },
  { key: 'acoes', label: '', width: '140px', align: 'right' },
]

const modalFechamentoOpen = ref(false)
const fornecedorSelecionadoParaFechamento = ref(null)

// Nome computado para o modal de fechamento (adicionado pois estava faltando no original)
const nomeFornecedorFechamento = computed(() => {
    if(!fornecedorSelecionadoParaFechamento.value) return ''
    return fornecedorSelecionadoParaFechamento.value.nome_fantasia || 'Desconhecido'
})

async function abrirModalFechamento() {
  if (!filtros.fornecedor_id) {
    return notify.warn('Selecione um fornecedor para iniciar o fechamento')
  }
  
  try {
    loading.value = true
    const previewData = await FinanceiroService.previewFechamentoFornecedor({
      fornecedor_id: filtros.fornecedor_id,
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear()
    })
    
    fornecedorSelecionadoParaFechamento.value = previewData
    modalFechamentoOpen.value = true
  } catch (e) {
    notify.error('Não foi possível gerar o preview de fechamento')
  } finally {
    loading.value = false
  }
}

// Apenas placeholder: executarFechamentoFinal não estava no script original, mas é chamado no template
async function executarFechamentoFinal() {
    modalFechamentoOpen.value = false
    notify.success('Fechamento realizado (simulado)')
    buscar()
}

async function darBaixa(item) {
  const confirmacao = await confirm.show('Confirmar Pagamento', `Deseja confirmar o pagamento de ${formatarMoeda(item.valor)}?`)
  
  if (confirmacao) {
    try {
      await FinanceiroService.pagarContaPagar(item.id, {
        unidade: 'FÁBRICA',
        categoria: 'PAGAMENTO_FORNECEDOR'
      })
      notify.success('Pagamento registrado com sucesso!')
      buscar() 
    } catch (e) {
      notify.error('Erro ao registrar pagamento')
    }
  }
}

async function buscar() {
  try {
    loading.value = true
    const data = await FinanceiroService.listarContasPagarConsolidado(filtros)
    rows.value = data || []
  } catch (e) {
    notify.error('Erro ao carregar contas a pagar')
  } finally {
    loading.value = false
  }
}

const formatarMoeda = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const formatarData = (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '-'

const getOrigemClass = (origem) => {
  const map = {
    'DESPESA': 'text-purple-600 bg-purple-50 border-purple-100',
    'COMPRA': 'text-orange-600 bg-orange-50 border-orange-100',
    'FECHAMENTO': 'text-blue-600 bg-blue-50 border-blue-100',
  }
  return map[origem] || 'text-slate-600 bg-slate-50 border-slate-200'
}

onMounted(async () => {
  const forns = await FornecedorService.listarAtivos()
  fornecedorOptions.value = forns.map(f => ({ label: f.nome_fantasia, value: f.id }))
  buscar()
})
</script>
