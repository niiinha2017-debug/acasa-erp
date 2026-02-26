<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>

      <PageHeader
        title="Agenda de Venda"
        subtitle="Visão mensal da agenda comercial (loja)"
        icon="pi pi-calendar-clock"
      >
        <template #actions>
          <div class="flex items-center gap-2">
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
              class="bg-white p-3.5 h-44 flex flex-col items-start text-left border border-transparent hover:border-brand-primary/30 transition-all relative cursor-pointer"
              :class="{
                'bg-slate-50': !day.inMonth,
                'ring-2 ring-brand-primary/30': isSameDay(day.date, selectedDay),
              }"
              @click="selectDay(day.date)"
            >
              <div class="w-full flex items-center justify-between mb-1">
                <span
                  class="text-xs font-black cursor-pointer"
                  :class="day.inMonth ? (day.feriado ? 'text-rose-500' : 'text-slate-800') : 'text-slate-300'"
                >
                  {{ day.date.getDate() }}
                </span>
                <button
                  v-if="day.inMonth"
                  type="button"
                  class="w-6 h-6 flex items-center justify-center rounded-md bg-brand-primary/15 text-brand-primary hover:bg-brand-primary hover:text-white text-sm font-black transition-colors flex-shrink-0"
                  title="Novo agendamento neste dia"
                  @click.stop="selectDayAndOpenModal(day.date)"
                >
                  +
                </button>
              </div>
              <div v-if="day.feriado" class="w-full text-[8px] font-bold text-rose-500 uppercase tracking-wider truncate mb-1.5">
                {{ day.feriado }}
              </div>
              <div class="w-full space-y-1.5 flex-1 min-h-0 overflow-hidden flex flex-col">
                <button
                  v-for="event in dayEvents(day.date).slice(0, 3)"
                  :key="event.id"
                  type="button"
                  :class="['w-full text-left px-2.5 py-2 rounded-lg text-[10px] text-white hover:ring-2 hover:ring-brand-primary transition-colors', corCardCalendarioPorCategoria(event.categoria)]"
                  :title="eventTitle(event)"
                  @click.stop="openModalForEvent(event)"
                >
                  <div class="font-bold truncate leading-snug">
                    {{ event?.cliente?.nome_completo || event?.cliente?.razao_social || 'Cliente' }}
                  </div>
                  <div class="text-[9px] font-medium text-slate-300 truncate leading-snug mt-0.5">
                    {{ timeLabel(event.inicio_em) }} · {{ event.titulo }}
                  </div>
                </button>
                <div
                  v-if="dayEvents(day.date).length > 3"
                  class="text-[9px] font-bold text-slate-400 pt-0.5"
                >
                  +{{ dayEvents(day.date).length - 3 }}
                </div>
              </div>
            </div>
          </div>

            <div class="border-t border-border-ui p-5 md:p-6 bg-slate-50/50 dark:bg-slate-900/20">
            <div class="flex items-center justify-between mb-4">
              <div class="text-sm font-bold text-text-main uppercase tracking-wider">
                {{ selectedLabel }}
              </div>
              <div v-if="loading" class="text-xs font-medium text-text-muted">
                Carregando...
              </div>
            </div>

            <div v-if="selectedEvents.length" class="space-y-3">
              <div class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                Tarefas do dia
              </div>
              <div
                v-for="event in selectedEvents"
                :key="event.id"
                class="w-full text-left p-4 rounded-xl border border-border-ui bg-bg-card hover:border-brand-primary/40 hover:shadow-md transition-all border-l-4"
                :class="corBordaCardPorCategoria(event.categoria)"
              >
                <div class="text-sm font-bold text-text-main leading-snug">
                  {{ eventTitle(event) }}
                </div>
                <div class="text-xs font-medium text-text-muted mt-1">
                  {{ timeLabel(event.inicio_em) }} – {{ timeLabel(event.fim_em) }}
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <span v-if="!isAgendaLoja" class="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-brand-primary/10 text-brand-primary border border-brand-primary/30">
                    {{ etapaLabelPorCategoria(event.categoria) }}
                  </span>
                  <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase" :class="statusExecucaoClass(event)">
                    {{ statusExecucaoLabel(event) }}
                  </span>
                </div>
                <div
                  v-if="event.plano_corte_id"
                  class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase"
                  :class="planoBadgeClass(planoStatusForEvent(event))"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="planoDotClass(planoStatusForEvent(event))"
                  ></span>
                  {{ planoBadgeLabel(planoStatusForEvent(event)) }}
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    v-if="normalizarStatusExecucao(event?.status) !== 'CONCLUIDO'"
                    size="sm"
                    variant="primary"
                    @click.stop="atualizarStatusExecucao(event, 'EM_ANDAMENTO')"
                  >
                    Iniciar
                  </Button>
                  <Button
                    v-if="normalizarStatusExecucao(event?.status) === 'EM_ANDAMENTO'"
                    size="sm"
                    variant="secondary"
                    @click.stop="atualizarStatusExecucao(event, 'PAUSADO')"
                  >
                    Pausar
                  </Button>
                  <Button
                    v-if="normalizarStatusExecucao(event?.status) !== 'CONCLUIDO'"
                    size="sm"
                    variant="success"
                    @click.stop="atualizarStatusExecucao(event, 'CONCLUIDO')"
                  >
                    {{ botaoConcluirLabel(event) }}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    @click.stop="openModalForEvent(event)"
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    @click.stop="removeTask(event)"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
            <div v-else class="text-sm font-medium text-text-muted py-4 text-center">
              Nenhum agendamento para este dia.
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal de agendamento: Teleport no body para ficar por cima do menu (z-[9990]) -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="modalOpen"
          class="fixed inset-0 z-[9995] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 dark:bg-black/50 backdrop-blur-sm"
          @click.self="closeModal"
        >
        <div class="w-full max-w-[760px] max-h-[90vh] flex flex-col rounded-2xl border border-border-ui bg-bg-card shadow-xl overflow-hidden">
          <div class="h-1 flex-shrink-0 bg-brand-primary" />
          <header class="flex items-center justify-between flex-shrink-0 px-5 py-4 border-b border-border-ui bg-bg-card">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-calendar-plus text-brand-primary text-lg"></i>
              </div>
              <div class="min-w-0">
                <h2 class="text-lg font-semibold text-text-main truncate">
                  {{ funcionarioNome || 'Agendar tarefa' }}
                </h2>
                <p class="text-xs font-medium text-text-muted truncate">
                  {{ selectedLabel }}
                </p>
              </div>
            </div>
            <button
              type="button"
              @click="closeModal"
              class="w-9 h-9 flex items-center justify-center rounded-lg border border-border-ui text-text-muted hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-800 transition-colors flex-shrink-0"
              aria-label="Fechar"
            >
              <i class="pi pi-times text-sm"></i>
            </button>
          </header>

          <div class="overflow-y-auto flex-1 p-5 md:p-6">
        <div class="flex items-center gap-2 text-[11px] font-semibold text-text-muted mb-4">
          <span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/50 border border-border-ui">
            Agenda de Venda
          </span>
          <span v-if="editingEvent" class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/50 border border-border-ui">
            Edição
          </span>
        </div>

        <section
          v-if="!isAgendaLoja && opcoesOrigemModal.length > 1"
          class="mb-4 p-3 rounded-xl border border-border-ui bg-slate-50 dark:bg-slate-800/30"
        >
          <label class="block text-[11px] font-bold text-text-soft mb-2">Origem</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="origem in opcoesOrigemModal"
              :key="origem.value"
              type="button"
              class="h-9 px-3 rounded-lg text-[11px] font-bold border transition-colors"
              :class="taskForm.origemFluxo === origem.value ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-card text-text-main border-border-ui hover:bg-slate-50 dark:hover:bg-slate-700/50'"
              @click="taskForm.origemFluxo = origem.value"
            >
              {{ origem.label }}
            </button>
          </div>
        </section>

        <div class="space-y-4">
          <section class="p-4 rounded-xl border border-border-ui bg-slate-50/80 dark:bg-slate-800/30 space-y-3">
            <div class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">1. Dados principais</div>
            
            <div v-if="isAgendaLoja" class="mb-3">
              <label class="block text-xs font-bold mb-1 text-text-main">Tipo de tarefa</label>
              <select
                v-model="taskForm.categoria"
                class="w-full h-10 bg-bg-card border border-border-ui rounded-xl px-3 text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
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
            <div v-else class="mb-3">
              <label class="block text-xs font-bold mb-1 text-text-main">Etapa</label>
              <div v-if="editingEvent" class="flex items-center gap-2">
                <span class="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-brand-primary/10 text-brand-primary border border-brand-primary/30">
                  {{ etapaAtualLabel }}
                </span>
                <span class="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase" :class="statusExecucaoClass({ status: editingEvent?.status, fim_em: taskForm.fim })">
                  {{ statusExecucaoLabel(editingEvent) }}
                </span>
              </div>
              <div v-else class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-brand-primary/10 text-brand-primary border border-brand-primary/30">
                    {{ etapaAtualLabel }}
                  </span>
                  <span class="text-[10px] text-text-muted">(primeira etapa automática)</span>
                </div>
                <div class="mt-2">
                  <label class="block text-[10px] font-bold text-text-muted mb-1">Ou criar pós-venda:</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="etapa in ETAPAS_POS_VENDA"
                      :key="etapa.value"
                      type="button"
                      class="h-8 px-3 rounded-lg text-[10px] font-bold uppercase border transition-colors"
                      :class="
                        taskForm.categoria === etapa.value
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : 'bg-bg-card text-text-main border-border-ui hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      "
                      @click="selecionarEtapaPosVenda(etapa.value)"
                    >
                      {{ etapa.label }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4">
              <label class="block text-xs font-bold mb-1 text-text-main">Cliente</label>
              <div
                v-if="isEventoVinculado && clienteNomeEventoAtual"
                class="rounded-xl border border-brand-primary/30 bg-brand-primary/5 px-3 py-2"
              >
                <div class="text-[10px] font-bold uppercase tracking-wider text-brand-primary mb-1">
                  Cliente vinculado ao evento
                </div>
                <div class="text-xs font-semibold text-text-main">
                  {{ clienteNomeEventoAtual }}
                </div>
                <div class="text-[10px] font-medium text-text-muted">
                  {{ origemEventoLabel }}
                </div>
              </div>
              <SearchInput
                v-else
                v-model="taskForm.clienteId"
                mode="select"
                label=""
                placeholder="Selecione o cliente..."
                :options="clientesOptions"
              />
            </div>

            <!-- APRESENTACAO: vincula ao orçamento -->
            <div
              v-if="!editingEvent && canVendas && taskForm.categoria === 'APRESENTACAO'"
              class="mt-3"
            >
              <SearchInput
                v-model="orcamentoSelecionadoId"
                mode="select"
                label="Orçamento vinculado (opcional)"
                placeholder="Selecione o orçamento..."
                :options="orcamentosApresentacaoOptions"
                @update:modelValue="onSelecionarOrcamentoParaApresentacao"
              />
              <p v-if="!temOrcamentosApresentacao" class="text-[10px] font-semibold text-slate-500 mt-1">
                Nenhum orçamento aguardando apresentação no momento.
              </p>
            </div>

            <!-- CONTRATO: vincula à venda fechada/contrato -->
            <div
              v-if="!editingEvent && canVendas && taskForm.categoria === 'CONTRATO'"
              class="mt-3"
            >
              <SearchInput
                v-model="vendasContratoId"
                mode="select"
                label="Venda vinculada (opcional)"
                placeholder="Selecione a venda..."
                :options="vendasContratoOptions"
                @update:modelValue="onSelecionarVendaContratoParaAgendamento"
              />
              <p v-if="!temVendasContrato" class="text-[10px] font-semibold text-slate-500 mt-1">
                Nenhuma venda com contrato pendente no momento.
              </p>
            </div>
          </section>

          <section class="p-4 rounded-xl border border-border-ui bg-slate-50/80 dark:bg-slate-800/30 space-y-3">
            <div class="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              2. Período da tarefa
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-bold mb-1 text-text-soft">Início</label>
                <input
                  type="datetime-local"
                  v-model="taskForm.inicio"
                  class="w-full h-10 bg-bg-card border border-border-ui rounded-xl px-3 text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold mb-1 text-text-soft">Término</label>
                <input
                  type="datetime-local"
                  v-model="taskForm.fim"
                  class="w-full h-10 bg-bg-card border border-border-ui rounded-xl px-3 text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>
          </section>

          <section
            v-if="!isAgendaLoja"
            class="p-4 rounded-xl border border-border-ui bg-slate-50/80 dark:bg-slate-800/30 space-y-3"
          >
            <div class="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              3. Equipe e horário de cada um
            </div>

            <div v-if="isAdmin" class="space-y-2">
              <div v-if="taskForm.funcionarioIds.length" class="flex flex-wrap gap-2 mt-1">
                <span
                  v-for="fid in taskForm.funcionarioIds"
                  :key="fid"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-600 text-text-main"
                >
                  {{ funcionarioNomeById(fid) || 'Funcionário' }}
                  <button
                    v-if="String(fid) !== String(responsavelLojaId || '')"
                    type="button"
                    class="text-slate-500 hover:text-rose-500"
                    @click="removerFuncionario(fid)"
                    aria-label="Remover"
                  >
                    <i class="pi pi-times text-[10px]"></i>
                  </button>
                </span>
              </div>

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
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  class="shrink-0"
                  @click="adicionarFuncionario"
                >
                  Adicionar
                </Button>
              </div>
            </div>
            <div v-else>
              <label class="block text-xs font-bold mb-1 text-text-main">Funcionário</label>
              <div class="w-full h-10 bg-bg-card border border-border-ui rounded-xl px-3 flex items-center text-sm font-semibold text-text-main">
                {{ funcionarioNome || 'Não informado' }}
              </div>
            </div>

            <div v-if="taskForm.funcionarioIds.length && !isAgendaLoja" class="mt-4 space-y-3">
              <div
                v-for="fid in taskForm.funcionarioIds"
                :key="`apont-${fid}`"
                class="rounded-xl border border-border-ui p-3 bg-bg-card"
              >
                <div class="text-xs font-bold text-text-main mb-2">
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
                      class="w-full h-9 bg-slate-50 dark:bg-slate-800/50 border border-border-ui rounded-lg px-2 text-[11px] font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  </div>
                  <div class="flex-1 min-w-[140px]">
                    <label class="block text-[10px] font-bold mb-1">Saída</label>
                    <input
                      type="datetime-local"
                      v-model="periodo.fim"
                      class="w-full h-9 bg-slate-50 dark:bg-slate-800/50 border border-border-ui rounded-lg px-2 text-[11px] font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  </div>
                  <div class="flex gap-1 shrink-0">
                    <Button
                      v-if="getApontamentosPorFuncionario(fid).length > 1"
                      type="button"
                      variant="danger"
                      size="sm"
                      class="!h-9 !w-9 !p-0 !min-w-0"
                      :title="'Remover este horário'"
                      @click="removerPeriodo(fid, idx)"
                    >
                      −
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      class="!h-9 !w-9 !p-0 !min-w-0"
                      :title="getApontamentosPorFuncionario(fid).length > 0 ? 'Outro horário (ex.: turno dividido)' : 'Definir horário'"
                      @click="adicionarPeriodo(fid)"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="mt-4 pt-3 border-t border-border-ui flex items-center gap-2">
          <Button
            variant="primary"
            class="flex-1"
            @click="saveTask"
          >
            {{ editingEvent ? 'Salvar edição' : 'Salvar tarefa' }}
          </Button>
          <Button
            v-if="editingEvent"
            variant="danger"
            @click="removeTask(editingEvent)"
          >
            Excluir
          </Button>
          <Button
            v-if="editingEvent"
            variant="secondary"
            @click="clearEdit"
          >
            Cancelar
          </Button>
        </div>

      </div>
      </div>
      </div>
    </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { AgendaLojaService, ClienteService, FuncionarioService, OrcamentosService, PlanoCorteService, VendaService } from '@/services/index'
import { PIPELINE_CLIENTE, PIPELINE_PLANO_CORTE } from '@/constantes'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import storage from '@/utils/storage'

definePage({ meta: { perm: 'agendamentos.vendas' } })

const today = new Date()
const currentMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDay = ref(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
const loading = ref(false)
const events = ref([])
const modalOpen = ref(false)
const editingEvent = ref(null)
const planosProducao = ref([])
const pipelineProducao = ref([])
const clientesOptions = ref([])
const funcionariosOptions = ref([])
const usuarioLogado = computed(() => storage.getUser())
const funcionarioNome = computed(() => usuarioLogado.value?.nome || '')
const isAdmin = computed(() => can('ADMIN'))
const responsavelLojaId = computed(() => Number(usuarioLogado.value?.funcionario_id || 0))
const responsavelLojaNome = computed(() => funcionarioNome.value || 'Vendedor logado')

const funcionarioSelecionado = ref('')
const taskForm = reactive({
  titulo: '',
  inicio: '',
  fim: '',
  clienteId: '',
  vendaId: '',
  orcamentoId: '',
  funcionarioIds: [],
  categoria: 'MEDIDA',
  setorDestino: '',
  origemFluxo: '',
  apontamentos: [],
})

const ORIGENS_POR_SETOR = {
  LOJA: [
    { value: 'LOJA_VENDA', label: 'Venda loja' },
  ],
  FABRICA: [
    { value: 'PLANO_CORTE', label: 'Plano corte' },
    { value: 'VENDA_PLANO_CORTE', label: 'Venda plano corte' },
  ],
}

function normalizarSetorAgenda(valor) {
  const key = String(valor || '').toUpperCase()
  if (key === 'PRODUCAO' || key === 'FABRICA') return 'FABRICA'
  return 'LOJA'
}

// Vendas aguardando agendamento (medida) — para pré-preencher o modal
const vendasAguardandoAgendamento = ref([])
// Orçamentos aguardando apresentação
const orcamentosApresentacao = ref([])
// Vendas aguardando contrato/assinatura
const vendasAguardandoContrato = ref([])

const vendaSelecionadaParaAgendamento = ref(null)
const vendaSelecionadaId = ref('')

const orcamentoSelecionadoId = ref('')
const orcamentoSelecionadoParaAgendamento = ref(null)

const vendasContratoId = ref('')
const vendaContratoSelecionada = ref(null)

const vendasAguardandoOptions = computed(() => {
  const lista = vendasAguardandoAgendamento.value || []
  return lista.map((v) => {
    const clienteNome = v?.cliente?.nome_completo || v?.cliente?.razao_social || 'Cliente'
    const statusKey = v?.status || ''
    const etapaLabel = PIPELINE_CLIENTE.find((p) => p.key === statusKey)?.label || statusKey || 'Agendar'
    return {
      value: String(v.id),
      label: `Venda #${v.id} – ${clienteNome} – ${etapaLabel}`,
      venda: v,
    }
  })
})
const temVendasAguardando = computed(() => vendasAguardandoOptions.value.length > 0)

const orcamentosApresentacaoOptions = computed(() => {
  const clienteSelecionadoId = String(taskForm.clienteId || '')
  const lista = (orcamentosApresentacao.value || []).filter((o) => {
    if (!clienteSelecionadoId) return true
    return String(o?.cliente_id || '') === clienteSelecionadoId
  })
  return lista.map((o) => {
    const clienteNome = o?.cliente?.nome_completo || o?.cliente?.razao_social || 'Cliente'
    return {
      value: String(o.id),
      label: `Orçamento #${o.id} – ${clienteNome}`,
      orcamento: o,
    }
  })
})
const temOrcamentosApresentacao = computed(() => orcamentosApresentacaoOptions.value.length > 0)

const vendasContratoOptions = computed(() => {
  const clienteSelecionadoId = String(taskForm.clienteId || '')
  const lista = (vendasAguardandoContrato.value || []).filter((v) => {
    if (!clienteSelecionadoId) return true
    return String(v?.cliente_id || v?.cliente?.id || '') === clienteSelecionadoId
  })
  return lista.map((v) => {
    const clienteNome = v?.cliente?.nome_completo || v?.cliente?.razao_social || 'Cliente'
    const statusKey = v?.status || ''
    const etapaLabel = PIPELINE_CLIENTE.find((p) => p.key === statusKey)?.label || statusKey || 'Agendar'
    return {
      value: String(v.id),
      label: `Venda #${v.id} – ${clienteNome} – ${etapaLabel}`,
      venda: v,
    }
  })
})
const temVendasContrato = computed(() => vendasContratoOptions.value.length > 0)

const CATEGORIA_TO_STATUS_CLIENTE = {
  MEDIDA: 'MEDIDA_AGENDADA',
  AGENDAR_MEDIDA: 'MEDIDA_AGENDADA',
  APRESENTACAO: 'APRESENTACAO_AGENDADA',
  AGENDAR_APRESENTACAO: 'APRESENTACAO_AGENDADA',
  ORCAMENTO: 'ORCAMENTO_EM_ANDAMENTO',
  CRIAR_ORCAMENTO: 'ORCAMENTO_EM_ANDAMENTO',
  CONTRATO: 'CONTRATO_ASSINADO',
  CONTRATO_GERADO: 'CONTRATO_ASSINADO',
  GARANTIA: 'GARANTIA',
  MANUTENCAO: 'MANUTENCAO',
  ASSISTENCIA: 'ASSISTENCIA',
}

function normalizarCategoriaAgenda(categoria) {
  const key = String(categoria || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')

  const alias = {
    AGENDAR_MEDIDA: 'MEDIDA',
    MEDIDA_AGENDADA: 'MEDIDA',
    CRIAR_ORCAMENTO: 'ORCAMENTO',
    ORCAMENTO_EM_ANDAMENTO: 'ORCAMENTO',
    AGENDAR_APRESENTACAO: 'APRESENTACAO',
    APRESENTACAO_AGENDADA: 'APRESENTACAO',
    CONTRATO_GERADO: 'CONTRATO',
    CONTRATO_ASSINADO: 'CONTRATO',
  }
  return alias[key] || key
}

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
    return `Pipeline plano de corte: ${labelPipelinePlanoCorte('EM_ANDAMENTO')}`
  }
  if (origem === 'LOJA_VENDA') {
    if (vendaSelecionadaParaAgendamento.value) return statusLabelVenda.value || 'Pipeline cliente'
    const statusKey = CATEGORIA_TO_STATUS_CLIENTE[normalizarCategoriaAgenda(taskForm.categoria)]
    return statusKey
      ? `Pipeline cliente: ${labelPipelineCliente(statusKey)}`
      : 'Pipeline cliente'
  }
  return 'Pipeline cliente'
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
  taskForm.origemFluxo = 'LOJA_VENDA'
  const statusVenda = String(v?.status || '').toUpperCase()
  if (
    ['AGENDAR_APRESENTACAO', 'APRESENTACAO_AGENDADA', 'ORCAMENTO_APRESENTADO', 'ORCAMENTO_APROVADO'].includes(statusVenda)
  ) {
    taskForm.categoria = 'APRESENTACAO'
  } else if (['VENDA_FECHADA', 'CONTRATO_ASSINADO'].includes(statusVenda)) {
    taskForm.categoria = 'CONTRATO'
  } else {
    taskForm.categoria = 'MEDIDA'
  }
  const clienteNome = v?.cliente?.nome_completo || v?.cliente?.razao_social || 'Cliente'
  const pipelineItem = PIPELINE_CLIENTE.find((p) => p.key === (v?.status || ''))
  const etapaLabel = pipelineItem?.label || v?.status || 'Etapa'
  taskForm.titulo = `${etapaLabel} – ${clienteNome}`
}

function onSelecionarOrcamentoParaApresentacao(value) {
  const id = value ?? orcamentoSelecionadoId.value
  if (!id) return
  const opt = orcamentosApresentacaoOptions.value.find((o) => String(o.value) === String(id))
  const o = opt?.orcamento
  if (!o) return
  orcamentoSelecionadoParaAgendamento.value = o
  taskForm.orcamentoId = String(o.id)
  taskForm.clienteId = String(o.cliente_id)
  taskForm.vendaId = o.venda?.id ? String(o.venda.id) : ''
  if (!taskForm.setorDestino) taskForm.setorDestino = 'LOJA'
  taskForm.origemFluxo = 'LOJA_VENDA'
  taskForm.categoria = 'APRESENTACAO'
}

function onSelecionarVendaContratoParaAgendamento(value) {
  const id = value ?? vendasContratoId.value
  if (!id) return
  const opt = vendasContratoOptions.value.find((o) => String(o.value) === String(id))
  const v = opt?.venda
  if (!v) return
  vendaContratoSelecionada.value = v
  taskForm.vendaId = String(v.id)
  taskForm.clienteId = String(v.cliente_id)
  taskForm.orcamentoId = ''
  if (!taskForm.setorDestino) taskForm.setorDestino = 'LOJA'
  taskForm.origemFluxo = 'LOJA_VENDA'
  taskForm.categoria = 'CONTRATO'
}

function limparVendaSelecionada() {
  vendaSelecionadaId.value = ''
  vendaSelecionadaParaAgendamento.value = null
  orcamentoSelecionadoId.value = ''
  orcamentoSelecionadoParaAgendamento.value = null
  vendasContratoId.value = ''
  vendaContratoSelecionada.value = null
  taskForm.vendaId = ''
  taskForm.orcamentoId = ''
  taskForm.clienteId = ''
  taskForm.categoria = isAgendaLoja.value ? 'MEDIDA' : PRIMEIRA_ETAPA_PRODUCAO.value
  taskForm.titulo = ''
}

function limparVinculoVenda() {
  vendaSelecionadaId.value = ''
  vendaSelecionadaParaAgendamento.value = null
  orcamentoSelecionadoId.value = ''
  orcamentoSelecionadoParaAgendamento.value = null
  vendasContratoId.value = ''
  vendaContratoSelecionada.value = null
  taskForm.vendaId = ''
  taskForm.orcamentoId = ''
}

function selecionarEtapaPosVenda(categoria) {
  taskForm.categoria = categoria
  limparVinculoVenda()
}

watch(
  () => taskForm.origemFluxo,
  (origem) => {
    if (editingEvent.value) return
    const key = String(origem || '').toUpperCase()
    if (!['LOJA_VENDA'].includes(key)) {
      limparVendaSelecionada()
    }
    if (key === 'LOJA_VENDA') taskForm.categoria = 'MEDIDA'
    else if (key === 'PLANO_CORTE' || key === 'VENDA_PLANO_CORTE') taskForm.categoria = PRIMEIRA_ETAPA_PRODUCAO.value
    else taskForm.categoria = 'MEDIDA'
  },
)

watch(
  () => taskForm.categoria,
  (categoria) => {
    if (!CATEGORIAS_QUE_EXIGEM_VENDA.includes(String(categoria || '').toUpperCase())) {
      limparVinculoVenda()
    }
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
  return !!origem
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
  }
  return map[origem] || 'Origem: agenda'
})

