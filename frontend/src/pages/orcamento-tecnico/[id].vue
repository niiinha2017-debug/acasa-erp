<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />
      <PageHeader
        :title="`Orçamento Técnico #${id}`"
        subtitle="Etapa final antes da produção"
        icon="pi pi-check-square"
        class="border-b border-border-ui"
      >
        <template #actions>
          <Button variant="ghost" size="sm" class="!rounded-xl" @click="router.push('/orcamento-tecnico')">
            <i class="pi pi-arrow-left mr-2" />
            Voltar
          </Button>
        </template>
      </PageHeader>

      <div class="p-4 md:p-6 border-t border-border-ui bg-bg-page space-y-6">
        <Loading v-if="loading" />

        <template v-else-if="erro">
          <p class="text-rose-500">{{ erro }}</p>
          <Button variant="ghost" size="sm" class="mt-2" @click="router.push('/orcamento-tecnico')">Voltar à lista</Button>
        </template>

        <template v-else-if="orcamento">

          <!-- ═══════════════════════════════════════
               INFO DO PROJETO
          ═══════════════════════════════════════ -->
          <section class="rounded-xl border border-border-ui bg-bg-card p-4">
            <div class="grid gap-3 md:grid-cols-4 text-sm">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-text-soft mb-0.5">Cliente</p>
                <p class="font-semibold text-text-main">{{ orcamento.agenda_loja?.cliente?.nome_completo || '—' }}</p>
              </div>
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-text-soft mb-0.5">Contato</p>
                <p class="font-semibold text-text-main">{{ contatoCliente }}</p>
              </div>
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-text-soft mb-0.5">Número do orçamento</p>
                <p class="font-semibold text-text-main">#{{ orcamento.id || id }}</p>
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-text-soft mb-0.5">Perda técnica (%)</label>
                <input
                  v-model.number="perdaTecnicaPct"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-lg border border-border-ui bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  @change="persistirPerdaTecnica"
                />
              </div>
            </div>
          </section>

          <!-- ═══════════════════════════════════════
               SELETOR DE ORIGEM
          ═══════════════════════════════════════ -->
          <section class="rounded-xl border border-border-ui bg-bg-card p-4 space-y-3">
            <p class="text-[11px] font-bold uppercase tracking-wider text-text-soft">Origem das medidas</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                role="button"
                tabindex="0"
                class="relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all cursor-pointer"
                :class="origemMedida === ORIGEM_MEDIDA.TECNICO ? 'border-brand-primary bg-brand-primary/5' : 'border-border-ui bg-bg-page hover:border-brand-primary/40'"
                @click="selecionarOrigemMedida(ORIGEM_MEDIDA.TECNICO)"
              >
                <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                  :class="origemMedida === ORIGEM_MEDIDA.TECNICO ? 'border-brand-primary bg-brand-primary' : 'border-border-ui'">
                  <div v-if="origemMedida === ORIGEM_MEDIDA.TECNICO" class="h-2 w-2 rounded-full bg-white" />
                </div>
                <i class="pi pi-wrench text-brand-primary mt-0.5 text-base" />
                <div>
                  <p class="font-bold text-sm text-text-main">Técnico</p>
                  <p class="text-xs text-text-soft mt-0.5">Medidas do Totem (read-only)</p>
                  <p v-if="temMedicaoTecnico" class="text-xs text-brand-primary font-semibold mt-1">
                    <i class="pi pi-check-circle mr-1" />{{ ambientesTecnico.length }} ambiente(s)
                  </p>
                  <p v-else class="text-xs text-rose-500 font-semibold mt-1">
                    <i class="pi pi-exclamation-circle mr-1" />Sem medição
                  </p>
                </div>
              </div>

              <div
                role="button"
                tabindex="0"
                class="relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all cursor-pointer"
                :class="origemMedida === ORIGEM_MEDIDA.VENDEDOR ? 'border-amber-500 bg-amber-50' : 'border-border-ui bg-bg-page hover:border-amber-400/40'"
                @click="selecionarOrigemMedida(ORIGEM_MEDIDA.VENDEDOR)"
              >
                <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                  :class="origemMedida === ORIGEM_MEDIDA.VENDEDOR ? 'border-amber-500 bg-amber-500' : 'border-border-ui'">
                  <div v-if="origemMedida === ORIGEM_MEDIDA.VENDEDOR" class="h-2 w-2 rounded-full bg-white" />
                </div>
                <i class="pi pi-pencil text-amber-500 mt-0.5 text-base" />
                <div>
                  <p class="font-bold text-sm text-text-main">Vendedor</p>
                  <p class="text-xs text-text-soft mt-0.5">Inserido manualmente na loja</p>
                  <p class="text-xs text-amber-600 font-semibold mt-1">
                    <i class="pi pi-pencil mr-1" />{{ ambientesVendedor.length }} ambiente(s)
                  </p>
                </div>
              </div>

              <div
                role="button"
                tabindex="0"
                class="relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all cursor-pointer"
                :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'border-sky-500 bg-sky-50' : 'border-border-ui bg-bg-page hover:border-sky-400/40'"
                @click="selecionarOrigemMedida(ORIGEM_MEDIDA.PROMOB)"
              >
                <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                  :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'border-sky-500 bg-sky-500' : 'border-border-ui'">
                  <div v-if="origemMedida === ORIGEM_MEDIDA.PROMOB" class="h-2 w-2 rounded-full bg-white" />
                </div>
                <i class="pi pi-file-import text-sky-500 mt-0.5 text-base" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="font-bold text-sm text-text-main">Importar Promob</p>
                      <p class="text-xs text-text-soft mt-0.5">XML, JSON ou CSV com mapeamento inicial automático</p>
                    </div>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-white px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-50"
                      @click.stop="abrirUploadPromob"
                    >
                      <i class="pi pi-paperclip text-[10px]" />
                      Upload XML/JSON/CSV
                    </button>
                  </div>
                  <p v-if="promobArquivoNome" class="truncate text-xs text-sky-700 font-semibold mt-1">
                    <i class="pi pi-check-circle mr-1" />{{ promobArquivoNome }}
                  </p>
                  <p v-else class="text-xs text-sky-600 font-semibold mt-1">
                    <i class="pi pi-upload mr-1" />Aguardando arquivo
                  </p>
                  <p class="text-[11px] text-text-soft mt-1">{{ ambientesPromob.length }} ambiente(s) importado(s)</p>
                </div>
              </div>
            </div>
            <input
              ref="promobFileInput"
              type="file"
              accept=".xml,.json,.csv,text/csv,application/xml,application/json,text/xml,application/octet-stream"
              class="hidden"
              @change="handlePromobUpload"
            />
            <p v-if="promobMensagem" class="text-xs" :class="promobMensagemErro ? 'text-rose-500' : 'text-sky-700'">
              {{ promobMensagem }}
            </p>
          </section>

          <!-- ═══════════════════════════════════════
               MODO TÉCNICO
               Hierarquia: Ambiente > Parede > Módulos
          ═══════════════════════════════════════ -->
          <template v-if="origemMedida === ORIGEM_MEDIDA.TECNICO">
            <div v-if="!temMedicaoTecnico" class="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
              <i class="pi pi-exclamation-triangle text-2xl mb-2 block" />
              Nenhuma medição do técnico encontrada.<br>
              Use o modo <strong>Vendedor</strong> para inserir manualmente.
            </div>

            <!-- AMBIENTE -->
            <section
              v-for="amb in ambientesTecnico"
              :key="amb.id"
              class="rounded-xl border border-border-ui bg-bg-card overflow-hidden"
            >
              <div class="flex items-center justify-between px-4 py-3 border-b border-border-ui bg-slate-50">
                <p class="font-bold text-sm text-text-main">
                  <i class="pi pi-home text-brand-primary mr-2" />{{ amb.nome_ambiente }}
                </p>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-colors"
                    :class="ambienteOcultoTecnico(amb.id)
                      ? 'border-border-ui bg-bg-page text-text-soft hover:border-brand-primary/40 hover:text-brand-primary'
                      : 'border-brand-primary/30 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15'"
                    @click="toggleAmbienteTecnico(amb.id)"
                  >
                    <i class="pi pi-home text-[11px]" />
                  </button>
                  <div class="flex gap-3 text-xs font-semibold tabular-nums">
                    <span class="text-text-soft">{{ areaTecnicoAmbiente(amb).toFixed(3) }} m²</span>
                    <span class="text-brand-primary">{{ formatCurrency(custoTecnicoAmbiente(amb)) }}</span>
                  </div>
                </div>
              </div>

              <!-- PAREDES do ambiente técnico -->
              <div v-show="!ambienteOcultoTecnico(amb.id)" class="divide-y divide-border-ui/60">
                <template v-if="amb.paredes && amb.paredes.length">
                  <div v-for="parede in amb.paredes" :key="parede.id" class="p-4 space-y-3">

                    <!-- Cabeçalho da parede -->
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <i class="pi pi-minus text-text-soft text-xs" />
                        <span class="font-semibold text-sm text-text-main">{{ parede.nome }}</span>
                        <span class="text-xs text-text-soft tabular-nums">
                          {{ Number(parede.largura_m || 0).toFixed(2) }}m × {{ Number(parede.pe_direito_m || 0).toFixed(2) }}m
                        </span>
                      </div>
                      <div class="flex items-center gap-3 text-xs tabular-nums">
                        <!-- Ocupação dos módulos -->
                        <span
                          class="rounded-full px-2 py-0.5 font-bold"
                          :class="ocupacaoTecnico(amb.id, parede.id, Number(parede.largura_m || 0) * 1000).excede
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'"
                        >
                          {{ ocupacaoTecnico(amb.id, parede.id, Number(parede.largura_m || 0) * 1000).soma }}mm / {{ Math.round(Number(parede.largura_m || 0) * 1000) }}mm
                        </span>
                        <span class="font-semibold text-brand-primary">
                          {{ formatCurrency(custoModulosTecnicoParede(amb.id, parede.id)) }}
                        </span>
                      </div>
                    </div>

                    <!-- MÓDULOS da parede (técnico) -->
                    <div class="ml-4 space-y-2">
                      <div
                        v-for="(mod, mIdx) in modulosTecnico[`${amb.id}_${parede.id}`] || []"
                        :key="mod._id"
                        class="rounded-lg border border-border-ui bg-bg-page overflow-hidden"
                      >
                        <!-- Linha principal do módulo -->
                        <div class="grid grid-cols-[1fr_90px_90px_170px_88px_auto_28px] gap-2 items-center px-3 py-2">
                          <input
                            v-model="mod.nome"
                            type="text"
                            placeholder="Nome do módulo"
                            class="rounded border border-border-ui bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/40"
                          />
                          <div class="relative">
                            <input v-model.number="mod.largura_mm" type="number" min="0" step="1" placeholder="Larg."
                              class="w-full rounded border border-border-ui bg-white px-2 py-1 pr-6 text-xs tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-brand-primary/40" />
                            <span class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-text-soft">mm</span>
                          </div>
                          <div class="relative">
                            <input v-model.number="mod.altura_mm" type="number" min="0" step="1" placeholder="Alt."
                              class="w-full rounded border border-border-ui bg-white px-2 py-1 pr-6 text-xs tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-brand-primary/40" />
                            <span class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-text-soft">mm</span>
                          </div>
                          <SearchInput
                            v-model="mod.material_id"
                            mode="select"
                            :options="materialOptions"
                            placeholder="Buscar MDF por nome/cor"
                            class="[&_.search-container]:!gap-0 [&_input]:!h-8 [&_input]:!rounded [&_input]:!text-xs"
                          />
                          <span class="text-right text-xs font-semibold tabular-nums text-brand-primary">
                            {{ formatCurrency(custoModulo(mod)) }}
                          </span>
                          <button type="button"
                            class="rounded px-2 py-1 text-[10px] font-semibold transition-colors"
                            :class="ferragensAbertas(mod) ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-text-soft hover:bg-amber-50 hover:text-amber-600'"
                            @click="toggleFerragens(mod)">
                            Ferragens
                          </button>
                          <button type="button"
                            class="flex h-7 w-7 items-center justify-center rounded text-rose-400 hover:bg-rose-50"
                            @click="removerModuloTecnico(amb.id, parede.id, mIdx)">
                            <i class="pi pi-minus text-[10px]" />
                          </button>
                        </div>
                        <!-- Ferragens do módulo -->
                        <div v-show="ferragensAbertas(mod)" class="border-t border-amber-200/60 bg-amber-50/40 px-2 py-1.5 space-y-1">
                          <p class="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1 flex items-center gap-2">
                            <span><i class="pi pi-wrench mr-1" />Ferragens</span>
                            <span
                              v-if="qtdFerragensPendentes(mod) > 0"
                              class="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700"
                            >
                              {{ qtdFerragensPendentes(mod) }} pendente(s)
                            </span>
                          </p>
                          <SearchInput
                            v-model="mod._ferragemBuscaId"
                            mode="select"
                            :options="ferragemOptions"
                            placeholder="Buscar ferragem"
                            class="[&_.search-container]:!gap-0 [&_.search-container]:!h-8 [&_.search-container]:!items-center [&_input]:!h-8 [&_input]:!rounded-md [&_input]:!py-0 [&_input]:!text-[10px]"
                            @update:modelValue="onSelecionarFerragemNoModulo(mod, $event)"
                          />
                          <div class="grid grid-cols-[minmax(0,1fr)_80px_120px_120px] gap-2 px-0.5 text-[9px] font-bold uppercase tracking-wider text-text-soft items-center">
                            <span>Nome da ferragem</span>
                            <span class="text-right">Qtd</span>
                            <span class="text-right">Venda un</span>
                            <span class="text-right">Total</span>
                          </div>
                          <div
                            v-for="(fer, fIdx) in mod.ferragens"
                            :key="fer._id"
                            class="grid grid-cols-[minmax(0,1fr)_80px_120px_120px] gap-2 items-center border-b border-amber-200/70 pb-1 last:border-b-0"
                          >
                            <div class="min-w-0">
                              <p class="truncate text-[11px]" :class="fer.nao_encontrada ? 'text-rose-600 font-semibold' : 'text-text-main'" :title="nomeFerragemExibicao(fer)">
                                {{ nomeFerragemExibicao(fer) }}
                              </p>
                              <p v-if="fer.nao_encontrada" class="text-[10px] text-rose-600">⚠️ Ferragem não encontrada no cadastro</p>
                              <SearchInput
                                v-if="fer.nao_encontrada"
                                v-model="fer._resolver_produto_id"
                                mode="select"
                                :options="ferragemOptions"
                                placeholder="Selecionar ferragem válida"
                                class="mt-1 [&_.search-container]:!gap-0 [&_.search-container]:!h-7 [&_.search-container]:!items-center [&_input]:!h-7 [&_input]:!rounded-md [&_input]:!py-0 [&_input]:!text-[10px]"
                                @update:modelValue="resolverFerragemPendente(mod, fer, $event)"
                              />
                            </div>
                            <div class="text-right">
                              <input v-model.number="fer.quantidade" type="number" min="1" step="1"
                                class="w-full bg-transparent px-0 py-0 text-[10px] tabular-nums text-right focus:outline-none" />
                            </div>
                            <div class="text-[10px] tabular-nums text-right text-text-soft">
                              {{ formatCurrency(getPrecoVendaFerragemUnitario(fer)) }}
                            </div>
                            <div class="flex items-center justify-end gap-1.5">
                              <span class="text-right text-[10px] font-semibold tabular-nums text-amber-700">
                                {{ formatCurrency(custoFerragemItem(fer)) }}
                              </span>
                              <button type="button"
                                class="flex h-5 w-5 items-center justify-center rounded text-rose-400 hover:bg-rose-50"
                                @click="removerFerragem(mod, fIdx)">
                                <i class="pi pi-times text-[9px]" />
                              </button>
                            </div>
                          </div>
                          <p v-if="!mod.ferragens.length" class="text-[10px] text-text-soft italic px-0.5 py-0.5">
                            Nenhuma ferragem adicionada.
                          </p>
                        </div>
                      </div>

                      <p v-if="!(modulosTecnico[`${amb.id}_${parede.id}`] || []).length"
                        class="text-xs text-text-soft italic py-1">
                        Nenhum módulo adicionado.
                      </p>

                      <button type="button"
                        class="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:opacity-70 transition-opacity"
                        @click="addModuloTecnico(amb.id, parede.id)">
                        <i class="pi pi-plus text-[10px]" />Adicionar módulo
                      </button>
                    </div>
                  </div>
                </template>

                <!-- Ambiente sem paredes detalhadas -->
                <div v-else class="p-4 text-xs text-text-soft italic">
                  Sem paredes detalhadas — {{ Number(amb.largura_m || 0).toFixed(2) }}m × {{ Number(amb.pe_direito_m || 0).toFixed(2) }}m
                </div>
              </div>
            </section>
          </template>

          <!-- ═══════════════════════════════════════
               MODO VENDEDOR
               Hierarquia: Ambiente > Parede > Módulos
          ═══════════════════════════════════════ -->
          <template v-else>
            <div
              v-if="origemMedida === ORIGEM_MEDIDA.PROMOB"
              class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="font-semibold">Importação Promob ativa</p>
                  <p class="text-xs text-sky-700 mt-0.5">
                    Ambientes, paredes e módulos vieram do arquivo e continuam editáveis para ajuste fino de medidas e MDF.
                  </p>
                </div>
                <Button variant="ghost" size="sm" class="!rounded-xl" @click="abrirUploadPromob">
                  <i class="pi pi-upload mr-2" />Trocar arquivo
                </Button>
              </div>
            </div>

            <div
              v-if="origemMedida === ORIGEM_MEDIDA.PROMOB && !ambientesEditaveis.length"
              class="rounded-xl border border-dashed border-sky-300 bg-sky-50/70 p-6 text-center text-sm text-sky-800"
            >
              <i class="pi pi-file-import text-2xl mb-2 block" />
              Selecione um arquivo XML, JSON ou CSV do Promob para montar a estrutura automaticamente.
            </div>

            <!-- AMBIENTE -->
            <section
              v-for="(amb, ambIdx) in ambientesEditaveis"
              :key="amb._id"
              class="rounded-xl border border-border-ui bg-bg-card overflow-hidden"
            >
              <!-- Cabeçalho do ambiente -->
              <div class="flex items-center gap-2 px-4 py-3 border-b border-border-ui bg-slate-50">
                <button
                  type="button"
                  class="inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-colors"
                  :class="ambienteOcultoEditavel(amb, ambIdx)
                    ? 'border-border-ui bg-bg-page text-text-soft hover:border-brand-primary/40 hover:text-brand-primary'
                    : (origemMedida === ORIGEM_MEDIDA.PROMOB
                      ? 'border-sky-300 bg-sky-100 text-sky-700 hover:bg-sky-200/70'
                      : 'border-amber-300 bg-amber-100 text-amber-700 hover:bg-amber-200/70')"
                  @click="toggleAmbienteEditavel(amb, ambIdx)"
                >
                  <i class="pi pi-home text-[11px]" />
                </button>
                <input
                  v-model="amb.nome"
                  type="text"
                  placeholder="Nome do ambiente (ex: Cozinha)"
                  class="flex-1 rounded-lg border border-border-ui bg-white px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
                <div class="flex items-center gap-2 text-xs tabular-nums font-semibold shrink-0">
                  <span class="text-text-soft">{{ areaVendedorAmbiente(amb).toFixed(3) }} m²</span>
                  <span class="text-amber-600">{{ formatCurrency(custoVendedorAmbiente(amb)) }}</span>
                </div>
                <button type="button" class="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50"
                  @click="removerAmbiente(ambIdx)">
                  <i class="pi pi-trash text-xs" />
                </button>
              </div>

              <!-- PAREDES do ambiente -->
              <div v-show="!ambienteOcultoEditavel(amb, ambIdx)" class="divide-y divide-border-ui/60">
                <div
                  v-for="(parede, pIdx) in amb.paredes"
                  :key="parede._id"
                  class="p-4 space-y-3"
                >
                  <!-- Cabeçalho da parede (editável) -->
                  <div class="flex flex-wrap items-center gap-2">
                    <i class="pi pi-minus text-text-soft text-xs" />
                    <input
                      v-model="parede.nome"
                      type="text"
                      :placeholder="`Parede ${pIdx + 1}`"
                      class="w-40 rounded-lg border border-border-ui bg-bg-page px-2.5 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    />
                    <div class="relative">
                      <input v-model.number="parede.largura_mm" type="number" min="0" step="1" placeholder="Largura"
                        class="w-28 rounded-lg border border-border-ui bg-bg-page px-2.5 py-1.5 pr-8 text-sm tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-soft">mm L</span>
                    </div>
                    <div class="relative">
                      <input v-model.number="parede.altura_mm" type="number" min="0" step="1" placeholder="Altura"
                        class="w-28 rounded-lg border border-border-ui bg-bg-page px-2.5 py-1.5 pr-8 text-sm tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-soft">mm H</span>
                    </div>

                    <!-- Badge de ocupação -->
                    <span
                      class="ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
                      :class="ocupacaoVendedor(parede).excede ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'"
                    >
                      {{ ocupacaoVendedor(parede).soma }}mm / {{ parede.largura_mm || 0 }}mm
                    </span>
                    <span class="text-xs font-semibold tabular-nums"
                      :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'text-sky-600' : 'text-amber-600'">
                      {{ formatCurrency(custoParede(parede)) }}
                    </span>
                    <button type="button" class="rounded-lg p-1 text-rose-400 hover:bg-rose-50"
                      @click="removerParede(ambIdx, pIdx)">
                      <i class="pi pi-minus text-xs" />
                    </button>
                  </div>

                  <!-- MÓDULOS da parede (vendedor) -->
                  <div class="ml-6 space-y-2">
                    <div
                      v-for="(mod, mIdx) in parede.modulos"
                      :key="mod._id"
                      class="rounded-lg border border-border-ui bg-bg-page overflow-hidden"
                    >
                      <!-- Linha principal do módulo -->
                      <div class="grid grid-cols-[1fr_90px_90px_170px_88px_auto_28px] gap-2 items-center px-3 py-2">
                        <input
                          v-model="mod.nome"
                          type="text"
                          placeholder="Nome do módulo"
                          class="rounded border border-border-ui bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/40"
                        />
                        <div class="relative">
                          <input v-model.number="mod.largura_mm" type="number" min="0" step="1"
                            class="w-full rounded border border-border-ui bg-white px-2 py-1 pr-6 text-xs tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-brand-primary/40" />
                          <span class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-text-soft">mm</span>
                        </div>
                        <div class="relative">
                          <input v-model.number="mod.altura_mm" type="number" min="0" step="1"
                            class="w-full rounded border border-border-ui bg-white px-2 py-1 pr-6 text-xs tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-brand-primary/40" />
                          <span class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-text-soft">mm</span>
                        </div>
                        <div class="flex items-center gap-1">
                          <div
                            class="flex-1 rounded"
                            :class="origemMedida === ORIGEM_MEDIDA.PROMOB && mod.material_nao_encontrado ? 'border border-rose-300 bg-rose-50/60 px-1 py-1' : ''"
                          >
                            <SearchInput
                              v-model="mod.material_id"
                              mode="select"
                              :options="materialOptions"
                              :placeholder="origemMedida === ORIGEM_MEDIDA.PROMOB && mod.material_nao_encontrado ? 'NÃO ENCONTRADO' : 'Buscar MDF por nome/cor'"
                              class="[&_.search-container]:!gap-0 [&_input]:!h-8 [&_input]:!rounded [&_input]:!text-xs"
                              @update:modelValue="onSelecionarMaterialModulo(mod, $event)"
                            />
                          </div>
                          <i
                            v-if="origemMedida === ORIGEM_MEDIDA.PROMOB && mod.material_nao_encontrado"
                            class="pi pi-exclamation-triangle text-rose-500 text-xs"
                            title="Material não encontrado no cadastro"
                          />
                        </div>
                        <span class="text-right text-xs font-semibold tabular-nums"
                          :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'text-sky-700' : 'text-amber-700'">
                          {{ formatCurrency(custoModulo(mod)) }}
                        </span>
                        <button type="button"
                          class="rounded px-2 py-1 text-[10px] font-semibold transition-colors"
                          :class="ferragensAbertas(mod)
                            ? (origemMedida === ORIGEM_MEDIDA.PROMOB ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700')
                            : (origemMedida === ORIGEM_MEDIDA.PROMOB ? 'bg-slate-100 text-text-soft hover:bg-sky-50 hover:text-sky-600' : 'bg-slate-100 text-text-soft hover:bg-amber-50 hover:text-amber-600')"
                          @click="toggleFerragens(mod)">
                          Ferragens
                        </button>
                        <button type="button"
                          class="flex h-7 w-7 items-center justify-center rounded text-rose-400 hover:bg-rose-50"
                          @click="removerModuloVendedor(ambIdx, pIdx, mIdx)">
                          <i class="pi pi-minus text-[10px]" />
                        </button>
                      </div>
                      <!-- Ferragens do módulo -->
                      <p
                        v-if="origemMedida === ORIGEM_MEDIDA.PROMOB && mod.material_nome_original"
                        class="px-3 pb-2 text-[11px]"
                        :class="mod.material_nao_encontrado ? 'text-rose-600 font-semibold' : 'text-sky-700'"
                      >
                        Material original do arquivo: {{ mod.material_nome_original }}
                      </p>
                      <div v-show="ferragensAbertas(mod)"
                        class="px-2 py-1.5 space-y-1"
                        :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'border-t border-sky-200/60 bg-sky-50/40' : 'border-t border-amber-200/60 bg-amber-50/40'">
                        <p class="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-2"
                          :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'text-sky-600' : 'text-amber-600'">
                          <span><i class="pi pi-wrench mr-1" />Ferragens</span>
                          <span
                            v-if="qtdFerragensPendentes(mod) > 0"
                            class="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700"
                          >
                            {{ qtdFerragensPendentes(mod) }} pendente(s)
                          </span>
                        </p>
                        <SearchInput
                          v-model="mod._ferragemBuscaId"
                          mode="select"
                          :options="ferragemOptions"
                          placeholder="Buscar ferragem"
                          class="[&_.search-container]:!gap-0 [&_.search-container]:!h-8 [&_.search-container]:!items-center [&_input]:!h-8 [&_input]:!rounded-md [&_input]:!py-0 [&_input]:!text-[10px]"
                          @update:modelValue="onSelecionarFerragemNoModulo(mod, $event)"
                        />
                        <div class="grid grid-cols-[minmax(0,1fr)_80px_120px_120px] gap-2 px-0.5 text-[9px] font-bold uppercase tracking-wider text-text-soft items-center">
                          <span>Nome da ferragem</span>
                          <span class="text-right">Qtd</span>
                          <span class="text-right">Venda un</span>
                          <span class="text-right">Total</span>
                        </div>
                        <div
                          v-for="(fer, fIdx) in mod.ferragens"
                          :key="fer._id"
                          class="grid grid-cols-[minmax(0,1fr)_80px_120px_120px] gap-2 items-center border-b pb-1 last:border-b-0"
                          :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'border-sky-200/60' : 'border-amber-200/70'"
                        >
                          <div class="min-w-0">
                            <p class="truncate text-[11px]" :class="fer.nao_encontrada ? 'text-rose-600 font-semibold' : 'text-text-main'" :title="nomeFerragemExibicao(fer)">
                              {{ nomeFerragemExibicao(fer) }}
                            </p>
                            <p v-if="fer.nao_encontrada" class="text-[10px] text-rose-600">⚠️ Ferragem não encontrada no cadastro</p>
                            <SearchInput
                              v-if="fer.nao_encontrada"
                              v-model="fer._resolver_produto_id"
                              mode="select"
                              :options="ferragemOptions"
                              placeholder="Selecionar ferragem válida"
                              class="mt-1 [&_.search-container]:!gap-0 [&_.search-container]:!h-7 [&_.search-container]:!items-center [&_input]:!h-7 [&_input]:!rounded-md [&_input]:!py-0 [&_input]:!text-[10px]"
                              @update:modelValue="resolverFerragemPendente(mod, fer, $event)"
                            />
                          </div>
                          <div class="text-right">
                            <input v-model.number="fer.quantidade" type="number" min="1" step="1"
                              class="w-full bg-transparent px-0 py-0 text-[10px] tabular-nums text-right focus:outline-none" />
                          </div>
                          <div class="text-[10px] tabular-nums text-right text-text-soft">
                            {{ formatCurrency(getPrecoVendaFerragemUnitario(fer)) }}
                          </div>
                          <div class="flex items-center justify-end gap-1.5">
                            <span class="text-right text-[10px] font-semibold tabular-nums"
                              :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'text-sky-700' : 'text-amber-700'">
                              {{ formatCurrency(custoFerragemItem(fer)) }}
                            </span>
                            <button type="button"
                              class="flex h-5 w-5 items-center justify-center rounded text-rose-400 hover:bg-rose-50"
                              @click="removerFerragem(mod, fIdx)">
                              <i class="pi pi-times text-[9px]" />
                            </button>
                          </div>
                        </div>
                        <p v-if="!mod.ferragens.length" class="text-[10px] text-text-soft italic px-0.5 py-0.5">
                          Nenhuma ferragem adicionada.
                        </p>
                      </div>
                    </div>

                    <p v-if="!parede.modulos.length" class="text-xs text-text-soft italic py-1">
                      Nenhum módulo adicionado.
                    </p>

                    <div class="rounded-lg border border-border-ui bg-bg-page overflow-hidden">
                      <div class="flex items-center justify-between gap-2 border-b border-border-ui bg-slate-50 px-3 py-2">
                        <p class="text-[11px] font-bold uppercase tracking-wider text-text-soft">
                          <i class="pi pi-wrench mr-1" />Lista de Ferragens da Parede
                        </p>
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-semibold tabular-nums"
                            :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'text-sky-700' : 'text-amber-700'">
                            {{ formatCurrency(custoFerragensLista(parede.ferragens)) }}
                          </span>
                          <button
                            type="button"
                            class="rounded px-2 py-1 text-[10px] font-semibold transition-colors"
                            :class="ferragensParedeAbertas(parede)
                              ? (origemMedida === ORIGEM_MEDIDA.PROMOB ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700')
                              : 'bg-slate-100 text-text-soft hover:bg-slate-200/70'"
                            @click="toggleFerragensParede(parede)"
                          >
                            {{ ferragensParedeAbertas(parede) ? 'Ocultar' : 'Exibir' }}
                          </button>
                        </div>
                      </div>

                      <div
                        v-show="ferragensParedeAbertas(parede)"
                        class="px-2 py-1.5 space-y-1"
                        :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'bg-sky-50/40' : 'bg-amber-50/40'">
                        <SearchInput
                          v-model="parede._ferragemBuscaId"
                          mode="select"
                          :options="ferragemOptions"
                          placeholder="Buscar ferragem para a parede"
                          class="[&_.search-container]:!gap-0 [&_.search-container]:!h-8 [&_.search-container]:!items-center [&_input]:!h-8 [&_input]:!rounded-md [&_input]:!py-0 [&_input]:!text-[10px]"
                          @update:modelValue="onSelecionarFerragemNaParede(parede, $event)"
                        />

                        <div class="grid grid-cols-[minmax(0,1fr)_80px_120px_120px] gap-2 px-0.5 text-[9px] font-bold uppercase tracking-wider text-text-soft items-center">
                          <span>Nome da ferragem</span>
                          <span class="text-right">Qtd</span>
                          <span class="text-right">Venda un</span>
                          <span class="text-right">Total</span>
                        </div>

                        <div
                          v-for="(fer, fIdx) in (parede.ferragens || [])"
                          :key="fer._id"
                          class="grid grid-cols-[minmax(0,1fr)_80px_120px_120px] gap-2 items-center border-b pb-1 last:border-b-0"
                          :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'border-sky-200/60' : 'border-amber-200/70'"
                        >
                          <div class="min-w-0">
                            <p class="truncate text-[11px]" :class="fer.nao_encontrada ? 'text-rose-600 font-semibold' : 'text-text-main'" :title="nomeFerragemExibicao(fer)">
                              {{ nomeFerragemExibicao(fer) }}
                            </p>
                            <p v-if="fer.nao_encontrada" class="text-[10px] text-rose-600">⚠️ Ferragem não encontrada no cadastro</p>
                            <SearchInput
                              v-if="fer.nao_encontrada"
                              v-model="fer._resolver_produto_id"
                              mode="select"
                              :options="ferragemOptions"
                              placeholder="Selecionar ferragem válida"
                              class="mt-1 [&_.search-container]:!gap-0 [&_.search-container]:!h-7 [&_.search-container]:!items-center [&_input]:!h-7 [&_input]:!rounded-md [&_input]:!py-0 [&_input]:!text-[10px]"
                              @update:modelValue="resolverFerragemPendenteNaParede(parede, fer, $event)"
                            />
                          </div>
                          <div class="text-right">
                            <input v-model.number="fer.quantidade" type="number" min="1" step="1"
                              class="w-full bg-transparent px-0 py-0 text-[10px] tabular-nums text-right focus:outline-none" />
                          </div>
                          <div class="text-[10px] tabular-nums text-right text-text-soft">
                            {{ formatCurrency(getPrecoVendaFerragemUnitario(fer)) }}
                          </div>
                          <div class="flex items-center justify-end gap-1.5">
                            <span class="text-right text-[10px] font-semibold tabular-nums"
                              :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'text-sky-700' : 'text-amber-700'">
                              {{ formatCurrency(custoFerragemItem(fer)) }}
                            </span>
                            <button type="button"
                              class="flex h-5 w-5 items-center justify-center rounded text-rose-400 hover:bg-rose-50"
                              @click="removerFerragemParede(parede, fIdx)">
                              <i class="pi pi-times text-[9px]" />
                            </button>
                          </div>
                        </div>

                        <p v-if="!(parede.ferragens || []).length" class="text-[10px] text-text-soft italic px-0.5 py-0.5">
                          Nenhuma ferragem na parede.
                        </p>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-3">
                      <button type="button"
                        class="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:opacity-70 transition-opacity"
                        @click="addModuloVendedor(ambIdx, pIdx)">
                        <i class="pi pi-plus text-[10px]" />Adicionar módulo
                      </button>
                      <button type="button"
                        class="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:opacity-70 transition-opacity"
                        @click="addFerragemParede(parede)">
                        <i class="pi pi-plus text-[10px]" />Adicionar ferragem
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="!amb.paredes.length" class="px-4 py-3 text-xs text-text-soft italic">
                  Nenhuma parede adicionada.
                </div>
              </div>

              <div v-show="!ambienteOcultoEditavel(amb, ambIdx)" class="px-4 py-2 border-t border-border-ui/40 bg-slate-50/50">
                <button type="button"
                  class="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70 transition-opacity"
                  :class="origemMedida === ORIGEM_MEDIDA.PROMOB ? 'text-sky-600' : 'text-amber-600'"
                  @click="addParede(ambIdx)">
                  <i class="pi pi-plus text-[10px]" />Adicionar parede
                </button>
              </div>
            </section>

            <!-- Botão novo ambiente -->
            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-ui bg-bg-card py-4 text-sm font-semibold text-text-soft hover:border-brand-primary/40 hover:text-brand-primary transition-all"
              @click="addAmbiente"
            >
              <i class="pi pi-plus" />Adicionar ambiente
            </button>
          </template>

          <section class="rounded-xl border border-border-ui bg-bg-page p-3 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-[11px] text-text-soft font-semibold uppercase tracking-wider">Pagamento (pré-fechamento)</p>
              <p class="text-[10px] text-text-soft">Regras compartilhadas com fechamento de venda</p>
            </div>

            <div class="grid gap-2 md:grid-cols-[220px_1fr] items-end">
              <label class="text-xs text-text-soft">
                <span class="block mb-1 font-semibold">Desconto aplicado no fechamento (%)</span>
                <input
                  v-model.number="descontoFechamentoPct"
                  type="number"
                  min="0"
                  :max="DESCONTO_MAXIMO_PERCENTUAL"
                  step="0.1"
                  class="w-full rounded border border-border-ui bg-white px-2 py-1 text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                  @change="onChangeDescontoFechamento"
                />
              </label>
              <p class="text-[11px] text-text-soft">
                Limite máximo: {{ DESCONTO_MAXIMO_PERCENTUAL }}%. A partir de {{ LIMITE_DESCONTO_RESTRINGIR_PAGAMENTO }}% algumas formas são restringidas.
              </p>
            </div>

            <div class="rounded-lg border border-border-ui overflow-hidden bg-white">
              <div class="grid grid-cols-[minmax(0,1fr)_120px_160px_44px] bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-text-soft">
                <span>Forma</span>
                <span class="text-right">Parcelas</span>
                <span class="text-right">Valor (R$)</span>
                <span class="text-right">Ação</span>
              </div>

              <div class="divide-y divide-border-ui/60">
                <div
                  v-for="(row, rowIdx) in pagamentosFechamento"
                  :key="`PAG_${rowIdx}`"
                  class="grid grid-cols-[minmax(0,1fr)_120px_160px_44px] items-center gap-2 px-3 py-2"
                >
                  <select
                    v-model="row.forma_pagamento_chave"
                    class="h-9 rounded border border-border-ui bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                    @change="normalizarPagamentoLinha(row, rowIdx)"
                  >
                    <option value="">Selecione</option>
                    <option
                      v-for="opt in getFormasPagamentoOptionsForRow(rowIdx)"
                      :key="`FP_${rowIdx}_${opt.value}`"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>

                  <select
                    v-model.number="row.parcelas"
                    class="h-9 rounded border border-border-ui bg-white px-2 text-xs text-right focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                    @change="normalizarPagamentoLinha(row, rowIdx)"
                  >
                    <option
                      v-for="p in parcelasOptionsDaForma(row.forma_pagamento_chave)"
                      :key="`PARC_${rowIdx}_${p}`"
                      :value="p"
                    >
                      {{ p }}x
                    </option>
                  </select>

                  <input
                    v-model.number="row.valor"
                    type="number"
                    min="0"
                    step="0.01"
                    class="h-9 rounded border border-border-ui bg-white px-2 text-xs text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                    @change="normalizarPagamentoLinha(row, rowIdx)"
                  />

                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded text-rose-500 hover:bg-rose-50 disabled:opacity-40"
                    :disabled="pagamentosFechamento.length <= 1"
                    @click="removerPagamento(rowIdx)"
                  >
                    <i class="pi pi-trash text-[11px]" />
                  </button>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-lg border border-border-ui bg-white px-2.5 py-1.5 text-xs font-semibold text-text-soft hover:text-brand-primary"
                @click="addPagamento"
              >
                <i class="pi pi-plus text-[10px]" />Adicionar forma
              </button>

              <div class="text-right text-xs tabular-nums">
                <p class="text-text-soft">Total informado: <span class="font-semibold text-text-main">{{ formatCurrency(totalPagamentoInformado) }}</span></p>
                <p :class="Math.abs(saldoPagamento) < 0.01 ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'">
                  Saldo para bater com total geral: {{ formatCurrency(saldoPagamento) }}
                </p>
              </div>
            </div>
          </section>

          <!-- ═══════════════════════════════════════
               RESUMO DO ORÇAMENTO
          ═══════════════════════════════════════ -->
          <section class="rounded-xl border-2 border-brand-primary/20 bg-bg-card p-4 space-y-4">
            <p class="text-[11px] font-bold uppercase tracking-wider text-text-soft">Resumo de Fechamento</p>

            <div
              v-if="origemMedida === ORIGEM_MEDIDA.PROMOB && temMateriaisPromobPendentes"
              class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
            >
              <p class="font-semibold">
                <i class="pi pi-exclamation-triangle mr-1" />
                Existem {{ totalMateriaisPromobPendentes }} material(is) não encontrado(s).
              </p>
              <p class="mt-0.5">Selecione manualmente os MDFs para liberar a finalização do orçamento.</p>
            </div>

            <div class="grid gap-3 lg:grid-cols-3">
              <div class="rounded-xl border border-border-ui bg-bg-page p-3 space-y-2">
                <p class="text-[11px] text-text-soft font-semibold uppercase tracking-wider">Insumos Fixos</p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <input v-model.number="custosFixos.cola" type="number" min="0" step="0.01" placeholder="Cola"
                    class="rounded border border-border-ui bg-white px-2 py-1 text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-primary/30" />
                  <input v-model.number="custosFixos.parafusos" type="number" min="0" step="0.01" placeholder="Parafusos"
                    class="rounded border border-border-ui bg-white px-2 py-1 text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-primary/30" />
                </div>
                <p class="text-[10px] text-text-soft">Fita de borda já está embutida no custo base do MDF por m².</p>
                <p class="text-xs font-semibold text-text-soft">Total insumos: {{ formatCurrency(totalInsumosFixos) }}</p>
              </div>

              <div class="rounded-xl border border-border-ui bg-bg-page p-3 space-y-2">
                <p class="text-[11px] text-text-soft font-semibold uppercase tracking-wider">Custos Operacionais</p>
                <div class="grid grid-cols-3 gap-2 text-xs">
                  <input v-model.number="custosFixos.frete" type="number" min="0" step="0.01" placeholder="Frete"
                    class="rounded border border-border-ui bg-white px-2 py-1 text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-primary/30" />
                  <input v-model.number="custosFixos.montagem" type="number" min="0" step="0.01" placeholder="Montagem"
                    class="rounded border border-border-ui bg-white px-2 py-1 text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-primary/30" />
                  <input v-model.number="custosFixos.marcenaria" type="number" min="0" step="0.01" placeholder="Marcenaria"
                    class="rounded border border-border-ui bg-white px-2 py-1 text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-primary/30" />
                </div>
                <p class="text-xs font-semibold text-text-soft">Total operacional: {{ formatCurrency(totalCustosOperacionais) }}</p>
              </div>

              <div class="rounded-xl border border-border-ui bg-bg-page p-3 space-y-2">
                <p class="text-[11px] text-text-soft font-semibold uppercase tracking-wider">Margem de Lucro</p>
                <div class="flex items-center gap-2">
                  <input v-model.number="margemLucroPct" type="number" min="0" step="0.1"
                    class="w-24 rounded border border-border-ui bg-white px-2 py-1 text-right tabular-nums font-bold focus:outline-none focus:ring-1 focus:ring-brand-primary/30" />
                  <span class="text-xs text-text-soft">%</span>
                </div>
                <p class="text-xs text-text-soft">Rateio por área: {{ totalAreaM2.toFixed(3) }} m²</p>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div class="rounded-xl border border-border-ui bg-bg-page p-3">
                <p class="text-[11px] text-text-soft font-semibold uppercase tracking-wider">Custo MDF + Ferragens</p>
                <p class="text-xl font-black tabular-nums mt-1 text-slate-700">{{ formatCurrency(totalCustoBase) }}</p>
              </div>
              <div class="rounded-xl border border-border-ui bg-bg-page p-3">
                <p class="text-[11px] text-text-soft font-semibold uppercase tracking-wider">Custos rateados</p>
                <p class="text-xl font-black tabular-nums mt-1 text-slate-700">{{ formatCurrency(totalCustosFixos) }}</p>
              </div>
              <div class="rounded-xl border border-border-ui bg-bg-page p-3">
                <p class="text-[11px] text-text-soft font-semibold uppercase tracking-wider">Lucro real</p>
                <p class="text-xl font-black tabular-nums mt-1 text-brand-primary">{{ formatCurrency(lucroRealTotal) }}</p>
              </div>
              <div class="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3">
                <p class="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider">Total geral</p>
                <p class="text-xl font-black tabular-nums text-emerald-700 mt-1">{{ formatCurrency(precoVenda) }}</p>
                <p class="text-[10px] text-emerald-600 mt-0.5">custo + rateio + margem</p>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                class="!rounded-xl"
                :disabled="!podeFinalizarOrcamento"
                @click="finalizarOrcamentoAtual"
              >
                <i class="pi pi-check mr-2" />
                {{ finalizandoOrcamento ? 'Finalizando...' : 'Finalizar Orçamento' }}
              </Button>
            </div>

            <div class="rounded-xl border border-border-ui overflow-hidden">
              <div class="grid grid-cols-[1.2fr_90px_100px_110px_110px_110px_120px] bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-text-soft">
                <span>Ambiente</span>
                <span class="text-right">MDF (m²)</span>
                <span class="text-right">Ferragens (un)</span>
                <span class="text-right">MDF (R$)</span>
                <span class="text-right">Ferragens (R$)</span>
                <span class="text-right">Rateio</span>
                <span class="text-right">Lucro real</span>
              </div>
              <div v-if="resumoAmbientes.length" class="divide-y divide-border-ui/60 bg-white">
                <div v-for="row in resumoAmbientes" :key="row.id"
                  class="grid grid-cols-[1.2fr_90px_100px_110px_110px_110px_120px] px-3 py-2 text-xs tabular-nums">
                  <span class="font-semibold text-text-main truncate">{{ row.nome }}</span>
                  <span class="text-right">{{ row.mdfM2.toFixed(3) }}</span>
                  <span class="text-right">{{ row.ferragensUn }}</span>
                  <span class="text-right">{{ formatCurrency(row.custoMdf) }}</span>
                  <span class="text-right">{{ formatCurrency(row.custoFerragens) }}</span>
                  <span class="text-right text-slate-600">{{ formatCurrency(row.rateio) }}</span>
                  <span class="text-right font-semibold text-brand-primary">{{ formatCurrency(row.lucroReal) }}</span>
                </div>
              </div>
              <div v-else class="px-3 py-4 text-xs text-text-soft italic">Sem ambientes para detalhar.</div>
            </div>
          </section>

        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EstrategiaPrecosService, OrcamentoTecnicoService, ProdutosService } from '@/services'
import { FORMAS_PAGAMENTO, VENDA_FECHAMENTO_REGRAS } from '@/constantes'
import { notify } from '@/services/notify'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import Loading from '@/components/common/Loading.vue'

definePage({ meta: { perm: 'agendamentos.vendas' } })

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(String(route.params?.id || '').replace(/\D/g, '')) || null)
const ORIGEM_MEDIDA = Object.freeze({ TECNICO: 'TECNICO', VENDEDOR: 'VENDEDOR', PROMOB: 'PROMOB' })

