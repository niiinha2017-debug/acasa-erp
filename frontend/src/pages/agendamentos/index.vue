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
        class="bg-white rounded-2xl shadow-xl w-full max-w-[760px] p-5 md:p-6 relative max-h-[88vh] overflow-y-auto"
      >
        <button
          @click="closeModal"
          class="absolute top-3 right-3 text-slate-400 hover:text-rose-500"
          aria-label="Fechar"
        >
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-lg md:text-xl font-black mb-1">Agendar tarefa</h2>
        <p class="text-xs font-semibold text-slate-500 mb-3">
          {{ selectedLabel }}
        </p>

        <section class="mb-4 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
          <div class="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Fluxo da agenda
          </div>

          <template v-if="!editingEvent">
            <div>
              <div class="text-[10px] font-bold text-slate-600 mb-2">1. Setor</div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="h-9 px-3 rounded-lg text-[10px] font-black uppercase border"
                  :class="taskForm.setorDestino === 'LOJA' ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200'"
                  @click="selecionarSetor('LOJA')"
                >
                  Loja
                </button>
                <button
                  type="button"
                  class="h-9 px-3 rounded-lg text-[10px] font-black uppercase border"
                  :class="taskForm.setorDestino === 'PRODUCAO' ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200'"
                  @click="selecionarSetor('PRODUCAO')"
                >
                  Producao
                </button>
              </div>
            </div>

            <div>
              <div class="text-[10px] font-bold text-slate-600 mb-2">2. Origem</div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="origem in opcoesOrigemPorSetor"
                  :key="origem.value"
                  type="button"
                  class="h-9 px-3 rounded-lg text-[10px] font-black uppercase border"
                  :class="taskForm.origemFluxo === origem.value ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'"
                  @click="taskForm.origemFluxo = origem.value"
                >
                  {{ origem.label }}
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="flex flex-wrap gap-2">
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700">
                Setor: {{ String(editingEvent?.setor_destino || 'LOJA').toUpperCase() }}
              </span>
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-200 text-slate-700">
                Origem: {{ String(editingEvent?.origem_fluxo || 'TAREFA').toUpperCase() }}
              </span>
            </div>
          </template>
        </section>

        <!-- Próxima etapa vira apenas status informativo -->
        <section
          v-if="!editingEvent && canVendas && ['LOJA_VENDA', 'POS_VENDA'].includes(taskForm.origemFluxo)"
          class="mb-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-3"
        >
          <div class="text-[10px] font-black uppercase tracking-widest text-indigo-600">
            Proxima etapa (status)
          </div>
          <p class="text-[10px] text-slate-600">
            A próxima etapa é um status do processo. Ela será aplicada ao salvar, conforme a origem e o tipo selecionado.
          </p>
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase"
              :class="statusBadgeClassVenda"
            >
              {{ statusPreviewLabel }}
            </span>
          </div>
        </section>

        <div v-if="editingEvent || fluxoSelecionado" class="space-y-4">
          <!-- 1. Cliente -->
          <section>
            <div class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">1. Cliente</div>
            <div
              v-if="isEventoVinculado && clienteNomeEventoAtual"
              class="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2"
            >
              <div class="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">
                Cliente vinculado ao evento
              </div>
              <div class="text-xs font-black text-slate-800">
                {{ clienteNomeEventoAtual }}
              </div>
              <div class="text-[10px] font-semibold text-slate-500">
                {{ origemEventoLabel }}
              </div>
            </div>
            <SearchInput
              v-else
              v-model="taskForm.clienteId"
              mode="select"
              label=""
              :placeholder="taskForm.origemFluxo === 'TAREFA' ? 'Cliente opcional para tarefa livre...' : 'Selecione o cliente...'"
              :options="clientesOptions"
            />
            <div
              v-if="!editingEvent && canVendas && ['LOJA_VENDA', 'POS_VENDA'].includes(taskForm.origemFluxo)"
              class="mt-3"
            >
              <SearchInput
                v-model="vendaSelecionadaId"
                mode="select"
                label="Venda vinculada"
                placeholder="Selecione a venda..."
                :options="vendasAguardandoOptions"
                @update:modelValue="onSelecionarVendaParaAgendamento"
              />
              <p v-if="!temVendasAguardando" class="text-[10px] font-semibold text-slate-500 mt-1">
                Nenhuma venda pendente de agendamento no momento.
              </p>
            </div>
          </section>

          <!-- 2. Tipo e período da tarefa -->
          <section class="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
            <div class="text-[10px] font-black uppercase tracking-widest text-slate-500">
              2. Tipo e período da tarefa
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">Tipo</label>
              <p class="text-[10px] text-slate-500 mb-1">
                Pipeline do cliente e pipeline do plano de corte são separados.
              </p>
              <select
                v-model="taskForm.categoria"
                class="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-700"
                :disabled="editingEvent && String(editingEvent?.origem_fluxo || '').toUpperCase() === 'TAREFA'"
              >
                <option
                  v-for="opt in opcoesTipoAgendamento"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">Prazo recorrente da tarefa</label>
              <p class="text-[10px] text-slate-500 mb-2">Esse período é a referência recorrente; abaixo você define o horário de cada pessoa.</p>
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
                  class="h-10 px-4 rounded-xl bg-slate-900 text-white text-xs font-black uppercase shrink-0"
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
        <div v-else class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
          Selecione Setor e Origem para liberar o formulario do agendamento.
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          <button
            @click="saveTask"
            class="flex-1 h-10 rounded-xl font-black text-xs uppercase bg-blue-700 text-white shadow"
          >
            {{ editingEvent ? 'Salvar edicao' : 'Salvar tarefa' }}
          </button>
          <button
            v-if="editingEvent"
            @click="clearEdit"
            class="h-10 px-3 rounded-xl border border-slate-200 text-slate-500 text-xs font-black uppercase"
          >
            Cancelar
          </button>
        </div>

        <div v-if="!editingEvent" class="mt-4 border-t border-slate-100 pt-4">
          <div
            class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2"
          >
            Tarefas do dia
          </div>
          <div v-if="selectedEventsParaLista.length" class="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div
              v-for="event in selectedEventsParaLista"
              :key="event.id"
              class="p-3 rounded-xl border border-slate-200"
            >
              <div class="text-xs font-black text-slate-800">
                {{ eventTitle(event) }}
              </div>
              <div class="text-[10px] font-semibold text-slate-500">
                {{ timeLabel(event.inicio_em) }} - {{ timeLabel(event.fim_em) }}
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <button
                  v-if="canVendas && String(event?.setor_destino || 'LOJA').toUpperCase() !== 'PRODUCAO'"
                  @click="enviarParaProducao(event)"
                  class="h-8 px-3 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase"
                >
                  Enviar producao
                </button>
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
                  Cancelar
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-[10px] font-bold text-slate-400">Nenhuma tarefa neste dia.</div>
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
  setorDestino: '',
  origemFluxo: '',
  apontamentos: [],
})

