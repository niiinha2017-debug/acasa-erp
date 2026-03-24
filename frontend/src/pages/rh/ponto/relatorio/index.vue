<template>
  <PageShell :padded="false">
    <section class="rh-ponto-relatorio ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Relatório de Ponto"
        subtitle="Consulte e ajuste os registros do período. Gere o PDF e envie o comprovante ao colaborador."
        icon="pi pi-stopwatch"
      />

      <div class="rh-ponto-relatorio__body ds-page-context__content">
        <!-- Filtros -->
        <div class="rh-ponto-relatorio__filters mb-6">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div class="md:col-span-4">
              <MonthReferenceField
                v-model="mesReferencia"
                label="Mês de referência"
              />
            </div>
            <div class="md:col-span-4">
              <label class="text-[10px] font-black text-text-soft uppercase ml-2 mb-1 block">Funcionário</label>
              <SearchInput
                v-model="filtros.funcionario_id"
                mode="select"
                placeholder="Selecione o funcionário..."
                :options="funcionarioOptions"
                labelKey="label"
                valueKey="value"
                @update:modelValue="buscar"
              />
            </div>
            <div class="md:col-span-4 flex flex-wrap items-center gap-3 justify-end">
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input
                  v-model="apenasAteHoje"
                  type="checkbox"
                  class="rounded border-border-ui text-brand-primary focus:ring-brand-primary/30"
                />
                <span class="text-xs font-semibold text-text-main">Apenas até hoje</span>
              </label>
              <Button
                variant="secondary"
                class="h-11 px-5 rounded-xl font-black text-[10px] uppercase"
                :loading="loadingPdf"
                :disabled="!filtros.funcionario_id || !filtros.data_ini"
                @click="gerarRelatorioMensal"
              >
                <i class="pi pi-file-pdf mr-2 text-xs"></i>
                Gerar PDF
              </Button>
              <button
                v-if="funcionarioSelecionado?.whatsapp"
                type="button"
                class="h-11 px-5 rounded-xl font-black text-[10px] uppercase bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
                :disabled="!filtros.funcionario_id || !filtros.data_ini"
                @click="abrirWhatsComprovante"
              >
                <i class="pi pi-whatsapp text-xs"></i>
                Enviar comprovante
              </button>
            </div>
          </div>
        </div>

        <Loading v-if="loadingTabela && !rows.length" />

        <template v-else>
          <!-- Horário cadastrado do funcionário -->
          <div v-if="funcionarioSelecionado" class="mb-6">
            <div class="relative mb-4">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border-ui/50"></div>
              </div>
              <div class="relative flex justify-center">
                <span class="bg-bg-page px-4 text-[10px] font-black uppercase tracking-wider text-text-soft">
                  Horário do cadastro
                </span>
              </div>
            </div>
            <div class="rh-ponto-relatorio__metrics-grid grid grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Jornada: Seg–Sex + Sábado (só mostra Sáb quando preenchido) -->
              <div class="rh-ponto-relatorio__metric min-h-[88px] flex flex-col justify-center">
                <p class="text-[10px] font-black uppercase tracking-wider text-text-soft mb-2">Jornada</p>
                <div class="space-y-1">
                  <p class="text-sm font-semibold text-text-main tabular-nums leading-snug">
                    Seg–Sex: {{ horarioSegSex || '—' }}
                  </p>
                  <p v-if="horarioSabado" class="text-sm font-semibold text-text-main tabular-nums leading-snug">
                    Sáb: {{ horarioSabado }}
                  </p>
                </div>
              </div>
              <div class="rh-ponto-relatorio__metric min-h-[88px] flex flex-col justify-center">
                <p class="text-[10px] font-black uppercase tracking-wider text-text-soft mb-2">Carga horária</p>
                <p class="text-sm font-semibold text-text-main tabular-nums">{{ cargaHorariaLabel }}</p>
              </div>
              <div class="rh-ponto-relatorio__metric min-h-[88px] flex flex-col justify-center">
                <p class="text-[10px] font-black uppercase tracking-wider text-text-soft mb-2">Valor da hora</p>
                <p class="text-sm font-semibold text-text-main tabular-nums">{{ valorHoraLabel }}</p>
              </div>
              <div class="rh-ponto-relatorio__metric min-h-[88px] flex items-center gap-4">
                <div :class="resumo.totalSaldo >= 0 ? 'rh-ponto-relatorio__metric-icon rh-ponto-relatorio__metric-icon--success' : 'rh-ponto-relatorio__metric-icon rh-ponto-relatorio__metric-icon--danger'" class="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center">
                  <i :class="resumo.totalSaldo >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="text-lg"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-black uppercase text-text-soft mb-0">Saldo</p>
                  <p :class="resumo.totalSaldo >= 0 ? 'text-[var(--ds-color-success-600)]' : 'text-[var(--ds-color-danger-600)]'" class="text-sm font-bold tabular-nums italic">
                    {{ resumo.totalSaldoHHMM }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Cards de resumo (Trabalhado, Horas Extras, Valor H.E., Dias com batida) -->
          <div v-if="funcionarioSelecionado" class="rh-ponto-relatorio__metrics-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="rh-ponto-relatorio__metric flex items-center gap-4 min-h-[88px]">
              <div class="rh-ponto-relatorio__metric-icon rh-ponto-relatorio__metric-icon--primary w-11 h-11 shrink-0 rounded-xl flex items-center justify-center">
                <i class="pi pi-stopwatch text-lg"></i>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase text-text-soft mb-0">Trabalhado</p>
                <p class="text-sm font-bold text-text-main tabular-nums truncate">{{ resumo.totalHorasHHMM }}</p>
              </div>
            </div>
            <div class="rh-ponto-relatorio__metric flex items-center gap-4 min-h-[88px]">
              <div class="rh-ponto-relatorio__metric-icon rh-ponto-relatorio__metric-icon--warning w-11 h-11 shrink-0 rounded-xl flex items-center justify-center">
                <i class="pi pi-clock text-lg"></i>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase text-text-soft mb-0">Horas extras</p>
                <p class="text-sm font-bold text-[var(--ds-color-warning-600)] tabular-nums truncate">{{ horasExtrasHHMM }}</p>
              </div>
            </div>
            <div class="rh-ponto-relatorio__metric flex items-center gap-4 min-h-[88px]">
              <div class="rh-ponto-relatorio__metric-icon rh-ponto-relatorio__metric-icon--success w-11 h-11 shrink-0 rounded-xl flex items-center justify-center">
                <i class="pi pi-wallet text-lg"></i>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase text-text-soft mb-0">Valor H.E.</p>
                <p class="text-sm font-bold text-text-main tabular-nums truncate">{{ valorHorasExtrasLabel }}</p>
              </div>
            </div>
            <div class="rh-ponto-relatorio__metric flex items-center gap-4 min-h-[88px]">
              <div class="rh-ponto-relatorio__metric-icon rh-ponto-relatorio__metric-icon--primary-strong w-11 h-11 shrink-0 rounded-xl flex items-center justify-center">
                <i class="pi pi-calendar text-lg"></i>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase text-text-soft mb-0">Dias com batida</p>
                <p class="text-sm font-bold text-text-main tabular-nums">{{ diasComBatida }}</p>
              </div>
            </div>
          </div>

          <!-- Tabela espelho de ponto -->
          <div class="native-table-flush rh-ponto-relatorio__table border-y border-border-ui overflow-hidden">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border-ui/50"></div>
              </div>
              <div class="relative flex justify-center py-2">
                <span class="bg-bg-page px-4 text-[10px] font-black uppercase tracking-wider text-text-soft">
                  Espelho de ponto
                </span>
              </div>
            </div>

            <div v-if="!rows.length" class="rh-ponto-relatorio__empty-state p-12 text-center">
              <i class="pi pi-inbox text-4xl text-slate-300 mb-4"></i>
              <p class="text-sm font-bold text-text-soft uppercase">Selecione um funcionário e clique em Buscar</p>
              <p class="text-xs text-text-soft mt-1">Os registros serão exibidos conforme o horário cadastrado</p>
            </div>

            <div v-else class="native-table-flush-scroll overflow-x-auto">
              <table class="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr class="bg-slate-50 dark:bg-slate-800/50">
                    <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-text-soft">Data</th>
                    <th class="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-text-soft">Batidas</th>
                    <th class="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-text-soft">Tempo</th>
                    <th class="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-text-soft">
                      Saldo
                      <span class="block text-[9px] font-normal text-slate-400 mt-0.5">(meta {{ JORNADA_META_MIN / 60 }}h)</span>
                    </th>
                    <th class="px-5 py-3 text-right text-[10px] font-black uppercase tracking-wider text-text-soft">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="linha in linhasRelatorio"
                    :key="linha.dia"
                    class="group border-t border-border-ui/60 hover:bg-bg-page/60 transition-colors"
                    :class="classeLinhaDia(linha)"
                  >
                    <td class="px-5 py-3">
                      <div class="flex flex-col">
                        <span class="text-sm font-bold text-text-main">{{ fmtData(linha.dia) }}</span>
                        <span class="text-[10px] font-medium text-text-soft uppercase">{{ getDiaSemana(linha.dia) }}</span>
                        <span v-if="linha.inconsistente" class="text-[10px] font-bold text-red-600 mt-0.5">Inconsistente</span>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex flex-wrap items-center gap-2">
                        <template v-if="linha.batidas && linha.batidas.length">
                          <template v-for="(batida, idx) in (expandedDias.has(linha.dia) || linha.batidas.length <= 4 ? linha.batidas : linha.batidas.slice(0, 4))" :key="batida.id || idx">
                            <div class="flex items-center gap-1.5 group/b">
                              <span
                                class="tabular-nums text-sm font-bold min-w-[2.2rem]"
                                :class="batida.tipo === 'ENTRADA' ? 'text-blue-600' : 'text-slate-700'"
                              >
                                {{ batida.hora }}
                              </span>
                              <span class="text-[10px] text-text-soft uppercase">{{ batida.tipo === 'ENTRADA' ? 'E' : 'S' }}</span>
                              <div class="flex items-center opacity-0 group-hover/b:opacity-100 transition-opacity gap-0.5">
                                <button
                                  type="button"
                                  @click="abrirComprovante(batida.id)"
                                  class="p-1 rounded-lg text-slate-400 hover:text-[var(--ds-color-success-600)] hover:bg-[var(--ds-color-success-50)]"
                                  title="Comprovante PDF"
                                >
                                  <i class="pi pi-file-pdf text-xs"></i>
                                </button>
                                <button
                                  type="button"
                                  @click="abrirComprovanteImagem(batida.id, 'png')"
                                  class="p-1 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50"
                                  title="Comprovante PNG"
                                >
                                  <i class="pi pi-image text-xs"></i>
                                </button>
                                <button
                                  type="button"
                                  @click="abrirModalEditar(batida)"
                                  class="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                  title="Editar"
                                >
                                  <i class="pi pi-pencil text-xs"></i>
                                </button>
                                <button
                                  type="button"
                                  @click="confirmarExcluirDireto(batida.id)"
                                  class="p-1 rounded-lg text-slate-400 hover:text-[var(--ds-color-danger-600)] hover:bg-[var(--ds-color-danger-50)]"
                                  title="Excluir"
                                >
                                  <i class="pi pi-trash text-xs"></i>
                                </button>
                              </div>
                            </div>
                          </template>
                          <button
                            v-if="linha.batidas.length > 4 && !expandedDias.has(linha.dia)"
                            type="button"
                            @click="toggleExpandDia(linha.dia)"
                            class="text-[10px] font-bold text-brand-primary hover:underline"
                          >
                            Ver mais ({{ linha.batidas.length }} batidas)
                          </button>
                          <button
                            v-else-if="linha.batidas.length > 4 && expandedDias.has(linha.dia)"
                            type="button"
                            @click="toggleExpandDia(linha.dia)"
                            class="text-[10px] font-bold text-text-soft hover:underline"
                          >
                            Ocultar
                          </button>
                        </template>
                        <span v-else class="text-slate-400 text-sm">—</span>
                        <button
                          type="button"
                          @click="abrirModalNovoDia(linha)"
                          :class="linha.inconsistente ? 'opacity-100 p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200' : 'opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-brand-primary hover:bg-brand-primary/10'"
                          class="transition-all"
                          :title="linha.inconsistente ? 'Adicionar batida faltante (ex.: saída)' : 'Adicionar batida'"
                        >
                          <i class="pi pi-plus text-xs"></i>
                        </button>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-center tabular-nums font-bold text-sm">
                      {{ linha.horasHHMM }}
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span
                        v-if="linha.inconsistente"
                        class="text-xs font-bold text-red-600"
                      >
                        Inconsistente
                      </span>
                      <span
                        v-else
                        class="tabular-nums font-bold text-sm"
                        :class="linha.saldoMin != null && linha.saldoMin > 0 ? 'text-[var(--ds-color-success-600)]' : linha.saldoMin != null && linha.saldoMin < 0 ? 'text-red-600' : 'text-text-main'"
                      >
                        {{ linha.saldoHHMM }}
                      </span>
                    </td>
                    <td class="px-5 py-3 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <Button
                          v-if="linha.inconsistente"
                          variant="outline"
                          size="sm"
                          class="h-8 px-3 rounded-lg text-[10px] font-bold uppercase"
                          @click="abrirModalNovoDia(linha)"
                        >
                          <i class="pi pi-plus mr-1 text-[10px]"></i>
                          Adicionar saída
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          class="h-8 px-3 rounded-lg text-[10px] font-bold uppercase"
                          @click="abrirModalJustificar({ data: linha.dia })"
                        >
                          Justificar
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>
    </section>
  </PageShell>

    <!-- Modal Editar / Novo -->
    <div v-if="modalEditar.open" class="rh-ponto-relatorio__modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="rh-ponto-relatorio__modal bg-bg-card w-full max-w-md overflow-hidden">
        <div class="rh-ponto-relatorio__modal-head p-6 flex justify-between items-center">
          <h3 class="font-black text-text-main uppercase text-lg">{{ modalEditar.id ? 'Ajustar horário' : 'Novo horário' }}</h3>
          <button type="button" @click="modalEditar.open = false" class="p-2 text-text-soft hover:text-[var(--ds-color-danger-500)] rounded-lg transition-colors">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="rh-ponto-relatorio__modal-body p-6 space-y-4">
          <div>
            <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Data e hora</label>
            <input
              v-model="modalEditar.form.data_hora_local"
              type="datetime-local"
              class="w-full h-11 rounded-xl px-4 text-sm font-semibold bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </div>
          <div>
            <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Tipo</label>
            <select
              v-model="modalEditar.form.tipo"
              class="w-full h-11 rounded-xl px-4 text-sm font-semibold bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Observação</label>
            <input
              v-model="modalEditar.form.observacao"
              type="text"
              placeholder="Motivo do ajuste..."
              class="w-full h-11 rounded-xl px-4 text-sm font-medium bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30 placeholder:text-slate-400"
            />
          </div>
        </div>
        <div class="rh-ponto-relatorio__modal-foot p-6 flex gap-3">
          <Button variant="outline" class="flex-1" @click="modalEditar.open = false">Cancelar</Button>
          <Button variant="primary" class="flex-1" :loading="modalEditar.saving" @click="confirmarSalvarEdicao">
            Salvar
          </Button>
        </div>
      </div>
    </div>

    <!-- Modal Justificativa -->
    <div v-if="modalJust.open" class="rh-ponto-relatorio__modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="rh-ponto-relatorio__modal bg-bg-card w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="rh-ponto-relatorio__modal-head p-6 flex justify-between items-center">
          <div>
            <h3 class="font-black text-text-main uppercase text-lg">Justificativa</h3>
            <p class="text-[10px] font-bold text-text-soft uppercase mt-1">
              {{ modalJust.form.data_fim && modalJust.form.data_fim !== modalJust.form.data ? `Período: ${fmtData(modalJust.form.data)} a ${fmtData(modalJust.form.data_fim)}` : `Data: ${fmtData(modalJust.dia)}` }}
            </p>
          </div>
          <button type="button" @click="modalJust.open = false" class="p-2 text-text-soft hover:text-[var(--ds-color-danger-500)] rounded-lg transition-colors">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="rh-ponto-relatorio__modal-body p-6 space-y-5 overflow-y-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Tipo (ex: Atestado)</label>
              <input
                v-model="modalJust.form.tipo"
                type="text"
                class="w-full h-11 rounded-xl px-4 text-sm font-semibold bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div>
              <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Data inicial</label>
              <input
                v-model="modalJust.form.data"
                type="date"
                class="w-full h-11 rounded-xl px-4 text-sm font-semibold bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Data final (opcional — mesmo dia ou período)</label>
              <input
                v-model="modalJust.form.data_fim"
                type="date"
                class="w-full h-11 rounded-xl px-4 text-sm font-semibold bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div>
              <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Das (horário)</label>
              <input
                v-model="modalJust.form.hora_inicio"
                type="time"
                class="w-full h-11 rounded-xl px-4 text-sm font-semibold bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div>
              <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Até (horário)</label>
              <input
                v-model="modalJust.form.hora_fim"
                type="time"
                class="w-full h-11 rounded-xl px-4 text-sm font-semibold bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Ou informe os minutos (ex: 60 = 1h; vazio = dia inteiro)</label>
              <input
                v-model.number="modalJust.form.minutos_justificados"
                type="number"
                min="0"
                max="1440"
                placeholder="Ex: 60 — ou use os horários acima"
                class="w-full h-11 rounded-xl px-4 text-sm font-semibold bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>
          <div>
            <label class="text-[10px] font-black text-text-soft uppercase block mb-1">Descrição</label>
            <textarea
              v-model="modalJust.form.descricao"
              spellcheck="true"
              lang="pt-BR"
              rows="3"
              class="w-full rounded-xl p-4 text-sm font-medium bg-bg-card text-text-main border border-border-ui outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
            ></textarea>
          </div>
          <div>
            <label class="text-[10px] font-black text-text-soft uppercase block mb-2">Anexo</label>
            <input ref="justificativaFileRef" type="file" class="hidden" accept="image/*,.pdf,.doc,.docx" @change="onJustificativaFilePick" />
            <div
              @click="justificativaFileRef?.click()"
              class="rh-ponto-relatorio__upload border-2 border-dashed border-border-ui rounded-xl p-4 cursor-pointer hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="rh-ponto-relatorio__upload-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                  <i class="pi pi-cloud-upload"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-text-main truncate">{{ justificativaArquivoNome || 'Clique para selecionar (PDF, imagem, doc)' }}</p>
                </div>
              </div>
              <button
                v-if="justificativaArquivoNome"
                type="button"
                @click.stop="limparJustificativaArquivo"
                class="shrink-0 w-9 h-9 rounded-xl border border-border-ui text-text-soft hover:text-[var(--ds-color-danger-500)] flex items-center justify-center"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="rh-ponto-relatorio__modal-foot p-6 flex gap-3">
          <Button variant="outline" class="flex-1" @click="modalJust.open = false">Fechar</Button>
          <Button variant="primary" class="flex-1" :loading="modalJust.saving" @click="confirmarSalvarJustificativa">
            Lançar justificativa
          </Button>
        </div>
      </div>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import MonthReferenceField from '@/components/ui/MonthReferenceField.vue'
import { useRouter } from 'vue-router'
import {
  PontoRelatorioService,
  PontoJustificativasService,
  PontoRegistrosService,
} from '@/services/index'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'
import { consolidarSaldoPeriodo, derivarCargaDosHorarios } from '@/utils/utils'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { listDays, groupRegistrosByDia, JORNADA_META_MIN } from '@/utils/ponto'
import { onlyNumbers } from '@/utils/masks'
import { numeroParaMoeda } from '@/utils/number'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

definePage({ meta: { perm: 'ponto_relatorio.ver' } })

const router = useRouter()
const loadingTabela = ref(false)
const loadingPdf = ref(false)
const loadingComprovanteId = ref(null)
const rows = ref([])
const justificativas = ref([])
const funcionarioOptions = ref([])
const funcionarios = ref([])

const filtros = reactive({ funcionario_id: '', data_ini: '', data_fim: '' })
const apenasAteHoje = ref(false)

function getMesInicioISO() {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
}
function getMesFimISO() {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)
}

