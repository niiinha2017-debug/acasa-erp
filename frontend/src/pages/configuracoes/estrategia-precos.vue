<template>
  <PageShell :padded="false" variant="minimal">
    <section class="login-font estrategia-precos ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        title="Estrategia de Precos"
        subtitle="Matriz operacional: MDF, fita de borda, insumos base e custos internos"
        icon="pi pi-chart-line"
        variant="minimal"
      >
        <template #actions>
          <div class="estrategia-precos__header-actions ds-page-context__actions">
            <div class="estrategia-precos__header-meta">
              <span class="estrategia-precos__header-kicker">Matriz operacional</span>
              <span class="estrategia-precos__header-updated">
                {{ matrizAtualizadoEm ? `Ultima atualizacao: ${formatDate(matrizAtualizadoEm)}` : 'Sem processamento salvo' }}
              </span>
            </div>
          </div>
        </template>
      </PageHeader>

      <div class="estrategia-precos__body ds-editor-body">
        <div class="section-divider ds-section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title ds-section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Fluxo da Matriz
            </span>
          </div>
        </div>

        <section class="estrategia-precos__workspace">
        <div class="estrategia-precos__workspace-head">
          <div>
            <p class="estrategia-precos__workspace-eyebrow">Matriz Operacional de Insumos Base</p>
            <p class="estrategia-precos__workspace-copy">
              Aba 1 calcula MDF por m2, Aba 2 fita por metro com +100%, Aba 3 trata somente insumos base de consumo, Aba 4 RH e despesas, e Aba 5 consolida o preço final por categoria.
            </p>
          </div>
          <div class="estrategia-precos__workspace-status">
            <span class="estrategia-precos__status-pill">Aba ativa: {{ activeTabMeta.label }}</span>
            <span v-if="matrizAtualizadoEm" class="estrategia-precos__status-note">
              Ultima atualizacao: <span class="font-semibold text-text-main">{{ formatDate(matrizAtualizadoEm) }}</span>
            </span>
          </div>
        </div>

        <div class="estrategia-precos__workspace-toolbar">
          <div class="estrategia-precos__tabs" role="tablist" aria-label="Abas da matriz operacional">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              class="estrategia-precos__tab"
              :class="{ 'estrategia-precos__tab--active': activeTab === tab.id }"
              @click="trocarTab(tab.id)"
            >
              {{ tab.label }}
            </button>
          </div>
          <p class="estrategia-precos__toolbar-copy">{{ fluxoAbaDescricao }}</p>
          <div class="estrategia-precos__controls-grid">
            <div class="estrategia-precos__control-card">
              <Input
                v-model="mdfLossMarginPct"
                type="number"
                variant="line"
                label="Margem MDF (%)"
                min="0"
                step="0.01"
                :force-upper="false"
              />
              <p class="estrategia-precos__control-help">Formula: (Preco Chapa / 5,06) + {{ Number(mdfLossMarginPct || 0).toFixed(2) }}%</p>
            </div>
            <div class="estrategia-precos__control-card">
              <Input
                v-model="markupBasePct"
                type="number"
                variant="line"
                label="Markup Fita/Insumos (%)"
                min="0"
                step="0.01"
                :force-upper="false"
              />
              <p class="estrategia-precos__control-help">Aplicado sobre valor original do banco: +{{ Number(markupBasePct || 0).toFixed(2) }}%</p>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'mdf'" class="estrategia-precos__tab-panel space-y-4">
          <div class="estrategia-precos__subtabs">
            <button
              v-for="cat in CATEGORIAS_ABA1"
              :key="cat.id"
              type="button"
              class="estrategia-precos__subtab"
              :class="{ 'estrategia-precos__subtab--active': activeSubTab === cat.id }"
              @click="trocarSubTab(cat.id)"
            >
              <span
                class="inline-block w-2 h-2 rounded-full"
                :class="cat.id === 'essencial' ? 'bg-slate-400' : cat.id === 'design' ? 'bg-emerald-400' : 'bg-amber-400'"
              ></span>
              {{ cat.label }}
            </button>
          </div>

          <div class="estrategia-precos__table-shell">
            <div class="px-3 py-2 bg-slate-50/70 border-b border-border-ui">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <div class="relative md:col-span-8">
                  <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                  <input
                    v-model.trim="mdfSearch"
                    type="text"
                    placeholder="Digite o nome do MDF para buscar referencias nesta categoria"
                    class="estrategia-precos__search-input"
                    @input="agendarBuscaCategoriaAutomatica()"
                    @keyup.enter="buscarCategoriaManual()"
                  />
                </div>
                <div class="md:col-span-4 flex items-center md:justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    class="!rounded-xl border border-border-ui !px-3 !py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 hover:border-slate-400/50"
                    :disabled="!gruposMdfAtivo.length"
                    @click="limparResultadosCategoria()"
                  >
                    <i class="pi pi-times text-[10px]"></i>
                    Limpar
                  </Button>
                  <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">Formula: (Preço Chapa / 5,06) + {{ Number(mdfLossMarginPct || 0).toFixed(2) }}%</span>
                  <span v-if="buscandoCategorias[activeSubTab]" class="text-[11px] text-slate-500 flex items-center gap-1">
                    <i class="pi pi-spin pi-spinner text-xs"></i>
                  </span>
                  <span v-else class="text-[11px] text-text-muted whitespace-nowrap">{{ gruposMdfSelecionadosCount }}/{{ gruposMdfAtivo.length }}</span>
                </div>
              </div>
            </div>

            <div class="max-h-[360px] overflow-auto">
              <table class="estrategia-precos__table estrategia-precos__table--mdf">
                <thead>
                  <tr class="estrategia-precos__table-head-row">
                    <th class="estrategia-precos__table-head-cell">Selecionar</th>
                    <th class="estrategia-precos__table-head-cell">Material</th>
                    <th class="estrategia-precos__table-head-cell">Espessura</th>
                    <th class="estrategia-precos__table-head-cell">Preço Chapa</th>
                    <th class="estrategia-precos__table-head-cell">Preço Chapa / 5,06</th>
                    <th class="estrategia-precos__table-head-cell estrategia-precos__table-head-cell--accent">Custo MDF / m2</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="buscandoCategorias[activeSubTab]">
                    <tr v-for="n in 4" :key="n" class="estrategia-precos__table-row estrategia-precos__table-row--loading animate-pulse">
                      <td v-for="c in 6" :key="c" class="estrategia-precos__table-cell">
                        <div class="h-3.5 rounded bg-slate-100 w-3/4"></div>
                      </td>
                    </tr>
                  </template>
                  <template v-else>
                    <tr
                      v-for="row in gruposMdfAtivoFiltrado"
                      :key="row.key"
                      class="estrategia-precos__table-row estrategia-precos__table-row--interactive"
                      :class="row.selected ? 'estrategia-precos__table-row--selected' : 'estrategia-precos__table-row--hover-blue'"
                      @click="toggleMdfRow(row)"
                    >
                      <td class="estrategia-precos__table-cell estrategia-precos__table-cell--checkbox">
                        <input
                          v-model="row.selected"
                          type="checkbox"
                          class="h-4 w-4 rounded border-border-ui"
                          @click.stop
                        />
                      </td>
                      <td class="estrategia-precos__table-cell estrategia-precos__table-cell--strong">{{ row.group }}</td>
                      <td class="estrategia-precos__table-cell">{{ row.thickness }} mm</td>
                      <td class="estrategia-precos__table-cell estrategia-precos__table-cell--numeric">{{ formatCurrency(precoReferenciaByStrategy(row)) }}</td>
                      <td class="estrategia-precos__table-cell estrategia-precos__table-cell--numeric">{{ formatCurrency(custoCompraM2(row)) }}</td>
                      <td class="estrategia-precos__table-cell">
                        <span class="estrategia-precos__table-value-pill">
                          {{ formatCurrency(custoMdfCalculadoM2(row)) }}/m2
                        </span>
                      </td>
                    </tr>
                    <tr v-if="!gruposMdfAtivo.length && !buscandoCategorias[activeSubTab] && mdfSearch.trim().length < 2">
                      <td colspan="6" class="estrategia-precos__table-state">
                        Digite pelo menos 2 caracteres para buscar MDF automaticamente.
                      </td>
                    </tr>
                    <tr v-else-if="!gruposMdfAtivo.length">
                      <td colspan="6" class="estrategia-precos__table-state">
                        Nenhuma referencia encontrada para esta busca.
                      </td>
                    </tr>
                    <tr v-else-if="!gruposMdfAtivoFiltrado.length">
                      <td colspan="6" class="estrategia-precos__table-state">
                        Nenhum MDF corresponde ao filtro atual.
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <div class="estrategia-precos__stat-line estrategia-precos__stat-line--emerald">
            Custo MDF da categoria ativa: <strong>{{ formatCurrency(resumoVendaAtivo.materialCost) }}/m2</strong>
          </div>
        </div>

        <div v-else-if="activeTab === 'fita'" class="estrategia-precos__tab-panel space-y-4">
          <div class="estrategia-precos__table-shell">
            <div class="px-3 py-2 bg-slate-50/70 border-b border-border-ui">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <div class="relative md:col-span-8">
                  <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                  <input
                    v-model.trim="fitaSearch"
                    type="text"
                    placeholder="Buscar fita por nome, cor ou metragem"
                    class="estrategia-precos__search-input"
                  />
                </div>
                <div class="md:col-span-4 flex items-center md:justify-end gap-3">
                  <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">Formula: (Preço Rolo / Metragem) + {{ Number(markupBasePct || 0).toFixed(2) }}%</span>
                  <span v-if="loadingFitasBorda" class="text-[11px] text-slate-500 flex items-center gap-1">
                    <i class="pi pi-spin pi-spinner text-xs"></i>
                  </span>
                  <span v-else class="text-[11px] text-text-muted whitespace-nowrap">{{ fitasBordaFiltradas.length }}/{{ fitasBorda.length }}</span>
                </div>
              </div>
            </div>

            <div class="max-h-[360px] overflow-auto">
              <table class="estrategia-precos__table estrategia-precos__table--fita">
                <thead>
                  <tr class="estrategia-precos__table-head-row">
                    <th class="estrategia-precos__table-head-cell">Selecionar</th>
                    <th class="estrategia-precos__table-head-cell">Produto</th>
                    <th class="estrategia-precos__table-head-cell">Cor</th>
                    <th class="estrategia-precos__table-head-cell">Metragem do Rolo</th>
                    <th class="estrategia-precos__table-head-cell">Preço do Rolo</th>
                    <th class="estrategia-precos__table-head-cell estrategia-precos__table-head-cell--accent">Custo por Metro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingFitasBorda">
                    <td colspan="6" class="estrategia-precos__table-state">Carregando fitas de borda...</td>
                  </tr>
                  <template v-else>
                    <tr
                      v-for="fita in fitasBordaFiltradas"
                      :key="fita.id"
                      class="estrategia-precos__table-row"
                      :class="isFitaVinculada(fita) ? 'estrategia-precos__table-row--linked' : 'estrategia-precos__table-row--hover-orange'"
                    >
                      <td class="estrategia-precos__table-cell estrategia-precos__table-cell--checkbox">
                        <input
                          type="checkbox"
                          class="h-4 w-4 rounded border-border-ui"
                          :checked="isFitaVinculada(fita)"
                          disabled
                        />
                      </td>
                      <td class="estrategia-precos__table-cell estrategia-precos__table-cell--strong">{{ fita.nome_produto || '-' }}</td>
                      <td class="estrategia-precos__table-cell">{{ fita.cor || '-' }}</td>
                      <td class="estrategia-precos__table-cell estrategia-precos__table-cell--numeric">{{ formatMetragemRolo(fita.metragem_rolo_m) }}</td>
                      <td class="estrategia-precos__table-cell estrategia-precos__table-cell--numeric">{{ formatCurrency(fita.valor_unitario) }}</td>
                      <td class="estrategia-precos__table-cell">
                        <span class="estrategia-precos__table-value-pill">
                          {{ formatCurrency(custoFitaPorMetro(fita)) }}/m
                        </span>
                      </td>
                    </tr>
                    <tr v-if="!fitasBordaFiltradas.length">
                      <td colspan="6" class="estrategia-precos__table-state">
                        Nenhuma fita de borda encontrada.
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <div class="estrategia-precos__stat-line estrategia-precos__stat-line--emerald">
            Total medio de fita vinculada automaticamente: <strong>{{ formatCurrency(fitaTotal) }}</strong>
          </div>
        </div>

        <div v-else-if="activeTab === 'unidade'" class="estrategia-precos__tab-panel space-y-4">
          <div class="estrategia-precos__table-shell">
            <div class="px-3 py-2 bg-slate-50/70 border-b border-border-ui">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <div class="relative md:col-span-8">
                  <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                  <input
                    v-model.trim="unidadeSearch"
                    type="text"
                    placeholder="Buscar insumo base por nome"
                    class="estrategia-precos__search-input"
                  />
                </div>
                <div class="md:col-span-4 flex items-center md:justify-end gap-3">
                  <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">Fórmula: (val_compra ÷ fator) × consumo_m² × (1 + {{ Number(markupBasePct || 0).toFixed(2) }}%)</span>
                  <span v-if="loadingItensUnidade" class="text-[11px] text-slate-500 flex items-center gap-1">
                    <i class="pi pi-spin pi-spinner text-xs"></i>
                  </span>
                  <span v-else class="text-[11px] text-text-muted whitespace-nowrap">{{ itensUnidadeFiltrados.length }}/{{ itensUnidade.length }}</span>
                </div>
              </div>
            </div>

            <div class="max-h-[360px] overflow-auto">
              <table class="estrategia-precos__table estrategia-precos__table--unidade">
                <thead>
                  <tr class="estrategia-precos__table-head-row">
                    <th class="estrategia-precos__table-head-cell">Selecionar</th>
                    <th class="estrategia-precos__table-head-cell">Tipo</th>
                    <th class="estrategia-precos__table-head-cell">Item</th>
                    <th class="estrategia-precos__table-head-cell">Unidade Compra</th>
                    <th class="estrategia-precos__table-head-cell">Unidade Referência</th>
                    <th class="estrategia-precos__table-head-cell">Fator</th>
                    <th class="estrategia-precos__table-head-cell">Valor Compra</th>
                    <th class="estrategia-precos__table-head-cell">Consumo / m2</th>
                    <th class="estrategia-precos__table-head-cell estrategia-precos__table-head-cell--accent">Custo Estrategico / m2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingItensUnidade">
                    <td colspan="9" class="estrategia-precos__table-state">Carregando insumos...</td>
                  </tr>
                  <template v-else>
                    <tr
                      v-for="item in itensUnidadeFiltrados"
                      :key="item.key"
                      class="estrategia-precos__table-row estrategia-precos__table-row--interactive"
                      :class="item.selected ? 'estrategia-precos__table-row--selected' : 'estrategia-precos__table-row--hover-blue'"
                      @click="toggleItemUnidade(item)"
                    >
                      <td class="estrategia-precos__table-cell estrategia-precos__table-cell--checkbox">
                        <input
                          v-model="item.selected"
                          type="checkbox"
                          class="h-4 w-4 rounded border-border-ui"
                          @click.stop
                        />
                      </td>
                      <td class="estrategia-precos__table-cell">
                        <span class="estrategia-precos__table-tag estrategia-precos__table-tag--blue">
                          Insumo
                        </span>
                      </td>
                      <td class="estrategia-precos__table-cell estrategia-precos__table-cell--strong">{{ item.name }}</td>
                      <td class="estrategia-precos__table-cell">{{ item.unidade_compra || '-' }}</td>
                      <td class="estrategia-precos__table-cell">{{ item.unidade_referencia || '-' }}</td>
                      <td class="estrategia-precos__table-cell estrategia-precos__table-cell--numeric">{{ Number(item.fator_conversao || 1).toFixed(3) }}</td>
                      <td class="estrategia-precos__table-cell estrategia-precos__table-cell--numeric">{{ formatCurrency(item.value_compra) }}</td>
                      <td class="estrategia-precos__table-cell estrategia-precos__table-cell--numeric">{{ Number(item.consumo_m2 || 0).toFixed(4) }}</td>
                      <td class="estrategia-precos__table-cell">
                        <span class="estrategia-precos__table-value-pill">
                          {{ formatCurrency(valorUnitarioItem(item)) }}/m2
                        </span>
                      </td>
                    </tr>
                    <tr v-if="!itensUnidadeFiltrados.length">
                      <td colspan="9" class="estrategia-precos__table-state">
                        Nenhum insumo encontrado.
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <div class="estrategia-precos__stat-line estrategia-precos__stat-line--emerald">
            Total de insumos base: <strong>{{ formatCurrency(unidadeTotal) }}</strong>
          </div>
        </div>

        <div v-else-if="activeTab === 'rh'" class="estrategia-precos__tab-panel space-y-4">
          <div class="estrategia-precos__strip-grid estrategia-precos__strip-grid--three">
            <div class="estrategia-precos__strip-panel estrategia-precos__strip-panel--neutral">
              <Input
                v-model="capacidadeM2Mes"
                type="number"
                variant="line"
                label="Capacidade M2/mes"
                min="0.01"
                step="0.01"
                :force-upper="false"
              />
            </div>
            <div class="estrategia-precos__strip-panel estrategia-precos__strip-panel--blue">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Hora-Homem (R$ / m2)</label>
              <div class="flex items-center justify-between mb-2">
                <span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                  <i class="pi pi-sync text-[9px]"></i> Sistema RH
                </span>
              </div>
              <div class="flex items-center gap-2">
                <p class="flex-1 text-lg font-black tabular-nums text-blue-800">
                  {{ formatCurrency(horaHomemValue) }}<span class="text-xs font-semibold text-blue-400 ml-1">/m²</span>
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  :disabled="calculandoCustosInternos"
                  @click="sincronizarRH()"
                  class="!h-9 !w-9 !rounded-lg text-blue-600 hover:bg-blue-100 disabled:opacity-40"
                  title="Sincronizar com Sistema RH"
                >
                  <i :class="calculandoCustosInternos ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" class="text-xs"></i>
                </Button>
              </div>
            </div>
            <div class="estrategia-precos__strip-panel estrategia-precos__strip-panel--violet">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Custo Fixo Fábrica (R$ / m²)</label>
              <div class="flex items-center justify-between mb-2">
                <span class="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600">
                  <i class="pi pi-bolt text-[9px]"></i> Despesas
                </span>
              </div>
              <div class="flex items-center gap-2">
                <p class="flex-1 text-lg font-black tabular-nums text-violet-800">
                  {{ formatCurrency(custoFixoFabricaValue) }}<span class="text-xs font-semibold text-violet-400 ml-1">/m²</span>
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  :disabled="calculandoCustosInternos"
                  @click="sincronizarRH()"
                  class="!h-9 !w-9 !rounded-lg text-violet-600 hover:bg-violet-100 disabled:opacity-40"
                  title="Recalcular despesas operacionais"
                >
                  <i :class="calculandoCustosInternos ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" class="text-xs"></i>
                </Button>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              :loading="calculandoCustosInternos"
              @click="sincronizarRH()"
              class="!rounded-xl text-xs font-bold uppercase tracking-wide"
            >
              <i v-if="!calculandoCustosInternos" class="pi pi-sync text-xs"></i>
              {{ calculandoCustosInternos ? 'Sincronizando...' : 'Sincronizar com Sistema RH' }}
            </Button>
            <span class="text-[11px] text-slate-500">Base: despesas de {{ custosInternosCompetenciaLabel }}</span>
          </div>

          <div class="estrategia-precos__stat-grid estrategia-precos__stat-grid--three">
            <div class="estrategia-precos__stat-line estrategia-precos__stat-line--blue">
              RH por m2: <strong>{{ formatCurrency(horaHomemValue) }}/m2</strong>
            </div>
            <div class="estrategia-precos__stat-line estrategia-precos__stat-line--violet">
              Despesas por m2: <strong>{{ formatCurrency(custoFixoFabricaValue) }}/m2</strong>
            </div>
            <div class="estrategia-precos__stat-line estrategia-precos__stat-line--emerald">
              Total RH + despesas: <strong>{{ formatCurrency(custosInternosTotal) }}/m2</strong>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'venda'" class="estrategia-precos__tab-panel space-y-4 estrategia-precos__tab-panel--contrast">
          <div class="estrategia-precos__summary-grid">
            <div class="estrategia-precos__summary-panel estrategia-precos__summary-panel--emerald">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">MDF selecionado</p>
              <p class="mt-1 text-lg font-black tabular-nums text-emerald-700">{{ formatCurrency(resumoVendaAtivo.materialCost) }}</p>
              <p class="text-[11px] text-slate-500 mt-1">Categoria ativa: {{ categoriaAtivaResumoLabel }}</p>
            </div>
            <div class="estrategia-precos__summary-panel estrategia-precos__summary-panel--orange">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Fita de Borda</p>
              <p class="mt-1 text-lg font-black tabular-nums text-orange-700">{{ formatCurrency(fitaTotal) }}</p>
              <p class="text-[11px] text-slate-500 mt-1">Total selecionado na Aba 2</p>
            </div>
            <div class="estrategia-precos__summary-panel estrategia-precos__summary-panel--blue">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Insumos Base</p>
              <p class="mt-1 text-lg font-black tabular-nums text-blue-700">{{ formatCurrency(unidadeTotal) }}</p>
              <p class="text-[11px] text-slate-500 mt-1">Total de insumos base da Aba 3</p>
            </div>
            <div class="estrategia-precos__summary-panel estrategia-precos__summary-panel--violet">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">RH + Despesas</p>
              <p class="mt-1 text-lg font-black tabular-nums text-violet-700">{{ formatCurrency(custosInternosTotal) }}</p>
              <p class="text-[11px] text-slate-500 mt-1">Vindo da Aba 4</p>
            </div>
            <div class="estrategia-precos__summary-panel estrategia-precos__summary-panel--brand">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Valor final</p>
              <p class="mt-1 text-lg font-black tabular-nums text-brand-primary">{{ formatCurrency(resumoVendaAtivo.finalValue) }}</p>
              <p class="text-[11px] text-slate-500 mt-1">Custo MDF + Fita + Insumos Base + RH/Despesas</p>
            </div>
          </div>

          <div class="estrategia-precos__table-shell">
            <div class="px-3 py-2 bg-slate-50 border-b border-border-ui flex items-center justify-between gap-3 flex-wrap">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Preço Final de Venda por Categoria</p>
              <span class="text-[11px] text-slate-500">Aba 1 + Aba 2 + Aba 3 + Aba 4</span>
            </div>
            <div class="overflow-auto">
              <table class="estrategia-precos__table estrategia-precos__table--venda">
                <thead>
                  <tr class="estrategia-precos__table-head-row">
                    <th class="estrategia-precos__table-head-cell">Categoria</th>
                    <th class="estrategia-precos__table-head-cell">Custo MDF</th>
                    <th class="estrategia-precos__table-head-cell">Fita</th>
                    <th class="estrategia-precos__table-head-cell">Unidade</th>
                    <th class="estrategia-precos__table-head-cell">RH + Despesas</th>
                    <th class="estrategia-precos__table-head-cell estrategia-precos__table-head-cell--accent">Preço Final de Venda</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="cat in CATEGORIAS_ABA1"
                    :key="cat.id"
                    class="estrategia-precos__table-row estrategia-precos__table-row--hover-neutral"
                  >
                    <td class="estrategia-precos__table-cell estrategia-precos__table-cell--strong">{{ cat.label }}</td>
                    <td class="estrategia-precos__table-cell estrategia-precos__table-cell--numeric">{{ formatCurrency(precoFinalPorCategoria[cat.id].materialCost) }}</td>
                    <td class="estrategia-precos__table-cell estrategia-precos__table-cell--numeric">{{ formatCurrency(precoFinalPorCategoria[cat.id].fita) }}</td>
                    <td class="estrategia-precos__table-cell estrategia-precos__table-cell--numeric">{{ formatCurrency(precoFinalPorCategoria[cat.id].unidade) }}</td>
                    <td class="estrategia-precos__table-cell estrategia-precos__table-cell--numeric">{{ formatCurrency(precoFinalPorCategoria[cat.id].rh) }}</td>
                    <td class="estrategia-precos__table-cell estrategia-precos__table-cell--numeric estrategia-precos__table-cell--accent">{{ formatCurrency(precoFinalPorCategoria[cat.id].finalValue) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div class="estrategia-precos__note-panel">
              Ao processar, a persistência da matriz usa MDF como base e soma fita, insumos base e RH/despesas no componente consolidado. Ferragens por unidade seguem no orçamento técnico.
            </div>
            <div class="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                :loading="loadingMatriz"
                class="!rounded-xl text-sm font-semibold"
                @click="loadMatriz"
              >
                <i v-if="!loadingMatriz" class="pi pi-refresh text-sm"></i>
                Atualizar dados
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                :loading="processando"
                class="!rounded-xl text-sm font-bold"
                @click="processarMatriz"
              >
                <i v-if="!processando" class="pi pi-calculator text-sm"></i>
                {{ processando ? 'Processando...' : 'Gerar Preço Final' }}
              </Button>
            </div>
          </div>
        </div>
        </section>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { EstrategiaPrecosService, ProdutosService } from '@/services/index'
import { notify } from '@/services/notify'
import { useMatrizOperacionalStore } from '@/stores/useMatrizOperacionalStore'

definePage({ meta: { perm: 'configuracoes.estrategia_precos.ver' } })

const tabs = [
  { id: 'mdf', label: 'Aba 1 - MDF' },
  { id: 'fita', label: 'Aba 2 - Fita de Borda' },
  { id: 'unidade', label: 'Aba 3 - Insumos Base' },
  { id: 'rh', label: 'Aba 4 - RH e Despesas' },
  { id: 'venda', label: 'Aba 5 - Preço de Venda' },
]

const CATEGORIAS_ABA1 = [
  { id: 'essencial', label: 'Essencial', apiKey: 'PRIMARIA' },
  { id: 'design', label: 'Design', apiKey: 'SECUNDARIA' },
  { id: 'premium', label: 'Premium', apiKey: 'TERCIARIA' },
]

const activeTab = ref('mdf')
const activeSubTab = ref('essencial')

const activeTabMeta = computed(() => tabs.find((item) => item.id === activeTab.value) || tabs[0])

const mdfSearch = ref('')
const fitaSearch = ref('')
const unidadeSearch = ref('')

const gruposMdfPorCategoria = ref({ essencial: [], design: [], premium: [] })
const buscandoCategorias = ref({ essencial: false, design: false, premium: false })
const fitasBorda = ref([])
const loadingFitasBorda = ref(false)
const fitasBordaCarregadas = ref(false)

const itensUnidade = ref([])
const loadingItensUnidade = ref(false)

const horaHomemValue = ref(0)
const custoFixoFabricaValue = ref(0)
const capacidadeM2Mes = ref(220)
const calculandoCustosInternos = ref(false)
const custosInternosMeta = ref({ mes: null, ano: null, mao_de_obra_total: 0, operacao_total: 0 })

const processando = ref(false)
const loadingMatriz = ref(false)
const matrizData = ref([])
const matrizAtualizadoEm = ref(null)
const mdfLossMarginPct = ref(30)
const markupBasePct = ref(100)

let recalculoCustosTimer = null
let buscaCategoriaTimer = null
const matrizStore = useMatrizOperacionalStore()
const markupFactor = computed(() => 1 + (Number(markupBasePct.value || 0) / 100))

const fluxoAbaDescricao = computed(() => {
  if (activeTab.value === 'mdf') {
    return 'Aba 1 filtra apenas MDF comercial nas categorias Essencial, Design e Premium e calcula o custo por m2 pela fórmula da chapa com perda fixa.'
  }
  if (activeTab.value === 'fita') {
    return 'Aba 2 lista somente produtos da categoria Fita de Borda e calcula o custo por metro linear com acréscimo de 100%.'
  }
  if (activeTab.value === 'unidade') {
    return 'Aba 3 mantém somente insumos base de consumo. Ferragens por unidade seguem no orçamento técnico e não entram nesta busca.'
  }
  if (activeTab.value === 'rh') {
    return 'Aba 4 mantém a lógica de RH e despesas fixas da fábrica por m2.'
  }
  return 'Aba 5 consolida MDF + Fita + Unidade + RH/Despesas para gerar o preço final de venda por categoria.'
})

const custosInternosCompetenciaLabel = computed(() => {
  const mes = Number(custosInternosMeta.value?.mes || 0)
  const ano = Number(custosInternosMeta.value?.ano || 0)
  if (!mes || !ano) return 'mês atual'
  return `${String(mes).padStart(2, '0')}/${ano}`
})

const gruposMdfAtivo = computed(() => gruposMdfPorCategoria.value[activeSubTab.value] || [])
const gruposMdfSelecionadosCount = computed(() => gruposMdfAtivo.value.filter((row) => row.selected).length)

const gruposMdfAtivoFiltrado = computed(() => {
  return gruposMdfAtivo.value
})

const fitasBordaFiltradas = computed(() => {
  const term = normalizeSearch(fitaSearch.value)
  if (!term) return fitasBorda.value
  return fitasBorda.value.filter((item) => {
    const alvo = normalizeSearch([item.nome_produto, item.cor, item.medida, item.metragem_rolo_m].filter(Boolean).join(' '))
    return alvo.includes(term)
  })
})

const itensUnidadeFiltrados = computed(() => {
  const term = normalizeSearch(unidadeSearch.value)
  if (!term) return itensUnidade.value
  return itensUnidade.value.filter((item) => {
    const alvo = normalizeSearch([item.name, item.categoria_base, item.unidade_compra, item.unidade_referencia, item.consumo_m2].filter(Boolean).join(' '))
    return alvo.includes(term)
  })
})

const materiaisSelecionados = computed(() =>
  CATEGORIAS_ABA1.flatMap((cat) => (gruposMdfPorCategoria.value[cat.id] || []).filter((item) => item.selected)),
)

const itensUnidadeSelecionados = computed(() => (itensUnidade.value || []).filter((item) => item.selected))

const resumoCategoriaOperacional = computed(() => {
  const result = {}
  for (const cat of CATEGORIAS_ABA1) {
    const items = (gruposMdfPorCategoria.value[cat.id] || []).filter((row) => row.selected)
    const materialCosts = items.map((row) => custoMdfCalculadoM2(row)).filter((value) => value > 0)
    const fitaCosts = items.map((row) => custoFitaVinculadaPorMaterial(row)).filter((value) => value > 0)

    // Usa o maior custo MDF selecionado como teto da categoria (garante margem no pior caso)
    const materialCost = materialCosts.length ? Math.max(...materialCosts) : 0
    // Fita: maior custo vinculado ao MDF mais caro da categoria
    const fitaAvg = fitaCosts.length ? Math.max(...fitaCosts) : 0

    result[cat.id] = {
      materialCost,
      fitaAvg,
      combinedValue: materialCost + fitaAvg,
      count: items.length,
    }
  }
  return result
})

const fitaIdsVinculadas = computed(() => {
  const ids = new Set()
  for (const material of materiaisSelecionados.value) {
    const fita = encontrarFitaVinculadaPorMaterial(material)
    if (fita?.id != null) ids.add(Number(fita.id))
  }
  return ids
})

const fitaTotal = computed(() =>
  CATEGORIAS_ABA1.reduce((acc, cat) => acc + Number(resumoCategoriaOperacional.value?.[cat.id]?.fitaAvg || 0), 0),
)

const unidadeTotal = computed(() =>
  itensUnidadeSelecionados.value.reduce((acc, item) => acc + Number(valorUnitarioItem(item) || 0), 0),
)

const custosInternosTotal = computed(
  () => Number(horaHomemValue.value || 0) + Number(custoFixoFabricaValue.value || 0),
)

const matrizPorCategoria = computed(() => {
  const result = {}
  for (const cat of CATEGORIAS_ABA1) {
    const resumo = resumoCategoriaOperacional.value?.[cat.id] || {}
    result[cat.id] = {
      cost_base: Number(resumo.materialCost || 0),
      count: Number(resumo.count || 0),
    }
  }
  return result
})

const fitaPorCategoria = computed(() => {
  const result = {}
  for (const cat of CATEGORIAS_ABA1) {
    result[cat.id] = {
      avg: Number(resumoCategoriaOperacional.value?.[cat.id]?.fitaAvg || 0),
    }
  }
  return result
})

const combinadoPorCategoria = computed(() => {
  const result = {}
  for (const cat of CATEGORIAS_ABA1) {
    result[cat.id] = {
      value: Number(resumoCategoriaOperacional.value?.[cat.id]?.combinedValue || 0),
    }
  }
  return result
})

const precoFinalPorCategoria = computed(() => matrizStore.precoFinalPorCategoria)

const categoriaAtivaResumoLabel = computed(() => {
  const cat = CATEGORIAS_ABA1.find((item) => item.id === activeSubTab.value)
  return cat?.label || 'Essencial'
})

const resumoVendaAtivo = computed(() => matrizStore.resumoAtivo)

function formatCurrency(value) {
  const num = Number(value ?? 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(num) ? num : 0)
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function formatMetragemRolo(value) {
  const num = Number(String(value ?? '').replace(',', '.'))
  if (!Number.isFinite(num) || num <= 0) return '-'
  return `${num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} m`
}

function normalizarCorVinculo(value) {
  return normalizeSearch(value)
    .replace(/\b(fita de borda|fita borda|fita|mdf)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function keyMaterial(row) {
  return `${row.category}__${row.thickness}__${row.group}`
}

function mapMdfRow(row, selected = false) {
  return {
    ...row,
    key: keyMaterial(row),
    selected,
  }
}

function mergeMdfRows(currentRows, incomingRows) {
  const merged = new Map((Array.isArray(currentRows) ? currentRows : []).map((row) => [row.key, row]))

  for (const row of Array.isArray(incomingRows) ? incomingRows : []) {
    const key = keyMaterial(row)
    const existing = merged.get(key)
    merged.set(key, mapMdfRow(row, existing?.selected ?? false))
  }

  return Array.from(merged.values()).sort((a, b) => {
    if (Number(a.thickness || 0) !== Number(b.thickness || 0)) {
      return Number(a.thickness || 0) - Number(b.thickness || 0)
    }
    return String(a.group || '').localeCompare(String(b.group || ''))
  })
}

function categoriaUiPorApiKey(apiKey) {
  return CATEGORIAS_ABA1.find((item) => item.apiKey === apiKey)?.id || 'essencial'
}

function aplicarSelecoesSalvas(snapshot) {
  const savedMaterials = Array.isArray(snapshot?.material_links) ? snapshot.material_links : []
  const savedKitIds = new Set(
    (Array.isArray(snapshot?.kit_items) ? snapshot.kit_items : [])
      .map((item) => Number(item?.id || 0))
      .filter((id) => id > 0),
  )

  for (const cat of CATEGORIAS_ABA1) {
    const atuais = Array.isArray(gruposMdfPorCategoria.value[cat.id]) ? gruposMdfPorCategoria.value[cat.id] : []
    gruposMdfPorCategoria.value[cat.id] = atuais.map((row) => ({ ...row, selected: false }))
  }

  for (const material of savedMaterials) {
    const catId = categoriaUiPorApiKey(String(material?.commercial_category || material?.category || ''))
    const normalized = {
      category: String(material?.category || material?.commercial_category || ''),
      commercial_category: String(material?.commercial_category || material?.category || ''),
      thickness: Number(material?.thickness || 0),
      group: material?.group || '-',
      cost_base: Number(material?.cost_base || 0),
      reference_purchase_price: Number(material?.reference_purchase_price || 0),
      adicional_fita_m2: Number(material?.adicional_fita_m2 || 0),
    }
    const merged = mergeMdfRows(gruposMdfPorCategoria.value[catId], [normalized])
    gruposMdfPorCategoria.value[catId] = merged.map((row) => {
      if (row.key === keyMaterial(normalized)) {
        return { ...row, selected: true }
      }
      return row
    })
  }

  itensUnidade.value = (Array.isArray(itensUnidade.value) ? itensUnidade.value : []).map((item) => ({
    ...item,
    selected: savedKitIds.has(Number(item?.id || 0)),
  }))

  if (snapshot?.hora_homem_value != null) {
    horaHomemValue.value = Number(snapshot.hora_homem_value || 0)
  }
  if (snapshot?.custo_fixo_fabrica_value != null) {
    custoFixoFabricaValue.value = Number(snapshot.custo_fixo_fabrica_value || 0)
  }
  if (snapshot?.loss_margin_pct != null) {
    mdfLossMarginPct.value = Math.max(0, Number(snapshot.loss_margin_pct || 0))
  }
  if (snapshot?.markup_base_pct != null) {
    markupBasePct.value = Math.max(0, Number(snapshot.markup_base_pct || 0))
  }
}

function precoReferenciaByStrategy(row) {
  return Number(row?.reference_purchase_price ?? row?.cost_base ?? 0)
}

function custoCompraM2(row) {
  const baseEstrategia = Number(precoReferenciaByStrategy(row) || 0)
  if (!Number.isFinite(baseEstrategia) || baseEstrategia <= 0) return 0
  return baseEstrategia / 5.06
}

function custoMdfCalculadoM2(row) {
  const margem = Number(mdfLossMarginPct.value || 0) / 100
  return custoCompraM2(row) * (1 + margem)
}

function custoFitaPorMetro(item) {
  const valorUnitario = Number(item?.valor_unitario || 0)
  const metragemRolo = Number(String(item?.metragem_rolo_m ?? '').replace(',', '.'))
  if (!Number.isFinite(metragemRolo) || metragemRolo <= 0) return 0
  const custoBase = valorUnitario / metragemRolo
  return Math.round(((custoBase * Number(markupFactor.value || 1)) + Number.EPSILON) * 10000) / 10000
}

function encontrarFitaVinculadaPorMaterial(material) {
  const fitas = Array.isArray(fitasBorda.value) ? fitasBorda.value : []

  // 1ª prioridade: vínculo direto por ID (campo fita_vinculada_id do produto MDF)
  const fitaId = Number(material?.fita_vinculada_id || 0)
  if (fitaId > 0) {
    const vinculada = fitas.find((item) => Number(item?.id) === fitaId)
    if (vinculada) return vinculada
  }

  // 2ª prioridade: match exato de cor normalizada
  const corMaterial = normalizarCorVinculo(material?.color || material?.group || material?.cor || material?.nome_produto || '')
  if (!corMaterial) return null

  const exata = fitas.find((item) => normalizarCorVinculo(item?.cor || item?.nome_produto || '') === corMaterial)
  if (exata) return exata

  // 3ª prioridade: match parcial (fallback)
  return fitas.find((item) => {
    const corFita = normalizarCorVinculo(item?.cor || item?.nome_produto || '')
    return corFita && corFita.length >= 4 && corMaterial.length >= 4
      && (corFita.includes(corMaterial) || corMaterial.includes(corFita))
  }) || null
}

function custoFitaVinculadaPorMaterial(material) {
  const fita = encontrarFitaVinculadaPorMaterial(material)
  return fita ? Number(custoFitaPorMetro(fita) || 0) : 0
}

function valorUnitarioItem(item) {
  const fator = Number(item?.fator_conversao ?? item?.insumo_fator_conversao ?? 1)
  const valorCompra = Number(item?.value_compra ?? item?.valor_unitario ?? 0)
  const valorReferenciaInformado = Number(item?.value_referencia || 0)
  const valorReferencia =
    Number.isFinite(valorReferenciaInformado) && valorReferenciaInformado > 0
      ? valorReferenciaInformado
      : (Number.isFinite(fator) && fator > 0 ? valorCompra / fator : valorCompra)

  // Custo real por m²: valor_referência × consumo_m² × markup
  // Se consumo_m2 não informado, usa 1 (custo da unidade de referência direto)
  const consumoM2 = Number(item?.consumo_m2 || 0)
  const baseM2 = consumoM2 > 0 ? valorReferencia * consumoM2 : valorReferencia

  const valorComMarkup = baseM2 * Number(markupFactor.value || 1)
  return Math.round((valorComMarkup + Number.EPSILON) * 10000) / 10000
}

function toggleMdfRow(row) {
  if (!row) return
  row.selected = !row.selected
}

function toggleItemUnidade(item) {
  if (!item) return
  item.selected = !item.selected
}

function isFitaVinculada(item) {
  return fitaIdsVinculadas.value.has(Number(item?.id || 0))
}

function mapInsumo(item) {
  const fatorInformado = Number(item?.fator_conversao ?? item?.insumo_fator_conversao ?? 0)
  const fator = Number.isFinite(fatorInformado) && fatorInformado > 0 ? fatorInformado : 1
  const valueCompra = Number((item?.value_compra ?? item?.valor_unitario) || 0)
  const unidadeCompra = item?.unidade_compra || item?.unidade || null
  const unidadeReferencia = item?.insumo_unidade_referencia || item?.unidade_consumo || unidadeCompra
  return {
    key: `INSUMO_${item.id}`,
    id: item.id,
    categoria_base: 'INSUMO',
    name: item.name || item.nome_produto,
    unidade_compra: unidadeCompra,
    unidade_referencia: item?.unidade_referencia || unidadeReferencia,
    fator_conversao: fator,
    consumo_m2: Number(item?.consumo_m2 || 0),
    value_compra: valueCompra,
    value_referencia: Number(item?.value_referencia ?? (fator > 0 ? valueCompra / fator : valueCompra)),
    value_m2_base: Number(item?.value_m2_base || 0),
    value_m2: Number(item?.value_m2 || 0),
    selected: false,
  }
}

function trocarTab(tabId) {
  activeTab.value = tabId
  if (tabId === 'fita') {
    carregarFitasBorda()
  }
}

function trocarSubTab(catId) {
  activeSubTab.value = catId
  agendarBuscaCategoriaAutomatica()
}

function agendarBuscaCategoriaAutomatica() {
  if (buscaCategoriaTimer) clearTimeout(buscaCategoriaTimer)

  const termo = mdfSearch.value.trim()
  if (termo.length < 2) return

  buscaCategoriaTimer = setTimeout(() => {
    buscarCategoriaManual()
  }, 350)
}

async function buscarCategoriaManual(catId = activeSubTab.value) {
  if (buscandoCategorias.value[catId]) return
  const cat = CATEGORIAS_ABA1.find((item) => item.id === catId)
  if (!cat) return
  const termo = mdfSearch.value.trim()
  if (termo.length < 2) {
    notify.error('Informe ao menos 2 caracteres para buscar MDF.')
    return
  }

  buscandoCategorias.value[catId] = true
  try {
    const { data } = await EstrategiaPrecosService.buscarMdfPorCategoria(cat.apiKey, termo)
    const rows = Array.isArray(data) ? data : []
    gruposMdfPorCategoria.value[catId] = mergeMdfRows(gruposMdfPorCategoria.value[catId], rows)
  } catch (err) {
    console.error(err)
    notify.error('Nao foi possivel buscar os MDFs da categoria.')
  } finally {
    buscandoCategorias.value[catId] = false
  }
}

function limparResultadosCategoria(catId = activeSubTab.value) {
  gruposMdfPorCategoria.value[catId] = []
}

async function carregarFitasBorda() {
  if (fitasBordaCarregadas.value || loadingFitasBorda.value) return
  loadingFitasBorda.value = true
  try {
    const response = await ProdutosService.buscarComFiltros({ categoria_base: 'FITA_BORDA' })
    const data = response?.data ?? response
    const rows = Array.isArray(data) ? data : []
    fitasBorda.value = rows.map((item) => ({
      ...item,
      valor_unitario: Number(item?.valor_unitario || 0),
      metragem_rolo_m: item?.metragem_rolo_m ?? null,
      selected: false,
    }))
    fitasBordaCarregadas.value = true
  } catch (err) {
    console.error(err)
    notify.error('Nao foi possivel carregar as fitas de borda.')
  } finally {
    loadingFitasBorda.value = false
  }
}

async function carregarItensUnidade() {
  loadingItensUnidade.value = true
  try {
    const insumosRes = await EstrategiaPrecosService.listarInsumosFixos()
    const insumosData = insumosRes?.data ?? insumosRes

    const insumos = (Array.isArray(insumosData) ? insumosData : [])
      .filter((item) => String(item?.categoria_base || '').trim().toUpperCase() === 'INSUMO')
      .map(mapInsumo)
    itensUnidade.value = [...insumos]
  } catch (err) {
    console.error(err)
    notify.error('Nao foi possivel carregar os insumos.')
  } finally {
    loadingItensUnidade.value = false
  }
}

async function loadMatriz() {
  loadingMatriz.value = true
  try {
    const { data } = await EstrategiaPrecosService.listarMatriz({})
    matrizData.value = Array.isArray(data) ? data : []
    if (matrizData.value.length) {
      matrizAtualizadoEm.value = matrizData.value[0]?.atualizado_em ?? null
    }
  } catch (err) {
    console.error(err)
    notify.error('Nao foi possivel carregar a Matriz Operacional.')
  } finally {
    loadingMatriz.value = false
  }
}

async function carregarSelecoesSalvas() {
  try {
    const { data } = await EstrategiaPrecosService.listarSelecoesMatriz()
    aplicarSelecoesSalvas(data || {})
  } catch (err) {
    console.error(err)
    notify.error('Nao foi possivel restaurar as selecoes salvas da Matriz Operacional.')
  }
}

async function processarMatriz() {
  processando.value = true
  try {
    const payload = {
      loss_margin_pct: Number(mdfLossMarginPct.value || 0),
      markup_base_pct: Number(markupBasePct.value || 0),
      material_links: materiaisSelecionados.value.map((m) => ({
        category: m.category,
        commercial_category: m.commercial_category,
        thickness: Number(m.thickness),
        group: m.group,
        cost_base: Number(m.cost_base || 0),
        adicional_fita_m2: Number(custoFitaVinculadaPorMaterial(m) || 0),
        reference_purchase_price: Number(precoReferenciaByStrategy(m) || 0),
        fita_vinculada_id: m.fita_vinculada_id ?? null,
        acrescimo_pct: 0,
        selected: !!m.selected,
      })),
      kit_items: itensUnidadeSelecionados.value.map((item) => ({
          id: item.id,
          name: item.name,
          categoria_base: item.categoria_base,
          value: Number(valorUnitarioItem(item) || 0),
          selected: !!item.selected,
        })),
      hora_homem_value: Number(horaHomemValue.value || 0),
      custo_fixo_fabrica_value: Number(custoFixoFabricaValue.value || 0),
      capacidade_m2_mes: Number(capacidadeM2Mes.value || 0),
    }

    const { data } = await EstrategiaPrecosService.processarMatriz(payload)
    notify.success(`Matriz processada com sucesso. ${data?.processed ?? 0} categorias atualizadas.`)
    await loadMatriz()
    await carregarSelecoesSalvas()
  } catch (err) {
    console.error(err)
    notify.error('Falha ao processar a Matriz Operacional.')
  } finally {
    processando.value = false
  }
}

async function sincronizarRH() {
  const capacidade = Number(capacidadeM2Mes.value || 0)
  if (!capacidade || capacidade <= 0) {
    horaHomemValue.value = 0
    custoFixoFabricaValue.value = 0
    return
  }

  calculandoCustosInternos.value = true
  try {
    const [rhRes, internosRes] = await Promise.all([
      EstrategiaPrecosService.calcularCustosRH({ capacidade_m2_mes: capacidade }),
      EstrategiaPrecosService.calcularCustosInternos({ capacidade_m2_mes: capacidade }),
    ])

    const rh = rhRes?.data ?? rhRes
    const internos = internosRes?.data ?? internosRes

    horaHomemValue.value = Number(rh?.custoM2Producao || 0)
    custoFixoFabricaValue.value = Number(internos?.custo_fixo_fabrica_value || 0)
    custosInternosMeta.value = {
      mes: internos?.mes || null,
      ano: internos?.ano || null,
      mao_de_obra_total: Number(internos?.mao_de_obra_total || 0),
      operacao_total: Number(internos?.operacao_total || 0),
    }
  } catch (err) {
    console.error(err)
    notify.error('Nao foi possivel sincronizar RH e despesas.')
  } finally {
    calculandoCustosInternos.value = false
  }
}

function agendarRecalculoCustosInternos() {
  if (recalculoCustosTimer) clearTimeout(recalculoCustosTimer)
  recalculoCustosTimer = setTimeout(() => {
    sincronizarRH()
  }, 250)
}

watch(capacidadeM2Mes, () => {
  try {
    localStorage.setItem('estrategia_precos.capacidade_m2_mes', String(Number(capacidadeM2Mes.value || 0)))
  } catch (_) {
    // ignore localStorage errors
  }
  agendarRecalculoCustosInternos()
})

watch(mdfLossMarginPct, () => {
  mdfLossMarginPct.value = Math.max(0, Number(mdfLossMarginPct.value || 0))
  try {
    localStorage.setItem('estrategia_precos.mdf_loss_margin_pct', String(mdfLossMarginPct.value))
  } catch (_) {
    // ignore localStorage errors
  }
})

watch(markupBasePct, () => {
  markupBasePct.value = Math.max(0, Number(markupBasePct.value || 0))
  try {
    localStorage.setItem('estrategia_precos.markup_base_pct', String(markupBasePct.value))
  } catch (_) {
    // ignore localStorage errors
  }
})

watch(fitaSearch, () => {
  if (!fitasBordaCarregadas.value && activeTab.value === 'fita') {
    carregarFitasBorda()
  }
})

watch(unidadeSearch, () => {
  if (!itensUnidade.value.length && activeTab.value === 'unidade') {
    carregarItensUnidade()
  }
})

watch(
  [matrizPorCategoria, fitaPorCategoria, combinadoPorCategoria, unidadeTotal, custosInternosTotal, activeSubTab],
  () => {
    matrizStore.atualizarConsolidacaoTempoReal({
      categorias: CATEGORIAS_ABA1,
      materialByCategory: matrizPorCategoria.value,
      fitaByCategory: fitaPorCategoria.value,
      combinedByCategory: combinadoPorCategoria.value,
      unidade: Number(unidadeTotal.value || 0),
      rh: Number(custosInternosTotal.value || 0),
      categoriaAtiva: activeSubTab.value,
    })
  },
  { immediate: true, deep: true },
)

onMounted(async () => {
  try {
    const capacidadeSalva = Number(localStorage.getItem('estrategia_precos.capacidade_m2_mes') || 0)
    if (Number.isFinite(capacidadeSalva) && capacidadeSalva > 0) {
      capacidadeM2Mes.value = capacidadeSalva
    }

    const margemSalva = Number(localStorage.getItem('estrategia_precos.mdf_loss_margin_pct') || 0)
    if (Number.isFinite(margemSalva) && margemSalva >= 0) {
      mdfLossMarginPct.value = margemSalva
    }

    const markupSalvo = Number(localStorage.getItem('estrategia_precos.markup_base_pct') || 0)
    if (Number.isFinite(markupSalvo) && markupSalvo >= 0) {
      markupBasePct.value = markupSalvo
    }
  } catch (_) {
    // ignore localStorage errors
  }

  await Promise.all([
    carregarFitasBorda(),
    carregarItensUnidade(),
    loadMatriz(),
    sincronizarRH(),
  ])

  await carregarSelecoesSalvas()
})
</script>

<style scoped>
.estrategia-precos :deep(.ds-shell-card) {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.estrategia-precos :deep(.ds-header-block) {
  padding-left: 1rem;
  padding-right: 1rem;
}

.estrategia-precos__body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
}

.estrategia-precos__header-actions {
  width: 100%;
  justify-content: flex-end;
}

.estrategia-precos__header-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  min-width: min(100%, 18rem);
  padding: 0.25rem 0;
}

.estrategia-precos__header-kicker,
.estrategia-precos__workspace-eyebrow {
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgb(100 116 139);
}

.estrategia-precos__header-updated,
.estrategia-precos__workspace-copy,
.estrategia-precos__toolbar-copy,
.estrategia-precos__control-help {
  font-size: 0.74rem;
  line-height: 1.55;
  color: var(--ds-color-text-muted, rgb(100 116 139));
}

.estrategia-precos__workspace {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.estrategia-precos__workspace-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0 0 0.95rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-border) 92%);
}

.estrategia-precos__workspace-status {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
}

.estrategia-precos__status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 16%, var(--ds-color-border) 84%);
  background: color-mix(in srgb, var(--ds-color-primary) 7%, white);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--ds-color-primary) 58%, rgb(51 65 85));
}

