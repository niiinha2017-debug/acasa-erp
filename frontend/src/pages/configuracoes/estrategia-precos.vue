<template>
  <div class="w-full h-full rounded-2xl border border-border-ui bg-bg-card overflow-hidden animate-page-in">
    <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>

    <PageHeader
      title="Estrategia de Precos"
      subtitle="Matriz Operacional de Insumos Base com processamento por abas"
      icon="pi pi-chart-line"
      :show-back="false"
      class="border-b border-border-ui"
    >
      <template #actions>
        <div class="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
          Estrategia ativa: <span class="text-brand-primary font-black">{{ strategyLabel(activeStrategy) }}</span>
        </div>
      </template>
    </PageHeader>

    <div class="p-4 md:p-6 space-y-6">
      <section>
        <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Regra do mes</h3>
        <div class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="item in strategies"
            :key="item.value"
            type="button"
            class="min-w-[240px] rounded-xl border px-3 py-2.5 text-left transition-all"
            :class="[
              activeStrategy === item.value
                ? 'border-brand-primary bg-blue-50 shadow-sm'
                : 'border-border-ui bg-white hover:border-brand-primary/35 hover:bg-slate-50',
              saving && pendingStrategy === item.value ? 'opacity-60' : ''
            ]"
            :disabled="saving"
            @click="selectStrategy(item.value)"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <i :class="item.icon" class="text-sm"></i>
                </span>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">{{ item.badge }}</p>
                  <h4 class="text-sm font-black text-text-main">{{ item.title }}</h4>
                </div>
              </div>
              <i
                :class="[
                  activeStrategy === item.value ? 'pi pi-check-circle text-brand-primary' : 'pi pi-circle text-slate-300',
                  'text-base'
                ]"
              ></i>
            </div>
            <p class="text-[11px] text-text-muted mt-1.5 leading-relaxed line-clamp-2">{{ item.description }}</p>
          </button>
        </div>
      </section>

      <section class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden">
        <div class="px-4 md:px-5 py-3 border-b border-border-ui bg-slate-50/80 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-600">Matriz Operacional de Insumos Base</p>
            <p class="text-[11px] text-text-muted mt-0.5">
              O processamento soma Materiais + Insumos Fixos + Custos Internos para gerar Minimo, Medio e Maximo.
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
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
          <p class="mt-2 text-[11px] text-slate-500">
            {{ fluxoAbaDescricao }}
          </p>
        </div>

        <div class="px-4 md:px-5 py-4 border-b border-border-ui/60 bg-white">
          <div v-if="activeTab === 'materiais'" class="space-y-4">
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
                      v-model.trim="materialSearch"
                      type="text"
                      placeholder="Buscar produto nesta categoria"
                      class="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40"
                    />
                  </div>
                  <div class="md:col-span-4 flex items-center md:justify-end gap-3">
                    <label class="text-[10px] text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">Acréscimo %</label>
                    <input
                      v-model.number="acrescimoPct"
                      type="number"
                      min="0"
                      step="0.01"
                      class="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                    />
                    <span v-if="buscandoCategorias[activeSubTab]" class="text-[11px] text-slate-500 flex items-center gap-1">
                      <i class="pi pi-spin pi-spinner text-xs"></i>
                    </span>
                    <span v-else class="text-[11px] text-text-muted whitespace-nowrap">{{ gruposMdfAtivoFiltrado.length }}/{{ gruposMdfAtivo.length }}</span>
                  </div>
                </div>
              </div>

              <div class="max-h-[320px] overflow-auto">
                <table class="w-full min-w-[620px]">
                  <thead>
                    <tr class="bg-white border-b border-border-ui text-left text-[11px] uppercase tracking-wider text-slate-500">
                      <th class="px-3 py-2">Selecionar</th>
                      <th class="px-3 py-2">Material</th>
                      <th class="px-3 py-2">Espessura</th>
                      <th class="px-3 py-2">Valor Ref. (x2)</th>
                      <th class="px-3 py-2 text-emerald-700">Custo Base / m2</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="buscandoCategorias[activeSubTab]">
                      <tr v-for="n in 4" :key="n" class="border-b border-border-ui/70 animate-pulse">
                        <td v-for="c in 5" :key="c" class="px-3 py-2">
                          <div class="h-3.5 rounded bg-slate-100 w-3/4"></div>
                        </td>
                      </tr>
                    </template>
                    <template v-else>
                      <tr
                        v-for="row in gruposMdfAtivoFiltrado"
                        :key="row.key"
                        class="border-b border-border-ui/70 last:border-b-0 hover:bg-blue-50/40 transition-colors"
                      >
                        <td class="px-3 py-2">
                          <input v-model="row.selected" type="checkbox" class="h-4 w-4 rounded border-border-ui" />
                        </td>
                        <td class="px-3 py-2 text-sm font-semibold text-text-main">{{ row.group }}</td>
                        <td class="px-3 py-2 text-sm text-text-main">{{ row.thickness }} mm</td>
                        <td class="px-3 py-2 text-sm text-text-main tabular-nums">{{ formatCurrency(precoReferenciaComMargem(row)) }}</td>
                        <td class="px-3 py-2">
                          <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black bg-emerald-100/70 text-emerald-700 tabular-nums">
                            {{ formatCurrency(custoBaseCalculadoM2(row)) }}/m2
                          </span>
                        </td>
                      </tr>
                      <tr v-if="!gruposMdfAtivoFiltrado.length">
                        <td colspan="5" class="px-3 py-8 text-center text-sm text-text-muted">
                          Nenhum material MDF encontrado para esta categoria.
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'insumos'" class="space-y-4">
            <div class="rounded-xl border border-border-ui overflow-hidden">
              <div class="px-3 py-2 bg-slate-50/70 border-b border-border-ui">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <div class="relative md:col-span-8">
                    <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                    <input
                      v-model.trim="insumoSearch"
                      type="text"
                      placeholder="Buscar insumo por nome"
                      class="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40"
                    />
                  </div>
                  <div class="md:col-span-4 flex items-center md:justify-end gap-3">
                    <label class="text-[10px] text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">Acréscimo %</label>
                    <input
                      v-model.number="acrescimoPct"
                      type="number"
                      min="0"
                      step="0.01"
                      class="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                    />
                    <span class="text-[11px] text-text-muted whitespace-nowrap">{{ kitItemsFiltrados.length }}/{{ kitItems.length }}</span>
                  </div>
                </div>
              </div>

              <div class="max-h-[280px] overflow-auto">
                <table class="w-full min-w-[620px]">
                  <thead>
                    <tr class="bg-white border-b border-border-ui text-left text-[11px] uppercase tracking-wider text-slate-500">
                      <th class="px-3 py-2">Selecionar</th>
                      <th class="px-3 py-2">Item</th>
                      <th class="px-3 py-2">Etiqueta</th>
                      <th class="px-3 py-2">Valor (R$ / m2)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in kitItemsFiltrados" :key="item.id" class="border-b border-border-ui/70 last:border-b-0 hover:bg-blue-50/40 transition-colors">
                      <td class="px-3 py-2">
                        <input v-model="item.selected" type="checkbox" class="h-4 w-4 rounded border-border-ui" />
                      </td>
                      <td class="px-3 py-2 text-sm text-text-main">{{ item.name }}</td>
                      <td class="px-3 py-2">
                        <span
                          class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide border"
                          :class="badgeCategoriaBaseClass(item.categoria_base)"
                        >
                          {{ categoriaBaseLabel(item.categoria_base) }}
                        </span>
                      </td>
                      <td class="px-3 py-2">
                        <input
                          v-model.number="item.value"
                          type="number"
                          min="0"
                          step="0.01"
                          class="w-32 rounded-lg border border-border-ui bg-bg-page px-2 py-1.5 text-sm"
                        />
                      </td>
                    </tr>
                    <tr v-if="loadingInsumos">
                      <td colspan="4" class="px-3 py-8 text-center text-sm text-text-muted">Carregando insumos...</td>
                    </tr>
                    <tr v-else-if="!kitItemsFiltrados.length">
                      <td colspan="4" class="px-3 py-8 text-center text-sm text-text-muted">Nenhum produto marcado como Insumo foi encontrado.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
              Total do Kit de Montagem: <strong>{{ formatCurrency(kitTotal) }}/m2</strong>
            </div>
          </div>

          <div v-else-if="activeTab === 'custos'" class="space-y-4">
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
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Mão de Obra (Hora-Homem) (R$ / m2)</label>
                <!-- Somente leitura: calculado pelo Motor RH | badge no header -->
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
                <div v-if="custosRHData" class="mt-2 space-y-0.5 border-t border-blue-200/70 pt-2">
                  <div class="flex justify-between text-[10px]">
                    <span class="text-blue-500">Fábrica (produção)</span>
                    <span class="font-bold text-blue-700 tabular-nums">{{ formatCurrency(custosRHData.totalFabrica) }}</span>
                  </div>
                  <div class="flex justify-between text-[10px]">
                    <span class="text-blue-500">Adm / Pro-labore</span>
                    <span class="font-bold text-blue-700 tabular-nums">{{ formatCurrency(custosRHData.totalAdministrativo) }}</span>
                  </div>
                  <div class="flex justify-between text-[10px] font-bold border-t border-blue-100 pt-1 mt-0.5">
                    <span class="text-blue-600">Folha total do mês</span>
                    <span class="text-blue-900 tabular-nums">{{ formatCurrency(custosRHData.totalFolhaMensal) }}</span>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-border-ui bg-bg-page p-3">
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Custo Fixo Fábrica (R$ / m²)</label>
                <!-- Somente leitura: calculado por Despesas Operacionais | badge no header -->
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
                    title="Recalcular a partir das despesas operacionais"
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
              <span class="text-[11px] text-slate-500">
                Base: despesas de {{ custosInternosCompetenciaLabel }}
              </span>
            </div>
            <div class="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-700">
              Custos internos por m2: <strong>{{ formatCurrency(custosInternosTotal) }}/m2</strong>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'cmv'" class="px-4 md:px-5 py-3 border-b border-border-ui/60 bg-slate-50/30">
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Categoria para simulação CMV:</span>
            <button
              v-for="cat in CATEGORIAS_ABA1"
              :key="`cmv-${cat.id}`"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all"
              :class="activeSubTab === cat.id ? 'bg-slate-900 text-white' : 'border border-border-ui bg-white text-slate-600 hover:border-slate-400/60'"
              @click="trocarSubTab(cat.id)"
            >
              {{ cat.label }}
            </button>
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            <div class="xl:col-span-8">
              <div class="rounded-xl border border-border-ui bg-white overflow-hidden">
                <div class="px-3 py-2 bg-slate-50 border-b border-border-ui text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  Tabela da Matriz Operacional
                </div>
                <div class="overflow-auto">
                  <table class="w-full min-w-[620px]">
                    <thead>
                      <tr class="border-b border-border-ui bg-white text-left text-[11px] uppercase tracking-wider text-slate-500">
                        <th class="px-4 py-3 font-black">Categoria</th>
                        <th class="px-4 py-3 font-black">Espessura</th>
                        <th class="px-4 py-3 font-black text-emerald-600">Custo Minimo / m2</th>
                        <th class="px-4 py-3 font-black text-amber-600">Custo Medio / m2</th>
                        <th class="px-4 py-3 font-black text-red-500">Custo Maximo / m2</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-if="loadingMatriz">
                        <tr v-for="n in 5" :key="n" class="border-b border-border-ui/70 animate-pulse">
                          <td v-for="c in 5" :key="c" class="px-4 py-3">
                            <div class="h-3.5 rounded bg-slate-100 w-3/4"></div>
                          </td>
                        </tr>
                      </template>
                      <template v-else>
                        <tr
                          v-for="row in matrizViewData"
                          :key="row.id"
                          class="border-b border-border-ui/70 last:border-b-0 hover:bg-slate-50/70 transition-colors"
                        >
                          <td class="px-4 py-3">
                            <span class="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wide">
                              {{ categoriaLabel(row.category) }}
                            </span>
                          </td>
                          <td class="px-4 py-3 text-[11px] text-text-muted font-semibold">{{ row.thickness_label || 'Consolidado' }}</td>
                          <td class="px-4 py-3">
                            <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black bg-emerald-50 text-emerald-700 tabular-nums">{{ formatCurrency(row.min_cost_base) }}</span>
                          </td>
                          <td class="px-4 py-3">
                            <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black bg-amber-50 text-amber-700 tabular-nums">{{ formatCurrency(row.avg_cost_base) }}</span>
                          </td>
                          <td class="px-4 py-3">
                            <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black bg-red-50 text-red-600 tabular-nums">{{ formatCurrency(row.max_cost_base) }}</span>
                          </td>
                        </tr>

                        <tr v-if="!matrizViewData.length">
                          <td colspan="5" class="px-4 py-12 text-center">
                            <div class="flex flex-col items-center gap-2 text-text-muted">
                              <i class="pi pi-table text-2xl opacity-40"></i>
                              <p class="text-sm">Nenhum dado na Matriz Operacional.</p>
                            </div>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside class="xl:col-span-4">
              <div class="space-y-3">
                <div class="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                  <p class="text-[11px] font-bold uppercase tracking-wider text-blue-700">Quanto vai custar cada opção</p>
                  <p class="mt-1 text-[11px] text-blue-600">Categoria atual: {{ categoriaAtivaResumoLabel }}</p>
                  <div class="mt-2 space-y-2">
                    <div class="rounded-lg bg-white/70 px-2.5 py-2 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-slate-600">Opção 1 (Base: custo mínimo)</span>
                        <span class="font-bold tabular-nums text-emerald-700">{{ formatCurrency(custosOpcoesCMV.base1) }}/m2</span>
                      </div>
                      <p class="mt-1 text-[11px] text-slate-500">
                        Total projetado: <span class="font-bold text-slate-700">{{ formatCurrency(custosOpcoesCMV.total1) }}/m2</span>
                      </p>
                    </div>
                    <div class="rounded-lg bg-white/70 px-2.5 py-2 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-slate-600">Opção 2 (Base: custo médio)</span>
                        <span class="font-bold tabular-nums text-amber-700">{{ formatCurrency(custosOpcoesCMV.base2) }}/m2</span>
                      </div>
                      <p class="mt-1 text-[11px] text-slate-500">
                        Total projetado: <span class="font-bold text-slate-700">{{ formatCurrency(custosOpcoesCMV.total2) }}/m2</span>
                      </p>
                    </div>
                    <div class="rounded-lg bg-white/70 px-2.5 py-2 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-slate-600">Opção 3 (Base: custo máximo)</span>
                        <span class="font-bold tabular-nums text-red-600">{{ formatCurrency(custosOpcoesCMV.base3) }}/m2</span>
                      </div>
                      <p class="mt-1 text-[11px] text-slate-500">
                        Total projetado: <span class="font-bold text-slate-700">{{ formatCurrency(custosOpcoesCMV.total3) }}/m2</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div class="rounded-xl border border-border-ui bg-white overflow-hidden">
                  <div class="px-3 py-2 bg-slate-50 border-b border-border-ui text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    CMV por categoria
                  </div>
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-border-ui text-[10px] uppercase tracking-wider text-slate-400">
                        <th class="px-3 py-1.5 text-left font-semibold">Categoria</th>
                        <th class="px-3 py-1.5 text-right font-semibold">Total/m2</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="cat in CATEGORIAS_ABA1" :key="cat.id" class="border-b border-border-ui/50 last:border-b-0">
                        <td class="px-3 py-2 text-xs font-semibold text-text-main">{{ cat.label }}</td>
                        <td class="px-3 py-2 text-xs text-right tabular-nums font-bold text-slate-900">
                          {{ formatCurrency((matrizPorCategoria[cat.id]?.avg_cost_base || 0) * (1 + acrescimoPct / 100) + kitTotal + custosInternosTotal) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="rounded-xl border border-border-ui bg-white p-3 space-y-1.5">
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Custos Consolidados</p>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-500">+ Insumos</span>
                    <span class="font-bold text-emerald-700">{{ formatCurrency(kitTotal) }}</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="flex items-center gap-1.5 text-slate-500">
                      + Custos internos
                      <span class="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 leading-none">
                        <i class="pi pi-sync text-[8px]"></i> RH
                      </span>
                    </span>
                    <span class="font-bold text-blue-700 tabular-nums">{{ formatCurrency(custosInternosTotal) }}</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-500">Acréscimo global</span>
                    <span class="font-bold text-slate-700">{{ Number(acrescimoPct || 0).toFixed(2) }}%</span>
                  </div>
                </div>

                <div
                  class="rounded-xl p-3 space-y-3 xl:sticky xl:top-5 transition-colors"
                  :class="decomposicaoCardToneClass"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-[0.8rem] font-bold uppercase tracking-wider text-slate-500">Decomposição de Preço</p>
                      <p class="text-[0.8rem] text-text-muted mt-0.5">
                        Leitura da categoria {{ categoriaAtivaResumoLabel }} antes de gerar o orçamento.
                      </p>
                    </div>
                    <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      Referência: {{ formatCurrency(precoClienteProjetado) }}/m2
                    </span>
                  </div>

                  <div class="rounded-lg border border-border-ui bg-slate-50/80 p-2.5 space-y-2">
                    <label class="block text-[0.8rem] font-bold uppercase tracking-wider text-slate-500">Valor de Venda Pretendido</label>
                    <input
                      v-model.number="valorVendaPretendido"
                      type="number"
                      min="0"
                      step="0.01"
                      class="w-full rounded-xl border border-border-ui bg-white px-3 py-2 text-sm font-semibold tabular-nums"
                      placeholder="Digite o valor de venda por m²"
                    />
                    <p class="text-[0.8rem] text-slate-500">
                      As barras abaixo representam a fatia consumida desse valor digitado.
                    </p>
                  </div>

                  <div class="space-y-6">
                    <div>
                      <div class="flex items-center justify-between text-[0.8rem] mb-1">
                        <span class="font-semibold text-emerald-700">Material</span>
                        <span class="font-bold text-emerald-700 tabular-nums">{{ formatCurrency(decomposicaoPreco.material) }}</span>
                      </div>
                      <div class="h-2.5 rounded-full bg-emerald-50 overflow-hidden">
                        <div
                          class="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          :style="{ width: `${decomposicaoPreco.materialPct}%` }"
                        ></div>
                      </div>
                      <p class="mt-1 text-[0.8rem] text-slate-500">{{ decomposicaoPreco.materialPctLabel }} do preço para MDF, ferragem e insumos.</p>
                    </div>

                    <div>
                      <div class="flex items-center justify-between text-[0.8rem] mb-1">
                        <span class="font-semibold text-blue-700">RH</span>
                        <span class="font-bold text-blue-700 tabular-nums">{{ formatCurrency(decomposicaoPreco.rh) }}</span>
                      </div>
                      <div class="h-2.5 rounded-full bg-blue-50 overflow-hidden">
                        <div
                          class="h-full rounded-full bg-blue-500 transition-all duration-300"
                          :style="{ width: `${decomposicaoPreco.rhPct}%` }"
                        ></div>
                      </div>
                      <p class="mt-1 text-[0.8rem] text-slate-500">{{ decomposicaoPreco.rhPctLabel }} do preço para absorver a mão de obra.</p>
                    </div>

                    <div>
                      <div class="flex items-center justify-between text-[0.8rem] mb-1">
                        <span class="font-semibold text-violet-700">Operacional</span>
                        <span class="font-bold text-violet-700 tabular-nums">{{ formatCurrency(decomposicaoPreco.operacional) }}</span>
                      </div>
                      <div class="h-2.5 rounded-full bg-violet-50 overflow-hidden">
                        <div
                          class="h-full rounded-full bg-violet-500 transition-all duration-300"
                          :style="{ width: `${decomposicaoPreco.operacionalPct}%` }"
                        ></div>
                      </div>
                      <p class="mt-1 text-[0.8rem] text-slate-500">{{ decomposicaoPreco.operacionalPctLabel }} do preço para aluguel, luz e estrutura.</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2 text-[0.8rem]">
                    <div class="rounded-lg bg-slate-50 px-2.5 py-2">
                      <p class="text-slate-500 text-[0.8rem]">Custo total (inclui CMV)</p>
                      <p class="font-bold text-slate-900 tabular-nums">{{ formatCurrency(decomposicaoPreco.custoTotal) }}</p>
                      <p class="mt-1 text-[11px] text-slate-500">
                        CMV considerado: <span class="font-bold text-slate-700">{{ formatCurrency(decomposicaoPreco.cmvConsiderado) }}</span>
                      </p>
                    </div>
                    <div class="rounded-lg bg-slate-50 px-2.5 py-2">
                      <div class="flex items-center justify-between gap-2">
                        <div>
                          <p class="text-slate-500 text-[0.8rem]">Lucro Real</p>
                          <p class="font-bold tabular-nums" :class="decomposicaoPreco.lucroReal < 0 ? 'text-red-600' : 'text-slate-900'">
                            {{ formatCurrency(decomposicaoPreco.lucroReal) }}
                          </p>
                        </div>
                        <span
                          class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black"
                          :class="decomposicaoPreco.lucroRealPct < 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'"
                        >
                          {{ decomposicaoPreco.lucroRealPctLabel }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="decomposicaoPreco.riscoStatus !== 'ok'"
                    class="rounded-lg border px-3 py-2 text-[0.8rem]"
                    :class="decomposicaoPreco.riscoStatus === 'alto' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'"
                  >
                    <p class="font-black uppercase tracking-wide">Margem de Risco</p>
                    <p class="mt-1 leading-relaxed">{{ decomposicaoPreco.riscoMensagem }}</p>
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  <button
                    type="button"
                    class="w-full inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="processando"
                    @click="processarMatriz"
                  >
                    <i :class="processando ? 'pi pi-spin pi-spinner' : 'pi pi-calculator'" class="text-sm"></i>
                    {{ processando ? 'Gerando Orçamento...' : 'GERAR ORÇAMENTO' }}
                  </button>
                  <button
                    type="button"
                    class="w-full inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-border-ui text-text-main hover:bg-slate-50 transition-all"
                    :disabled="loadingMatriz"
                    @click="loadMatriz"
                  >
                    <i :class="loadingMatriz ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" class="text-sm"></i>
                    Atualizar tabela
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { EstrategiaPrecosService } from '@/services/index'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'configuracoes.estrategia_precos.ver' } })

