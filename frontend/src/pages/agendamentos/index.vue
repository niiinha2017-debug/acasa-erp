<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>

      <PageHeader
        title="Agenda"
        subtitle="Visão mensal de agendamentos e produção"
        icon="pi pi-calendar-clock"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              @click="openGarantia"
            >
              Garantia
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              class="w-10 h-10 !p-0 flex items-center justify-center"
              @click="prevMonth"
            >
              <i class="pi pi-angle-left"></i>
            </Button>
            <div
              class="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
            >
              {{ monthLabel }}
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              class="w-10 h-10 !p-0 flex items-center justify-center"
              @click="nextMonth"
            >
              <i class="pi pi-angle-right"></i>
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="p-4 md:p-6 border-t border-border-ui space-y-6 bg-bg-page">
        <!-- Calendário -->
        <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div class="grid grid-cols-7 gap-px bg-slate-100">
            <div
              v-for="d in weekDays"
              :key="d"
              class="bg-white p-3 text-[10px] font-black uppercase tracking-widest text-slate-400"
            >
              {{ d }}
            </div>
            <button
              v-for="day in days"
              :key="day.key"
              @click="selectDay(day.date)"
              class="bg-white p-3 h-28 flex flex-col items-start text-left border border-transparent hover:border-brand-primary/30 transition-all"
              :class="{
                'bg-slate-50': !day.inMonth,
                'ring-2 ring-brand-primary/30': isSameDay(day.date, selectedDay),
              }"
            >
              <div
                class="text-xs font-black"
                :class="day.inMonth ? 'text-slate-800' : 'text-slate-300'"
              >
                {{ day.date.getDate() }}
              </div>
              <div class="mt-2 w-full space-y-1">
                <div
                  v-for="event in dayEvents(day.date).slice(0, 3)"
                  :key="event.id"
                  class="text-[9px] font-bold truncate px-2 py-0.5 rounded bg-slate-900 text-white"
                  :title="eventTitle(event)"
                >
                  {{ eventTitle(event) }}
                </div>
                <div
                  v-if="dayEvents(day.date).length > 3"
                  class="text-[9px] font-black text-slate-400"
                >
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
              <div v-if="loading" class="text-[10px] font-bold text-slate-400">
                Carregando...
              </div>
            </div>

            <div v-if="selectedEvents.length" class="space-y-2">
              <div
                v-for="event in selectedEvents"
                :key="event.id"
                class="p-3 rounded-xl border border-slate-200"
              >
                <div class="text-xs font-black text-slate-800">
                  {{ eventTitle(event) }}
                </div>
                <div class="text-[10px] font-semibold text-slate-500">
                  {{ timeLabel(event.inicio_em) }} - {{ timeLabel(event.fim_em) }}
                </div>
              </div>
            </div>
            <div v-else class="text-[10px] font-bold text-slate-400">
              Nenhum agendamento para este dia.
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal de agendamento -->
    <div
      v-if="modalOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      @click.self="closeModal"
    >
      <div
        class="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative max-h-[85vh] overflow-y-auto"
      >
        <button
          @click="closeModal"
          class="absolute top-3 right-3 text-slate-400 hover:text-rose-500"
          aria-label="Fechar"
        >
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-lg font-black mb-1">Agendar tarefa</h2>
        <p class="text-xs font-semibold text-slate-500 mb-4">
          {{ selectedLabel }}
        </p>

        <div class="space-y-3">
          <div class="grid grid-cols-12 gap-3">
            <div class="col-span-12 md:col-span-6">
              <label class="block text-xs font-bold mb-1">Inicio</label>
              <input
                type="datetime-local"
                v-model="taskForm.inicio"
                class="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-700"
              />
            </div>
            <div class="col-span-12 md:col-span-6">
              <label class="block text-xs font-bold mb-1">Termino</label>
              <input
                type="datetime-local"
                v-model="taskForm.fim"
                class="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-700"
              />
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
                  <button
                    type="button"
                    class="text-slate-400 hover:text-rose-500"
                    @click="removerFuncionario(fid)"
                  >
                    <i class="pi pi-times text-[10px]"></i>
                  </button>
                </span>
              </div>
            </div>
            <div v-else>
              <label class="block text-xs font-bold mb-1">Funcionario</label>
              <div
                class="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 flex items-center text-sm font-bold text-slate-700"
              >
                {{ funcionarioNome || 'Nao informado' }}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-2">
          <button
            @click="saveTask"
            class="flex-1 h-11 rounded-xl font-black text-[10px] uppercase bg-blue-700 text-white shadow"
          >
            {{ editingEvent ? 'Salvar edicao' : 'Salvar tarefa' }}
          </button>
          <button
            v-if="editingEvent"
            @click="clearEdit"
            class="h-11 px-3 rounded-xl border border-slate-200 text-slate-500 text-[10px] font-black uppercase"
          >
            Cancelar
          </button>
        </div>

        <div class="mt-5 border-t border-slate-100 pt-4">
          <div
            class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2"
          >
            Tarefas do dia
          </div>
          <div v-if="selectedEvents.length" class="space-y-2">
            <div
              v-for="event in selectedEvents"
              :key="event.id"
              class="p-3 rounded-xl border border-slate-200"
            >
              <div class="text-xs font-black text-slate-800">
                {{ eventTitle(event) }}
              </div>
              <div class="text-[10px] font-semibold text-slate-500">
                {{ timeLabel(event.inicio_em) }} - {{ timeLabel(event.fim_em) }}
              </div>
              <div class="mt-2 flex items-center gap-2">
                <button
                  @click="editTask(event)"
                  class="h-8 px-3 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase"
                >
                  Editar
                </button>
                <button
                  @click="removeTask(event)"
                  class="h-8 px-3 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-[10px] font-bold text-slate-400">
            Nenhuma tarefa neste dia.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { AgendaService, ClienteService, FuncionarioService } from '@/services/index'