const mesReferencia = computed({
  get: () => {
    const base = filtros.data_ini || getMesInicioISO()
    return String(base).slice(0, 7)
  },
  set: (valor) => {
    const [anoStr, mesStr] = String(valor || '').split('-')
    const ano = Number(anoStr)
    const mes = Number(mesStr)
    if (!ano || !mes) return
    aplicarMesReferencia(ano, mes - 1)
  },
})

function aplicarMesReferencia(ano, mes) {
  const primeiro = new Date(ano, mes, 1)
  const ultimo = new Date(ano, mes + 1, 0)
  filtros.data_ini = primeiro.toISOString().slice(0, 10)
  filtros.data_fim = ultimo.toISOString().slice(0, 10)
  buscar()
}

const rowsFiltrados = computed(() => {
  return (rows.value || []).filter((r) => {
    const dia = new Date(r.data_hora).getDay()
    return dia !== 0
  })
})

const registrosPorDia = computed(() => groupRegistrosByDia(rowsFiltrados.value))

const funcionarioSelecionado = computed(() => {
  const id = Number(filtros.funcionario_id || 0)
  return funcionarios.value.find((f) => Number(f.id) === id) || null
})

const horarioSegSex = computed(() => {
  const f = funcionarioSelecionado.value
  if (!f) return ''
  const e1 = f.horario_entrada_1 || '--:--'
  const s1 = f.horario_saida_1 || '--:--'
  const e2 = f.horario_entrada_2 || '--:--'
  const s2 = f.horario_saida_2 || '--:--'
  const turno1 = `${e1} - ${s1}`
  const turno2 = e2 || s2 ? `${e2} - ${s2}` : null
  return turno2 ? `${turno1} / ${turno2}` : turno1
})