const strategies = [
  { value: 'MIN_PRICE', badge: 'OPCAO 01', title: 'Menor Preco', icon: 'pi pi-arrow-down', description: 'Prioriza o menor custo disponivel para o material filtrado.' },
  { value: 'AVG_PRICE', badge: 'OPCAO 02', title: 'Preco Medio', icon: 'pi pi-sliders-h', description: 'Usa a media de precos para reduzir extremos e manter equilibrio.' },
  { value: 'MAX_PRICE', badge: 'OPCAO 03', title: 'Maior Preco', icon: 'pi pi-arrow-up', description: 'Considera o maior custo encontrado dentro dos filtros aplicados.' },
]

const tabs = [
  { id: 'materiais', label: 'Aba 1 - MDF por Categoria' },
  { id: 'insumos', label: 'Aba 2 - Insumos de Produção' },
  { id: 'custos', label: 'Aba 3 - RH + Despesas Gerais' },
  { id: 'cmv', label: 'Aba 4 - Custo por Opção' },
]

const CATEGORIAS_ABA1 = [
  { id: 'essencial', label: 'Essencial', apiKey: 'PRIMARIA' },
  { id: 'design', label: 'Design', apiKey: 'SECUNDARIA' },
  { id: 'premium', label: 'Premium', apiKey: 'TERCIARIA' },
]