const ORIGENS_POR_SETOR = {
  LOJA: [
    { value: 'LOJA_VENDA', label: 'Venda loja' },
    { value: 'POS_VENDA', label: 'Pos-venda' },
    { value: 'TAREFA', label: 'Tarefa livre' },
  ],
  PRODUCAO: [
    { value: 'PLANO_CORTE', label: 'Plano corte' },
    { value: 'VENDA_PLANO_CORTE', label: 'Venda plano corte' },
    { value: 'TAREFA', label: 'Tarefa livre' },
  ],
}

const opcoesOrigemPorSetor = computed(() => {
  const setor = String(taskForm.setorDestino || '').toUpperCase()
  return ORIGENS_POR_SETOR[setor] || []
})

const fluxoSelecionado = computed(() => {
  return Boolean(taskForm.setorDestino && taskForm.origemFluxo)
})

function selecionarSetor(setor) {
  if (taskForm.setorDestino !== setor) {
    taskForm.origemFluxo = ''
    limparVendaSelecionada()
  }
  taskForm.setorDestino = setor
}

// Vendas aguardando agendamento (medida, medida fina, montagem) — para pré-preencher o modal
const vendasAguardandoAgendamento = ref([])
const vendaSelecionadaParaAgendamento = ref(null)

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
const temVendasAguardando = computed(() => vendasAguardandoOptions.value.length > 0)