const horarioSabado = computed(() => {
  const f = funcionarioSelecionado.value
  if (!f?.horario_sabado_entrada_1 && !f?.horario_sabado_saida_1) return ''
  const e = f.horario_sabado_entrada_1 || '--:--'
  const s = f.horario_sabado_saida_1 || '--:--'
  return `${e} - ${s}`
})

const cargaHorariaLabel = computed(() => {
  const f = funcionarioSelecionado.value
  if (!f) return '-'
  const derivado = derivarCargaDosHorarios(f)
  const dia = Number(f.carga_horaria_dia || 0)
  const sem = Number(f.carga_horaria_semana || 0)
  if (derivado.cargaSegSex > 0 || derivado.cargaSabado > 0) {
    const parts = []
    if (derivado.cargaSegSex > 0) parts.push(`${derivado.cargaSegSex.toFixed(1)}h (Seg–Sex)`)
    if (derivado.cargaSabado > 0) parts.push(`${derivado.cargaSabado.toFixed(1)}h (Sáb)`)
    return parts.join(' / ')
  }
  if (dia > 0) return `${dia}h/dia`
  if (sem > 0) return `${sem}h/semana`
  return 'Não definido'
})

const valorHoraLabel = computed(() => {
  const f = funcionarioSelecionado.value
  if (!f || f.custo_hora == null || f.custo_hora === '') return '—'
  const v = Number(f.custo_hora)
  if (Number.isNaN(v) || v === 0) return '—'
  return `R$ ${numeroParaMoeda(v)}`
})

