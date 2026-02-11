<template>
    <header class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-2">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-200 rotate-2 hover:rotate-0 transition-all duration-300">
          <i class="pi pi-calendar-clock text-xl"></i>
        </div>
        <div>
          <h1 class="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Agenda</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">Visao mensal de agendamentos</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button @click="openGarantia" class="h-10 px-4 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest">
          Garantia
        </button>
        <button @click="prevMonth" class="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800">
          <i class="pi pi-angle-left"></i>
        </button>
        <div class="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest">
          {{ monthLabel }}
        </div>
        <button @click="nextMonth" class="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800">
          <i class="pi pi-angle-right"></i>
        </button>
      </div>
    </header>

    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 md:p-5">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="space-y-2">
          <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Fluxo</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="item in fluxoOptions"
              :key="item.key"
              type="button"
              class="h-9 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all"
              :class="filtroFluxo === item.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'"
              @click="filtroFluxo = item.key"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Etapa</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="item in categoriaOptions"
              :key="item.key"
              type="button"
              class="h-9 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all"
              :class="filtroCategoria === item.key ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'"
              @click="filtroCategoria = item.key"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
        <div class="h-14 rounded-xl border border-slate-200 px-3 flex items-center justify-between bg-slate-50">
          <span class="text-[10px] font-black uppercase tracking-wider text-slate-500">Eventos no mes</span>
          <span class="text-sm font-black text-slate-800">{{ totalEventosNoMes }}</span>
        </div>
        <div class="h-14 rounded-xl border border-emerald-200 px-3 flex items-center justify-between bg-emerald-50">
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-700">Fluxo cliente</span>
          <span class="text-sm font-black text-emerald-800">{{ totalEventosCliente }}</span>
        </div>
        <div class="h-14 rounded-xl border border-amber-200 px-3 flex items-center justify-between bg-amber-50">
          <span class="text-[10px] font-black uppercase tracking-wider text-amber-700">Fluxo fornecedor</span>
          <span class="text-sm font-black text-amber-800">{{ totalEventosFornecedor }}</span>
        </div>
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
      <div class="grid grid-cols-7 gap-px bg-slate-100">
        <div v-for="d in weekDays" :key="d" class="bg-white p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
          {{ d }}
        </div>
        <button
          v-for="day in days"
          :key="day.key"
          @click="selectDay(day.date)"
          class="bg-white p-3 h-28 flex flex-col items-start text-left border border-transparent hover:border-brand-primary/30 transition-all"
          :class="{
            'bg-slate-50': !day.inMonth,
            'ring-2 ring-brand-primary/30': isSameDay(day.date, selectedDay)
          }"
        >
          <div class="text-xs font-black" :class="day.inMonth ? 'text-slate-800' : 'text-slate-300'">
            {{ day.date.getDate() }}
          </div>
          <div class="mt-2 w-full space-y-1">
            <div
              v-for="event in dayEvents(day.date).slice(0, 3)"
              :key="event.id"
              class="text-[9px] font-bold truncate px-2 py-0.5 rounded"
              :class="eventMiniClass(event)"
              :title="eventTitle(event)"
            >
              {{ eventTitle(event) }}
            </div>
            <div v-if="dayEvents(day.date).length > 3" class="text-[9px] font-black text-slate-400">
              +{{ dayEvents(day.date).length - 3 }}
            </div>
          </div>
        </button>
      </div>

      <div class="border-t border-slate-100 p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {{ selectedLabel }}
          </div>
          <div v-if="loading" class="text-[10px] font-bold text-slate-400">Carregando...</div>
        </div>

        <div v-if="selectedEvents.length" class="space-y-2">
          <div v-for="event in selectedEvents" :key="event.id" class="p-3 rounded-xl border border-slate-200">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="text-xs font-black text-slate-800">{{ eventTitle(event) }}</span>
              <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase" :class="eventOrigemClass(event)">
                {{ eventOrigemLabel(event) }}
              </span>
              <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase" :class="eventCategoriaClass(event)">
                {{ eventCategoriaLabel(event) }}
              </span>
            </div>
            <div class="text-[10px] font-semibold text-slate-500">
              {{ timeLabel(event.inicio_em) }} - {{ timeLabel(event.fim_em) }}
            </div>
          </div>
        </div>
        <div v-else class="text-[10px] font-bold text-slate-400">Nenhum agendamento para este dia.</div>
      </div>
    </div>

    <div v-if="canProducao" class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <div class="flex items-center justify-between mb-3">
        <div class="text-[11px] font-black uppercase tracking-widest text-slate-500">
          Planos de corte em producao
        </div>
        <div v-if="loadingProducao" class="text-[10px] font-bold text-slate-400">Carregando...</div>
      </div>

      <div v-if="planosEmProducao.length" class="space-y-2">
        <div v-for="plano in planosEmProducao" :key="plano.id" class="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="text-xs font-black text-slate-800 truncate">
              Pedido #{{ plano.numero_pedido || plano.id }} - {{ plano.fornecedor?.razao_social || 'Fornecedor' }}
            </div>
            <div class="text-[10px] font-semibold text-slate-500">
              {{ plano.data_venda ? new Date(plano.data_venda).toLocaleDateString('pt-BR') : '-' }}
            </div>
          </div>
          <span
            class="px-2 py-1 rounded text-[9px] font-black uppercase inline-flex items-center gap-1.5"
            :class="planoBadgeClass(plano.status)"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="planoDotClass(plano.status)"></span>
            {{ planoBadgeLabel(plano.status) }}
          </span>
        </div>
      </div>
      <div v-else class="text-[10px] font-bold text-slate-400">Nenhum plano em producao.</div>
    </div>

    <div v-if="modalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" @click.self="closeModal">
      <div class="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative max-h-[85vh] overflow-y-auto">
        <button @click="closeModal" class="absolute top-3 right-3 text-slate-400 hover:text-rose-500" aria-label="Fechar">
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-lg font-black mb-1">Agendar tarefa</h2>
        <p class="text-xs font-semibold text-slate-500 mb-4">{{ selectedLabel }}</p>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-bold mb-1">Titulo</label>
            <input v-model="taskForm.titulo" class="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-700" />
          </div>

          <div class="grid grid-cols-12 gap-3">
            <div class="col-span-12 md:col-span-6">
              <label class="block text-xs font-bold mb-1">Inicio</label>
              <input type="datetime-local" v-model="taskForm.inicio" class="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-700" />
            </div>
            <div class="col-span-12 md:col-span-6">
              <label class="block text-xs font-bold mb-1">Termino</label>
              <input type="datetime-local" v-model="taskForm.fim" class="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-700" />
            </div>
          </div>

          <div class="grid grid-cols-12 gap-3">
            <div class="col-span-12 md:col-span-6">
              <label class="block text-xs font-bold mb-1">Fluxo</label>
              <select v-model="taskForm.origemFluxo" class="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-700">
                <option v-for="item in fluxoFormOptions" :key="item.key" :value="item.key">{{ item.label }}</option>
              </select>
            </div>
            <div class="col-span-12 md:col-span-6">
              <label class="block text-xs font-bold mb-1">Categoria</label>
              <select v-model="taskForm.categoria" class="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-700">
                <option v-for="item in categoriaFormOptions" :key="item.key" :value="item.key">{{ item.label }}</option>
              </select>
            </div>
          </div>

          <SearchInput
            v-model="taskForm.clienteId"
            mode="select"
            label="Cliente"
            placeholder="Selecione o cliente..."
            :options="clientesOptions"
          />
          <div>
            <div v-if="isAdmin" class="space-y-2">
              <div class="flex items-end gap-2">
                <div class="flex-1">
                  <SearchInput
                    v-model="funcionarioSelecionado"
                    mode="select"
                    label="Funcionario"
                    placeholder="Selecione o funcionario..."
                    :options="funcionariosOptions"
                  />
                </div>
                <button
                  type="button"
                  class="h-10 px-4 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase"
                  @click="adicionarFuncionario"
                >
                  Adicionar
                </button>
              </div>

              <div v-if="taskForm.funcionarioIds.length" class="flex flex-wrap gap-2">
                <span
                  v-for="fid in taskForm.funcionarioIds"
                  :key="fid"
                  class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-600"
                >
                  {{ funcionarioNomeById(fid) || 'Funcionario' }}
                  <button type="button" class="text-slate-400 hover:text-rose-500" @click="removerFuncionario(fid)">
                    <i class="pi pi-times text-[10px]"></i>
                  </button>
                </span>
              </div>
            </div>
            <div v-else>
              <label class="block text-xs font-bold mb-1">Funcionario</label>
              <div class="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 flex items-center text-sm font-bold text-slate-700">
                {{ funcionarioNome || 'Nao informado' }}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-2">
          <button @click="saveTask" class="flex-1 h-11 rounded-xl font-black text-[10px] uppercase bg-blue-700 text-white shadow">
            {{ editingEvent ? 'Salvar edicao' : 'Salvar tarefa' }}
          </button>
          <button v-if="editingEvent" @click="clearEdit" class="h-11 px-3 rounded-xl border border-slate-200 text-slate-500 text-[10px] font-black uppercase">
            Cancelar
          </button>
        </div>

        <div class="mt-5 border-t border-slate-100 pt-4">
          <div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tarefas do dia</div>
          <div v-if="selectedEvents.length" class="space-y-2">
            <div v-for="event in selectedEvents" :key="event.id" class="p-3 rounded-xl border border-slate-200">
              <div class="text-xs font-black text-slate-800">{{ eventTitle(event) }}</div>
              <div class="text-[10px] font-semibold text-slate-500">
                {{ timeLabel(event.inicio_em) }} - {{ timeLabel(event.fim_em) }}
              </div>
              <div class="mt-2 flex items-center gap-2">
                <button @click="editTask(event)" class="h-8 px-3 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
                  Editar
                </button>
                <button @click="removeTask(event)" class="h-8 px-3 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase">
                  Excluir
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-[10px] font-bold text-slate-400">Nenhuma tarefa neste dia.</div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AgendaService, ClienteService, FuncionarioService, PlanoCorteService } from '@/services/index'
import { PIPELINE_CLIENTE, PIPELINE_PLANO_CORTE } from '@/constantes'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import storage from '@/utils/storage'