// Opções por origem (fonte da verdade: pipelines compartilhados)
const TIPOS_LOJA_VENDA = computed(() => [
  { value: 'MEDIDA', label: labelPipelineCliente('AGENDAR_MEDIDA') || 'Agendar visita/medida' },
  { value: 'APRESENTACAO', label: labelPipelineCliente('AGENDAR_APRESENTACAO') || 'Agendar apresentação' },
  { value: 'CONTRATO', label: labelPipelineCliente('VENDA_FECHADA') || 'Aguardando Contrato/Sinal' },
])
const TIPOS_POS_VENDA = [
  { value: 'GARANTIA', label: 'Garantia' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'ASSISTENCIA', label: 'Assistência' },
]
const ETAPAS_POS_VENDA = [
  { value: 'GARANTIA', label: 'Garantia' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'ASSISTENCIA', label: 'Assistência' },
]
const CATEGORIAS_QUE_EXIGEM_VENDA = [
  'APRESENTACAO',
  'CONTRATO',
  'GARANTIA',
  'MANUTENCAO',
  'ASSISTENCIA',
]
const categoriaExigeVenda = computed(() =>
  String(taskForm.origemFluxo || '').toUpperCase() === 'LOJA_VENDA' &&
  CATEGORIAS_QUE_EXIGEM_VENDA.includes(String(taskForm.categoria || '').toUpperCase()),
)
const TIPOS_PRODUCAO = computed(() => {
  const lista = Array.isArray(pipelineProducao.value) ? pipelineProducao.value : []
  return [...lista]
    .sort((a, b) => Number(a?.ordem || 0) - Number(b?.ordem || 0))
    .map((etapa) => ({
      value: String(etapa?.key || ''),
      label: String(etapa?.label || etapa?.key || ''),
    }))
    .filter((item) => item.value)
})
const PRIMEIRA_ETAPA_PRODUCAO = computed(
  () => TIPOS_PRODUCAO.value[0]?.value || 'PRODUCAO_RECEBIDA',
)