const dataFimEfetivo = computed(() => {
  if (!apenasAteHoje.value || !filtros.data_fim) return filtros.data_fim || null
  const hoje = new Date().toISOString().slice(0, 10)
  return hoje < filtros.data_fim ? hoje : filtros.data_fim
})

/** Mapa dia (YYYY-MM-DD) -> minutos justificados para reduzir a meta no cálculo */
const justificativasPorDia = computed(() => {
  const map = {}
  for (const j of justificativas.value || []) {
    const dia = new Date(j.data).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    const min = Number(j.minutos_justificados ?? 0) || 0
    map[dia] = (map[dia] || 0) + min
  }
  return map
})

const resumo = computed(() => {
  const base = consolidarSaldoPeriodo({
    registros: rowsFiltrados.value,
    funcionario: funcionarioSelecionado.value || undefined,
    horasSemana: 48,
    diasSemana: 6,
    dataIni: filtros.data_ini || null,
    dataFim: dataFimEfetivo.value || filtros.data_fim || null,
    motorAcasa: true,
    justificativasPorDia: justificativasPorDia.value,
  })
  return base
})

const diasComBatida = computed(() => {
  return registrosPorDia.value.size
})

/** Horas extras do período (saldo positivo em HH:MM). */
const horasExtrasHHMM = computed(() => {
  const saldo = resumo.value?.totalSaldo ?? 0
  if (saldo <= 0) return '00:00'
  return resumo.value?.totalSaldoHHMM ?? '00:00'
})

/** Valor em R$ das horas extras (saldo positivo × custo/hora × 1,5). */
const valorHorasExtrasLabel = computed(() => {
  const saldo = resumo.value?.totalSaldo ?? 0
  if (saldo <= 0) return 'R$ 0,00'
  const f = funcionarioSelecionado.value
  const custoHora = f ? Number(f.custo_hora || 0) : 0
  if (custoHora <= 0) return '—'
  const valor = saldo * custoHora * 1.5
  return `R$ ${numeroParaMoeda(valor)}`
})

/** Linhas do espelho para exibição (exclui domingo, ordena data desc). */
const linhasRelatorio = computed(() => {
  const list = (resumo.value.linhas || []).filter(
    (l) => new Date(l.dia + 'T12:00:00').getDay() !== 0,
  )
  return list.sort((a, b) => b.dia.localeCompare(a.dia))
})

/** Dias com lista de batidas expandida (> 4 batidas). */
const expandedDias = ref(new Set())
function toggleExpandDia(dia) {
  const next = new Set(expandedDias.value)
  if (next.has(dia)) next.delete(dia)
  else next.add(dia)
  expandedDias.value = next
}