definePage({ meta: { perm: 'agendamentos.ver' } })

const today = new Date()
const currentMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDay = ref(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
const loading = ref(false)
const events = ref([])
const modalOpen = ref(false)
const editingEvent = ref(null)
const planosProducao = ref([])
const loadingProducao = ref(false)
const clientesOptions = ref([])
const funcionariosOptions = ref([])
const usuarioLogado = computed(() => storage.getUser())
const funcionarioNome = computed(() => usuarioLogado.value?.nome || '')
const isAdmin = computed(() => can('ADMIN'))
const route = useRoute()
const filtroFluxo = ref('TODOS')
const filtroCategoria = ref('TODAS')

const funcionarioSelecionado = ref('')
const taskForm = reactive({
  titulo: '',
  inicio: '',
  fim: '',
  clienteId: '',
  funcionarioIds: [],
  origemFluxo: 'CLIENTE',
  categoria: 'PRODUCAO',
})

const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']

const monthLabel = computed(() =>
  currentMonth.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
)

function dateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

const days = computed(() => {
  const start = startOfMonth(currentMonth.value)
  const end = endOfMonth(currentMonth.value)
  const startWeekDay = start.getDay()
  const totalDays = 42
  const result = []

  for (let i = 0; i < totalDays; i += 1) {
    const day = new Date(start)
    day.setDate(start.getDate() - startWeekDay + i)
    result.push({
      key: dateKey(day),
      date: day,
      inMonth: day.getMonth() === currentMonth.value.getMonth(),
    })
  }
  return result
})

const eventsByDay = computed(() => {
  const map = {}
  for (const ev of events.value) {
    const k = dateKey(new Date(ev.inicio_em))
    if (!map[k]) map[k] = []
    map[k].push(ev)
  }
  return map
})

const selectedEvents = computed(() => eventsByDay.value[dateKey(selectedDay.value)] || [])

const selectedLabel = computed(() =>
  selectedDay.value.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
)

const canVendas = computed(() => can('agendamentos.vendas'))
const canProducao = computed(() => can('agendamentos.producao'))
const fluxoOptions = computed(() => {
  const itens = [{ key: 'TODOS', label: 'Tudo' }]
  if (canVendas.value) itens.push({ key: 'CLIENTE', label: 'Loja / Cliente' })
  if (canProducao.value) itens.push({ key: 'FORNECEDOR', label: 'Fornecedor / Corte' })
  return itens
})
const fluxoFormOptions = computed(() => fluxoOptions.value.filter((item) => item.key !== 'TODOS'))
const categoriaOptions = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'MEDIDA', label: 'Medida' },
  { key: 'ORCAMENTO', label: 'Orcamento' },
  { key: 'MEDIDA_FINA', label: 'Medida fina' },
  { key: 'PRODUCAO', label: 'Producao' },
  { key: 'MONTAGEM', label: 'Montagem' },
]
const categoriaFormOptions = categoriaOptions.filter((item) => item.key !== 'TODAS')