import { PIPELINE_CLIENTE } from '@/constantes'
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
const clientesOptions = ref([])
const funcionariosOptions = ref([])
const usuarioLogado = computed(() => storage.getUser())
const funcionarioNome = computed(() => usuarioLogado.value?.nome || '')
const isAdmin = computed(() => can('ADMIN'))

const funcionarioSelecionado = ref('')
const taskForm = reactive({
  titulo: '',
  inicio: '',
  fim: '',
  clienteId: '',
  funcionarioIds: [],
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

function isSameDay(a, b) {
  return dateKey(a) === dateKey(b)
}

function selectDay(day) {
  selectedDay.value = new Date(day)
  openModal()
}

function eventTitle(event) {
  const nome = event?.cliente?.nome_completo || event?.cliente?.razao_social || 'Cliente'
  const origem = event?.plano_corte_id
    ? 'Plano de corte'
    : event?.orcamento_id
        ? 'Orcamento'
        : event?.venda_id
            ? 'Venda'
            : 'Cliente'
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
  funcionarioSelecionado.value = ''
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

  const titulo = taskForm.titulo || 'Tarefa de agenda'

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
      titulo,
      inicio_em: inicio.toISOString(),
      fim_em: fim.toISOString(),
      cliente_id: Number(taskForm.clienteId),
      equipe_ids: equipeIds,
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
    const res = await AgendaService.listarTodos(inicio, fim)
    let data = Array.isArray(res?.data) ? res.data : []
    if (canVendas.value && !canProducao.value) {
      data = data.filter((ev) => !ev?.plano_corte_id)
    }
    events.value = data
  } catch (e) {
    notify.error('Falha ao carregar agenda.')
    events.value = []
  } finally {
    loading.value = false
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
  loadAgenda()
  loadClientes()
  loadFuncionarios()
})
watch(currentMonth, loadAgenda)
</script>

