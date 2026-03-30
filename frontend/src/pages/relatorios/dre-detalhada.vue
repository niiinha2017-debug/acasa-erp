<template>
  <PageShell :padded="false">
    <section class="dre-detalhada-page ds-page-context animate-page-in">
      <PageHeader
        title="DRE Detalhada por Cliente / Ambiente"
        subtitle="Venda clássica, importação/markup ou pós-venda (garantias, assistências e manutenção) na mesma competência"
        icon="pi pi-chart-pie"
      >
        <template #actions>
          <div class="flex flex-col gap-4 w-full min-w-0">
            <div class="flex flex-wrap items-end gap-4">
              <div class="flex-1 min-w-[200px] max-w-md">
                <label class="ds-field-label text-xs block mb-1">Cliente</label>
                <div class="relative">
                  <input
                    v-model="clienteBusca"
                    type="text"
                    placeholder="Buscar por nome..."
                    class="ds-field-line w-full h-10 pl-3 pr-10"
                    @focus="mostrarSugestoes = true"
                    @blur="aplicarBlurSugestoes"
                  />
                  <i class="pi pi-search absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ds-color-text-faint)] text-sm" />
                  <div
                    v-if="mostrarSugestoes && clienteBusca.length >= 2"
                    class="absolute top-full left-0 right-0 mt-1 z-10 max-h-48 overflow-y-auto ds-card ds-card--default shadow-lg"
                  >
                    <div v-if="loadingClientes" class="p-3 text-center text-[var(--ds-color-text-soft)] text-sm">
                      <i class="pi pi-spin pi-spinner mr-1" /> Buscando...
                    </div>
                    <button
                      v-else-if="sugestoesClientes.length === 0"
                      type="button"
                      class="w-full px-3 py-2 text-left text-sm text-[var(--ds-color-text-soft)]"
                    >
                      Nenhum cliente encontrado
                    </button>
                    <button
                      v-for="c in sugestoesClientes"
                      :key="c.id"
                      type="button"
                      class="w-full px-3 py-2 text-left text-sm text-[var(--ds-color-text)] hover:bg-[color-mix(in_srgb,var(--ds-color-text)_6%,transparent)]"
                      @mousedown.prevent="selecionarCliente(c)"
                    >
                      {{ c.nome }}
                    </button>
                  </div>
                </div>
              </div>
              <div class="flex gap-2 shrink-0">
                <div>
                  <label class="ds-field-label text-xs block mb-1">Mês</label>
                  <select
                    v-model="mes"
                    class="ds-field-line ds-field-line--select h-10 w-[72px] text-sm"
                    @change="carregarDre"
                  >
                    <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
                  </select>
                </div>
                <div>
                  <label class="ds-field-label text-xs block mb-1">Ano</label>
                  <select
                    v-model="ano"
                    class="ds-field-line ds-field-line--select h-10 w-[80px] text-sm"
                    @change="carregarDre"
                  >
                    <option v-for="y in anosDisponiveis" :key="y" :value="y">{{ y }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </template>
      </PageHeader>

      <div class="dre-detalhada-page__body ds-page-context__content space-y-6 pb-6">
        <p v-if="clienteSelecionado" class="text-sm text-[var(--ds-color-text-soft)]">
          Cliente: <strong class="text-[var(--ds-color-text)]">{{ clienteSelecionado.nome }}</strong>
        </p>

        <div
          v-if="ordemImportacao"
          class="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/25 px-4 py-3 text-sm text-text-main"
        >
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-200">Markup / importação</span>
          <p class="mt-1">
            OS #{{ ordemImportacao.id }} · bruto
            <strong class="tabular-nums">{{ formatarMoeda(ordemImportacao.valor_bruto) }}</strong>
            <span v-if="ordemImportacao.valor_liquido != null" class="text-text-muted">
              · líquido <strong class="tabular-nums text-text-main">{{ formatarMoeda(ordemImportacao.valor_liquido) }}</strong>
            </span>
            · {{ ordemImportacao.etapas_count }} ambiente(s) na OS
          </p>
        </div>

        <div
          v-if="resumoPrazos.quantidade_projetos > 0"
          class="flex flex-wrap items-center gap-4 py-2 px-3 rounded-xl border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)]"
        >
          <span class="text-xs font-semibold text-[var(--ds-color-text-soft)] uppercase tracking-wide">Visão geral (média do mês)</span>
          <span class="text-sm text-[var(--ds-color-text)]">
            Tempo de Negociação: <strong class="text-[var(--ds-color-warning-700)]">{{ resumoPrazos.tempo_negociacao_medio_dias ?? 0 }} dias</strong>
          </span>
          <span class="text-sm text-[var(--ds-color-text)]">
            Tempo de Fábrica: <strong class="text-[var(--ds-color-info-700)]">{{ resumoPrazos.tempo_fabrica_medio_dias ?? 0 }} dias</strong>
          </span>
          <span class="text-xs text-[var(--ds-color-text-soft)]">({{ resumoPrazos.quantidade_projetos }} projeto(s) no mês)</span>
        </div>
        <!-- Dashboard consumo do projeto (gráfico pizza + validação perda padrão) -->
        <DashboardConsumoProjeto
          v-if="projetoAtual?.id"
          :projeto-id="projetoAtual.id"
          :codigo="projetoAtual.codigo || `Projeto #${projetoAtual.id}`"
        />

        <!-- Lista de ambientes (venda e/ou importação) -->
        <div v-if="ambientes.length > 0">
          <h2 class="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Ambientes / etapas</h2>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="a in ambientes"
              :key="`${a.fluxo}-${a.venda_item_id ?? ''}-${a.producao_etapa_id ?? ''}-${a.ordem_servico_id ?? ''}-${a.nome_ambiente}`"
              type="button"
              class="px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors"
              :class="ambienteIgualSelecionado(a)
                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                : 'border-border-ui bg-bg-page text-text-main hover:border-brand-primary/50'"
              @click="selecionarAmbiente(a)"
            >
              <span
                v-if="a.fluxo === 'IMPORTACAO'"
                class="mr-1.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300"
              >Markup</span>
              <span
                v-else-if="a.fluxo === 'GARANTIA'"
                class="mr-1.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300"
              >Pós-venda</span>
              <span
                v-else
                class="mr-1.5 text-[10px] font-bold uppercase text-slate-500"
              >Venda</span>
              {{ a.nome_ambiente }} — {{ formatarMoeda(a.valor_contrato) }}
            </button>
          </div>
        </div>

        <div v-else-if="clienteSelecionado" class="rounded-xl border border-border-ui bg-bg-page/50 p-6 text-center text-text-muted text-sm">
          Nenhum ambiente ou etapa encontrado (sem venda com itens, sem OS de importação/markup e sem pós-venda).
        </div>

        <!-- Card DRE do ambiente selecionado -->
        <div v-if="ambienteSelecionado" class="rounded-xl border border-border-ui bg-white dark:bg-slate-900/40 overflow-hidden">
          <div class="px-4 py-3 border-b border-border-ui bg-slate-50/50 dark:bg-slate-800/30">
            <h3 class="text-base font-semibold text-text-main">
              DRE — {{ ambienteSelecionado.nome_ambiente }}
            </h3>
            <p class="text-xs text-text-muted mt-0.5">
              Competência: {{ String(mes).padStart(2, '0') }}/{{ ano }}
              <span v-if="dre.fonte_dados === 'IMPORTACAO_MARKUP'" class="ml-2 text-emerald-700 dark:text-emerald-300 font-medium">· Valores de venda do markup (custos via projeto/venda)</span>
              <span v-if="dre.fonte_dados === 'IMPORTACAO_SEM_PROJETO'" class="ml-2 text-amber-700 dark:text-amber-300 font-medium">· Sem projeto com venda — só snapshot do markup</span>
              <span v-if="dre.fonte_dados === 'GARANTIA'" class="ml-2 text-amber-700 dark:text-amber-300 font-medium">· Pós-venda por garantia, assistência ou manutenção</span>
            </p>
            <!-- Indicadores de prazo (este projeto) -->
            <div class="flex flex-wrap gap-4 mt-2 pt-2 border-t border-border-ui/70">
              <span class="text-xs text-text-muted">
                Tempo de Negociação: <strong class="text-[var(--ds-color-warning-700)]">{{ Number(dre.tempo_negociacao_dias ?? 0).toFixed(0) }} dias</strong>
              </span>
              <span class="text-xs text-text-muted">
                Tempo de Fábrica: <strong class="text-[var(--ds-color-info-700)]">{{ Number(dre.tempo_fabrica_dias ?? 0).toFixed(0) }} dias</strong>
              </span>
            </div>
          </div>
          <div v-if="loadingDre" class="p-8 text-center">
            <i class="pi pi-spin pi-spinner text-2xl text-brand-primary" />
          </div>
          <div v-else class="space-y-4">
            <table class="w-full text-sm min-w-[280px]">
              <tbody>
                <tr class="border-b border-border-ui">
                  <td class="py-2.5 px-0 font-medium text-text-main">Valor do Contrato</td>
                  <td class="py-2.5 px-0 text-right tabular-nums font-semibold text-text-main">
                    {{ formatarMoeda(dre.valor_contrato) }}
                  </td>
                </tr>
                <tr class="border-b border-border-ui">
                  <td class="py-2.5 px-0 text-text-muted">Impostos</td>
                  <td class="py-2.5 px-0 text-right tabular-nums text-text-muted">
                    − {{ formatarMoeda(dre.impostos) }}
                  </td>
                </tr>
                <tr class="border-b border-border-ui">
                  <td colspan="2" class="py-1.5 px-0 text-xs font-semibold text-text-muted uppercase tracking-wide">Custo variável</td>
                </tr>
                <tr class="border-b border-border-ui bg-slate-50/50 dark:bg-slate-800/20">
                  <td class="py-2.5 px-0 text-slate-700 dark:text-slate-300">Materiais Diretos</td>
                  <td class="py-2.5 px-0 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    − {{ formatarMoeda(dre.materiais_diretos) }}
                  </td>
                </tr>
                <!-- Detalhamento de compras do mês -->
                <tr v-if="(dre.detalhamento_compras?.length ?? 0) > 0" class="border-b border-border-ui">
                  <td colspan="2" class="py-2 px-0">
                    <p class="text-xs font-medium text-text-muted mb-1.5">Compras do mês por fornecedor</p>
                    <table class="w-full text-xs border border-border-ui rounded-lg overflow-hidden">
                      <thead>
                        <tr class="bg-slate-50 dark:bg-slate-800/50">
                          <th class="text-left py-1.5 px-2 font-medium text-text-muted">Fornecedor</th>
                          <th class="text-left py-1.5 px-2 font-medium text-text-muted">Tipo</th>
                          <th class="text-right py-1.5 px-2 font-medium text-text-muted">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(dc, idx) in dre.detalhamento_compras"
                          :key="idx"
                          class="border-t border-border-ui"
                        >
                          <td class="py-1.5 px-2 text-text-main">{{ dc.fornecedor_nome }}</td>
                          <td class="py-1.5 px-2 text-text-muted">{{ dc.tipo_compra }}</td>
                          <td class="py-1.5 px-2 text-right tabular-nums text-text-main">{{ formatarMoeda(dc.valor) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr class="border-b border-border-ui">
                  <td colspan="2" class="py-1.5 px-0 text-xs font-semibold text-text-muted uppercase tracking-wide">Custo fixo (absorção e rateio)</td>
                </tr>
                <tr class="border-b border-border-ui">
                  <td class="py-2.5 px-0 text-text-muted">
                    Custo Mão de Obra (Absorção Despesa Fixa Salários)
                    <span class="block text-xs text-text-muted/80 mt-0.5">Tempo Totem × Taxa de Absorção</span>
                  </td>
                  <td class="py-2.5 px-0 text-right tabular-nums text-text-muted">
                    − {{ formatarMoeda(dre.custo_mao_de_obra) }}
                  </td>
                </tr>
                <tr v-if="(dre.detalhamento_mao_obra?.length ?? 0) > 0" class="border-b border-border-ui">
                  <td colspan="2" class="py-2 px-0">
                    <p class="text-xs font-medium text-text-muted mb-1.5">Quem trabalhou e quanto custou</p>
                    <table class="w-full text-xs border border-border-ui rounded-lg overflow-hidden">
                      <thead>
                        <tr class="bg-slate-50 dark:bg-slate-800/50">
                          <th class="text-left py-1.5 px-2 font-medium text-text-muted">Funcionário</th>
                          <th class="text-right py-1.5 px-2 font-medium text-text-muted">Horas</th>
                          <th class="text-right py-1.5 px-2 font-medium text-text-muted">Custo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="d in dre.detalhamento_mao_obra"
                          :key="d.funcionario_id"
                          class="border-t border-border-ui"
                        >
                          <td class="py-1.5 px-2 text-text-main">{{ d.funcionario_nome }}</td>
                          <td class="py-1.5 px-2 text-right tabular-nums text-text-muted">{{ d.horas?.toFixed(2) ?? '0' }}</td>
                          <td class="py-1.5 px-2 text-right tabular-nums text-text-main">{{ formatarMoeda(d.custo_calculado) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <!-- Custo por etapa de produção -->
                <tr v-if="(dre.custo_por_etapa?.length ?? 0) > 0" class="border-b border-border-ui">
                  <td colspan="2" class="py-2 px-0">
                    <p class="text-xs font-medium text-text-muted mb-1.5">Custo hora por etapa de produção</p>
                    <div v-for="etapa in dre.custo_por_etapa" :key="etapa.etapa" class="mb-3 last:mb-0">
                      <div class="flex items-center gap-3 mb-1">
                        <span class="text-xs font-semibold text-text-main uppercase tracking-wide">{{ etapa.etapa }}</span>
                        <span class="text-xs text-text-muted tabular-nums">{{ etapa.horas?.toFixed(2) }}h</span>
                        <span class="text-xs text-text-main tabular-nums font-medium">{{ formatarMoeda(etapa.custo) }}</span>
                        <span class="text-[10px] text-text-muted">({{ formatarMoeda(etapa.custo_hora) }}/h)</span>
                      </div>
                      <table v-if="etapa.funcionarios?.length" class="w-full text-xs border border-border-ui rounded-lg overflow-hidden">
                        <thead>
                          <tr class="bg-slate-50 dark:bg-slate-800/50">
                            <th class="text-left py-1 px-2 font-medium text-text-muted">Funcionário</th>
                            <th class="text-right py-1 px-2 font-medium text-text-muted">Horas</th>
                            <th class="text-right py-1 px-2 font-medium text-text-muted">Custo</th>
                            <th class="text-right py-1 px-2 font-medium text-text-muted">R$/h</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="f in etapa.funcionarios" :key="f.funcionario_id" class="border-t border-border-ui">
                            <td class="py-1 px-2 text-text-main">{{ f.funcionario_nome }}</td>
                            <td class="py-1 px-2 text-right tabular-nums text-text-muted">{{ f.horas?.toFixed(2) }}</td>
                            <td class="py-1 px-2 text-right tabular-nums text-text-main">{{ formatarMoeda(f.custo) }}</td>
                            <td class="py-1 px-2 text-right tabular-nums text-text-muted">{{ formatarMoeda(f.custo_hora) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
                <tr class="border-b border-border-ui bg-[var(--ds-color-warning-50)]">
                  <td class="py-2.5 px-0 text-text-muted text-xs">Custo Fábrica (auditoria / comparação)</td>
                  <td class="py-2.5 px-0 text-right tabular-nums text-text-muted text-xs">
                    {{ formatarMoeda(dre.custo_fabrica_agregado) }}
                  </td>
                </tr>
                <tr v-if="dre.variacao_eficiencia" class="border-b border-border-ui bg-slate-50/50 dark:bg-slate-800/30">
                  <td class="py-2.5 px-0 text-text-muted text-xs">
                    Variação (equipe vs. média fábrica)
                    <span class="block mt-0.5 font-normal text-text-muted/80">Positivo = acima da média (menos eficiente); negativo = abaixo (mais eficiente)</span>
                  </td>
                  <td class="py-2.5 px-0 text-right tabular-nums text-xs" :class="variacaoClasse">
                    {{ dre.variacao_eficiencia.variacao >= 0 ? '+' : '' }}{{ formatarMoeda(dre.variacao_eficiencia.variacao) }}
                    <span class="ml-1">({{ dre.variacao_eficiencia.percentual_sobre_media >= 0 ? '+' : '' }}{{ dre.variacao_eficiencia.percentual_sobre_media }}%)</span>
                  </td>
                </tr>
                <tr class="border-b border-border-ui">
                  <td class="py-2.5 px-0 text-text-muted">Custo Estrutura</td>
                  <td class="py-2.5 px-0 text-right tabular-nums text-text-muted">
                    − {{ formatarMoeda(dre.custo_estrutura) }}
                  </td>
                </tr>
                <tr class="border-b border-border-ui">
                  <td class="py-2.5 px-0 text-text-muted">Rateio de Outras Despesas Fixas</td>
                  <td class="py-2.5 px-0 text-right tabular-nums text-text-muted">
                    − {{ formatarMoeda(dre.rateio_despesas_fixas) }}
                  </td>
                </tr>
                <!-- Detalhamento rateio de despesas por categoria -->
                <tr v-if="(dre.detalhamento_despesas?.length ?? 0) > 0" class="border-b border-border-ui">
                  <td colspan="2" class="py-2 px-0">
                    <p class="text-xs font-medium text-text-muted mb-1.5">Rateio por categoria de despesa</p>
                    <table class="w-full text-xs border border-border-ui rounded-lg overflow-hidden">
                      <thead>
                        <tr class="bg-slate-50 dark:bg-slate-800/50">
                          <th class="text-left py-1.5 px-2 font-medium text-text-muted">Categoria</th>
                          <th class="text-right py-1.5 px-2 font-medium text-text-muted">Valor Rateado</th>
                          <th class="text-right py-1.5 px-2 font-medium text-text-muted">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(dd, idx) in dre.detalhamento_despesas"
                          :key="idx"
                          class="border-t border-border-ui"
                        >
                          <td class="py-1.5 px-2 text-text-main">{{ dd.categoria }}</td>
                          <td class="py-1.5 px-2 text-right tabular-nums text-text-main">{{ formatarMoeda(dd.valor_total) }}</td>
                          <td class="py-1.5 px-2 text-right tabular-nums text-text-muted">{{ dd.percentual?.toFixed(1) }}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr class="border-b border-border-ui">
                  <td colspan="2" class="py-1.5 px-0 text-xs font-semibold text-text-muted uppercase tracking-wide">Linha do tempo de custos</td>
                </tr>
                <tr class="border-b border-border-ui bg-[var(--ds-color-warning-50)]">
                  <td class="py-2.5 px-0 text-[var(--ds-color-warning-700)]">
                    Custo Comercial
                    <span class="block text-xs text-text-muted/80 mt-0.5">Cadastro → Fechamento (valor/hora comercial)</span>
                  </td>
                  <td class="py-2.5 px-0 text-right tabular-nums text-[var(--ds-color-warning-700)]">
                    − {{ formatarMoeda(dre.custo_comercial) }}
                  </td>
                </tr>
                <tr class="border-b border-border-ui bg-[var(--ds-color-info-50)]">
                  <td class="py-2.5 px-0 text-[var(--ds-color-info-700)]">
                    Custo de Produção
                    <span class="block text-xs text-text-muted/80 mt-0.5">Fechamento → Conclusão (taxa de máquina)</span>
                  </td>
                  <td class="py-2.5 px-0 text-right tabular-nums text-[var(--ds-color-info-700)]">
                    − {{ formatarMoeda(dre.custo_producao) }}
                  </td>
                </tr>
                <tr class="bg-slate-100/60 dark:bg-slate-800/50">
                  <td class="py-3 px-0 font-semibold text-text-main">Lucro Líquido do Ambiente</td>
                  <td class="py-3 px-0 text-right tabular-nums font-bold" :class="lucroClasse">
                    {{ formatarMoeda(dre.lucro_liquido) }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Compras acumuladas do projeto (todo o histórico) -->
            <div
              v-if="dre.compras_acumuladas_projeto?.total > 0"
              class="px-4 pb-4 pt-4 border-t border-border-ui"
            >
              <h4 class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
                <i class="pi pi-shopping-cart text-[var(--ds-color-info-500)]" />
                Compras Acumuladas do Projeto (Ambiente)
              </h4>
              <div class="flex items-center gap-3 mb-2">
                <span class="text-sm font-semibold text-text-main tabular-nums">
                  Total: {{ formatarMoeda(dre.compras_acumuladas_projeto.total) }}
                </span>
              </div>
              <table v-if="dre.compras_acumuladas_projeto.por_tipo?.length" class="w-full text-xs border border-border-ui rounded-lg overflow-hidden">
                <thead>
                  <tr class="bg-slate-50 dark:bg-slate-800/50">
                    <th class="text-left py-1.5 px-2 font-medium text-text-muted">Tipo de Compra</th>
                    <th class="text-right py-1.5 px-2 font-medium text-text-muted">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(t, idx) in dre.compras_acumuladas_projeto.por_tipo" :key="idx" class="border-t border-border-ui">
                    <td class="py-1.5 px-2 text-text-main">{{ t.tipo }}</td>
                    <td class="py-1.5 px-2 text-right tabular-nums text-text-main">{{ formatarMoeda(t.valor) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Indicador de desperdício (perda padrão + retalhos) -->
            <div
              v-if="(dre.perda_padrao_percentual != null || (dre.retalhos_m2 != null && Number(dre.retalhos_m2) > 0) || (dre.perda_real_m2 != null && Number(dre.perda_real_m2) > 0))"
              class="px-4 pb-4 pt-4 border-t border-border-ui"
            >
              <h4 class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
                <i class="pi pi-chart-line text-[var(--ds-color-warning-500)]" />
                Desperdício
              </h4>
              <div class="flex flex-wrap gap-4 items-center">
                <div v-if="dre.perda_padrao_percentual != null" class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/50">
                  <span class="text-xs text-text-muted">Perda padrão:</span>
                  <span class="text-sm font-semibold text-text-main tabular-nums">{{ Number(dre.perda_padrao_percentual).toFixed(1) }}%</span>
                </div>
                <div v-if="dre.retalhos_m2 != null && Number(dre.retalhos_m2) > 0" class="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--ds-color-success-50)] border border-[var(--ds-color-success-200)]">
                  <span class="text-xs text-text-muted">Sobras reaproveitáveis no período:</span>
                  <span class="text-sm font-semibold text-[var(--ds-color-success-700)] tabular-nums">{{ Number(dre.retalhos_m2).toFixed(2) }} m²</span>
                </div>
                <div v-if="dre.perda_real_m2 != null && Number(dre.perda_real_m2) > 0" class="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--ds-color-danger-50)] border border-[var(--ds-color-danger-200)]">
                  <span class="text-xs text-text-muted">Perda real (desvio):</span>
                  <span class="text-sm font-semibold text-[var(--ds-color-danger-700)] tabular-nums">{{ Number(dre.perda_real_m2).toFixed(2) }} m²</span>
                </div>
              </div>
              <p class="text-[10px] text-text-muted mt-2">
                Consumo estimado = Área peças + Perda padrão. Consumo real = Peças + Sobras reaproveitáveis. Perda real = Estimado − Real (alimenta DRE por projeto).
              </p>
            </div>

            <div
              v-if="dre.parcelas_markup?.length"
              class="px-4 pb-4 pt-4 border-t border-border-ui"
            >
              <h4 class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Parcelas gravadas no markup</h4>
              <div class="overflow-x-auto rounded-lg border border-border-ui text-xs">
                <table class="min-w-full">
                  <thead>
                    <tr class="bg-[var(--ds-color-surface-muted)] text-left text-text-muted">
                      <th class="px-3 py-2 font-bold">#</th>
                      <th class="px-3 py-2 font-bold">Vencimento</th>
                      <th class="px-3 py-2 font-bold">Valor</th>
                      <th class="px-3 py-2 font-bold">Forma</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in dre.parcelas_markup" :key="p.parcela" class="border-t border-border-ui">
                      <td class="px-3 py-2 tabular-nums">{{ p.parcela }}</td>
                      <td class="px-3 py-2">{{ p.vencimento ? formatDateIso(p.vencimento) : '—' }}</td>
                      <td class="px-3 py-2 font-semibold tabular-nums">{{ formatarMoeda(p.valor) }}</td>
                      <td class="px-3 py-2">{{ p.forma || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { DreDetalhadaService } from '@/services/index'
import DashboardConsumoProjeto from '@/components/dashboard/DashboardConsumoProjeto.vue'
import PageShell from '@/components/ui/PageShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'

definePage({ meta: { perm: 'relatorios.dre_detalhada.ver' } })

const formatarMoeda = (v) =>
  (v != null && v !== '' && Number.isFinite(Number(v)))
    ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—'

function formatDateIso(s) {
  if (!s) return '—'
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleDateString('pt-BR')
}

const clienteBusca = ref('')
const mostrarSugestoes = ref(false)
const loadingClientes = ref(false)
const sugestoesClientes = ref([])
const clienteSelecionado = ref(null)
const projetoAtual = ref(null)
const ordemImportacao = ref(null)
const ambientes = ref([])
const ambienteSelecionado = ref(null)
const loadingDre = ref(false)
const mes = ref(new Date().getMonth() + 1)
const ano = ref(new Date().getFullYear())

const anoAtual = new Date().getFullYear()
const anosDisponiveis = [anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2]

const dre = ref({
  valor_contrato: 0,
  impostos: 0,
  materiais_diretos: 0,
  custo_mao_de_obra: 0,
  custo_estrutura: 0,
  rateio_despesas_fixas: 0,
  lucro_liquido: 0,
  detalhamento_mao_obra: [],
  detalhamento_compras: [],
  compras_acumuladas_projeto: { total: 0, por_tipo: [] },
  custo_por_etapa: [],
  detalhamento_despesas: [],
  custo_fabrica_agregado: 0,
  variacao_eficiencia: null,
  perda_padrao_percentual: null,
  retalhos_m2: 0,
  perda_real_m2: 0,
  tempo_negociacao_dias: 0,
  tempo_fabrica_dias: 0,
  custo_comercial: 0,
  custo_producao: 0,
  fonte_dados: null,
  parcelas_markup: [],
})

const resumoPrazos = ref({
  tempo_negociacao_medio_dias: 0,
  tempo_fabrica_medio_dias: 0,
  quantidade_projetos: 0,
})

const lucroClasse = computed(() =>
  Number(dre.value.lucro_liquido ?? 0) >= 0
    ? 'text-[var(--ds-color-success-700)]'
    : 'text-[var(--ds-color-danger-600)]'
)

// Variação positiva = custo individual acima da média fábrica (menos eficiente); negativa = abaixo (mais eficiente)
const variacaoClasse = computed(() => {
  const v = dre.value.variacao_eficiencia?.variacao ?? 0
  if (v > 0) return 'text-[var(--ds-color-warning-700)]'
  if (v < 0) return 'text-[var(--ds-color-success-700)]'
  return 'text-text-muted'
})

function ambienteIgualSelecionado(a) {
  const s = ambienteSelecionado.value
  if (!s || !a) return false
  if (s.fluxo !== a.fluxo) return false
  if (a.fluxo === 'IMPORTACAO') {
    return s.ordem_servico_id === a.ordem_servico_id
      && (s.producao_etapa_id ?? 0) === (a.producao_etapa_id ?? 0)
  }
  if (a.fluxo === 'GARANTIA') {
    return s.garantia_id === a.garantia_id
  }
  return s.venda_item_id === a.venda_item_id && s.nome_ambiente === a.nome_ambiente
}

let buscaTimer = null
watch(clienteBusca, (val) => {
  if (buscaTimer) clearTimeout(buscaTimer)
  if (!val || val.length < 2) {
    sugestoesClientes.value = []
    return
  }
  buscaTimer = setTimeout(async () => {
    loadingClientes.value = true
    try {
      const res = await DreDetalhadaService.buscarClientes(val)
      const data = res?.data ?? res
      sugestoesClientes.value = Array.isArray(data)
        ? data.filter(c => c && Number.isFinite(c.id) && c.id > 0 && typeof c.nome === 'string' && c.nome.trim())
        : []
    } catch (e) {
      sugestoesClientes.value = []
    } finally {
      loadingClientes.value = false
    }
  }, 280)
})

function aplicarBlurSugestoes() {
  setTimeout(() => { mostrarSugestoes.value = false }, 180)
}

async function selecionarCliente(c) {
  if (!c || !Number.isFinite(c.id) || c.id <= 0) return
  clienteSelecionado.value = c
  clienteBusca.value = c.nome || `Cliente #${c.id}`
  mostrarSugestoes.value = false
  sugestoesClientes.value = []
  projetoAtual.value = null
  ordemImportacao.value = null
  ambientes.value = []
  ambienteSelecionado.value = null
  try {
    const res = await DreDetalhadaService.listarAmbientes(c.id)
    const data = res?.data ?? res
    const raw = Array.isArray(data?.ambientes) ? data.ambientes : []
    ambientes.value = raw.filter(a => a && typeof a.nome_ambiente === 'string' && a.nome_ambiente.trim())
    projetoAtual.value = data?.projeto ?? null
    ordemImportacao.value = data?.ordem_importacao ?? null
  } catch (e) {
    ambientes.value = []
    projetoAtual.value = null
    ordemImportacao.value = null
  }
}

function selecionarAmbiente(a) {
  ambienteSelecionado.value = a
  carregarDre()
}

async function carregarResumoPrazos() {
  try {
    const res = await DreDetalhadaService.getResumoPrazos({ mes: mes.value, ano: ano.value })
    const data = res?.data ?? res
    if (data) {
      resumoPrazos.value = {
        tempo_negociacao_medio_dias: data.tempo_negociacao_medio_dias ?? 0,
        tempo_fabrica_medio_dias: data.tempo_fabrica_medio_dias ?? 0,
        quantidade_projetos: data.quantidade_projetos ?? 0,
      }
    }
  } catch (_) {
    resumoPrazos.value = { tempo_negociacao_medio_dias: 0, tempo_fabrica_medio_dias: 0, quantidade_projetos: 0 }
  }
}

onMounted(() => { carregarResumoPrazos() })
watch([mes, ano], () => {
  carregarResumoPrazos()
  if (ambienteSelecionado.value) carregarDre()
})

async function carregarDre() {
  if (!ambienteSelecionado.value) return
  loadingDre.value = true
  const a = ambienteSelecionado.value
  const params = a.fluxo === 'IMPORTACAO'
    ? {
        fluxo: 'importacao',
        ordem_servico_id: a.ordem_servico_id,
        producao_etapa_id: a.producao_etapa_id ?? 0,
        mes: mes.value,
        ano: ano.value,
      }
    : a.fluxo === 'GARANTIA'
      ? {
          fluxo: 'garantia',
          garantia_id: a.garantia_id,
          mes: mes.value,
          ano: ano.value,
        }
    : {
        projeto_id: a.projeto_id,
        nome_ambiente: a.nome_ambiente,
        mes: mes.value,
        ano: ano.value,
      }
  const emptyDre = {
    valor_contrato: 0,
    impostos: 0,
    materiais_diretos: 0,
    custo_mao_de_obra: 0,
    custo_estrutura: 0,
    rateio_despesas_fixas: 0,
    lucro_liquido: 0,
    detalhamento_mao_obra: [],
    detalhamento_compras: [],
    compras_acumuladas_projeto: { total: 0, por_tipo: [] },
    custo_por_etapa: [],
    detalhamento_despesas: [],
    custo_fabrica_agregado: 0,
    variacao_eficiencia: null,
    perda_padrao_percentual: null,
    retalhos_m2: 0,
    perda_real_m2: 0,
    tempo_negociacao_dias: 0,
    tempo_fabrica_dias: 0,
    custo_comercial: 0,
    custo_producao: 0,
    fonte_dados: null,
    parcelas_markup: [],
  }
  try {
    const res = await DreDetalhadaService.getDre(params)
    const data = res?.data ?? res
    if (data) {
      dre.value = {
        ...emptyDre,
        valor_contrato: data.valor_contrato ?? 0,
        impostos: data.impostos ?? 0,
        materiais_diretos: data.materiais_diretos ?? 0,
        custo_mao_de_obra: data.custo_mao_de_obra ?? 0,
        custo_estrutura: data.custo_estrutura ?? 0,
        rateio_despesas_fixas: data.rateio_despesas_fixas ?? 0,
        lucro_liquido: data.lucro_liquido ?? 0,
        detalhamento_mao_obra: data.detalhamento_mao_obra ?? [],
        detalhamento_compras: Array.isArray(data.detalhamento_compras) ? data.detalhamento_compras : [],
        compras_acumuladas_projeto: data.compras_acumuladas_projeto ?? { total: 0, por_tipo: [] },
        custo_por_etapa: Array.isArray(data.custo_por_etapa) ? data.custo_por_etapa : [],
        detalhamento_despesas: Array.isArray(data.detalhamento_despesas) ? data.detalhamento_despesas : [],
        custo_fabrica_agregado: data.custo_fabrica_agregado ?? 0,
        variacao_eficiencia: data.variacao_eficiencia ?? null,
        perda_padrao_percentual: data.perda_padrao_percentual ?? null,
        retalhos_m2: data.retalhos_m2 ?? 0,
        perda_real_m2: data.perda_real_m2 ?? 0,
        tempo_negociacao_dias: data.tempo_negociacao_dias ?? 0,
        tempo_fabrica_dias: data.tempo_fabrica_dias ?? 0,
        custo_comercial: data.custo_comercial ?? 0,
        custo_producao: data.custo_producao ?? 0,
        fonte_dados: data.fonte_dados ?? null,
        parcelas_markup: Array.isArray(data.parcelas_markup) ? data.parcelas_markup : [],
      }
    } else {
      dre.value = { ...emptyDre }
    }
  } catch (e) {
    dre.value = { ...emptyDre }
  } finally {
    loadingDre.value = false
  }
}
</script>
