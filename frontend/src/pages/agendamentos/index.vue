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
            <div
              v-for="day in days"
              :key="day.key"
              class="bg-white p-3 h-28 flex flex-col items-start text-left border border-transparent hover:border-brand-primary/30 transition-all relative cursor-pointer"
              :class="{
                'bg-slate-50': !day.inMonth,
                'ring-2 ring-brand-primary/30': isSameDay(day.date, selectedDay),
              }"
              @click="selectDay(day.date)"
            >
              <div class="w-full flex items-center justify-between">
                <span
                  class="text-xs font-black cursor-pointer"
                  :class="day.inMonth ? 'text-slate-800' : 'text-slate-300'"
                >
                  {{ day.date.getDate() }}
                </span>
                <button
                  v-if="day.inMonth"
                  type="button"
                  class="w-6 h-6 flex items-center justify-center rounded-md bg-brand-primary/15 text-brand-primary hover:bg-brand-primary hover:text-white text-sm font-black transition-colors"
                  title="Novo agendamento neste dia"
                  @click.stop="selectDay(day.date)"
                >
                  +
                </button>
              </div>
              <div class="mt-2 w-full space-y-1 flex-1 min-h-0">
                <button
                  v-for="event in dayEvents(day.date).slice(0, 3)"
                  :key="event.id"
                  type="button"
                  class="w-full text-left text-[9px] font-bold truncate px-2 py-0.5 rounded bg-slate-900 text-white hover:ring-2 hover:ring-brand-primary"
                  :title="eventTitle(event)"
                  @click.stop="openModalForEvent(event)"
                >
                  {{ eventTitle(event) }}
                </button>
                <div
                  v-if="dayEvents(day.date).length > 3"
                  class="text-[9px] font-black text-slate-400"
                >
                  +{{ dayEvents(day.date).length - 3 }}
                </div>
              </div>
            </div>
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
              <button
                v-for="event in selectedEvents"
                :key="event.id"
                type="button"
                class="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-brand-primary/50 hover:bg-slate-50/50 transition-colors"
                @click="openModalForEvent(event)"
              >
                <div class="text-xs font-black text-slate-800">
                  {{ eventTitle(event) }}
                </div>
                <div class="text-[10px] font-semibold text-slate-500">
                  {{ timeLabel(event.inicio_em) }} - {{ timeLabel(event.fim_em) }}
                </div>
                <div
                  v-if="event.plano_corte_id"
                  class="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                  :class="planoBadgeClass(planoStatusForEvent(event))"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="planoDotClass(planoStatusForEvent(event))"
                  ></span>
                  {{ planoBadgeLabel(planoStatusForEvent(event)) }}
                </div>
              </button>
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

        <!-- Próxima etapa da venda (só ao criar; pré-preenche cliente + status) -->
        <section v-if="!editingEvent && canVendas" class="mb-5 p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-3">
          <div class="text-[10px] font-black uppercase tracking-widest text-indigo-600">
            Próxima etapa da venda
          </div>
          <p class="text-[10px] text-slate-600">
            Selecione uma venda que está aguardando agendamento. O cliente e a etapa (medida fina, montagem, etc.) serão preenchidos e o status da venda será atualizado ao salvar.
          </p>
          <SearchInput
            v-model="vendaSelecionadaId"
            mode="select"
            label=""
            placeholder="Selecione a venda (ex.: medida fina, montagem)..."
            :options="vendasAguardandoOptions"
            @update:modelValue="onSelecionarVendaParaAgendamento"
          />
          <div v-if="vendaSelecionadaParaAgendamento" class="flex flex-wrap items-center gap-2 pt-2">
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase"
              :class="statusBadgeClassVenda"
            >
              {{ statusLabelVenda }}
            </span>
            <span class="text-xs font-bold text-slate-700">
              {{ clienteNomeVenda }}
            </span>
            <button
              type="button"
              class="text-slate-500 hover:text-rose-500 text-[10px] font-bold"
              @click="limparVendaSelecionada"
            >
              Limpar
            </button>
          </div>
        </section>

        <div class="space-y-5">
          <!-- 1. Tipo e período da tarefa -->
          <section class="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
            <div class="text-[10px] font-black uppercase tracking-widest text-slate-500">
              1. Tipo e período da tarefa
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">Tipo</label>
              <p v-if="!opcoesTipoAgendamento.unico && !vendaSelecionadaParaAgendamento" class="text-[10px] text-slate-500 mb-1">
                Venda = pipeline do cliente. Plano de corte = produção para fornecedor.
              </p>
              <select
                v-model="taskForm.categoria"
                class="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-700"
                :disabled="!!vendaSelecionadaParaAgendamento"
              >
                <template v-if="opcoesTipoAgendamento.unico">
                  <option
                    v-for="opt in opcoesTipoAgendamento.opcoes"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </template>
                <template v-else>
                  <optgroup label="Venda (cliente)">
                    <option
                      v-for="opt in opcoesTipoAgendamento.venda"
                      :key="'v-' + opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </optgroup>
                  <optgroup label="Plano de corte">
                    <option
                      v-for="opt in opcoesTipoAgendamento.planoCorte"
                      :key="'p-' + opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </optgroup>
                </template>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">Período da tarefa (quando acontece)</label>
              <p class="text-[10px] text-slate-500 mb-2">Use como referência; abaixo você define o horário de cada pessoa.</p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-bold mb-1">Início</label>
                  <input
                    type="datetime-local"
                    v-model="taskForm.inicio"
                    class="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold mb-1">Término</label>
                  <input
                    type="datetime-local"
                    v-model="taskForm.fim"
                    class="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- 2. Cliente (oculto quando veio de "Próxima etapa da venda") -->
          <section v-if="!vendaSelecionadaParaAgendamento">
            <div class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">2. Cliente</div>
            <SearchInput
              v-model="taskForm.clienteId"
              mode="select"
              label=""
              placeholder="Selecione o cliente..."
              :options="clientesOptions"
            />
          </section>

          <!-- 3. Equipe e horário de cada um -->
          <section class="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
            <div class="text-[10px] font-black uppercase tracking-widest text-slate-500">
              3. Equipe e horário de cada um
            </div>
            <p class="text-[10px] text-slate-500">
              Adicione quem vai atuar e defina o horário (entrada e saída) de cada pessoa.
            </p>

            <div v-if="isAdmin" class="space-y-2">
              <div class="flex items-end gap-2">
                <div class="flex-1">
                  <SearchInput
                    v-model="funcionarioSelecionado"
                    mode="select"
                    label="Adicionar funcionário"
                    placeholder="Selecione..."
                    :options="funcionariosOptions"
                  />
                </div>
                <button
                  type="button"
                  class="h-10 px-4 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase shrink-0"
                  @click="adicionarFuncionario"
                >
                  Adicionar
                </button>
              </div>

              <div v-if="taskForm.funcionarioIds.length" class="flex flex-wrap gap-2 mt-2">
                <span
                  v-for="fid in taskForm.funcionarioIds"
                  :key="fid"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700"
                >
                  {{ funcionarioNomeById(fid) || 'Funcionário' }}
                  <button
                    type="button"
                    class="text-slate-500 hover:text-rose-500"
                    @click="removerFuncionario(fid)"
                    aria-label="Remover"
                  >
                    <i class="pi pi-times text-[10px]"></i>
                  </button>
                </span>
              </div>
            </div>
            <div v-else>
              <label class="block text-xs font-bold mb-1">Funcionário</label>
              <div class="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 flex items-center text-sm font-bold text-slate-700">
                {{ funcionarioNome || 'Não informado' }}
              </div>
            </div>

            <!-- Horário por pessoa -->
            <div v-if="taskForm.funcionarioIds.length" class="mt-4 space-y-3">
              <div
                v-for="fid in taskForm.funcionarioIds"
                :key="`apont-${fid}`"
                class="rounded-xl border border-slate-200 p-3 bg-white"
              >
                <div class="text-xs font-black text-slate-700 mb-2">
                  {{ funcionarioNomeById(fid) || 'Funcionário' }} — horário
                </div>
                <div
                  v-for="(periodo, idx) in getApontamentosPorFuncionario(fid)"
                  :key="`per-${fid}-${idx}`"
                  class="flex flex-wrap gap-2 items-end"
                >
                  <div class="flex-1 min-w-[140px]">
                    <label class="block text-[10px] font-bold mb-1">Entrada</label>
                    <input
                      type="datetime-local"
                      v-model="periodo.inicio"
                      class="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-2 text-[11px] font-semibold text-slate-700"
                    />
                  </div>
                  <div class="flex-1 min-w-[140px]">
                    <label class="block text-[10px] font-bold mb-1">Saída</label>
                    <input
                      type="datetime-local"
                      v-model="periodo.fim"
                      class="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-2 text-[11px] font-semibold text-slate-700"
                    />
                  </div>
                  <div class="flex gap-1 shrink-0">
                    <button
                      v-if="getApontamentosPorFuncionario(fid).length > 1"
                      type="button"
                      class="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 text-xs font-black"
                      @click="removerPeriodo(fid, idx)"
                      title="Remover este horário"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      class="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 text-xs font-black"
                      @click="adicionarPeriodo(fid)"
                      :title="getApontamentosPorFuncionario(fid).length > 0 ? 'Outro horário (ex.: turno dividido)' : 'Definir horário'"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p v-if="getApontamentosPorFuncionario(fid).length > 1" class="text-[9px] text-slate-400 mt-1">
                  + para outro horário (ex.: turno dividido)
                </p>
              </div>
            </div>
          </section>
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
import { AgendaService, ClienteService, FuncionarioService, PlanoCorteService, VendaService } from '@/services/index'
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
  vendaId: '',
  funcionarioIds: [],
  categoria: 'LIVRE',
  apontamentos: [],
})