const opcoesTipoAgendamento = computed(() => {
  if (isAgendaLoja.value) {
    return TIPOS_LOJA_VENDA.value
  }
  return [...TIPOS_PRODUCAO.value, ...TIPOS_POS_VENDA]
})

const etapaAtualLabel = computed(() => {
  const cat = String(taskForm.categoria || editingEvent.value?.categoria || '').toUpperCase()
  const etapaProd = TIPOS_PRODUCAO.value.find(o => o.value === cat)
  if (etapaProd) return etapaProd.label
  const etapaPos = TIPOS_POS_VENDA.find(o => o.value === cat)
  if (etapaPos) return etapaPos.label
  return TIPOS_PRODUCAO.value[0]?.label || 'Produção recebida'
})

function proximaEtapaProducao(categoriaAtual) {
  const lista = TIPOS_PRODUCAO.value
  const idx = lista.findIndex(o => o.value === String(categoriaAtual || '').toUpperCase())
  if (idx >= 0 && idx < lista.length - 1) return lista[idx + 1].value
  return null
}

function etapaLabelPorCategoria(categoria) {
  const cat = String(categoria || '').toUpperCase()
  const etapa = TIPOS_PRODUCAO.value.find(o => o.value === cat)
  if (etapa) return etapa.label
  const pos = TIPOS_POS_VENDA.find(o => o.value === cat)
  if (pos) return pos.label
  const loja = TIPOS_LOJA_VENDA.value.find(o => o.value === cat)
  if (loja) return loja.label
  return categoria || ''
}

