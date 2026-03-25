<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-cyan-600 rounded-t-2xl" aria-hidden></div>

      <PageHeader
        title="Agenda de Produção"
        subtitle="Visão mensal da agenda da fábrica"
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
        <!-- Notificação: Medidas a serem agendadas (recebidos da venda) -->
        <div
          v-if="pendentesMedidaFina.length > 0 || pendentesMedidaFinaLoading"
          class="rounded-2xl border border-purple-200 bg-purple-50/80 dark:bg-purple-950/30 dark:border-purple-800 overflow-hidden"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-purple-100/80 dark:hover:bg-purple-900/30 transition-colors"
            @click="painelMedidasAbertos = !painelMedidasAbertos"
          >
            <span class="flex items-center gap-2">
              <i class="pi pi-inbox text-purple-600 dark:text-purple-400 text-lg" />
              <span class="font-bold text-purple-800 dark:text-purple-200">
                Medidas a serem agendadas
              </span>
              <span
                v-if="!pendentesMedidaFinaLoading"
                class="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-purple-500 text-white text-xs font-black"
              >
                {{ pendentesMedidaFina.length }}
              </span>
            </span>
            <i
              class="pi text-purple-600 dark:text-purple-400 transition-transform"
              :class="painelMedidasAbertos ? 'pi-angle-up' : 'pi-angle-down'"
            />
          </button>
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-[70vh]"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 max-h-[70vh]"
            leave-to-class="opacity-0 max-h-0"
          >
            <div v-show="painelMedidasAbertos" class="border-t border-purple-200 dark:border-purple-800 overflow-hidden">
              <div v-if="pendentesMedidaFinaLoading" class="px-4 py-6 text-center text-sm text-purple-600 dark:text-purple-400">
                Carregando...
              </div>
              <div
                v-else
                class="max-h-[60vh] overflow-y-auto px-2 py-2"
              >
                <p class="px-2 py-2 text-xs text-purple-700 dark:text-purple-300 mb-2">
                  Clientes que receberam venda e aguardam agendamento da medida fina. Clique em &quot;Agendar&quot; para definir data e horário.
                </p>
                <ul class="space-y-1.5">
                  <li
                    v-for="item in pendentesMedidaFina"
                    :key="item.id"
                    class="flex items-center justify-between gap-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800/50 px-3 py-2.5"
                  >
                    <div class="min-w-0 flex-1">
                      <span class="font-semibold text-sm text-slate-800 dark:text-slate-200 block truncate">
                        {{ item?.cliente?.nome_completo || item?.cliente?.razao_social || 'Cliente' }}
                      </span>
                      <span v-if="item?.venda_id" class="text-xs text-slate-500 dark:text-slate-400">
                        Venda #{{ item.venda_id }}
                      </span>
                      <span v-if="item?.pendencia_financeira" class="text-xs text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                        Pendência financeira – regularize Contas a Receber para agendar.
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      class="flex-shrink-0 rounded-xl font-bold text-xs uppercase"
                      :disabled="!!item?.pendencia_financeira"
                      :title="item?.pendencia_financeira ? 'Há parcela vencida não paga em Contas a Receber. Regularize para liberar o agendamento.' : undefined"
                      @click="openModalForEvent(item); painelMedidasAbertos = false"
                    >
                      Agendar
                    </Button>
                  </li>
                </ul>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Botão / painel: Clientes com montagem concluída (criar pós-venda como tarefa avulsa) -->
        <div
          v-if="montagemConcluidaList.length > 0 || montagemConcluidaLoading"
          class="rounded-2xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-800 overflow-hidden"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-amber-100/80 dark:hover:bg-amber-900/30 transition-colors"
            @click="painelMontagemConcluidaAbertos = !painelMontagemConcluidaAbertos"
          >
            <span class="flex items-center gap-2">
              <i class="pi pi-check-circle text-amber-600 dark:text-amber-400 text-lg" />
              <span class="font-bold text-amber-800 dark:text-amber-200">
                Clientes com montagem concluída
              </span>
              <span
                v-if="!montagemConcluidaLoading"
                class="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-amber-500 text-white text-xs font-black"
              >
                {{ montagemConcluidaList.length }}
              </span>
            </span>
            <i
              class="pi text-amber-600 dark:text-amber-400 transition-transform"
              :class="painelMontagemConcluidaAbertos ? 'pi-angle-up' : 'pi-angle-down'"
            />
          </button>
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-[70vh]"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 max-h-[70vh]"
            leave-to-class="opacity-0 max-h-0"
          >
            <div v-show="painelMontagemConcluidaAbertos" class="border-t border-amber-200 dark:border-amber-800 overflow-hidden">
              <div v-if="montagemConcluidaLoading" class="px-4 py-6 text-center text-sm text-amber-600 dark:text-amber-400">
                Carregando...
              </div>
              <div
                v-else
                class="max-h-[60vh] overflow-y-auto px-2 py-2"
              >
                <p class="px-2 py-2 text-xs text-amber-700 dark:text-amber-300 mb-2">
                  Clientes que já finalizaram a montagem. Selecione um para criar uma nova tarefa de pós-venda (garantia, manutenção ou assistência).
                </p>
                <ul class="space-y-1.5">
                  <li
                    v-for="item in montagemConcluidaList"
                    :key="item.venda_id || item.id"
                    class="flex items-center justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800/50 px-3 py-2.5"
                  >
                    <div class="min-w-0 flex-1">
                      <span class="font-semibold text-sm text-slate-800 dark:text-slate-200 block truncate">
                        {{ item?.cliente?.nome_completo || item?.cliente?.razao_social || 'Cliente' }}
                      </span>
                      <span v-if="item?.venda_id" class="text-xs text-slate-500 dark:text-slate-400">
                        Venda #{{ item.venda_id }}
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      class="flex-shrink-0 rounded-xl font-bold text-xs uppercase"
                      @click="openModalNovaPosVenda(item); painelMontagemConcluidaAbertos = false"
                    >
                      Criar pós-venda
                    </Button>
                  </li>
                </ul>
              </div>
            </div>
          </Transition>
        </div>

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
                  :class="[
                    'w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] hover:ring-2 hover:ring-brand-primary transition-colors',
                    event.plano_corte_id ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700' : 'text-white',
                    eventAtrasado(event) && !event.plano_corte_id ? 'bg-red-600 hover:bg-red-500' : (!event.plano_corte_id ? getCalendarioEventClassProducao(event.categoria, eventConcluido(event)) : ''),
                  ]"
                  :title="eventTooltipCalendar(event)"
                  @click.stop="openModalForEvent(event, day.date)"
                >
                  <div :class="event.plano_corte_id ? 'font-semibold text-[9px] text-amber-800 dark:text-amber-200 leading-tight' : 'font-semibold text-[9px] text-white/90 leading-tight'">
                    {{ periodLabel(event.inicio_em, event.fim_em, event) }}
                  </div>
                  <div class="font-bold truncate leading-snug mt-0.5 flex items-center gap-1">
                    {{ tituloSubtituloEvento(event).titulo }}
                    <span v-if="event.plano_corte_id" class="shrink-0 text-[7px] font-black bg-amber-600 text-white dark:bg-amber-500 dark:text-amber-950 px-1 rounded">[APENAS CORTE]</span>
                  </div>
                  <div :class="event.plano_corte_id ? 'text-[9px] text-amber-700 dark:text-amber-300 truncate leading-snug' : 'text-[9px] text-white/80 truncate leading-snug'">
                    {{ tituloSubtituloEvento(event).subtitulo }}
                  </div>
                  <div :class="event.plano_corte_id ? 'text-[8px] text-amber-600 dark:text-amber-400 truncate leading-snug' : 'text-[8px] text-white/70 truncate leading-snug'">
                    {{ event?.cliente?.nome_completo || event?.cliente?.razao_social || event?.plano_corte?.fornecedor?.nome_fantasia || 'Cliente' }}
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

            <!-- Resumo do dia por etapa (status): foco nas etapas, sem funcionários -->
            <div v-if="resumoDiaPorEtapa.length" class="mb-5 p-4 rounded-xl border border-border-ui bg-white dark:bg-slate-800/50">
              <div class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3">
                Resumo do dia por etapa
              </div>
              <div class="grid gap-2 sm:grid-cols-2">
                <div
                  v-for="item in resumoDiaPorEtapa"
                  :key="item.etapaKey"
                  class="rounded-lg border border-border-ui p-3 bg-slate-50/80 dark:bg-slate-900/30"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-bold text-text-main">{{ item.etapaLabel }}</span>
                    <span class="text-[10px] font-black text-slate-500 dark:text-slate-400">
                      {{ item.tarefas }} {{ item.tarefas === 1 ? 'tarefa' : 'tarefas' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedEvents.length" class="space-y-3">
              <div class="flex items-center justify-between gap-2 mb-2">
                <div class="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Tarefas do dia
                </div>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-brand-primary hover:bg-brand-primary/10 border border-brand-primary/30 transition-colors"
                  @click="listaTarefasExpandida = !listaTarefasExpandida"
                >
                  <i class="pi" :class="listaTarefasExpandida ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"></i>
                  {{ listaTarefasExpandida ? 'Recolher' : 'Expandir' }}
                </button>
              </div>
              <div
                class="overflow-y-auto overflow-x-hidden pr-2 space-y-3 transition-[max-height] duration-300"
                :class="listaTarefasExpandida ? 'max-h-[min(85vh,1200px)]' : 'max-h-[min(55vh,480px)]'"
              >
                <button
                  v-for="event in selectedEvents"
                :key="event.id"
                type="button"
                :class="[
                  'w-full text-left p-4 rounded-xl border border-border-ui hover:border-brand-primary/40 hover:shadow-md transition-all',
                  event.plano_corte_id ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700 border-l-4 border-l-amber-500' : 'bg-bg-card',
                  eventAtrasado(event) && !event.plano_corte_id ? 'border-l-4 border-l-red-500 border-red-300 bg-red-50/60 dark:bg-red-950/30' : (!event.plano_corte_id ? getProcessColorByStatusProducao(event.categoria, event.status).borderLeftClass : ''),
                ]"
                @click="openModalForEvent(event)"
              >
                <div class="text-sm font-bold text-text-main leading-snug flex items-center gap-2 flex-wrap">
                  {{ eventTitle(event) }}
                  <span v-if="event.plano_corte_id" class="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-600 text-white dark:bg-amber-500 dark:text-amber-950">[APENAS CORTE]</span>
                </div>
                <div class="mt-2 text-[10px] font-medium text-text-muted space-y-0.5">
                  <div><span class="font-semibold text-text-main">Criador da tarefa:</span> {{ event.criado_por_usuario?.nome || 'Não informado' }}</div>
                  <div><span class="font-semibold text-text-main">Executores:</span> {{ nomesExecutoresEvento(event) || 'Nenhum funcionário atribuído ainda' }}</div>
                </div>
                <div
                  v-if="event.alterado_por_usuario"
                  class="mt-0.5 text-[10px] font-medium text-text-muted"
                >
                  Editado por: {{ event.alterado_por_usuario.nome }}
                </div>
                <div class="text-xs font-medium text-text-muted mt-0.5">
                  {{ periodLabel(event.inicio_em, event.fim_em, event) }}
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <span v-if="!isAgendaLoja" class="inline-flex flex-col items-start px-2.5 py-1 rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/30">
                    <span class="text-[10px] font-black uppercase">{{ tituloSubtituloEvento(event).titulo }}</span>
                    <span class="text-[9px] font-semibold opacity-90">{{ tituloSubtituloEvento(event).subtitulo }}</span>
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
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <RouterLink
                    :to="`/producao/apontamento?agenda=${event.id}`"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-200/80 dark:hover:bg-emerald-800/50 transition-colors"
                  >
                    <i class="pi pi-stopwatch"></i>
                    <template v-if="resumoApontamentos[event.id]?.totalHoras">
                      {{ resumoApontamentos[event.id].totalHoras }}h na timeline
                    </template>
                    <template v-else>
                      Timeline
                    </template>
                  </RouterLink>
                </div>
              </button>
              </div>
            </div>
            <div v-else class="py-4 text-center">
              <p class="text-sm font-medium text-text-muted mb-3">Nenhum agendamento para este dia.</p>
              <Button
                variant="primary"
                size="sm"
                class="rounded-xl"
                @click="openModalNovaTarefaNoDia"
              >
                <i class="pi pi-calendar-plus mr-1.5 text-xs" />
                Agendar tarefa neste dia
              </Button>
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-agenda-titulo"
          @click.self="closeModal"
          @keydown.escape="closeModal"
        >
        <div
          ref="modalContentRef"
          tabindex="-1"
          class="w-full max-w-[760px] max-h-[90vh] flex flex-col rounded-2xl border border-border-ui bg-bg-card shadow-xl overflow-hidden outline-none"
        >
          <div class="h-1 flex-shrink-0 bg-brand-primary" />
          <header class="flex items-center justify-between flex-shrink-0 px-5 py-4 border-b border-border-ui bg-bg-card">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-calendar-plus text-brand-primary text-lg"></i>
              </div>
              <div class="min-w-0">
                <h2 id="modal-agenda-titulo" class="text-lg font-semibold text-text-main truncate">
                  {{ editingEvent && clienteNomeEventoAtual ? clienteNomeEventoAtual : (funcionarioNome || 'Agendar tarefa') }}
                </h2>
                <p class="text-xs font-medium text-text-muted truncate">
                  {{ editingEvent && clienteContatoEventoAtual ? clienteContatoEventoAtual : selectedLabel }}
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
        <div class="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-text-muted mb-4">
          <span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/50 border border-border-ui">
            Agenda de Produção
          </span>
          <span v-if="editingEvent && !ehAgendandoPendenteMedidaFina" class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/50 border border-border-ui">
            Edição
          </span>
          <span v-if="ehAgendandoPendenteMedidaFina" class="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200">
            Agendamento
          </span>
          <span v-if="editingEvent" class="px-2.5 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary dark:text-brand-primary text-[11px] font-medium">
            Criador: {{ editingEvent.criado_por_usuario?.nome || 'Não informado' }}
          </span>
          <span v-if="editingEvent?.alterado_por_usuario" class="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[11px] font-medium">
            Editado por: {{ editingEvent.alterado_por_usuario.nome }}
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
              <div v-if="editingEvent" class="flex flex-wrap items-center gap-2">
                <span class="inline-flex flex-col items-start px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/30">
                  <span class="text-[10px] font-black uppercase">{{ tituloSubtituloEvento(editingEvent).titulo }}</span>
                  <span class="text-[9px] font-semibold opacity-90">{{ tituloSubtituloEvento(editingEvent).subtitulo }}</span>
                </span>
                <span class="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase" :class="statusExecucaoClass(editingEvent ? { ...editingEvent, status: editingEvent.status, fim_em: taskForm.fim ?? editingEvent.fim_em } : {})">
                  {{ statusExecucaoLabel(editingEvent) }}
                </span>
              </div>
              <div v-else class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="inline-flex flex-col items-start px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/30">
                    <span class="text-[10px] font-black uppercase">{{ tituloFaseParaCategoria(taskForm.categoria) }}</span>
                    <span class="text-[9px] font-semibold opacity-90">{{ etapaAtualLabel }}</span>
                  </span>
                  <span class="text-[10px] text-text-muted">(primeira etapa automática)</span>
                </div>
                <!-- Pós-venda (Garantia / Manutenção / Assistência) só para Venda cliente; serviço de corte não tem pós-venda. Só recebe clientes com montagem concluída. -->
                <div v-if="taskForm.origemFluxo === 'LOJA_VENDA'" class="mt-2">
                  <label class="block text-[10px] font-bold text-text-muted mb-1">Ou criar pós-venda:</label>
                  <p class="text-[10px] text-text-muted mb-1.5">
                    Garantia, Manutenção e Assistência: apenas clientes com montagem concluída poderão ser selecionados.
                  </p>
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

            <!-- Agenda de Produção: nome e contato do cliente ao editar evento -->
            <div
              v-if="!isAgendaLoja && editingEvent && clienteEventoAtual"
              class="mt-4 rounded-xl border border-brand-primary/30 bg-brand-primary/5 px-3 py-2"
            >
              <div class="text-[10px] font-bold uppercase tracking-wider text-brand-primary mb-0.5">
                Cliente
              </div>
              <div class="text-xs font-semibold text-text-main">
                {{ clienteNomeEventoAtual }}
              </div>
              <div v-if="clienteContatoEventoAtual" class="text-[10px] font-medium text-text-muted mt-0.5">
                {{ clienteContatoEventoAtual }}
              </div>
            </div>

            <!-- Agenda Fábrica: lista de ambientes da venda – selecione os desta tarefa (o resto fica pendente) -->
            <div v-if="!isAgendaLoja && vendaIdParaAmbientes" class="mt-4">
              <label class="block text-xs font-bold mb-1 text-text-main">Ambientes desta tarefa</label>
              <p class="text-[10px] text-text-muted mb-1.5">
                Selecione os ambientes incluídos nesta tarefa (ex.: medição de 2 ambientes). Os não marcados ficam pendentes para outra tarefa.
              </p>
              <div
                v-if="loadingAmbientes"
                class="rounded-xl border border-border-ui px-3 py-2 text-xs text-text-muted"
              >
                Carregando ambientes...
              </div>
              <div
                v-else-if="listaAmbientesVenda.length > 0"
                class="rounded-xl border border-border-ui bg-bg-card px-3 py-2.5 space-y-2"
              >
                <label
                  v-for="(amb, idx) in listaAmbientesVenda"
                  :key="idx"
                  class="flex items-center gap-2.5 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    :checked="taskForm.ambientesSelecionados.includes(amb.nome)"
                    class="w-4 h-4 rounded border-border-ui text-brand-primary focus:ring-brand-primary/20"
                    @change="toggleAmbiente(amb.nome)"
                  />
                  <span class="text-xs font-medium text-text-main group-hover:text-brand-primary">
                    {{ amb.nome }}
                  </span>
                </label>
              </div>
              <p v-else-if="!loadingAmbientes" class="text-[10px] font-medium text-text-muted mt-1">
                Nenhum ambiente cadastrado nesta venda.
              </p>
            </div>
            <!-- Agenda Fábrica: Cliente para pós-venda (só montagem concluída) ou tarefa recebida -->
            <div
              v-if="!isAgendaLoja && !editingEvent && (ehCategoriaPosVenda || ehTarefaRecebida)"
              class="mt-4"
            >
              <label class="block text-xs font-bold mb-1 text-text-main">Cliente</label>
              <p v-if="ehCategoriaPosVenda" class="text-[10px] text-text-muted mb-1.5">
                Lista restrita a clientes com montagem já concluída.
              </p>
              <p v-if="ehCategoriaPosVenda && montagemConcluidaList.length === 0 && !montagemConcluidaLoading" class="text-[10px] font-medium text-amber-600 dark:text-amber-400 mb-1.5">
                Nenhum cliente com montagem concluída no momento.
              </p>
              <SearchInput
                v-model="taskForm.clienteId"
                mode="select"
                label=""
                :placeholder="ehCategoriaPosVenda ? 'Selecione o cliente (montagem concluída)...' : 'Selecione o cliente...'"
                :options="ehCategoriaPosVenda ? clientesOptionsParaModal : clientesOptions"
              />
              <div
                v-if="ehCategoriaPosVenda && clienteSelecionadoPosVenda?.cliente"
                class="mt-2 rounded-xl border border-brand-primary/30 bg-brand-primary/5 px-3 py-2"
              >
                <div class="text-[10px] font-bold uppercase tracking-wider text-brand-primary mb-0.5">
                  Nome e contato
                </div>
                <div class="text-xs font-semibold text-text-main">
                  {{ clienteSelecionadoPosVenda.cliente?.nome_completo || clienteSelecionadoPosVenda.cliente?.razao_social || 'Cliente' }}
                </div>
                <div v-if="clienteSelecionadoPosVenda.cliente?.telefone || clienteSelecionadoPosVenda.cliente?.celular || clienteSelecionadoPosVenda.cliente?.email" class="text-[10px] font-medium text-text-muted mt-0.5">
                  {{ [clienteSelecionadoPosVenda.cliente?.telefone, clienteSelecionadoPosVenda.cliente?.celular, clienteSelecionadoPosVenda.cliente?.email].filter(Boolean).join(' · ') }}
                </div>
              </div>
            </div>
            <!-- Agenda Loja: seletor de Cliente -->
            <div v-if="isAgendaLoja" class="mt-4">
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
              2. Período da tarefa (data e hora)
            </div>
            <p class="text-[10px] text-text-muted">
              Defina data e hora de início e fim. A tarefa aparecerá nos dias do intervalo; o horário é exibido (ex.: medida fina 14:00–16:00).
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-bold mb-1 text-text-soft">Data e hora início</label>
                <input
                  type="datetime-local"
                  v-model="taskForm.inicio"
                  min="2000-01-01T00:00"
                  step="60"
                  :disabled="eventoFinalizado"
                  class="w-full h-10 bg-bg-card border border-border-ui rounded-xl px-3 text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold mb-1 text-text-soft">Data e hora fim</label>
                <input
                  type="datetime-local"
                  v-model="taskForm.fim"
                  min="2000-01-01T00:00"
                  step="60"
                  :disabled="eventoFinalizado"
                  class="w-full h-10 bg-bg-card border border-border-ui rounded-xl px-3 text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </section>

          <!-- Criador da tarefa (quem agendou) e executores (funcionários na Timeline). -->
            <div v-if="editingEvent" class="mt-4 p-3 rounded-xl border border-border-ui bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
              <div class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Responsáveis</div>
              <div><span class="text-[10px] font-semibold text-text-main">1. Criador da tarefa:</span> <span class="text-xs text-text-main">{{ editingEvent.criado_por_usuario?.nome || 'Não informado' }}</span></div>
              <div><span class="text-[10px] font-semibold text-text-main">2. Executores (funcionários na tarefa):</span> <span class="text-xs text-text-main">{{ nomesExecutoresEvento(editingEvent) || 'Nenhum funcionário atribuído ainda' }}</span></div>
              <p class="text-[10px] text-text-muted mt-1">Executores são atribuídos na Timeline de Produção (apontamento de horas).</p>
            </div>

        </div>

        <!-- Botões: nova tarefa = Salvar + Cancelar; edição = só criador ou Admin pode alterar -->
        <div class="mt-4 pt-3 border-t border-border-ui flex flex-wrap items-center justify-end gap-2">
          <template v-if="editingEvent && !podeEditarAgendaProducao && !ehAgendandoPendenteMedidaFina">
            <p class="text-xs text-amber-700 dark:text-amber-300 mr-auto">
              Apenas o criador da tarefa ou um administrador pode alterar ou excluir.
            </p>
            <Button
              variant="secondary"
              class="min-w-[90px]"
              @click="clearEdit"
            >
              Fechar
            </Button>
          </template>
          <template v-else-if="editingEvent && !ehAgendandoPendenteMedidaFina">
            <!-- Edição de tarefa já agendada: Marcar Etapa como Concluída (check verde), Salvar edição, Excluir, Cancelar -->
            <Button
              v-if="normalizarStatusExecucao(editingEvent?.status) !== 'CONCLUIDO'"
              variant="success"
              class="min-w-[180px] gap-1.5"
              :disabled="savingTask"
              @click="finalizarProducaoNoModal(editingEvent)"
            >
              <i class="pi pi-check"></i>
              Marcar Etapa como Concluída
            </Button>
            <Button
              v-if="!eventoFinalizado"
              variant="primary"
              class="min-w-[120px]"
              :disabled="savingTask"
              @click.prevent="onClickSalvar"
            >
              {{ savingTask ? 'Salvando...' : 'Salvar edição' }}
            </Button>
            <Button
              v-if="!eventoFinalizado"
              variant="danger"
              class="min-w-[90px]"
              :disabled="savingTask"
              @click="removeTask(editingEvent)"
            >
              Excluir
            </Button>
            <Button
              variant="secondary"
              class="min-w-[90px]"
              :disabled="savingTask"
              @click="clearEdit"
            >
              {{ eventoFinalizado ? 'Fechar' : 'Cancelar' }}
            </Button>
          </template>
          <template v-else>
            <!-- Nova tarefa ou "Agendar" a partir de Medidas a serem agendadas: criação -->
            <Button
              variant="primary"
              class="min-w-[140px]"
              :disabled="savingTask"
              @click.prevent="onClickSalvar"
            >
              {{ savingTask ? 'Salvando...' : (ehAgendandoPendenteMedidaFina ? 'Confirmar agendamento' : 'Salvar tarefa') }}
            </Button>
            <Button
              variant="secondary"
              class="min-w-[90px]"
              :disabled="savingTask"
              @click="ehAgendandoPendenteMedidaFina ? clearEdit() : closeModal()"
            >
              Cancelar
            </Button>
          </template>
        </div>

        <div v-if="!editingEvent" class="mt-4 border-t border-border-ui pt-4">
          <div class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
            Tarefas do dia
          </div>
          <div v-if="selectedEventsParaLista.length" class="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div
              v-for="event in selectedEventsParaLista"
              :key="event.id"
              class="p-3 rounded-xl border border-l-4"
              :class="[
                event.plano_corte_id ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700 border-l-amber-500' : 'border-border-ui bg-bg-card',
                eventAtrasado(event) && !event.plano_corte_id ? 'border-l-red-500 border-red-300 bg-red-50/60 dark:bg-red-950/30' : (!event.plano_corte_id ? getCardBorderClassProducao(event.categoria, event.status) : ''),
              ]"
            >
              <div class="text-xs font-bold text-text-main flex items-center gap-2 flex-wrap">
                {{ eventTitle(event) }}
                <span v-if="event.plano_corte_id" class="inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-600 text-white dark:bg-amber-500 dark:text-amber-950">[APENAS CORTE]</span>
              </div>
              <div class="text-[10px] font-semibold text-text-muted">
                {{ periodLabel(event.inicio_em, event.fim_em, event) }}
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-1.5">
                <span v-if="!isAgendaLoja" class="inline-flex flex-col items-start px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/30">
                  <span class="text-[9px] font-black uppercase leading-tight">{{ tituloSubtituloEvento(event).titulo }}</span>
                  <span class="text-[8px] font-semibold opacity-90 leading-tight">{{ tituloSubtituloEvento(event).subtitulo }}</span>
                </span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase" :class="event.plano_corte_id ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 dark:border-amber-700' : getProcessColorByStatusProducao(event.categoria, event.status).badgeClass">
                  {{ statusExecucaoLabel(event) }}
                </span>
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  v-if="normalizarStatusExecucao(event?.status) !== 'CONCLUIDO'"
                  size="sm"
                  variant="primary"
                  @click="atualizarStatusExecucao(event, 'EM_ANDAMENTO')"
                >
                  Iniciar
                </Button>
                <Button
                  v-if="normalizarStatusExecucao(event?.status) === 'EM_ANDAMENTO'"
                  size="sm"
                  variant="secondary"
                  @click="atualizarStatusExecucao(event, 'PAUSADO')"
                >
                  Pausar
                </Button>
                <Button
                  v-if="normalizarStatusExecucao(event?.status) !== 'CONCLUIDO'"
                  size="sm"
                  variant="success"
                  @click="atualizarStatusExecucao(event, 'CONCLUIDO')"
                >
                  {{ botaoConcluirLabel(event) }}
                </Button>
                <Button
                  v-if="normalizarStatusExecucao(event?.status) !== 'CONCLUIDO'"
                  size="sm"
                  variant="secondary"
                  @click="editTask(event)"
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  @click="removeTask(event)"
                >
                  Excluir
                </Button>
              </div>
            </div>
          </div>
          <div v-else class="text-[10px] font-bold text-text-muted">Nenhuma tarefa neste dia.</div>
        </div>
      </div>
      </div>
      </div>
    </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { AgendaFabricaService, ApontamentoProducaoService, ClienteService, FuncionarioService, OrcamentosService, PlanoCorteService, VendaService } from '@/services/index'