const loading = ref(true)
const erro = ref('')
const orcamento = ref(null)
const finalizandoOrcamento = ref(false)
const perdaTecnicaPct = ref(10)
const contatoCliente = computed(() => {
  const cliente = orcamento.value?.agenda_loja?.cliente
  return cliente?.whatsapp || cliente?.telefone || cliente?.email || '—'
})

const materiais = ref([])

const materialOptions = computed(() =>
  materiais.value.map((m) => ({
    value: m.id,
    label: `${m.nome_produto || m.group || 'MDF'}${(m.cor || m.color) ? ` - ${m.cor || m.color}` : ''}${m.marca ? ` (${m.marca})` : ''}`,
  })),
)

function getMaterialById(id) {
  return materiais.value.find((m) => m.id === id) ?? null
}

function getCustoM2DoProduto(material) {
  if (!material) return 0
  const costBase = Number(material.cost_base ?? 0)
  return Number.isFinite(costBase) && costBase > 0 ? costBase : 0
}

function getCustoM2ByMaterial(materialId) {
  const mat = getMaterialById(materialId)
  const custoProduto = getCustoM2DoProduto(mat)
  if (custoProduto > 0) return custoProduto
  return 0
}

function catStyle(catId) {
  if (catId === 'PRIMARIA')   return 'bg-slate-100 text-slate-700'
  if (catId === 'SECUNDARIA') return 'bg-blue-100 text-blue-700'
  if (catId === 'TERCIARIA')  return 'bg-purple-100 text-purple-700'
  return 'bg-slate-100 text-slate-700'
}