const planosEmProducao = computed(() =>
  planosProducao.value.filter((p) => normalizePlanoStatus(p?.status) === 'EM_PRODUCAO')
)
const totalEventosNoMes = computed(() => events.value.length)
const totalEventosCliente = computed(() =>
  events.value.filter((ev) => eventOrigemKey(ev) === 'CLIENTE').length
)
const totalEventosFornecedor = computed(() =>
  events.value.filter((ev) => eventOrigemKey(ev) === 'FORNECEDOR').length
)

function isSameDay(a, b) {
  return dateKey(a) === dateKey(b)
}

function selectDay(day) {
  selectedDay.value = new Date(day)
  openModal()
}

function eventTitle(event) {
  const nome = event?.cliente?.nome_completo
    || event?.cliente?.razao_social
    || event?.fornecedor?.razao_social
    || 'Cadastro'
  const origem = eventOrigemKey(event) === 'FORNECEDOR' ? 'Fornecedor' : 'Cliente'
  return `${event.titulo} - ${nome} (${origem})`
}

function timeLabel(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function dayEvents(day) {
  return eventsByDay.value[dateKey(day)] || []
}

function normalizePlanoStatus(status) {
  return String(status || '').trim().toUpperCase().replace(/\s+/g, '_')
}

function normalizeAgendaKey(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '_')
}