.estrategia-precos__status-note {
  font-size: 0.74rem;
  color: var(--ds-color-text-muted, rgb(100 116 139));
}

.estrategia-precos__workspace-toolbar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 0 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 88%, white);
}

.estrategia-precos__tabs,
.estrategia-precos__subtabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.estrategia-precos__tab,
.estrategia-precos__subtab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.8rem;
  padding: 0.65rem 1rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 90%, white);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--ds-color-primary) 2%, white);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(71 85 105);
  transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease, color 180ms ease;
}

.estrategia-precos__tab:hover,
.estrategia-precos__subtab:hover {
  border-color: color-mix(in srgb, var(--ds-color-primary) 28%, var(--ds-color-border) 72%);
  transform: translateY(-1px);
}

.estrategia-precos__tab--active {
  border-color: transparent;
  background: linear-gradient(135deg, var(--ds-color-primary), color-mix(in srgb, var(--ds-color-primary) 72%, rgb(14 165 233)));
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.2);
  color: white;
}

.estrategia-precos__subtab--active {
  border-color: rgb(15 23 42);
  background: rgb(15 23 42);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.18);
  color: white;
}

.estrategia-precos__controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
}

.estrategia-precos__control-card {
  padding: 0.95rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 72%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--ds-color-primary) 2%, transparent);
}