// Vendas aguardando agendamento (medida, medida fina, montagem) — para pré-preencher o modal
const vendasAguardandoAgendamento = ref([])
const vendaSelecionadaParaAgendamento = ref(null)

const STATUS_PARA_CATEGORIA = {
  CONTRATO_GERADO: 'MEDIDA_FINA',
  AGENDAR_MEDIDA: 'MEDIDA',
  AGENDAR_MEDIDA_FINA: 'MEDIDA_FINA',
  AGENDAR_MONTAGEM: 'MONTAGEM',
}

const vendaSelecionadaId = ref('')

const vendasAguardandoOptions = computed(() => {
  const lista = vendasAguardandoAgendamento.value || []
  return lista.map((v) => {
    const clienteNome = v?.cliente?.nome_completo || v?.cliente?.razao_social || 'Cliente'
    const statusKey = v?.status || ''
    const etapaLabel =
      statusKey === 'CONTRATO_GERADO'
        ? 'Agendar medida fina'
        : (PIPELINE_CLIENTE.find((p) => p.key === statusKey)?.label || statusKey || 'Agendar')
    return {
      value: String(v.id),
      label: `Venda #${v.id} – ${clienteNome} – ${etapaLabel}`,
      venda: v,
    }
  })
})

const statusLabelVenda = computed(() => {
  const v = vendaSelecionadaParaAgendamento.value
  if (!v?.status) return ''
  const item = PIPELINE_CLIENTE.find((p) => p.key === v.status)
  return item ? `Aguardando agendamento: ${item.label}` : v.status
})