/** Estilo da linha: vermelho (inconsistente ou saldo negativo), verde (saldo positivo). */
function classeLinhaDia(linha) {
  if (linha.inconsistente || (linha.saldoMin != null && linha.saldoMin < 0))
    return 'bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500'
  if (linha.saldoMin != null && linha.saldoMin > 0)
    return 'bg-[var(--ds-color-success-50)] border-l-4 border-[var(--ds-color-success-500)]'
  return ''
}

const modalEditar = reactive({
  open: false,
  saving: false,
  id: null,
  form: { funcionario_id: null, data_hora_local: '', tipo: 'ENTRADA', observacao: '' },
})

const modalJust = reactive({
  open: false,
  saving: false,
  dia: '',
  form: { funcionario_id: null, data: '', data_fim: '', tipo: '', descricao: '', arquivo_id: null, minutos_justificados: null, hora_inicio: '', hora_fim: '' },
})

const justificativaFileRef = ref(null)
const justificativaFileToUpload = ref(null)
const justificativaArquivoNome = ref('')

const fmtData = (v) => (v ? v.split('-').reverse().join('/') : '-')
/** Formato para input datetime-local em America/Sao_Paulo (YYYY-MM-DDTHH:mm) */
const toDateTimeLocalBR = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const timeStr = d.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${dateStr}T${timeStr}`
}
const fmtHoraLocal = (iso) => {
  if (!iso) return '--:--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
const getDiaSemana = (dataStr) => {
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  const data = new Date(dataStr + 'T12:00:00')
  return dias[data.getDay()]
}
const getMesAnoReferencia = () => {
  const base = filtros.data_ini || new Date().toISOString().slice(0, 10)
  const [y, m] = String(base).split('-').map(Number)
  return { mes: m, ano: y }
}
const isFimDeSemanaErro = (dataStr, horaStr) => {
  if (!horaStr) return false
  const data = new Date(dataStr + 'T12:00:00')
  const [h, m] = horaStr.split(':').map(Number)
  return data.getDay() === 6 && (h > 12 || (h === 12 && m > 0))
}

async function buscar() {
  if (!filtros.funcionario_id) {
    rows.value = []
    justificativas.value = []
    return
  }
  try {
    loadingTabela.value = true
    const dataFimEnviar = dataFimEfetivo.value || filtros.data_fim
    const [resReg, resJust] = await Promise.all([
      PontoRelatorioService.listarRegistros({
        ...filtros,
        data_fim: dataFimEnviar || undefined,
      }),
      filtros.funcionario_id
        ? PontoJustificativasService.listar({
            funcionario_id: filtros.funcionario_id,
            data_ini: filtros.data_ini || undefined,
            data_fim: dataFimEnviar || filtros.data_fim || undefined,
          })
        : Promise.resolve({ data: [] }),
    ])
    rows.value = resReg?.data ?? resReg ?? []
    justificativas.value = resJust?.data ?? resJust ?? []
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao buscar')
  } finally {
    loadingTabela.value = false
  }
}

async function gerarRelatorioMensal() {
  if (!filtros.funcionario_id) return notify.warn('Selecione um funcionário')
  const { mes, ano } = getMesAnoReferencia()
  const funcionario_id = Number(String(filtros.funcionario_id).replace(/\D/g, ''))
  try {
    loadingPdf.value = true
    const res = await PontoRelatorioService.pdfMensalSalvar({ funcionario_id, mes, ano })
    const data = res?.data ?? res
    const arquivoId = data?.arquivoId ?? data?.data?.arquivoId
    if (arquivoId) {
      router.push(`/arquivos/${arquivoId}?name=RELATORIO_PONTO_${String(mes).padStart(2, '0')}_${ano}&type=application/pdf`)
      notify.success('PDF gerado.')
    } else {
      await abrirPdfViaBlob(funcionario_id, mes, ano)
    }
  } catch (e) {
    console.error('[PONTO PDF]', e?.response?.data || e)
    notify.warn(e?.response?.data?.message || 'Erro ao gerar PDF. Abrindo via stream...')
    await abrirPdfViaBlob(funcionario_id, mes, ano)
  } finally {
    loadingPdf.value = false
  }
}

async function abrirPdfViaBlob(funcionario_id, mes, ano) {
  try {
    const res = await PontoRelatorioService.pdfMensal({ funcionario_id, mes, ano })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (e) {
    console.error('[PONTO PDF blob]', e)
    notify.error(e?.response?.data?.message || 'Não foi possível abrir o PDF.')
  }
}

async function abrirComprovante(registroId) {
  if (!registroId || loadingComprovanteId.value === registroId) return
  loadingComprovanteId.value = registroId
  try {
    const res = await PontoRelatorioService.comprovantePdf(registroId)
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const imprimiu = await tentarImprimirPdf(blob)
    if (!imprimiu) {
      await abrirBlobComFallback(blob, `comprovante-ponto-${registroId}.pdf`)
    }
  } catch (e) {
    console.error('[PONTO COMPROVANTE]', e)
    notify.error(e?.response?.data?.message || 'Não foi possível abrir o comprovante.')
  } finally {
    loadingComprovanteId.value = null
  }
}

async function abrirComprovanteImagem(registroId, formato = 'png') {
  if (!registroId || loadingComprovanteId.value === registroId) return
  loadingComprovanteId.value = registroId
  try {
    const res = await PontoRelatorioService.comprovanteImagem(registroId, formato)
    // Usa o tipo real da resposta (backend pode devolver JPEG ou PDF quando PNG falha)
    const mime = res.data?.type || (formato === 'jpeg' || formato === 'jpg' ? 'image/jpeg' : 'image/png')
    const ext = mime.includes('pdf') ? 'pdf' : (mime.includes('jpeg') ? 'jpg' : 'png')
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: mime })
    await abrirBlobComFallback(blob, `comprovante-ponto-${registroId}.${ext}`)
  } catch (e) {
    console.error('[PONTO COMPROVANTE IMAGEM]', e)
    notify.error(e?.response?.data?.message || 'Não foi possível gerar o comprovante.')
  } finally {
    loadingComprovanteId.value = null
  }
}

async function tentarImprimirPdf(blob) {
  const isTauri = typeof window !== 'undefined' && (window.__TAURI__ ?? window.__TAURI_INTERNALS__)
  if (isTauri) return false
  if (typeof document === 'undefined') return false

  const url = URL.createObjectURL(blob)
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.src = url
  document.body.appendChild(iframe)

  return await new Promise((resolve) => {
    const cleanup = () => {
      try {
        iframe.remove()
      } catch {}
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    const timeout = setTimeout(() => {
      cleanup()
      resolve(false)
    }, 4000)

    iframe.onload = () => {
      clearTimeout(timeout)
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
          cleanup()
          resolve(true)
        } catch (e) {
          console.error('[PONTO COMPROVANTE PRINT]', e)
          cleanup()
          resolve(false)
        }
      }, 200)
    }
  })
}

async function abrirBlobComFallback(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob)
  const isTauri = typeof window !== 'undefined' && (window.__TAURI__ ?? window.__TAURI_INTERNALS__)

  try {
    if (isTauri) {
      baixarBlob(url, nomeArquivo)
      notify.info('Comprovante baixado. Abra o arquivo para imprimir.')
      return
    }
    try {
      const opened = window.open(url, '_blank', 'noopener,noreferrer')
      if (opened) return
    } catch {}

    baixarBlob(url, nomeArquivo)
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }
}

function baixarBlob(url, nomeArquivo) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = nomeArquivo
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

function abrirWhatsComprovante() {
  const f = funcionarioSelecionado.value
  if (!f?.whatsapp) {
    notify.warn('Funcionário sem WhatsApp cadastrado.')
    return
  }
  const num = onlyNumbers(String(f.whatsapp))
  if (num.length < 10) {
    notify.warn('Número de WhatsApp inválido.')
    return
  }
  const numeroWa = num.startsWith('55') ? num : `55${num}`
  const dataIni = filtros.data_ini ? fmtData(filtros.data_ini) : '-'
  const dataFim = filtros.data_fim ? fmtData(filtros.data_fim) : '-'
  const nome = String(f.nome || '').trim() || 'Colaborador'
  const msg =
`Olá ${nome}!