function corCardCalendarioPorCategoria(categoria) {
  const cat = String(categoria || '').toUpperCase()
  const cores = {
    MEDIDA: 'bg-blue-700 hover:bg-blue-600',
    AGENDAR_MEDIDA: 'bg-blue-700 hover:bg-blue-600',
    ORCAMENTO: 'bg-purple-700 hover:bg-purple-600',
    CRIAR_ORCAMENTO: 'bg-purple-700 hover:bg-purple-600',
    APRESENTACAO: 'bg-orange-600 hover:bg-orange-500',
    AGENDAR_APRESENTACAO: 'bg-orange-600 hover:bg-orange-500',
    CONTRATO: 'bg-emerald-700 hover:bg-emerald-600',
    CONTRATO_GERADO: 'bg-emerald-700 hover:bg-emerald-600',
    VENDA_FECHADA: 'bg-emerald-700 hover:bg-emerald-600',
    MEDIDA_FINA: 'bg-cyan-700 hover:bg-cyan-600',
    AGENDAR_MEDIDA_FINA: 'bg-cyan-700 hover:bg-cyan-600',
    GARANTIA: 'bg-amber-600 hover:bg-amber-500',
    MANUTENCAO: 'bg-amber-600 hover:bg-amber-500',
    ASSISTENCIA: 'bg-amber-600 hover:bg-amber-500',
  }
  if (cores[cat]) return cores[cat]
  if (TIPOS_PRODUCAO.value.some(o => o.value === cat)) return 'bg-indigo-700 hover:bg-indigo-600'
  return 'bg-slate-700 hover:bg-slate-600'
}

