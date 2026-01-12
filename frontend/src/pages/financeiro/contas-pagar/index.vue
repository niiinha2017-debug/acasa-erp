<script setup>
import { ref, computed, onMounted, watch } from 'vue'

import Card from '@/components/ui/Card.vue'
import Table from '@/components/ui/Table.vue'
import Button from '@/components/ui/Button.vue'
import LoadingOverlay from '@/components/common/Loading.vue'

import { format } from '@/utils/format'
import { FinanceiroService } from '@/services/index.js'


// -----------------------
// Estado
// -----------------------
const loading = ref(false)
const rows = ref([])

const tab = ref('EM_ABERTO') // ATRASADO | EM_ABERTO | PAGO
const faixaPrazo = ref('TODOS') // TODOS | HOJE | 7 | 15 | 30 | 30P

const now = new Date()
const mes = ref(now.getMonth() + 1)
const ano = ref(now.getFullYear())

const modalOpen = ref(false)
const modalRow = ref(null)

// -----------------------
// Colunas
// -----------------------
const columns = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'referencia', label: 'Referência' },
  { key: 'fornecedor', label: 'Fornecedor' },
  { key: 'vencimento', label: 'Vencimento' },
  { key: 'dias', label: 'Prazo' },
  { key: 'valor', label: 'Valor' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: 'Ações' },
]

// -----------------------
// Normalização (status + datas)
// -----------------------
const STATUS_MAP = {
  VENCIDO: 'ATRASADO',
  ATRASADA: 'ATRASADO',
  ATRASADO: 'ATRASADO',
  EM_ABERTO: 'EM_ABERTO',
  ABERTO: 'EM_ABERTO',
  PAGO: 'PAGO',
  PAGA: 'PAGO',
}

function normalizeStatus(s) {
  const key = String(s || '').toUpperCase().trim()
  return STATUS_MAP[key] || key || 'EM_ABERTO'
}

function toDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function diffDays(date) {
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const ms = d.getTime() - today.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

function mapRow(r) {
  // ✅ ajuste aqui conforme seu backend
  const tipo = r.tipo || r.origem || (r.fornecedor_id ? 'COMPRA' : 'DESPESA')
  const referencia =
    r.referencia ||
    r.descricao ||
    r.titulo ||
    (r.numero ? `#${r.numero}` : (r.id ? `#${r.id}` : '—'))

  const fornecedor =
    r.fornecedor?.nome ||
    r.fornecedor_nome ||
    (r.fornecedor_id ? `Fornecedor #${r.fornecedor_id}` : '—')

  const venc = toDate(r.data_vencimento || r.vencimento || r.data)
  const status = normalizeStatus(r.status || r.status_financeiro)

  const valor = Number(
    r.valor_total ?? r.valor ?? r.total ?? r.valor_original ?? 0
  )

  const dias = diffDays(venc) // negativo = já venceu

  return {
    raw: r,
    tipo,
    referencia,
    fornecedor,
    vencimento: venc,
    dias,
    valor,
    status,
  }
}

// -----------------------
// Carregar dados por mês/ano
// -----------------------
async function fetchData() {
  loading.value = true
  try {
    // ✅ ajuste filtros se seu endpoint usa outro nome
    const { data } = await FinanceiroService.listarPagar({ mes: mes.value, ano: ano.value })

    const lista = Array.isArray(data) ? data : (data?.rows || data?.data || [])
    rows.value = lista.map(mapRow)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
watch([mes, ano], fetchData)

// -----------------------
// Computeds (abas + prazos)
// -----------------------
const rowsByTab = computed(() => rows.value.filter(r => r.status === tab.value))

function matchesFaixa(r) {
  // se não tem vencimento, deixa só em TODOS
  if (!r.vencimento) return faixaPrazo.value === 'TODOS'

  // dias: 0 = hoje, 1.. = futuro, -1.. = atrasado
  const d = r.dias

  if (faixaPrazo.value === 'TODOS') return true
  if (faixaPrazo.value === 'HOJE') return d === 0

  if (faixaPrazo.value === '7') return d >= 1 && d <= 7
  if (faixaPrazo.value === '15') return d >= 8 && d <= 15
  if (faixaPrazo.value === '30') return d >= 16 && d <= 30
  if (faixaPrazo.value === '30P') return d >= 31

  return true
}

const rowsFiltradas = computed(() => rowsByTab.value.filter(matchesFaixa))

// -----------------------
// Totais / Caixas
// -----------------------
const totalMes = computed(() =>
  rows.value.reduce((acc, r) => acc + (r.valor || 0), 0)
)

const totalAtrasados = computed(() =>
  rows.value.filter(r => r.status === 'ATRASADO').reduce((a, r) => a + (r.valor || 0), 0)
)

const totalEmAberto = computed(() =>
  rows.value.filter(r => r.status === 'EM_ABERTO').reduce((a, r) => a + (r.valor || 0), 0)
)

const totalPagos = computed(() =>
  rows.value.filter(r => r.status === 'PAGO').reduce((a, r) => a + (r.valor || 0), 0)
)

const totalAba = computed(() =>
  rowsByTab.value.reduce((acc, r) => acc + (r.valor || 0), 0)
)

// -----------------------
// UI helpers
// -----------------------
const meses = [
  { v: 1,  t: 'JAN' }, { v: 2,  t: 'FEV' }, { v: 3,  t: 'MAR' }, { v: 4,  t: 'ABR' },
  { v: 5,  t: 'MAI' }, { v: 6,  t: 'JUN' }, { v: 7,  t: 'JUL' }, { v: 8,  t: 'AGO' },
  { v: 9,  t: 'SET' }, { v: 10, t: 'OUT' }, { v: 11, t: 'NOV' }, { v: 12, t: 'DEZ' },
]

function openModal(row) {
  modalRow.value = row
  modalOpen.value = true
}
function closeModal() {
  modalOpen.value = false
  modalRow.value = null
}
</script>

<template>
  <Card :shadow="true" class="w-full h-full">
    <!-- HEADER -->
    <header class="p-6 border-b border-gray-100">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
            Contas a Pagar
          </h2>
          <p class="mt-1 text-sm font-semibold text-gray-400">
            Visão de todas as saídas da empresa
          </p>
        </div>

        <!-- MÊS/ANO -->
        <div class="flex items-center gap-2">
          <select
            v-model.number="mes"
            class="h-10 rounded-xl border border-gray-200 px-3 text-xs font-black tracking-widest text-gray-900 uppercase"
          >
            <option v-for="m in meses" :key="m.v" :value="m.v">{{ m.t }}</option>
          </select>

          <input
            v-model.number="ano"
            type="number"
            class="h-10 w-24 rounded-xl border border-gray-200 px-3 text-xs font-black tracking-widest text-gray-900"
          />

          <Button variant="secondary" size="sm" type="button" @click="fetchData">
            Atualizar
          </Button>
        </div>
      </div>

      <!-- ABAS -->
      <div class="mt-5 flex items-center gap-2">
        <button
          class="h-10 px-4 rounded-2xl text-xs font-black tracking-widest uppercase border"
          :class="tab === 'ATRASADO' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-200'"
          @click="tab = 'ATRASADO'; faixaPrazo = 'TODOS'"
        >
          Atrasados
        </button>

        <button
          class="h-10 px-4 rounded-2xl text-xs font-black tracking-widest uppercase border"
          :class="tab === 'EM_ABERTO' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-200'"
          @click="tab = 'EM_ABERTO'; faixaPrazo = 'TODOS'"
        >
          Em aberto
        </button>

        <button
          class="h-10 px-4 rounded-2xl text-xs font-black tracking-widest uppercase border"
          :class="tab === 'PAGO' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-200'"
          @click="tab = 'PAGO'; faixaPrazo = 'TODOS'"
        >
          Pagos
        </button>
      </div>
    </header>

    <!-- BODY -->
    <div class="relative p-6">
      <LoadingOverlay v-if="loading" :overlay="true" text="Carregando..." />

      <!-- CAIXAS (Resumo do mês + status) -->
      <div class="grid grid-cols-12 gap-4 mb-6">
        <div class="col-span-12 md:col-span-3 rounded-3xl border border-gray-100 p-5">
          <div class="text-[10px] font-black tracking-widest uppercase text-gray-400">Total do mês</div>
          <div class="mt-2 text-lg font-black text-gray-900">{{ format.currency(totalMes) }}</div>
        </div>

        <div class="col-span-12 md:col-span-3 rounded-3xl border border-gray-100 p-5">
          <div class="text-[10px] font-black tracking-widest uppercase text-gray-400">Atrasados</div>
          <div class="mt-2 text-lg font-black text-gray-900">{{ format.currency(totalAtrasados) }}</div>
        </div>

        <div class="col-span-12 md:col-span-3 rounded-3xl border border-gray-100 p-5">
          <div class="text-[10px] font-black tracking-widest uppercase text-gray-400">Em aberto</div>
          <div class="mt-2 text-lg font-black text-gray-900">{{ format.currency(totalEmAberto) }}</div>
        </div>

        <div class="col-span-12 md:col-span-3 rounded-3xl border border-gray-100 p-5">
          <div class="text-[10px] font-black tracking-widest uppercase text-gray-400">Pagos</div>
          <div class="mt-2 text-lg font-black text-gray-900">{{ format.currency(totalPagos) }}</div>
        </div>

        <div class="col-span-12 rounded-3xl border border-gray-100 p-5">
          <div class="text-[10px] font-black tracking-widest uppercase text-gray-400">
            Total da aba ({{ tab }})
          </div>
          <div class="mt-2 text-lg font-black text-gray-900">{{ format.currency(totalAba) }}</div>
        </div>
      </div>

      <!-- RELAÇÃO DE PRAZO (faixas) -->
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <button class="h-9 px-4 rounded-2xl text-[11px] font-black tracking-widest uppercase border"
          :class="faixaPrazo === 'TODOS' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-200'"
          @click="faixaPrazo = 'TODOS'"
        >Todos</button>

        <button class="h-9 px-4 rounded-2xl text-[11px] font-black tracking-widest uppercase border"
          :class="faixaPrazo === 'HOJE' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-200'"
          @click="faixaPrazo = 'HOJE'"
        >Hoje</button>

        <button class="h-9 px-4 rounded-2xl text-[11px] font-black tracking-widest uppercase border"
          :class="faixaPrazo === '7' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-200'"
          @click="faixaPrazo = '7'"
        >1–7</button>

        <button class="h-9 px-4 rounded-2xl text-[11px] font-black tracking-widest uppercase border"
          :class="faixaPrazo === '15' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-200'"
          @click="faixaPrazo = '15'"
        >8–15</button>

        <button class="h-9 px-4 rounded-2xl text-[11px] font-black tracking-widest uppercase border"
          :class="faixaPrazo === '30' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-200'"
          @click="faixaPrazo = '30'"
        >16–30</button>

        <button class="h-9 px-4 rounded-2xl text-[11px] font-black tracking-widest uppercase border"
          :class="faixaPrazo === '30P' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-200'"
          @click="faixaPrazo = '30P'"
        >30+</button>
      </div>

      <!-- TABELA ÚNICA (filtrada por aba + prazo) -->
      <Table
        :columns="columns"
        :rows="rowsFiltradas"
        :loading="loading"
        empty-text="Nenhum item encontrado."
      >
        <template #cell-vencimento="{ row }">
          <span class="text-sm font-semibold text-gray-900">
            {{ row.vencimento ? format.date(row.vencimento) : '—' }}
          </span>
        </template>

        <template #cell-dias="{ row }">
          <span class="text-xs font-black tracking-widest uppercase"
                :class="row.dias !== null && row.dias < 0 ? 'text-red-600' : 'text-gray-900'">
            <template v-if="row.dias === null">—</template>
            <template v-else-if="row.dias < 0">{{ Math.abs(row.dias) }}d atras.</template>
            <template v-else-if="row.dias === 0">hoje</template>
            <template v-else>{{ row.dias }}d</template>
          </span>
        </template>

        <template #cell-valor="{ row }">
          <span class="text-sm font-black text-gray-900">
            {{ format.currency(row.valor) }}
          </span>
        </template>

        <template #cell-acoes="{ row }">
          <div class="flex items-center gap-2">
            <Button variant="secondary" size="sm" type="button" @click="openModal(row)">
              Abrir
            </Button>
          </div>
        </template>
      </Table>

      <!-- MODAL -->
      <transition name="fade">
        <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/35 backdrop-blur-sm" @click="closeModal"></div>

          <div class="relative w-full max-w-2xl rounded-3xl bg-white border border-gray-100 overflow-hidden">
            <header class="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <div class="text-[10px] font-black tracking-widest uppercase text-gray-400">Conta</div>
                <div class="mt-1 text-lg font-black text-gray-900 uppercase">
                  {{ modalRow?.referencia || '—' }}
                </div>
              </div>
              <Button variant="secondary" size="sm" type="button" @click="closeModal">Fechar</Button>
            </header>

            <div class="p-6 grid grid-cols-12 gap-4">
              <div class="col-span-12 md:col-span-4">
                <div class="text-[10px] font-black tracking-widest uppercase text-gray-400">Tipo</div>
                <div class="mt-1 text-sm font-black text-gray-900">{{ modalRow?.tipo || '—' }}</div>
              </div>

              <div class="col-span-12 md:col-span-4">
                <div class="text-[10px] font-black tracking-widest uppercase text-gray-400">Fornecedor</div>
                <div class="mt-1 text-sm font-black text-gray-900">{{ modalRow?.fornecedor || '—' }}</div>
              </div>

              <div class="col-span-12 md:col-span-4">
                <div class="text-[10px] font-black tracking-widest uppercase text-gray-400">Status</div>
                <div class="mt-1 text-sm font-black text-gray-900">{{ modalRow?.status || '—' }}</div>
              </div>

              <div class="col-span-12 md:col-span-6">
                <div class="text-[10px] font-black tracking-widest uppercase text-gray-400">Vencimento</div>
                <div class="mt-1 text-sm font-black text-gray-900">
                  {{ modalRow?.vencimento ? format.date(modalRow.vencimento) : '—' }}
                </div>
              </div>

              <div class="col-span-12 md:col-span-6">
                <div class="text-[10px] font-black tracking-widest uppercase text-gray-400">Valor</div>
                <div class="mt-1 text-sm font-black text-gray-900">
                  {{ format.currency(modalRow?.valor || 0) }}
                </div>
              </div>

              <div class="col-span-12">
                <div class="text-[10px] font-black tracking-widest uppercase text-gray-400">Raw (debug)</div>
                <pre class="mt-2 text-[11px] leading-5 bg-gray-50 border border-gray-100 rounded-2xl p-4 overflow-auto">
{{ JSON.stringify(modalRow?.raw || {}, null, 2) }}
                </pre>
              </div>
            </div>

            <footer class="px-6 py-5 border-t border-gray-100 flex justify-end gap-2">
              <!-- Você manda as ações reais depois (pagar / editar / etc.) -->
              <Button variant="secondary" size="sm" type="button" @click="closeModal">Ok</Button>
            </footer>
          </div>
        </div>
      </transition>

    </div>
  </Card>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