Resumo do seu ponto:
Período: ${dataIni} a ${dataFim}
Horas trabalhadas: ${resumo.value.totalHorasHHMM}
Saldo: ${resumo.value.totalSaldoHHMM}

Acesse o sistema para o espelho completo.`
  const url = `https://wa.me/${numeroWa}?text=${encodeURIComponent(msg)}`

  const isTauri = typeof window !== 'undefined' && (window.__TAURI__ ?? window.__TAURI_INTERNALS__)
  if (isTauri) {
    try {
      const tauri = window.__TAURI__ ?? window.__TAURI_INTERNALS__
      if (tauri?.opener?.open) {
        tauri.opener.open(url)
        return
      }
      if (typeof tauri?.opener?.openUrl === 'function') {
        tauri.opener.openUrl(url)
        return
      }
      if (tauri?.shell?.open) {
        tauri.shell.open(url)
        return
      }
    } catch (e) {
      console.error('[PONTO_WHATS_TAURI]', e)
    }
  }
  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (opened) return
  } catch {}
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    return
  } catch {}
  window.location.href = url
}

async function confirmarExcluirDireto(id) {
  if (!(await confirm.show('Excluir', 'Deseja apagar este registro?'))) return
  try {
    await PontoRegistrosService.remover(id)
    notify.success('Apagado!')
    await buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao excluir')
  }
}

function abrirModalNovoDia(linha) {
  const f = funcionarioSelecionado.value
  const ultimaBatida = linha.batidas?.length ? linha.batidas[linha.batidas.length - 1] : null
  const proximoTipo = ultimaBatida?.tipo === 'ENTRADA' ? 'SAIDA' : 'ENTRADA'
  const hDefault = proximoTipo === 'ENTRADA' ? (f?.horario_entrada_1 || '08:00') : (f?.horario_saida_1 || '12:00')
  Object.assign(modalEditar, {
    open: true,
    id: null,
    form: {
      funcionario_id: filtros.funcionario_id,
      data_hora_local: `${linha.dia}T${hDefault}`,
      tipo: proximoTipo,
      observacao: 'AJUSTE MANUAL',
    },
  })
}

function abrirModalEditar(batida) {
  Object.assign(modalEditar, {
    open: true,
    id: batida.id,
    form: {
      funcionario_id: filtros.funcionario_id,
      data_hora_local: toDateTimeLocalBR(batida.data_hora),
      tipo: batida.tipo,
      observacao: batida.observacao || '',
    },
  })
}

async function confirmarSalvarEdicao() {
  try {
    modalEditar.saving = true
    const payload = {
        funcionario_id: Number(modalEditar.form.funcionario_id),
        tipo: modalEditar.form.tipo,
        observacao: modalEditar.form.observacao || null,
        data_hora: `${modalEditar.form.data_hora_local}:00-03:00`,
      }
    if (modalEditar.id) {
      await PontoRegistrosService.atualizar(modalEditar.id, payload)
    } else {
      await PontoRegistrosService.salvar(payload)
    }
    notify.success('Sucesso!')
    modalEditar.open = false
    await buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao salvar')
  } finally {
    modalEditar.saving = false
  }
}

function onJustificativaFilePick(e) {
  const file = e?.target?.files?.[0]
  if (!file) return
  justificativaFileToUpload.value = file
  justificativaArquivoNome.value = file.name
}

function limparJustificativaArquivo() {
  justificativaFileToUpload.value = null
  justificativaArquivoNome.value = ''
  if (justificativaFileRef.value) justificativaFileRef.value.value = ''
  modalJust.form.arquivo_id = null
}

function abrirModalJustificar(row) {
  limparJustificativaArquivo()
  Object.assign(modalJust, {
    open: true,
    dia: row.data,
    form: {
      funcionario_id: filtros.funcionario_id,
      data: row.data,
      data_fim: row.data,
      tipo: '',
      descricao: '',
      arquivo_id: null,
      minutos_justificados: null,
      hora_inicio: '',
      hora_fim: '',
    },
  })
}