const activeStrategy = ref('AVG_PRICE')
const pendingStrategy = ref('')
const saving = ref(false)

const activeTab = ref('materiais')
const activeSubTab = ref('essencial')
const materialSearch = ref('')
const insumoSearch = ref('')
const areaPadraoM2 = ref(5.06)
const lossMarginPct = ref(20)
const acrescimoPct = ref(0)

const gruposMdfPorCategoria = ref({ essencial: [], design: [], premium: [] })
const buscandoCategorias = ref({ essencial: false, design: false, premium: false })
const categoriaCarregada = ref({ essencial: false, design: false, premium: false })

const kitItems = ref([])
const loadingInsumos = ref(false)

const horaHomemValue = ref(0)
const custoFixoFabricaValue = ref(0)
const capacidadeM2Mes = ref(220)
const valorVendaPretendido = ref(0)
const calculandoCustosInternos = ref(false)
const custosInternosMeta = ref({ mes: null, ano: null, mao_de_obra_total: 0, operacao_total: 0 })
const custosRHData = ref(null)

let recalculoCustosTimer = null

const processando = ref(false)
const loadingMatriz = ref(false)
const matrizData = ref([])
const matrizAtualizadoEm = ref(null)

const kitTotal = computed(() =>
  kitItems.value
    .filter((item) => item.selected)
    .reduce((acc, item) => acc + Number(item.value || 0), 0),
)