import { PIPELINE_CLIENTE, PIPELINE_PLANO_CORTE_OPTIONS } from '@/constantes'
import { getCalendarioEventClassProducao, getProcessColorByStatusProducao } from '@/constantes'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import storage from '@/utils/storage'

definePage({ meta: { perm: 'agendamentos.producao' } })

const today = new Date()
const currentMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDay = ref(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
const loading = ref(false)
const savingTask = ref(false)
const listaTarefasExpandida = ref(false)
const events = ref([])
const modalOpen = ref(false)
const modalContentRef = ref(null)
const editingEvent = ref(null)
const planosProducao = ref([])
const pipelineProducao = ref([])
const resumoApontamentos = ref({}) // { [agenda_fabrica_id]: { totalHoras, totalCusto, quantidade } }
const clientesOptions = ref([])
const funcionariosOptions = ref([])
const listaAmbientesVenda = ref([])
const loadingAmbientes = ref(false)
const usuarioLogado = computed(() => storage.getUser())
const funcionarioNome = computed(() => usuarioLogado.value?.nome || '')
const isAdmin = computed(() => can('ADMIN'))
/** Na agenda de produção: só o criador da tarefa ou Admin pode alterar/excluir. Registros concluídos não são editáveis. */
const podeEditarAgendaProducao = computed(() => {
  if (!editingEvent.value) return true // nova tarefa: pode salvar
  if (String(editingEvent.value?.status || '').toUpperCase() === 'CONCLUIDO') return false
  if (isAdmin.value) return true
  const criadorId = editingEvent.value?.criado_por_usuario_id ?? editingEvent.value?.criado_por_usuario?.id
  const meuId = usuarioLogado.value?.id
  return meuId != null && criadorId != null && Number(meuId) === Number(criadorId)
})

/** "Medidas a serem agendadas": ao clicar em Agendar, exibir como criação (Salvar tarefa + Cancelar), não como edição. */
const ehAgendandoPendenteMedidaFina = computed(() => {
  const ev = editingEvent.value
  if (!ev) return false
  const cat = String(ev?.categoria || '').toUpperCase()
  const status = String(ev?.status || '').toUpperCase()
  return cat === 'AGENDAR_MEDIDA_FINA' && status === 'PENDENTE'
})
/** Etapa já finalizada (CONCLUIDO): desabilita edição dos campos básicos no modal. */
const eventoFinalizado = computed(() => String(editingEvent.value?.status || '').toUpperCase() === 'CONCLUIDO')
const responsavelLojaId = computed(() => Number(usuarioLogado.value?.funcionario_id || 0))
const responsavelLojaNome = computed(() => funcionarioNome.value || 'Vendedor logado')

const funcionarioSelecionado = ref('')
const taskForm = reactive({
  titulo: '',
  inicio: '', // datetime-local (YYYY-MM-DDTHH:mm) — data e hora início
  fim: '',   // datetime-local — data e hora fim (ex.: medida fina 14:00–16:00)
  clienteId: '',
  vendaId: '',
  orcamentoId: '',
  funcionarioIds: [],
  categoria: 'MEDIDA',
  setorDestino: '',
  origemFluxo: '',
  apontamentos: [],
  ambientesSelecionados: [],
})

const ORIGENS_POR_SETOR = {
  LOJA: [
    { value: 'LOJA_VENDA', label: 'Venda loja' },
  ],
  FABRICA: [
    { value: 'LOJA_VENDA', label: 'Venda cliente' },
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
const pendentesMedidaFina = ref([])
const pendentesMedidaFinaLoading = ref(false)
const montagemConcluidaList = ref([])
const montagemConcluidaLoading = ref(false)
const painelMontagemConcluidaAbertos = ref(false)
const painelMedidasAbertos = ref(false)

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
  APRESENTACAO: 'APRESENTACAO_AGENDADA',
  CONTRATO: 'CONTRATO_ASSINADO',
  GARANTIA: 'GARANTIA',
  MANUTENCAO: 'MANUTENCAO',
  ASSISTENCIA: 'ASSISTENCIA',
}

function labelPipelineCliente(key) {
  const item = (PIPELINE_CLIENTE || []).find((p) => String(p?.key || '').toUpperCase() === String(key || '').toUpperCase())
  return item?.label || String(key || '')
}

function labelPipelinePlanoCorte(key) {
  const item = (PIPELINE_PLANO_CORTE_OPTIONS || []).find((p) => String(p?.key || '').toUpperCase() === String(key || '').toUpperCase())
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
    return `Pipeline Serviço de Corte: ${labelPipelinePlanoCorte('EM_ANDAMENTO')}`
  }
  if (origem === 'LOJA_VENDA') {
    if (vendaSelecionadaParaAgendamento.value) return statusLabelVenda.value || 'Pipeline cliente'
    const statusKey = CATEGORIA_TO_STATUS_CLIENTE[String(taskForm.categoria || '').toUpperCase()]
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
  if (!taskForm.setorDestino) taskForm.setorDestino = 'FABRICA'
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
  if (!taskForm.setorDestino) taskForm.setorDestino = 'FABRICA'
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
  if (!taskForm.setorDestino) taskForm.setorDestino = 'FABRICA'
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
  taskForm.ambientesSelecionados = []
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
  taskForm.ambientesSelecionados = []
}

function selecionarEtapaPosVenda(categoria) {
  taskForm.categoria = categoria
  taskForm.clienteId = '' // pós-venda só aceita clientes da lista "montagem concluída"
  limparVinculoVenda()
  loadMontagemConcluida()
}

function toggleAmbiente(nome) {
  const idx = taskForm.ambientesSelecionados.indexOf(nome)
  if (idx >= 0) taskForm.ambientesSelecionados.splice(idx, 1)
  else taskForm.ambientesSelecionados.push(nome)
}

watch(
  () => taskForm.origemFluxo,
  (origem) => {
    if (editingEvent.value) return
    const key = String(origem || '').toUpperCase()
    if (!['LOJA_VENDA'].includes(key)) {
      limparVendaSelecionada()
    }
    // Na agenda de produção todas as origens usam o pipeline de produção (etapas da fábrica)
    taskForm.categoria = PRIMEIRA_ETAPA_PRODUCAO.value
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

watch(
  () => taskForm.clienteId,
  (clienteId) => {
    if (!ehCategoriaPosVenda.value || !clienteId) return
    const list = Array.isArray(montagemConcluidaList.value) ? montagemConcluidaList.value : []
    const item = list.find(
      (i) => String(i?.cliente_id ?? i?.cliente?.id ?? '') === String(clienteId),
    )
    if (item?.venda_id != null) taskForm.vendaId = String(item.venda_id)
  },
)

const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']

const monthLabel = computed(() =>
  currentMonth.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
)

// Contexto do evento em edição: venda (cliente) ou serviço de corte
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

const vendaIdParaAmbientes = computed(() => {
  const v = taskForm.vendaId ? Number(taskForm.vendaId) : null
  if (v && Number.isFinite(v)) return v
  return editingEvent.value?.venda_id ?? null
})

const ehCategoriaPosVenda = computed(() =>
  CATEGORIAS_POS_VENDA.includes(String(taskForm.categoria || '').toUpperCase()),
)
const ehTarefaRecebida = computed(
  () => !editingEvent.value && String(taskForm.categoria || '').toUpperCase() === String(PRIMEIRA_ETAPA_PRODUCAO.value || '').toUpperCase(),
)
/** No pós-venda: só clientes com montagem concluída; label com nome e contato. */
const clientesOptionsParaModal = computed(() => {
  if (!ehCategoriaPosVenda.value) return clientesOptions.value
  const list = Array.isArray(montagemConcluidaList.value) ? montagemConcluidaList.value : []
  return list.map((item) => {
    const c = item?.cliente || item
    const nome = c?.nome_completo || c?.razao_social || c?.nome || 'Cliente'
    const contato = [c?.telefone, c?.celular, c?.email].filter(Boolean).join(' · ') || ''
    return {
      value: item?.cliente_id ?? c?.id ?? null,
      label: contato ? `${nome} – ${contato}` : nome,
    }
  }).filter((o) => o.value != null)
})
/** Item da lista montagem concluída selecionado (para exibir nome + contato no pós-venda). */
const clienteSelecionadoPosVenda = computed(() => {
  if (!ehCategoriaPosVenda.value || !taskForm.clienteId) return null
  const list = Array.isArray(montagemConcluidaList.value) ? montagemConcluidaList.value : []
  return list.find(
    (item) => String(item?.cliente_id ?? item?.cliente?.id ?? '') === String(taskForm.clienteId),
  ) || null
})

/** Cliente do evento em edição (direto no evento ou via venda). */
const clienteEventoAtual = computed(() => {
  const ev = editingEvent.value
  if (!ev) return null
  return ev?.cliente ?? ev?.venda?.cliente ?? null
})

const clienteNomeEventoAtual = computed(() => {
  const ev = editingEvent.value
  if (!ev) return ''
  if (ev?.cliente?.nome_completo || ev?.cliente?.razao_social) {
    return ev?.cliente?.nome_completo || ev?.cliente?.razao_social || ''
  }
  if (ev?.venda?.cliente?.nome_completo || ev?.venda?.cliente?.razao_social) {
    return ev?.venda?.cliente?.nome_completo || ev?.venda?.cliente?.razao_social || ''
  }
  const clienteId = String(taskForm.clienteId || '')
  if (!clienteId) return ''
  const opt = clientesOptions.value.find((c) => String(c.value) === clienteId)
  return opt?.label || ''
})

/** Contato formatado do cliente do evento (telefone, whatsapp, email). */
const clienteContatoEventoAtual = computed(() => {
  const c = clienteEventoAtual.value
  if (!c) return ''
  const partes = [c?.telefone, c?.whatsapp, c?.celular, c?.email].filter(Boolean)
  return partes.join(' · ') || ''
})

const origemEventoLabel = computed(() => {
  const origem = String(editingEvent.value?.origem_fluxo || '').toUpperCase()
  const map = {
    PLANO_CORTE: 'Origem: serviço de corte',
    VENDA_PLANO_CORTE: 'Origem: venda do serviço de corte',
    LOJA_VENDA: 'Origem: cliente venda da loja',
  }
  return map[origem] || 'Origem: agenda'
})

watch(
  vendaIdParaAmbientes,
  async (vendaId) => {
    listaAmbientesVenda.value = []
    if (!vendaId || !Number.isFinite(Number(vendaId))) return
    loadingAmbientes.value = true
    try {
      const res = await VendaService.listarAmbientes(Number(vendaId))
      const data = res?.data ?? res
      listaAmbientesVenda.value = Array.isArray(data) ? data : []
    } catch {
      listaAmbientesVenda.value = []
    } finally {
      loadingAmbientes.value = false
    }
  },
  { immediate: true }
)

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
/** Etapas legadas de produção (corte, montagem interna etc.) não exibidas; o cálculo de produção já é um só. */
const CATEGORIAS_PRODUCAO_OCULTAS = ['PREPARACAO_TECNICA', 'CORTE', 'MONTAGEM_INTERNA', 'ACABAMENTO', 'CONFERENCIA_QUALIDADE']
/** Serviço de Corte (Fornecedor): fluxo encerra após Corte — ocultar Marcenaria/Montagem e pós-venda. */
const ETAPAS_SERVICO_CORTE_EXCLUIDAS = ['MONTAGEM_CLIENTE_AGENDADA', 'EM_MONTAGEM_CLIENTE', 'MONTAGEM_CLIENTE_FINALIZADA', 'AGENDAR_POS_VENDA', 'GARANTIA', 'MANUTENCAO', 'ASSISTENCIA']

const TIPOS_PRODUCAO = computed(() => {
  const lista = Array.isArray(pipelineProducao.value) ? pipelineProducao.value : []
  return [...lista]
    .sort((a, b) => Number(a?.ordem || 0) - Number(b?.ordem || 0))
    .map((etapa) => ({
      value: String(etapa?.key || ''),
      label: String(etapa?.label || etapa?.key || ''),
    }))
    .filter((item) => item.value && !CATEGORIAS_PRODUCAO_OCULTAS.includes(item.value))
})

/** Para Serviço de Corte (plano_corte_id): apenas etapas até Produção/Corte e PRODUCAO_FINALIZADA. */
const TIPOS_PRODUCAO_APENAS_CORTE = computed(() => {
  return TIPOS_PRODUCAO.value.filter(
    (o) => !ETAPAS_SERVICO_CORTE_EXCLUIDAS.includes(o.value),
  )
})

const PRIMEIRA_ETAPA_PRODUCAO = computed(
  () => TIPOS_PRODUCAO.value[0]?.value || 'PRODUCAO_RECEBIDA',
)

const opcoesTipoAgendamento = computed(() => {
  if (isAgendaLoja.value) {
    return TIPOS_LOJA_VENDA.value
  }
  const origem = String(taskForm.origemFluxo || '').toUpperCase()
  const ehServicoCorte =
    !!editingEvent.value?.plano_corte_id ||
    origem === 'PLANO_CORTE' ||
    origem === 'VENDA_PLANO_CORTE'
  const listaProducao = ehServicoCorte ? TIPOS_PRODUCAO_APENAS_CORTE.value : TIPOS_PRODUCAO.value
  const ehVendaCliente = origem === 'LOJA_VENDA'
  return [...listaProducao, ...(ehVendaCliente && !ehServicoCorte ? TIPOS_POS_VENDA : [])]
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

/** Títulos das fases para vendas (cliente): exibidos como título; pipeline como subtítulo */
const TITULOS_FASE_VENDA = {
  MEDIDA_FINA: 'Medida fina',
  PROJETO_TECNICO: 'Projeto técnico',
  PRODUCAO: 'Produção',
  MONTAGEM: 'Montagem',
  POS_VENDA: 'Pós-venda',
}
const CATEGORIAS_MEDIDA_FINA = ['AGENDAR_MEDIDA_FINA', 'MEDIDA_FINA']
const CATEGORIAS_PROJETO_TECNICO = ['AGUARDANDO_PROJETO_TECNICO', 'PROJETO_TECNICO_EM_ANDAMENTO', 'PROJETO_TECNICO_CONCLUIDO']
/** Ao concluir, enviar CONCLUIDO para o backend atualizar venda/cliente (ex.: "Medida fina concluída") e criar próximo evento. */
const CATEGORIAS_CONCLUIR_NO_BACKEND = ['AGENDAR_MEDIDA_FINA', 'MEDIDA_FINA', 'AGUARDANDO_PROJETO_TECNICO', 'PROJETO_TECNICO_EM_ANDAMENTO', 'PRODUCAO_EM_ANDAMENTO', 'MONTAGEM_CLIENTE_AGENDADA', 'EM_MONTAGEM_CLIENTE']
const CATEGORIAS_PRODUCAO = [
  'PRODUCAO_RECEBIDA',
  'PRODUCAO_EM_ANDAMENTO',
  'PRODUCAO_FINALIZADA',
  ...CATEGORIAS_PRODUCAO_OCULTAS,
]
const CATEGORIAS_MONTAGEM = ['MONTAGEM_CLIENTE_AGENDADA', 'EM_MONTAGEM_CLIENTE', 'MONTAGEM_CLIENTE_FINALIZADA']
/** Pós-venda (garantia/manutenção/assistência) é tarefa avulsa, não faz parte do fluxo medida → projeto → produção → montagem. */
const CATEGORIAS_POS_VENDA = ['AGENDAR_POS_VENDA', 'GARANTIA', 'MANUTENCAO', 'ASSISTENCIA']

function tituloFaseParaCategoria(categoria) {
  const cat = String(categoria || '').toUpperCase()
  if (CATEGORIAS_MEDIDA_FINA.includes(cat)) return TITULOS_FASE_VENDA.MEDIDA_FINA
  if (CATEGORIAS_PROJETO_TECNICO.includes(cat)) return TITULOS_FASE_VENDA.PROJETO_TECNICO
  if (CATEGORIAS_PRODUCAO.includes(cat)) return TITULOS_FASE_VENDA.PRODUCAO
  if (CATEGORIAS_MONTAGEM.includes(cat)) return TITULOS_FASE_VENDA.MONTAGEM
  if (CATEGORIAS_POS_VENDA.includes(cat)) return TITULOS_FASE_VENDA.POS_VENDA
  return TITULOS_FASE_VENDA.PRODUCAO
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

/** Medida fina: título fixo "Medida fina", subtítulo por status: Agendar medida fina / Medida fina agendada / Medida fina concluída. Cores mudam conforme o agendamento. */
const SUBTITULOS_MEDIDA_FINA = {
  AGENDAR_MEDIDA_FINA: 'Agendar medida fina',
  MEDIDA_FINA: 'Medida fina agendada',
  CONCLUIDO: 'Medida fina concluída',
}
function tituloSubtituloEvento(event) {
  if (event?.plano_corte_id) {
    return { titulo: 'Serviço de Corte', subtitulo: planoBadgeLabel(planoStatusForEvent(event)) || 'Serviço de Corte' }
  }
  const cat = String(event?.categoria || '').toUpperCase()
  const titulo = tituloFaseParaCategoria(cat)
  if (CATEGORIAS_MEDIDA_FINA.includes(cat)) {
    const status = String(event?.status || '').toUpperCase()
    const concluido = status === 'CONCLUIDO'
    const emAndamento = status === 'EM_ANDAMENTO'
    let subtitulo
    if (concluido) subtitulo = SUBTITULOS_MEDIDA_FINA.CONCLUIDO
    else if (cat === 'MEDIDA_FINA' || (cat === 'AGENDAR_MEDIDA_FINA' && emAndamento)) subtitulo = SUBTITULOS_MEDIDA_FINA.MEDIDA_FINA
    else subtitulo = SUBTITULOS_MEDIDA_FINA.AGENDAR_MEDIDA_FINA
    return { titulo: TITULOS_FASE_VENDA.MEDIDA_FINA, subtitulo }
  }
  if (CATEGORIAS_PROJETO_TECNICO.includes(cat)) {
    const status = String(event?.status || '').toUpperCase()
    if (status === 'CONCLUIDO') {
      return { titulo: TITULOS_FASE_VENDA.PROJETO_TECNICO, subtitulo: 'Projeto técnico concluído' }
    }
    return { titulo: TITULOS_FASE_VENDA.PROJETO_TECNICO, subtitulo: etapaLabelPorCategoria(cat) }
  }
  if (CATEGORIAS_PRODUCAO.includes(cat)) {
    const status = String(event?.status || '').toUpperCase()
    if (status === 'CONCLUIDO') {
      return { titulo: TITULOS_FASE_VENDA.PRODUCAO, subtitulo: 'Produção concluída' }
    }
    return { titulo: TITULOS_FASE_VENDA.PRODUCAO, subtitulo: etapaLabelPorCategoria(cat) }
  }
  if (CATEGORIAS_MONTAGEM.includes(cat)) {
    const status = String(event?.status || '').toUpperCase()
    if (status === 'CONCLUIDO') {
      return { titulo: TITULOS_FASE_VENDA.MONTAGEM, subtitulo: 'Montagem concluída' }
    }
    return { titulo: TITULOS_FASE_VENDA.MONTAGEM, subtitulo: etapaLabelPorCategoria(cat) }
  }
  if (CATEGORIAS_POS_VENDA.includes(cat)) {
    return { titulo: TITULOS_FASE_VENDA.POS_VENDA, subtitulo: etapaLabelPorCategoria(cat) }
  }
  return { titulo, subtitulo: etapaLabelPorCategoria(cat) }
}

/** Cor da etapa vinda do pipeline (backend). Se não achar, usa slate. */
function getColorFamilyFromPipeline(categoria) {
  const cat = String(categoria || '').toUpperCase()
  const pipeline = Array.isArray(pipelineProducao.value) ? pipelineProducao.value : []
  const item = pipeline.find((p) => String(p?.key || '').toUpperCase() === cat)
  return item?.colorFamily || 'slate'
}

/** Tom do status: claro (aguardando) → médio (em andamento) → escuro (concluído). */
function getTomStatus(event) {
  const status = String(event?.status || '').toUpperCase()
  if (status === 'CONCLUIDO') return 'escuro'
  if (status === 'EM_ANDAMENTO') return 'medio'
  return 'claro'
}

/** Mapa genérico: por colorFamily (do pipeline) e tom → classes. Frontend só herda; pipeline define a cor. */
const CORES_POR_FAMILIA_TOM = {
  card: {
    teal: { claro: 'bg-teal-400 hover:bg-teal-300', medio: 'bg-teal-500 hover:bg-teal-400', escuro: 'bg-teal-700 hover:bg-teal-600' },
    violet: { claro: 'bg-violet-400 hover:bg-violet-300', medio: 'bg-violet-500 hover:bg-violet-400', escuro: 'bg-violet-700 hover:bg-violet-600' },
    indigo: { claro: 'bg-indigo-400 hover:bg-indigo-300', medio: 'bg-indigo-500 hover:bg-indigo-400', escuro: 'bg-indigo-700 hover:bg-indigo-600' },
    sky: { claro: 'bg-sky-400 hover:bg-sky-300', medio: 'bg-sky-500 hover:bg-sky-400', escuro: 'bg-sky-700 hover:bg-sky-600' },
    amber: { claro: 'bg-amber-400 hover:bg-amber-300', medio: 'bg-amber-500 hover:bg-amber-400', escuro: 'bg-amber-700 hover:bg-amber-600' },
    slate: { claro: 'bg-slate-400 hover:bg-slate-300', medio: 'bg-slate-500 hover:bg-slate-400', escuro: 'bg-slate-700 hover:bg-slate-600' },
  },
  borda: {
    teal: { claro: 'border-l-teal-400 border-teal-200 bg-teal-50/70 dark:bg-teal-950/20', medio: 'border-l-teal-500 border-teal-300 bg-teal-50/80 dark:bg-teal-950/30', escuro: 'border-l-teal-500 border-teal-300 bg-teal-50/80 dark:bg-teal-950/30' },
    violet: { claro: 'border-l-violet-400 border-violet-200 bg-violet-50/70 dark:bg-violet-950/20', medio: 'border-l-violet-500 border-violet-300 bg-violet-50/80 dark:bg-violet-950/30', escuro: 'border-l-violet-500 border-violet-300 bg-violet-50/80 dark:bg-violet-950/30' },
    indigo: { claro: 'border-l-indigo-400 border-indigo-200 bg-indigo-50/70 dark:bg-indigo-950/20', medio: 'border-l-indigo-500 border-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/30', escuro: 'border-l-indigo-500 border-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/30' },
    sky: { claro: 'border-l-sky-400 border-sky-200 bg-sky-50/70 dark:bg-sky-950/20', medio: 'border-l-sky-500 border-sky-300 bg-sky-50/80 dark:bg-sky-950/30', escuro: 'border-l-sky-500 border-sky-300 bg-sky-50/80 dark:bg-sky-950/30' },
    amber: { claro: 'border-l-amber-400 border-amber-200 bg-amber-50/70 dark:bg-amber-950/20', medio: 'border-l-amber-500 border-amber-300 bg-amber-50/80 dark:bg-amber-950/30', escuro: 'border-l-amber-500 border-amber-300 bg-amber-50/80 dark:bg-amber-950/30' },
    slate: { claro: 'border-l-slate-400 border-slate-200 bg-slate-50/70 dark:bg-slate-950/20', medio: 'border-l-slate-500 border-slate-300 bg-slate-50/80 dark:bg-slate-950/30', escuro: 'border-l-slate-500 border-slate-300 bg-slate-50/80 dark:bg-slate-950/30' },
  },
  /** Badge de status (Pendente / Em andamento / Concluído): mesma família de cor do evento, tom muda com o status. */
  badge: {
    teal: { claro: 'bg-teal-50 text-teal-700 border border-teal-200', medio: 'bg-teal-100 text-teal-800 border border-teal-300', escuro: 'bg-teal-100 text-teal-800 border border-teal-400' },
    violet: { claro: 'bg-violet-50 text-violet-700 border border-violet-200', medio: 'bg-violet-100 text-violet-800 border border-violet-300', escuro: 'bg-violet-100 text-violet-800 border border-violet-400' },
    indigo: { claro: 'bg-indigo-50 text-indigo-700 border border-indigo-200', medio: 'bg-indigo-100 text-indigo-800 border border-indigo-300', escuro: 'bg-indigo-100 text-indigo-800 border border-indigo-400' },
    sky: { claro: 'bg-sky-50 text-sky-700 border border-sky-200', medio: 'bg-sky-100 text-sky-800 border border-sky-300', escuro: 'bg-sky-100 text-sky-800 border border-sky-400' },
    amber: { claro: 'bg-amber-50 text-amber-700 border border-amber-200', medio: 'bg-amber-100 text-amber-800 border border-amber-300', escuro: 'bg-amber-100 text-amber-800 border border-amber-400' },
    slate: { claro: 'bg-slate-100 text-slate-700 border border-slate-200', medio: 'bg-slate-200 text-slate-800 border border-slate-300', escuro: 'bg-slate-200 text-slate-800 border border-slate-400' },
  },
}

function corCardCalendarioPorEvento(event) {
  if (eventAtrasado(event)) return 'bg-red-600 hover:bg-red-500'
  const colorFamily = getColorFamilyFromPipeline(event?.categoria)
  const tom = eventConcluido(event) ? 'escuro' : getTomStatus(event)
  const familias = CORES_POR_FAMILIA_TOM.card
  const map = familias[colorFamily] || familias.slate
  return map[tom] || map.medio
}

function corCardCalendarioPorCategoria(categoria) {
  return corCardCalendarioPorEvento({ categoria, status: '' })
}

function corBordaCardPorEvento(event) {
  if (eventAtrasado(event)) return 'border-l-rose-500 border-rose-300 bg-rose-50/60 dark:bg-rose-950/30'
  const colorFamily = getColorFamilyFromPipeline(event?.categoria)
  const tom = eventConcluido(event) ? 'escuro' : getTomStatus(event)
  const familias = CORES_POR_FAMILIA_TOM.borda
  const map = familias[colorFamily] || familias.slate
  return map[tom] || map.medio
}

function corBordaCardPorCategoria(categoria) {
  return corBordaCardPorEvento({ categoria, status: '' })
}

function botaoConcluirLabel(event) {
  const cat = String(event?.categoria || '').toUpperCase()
  const ehProducao = TIPOS_PRODUCAO.value.some(o => o.value === cat)
  if (!ehProducao) return 'Concluir'
  if (CATEGORIAS_MEDIDA_FINA.includes(cat)) return 'Finalizar medida fina'
  if (['AGUARDANDO_PROJETO_TECNICO', 'PROJETO_TECNICO_EM_ANDAMENTO'].includes(cat)) return 'Finalizar projeto técnico'
  const proxima = proximaEtapaProducao(cat)
  if (proxima) return 'Concluir etapa'
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

/** Retorna todas as chaves de data (YYYY-MM-DD) entre início e fim do evento (inclusive). */
function dateKeysBetween(inicioEm, fimEm) {
  const start = new Date(inicioEm)
  const end = new Date(fimEm)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const keys = []
  const cur = new Date(start)
  while (cur <= end) {
    keys.push(dateKey(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return keys
}

/** Data fim efetiva: se a tarefa foi concluída, usa o dia da conclusão para não aparecer nos dias seguintes (limpa dia 18+). */
function effectiveFimEm(event) {
  const status = normalizarStatusExecucao(event?.status)
  if (status !== 'CONCLUIDO') return event?.fim_em
  const alterado = event?.alterado_em ? new Date(event.alterado_em) : null
  const fim = event?.fim_em ? new Date(event.fim_em) : null
  const conclusao = alterado ?? fim
  if (!conclusao || Number.isNaN(conclusao.getTime())) return event?.fim_em
  conclusao.setHours(23, 59, 59, 999)
  return conclusao.toISOString()
}

/** Eventos por dia: tarefa preenche os blocos do intervalo. Se foi finalizada no dia 17, aparece só até o 17 (dias 18 e 19 ficam livres). */
const eventsByDay = computed(() => {
  const map = {}
  for (const ev of events.value) {
    const fimEfetivo = effectiveFimEm(ev)
    const keys = dateKeysBetween(ev.inicio_em, fimEfetivo)
    for (const k of keys) {
      if (!map[k]) map[k] = []
      map[k].push(ev)
    }
  }
  return map
})

const selectedEvents = computed(() => eventsByDay.value[dateKey(selectedDay.value)] || [])

/** Resumo do dia agrupado por título (Medida fina, Projeto técnico, Produção, Montagem) */
const resumoDiaPorEtapa = computed(() => {
  const events = selectedEvents.value
  if (!events.length) return []
  const byTitulo = {}
  const ordemTitulos = [TITULOS_FASE_VENDA.MEDIDA_FINA, TITULOS_FASE_VENDA.PROJETO_TECNICO, TITULOS_FASE_VENDA.PRODUCAO, TITULOS_FASE_VENDA.MONTAGEM, TITULOS_FASE_VENDA.POS_VENDA]
  events.forEach((ev) => {
    const titulo = tituloSubtituloEvento(ev).titulo
    if (!byTitulo[titulo]) byTitulo[titulo] = { etapaKey: titulo, etapaLabel: titulo, tarefas: 0 }
    byTitulo[titulo].tarefas += 1
  })
  return ordemTitulos.filter((t) => byTitulo[t]).map((t) => byTitulo[t])
})

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
const visaoAgenda = computed(() => 'fabrica')
const isAgendaLoja = computed(() => false)
const opcoesOrigemModal = computed(() => ORIGENS_POR_SETOR.FABRICA)

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
  const ts = tituloSubtituloEvento(event)
  const nome = event?.cliente?.nome_completo || event?.cliente?.razao_social || 'Cliente'
  return `${ts.titulo} – ${nome}`
}

/** Tooltip completo para o evento no calendário (horário, criador e executores ao passar o mouse). */
function eventTooltipCalendar(event) {
  const horario = periodLabel(event.inicio_em, event.fim_em, event)
  const titulo = eventTitle(event)
  const criador = event?.criado_por_usuario?.nome || 'Não informado'
  const exec = nomesExecutoresEvento(event)
  return `${horario}\n${titulo}\nCriador: ${criador}${exec ? `\nExecutores: ${exec}` : ''}`
}

function normalizarStatusExecucao(status) {
  return String(status || '').trim().toUpperCase()
}

/** Cronômetro rodando: algum apontamento_producao com início e sem fim (e não pausado). */
function temCronometroRodandoAgenda(event) {
  const aps = event?.apontamentos_producao || []
  return aps.some(
    (ap) =>
      ap?.inicio_em &&
      !ap?.fim_em &&
      !(ap?.pausa_inicio_em && !ap?.pausa_fim_em),
  )
}

/** Nomes dos funcionários que estão executando a tarefa (apontamentos_producao), únicos e separados por vírgula. */
function nomesExecutoresEvento(event) {
  const aps = event?.apontamentos_producao || []
  const nomes = [...new Set(aps.map((ap) => ap?.funcionario?.nome).filter(Boolean))]
  return nomes.length ? nomes.join(', ') : ''
}

/** Status na agenda: Início / Em produção / Ativo / Concluído (conforme funcionário atribuído e cronômetro). */
function statusExecucaoLabel(event) {
  const status = normalizarStatusExecucao(event?.status)
  if (status === 'CONCLUIDO') return 'Concluido'
  const aps = event?.apontamentos_producao || []
  if (temCronometroRodandoAgenda(event)) return 'Ativo'
  if (aps.length) return 'Em produção'
  const fim = new Date(event?.fim_em)
  if (!Number.isNaN(fim.getTime()) && Date.now() > fim.getTime()) return 'Atrasado'
  return 'Início'
}

/** Classe do badge de status: Início / Em produção / Ativo (cronômetro) / Concluído. */
function statusExecucaoClass(event) {
  const status = normalizarStatusExecucao(event?.status)
  if (status === 'CONCLUIDO') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (status === 'PAUSADO') return 'bg-amber-50 text-amber-700 border border-amber-200'
  const fim = new Date(event?.fim_em)
  if (!Number.isNaN(fim.getTime()) && Date.now() > fim.getTime()) {
    return 'bg-rose-50 text-rose-700 border border-rose-200'
  }
  const aps = event?.apontamentos_producao || []
  if (temCronometroRodandoAgenda(event)) return 'bg-blue-50 text-blue-700 border border-blue-200'
  if (aps.length) return 'bg-blue-50 text-blue-700 border border-blue-200'
  const categoria = event?.categoria
  if (categoria && pipelineProducao.value?.length) {
    const colorFamily = getColorFamilyFromPipeline(categoria)
    const tom = getTomStatus(event)
    const familias = CORES_POR_FAMILIA_TOM.badge
    const map = familias[colorFamily] || familias.slate
    return map[tom] || map.medio
  }
  return 'bg-slate-100 text-slate-700 border border-slate-200'
}

/** True quando o horário de término já passou e a tarefa não foi concluída (exibir em vermelho). */
function eventAtrasado(event) {
  const status = normalizarStatusExecucao(event?.status)
  if (status === 'CONCLUIDO') return false
  const fim = new Date(event?.fim_em)
  return !Number.isNaN(fim.getTime()) && Date.now() > fim.getTime()
}

/** True quando a tarefa está concluída (exibir em verde no dia e nas tarefas). */
function eventConcluido(event) {
  return normalizarStatusExecucao(event?.status) === 'CONCLUIDO'
}

function timeLabel(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Período para exibição: sempre com hora (ex.: "02/03 08:00 – 10:00" ou "02/03 08:00 – 10/03 18:00"). Se event concluído, usa data efetiva. */
function periodLabel(inicioEm, fimEm, event) {
  const fimEfetivo = event ? effectiveFimEm(event) : fimEm
  const ini = new Date(inicioEm)
  const fim = new Date(fimEfetivo)
  if (Number.isNaN(ini.getTime()) || Number.isNaN(fim.getTime())) return ''
  const dd = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${dd(ini)} ${timeLabel(ini)} – ${dd(fim)} ${timeLabel(fim)}`
}

function dayEvents(day) {
  return eventsByDay.value[dateKey(day)] || []
}

function normalizePlanoStatus(status) {
  return String(status || '').trim().toUpperCase().replace(/\s+/g, '_')
}

function mapLegacyPlanoStatusToProducao(status) {
  const s = normalizePlanoStatus(status)
  if (['PRODUCAO_RECEBIDA', 'CORTE', 'PRODUCAO_FINALIZADA'].includes(s)) return s
  if (['RECEBIDO', 'CONFERIDO_TECNICO'].includes(s)) return 'PRODUCAO_RECEBIDA'
  if (['NA_MAQUINA', 'BORDA_E_ACABAMENTO'].includes(s)) return 'CORTE'
  if (['PRONTO_PARA_RETIRADA', 'ENTREGUE'].includes(s)) return 'PRODUCAO_FINALIZADA'
  return s
}

function getPlanoPipeline(status) {
  const key = mapLegacyPlanoStatusToProducao(status)
  return (PIPELINE_PLANO_CORTE_OPTIONS || []).find((p) => p.key === key)
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

/** Formata data para input datetime-local (sempre em horário local do navegador). API envia UTC (ex.: ...Z); new Date() converte para local. */
function toDateTimeLocal(date) {
  if (date == null || date === '') return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Normaliza valor do datetime-local para ISO (YYYY-MM-DDTHH:mm). Aceita "DD/MM/YYYY HH:mm" ou "YYYY-MM-DDTHH:mm". */
function normalizarDatetimeForm(val) {
  if (val == null || typeof val !== 'string') return val
  const s = String(val).trim()
  if (!s) return s
  const matchBr = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2})?:?(\d{2})?/)
  if (matchBr) {
    const [, d, m, y, h = '0', min = '0'] = matchBr
    return `${y}-${pad2(m)}-${pad2(d)}T${pad2(h)}:${pad2(min)}`
  }
  return s
}

/** Retorna YYYY-MM-DD para uso em input type="date" (período recorrente). */
function toDateOnly(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
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
  taskForm.categoria = PRIMEIRA_ETAPA_PRODUCAO.value
  taskForm.setorDestino = 'FABRICA'
  taskForm.origemFluxo = 'LOJA_VENDA'
  taskForm.apontamentos = []
  taskForm.ambientesSelecionados = []
  vendaSelecionadaId.value = ''
  vendaSelecionadaParaAgendamento.value = null
  funcionarioSelecionado.value = ''
  
  const dia = selectedDay.value
  taskForm.inicio = toDateOnly(dia) + 'T08:00:00'
  taskForm.fim = toDateOnly(dia) + 'T09:00:00'
  
  sincronizarResponsavelLoja()

  // Garante listas atualizadas ao abrir modal de criação
  loadClientes()
  loadVendasAguardandoAgendamento()
  loadOrcamentosApresentacao()
  loadVendasAguardandoContrato()
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
  taskForm.clienteId = ''
  vendaSelecionadaId.value = ''
  vendaSelecionadaParaAgendamento.value = null
  orcamentoSelecionadoId.value = ''
  orcamentoSelecionadoParaAgendamento.value = null
  vendasContratoId.value = ''
  vendaContratoSelecionada.value = null
  const dia = selectedDay.value
  taskForm.inicio = toDateOnly(dia) + 'T08:00:00'
  taskForm.fim = toDateOnly(dia) + 'T09:00:00'
  taskForm.setorDestino = 'FABRICA'
  taskForm.origemFluxo = 'LOJA_VENDA'
  taskForm.categoria = PRIMEIRA_ETAPA_PRODUCAO.value
  taskForm.apontamentos = []
  taskForm.ambientesSelecionados = []
  sincronizarResponsavelLoja()
}

function openModalNovaTarefaNoDia() {
  clearEdit()
  modalOpen.value = true
}

function openGarantia() {
  const item = PIPELINE_CLIENTE.find((p) => p.key === 'GARANTIA')
  taskForm.titulo = item?.label || 'Garantia'
  if (!modalOpen.value) {
    openModal()
  }
}

function openModalForEvent(event, dayClicked) {
  // Usar evento atualizado da lista (evita dados antigos após salvar)
  const atual = events.value.find((e) => e.id === event.id)
  const eventoParaEditar = atual || event
  // Usar o dia clicado (ex.: 04/03) em vez da data de início do evento (ex.: 02/03)
  if (dayClicked) {
    selectedDay.value = dayClicked instanceof Date ? dayClicked : new Date(dayClicked)
  }
  editTask(eventoParaEditar)
  modalOpen.value = true
}

/** Abre o modal para criar nova tarefa de pós-venda (tarefa avulsa) para um cliente com montagem já concluída. */
function openModalNovaPosVenda(item) {
  editingEvent.value = null
  taskForm.titulo = ''
  taskForm.clienteId = item?.cliente_id ? String(item.cliente_id) : (item?.cliente?.id ? String(item.cliente.id) : '')
  taskForm.vendaId = item?.venda_id ? String(item.venda_id) : (item?.venda?.id ? String(item.venda.id) : '')
  taskForm.funcionarioIds = []
  taskForm.categoria = 'GARANTIA'
  taskForm.setorDestino = 'FABRICA'
  taskForm.origemFluxo = 'LOJA_VENDA'
  taskForm.apontamentos = []
  taskForm.ambientesSelecionados = []
  vendaSelecionadaId.value = taskForm.vendaId
  vendaSelecionadaParaAgendamento.value = item?.venda || null
  funcionarioSelecionado.value = ''
  const dia = selectedDay.value
  taskForm.inicio = toDateOnly(dia) + 'T08:00:00'
  taskForm.fim = toDateOnly(dia) + 'T09:00:00'
  sincronizarResponsavelLoja()
  loadClientes()
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
  const ambSel = event?.ambientes_selecionados
  taskForm.ambientesSelecionados = Array.isArray(ambSel) ? [...ambSel] : []
  // Funcionários que executam ficam na Timeline; na Agenda só o responsável (criador) do agendamento.
  taskForm.funcionarioIds = []
  const cat = event?.categoria || PRIMEIRA_ETAPA_PRODUCAO.value
  // Garante categoria válida para o pipeline do evento (venda vs serviço de corte)
  const origemEvento = String(event?.origem_fluxo || '').toUpperCase()
  if (origemEvento === 'PLANO_CORTE' || origemEvento === 'VENDA_PLANO_CORTE') {
    const categoriasValidas = TIPOS_PRODUCAO.value.map((o) => o.value)
    taskForm.categoria = categoriasValidas.includes(cat) ? cat : PRIMEIRA_ETAPA_PRODUCAO.value
  } else if (origemEvento === 'LOJA_VENDA') {
    const vendaKeys = TIPOS_LOJA_VENDA.value.map((o) => o.value)
    taskForm.categoria = vendaKeys.includes(cat) ? cat : 'MEDIDA'
  } else {
    taskForm.categoria = PRIMEIRA_ETAPA_PRODUCAO.value
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
    await AgendaFabricaService.excluir(event.id)
    if (editingEvent.value && String(editingEvent.value.id) === String(event.id)) {
      clearEdit()
    }
    await loadAgenda()
  } catch (e) {
    notify.error('Nao foi possivel cancelar a tarefa.')
  }
}

/** Dia da conclusão: fim do selectedDay (dia aberto na agenda) em ISO. Evita evento "ficar" na data de início. */
function dataConclusaoIso() {
  const d = new Date(selectedDay.value)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

/** Data/hora de conclusão ao marcar como concluído: usa o "Data e hora fim" do formulário quando está no modal, senão fim do dia selecionado. */
function concluidoIsoEData(event, status) {
  if (status !== 'CONCLUIDO') return { concluidoIso: null, dataConclusao: undefined }
  const noModal = editingEvent.value && Number(editingEvent.value.id) === Number(event?.id)
  const fimForm = noModal && taskForm.fim ? (normalizarDatetimeForm(taskForm.fim) || taskForm.fim) : ''
  if (fimForm) {
    const d = new Date(fimForm)
    if (!Number.isNaN(d.getTime())) {
      return { concluidoIso: d.toISOString(), dataConclusao: dateKey(d) }
    }
  }
  return { concluidoIso: dataConclusaoIso(), dataConclusao: dateKey(selectedDay.value) }
}

async function atualizarStatusExecucao(event, status) {
  try {
    if (status === 'CONCLUIDO' && event?.id) {
      try {
        await ApontamentoProducaoService.finalizarEtapa({ agenda_fabrica_id: event.id })
      } catch (_) {
        // Se já estiver concluído ou falhar, segue com atualizarStatus para próxima etapa
      }
    }

    const categoriaAtual = String(event?.categoria || '').toUpperCase()
    const ehProducao = TIPOS_PRODUCAO.value.some(o => o.value === categoriaAtual)
    // Medida fina / projeto técnico: enviar CONCLUIDO para o backend atualizar venda (ex.: "Medida fina concluída") e criar próximo evento
    const concluirNoBackend = CATEGORIAS_CONCLUIR_NO_BACKEND.includes(categoriaAtual)
    const { concluidoIso, dataConclusao } = concluidoIsoEData(event, status)

    if (status === 'CONCLUIDO' && concluirNoBackend) {
      await AgendaFabricaService.atualizarStatus(event.id, 'CONCLUIDO', undefined, concluidoIso, dataConclusao)
      // Atualização otimista: prazo de conclusão = dia selecionado; evita tela piscar e mostra data correta
      const idx = events.value.findIndex((e) => Number(e.id) === Number(event.id))
      if (idx !== -1) {
        events.value = [
          ...events.value.slice(0, idx),
          { ...events.value[idx], status: 'CONCLUIDO', alterado_em: concluidoIso, fim_em: concluidoIso },
          ...events.value.slice(idx + 1),
        ]
      }
      const criouNovaEtapa =
        CATEGORIAS_MEDIDA_FINA.includes(categoriaAtual) ||
        CATEGORIAS_PROJETO_TECNICO.includes(categoriaAtual) ||
        CATEGORIAS_PRODUCAO.includes(categoriaAtual)
      if (CATEGORIAS_MEDIDA_FINA.includes(categoriaAtual)) {
        notify.success('Medida fina concluída. Venda atualizada e próxima etapa criada na agenda.')
      } else if (CATEGORIAS_PROJETO_TECNICO.includes(categoriaAtual)) {
        notify.success('Projeto técnico concluído. Venda atualizada e produção agendada criada na agenda.')
      } else if (CATEGORIAS_PRODUCAO.includes(categoriaAtual)) {
        notify.success('Produção finalizada. Montagem criada na agenda.')
      } else if (CATEGORIAS_MONTAGEM.includes(categoriaAtual)) {
        notify.success('Montagem finalizada. Venda atualizada.')
      } else {
        notify.success('Tarefa concluída.')
      }
      if (criouNovaEtapa) {
        // Manter o dia da conclusão selecionado para exibir o próximo evento criado nesse dia
        const dia = new Date(selectedDay.value)
        dia.setHours(0, 0, 0, 0)
        selectedDay.value = dia
      }
    } else if (status === 'CONCLUIDO' && ehProducao) {
      const proxima = proximaEtapaProducao(categoriaAtual)
      if (proxima) {
        await AgendaFabricaService.atualizarStatus(event.id, 'PENDENTE', proxima)
        const label = etapaLabelPorCategoria(proxima)
        notify.success(`Etapa concluída. Avançou para: ${label}`)
      } else {
        await AgendaFabricaService.atualizarStatus(event.id, 'CONCLUIDO', undefined, concluidoIso, dataConclusao)
        notify.success('Produção finalizada!')
      }
    } else {
      await AgendaFabricaService.atualizarStatus(event.id, status, undefined, concluidoIso || undefined, dataConclusao)
      if (status === 'CONCLUIDO') {
        const idx = events.value.findIndex((e) => Number(e.id) === Number(event.id))
        if (idx !== -1) {
          events.value = [
            ...events.value.slice(0, idx),
            { ...events.value[idx], status: 'CONCLUIDO', alterado_em: concluidoIso, fim_em: concluidoIso },
            ...events.value.slice(idx + 1),
          ]
        }
        notify.success('Tarefa concluída.')
      } else if (status === 'PAUSADO') notify.success('Tarefa pausada.')
      else notify.success('Tarefa iniciada.')
    }
    // Recarrega em segundo plano sem mostrar "Carregando..." (evita limpar a tela); traz novo evento se houver
    await loadAgenda(true, true)
    loadPendentesMedidaFina()
    // Ao concluir MONTAGEM: atualizar lista de pós-venda só depois (evita abrir modal de pós-venda; usuário só cria pós-venda pelo botão)
    if (CATEGORIAS_MONTAGEM.includes(categoriaAtual)) {
      setTimeout(() => loadMontagemConcluida(), 400)
    } else {
      loadMontagemConcluida()
    }
    return true
  } catch (e) {
    notify.error('Não foi possível atualizar o status da tarefa.')
    return false
  }
}

/** Finalizar produção/montagem a partir do modal: encerra cronômetros (finalizarEtapa) e dispara lógica de próxima etapa. */
async function finalizarProducaoNoModal(event) {
  const ehMontagem = CATEGORIAS_MONTAGEM.includes(String(event?.categoria || '').toUpperCase())
  if (ehMontagem) closeModal()
  const ok = await atualizarStatusExecucao(event, 'CONCLUIDO')
  if (ok && !ehMontagem) closeModal()
}

function onClickSalvar() {
  saveTask()
}

async function saveTask() {
  const DEBUG = false
  if (DEBUG) console.warn('[Agenda] saveTask chamada', { inicio: taskForm.inicio, fim: taskForm.fim, editingEventId: editingEvent.value?.id })

  if (!editingEvent.value) {
    if (!taskForm.setorDestino) { if (DEBUG) console.warn('[Agenda] Bloqueado: sem setor'); return notify.error('Selecione o setor.') }
    if (!taskForm.origemFluxo) { if (DEBUG) console.warn('[Agenda] Bloqueado: sem origem'); return notify.error('Selecione a origem.') }
  }
  if (!taskForm.inicio) { if (DEBUG) console.warn('[Agenda] Bloqueado: sem inicio'); return notify.error('Informe a data e hora de início.') }
  if (!taskForm.fim) { if (DEBUG) console.warn('[Agenda] Bloqueado: sem fim'); return notify.error('Informe a data e hora de fim.') }
  if (!editingEvent.value && !isAgendaLoja.value && taskForm.origemFluxo === 'LOJA_VENDA' && !taskForm.vendaId && !taskForm.clienteId) {
    if (DEBUG) console.warn('[Agenda] Bloqueado: LOJA_VENDA sem venda/cliente'); return notify.error('Selecione uma venda (ou o cliente) para vincular ao agendamento.')
  }
  const origemSelecionada = editingEvent.value
    ? String(editingEvent.value?.origem_fluxo || '').toUpperCase()
    : String(taskForm.origemFluxo || '').toUpperCase()
  if (isAgendaLoja.value) {
    if (!taskForm.clienteId) { if (DEBUG) console.warn('[Agenda] Bloqueado: sem cliente'); return notify.error('Selecione o cliente.') }
  }
  const inicioStr = normalizarDatetimeForm(taskForm.inicio) || taskForm.inicio
  const fimStr = normalizarDatetimeForm(taskForm.fim) || taskForm.fim
  const inicio = new Date(inicioStr)
  const fim = new Date(fimStr)
  if (Number.isNaN(inicio.getTime())) { if (DEBUG) console.warn('[Agenda] Bloqueado: inicio inválido', taskForm.inicio); return notify.error('Data/hora de início inválida.') }
  if (Number.isNaN(fim.getTime())) { if (DEBUG) console.warn('[Agenda] Bloqueado: fim inválido', taskForm.fim); return notify.error('Data/hora de fim inválida.') }
  if (fim <= inicio) { if (DEBUG) console.warn('[Agenda] Bloqueado: fim <= inicio'); return notify.error('Data e hora de fim devem ser posteriores ao início.') }

  savingTask.value = true
  let titulo = taskForm.titulo
  if (!titulo) {
    const catRaw = editingEvent.value?.categoria || PRIMEIRA_ETAPA_PRODUCAO.value
    const catLabel = etapaLabelPorCategoria(catRaw) || opcoesTipoAgendamento.value.find(o => o.value === catRaw)?.label || 'Tarefa'
    const cliLabel = isAgendaLoja.value ? (clienteNomeEventoAtual.value || 'Cliente') : (clienteNomeEventoAtual.value || 'Venda')
    titulo = `${catLabel} - ${cliLabel}`
  }

  // Agenda só controla status e tarefas; funcionários que executam são atribuídos na Timeline (apontamento).
  const equipeIds = []
  const apontamentosPayload = []

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
    // Na Agenda de Produção: edição usa setor do evento; criação sempre FABRICA
    const setorDestino = editingEvent.value
      ? (editingEvent.value?.setor_destino || undefined)
      : 'FABRICA'

    const catEdit = editingEvent.value?.categoria ? String(editingEvent.value.categoria).toUpperCase() : ''
    const ehAgendarMedidaFina = catEdit === 'AGENDAR_MEDIDA_FINA'
    // Ao editar e salvar data/hora em "Agendar medida fina", marcar como agendado (EM_ANDAMENTO) para exibir "Medida fina agendada"
    const statusParaSalvar = editingEvent.value && ehAgendarMedidaFina ? 'EM_ANDAMENTO' : undefined

    const payload = {
      titulo,
      inicio_em: inicio.toISOString(),
      fim_em: fim.toISOString(),
      equipe_ids: equipeIds,
      categoria: editingEvent.value
        ? editingEvent.value.categoria
        : (taskForm.categoria || PRIMEIRA_ETAPA_PRODUCAO.value),
      origem_fluxo: origemFluxo,
      setor_destino: setorDestino,
      apontamentos: apontamentosPayload,
      ...(statusParaSalvar && { status: statusParaSalvar }),
      ...origemPayload,
    }
    if (!isAgendaLoja.value && Array.isArray(taskForm.ambientesSelecionados)) {
      payload.ambientes_selecionados = taskForm.ambientesSelecionados
    }
    if (taskForm.clienteId) {
      payload.cliente_id = Number(taskForm.clienteId)
    }
    if (editingEvent.value?.cliente_id != null && payload.cliente_id == null) {
      payload.cliente_id = Number(editingEvent.value.cliente_id)
    }

    if (DEBUG) console.warn('[Agenda] Payload antes da API', { edicao: !!editingEvent.value, id: editingEvent.value?.id, payload })

    let idEditado = null
    let inicioSalvo = null
    let fimSalvo = null
    if (editingEvent.value) {
      idEditado = editingEvent.value.id
      inicioSalvo = payload.inicio_em
      fimSalvo = payload.fim_em
      const res = await AgendaFabricaService.atualizar(editingEvent.value.id, payload)
      if (DEBUG) console.warn('[Agenda] atualizar OK', res)
      // Atualiza o evento na lista local para o frontend refletir na hora (data/dia)
      const idx = events.value.findIndex((e) => String(e.id) === String(editingEvent.value.id))
      if (idx >= 0) {
        const atualizado = {
          ...events.value[idx],
          inicio_em: payload.inicio_em,
          fim_em: payload.fim_em,
          ...(payload.status && { status: payload.status }),
        }
        events.value = [...events.value.slice(0, idx), atualizado, ...events.value.slice(idx + 1)]
      }
    } else {
      const res = await AgendaFabricaService.criar(payload)
      if (DEBUG) console.warn('[Agenda] criar OK', res)
    }

    if (DEBUG) console.warn('[Agenda] Chamando loadAgenda...')
    await loadAgenda()
    loadPendentesMedidaFina()
    loadMontagemConcluida()
    if (DEBUG) console.warn('[Agenda] loadAgenda OK, fechando modal')
    // Se editamos, garante que o evento na lista tenha as datas que salvamos (loadAgenda pode ter trazido cache)
    if (idEditado != null && inicioSalvo && fimSalvo) {
      const idxDepois = events.value.findIndex((e) => String(e.id) === String(idEditado))
      if (idxDepois >= 0) {
        const ev = events.value[idxDepois]
        const precisaCorrigir =
          ev.inicio_em !== inicioSalvo ||
          ev.fim_em !== fimSalvo ||
          (ehAgendarMedidaFina && String(ev.status || '').toUpperCase() !== 'EM_ANDAMENTO') ||
          (ehAgendarMedidaFina && String(ev.categoria || '').toUpperCase() !== 'MEDIDA_FINA')
        if (precisaCorrigir) {
          const corrigido = {
            ...ev,
            inicio_em: inicioSalvo,
            fim_em: fimSalvo,
            ...(ehAgendarMedidaFina && { status: 'EM_ANDAMENTO', categoria: 'MEDIDA_FINA' }),
          }
          if (DEBUG_AGENDA) console.log('[Agenda Produção] saveTask: corrigido evento local', idEditado, '→ categoria MEDIDA_FINA, status EM_ANDAMENTO')
          events.value = [...events.value.slice(0, idxDepois), corrigido, ...events.value.slice(idxDepois + 1)]
        }
      }
    }
    const dataSalva = inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const horaSalva = inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const eraAgendandoPendente =
      editingEvent.value &&
      String(editingEvent.value?.categoria || '').toUpperCase() === 'AGENDAR_MEDIDA_FINA' &&
      String(editingEvent.value?.status || '').toUpperCase() === 'PENDENTE'
    if (eraAgendandoPendente) {
      notify.success(`Medida fina agendada para ${dataSalva} às ${horaSalva}.`)
    } else if (editingEvent.value) {
      notify.success(`Edição salva: ${dataSalva} às ${horaSalva}.`)
    } else {
      notify.success('Tarefa criada.')
    }
    closeModal()
  } catch (e) {
    if (DEBUG) console.warn('[Agenda] saveTask erro', e, 'response:', e?.response, 'data:', e?.response?.data, 'message:', e?.message)
    const data = e?.response?.data
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : (data?.message && typeof data.message === 'string' ? data.message : null)
    notify.error(msg || 'Não foi possível salvar a tarefa.')
  } finally {
    savingTask.value = false
  }
}

const DEBUG_AGENDA = false // Debug: ativar para ver no console (eventos, período, etc.)

async function loadAgenda(evitarCache = false, silentRefresh = false) {
  if (!can('agendamentos.ver')) return
  if (!silentRefresh) loading.value = true
  try {
    const inicio = dateKey(startOfMonth(currentMonth.value))
    const fim = dateKey(endOfMonth(currentMonth.value))
    const filtros = {
      incluir_cancelados: false,
      visao: visaoAgenda.value,
    }
    if (evitarCache) filtros._ = Date.now()
    if (DEBUG_AGENDA) console.log('[Agenda Produção] loadAgenda: requisitando', { inicio, fim, filtros })
    const res = await AgendaFabricaService.listarTodos(inicio, fim, filtros)
    let data = Array.isArray(res?.data) ? res.data : []
    if (DEBUG_AGENDA) {
      const concluidos = data.filter((e) => String(e?.status || '').toUpperCase() === 'CONCLUIDO')
      console.log('[Agenda Produção] loadAgenda: retornou', data.length, 'eventos', concluidos.length, 'concluídos (ficam visíveis para consultar o dia)', data.map((e) => ({ id: e.id, cat: e.categoria, status: e.status, inicio: e.inicio_em })))
    }
    events.value = data
    if (canProducao.value && data.length) {
      try {
        const { data: resumo } = await ApontamentoProducaoService.resumoPorAgenda(data.map((e) => e.id))
        resumoApontamentos.value = resumo || {}
      } catch {
        resumoApontamentos.value = {}
      }
    } else {
      resumoApontamentos.value = {}
    }
  } catch (e) {
    if (DEBUG_AGENDA) console.warn('[Agenda Produção] loadAgenda erro', e?.message || e, e?.response?.data)
    if (!silentRefresh) notify.error('Falha ao carregar agenda.')
    if (!silentRefresh) events.value = []
  } finally {
    loading.value = false
  }
}

async function loadPlanosProducao() {
  if (!canProducao.value || !can('plano_corte.ver')) return
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
    const res = await AgendaFabricaService.getPipelineProducao()
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
  try {
    // Sempre filtra por setor: só funcionários da fábrica
    const res = await FuncionarioService.select({ unidade: 'FABRICA' })
    const lista = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    funcionariosOptions.value = lista
      .map((item) => ({
        label: item?.label ?? item?.nome ?? '',
        value: item?.value ?? item?.id ?? null,
      }))
      .filter((opt) => opt.value != null && (opt.label || opt.value))
  } catch (e) {
    console.warn('[Agenda Produção] loadFuncionarios:', e?.response?.data || e?.message || e)
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

async function loadPendentesMedidaFina() {
  if (!can('agendamentos.ver')) return
  pendentesMedidaFinaLoading.value = true
  try {
    const res = await AgendaFabricaService.pendentesMedidaFina()
    pendentesMedidaFina.value = Array.isArray(res?.data) ? res.data : []
    if (DEBUG_AGENDA) console.log('[Agenda Produção] loadPendentesMedidaFina:', pendentesMedidaFina.value.length, 'pendentes', pendentesMedidaFina.value.map((p) => ({ id: p.id, venda_id: p.venda_id })))
  } catch (e) {
    pendentesMedidaFina.value = []
    if (DEBUG_AGENDA) console.warn('[Agenda Produção] loadPendentesMedidaFina erro', e)
  } finally {
    pendentesMedidaFinaLoading.value = false
  }
}

async function loadMontagemConcluida() {
  if (!can('agendamentos.ver')) return
  montagemConcluidaLoading.value = true
  try {
    const res = await AgendaFabricaService.montagemConcluida()
    montagemConcluidaList.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    montagemConcluidaList.value = []
  } finally {
    montagemConcluidaLoading.value = false
  }
}

let visibilityHandlerAgenda = null
function setupRefreshAgenda() {
  visibilityHandlerAgenda = () => {
    if (document.visibilityState === 'visible') loadAgenda(true, true)
  }
  document.addEventListener('visibilitychange', visibilityHandlerAgenda)
}
onBeforeUnmount(() => {
  if (visibilityHandlerAgenda && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', visibilityHandlerAgenda)
    visibilityHandlerAgenda = null
  }
})
onMounted(() => {
  if (!storage.getToken()) return
  loadAgenda()
  loadPipelineProducao()
  loadPlanosProducao()
  loadClientes()
  loadFuncionarios()
  loadVendasAguardandoAgendamento()
  loadOrcamentosApresentacao()
  loadVendasAguardandoContrato()
  loadPendentesMedidaFina()
  loadMontagemConcluida()
  setupRefreshAgenda()
})
watch(currentMonth, loadAgenda)

// Acessibilidade: foco inicial no modal ao abrir
watch(modalOpen, (open) => {
  if (open) {
    nextTick(() => {
      modalContentRef.value?.focus()
    })
  }
})
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