async function confirmarSalvarJustificativa() {
  try {
    if (!modalJust.form.data?.trim()) {
      notify.warn('Informe a data inicial.')
      return
    }
    if (!modalJust.form.tipo?.trim()) {
      notify.warn('Informe o tipo da justificativa (ex: Atestado).')
      return
    }
    modalJust.saving = true
    const form = { ...modalJust.form }
    const funcionario_id = Number(String(form.funcionario_id || '').replace(/\D/g, ''))
    if (justificativaFileToUpload.value && funcionario_id) {
      const { data } = await ArquivosService.upload({
        ownerType: 'FUNCIONARIO',
        ownerId: funcionario_id,
        file: justificativaFileToUpload.value,
        categoria: 'JUSTIFICATIVA_PONTO',
        slot_key: form.data,
      })
      if (data?.id) form.arquivo_id = data.id
    }
    const payload = {
      funcionario_id,
      data: form.data,
      tipo: form.tipo || 'OUTRO',
      descricao: form.descricao || null,
      arquivo_id: form.arquivo_id ?? null,
    }
    if (form.data_fim && form.data_fim.trim() && form.data_fim >= form.data) {
      payload.data_fim = form.data_fim.trim()
    }
    let minutos = form.minutos_justificados != null && form.minutos_justificados !== '' ? Number(form.minutos_justificados) : null
    if (minutos == null && form.hora_inicio && form.hora_fim) {
      const [hi, mi] = (form.hora_inicio + ':00').split(':').map(Number)
      const [hf, mf] = (form.hora_fim + ':00').split(':').map(Number)
      const totalMin = (hf * 60 + mf) - (hi * 60 + mi)
      if (totalMin > 0) minutos = totalMin
    }
    if (minutos != null && minutos >= 0) payload.minutos_justificados = minutos
    const res = await PontoJustificativasService.salvar(payload)
    const data = res?.data ?? res
    const plural = data?.criados > 1 || (Array.isArray(data?.itens) && data.itens.length > 1)
    notify.success(plural ? 'Justificativas salvas!' : 'Justificativa salva!')
    modalJust.open = false
    limparJustificativaArquivo()
    await buscar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao salvar')
  } finally {
    modalJust.saving = false
  }
}

onMounted(async () => {
  filtros.data_ini = getMesInicioISO()
  filtros.data_fim = getMesFimISO()
  try {
    const { data } = await PontoRelatorioService.listarFuncionariosAtivos()
    const lista = data?.data || data || []
    funcionarios.value = Array.isArray(lista) ? lista : []
    funcionarioOptions.value = funcionarios.value.map((f) => ({
      label: `${String(f.nome || '').toUpperCase()} #${f.id}`,
      value: f.id,
    }))
  } catch (e) {
    funcionarios.value = []
    funcionarioOptions.value = []
    notify.error('Não foi possível carregar funcionários.')
  }
})
</script>

<style scoped>
.rh-ponto-relatorio__body {
  width: min(100%, 1460px);
  margin: 0 auto;
  padding: 0.85rem 1rem 1.5rem;
}

.rh-ponto-relatorio__filters {
  padding: 0 0 1.25rem;
  border-bottom: 1px solid rgba(214, 224, 234, 0.62);
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--ds-color-primary) 7%, transparent),
      color-mix(in srgb, var(--ds-color-success) 5%, transparent) 42%,
      transparent 78%
    );
}

.rh-ponto-relatorio__month-nav {
  border-radius: 999px !important;
  box-shadow: none;
  border-color: color-mix(in srgb, var(--ds-color-primary) 18%, var(--ds-color-border) 82%) !important;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ds-color-surface) 96%, white 4%),
    color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-surface) 92%)
  ) !important;
  color: var(--ds-color-primary-strong) !important;
}

.rh-ponto-relatorio__month-label {
  border-bottom: 1px solid rgba(15, 23, 42, 0.18);
  border-radius: 0 !important;
  background:
    linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--ds-color-primary) 16%, transparent) 18%,
      color-mix(in srgb, var(--ds-color-success) 10%, transparent) 82%,
      transparent
    ) !important;
  color: var(--ds-color-text) !important;
}

.rh-ponto-relatorio__metric {
  padding: 1rem 0 0.95rem;
  border-top: 1px solid rgba(214, 224, 234, 0.58);
  background: transparent;
}

.rh-ponto-relatorio__metric-icon {
  color: var(--ds-color-text);
}

.rh-ponto-relatorio__metric-icon--primary {
  background: color-mix(in srgb, var(--ds-color-primary) 12%, var(--ds-color-surface) 88%);
  color: var(--ds-color-primary);
}

.rh-ponto-relatorio__metric-icon--primary-strong {
  background: color-mix(in srgb, var(--ds-color-primary-strong) 12%, var(--ds-color-surface) 88%);
  color: var(--ds-color-primary-strong);
}

.rh-ponto-relatorio__metric-icon--success {
  background: color-mix(in srgb, var(--ds-color-success) 12%, var(--ds-color-surface) 88%);
  color: var(--ds-color-success);
}

.rh-ponto-relatorio__metric-icon--warning {
  background: color-mix(in srgb, var(--ds-color-warning) 14%, var(--ds-color-surface) 86%);
  color: var(--ds-color-warning);
}

.rh-ponto-relatorio__metric-icon--danger {
  background: color-mix(in srgb, var(--ds-color-danger) 12%, var(--ds-color-surface) 88%);
  color: var(--ds-color-danger);
}

.rh-ponto-relatorio__metrics-grid > .rh-ponto-relatorio__metric {
  position: relative;
}

.rh-ponto-relatorio__metrics-grid > .rh-ponto-relatorio__metric::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  width: 72px;
  height: 2px;
  border-radius: 999px;
  opacity: 0.9;
}

.rh-ponto-relatorio__metrics-grid > .rh-ponto-relatorio__metric:nth-child(4n + 1)::before {
  background: linear-gradient(90deg, var(--ds-color-primary), color-mix(in srgb, var(--ds-color-primary) 22%, transparent));
}

.rh-ponto-relatorio__metrics-grid > .rh-ponto-relatorio__metric:nth-child(4n + 2)::before {
  background: linear-gradient(90deg, var(--ds-color-warning), color-mix(in srgb, var(--ds-color-warning) 22%, transparent));
}

.rh-ponto-relatorio__metrics-grid > .rh-ponto-relatorio__metric:nth-child(4n + 3)::before {
  background: linear-gradient(90deg, var(--ds-color-success), color-mix(in srgb, var(--ds-color-success) 22%, transparent));
}

.rh-ponto-relatorio__metrics-grid > .rh-ponto-relatorio__metric:nth-child(4n + 4)::before {
  background: linear-gradient(90deg, var(--ds-color-primary-strong), color-mix(in srgb, var(--ds-color-primary-strong) 20%, transparent));
}

.rh-ponto-relatorio__metrics-grid {
  gap: 0.75rem;
}

.rh-ponto-relatorio__table {
  background: transparent;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-image: linear-gradient(
    90deg,
    color-mix(in srgb, var(--ds-color-primary) 34%, transparent),
    color-mix(in srgb, var(--ds-color-success) 22%, transparent),
    color-mix(in srgb, var(--ds-color-primary-strong) 26%, transparent)
  ) 1;
}

.rh-ponto-relatorio__empty-state {
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--ds-color-primary) 10%, var(--ds-color-surface) 90%),
      color-mix(in srgb, var(--ds-color-surface-muted) 32%, transparent)
    );
}