const custosInternosTotal = computed(
  () => Number(horaHomemValue.value || 0) + Number(custoFixoFabricaValue.value || 0),
)

const fluxoAbaDescricao = computed(() => {
  if (activeTab.value === 'materiais') {
    return 'Aba 1: pesquisa salva de MDF por categoria comercial (Essencial, Design e Premium).'
  }
  if (activeTab.value === 'insumos') {
    return 'Aba 2: pesquisa salva dos insumos de produção e seus valores por m².'
  }
  if (activeTab.value === 'custos') {
    return 'Aba 3: custo hora de funcionário (RH) + despesas gerais operacionais por m².'
  }
  return 'Aba 4: quanto vai custar cada opção (Opção 1, Opção 2 e Opção 3).'
})

const custosInternosCompetenciaLabel = computed(() => {
  const mes = Number(custosInternosMeta.value?.mes || 0)
  const ano = Number(custosInternosMeta.value?.ano || 0)
  if (!mes || !ano) return 'mês atual'
  return `${String(mes).padStart(2, '0')}/${ano}`
})

const gruposMdfAtivo = computed(() => gruposMdfPorCategoria.value[activeSubTab.value] || [])

const gruposMdfAtivoFiltrado = computed(() => {
  const term = normalizeSearch(materialSearch.value)
  if (!term) return gruposMdfAtivo.value
  return gruposMdfAtivo.value.filter((row) => {
    const alvo = normalizeSearch([row.group, row.category, row.color, row.thickness].filter(Boolean).join(' '))
    return alvo.includes(term)
  })
})