const statusBadgeClassVenda = computed(() => {
  const v = vendaSelecionadaParaAgendamento.value
  const item = v?.status ? PIPELINE_CLIENTE.find((p) => p.key === v.status) : null
  const fase = item?.fase || ''
  if (fase.includes('MEDIDA_FINA') || fase.includes('MEDIDA')) return 'bg-indigo-100 text-indigo-800 border border-indigo-200'
  if (fase.includes('MONTAGEM')) return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
  return 'bg-slate-100 text-slate-700 border border-slate-200'
})

const clienteNomeVenda = computed(() => {
  const v = vendaSelecionadaParaAgendamento.value
  return v?.cliente?.nome_completo || v?.cliente?.razao_social || 'Cliente' || ''
})

function onSelecionarVendaParaAgendamento(value) {
  const id = value ?? vendaSelecionadaId.value
  if (!id) return
  const opt = vendasAguardandoOptions.value.find((o) => String(o.value) === String(id))
  const v = opt?.venda
  if (!v) return
  vendaSelecionadaParaAgendamento.value = v
  taskForm.vendaId = String(v.id)
  taskForm.clienteId = String(v.cliente_id)
  taskForm.categoria = STATUS_PARA_CATEGORIA[v.status] || 'LIVRE'
  const clienteNome = v?.cliente?.nome_completo || v?.cliente?.razao_social || 'Cliente'
  const pipelineItem = PIPELINE_CLIENTE.find((p) => p.key === (v?.status || ''))
  const etapaLabel = pipelineItem?.label || v?.status || 'Etapa'
  taskForm.titulo = `${etapaLabel} – ${clienteNome}`
}

