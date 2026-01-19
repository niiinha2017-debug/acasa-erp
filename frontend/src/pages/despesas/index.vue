<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-700">
    
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    
    <Card 
      hoverable 
      class="p-6 flex items-center gap-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
        <i class="pi pi-wallet text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Saldo Previsto</p>
        <p class="text-xl font-black text-[var(--text-main)]">
          {{ format.currency(totalEntradas - totalSaidas) }}
        </p>
      </div>
    </Card>

    <Card hoverable class="p-6 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
        <i class="pi pi-arrow-up-right text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-emerald-500">Total Entradas</p>
        <p class="text-xl font-black text-emerald-600">{{ format.currency(totalEntradas) }}</p>
      </div>
    </Card>

    <Card hoverable class="p-6 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
        <i class="pi pi-arrow-down-right text-xl"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-red-500">Total Saídas</p>
        <p class="text-xl font-black text-red-600">{{ format.currency(totalSaidas) }}</p>
      </div>
    </Card>

    <Card 
      hoverable 
      :active="totalPendente > 0"
      class="p-6 flex items-center gap-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
        <i class="pi pi-clock text-xl animate-pulse"></i>
      </div>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-amber-500">Aguardando Pagto.</p>
        <p class="text-xl font-black text-amber-600">{{ format.currency(totalPendente) }}</p>
      </div>
    </Card>

  </div>

    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-[var(--border-ui)]">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-8 border-b border-[var(--border-ui)] bg-slate-500/5">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <i class="pi pi-chart-line text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-black tracking-tight text-[var(--text-main)] uppercase">Fluxo Financeiro</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestão de entradas, saídas e previsões</p>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="relative flex-1 md:w-80">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              v-model="filtro" 
              type="text" 
              placeholder="BUSCAR CATEGORIA, STATUS OU LOCAL..."
              class="w-full pl-10 pr-4 h-11 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
            />
          </div>
          
          <Button variant="primary" class="!h-11 !rounded-2xl !px-6 shadow-xl shadow-brand-primary/20" @click="novo">
            <i class="pi pi-plus mr-2 text-xs"></i>
            Novo Lançamento
          </Button>
        </div>
      </header>

      <div class="p-4">
        <Table
          :columns="columns"
          :rows="despesasFiltradas"
          :loading="carregando"
          empty-text="Nenhum lançamento encontrado no fluxo financeiro."
          class="!border-none"
        >
          <template #cell-tipo_movimento="{ row }">
            <div class="flex items-center justify-center">
              <div :class="[
                'w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm border',
                isSaida(row) 
                  ? 'bg-red-50 text-red-500 border-red-100' 
                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              ]">
                <i :class="['pi text-[10px]', isSaida(row) ? 'pi-arrow-down-right' : 'pi-arrow-up-right']"></i>
              </div>
            </div>
          </template>

          <template #cell-detalhes="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-[13px] font-black text-slate-800 uppercase tracking-tight">
                {{ row.categoria || 'Sem Categoria' }}
              </span>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                  {{ row.local || 'Geral' }}
                </span>
                <span v-if="row.classificacao" 
                  class="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md font-black uppercase tracking-tighter border border-slate-200/50">
                  {{ row.classificacao }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-valor_total="{ row }">
            <div class="flex flex-col items-end">
              <span :class="['text-sm font-black tracking-tight', isSaida(row) ? 'text-slate-900' : 'text-emerald-600']">
                {{ isSaida(row) ? '-' : '+' }} {{ format.currency(Number(row.valor_total || 0)) }}
              </span>
            </div>
          </template>

          <template #cell-data_vencimento="{ row }">
            <div class="flex flex-col items-center gap-1">
              <span class="text-[11px] font-bold text-slate-600">
                {{ format.date(row.data_vencimento) }}
              </span>
              <span v-if="isAtrasado(row)" 
                class="px-2 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase rounded-full animate-pulse">
                Atrasado
              </span>
            </div>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status" />
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <button @click="editar(row.id)" class="p-2.5 rounded-xl bg-slate-500/10 text-slate-500 hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                <i class="pi pi-pencil text-xs"></i>
              </button>
              <button @click="pedirExcluir(row.id)" class="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
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