const kitItemsFiltrados = computed(() => {
  const term = normalizeSearch(insumoSearch.value)
  const base = (kitItems.value || []).filter((item) => String(item?.categoria_base || '').trim().toUpperCase() === 'INSUMO')
  if (!term) return base
  return base.filter((item) => normalizeSearch(item?.name).includes(term))
})

const materiaisSelecionados = computed(() =>
  CATEGORIAS_ABA1.flatMap((cat) => (gruposMdfPorCategoria.value[cat.id] || []).filter((item) => item.selected)),
)

const matrizPorCategoria = computed(() => {
  const result = {}
  for (const cat of CATEGORIAS_ABA1) {
    const items = (gruposMdfPorCategoria.value[cat.id] || []).filter((r) => r.selected)
    const values = items.map((r) => custoBaseCalculadoM2(r)).filter((v) => v > 0)
    const min = values.length ? Math.min(...values) : 0
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
    const max = values.length ? Math.max(...values) : 0
    result[cat.id] = {
      min_cost_base: min,
      avg_cost_base: avg,
      max_cost_base: max,
      count: items.length,
    }
  }
  return result
})

const categoriaAtivaResumo = computed(() => matrizPorCategoria.value[activeSubTab.value] || { avg_cost_base: 0 })

const categoriaAtivaResumoLabel = computed(() => {
  const cat = CATEGORIAS_ABA1.find((item) => item.id === activeSubTab.value)
  return cat?.label || 'Essencial'
})