function corBordaCardPorCategoria(categoria) {
  const cat = String(categoria || '').toUpperCase()
  const bordas = {
    MEDIDA: 'border-l-blue-500',
    AGENDAR_MEDIDA: 'border-l-blue-500',
    ORCAMENTO: 'border-l-purple-500',
    CRIAR_ORCAMENTO: 'border-l-purple-500',
    APRESENTACAO: 'border-l-orange-500',
    AGENDAR_APRESENTACAO: 'border-l-orange-500',
    CONTRATO: 'border-l-emerald-500',
    CONTRATO_GERADO: 'border-l-emerald-500',
    VENDA_FECHADA: 'border-l-emerald-500',
    MEDIDA_FINA: 'border-l-cyan-500',
    AGENDAR_MEDIDA_FINA: 'border-l-cyan-500',
    GARANTIA: 'border-l-amber-500',
    MANUTENCAO: 'border-l-amber-500',
    ASSISTENCIA: 'border-l-amber-500',
  }
  if (bordas[cat]) return bordas[cat]
  if (TIPOS_PRODUCAO.value.some(o => o.value === cat)) return 'border-l-indigo-500'
  return 'border-l-slate-400'
}

function botaoConcluirLabel(event) {
  const cat = String(event?.categoria || '').toUpperCase()
  const ehProducao = TIPOS_PRODUCAO.value.some(o => o.value === cat)
  if (!ehProducao) return 'Concluir'
  const proxima = proximaEtapaProducao(cat)
  if (proxima) return `Concluir → ${etapaLabelPorCategoria(proxima)}`
  return 'Finalizar produção'
}

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

