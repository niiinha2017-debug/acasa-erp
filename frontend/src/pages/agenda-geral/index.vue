<template>
  <PageShell :padded="false">
    <section class="agenda-page animate-page-in">

      <!-- ═══ Header ═══ -->
      <div class="agenda-page__header">
        <div class="agenda-page__title-block">
          <h1 class="agenda-page__title">Agenda Geral</h1>
          <p class="agenda-page__subtitle">
            <span v-if="visaoAgenda === 'OPERACAO'">Tarefas em andamento</span>
            <span v-else>Arquivo — tarefas concluídas</span>
          </p>
        </div>

        <div class="agenda-page__toolbar">
          <div class="agenda-page__search">
            <SearchInput
              v-model="busca"
              placeholder="Buscar cliente ou tarefa..."
              @update:modelValue="debouncedCarregar"
            />
          </div>

          <div class="agenda-page__controls">
            <!-- Operação / Arquivo -->
            <div class="agenda-page__seg">
              <button type="button" :class="['agenda-page__seg-btn', visaoAgenda === 'OPERACAO' && 'agenda-page__seg-btn--active']" @click="setVisaoAgenda('OPERACAO')">Operação</button>
              <button type="button" :class="['agenda-page__seg-btn', visaoAgenda === 'ARQUIVO' && 'agenda-page__seg-btn--active']" @click="setVisaoAgenda('ARQUIVO')">Arquivo</button>
            </div>

            <!-- Kanban / Timeline -->
            <div class="agenda-page__seg">
              <button type="button" :class="['agenda-page__seg-btn', modoVisualizacao === 'KANBAN' && 'agenda-page__seg-btn--active']" @click="modoVisualizacao = 'KANBAN'">
                <i class="pi pi-th-large text-[10px] mr-1" />Kanban
              </button>
              <button type="button" :class="['agenda-page__seg-btn', modoVisualizacao === 'TIMELINE' && 'agenda-page__seg-btn--active']" @click="modoVisualizacao = 'TIMELINE'">
                <i class="pi pi-bars text-[10px] mr-1" />Timeline
              </button>
            </div>

            <!-- Período -->
            <select v-model="periodoAgenda" class="agenda-page__select" @change="carregar">
              <option value="TODOS">Qualquer data</option>
              <option value="MES_ATUAL">Mês atual</option>
              <option value="ULTIMOS_30">Últimos 30 dias</option>
              <option value="ULTIMOS_90">Últimos 90 dias</option>
            </select>

            <!-- Refresh -->
            <button type="button" class="agenda-page__btn-ghost" :disabled="loading" @click="carregar">
              <i class="pi pi-refresh" :class="loading ? 'pi-spin' : ''" />
            </button>
          </div>

          <!-- Nova Tarefa -->
          <button
            v-if="visaoAgenda === 'OPERACAO'"
            type="button"
            class="agenda-page__btn-primary"
            @click="abrirModalCriar()"
          >
            <i class="pi pi-plus text-xs" />
            Criar tarefa
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="agenda-page__state">
        <i class="pi pi-spin pi-spinner text-xl" style="color: var(--ds-color-primary);" />
        <span>Carregando...</span>
      </div>

      <!-- Erro -->
      <div v-else-if="erro" class="agenda-page__state agenda-page__state--error">
        <i class="pi pi-exclamation-circle text-lg" />
        {{ erro }}
      </div>

      <!-- ═══ KANBAN ═══ -->
      <div v-else-if="modoVisualizacao === 'KANBAN'" class="agenda-page__kanban">
        <!-- Empty state -->
        <div v-if="eventosVisiveisAgenda.length === 0" class="agenda-page__empty">
          <i class="pi pi-inbox agenda-page__empty-icon" />
          <p class="agenda-page__empty-title">Nenhuma tarefa encontrada</p>
          <p class="agenda-page__empty-desc">Ajuste os filtros ou crie uma nova tarefa para começar.</p>
          <button v-if="visaoAgenda === 'OPERACAO'" type="button" class="agenda-page__btn-outline mt-4" @click="abrirModalCriar()">
            <i class="pi pi-plus text-xs mr-1.5" />Nova tarefa
          </button>
        </div>

        <div v-else class="agenda-page__kanban-groups">
          <div v-for="macro in macroetapasVisiveis" :key="macro.key" class="agenda-page__kanban-group">
            <!-- Label da macro-etapa -->
            <div class="agenda-page__kanban-group-header">
              <span class="agenda-page__kanban-group-dot" :class="macro.bgClass" />
              <span class="agenda-page__kanban-group-label">{{ macro.label }}</span>
              <span class="agenda-page__kanban-group-count">{{ eventosPorMacro(macro.key).length }}</span>
            </div>

            <!-- Colunas de subetapa -->
            <div class="agenda-page__kanban-cols">
              <div v-for="sub in subetapasDaMacro(macro.key)" :key="sub.key" class="agenda-page__kanban-col">
                <!-- Header col -->
                <div class="agenda-page__kanban-col-header">
                  <span class="agenda-page__kanban-col-title">{{ sub.label }}</span>
                  <div class="flex items-center gap-1.5">
                    <span class="agenda-page__kanban-col-badge" :class="macro.badgeClass">{{ eventosPorSubetapa(sub.key).length }}</span>
                    <button v-if="podeCriar" type="button" class="agenda-page__kanban-col-add" @click="abrirModalCriar(macro.key, sub.key)">
                      <i class="pi pi-plus text-[9px]" />
                    </button>
                  </div>
                </div>

                <!-- Cards -->
                <div class="agenda-page__kanban-col-body">
                  <p v-if="eventosPorSubetapa(sub.key).length === 0" class="agenda-page__kanban-col-empty">Nenhuma tarefa</p>

                  <div
                    v-for="ev in eventosPorSubetapa(sub.key)"
                    :key="`${ev._setor}-${ev.id}`"
                    class="agenda-card"
                    :class="borderExecucao(ev)"
                  >
                    <!-- Topo: setor + status -->
                    <div class="agenda-card__top">
                      <span class="agenda-card__chip" :class="ev._setor === 'FABRICA' ? 'agenda-card__chip--fabrica' : 'agenda-card__chip--loja'">
                        {{ ev._setor === 'FABRICA' ? 'Fábrica' : 'Loja' }}
                      </span>
                      <span class="agenda-card__chip" :class="badgeExecucao(ev)">{{ textoPrioridadeBadge(ev) }}</span>
                      <span v-if="ev._setor === 'FABRICA' && ev.totem_concluido_em" class="agenda-card__chip agenda-card__chip--totem-ok">
                        <i class="pi pi-check-circle text-[8px] mr-0.5" />Totem OK
                      </span>
                    </div>

                    <!-- Conteúdo -->
                    <p class="agenda-card__title">{{ ev.titulo || 'Tarefa sem título' }}</p>
                    <p class="agenda-card__client">
                      <i class="pi pi-user text-[9px]" />{{ nomeCliente(ev) }}
                    </p>
                    <div v-if="ev.inicio_em" class="agenda-card__date">
                      <i class="pi pi-calendar text-[9px]" />
                      {{ formatarData(ev.inicio_em) }} · {{ formatarHora(ev.inicio_em) }}–{{ formatarHora(ev.fim_em) }}
                    </div>

                    <!-- Equipe -->
                    <div v-if="ev.equipe?.length" class="agenda-card__team">
                      <span
                        v-for="eq in ev.equipe.slice(0, 3)"
                        :key="eq.funcionario?.id || eq.funcionario_id"
                        class="agenda-card__avatar"
                        :title="eq.funcionario?.nome"
                      >{{ (eq.funcionario?.nome || 'F').charAt(0) }}</span>
                      <span v-if="ev.equipe.length > 3" class="agenda-card__avatar agenda-card__avatar--more">+{{ ev.equipe.length - 3 }}</span>
                    </div>

                    <!-- Ações -->
                    <div class="agenda-card__actions">
                      <button v-if="podeCriar" type="button" class="agenda-card__action-btn" :disabled="salvandoStatus" @click.stop="abrirModalEditar(ev)">
                        <i class="pi pi-pencil text-[9px]" />Editar
                      </button>
                      <button v-if="podeAvancar(ev)" type="button" class="agenda-card__action-btn" :class="proximoStatusClass(ev)" :disabled="salvandoStatus" @click.stop="avancarExecucao(ev)">
                        <i class="pi text-[9px]" :class="proximoStatusIcon(ev)" />{{ proximoStatusLabel(ev) }}
                      </button>
                      <button v-if="podeCriarNaOperacao && (ev.execucao_etapa || '').toUpperCase() === 'CONCLUIDO' && proximaSubetapaInfo(ev)" type="button" class="agenda-card__action-btn agenda-card__action-btn--next" :disabled="salvandoStatus" @click.stop="abrirModalCriar(null, proximaSubetapaInfo(ev).key, ev)">
                        <i class="pi pi-arrow-right text-[9px]" />{{ proximaSubetapaInfo(ev).label }}
                      </button>
                      <button v-if="podeCriar && ev._setor === 'FABRICA' && ev.totem_concluido_em && (ev.status || '').toUpperCase() !== 'CONCLUIDO'" type="button" class="agenda-card__action-btn agenda-card__action-btn--encerrar" :disabled="salvandoStatus" @click.stop="encerrarTarefa(ev)">
                        <i class="pi pi-flag-fill text-[9px]" />Encerrar
                      </button>
                      <button v-if="podeCriar" type="button" class="agenda-card__action-btn agenda-card__action-btn--danger ml-auto" :disabled="salvandoStatus" @click.stop="excluirEvento(ev)">
                        <i class="pi pi-trash text-[9px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ TIMELINE ═══ -->
      <div v-else class="agenda-page__timeline">
        <!-- Header timeline -->
        <div class="agenda-page__timeline-header">
          <span class="agenda-page__timeline-title">Timeline</span>
          <span class="agenda-page__timeline-count">{{ eventosFiltradosTimeline.length }} tarefa(s)</span>
        </div>

        <!-- Empty -->
        <div v-if="eventosFiltradosTimeline.length === 0" class="agenda-page__empty">
          <i class="pi pi-calendar-times agenda-page__empty-icon" />
          <p class="agenda-page__empty-title">Nada agendado neste período</p>
          <p class="agenda-page__empty-desc">Altere o período ou mude para o Kanban.</p>
          <button v-if="visaoAgenda === 'OPERACAO'" type="button" class="agenda-page__btn-outline mt-4" @click="abrirModalCriar()">
            <i class="pi pi-plus text-xs mr-1.5" />Nova tarefa
          </button>
        </div>

        <div v-else class="agenda-page__timeline-body">
          <div v-for="grupo in gruposTimeline" :key="grupo.data" class="agenda-page__tl-group">
            <!-- Data -->
            <div class="agenda-page__tl-date">
              <span class="agenda-page__tl-date-label">{{ grupo.dataLabel }}</span>
            </div>

            <!-- Itens -->
            <div class="agenda-page__tl-items">
              <div
                v-for="ev in grupo.eventos"
                :key="`${ev._setor}-${ev.id}`"
                class="agenda-tl-item"
                :class="borderExecucao(ev)"
              >
                <!-- Avatar + info -->
                <div class="agenda-tl-item__left">
                  <div class="agenda-tl-item__avatar" :class="ev._setor === 'FABRICA' ? 'agenda-tl-item__avatar--fabrica' : 'agenda-tl-item__avatar--loja'">
                    {{ iniciaisEvento(ev) }}
                  </div>
                  <div class="agenda-tl-item__info">
                    <p class="agenda-tl-item__title">{{ ev.titulo || labelSubetapa(ev) || 'Tarefa' }}</p>
                    <p class="agenda-tl-item__client">{{ nomeCliente(ev) }}</p>
                    <div class="agenda-tl-item__chips">
                      <span class="agenda-card__chip agenda-card__chip--xs" :class="badgeExecucao(ev)">{{ textoPrioridadeBadge(ev) }}</span>
                      <span class="agenda-card__chip agenda-card__chip--xs" :class="ev._setor === 'FABRICA' ? 'agenda-card__chip--fabrica' : 'agenda-card__chip--loja'">{{ ev._setor === 'FABRICA' ? 'Fábrica' : 'Loja' }}</span>
                      <span class="agenda-card__chip agenda-card__chip--xs agenda-card__chip--neutral">{{ labelSubetapa(ev) }}</span>
                      <span v-if="ev._setor === 'FABRICA' && ev.totem_concluido_em" class="agenda-card__chip agenda-card__chip--xs agenda-card__chip--totem-ok">
                        <i class="pi pi-check-circle text-[8px] mr-0.5" />Totem OK
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Hora + ações -->
                <div class="agenda-tl-item__right">
                  <div v-if="ev.inicio_em" class="agenda-tl-item__time">
                    {{ formatarHora(ev.inicio_em) }}<span class="opacity-40 mx-0.5">–</span>{{ formatarHora(ev.fim_em) }}
                  </div>
                  <div class="agenda-card__actions">
                    <button v-if="podeCriar" type="button" class="agenda-card__action-btn" :disabled="salvandoStatus" @click.stop="abrirModalEditar(ev)">
                      <i class="pi pi-pencil text-[9px]" />Editar
                    </button>
                    <button v-if="podeAvancar(ev)" type="button" class="agenda-card__action-btn" :class="proximoStatusClass(ev)" :disabled="salvandoStatus" @click.stop="avancarExecucao(ev)">
                      <i class="pi text-[9px]" :class="proximoStatusIcon(ev)" />{{ proximoStatusLabel(ev) }}
                    </button>
                    <button v-if="podeCriarNaOperacao && (ev.execucao_etapa || '').toUpperCase() === 'CONCLUIDO' && proximaSubetapaInfo(ev)" type="button" class="agenda-card__action-btn agenda-card__action-btn--next" :disabled="salvandoStatus" @click.stop="abrirModalCriar(null, proximaSubetapaInfo(ev).key, ev)">
                      <i class="pi pi-arrow-right text-[9px]" />{{ proximaSubetapaInfo(ev).label }}
                    </button>
                    <button v-if="podeCriar && ev._setor === 'FABRICA' && ev.totem_concluido_em && (ev.status || '').toUpperCase() !== 'CONCLUIDO'" type="button" class="agenda-card__action-btn agenda-card__action-btn--encerrar" :disabled="salvandoStatus" @click.stop="encerrarTarefa(ev)">
                      <i class="pi pi-flag-fill text-[9px]" />Encerrar
                    </button>
                    <button v-if="podeCriar" type="button" class="agenda-card__action-btn agenda-card__action-btn--danger ml-auto" :disabled="salvandoStatus" @click.stop="excluirEvento(ev)">
                      <i class="pi pi-trash text-[9px]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>

    <!-- ═══════════════════════ MODAL CRIAR / EDITAR TAREFA ═══════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="modalCriar"
          class="ds-modal-overlay"
          style="z-index: 50;"
          @mousedown.self="fecharModal"
        >
          <div
            class="relative w-full max-w-xl max-h-[92vh] overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 shadow-2xl"
            style="border-color: var(--ds-color-border);"
          >
            <!-- Header -->
            <div class="flex items-center justify-between gap-3 px-6 pt-5 pb-4 border-b" style="border-color: var(--ds-color-border);">
              <div class="min-w-0">
                <h2 class="text-base font-bold tracking-tight" style="color: var(--ds-color-text);">
                  {{ modalModo === 'EDITAR' ? 'Editar Tarefa' : 'Nova Tarefa' }}
                </h2>
                <p class="text-xs mt-0.5" style="color: var(--ds-color-text-soft);">
                  {{ modalModo === 'EDITAR' ? 'Ajuste dados, horários e equipe' : 'Crie uma tarefa para qualquer etapa do fluxo' }}
                </p>
              </div>
              <button
                type="button"
                class="ds-nav-icon-button shrink-0"
                @click="fecharModal"
              >
                <i class="pi pi-times text-xs" />
              </button>
            </div>

            <!-- Body (scroll) -->
            <form class="overflow-y-auto max-h-[calc(92vh-8.5rem)]" @submit.prevent="salvarTarefa">
              <div class="px-6 py-5 space-y-5">

                <!-- ─── Setor destino (toggle segmentado) ─── -->
                <div class="ds-field">
                  <label class="ds-field-label">Setor de destino *</label>
                  <div class="ds-segmented w-full">
                    <button
                      v-for="s in SETORES"
                      :key="s.key"
                      type="button"
                      class="ds-segmented__button flex-1"
                      :class="form.setor_destino === s.key ? 'ds-segmented__button--active' : ''"
                      @click="onSetorChange(s.key)"
                    >
                      <i :class="s.icon" class="text-xs" />
                      {{ s.label }}
                    </button>
                  </div>
                </div>

                <!-- ─── Etapa / Subetapa (filtrada por setor) ─── -->
                <div class="ds-field">
                  <label class="ds-field-label">Etapa / Subetapa *</label>
                  <div class="ds-control-shell">
                    <select
                      v-model="form.subetapa"
                      required
                      class="ds-control-input px-3 text-sm"
                    >
                      <option value="" disabled>Selecione a subetapa...</option>
                      <optgroup v-for="m in macroetapasDoSetor" :key="m.key" :label="m.label">
                        <option v-for="sub in subetapasDoSetorPorMacro(m.key)" :key="sub.key" :value="sub.key">
                          {{ sub.label }}
                        </option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <!-- ─── Cliente ─── -->
                <div class="ds-field">
                  <label class="ds-field-label">Cliente</label>
                  <div class="ds-control-shell">
                    <i class="pi pi-search ds-control-icon ds-control-icon--left text-xs" />
                    <input
                      v-model="buscaCliente"
                      type="text"
                      placeholder="Buscar cliente..."
                      class="ds-control-input ds-control-input--with-prefix text-sm"
                      @input="debouncedBuscarClientes"
                      @focus="mostrarDropCliente = true"
                    />
                  </div>

                  <!-- Chip de cliente selecionado -->
                  <div v-if="form.cliente_id && clienteSelecionadoNome" class="flex items-center gap-2 mt-1.5">
                    <span class="ds-status-pill ds-status-pill--success">
                      <span class="ds-status-dot" style="background: var(--ds-color-success);" />
                      {{ clienteSelecionadoNome }}
                    </span>
                    <button type="button" class="text-xs hover:opacity-70 transition-opacity" style="color: var(--ds-color-danger);" @click="limparCliente">
                      <i class="pi pi-times text-[10px]" />
                    </button>
                  </div>

                  <!-- Dropdown clientes -->
                  <div
                    v-if="mostrarDropCliente && clientesOpcoes.length > 0"
                    class="mt-1.5 rounded-xl border shadow-lg max-h-44 overflow-y-auto z-10 relative"
                    style="border-color: var(--ds-color-border); background: var(--ds-color-surface);"
                  >
                    <button
                      v-for="cli in clientesOpcoes"
                      :key="clienteId(cli)"
                      type="button"
                      class="ds-search-option w-full text-left text-sm"
                      @click="selecionarCliente(cli)"
                    >
                      <span class="ds-search-option__dot" />
                      {{ nomeExibicaoCliente(cli) }}
                      <span v-if="cli.telefone" class="ml-auto text-[10px]" style="color: var(--ds-color-text-faint);">{{ cli.telefone }}</span>
                    </button>
                  </div>
                </div>

                <!-- ─── Nome livre (quando não há cliente cadastrado) ─── -->
                <div v-if="!form.cliente_id" class="ds-field">
                  <label class="ds-field-label">Nome do cliente <span class="font-normal text-[10px]" style="color: var(--ds-color-text-faint);">(opcional, quando não cadastrado)</span></label>
                  <div class="ds-control-shell">
                    <input
                      v-model="form.cliente_nome_livre"
                      type="text"
                      placeholder="Ex.: João Silva"
                      class="ds-control-input px-3 text-sm"
                    />
                  </div>
                </div>

                <!-- ─── Datas (grid 2 colunas) ─── -->
                <div class="grid grid-cols-2 gap-4">
                  <div class="ds-field">
                    <label class="ds-field-label">Início *</label>
                    <div class="ds-control-shell">
                      <input
                        v-model="form.inicio_em"
                        type="datetime-local"
                        required
                        class="ds-control-input px-3 text-sm"
                      />
                    </div>
                  </div>
                  <div class="ds-field">
                    <label class="ds-field-label">Término *</label>
                    <div class="ds-control-shell">
                      <input
                        v-model="form.fim_em"
                        type="datetime-local"
                        required
                        class="ds-control-input px-3 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <!-- ─── Equipe (multi-select) ─── -->
                <div class="ds-field">
                  <div class="flex items-center justify-between">
                    <label class="ds-field-label">
                      Equipe
                      <span v-if="form.equipe_ids.length" class="normal-case font-semibold ml-1" style="color: var(--ds-color-primary);">
                        ({{ form.equipe_ids.length }} selecionado{{ form.equipe_ids.length > 1 ? 's' : '' }})
                      </span>
                    </label>
                    <button
                      v-if="!painelEquipeAberto"
                      type="button"
                      class="ds-btn ds-btn--outline ds-btn--sm"
                      @click="abrirPainelEquipe"
                    >
                      <i class="pi pi-user-plus text-[10px]" />
                      Selecionar
                    </button>
                  </div>

                  <!-- Chips de equipe selecionada (resumo) -->
                  <div v-if="form.equipe_ids.length && !painelEquipeAberto" class="flex flex-wrap gap-1.5 mt-1.5">
                    <span
                      v-for="fid in form.equipe_ids"
                      :key="fid"
                      class="ds-chip"
                    >
                      {{ nomeFunc(fid) }}
                      <button type="button" class="ml-0.5 hover:opacity-70" style="color: var(--ds-color-danger);" @click="removerFunc(fid)">
                        <i class="pi pi-times text-[8px]" />
                      </button>
                    </span>
                  </div>

                  <!-- Painel de seleção múltipla (permanece aberto) -->
                  <div
                    v-if="painelEquipeAberto"
                    class="mt-1.5 rounded-xl border overflow-hidden"
                    style="border-color: var(--ds-color-border); background: var(--ds-color-surface);"
                  >
                    <!-- Barra de busca + ações em massa -->
                    <div class="px-3 py-2.5 border-b flex items-center gap-2" style="border-color: var(--ds-color-border); background: var(--ds-color-surface-muted);">
                      <div class="ds-control-shell flex-1">
                        <i class="pi pi-search ds-control-icon ds-control-icon--left text-[10px]" />
                        <input
                          ref="inputBuscaFuncRef"
                          v-model="buscaFunc"
                          type="text"
                          placeholder="Filtrar funcionários..."
                          class="ds-control-input ds-control-input--with-prefix text-xs"
                          style="height: 2rem; border-radius: 0.6rem;"
                          @input="debouncedBuscarFuncionarios"
                        />
                      </div>
                      <button
                        type="button"
                        class="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 h-7 rounded-md transition-colors"
                        style="color: var(--ds-color-primary);"
                        @click="marcarTodosFuncionarios"
                      >
                        {{ todosJaSelecionados ? 'Desmarcar todos' : 'Marcar todos' }}
                      </button>
                    </div>

                    <!-- Lista de funcionários (checkbox visual) -->
                    <div class="max-h-48 overflow-y-auto">
                      <div v-if="funcionariosOpcoes.length === 0" class="px-3 py-4 text-center text-xs" style="color: var(--ds-color-text-faint);">
                        <i class="pi pi-users text-lg block mb-1 opacity-40" />
                        {{ buscaFunc.trim() ? 'Nenhum resultado' : 'Carregando...' }}
                      </div>
                      <button
                        v-for="fn in funcionariosOpcoes"
                        :key="fn.id"
                        type="button"
                        class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
                        :style="form.equipe_ids.includes(fn.id)
                          ? 'background: rgba(22, 124, 92, 0.07); color: var(--ds-color-text);'
                          : 'color: var(--ds-color-text-soft);'"
                        @click="toggleFuncionario(fn)"
                      >
                        <span
                          class="w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-all"
                          :style="form.equipe_ids.includes(fn.id)
                            ? 'background: var(--ds-color-success); border-color: var(--ds-color-success);'
                            : 'background: transparent; border-color: var(--ds-color-border-strong);'"
                        >
                          <i v-if="form.equipe_ids.includes(fn.id)" class="pi pi-check text-[9px] text-white" />
                        </span>
                        <span class="truncate flex-1" :class="form.equipe_ids.includes(fn.id) ? 'font-semibold' : ''">{{ fn.nome }}</span>
                      </button>
                    </div>

                    <!-- Footer do painel -->
                    <div class="px-3 py-2 border-t flex items-center justify-between" style="border-color: var(--ds-color-border); background: var(--ds-color-surface-muted);">
                      <span class="text-[10px] font-semibold" style="color: var(--ds-color-text-faint);">
                        {{ form.equipe_ids.length }} de {{ funcionariosOpcoes.length }} selecionados
                      </span>
                      <button
                        type="button"
                        class="ds-btn ds-btn--primary ds-btn--sm"
                        @click="fecharPainelEquipe"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>

                  <!-- Horários individuais por funcionário -->
                  <div v-if="form.equipe_ids.length && !painelEquipeAberto" class="mt-4 space-y-2">
                    <p class="ds-eyebrow">Horário por funcionário</p>
                    <div
                      v-for="fid in form.equipe_ids"
                      :key="`exec-${fid}`"
                      class="rounded-xl border px-3 py-2.5"
                      style="border-color: var(--ds-color-border); background: var(--ds-color-surface-muted);"
                    >
                      <p class="text-xs font-semibold mb-2" style="color: var(--ds-color-text);">{{ nomeFunc(fid) }}</p>
                      <div class="grid grid-cols-2 gap-3">
                        <div class="ds-field">
                          <label class="ds-field-label">Início</label>
                          <input
                            :value="getExecucaoInicio(fid)"
                            type="datetime-local"
                            class="ds-control-input px-2 text-xs"
                            style="height: 2.25rem;"
                            @input="setExecucaoInicio(fid, $event.target.value)"
                          />
                        </div>
                        <div class="ds-field">
                          <label class="ds-field-label">Término</label>
                          <input
                            :value="getExecucaoFim(fid)"
                            type="datetime-local"
                            class="ds-control-input px-2 text-xs"
                            style="height: 2.25rem;"
                            @input="setExecucaoFim(fid, $event.target.value)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Erro do modal -->
                <div v-if="erroModal" class="ds-alert ds-alert--danger text-xs font-medium">
                  <i class="pi pi-exclamation-triangle text-sm mr-1.5" />
                  {{ erroModal }}
                </div>
              </div>

              <!-- Footer fixo -->
              <div class="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t" style="border-color: var(--ds-color-border); background: var(--ds-color-surface);">
                <button
                  type="button"
                  class="ds-btn ds-btn--secondary ds-btn--md"
                  @click="fecharModal"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="ds-btn ds-btn--primary ds-btn--md"
                  :disabled="salvandoCriar"
                >
                  <i v-if="salvandoCriar" class="pi pi-spin pi-spinner text-xs" />
                  {{ salvandoCriar ? (modalModo === 'EDITAR' ? 'Salvando...' : 'Criando...') : (modalModo === 'EDITAR' ? 'Salvar alterações' : 'Criar Tarefa') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

  </PageShell>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AgendaGeralService, AgendaLojaService, AgendaFabricaService, ClienteService, FuncionariosService } from '@/services'
import { can } from '@/services/permissions'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'

definePage({ meta: { perm: ['agendamentos.ver', 'agendamentos.vendas', 'agendamentos.producao'] } })

// ─── Constantes ───
/** Borda superior 4px nos cards KPI: Comercial azul, Eng roxo, Fábrica laranja, Logística verde, Pós-venda rosa */
const MACRO_ETAPAS = [
  { key: 'COMERCIAL', label: 'Comercial', bgClass: 'bg-blue-500', textClass: 'text-blue-600 dark:text-blue-400', borderClass: 'border-blue-300 dark:border-blue-700', headerBgClass: 'bg-blue-50 dark:bg-blue-900/20', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', kpiTopBorder: 'border-t-4 border-t-blue-600', badgeActiveClass: 'bg-blue-600 text-white border-blue-600' },
  { key: 'ENGENHARIA', label: 'Engenharia', bgClass: 'bg-violet-500', textClass: 'text-violet-600 dark:text-violet-400', borderClass: 'border-violet-300 dark:border-violet-700', headerBgClass: 'bg-violet-50 dark:bg-violet-900/20', badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', kpiTopBorder: 'border-t-4 border-t-violet-600', badgeActiveClass: 'bg-violet-600 text-white border-violet-600' },
  { key: 'FABRICA', label: 'Fábrica', bgClass: 'bg-amber-500', textClass: 'text-amber-600 dark:text-amber-400', borderClass: 'border-amber-300 dark:border-amber-700', headerBgClass: 'bg-amber-50 dark:bg-amber-900/20', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', kpiTopBorder: 'border-t-4 border-t-orange-500', badgeActiveClass: 'bg-orange-500 text-white border-orange-500' },
  { key: 'LOGISTICA', label: 'Logística', bgClass: 'bg-teal-500', textClass: 'text-teal-600 dark:text-teal-400', borderClass: 'border-teal-300 dark:border-teal-700', headerBgClass: 'bg-teal-50 dark:bg-teal-900/20', badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300', kpiTopBorder: 'border-t-4 border-t-green-600', badgeActiveClass: 'bg-green-600 text-white border-green-600' },
  { key: 'POS_VENDA', label: 'Pós-Venda', bgClass: 'bg-rose-500', textClass: 'text-rose-600 dark:text-rose-400', borderClass: 'border-rose-300 dark:border-rose-700', headerBgClass: 'bg-rose-50 dark:bg-rose-900/20', badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', kpiTopBorder: 'border-t-4 border-t-rose-500', badgeActiveClass: 'bg-rose-500 text-white border-rose-500' },
]

const EXECUCAO_FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'AGENDADO', label: 'Agendado' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'CONCLUIDO', label: 'Concluído' },
]
const SETORES = [
  { key: 'LOJA', label: 'Loja', icon: 'pi pi-shop', activeClass: 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-600 dark:bg-sky-900/30 dark:text-sky-300' },
  { key: 'FABRICA', label: 'Fábrica', icon: 'pi pi-building', activeClass: 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' },
]

// Subetapas do catálogo com próximas subetapas
const SUBETAPAS_CATALOGO = [
  { key: 'CADASTRO', label: 'Cadastro', macroetapa: 'COMERCIAL', ordem: 5, proximaSubetapa: 'MEDIDA' },
  { key: 'MEDIDA', label: 'Medição inicial', macroetapa: 'COMERCIAL', ordem: 10, proximaSubetapa: 'ORCAMENTO' },
  { key: 'ORCAMENTO', label: 'Orçamento', macroetapa: 'COMERCIAL', ordem: 20, proximaSubetapa: 'APRESENTACAO' },
  { key: 'APRESENTACAO', label: 'Apresentação', macroetapa: 'COMERCIAL', ordem: 30, proximaSubetapa: 'FECHAMENTO' },
  { key: 'FECHAMENTO', label: 'Fechamento', macroetapa: 'COMERCIAL', ordem: 40, proximaSubetapa: 'MEDIDA_FINA' },
  { key: 'MEDIDA_FINA', label: 'Medida fina', macroetapa: 'ENGENHARIA', ordem: 50, proximaSubetapa: 'PROJETO_TECNICO' },
  { key: 'PROJETO_TECNICO', label: 'Projeto técnico', macroetapa: 'ENGENHARIA', ordem: 60, proximaSubetapa: 'PRODUCAO' },
  { key: 'PRODUCAO', label: 'Produção', macroetapa: 'FABRICA', ordem: 70, proximaSubetapa: 'ENTREGA' },
  { key: 'SERVICO_CORTE_FITA_BORDA', label: 'Serviço de Corte e Fita de Borda', macroetapa: 'FABRICA', ordem: 75, proximaSubetapa: null },
  { key: 'ENTREGA', label: 'Material carregado', macroetapa: 'LOGISTICA', ordem: 80, proximaSubetapa: 'MONTAGEM' },
  { key: 'MONTAGEM', label: 'Montagem', macroetapa: 'LOGISTICA', ordem: 90, proximaSubetapa: 'GARANTIA' },
  { key: 'GARANTIA', label: 'Garantia', macroetapa: 'POS_VENDA', ordem: 100, proximaSubetapa: null },
  { key: 'ASSISTENCIA', label: 'Assistência', macroetapa: 'POS_VENDA', ordem: 101, proximaSubetapa: null },
  { key: 'MANUTENCAO', label: 'Manutenção', macroetapa: 'POS_VENDA', ordem: 102, proximaSubetapa: null },
]
const SUBETAPA_POR_KEY = Object.fromEntries(SUBETAPAS_CATALOGO.map((s) => [s.key, s]))

/** Subetapas que não viram coluna no kanban (ex.: cadastro = status do cliente, não etapa operacional). */
function subetapaOcultaNaUI(key) {
  return String(key || '').toUpperCase() === 'CADASTRO'
}

const router = useRouter()

// ─── Permissões ───
const podeCriar = computed(() => {
  return can('agendamentos.criar')
    || can('agendamentos.vendas')
    || can('agendamentos.producao')
    || can('agendamentos.ver')
})

// ─── Estado principal ───
const loading = ref(false)
const erro = ref('')
const eventos = ref([])
/** Eventos exibidos no board (oculta CADASTRO — tratado como status, não coluna). */
const eventosVisiveisAgenda = computed(() =>
  eventos.value.filter((ev) => String(ev?.subetapa || '').toUpperCase() !== 'CADASTRO'),
)
const catalogoSubetapas = ref(SUBETAPAS_CATALOGO)
const busca = ref('')
const filtroMacroetapa = ref('')
const filtroExecucao = ref('')
/** Operação = só tarefas não arquivadas; Arquivo = concluídas gravadas com arquivado_em. */
const visaoAgenda = ref('OPERACAO')
/** Filtra pela data de início da tarefa (início agendado). */
const periodoAgenda = ref('TODOS')
const modoVisualizacao = ref('KANBAN')

const podeCriarNaOperacao = computed(
  () => podeCriar.value && visaoAgenda.value === 'OPERACAO',
)
const salvandoStatus = ref(false)

// ─── Estado do modal ───
const modalCriar = ref(false)
const salvandoCriar = ref(false)
const erroModal = ref('')
const modalModo = ref('CRIAR') // CRIAR | EDITAR
const eventoEdicao = ref(null)
const buscaCliente = ref('')
const clientesOpcoes = ref([])
const mostrarDropCliente = ref(false)
const clienteSelecionadoNome = ref('')
const buscaFunc = ref('')
const funcionariosOpcoes = ref([])
const mostrarDropFunc = ref(false)
const funcionariosCache = ref({}) // id -> nome
const inputBuscaFuncRef = ref(null)
const painelEquipeAberto = ref(false)
const execucoesEquipe = ref({}) // funcionario_id -> { inicio_em, fim_em }

const formBase = () => ({
  setor_destino: 'LOJA',
  subetapa: '',
  titulo: '',
  inicio_em: '',
  fim_em: '',
  cliente_id: null,
  cliente_nome_livre: '',
  venda_id: null,
  equipe_ids: [],
  origem_fluxo: 'TAREFA',
})
const form = ref(formBase())

// ─── Debounce ───
let debounceTimer = null
function debouncedCarregar() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(carregar, 400)
}

let debounceCliente = null
function debouncedBuscarClientes() {
  mostrarDropCliente.value = true
  clearTimeout(debounceCliente)
  debounceCliente = setTimeout(buscarClientes, 300)
}

let debounceFunc = null
function debouncedBuscarFuncionarios() {
  mostrarDropFunc.value = true
  clearTimeout(debounceFunc)
  debounceFunc = setTimeout(buscarFuncionarios, 300)
}

// ─── Macroetapa toggle / computeds ───
function toggleMacroetapa(key) {
  filtroMacroetapa.value = filtroMacroetapa.value === key ? '' : key
  carregar()
}

/** Badges de etapa na barra: “Todas” limpa; clique na mesma etapa desliga o filtro. */
function setFiltroMacroetapa(key) {
  if (key === '') {
    if (filtroMacroetapa.value !== '') {
      filtroMacroetapa.value = ''
      carregar()
    }
    return
  }
  toggleMacroetapa(key)
}

/** Badges de status: “Todos” limpa; clique repetido no mesmo status volta a “todos”. */
function setFiltroExecucao(v) {
  if (v === '') {
    if (filtroExecucao.value !== '') {
      filtroExecucao.value = ''
      carregar()
    }
    return
  }
  filtroExecucao.value = filtroExecucao.value === v ? '' : v
  carregar()
}

const macroetapasVisiveis = computed(() => {
  if (filtroMacroetapa.value) {
    return MACRO_ETAPAS.filter((m) => m.key === filtroMacroetapa.value)
  }
  return MACRO_ETAPAS.filter((m) => eventosPorMacro(m.key).length > 0)
})

function eventosPorMacro(macroKey) {
  return eventosVisiveisAgenda.value.filter((ev) => ev.macroetapa === macroKey)
}
function eventosPorSubetapa(subKey) {
  return eventosVisiveisAgenda.value.filter((ev) => ev.subetapa === subKey)
}
function subetapasDaMacro(macroKey) {
  return catalogoSubetapas.value
    .filter((s) => s.macroetapa === macroKey && !subetapaOcultaNaUI(s.key))
    .sort((a, b) => a.ordem - b.ordem)
}
function subetapasPorMacro(macroKey) {
  return SUBETAPAS_CATALOGO.filter((s) => s.macroetapa === macroKey && !subetapaOcultaNaUI(s.key))
}

const MACROS_LOJA = ['COMERCIAL']
const MACROS_FABRICA = ['ENGENHARIA', 'FABRICA', 'LOGISTICA', 'POS_VENDA']

const macroetapasDoSetor = computed(() => {
  const setor = form.value.setor_destino
  const macros = setor === 'FABRICA' ? MACROS_FABRICA : MACROS_LOJA
  return MACRO_ETAPAS.filter((m) => macros.includes(m.key))
})

function subetapasDoSetorPorMacro(macroKey) {
  return SUBETAPAS_CATALOGO.filter((s) => s.macroetapa === macroKey && !subetapaOcultaNaUI(s.key))
}
function contadorMacroetapa(macroKey) {
  return eventosVisiveisAgenda.value.filter((ev) => ev.macroetapa === macroKey).length
}

const rotuloContadorMacro = computed(() =>
  visaoAgenda.value === 'ARQUIVO' ? 'no arquivo' : 'em operação',
)

function setVisaoAgenda(visao) {
  if (visaoAgenda.value === visao) return
  visaoAgenda.value = visao
  carregar()
}

const eventosFiltradosTimeline = computed(() => {
  return [...eventos.value].sort((a, b) => {
    const at = new Date(a?.inicio_em || 0).getTime()
    const bt = new Date(b?.inicio_em || 0).getTime()
    return at - bt
  })
})

const gruposTimeline = computed(() => {
  const grupos = []
  const mapa = new Map()

  for (const ev of eventosFiltradosTimeline.value) {
    const dt = new Date(ev?.inicio_em || ev?.fim_em || Date.now())
    const data = Number.isNaN(dt.getTime())
      ? 'sem-data'
      : `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`

    if (!mapa.has(data)) {
      const dataLabel = Number.isNaN(dt.getTime())
        ? 'Sem data'
        : dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
      mapa.set(data, { data, dataLabel, eventos: [] })
      grupos.push(mapa.get(data))
    }
    mapa.get(data).eventos.push(ev)
  }

  return grupos
})

// ─── Estilos (prioridade temporal: vermelho #dc2626 atrasado, âmbar #f59e0b urgente, cinza normal) ───
/** Atrasado = fim passou e não concluído; Urgente = fim nas próximas 24h e não concluído. */
function prioridadeTemporal(ev) {
  const exec = String(ev?.execucao_etapa || ev?.status || '').toUpperCase()
  if (exec === 'CONCLUIDO') return 'normal'
  const fim = ev?.fim_em ? new Date(ev.fim_em).getTime() : null
  if (fim == null || Number.isNaN(fim)) return 'normal'
  const now = Date.now()
  if (fim < now) return 'atrasado'
  const ms24h = 24 * 60 * 60 * 1000
  if (fim - now <= ms24h) return 'urgente'
  return 'normal'
}

function borderExecucao(ev) {
  const p = prioridadeTemporal(ev)
  if (p === 'atrasado') return 'border-l-4 !border-l-[#dc2626]'
  if (p === 'urgente') return 'border-l-4 !border-l-[#f59e0b]'
  return 'border-l-4 border-l-slate-400 dark:border-l-slate-500'
}

function badgeExecucao(ev) {
  const p = prioridadeTemporal(ev)
  if (p === 'atrasado') {
    return 'bg-red-50 text-[#dc2626] dark:bg-red-950/35 dark:text-red-400'
  }
  if (p === 'urgente') {
    return 'bg-amber-50 text-[#f59e0b] dark:bg-amber-950/30 dark:text-amber-400'
  }
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
}

function textoPrioridadeBadge(ev) {
  const p = prioridadeTemporal(ev)
  if (p === 'atrasado') return 'Atrasado'
  if (p === 'urgente') return 'Urgente'
  return labelExecucao(ev)
}
function labelExecucao(ev) {
  switch ((ev.execucao_etapa || '').toUpperCase()) {
    case 'PENDENTE': return 'Pendente'
    case 'AGENDADO': return 'Agendado'
    case 'EM_ANDAMENTO': return 'Em andamento'
    case 'CONCLUIDO': return 'Concluído'
    default: return ev.execucao_etapa || ev.status || '—'
  }
}

// ─── Formatação ───
function nomeCliente(ev) {
  return ev?.cliente?.nome_completo || ev?.cliente?.razao_social || ev?.cliente_nome_livre || 'Cliente não informado'
}
function formatarData(valor) {
  const dt = new Date(valor)
  if (Number.isNaN(dt.getTime())) return '--/--/----'
  return dt.toLocaleDateString('pt-BR')
}
function formatarHora(valor) {
  const dt = new Date(valor)
  if (Number.isNaN(dt.getTime())) return '--:--'
  return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function labelSubetapa(ev) {
  return SUBETAPA_POR_KEY[(ev?.subetapa || '').toUpperCase()]?.label || ev?.subetapa || 'Subetapa não informada'
}

function iniciaisEvento(ev) {
  const base = (ev?.titulo || labelSubetapa(ev) || '').trim()
  if (!base) return 'EV'
  const partes = base.split(/\s+/).filter(Boolean)
  return (partes[0]?.[0] || 'E') + (partes[1]?.[0] || partes[0]?.[1] || 'V')
}

// ─── Ações rápidas nos cards ───
function podeAvancar(ev) {
  const exec = (ev.execucao_etapa || '').toUpperCase()
  return exec !== 'CONCLUIDO'
}

function proximoStatus(ev) {
  const exec = (ev.execucao_etapa || '').toUpperCase()
  if (exec === 'PENDENTE') return 'EM_ANDAMENTO'
  if (exec === 'AGENDADO') return 'EM_ANDAMENTO'
  if (exec === 'EM_ANDAMENTO') return 'CONCLUIDO'
  return null
}

function proximoStatusLabel(ev) {
  const prox = proximoStatus(ev)
  if (prox === 'EM_ANDAMENTO') return 'Iniciar'
  if (prox === 'CONCLUIDO') return 'Concluir'
  return ''
}

function proximoStatusIcon(ev) {
  const prox = proximoStatus(ev)
  if (prox === 'EM_ANDAMENTO') return 'pi-play'
  if (prox === 'CONCLUIDO') return 'pi-check'
  return ''
}

function proximoStatusClass(ev) {
  const prox = proximoStatus(ev)
  if (prox === 'EM_ANDAMENTO') return 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300'
  if (prox === 'CONCLUIDO') return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300'
  return 'bg-slate-100 text-slate-600'
}

function proximaSubetapaInfo(ev) {
  const subKey = (ev.subetapa || '').toUpperCase()
  const atual = SUBETAPA_POR_KEY[subKey]
  if (!atual?.proximaSubetapa) return null
  return SUBETAPA_POR_KEY[atual.proximaSubetapa] || null
}

async function avancarExecucao(ev) {
  const prox = proximoStatus(ev)
  if (!prox) return
  salvandoStatus.value = true
  try {
    const service = ev._setor === 'FABRICA' ? AgendaFabricaService : AgendaLojaService
    await service.atualizarStatus(ev.id, { status: prox, subetapa: ev.subetapa })
    await carregar()
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao atualizar status.'
  } finally {
    salvandoStatus.value = false
  }
}

async function encerrarTarefa(ev) {
  if (ev._setor !== 'FABRICA') return
  const ok = await confirm('Encerrar tarefa?', `Confirma o encerramento de "${ev.titulo || 'esta tarefa'}"? Ela será arquivada e não aparecerá mais na operação.`)
  if (!ok) return
  salvandoStatus.value = true
  try {
    await AgendaFabricaService.encerrar(ev.id)
    await carregar()
    notify('Tarefa encerrada com sucesso.', 'success')
  } catch (e) {
    notify(e?.response?.data?.message || 'Erro ao encerrar a tarefa.', 'error')
  } finally {
    salvandoStatus.value = false
  }
}

// ─── Excluir tarefa ───
async function excluirEvento(ev) {
  const titulo = ev?.titulo || 'esta tarefa'
  const ok = await confirm.show('Excluir tarefa', `Deseja excluir "${titulo}"? Esta ação não pode ser desfeita.`)
  if (!ok) return
  try {
    const service = ev._setor === 'FABRICA' ? AgendaFabricaService : AgendaLojaService
    await service.excluir(ev.id)
    notify.success('Tarefa excluída.')
    await carregar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível excluir a tarefa.')
  }
}

// ─── Modal Criar ───
function abrirModalCriar(macroetapa, subetapa, eventoOrigem) {
  modalModo.value = 'CRIAR'
  eventoEdicao.value = null
  form.value = formBase()
  erroModal.value = ''
  buscaCliente.value = ''
  clientesOpcoes.value = []
  clienteSelecionadoNome.value = ''
  buscaFunc.value = ''
  funcionariosOpcoes.value = []
  mostrarDropCliente.value = false
  mostrarDropFunc.value = false
  painelEquipeAberto.value = false
  execucoesEquipe.value = {}

  // Pré-preencher subetapa se fornecida
  if (subetapa) {
    form.value.subetapa = subetapa
  } else if (macroetapa) {
    const primeira = SUBETAPAS_CATALOGO.find((s) => s.macroetapa === macroetapa && !subetapaOcultaNaUI(s.key))
    if (primeira) form.value.subetapa = primeira.key
  }

  // Pré-preencher datas (hoje, +1 hora)
  const agora = new Date()
  agora.setMinutes(0, 0, 0)
  const fim = new Date(agora)
  fim.setHours(agora.getHours() + 1)
  form.value.inicio_em = toLocalISOString(agora)
  form.value.fim_em = toLocalISOString(fim)

  // Herdar cliente do evento de origem (quando avança subetapa)
  if (eventoOrigem) {
    form.value.cliente_id = eventoOrigem.cliente_id || eventoOrigem?.cliente?.id || null
    form.value.venda_id = eventoOrigem.venda_id || null
    clienteSelecionadoNome.value = nomeCliente(eventoOrigem)
    buscaCliente.value = clienteSelecionadoNome.value
  }

  // Subetapa → setor sugerido
  const subInfo = SUBETAPA_POR_KEY[form.value.subetapa]
  if (subInfo) {
    const macro = subInfo.macroetapa
    if (macro === 'FABRICA' || macro === 'LOGISTICA') {
      form.value.setor_destino = 'FABRICA'
    }
  }

  modalCriar.value = true
}

function abrirModalEditar(ev) {
  modalModo.value = 'EDITAR'
  eventoEdicao.value = ev
  form.value = formBase()
  erroModal.value = ''
  buscaCliente.value = ''
  clientesOpcoes.value = []
  clienteSelecionadoNome.value = ''
  buscaFunc.value = ''
  funcionariosOpcoes.value = []
  mostrarDropCliente.value = false
  mostrarDropFunc.value = false
  painelEquipeAberto.value = false
  execucoesEquipe.value = {}

  form.value.setor_destino = ev?._setor === 'FABRICA' ? 'FABRICA' : 'LOJA'
  form.value.subetapa = ev?.subetapa || ''
  form.value.inicio_em = ev?.inicio_em ? toLocalISOString(new Date(ev.inicio_em)) : ''
  form.value.fim_em = ev?.fim_em ? toLocalISOString(new Date(ev.fim_em)) : ''
  form.value.cliente_id = ev?.cliente_id || ev?.cliente?.id || null
  form.value.cliente_nome_livre = ev?.cliente_nome_livre || ''
  form.value.venda_id = ev?.venda_id || null
  form.value.equipe_ids = Array.isArray(ev?.equipe)
    ? ev.equipe.map((eq) => Number(eq?.funcionario_id || eq?.funcionario?.id)).filter(Boolean)
    : []
  sincronizarExecucoesEquipe()

  if (ev?.cliente) {
    clienteSelecionadoNome.value = nomeCliente(ev)
    buscaCliente.value = clienteSelecionadoNome.value
  }
  for (const eq of ev?.equipe || []) {
    if (eq?.funcionario_id && eq?.funcionario?.nome) {
      funcionariosCache.value[eq.funcionario_id] = eq.funcionario.nome
    }
  }

  modalCriar.value = true
}

async function abrirModalEditarEquipe(ev) {
  abrirModalEditar(ev)
  await nextTick()
  mostrarDropFunc.value = true
  buscaFunc.value = ''
  await buscarFuncionarios()
  inputBuscaFuncRef.value?.focus()
}

async function abrirPainelEquipe() {
  painelEquipeAberto.value = true
  buscaFunc.value = ''
  await buscarFuncionarios()
  await nextTick()
  inputBuscaFuncRef.value?.focus()
}

function fecharPainelEquipe() {
  painelEquipeAberto.value = false
  sincronizarExecucoesEquipe()
}

const todosJaSelecionados = computed(() => {
  if (funcionariosOpcoes.value.length === 0) return false
  return funcionariosOpcoes.value.every((fn) => form.value.equipe_ids.includes(fn.id))
})

function marcarTodosFuncionarios() {
  if (todosJaSelecionados.value) {
    for (const fn of funcionariosOpcoes.value) {
      const idx = form.value.equipe_ids.indexOf(fn.id)
      if (idx >= 0) {
        form.value.equipe_ids.splice(idx, 1)
        delete execucoesEquipe.value[fn.id]
      }
    }
  } else {
    for (const fn of funcionariosOpcoes.value) {
      funcionariosCache.value[fn.id] = fn.nome
      if (!form.value.equipe_ids.includes(fn.id)) {
        form.value.equipe_ids.push(fn.id)
        if (!execucoesEquipe.value[fn.id]) {
          execucoesEquipe.value[fn.id] = {
            inicio_em: form.value.inicio_em || '',
            fim_em: form.value.fim_em || '',
          }
        }
      }
    }
  }
}

async function focarBuscaFuncionario() {
  await abrirPainelEquipe()
}

function onSetorChange(key) {
  if (form.value.setor_destino === key) return
  form.value.setor_destino = key
  form.value.subetapa = ''
  form.value.cliente_id = null
  form.value.venda_id = null
  clienteSelecionadoNome.value = ''
  buscaCliente.value = ''
  clientesOpcoes.value = []
}

function fecharModal() {
  modalCriar.value = false
  eventoEdicao.value = null
  execucoesEquipe.value = {}
}

function toLocalISOString(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ─── Busca de clientes ───
async function buscarClientes() {
  const q = buscaCliente.value.trim()
  if (q.length < 2) { clientesOpcoes.value = []; return }
  try {
    const { data } = await ClienteService.select(q)
    clientesOpcoes.value = Array.isArray(data) ? data.slice(0, 15) : []
  } catch { clientesOpcoes.value = [] }
}

function nomeExibicaoCliente(cli) {
  return cli?.label || cli?.nome_completo || cli?.razao_social || cli?.nome || `Cliente #${clienteId(cli) || ''}`
}

function clienteId(cli) {
  if (cli?.id != null) return Number(cli.id)
  if (cli?.value != null) return Number(cli.value)
  return null
}

function selecionarCliente(cli) {
  const id = clienteId(cli)
  form.value.cliente_id = id
  if (cli?.venda_id) form.value.venda_id = cli.venda_id
  clienteSelecionadoNome.value = nomeExibicaoCliente(cli)
  buscaCliente.value = clienteSelecionadoNome.value
  mostrarDropCliente.value = false
  clientesOpcoes.value = []
}

function limparCliente() {
  form.value.cliente_id = null
  clienteSelecionadoNome.value = ''
  buscaCliente.value = ''
}

// ─── Busca de funcionários ───
async function buscarFuncionarios() {
  const q = buscaFunc.value.trim()
  try {
    const { data } = await FuncionariosService.select(q || undefined)
    const normalizados = Array.isArray(data)
      ? data
        .map((f) => ({
          id: Number(f?.id ?? f?.value),
          nome: f?.nome || f?.label || '',
        }))
        .filter((f) => Number.isFinite(f.id) && f.id > 0)
      : []
    funcionariosOpcoes.value = normalizados.slice(0, 20)
    // Cachear nomes
    funcionariosOpcoes.value.forEach((f) => { funcionariosCache.value[f.id] = f.nome })
  } catch { funcionariosOpcoes.value = [] }
}

function toggleFuncionario(fn) {
  const fnId = Number(fn?.id ?? fn?.value)
  const fnNome = fn?.nome || fn?.label || `Func. #${fnId}`
  if (!Number.isFinite(fnId) || fnId <= 0) return
  funcionariosCache.value[fnId] = fnNome
  const idx = form.value.equipe_ids.indexOf(fnId)
  if (idx >= 0) {
    form.value.equipe_ids.splice(idx, 1)
    delete execucoesEquipe.value[fnId]
  } else {
    form.value.equipe_ids.push(fnId)
    if (!execucoesEquipe.value[fnId]) {
      execucoesEquipe.value[fnId] = {
        inicio_em: form.value.inicio_em || '',
        fim_em: form.value.fim_em || '',
      }
    }
  }
}

function removerFunc(id) {
  form.value.equipe_ids = form.value.equipe_ids.filter((f) => f !== id)
  delete execucoesEquipe.value[id]
}

function nomeFunc(id) {
  return funcionariosCache.value[id] || `Func. #${id}`
}

function sincronizarExecucoesEquipe() {
  const next = {}
  for (const fid of form.value.equipe_ids || []) {
    next[fid] = {
      inicio_em: execucoesEquipe.value?.[fid]?.inicio_em || form.value.inicio_em || '',
      fim_em: execucoesEquipe.value?.[fid]?.fim_em || form.value.fim_em || '',
    }
  }
  execucoesEquipe.value = next
}

function getExecucaoInicio(fid) {
  return execucoesEquipe.value?.[fid]?.inicio_em || ''
}

function getExecucaoFim(fid) {
  return execucoesEquipe.value?.[fid]?.fim_em || ''
}

function setExecucaoInicio(fid, value) {
  if (!execucoesEquipe.value[fid]) {
    execucoesEquipe.value[fid] = { inicio_em: '', fim_em: '' }
  }
  execucoesEquipe.value[fid].inicio_em = value
}

function setExecucaoFim(fid, value) {
  if (!execucoesEquipe.value[fid]) {
    execucoesEquipe.value[fid] = { inicio_em: '', fim_em: '' }
  }
  execucoesEquipe.value[fid].fim_em = value
}

function buildApontamentosEquipe() {
  const out = []
  for (const fid of form.value.equipe_ids || []) {
    const linha = execucoesEquipe.value?.[fid]
    if (!linha?.inicio_em || !linha?.fim_em) {
      throw new Error(`Preencha início e término para ${nomeFunc(fid)}.`)
    }
    const ini = new Date(linha.inicio_em)
    const fim = new Date(linha.fim_em)
    if (Number.isNaN(ini.getTime()) || Number.isNaN(fim.getTime()) || fim <= ini) {
      throw new Error(`Horário inválido para ${nomeFunc(fid)}.`)
    }
    out.push({
      funcionario_id: Number(fid),
      inicio_em: ini.toISOString(),
      fim_em: fim.toISOString(),
    })
  }
  return out
}

// ─── Salvar tarefa ───
async function salvarTarefa() {
  erroModal.value = ''
  if (!form.value.subetapa) { erroModal.value = 'Selecione uma subetapa.'; return }
  if (!form.value.inicio_em || !form.value.fim_em) { erroModal.value = 'Datas são obrigatórias.'; return }

  salvandoCriar.value = true
  try {
    const service = form.value.setor_destino === 'FABRICA' ? AgendaFabricaService : AgendaLojaService
    const apontamentos = form.value.equipe_ids.length > 0 ? buildApontamentosEquipe() : []
    if (modalModo.value === 'EDITAR' && eventoEdicao.value?.id) {
      const payload = {
        inicio_em: new Date(form.value.inicio_em).toISOString(),
        fim_em: new Date(form.value.fim_em).toISOString(),
        subetapa: form.value.subetapa,
        equipe_ids: form.value.equipe_ids || [],
      }
      if (apontamentos.length > 0) payload.apontamentos = apontamentos
      if (form.value.cliente_id) payload.cliente_id = form.value.cliente_id
      if (!form.value.cliente_id && form.value.cliente_nome_livre?.trim()) payload.cliente_nome_livre = form.value.cliente_nome_livre.trim()
      if (form.value.venda_id) payload.venda_id = form.value.venda_id
      await service.atualizar(eventoEdicao.value.id, payload)
    } else {
      const payload = {
        inicio_em: new Date(form.value.inicio_em).toISOString(),
        fim_em: new Date(form.value.fim_em).toISOString(),
        subetapa: form.value.subetapa,
        setor_destino: form.value.setor_destino,
        origem_fluxo: form.value.origem_fluxo,
        status: 'PENDENTE',
      }
      if (form.value.cliente_id) payload.cliente_id = form.value.cliente_id
      if (!form.value.cliente_id && form.value.cliente_nome_livre?.trim()) payload.cliente_nome_livre = form.value.cliente_nome_livre.trim()
      if (form.value.venda_id) payload.venda_id = form.value.venda_id
      if (form.value.equipe_ids.length > 0) payload.equipe_ids = form.value.equipe_ids
      if (apontamentos.length > 0) payload.apontamentos = apontamentos
      await service.criar(payload)
    }

    fecharModal()
    await carregar()
  } catch (e) {
    erroModal.value = e?.response?.data?.message || (modalModo.value === 'EDITAR'
      ? 'Erro ao salvar alterações da tarefa.'
      : 'Erro ao criar tarefa. Verifique os dados.')
  } finally {
    salvandoCriar.value = false
  }
}

function periodoParaIso() {
  const p = periodoAgenda.value
  if (p === 'TODOS') return null
  const now = new Date()
  let inicio
  let fim = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  if (p === 'MES_ATUAL') {
    inicio = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    fim = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  } else if (p === 'ULTIMOS_30') {
    inicio = new Date(fim)
    inicio.setDate(inicio.getDate() - 29)
    inicio.setHours(0, 0, 0, 0)
  } else if (p === 'ULTIMOS_90') {
    inicio = new Date(fim)
    inicio.setDate(inicio.getDate() - 89)
    inicio.setHours(0, 0, 0, 0)
  } else {
    return null
  }
  return { inicio: inicio.toISOString(), fim: fim.toISOString() }
}

// ─── Carregar dados ───
async function carregar() {
  loading.value = true
  erro.value = ''
  try {
    const filtros = {}
    if (filtroMacroetapa.value) filtros.macroetapa = filtroMacroetapa.value
    if (filtroExecucao.value) filtros.execucao_etapa = filtroExecucao.value
    if (busca.value.trim()) filtros.busca = busca.value.trim()
    if (visaoAgenda.value === 'ARQUIVO') filtros.somente_arquivo = true
    const periodo = periodoParaIso()
    if (periodo) {
      filtros.periodo_inicio = periodo.inicio
      filtros.periodo_fim = periodo.fim
    }

    const { data } = await AgendaGeralService.listar(filtros)
    eventos.value = data.eventos || []
    if (data.catalogo_subetapas?.length) catalogoSubetapas.value = data.catalogo_subetapas
  } catch (e) {
    erro.value = 'Não foi possível carregar a agenda geral.'
    eventos.value = []
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
</script>

<style scoped>
/* ──────────────────────────────────────────────
   LAYOUT GERAL
────────────────────────────────────────────── */
.agenda-page {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 100%;
}

/* ──────────────────────────────────────────────
   HEADER
────────────────────────────────────────────── */
.agenda-page__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.agenda-page__title-block {
  flex: 0 0 auto;
  min-width: 140px;
}

.agenda-page__title {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--ds-color-text);
  letter-spacing: -0.02em;
}

.agenda-page__subtitle {
  font-size: 0.7rem;
  color: var(--ds-color-text-soft);
  margin-top: 2px;
}

.agenda-page__toolbar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.agenda-page__search {
  flex: 1;
  min-width: 180px;
  max-width: 280px;
}

.agenda-page__controls {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

/* Segmented control */
.agenda-page__seg {
  display: inline-flex;
  height: 32px;
  background: var(--ds-color-bg-subtle, #f1f5f9);
  border-radius: 8px;
  padding: 2px;
  gap: 1px;
}

.agenda-page__seg-btn {
  height: 100%;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ds-color-text-soft);
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.agenda-page__seg-btn:hover {
  color: var(--ds-color-text);
  background: rgba(255,255,255,0.6);
}

.agenda-page__seg-btn--active {
  background: #fff;
  color: var(--ds-color-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
}

/* Select */
.agenda-page__select {
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-bg);
  padding: 0 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--ds-color-text);
  outline: none;
  transition: border-color 0.15s;
}
.agenda-page__select:focus { border-color: var(--ds-color-primary); }

/* Ghost button (ícone) */
.agenda-page__btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-bg);
  color: var(--ds-color-text-soft);
  font-size: 11px;
  transition: all 0.15s;
}
.agenda-page__btn-ghost:hover { color: var(--ds-color-text); background: var(--ds-color-bg-subtle); }

/* Primary CTA */
.agenda-page__btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 16px;
  border-radius: 9px;
  background: var(--ds-color-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.01em;
  transition: opacity 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.agenda-page__btn-primary:hover { opacity: 0.88; }

/* Outline button */
.agenda-page__btn-outline {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid var(--ds-color-primary);
  color: var(--ds-color-primary);
  font-size: 12px;
  font-weight: 700;
  transition: background 0.15s;
}
.agenda-page__btn-outline:hover { background: color-mix(in srgb, var(--ds-color-primary) 8%, transparent); }

/* ──────────────────────────────────────────────
   ESTADOS (loading / erro / empty)
────────────────────────────────────────────── */
.agenda-page__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 4rem 1rem;
  font-size: 0.8rem;
  color: var(--ds-color-text-soft);
}
.agenda-page__state--error { color: #dc2626; }

.agenda-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 1.5rem;
  border: 1.5px dashed var(--ds-color-border);
  border-radius: 16px;
  background: var(--ds-color-bg-subtle, #f8fafc);
  text-align: center;
}
.agenda-page__empty-icon {
  font-size: 2.25rem;
  color: var(--ds-color-text-soft);
  opacity: 0.35;
  margin-bottom: 1rem;
}
.agenda-page__empty-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--ds-color-text);
}
.agenda-page__empty-desc {
  font-size: 0.72rem;
  color: var(--ds-color-text-soft);
  margin-top: 4px;
  max-width: 26rem;
  line-height: 1.5;
}

/* ──────────────────────────────────────────────
   KANBAN
────────────────────────────────────────────── */
.agenda-page__kanban {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.agenda-page__kanban-groups {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.agenda-page__kanban-group {}

.agenda-page__kanban-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.agenda-page__kanban-group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.agenda-page__kanban-group-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ds-color-text-soft);
}

.agenda-page__kanban-group-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--ds-color-text-soft);
  opacity: 0.6;
}

.agenda-page__kanban-cols {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.agenda-page__kanban-cols::-webkit-scrollbar { display: none; }

.agenda-page__kanban-col {
  flex-shrink: 0;
  width: 272px;
  display: flex;
  flex-direction: column;
}

.agenda-page__kanban-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--ds-color-bg-subtle, #f1f5f9);
  border: 1px solid var(--ds-color-border);
  border-bottom: none;
  border-radius: 10px 10px 0 0;
}

.agenda-page__kanban-col-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--ds-color-text);
}

.agenda-page__kanban-col-badge {
  min-width: 18px;
  height: 18px;
  border-radius: 99px;
  padding: 0 5px;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.agenda-page__kanban-col-add {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-color-text-soft);
  transition: background 0.15s;
}
.agenda-page__kanban-col-add:hover { background: rgba(0,0,0,0.07); }

.agenda-page__kanban-col-body {
  flex: 1;
  border: 1px solid var(--ds-color-border);
  border-top: none;
  border-radius: 0 0 10px 10px;
  background: var(--ds-color-bg);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 100px;
  max-height: 500px;
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.agenda-page__kanban-col-body::-webkit-scrollbar { display: none; }

.agenda-page__kanban-col-empty {
  font-size: 11px;
  color: var(--ds-color-text-soft);
  text-align: center;
  padding: 1.25rem 0;
  opacity: 0.6;
}

/* ──────────────────────────────────────────────
   TASK CARD (kanban)
────────────────────────────────────────────── */
.agenda-card {
  background: #fff;
  border: 1px solid var(--ds-color-border);
  border-radius: 9px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  transition: box-shadow 0.15s, transform 0.15s;
}
.agenda-card:hover {
  box-shadow: 0 4px 14px rgba(0,0,0,0.07);
  transform: translateY(-1px);
}

.agenda-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.agenda-card__title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ds-color-text);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agenda-card__client {
  font-size: 10.5px;
  color: var(--ds-color-text-soft);
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agenda-card__date {
  font-size: 10px;
  color: var(--ds-color-text-soft);
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.8;
}

.agenda-card__team {
  display: flex;
  gap: 3px;
  margin-top: 2px;
}

.agenda-card__avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--ds-color-bg-subtle);
  border: 1.5px solid var(--ds-color-border);
  font-size: 9px;
  font-weight: 700;
  color: var(--ds-color-text-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
}
.agenda-card__avatar--more {
  font-size: 8px;
  color: var(--ds-color-text-soft);
}

.agenda-card__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 7px;
  border-top: 1px solid var(--ds-color-border);
  margin-top: 2px;
}

.agenda-card__action-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 22px;
  padding: 0 7px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
  transition: background 0.12s;
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-soft);
}
.agenda-card__action-btn:hover { background: var(--ds-color-border); color: var(--ds-color-text); }
.agenda-card__action-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.agenda-card__action-btn--sky {
  background: #e0f2fe;
  color: #0369a1;
}
.agenda-card__action-btn--sky:hover { background: #bae6fd; }

.agenda-card__action-btn--next {
  background: color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  color: var(--ds-color-primary);
}
.agenda-card__action-btn--next:hover { background: color-mix(in srgb, var(--ds-color-primary) 20%, transparent); }

.agenda-card__action-btn--danger {
  background: #fff1f2;
  color: #e11d48;
}
.agenda-card__action-btn--danger:hover { background: #ffe4e6; }

.agenda-card__action-btn--encerrar {
  background: #f0fdf4;
  color: #15803d;
}
.agenda-card__action-btn--encerrar:hover { background: #dcfce7; }

/* chips */
.agenda-card__chip {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 6px;
  border-radius: 99px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.agenda-card__chip--xs {
  height: 15px;
  font-size: 8.5px;
}
.agenda-card__chip--fabrica  { background: #ede9fe; color: #6d28d9; }
.agenda-card__chip--loja     { background: #e0f2fe; color: #0369a1; }
.agenda-card__chip--neutral  { background: var(--ds-color-bg-subtle); color: var(--ds-color-text-soft); }
.agenda-card__chip--totem-ok { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }

/* ──────────────────────────────────────────────
   TIMELINE
────────────────────────────────────────────── */
.agenda-page__timeline {
  border: 1px solid var(--ds-color-border);
  border-radius: 14px;
  background: var(--ds-color-bg);
  overflow: hidden;
}

.agenda-page__timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ds-color-border);
}

.agenda-page__timeline-title {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ds-color-text-soft);
}

.agenda-page__timeline-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--ds-color-text-soft);
  opacity: 0.6;
}

.agenda-page__timeline-body {
  max-height: 72vh;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.agenda-page__timeline-body::-webkit-scrollbar { display: none; }

.agenda-page__tl-group {}

.agenda-page__tl-date {
  margin-bottom: 8px;
}

.agenda-page__tl-date-label {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--ds-color-text-soft);
  opacity: 0.7;
}

.agenda-page__tl-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ──────────────────────────────────────────────
   TIMELINE ITEM
────────────────────────────────────────────── */
.agenda-tl-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-bg);
  transition: box-shadow 0.15s;
}
.agenda-tl-item:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.06); }