const precoClienteProjetado = computed(() => {
  const materialMedio = Number(categoriaAtivaResumo.value?.avg_cost_base || 0)
  const markupPct = Number(acrescimoPct.value || 0)
  return materialMedio * (1 + markupPct / 100) + Number(kitTotal.value || 0) + Number(custosInternosTotal.value || 0)
})

const categoriaComercialAtiva = computed(() => {
  const cat = CATEGORIAS_ABA1.find((item) => item.id === activeSubTab.value)
  return String(cat?.apiKey || 'PRIMARIA')
})

const matrizCategoriaAtual = computed(() => {
  const row = (matrizData.value || []).find(
    (item) => normalizeCommercialCategory(item?.category) === normalizeCommercialCategory(categoriaComercialAtiva.value),
  )
  return row || null
})

const custosOpcoesCMV = computed(() => {
  const markupFactor = 1 + Number(acrescimoPct.value || 0) / 100
  const adicionais = Number(kitTotal.value || 0) + Number(custosInternosTotal.value || 0)
  const min = Number(matrizCategoriaAtual.value?.min_cost_base ?? categoriaAtivaResumo.value?.min_cost_base ?? 0)
  const avg = Number(matrizCategoriaAtual.value?.avg_cost_base ?? categoriaAtivaResumo.value?.avg_cost_base ?? 0)
  const max = Number(matrizCategoriaAtual.value?.max_cost_base ?? categoriaAtivaResumo.value?.max_cost_base ?? 0)

  return {
    base1: min,
    base2: avg,
    base3: max,
    total1: min * markupFactor + adicionais,
    total2: avg * markupFactor + adicionais,
    total3: max * markupFactor + adicionais,
  }
})

const cmvSelecionadoValor = computed(() => {
  if (activeStrategy.value === 'MIN_PRICE') return Number(custosOpcoesCMV.value.total1 || 0)
  if (activeStrategy.value === 'MAX_PRICE') return Number(custosOpcoesCMV.value.total3 || 0)
  return Number(custosOpcoesCMV.value.total2 || 0)
})