.estrategia-precos__search-input {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 86%, white);
  border-radius: 0.95rem;
  background: white;
  color: rgb(51 65 85);
  transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
}

.estrategia-precos__search-input {
  padding: 0.72rem 0.85rem 0.72rem 2rem;
  font-size: 0.9rem;
}

.estrategia-precos__search-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--ds-color-primary) 36%, var(--ds-color-border) 64%);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--ds-color-primary) 10%, transparent);
}

.estrategia-precos__table-shell {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 78%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, white 88%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.estrategia-precos__table {
  width: 100%;
}

.estrategia-precos__table--mdf,
.estrategia-precos__table--venda {
  min-width: 860px;
}

.estrategia-precos__table--fita {
  min-width: 840px;
}

.estrategia-precos__table--unidade {
  min-width: 980px;
}

.estrategia-precos__table-head-row {
  background: white;
  border-bottom: 1px solid var(--ds-color-border);
  text-align: left;
}

.estrategia-precos__table-head-cell {
  padding: 0.5rem 0.75rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(100 116 139);
}

.estrategia-precos__table-head-cell--accent {
  color: rgb(4 120 87);
}

.estrategia-precos__table-row {
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
  transition: background-color 180ms ease;
}

.estrategia-precos__table-row:last-child {
  border-bottom: 0;
}

.estrategia-precos__table-row--interactive {
  cursor: pointer;
}

.estrategia-precos__table-row--hover-blue:hover {
  background: rgba(59, 130, 246, 0.08);
}

.estrategia-precos__table-row--hover-orange:hover {
  background: rgba(249, 115, 22, 0.08);
}

.estrategia-precos__table-row--hover-neutral:hover {
  background: rgba(148, 163, 184, 0.08);
}

.estrategia-precos__table-row--selected {
  background: rgba(59, 130, 246, 0.12);
}

.estrategia-precos__table-row--linked {
  background: rgba(249, 115, 22, 0.1);
}

.estrategia-precos__table-cell {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  color: var(--ds-color-text, rgb(15 23 42));
  vertical-align: top;
}

.estrategia-precos__table-cell--checkbox {
  width: 54px;
}

.estrategia-precos__table-cell--strong {
  font-weight: 600;
}

.estrategia-precos__table-cell--numeric {
  font-variant-numeric: tabular-nums;
}

.estrategia-precos__table-cell--accent {
  font-weight: 900;
  color: rgb(4 120 87);
}

.estrategia-precos__table-state {
  padding: 2rem 0.75rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--ds-color-text-muted, rgb(100 116 139));
}