function eventOrigemKey(event) {
  const key = normalizeAgendaKey(event?.origem_fluxo)
  if (key === 'CLIENTE' || key === 'FORNECEDOR') return key
  if (event?.plano_corte_id || event?.fornecedor_id) return 'FORNECEDOR'
  return 'CLIENTE'
}

function eventOrigemLabel(event) {
  return eventOrigemKey(event) === 'FORNECEDOR' ? 'Fornecedor' : 'Cliente'
}

function eventOrigemClass(event) {
  return eventOrigemKey(event) === 'FORNECEDOR'
    ? 'bg-amber-100 text-amber-800'
    : 'bg-emerald-100 text-emerald-800'
}

function eventCategoriaKey(event) {
  return normalizeAgendaKey(event?.categoria) || 'SEM_CATEGORIA'
}

function eventCategoriaLabel(event) {
  const key = eventCategoriaKey(event)
  const item = categoriaFormOptions.find((opt) => opt.key === key)
  return item?.label || 'Sem categoria'
}

function eventCategoriaClass(event) {
  const key = eventCategoriaKey(event)
  if (key === 'PRODUCAO') return 'bg-sky-100 text-sky-800'
  if (key === 'MONTAGEM') return 'bg-indigo-100 text-indigo-800'
  if (key === 'MEDIDA_FINA') return 'bg-violet-100 text-violet-800'
  if (key === 'MEDIDA') return 'bg-cyan-100 text-cyan-800'
  if (key === 'ORCAMENTO') return 'bg-orange-100 text-orange-800'
  return 'bg-slate-100 text-slate-700'
}

function eventMiniClass(event) {
  return eventOrigemKey(event) === 'FORNECEDOR'
    ? 'bg-amber-900 text-white'
    : 'bg-slate-900 text-white'
}

function getPlanoPipeline(status) {
  const key = normalizePlanoStatus(status)
  return (PIPELINE_PLANO_CORTE || []).find((p) => p.key === key)
}

function planoBadgeClass(status) {
  return getPlanoPipeline(status)?.badgeClass || 'bg-slate-50 text-slate-600 border border-slate-200'
}

function planoDotClass(status) {
  return getPlanoPipeline(status)?.dotClass || 'bg-slate-400'
}

function planoBadgeLabel(status) {
  return getPlanoPipeline(status)?.label || status || '—'
}

function prevMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