const decomposicaoPreco = computed(() => {
  const valorVendaBase = Number(valorVendaPretendido.value || 0)
  const material = Number(categoriaAtivaResumo.value?.avg_cost_base || 0) + Number(kitTotal.value || 0)
  const rh = Number(horaHomemValue.value || 0)
  const operacional = Number(custoFixoFabricaValue.value || 0)
  const custoPilares = material + rh + operacional
  const cmvConsiderado = Number(cmvSelecionadoValor.value || 0)
  const custoTotal = Math.max(custoPilares, cmvConsiderado)
  const lucroReal = valorVendaBase - custoTotal
  const comprometimento = valorVendaBase > 0 ? custoTotal / valorVendaBase : 0
  const lucroRealPct = valorVendaBase > 0 ? Math.max((lucroReal / valorVendaBase) * 100, 0) : 0

  let riscoStatus = 'ok'
  let riscoMensagem = ''

  if (valorVendaBase > 0 && comprometimento > 0.85) {
    riscoStatus = 'alto'
    riscoMensagem = 'CUIDADO: Você está pagando para trabalhar!'
  } else if (valorVendaBase > 0 && comprometimento >= 0.75) {
    riscoStatus = 'atencao'
    riscoMensagem = 'Os 3 pilares já estão consumindo grande parte do valor de venda pretendido.'
  }

  const toPct = (value) => (valorVendaBase > 0 ? Math.min((value / valorVendaBase) * 100, 100) : 0)
  const formatPct = (value) => `${toPct(value).toFixed(1)}%`

  return {
    material,
    rh,
    operacional,
    custoPilares,
    cmvConsiderado,
    custoTotal,
    lucroReal,
    lucroRealPct,
    lucroRealPctLabel: `${lucroRealPct.toFixed(1)}% lucro`,
    materialPct: toPct(material),
    rhPct: toPct(rh),
    operacionalPct: toPct(operacional),
    materialPctLabel: formatPct(material),
    rhPctLabel: formatPct(rh),
    operacionalPctLabel: formatPct(operacional),
    riscoStatus,
    riscoMensagem,
  }
})

const decomposicaoCardToneClass = computed(() => {
  const folgaPct = Number(decomposicaoPreco.value?.lucroRealPct || 0)
  if (folgaPct > 25) return 'border-emerald-200 bg-emerald-50/50'
  if (folgaPct < 15) return 'border-red-200 bg-red-50/50'
  return 'border-border-ui bg-white'
})

const matrizViewData = computed(() =>
  (matrizData.value || []).map((row) => ({
    ...row,
    thickness_label: row?.thickness > 0 ? `${row.thickness} mm` : 'Consolidado',
  })),
)

function strategyLabel(value) {
  if (value === 'MIN_PRICE') return 'Menor Preco'
  if (value === 'MAX_PRICE') return 'Maior Preco'
  return 'Preco Medio'
}

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

function normalizeCommercialCategory(value) {
  const text = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
  if (text.includes('SECUND')) return 'SECUNDARIA'
  if (text.includes('TERCI')) return 'TERCIARIA'
  return 'PRIMARIA'
}

function categoriaLabel(value) {
  const key = normalizeCommercialCategory(value)
  if (key === 'SECUNDARIA') return 'Design'
  if (key === 'TERCIARIA') return 'Premium'
  return 'Essencial'
}

function categoriaBaseLabel(value) {
  const categoria = String(value || '').trim().toUpperCase()
  if (categoria === 'SECUNDARIA') return 'Design'
  if (categoria === 'TERCIARIA') return 'Premium'
  if (categoria === 'INSUMO') return 'Insumos'
  return 'Essencial'
}