function normalizarMaterialMdf(item = {}, idx = 0) {
  const categoria = String(
    item.categoria_base || item.category || item.commercial_category || item.categoria || 'PRIMARIA',
  ).trim().toUpperCase()
  const cor = String(item.cor || item.color || item.group || '').trim()
  const nomeProduto = String(item.nome_produto || item.group || item.color || 'MDF').trim()
  const espessura = Number(item.espessura_mm ?? item.thickness ?? 0) || 0
  const idFallback = `MDF_${categoria}_${espessura}_${normalizarTexto(cor || nomeProduto)}_${idx}`

  return {
    ...item,
    id: item.id ?? idFallback,
    categoria_base: categoria,
    nome_produto: nomeProduto,
    cor,
    espessura_mm: espessura,
    marca: item.marca ?? null,
  }
}

async function carregarCatalogosEstrategia() {
  try {
    // Carrega materiais MDF do catálogo
    const { data: mats } = await EstrategiaPrecosService.listarMateriaisMdf()
    materiais.value = Array.isArray(mats) ? mats.map((item, idx) => normalizarMaterialMdf(item, idx)) : []
    if (ambientesPromob.value.length) {
      ambientesPromob.value = remapearMateriaisPromob(ambientesPromob.value)
    }
  } catch { /* lista vazia */ }

  try {
    // Carrega catálogo de ferragens
    const { data: fgs } = await ProdutosService.listarFerragens()
    catalogoFerragens.value = Array.isArray(fgs) ? fgs : (Array.isArray(fgs?.data) ? fgs.data : [])
  } catch { /* sem catálogo */ }
}