const CATEGORIA_TO_STATUS_CLIENTE = {
  MEDIDA: 'MEDIDA_AGENDADA',
  MEDIDA_FINA: 'MEDIDA_FINA_AGENDADA',
  MONTAGEM: 'MONTAGEM_AGENDADA',
  PRODUCAO: 'PRODUCAO_AGENDADA',
}

const STATUS_POS_VENDA = (PIPELINE_CLIENTE || [])
  .filter((p) => String(p?.fase || '').toUpperCase() === 'POS_VENDA')
  .map((p) => String(p?.key || '').toUpperCase())
  .filter(Boolean)

function labelPipelineCliente(key) {
  const item = (PIPELINE_CLIENTE || []).find((p) => String(p?.key || '').toUpperCase() === String(key || '').toUpperCase())
  return item?.label || String(key || '')
}

function labelPipelinePlanoCorte(key) {
  const item = (PIPELINE_PLANO_CORTE || []).find((p) => String(p?.key || '').toUpperCase() === String(key || '').toUpperCase())
  return item?.label || String(key || '')
}

const statusLabelVenda = computed(() => {
  const v = vendaSelecionadaParaAgendamento.value
  if (!v?.status) return ''
  const item = PIPELINE_CLIENTE.find((p) => p.key === v.status)
  return item ? `Aguardando agendamento: ${item.label}` : v.status
})