const FERIADOS_NACIONAIS = [
  { mes: 1, dia: 1, nome: 'Confraternização Universal' },
  { mes: 4, dia: 21, nome: 'Tiradentes' },
  { mes: 5, dia: 1, nome: 'Dia do Trabalhador' },
  { mes: 9, dia: 7, nome: 'Independência do Brasil' },
  { mes: 10, dia: 12, nome: 'Nossa Sr.a Aparecida' },
  { mes: 11, dia: 2, nome: 'Finados' },
  { mes: 11, dia: 15, nome: 'Proclamação da República' },
  { mes: 11, dia: 20, nome: 'Dia da Consciência Negra' },
  { mes: 12, dia: 25, nome: 'Natal' },
]

function getFeriado(date) {
  const mes = date.getMonth() + 1
  const dia = date.getDate()
  return FERIADOS_NACIONAIS.find((f) => f.mes === mes && f.dia === dia)
}

const days = computed(() => {
  const start = startOfMonth(currentMonth.value)
  const end = endOfMonth(currentMonth.value)
  const startWeekDay = start.getDay()
  const daysInMonth = end.getDate()
  const totalDays = startWeekDay + daysInMonth + 7
  const result = []

  for (let i = 0; i < totalDays; i += 1) {
    const day = new Date(start)
    day.setDate(start.getDate() - startWeekDay + i)
    const feriado = getFeriado(day)
    result.push({
      key: dateKey(day),
      date: day,
      inMonth: day.getMonth() === currentMonth.value.getMonth(),
      feriado: feriado ? feriado.nome : null,
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
const visaoAgenda = computed(() => 'loja')
const isAgendaLoja = computed(() => true)
const opcoesOrigemModal = computed(() => ORIGENS_POR_SETOR.LOJA)

function isSameDay(a, b) {
  return dateKey(a) === dateKey(b)
}

function selectDay(day) {
  selectedDay.value = new Date(day)
}

function selectDayAndOpenModal(day) {
  selectedDay.value = new Date(day)
  openModal()
}

function eventTitle(event) {
  const nome = event?.cliente?.nome_completo || event?.cliente?.razao_social || 'Cliente'
  return `${event.titulo} - ${nome}`
}

function normalizarStatusExecucao(status) {
  return String(status || '').trim().toUpperCase()
}

function statusExecucaoLabel(event) {
  const status = normalizarStatusExecucao(event?.status)
  if (status === 'CONCLUIDO') return 'Concluido'
  if (status === 'PAUSADO') return 'Pausado'
  if (status === 'EM_ANDAMENTO') return 'Em andamento'
  const fim = new Date(event?.fim_em)
  if (!Number.isNaN(fim.getTime()) && Date.now() > fim.getTime()) return 'Atrasado'
  return 'Pendente'
}

function statusExecucaoClass(event) {
  const status = normalizarStatusExecucao(event?.status)
  if (status === 'CONCLUIDO') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (status === 'PAUSADO') return 'bg-amber-50 text-amber-700 border border-amber-200'
  if (status === 'EM_ANDAMENTO') return 'bg-blue-50 text-blue-700 border border-blue-200'
  const fim = new Date(event?.fim_em)
  if (!Number.isNaN(fim.getTime()) && Date.now() > fim.getTime()) {
    return 'bg-rose-50 text-rose-700 border border-rose-200'
  }
  return 'bg-slate-100 text-slate-700 border border-slate-200'
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

function sincronizarResponsavelLoja() {
  if (!isAgendaLoja.value) return
  if (isAdmin.value && taskForm.funcionarioIds.length > 0) return // Admin já escolheu
  const responsavelId = responsavelLojaId.value
  if (!responsavelId) return
  const fid = String(responsavelId)
  taskForm.funcionarioIds = [fid]
  const existente = taskForm.apontamentos.find((a) => String(a.funcionarioId) === fid)
  const periodos = Array.isArray(existente?.periodos) && existente.periodos.length
    ? existente.periodos
    : [
        {
          inicio: taskForm.inicio || toDateTimeLocal(getCurrentTimeForDate(selectedDay.value)),
          fim: taskForm.fim || toDateTimeLocal(addHours(getCurrentTimeForDate(selectedDay.value), 1)),
        },
      ]
  taskForm.apontamentos = [{ funcionarioId: fid, periodos }]
}

function getCurrentTimeForDate(date) {
  const now = new Date()
  const d = new Date(date)
  d.setHours(now.getHours(), now.getMinutes(), 0, 0)
  return d
}

function openModal() {
  modalOpen.value = true
  editingEvent.value = null
  taskForm.titulo = ''
  taskForm.clienteId = ''
  taskForm.vendaId = ''
  taskForm.funcionarioIds = []
  taskForm.categoria = 'MEDIDA'
  taskForm.setorDestino = 'LOJA'
  taskForm.origemFluxo = 'LOJA_VENDA'
  taskForm.apontamentos = []
  vendaSelecionadaId.value = ''
  vendaSelecionadaParaAgendamento.value = null
  funcionarioSelecionado.value = ''
  
  const dataComHoraAtual = getCurrentTimeForDate(selectedDay.value)
  taskForm.inicio = toDateTimeLocal(dataComHoraAtual)
  taskForm.fim = toDateTimeLocal(addHours(dataComHoraAtual, 1))
  
  sincronizarResponsavelLoja()

  // Garante listas atualizadas ao abrir modal de criação
  loadClientes()
  loadVendasAguardandoAgendamento()
  loadOrcamentosApresentacao()
  loadVendasAguardandoContrato()
  loadFuncionarios()
}

function closeModal() {
  modalOpen.value = false
  editingEvent.value = null
}

function clearEdit() {
  editingEvent.value = null
  taskForm.titulo = ''
  taskForm.vendaId = ''
  taskForm.orcamentoId = ''
  vendaSelecionadaId.value = ''
  vendaSelecionadaParaAgendamento.value = null
  orcamentoSelecionadoId.value = ''
  orcamentoSelecionadoParaAgendamento.value = null
  vendasContratoId.value = ''
  vendaContratoSelecionada.value = null
  const dataComHoraAtual = getCurrentTimeForDate(selectedDay.value)
  taskForm.inicio = toDateTimeLocal(dataComHoraAtual)
  taskForm.fim = toDateTimeLocal(addHours(dataComHoraAtual, 1))
  taskForm.setorDestino = 'LOJA'
  taskForm.origemFluxo = 'LOJA_VENDA'
  taskForm.categoria = 'MEDIDA'
  taskForm.apontamentos = []
  sincronizarResponsavelLoja()
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
  const cat = normalizarCategoriaAgenda(event?.categoria || 'MEDIDA')
  // Garante categoria válida para o pipeline do evento (venda vs plano de corte)
  const origemEvento = String(event?.origem_fluxo || '').toUpperCase()
  if (origemEvento === 'PLANO_CORTE' || origemEvento === 'VENDA_PLANO_CORTE') {
    const categoriasValidas = TIPOS_PRODUCAO.value.map((o) => o.value)
    taskForm.categoria = categoriasValidas.includes(cat) ? cat : PRIMEIRA_ETAPA_PRODUCAO.value
  } else if (origemEvento === 'LOJA_VENDA') {
    const vendaKeys = TIPOS_LOJA_VENDA.value.map((o) => o.value)
    taskForm.categoria = vendaKeys.includes(cat) ? cat : 'MEDIDA'
  } else {
    taskForm.categoria = 'MEDIDA'
  }
  taskForm.setorDestino = normalizarSetorAgenda(event?.setor_destino || 'LOJA')
  taskForm.origemFluxo =
    String(event?.origem_fluxo || '').toUpperCase() ||
    (taskForm.setorDestino === 'LOJA' ? 'LOJA_VENDA' : 'PLANO_CORTE')
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
  if (taskForm.setorDestino === 'LOJA') {
    sincronizarResponsavelLoja()
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
          inicio: taskForm.inicio || toDateTimeLocal(getCurrentTimeForDate(selectedDay.value)),
          fim: taskForm.fim || toDateTimeLocal(addHours(getCurrentTimeForDate(selectedDay.value), 1)),
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
      inicio: taskForm.inicio || toDateTimeLocal(getCurrentTimeForDate(selectedDay.value)),
      fim: taskForm.fim || toDateTimeLocal(addHours(getCurrentTimeForDate(selectedDay.value), 1)),
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
  const titulo = String(eventTitle(event) || '').trim() || 'este agendamento'
  const ok = await confirm.show(
    'Cancelar agendamento',
    `Deseja cancelar ${titulo}?`,
  )
  if (!ok) return

  try {
    await AgendaLojaService.excluir(event.id)
    if (editingEvent.value && String(editingEvent.value.id) === String(event.id)) {
      clearEdit()
    }
    await loadAgenda()
  } catch (e) {
    notify.error('Nao foi possivel cancelar a tarefa.')
  }
}

async function atualizarStatusExecucao(event, status) {
  try {
    const categoriaAtual = String(event?.categoria || '').toUpperCase()
    const ehProducao = TIPOS_PRODUCAO.value.some(o => o.value === categoriaAtual)

    if (status === 'CONCLUIDO' && ehProducao) {
      const proxima = proximaEtapaProducao(categoriaAtual)
      if (proxima) {
        await AgendaLojaService.atualizarStatus(event.id, 'PENDENTE', proxima)
        const label = etapaLabelPorCategoria(proxima)
        notify.success(`Etapa concluída. Avançou para: ${label}`)
      } else {
        await AgendaLojaService.atualizarStatus(event.id, 'CONCLUIDO')
        notify.success('Produção finalizada!')
      }
    } else {
      await AgendaLojaService.atualizarStatus(event.id, status)
      if (status === 'CONCLUIDO') notify.success('Tarefa concluída.')
      else if (status === 'PAUSADO') notify.success('Tarefa pausada.')
      else notify.success('Tarefa iniciada.')
    }
    await loadAgenda()
  } catch (e) {
    notify.error('Não foi possível atualizar o status da tarefa.')
  }
}

async function saveTask() {
  taskForm.setorDestino = 'LOJA'
  taskForm.origemFluxo = 'LOJA_VENDA'
  sincronizarResponsavelLoja()
  if (!editingEvent.value) {
    if (!taskForm.setorDestino) return notify.error('Selecione o setor.')
    if (!taskForm.origemFluxo) return notify.error('Selecione a origem.')
  }
  if (!taskForm.inicio) return notify.error('Informe a data de inicio.')
  if (!taskForm.fim) return notify.error('Informe a data de termino.')
  const origemSelecionada = editingEvent.value
    ? String(editingEvent.value?.origem_fluxo || '').toUpperCase()
    : String(taskForm.origemFluxo || '').toUpperCase()
  const clienteObrigatorio = true
  if (clienteObrigatorio && !taskForm.clienteId) {
    return notify.error('Selecione o cliente.')
  }
  const equipeIds = (
    isAdmin.value && taskForm.funcionarioIds.length
      ? taskForm.funcionarioIds.map(Number)
      : [responsavelLojaId.value]
  ).filter(Boolean)

  if (!equipeIds.length) {
    return notify.error('Seu usuário precisa estar vinculado a um funcionário para agendar na loja.')
  }

  const equipeParaValidar = isAdmin.value && taskForm.funcionarioIds.length
    ? taskForm.funcionarioIds
    : [String(responsavelLojaId.value || '')]
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

  // Sincroniza o período único de cada funcionário com o início/término da tarefa,
  // para evitar enviar horários antigos e gerar falso conflito no backend.
  for (const registro of taskForm.apontamentos || []) {
    if (Array.isArray(registro.periodos) && registro.periodos.length === 1) {
      registro.periodos[0].inicio = taskForm.inicio
      registro.periodos[0].fim = taskForm.fim
    }
  }

  let titulo = taskForm.titulo
  if (!titulo) {
    const catRaw = normalizarCategoriaAgenda(taskForm.categoria)
    const catLabel = etapaLabelPorCategoria(catRaw) || opcoesTipoAgendamento.value.find(o => o.value === catRaw)?.label || 'Tarefa'
    const cliLabel = clienteNomeEventoAtual.value || 'Cliente'
    titulo = `${catLabel} - ${cliLabel}`
  }

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
      : taskForm.orcamentoId
        ? { orcamento_id: Number(taskForm.orcamentoId), venda_id: taskForm.vendaId ? Number(taskForm.vendaId) : undefined }
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
      categoria: normalizarCategoriaAgenda(taskForm.categoria || 'MEDIDA'),
      origem_fluxo: origemFluxo,
      setor_destino: setorDestino,
      apontamentos: apontamentosPayload,
      ...origemPayload,
    }

    if (editingEvent.value) {
      await AgendaLojaService.atualizar(editingEvent.value.id, payload)
    } else {
      await AgendaLojaService.criar(payload)
    }

    await loadAgenda()
    closeModal()
  } catch (e) {
    const msg = e?.response?.data?.message
    notify.error(msg && typeof msg === 'string' ? msg : 'Nao foi possivel salvar a tarefa.')
  }
}

async function loadAgenda() {
  if (!can('agendamentos.ver')) return
  loading.value = true
  try {
    const inicio = dateKey(startOfMonth(currentMonth.value))
    const fim = dateKey(endOfMonth(currentMonth.value))
    const res = await AgendaLojaService.listarTodos(inicio, fim, {
      incluir_cancelados: false,
      visao: visaoAgenda.value,
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

async function loadPipelineProducao() {
  if (!canProducao.value) return
  try {
    const res = await AgendaLojaService.getPipelineProducao()
    pipelineProducao.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    pipelineProducao.value = []
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
    const res = await FuncionarioService.select({ unidade: 'LOJA' })
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

async function loadOrcamentosApresentacao() {
  if (!canVendas.value) return
  try {
    const res = await OrcamentosService.aguardandoApresentacao()
    orcamentosApresentacao.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    orcamentosApresentacao.value = []
  }
}

async function loadVendasAguardandoContrato() {
  if (!canVendas.value) return
  try {
    const res = await VendaService.aguardandoContrato()
    vendasAguardandoContrato.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    vendasAguardandoContrato.value = []
  }
}

onMounted(() => {
  loadAgenda()
  loadPipelineProducao()
  loadPlanosProducao()
  loadClientes()
  loadFuncionarios()
  loadVendasAguardandoAgendamento()
  loadOrcamentosApresentacao()
  loadVendasAguardandoContrato()
})
watch(currentMonth, loadAgenda)
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>