// ─── Catálogo de ferragens ──────────────────────────────────────
const catalogoFerragens = ref([])

const ferragemOptions = computed(() =>
  catalogoFerragens.value.map((p) => ({
    value: p.id,
    label: `${p.nome_produto || 'Ferragem'}${p.marca ? ` (${p.marca})` : ''}`,
  })),
)

function getFerragemById(id) {
  return catalogoFerragens.value.find((p) => p.id === id) ?? null
}

function normalizarNomeFerragem(value) {
  return normalizarTexto(value)
}

function chaveFerragemMerge(ferragem = {}) {
  if (ferragem?.produto_id != null) return `ID_${ferragem.produto_id}`
  const nome = normalizarNomeFerragem(ferragem?.nome_original || ferragem?.nome || '')
  return nome ? `NOME_${nome}` : ''
}

function nomeFerragemExibicao(fer) {
  return fer?.nome || getFerragemById(fer?.produto_id)?.nome_produto || fer?.nome_original || '—'
}

function upsertFerragemNoModulo(mod, dadosFerragem = {}) {
  mod.ferragens = Array.isArray(mod.ferragens) ? mod.ferragens : []
  const quantidadeNova = Math.max(1, Number(dadosFerragem?.quantidade || 1))
  const chave = chaveFerragemMerge(dadosFerragem)
  if (!chave) return null

  const existente = mod.ferragens.find((item) => chaveFerragemMerge(item) === chave)
  if (existente) {
    existente.quantidade = Math.max(1, Number(existente.quantidade || 0) + quantidadeNova)
    if (dadosFerragem.produto_id != null) {
      existente.produto_id = dadosFerragem.produto_id
      existente.nao_encontrada = false
      existente.nome = dadosFerragem.nome || existente.nome
      existente.custo_unitario = Number(dadosFerragem.custo_unitario || existente.custo_unitario || 0)
      existente.nome_original = dadosFerragem.nome_original || existente.nome_original || existente.nome
      existente._resolver_produto_id = null
    }
    return existente
  }

  const nova = {
    ...novaFerragem(),
    ...dadosFerragem,
    quantidade: quantidadeNova,
    nome_original: dadosFerragem.nome_original || dadosFerragem.nome || '',
    nao_encontrada: Boolean(dadosFerragem.nao_encontrada),
  }
  mod.ferragens.push(nova)
  return nova
}