const statusPreviewLabel = computed(() => {
  const origem = String(taskForm.origemFluxo || '').toUpperCase()
  if (origem === 'PLANO_CORTE' || origem === 'VENDA_PLANO_CORTE') {
    return `Pipeline plano de corte: ${labelPipelinePlanoCorte('EM_PRODUCAO')}`
  }
  if (origem === 'POS_VENDA') {
    const statusKey = taskForm.categoria ? String(taskForm.categoria).toUpperCase() : 'GARANTIA'
    return `Pipeline cliente (pos-venda): ${labelPipelineCliente(statusKey)}`
  }
  if (origem === 'LOJA_VENDA') {
    if (vendaSelecionadaParaAgendamento.value) return statusLabelVenda.value || 'Pipeline cliente'
    const statusKey = CATEGORIA_TO_STATUS_CLIENTE[String(taskForm.categoria || '').toUpperCase()]
    return statusKey
      ? `Pipeline cliente: ${labelPipelineCliente(statusKey)}`
      : 'Pipeline cliente'
  }
  return 'Tarefa livre sem pipeline'
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
  if (!taskForm.setorDestino) taskForm.setorDestino = 'LOJA'
  taskForm.origemFluxo = isStatusPosVenda(v?.status) ? 'POS_VENDA' : 'LOJA_VENDA'
  if (taskForm.origemFluxo === 'POS_VENDA') {
    const statusVenda = String(v?.status || '').toUpperCase()
    taskForm.categoria = STATUS_POS_VENDA.includes(statusVenda)
      ? statusVenda
      : (STATUS_POS_VENDA[0] || 'GARANTIA')
  } else {
    taskForm.categoria = 'MEDIDA_FINA'
  }
  const clienteNome = v?.cliente?.nome_completo || v?.cliente?.razao_social || 'Cliente'
  const pipelineItem = PIPELINE_CLIENTE.find((p) => p.key === (v?.status || ''))
  const etapaLabel = pipelineItem?.label || v?.status || 'Etapa'
  taskForm.titulo = `${etapaLabel} – ${clienteNome}`
}

function isStatusPosVenda(status) {
  const key = String(status || '').toUpperCase()
  return STATUS_POS_VENDA.includes(key)
}

function limparVendaSelecionada() {
  vendaSelecionadaId.value = ''
  vendaSelecionadaParaAgendamento.value = null
  taskForm.vendaId = ''
  if (taskForm.origemFluxo !== 'TAREFA') taskForm.clienteId = ''
  taskForm.categoria = 'LIVRE'
  taskForm.titulo = ''
}

watch(
  () => taskForm.origemFluxo,
  (origem) => {
    const key = String(origem || '').toUpperCase()
    if (!['LOJA_VENDA', 'POS_VENDA'].includes(key)) {
      limparVendaSelecionada()
    }
    if (key === 'LOJA_VENDA') taskForm.categoria = 'MEDIDA_FINA'
    else if (key === 'POS_VENDA') taskForm.categoria = STATUS_POS_VENDA[0] || 'GARANTIA'
    else if (key === 'PLANO_CORTE' || key === 'VENDA_PLANO_CORTE') taskForm.categoria = 'PRODUCAO'
    else taskForm.categoria = 'LIVRE'
  },
)

const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']

const monthLabel = computed(() =>
  currentMonth.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
)

// Contexto do evento em edição: venda (cliente) ou plano de corte
const isEventoPlanoCorte = computed(() => !!editingEvent.value?.plano_corte_id)
const isEventoVenda = computed(
  () => !!editingEvent.value?.venda_id || !!editingEvent.value?.orcamento_id
)
const isEventoVinculado = computed(() => {
  const ev = editingEvent.value
  if (!ev) return false
  if (ev?.venda_id || ev?.orcamento_id || ev?.plano_corte_id || ev?.projeto_id) return true
  const origem = String(ev?.origem_fluxo || '').toUpperCase()
  return !!origem && origem !== 'TAREFA'
})

const clienteNomeEventoAtual = computed(() => {
  const ev = editingEvent.value
  if (!ev) return ''
  if (ev?.cliente?.nome_completo || ev?.cliente?.razao_social) {
    return ev?.cliente?.nome_completo || ev?.cliente?.razao_social || ''
  }
  const clienteId = String(taskForm.clienteId || '')
  if (!clienteId) return ''
  const opt = clientesOptions.value.find((c) => String(c.value) === clienteId)
  return opt?.label || ''
})

const origemEventoLabel = computed(() => {
  const origem = String(editingEvent.value?.origem_fluxo || '').toUpperCase()
  const map = {
    PLANO_CORTE: 'Origem: plano de corte',
    VENDA_PLANO_CORTE: 'Origem: venda do plano de corte',
    LOJA_VENDA: 'Origem: cliente venda da loja',
    POS_VENDA: 'Origem: cliente pós-venda',
    TAREFA: 'Origem: tarefa livre',
  }
  return map[origem] || 'Origem: agenda'
})

// Opções por origem (fonte da verdade: pipelines compartilhados)
const TIPOS_LOJA_VENDA = [
  { value: 'MEDIDA', label: labelPipelineCliente('MEDIDA_AGENDADA') },
  { value: 'MEDIDA_FINA', label: labelPipelineCliente('MEDIDA_FINA_AGENDADA') },
  { value: 'MONTAGEM', label: labelPipelineCliente('MONTAGEM_AGENDADA') },
  { value: 'PRODUCAO', label: labelPipelineCliente('PRODUCAO_AGENDADA') },
]
const TIPOS_POS_VENDA = STATUS_POS_VENDA.map((key) => ({
  value: key,
  label: labelPipelineCliente(key),
}))
const TIPOS_PLANO_CORTE = [{ value: 'PRODUCAO', label: labelPipelinePlanoCorte('EM_PRODUCAO') }]
const TIPOS_TAREFA = [{ value: 'LIVRE', label: 'Tarefa livre' }]

const opcoesTipoAgendamento = computed(() => {
  if (editingEvent.value) {
    const origemEvento = String(editingEvent.value?.origem_fluxo || '').toUpperCase()
    if (origemEvento === 'LOJA_VENDA') return TIPOS_LOJA_VENDA
    if (origemEvento === 'POS_VENDA') return TIPOS_POS_VENDA
    if (origemEvento === 'PLANO_CORTE' || origemEvento === 'VENDA_PLANO_CORTE') return TIPOS_PLANO_CORTE
    return TIPOS_TAREFA
  }
  const origem = String(taskForm.origemFluxo || '').toUpperCase()
  if (origem === 'LOJA_VENDA') return TIPOS_LOJA_VENDA
  if (origem === 'POS_VENDA') return TIPOS_POS_VENDA
  if (origem === 'PLANO_CORTE' || origem === 'VENDA_PLANO_CORTE') return TIPOS_PLANO_CORTE
  return TIPOS_TAREFA
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
const selectedEventsParaLista = computed(() =>
  selectedEvents.value.filter((ev) => {
    if (!editingEvent.value) return true
    return String(ev.id) !== String(editingEvent.value.id)
  }),
)

const selectedLabel = computed(() =>
  selectedDay.value.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
)

const canVendas = computed(() => can('agendamentos.vendas'))
const canProducao = computed(() => can('agendamentos.producao'))
const visaoAgenda = computed(() => {
  if (canVendas.value && !canProducao.value) return 'loja'
  if (canProducao.value && !canVendas.value) return 'producao'
  return 'geral'
})

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
  taskForm.setorDestino = ''
  taskForm.origemFluxo = ''
  taskForm.apontamentos = []
  vendaSelecionadaId.value = ''
  vendaSelecionadaParaAgendamento.value = null
  funcionarioSelecionado.value = ''
  const inicio = toDateTimeLocal(selectedDay.value)
  taskForm.inicio = inicio
  taskForm.fim = toDateTimeLocal(addHours(selectedDay.value, 1))

  // Garante listas atualizadas ao abrir modal de criação
  loadClientes()
  loadVendasAguardandoAgendamento()
  loadFuncionarios()
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
  taskForm.setorDestino = ''
  taskForm.origemFluxo = ''
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
  taskForm.vendaId = event?.venda_id ? String(event.venda_id) : ''
  taskForm.clienteId = event?.cliente_id
    ? String(event.cliente_id)
    : event?.cliente?.id
      ? String(event.cliente.id)
      : event?.venda?.cliente_id
        ? String(event.venda.cliente_id)
      : ''
  const equipeDoEvento = (event?.equipe || []).map((e) => String(e.funcionario_id)).filter(Boolean)
  const equipeApontada = (event?.apontamentos || [])
    .map((a) => String(a.funcionario_id))
    .filter(Boolean)
  taskForm.funcionarioIds = Array.from(new Set([...equipeDoEvento, ...equipeApontada]))
  const cat = event?.categoria || 'LIVRE'
  // Garante categoria válida para o pipeline do evento (venda vs plano de corte)
  const origemEvento = String(event?.origem_fluxo || '').toUpperCase()
  if (origemEvento === 'PLANO_CORTE' || origemEvento === 'VENDA_PLANO_CORTE') {
    taskForm.categoria = ['PRODUCAO'].includes(cat) ? cat : 'PRODUCAO'
  } else if (origemEvento === 'LOJA_VENDA') {
    const vendaKeys = TIPOS_LOJA_VENDA.map((o) => o.value)
    taskForm.categoria = vendaKeys.includes(cat) ? cat : 'MEDIDA_FINA'
  } else if (origemEvento === 'POS_VENDA') {
    const posKeys = TIPOS_POS_VENDA.map((o) => o.value)
    taskForm.categoria = posKeys.includes(cat) ? cat : (posKeys[0] || 'GARANTIA')
  } else {
    taskForm.categoria = 'LIVRE'
  }
  taskForm.setorDestino = String(event?.setor_destino || '').toUpperCase() || 'LOJA'
  taskForm.origemFluxo = String(event?.origem_fluxo || '').toUpperCase() || 'TAREFA'
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
    notify.error('Nao foi possivel cancelar a tarefa.')
  }
}

async function enviarParaProducao(event) {
  try {
    await AgendaService.enviarParaProducao(event.id)
    notify.success('Agendamento enviado para producao.')
    await loadAgenda()
  } catch (e) {
    notify.error('Nao foi possivel enviar para producao.')
  }
}

async function saveTask() {
  if (!editingEvent.value) {
    if (!taskForm.setorDestino) return notify.error('Selecione o setor.')
    if (!taskForm.origemFluxo) return notify.error('Selecione a origem.')
  }
  if (!taskForm.inicio) return notify.error('Informe a data de inicio.')
  if (!taskForm.fim) return notify.error('Informe a data de termino.')
  const origemSelecionada = editingEvent.value
    ? String(editingEvent.value?.origem_fluxo || '').toUpperCase()
    : String(taskForm.origemFluxo || '').toUpperCase()
  const clienteObrigatorio = origemSelecionada !== 'TAREFA'
  if (clienteObrigatorio && !taskForm.clienteId) {
    return notify.error('Selecione o cliente.')
  }
  if (origemSelecionada === 'LOJA_VENDA' && !taskForm.vendaId) {
    return notify.error('Selecione a venda vinculada.')
  }

  const equipeIds = isAdmin.value
    ? taskForm.funcionarioIds.map((id) => Number(id)).filter(Boolean)
    : [Number(usuarioLogado.value?.funcionario_id)]

  if (!equipeIds.length) return notify.error('Informe pelo menos um funcionario.')

  const equipeParaValidar = isAdmin.value
    ? taskForm.funcionarioIds
    : [String(usuarioLogado.value?.funcionario_id || '')]
  const equipeParaValidarLimpa = equipeParaValidar.filter(Boolean)

  // Cada funcionário da equipe deve ter pelo menos um horário (início e término) preenchido
  for (const fid of equipeParaValidarLimpa) {
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
          origem_fluxo: editingEvent.value?.origem_fluxo || undefined,
          setor_destino: editingEvent.value?.setor_destino || undefined,
        }
      : taskForm.vendaId
        ? { venda_id: Number(taskForm.vendaId) }
        : {}

    const origemFluxo = editingEvent.value
      ? editingEvent.value?.origem_fluxo || undefined
      : taskForm.origemFluxo || undefined
    const setorDestino = editingEvent.value
      ? editingEvent.value?.setor_destino || undefined
      : taskForm.setorDestino || undefined

    const payload = {
      titulo,
      inicio_em: inicio.toISOString(),
      fim_em: fim.toISOString(),
      cliente_id: taskForm.clienteId ? Number(taskForm.clienteId) : undefined,
      equipe_ids: equipeIds,
      categoria: taskForm.categoria || 'LIVRE',
      origem_fluxo: origemFluxo,
      setor_destino: setorDestino,
      apontamentos: apontamentosPayload,
      ...origemPayload,
    }

    if (editingEvent.value) {
      await AgendaService.atualizar(editingEvent.value.id, payload)
    } else {
      await AgendaService.criar(payload)
    }

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
    const res = await AgendaService.listarTodos(inicio, fim, {
      incluir_cancelados: false,
      visao: visaoAgenda.value === 'geral' ? undefined : visaoAgenda.value,
    })
    let data = Array.isArray(res?.data) ? res.data : []
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
    let lista = []
    try {
      const res = await ClienteService.select()
      lista = Array.isArray(res?.data) ? res.data : []
    } catch {
      const resLista = await ClienteService.listar()
      lista = Array.isArray(resLista?.data) ? resLista.data : []
    }
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