.rh-ponto-relatorio__modal-overlay {
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(8px);
}

.rh-ponto-relatorio__modal {
  border: 1px solid rgba(214, 224, 234, 0.78);
  border-radius: 1.5rem;
  background: color-mix(in srgb, var(--ds-color-surface, #ffffff) 94%, transparent);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
}

.rh-ponto-relatorio__modal-head {
  background: transparent;
  border-bottom: 1px solid rgba(214, 224, 234, 0.72);
}

.rh-ponto-relatorio__modal-body {
  background: transparent;
}

.rh-ponto-relatorio__modal-foot {
  background: linear-gradient(180deg, rgba(248, 250, 252, 0), rgba(248, 250, 252, 0.78));
  border-top: 1px solid rgba(214, 224, 234, 0.72);
}

.rh-ponto-relatorio__modal :is(input, select, textarea) {
  border-width: 0 0 1px;
  border-radius: 0;
  background: transparent;
  padding-left: 0;
  padding-right: 0;
  box-shadow: none;
}

.rh-ponto-relatorio__modal :is(input, select, textarea):focus {
  border-bottom-color: rgba(37, 99, 235, 0.55);
  box-shadow: inset 0 -1px 0 rgba(37, 99, 235, 0.55);
}

.rh-ponto-relatorio__modal textarea {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.rh-ponto-relatorio__upload {
  border-color: rgba(214, 224, 234, 0.86);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.68), rgba(248, 250, 252, 0.22));
}

.rh-ponto-relatorio__upload-icon {
  background: rgba(241, 245, 249, 0.9);
  color: rgb(100 116 139);
}

.rh-ponto-relatorio :deep(.ds-shell-card) {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.rh-ponto-relatorio :deep(.ds-header-block) {
  padding-left: 1rem;
  padding-right: 1rem;
}

.rh-ponto-relatorio__table :deep(thead tr) {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--ds-color-primary) 11%, var(--ds-color-surface) 89%),
    color-mix(in srgb, var(--ds-color-success) 8%, var(--ds-color-surface) 92%)
  ) !important;
}

.rh-ponto-relatorio__table :deep(tbody tr:hover) {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--ds-color-primary) 9%, transparent),
    color-mix(in srgb, var(--ds-color-success) 6%, transparent)
  ) !important;
}

.dark .rh-ponto-relatorio__filters {
  border-bottom-color: rgba(51, 71, 102, 0.72);
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--ds-color-primary) 16%, transparent),
      color-mix(in srgb, var(--ds-color-success) 10%, transparent) 42%,
      transparent 78%
    );
}

.dark .rh-ponto-relatorio__month-nav {
  border-color: color-mix(in srgb, var(--ds-color-primary) 22%, var(--ds-color-border) 78%) !important;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ds-color-surface-muted) 88%, black 12%),
    color-mix(in srgb, var(--ds-color-primary) 10%, var(--ds-color-surface) 90%)
  ) !important;
  color: var(--ds-color-primary-strong) !important;
}

.dark .rh-ponto-relatorio__month-label {
  border-bottom-color: rgba(148, 163, 184, 0.18);
  background:
    linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--ds-color-primary) 16%, transparent) 18%,
      color-mix(in srgb, var(--ds-color-success) 10%, transparent) 82%,
      transparent
    ) !important;
  color: rgb(241 245 249) !important;
}

.dark .rh-ponto-relatorio__metric {
  border-top-color: rgba(51, 71, 102, 0.68);
}

.dark .rh-ponto-relatorio__metric-icon--primary {
  background: color-mix(in srgb, var(--ds-color-primary) 18%, var(--ds-color-surface) 82%);
  color: var(--ds-color-primary-strong);
}

.dark .rh-ponto-relatorio__metric-icon--primary-strong {
  background: color-mix(in srgb, var(--ds-color-primary-strong) 18%, var(--ds-color-surface) 82%);
  color: var(--ds-color-primary-strong);
}

.dark .rh-ponto-relatorio__metric-icon--success {
  background: color-mix(in srgb, var(--ds-color-success) 18%, var(--ds-color-surface) 82%);
  color: var(--ds-color-success);
}

.dark .rh-ponto-relatorio__metric-icon--warning {
  background: color-mix(in srgb, var(--ds-color-warning) 20%, var(--ds-color-surface) 80%);
  color: var(--ds-color-warning);
}

.dark .rh-ponto-relatorio__metric-icon--danger {
  background: color-mix(in srgb, var(--ds-color-danger) 18%, var(--ds-color-surface) 82%);
  color: var(--ds-color-danger);
}

.dark .rh-ponto-relatorio__empty-state {
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--ds-color-primary) 12%, var(--ds-color-surface) 88%),
      color-mix(in srgb, var(--ds-color-surface-muted) 24%, transparent)
    );
}

.dark .rh-ponto-relatorio__modal {
  border-color: rgba(51, 71, 102, 0.9);
  background: color-mix(in srgb, rgb(15 23 42) 94%, transparent);
  box-shadow: 0 24px 70px rgba(2, 6, 23, 0.45);
}

.dark .rh-ponto-relatorio__modal-head {
  border-bottom-color: rgba(51, 71, 102, 0.72);
}

.dark .rh-ponto-relatorio__modal-foot {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0), rgba(15, 23, 42, 0.84));
  border-top-color: rgba(51, 71, 102, 0.72);
}

.dark .rh-ponto-relatorio__upload {
  border-color: rgba(71, 85, 105, 0.9);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.52), rgba(15, 23, 42, 0.3));
}

.dark .rh-ponto-relatorio__upload-icon {
  background: rgba(30, 41, 59, 0.92);
  color: rgb(148 163 184);
}

.dark .rh-ponto-relatorio__table :deep(thead tr) {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--ds-color-primary) 14%, var(--ds-color-surface) 86%),
    color-mix(in srgb, var(--ds-color-success) 10%, var(--ds-color-surface) 90%)
  ) !important;
}

.dark .rh-ponto-relatorio__table :deep(tbody tr:hover) {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--ds-color-primary) 10%, transparent),
    color-mix(in srgb, var(--ds-color-success) 7%, transparent)
  ) !important;
}

@media (min-width: 768px) {
  .rh-ponto-relatorio__body {
    padding: 1rem 1.5rem 1.75rem;
  }

  .rh-ponto-relatorio :deep(.ds-header-block) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .rh-ponto-relatorio__body {
    padding: 1rem 2rem 2rem;
  }

  .rh-ponto-relatorio :deep(.ds-header-block) {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
</style>