function onSelecionarFerragem(fer) {
  const prod = getFerragemById(fer.produto_id)
  if (prod) {
    fer.nome = prod.nome_produto || ''
    fer.nome_original = fer.nome_original || prod.nome_produto || ''
    fer.nao_encontrada = false
    fer._resolver_produto_id = null
    fer.custo_unitario = Number(prod.valor_unitario || 0)
  }
}

function onSelecionarFerragemNoModulo(mod, produtoId) {
  mod._ferragens_abertas = true
  if (!produtoId) {
    mod._ferragemBuscaId = null
    return
  }

  const prod = getFerragemById(produtoId)
  if (!prod) {
    mod._ferragemBuscaId = null
    return
  }

  upsertFerragemNoModulo(mod, {
    produto_id: prod.id,
    nome: prod.nome_produto || '',
    nome_original: prod.nome_produto || '',
    quantidade: 1,
    custo_unitario: Number(prod.valor_unitario || 0),
    nao_encontrada: false,
  })
  mod._ferragemBuscaId = null
}

function aplicarVinculoFerragemNaLinha(fer, prod) {
  if (!fer || !prod) return
  fer.produto_id = prod.id
  fer.nome = prod.nome_produto || fer.nome || ''
  fer.nome_original = fer.nome_original || prod.nome_produto || ''
  fer.custo_unitario = Number(prod.valor_unitario || 0)
  fer.nao_encontrada = false
  fer._resolver_produto_id = null
  fer.quantidade = Math.max(1, Number(fer?.quantidade || 1))
}

function resolverFerragemPendente(mod, fer, produtoId) {
  if (!produtoId) return
  const prod = getFerragemById(produtoId)
  if (!prod) return
  aplicarVinculoFerragemNaLinha(fer, prod)
}

function onSelecionarFerragemNaParede(parede, produtoId) {
  if (!produtoId) {
    parede._ferragemBuscaId = null
    return
  }

  const prod = getFerragemById(produtoId)
  if (!prod) {
    parede._ferragemBuscaId = null
    return
  }

  upsertFerragemNoModulo(parede, {
    produto_id: prod.id,
    nome: prod.nome_produto || '',
    nome_original: prod.nome_produto || '',
    quantidade: 1,
    custo_unitario: Number(prod.valor_unitario || 0),
    nao_encontrada: false,
  })
  parede._ferragemBuscaId = null
}

function resolverFerragemPendenteNaParede(parede, fer, produtoId) {
  if (!produtoId) return
  const prod = getFerragemById(produtoId)
  if (!prod) return
  aplicarVinculoFerragemNaLinha(fer, prod)
}

function getCustoFerragemUnitario(fer) {
  if (fer?.nao_encontrada) return 0
  const prod = getFerragemById(fer?.produto_id)
  if (prod) return Number(prod.valor_unitario || 0)
  return Number(fer?.custo_unitario || 0)
}

function getPrecoVendaFerragemUnitario(fer) {
  return getCustoFerragemUnitario(fer) * 2
}

function custoFerragemItem(fer) {
  return Number(fer?.quantidade || 0) * getPrecoVendaFerragemUnitario(fer)
}

function quantidadeFerragensModulo(mod) {
  return (mod.ferragens || []).reduce((a, f) => a + Number(f.quantidade || 0), 0)
}

function custoFerragensModulo(mod) {
  return (mod.ferragens || []).reduce((a, f) => a + custoFerragemItem(f), 0)
}

function quantidadeFerragensLista(ferragens = []) {
  return (ferragens || []).reduce((a, f) => a + Number(f.quantidade || 0), 0)
}

function custoFerragensLista(ferragens = []) {
  return (ferragens || []).reduce((a, f) => a + custoFerragemItem(f), 0)
}

function qtdFerragensPendentes(mod) {
  return (mod.ferragens || []).reduce((acc, fer) => acc + (fer?.nao_encontrada ? 1 : 0), 0)
}

function areaModuloM2(mod) {
  return (Number(mod.largura_mm || 0) * Number(mod.altura_mm || 0)) / 1_000_000
}

function custoMdfModulo(mod) {
  const base = areaModuloM2(mod) * getCustoM2ByMaterial(mod.material_id)
  const perdaFactor = 1 + (Math.max(0, Number(perdaTecnicaPct.value || 0)) / 100)
  return base * perdaFactor
}

function persistirPerdaTecnica() {
  const normalizado = Math.max(0, Number(perdaTecnicaPct.value || 0))
  perdaTecnicaPct.value = normalizado
  try {
    localStorage.setItem('orcamento_tecnico.perda_tecnica_pct', String(normalizado))
  } catch (_) {
    // ignore localStorage errors
  }
}

function novaFerragem() {
  return { _id: uid(), produto_id: null, nome: '', nome_original: '', quantidade: 1, custo_unitario: 0, nao_encontrada: false, _resolver_produto_id: null }
}

function addFerragem(mod) {
  mod._ferragens_abertas = true
  mod.ferragens.push(novaFerragem())
}

function removerFerragem(mod, fIdx) {
  mod.ferragens.splice(fIdx, 1)
}

function addFerragemParede(parede) {
  parede.ferragens = Array.isArray(parede.ferragens) ? parede.ferragens : []
  parede.ferragens.push(novaFerragem())
}

function removerFerragemParede(parede, fIdx) {
  parede.ferragens.splice(fIdx, 1)
}

function ferragensAbertas(mod) {
  return Boolean(mod?._ferragens_abertas)
}

function toggleFerragens(mod) {
  mod._ferragens_abertas = !ferragensAbertas(mod)
}

function ferragensParedeAbertas(parede) {
  return parede?._ferragens_parede_abertas !== false
}

function toggleFerragensParede(parede) {
  parede._ferragens_parede_abertas = !ferragensParedeAbertas(parede)
}

// ─── Custo de um módulo (material + ferragens) ──────────────────
function custoModulo(mod) {
  return custoMdfModulo(mod) + custoFerragensModulo(mod)
}

// ─── Origem das medidas ─────────────────────────────────────────
const origemMedida = ref(ORIGEM_MEDIDA.TECNICO)
const origem = origemMedida
const promobFileInput = ref(null)
const promobArquivoNome = ref('')
const promobMensagem = ref('')
const promobMensagemErro = ref(false)
const ambientesPromob = ref([])