function limparVendaSelecionada() {
  vendaSelecionadaId.value = ''
  vendaSelecionadaParaAgendamento.value = null
  taskForm.vendaId = ''
  taskForm.clienteId = ''
  taskForm.categoria = 'LIVRE'
  taskForm.titulo = ''
}

const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']

const monthLabel = computed(() =>
  currentMonth.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
)

// Contexto do evento em edição: venda (cliente) ou plano de corte
const isEventoPlanoCorte = computed(() => !!editingEvent.value?.plano_corte_id)
const isEventoVenda = computed(
  () => !!editingEvent.value?.venda_id || !!editingEvent.value?.orcamento_id
)

// Opções de tipo conforme o pipeline: venda/cliente vs plano de corte
const TIPOS_VENDA = [
  { value: 'LIVRE', label: 'Tarefa livre' },
  { value: 'MEDIDA', label: 'Medida' },
  { value: 'MEDIDA_FINA', label: 'Medida fina' },
  { value: 'PRODUCAO', label: 'Produção' },
  { value: 'MONTAGEM', label: 'Montagem' },
]
const TIPOS_PLANO_CORTE = [
  { value: 'LIVRE', label: 'Tarefa livre' },
  { value: 'PRODUCAO', label: 'Produção (plano de corte)' },
]

const opcoesTipoAgendamento = computed(() => {
  if (isEventoPlanoCorte.value) {
    return { unico: true, opcoes: TIPOS_PLANO_CORTE }
  }
  if (isEventoVenda.value) {
    return { unico: true, opcoes: TIPOS_VENDA }
  }
  return {
    unico: false,
    venda: TIPOS_VENDA,
    planoCorte: TIPOS_PLANO_CORTE,
  }
})

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