function badgeCategoriaBaseClass(value) {
  const categoria = String(value || '').trim().toUpperCase()
  if (categoria === 'SECUNDARIA') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (categoria === 'TERCIARIA') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (categoria === 'INSUMO') return 'bg-blue-50 text-blue-700 border-blue-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

function custoBaseCalculadoM2(row) {
  const precoCompra = Number(precoReferenciaByStrategy(row) || 0)
  const areaVinculada = Number(row?.area_m2 || areaPadraoM2.value || 5.06)
  const margemPerda = Number(lossMarginPct.value || 0)
  if (!precoCompra || !areaVinculada) return 0
  return ((precoCompra * 2) / areaVinculada) * (1 + margemPerda / 100)
}

function precoReferenciaByStrategy(row) {
  if (activeStrategy.value === 'MIN_PRICE') {
    return Number(row?.min_purchase_price ?? row?.reference_purchase_price ?? row?.avg_purchase_price ?? 0)
  }
  if (activeStrategy.value === 'MAX_PRICE') {
    return Number(row?.max_purchase_price ?? row?.reference_purchase_price ?? row?.avg_purchase_price ?? 0)
  }
  return Number(row?.avg_purchase_price ?? row?.reference_purchase_price ?? 0)
}

function precoReferenciaComMargem(row) {
  return Number(precoReferenciaByStrategy(row) || 0) * 2
}

function keyMaterial(row) {
  return `${row.category}__${row.thickness}__${row.group}`
}

function trocarSubTab(catId) {
  activeSubTab.value = catId
  carregarCategoria(catId)
}

async function carregarCategoria(catId) {
  if (categoriaCarregada.value[catId] || buscandoCategorias.value[catId]) return
  const cat = CATEGORIAS_ABA1.find((c) => c.id === catId)
  if (!cat) return
  buscandoCategorias.value[catId] = true
  try {
    const { data } = await EstrategiaPrecosService.buscarMdfPorCategoria(cat.apiKey, activeStrategy.value)
    const rows = Array.isArray(data) ? data : []
    gruposMdfPorCategoria.value[catId] = rows.map((row) => ({
      ...row,
      key: keyMaterial(row),
      selected: true,
      area_m2: Number(areaPadraoM2.value || 5.06),
    }))
    categoriaCarregada.value[catId] = true
  } catch (err) {
    console.error(err)
    notify.error('Nao foi possivel carregar materiais da categoria.')
  } finally {
    buscandoCategorias.value[catId] = false
  }
}

async function carregarInsumosFixos() {
  loadingInsumos.value = true
  try {
    const { data } = await EstrategiaPrecosService.listarInsumosFixos()
    const rows = Array.isArray(data) ? data : []
    kitItems.value = rows.map((item) => ({
      id: item.id,
      name: item.name,
      value: Number(item.value || 0),
      categoria_base: item.categoria_base || 'INSUMO',
      selected: item.selected !== false,
    }))
  } catch (err) {
    console.error(err)
    notify.error('Nao foi possivel carregar os insumos fixos da Aba 2.')
  } finally {
    loadingInsumos.value = false
  }
}

async function loadConfig() {
  try {
    const { data } = await EstrategiaPrecosService.buscarConfig()
    if (data?.search_strategy) activeStrategy.value = data.search_strategy
  } catch (err) {
    console.error(err)
  }
}

async function selectStrategy(strategy) {
  if (!strategy || strategy === activeStrategy.value) return
  pendingStrategy.value = strategy
  saving.value = true
  try {
    await EstrategiaPrecosService.atualizarConfig(strategy)
    activeStrategy.value = strategy
    categoriaCarregada.value = { essencial: false, design: false, premium: false }
    gruposMdfPorCategoria.value = { essencial: [], design: [], premium: [] }
    await carregarCategoria(activeSubTab.value)
    notify.success(`Estrategia ${strategyLabel(strategy)} ativada.`)
  } catch (err) {
    console.error(err)
    notify.error('Falha ao atualizar a estrategia de precos.')
  } finally {
    saving.value = false
    pendingStrategy.value = ''
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

async function processarMatriz() {
  processando.value = true
  try {
    const payload = {
      area_chapa_m2: Number(areaPadraoM2.value || 5.06),
      markup_base_pct: 100,
      loss_margin_pct: Number(lossMarginPct.value || 20),
      material_links: materiaisSelecionados.value.map((m) => ({
        category: m.category,
        commercial_category: m.commercial_category,
        thickness: Number(m.thickness),
        group: m.group,
        min_purchase_price: Number(m.min_purchase_price || 0),
        avg_purchase_price: Number(m.avg_purchase_price || 0),
        max_purchase_price: Number(m.max_purchase_price || 0),
        reference_purchase_price: Number(precoReferenciaByStrategy(m) || 0),
        area_m2: Number(m.area_m2 || areaPadraoM2.value || 5.06),
        selected: !!m.selected,
      })),
      kit_items: kitItems.value.map((item) => ({
        id: item.id,
        name: item.name,
        categoria_base: item.categoria_base,
        value: Number(item.value || 0),
        selected: !!item.selected,
      })),
      hora_homem_value: Number(horaHomemValue.value || 0),
      custo_fixo_fabrica_value: Number(custoFixoFabricaValue.value || 0),
      capacidade_m2_mes: Number(capacidadeM2Mes.value || 0),
    }

    const { data } = await EstrategiaPrecosService.processarMatriz(payload)
    notify.success(`Matriz processada com sucesso! ${data?.processed ?? 0} grupos atualizados.`)
    await loadMatriz()
  } catch (err) {
    console.error(err)
    notify.error('Falha ao processar a Matriz Operacional.')
  } finally {
    processando.value = false
  }
}

async function calcularCustosInternosAutomatico() {
  return sincronizarRH()
}

async function sincronizarRH() {
  const capacidade = Number(capacidadeM2Mes.value || 0)
  if (!capacidade || capacidade <= 0) {
    horaHomemValue.value = 0
    custoFixoFabricaValue.value = 0
    custosRHData.value = null
    return
  }

  calculandoCustosInternos.value = true
  try {
    const [rhRes, internosRes] = await Promise.all([
      EstrategiaPrecosService.calcularCustosRH({ capacidade_m2_mes: capacidade }),
      EstrategiaPrecosService.calcularCustosInternos({ capacidade_m2_mes: capacidade }),
    ])
    const rh = rhRes.data
    const internos = internosRes.data

    custosRHData.value = rh ?? null
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
    notify.error('Nao foi possivel sincronizar com o Sistema RH.')
  } finally {
    calculandoCustosInternos.value = false
  }
}

function agendarRecalculoCustosInternos() {
  if (recalculoCustosTimer) clearTimeout(recalculoCustosTimer)
  recalculoCustosTimer = setTimeout(() => {
    calcularCustosInternosAutomatico()
  }, 250)
}

watch(precoClienteProjetado, (value) => {
  const current = Number(valorVendaPretendido.value || 0)
  const next = Number(value || 0)
  if (current <= 0 && next > 0) {
    valorVendaPretendido.value = Number(next.toFixed(2))
  }
})

watch(capacidadeM2Mes, () => {
  try {
    localStorage.setItem('estrategia_precos.capacidade_m2_mes', String(Number(capacidadeM2Mes.value || 0)))
  } catch (_) {
    // ignore localStorage errors
  }
  agendarRecalculoCustosInternos()
})

onMounted(async () => {
  try {
    const capacidadeSalva = Number(localStorage.getItem('estrategia_precos.capacidade_m2_mes') || 0)
    if (Number.isFinite(capacidadeSalva) && capacidadeSalva > 0) {
      capacidadeM2Mes.value = capacidadeSalva
    }
  } catch (_) {
    // ignore localStorage errors
  }

  await loadConfig()
  await carregarInsumosFixos()
  await loadMatriz()
  await carregarCategoria('essencial')
  await calcularCustosInternosAutomatico()
})
</script>
