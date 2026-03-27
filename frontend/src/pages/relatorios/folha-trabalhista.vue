<template>
  <PageShell :padded="false">
    <section class="folha-trab ds-page-context animate-page-in">
      <PageHeader
        title="Folha Trabalhista"
        subtitle="Base de cálculo de impostos, férias e fluxo de status do colaborador"
        icon="pi pi-briefcase"
      >
        <template #actions>
          <div class="flex flex-wrap items-end gap-3">
            <!-- Seletor de funcionário -->
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Colaborador</label>
              <select
                v-model="funcionarioId"
                class="ds-field-line ds-field-line--select h-10 w-[240px]"
                @change="carregarTodos"
              >
                <option :value="null" disabled>Selecione…</option>
                <option v-for="f in listaFuncionarios" :key="f.value" :value="f.value">
                  {{ f.label }}
                </option>
              </select>
            </div>

            <!-- Dependentes (IRRF) -->
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Dependentes</label>
              <input
                v-model.number="dependentes"
                type="number"
                min="0"
                max="20"
                class="ds-field-line h-10 w-[72px]"
                @change="carregarImpostos"
              />
            </div>

            <!-- Mês / Ano -->
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Mês</label>
              <select v-model="mes" class="ds-field-line ds-field-line--select h-10 w-[72px]" @change="carregarImpostos">
                <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
              </select>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <label class="ds-field-label text-xs">Ano</label>
              <select v-model="ano" class="ds-field-line ds-field-line--select h-10 w-[80px]" @change="carregarImpostos">
                <option v-for="y in anosDisponiveis" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>
        </template>
      </PageHeader>

      <!-- Estado vazio -->
      <div v-if="!funcionarioId" class="ds-page-context__content flex flex-col items-center justify-center py-24 gap-3 text-[var(--ds-color-text-soft)]">
        <i class="pi pi-user text-4xl opacity-30" />
        <p class="text-sm">Selecione um colaborador para visualizar a folha trabalhista.</p>
      </div>

      <!-- Carregando -->
      <div v-else-if="loadingAll" class="ds-page-context__content flex items-center justify-center py-20">
        <i class="pi pi-spin pi-spinner text-2xl text-[var(--ds-color-primary)]" />
      </div>

      <!-- Conteúdo -->
      <template v-else>
        <div class="ds-page-context__content space-y-8 pb-10">

          <!-- Abas de navegação interna -->
          <div class="flex gap-1 border-b border-[var(--ds-color-border)] pb-0 pt-2">
            <button
              v-for="tab in TABS"
              :key="tab.id"
              type="button"
              class="folha-trab__tab px-4 py-2 text-sm font-medium rounded-t transition-colors"
              :class="abaAtiva === tab.id
                ? 'border-b-2 border-[var(--ds-color-primary)] text-[var(--ds-color-primary)] bg-[var(--ds-color-surface-muted)]'
                : 'text-[var(--ds-color-text-soft)] hover:text-[var(--ds-color-text)]'"
              @click="abaAtiva = tab.id"
            >
              <i :class="`pi ${tab.icon} mr-1.5 text-xs`" />{{ tab.label }}
            </button>
          </div>

          <!-- ═══════════ ABA: ENCARGOS & IMPOSTOS ═══════════ -->
          <template v-if="abaAtiva === 'impostos'">
            <div v-if="loadingImpostos" class="flex items-center justify-center py-12">
              <i class="pi pi-spin pi-spinner text-2xl text-[var(--ds-color-primary)]" />
            </div>
            <template v-else-if="impostos">
              <!-- Resultado rápido -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="ds-card ds-card--default p-4 flex flex-col gap-1">
                  <p class="text-xs text-[var(--ds-color-text-soft)]">Salário Bruto</p>
                  <p class="text-xl font-bold text-[var(--ds-color-text)]">{{ fmt(impostos.salarios.salario_bruto) }}</p>
                </div>
                <div class="ds-card ds-card--default p-4 flex flex-col gap-1">
                  <p class="text-xs text-[var(--ds-color-text-soft)]">Líquido (funcionário)</p>
                  <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{{ fmt(impostos.resultado.salario_liquido) }}</p>
                </div>
                <div class="ds-card ds-card--default p-4 flex flex-col gap-1">
                  <p class="text-xs text-[var(--ds-color-text-soft)]">Custo Total Empresa</p>
                  <p class="text-xl font-bold text-rose-600 dark:text-rose-400">{{ fmt(impostos.resultado.custo_total_empresa) }}</p>
                </div>
                <div class="ds-card ds-card--default p-4 flex flex-col gap-1">
                  <p class="text-xs text-[var(--ds-color-text-soft)]">Total de Encargos</p>
                  <p class="text-xl font-bold text-amber-600 dark:text-amber-400">{{ fmt(impostos.resultado.encargos_total) }}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- INSS -->
                <div class="ds-card ds-card--default p-5 space-y-3">
                  <div class="flex items-center gap-2">
                    <span class="ds-badge ds-badge--warning text-xs">INSS</span>
                    <p class="text-sm font-semibold text-[var(--ds-color-text)]">
                      {{ fmt(impostos.inss.contribuicao) }}
                    </p>
                  </div>
                  <p class="text-xs text-[var(--ds-color-text-soft)]">
                    Teto: {{ fmt(impostos.inss.teto) }} · Cálculo progressivo por faixas
                  </p>
                  <table class="w-full text-xs">
                    <thead>
                      <tr class="text-[var(--ds-color-text-soft)]">
                        <th class="text-left pb-1">Faixa</th>
                        <th class="text-right pb-1">Base</th>
                        <th class="text-right pb-1">Alíquota</th>
                        <th class="text-right pb-1">Contribuição</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(f, i) in impostos.inss.detalhe_faixas" :key="i" class="border-t border-[var(--ds-color-border)]">
                        <td class="py-1 pr-2 text-[var(--ds-color-text-soft)]">{{ f.faixa }}</td>
                        <td class="py-1 text-right tabular-nums">{{ fmt(f.base) }}</td>
                        <td class="py-1 text-right tabular-nums text-amber-600">{{ pct(f.aliquota) }}</td>
                        <td class="py-1 text-right tabular-nums font-medium">{{ fmt(f.contribuicao) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- IRRF -->
                <div class="ds-card ds-card--default p-5 space-y-3">
                  <div class="flex items-center gap-2">
                    <span class="ds-badge ds-badge--danger text-xs">IRRF</span>
                    <p class="text-sm font-semibold text-[var(--ds-color-text)]">
                      {{ fmt(impostos.irrf.imposto) }}
                    </p>
                  </div>
                  <dl class="text-xs space-y-1.5">
                    <div class="flex justify-between">
                      <dt class="text-[var(--ds-color-text-soft)]">Dependentes</dt>
                      <dd class="tabular-nums">{{ impostos.irrf.dependentes }} (−{{ fmt(impostos.irrf.deducao_dependentes) }})</dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-[var(--ds-color-text-soft)]">Base de Cálculo</dt>
                      <dd class="tabular-nums font-medium">{{ fmt(impostos.irrf.base_calculo) }}</dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-[var(--ds-color-text-soft)]">Faixa</dt>
                      <dd class="text-right max-w-[160px] break-words text-rose-600 dark:text-rose-400">{{ impostos.irrf.faixa }}</dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-[var(--ds-color-text-soft)]">Alíquota efetiva</dt>
                      <dd class="tabular-nums">{{ impostos.irrf.aliquota_efetiva }}</dd>
                    </div>
                    <div class="flex justify-between border-t border-[var(--ds-color-border)] pt-1 mt-1">
                      <dt class="text-[var(--ds-color-text-soft)]">% real sobre salário</dt>
                      <dd class="tabular-nums font-medium">{{ impostos.irrf.aliquota_real_salario }}</dd>
                    </div>
                  </dl>
                </div>

                <!-- FGTS + Benefícios -->
                <div class="ds-card ds-card--default p-5 space-y-4">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <span class="ds-badge ds-badge--primary text-xs">FGTS</span>
                      <p class="text-sm font-semibold text-[var(--ds-color-text)]">{{ fmt(impostos.fgts.deposito_mensal) }}</p>
                    </div>
                    <p class="text-xs text-[var(--ds-color-text-soft)]">
                      Alíquota {{ impostos.fgts.aliquota }} — {{ impostos.fgts.nota }}
                    </p>
                  </div>

                  <div class="border-t border-[var(--ds-color-border)] pt-3 space-y-1.5 text-xs">
                    <p class="text-[var(--ds-color-text-soft)] font-medium uppercase tracking-wide text-[10px]">Benefícios</p>
                    <div class="flex justify-between">
                      <span class="text-[var(--ds-color-text-soft)]">VA / VR</span>
                      <span class="tabular-nums">{{ fmt(impostos.beneficios.vale_alimentacao) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-[var(--ds-color-text-soft)]">VT</span>
                      <span class="tabular-nums">{{ fmt(impostos.beneficios.vale_transporte) }}</span>
                    </div>
                    <div class="flex justify-between font-medium border-t border-[var(--ds-color-border)] pt-1">
                      <span>Total benefícios</span>
                      <span class="tabular-nums">{{ fmt(impostos.beneficios.total_beneficios) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 13º estimado -->
              <div class="ds-card ds-card--default p-5">
                <p class="text-sm font-semibold text-[var(--ds-color-text)] mb-3">13º Salário estimado ({{ impostos.referencia.ano }})</p>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                  <div>
                    <p class="text-[var(--ds-color-text-soft)]">Meses trabalhados</p>
                    <p class="font-semibold tabular-nums text-base mt-0.5">{{ impostos.decimo_terceiro_estimado.meses_trabalhados_no_ano }}</p>
                  </div>
                  <div>
                    <p class="text-[var(--ds-color-text-soft)]">Bruto</p>
                    <p class="font-semibold tabular-nums text-base mt-0.5">{{ fmt(impostos.decimo_terceiro_estimado.bruto) }}</p>
                  </div>
                  <div>
                    <p class="text-[var(--ds-color-text-soft)]">INSS estimado</p>
                    <p class="font-semibold tabular-nums text-base mt-0.5 text-amber-600">{{ fmt(impostos.decimo_terceiro_estimado.inss_estimado) }}</p>
                  </div>
                  <div>
                    <p class="text-[var(--ds-color-text-soft)]">FGTS 13º</p>
                    <p class="font-semibold tabular-nums text-base mt-0.5 text-amber-600">{{ fmt(impostos.decimo_terceiro_estimado.fgts_estimado) }}</p>
                  </div>
                  <div>
                    <p class="text-[var(--ds-color-text-soft)]">Líquido estimado</p>
                    <p class="font-semibold tabular-nums text-base mt-0.5 text-emerald-600">{{ fmt(impostos.decimo_terceiro_estimado.liquido_estimado) }}</p>
                  </div>
                </div>
              </div>
            </template>
          </template>

          <!-- ═══════════ ABA: FÉRIAS ═══════════ -->
          <template v-else-if="abaAtiva === 'ferias'">
            <div v-if="loadingFerias" class="flex items-center justify-center py-12">
              <i class="pi pi-spin pi-spinner text-2xl text-[var(--ds-color-primary)]" />
            </div>
            <template v-else-if="ferias">
              <!-- Aviso -->
              <div v-if="ferias.aviso" class="ds-card ds-card--warning p-4 text-sm text-amber-800 dark:text-amber-300">
                <i class="pi pi-exclamation-triangle mr-2" />{{ ferias.aviso }}
              </div>

              <!-- Resumo geral -->
              <div v-if="ferias.resumo" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="ds-card ds-card--default p-4 flex flex-col gap-1">
                  <p class="text-xs text-[var(--ds-color-text-soft)]">Períodos vencidos</p>
                  <p class="text-2xl font-bold"
                    :class="ferias.resumo.total_periodos_vencidos > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--ds-color-text)]'">
                    {{ ferias.resumo.total_periodos_vencidos }}
                  </p>
                </div>
                <div class="ds-card ds-card--default p-4 flex flex-col gap-1">
                  <p class="text-xs text-[var(--ds-color-text-soft)]">Total vencido e devido</p>
                  <p class="text-2xl font-bold"
                    :class="ferias.resumo.total_vencido_devido > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--ds-color-text)]'">
                    {{ fmt(ferias.resumo.total_vencido_devido) }}
                  </p>
                </div>
                <div class="ds-card ds-card--default p-4 flex flex-col gap-1">
                  <p class="text-xs text-[var(--ds-color-text-soft)]">Período atual</p>
                  <p v-if="ferias.resumo.periodo_atual" class="text-sm font-medium">
                    {{ ferias.resumo.periodo_atual.inicio }} → {{ ferias.resumo.periodo_atual.fim }}
                  </p>
                  <p v-else class="text-sm text-[var(--ds-color-text-soft)]">—</p>
                  <p v-if="ferias.resumo.periodo_atual" class="text-xs text-[var(--ds-color-text-soft)]">
                    {{ ferias.resumo.periodo_atual.meses_trabalhados }} mes(es) trabalhados
                  </p>
                </div>
              </div>

              <!-- Férias proporcionais -->
              <div v-if="ferias.ferias_proporcionais" class="ds-card ds-card--default p-5">
                <p class="text-sm font-semibold mb-3">Férias Proporcionais (rescisão hoje)</p>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                  <div>
                    <p class="text-[var(--ds-color-text-soft)]">Meses (período atual)</p>
                    <p class="font-semibold tabular-nums text-base mt-0.5">{{ ferias.ferias_proporcionais.meses_trabalhados_periodo_atual }}</p>
                  </div>
                  <div>
                    <p class="text-[var(--ds-color-text-soft)]">Valor proporcional</p>
                    <p class="font-semibold tabular-nums text-base mt-0.5">{{ fmt(ferias.ferias_proporcionais.valor_proporcional) }}</p>
                  </div>
                  <div>
                    <p class="text-[var(--ds-color-text-soft)]">1/3 constitucional</p>
                    <p class="font-semibold tabular-nums text-base mt-0.5">{{ fmt(ferias.ferias_proporcionais.adicional_tercio) }}</p>
                  </div>
                  <div>
                    <p class="text-[var(--ds-color-text-soft)]">Total bruto</p>
                    <p class="font-semibold tabular-nums text-base mt-0.5 text-emerald-600">{{ fmt(ferias.ferias_proporcionais.total) }}</p>
                  </div>
                  <div>
                    <p class="text-[var(--ds-color-text-soft)]">FGTS s/férias</p>
                    <p class="font-semibold tabular-nums text-base mt-0.5 text-amber-600">{{ fmt(ferias.ferias_proporcionais.fgts_sobre_ferias) }}</p>
                  </div>
                </div>
                <p class="text-[10px] text-[var(--ds-color-text-soft)] mt-3 italic">{{ ferias.ferias_proporcionais.nota }}</p>
              </div>

              <!-- Tabela de períodos -->
              <div v-if="ferias.periodos?.length" class="ds-card ds-card--default overflow-hidden">
                <div class="p-4 border-b border-[var(--ds-color-border)]">
                  <p class="text-sm font-semibold">Histórico de Períodos Aquisitivos</p>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-xs">
                    <thead class="bg-[var(--ds-color-surface-muted)]">
                      <tr>
                        <th class="text-left px-4 py-2.5 text-[var(--ds-color-text-soft)]">Período</th>
                        <th class="text-left px-4 py-2.5 text-[var(--ds-color-text-soft)]">Início aquisitivo</th>
                        <th class="text-left px-4 py-2.5 text-[var(--ds-color-text-soft)]">Fim aquisitivo</th>
                        <th class="text-center px-4 py-2.5 text-[var(--ds-color-text-soft)]">Situação</th>
                        <th class="text-right px-4 py-2.5 text-[var(--ds-color-text-soft)]">Dias</th>
                        <th class="text-right px-4 py-2.5 text-[var(--ds-color-text-soft)]">Valor férias</th>
                        <th class="text-right px-4 py-2.5 text-[var(--ds-color-text-soft)]">+ 1/3</th>
                        <th class="text-right px-4 py-2.5 text-[var(--ds-color-text-soft)]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(p, i) in ferias.periodos"
                        :key="i"
                        class="border-t border-[var(--ds-color-border)] hover:bg-[var(--ds-color-surface-muted)] transition-colors"
                      >
                        <td class="px-4 py-2.5 font-medium">{{ p.periodo }}</td>
                        <td class="px-4 py-2.5 tabular-nums">{{ p.inicio_aquisitivo }}</td>
                        <td class="px-4 py-2.5 tabular-nums">{{ p.fim_aquisitivo }}</td>
                        <td class="px-4 py-2.5 text-center">
                          <span
                            class="ds-badge text-[10px]"
                            :class="{
                              'ds-badge--danger': p.situacao === 'VENCIDO',
                              'ds-badge--success': p.situacao === 'EM_CURSO',
                              'ds-badge--muted': p.situacao === 'A_VENCER',
                            }"
                          >{{ p.situacao === 'VENCIDO' ? 'Vencido' : p.situacao === 'EM_CURSO' ? 'Em curso' : 'A vencer' }}</span>
                        </td>
                        <td class="px-4 py-2.5 text-right tabular-nums">{{ p.dias_direito }}</td>
                        <td class="px-4 py-2.5 text-right tabular-nums">{{ fmt(p.valor_ferias) }}</td>
                        <td class="px-4 py-2.5 text-right tabular-nums text-emerald-600">{{ fmt(p.adicional_tercio) }}</td>
                        <td class="px-4 py-2.5 text-right tabular-nums font-semibold">{{ fmt(p.total_ferias) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </template>

          <!-- ═══════════ ABA: FLUXO DE STATUS ═══════════ -->
          <template v-else-if="abaAtiva === 'status'">
            <div v-if="loadingStatus" class="flex items-center justify-center py-12">
              <i class="pi pi-spin pi-spinner text-2xl text-[var(--ds-color-primary)]" />
            </div>
            <template v-else-if="transicoes">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Status atual + transições disponíveis -->
                <div class="ds-card ds-card--default p-5 space-y-4">
                  <div class="flex items-center gap-3">
                    <span class="text-sm text-[var(--ds-color-text-soft)]">Status atual:</span>
                    <span
                      class="ds-badge text-sm font-semibold px-3 py-1"
                      :class="badgeStatus(transicoes.status_atual.valor)"
                    >
                      {{ transicoes.status_atual.label }}
                    </span>
                  </div>

                  <div v-if="transicoes.transicoes_disponiveis.length" class="space-y-3">
                    <p class="text-xs font-semibold text-[var(--ds-color-text-soft)] uppercase tracking-wide">
                      Transições disponíveis
                    </p>
                    <div
                      v-for="t in transicoes.transicoes_disponiveis"
                      :key="t.valor"
                      class="flex items-center justify-between rounded-lg border border-[var(--ds-color-border)] p-3 hover:bg-[var(--ds-color-surface-muted)] transition-colors"
                    >
                      <div class="flex items-center gap-3">
                        <i class="pi pi-arrow-right text-[var(--ds-color-text-soft)] text-xs" />
                        <span class="text-sm font-medium">{{ t.label }}</span>
                        <span v-if="t.motivo_obrigatorio" class="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded px-1.5 py-0.5">
                          Motivo obrigatório
                        </span>
                      </div>
                      <button
                        type="button"
                        class="ds-btn ds-btn--sm ds-btn--ghost"
                        @click="abrirModalTransicao(t)"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                  <div v-else class="text-sm text-[var(--ds-color-text-soft)] italic">
                    Nenhuma transição disponível a partir deste status.
                  </div>
                </div>

                <!-- Mapa completo de estados -->
                <div class="ds-card ds-card--default p-5 space-y-3">
                  <p class="text-xs font-semibold text-[var(--ds-color-text-soft)] uppercase tracking-wide">
                    Todos os status possíveis
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="s in transicoes.todos_os_status"
                      :key="s.valor"
                      class="ds-badge text-xs px-2.5 py-1"
                      :class="[
                        badgeStatus(s.valor),
                        transicoes.status_atual.valor === s.valor ? 'ring-2 ring-offset-2 ring-[var(--ds-color-primary)]' : '',
                      ]"
                    >{{ s.label }}</span>
                  </div>
                </div>
              </div>

              <!-- Modal de transição inline (simplificado) -->
              <div v-if="modalTransicao" class="ds-card ds-card--default p-5 border-2 border-[var(--ds-color-primary)] space-y-4">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-semibold">
                    Confirmar transição para
                    <span class="text-[var(--ds-color-primary)]">{{ modalTransicao.label }}</span>
                  </p>
                  <button type="button" class="text-[var(--ds-color-text-soft)] hover:text-[var(--ds-color-text)]" @click="modalTransicao = null">
                    <i class="pi pi-times" />
                  </button>
                </div>

                <div class="space-y-2">
                  <label class="ds-field-label text-xs">
                    Motivo / Observação
                    <span v-if="modalTransicao.motivo_obrigatorio" class="text-rose-500 ml-1">*</span>
                  </label>
                  <textarea
                    v-model="motivoTransicao"
                    class="ds-field-line w-full h-20 resize-none text-sm"
                    :placeholder="modalTransicao.motivo_obrigatorio ? 'Motivo obrigatório…' : 'Opcional…'"
                  />
                </div>
                <div class="space-y-2">
                  <label class="ds-field-label text-xs">Data de referência</label>
                  <input v-model="dataReferenciaTransicao" type="date" class="ds-field-line h-10 w-[180px]" />
                </div>
                <div class="flex gap-3 justify-end">
                  <button type="button" class="ds-btn ds-btn--ghost" @click="modalTransicao = null">Cancelar</button>
                  <button
                    type="button"
                    class="ds-btn ds-btn--primary"
                    :disabled="salvandoStatus"
                    @click="confirmarTransicao"
                  >
                    <i v-if="salvandoStatus" class="pi pi-spin pi-spinner mr-1" />
                    Confirmar
                  </button>
                </div>
              </div>
            </template>
          </template>

        </div>
      </template>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { FuncionariosService } from '@/services/index'
import PageShell from '@/components/ui/PageShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'

definePage({ meta: { perm: 'funcionarios.ver' } })

// ── Filtros ──────────────────────────────────────────────────────────────────
const now = new Date()
const mes = ref(now.getMonth() + 1)
const ano = ref(now.getFullYear())
const dependentes = ref(0)
const anoAtual = now.getFullYear()
const anosDisponiveis = [anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2]

const TABS = [
  { id: 'impostos', label: 'Encargos & Impostos', icon: 'pi-percentage' },
  { id: 'ferias',   label: 'Férias',               icon: 'pi-sun' },
  { id: 'status',   label: 'Fluxo de Status',      icon: 'pi-sitemap' },
]
const abaAtiva = ref('impostos')

// ── Lista de funcionários ─────────────────────────────────────────────────────
const listaFuncionarios = ref([])
const funcionarioId = ref(null)

onMounted(async () => {
  try {
    const res = await FuncionariosService.select()
    listaFuncionarios.value = (res?.data ?? res) || []
  } catch {
    listaFuncionarios.value = []
  }
})

// ── Dados das 3 abas ──────────────────────────────────────────────────────────
const loadingImpostos = ref(false)
const loadingFerias   = ref(false)
const loadingStatus   = ref(false)
const loadingAll      = computed(() => loadingImpostos.value && loadingFerias.value && loadingStatus.value)

const impostos  = ref(null)
const ferias    = ref(null)
const transicoes = ref(null)

async function carregarImpostos() {
  if (!funcionarioId.value) return
  loadingImpostos.value = true
  try {
    const res = await FuncionariosService.calcularImpostos(funcionarioId.value, {
      dependentes: dependentes.value,
      mes: mes.value,
      ano: ano.value,
    })
    impostos.value = res?.data ?? res
  } catch {
    impostos.value = null
  } finally {
    loadingImpostos.value = false
  }
}

async function carregarFerias() {
  if (!funcionarioId.value) return
  loadingFerias.value = true
  try {
    const res = await FuncionariosService.calcularFerias(funcionarioId.value)
    ferias.value = res?.data ?? res
  } catch {
    ferias.value = null
  } finally {
    loadingFerias.value = false
  }
}

async function carregarStatus() {
  if (!funcionarioId.value) return
  loadingStatus.value = true
  try {
    const res = await FuncionariosService.listarTransicoesStatus(funcionarioId.value)
    transicoes.value = res?.data ?? res
  } catch {
    transicoes.value = null
  } finally {
    loadingStatus.value = false
  }
}

function carregarTodos() {
  carregarImpostos()
  carregarFerias()
  carregarStatus()
}

// ── Transição de status ───────────────────────────────────────────────────────
const modalTransicao       = ref(null)
const motivoTransicao      = ref('')
const dataReferenciaTransicao = ref(new Date().toISOString().slice(0, 10))
const salvandoStatus       = ref(false)
const erroStatus           = ref('')
const sucessoStatus        = ref('')

function abrirModalTransicao(t) {
  modalTransicao.value = t
  motivoTransicao.value = ''
  erroStatus.value = ''
  sucessoStatus.value = ''
}

async function confirmarTransicao() {
  if (!funcionarioId.value || !modalTransicao.value) return
  salvandoStatus.value = true
  erroStatus.value = ''
  try {
    await FuncionariosService.atualizarStatus(funcionarioId.value, {
      status: modalTransicao.value.valor,
      motivo: motivoTransicao.value || undefined,
      data_referencia: dataReferenciaTransicao.value || undefined,
    })
    modalTransicao.value = null
    await carregarStatus()
  } catch (e) {
    erroStatus.value = e?.response?.data?.message ?? 'Erro ao atualizar status.'
  } finally {
    salvandoStatus.value = false
  }
}

// ── Helpers de formatação ────────────────────────────────────────────────────
function fmt(v) {
  if (v == null || v === '') return 'R$ 0,00'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pct(v) {
  return `${(Number(v) * 100).toFixed(1)}%`
}

const STATUS_BADGE_MAP = {
  ATIVO:        'ds-badge--success',
  CADASTRADO:   'ds-badge--muted',
  AFASTADO:     'ds-badge--warning',
  FERIAS:       'ds-badge--primary',
  AVISO_PREVIO: 'ds-badge--danger',
  INATIVO:      'ds-badge--muted',
}
function badgeStatus(s) {
  return STATUS_BADGE_MAP[s] ?? 'ds-badge--muted'
}
</script>