function normalizarTexto(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function numeroPositivo(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function inferirCategoriaPromob(materialNome) {
  const material = normalizarTexto(materialNome)
  if (!material) return 'PRIMARIA'
  if (material.includes('PREMIUM') || material.includes('LACA') || material.includes('PRETO TX') || material.includes('NUDE')) return 'TERCIARIA'
  if (material.includes('CARVALHO') || material.includes('FREIJO') || material.includes('AMADEIR') || material.includes('DESIGN')) return 'SECUNDARIA'
  if (material.includes('BRANCO') || material.includes('CINZA') || material.includes('ESSENCIAL')) return 'PRIMARIA'
  return 'PRIMARIA'
}

function normalizarNomeMaterialArquivo(materialNome) {
  return normalizarTexto(materialNome)
    .replace(/\b(MDF|MDP|BP|FF|TX|UV)\b/g, ' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*MM\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function encontrarMaterialPromob(materialNome) {
  const alvoNormalizado = normalizarNomeMaterialArquivo(materialNome)
  if (!alvoNormalizado) return null

  return materiais.value.find((m) => {
    const nomeNormalizado = normalizarNomeMaterialArquivo(m.nome_produto || m.group || '')
    return nomeNormalizado === alvoNormalizado
  }) || null
}

function encontrarFerragemPromob(nomeFerragem) {
  const alvo = normalizarTexto(nomeFerragem)
  if (!alvo) return null
  return catalogoFerragens.value.find((f) => normalizarTexto(f.nome_produto) === alvo) || null
}

/**
 * Detecta o tipo de item (MDF ou Ferragem) baseado no campo Dimensões.
 * 
 * Regras:
 * - Se contém 'un' (unidade): é FERRAGEM
 * - Se contém padrão numérico com 'x' (ex: 870x580): é MDF
 * - Caso contrário: ambíguo (trata como MDF por padrão, mas marca como inválido)
 */
function identificarTipoItemPromob(dimensaoBruta = '') {
  const dimensaoNormalizada = normalizarTexto(String(dimensaoBruta || '').trim())
  
  // Verifica se é ferragem (contém 'un')
  if (dimensaoNormalizada.includes('UN') || dimensaoNormalizada === 'UNIDADE' || dimensaoNormalizada === 'UNID') {
    return {
      tipo: 'ferragem',
      valido: true,
      dimensoes: null,
      dimensaoBruta,
    }
  }
  
  // Tenta extrair dimensões numéricas (padrão: NxN ou N)
  const dimensoes = dimensaoBruta
    .split('x')
    .map((valor) => numeroPositivo(String(valor || '').trim(), 0))
  
  const largura = numeroPositivo(dimensoes[0], 0)
  const altura = dimensoes.length > 1 ? numeroPositivo(dimensoes[1], 0) : 0
  
  // Se tem padrão numérico com valores válidos, é MDF
  if (largura > 0 && altura > 0) {
    return {
      tipo: 'mdf',
      valido: true,
      dimensoes: { largura, altura },
      dimensaoBruta,
    }
  }
  
  // Ambíguo ou inválido
  return {
    tipo: 'mdf', // fallback
    valido: false,
    dimensoes: null,
    dimensaoBruta,
  }
}

function novoModuloPromob(modulo = {}) {
  const materialNome = String(modulo.material_nome || modulo.material || modulo.materialName || modulo.nome_material || 'Branco').trim()
  const material = encontrarMaterialPromob(materialNome)
  const naoEncontrado = !material
  return {
    _id: uid(),
    nome: String(modulo.nome || modulo.descricao || modulo.tipo || 'Módulo Promob').trim() || 'Módulo Promob',
    largura_mm: numeroPositivo(modulo.largura_mm ?? modulo.largura ?? modulo.width, 1200),
    altura_mm: numeroPositivo(modulo.altura_mm ?? modulo.altura ?? modulo.height, 800),
    material_id: material?.id ?? null,
    material_nao_encontrado: naoEncontrado,
    _ferragens_abertas: Array.isArray(modulo.ferragens) && modulo.ferragens.length > 0,
    ferragens: [],
    material_nome_original: materialNome,
    categoria_importada: inferirCategoriaPromob(materialNome),
  }
}

function normalizarParedePromob(parede = {}, idx = 0) {
  const modulosEntrada = Array.isArray(parede.modulos) ? parede.modulos : Array.isArray(parede.modules) ? parede.modules : []
  return {
    _id: uid(),
    nome: String(parede.nome || parede.name || `Parede ${idx + 1}`).trim() || `Parede ${idx + 1}`,
    largura_mm: numeroPositivo(parede.largura_mm ?? parede.largura ?? parede.width, 2800),
    altura_mm: numeroPositivo(parede.altura_mm ?? parede.altura ?? parede.height, 2700),
    modulos: modulosEntrada.length ? modulosEntrada.map((mod) => novoModuloPromob(mod)) : [novoModuloPromob()],
    ferragens: Array.isArray(parede.ferragens) ? parede.ferragens : [],
  }
}

function normalizarAmbientePromob(ambiente = {}, idx = 0) {
  const paredesEntrada = Array.isArray(ambiente.paredes) ? ambiente.paredes : Array.isArray(ambiente.walls) ? ambiente.walls : []
  const modulosDiretos = Array.isArray(ambiente.modulos) ? ambiente.modulos : Array.isArray(ambiente.modules) ? ambiente.modules : []
  return {
    _id: uid(),
    nome: String(ambiente.nome || ambiente.name || `Ambiente ${idx + 1}`).trim() || `Ambiente ${idx + 1}`,
    paredes: paredesEntrada.length
      ? paredesEntrada.map((parede, paredeIdx) => normalizarParedePromob(parede, paredeIdx))
      : [normalizarParedePromob({ nome: 'Parede principal', modulos: modulosDiretos.length ? modulosDiretos : [novoModuloPromob()] }, 0)],
    ferragens: Array.isArray(ambiente.ferragens) ? ambiente.ferragens : [],
  }
}

function extrairAttrsPromob(rawAttrs = '') {
  const attrs = {}
  const regex = /(\w+)\s*=\s*"([^"]*)"/g
  let match = regex.exec(rawAttrs)
  while (match) {
    attrs[String(match[1] || '').toUpperCase()] = match[2]
    match = regex.exec(rawAttrs)
  }
  return attrs
}

function parsePromobXmlSimulado(texto) {
  const ambientesMap = new Map()
  const tagRegex = /<(?:modulo|Modulo|module|Module|item|Item|peca|Peca|part|Part)\b([^>]*)\/?>(?:<\/[^>]+>)?/g
  let match = tagRegex.exec(texto)

  while (match) {
    const attrs = extrairAttrsPromob(match[1])
    const ambienteNome = String(attrs.AMBIENTE || attrs.ROOM || attrs.ENVIRONMENT || 'Ambiente Promob').trim()
    const paredeNome = String(attrs.PAREDE || attrs.WALL || 'Parede principal').trim()
    const ambienteKey = normalizarTexto(ambienteNome) || `AMBIENTE_${ambientesMap.size + 1}`

    if (!ambientesMap.has(ambienteKey)) {
      ambientesMap.set(ambienteKey, { nome: ambienteNome || 'Ambiente Promob', paredes: [] })
    }

    const ambiente = ambientesMap.get(ambienteKey)
    let parede = ambiente.paredes.find((item) => normalizarTexto(item.nome) === normalizarTexto(paredeNome))
    if (!parede) {
      parede = {
        nome: paredeNome || 'Parede principal',
        largura_mm: numeroPositivo(attrs.PAREDE_LARGURA_MM || attrs.WALL_WIDTH || attrs.LARGURA_PAREDE, 2800),
        altura_mm: numeroPositivo(attrs.PAREDE_ALTURA_MM || attrs.WALL_HEIGHT || attrs.ALTURA_PAREDE, 2700),
        modulos: [],
        ferragens: [],
      }
      ambiente.paredes.push(parede)
    }

    // Extrair dimensões do XML (busca por vários nomes de atributo)
    const dimensaoBruta = String(
      attrs.DIMENSOES 
      || attrs.DIMENSIONS 
      || attrs.DIMENSAO 
      || attrs.DIMENSION
      || attrs.TAMANHO 
      || attrs.SIZE 
      || ''
    ).trim()

    // Extrair quantidade
    const quantidade = numeroPositivo(attrs.QUANTIDADE || attrs.QUANTITY || '1', 1)

    // Se não há dimensão no atributo, usar padrão
    const nomeModulo = String(attrs.NOME || attrs.NAME || attrs.DESCRICAO || 'Módulo Promob').trim()
    const materialNome = String(attrs.MATERIAL || attrs.MAT || attrs.COR || attrs.COLOR || 'Branco').trim()

    // Detectar tipo de item
    const tipoItem = dimensaoBruta ? identificarTipoItemPromob(dimensaoBruta) : { tipo: 'mdf', valido: false, dimensoes: null, dimensaoBruta }

    // Se tem dimensão e é ferragem, processar como ferragem
    if (tipoItem.tipo === 'ferragem') {
      if (!Array.isArray(parede.ferragens)) parede.ferragens = []
      const ferragem = encontrarFerragemPromob(materialNome)
      upsertFerragemNoModulo(parede, {
        produto_id: ferragem?.id ?? null,
        nome: ferragem?.nome_produto || materialNome,
        nome_original: materialNome,
        quantidade: Math.max(1, quantidade),
        custo_unitario: Number(ferragem?.valor_unitario || 0),
        nao_encontrada: !ferragem,
      })
      match = tagRegex.exec(texto)
      continue
    }

    // MDF (padrão)
    // Se tem dimensões válidas no XML, usar; senão, usar dimensões padrão dos atributos
    let larguraMm = numeroPositivo(attrs.LARGURA_MM || attrs.WIDTH || attrs.LARGURA, 0)
    let alturaMm = numeroPositivo(attrs.ALTURA_MM || attrs.HEIGHT || attrs.ALTURA, 0)

    if (tipoItem.valido && tipoItem.dimensoes) {
      larguraMm = tipoItem.dimensoes.largura
      alturaMm = tipoItem.dimensoes.altura
    }

    if (!(larguraMm > 0) || !(alturaMm > 0)) {
      // Dimensões inválidas: usar padrão
      larguraMm = 1200
      alturaMm = 800
    }

    for (let idx = 0; idx < Math.max(1, quantidade); idx += 1) {
      const novoModulo = {
        nome: nomeModulo,
        material_nome: materialNome,
        largura_mm: larguraMm,
        altura_mm: alturaMm,
      }
      parede.modulos.push(novoModulo)
    }

    match = tagRegex.exec(texto)
  }

  const ambientes = Array.from(ambientesMap.values())

  if (!ambientes.length) {
    return [normalizarAmbientePromob({
      nome: 'Ambiente Promob',
      paredes: [{
        nome: 'Parede principal',
        largura_mm: 2800,
        altura_mm: 2700,
        modulos: [
          { nome: 'Aéreo 2 portas', material_nome: 'Branco', largura_mm: 1200, altura_mm: 800 },
          { nome: 'Base cooktop', material_nome: 'Carvalho', largura_mm: 900, altura_mm: 800 },
        ],
      }],
    })]
  }

  return ambientes.map((ambiente, idx) => normalizarAmbientePromob(ambiente, idx))
}

function parsePromobJsonSimulado(texto) {
  const bruto = JSON.parse(texto)
  const ambientes = Array.isArray(bruto)
    ? bruto
    : Array.isArray(bruto?.ambientes)
      ? bruto.ambientes
      : Array.isArray(bruto?.rooms)
        ? bruto.rooms
        : null

  let ambientesProcessados = []

  if (ambientes?.length) {
    ambientesProcessados = ambientes.map((ambiente, idx) => normalizarAmbientePromobComDeteccaoFerragem(ambiente, idx))
  } else if (Array.isArray(bruto?.modulos) || Array.isArray(bruto?.modules)) {
    ambientesProcessados = [normalizarAmbientePromobComDeteccaoFerragem({ nome: bruto.nome || 'Ambiente Promob', modulos: bruto.modulos || bruto.modules }, 0)]
  } else {
    ambientesProcessados = [normalizarAmbientePromobComDeteccaoFerragem({ nome: bruto?.nome || 'Ambiente Promob', modulos: [bruto] }, 0)]
  }

  return ambientesProcessados
}

/** 
 * Normaliza ambiente com detecção de ferragens baseada em dimensões
 */
function normalizarAmbientePromobComDeteccaoFerragem(ambiente = {}, idx = 0) {
  const paredesEntrada = Array.isArray(ambiente.paredes) ? ambiente.paredes : Array.isArray(ambiente.walls) ? ambiente.walls : []
  const modulosDiretos = Array.isArray(ambiente.modulos) ? ambiente.modulos : Array.isArray(ambiente.modules) ? ambiente.modules : []

  const paredesProcessadas = paredesEntrada.length
    ? paredesEntrada.map((parede, paredeIdx) => normalizarParedePromobComDeteccaoFerragem(parede, paredeIdx))
    : [normalizarParedePromobComDeteccaoFerragem({ nome: 'Parede principal', modulos: modulosDiretos.length ? modulosDiretos : [] }, 0)]

  // Extrair ferragens de nível de ambiente (raça)
  const ferragensAmbiente = Array.isArray(ambiente.ferragens) ? ambiente.ferragens : []

  return {
    _id: uid(),
    nome: String(ambiente.nome || ambiente.name || `Ambiente ${idx + 1}`).trim() || `Ambiente ${idx + 1}`,
    paredes: paredesProcessadas,
    ferragens: ferragensAmbiente.map((fer) => {
      const ferragem = encontrarFerragemPromob(typeof fer === 'string' ? fer : fer.nome || fer.material_nome || '')
      const nomeFer = typeof fer === 'string' ? fer : fer.nome || fer.material_nome || ''
      return {
        _id: uid(),
        produto_id: ferragem?.id ?? null,
        nome: ferragem?.nome_produto || nomeFer,
        nome_original: nomeFer,
        quantidade: typeof fer === 'string' ? 1 : numeroPositivo(fer.quantidade || 1, 1),
        custo_unitario: Number(ferragem?.valor_unitario || 0),
        nao_encontrada: !ferragem,
      }
    }),
  }
}

/** 
 * Normaliza parede com detecção de ferragens
 */
function normalizarParedePromobComDeteccaoFerragem(parede = {}, idx = 0) {
  const modulosEntrada = Array.isArray(parede.modulos) ? parede.modulos : Array.isArray(parede.modules) ? parede.modules : []

  const modulos = []
  const ferragensParedeOrfas = []

  // Processar cada módulo: se for ferragem, enfileirar; se for MDF, colocar na lista
  for (const modulo of modulosEntrada) {
    const dimensaoBruta = modulo.dimensoes || modulo.dimensao || modulo.size || modulo.width_height || ''
    const tipoItem = dimensaoBruta ? identificarTipoItemPromob(String(dimensaoBruta).trim()) : { tipo: 'mdf', valido: false, dimensoes: null }

    if (tipoItem.tipo === 'ferragem') {
      // É ferragem
      ferragensParedeOrfas.push({
        nome: modulo.material_nome || modulo.material || modulo.nome || '',
        quantidade: numeroPositivo(modulo.quantidade || 1, 1),
      })
    } else {
      // É MDF
      const novoMod = novoModuloPromob(modulo)
      modulos.push(novoMod)
    }
  }

  // Se não há módulos MDF, criar um padrão
  const modulosFinais = modulos.length > 0 ? modulos : [novoModuloPromob()]

  return {
    _id: uid(),
    nome: String(parede.nome || parede.name || `Parede ${idx + 1}`).trim() || `Parede ${idx + 1}`,
    largura_mm: numeroPositivo(parede.largura_mm ?? parede.largura ?? parede.width, 2800),
    altura_mm: numeroPositivo(parede.altura_mm ?? parede.altura ?? parede.height, 2700),
    modulos: modulosFinais,
    ferragens: ferragensParedeOrfas.map((fer) => {
      const ferragem = encontrarFerragemPromob(fer.nome)
      return {
        _id: uid(),
        produto_id: ferragem?.id ?? null,
        nome: ferragem?.nome_produto || fer.nome,
        nome_original: fer.nome,
        quantidade: fer.quantidade,
        custo_unitario: Number(ferragem?.valor_unitario || 0),
        nao_encontrada: !ferragem,
      }
    }),
  }
}

function parseLinhaCsvPromob(linha) {
  const colunas = []
  let atual = ''
  let emAspas = false

  for (const char of String(linha || '')) {
    if (char === '"') {
      emAspas = !emAspas
      continue
    }
    if (char === ';' && !emAspas) {
      colunas.push(atual.trim())
      atual = ''
      continue
    }
    atual += char
  }

  colunas.push(atual.trim())
  return colunas
}

function parsePromobCsvSimulado(texto) {
  const linhas = String(texto || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean)

  if (linhas.length < 2) {
    return [normalizarAmbientePromob({
      nome: 'Ambiente Promob',
      paredes: [{
        nome: 'Parede principal',
        largura_mm: 2800,
        altura_mm: 2700,
        modulos: [
          { nome: 'Modulo CSV', material_nome: 'Branco', largura_mm: 1200, altura_mm: 800 },
        ],
      }],
    })]
  }

  const ambientesMap = new Map()

  for (let linhaIdx = 0; linhaIdx < linhas.length; linhaIdx += 1) {
    const partesBase = parseLinhaCsvPromob(linhas[linhaIdx])
    const partes = (partesBase.length === 1 && linhas[linhaIdx].includes(';')
      ? String(linhas[linhaIdx]).split(';')
      : partesBase)
      .map((parte) => String(parte || '').trim())

    if (partes.length < 5) continue

    const ambienteNome = String(partes[0] || '').trim()
    const moduloNome = String(partes[1] || '').trim()
    const materialNome = String(partes[2] || '').trim()
    const quantidadeRaw = Number(String(partes[3] || '').replace(/\D/g, '')) || 1
    const dimensaoBruta = String(partes[4] || '').trim()

    const linhaEhCabecalho =
      normalizarTexto(ambienteNome).includes('AMBIENTE') ||
      normalizarTexto(moduloNome).includes('MODULO') ||
      normalizarTexto(moduloNome).includes('ITEM') ||
      normalizarTexto(materialNome).includes('MATERIAL') ||
      normalizarTexto(materialNome).includes('DESCRICAO') ||
      normalizarTexto(String(partes[3] || '')).includes('QUANTIDADE') ||
      normalizarTexto(String(partes[4] || '')).includes('DIMENS') ||
      normalizarTexto(String(partes[4] || '')).includes('TAMANHO')

    if (linhaEhCabecalho) continue
    if (!ambienteNome || !moduloNome || !materialNome) continue

    // Detectar tipo de item (MDF ou Ferragem)
    const tipoItem = identificarTipoItemPromob(dimensaoBruta)

    const ambienteKey = normalizarTexto(ambienteNome || 'Ambiente Promob') || `AMBIENTE_${linhaIdx}`
    if (!ambientesMap.has(ambienteKey)) {
      ambientesMap.set(ambienteKey, { nome: ambienteNome || 'Ambiente Promob', paredes: [] })
    }

    const ambiente = ambientesMap.get(ambienteKey)
    let parede = ambiente.paredes.find((item) => normalizarTexto(item.nome) === 'PAREDE PRINCIPAL')
    if (!parede) {
      parede = {
        nome: 'Parede principal',
        largura_mm: 2800,
        altura_mm: 2700,
        modulos: [],
        ferragens: [],
      }
      ambiente.paredes.push(parede)
    }

    // ─────────────────────────────────────────────
    // MANUSEIO POR TIPO
    // ─────────────────────────────────────────────
    if (tipoItem.tipo === 'ferragem') {
      if (!Array.isArray(parede.ferragens)) parede.ferragens = []
      const ferragem = encontrarFerragemPromob(materialNome)
      upsertFerragemNoModulo(parede, {
        produto_id: ferragem?.id ?? null,
        nome: ferragem?.nome_produto || materialNome,
        nome_original: materialNome,
        quantidade: Math.max(1, quantidadeRaw),
        custo_unitario: Number(ferragem?.valor_unitario || 0),
        nao_encontrada: !ferragem,
      })
      continue
    }

    // MDF: cria card de módulo
    if (!tipoItem.valido || !tipoItem.dimensoes) continue // dimensões inválidas

    const { largura, altura } = tipoItem.dimensoes

    for (let quantidade = 0; quantidade < Math.max(1, quantidadeRaw); quantidade += 1) {
      const novoModulo = {
        nome: moduloNome,
        material_nome: materialNome,
        largura_mm: largura,
        altura_mm: altura,
      }
      parede.modulos.push(novoModulo)
    }
  }

  const ambientes = Array.from(ambientesMap.values())

  return ambientes.map((ambiente, idx) => normalizarAmbientePromob(ambiente, idx))
}

function remapearMateriaisPromob(ambientes = []) {
  return ambientes.map((ambiente, ambIdx) => ({
    ...ambiente,
    _id: ambiente._id || uid(),
    nome: ambiente.nome || `Ambiente ${ambIdx + 1}`,
    paredes: (ambiente.paredes || []).map((parede, paredeIdx) => ({
      ...parede,
      _id: parede._id || uid(),
      nome: parede.nome || `Parede ${paredeIdx + 1}`,
      modulos: (parede.modulos || []).map((modulo) => {
        const materialNome = modulo.material_nome_original || modulo.nome_material || modulo.material_nome || modulo.nome || 'Branco'
        const material = encontrarMaterialPromob(materialNome)
        const materialSelecionadoId = modulo.material_id ?? material?.id ?? null
        const materialSelecionado = materialSelecionadoId != null
          ? materiais.value.find((m) => m.id === materialSelecionadoId)
          : null
        const materialNaoEncontrado = !materialSelecionado
        return {
          ...modulo,
          _id: modulo._id || uid(),
          material_id: materialSelecionadoId,
          material_nao_encontrado: materialNaoEncontrado,
          _ferragens_abertas: Boolean(modulo._ferragens_abertas) || (Array.isArray(modulo.ferragens) && modulo.ferragens.length > 0),
          _ferragemBuscaId: null,
          categoria_importada: inferirCategoriaPromob(materialNome),
          ferragens: Array.isArray(modulo.ferragens) ? modulo.ferragens : [],
        }
      }),
      _ferragemBuscaId: null,
      _ferragens_parede_abertas: parede?._ferragens_parede_abertas !== false,
      ferragens: (Array.isArray(parede.ferragens) ? parede.ferragens : []).map((fer) => {
        const nomeOriginal = fer?.nome_original || fer?.nome || ''
        const ferragemEncontrada = (fer?.produto_id != null)
          ? getFerragemById(fer.produto_id)
          : encontrarFerragemPromob(nomeOriginal)
        return {
          ...novaFerragem(),
          ...fer,
          _id: fer?._id || uid(),
          produto_id: fer?.produto_id ?? ferragemEncontrada?.id ?? null,
          nome: fer?.nome || ferragemEncontrada?.nome_produto || nomeOriginal,
          nome_original: nomeOriginal,
          quantidade: Math.max(1, Number(fer?.quantidade || 1)),
          custo_unitario: Number(fer?.custo_unitario ?? ferragemEncontrada?.valor_unitario ?? 0),
          nao_encontrada: fer?.produto_id != null ? !ferragemEncontrada : !ferragemEncontrada,
        }
      }),
    })),
    ferragens: Array.isArray(ambiente.ferragens) ? ambiente.ferragens : [],
  }))
}

function selecionarOrigemMedida(novaOrigem) {
  origemMedida.value = novaOrigem
  if (novaOrigem === ORIGEM_MEDIDA.PROMOB && !ambientesPromob.value.length) {
    promobMensagem.value = 'Selecione um XML, JSON ou CSV do Promob para preencher a estrutura automaticamente.'
    promobMensagemErro.value = false
  }
}

function abrirUploadPromob() {
  selecionarOrigemMedida(ORIGEM_MEDIDA.PROMOB)
  promobFileInput.value?.click()
}

async function handlePromobUpload(event) {
  const file = event?.target?.files?.[0]
  if (!file) return

  selecionarOrigemMedida(ORIGEM_MEDIDA.PROMOB)
  promobArquivoNome.value = file.name
  promobMensagem.value = 'Processando arquivo do Promob...'
  promobMensagemErro.value = false

  try {
    const texto = await file.text()
    const extensao = String(file.name.split('.').pop() || '').toLowerCase()
    const ambientes = extensao === 'json'
      ? parsePromobJsonSimulado(texto)
      : extensao === 'csv'
        ? parsePromobCsvSimulado(texto)
        : parsePromobXmlSimulado(texto)

    ambientesPromob.value = remapearMateriaisPromob(ambientes)
    promobMensagem.value = `Importação concluída: ${ambientesPromob.value.length} ambiente(s) mapeado(s) automaticamente.`
    promobMensagemErro.value = false
    notify.success('Arquivo do Promob importado com sucesso.')
  } catch (error) {
    ambientesPromob.value = []
    promobMensagem.value = 'Não foi possível ler o arquivo. Revise a estrutura XML, JSON ou CSV e tente novamente.'
    promobMensagemErro.value = true
    notify.error('Falha ao importar arquivo do Promob.')
  } finally {
    if (event?.target) event.target.value = ''
  }
}

// ─── MODO TÉCNICO ───────────────────────────────────────────────
const ambientesTecnico = computed(() =>
  orcamento.value?.agenda_loja?.medicao_orcamento?.ambientes ?? []
)
const temMedicaoTecnico = computed(() => ambientesTecnico.value.length > 0)
const ambientesEditaveis = computed(() =>
  origemMedida.value === ORIGEM_MEDIDA.PROMOB ? ambientesPromob.value : ambientesVendedor.value,
)

// modulosTecnico: chave = `${amb.id}_${parede.id}` → array de módulos
const modulosTecnico = reactive({})

function chaveT(ambId, paredeId) { return `${ambId}_${paredeId}` }

function addModuloTecnico(ambId, paredeId) {
  const k = chaveT(ambId, paredeId)
  if (!modulosTecnico[k]) modulosTecnico[k] = []
  modulosTecnico[k].push(novoModulo())
}

function removerModuloTecnico(ambId, paredeId, mIdx) {
  const k = chaveT(ambId, paredeId)
  modulosTecnico[k]?.splice(mIdx, 1)
}

function areaTecnicoAmbiente(amb) {
  const paredes = Array.isArray(amb.paredes) ? amb.paredes : []
  if (paredes.length) return paredes.reduce((a, p) => a + Number(p.largura_m || 0) * Number(p.pe_direito_m || 0), 0)
  return Number(amb.largura_m || 0) * Number(amb.pe_direito_m || 0)
}

function custoModulosTecnicoParede(ambId, paredeId) {
  return (modulosTecnico[chaveT(ambId, paredeId)] || []).reduce((a, m) => a + custoModulo(m), 0)
}

function custoTecnicoAmbiente(amb) {
  const paredes = Array.isArray(amb.paredes) ? amb.paredes : []
  return paredes.reduce((a, p) => a + custoModulosTecnicoParede(amb.id, p.id), 0)
}

function ocupacaoTecnico(ambId, paredeId, largura_mm_parede) {
  const soma = (modulosTecnico[chaveT(ambId, paredeId)] || []).reduce((a, m) => a + Number(m.largura_mm || 0), 0)
  return { soma, excede: soma > largura_mm_parede }
}

// ─── MODO VENDEDOR ──────────────────────────────────────────────
let _uid = 0
function uid() { return ++_uid }

const ambientesVendedor = ref([])
const ambientesTecnicoOcultos = ref({})
const ambientesEditaveisOcultos = ref({})

function getAmbientesEditaveisRef() {
  return origemMedida.value === ORIGEM_MEDIDA.PROMOB ? ambientesPromob : ambientesVendedor
}

function ambienteOcultoTecnico(ambienteId) {
  return Boolean(ambientesTecnicoOcultos.value[String(ambienteId)])
}

function toggleAmbienteTecnico(ambienteId) {
  const key = String(ambienteId)
  ambientesTecnicoOcultos.value[key] = !ambienteOcultoTecnico(ambienteId)
}

function keyAmbienteEditavel(ambiente, idx) {
  return String(ambiente?._id ?? idx)
}

function ambienteOcultoEditavel(ambiente, idx) {
  return Boolean(ambientesEditaveisOcultos.value[keyAmbienteEditavel(ambiente, idx)])
}

function toggleAmbienteEditavel(ambiente, idx) {
  const key = keyAmbienteEditavel(ambiente, idx)
  ambientesEditaveisOcultos.value[key] = !ambienteOcultoEditavel(ambiente, idx)
}

function novoModulo() {
  return { _id: uid(), nome: '', largura_mm: 0, altura_mm: 0, material_id: null, ferragens: [], _ferragens_abertas: false, _ferragemBuscaId: null }
}

function novaParede() {
  return {
    _id: uid(),
    nome: '',
    largura_mm: 0,
    altura_mm: 0,
    modulos: [novoModulo()],
    ferragens: [],
    _ferragemBuscaId: null,
    _ferragens_parede_abertas: true,
  }
}

function novoAmbiente() {
  return { _id: uid(), nome: '', paredes: [novaParede()] }
}

function addAmbiente() { getAmbientesEditaveisRef().value.push(novoAmbiente()) }
function removerAmbiente(idx) { getAmbientesEditaveisRef().value.splice(idx, 1) }
function addParede(ambIdx) { getAmbientesEditaveisRef().value[ambIdx].paredes.push(novaParede()) }
function removerParede(ambIdx, pIdx) { getAmbientesEditaveisRef().value[ambIdx].paredes.splice(pIdx, 1) }
function addModuloVendedor(ambIdx, pIdx) { getAmbientesEditaveisRef().value[ambIdx].paredes[pIdx].modulos.push(novoModulo()) }
function removerModuloVendedor(ambIdx, pIdx, mIdx) { getAmbientesEditaveisRef().value[ambIdx].paredes[pIdx].modulos.splice(mIdx, 1) }

function areaVendedorAmbiente(amb) {
  return amb.paredes.reduce((a, p) => a + (Number(p.largura_mm) * Number(p.altura_mm)) / 1_000_000, 0)
}

function custoParede(parede) {
  const custoModulos = (parede.modulos || []).reduce((a, m) => a + custoModulo(m), 0)
  return custoModulos + custoFerragensLista(parede.ferragens || [])
}

function custoVendedorAmbiente(amb) {
  return amb.paredes.reduce((a, p) => a + custoParede(p), 0)
}

function ocupacaoVendedor(parede) {
  const soma = parede.modulos.reduce((a, m) => a + Number(m.largura_mm || 0), 0)
  return { soma, excede: parede.largura_mm > 0 && soma > parede.largura_mm }
}

function onSelecionarMaterialModulo(modulo, materialId) {
  const material = materiais.value.find((m) => m.id === materialId) || null
  modulo.material_id = material?.id ?? null
  modulo.material_nao_encontrado = !material
}

const totalMateriaisPromobPendentes = computed(() => {
  if (origemMedida.value !== ORIGEM_MEDIDA.PROMOB) return 0
  return ambientesPromob.value.reduce((sAmb, amb) => sAmb + (amb.paredes || []).reduce((sPar, parede) => sPar + (parede.modulos || []).reduce((sMod, mod) => {
    const semMaterial = !(mod.material_id != null)
    return sMod + (semMaterial ? 1 : 0)
  }, 0), 0), 0)
})

const temMateriaisPromobPendentes = computed(() => totalMateriaisPromobPendentes.value > 0)
const podeFinalizarOrcamento = computed(() => !loading.value && !finalizandoOrcamento.value && !temMateriaisPromobPendentes.value)

// ─── Totais ─────────────────────────────────────────────────────
const margemLucroPct = ref(30)
const custosFixos = reactive({
  cola: 0,
  parafusos: 0,
  frete: 0,
  montagem: 0,
  marcenaria: 0,
})

const totalAreaM2 = computed(() => {
  if (origemMedida.value === ORIGEM_MEDIDA.TECNICO) return ambientesTecnico.value.reduce((a, amb) => a + areaTecnicoAmbiente(amb), 0)
  return ambientesEditaveis.value.reduce((a, amb) => a + areaVendedorAmbiente(amb), 0)
})

const totalInsumosFixos = computed(() => Number(custosFixos.cola || 0) + Number(custosFixos.parafusos || 0))
const totalCustosOperacionais = computed(() => Number(custosFixos.frete || 0) + Number(custosFixos.montagem || 0) + Number(custosFixos.marcenaria || 0))
const totalCustosFixos = computed(() => totalInsumosFixos.value + totalCustosOperacionais.value)

function resumoTecnicoAmbiente(amb) {
  const paredes = Array.isArray(amb.paredes) ? amb.paredes : []
  let mdfM2 = 0
  let custoMdf = 0
  let ferragensUn = 0
  let custoFerragens = 0
  paredes.forEach((parede) => {
    const mods = modulosTecnico[chaveT(amb.id, parede.id)] || []
    mods.forEach((mod) => {
      mdfM2 += areaModuloM2(mod)
      custoMdf += custoMdfModulo(mod)
      ferragensUn += quantidadeFerragensModulo(mod)
      custoFerragens += custoFerragensModulo(mod)
    })
  })
  return {
    id: `T_${amb.id}`,
    nome: amb.nome_ambiente || `Ambiente #${amb.id}`,
    area: areaTecnicoAmbiente(amb),
    mdfM2,
    ferragensUn,
    custoMdf,
    custoFerragens,
  }
}

function resumoVendedorAmbiente(amb, idx) {
  let mdfM2 = 0
  let custoMdf = 0
  let ferragensUn = 0
  let custoFerragens = 0
  amb.paredes.forEach((parede) => {
    parede.modulos.forEach((mod) => {
      mdfM2 += areaModuloM2(mod)
      custoMdf += custoMdfModulo(mod)
      ferragensUn += quantidadeFerragensModulo(mod)
      custoFerragens += custoFerragensModulo(mod)
    })
    ferragensUn += quantidadeFerragensLista(parede.ferragens || [])
    custoFerragens += custoFerragensLista(parede.ferragens || [])
  })
  return {
    id: `V_${amb._id || idx}`,
    nome: amb.nome || `Ambiente ${idx + 1}`,
    area: areaVendedorAmbiente(amb),
    mdfM2,
    ferragensUn,
    custoMdf,
    custoFerragens,
  }
}

const resumoAmbientes = computed(() => {
  const baseRows = origemMedida.value === ORIGEM_MEDIDA.TECNICO
    ? ambientesTecnico.value.map((amb) => resumoTecnicoAmbiente(amb))
    : ambientesEditaveis.value.map((amb, idx) => resumoVendedorAmbiente(amb, idx))

  const areaTotal = Number(totalAreaM2.value || 0)
  return baseRows.map((row) => {
    const custoBase = row.custoMdf + row.custoFerragens
    const rateio = areaTotal > 0 ? totalCustosFixos.value * (row.area / areaTotal) : 0
    const custoComRateio = custoBase + rateio
    const lucroReal = custoComRateio * (Number(margemLucroPct.value || 0) / 100)
    const valorVenda = custoComRateio + lucroReal
    return { ...row, custoBase, rateio, lucroReal, valorVenda }
  })
})

const totalCustoBase = computed(() => resumoAmbientes.value.reduce((a, r) => a + r.custoBase, 0))
const totalCusto = computed(() => totalCustoBase.value + totalCustosFixos.value)
const lucroRealTotal = computed(() => resumoAmbientes.value.reduce((a, r) => a + r.lucroReal, 0))

const precoVenda = computed(() => resumoAmbientes.value.reduce((a, r) => a + r.valorVenda, 0))

const DESCONTO_MAXIMO_PERCENTUAL = Number(VENDA_FECHAMENTO_REGRAS?.DESCONTO_MAXIMO_PERCENTUAL || 0)
const LIMITE_DESCONTO_RESTRINGIR_PAGAMENTO = Number(
  VENDA_FECHAMENTO_REGRAS?.LIMITE_DESCONTO_RESTRINGIR_PAGAMENTO_PERCENTUAL || 7,
)
const FORMAS_REMOVIDAS_FECHAMENTO = new Set(
  (VENDA_FECHAMENTO_REGRAS?.FORMAS_REMOVIDAS_FECHAMENTO || []).map((x) => String(x || '').toUpperCase()),
)
const FORMAS_PERMITIDAS_ACIMA_LIMITE = new Set(
  (VENDA_FECHAMENTO_REGRAS?.FORMAS_PERMITIDAS_ACIMA_LIMITE_DESCONTO || []).map((x) => String(x || '').toUpperCase()),
)
const PARCELAS_MAX_POR_FORMA = VENDA_FECHAMENTO_REGRAS?.PARCELAS_MAX_POR_FORMA || {}
const PARCELAS_OPCOES = (VENDA_FECHAMENTO_REGRAS?.PARCELAS_OPCOES || [1]).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)