function toDateTimeLocal(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function addHours(date, hours) {
  const d = new Date(date)
  d.setHours(d.getHours() + hours)
  return d
}

function openModal() {
  modalOpen.value = true
  editingEvent.value = null
  taskForm.titulo = ''
  taskForm.clienteId = ''
  taskForm.funcionarioIds = []
  funcionarioSelecionado.value = ''
  taskForm.origemFluxo = resolveDefaultFluxo()
  taskForm.categoria = resolveDefaultCategoria()
  const inicio = toDateTimeLocal(selectedDay.value)
  taskForm.inicio = inicio
  taskForm.fim = toDateTimeLocal(addHours(selectedDay.value, 1))
}

function closeModal() {
  modalOpen.value = false
  editingEvent.value = null
}

function clearEdit() {
  editingEvent.value = null
  taskForm.titulo = ''
  taskForm.origemFluxo = resolveDefaultFluxo()
  taskForm.categoria = resolveDefaultCategoria()
  const inicio = toDateTimeLocal(selectedDay.value)
  taskForm.inicio = inicio
  taskForm.fim = toDateTimeLocal(addHours(selectedDay.value, 1))
}

function openGarantia() {
  const item = PIPELINE_CLIENTE.find((p) => p.key === 'GARANTIA')
  taskForm.titulo = item?.label || 'Garantia'
  if (!modalOpen.value) {
    openModal()
  }
}

function editTask(event) {
  editingEvent.value = event
  taskForm.titulo = event.titulo || ''
  taskForm.inicio = toDateTimeLocal(event.inicio_em)
  taskForm.fim = toDateTimeLocal(event.fim_em || event.inicio_em)
  taskForm.clienteId = event?.cliente_id || event?.cliente?.id || ''
  taskForm.funcionarioIds = (event?.equipe || []).map((e) => e.funcionario_id).filter(Boolean)
  taskForm.origemFluxo = eventOrigemKey(event)
  taskForm.categoria = eventCategoriaKey(event) === 'SEM_CATEGORIA' ? resolveDefaultCategoria() : eventCategoriaKey(event)
  funcionarioSelecionado.value = ''
}

function resolveDefaultFluxo() {
  if (filtroFluxo.value !== 'TODOS') return filtroFluxo.value
  if (canVendas.value && !canProducao.value) return 'CLIENTE'
  if (!canVendas.value && canProducao.value) return 'FORNECEDOR'
  return 'CLIENTE'
}

function resolveDefaultCategoria() {
  if (filtroCategoria.value !== 'TODAS') return filtroCategoria.value
  return 'PRODUCAO'
}

function applyViewPresetFromRoute() {
  const rawVisao = String(route.query?.visao || route.query?.fluxo || '').trim().toUpperCase()
  if (!rawVisao) return false

  if (rawVisao === 'LOJA' || rawVisao === 'CLIENTE' || rawVisao === 'VENDAS' || rawVisao === 'VENDA') {
    filtroFluxo.value = 'CLIENTE'
    return true
  }
  if (
    rawVisao === 'FABRICA'
    || rawVisao === 'FÁBRICA'
    || rawVisao === 'FORNECEDOR'
    || rawVisao === 'FORNECEDORES'
  ) {
    filtroFluxo.value = 'FORNECEDOR'
    return true
  }
  if (rawVisao === 'TODOS' || rawVisao === 'TUDO' || rawVisao === 'GERAL') {
    filtroFluxo.value = 'TODOS'
    return true
  }
  return false
}

function funcionarioNomeById(id) {
  const item = funcionariosOptions.value.find((f) => String(f.value) === String(id))
  return item?.label || ''
}

function adicionarFuncionario() {
  const id = funcionarioSelecionado.value
  if (!id) return
  if (!taskForm.funcionarioIds.includes(id)) taskForm.funcionarioIds.push(id)
  funcionarioSelecionado.value = ''
}

function removerFuncionario(id) {
  taskForm.funcionarioIds = taskForm.funcionarioIds.filter((f) => String(f) !== String(id))
}

async function removeTask(event) {
  try {
    await AgendaService.excluir(event.id)
    await loadAgenda()
  } catch (e) {
    notify.error('Nao foi possivel excluir a tarefa.')
  }
}

async function saveTask() {
  if (!taskForm.titulo) return notify.error('Informe o titulo.')
  if (!taskForm.inicio) return notify.error('Informe a data de inicio.')
  if (!taskForm.fim) return notify.error('Informe a data de termino.')
  if (!taskForm.clienteId) return notify.error('Selecione o cliente.')

  const equipeIds = isAdmin.value
    ? taskForm.funcionarioIds.map((id) => Number(id)).filter(Boolean)
    : [Number(usuarioLogado.value?.funcionario_id)]

  if (!equipeIds.length) return notify.error('Informe pelo menos um funcionario.')

  const inicio = new Date(taskForm.inicio)
  if (Number.isNaN(inicio.getTime())) return notify.error('Data invalida.')
  const fim = new Date(taskForm.fim)
  if (Number.isNaN(fim.getTime())) return notify.error('Data invalida.')
  if (fim <= inicio) return notify.error('Termino deve ser depois do inicio.')

  try {
    const origemPayload = editingEvent.value
      ? {
          orcamento_id: editingEvent.value?.orcamento_id || undefined,
          venda_id: editingEvent.value?.venda_id || undefined,
          projeto_id: editingEvent.value?.projeto_id || undefined,
          plano_corte_id: editingEvent.value?.plano_corte_id || undefined,
        }
      : {}

    if (editingEvent.value) {
      await AgendaService.excluir(editingEvent.value.id)
    }
    await AgendaService.criar({
      titulo: taskForm.titulo,
      inicio_em: inicio.toISOString(),
      fim_em: fim.toISOString(),
      cliente_id: Number(taskForm.clienteId),
      equipe_ids: equipeIds,
      origem_fluxo: taskForm.origemFluxo || undefined,
      categoria: taskForm.categoria || undefined,
      ...origemPayload,
    })
    await loadAgenda()
    closeModal()
  } catch (e) {
    notify.error('Nao foi possivel salvar a tarefa.')
  }
}

async function loadAgenda() {
  if (!can('agendamentos.ver')) return
  loading.value = true
  try {
    const inicio = dateKey(startOfMonth(currentMonth.value))
    const fim = dateKey(endOfMonth(currentMonth.value))
    const filtros = {}
    if (filtroFluxo.value !== 'TODOS') filtros.origem_fluxo = filtroFluxo.value
    if (filtroCategoria.value !== 'TODAS') filtros.categoria = filtroCategoria.value
    const res = await AgendaService.listarTodos(inicio, fim, filtros)
    events.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    notify.error('Falha ao carregar agenda.')
    events.value = []
  } finally {
    loading.value = false
  }
}

async function loadPlanosProducao() {
  if (!canProducao.value) return
  loadingProducao.value = true
  try {
    const res = await PlanoCorteService.listar()
    planosProducao.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    planosProducao.value = []
  } finally {
    loadingProducao.value = false
  }
}

async function loadClientes() {
  try {
    const res = await ClienteService.select()
    const lista = Array.isArray(res?.data) ? res.data : []
    clientesOptions.value = lista
      .map((item) => ({
        label: item?.label || item?.nome_completo || item?.razao_social || item?.nome || '',
        value: item?.value ?? item?.id ?? item?.cliente_id ?? item?.codigo ?? null,
      }))
      .filter((opt) => opt.value !== null && opt.value !== undefined)
  } catch (e) {
    clientesOptions.value = []
  }
}

async function loadFuncionarios() {
  if (!isAdmin.value) return
  try {
    const res = await FuncionarioService.select()
    const lista = Array.isArray(res?.data) ? res.data : []
    funcionariosOptions.value = lista
      .map((item) => ({
        label: item?.label || item?.nome || '',
        value: item?.value ?? item?.id ?? null,
      }))
      .filter((opt) => opt.value !== null && opt.value !== undefined)
  } catch (e) {
    funcionariosOptions.value = []
  }
}

onMounted(() => {
  const fromRoute = applyViewPresetFromRoute()
  if (!fromRoute) {
    if (canVendas.value && !canProducao.value) filtroFluxo.value = 'CLIENTE'
    if (!canVendas.value && canProducao.value) filtroFluxo.value = 'FORNECEDOR'
  }
  loadAgenda()
  loadPlanosProducao()
  loadClientes()
  loadFuncionarios()
})
watch(currentMonth, loadAgenda)
watch([filtroFluxo, filtroCategoria], loadAgenda)
watch(
  () => [route.query?.visao, route.query?.fluxo],
  () => {
    applyViewPresetFromRoute()
  },
)
</script>
