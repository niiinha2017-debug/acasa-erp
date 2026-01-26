<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-4 animate-page-in">
    
    <!-- Header Compacto -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <i class="pi pi-chart-line text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Fluxo Financeiro</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gestão de caixa</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <div class="relative w-full sm:w-56">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input 
            v-model="filtro" 
            type="text" 
            placeholder="Buscar por categoria ou status..."
            class="w-full pl-9 pr-3 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
          />
        </div>
        
        <Button 
          variant="primary" 
          size="md"
          class="!h-10 !rounded-xl !px-4 text-xs font-black uppercase tracking-wider"
          @click="novo"
        >
          <i class="pi pi-plus mr-1.5 text-[10px]"></i>
          Novo
        </Button>
      </div>
    </div>

    <!-- Cards Compactos -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Saldo</p>
        <p class="text-xl font-black text-slate-800">{{ format.currency(totalEntradas - totalSaidas) }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600">Entradas</p>
        <p class="text-xl font-black text-emerald-700">{{ format.currency(totalEntradas) }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-white border border-rose-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-rose-600">Saídas</p>
        <p class="text-xl font-black text-rose-700">{{ format.currency(totalSaidas) }}</p>
      </div>
      
      <div class="p-4 rounded-xl bg-white border border-amber-200 shadow-sm">
        <p class="text-[9px] font-black uppercase tracking-[0.15em] text-amber-600">Em Aberto</p>
        <p class="text-xl font-black text-amber-700">{{ format.currency(totalPendente) }}</p>
      </div>
    </div>

    <!-- Tabela Compacta -->
    <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table
        :columns="columns"
        :rows="despesasFiltradas"
        :loading="carregando"
        empty-text="Nenhum lançamento encontrado."
        :boxed="false"
      >
        <template #cell-tipo="{ row }">
          <div class="flex items-center justify-center">
            <div :class="[
              'w-7 h-7 rounded-lg flex items-center justify-center',
              isSaida(row) 
                ? 'bg-rose-50 text-rose-500' 
                : 'bg-emerald-50 text-emerald-500'
            ]">
              <i :class="['pi text-xs', isSaida(row) ? 'pi-arrow-down-right' : 'pi-arrow-up-right']"></i>
            </div>
          </div>
        </template>

        <template #cell-detalhes="{ row }">
          <div class="py-1">
            <span class="text-sm font-bold text-slate-800 block">
              {{ row.categoria || '—' }}
            </span>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] font-medium text-slate-500">
                {{ row.classificacao || '—' }}
              </span>
              <span v-if="isAtrasado(row)" class="text-[8px] font-black text-rose-600 px-1.5 py-0.5 bg-rose-50 rounded border border-rose-100">
                ATRASADO
              </span>
            </div>
          </div>
        </template>

        <template #cell-valor="{ row }">
          <div class="text-right">
            <span :class="[
              'text-sm font-bold', 
              isSaida(row) ? 'text-rose-600' : 'text-emerald-600'
            ]">
              {{ isSaida(row) ? '-' : '+' }} {{ format.currency(moedaParaNumero(row.valor_total)) }}
            </span>
            <p class="text-[10px] font-medium text-slate-400 mt-0.5">
              {{ row.forma_pagamento }}
            </p>
          </div>
        </template>

        <template #cell-vencimento="{ row }">
          <div class="text-center">
            <span class="text-sm font-medium text-slate-700">
              {{ format.date(row.data_vencimento) }}
            </span>
          </div>
        </template>

        <template #cell-status="{ row }">
          <div class="flex justify-center">
            <span :class="[
              'px-2 py-1 rounded text-[9px] font-black uppercase',
              getStatusClasses(row.status)
            ]">
              {{ row.status || 'EM_ABERTO' }}
            </span>
          </div>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex justify-center gap-1">
            <button 
              @click="editar(row.id)"
              class="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center"
            >
              <i class="pi pi-pencil text-xs"></i>
            </button>
            <button 
              @click="pedirExcluir(row.id)"
              class="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
            >
              <i class="pi pi-trash text-xs"></i>
            </button>
          </div>
        </template>
      </Table>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { DespesaService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { format } from '@/utils/format'

const router = useRouter()
const despesas = ref([])
const carregando = ref(false)
const filtro = ref('')

// Configuração das colunas
const columns = [
  { key: 'tipo', label: '', width: '5%', align: 'center' },
  { key: 'detalhes', label: 'Detalhes', width: '40%' },
  { key: 'valor', label: 'Valor', align: 'right', width: '20%' },
  { key: 'vencimento', label: 'Vencimento', align: 'center', width: '15%' },
  { key: 'status', label: 'Status', align: 'center', width: '15%' },
  { key: 'acoes', label: '', align: 'center', width: '5%' }
]

// Auxiliares de Lógica
function normalizarTipoMovimento(v) {
  const t = String(v || '').toUpperCase().trim()
  return (t === 'SAÍDA' || t === 'SAIDA') ? 'SAIDA' : 'ENTRADA'
}

function isSaida(row) {
  return normalizarTipoMovimento(row?.tipo_movimento) === 'SAIDA'
}

function isAtrasado(row) {
  const venc = row?.data_vencimento ? new Date(row.data_vencimento) : null
  if (!venc) return false
  const status = String(row?.status || '').toUpperCase()
  return venc < new Date() && status !== 'PAGO'
}

function moedaParaNumero(valor) {
  if (!valor) return 0
  if (typeof valor === 'number') return valor
  const str = String(valor).replace('R$', '').replace(/\./g, '').replace(',', '.').trim()
  return parseFloat(str) || 0
}

function getStatusClasses(status) {
  const s = String(status || '').toUpperCase()
  const map = {
    PAGO: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    EM_ABERTO: 'bg-amber-50 text-amber-600 border border-amber-100',
    VENCIDO: 'bg-rose-50 text-rose-600 border border-rose-100',
    CANCELADO: 'bg-slate-100 text-slate-500 border border-slate-200',
  }
  return map[s] || map.EM_ABERTO
}


// Filtro reativo
const despesasFiltradas = computed(() => {
  const t = filtro.value.toLowerCase().trim()
  if (!t) return despesas.value
  
  return despesas.value.filter((d) => {
    const campos = [
      d.id,
      d.tipo_movimento,
      d.categoria,
      d.classificacao,
      d.local,
      d.status,
      format.currency(d.valor_total),
      format.date(d.data_vencimento)
    ]
    
    return campos.some((field) => 
      String(field ?? '').toLowerCase().includes(t)
    )
  })
})

// Cálculos de Totais
const totalSaidas = computed(() => {
  return despesasFiltradas.value
    .filter((d) => isSaida(d))
    .reduce((acc, curr) => acc + moedaParaNumero(curr.valor_total), 0)
})

const totalEntradas = computed(() => {
  return despesasFiltradas.value
    .filter((d) => !isSaida(d))
    .reduce((acc, curr) => acc + moedaParaNumero(curr.valor_total), 0)
})

const totalPendente = computed(() => {
  return despesasFiltradas.value
    .filter(d => d.status !== 'PAGO')
    .reduce((acc, curr) => acc + moedaParaNumero(curr.valor_total), 0)
})

// Ações de Carregamento e Navegação
async function carregar() {
  carregando.value = true
  try {
    const res = await DespesaService.listar?.()
    const data = res?.data || []
    despesas.value = data.sort((a, b) => new Date(b.data_vencimento) - new Date(a.data_vencimento))
  } catch (err) {
    notify.error?.('Erro ao carregar fluxo financeiro')
  } finally {
    carregando.value = false
  }
}

const novo = () => router.push('/despesas/novo')
const editar = (id) => router.push(`/despesas/${id}`)

async function pedirExcluir(id) {
  const row = despesas.value.find((d) => d.id === id)
  if (!row) return

  const ok = await confirm.show('Excluir Lançamento', `Deseja remover o lançamento #${row.id}?`)
  if (!ok) return

  try {
    await DespesaService.remover(id)
    despesas.value = despesas.value.filter((d) => d.id !== id)
    notify.success('Lançamento removido')
  } catch (e) {
    console.log('ERRO EXCLUIR', e?.response?.status, e?.response?.data || e)
    notify.error(`Erro ao excluir (${e?.response?.status || 'sem status'})`)
  }
}


onMounted(carregar)
</script>