const descontoFechamentoPct = ref(0)

function clampDescontoFechamento(valor) {
  const n = Number(valor || 0)
  if (!Number.isFinite(n) || n < 0) return 0
  if (n > DESCONTO_MAXIMO_PERCENTUAL) return DESCONTO_MAXIMO_PERCENTUAL
  return n
}

function formaPagamentoPermitidaPorDesconto(chave) {
  const key = String(chave || '').toUpperCase()
  if (!key) return true
  if (FORMAS_REMOVIDAS_FECHAMENTO.has(key)) return false
  if (Number(descontoFechamentoPct.value || 0) >= LIMITE_DESCONTO_RESTRINGIR_PAGAMENTO) {
    return FORMAS_PERMITIDAS_ACIMA_LIMITE.has(key)
  }
  return true
}

const FORMAS_PAGAMENTO_OPTIONS = computed(() =>
  (FORMAS_PAGAMENTO || [])
    .filter((x) => formaPagamentoPermitidaPorDesconto(x.key))
    .map((x) => ({ label: x.label, value: x.key })),
)

function maxParcelasDaForma(forma) {
  const key = String(forma || '').toUpperCase()
  if (!key) return 1
  return Number(PARCELAS_MAX_POR_FORMA?.[key] || 1)
}

function parcelasOptionsDaForma(forma) {
  const max = maxParcelasDaForma(forma)
  const base = PARCELAS_OPCOES.length ? PARCELAS_OPCOES : [1]
  const filtradas = base.filter((n) => n <= max)
  if (filtradas.length) return filtradas
  return [Math.max(1, max)]
}

