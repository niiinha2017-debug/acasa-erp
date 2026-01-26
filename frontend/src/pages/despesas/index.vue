<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      <Card hoverable class="relative overflow-hidden !rounded-[2rem] border-none bg-slate-900 p-7 group">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
        <div class="relative z-10 flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <i class="pi pi-wallet text-2xl"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/80 mb-1">Saldo Previsto</p>
            <p class="text-2xl font-black text-white leading-none">
              {{ format.currency(totalEntradas - totalSaidas) }}
            </p>
          </div>
        </div>
      </Card>

      <Card hoverable class="!rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 p-7 group">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <i class="pi pi-arrow-up-right text-2xl font-bold"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Entradas</p>
            <p class="text-2xl font-black text-emerald-600 leading-none">{{ format.currency(totalEntradas) }}</p>
          </div>
        </div>
      </Card>

      <Card hoverable class="!rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 p-7 group">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <i class="pi pi-arrow-down-right text-2xl font-bold"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Saídas</p>
            <p class="text-2xl font-black text-rose-600 leading-none">{{ format.currency(totalSaidas) }}</p>
          </div>
        </div>
      </Card>

      <Card hoverable class="!rounded-[2rem] border-amber-100 bg-amber-50/20 shadow-xl shadow-amber-200/20 p-7 group">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <i class="pi pi-clock text-2xl" :class="{ 'animate-pulse': totalPendente > 0 }"></i>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/70 mb-1">Em Aberto</p>
            <p class="text-2xl font-black text-amber-700 leading-none">{{ format.currency(totalPendente) }}</p>
          </div>
        </div>
      </Card>
    </div>

    <Card :shadow="true" class="!rounded-[3rem] overflow-hidden border-none shadow-2xl shadow-slate-200/60 bg-white">
      <header class="flex flex-col lg:flex-row items-center justify-between gap-6 p-10 border-b border-slate-50 bg-slate-50/30">
        <div class="flex items-center gap-5">
          <div class="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-900 group">
            <i class="pi pi-chart-line text-2xl group-hover:scale-110 transition-transform"></i>
          </div>
          <div>
            <h2 class="text-2xl font-black tracking-tight text-slate-800 uppercase italic">Fluxo Financeiro</h2>
            <div class="flex items-center gap-2 mt-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestão de Inteligência de Caixa</p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div class="relative flex-1 min-w-[300px]">
            <i class="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              v-model="filtro" 
              type="text" 
              placeholder="Pesquisar por categoria, local ou status..."
              class="w-full pl-14 pr-6 h-14 bg-white border border-slate-100 rounded-[1.25rem] text-sm font-bold focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all shadow-inner"
            />
          </div>
          
          <Button 
            variant="primary" 
            class="!h-14 !rounded-[1.25rem] !px-8 shadow-2xl shadow-brand-primary/30 active:scale-95 transition-all font-black uppercase tracking-widest text-[11px]" 
            @click="novo"
          >
            <i class="pi pi-plus mr-3 text-xs"></i>
            Novo Lançamento
          </Button>
        </div>
      </header>

      <div class="p-6">
        <Table
          :columns="columns"
          :rows="despesasFiltradas"
          :loading="carregando"
          class="premium-table"
        >
          <template #cell-tipo_movimento="{ row }">
            <div :class="[
              'w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all',
              isSaida(row) 
                ? 'bg-rose-50 text-rose-500 border-rose-100/50' 
                : 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
            ]">
              <i :class="['pi text-xs', isSaida(row) ? 'pi-arrow-down-right' : 'pi-arrow-up-right']"></i>
            </div>
          </template>

          <template #cell-valor_total="{ row }">
            <div class="flex flex-col items-end">
              <span :class="[
                'text-[15px] font-black tracking-tight', 
                isSaida(row) ? 'text-slate-800' : 'text-emerald-600'
              ]">
                {{ isSaida(row) ? '-' : '+' }} {{ format.currency(moedaParaNumero(row.valor_total)) }}
              </span>
              <span class="text-[9px] font-bold text-slate-300 uppercase">{{ row.forma_pagamento }}</span>
            </div>
          </template>
        </Table>
      </div>
    </Card>
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

const columns = [
  { key: 'tipo_movimento', label: 'Tipo', width: '80px', align: 'center' },
  { key: 'detalhes', label: 'Detalhamento' },
  { key: 'valor_total', label: 'Valor Total', width: '140px', align: 'right' },
  { key: 'data_vencimento', label: 'Vencimento', width: '120px', align: 'center' },
  { key: 'status', label: 'Situação', width: '130px', align: 'center' },
  { key: 'acoes', label: 'Ações', width: '100px', align: 'center' },
]

// Auxiliares de Lógica
function normalizarTipoMovimento(v) {
  const t = String(v || '').toUpperCase().trim()
  return (t === 'SAÍDA' || t === 'SAIDA') ? 'SAIDA' : 'ENTRADA'
}

function isSaida(row) {
  return normalizarTipoMovimento(row?.tipo_movimento) === 'SAIDA'
}

function categoriaLabel(row) { return row?.categoria || '—' }
function classificacaoLabel(row) { return row?.classificacao || '—' }

function isAtrasado(row) {
  const venc = row?.data_vencimento ? new Date(row.data_vencimento) : null
  if (!venc) return false
  const status = String(row?.status || '').toUpperCase()
  return venc < new Date() && status !== 'PAGO'
}

// Soma de tudo que ainda não foi pago (independente de ser entrada ou saída)
const totalPendente = computed(() => {
  return despesasFiltradas.value
    .filter(d => d.status !== 'PAGO')
    .reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0)
})

// O Saldo Real (Entradas - Saídas)
const saldoTotal = computed(() => totalEntradas.value - totalSaidas.value)

// Filtro reativo
const despesasFiltradas = computed(() => {
  const t = filtro.value.toLowerCase().trim()
  if (!t) return despesas.value
  return despesas.value.filter((d) =>
    [d.id, d.tipo_movimento, d.categoria, d.classificacao, d.local, d.status]
      .some((field) => String(field ?? '').toLowerCase().includes(t))
  )
})

// Cálculos de Totais
const totalSaidas = computed(() => {
  return despesasFiltradas.value
    .filter((d) => isSaida(d))
    .reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0)
})

const totalEntradas = computed(() => {
  return despesasFiltradas.value
    .filter((d) => !isSaida(d))
    .reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0)
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
    notify.success?.('Lançamento removido')
  } catch {
    notify.error?.('Erro ao excluir registro')
  }
}

onMounted(carregar)
</script>