.agenda-tl-item__left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.agenda-tl-item__avatar {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.agenda-tl-item__avatar--fabrica { background: #6d28d9; }
.agenda-tl-item__avatar--loja    { background: #0369a1; }

.agenda-tl-item__info {
  min-width: 0;
  flex: 1;
}

.agenda-tl-item__title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ds-color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.agenda-tl-item__client {
  font-size: 10.5px;
  color: var(--ds-color-text-soft);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agenda-tl-item__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 6px;
}

.agenda-tl-item__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.agenda-tl-item__time {
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-color-text);
  white-space: nowrap;
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border);
  border-radius: 6px;
  padding: 2px 8px;
}

/* ──────────────────────────────────────────────
   TRANSITIONS
────────────────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-active > div,
.modal-fade-leave-active > div {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from > div {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}
.modal-fade-leave-to > div {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}

/* dark mode ajustes */
@media (prefers-color-scheme: dark) {
  .agenda-card { background: var(--ds-color-bg-subtle); }
  .agenda-page__seg-btn--active { background: var(--ds-color-bg); }
  .agenda-card__chip--fabrica { background: rgba(109,40,217,0.18); color: #c4b5fd; }
  .agenda-card__chip--loja    { background: rgba(3,105,161,0.18);  color: #7dd3fc; }
  .agenda-card__action-btn--sky { background: rgba(3,105,161,0.18); color: #7dd3fc; }
  .agenda-card__action-btn--danger { background: rgba(225,29,72,0.12); color: #fda4af; }
}
</style>