function novaLinhaPagamento() {
  return {
    forma_pagamento_chave: '',
    parcelas: 1,
    valor: 0,
  }
}

const pagamentosFechamento = ref([novaLinhaPagamento()])

function addPagamento() {
  pagamentosFechamento.value.push(novaLinhaPagamento())
}

function removerPagamento(idx) {
  pagamentosFechamento.value.splice(idx, 1)
  if (!pagamentosFechamento.value.length) pagamentosFechamento.value.push(novaLinhaPagamento())
}

function getFormasPagamentoOptionsForRow(rowIdx) {
  const list = pagamentosFechamento.value || []
  const jaTemCredito = list.some(
    (p, i) => i !== rowIdx && String(p?.forma_pagamento_chave || '').toUpperCase() === 'CREDITO',
  )
  const base = FORMAS_PAGAMENTO_OPTIONS.value || []
  if (!jaTemCredito) return base
  return base.filter((opt) => String(opt?.value || '').toUpperCase() !== 'CREDITO')
}

function normalizarPagamentoLinha(linha, rowIdx) {
  if (!linha) return
  descontoFechamentoPct.value = clampDescontoFechamento(descontoFechamentoPct.value)
  const forma = String(linha.forma_pagamento_chave || '').toUpperCase()

  if (forma && !formaPagamentoPermitidaPorDesconto(forma)) {
    linha.forma_pagamento_chave = ''
    linha.parcelas = 1
  }

  const disponiveis = new Set(getFormasPagamentoOptionsForRow(rowIdx).map((x) => String(x.value || '').toUpperCase()))
  if (forma && !disponiveis.has(forma)) {
    linha.forma_pagamento_chave = ''
    linha.parcelas = 1
  }

  const max = maxParcelasDaForma(linha.forma_pagamento_chave)
  const parcelas = Number(linha.parcelas || 1)
  linha.parcelas = Number.isFinite(parcelas) ? Math.max(1, Math.min(Math.floor(parcelas), max)) : 1
  linha.valor = Number.isFinite(Number(linha.valor)) ? Number(linha.valor) : 0
}

function onChangeDescontoFechamento() {
  descontoFechamentoPct.value = clampDescontoFechamento(descontoFechamentoPct.value)
  pagamentosFechamento.value.forEach((linha, idx) => normalizarPagamentoLinha(linha, idx))
}

const totalPagamentoInformado = computed(() =>
  (pagamentosFechamento.value || []).reduce((acc, linha) => acc + Number(linha?.valor || 0), 0),
)

const saldoPagamento = computed(() => Number(precoVenda.value || 0) - Number(totalPagamentoInformado.value || 0))

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}

function mapearAmbientesParaFinalizacao() {
  if (origemMedida.value === ORIGEM_MEDIDA.TECNICO) {
    return ambientesTecnico.value.map((amb) => {
      const paredes = Array.isArray(amb.paredes) ? amb.paredes : []
      const itens = paredes.flatMap((parede) => {
        const mods = modulosTecnico[chaveT(amb.id, parede.id)] || []
        return mods.map((mod) => ({
          descricao: mod.nome || 'Módulo',
          material: getMaterialById(mod.material_id)?.nome_produto || mod.material_nome_original || '',
          quantidade: 1,
          area_m2: areaModuloM2(mod),
          custo_unitario: getCustoM2ByMaterial(mod.material_id),
          preco_unitario: getCustoM2ByMaterial(mod.material_id),
          origem: 'TECNICO',
        }))
      })

      return {
        nome: amb.nome_ambiente || `Ambiente ${amb.id}`,
        medidaVendedor: {
          largura_m: Number(amb.largura_m || 0),
          altura_m: Number(amb.pe_direito_m || 0),
          profundidade_m: Number(amb.profundidade_m || 0),
        },
        medidaTecnica: {
          largura_m: Number(amb.largura_m || 0),
          altura_m: Number(amb.pe_direito_m || 0),
          profundidade_m: Number(amb.profundidade_m || 0),
        },
        itens,
      }
    })
  }

  return ambientesEditaveis.value.map((amb, idx) => {
    const itens = (amb.paredes || []).flatMap((parede) => (parede.modulos || []).map((mod) => ({
      descricao: mod.nome || 'Módulo',
      material: getMaterialById(mod.material_id)?.nome_produto || mod.material_nome_original || '',
      quantidade: 1,
      area_m2: areaModuloM2(mod),
      custo_unitario: getCustoM2ByMaterial(mod.material_id),
      preco_unitario: getCustoM2ByMaterial(mod.material_id),
      origem: origemMedida.value,
    })))

    return {
      id: amb._id || idx,
      nome: amb.nome || `Ambiente ${idx + 1}`,
      medidaVendedor: {
        largura_m: 0,
        altura_m: 0,
        profundidade_m: 0,
      },
      medidaTecnica: {
        largura_m: 0,
        altura_m: 0,
        profundidade_m: 0,
      },
      itens,
    }
  })
}

async function finalizarOrcamentoAtual() {
  if (!id.value || !podeFinalizarOrcamento.value) return
  finalizandoOrcamento.value = true
  try {
    const ambientes = mapearAmbientesParaFinalizacao()
    await OrcamentoTecnicoService.finalizar(id.value, { ambientes })
    notify.success('Orçamento finalizado com sucesso.')
    await carregar()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Não foi possível finalizar o orçamento.')
  } finally {
    finalizandoOrcamento.value = false
  }
}

// ─── Carregar orçamento ─────────────────────────────────────────
async function carregar() {
  if (!id.value) { erro.value = 'ID não informado.'; loading.value = false; return }
  loading.value = true
  erro.value = ''
  try {
    const resOrc = await OrcamentoTecnicoService.buscar(id.value)
    orcamento.value = resOrc?.data ?? resOrc ?? null
    if (!orcamento.value?.agenda_loja?.medicao_orcamento?.ambientes?.length) {
      origemMedida.value = ORIGEM_MEDIDA.VENDEDOR
      ambientesVendedor.value = [novoAmbiente()]
    }
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Não foi possível carregar o orçamento técnico.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  try {
    const perdaSalva = Number(localStorage.getItem('orcamento_tecnico.perda_tecnica_pct') || 0)
    if (Number.isFinite(perdaSalva) && perdaSalva >= 0) {
      perdaTecnicaPct.value = perdaSalva
    }
  } catch (_) {
    // ignore localStorage errors
  }

  carregar()
  carregarCatalogosEstrategia()
})
</script>
