<template>
  <div class="w-full h-full rounded-2xl border border-border-ui bg-bg-card overflow-hidden animate-page-in">
    <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>

    <PageHeader
      title="Estrategia de Precos"
      subtitle="Matriz operacional: MDF, fita e insumos base (ferragens tratadas no orçamento)"
      icon="pi pi-chart-line"
      :show-back="false"
      class="border-b border-border-ui"
    />

    <div class="p-4 md:p-6 space-y-6">
      <section class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden">
        <div class="px-4 md:px-5 py-3 border-b border-border-ui bg-slate-50/80 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-600">Matriz Operacional de Insumos Base</p>
            <p class="text-[11px] text-text-muted mt-0.5">
              Aba 1 calcula MDF por m2, Aba 2 fita por metro com +100%, Aba 3 trata somente insumos base de consumo, Aba 4 RH e despesas, e Aba 5 consolida o preço final por categoria.
            </p>
          </div>
          <span v-if="matrizAtualizadoEm" class="text-[11px] text-text-muted whitespace-nowrap">
            Ultima atualizacao: <span class="font-semibold text-text-main">{{ formatDate(matrizAtualizadoEm) }}</span>
          </span>
        </div>

        <div class="px-4 md:px-5 py-4 border-b border-border-ui/60 bg-white">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              class="inline-flex items-center rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all"
              :class="activeTab === tab.id ? 'bg-brand-primary text-white shadow-sm' : 'border border-border-ui bg-bg-page text-slate-600 hover:border-brand-primary/30'"
              @click="trocarTab(tab.id)"
            >
              {{ tab.label }}
            </button>
          </div>
          <p class="mt-2 text-[11px] text-slate-500">{{ fluxoAbaDescricao }}</p>
          <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="rounded-xl border border-border-ui bg-bg-page p-3">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Margem MDF (%)</label>
              <input
                v-model.number="mdfLossMarginPct"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-xl border border-border-ui bg-white px-3 py-2 text-sm"
              />
              <p class="mt-1 text-[11px] text-slate-500">Fórmula: (Preço Chapa / 5,06) + {{ Number(mdfLossMarginPct || 0).toFixed(2) }}%</p>
            </div>
            <div class="rounded-xl border border-border-ui bg-bg-page p-3">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Markup Fita/Insumos (%)</label>
              <input
                v-model.number="markupBasePct"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-xl border border-border-ui bg-white px-3 py-2 text-sm"
              />
              <p class="mt-1 text-[11px] text-slate-500">Aplicado sobre valor original do banco: +{{ Number(markupBasePct || 0).toFixed(2) }}%</p>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'mdf'" class="px-4 md:px-5 py-4 space-y-4 bg-white">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in CATEGORIAS_ABA1"
              :key="cat.id"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all"
              :class="activeSubTab === cat.id ? 'bg-slate-900 text-white shadow-sm' : 'border border-border-ui bg-bg-page text-slate-600 hover:border-slate-400/50'"
              @click="trocarSubTab(cat.id)"
            >
              <span
                class="inline-block w-2 h-2 rounded-full"
                :class="cat.id === 'essencial' ? 'bg-slate-400' : cat.id === 'design' ? 'bg-emerald-400' : 'bg-amber-400'"
              ></span>
              {{ cat.label }}
            </button>
          </div>

          <div class="rounded-xl border border-border-ui overflow-hidden">
            <div class="px-3 py-2 bg-slate-50/70 border-b border-border-ui">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <div class="relative md:col-span-8">
                  <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                  <input
                    v-model.trim="mdfSearch"
                    type="text"
                    placeholder="Digite o nome do MDF para buscar referencias nesta categoria"
                    class="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40"
                    @input="agendarBuscaCategoriaAutomatica()"
                    @keyup.enter="buscarCategoriaManual()"
                  />
                </div>
                <div class="md:col-span-4 flex items-center md:justify-end gap-3">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl border border-border-ui bg-bg-page px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 transition-all hover:border-slate-400/50"
                    :disabled="!gruposMdfAtivo.length"
                    @click="limparResultadosCategoria()"
                  >
                    <i class="pi pi-times text-[10px]"></i>
                    Limpar
                  </button>
                  <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">Formula: (Preço Chapa / 5,06) + {{ Number(mdfLossMarginPct || 0).toFixed(2) }}%</span>
                  <span v-if="buscandoCategorias[activeSubTab]" class="text-[11px] text-slate-500 flex items-center gap-1">
                    <i class="pi pi-spin pi-spinner text-xs"></i>
                  </span>
                  <span v-else class="text-[11px] text-text-muted whitespace-nowrap">{{ gruposMdfSelecionadosCount }}/{{ gruposMdfAtivo.length }}</span>
                </div>
              </div>
            </div>

            <div class="max-h-[360px] overflow-auto">
              <table class="w-full min-w-[860px]">
                <thead>
                  <tr class="bg-white border-b border-border-ui text-left text-[11px] uppercase tracking-wider text-slate-500">
                    <th class="px-3 py-2">Selecionar</th>
                    <th class="px-3 py-2">Material</th>
                    <th class="px-3 py-2">Espessura</th>
                    <th class="px-3 py-2">Preço Chapa</th>
                    <th class="px-3 py-2">Preço Chapa / 5,06</th>
                    <th class="px-3 py-2 text-emerald-700">Custo MDF / m2</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="buscandoCategorias[activeSubTab]">
                    <tr v-for="n in 4" :key="n" class="border-b border-border-ui/70 animate-pulse">
                      <td v-for="c in 6" :key="c" class="px-3 py-2">
                        <div class="h-3.5 rounded bg-slate-100 w-3/4"></div>
                      </td>
                    </tr>
                  </template>
                  <template v-else>
                    <tr
                      v-for="row in gruposMdfAtivoFiltrado"
                      :key="row.key"
                      class="border-b border-border-ui/70 last:border-b-0 transition-colors cursor-pointer"
                      :class="row.selected ? 'bg-blue-50/70' : 'hover:bg-blue-50/40'"
                      @click="toggleMdfRow(row)"
                    >
                      <td class="px-3 py-2">
                        <input
                          v-model="row.selected"
                          type="checkbox"
                          class="h-4 w-4 rounded border-border-ui"
                          @click.stop
                        />
                      </td>
                      <td class="px-3 py-2 text-sm font-semibold text-text-main">{{ row.group }}</td>
                      <td class="px-3 py-2 text-sm text-text-main">{{ row.thickness }} mm</td>
                      <td class="px-3 py-2 text-sm text-text-main tabular-nums">{{ formatCurrency(precoReferenciaByStrategy(row)) }}</td>
                      <td class="px-3 py-2 text-sm text-text-main tabular-nums">{{ formatCurrency(custoCompraM2(row)) }}</td>
                      <td class="px-3 py-2">
                        <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black bg-emerald-100/70 text-emerald-700 tabular-nums">
                          {{ formatCurrency(custoMdfCalculadoM2(row)) }}/m2
                        </span>
                      </td>
                    </tr>
                    <tr v-if="!gruposMdfAtivo.length && !buscandoCategorias[activeSubTab] && mdfSearch.trim().length < 2">
                      <td colspan="6" class="px-3 py-8 text-center text-sm text-text-muted">
                        Digite pelo menos 2 caracteres para buscar MDF automaticamente.
                      </td>
                    </tr>
                    <tr v-else-if="!gruposMdfAtivo.length">
                      <td colspan="6" class="px-3 py-8 text-center text-sm text-text-muted">
                        Nenhuma referencia encontrada para esta busca.
                      </td>
                    </tr>
                    <tr v-else-if="!gruposMdfAtivoFiltrado.length">
                      <td colspan="6" class="px-3 py-8 text-center text-sm text-text-muted">
                        Nenhum MDF corresponde ao filtro atual.
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <div class="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
            Custo MDF da categoria ativa: <strong>{{ formatCurrency(resumoVendaAtivo.materialCost) }}/m2</strong>
          </div>
        </div>

        <div v-else-if="activeTab === 'fita'" class="px-4 md:px-5 py-4 space-y-4 bg-white">
          <div class="rounded-xl border border-border-ui overflow-hidden">
            <div class="px-3 py-2 bg-slate-50/70 border-b border-border-ui">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <div class="relative md:col-span-8">
                  <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                  <input
                    v-model.trim="fitaSearch"
                    type="text"
                    placeholder="Buscar fita por nome, cor ou metragem"
                    class="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40"
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
              <table class="w-full min-w-[840px]">
                <thead>
                  <tr class="bg-white border-b border-border-ui text-left text-[11px] uppercase tracking-wider text-slate-500">
                    <th class="px-3 py-2">Selecionar</th>
                    <th class="px-3 py-2">Produto</th>
                    <th class="px-3 py-2">Cor</th>
                    <th class="px-3 py-2">Metragem do Rolo</th>
                    <th class="px-3 py-2">Preço do Rolo</th>
                    <th class="px-3 py-2 text-emerald-700">Custo por Metro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingFitasBorda">
                    <td colspan="6" class="px-3 py-8 text-center text-sm text-text-muted">Carregando fitas de borda...</td>
                  </tr>
                  <template v-else>
                    <tr
                      v-for="fita in fitasBordaFiltradas"
                      :key="fita.id"
                      class="border-b border-border-ui/70 last:border-b-0 transition-colors"
                      :class="isFitaVinculada(fita) ? 'bg-orange-50/70' : 'hover:bg-orange-50/40'"
                    >
                      <td class="px-3 py-2">
                        <input
                          type="checkbox"
                          class="h-4 w-4 rounded border-border-ui"
                          :checked="isFitaVinculada(fita)"
                          disabled
                        />
                      </td>
                      <td class="px-3 py-2 text-sm font-semibold text-text-main">{{ fita.nome_produto || '-' }}</td>
                      <td class="px-3 py-2 text-sm text-text-main">{{ fita.cor || '-' }}</td>
                      <td class="px-3 py-2 text-sm text-text-main tabular-nums">{{ formatMetragemRolo(fita.metragem_rolo_m) }}</td>
                      <td class="px-3 py-2 text-sm text-text-main tabular-nums">{{ formatCurrency(fita.valor_unitario) }}</td>
                      <td class="px-3 py-2">
                        <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black bg-emerald-100/70 text-emerald-700 tabular-nums">
                          {{ formatCurrency(custoFitaPorMetro(fita)) }}/m
                        </span>
                      </td>
                    </tr>
                    <tr v-if="!fitasBordaFiltradas.length">
                      <td colspan="6" class="px-3 py-8 text-center text-sm text-text-muted">
                        Nenhuma fita de borda encontrada.
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <div class="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
            Total medio de fita vinculada automaticamente: <strong>{{ formatCurrency(fitaTotal) }}</strong>
          </div>
        </div>

        <div v-else-if="activeTab === 'unidade'" class="px-4 md:px-5 py-4 space-y-4 bg-white">
          <div class="rounded-xl border border-border-ui overflow-hidden">
            <div class="px-3 py-2 bg-slate-50/70 border-b border-border-ui">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <div class="relative md:col-span-8">
                  <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                  <input
                    v-model.trim="unidadeSearch"
                    type="text"
                    placeholder="Buscar insumo base por nome"
                    class="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40"
                  />
                </div>
                <div class="md:col-span-4 flex items-center md:justify-end gap-3">
                  <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">Formula: (custo da unidade de referencia x consumo medio por m2) + {{ Number(markupBasePct || 0).toFixed(2) }}%</span>
                  <span v-if="loadingItensUnidade" class="text-[11px] text-slate-500 flex items-center gap-1">
                    <i class="pi pi-spin pi-spinner text-xs"></i>
                  </span>
                  <span v-else class="text-[11px] text-text-muted whitespace-nowrap">{{ itensUnidadeFiltrados.length }}/{{ itensUnidade.length }}</span>
                </div>
              </div>
            </div>

            <div class="max-h-[360px] overflow-auto">
              <table class="w-full min-w-[980px]">
                <thead>
                  <tr class="bg-white border-b border-border-ui text-left text-[11px] uppercase tracking-wider text-slate-500">
                    <th class="px-3 py-2">Selecionar</th>
                    <th class="px-3 py-2">Tipo</th>
                    <th class="px-3 py-2">Item</th>
                    <th class="px-3 py-2">Unidade Compra</th>
                    <th class="px-3 py-2">Unidade Referência</th>
                    <th class="px-3 py-2">Fator</th>
                    <th class="px-3 py-2">Valor Compra</th>
                    <th class="px-3 py-2">Consumo / m2</th>
                    <th class="px-3 py-2 text-emerald-700">Custo Estrategico / m2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingItensUnidade">
                    <td colspan="9" class="px-3 py-8 text-center text-sm text-text-muted">Carregando insumos...</td>
                  </tr>
                  <template v-else>
                    <tr
                      v-for="item in itensUnidadeFiltrados"
                      :key="item.key"
                      class="border-b border-border-ui/70 last:border-b-0 transition-colors cursor-pointer"
                      :class="item.selected ? 'bg-blue-50/70' : 'hover:bg-blue-50/40'"
                      @click="toggleItemUnidade(item)"
                    >
                      <td class="px-3 py-2">
                        <input
                          v-model="item.selected"
                          type="checkbox"
                          class="h-4 w-4 rounded border-border-ui"
                          @click.stop
                        />
                      </td>
                      <td class="px-3 py-2">
                        <span
                          class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide bg-blue-100 text-blue-700"
                        >
                          Insumo
                        </span>
                      </td>
                      <td class="px-3 py-2 text-sm font-semibold text-text-main">{{ item.name }}</td>
                      <td class="px-3 py-2 text-sm text-text-main">{{ item.unidade_compra || '-' }}</td>
                      <td class="px-3 py-2 text-sm text-text-main">{{ item.unidade_referencia || '-' }}</td>
                      <td class="px-3 py-2 text-sm text-text-main tabular-nums">{{ Number(item.fator_conversao || 1).toFixed(3) }}</td>
                      <td class="px-3 py-2 text-sm text-text-main tabular-nums">{{ formatCurrency(item.value_compra) }}</td>
                      <td class="px-3 py-2 text-sm text-text-main tabular-nums">{{ Number(item.consumo_m2 || 0).toFixed(4) }}</td>
                      <td class="px-3 py-2">
                        <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black bg-emerald-100/70 text-emerald-700 tabular-nums">
                          {{ formatCurrency(valorUnitarioItem(item)) }}/m2
                        </span>
                      </td>
                    </tr>
                    <tr v-if="!itensUnidadeFiltrados.length">
                      <td colspan="9" class="px-3 py-8 text-center text-sm text-text-muted">
                        Nenhum insumo encontrado.
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <div class="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
            Total de insumos base: <strong>{{ formatCurrency(unidadeTotal) }}</strong>
          </div>
        </div>

        <div v-else-if="activeTab === 'rh'" class="px-4 md:px-5 py-4 space-y-4 bg-white">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="rounded-xl border border-border-ui bg-bg-page p-3">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Capacidade M2/mês</label>
              <input
                v-model.number="capacidadeM2Mes"
                type="number"
                min="0.01"
                step="0.01"
                class="w-full rounded-xl border border-border-ui bg-white px-3 py-2 text-sm"
              />
            </div>
            <div class="rounded-xl border border-border-ui bg-bg-page p-3">
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
                <button
                  type="button"
                  :disabled="calculandoCustosInternos"
                  @click="sincronizarRH()"
                  class="rounded-lg p-1.5 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-40"
                  title="Sincronizar com Sistema RH"
                >
                  <i :class="calculandoCustosInternos ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" class="text-xs"></i>
                </button>
              </div>
            </div>
            <div class="rounded-xl border border-border-ui bg-bg-page p-3">
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
                <button
                  type="button"
                  :disabled="calculandoCustosInternos"
                  @click="sincronizarRH()"
                  class="rounded-lg p-1.5 text-violet-600 hover:bg-violet-100 transition-colors disabled:opacity-40"
                  title="Recalcular despesas operacionais"
                >
                  <i :class="calculandoCustosInternos ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" class="text-xs"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              :disabled="calculandoCustosInternos"
              @click="sincronizarRH()"
              class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <i :class="calculandoCustosInternos ? 'pi pi-spin pi-spinner' : 'pi pi-sync'" class="text-xs"></i>
              {{ calculandoCustosInternos ? 'Sincronizando...' : 'Sincronizar com Sistema RH' }}
            </button>
            <span class="text-[11px] text-slate-500">Base: despesas de {{ custosInternosCompetenciaLabel }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="rounded-xl bg-blue-50 border border-blue-100 px-3 py-3 text-sm text-blue-700">
              RH por m2: <strong>{{ formatCurrency(horaHomemValue) }}/m2</strong>
            </div>
            <div class="rounded-xl bg-violet-50 border border-violet-100 px-3 py-3 text-sm text-violet-700">
              Despesas por m2: <strong>{{ formatCurrency(custoFixoFabricaValue) }}/m2</strong>
            </div>
            <div class="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-3 text-sm text-emerald-700">
              Total RH + despesas: <strong>{{ formatCurrency(custosInternosTotal) }}/m2</strong>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'venda'" class="px-4 md:px-5 py-4 space-y-4 bg-slate-50/30">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div class="rounded-xl border border-emerald-200 bg-white p-3">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">MDF selecionado</p>
              <p class="mt-1 text-lg font-black tabular-nums text-emerald-700">{{ formatCurrency(resumoVendaAtivo.materialCost) }}</p>
              <p class="text-[11px] text-slate-500 mt-1">Categoria ativa: {{ categoriaAtivaResumoLabel }}</p>
            </div>
            <div class="rounded-xl border border-orange-200 bg-white p-3">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Fita de Borda</p>
              <p class="mt-1 text-lg font-black tabular-nums text-orange-700">{{ formatCurrency(fitaTotal) }}</p>
              <p class="text-[11px] text-slate-500 mt-1">Total selecionado na Aba 2</p>
            </div>
            <div class="rounded-xl border border-blue-200 bg-white p-3">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Insumos Base</p>
              <p class="mt-1 text-lg font-black tabular-nums text-blue-700">{{ formatCurrency(unidadeTotal) }}</p>
              <p class="text-[11px] text-slate-500 mt-1">Total de insumos base da Aba 3</p>
            </div>
            <div class="rounded-xl border border-violet-200 bg-white p-3">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">RH + Despesas</p>
              <p class="mt-1 text-lg font-black tabular-nums text-violet-700">{{ formatCurrency(custosInternosTotal) }}</p>
              <p class="text-[11px] text-slate-500 mt-1">Vindo da Aba 4</p>
            </div>
            <div class="rounded-xl border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-white to-emerald-50 p-3">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Valor final</p>
              <p class="mt-1 text-lg font-black tabular-nums text-brand-primary">{{ formatCurrency(resumoVendaAtivo.finalValue) }}</p>
              <p class="text-[11px] text-slate-500 mt-1">Custo MDF + Fita + Insumos Base + RH/Despesas</p>
            </div>
          </div>

          <div class="rounded-xl border border-border-ui bg-white overflow-hidden">
            <div class="px-3 py-2 bg-slate-50 border-b border-border-ui flex items-center justify-between gap-3 flex-wrap">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Preço Final de Venda por Categoria</p>
              <span class="text-[11px] text-slate-500">Aba 1 + Aba 2 + Aba 3 + Aba 4</span>
            </div>
            <div class="overflow-auto">
              <table class="w-full min-w-[860px]">
                <thead>
                  <tr class="bg-white border-b border-border-ui text-left text-[11px] uppercase tracking-wider text-slate-500">
                    <th class="px-3 py-2">Categoria</th>
                    <th class="px-3 py-2">Custo MDF</th>
                    <th class="px-3 py-2">Fita</th>
                    <th class="px-3 py-2">Unidade</th>
                    <th class="px-3 py-2">RH + Despesas</th>
                    <th class="px-3 py-2 text-emerald-700">Preço Final de Venda</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="cat in CATEGORIAS_ABA1"
                    :key="cat.id"
                    class="border-b border-border-ui/70 last:border-b-0 hover:bg-slate-50 transition-colors"
                  >
                    <td class="px-3 py-2 text-sm font-semibold text-text-main">{{ cat.label }}</td>
                    <td class="px-3 py-2 text-sm tabular-nums">{{ formatCurrency(precoFinalPorCategoria[cat.id].materialCost) }}</td>
                    <td class="px-3 py-2 text-sm tabular-nums">{{ formatCurrency(precoFinalPorCategoria[cat.id].fita) }}</td>
                    <td class="px-3 py-2 text-sm tabular-nums">{{ formatCurrency(precoFinalPorCategoria[cat.id].unidade) }}</td>
                    <td class="px-3 py-2 text-sm tabular-nums">{{ formatCurrency(precoFinalPorCategoria[cat.id].rh) }}</td>
                    <td class="px-3 py-2 text-sm font-black tabular-nums text-emerald-700">{{ formatCurrency(precoFinalPorCategoria[cat.id].finalValue) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div class="rounded-xl border border-border-ui bg-white p-3 text-sm text-slate-600">
              Ao processar, a persistência da matriz usa MDF como base e soma fita, insumos base e RH/despesas no componente consolidado. Ferragens por unidade seguem no orçamento técnico.
            </div>
            <div class="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                class="inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-border-ui text-text-main hover:bg-slate-50 transition-all"
                :disabled="loadingMatriz"
                @click="loadMatriz"
              >
                <i :class="loadingMatriz ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" class="text-sm"></i>
                Atualizar dados
              </button>
              <button
                type="button"
                class="inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="processando"
                @click="processarMatriz"
              >
                <i :class="processando ? 'pi pi-spin pi-spinner' : 'pi pi-calculator'" class="text-sm"></i>
                {{ processando ? 'Processando...' : 'Gerar Preço Final' }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
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
    const materialCost = materialCosts.length ? materialCosts.reduce((sum, value) => sum + value, 0) / materialCosts.length : 0
    const fitaAvg = fitaCosts.length ? fitaCosts.reduce((sum, value) => sum + value, 0) / fitaCosts.length : 0

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
  const corMaterial = normalizarCorVinculo(material?.color || material?.group || material?.cor || material?.nome_produto || '')
  if (!corMaterial) return null

  const fitas = Array.isArray(fitasBorda.value) ? fitasBorda.value : []
  const exata = fitas.find((item) => normalizarCorVinculo(item?.cor || item?.nome_produto || '') === corMaterial)
  if (exata) return exata

  return fitas.find((item) => {
    const corFita = normalizarCorVinculo(item?.cor || item?.nome_produto || '')
    return corFita && (corFita.includes(corMaterial) || corMaterial.includes(corFita))
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

  const valorComMarkup = valorReferencia * Number(markupFactor.value || 1)
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