<template>
  <div class="w-full h-full font-sans antialiased text-slate-900 dark:text-slate-100">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" aria-hidden />
      <PageHeader
        title="Timeline A Casa"
        subtitle="Painel de controle"
        icon="pi pi-list"
      />
      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui bg-slate-100/90 dark:bg-bg-page">
      <TimelineFilters
        v-model:visao="visaoTimeline"
        :data-inicio="filtros.data_inicio"
        :data-fim="filtros.data_fim"
        :busca-cliente="filtros.busca_cliente"
        :total-vendas="totalItensVendas"
        :total-producao="totalItensProducao"
        :link-ver-na-agenda="linkVerNaAgenda"
        @update:data-inicio="filtros.data_inicio = $event"
        @update:data-fim="filtros.data_fim = $event"
        @update:busca-cliente="filtros.busca_cliente = $event"
        @change-dates="carregarLista"
      />

      <!-- LISTA DE TAREFAS (cards compactos para timeline longa) -->
      <div class="space-y-2 max-h-[70vh] overflow-y-auto mt-4">
        <div v-if="!tarefas.length && !loading" class="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
          Nenhuma tarefa no período. Ajuste as datas ou altere Vendas/Produção.
        </div>

        <!-- Tarefas ativas: border-l-4 na cor do processo + tom por status (pendente/em andamento/pausado) -->
        <div
          v-for="tarefa in tarefasAtivas"
          :key="'ativa-' + tarefa.id"
          class="group relative overflow-hidden border rounded-xl p-3 pl-4 shadow-sm dark:shadow-none transition-all duration-200"
          :class="[
            tarefa.plano_corte_id ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700 border-l-4 border-l-amber-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600',
            !tarefa.plano_corte_id && tarefaAtrasada(tarefa) ? 'border-red-300 dark:border-red-500/70 ring-1 ring-red-200 dark:ring-red-900/50' : '',
            !tarefa.plano_corte_id ? (getProcessColorByStatus(tarefa.categoria, tarefa.status).borderLeftClass || '') : '',
            getProcessColorByStatus(tarefa.categoria, tarefa.status).pulse ? 'animate-pulse' : '',
          ]"
        >
          <!-- Topo compacto: avatar + título + status + timer -->
          <div class="flex items-center gap-2 mb-2">
            <div class="w-9 h-9 rounded-lg shrink-0 font-bold text-xs flex items-center justify-center text-white" :class="tarefa.plano_corte_id ? 'bg-amber-600 dark:bg-amber-500 text-white' : [getProcessColorByStatus(tarefa.categoria, tarefa.status).dotClass, getProcessColorByStatus(tarefa.categoria, tarefa.status).pulse ? 'animate-pulse' : '']">
              {{ iniciaisTarefa(tarefa) }}
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight flex items-center gap-2 flex-wrap">
                {{ tarefa.plano_corte_id ? 'Serviço de Corte' : (labelCategoriaPendente(tarefa.categoria, tipoTimeline === 'venda' ? 'loja' : 'fabrica') || tarefa.titulo || 'Tarefa') }} #{{ tarefa.id }}
                <span v-if="tarefa.plano_corte_id" class="inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-600 text-white dark:bg-amber-500 dark:text-amber-950 shrink-0">[APENAS CORTE]</span>
              </h3>
              <div class="flex items-center gap-1.5 flex-wrap">
                <template v-if="tarefa.plano_corte_id">
                  <span v-if="!(tarefa.apontamentos_producao && tarefa.apontamentos_producao.length)" class="text-[9px] font-semibold text-amber-600 dark:text-amber-400 uppercase">Início</span>
                  <template v-else>
                    <span v-if="temCronometroRodandoNaTarefa(tarefa)" class="relative flex h-1.5 w-1.5">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    <span class="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase">{{ temCronometroRodandoNaTarefa(tarefa) ? 'Ativo' : 'Em produção' }}</span>
                  </template>
                </template>
                <template v-else>
                  <!-- Vendas/Produção: mesmo fluxo Início → Em produção → Ativo (cronômetro) -->
                  <span v-if="!(tarefa.apontamentos_producao && tarefa.apontamentos_producao.length)" class="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Início</span>
                  <template v-else>
                    <span v-if="temCronometroRodandoNaTarefa(tarefa)" class="relative flex h-1.5 w-1.5" :class="getProcessColorByStatus(tarefa.categoria, tarefa.status).pulse ? 'animate-pulse' : ''">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    <span class="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase">{{ temCronometroRodandoNaTarefa(tarefa) ? 'Ativo' : 'Em produção' }}</span>
                  </template>
                </template>
                <span v-if="tarefaAtrasada(tarefa)" class="text-[9px] font-bold uppercase text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded" title="Prazo excedido">Excedido</span>
              </div>
            </div>
            <div class="px-2.5 py-1 rounded-lg shrink-0 font-mono text-sm font-semibold tabular-nums" :class="getProcessColorByStatus(tarefa.categoria, tarefa.status).badgeClass">
              {{ formatarHorasParaExibicao(totalHorasTarefa(tarefa)) }}
            </div>
          </div>
          <!-- Tabela compacta -->
          <div class="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100/90 dark:bg-slate-800/30">
            <table class="w-full text-xs table-fixed">
              <colgroup>
                <col class="w-[28%]" />
                <col class="w-[18%]" />
                <col class="w-[18%]" />
                <col class="w-[14%]" />
                <col class="w-[22%]" />
              </colgroup>
              <thead class="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 border-b border-slate-200 dark:border-slate-600 bg-slate-200/70 dark:bg-slate-800/50">
                <tr>
                  <th class="text-left py-1 pr-1.5">Funcionário</th>
                  <th class="text-left py-1 px-1">Início</th>
                  <th class="text-left py-1 px-1">Fim</th>
                  <th class="text-right py-1 px-1">Horas</th>
                  <th class="text-center py-1 pl-1 w-20">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!(tarefa.apontamentos_producao && tarefa.apontamentos_producao.length)" class="text-slate-500 dark:text-slate-400">
                  <td colspan="5" class="py-2 text-xs">Nenhum funcionário atribuído.</td>
                </tr>
                <template v-else v-for="grupo in agruparApontamentosPorFuncionario(tarefa)" :key="'g-' + tarefa.id + '-' + grupo.funcionario_id">
                  <tr class="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/20">
                    <td class="py-1.5 pr-1.5 font-medium text-slate-800 dark:text-slate-200 align-middle truncate">
                      {{ grupo.funcionario?.nome || `#${grupo.funcionario_id}` }}
                      <button v-if="grupo.apontamentos.length > 1" type="button" class="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px]" :title="grupoEstaExpandido(tarefa.id, grupo.funcionario_id) ? 'Recolher' : `Ver ${grupo.apontamentos.length} registros`" @click="toggleGrupoExpandido(tarefa.id, grupo.funcionario_id)">
                        <i :class="grupoEstaExpandido(tarefa.id, grupo.funcionario_id) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i> ({{ grupo.apontamentos.length }})
                      </button>
                    </td>
                    <td class="py-1.5 px-1 text-slate-600 dark:text-slate-400 align-middle">{{ grupo.primeiroInicio ? timeLabel(grupo.primeiroInicio) : '—' }}</td>
                    <td class="py-1.5 px-1 align-middle">
                      <template v-if="grupo.emAndamento">
                        <span v-if="isCronometroPausado(grupo.emAndamento)" class="text-amber-600 dark:text-amber-400 text-[10px] font-medium">Pausado</span>
                        <span v-else class="text-slate-400 text-[10px]">—</span>
                      </template>
                      <template v-else><span class="text-slate-600 dark:text-slate-400 text-[10px]">{{ grupo.ultimoFim ? timeLabel(grupo.ultimoFim) : '—' }}</span></template>
                    </td>
                    <td class="py-1.5 px-1 text-right font-mono font-medium text-slate-800 dark:text-slate-200 align-middle text-[10px]">
                      <template v-if="grupo.emAndamento && !isCronometroPausado(grupo.emAndamento)">{{ formatElapsed(elapsedCronometro(grupo.emAndamento)) }}</template>
                      <template v-else>{{ formatarHorasParaExibicao(grupo.totalHoras) }}</template>
                    </td>
                    <td class="py-1.5 pl-1 align-middle">
                      <div class="flex items-center justify-center gap-0.5">
                        <template v-if="grupo.emAndamento">
                          <template v-if="isCronometroPausado(grupo.emAndamento)">
                            <button type="button" class="w-7 h-7 flex items-center justify-center rounded-md text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Retomar" @click="retomarCronometroTimeline(grupo.emAndamento)"><i class="pi pi-play text-xs"></i></button>
                          </template>
                          <template v-else>
                            <button type="button" class="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 text-[10px]" title="Pausar" @click="pausarCronometroTimeline(grupo.emAndamento)"><i class="pi pi-pause text-xs"></i></button>
                            <button type="button" class="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Concluir" @click="concluirCronometroTimeline(grupo.emAndamento)"><i class="pi pi-stop text-xs"></i></button>
                          </template>
                        </template>
                        <template v-else-if="grupo.apontamentos.length === 1">
                          <button type="button" class="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" title="Excluir" @click="confirmarExcluir(grupo.apontamentos[0])"><i class="pi pi-trash text-xs"></i></button>
                        </template>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="ap in grupo.apontamentos" v-show="grupoEstaExpandido(tarefa.id, grupo.funcionario_id)" :key="ap.id" class="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/70 dark:bg-slate-800/50">
                    <td class="py-1 pr-1.5 pl-6 text-slate-500 dark:text-slate-400 text-[10px]">↳ {{ timeLabel(ap.inicio_em) }} – {{ ap.fim_em ? timeLabel(ap.fim_em) : '—' }}</td>
                    <td class="py-1 px-1 text-slate-500 text-[10px]">{{ timeLabel(ap.inicio_em) }}</td>
                    <td class="py-1 px-1 text-slate-500 text-[10px]">{{ ap.fim_em ? timeLabel(ap.fim_em) : (isApontamentoEmAndamento(ap) ? (isCronometroPausado(ap) ? 'Pausado' : '—') : '—') }}</td>
                    <td class="py-1 px-1 text-right font-mono text-[10px] text-slate-600 dark:text-slate-400">{{ formatarHorasParaExibicao(horasExibir(ap)) }}</td>
                    <td class="py-1 pl-1">
                      <button type="button" class="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" title="Excluir" @click="confirmarExcluir(ap)"><i class="pi pi-trash text-xs"></i></button>
                    </td>
                  </tr>
                </template>
              </tbody>
              <tfoot v-if="tarefa.apontamentos_producao && tarefa.apontamentos_producao.length">
                <tr class="border-t border-slate-200 dark:border-slate-600 bg-slate-200/60 dark:bg-blue-900/10">
                  <td colspan="3" class="py-1 pr-1.5 text-right font-bold text-slate-600 dark:text-slate-400 text-[10px]">Total</td>
                  <td class="py-1 px-1 text-right font-mono font-bold text-blue-900 dark:text-blue-300 text-xs">{{ formatarHorasParaExibicao(totalHorasTarefa(tarefa)) }}</td>
                  <td class="py-1 pl-1"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Rodapé compacto -->
          <div class="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
            <select
              :value="getFuncionarioParaTarefa(tarefa.id)"
              class="h-8 min-w-[140px] px-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-900/20"
              @input="setFuncionarioParaTarefa(tarefa.id, $event.target.value)"
            >
              <option value="">— Selecione —</option>
              <option v-for="f in listaFuncionarios" :key="f.id" :value="String(f.id)">{{ f.nome }}</option>
            </select>
            <button
              type="button"
              class="h-8 px-3 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-semibold text-[10px] uppercase tracking-wider hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1"
              :disabled="adicionandoFuncionario === tarefa.id || !getFuncionarioParaTarefa(tarefa.id)"
              @click="adicionarFuncionarioDireto(tarefa)"
            >
              <i class="pi pi-play text-[10px]"></i>
              {{ adicionandoFuncionario === tarefa.id ? '...' : 'Iniciar' }}
            </button>
            <button
              type="button"
              class="h-8 px-2.5 rounded-lg border border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold uppercase hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 flex items-center gap-1"
              :disabled="finalizandoEtapa === tarefa.id"
              :title="finalizandoEtapa === tarefa.id ? 'Finalizando...' : 'Finalizar etapa'"
              @click="finalizarEtapaTimeline(tarefa)"
            >
              <i class="pi pi-check text-[10px]"></i>
              Finalizar
            </button>
            <button
              type="button"
              class="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
              title="Excluir agendamento"
              @click="excluirAgendamentoDaTimeline(tarefa)"
            >
              <i class="pi pi-trash text-xs"></i>
            </button>
          </div>

          <div v-if="temCronometroRodandoNaTarefa(tarefa)" class="absolute bottom-0 left-0 h-0.5 w-full overflow-hidden rounded-b-xl bg-blue-900/5 dark:bg-blue-400/10">
            <div class="h-full bg-blue-900/30 dark:bg-blue-400/30 w-1/4 animate-progress-slide"></div>
          </div>
        </div>

        <!-- Tarefas concluídas: cards compactos -->
        <template v-if="tarefasConcluidas.length">
          <div class="pt-4 mt-4 border-t border-slate-300 dark:border-slate-700">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-2">
              Concluídas ({{ tarefasConcluidas.length }})
            </p>
            <div class="space-y-2">
              <div
                v-for="tarefa in tarefasConcluidas"
                :key="'concluida-' + tarefa.id"
                class="group relative border rounded-xl p-3 pl-4 opacity-90 hover:opacity-100 transition-all duration-200"
                :class="[
                  tarefa.plano_corte_id ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700 border-l-4 border-l-amber-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600',
                  tarefa.plano_corte_id ? '' : getTimelineConcluidoClass(tarefa.categoria).borderLeftClass,
                ]"
              >
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-9 h-9 rounded-lg shrink-0 font-bold text-xs flex items-center justify-center text-white" :class="tarefa.plano_corte_id ? 'bg-amber-600 dark:bg-amber-500 text-white' : getTimelineConcluidoClass(tarefa.categoria).dotClass">
                    {{ iniciaisTarefa(tarefa) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-2 flex-wrap">
                      {{ tarefa.plano_corte_id ? 'Serviço de Corte' : (labelCategoriaPendente(tarefa.categoria, tipoTimeline === 'venda' ? 'loja' : 'fabrica') || tarefa.titulo || 'Tarefa') }} #{{ tarefa.id }}
                      <span v-if="tarefa.plano_corte_id" class="inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-600 text-white dark:bg-amber-500 dark:text-amber-950 shrink-0">[APENAS CORTE]</span>
                    </h3>
                    <span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Concluída</span>
                  </div>
                  <div class="px-2 py-1 rounded-lg shrink-0 font-mono text-xs" :class="getTimelineConcluidoClass(tarefa.categoria).badgeClass">
                    {{ formatarHorasParaExibicao(totalHorasTarefa(tarefa)) }}
                  </div>
                </div>
                <div class="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100/90 dark:bg-slate-800/30">
                  <table class="w-full text-xs table-fixed">
                    <thead class="text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-600 bg-slate-200/70 dark:bg-slate-800/50">
                      <tr>
                        <th class="text-left py-1 pr-1.5">Funcionário</th>
                        <th class="text-left py-1 px-1">Início</th>
                        <th class="text-left py-1 px-1">Fim</th>
                        <th class="text-right py-1 px-1">Horas</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="grupo in agruparApontamentosPorFuncionario(tarefa)"
                        :key="'c-' + tarefa.id + '-' + grupo.funcionario_id"
                        class="border-b border-slate-200 dark:border-slate-700/50"
                      >
                        <td class="py-1 pr-1.5 font-medium text-slate-600 dark:text-slate-400 text-[10px] truncate">{{ grupo.funcionario?.nome || '—' }}</td>
                        <td class="py-1 px-1 text-slate-500 text-[10px]">{{ grupo.primeiroInicio ? timeLabel(grupo.primeiroInicio) : '—' }}</td>
                        <td class="py-1 px-1 text-slate-500 text-[10px]">{{ grupo.ultimoFim ? timeLabel(grupo.ultimoFim) : '—' }}</td>
                        <td class="py-1 px-1 text-right font-medium text-slate-600 dark:text-slate-400 text-[10px]">{{ formatarHorasParaExibicao(grupo.totalHoras) }}</td>
                      </tr>
                    </tbody>
                    <tfoot v-if="tarefa.apontamentos_producao && tarefa.apontamentos_producao.length">
                      <tr class="border-t border-slate-200 dark:border-slate-600 bg-slate-200/60 dark:bg-blue-900/10">
                        <td colspan="3" class="py-1 pr-1.5 text-right font-bold text-slate-600 dark:text-slate-400 text-[10px]">Total</td>
                        <td class="py-1 px-1 text-right font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">{{ formatarHorasParaExibicao(totalHorasTarefa(tarefa)) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Botão Adicionar (estilo Fluxo A Casa) -->
      <button
        type="button"
        class="w-full mt-8 py-5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-[2rem] text-slate-500 dark:text-slate-500 font-bold text-xs tracking-[0.2em] uppercase hover:border-blue-900/40 dark:hover:border-blue-400/30 hover:text-blue-900/80 dark:hover:text-blue-400/70 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center gap-3"
        @click="abrirModalNovo"
      >
        <i class="pi pi-plus text-sm"></i>
        Novo registro
      </button>
      </div>
    </div>
  </div>

  <!-- Modal Adicionar funcionários (múltiplos por tarefa: Medição, Produção) -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="modalAtribuirFuncionario && pendenteAtribuir"
          class="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/50 backdrop-blur-sm overflow-y-auto"
          @click.self="fecharModalAtribuir"
        >
          <div class="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border-ui bg-bg-card shadow-xl overflow-hidden my-auto">
            <div class="h-1 flex-shrink-0 bg-brand-primary" />
            <header class="flex-shrink-0 flex justify-between items-center px-5 py-3 border-b border-border-ui">
              <h2 class="text-lg font-semibold text-text-main">Adicionar funcionários à tarefa</h2>
              <button type="button" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Fechar" @click="fecharModalAtribuir">
                <i class="pi pi-times"></i>
              </button>
            </header>
            <div class="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <p class="text-sm text-text-muted">
                {{ pendenteAtribuir?.cliente?.nome_completo || pendenteAtribuir?.cliente?.razao_social || 'Cliente' }} · {{ labelCategoriaPendente(pendenteAtribuir?.categoria, pendenteAtribuir?._origem) }}
              </p>
              <p class="text-[10px] text-text-muted">
                Período da tarefa: {{ pendenteAtribuir?._periodoLabel ?? '—' }}
              </p>
              <div class="rounded-xl border border-border-ui bg-slate-50/50 dark:bg-slate-800/30 p-4 space-y-4">
                <p class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Executáveis (funcionário + horário de cada um)</p>
                <p class="text-[10px] text-text-muted">
                  Adicione uma linha por funcionário. Cada um pode ter início e fim diferentes.
                </p>
                <div class="space-y-3">
                  <div
                    v-for="(linha, idx) in linhasAtribuir"
                    :key="idx"
                    class="p-4 rounded-xl border border-border-ui bg-bg-card space-y-3"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-[10px] font-bold text-text-muted">Executável {{ idx + 1 }}</span>
                      <Button
                        v-if="linhasAtribuir.length > 1"
                        type="button"
                        variant="ghost"
                        size="sm"
                        class="!p-1 !min-w-0 text-rose-600"
                        aria-label="Remover linha"
                        @click="removerLinhaAtribuir(idx)"
                      >
                        <i class="pi pi-trash text-xs"></i>
                      </Button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                      <div>
                        <label class="block text-[10px] font-bold mb-0.5 text-text-muted">Funcionário *</label>
                        <select
                          v-model="linha.funcionario_id"
                          class="w-full h-9 px-2 rounded-lg border border-border-ui bg-bg-card text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        >
                          <option value="">— Selecione —</option>
                          <option v-for="f in listaFuncionarios" :key="f.id" :value="String(f.id)">{{ f.nome }}</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold mb-0.5 text-text-muted">Início</label>
                        <input
                          v-model="linha.inicio_em"
                          type="datetime-local"
                          class="w-full h-9 px-2 rounded-lg border border-border-ui bg-bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold mb-0.5 text-text-muted">Pausa início</label>
                        <input
                          v-model="linha.pausa_inicio_em"
                          type="datetime-local"
                          class="w-full h-9 px-2 rounded-lg border border-border-ui bg-bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold mb-0.5 text-text-muted">Pausa fim</label>
                        <input
                          v-model="linha.pausa_fim_em"
                          type="datetime-local"
                          class="w-full h-9 px-2 rounded-lg border border-border-ui bg-bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold mb-0.5 text-text-muted">Fim</label>
                        <input
                          v-model="linha.fim_em"
                          type="datetime-local"
                          class="w-full h-9 px-2 rounded-lg border border-border-ui bg-bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                    </div>
                  </div>
                  <Button type="button" variant="secondary" size="sm" @click="adicionarLinhaAtribuir">
                    <i class="pi pi-plus text-xs mr-1"></i>
                    Adicionar executável
                  </Button>
                </div>
              </div>
            </div>
            <footer class="flex-shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-border-ui">
              <Button variant="secondary" @click="fecharModalAtribuir">Cancelar</Button>
              <Button
                variant="primary"
                :disabled="salvando || !linhasAtribuir.some((l) => l.funcionario_id && l.inicio_em && l.fim_em)"
                @click="confirmarAtribuir"
              >
                {{ salvando ? 'Salvando...' : 'Adicionar' }}
              </Button>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal novo registro (apenas criação; registro finalizado não é editável nesta tela) -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="modalAberto"
          class="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/50 backdrop-blur-sm overflow-y-auto"
          @click.self="fecharModal"
        >
          <div class="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl overflow-hidden my-auto">
            <header class="flex-shrink-0 flex justify-between items-center px-6 py-4 bg-brand-primary">
              <h2 class="text-lg font-semibold text-white truncate pr-2">Novo registro</h2>
              <button type="button" class="p-2 rounded-lg hover:bg-white/20 text-white flex-shrink-0" aria-label="Fechar" @click="fecharModal">
                <i class="pi pi-times"></i>
              </button>
            </header>
            <div class="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-5">
              <!-- Data, hora e responsável da criação do agendamento -->
              <section
                class="p-5 rounded-xl border border-border-ui bg-amber-50/80 dark:bg-amber-900/20 space-y-2 shrink-0 order-first"
              >
                <div class="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Data do agendamento (criação)</div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span class="text-[10px] font-bold text-text-muted block">Data</span>
                    <p class="font-semibold text-text-main">{{ dataCriacaoAgendamento || '—' }}</p>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold text-text-muted block">Hora</span>
                    <p class="font-semibold text-text-main">{{ horaCriacaoAgendamento || '—' }}</p>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold text-text-muted block">Responsável (criador do agendamento)</span>
                    <p class="font-semibold text-text-main">{{ responsavelCriacaoAgendamento || '—' }}</p>
                  </div>
                </div>
                <p class="text-[10px] text-text-muted">Data, hora e quem criou o agendamento. Somente leitura.</p>
              </section>

              <section class="p-5 rounded-xl border border-border-ui bg-slate-50/80 dark:bg-slate-800/30 space-y-3">
                <div class="text-[10px] font-bold uppercase tracking-wider text-text-muted">1. Dados do registro</div>
                <div>
                  <label class="block text-xs font-bold mb-1 text-text-main">Agendamento (opcional)</label>
                  <SearchInput
                    v-model="form.agendamento_id"
                    mode="select"
                    :placeholder="visaoTimeline === 'vendas' ? 'Selecione o agendamento (Loja)...' : 'Selecione o agendamento (Fábrica)...'"
                    :options="opcoesAgendaModal"
                  />
                </div>
              </section>

              <!-- Vários executáveis, cada um com seu horário (início e fim) -->
              <section class="p-5 rounded-xl border border-border-ui bg-slate-50/80 dark:bg-slate-800/30 space-y-4">
                <div class="text-[10px] font-bold uppercase tracking-wider text-text-muted">2. Executáveis (funcionário + horário de cada um)</div>
                <p class="text-[10px] text-text-muted">
                  Vários funcionários podem executar a mesma tarefa em horários diferentes. Adicione uma linha por executável com início e fim.
                </p>
                <div class="space-y-3">
                  <div
                    v-for="(linha, idx) in linhasExecucao"
                    :key="idx"
                    class="p-4 rounded-xl border border-border-ui bg-bg-card space-y-3"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-[10px] font-bold text-text-muted">Executável {{ idx + 1 }}</span>
                      <Button
                        v-if="linhasExecucao.length > 1"
                        type="button"
                        variant="ghost"
                        size="sm"
                        class="!p-1 !min-w-0 text-rose-600"
                        aria-label="Remover linha"
                        @click="removerLinhaExecucao(idx)"
                      >
                        <i class="pi pi-trash text-xs"></i>
                      </Button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                      <div>
                        <label class="block text-[10px] font-bold mb-0.5 text-text-muted">Funcionário *</label>
                        <select
                          v-model="linha.funcionario_id"
                          class="w-full h-9 px-2 rounded-lg border border-border-ui bg-bg-card text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        >
                          <option value="">— Selecione —</option>
                          <option v-for="f in listaFuncionarios" :key="f.id" :value="String(f.id)">{{ f.nome }}</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold mb-0.5 text-text-muted">Início</label>
                        <input
                          v-model="linha.inicio_em"
                          type="datetime-local"
                          class="w-full h-9 px-2 rounded-lg border border-border-ui bg-bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold mb-0.5 text-text-muted">Pausa início</label>
                        <input
                          v-model="linha.pausa_inicio_em"
                          type="datetime-local"
                          class="w-full h-9 px-2 rounded-lg border border-border-ui bg-bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold mb-0.5 text-text-muted">Pausa fim</label>
                        <input
                          v-model="linha.pausa_fim_em"
                          type="datetime-local"
                          class="w-full h-9 px-2 rounded-lg border border-border-ui bg-bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold mb-0.5 text-text-muted">Fim</label>
                        <input
                          v-model="linha.fim_em"
                          type="datetime-local"
                          class="w-full h-9 px-2 rounded-lg border border-border-ui bg-bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                    </div>
                  </div>
                  <Button type="button" variant="secondary" size="sm" @click="adicionarLinhaExecucao">
                    <i class="pi pi-plus text-xs mr-1"></i>
                    Adicionar executável
                  </Button>
                </div>
              </section>
            </div>
            <footer class="flex-shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-600 bg-gray-50/50 dark:bg-slate-800/80">
              <Button variant="secondary" @click="fecharModal">Cancelar</Button>
              <Button variant="primary" :disabled="salvando" @click="salvar">
                {{ salvando ? 'Salvando...' : 'Criar' }}
              </Button>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ApontamentoProducaoService, AgendaFabricaService, AgendaLojaService, FuncionariosService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import storage from '@/utils/storage'
import { can } from '@/services/permissions'
import { getProcessColorByStatus, getTimelineConcluidoClass } from '@/constantes'
import { useTimelineFormatters } from '@/composables/useTimelineFormatters'
import { useTimelineCronometro } from '@/composables/useTimelineCronometro'
import PageHeader from '@/components/ui/PageHeader.vue'
import TimelineFilters from './components/TimelineFilters.vue'

definePage({ meta: { perm: ['agendamentos.producao', 'agendamentos.vendas'] } })

const route = useRoute()

// ─── Formatadores e cronômetro (composables) ─────────────────────────────────
const {
  formatarData,
  timeLabel,
  formatarHorasParaExibicao,
  toDateOnly,
  toDateTimeLocal,
  pad2,
  horasExibir,
  iniciaisTarefa,
  tarefaAtrasada,
} = useTimelineFormatters()

const cronometroAgora = ref(Date.now())
const {
  isApontamentoEmAndamento,
  isCronometroPausado,
  elapsedCronometro,
  formatElapsed,
  temCronometroRodandoNaTarefa,
  totalHorasTarefa,
} = useTimelineCronometro(cronometroAgora, { horasExibir })

// ─── Estado (loading, modais, listas) ────────────────────────────────────────
const loading = ref(false)
const salvando = ref(false)
const limpandoCancelados = ref(false)
const modalAberto = ref(false)
const modalAtribuirFuncionario = ref(false)
const lista = ref([])
const pendentes = ref([])
const pendentesFabrica = ref([])
/** Timeline por tarefas: listas separadas para os dois tipos, assim os totais (0) e (1) ficam sempre visíveis. */
const tarefasVendas = ref([])
const tarefasProducao = ref([])
/** Lista da aba ativa (derivada de tarefasVendas ou tarefasProducao). */
const tarefas = computed(() => (visaoTimeline.value === 'vendas' ? tarefasVendas.value : tarefasProducao.value))
const tipoTimeline = ref('venda')
const pendenteAtribuir = ref(null)
/** No modal "Adicionar funcionários à tarefa": uma linha por executável, cada um com seu início e fim. */
const linhasAtribuir = ref([])
/** Adicionar direto no card: funcionário selecionado por tarefa (tarefa.id -> funcionario_id). */
const funcionarioParaAdicionar = ref({})
const adicionandoFuncionario = ref(null)
const finalizandoEtapa = ref(null)
function getFuncionarioParaTarefa(tarefaId) {
  return funcionarioParaAdicionar.value[tarefaId] ?? ''
}
function setFuncionarioParaTarefa(tarefaId, val) {
  const o = { ...funcionarioParaAdicionar.value }
  o[tarefaId] = val
  funcionarioParaAdicionar.value = o
}
const agendaOptionsFabrica = ref([])
const agendaOptionsLoja = ref([])
const listaFuncionarios = ref([])
const tabLoja = ref('em_aberto')
const tabFabrica = ref('em_aberto')
/** Alternar entre ver só Vendas ou só Produção. Persiste no localStorage para o filtro ficar sempre ativo ao voltar. */
const VISAO_TIMELINE_KEY = 'acasa_timeline_visao'
const visaoTimeline = ref(typeof localStorage !== 'undefined' && localStorage.getItem(VISAO_TIMELINE_KEY) === 'producao' ? 'producao' : 'vendas')

/** Cronômetro na Timeline: tick a cada 1s quando há apontamento em andamento. */
const temCronometroRodandoTimeline = computed(() => {
  for (const t of tarefas.value || []) {
    for (const ap of t.apontamentos_producao || []) {
      if (isApontamentoEmAndamento(ap) && !isCronometroPausado(ap)) return true
    }
  }
  return false
})
let intervalCronometroTimeline = null
watch(temCronometroRodandoTimeline, (rodando) => {
  if (intervalCronometroTimeline) {
    clearInterval(intervalCronometroTimeline)
    intervalCronometroTimeline = null
  }
  if (rodando) {
    intervalCronometroTimeline = setInterval(() => { cronometroAgora.value = Date.now() }, 1000)
  }
}, { immediate: true })

async function pausarCronometroTimeline(ap) {
  if (!ap?.id) return
  try {
    await ApontamentoProducaoService.pauseCronometro(ap.id)
    await carregarLista()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível pausar.')
  }
}
async function retomarCronometroTimeline(ap) {
  if (!ap?.id) return
  try {
    await ApontamentoProducaoService.resumeCronometro(ap.id)
    await carregarLista()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível retomar.')
  }
}
async function concluirCronometroTimeline(ap) {
  if (!ap?.id) return
  try {
    await ApontamentoProducaoService.finishCronometro(ap.id)
    await carregarLista()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível concluir.')
  }
}

/** Finalizar etapa: encerra cronômetros abertos, marca agenda como CONCLUIDO e avança fluxo do cliente (ex.: Medição → ORÇAMENTO). */
async function finalizarEtapaTimeline(tarefa) {
  if (!tarefa?.id) return
  finalizandoEtapa.value = tarefa.id
  try {
    const payload = tipoTimeline.value === 'venda' ? { agenda_loja_id: tarefa.id } : { agenda_fabrica_id: tarefa.id }
    const res = await ApontamentoProducaoService.finalizarEtapa(payload)
    const data = res?.data ?? res
    if (data?.mensagem_vendedor) notify.success(data.mensagem_vendedor)
    else notify.success('Etapa finalizada. Cronômetros encerrados e fluxo atualizado.')
    await carregarLista()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível finalizar a etapa.')
  } finally {
    finalizandoEtapa.value = null
  }
}

const usuarioLogado = computed(() => storage.getUser())

// ─── Filtros e formulários ───────────────────────────────────────────────────
const filtros = reactive({
  data_inicio: '',
  data_fim: '',
  tipo_agenda: '',
  agendamento_id: '',
  busca_cliente: '',
})

const form = reactive({
  agendamento_id: '',
  data: '',
  categoria: '',
  inicio_em: '',
  fim_em: '',
  pausa_inicio_em: '',
  pausa_fim_em: '',
  funcionario_id: '',
})

/** Várias linhas de executáveis: cada um com funcionário + início + fim (só no modo "Novo registro"). */
const linhasExecucao = ref([])
function novaLinhaExecucao() {
  const padrao = getHorarioPadrao()
  return { funcionario_id: '', inicio_em: padrao.inicio_em, fim_em: padrao.fim_em, pausa_inicio_em: '', pausa_fim_em: '' }
}
function adicionarLinhaExecucao() {
  linhasExecucao.value = [...linhasExecucao.value, novaLinhaExecucao()]
}
function removerLinhaExecucao(index) {
  if (linhasExecucao.value.length <= 1) return
  linhasExecucao.value = linhasExecucao.value.filter((_, i) => i !== index)
}
function nomeFuncionarioPorId(id) {
  if (!id) return '—'
  const f = listaFuncionarios.value.find((x) => String(x.id) === String(id))
  return f?.nome || `#${id}`
}

const pipelineProducao = ref([])
/** Data do agendamento (criação pela vendedora/loja) – fixa e visível. */
function getInicioEmAgendamento() {
  const id = String(form.agendamento_id || '')
  if (id.startsWith('l-')) {
    const num = id.replace('l-', '')
    const ag = agendaOptionsLoja.value.find((a) => String(a.id) === num)
    if (ag?.inicio_em) return new Date(ag.inicio_em)
    const pend = pendentes.value.find((p) => String(p.id) === num)
    if (pend?.inicio_em) return new Date(pend.inicio_em)
  }
  if (id.startsWith('f-')) {
    const num = id.replace('f-', '')
    const ag = agendaOptionsFabrica.value.find((a) => String(a.id) === num)
    if (ag?.inicio_em) return new Date(ag.inicio_em)
    const pend = pendentesFabrica.value.find((p) => String(p.id) === num)
    if (pend?.inicio_em) return new Date(pend.inicio_em)
  }
  return null
}
const dataCriacaoAgendamento = computed(() => {
  const d = getInicioEmAgendamento()
  return d ? formatarData(d) : null
})
const horaCriacaoAgendamento = computed(() => {
  const d = getInicioEmAgendamento()
  return d ? timeLabel(d) : null
})
const responsavelCriacaoAgendamento = computed(() => {
  const id = String(form.agendamento_id || '')
  if (id.startsWith('l-')) {
    const num = id.replace('l-', '')
    const ag = agendaOptionsLoja.value.find((a) => String(a.id) === num) ?? pendentes.value.find((p) => String(p.id) === num)
    if (ag?.criado_por_usuario?.nome) return ag.criado_por_usuario.nome
  }
  if (id.startsWith('f-')) {
    const num = id.replace('f-', '')
    const ag = agendaOptionsFabrica.value.find((a) => String(a.id) === num) ?? pendentesFabrica.value.find((p) => String(p.id) === num)
    if (ag?.criado_por_usuario?.nome) return ag.criado_por_usuario.nome
  }
  return null
})
const opcoesEtapas = computed(() => {
  const lista = Array.isArray(pipelineProducao.value) ? pipelineProducao.value : []
  return [...lista]
    .sort((a, b) => Number(a?.ordem || 0) - Number(b?.ordem || 0))
    .map((et) => ({
      value: String(et?.key || ''),
      label: formatarEtapaLabel(et?.key || et?.label),
    }))
    .filter((e) => e.value)
})
function formatarEtapaLabel(key) {
  if (!key) return ''
  const map = {
    MEDIDA: 'Visita / Medição',
    AGENDAR_MEDIDA: 'Visita / Medição',
    MEDIDA_AGENDADA: 'Visita / Medição',
    AGENDAR_MEDIDA_FINA: 'Medida fina',
    MEDIDA_FINA: 'Medida fina',
    PRODUCAO_RECEBIDA: 'Produção recebida',
    CORTE: 'Corte',
    PREPARACAO_TECNICA: 'Preparação técnica',
    MONTAGEM_INTERNA: 'Montagem interna',
    ACABAMENTO: 'Acabamento',
    CONFERENCIA_QUALIDADE: 'Conferência / Qualidade',
    MONTAGEM_CLIENTE_AGENDADA: 'Montagem cliente (agendada)',
    EM_MONTAGEM_CLIENTE: 'Em montagem no cliente',
    MONTAGEM_CLIENTE_FINALIZADA: 'Montagem cliente finalizada',
    PRODUCAO_FINALIZADA: 'Produção finalizada',
  }
  return map[key] || key.replace(/_/g, ' ')
}

// Valor do filtro pode ser "f-123" (fabrica) ou "l-456" (loja)
const linkVerNaAgenda = computed(() => {
  const id = route.query?.agenda || filtros.agendamento_id || ''
  if (!id) return null
  if (String(id).startsWith('l-')) {
    const num = String(id).replace('l-', '')
    return num ? `/agendamentos/loja?agenda=${num}` : null
  }
  if (String(id).startsWith('f-')) {
    const num = String(id).replace('f-', '')
    return num ? `/agendamentos/fabrica?agenda=${num}` : null
  }
  return `/agendamentos/fabrica?agenda=${id}`
})

const opcoesAgenda = computed(() => {
  const opts = [{ value: '', label: visaoTimeline.value === 'vendas' ? 'Todos (Loja)' : 'Todos (Fábrica)' }]
  const prefix = visaoTimeline.value === 'vendas' ? 'l-' : 'f-'
  for (const t of tarefas.value) {
    const label = (t.titulo || `#${t.id}`) + (t.cliente ? ` – ${t.cliente.nome_completo || t.cliente.razao_social || ''}` : '')
    opts.push({ value: `${prefix}${t.id}`, label })
  }
  return opts
})

const opcoesAgendaModal = computed(() => {
  const opts = [{ value: '', label: '— Nenhum —' }]
  if (visaoTimeline.value === 'vendas') {
    for (const a of agendaOptionsLoja.value) {
      const label = (a.titulo || `#${a.id}`) + (a.cliente ? ` – ${a.cliente.nome_completo || a.cliente.razao_social || ''}` : '')
      opts.push({ value: `l-${a.id}`, label })
    }
    for (const p of pendentes.value) {
      const label = (p.titulo || `#${p.id}`) + (p.cliente ? ` – ${p.cliente.nome_completo || p.cliente.razao_social || ''}` : '')
      opts.push({ value: `l-${p.id}`, label })
    }
  } else {
    for (const a of agendaOptionsFabrica.value) {
      const label = (a.titulo || `#${a.id}`) + (a.cliente ? ` – ${a.cliente.nome_completo || a.cliente.razao_social || ''}` : '')
      opts.push({ value: `f-${a.id}`, label })
    }
    for (const p of pendentesFabrica.value) {
      const label = (p.titulo || `#${p.id}`) + (p.cliente ? ` – ${p.cliente.nome_completo || p.cliente.razao_social || ''}` : '')
      opts.push({ value: `f-${p.id}`, label })
    }
  }
  return opts
})

/** Sincroniza filtros com o seletor Vendas/Produção: tipo fixo e limpa agendamento se não bater. Vendas = l-, Produção = f-. Ao trocar de aba, recarrega dados da agenda correspondente. */
watch(visaoTimeline, (v, old) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(VISAO_TIMELINE_KEY, v)
  filtros.tipo_agenda = v === 'vendas' ? 'venda' : 'producao'
  const id = filtros.agendamento_id
  if (id) {
    const match = (v === 'vendas' && String(id).startsWith('l-')) || (v === 'producao' && String(id).startsWith('f-'))
    if (!match) filtros.agendamento_id = ''
  }
  if (old !== undefined) carregarLista()
}, { immediate: true })

const resumo = computed(() => {
  let totalHoras = 0
  let totalCusto = 0
  for (const item of lista.value) {
    totalHoras += horasExibir(item)
    if (item.custo_calculado) totalCusto += Number(item.custo_calculado)
  }
  return { totalHoras: Math.round(totalHoras * 100) / 100, totalCusto }
})

/** Lista unificada de pendentes: Venda + Produção (cada item tem _origem, _key e _periodoLabel). */
const tarefasPendentesUnificadas = computed(() => {
  function periodoLabel(p) {
    if (!p?.inicio_em) return '—'
    const ini = new Date(p.inicio_em)
    const fim = p.fim_em ? new Date(p.fim_em) : null
    const mesmaData = fim && toDateOnly(ini) === toDateOnly(fim)
    if (!fim || mesmaData) return `${formatarData(p.inicio_em)} · ${timeLabel(p.inicio_em)}${fim ? ` – ${timeLabel(fim)}` : ''}`
    return `${formatarData(p.inicio_em)} ${timeLabel(p.inicio_em)} a ${formatarData(p.fim_em)} ${timeLabel(p.fim_em)}`
  }
  const out = []
  for (const p of pendentes.value) {
    out.push({ ...p, _origem: 'loja', _key: 'l-' + p.id, _periodoLabel: periodoLabel(p) })
  }
  for (const p of pendentesFabrica.value) {
    out.push({ ...p, _origem: 'fabrica', _key: 'f-' + p.id, _periodoLabel: periodoLabel(p) })
  }
  return out.sort((a, b) => new Date(a.inicio_em) - new Date(b.inicio_em))
})

const now = () => new Date()
/** Pendente está atrasado se o prazo (fim_em) já passou. */
function pendenteAtrasado(p) {
  return p?.fim_em && new Date(p.fim_em) < now()
}
/** Status da agenda vinculada ao apontamento. */
function statusAgendaItem(item) {
  return item?.agenda_loja?.status || item?.agenda_fabrica?.status || ''
}
/** Fim da agenda vinculada ao apontamento. */
function fimEmAgendaItem(item) {
  const d = item?.agenda_loja?.fim_em || item?.agenda_fabrica?.fim_em
  return d ? new Date(d) : null
}
function apontamentoAtrasado(item) {
  const st = String(statusAgendaItem(item) || '').toUpperCase()
  if (st === 'CONCLUIDO' || st === 'CANCELADO') return false
  const f = fimEmAgendaItem(item)
  return f && f < now()
}
function apontamentoEmAberto(item) {
  const st = String(statusAgendaItem(item) || '').toUpperCase()
  if (st === 'CONCLUIDO' || st === 'CANCELADO') return false
  return !apontamentoAtrasado(item)
}
function apontamentoConcluido(item) {
  return String(statusAgendaItem(item) || '').toUpperCase() === 'CONCLUIDO'
}

const pendentesLojaAtrasado = computed(() => tarefasPendentesUnificadas.value.filter((p) => p._origem === 'loja' && pendenteAtrasado(p)))
const pendentesLojaEmAberto = computed(() => tarefasPendentesUnificadas.value.filter((p) => p._origem === 'loja' && !pendenteAtrasado(p)))
const pendentesFabricaAtrasado = computed(() => tarefasPendentesUnificadas.value.filter((p) => p._origem === 'fabrica' && pendenteAtrasado(p)))
const pendentesFabricaEmAberto = computed(() => tarefasPendentesUnificadas.value.filter((p) => p._origem === 'fabrica' && !pendenteAtrasado(p)))

const listaLojaAtrasado = computed(() => lista.value.filter((a) => a.agenda_loja_id && apontamentoAtrasado(a)))
const listaLojaEmAberto = computed(() => lista.value.filter((a) => a.agenda_loja_id && apontamentoEmAberto(a)))
const listaLojaConcluido = computed(() => lista.value.filter((a) => a.agenda_loja_id && apontamentoConcluido(a)))
const listaFabricaAtrasado = computed(() => lista.value.filter((a) => a.agenda_fabrica_id && apontamentoAtrasado(a)))
const listaFabricaEmAberto = computed(() => lista.value.filter((a) => a.agenda_fabrica_id && apontamentoEmAberto(a)))
const listaFabricaConcluido = computed(() => lista.value.filter((a) => a.agenda_fabrica_id && apontamentoConcluido(a)))

/** Totais sempre visíveis nos botões (não somem ao trocar de aba). */
const totalItensVendas = computed(() => tarefasVendas.value.length)
const totalItensProducao = computed(() => tarefasProducao.value.length)

const pendentesParaLojaAba = computed(() => {
  if (tabLoja.value === 'atrasado') return pendentesLojaAtrasado.value
  if (tabLoja.value === 'em_aberto') return pendentesLojaEmAberto.value
  return []
})
const listaParaLojaAba = computed(() => {
  if (tabLoja.value === 'atrasado') return listaLojaAtrasado.value
  if (tabLoja.value === 'em_aberto') return listaLojaEmAberto.value
  return listaLojaConcluido.value
})

/** Agrupa registros pela mesma tarefa (agendamento): 1 linha = 1 tarefa com N funcionários. */
function agruparPorTarefa(items, tipo) {
  if (!Array.isArray(items) || !items.length) return []
  const key = (item) => {
    if (tipo === 'loja') {
      const id = item.agenda_loja_id
      const data = item?.inicio_em ? toDateOnly(new Date(item.inicio_em)) : ''
      return id ? `l-${id}-${data}` : `solo-${item.id}`
    }
    const id = item.agenda_fabrica_id
    const data = item?.inicio_em ? toDateOnly(new Date(item.inicio_em)) : ''
    return id ? `f-${id}-${data}` : `solo-${item.id}`
  }
  const map = {}
  for (const item of items) {
    const k = key(item)
    if (!map[k]) map[k] = []
    map[k].push(item)
  }
  return Object.values(map)
}
const listaParaLojaAbaAgrupada = computed(() => agruparPorTarefa(listaParaLojaAba.value, 'loja'))

function funcionariosDoGrupo(grupo) {
  if (!Array.isArray(grupo) || !grupo.length) return '—'
  const nomes = grupo.map((i) => i.funcionario?.nome).filter(Boolean)
  return [...new Set(nomes)].join(', ') || '—'
}
function horasDoGrupo(grupo) {
  if (!Array.isArray(grupo)) return 0
  return grupo.reduce((s, i) => s + horasExibir(i), 0)
}
function custoDoGrupo(grupo) {
  if (!Array.isArray(grupo)) return 0
  return grupo.reduce((s, i) => s + (i.custo_calculado ? Number(i.custo_calculado) : 0), 0)
}
function periodoDoGrupo(grupo) {
  if (!Array.isArray(grupo) || !grupo.length) return '—'
  const unicos = [...new Set(grupo.map((i) => periodoItemLabel(i)))]
  return unicos.length === 1 ? unicos[0] : unicos.join('; ')
}
/** Na visão Produção: só Agenda da Produção (fábrica). */
const pendentesParaFabricaAba = computed(() => {
  if (tabFabrica.value === 'atrasado') return pendentesFabricaAtrasado.value
  if (tabFabrica.value === 'em_aberto') return pendentesFabricaEmAberto.value
  return []
})
/** Na visão Produção: só apontamentos da Agenda da Produção. */
const listaParaFabricaAba = computed(() => {
  if (tabFabrica.value === 'atrasado') return listaFabricaAtrasado.value
  if (tabFabrica.value === 'em_aberto') return listaFabricaEmAberto.value
  return listaFabricaConcluido.value
})
const listaParaFabricaAbaAgrupada = computed(() => agruparPorTarefa(listaParaFabricaAba.value, 'fabrica'))

/** Dias no período filtrado (para a grade da timeline). */
const diasTimeline = computed(() => {
  const inicio = filtros.data_inicio
  const fim = filtros.data_fim
  if (!inicio || !fim) return []
  const start = new Date(inicio + 'T00:00:00')
  const end = new Date(fim + 'T23:59:59')
  const dias = []
  const d = new Date(start)
  while (d <= end) {
    dias.push({
      dateStr: toDateOnly(d),
      label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    })
    d.setDate(d.getDate() + 1)
  }
  return dias
})

/** Apontamentos da visão atual (todos do período, sem filtrar por aba) para a timeline. */
const listaParaTimeline = computed(() => {
  const items = lista.value
  const visao = visaoTimeline.value
  const inicio = filtros.data_inicio
  const fim = filtros.data_fim
  if (!inicio || !fim) return items
  return items.filter((a) => {
    const dataItem = a.inicio_em ? toDateOnly(new Date(a.inicio_em)) : toDateOnly(a.data)
    if (dataItem < inicio || dataItem > fim) return false
    if (visao === 'vendas') return a.agenda_loja_id != null
    return a.agenda_fabrica_id != null
  })
})

/** Funcionários únicos que têm apontamento no período (para linhas da timeline), ordenados por nome. */
const funcionariosNaTimeline = computed(() => {
  const ids = new Set()
  for (const a of listaParaTimeline.value) {
    if (a.funcionario_id && a.funcionario?.nome) ids.add(a.funcionario_id)
  }
  const list = [...ids].map((id) => {
    const first = listaParaTimeline.value.find((a) => a.funcionario_id === id)
    return { id, nome: first?.funcionario?.nome || `#${id}` }
  })
  list.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
  return list
})

/** Apontamentos de um dia e funcionário para a célula da timeline. */
function apontamentosCelula(dateStr, funcionarioId) {
  return listaParaTimeline.value.filter((a) => {
    const dataItem = a.inicio_em ? toDateOnly(new Date(a.inicio_em)) : toDateOnly(a.data)
    return dataItem === dateStr && a.funcionario_id === funcionarioId
  })
}

/** Exibe período: Início – [Pausa] – Fim (quando houver pausa). */
function periodoItemLabel(item) {
  if (!item?.inicio_em || !item?.fim_em) return '—'
  const ini = timeLabel(item.inicio_em)
  const fim = timeLabel(item.fim_em)
  if (item.pausa_inicio_em && item.pausa_fim_em) {
    const pIni = timeLabel(item.pausa_inicio_em)
    const pFim = timeLabel(item.pausa_fim_em)
    return `${ini} – pausa ${pIni}-${pFim} – ${fim}`
  }
  return `${ini} – ${fim}`
}

function formatarMoeda(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

async function carregarPipeline() {
  try {
    const { data } = await AgendaFabricaService.getPipelineProducao()
    pipelineProducao.value = Array.isArray(data) ? data : []
  } catch {
    pipelineProducao.value = []
  }
}

async function carregarAgendaParaSelect() {
  const inicio = filtros.data_inicio || toDateOnly(new Date())
  const d = new Date(inicio)
  d.setMonth(d.getMonth() - 1)
  const fim = filtros.data_fim || toDateOnly(new Date(Date.now() + 31 * 24 * 60 * 60 * 1000))
  try {
    const [resLoja, resFabrica] = await Promise.all([
      AgendaLojaService.listarTodos(inicio, fim, { incluir_cancelados: false }),
      AgendaFabricaService.listarTodos(inicio, fim, { incluir_cancelados: false }),
    ])
    agendaOptionsLoja.value = Array.isArray(resLoja?.data) ? resLoja.data : []
    agendaOptionsFabrica.value = Array.isArray(resFabrica?.data) ? resFabrica.data : []
  } catch {
    agendaOptionsLoja.value = []
    agendaOptionsFabrica.value = []
  }
}

// ─── Carregamento de dados ────────────────────────────────────────────────────
async function carregarLista() {
  loading.value = true
  try {
    const baseParams = {
      data_inicio: filtros.data_inicio,
      data_fim: filtros.data_fim,
      _t: Date.now(),
    }
    // Carregar Vendas e Produção em paralelo para os totais (0) e (1) ficarem sempre corretos
    const [resVendas, resProducao] = await Promise.all([
      ApontamentoProducaoService.getTimelinePorTarefas({ ...baseParams, tipo_agenda: 'venda' }),
      ApontamentoProducaoService.getTimelinePorTarefas({ ...baseParams, tipo_agenda: 'producao' }),
    ])
    const filterCancelados = (list) => (Array.isArray(list) ? list : []).filter((t) => String(t?.status || '').toUpperCase() !== 'CANCELADO')
    tarefasVendas.value = filterCancelados(resVendas?.data?.tarefas)
    tarefasProducao.value = filterCancelados(resProducao?.data?.tarefas)
    tipoTimeline.value = visaoTimeline.value === 'vendas' ? (resVendas?.data?.tipo || 'venda') : (resProducao?.data?.tipo || 'producao')
    // Legado: lista/pendentes para modal e opcoesAgenda (tipo da aba ativa)
    const paramsLegado = { ...baseParams, tipo_agenda: visaoTimeline.value === 'vendas' ? 'venda' : 'producao' }
    const resLegado = await ApontamentoProducaoService.getTimeline(paramsLegado).catch(() => ({}))
    const legado = resLegado?.data || {}
    lista.value = Array.isArray(legado.apontamentos) ? legado.apontamentos : []
    pendentes.value = Array.isArray(legado.pendentes) ? legado.pendentes : []
    pendentesFabrica.value = Array.isArray(legado.pendentes_fabrica) ? legado.pendentes_fabrica : []
  } catch (e) {
    notify.error('Falha ao carregar a timeline.')
    tarefasVendas.value = []
    tarefasProducao.value = []
    lista.value = []
    pendentes.value = []
    pendentesFabrica.value = []
  } finally {
    loading.value = false
  }
}

/** Adiciona funcionário direto no card: inicia o cronômetro e a linha (início/pausa/fim) aparece na frente do nome. */
async function adicionarFuncionarioDireto(tarefa) {
  const funcId = getFuncionarioParaTarefa(tarefa.id)
  if (!funcId) return notify.error('Selecione um funcionário.')
  adicionandoFuncionario.value = tarefa.id
  try {
    const payload = { funcionario_id: Number(funcId) }
    if (tipoTimeline.value === 'venda') payload.agenda_loja_id = tarefa.id
    else payload.agenda_fabrica_id = tarefa.id
    await ApontamentoProducaoService.startCronometro(payload)
    setFuncionarioParaTarefa(tarefa.id, '')
    await carregarLista()
    notify.success('Funcionário adicionado. Cronômetro iniciado.')
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível adicionar.')
  } finally {
    adicionandoFuncionario.value = null
  }
}

/** Exclui o agendamento direto da Timeline (apaga do banco e some da tela). */
async function excluirAgendamentoDaTimeline(tarefa) {
  const nome = (tarefa?.titulo || `#${tarefa?.id}`).toString().trim() || 'este agendamento'
  const ok = await confirm.show('Excluir agendamento', `Excluir ${nome}? Ele será removido da Agenda e da Timeline.`)
  if (!ok) return
  try {
    if (tipoTimeline.value === 'venda') {
      await AgendaLojaService.excluir(tarefa.id)
    } else {
      await AgendaFabricaService.excluir(tarefa.id)
    }
    notify.success('Agendamento excluído.')
    await carregarLista()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível excluir.')
  }
}

/** Apaga do banco todos os agendamentos com status CANCELADO (os que ficaram da época do "só marcar como cancelado"). */
async function limparCancelados() {
  const ok = await confirm.show(
    'Apagar cancelados do banco',
    'Isso remove definitivamente da base de dados todos os agendamentos já excluídos (status CANCELADO). Não tem volta. Continuar?'
  )
  if (!ok) return
  limpandoCancelados.value = true
  try {
    const service = visaoTimeline.value === 'vendas' ? AgendaLojaService : AgendaFabricaService
    const { data } = await service.purgeCancelados()
    const n = data?.deleted ?? 0
    notify.success(n > 0 ? `${n} agendamento(s) cancelado(s) removido(s) do banco.` : 'Nenhum agendamento cancelado no banco.')
    await carregarLista()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível limpar.')
  } finally {
    limpandoCancelados.value = false
  }
}

/** Filtra tarefas pela busca por cliente (nome ou razão social). */
const tarefasFiltradas = computed(() => {
  const list = tarefas.value || []
  const q = (filtros.busca_cliente || '').toLowerCase().trim()
  if (!q) return list
  return list.filter((t) => {
    const nome = (t.cliente?.nome_completo || '').toLowerCase()
    const razao = (t.cliente?.razao_social || '').toLowerCase()
    return nome.includes(q) || razao.includes(q)
  })
})

/** Tarefas ainda não finalizadas (etapa ativa). */
const tarefasAtivas = computed(() => (tarefasFiltradas.value || []).filter((t) => String(t?.status || '').toUpperCase() !== 'CONCLUIDO'))

/** Tarefas já finalizadas (etapa concluída). */
const tarefasConcluidas = computed(() => (tarefasFiltradas.value || []).filter((t) => String(t?.status || '').toUpperCase() === 'CONCLUIDO'))

/** Agrupa apontamentos da tarefa por funcionário: uma linha por pessoa com tempo contínuo (primeiro início, último fim, total de horas). */
function agruparApontamentosPorFuncionario(tarefa) {
  const aps = tarefa?.apontamentos_producao || []
  if (!aps.length) return []
  const porFunc = new Map()
  for (const ap of aps) {
    const fid = ap.funcionario_id ?? ap.funcionario?.id ?? 0
    if (!porFunc.has(fid)) {
      porFunc.set(fid, {
        funcionario_id: fid,
        funcionario: ap.funcionario,
        apontamentos: [],
        primeiroInicio: null,
        ultimoFim: null,
        totalHoras: 0,
        emAndamento: null,
      })
    }
    const g = porFunc.get(fid)
    g.apontamentos.push(ap)
    const ini = ap.inicio_em ? new Date(ap.inicio_em) : null
    const fim = ap.fim_em ? new Date(ap.fim_em) : null
    if (ini && (!g.primeiroInicio || ini < g.primeiroInicio)) g.primeiroInicio = ini
    if (fim && (!g.ultimoFim || fim > g.ultimoFim)) g.ultimoFim = fim
    if (isApontamentoEmAndamento(ap)) g.emAndamento = ap
    else g.totalHoras += horasExibir(ap)
  }
  for (const g of porFunc.values()) {
    if (g.emAndamento) g.totalHoras += elapsedCronometro(g.emAndamento) / 3600
    g.totalHoras = Math.round(g.totalHoras * 100) / 100
    g.apontamentos.sort((a, b) => new Date(a.inicio_em || 0) - new Date(b.inicio_em || 0))
  }
  return [...porFunc.values()].sort((a, b) => (a.primeiroInicio || 0) - (b.primeiroInicio || 0))
}

/** Controle de expandir grupo (ver registros individuais). Chave: tarefaId-funcionarioId */
const grupoExpandido = ref(new Set())
function toggleGrupoExpandido(tarefaId, funcionarioId) {
  const key = `${tarefaId}-${funcionarioId}`
  const next = new Set(grupoExpandido.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  grupoExpandido.value = next
}
function grupoEstaExpandido(tarefaId, funcionarioId) {
  return grupoExpandido.value.has(`${tarefaId}-${funcionarioId}`)
}

function tarefaEhConcluida(tarefa) {
  return String(tarefa?.status || '').toUpperCase() === 'CONCLUIDO'
}

/** Converte tarefa (da API timeline/tarefas) para o formato esperado pelo modal Atribuir (pendenteAtribuir) */
function tarefaParaPendente(tarefa) {
  if (!tarefa) return null
  const origem = tipoTimeline.value === 'venda' ? 'loja' : 'fabrica'
  const periodo = tarefa.inicio_em && tarefa.fim_em
    ? `${formatarData(tarefa.inicio_em)} ${timeLabel(tarefa.inicio_em)} – ${formatarData(tarefa.fim_em)} ${timeLabel(tarefa.fim_em)}`
    : '—'
  return { ...tarefa, _origem: origem, _periodoLabel: periodo }
}

function getHorarioPadrao() {
  const hoje = new Date()
  const fim = new Date(hoje)
  fim.setHours(fim.getHours() + 1)
  return { inicio_em: toDateTimeLocal(hoje), fim_em: toDateTimeLocal(fim) }
}

function abrirModalNovo() {
  editando.value = null
  const hoje = new Date()
  const padrao = getHorarioPadrao()
  const q = route.query?.agenda
  let agendaVal = filtros.agendamento_id || (q ? (String(q).startsWith('l-') || String(q).startsWith('f-') ? String(q) : `f-${q}`) : '')
  if (agendaVal && visaoTimeline.value === 'vendas' && !String(agendaVal).startsWith('l-')) agendaVal = ''
  if (agendaVal && visaoTimeline.value === 'producao' && !String(agendaVal).startsWith('f-') && !String(agendaVal).startsWith('l-')) agendaVal = ''
  form.agendamento_id = agendaVal
  form.data = toDateOnly(hoje)
  form.categoria = ''
  form.inicio_em = padrao.inicio_em
  form.fim_em = padrao.fim_em
  form.pausa_inicio_em = ''
  form.pausa_fim_em = ''
  form.funcionario_id = ''
  const primeiroFunc = usuarioLogado.value?.funcionario_id ? String(usuarioLogado.value.funcionario_id) : ''
  linhasExecucao.value = [{ funcionario_id: primeiroFunc, inicio_em: padrao.inicio_em, fim_em: padrao.fim_em, pausa_inicio_em: '', pausa_fim_em: '' }]
  modalAberto.value = true
  if (!listaFuncionarios.value.length) carregarFuncionarios()
}

function abrirModalEditar(item) {
  editando.value = item
  form.agendamento_id = item.agenda_loja_id ? `l-${item.agenda_loja_id}` : item.agenda_fabrica_id ? `f-${item.agenda_fabrica_id}` : ''
  form.data = toDateOnly(new Date(item.inicio_em))
  form.categoria = item.categoria || ''
  form.inicio_em = toDateTimeLocal(item.inicio_em)
  form.fim_em = toDateTimeLocal(item.fim_em)
  form.pausa_inicio_em = item.pausa_inicio_em ? toDateTimeLocal(item.pausa_inicio_em) : ''
  form.pausa_fim_em = item.pausa_fim_em ? toDateTimeLocal(item.pausa_fim_em) : ''
  form.funcionario_id = item.funcionario_id ? String(item.funcionario_id) : (usuarioLogado.value?.funcionario_id ? String(usuarioLogado.value.funcionario_id) : '')
  modalAberto.value = true
  if (!listaFuncionarios.value.length) carregarFuncionarios()
}

function fecharModal() {
  modalAberto.value = false
  editando.value = null
  linhasExecucao.value = []
}

// Categorias da agenda de venda (timeline exibe todas)
const LABEL_CATEGORIA_LOJA = {
  MEDIDA: 'Medição',
  MEDIDA_AGENDADA: 'Medição',
  AGENDAR_MEDIDA: 'Agendar medição',
  ORCAMENTO: 'Orçamento',
  CRIAR_ORCAMENTO: 'Criar orçamento',
  AGENDAR_ORCAMENTO: 'Orçamento',
  APRESENTACAO: 'Agendar apresentação',
  AGENDAR_APRESENTACAO: 'Agendar apresentação',
  CONTRATO: 'Fechar venda / Contrato',
  CONTRATO_GERADO: 'Fechar venda / Contrato',
  VENDA_FECHADA: 'Venda fechada',
}
function labelCategoriaPendente(cat, origem) {
  if (origem === 'fabrica') {
    return formatarEtapaLabel(cat) || cat || '—'
  }
  return LABEL_CATEGORIA_LOJA[cat] || cat || '—'
}
/** Nome de quem agendou a tarefa (pode ser vendedor); executante é outro campo (Funcionário). */
function agendadoPorItem(item) {
  return item?.agenda_loja?.criado_por_usuario?.nome || item?.agenda_fabrica?.criado_por_usuario?.nome || '—'
}
/** Data do apontamento: usa o dia local do início (segunda = 02/03), não o campo data que pode estar em UTC. */
function dataDisplayApontamento(item) {
  if (!item?.inicio_em) return formatarData(item?.data)
  return formatarData(new Date(item.inicio_em))
}
function labelEtapaItem(item) {
  const cat = item?.categoria || ''
  const origem = item?.agenda_loja_id ? 'loja' : 'fabrica'
  return labelCategoriaPendente(cat, origem)
}

function podeAtribuirMedida() {
  return can('agendamentos.producao')
}

function podeIniciarPendente(p) {
  if (!p || !usuarioLogado.value?.funcionario_id) return false
  if (p.criado_por_usuario_id !== usuarioLogado.value?.id) return false
  return ['APRESENTACAO', 'CONTRATO'].includes(String(p.categoria || '').toUpperCase())
}

async function iniciarTarefaVendedor(p) {
  const funcId = Number(usuarioLogado.value?.funcionario_id)
  if (!funcId) return notify.error('Seu usuário precisa estar vinculado a um funcionário.')
  const now = new Date()
  const data = toDateOnly(now)
  const inicio = toDateTimeLocal(now)
  salvando.value = true
  try {
    await ApontamentoProducaoService.criar({
      agenda_loja_id: p.id,
      funcionario_id: funcId,
      data,
      inicio_em: inicio,
      fim_em: inicio,
      categoria: p.categoria,
    })
    notify.success('Tarefa iniciada. Use "Concluir" ou edite o registro para definir o horário de término.')
    await carregarLista()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível iniciar.')
  } finally {
    salvando.value = false
  }
}

function novaLinhaAtribuir() {
  const p = pendenteAtribuir.value
  if (!p?.inicio_em) {
    const padrao = getHorarioPadrao()
    return { funcionario_id: '', inicio_em: padrao.inicio_em, fim_em: padrao.fim_em, pausa_inicio_em: '', pausa_fim_em: '' }
  }
  const inicio = toDateTimeLocal(p.inicio_em)
  const fim = p.fim_em ? toDateTimeLocal(p.fim_em) : toDateTimeLocal(p.inicio_em)
  return { funcionario_id: '', inicio_em: inicio, fim_em: fim, pausa_inicio_em: '', pausa_fim_em: '' }
}

function adicionarLinhaAtribuir() {
  linhasAtribuir.value = [...linhasAtribuir.value, novaLinhaAtribuir()]
}

function removerLinhaAtribuir(index) {
  if (linhasAtribuir.value.length <= 1) return
  linhasAtribuir.value = linhasAtribuir.value.filter((_, i) => i !== index)
}

function abrirModalAtribuir(p) {
  pendenteAtribuir.value = p
  linhasAtribuir.value = [novaLinhaAtribuir()]
  modalAtribuirFuncionario.value = true
  if (!listaFuncionarios.value.length) carregarFuncionarios()
}

function fecharModalAtribuir() {
  modalAtribuirFuncionario.value = false
  pendenteAtribuir.value = null
  linhasAtribuir.value = []
}

async function carregarFuncionarios() {
  try {
    const { data } = await FuncionariosService.listar()
    listaFuncionarios.value = Array.isArray(data) ? data : []
  } catch {
    listaFuncionarios.value = []
  }
}

async function confirmarAtribuir() {
  const p = pendenteAtribuir.value
  if (!p) return

  const linhas = (linhasAtribuir.value || []).filter(
    (l) => l.funcionario_id && l.inicio_em && l.fim_em,
  )
  if (linhas.length === 0) return notify.error('Adicione ao menos um executável com funcionário, início e fim.')

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]
    const inicio = new Date(l.inicio_em)
    const fim = new Date(l.fim_em)
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      return notify.error(`Linha ${i + 1}: data/hora inválida.`)
    }
    if (fim <= inicio) {
      return notify.error(`Linha ${i + 1}: horário de fim deve ser posterior ao início.`)
    }
  }

  salvando.value = true
  try {
    if (p._origem === 'fabrica') {
      for (const l of linhas) {
        const data = toDateOnly(new Date(l.inicio_em))
        await ApontamentoProducaoService.criar({
          agenda_fabrica_id: p.id,
          funcionario_id: Number(l.funcionario_id),
          data,
          inicio_em: l.inicio_em,
          fim_em: l.fim_em,
          pausa_inicio_em: l.pausa_inicio_em || undefined,
          pausa_fim_em: l.pausa_fim_em || undefined,
          categoria: p.categoria,
        })
      }
    } else {
      for (const l of linhas) {
        const data = toDateOnly(new Date(l.inicio_em))
        await ApontamentoProducaoService.criar({
          agenda_loja_id: p.id,
          funcionario_id: Number(l.funcionario_id),
          data,
          inicio_em: l.inicio_em,
          fim_em: l.fim_em,
          pausa_inicio_em: l.pausa_inicio_em || undefined,
          pausa_fim_em: l.pausa_fim_em || undefined,
          categoria: p.categoria,
        })
      }
    }
    const qtd = linhas.length
    notify.success(qtd === 1 ? 'Funcionário adicionado à tarefa.' : `${qtd} funcionários adicionados à tarefa.`)
    fecharModalAtribuir()
    await carregarLista()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível atribuir.')
  } finally {
    salvando.value = false
  }
}

function podeConcluirTarefa(item) {
  if (!item?.agenda_loja_id || !usuarioLogado.value?.funcionario_id) return false
  if (item.funcionario_id !== usuarioLogado.value.funcionario_id) return false
  const cat = String(item.categoria || '').toUpperCase()
  if (!['APRESENTACAO', 'CONTRATO'].includes(cat)) return false
  const horas = horasExibir(item)
  return horas < 0.02
}

async function concluirTarefa(item) {
  const now = new Date()
  salvando.value = true
  try {
    await ApontamentoProducaoService.atualizar(item.id, {
      fim_em: toDateTimeLocal(now),
    })
    notify.success('Tarefa concluída.')
    await carregarLista()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível concluir.')
  } finally {
    salvando.value = false
  }
}

function parseAgendamentoId(agendamentoId) {
  const id = String(agendamentoId || '')
  if (id.startsWith('l-')) return { agenda_loja_id: parseInt(id.replace('l-', ''), 10) }
  if (id.startsWith('f-')) return { agenda_fabrica_id: parseInt(id.replace('f-', ''), 10) }
  return {}
}

async function salvar() {
  const agendaPayload = parseAgendamentoId(form.agendamento_id)

  if (editando.value) {
    if (!form.data) return notify.error('Informe a data.')
    const funcionarioId = Number(form.funcionario_id || 0)
    if (!funcionarioId) return notify.error('Selecione o funcionário que executa.')
    if (!form.inicio_em || !form.fim_em) return notify.error('Informe o horário de início e fim.')
    const inicio = new Date(form.inicio_em)
    const fim = new Date(form.fim_em)
    if (fim <= inicio) return notify.error('O horário de fim deve ser posterior ao início.')

    salvando.value = true
    try {
      await ApontamentoProducaoService.atualizar(editando.value.id, {
        funcionario_id: funcionarioId,
        data: form.data,
        inicio_em: form.inicio_em,
        fim_em: form.fim_em,
        pausa_inicio_em: form.pausa_inicio_em || null,
        pausa_fim_em: form.pausa_fim_em || null,
        categoria: form.categoria || undefined,
        ...agendaPayload,
      })
      notify.success('Registro atualizado.')
      fecharModal()
      await carregarLista()
    } catch (e) {
      const msg = e?.response?.data?.message
      notify.error(msg || 'Não foi possível salvar.')
    } finally {
      salvando.value = false
    }
    return
  }

  // Novo: várias linhas (executável + início + fim cada uma)
  const linhas = (linhasExecucao.value || []).filter(
    (l) => l.funcionario_id && l.inicio_em && l.fim_em,
  )
  if (linhas.length === 0) return notify.error('Adicione ao menos um executável com funcionário, início e fim.')

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]
    const inicio = new Date(l.inicio_em)
    const fim = new Date(l.fim_em)
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      return notify.error(`Linha ${i + 1}: data/hora inválida.`)
    }
    if (fim <= inicio) {
      return notify.error(`Linha ${i + 1}: horário de fim deve ser posterior ao início.`)
    }
  }

  salvando.value = true
  try {
    for (const l of linhas) {
      const data = toDateOnly(new Date(l.inicio_em))
      await ApontamentoProducaoService.criar({
        funcionario_id: Number(l.funcionario_id),
        data,
        inicio_em: l.inicio_em,
        fim_em: l.fim_em,
        pausa_inicio_em: l.pausa_inicio_em || undefined,
        pausa_fim_em: l.pausa_fim_em || undefined,
        categoria: form.categoria || undefined,
        ...agendaPayload,
      })
    }
    const qtd = linhas.length
    notify.success(qtd === 1 ? 'Registro criado.' : `${qtd} registros criados.`)
    fecharModal()
    await carregarLista()
  } catch (e) {
    const msg = e?.response?.data?.message
    notify.error(msg || 'Não foi possível salvar.')
  } finally {
    salvando.value = false
  }
}