.estrategia-precos__table-value-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 0.7rem;
  padding: 0.3rem 0.625rem;
  background: rgba(16, 185, 129, 0.12);
  color: rgb(4 120 87);
  font-size: 0.76rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.estrategia-precos__table-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.estrategia-precos__table-tag--blue {
  background: rgba(59, 130, 246, 0.14);
  color: rgb(29 78 216);
}

.estrategia-precos__control-help {
  margin-top: 0.45rem;
}

.estrategia-precos__strip-grid,
.estrategia-precos__stat-grid,
.estrategia-precos__summary-grid {
  display: grid;
  gap: 0.85rem;
}

.estrategia-precos__strip-grid--three,
.estrategia-precos__stat-grid--three {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.estrategia-precos__summary-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.estrategia-precos__strip-panel,
.estrategia-precos__summary-panel,
.estrategia-precos__note-panel,
.estrategia-precos__stat-line {
  border-radius: 1rem;
  background: color-mix(in srgb, white 82%, transparent);
}

.estrategia-precos__strip-panel,
.estrategia-precos__summary-panel,
.estrategia-precos__note-panel {
  padding: 0.95rem 1rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 78%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.estrategia-precos__strip-panel {
  position: relative;
}

.estrategia-precos__strip-panel::before,
.estrategia-precos__summary-panel::before,
.estrategia-precos__stat-line::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.8rem;
  bottom: 0.8rem;
  width: 3px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ds-color-border) 80%, transparent);
}