function normalizePlanoStatus(status) {
  return String(status || '').trim().toUpperCase().replace(/\s+/g, '_')
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

function planoStatusForEvent(event) {
  const id = event?.plano_corte_id
  if (!id) return null
  const plano = planosProducao.value.find((p) => String(p.id) === String(id))
  return plano?.status || null
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
  taskForm.vendaId = ''
  taskForm.funcionarioIds = []
  taskForm.categoria = 'LIVRE'
  taskForm.apontamentos = []
  vendaSelecionadaId.value = ''
  vendaSelecionadaParaAgendamento.value = null
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
  taskForm.apontamentos = []
}

function openGarantia() {
  const item = PIPELINE_CLIENTE.find((p) => p.key === 'GARANTIA')
  taskForm.titulo = item?.label || 'Garantia'
  if (!modalOpen.value) {
    openModal()
  }
}

function openModalForEvent(event) {
  selectedDay.value = new Date(event.inicio_em)
  editTask(event)
  modalOpen.value = true
}

function editTask(event) {
  editingEvent.value = event
  taskForm.titulo = event.titulo || ''
  taskForm.inicio = toDateTimeLocal(event.inicio_em)
  taskForm.fim = toDateTimeLocal(event.fim_em || event.inicio_em)
  taskForm.clienteId = event?.cliente_id || event?.cliente?.id || ''
  taskForm.funcionarioIds = (event?.equipe || []).map((e) => e.funcionario_id).filter(Boolean)
  const cat = event?.categoria || 'LIVRE'
  // Garante categoria válida para o pipeline do evento (venda vs plano de corte)
  if (event?.plano_corte_id) {
    taskForm.categoria = ['LIVRE', 'PRODUCAO'].includes(cat) ? cat : 'PRODUCAO'
  } else if (event?.venda_id || event?.orcamento_id) {
    const vendaKeys = TIPOS_VENDA.map((o) => o.value)
    taskForm.categoria = vendaKeys.includes(cat) ? cat : 'LIVRE'
  } else {
    taskForm.categoria = cat
  }
  // Monta apontamentos existentes ou padrão baseado no próprio evento
  if (Array.isArray(event.apontamentos) && event.apontamentos.length) {
    const map = {}
    for (const a of event.apontamentos) {
      const fid = String(a.funcionario_id)
      if (!map[fid]) map[fid] = []
      map[fid].push({
        inicio: toDateTimeLocal(a.inicio_em),
        fim: toDateTimeLocal(a.fim_em || a.inicio_em),
      })
    }
    taskForm.apontamentos = Object.entries(map).map(([fid, periodos]) => ({
      funcionarioId: fid,
      periodos,
    }))
  } else {
    taskForm.apontamentos = []
  }
  funcionarioSelecionado.value = ''
}

function ensureApontamentoParaFuncionario(id) {
  const fid = String(id)
  if (!fid) return
  const existente = taskForm.apontamentos.find((a) => String(a.funcionarioId) === fid)
  if (!existente) {
    taskForm.apontamentos.push({
      funcionarioId: fid,
      periodos: [
        {
          inicio: taskForm.inicio || toDateTimeLocal(selectedDay.value),
          fim: taskForm.fim || toDateTimeLocal(addHours(selectedDay.value, 1)),
        },
      ],
    })
  }
}

function getApontamentosPorFuncionario(id) {
  const fid = String(id)
  let registro = taskForm.apontamentos.find((a) => String(a.funcionarioId) === fid)
  if (!registro) {
    ensureApontamentoParaFuncionario(fid)
    registro = taskForm.apontamentos.find((a) => String(a.funcionarioId) === fid)
  }
  if (!Array.isArray(registro.periodos) || !registro.periodos.length) {
    registro.periodos = [
      {
        inicio: taskForm.inicio || toDateTimeLocal(selectedDay.value),
        fim: taskForm.fim || toDateTimeLocal(addHours(selectedDay.value, 1)),
      },
    ]
  }
  return registro.periodos
}

function adicionarPeriodo(id) {
  const periodos = getApontamentosPorFuncionario(id)
  const base =
    periodos[periodos.length - 1] || {
      inicio: taskForm.inicio || toDateTimeLocal(selectedDay.value),
      fim: taskForm.fim || toDateTimeLocal(addHours(selectedDay.value, 1)),
    }
  periodos.push({
    inicio: base.inicio,
    fim: base.fim,
  })
}

function removerPeriodo(id, idx) {
  const fid = String(id)
  const registro = taskForm.apontamentos.find((a) => String(a.funcionarioId) === fid)
  if (!registro || !Array.isArray(registro.periodos)) return
  if (registro.periodos.length <= 1) return
  registro.periodos.splice(idx, 1)
}

function funcionarioNomeById(id) {
  const item = funcionariosOptions.value.find((f) => String(f.value) === String(id))
  return item?.label || ''
}

function adicionarFuncionario() {
  const id = funcionarioSelecionado.value
  if (!id) return
  if (!taskForm.funcionarioIds.includes(id)) taskForm.funcionarioIds.push(id)
  ensureApontamentoParaFuncionario(id)
  funcionarioSelecionado.value = ''
}

function removerFuncionario(id) {
  taskForm.funcionarioIds = taskForm.funcionarioIds.filter((f) => String(f) !== String(id))
  taskForm.apontamentos = taskForm.apontamentos.filter(
    (a) => String(a.funcionarioId) !== String(id),
  )
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

  // Cada funcionário da equipe deve ter pelo menos um horário (início e término) preenchido
  for (const fid of taskForm.funcionarioIds) {
    const periodos = getApontamentosPorFuncionario(fid)
    const temHorarioValido = periodos.some((p) => {
      if (!p?.inicio || !p?.fim) return false
      const i = new Date(p.inicio)
      const f = new Date(p.fim)
      return !Number.isNaN(i.getTime()) && !Number.isNaN(f.getTime()) && f > i
    })
    if (!temHorarioValido) {
      const nome = funcionarioNomeById(fid) || 'Funcionário'
      return notify.error(`Informe o horário de início e término para ${nome}.`)
    }
  }

  const inicio = new Date(taskForm.inicio)
  if (Number.isNaN(inicio.getTime())) return notify.error('Data invalida.')
  const fim = new Date(taskForm.fim)
  if (Number.isNaN(fim.getTime())) return notify.error('Data invalida.')
  if (fim <= inicio) return notify.error('Termino deve ser depois do inicio.')

  const titulo = taskForm.titulo || 'Tarefa de agenda'

  // Monta apontamentos individuais (flatten)
  const apontamentosPayload = []
  for (const registro of taskForm.apontamentos || []) {
    const fid = Number(registro.funcionarioId)
    if (!fid) continue
    for (const periodo of registro.periodos || []) {
      if (!periodo.inicio || !periodo.fim) continue
      const apInicio = new Date(periodo.inicio)
      const apFim = new Date(periodo.fim)
      if (Number.isNaN(apInicio.getTime()) || Number.isNaN(apFim.getTime())) continue
      if (apFim <= apInicio) continue
      apontamentosPayload.push({
        funcionario_id: fid,
        inicio_em: apInicio.toISOString(),
        fim_em: apFim.toISOString(),
      })
    }
  }

  try {
    const origemPayload = editingEvent.value
      ? {
          orcamento_id: editingEvent.value?.orcamento_id || undefined,
          venda_id: editingEvent.value?.venda_id || undefined,
          projeto_id: editingEvent.value?.projeto_id || undefined,
          plano_corte_id: editingEvent.value?.plano_corte_id || undefined,
        }
      : taskForm.vendaId
        ? { venda_id: Number(taskForm.vendaId) }
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
       categoria: taskForm.categoria || 'LIVRE',
       apontamentos: apontamentosPayload,
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
    // Vendedores (só agendamentos.vendas) veem apenas eventos de venda/cliente; produção vê tudo
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

async function loadPlanosProducao() {
  if (!canProducao.value) return
  try {
    const res = await PlanoCorteService.listar()
    planosProducao.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    planosProducao.value = []
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

async function loadVendasAguardandoAgendamento() {
  if (!canVendas.value) return
  try {
    const res = await VendaService.aguardandoAgendamento()
    vendasAguardandoAgendamento.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    vendasAguardandoAgendamento.value = []
  }
}

onMounted(() => {
  loadAgenda()
  loadPlanosProducao()
  loadClientes()
  loadFuncionarios()
  loadVendasAguardandoAgendamento()
})
watch(currentMonth, loadAgenda)
</script>