async function confirmarExcluir(item) {
  const ok = await confirm.show('Excluir registro', 'Deseja realmente excluir este registro de horas da timeline?')
  if (!ok) return
  try {
    await ApontamentoProducaoService.excluir(item.id)
    notify.success('Registro excluído.')
    await carregarLista()
  } catch {
    notify.error('Não foi possível excluir.')
  }
}

/** Ao voltar para a aba/janela, recarrega a lista para refletir exclusões feitas na Agenda. */
function onVisibilityChange() {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    carregarLista()
  }
}

onMounted(() => {
  const hoje = new Date()
  // Período padrão: primeiro e último dia do mês atual (data início e fim dentro do mês)
  if (!filtros.data_inicio) {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    filtros.data_inicio = toDateOnly(inicio)
  }
  if (!filtros.data_fim) {
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    filtros.data_fim = toDateOnly(fim)
  }
  const q = route.query?.agenda
  if (q) {
    const raw = String(q)
    filtros.agendamento_id = raw.startsWith('l-') || raw.startsWith('f-') ? raw : `f-${raw}`
  }
  carregarPipeline()
  carregarAgendaParaSelect()
  carregarFuncionarios()
  carregarLista()
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
})

// Ao voltar para esta tela (ex.: depois de excluir uma tarefa na Agenda), recarrega para a lista refletir a exclusão
onActivated(() => {
  carregarLista()
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
  if (intervalCronometroTimeline) {
    clearInterval(intervalCronometroTimeline)
    intervalCronometroTimeline = null
  }
})

watch(() => route.query?.agenda, (id) => {
  if (!id) return
  const raw = String(id)
  filtros.agendamento_id = raw.startsWith('l-') || raw.startsWith('f-') ? raw : `f-${raw}`
})

watch(() => form.agendamento_id, (id) => {
  if (!id) return
  const raw = String(id)
  if (raw.startsWith('l-')) {
    const num = raw.replace('l-', '')
    const ag = agendaOptionsLoja.value.find((a) => String(a.id) === num) ?? pendentes.value.find((p) => String(p.id) === num)
    if (ag?.categoria) form.categoria = ag.categoria
  } else if (raw.startsWith('f-')) {
    const num = raw.replace('f-', '')
    const ag = agendaOptionsFabrica.value.find((a) => String(a.id) === num) ?? pendentesFabrica.value.find((p) => String(p.id) === num)
    if (ag?.categoria) form.categoria = ag.categoria
  }
})
watch(() => form.inicio_em, (val) => {
  if (val) form.data = toDateOnly(new Date(val))
}, { immediate: false })
</script>

<style scoped>
@keyframes progress-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
.animate-progress-slide {
  animation: progress-slide 3s infinite linear;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