.estrategia-precos__strip-panel--neutral::before {
  background: rgb(148 163 184);
}

.estrategia-precos__strip-panel--blue::before,
.estrategia-precos__summary-panel--blue::before,
.estrategia-precos__stat-line--blue::before {
  background: rgb(59 130 246);
}

.estrategia-precos__strip-panel--violet::before,
.estrategia-precos__summary-panel--violet::before,
.estrategia-precos__stat-line--violet::before {
  background: rgb(139 92 246);
}

.estrategia-precos__summary-panel {
  position: relative;
  min-height: 116px;
  padding-left: 1.15rem;
}

.estrategia-precos__summary-panel--emerald::before,
.estrategia-precos__stat-line--emerald::before {
  background: rgb(16 185 129);
}

.estrategia-precos__summary-panel--orange::before {
  background: rgb(249 115 22);
}

.estrategia-precos__summary-panel--brand::before {
  background: var(--ds-color-primary);
}

.estrategia-precos__summary-panel--brand {
  background: linear-gradient(135deg, color-mix(in srgb, var(--ds-color-primary) 7%, white), white 62%, color-mix(in srgb, rgb(16 185 129) 7%, white));
}

.estrategia-precos__stat-line {
  position: relative;
  padding: 0.9rem 1rem 0.9rem 1.1rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 72%, transparent);
  font-size: 0.92rem;
  color: rgb(71 85 105);
}

.estrategia-precos__stat-line strong {
  color: rgb(15 23 42);
}

.estrategia-precos__note-panel {
  font-size: 0.92rem;
  line-height: 1.65;
  color: rgb(71 85 105);
}

.estrategia-precos__tab-panel {
  padding: 0;
}

.estrategia-precos__tab-panel--contrast {
  background: transparent;
}

@media (min-width: 768px) {
  .estrategia-precos__body {
    padding: 1rem 1.5rem 1.75rem;
  }

  .estrategia-precos :deep(.ds-header-block) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .estrategia-precos__workspace-head,
  .estrategia-precos__workspace-toolbar,
  .estrategia-precos__tab-panel {
    padding-left: 0;
    padding-right: 0;
  }
}

@media (min-width: 1024px) {
  .estrategia-precos__body {
    padding: 1rem 2rem 2rem;
  }

  .estrategia-precos :deep(.ds-header-block) {
    padding-left: 2rem;
    padding-right: 2rem;
  }

  .estrategia-precos__workspace-head,
  .estrategia-precos__workspace-toolbar,
  .estrategia-precos__tab-panel {
    padding-left: 0;
    padding-right: 0;
  }
}
</style>