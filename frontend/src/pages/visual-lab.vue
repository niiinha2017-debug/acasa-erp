<template>
  <div class="visual-lab h-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-900">
    <!-- Header fixo no topo -->
    <header class="flex-shrink-0 flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <h1 class="text-lg font-bold text-slate-800 dark:text-slate-100">
        Visual Lab — Teste 2D / 3D (Tauri)
      </h1>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Página isolada, sem vínculo com banco de dados.
      </p>
    </header>

    <!-- Abas -->
    <div class="flex-shrink-0 flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
      <button
        type="button"
        class="px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="tabAtiva === '2d'
          ? 'border-brand-primary text-brand-primary'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
        @click="tabAtiva = '2d'"
      >
        2D (Konva.js)
      </button>
      <button
        type="button"
        class="px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="tabAtiva === '3d'
          ? 'border-brand-primary text-brand-primary'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
        @click="tabAtiva = '3d'"
      >
        3D (Three.js)
      </button>
    </div>

    <!-- Área de desenho: 100% do espaço restante, sem scroll -->
    <div class="canvas-area flex-1 flex flex-col min-h-0 overflow-hidden">
      <!-- Conteúdo 2D (vue-konva) -->
      <template v-if="tabAtiva === '2d'">
        <div class="flex-shrink-0 flex flex-wrap items-center gap-3 px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-sm font-medium transition-opacity"
            :class="aguardandoCliqueParede ? 'bg-[var(--ds-color-warning-500)] text-white hover:opacity-90' : 'bg-brand-primary text-white hover:opacity-90'"
            @click="aguardandoCliqueParede ? (aguardandoCliqueParede = false) : (aguardandoCliqueParede = true)"
          >
            {{ aguardandoCliqueParede ? 'Clique em uma parede para posicionar (ou aqui para cancelar)' : 'Adicionar Módulo' }}
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-[var(--ds-color-success-600)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            @click="salvarAmbiente"
          >
            Salvar Projeto
          </button>
          <button
            type="button"
            class="px-3 py-2 rounded-xl border border-[var(--ds-color-warning-500)] text-[var(--ds-color-warning-700)] text-sm font-medium hover:bg-[var(--ds-color-warning-50)]"
            @click="adicionarPontoTecnico('tomada')"
          >
            + Tomada
          </button>
          <button
            type="button"
            class="px-3 py-2 rounded-xl border border-sky-500 text-sky-700 dark:text-sky-300 text-sm font-medium hover:bg-sky-50 dark:hover:bg-sky-950/30"
            @click="adicionarPontoTecnico('ponto_agua')"
          >
            + Ponto de Água
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors"
            :class="modoDesenhoParede ? 'border-[var(--ds-color-warning-500)] bg-[var(--ds-color-warning-500)] text-white' : 'border-slate-400 dark:border-slate-500 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'"
            @click="toggleModoDesenhoParede"
          >
            Desenhar Parede
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-slate-600 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="listaPontos.length < 3 || ambienteFechado"
            @click="fecharAmbiente"
          >
            Fechar Ambiente
          </button>
          <span class="text-xs text-slate-500 dark:text-slate-400">
            Módulos (L×P). Tomada/Ponto de água no canvas; em Medição Fina posicione se o módulo passar na frente.
          </span>
        </div>
        <div class="flex-1 flex min-h-0">
          <div
            ref="stageContainer2d"
            class="visual-lab-2d-stage canvas-area-stage flex-1 min-w-0 min-h-0 overflow-hidden touch-none bg-white dark:bg-slate-800 relative"
            :class="{ 'cursor-crosshair': aguardandoCliqueParede || modoDesenhoParede }"
            @wheel="onStageWheel"
            @touchstart.passive="onStageTouchStart"
            @touchmove.passive="onStageTouchMove"
            @touchend.passive="onStageTouchEnd"
          >
          <v-stage
            v-if="stageWidth > 0 && stageHeight > 0"
            :config="stageConfig"
          >
            <!-- Viewport: pan + zoom; grid, módulo e cotas dentro (único grupo arrastável) -->
            <v-layer>
              <v-group :config="viewportGroupConfig">
                <v-rect v-if="gridPatternImage" :config="gridRectConfig" />
                <!-- Contorno: retângulo fixo (4 paredes) OU polígono de alvenaria (listaPontos) -->
                <template v-if="listaPontos.length === 0">
                  <v-group :config="{ name: 'camadaEstrutura' }">
                    <v-group
                      v-for="borda in ['norte', 'sul', 'leste', 'oeste']"
                      :key="'parede-' + borda"
                      :config="getParedeGroupConfig(borda)"
                    >
                      <v-line :config="getParedeLineConfig(borda)" />
                    </v-group>
                  </v-group>
                </template>
                <template v-else>
                  <!-- Segmentos do polígono (espessura do painel) -->
                  <v-group :config="{ name: 'alvenariaSegmentos' }">
                    <v-line
                      v-for="seg in segmentosAlvenaria"
                      :key="'seg-' + seg.i + '-' + seg.j"
                      :config="getSegmentoLineConfig(seg.i, seg.j) || {}"
                    />
                  </v-group>
                  <!-- Quinas arrastáveis -->
                  <v-group
                    v-for="(pt, idx) in listaPontos"
                    :key="'vert-' + idx"
                    :config="getVerticeGroupConfig(idx)"
                  >
                    <v-circle :config="getVerticeCircleConfig(idx)" />
                  </v-group>
                  <!-- Label flutuante em mm ao arrastar vértice -->
                  <v-text
                    v-if="cotaVerticeFlutuanteConfig"
                    :config="cotaVerticeFlutuanteConfig"
                  />
                </template>
                <!-- Módulos dinâmicos: ordenados para z-index (selecionado por cima) -->
                <v-group
                  v-for="mod in modulosOrdenadosParaZIndex"
                  :key="mod.id"
                  :config="getModuloGroupConfig(mod)"
                  @click="onModuloClick($event, mod)"
                >
                  <v-text :config="getModuloCotaLarguraConfig(mod)" />
                  <v-rect :config="getModuloRectConfig(mod)" />
                  <v-text :config="getModuloLabelConfig(mod)" />
                </v-group>
                <!-- Pontos técnicos (Tomada, Ponto de Água) -->
                <v-group
                  v-for="pt in pontosTecnicos"
                  :key="pt.id"
                  :config="getPontoTecnicoGroupConfig(pt)"
                  @click="onPontoTecnicoClick($event, pt)"
                >
                  <v-circle :config="getPontoTecnicoCircleConfig(pt)" />
                  <v-text :config="getPontoTecnicoLabelConfig(pt)" />
                </v-group>
                <!-- Captura de clique para adicionar ponto (sempre no topo quando modo Desenhar Parede ativo; mousedown para trackpad) -->
                <v-rect
                  v-if="modoDesenhoParede"
                  :config="rectCliqueAlvenariaConfig"
                  @mousedown="addPontoAlvenaria"
                />
                <!-- Cotas dinâmicas: módulo selecionado -->
                <template v-if="moduloSelecionado && cotaLeftConfig">
                  <v-arrow :config="cotaLeftConfig" />
                  <v-arrow :config="cotaTopConfig" />
                  <v-text v-if="cotaLeftLabelConfig" :config="cotaLeftLabelConfig" />
                  <v-text v-if="cotaTopLabelConfig" :config="cotaTopLabelConfig" />
                </template>
                <!-- Cotas automáticas: ponto técnico selecionado (até parede e até chão) -->
                <template v-if="pontoTecnicoSelecionado && cotaPontoEsquerdaConfig">
                  <v-arrow :config="cotaPontoEsquerdaConfig" />
                  <v-arrow :config="cotaPontoTopoConfig" />
                  <v-arrow v-if="cotaPontoChaoConfig" :config="cotaPontoChaoConfig" />
                  <v-text v-if="cotaPontoEsquerdaLabelConfig" :config="cotaPontoEsquerdaLabelConfig" />
                  <v-text v-if="cotaPontoTopoLabelConfig" :config="cotaPontoTopoLabelConfig" />
                  <v-text v-if="cotaPontoChaoLabelConfig" :config="cotaPontoChaoLabelConfig" />
                </template>
              </v-group>
            </v-layer>
            <!-- Réguas fixas: fora do grupo de zoom/pan; faixa fixa no topo (0..largura) e esquerda (0..altura); números e traços usam viewportScale/pan para sincronia -->
            <v-layer :config="{ listening: false }">
              <v-rect :config="rulerBgTopConfig" />
              <v-rect :config="rulerBgLeftConfig" />
              <template v-for="(cfg, i) in rulerTicksFixed" :key="'rt-' + i">
                <v-line :config="{ ...cfg, listening: false }" />
              </template>
              <template v-for="(cfg, i) in rulerLabelsFixed" :key="'rl-' + i">
                <v-text :config="{ ...cfg, listening: false }" />
              </template>
              <v-line :config="rulerBorderVConfig" />
              <v-line :config="rulerBorderHConfig" />
            </v-layer>
          </v-stage>
          <!-- Botão flutuante: Resetar Visão (zoom 1:1 + centralizar) -->
          <button
            type="button"
            class="absolute bottom-4 right-4 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-10"
            @click="resetarVisao"
          >
            Resetar Visão
          </button>
          </div>
          <div class="w-56 flex-shrink-0 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs overflow-auto space-y-4">
            <div>
              <p class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Modo</p>
              <div class="flex items-center gap-2">
                <span class="text-slate-500 dark:text-slate-400">Orçamento</span>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="modoMedicaoFina"
                  class="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                  :class="modoMedicaoFina ? 'bg-[var(--ds-color-warning-500)]' : 'bg-slate-300 dark:bg-slate-600'"
                  @click="modoMedicaoFina = !modoMedicaoFina"
                >
                  <span
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition"
                    :class="modoMedicaoFina ? 'translate-x-5' : 'translate-x-1'"
                  />
                </button>
                <span class="text-slate-500 dark:text-slate-400">Medição Fina</span>
              </div>
              <p class="mt-1 text-slate-400 dark:text-slate-500">
                {{ modoMedicaoFina ? 'Fase técnica: bordas em laranja; conferência de paredes e folga.' : 'Fase comercial (orçamento).' }}
              </p>
            </div>
            <div>
              <p class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Ambiente (sala)</p>
              <div class="space-y-2">
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Largura L (mm)</label>
                  <input
                    v-model.number="dimensoesSala.largura_mm"
                    type="number"
                    min="100"
                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Profundidade P (mm)</label>
                  <input
                    v-model.number="dimensoesSala.profundidade_mm"
                    type="number"
                    min="100"
                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Espessura da Alvenaria (mm)</label>
                  <input
                    v-model.number="espessuraAlvenariaMm"
                    type="number"
                    min="0"
                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Pé-Direito da Sala (mm)</label>
                  <input
                    v-model.number="peDireitoSalaMm"
                    type="number"
                    min="500"
                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                  <p class="mt-0.5 text-slate-400 dark:text-slate-500 text-xs">Altura das paredes; sombra na planta e JSON herdam este valor.</p>
                </div>
              </div>
              <p class="mt-1 text-slate-400 dark:text-slate-500">Paredes com espessura; o traço fica para fora. Área útil interna continua L×P.</p>
              <p class="mt-1 text-slate-500 dark:text-slate-400 font-medium">Clique em uma parede para selecionar e ajustar esquadro/comprimento. Marque «Vão livre» para tracejado e sem snap.</p>
            </div>
            <div v-if="paredeSelecionada" class="border-t border-slate-200 dark:border-slate-600 pt-3">
              <p class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Parede {{ labelParede(paredeSelecionada) }}</p>
              <div class="space-y-2">
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Comprimento (mm)</label>
                  <input
                    v-model.number="comprimentoParedeSelecionada"
                    type="number"
                    min="100"
                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Espessura (mm)</label>
                  <input
                    v-model.number="espessuraAlvenariaMm"
                    type="number"
                    min="0"
                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Ângulo do Esquadro (°)</label>
                  <input
                    v-model.number="paredesAjustes[paredeSelecionada].anguloEsquadro"
                    type="number"
                    step="0.1"
                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                    placeholder="0 = 90°"
                  />
                  <p class="mt-0.5 text-slate-400 dark:text-slate-500 text-xs">Positivo = abrindo; negativo = fechando em relação ao projeto.</p>
                </div>
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Comprimento Real (mm)</label>
                  <input
                    v-model.number="paredesAjustes[paredeSelecionada].comprimentoReal"
                    type="number"
                    min="1"
                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                    :placeholder="comprimentoPadraoParede(paredeSelecionada)"
                  />
                </div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="vaolivreParedeSelecionada"
                    type="checkbox"
                    class="rounded border-slate-300 dark:border-slate-600"
                  />
                  <span class="text-slate-600 dark:text-slate-300 text-sm">Vão livre (tracejado, sem snap)</span>
                </label>
              </div>
            </div>
            <template v-if="modoMedicaoFina">
              <div class="border-t border-slate-200 dark:border-slate-600 pt-3">
                <p class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Medida de Conferência (paredes)</p>
                <p class="text-slate-400 dark:text-slate-500 mb-2">Medida real no local; diferença em relação ao orçamento é destacada.</p>
                <div class="space-y-2">
                  <div>
                    <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Largura (mm)</label>
                    <input
                      v-model.number="conferenciaParedes.largura_mm"
                      type="number"
                      min="1"
                      placeholder="Ex: 3005"
                      class="w-full rounded-lg border px-2 py-1.5 text-sm"
                      :class="diferencaConferenciaLargura !== null && diferencaConferenciaLargura !== 0
                        ? 'border-[var(--ds-color-warning-500)] bg-[var(--ds-color-warning-50)]'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'"
                    />
                    <p v-if="diferencaConferenciaLargura !== null && diferencaConferenciaLargura !== 0" class="mt-1 font-medium" :class="diferencaConferenciaLargura > 0 ? 'text-[var(--ds-color-warning-600)]' : 'text-[var(--ds-color-warning-700)]'">
                      {{ diferencaConferenciaLargura > 0 ? '+' : '' }}{{ diferencaConferenciaLargura }} mm em relação ao orçamento
                    </p>
                  </div>
                  <div>
                    <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Profundidade (mm)</label>
                    <input
                      v-model.number="conferenciaParedes.profundidade_mm"
                      type="number"
                      min="1"
                      placeholder="Ex: 2502"
                      class="w-full rounded-lg border px-2 py-1.5 text-sm"
                      :class="diferencaConferenciaProfundidade !== null && diferencaConferenciaProfundidade !== 0
                        ? 'border-[var(--ds-color-warning-500)] bg-[var(--ds-color-warning-50)]'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'"
                    />
                    <p v-if="diferencaConferenciaProfundidade !== null && diferencaConferenciaProfundidade !== 0" class="mt-1 font-medium" :class="diferencaConferenciaProfundidade > 0 ? 'text-[var(--ds-color-warning-600)]' : 'text-[var(--ds-color-warning-700)]'">
                      {{ diferencaConferenciaProfundidade > 0 ? '+' : '' }}{{ diferencaConferenciaProfundidade }} mm em relação ao orçamento
                    </p>
                  </div>
                </div>
              </div>
              <div class="border-t border-slate-200 dark:border-slate-600 pt-3">
                <p class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Folga de Instalação</p>
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Folga (mm)</label>
                  <input
                    v-model.number="folgaInstalacaoMm"
                    type="number"
                    min="0"
                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                  <p class="mt-1 text-slate-400 dark:text-slate-500">Descontada da largura final do módulo no cálculo de peças (fechamento lateral).</p>
                </div>
              </div>
              <!-- Placeholder: captura de medida via foto (só quando uma parede está selecionada) -->
              <div v-if="paredeSelecionada" class="border-t border-slate-200 dark:border-slate-600 pt-3">
                <p class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Captura por foto</p>
                <p class="text-slate-400 dark:text-slate-500 mb-2 text-xs">Simula o recebimento da medida da parede {{ labelParede(paredeSelecionada) }} e atualiza o comprimento no canvas.</p>
                <button
                  type="button"
                  class="w-full px-3 py-2 rounded-lg bg-[var(--ds-color-warning-500)] hover:bg-[var(--ds-color-warning-600)] text-white text-sm font-medium transition-colors"
                  @click="simularCapturaMedidaFoto"
                >
                  Capturar Medida via Foto
                </button>
              </div>
            </template>
            <div class="border-t border-slate-200 dark:border-slate-600 pt-3">
              <p class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Cotas</p>
              <template v-if="moduloSelecionado">
                <p class="space-y-1 text-slate-600 dark:text-slate-300">
                  <span class="block">Distância Esquerda: {{ distEsquerdaMm }} mm</span>
                  <span class="block">Distância Topo: {{ distTopoMm }} mm</span>
                </p>
                <p v-if="modoMedicaoFina && moduloCobrePontoTecnico" class="mt-2 text-[var(--ds-color-warning-600)] text-xs font-medium">
                  Atenção: este módulo está sobre um ponto técnico (tomada/ponto de água). Posicione o ponto no canvas.
                </p>
              </template>
              <template v-else-if="pontoTecnicoSelecionado">
                <p class="font-medium text-slate-600 dark:text-slate-300 mb-1">{{ pontoTecnicoSelecionado.tipo === 'tomada' ? 'Tomada' : 'Ponto de Água' }}</p>
                <p class="font-semibold text-slate-700 dark:text-slate-200 mb-1">Cota automática</p>
                <p class="space-y-1 text-slate-600 dark:text-slate-300">
                  <span class="block">Até parede esquerda: {{ cotaPontoEsquerdaMm }} mm</span>
                  <span class="block">Até topo (eixo Y): {{ cotaPontoTopoMm }} mm</span>
                  <span class="block">Até parede direita: {{ cotaPontoDireitaMm }} mm</span>
                  <span class="block">Até chão (eixo Y): {{ cotaPontoChaoMm }} mm</span>
                  <span class="block mt-1 font-medium">Parede mais próxima: {{ cotaPontoParedeMaisProximaMm }} mm</span>
                </p>
                <p v-if="modoMedicaoFina && pontoDentroDeModulo" class="mt-2 text-[var(--ds-color-warning-600)] text-xs font-medium">
                  Este ponto está sob um módulo. Em Medição Fina é obrigatório posicioná-lo.
                </p>
              </template>
              <p v-else class="text-slate-400 dark:text-slate-500">
                Clique em um módulo ou em um ponto técnico para ver cotas.
              </p>
            </div>
            <div v-if="moduloSelecionado" class="border-t border-slate-200 dark:border-slate-600 pt-3">
              <p class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Tipo e explosão</p>
              <div class="space-y-2 mb-3">
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Tipo do módulo</label>
                  <select
                    v-model="tipoModuloModel"
                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  >
                    <option value="balcao_simples">Balcão simples</option>
                  </select>
                </div>
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Profundidade (mm)</label>
                  <input
                    v-model.number="profundidadeModuloModel"
                    type="number"
                    min="18"
                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Altura do Piso (Z) mm</label>
                  <input
                    v-model.number="alturaPisoZModuloModel"
                    type="number"
                    min="0"
                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                  <p class="mt-0.5 text-slate-400 dark:text-slate-500 text-xs">0 = chão; ex.: 1500 = armário aéreo.</p>
                  <button
                    type="button"
                    class="mt-1 w-full px-2 py-1.5 rounded-lg border border-[var(--ds-color-warning-500)] text-[var(--ds-color-warning-700)] text-xs font-medium hover:bg-[var(--ds-color-warning-50)]"
                    @click="definirArmarioAereo"
                  >
                    Definir como armário aéreo (1500 mm)
                  </button>
                </div>
              </div>
              <p class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Medição Fina</p>
              <div class="space-y-2">
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Largura (mm)</label>
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      class="flex-shrink-0 w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                      aria-label="Menos 5 mm"
                      @click="ajustarMedida('largura_mm', -5)"
                    >
                      −5
                    </button>
                    <input
                      v-model.number="moduloSelecionado.largura_mm"
                      type="number"
                      min="1"
                      class="flex-1 min-w-0 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      class="flex-shrink-0 w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                      aria-label="Mais 5 mm"
                      @click="ajustarMedida('largura_mm', 5)"
                    >
                      +5
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-slate-500 dark:text-slate-400 mb-0.5">Altura (mm)</label>
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      class="flex-shrink-0 w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                      aria-label="Menos 5 mm"
                      @click="ajustarMedida('altura_mm', -5)"
                    >
                      −5
                    </button>
                    <input
                      v-model.number="moduloSelecionado.altura_mm"
                      type="number"
                      min="1"
                      class="flex-1 min-w-0 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      class="flex-shrink-0 w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                      aria-label="Mais 5 mm"
                      @click="ajustarMedida('altura_mm', 5)"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
              <p class="mt-1.5 text-slate-400 dark:text-slate-500">Ajuste fino +5/−5 mm no tablet. Redimensiona em tempo real (1px = 1mm).</p>
            </div>
          </div>
        </div>
      </template>

      <!-- Conteúdo 3D -->
      <div v-show="tabAtiva === '3d'" class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div class="flex-shrink-0 flex flex-wrap items-end gap-4 px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div class="flex items-center gap-2">
          <label class="text-xs font-medium text-slate-600 dark:text-slate-300">Largura (mm)</label>
          <input
            v-model.number="dims3d.largura"
            type="number"
            min="1"
            class="w-20 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
          />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs font-medium text-slate-600 dark:text-slate-300">Altura (mm)</label>
          <input
            v-model.number="dims3d.altura"
            type="number"
            min="1"
            class="w-20 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
          />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs font-medium text-slate-600 dark:text-slate-300">Profundidade (mm)</label>
          <input
            v-model.number="dims3d.profundidade"
            type="number"
            min="1"
            class="w-20 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          class="px-4 py-2 rounded-xl bg-[var(--ds-color-warning-600)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          @click="gerarCubo3D"
        >
          Gerar Cubo 3D (MDF)
        </button>
        </div>
        <div
          ref="stageContainer3d"
          class="flex-1 min-h-0 min-w-0 overflow-hidden bg-slate-900"
        />
        <p class="flex-shrink-0 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          Arraste para rotacionar • Scroll para zoom (OrbitControls).
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { getThreeConfig } from '@/utils/platform'

definePage({ meta: { public: true } })

const tabAtiva = ref('2d')

// —— 2D (vue-konva) ——
const stageContainer2d = ref(null)
const stageWidth = ref(800)
const stageHeight = ref(500)
const pixelRatio = ref(typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1)

const STEP_MM_10 = 10
const STEP_MM_100 = 100
const RULER_MM = 32

/** Espessura padrão do MDF (mm) — usada no cálculo de peças (explosão). */
const ESPESSURA_MDF_MM = 18

// Dimensões da sala (ambiente base); contorno no canvas com snap nas bordas internas
const dimensoesSala = ref({ largura_mm: 3000, profundidade_mm: 2500 })

// Espessura da alvenaria (mm) — stroke do contorno desenhado para fora; área interna permanece L×P
const espessuraAlvenariaMm = ref(150)

// Pé-direito global da sala (mm) — altura das paredes; sombra 2D e JSON herdam este valor
const peDireitoSalaMm = ref(2600)

// Bordas em vão livre (true = linha tracejada, sem snap/colisão); false = parede sólida
const bordasVaoLivre = ref({ norte: false, sul: false, leste: false, oeste: false })

// Parede selecionada (norte/sul/leste/oeste) para ajustes de esquadro e comprimento real
const paredeSelecionada = ref(/** @type {null | 'norte' | 'sul' | 'leste' | 'oeste'} */ (null))

// Modo inserção: após clicar em 'Adicionar Módulo', aguarda clique em uma parede para nascer grudado
const aguardandoCliqueParede = ref(false)

// Modo Desenho de Alvenaria: polígono livre por pontos (dentes, cantos etc.)
const listaPontos = ref(/** @type {Array<{ x: number, y: number }>} */ ([]))
const ambienteFechado = ref(false)
const modoDesenhoParede = ref(false)
const pontoArrastandoIndex = ref(/** @type {number | null} */ (null))
const shiftKeyPressed = ref(false)
const vertexDragLastPos = ref({ x: 0, y: 0 })

// Ajustes por parede: ângulo do esquadro (°) e comprimento real (mm) para o técnico
const paredesAjustes = ref({
  norte: { anguloEsquadro: 0, comprimentoReal: null },
  sul: { anguloEsquadro: 0, comprimentoReal: null },
  leste: { anguloEsquadro: 0, comprimentoReal: null },
  oeste: { anguloEsquadro: 0, comprimentoReal: null },
})

function toggleBorda(borda) {
  bordasVaoLivre.value = { ...bordasVaoLivre.value, [borda]: !bordasVaoLivre.value[borda] }
}

function selectParede(borda) {
  paredeSelecionada.value = paredeSelecionada.value === borda ? null : borda
  if (paredeSelecionada.value) {
    moduloSelecionadoId.value = null
    pontoTecnicoSelecionadoId.value = null
  }
}

function labelParede(borda) {
  const map = { norte: 'Norte', sul: 'Sul', leste: 'Leste', oeste: 'Oeste' }
  return map[borda] || borda
}

function comprimentoPadraoParede(borda) {
  const L = Number(dimensoesSala.value.largura_mm) || 3000
  const P = Number(dimensoesSala.value.profundidade_mm) || 2500
  return (borda === 'norte' || borda === 'sul') ? `Padrão ${L} mm` : `Padrão ${P} mm`
}

/** Placeholder: simula o recebimento de uma medida via foto e atualiza o comprimento da parede selecionada no canvas. */
function simularCapturaMedidaFoto() {
  const borda = paredeSelecionada.value
  if (!borda) return
  const L = Number(dimensoesSala.value.largura_mm) || 3000
  const P = Number(dimensoesSala.value.profundidade_mm) || 2500
  // Simula variação típica de ±15 mm (ex.: foto com referência)
  const variacao = () => Math.round((Math.random() - 0.5) * 30)
  if (borda === 'norte' || borda === 'sul') {
    const nova = Math.max(200, L + variacao())
    dimensoesSala.value = { ...dimensoesSala.value, largura_mm: nova }
  } else {
    const nova = Math.max(200, P + variacao())
    dimensoesSala.value = { ...dimensoesSala.value, profundidade_mm: nova }
  }
}

// —— Modo Desenho de Alvenaria ——
function addPontoAlvenaria(ev) {
  if (ev?.evt?.preventDefault) ev.evt.preventDefault()
  const target = ev?.target
  const stage = target?.getStage?.()
  if (!stage) return
  const viewportGroup = target?.getParent?.()
  let cx, cy
  if (viewportGroup && typeof stage.getRelativePointerPosition === 'function') {
    const pos = stage.getRelativePointerPosition(viewportGroup)
    if (!pos) return
    cx = pos.x
    cy = pos.y
    console.log('Clique detectado em:', pos)
  } else {
    const pos = stage.getPointerPosition()
    if (!pos) return
    const scale = viewportScale.value
    const vX = viewportX.value
    const vY = viewportY.value
    cx = (pos.x - vX) / scale
    cy = (pos.y - vY) / scale
    console.log('Clique detectado em (fallback):', { x: cx, y: cy })
  }
  const pts = listaPontos.value
  if (pts.length === 0) {
    listaPontos.value = [{ x: cx, y: cy }]
    return
  }
  if (!shiftKeyPressed.value) {
    const last = pts[pts.length - 1]
    const dx = Math.abs(cx - last.x)
    const dy = Math.abs(cy - last.y)
    if (dx >= dy) listaPontos.value = [...pts, { x: cx, y: last.y }]
    else listaPontos.value = [...pts, { x: last.x, y: cy }]
  } else {
    listaPontos.value = [...pts, { x: cx, y: cy }]
  }
}

function fecharAmbiente() {
  if (listaPontos.value.length >= 3) ambienteFechado.value = true
}

function toggleModoDesenhoParede() {
  const ativar = !modoDesenhoParede.value
  modoDesenhoParede.value = ativar
  if (ativar) resetarVisao()
}

const segmentosAlvenaria = computed(() => {
  const pts = listaPontos.value
  const segs = []
  for (let i = 0; i < pts.length - 1; i++) segs.push({ i, j: i + 1 })
  if (ambienteFechado.value && pts.length >= 3) segs.push({ i: pts.length - 1, j: 0 })
  return segs
})

/** Índices dos segmentos que tocam o vértice `vertexIdx` (para arrastar módulos encostados em Medição Fina). */
function getSegmentIndicesAtVertex(vertexIdx) {
  const n = listaPontos.value.length
  const closed = ambienteFechado.value && n >= 3
  const out = []
  if (vertexIdx > 0) out.push(vertexIdx - 1)
  if (vertexIdx < n - 1) out.push(vertexIdx)
  if (closed && vertexIdx === 0) out.push(n - 1)
  if (closed && vertexIdx === n - 1) out.push(n - 1)
  return [...new Set(out)]
}

const rectCliqueAlvenariaConfig = computed(() => ({
  x: -10000,
  y: -10000,
  width: 20000,
  height: 20000,
  fill: 'transparent',
  listening: true,
  draggable: false,
  cursor: 'crosshair',
}))

function distMm(a, b) {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

function getSegmentoLineConfig(i, j) {
  const pts = listaPontos.value
  if (!pts[i] || !pts[j]) return null
  const e = Math.max(2, Number(espessuraAlvenariaMm.value) || 150)
  const peDireito = Math.max(500, Number(peDireitoSalaMm.value) || 2600)
  const k = Math.max(2, Math.min(10, 3 * (peDireito / 2600)))
  const blur = Math.max(2, Math.min(16, 4 + 4 * (peDireito / 2600)))
  let shadowOffsetX = 0
  let shadowOffsetY = 0
  if (pts.length >= 3) {
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
    const mx = (pts[i].x + pts[j].x) / 2
    const my = (pts[i].y + pts[j].y) / 2
    const dx = cx - mx
    const dy = cy - my
    const len = Math.hypot(dx, dy) || 1
    shadowOffsetX = (dx / len) * k
    shadowOffsetY = (dy / len) * k
  }
  return {
    points: [pts[i].x, pts[i].y, pts[j].x, pts[j].y],
    stroke: modoMedicaoFina.value ? '#ea580c' : '#64748b',
    strokeWidth: e,
    hitStrokeWidth: Math.max(20, e),
    listening: false,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowBlur: blur,
    shadowOffsetX,
    shadowOffsetY,
  }
}

function getVerticeGroupConfig(i) {
  const pts = listaPontos.value
  const p = pts[i]
  if (!p) return { listening: false }
  const e = Math.max(2, Number(espessuraAlvenariaMm.value) || 150)
  const r = Math.max(8, e / 2)
  return {
    x: p.x,
    y: p.y,
    draggable: true,
    listening: true,
    dragBoundFunc: (pos) => {
      if (shiftKeyPressed.value) return pos
      const prev = i > 0 ? pts[i - 1] : (ambienteFechado.value ? pts[pts.length - 1] : null)
      const next = i < pts.length - 1 ? pts[i + 1] : (ambienteFechado.value ? pts[0] : null)
      let x = pos.x
      let y = pos.y
      if (prev && next) {
        const dxPrev = Math.abs(pos.x - prev.x)
        const dyPrev = Math.abs(pos.y - prev.y)
        const dxNext = Math.abs(pos.x - next.x)
        const dyNext = Math.abs(pos.y - next.y)
        if (dxPrev + dxNext <= dyPrev + dyNext) x = prev.x
        else y = prev.y
      } else if (prev) {
        if (Math.abs(pos.x - prev.x) >= Math.abs(pos.y - prev.y)) y = prev.y
        else x = prev.x
      } else if (next) {
        if (Math.abs(pos.x - next.x) >= Math.abs(pos.y - next.y)) y = next.y
        else x = next.x
      }
      return { x, y }
    },
    onDragmove: (e) => {
      const pt = listaPontos.value[i]
      const node = e?.target
      if (pt && node) {
        const newX = node.x()
        const newY = node.y()
        if (modoMedicaoFina.value) {
          const dx = newX - vertexDragLastPos.value.x
          const dy = newY - vertexDragLastPos.value.y
          const segIndices = getSegmentIndicesAtVertex(i)
          modulosAtivos.value.forEach((m) => {
            const si = m.segmentIndex
            if (si != null && segIndices.includes(si)) {
              m.x_mm = (m.x_mm ?? 0) + dx
              m.y_mm = (m.y_mm ?? 0) + dy
            }
          })
        }
        pt.x = newX
        pt.y = newY
        vertexDragLastPos.value = { x: newX, y: newY }
      }
    },
    onDragstart: () => {
      pontoArrastandoIndex.value = i
      const pt = listaPontos.value[i]
      if (pt) vertexDragLastPos.value = { x: pt.x, y: pt.y }
    },
    onDragend: () => { pontoArrastandoIndex.value = null },
  }
}

function getVerticeCircleConfig(i) {
  const e = Math.max(2, Number(espessuraAlvenariaMm.value) || 150)
  const r = Math.max(8, e / 2)
  return {
    x: 0,
    y: 0,
    radius: r,
    fill: '#ea580c',
    stroke: '#fff',
    strokeWidth: 2,
    listening: false,
  }
}

const cotaVerticeFlutuanteConfig = computed(() => {
  const idx = pontoArrastandoIndex.value
  const pts = listaPontos.value
  if (idx == null || !pts.length) return null
  const n = pts.length
  const prev = idx > 0 ? pts[idx - 1] : (ambienteFechado.value ? pts[n - 1] : null)
  const next = idx < n - 1 ? pts[idx + 1] : (ambienteFechado.value ? pts[0] : null)
  const p = pts[idx]
  const L1 = prev ? Math.round(distMm(prev, p)) : 0
  const L2 = next ? Math.round(distMm(p, next)) : 0
  const text = [L1 > 0 ? `${L1} mm` : '', L2 > 0 ? `${L2} mm` : ''].filter(Boolean).join('  ·  ')
  if (!text) return null
  return {
    x: p.x + 12,
    y: p.y - 8,
    text,
    fontSize: 11,
    fill: '#0f172a',
    fontStyle: 'bold',
    listening: false,
  }
})

const vaolivreParedeSelecionada = computed({
  get: () => paredeSelecionada.value ? bordasVaoLivre.value[paredeSelecionada.value] : false,
  set: (v) => {
    if (paredeSelecionada.value) {
      bordasVaoLivre.value = { ...bordasVaoLivre.value, [paredeSelecionada.value]: v }
    }
  },
})

// Comprimento da parede selecionada (L para N/S, P para E/O) — para o painel e para atualizar ao arrastar
const comprimentoParedeSelecionada = computed({
  get: () => {
    if (!paredeSelecionada.value) return 0
    const d = dimensoesSala.value
    return (paredeSelecionada.value === 'norte' || paredeSelecionada.value === 'sul')
      ? (Number(d.largura_mm) || 3000)
      : (Number(d.profundidade_mm) || 2500)
  },
  set: (v) => {
    if (!paredeSelecionada.value) return
    const n = Math.max(100, Number(v) || 0)
    if (paredeSelecionada.value === 'norte' || paredeSelecionada.value === 'sul') {
      dimensoesSala.value = { ...dimensoesSala.value, largura_mm: n }
    } else {
      dimensoesSala.value = { ...dimensoesSala.value, profundidade_mm: n }
    }
  },
})

// Modo: false = Orçamento, true = Medição Fina (conferência técnica)
const modoMedicaoFina = ref(false)

// Medidas de conferência por parede (técnico); null = não conferido
const conferenciaParedes = ref({ largura_mm: null, profundidade_mm: null })

// Folga de instalação (mm) — usada na Medição Fina; subtraída da largura no calcularPecas
const folgaInstalacaoMm = ref(20)

// Lista de módulos no canvas (escala 1px = 1mm no viewport)
const modulosAtivos = ref(/** @type {Array<{ id: string, tipoModulo: string, x_mm: number, y_mm: number, largura_mm: number, altura_mm: number, profundidade_mm?: number }>} */ ([]))
const moduloSelecionadoId = ref(/** @type {string | null} */ (null))

// Pontos técnicos (Tomada, Ponto de Água) — tipo: 'tomada' | 'ponto_agua'
const pontosTecnicos = ref(/** @type {Array<{ id: string, tipo: string, x_mm: number, y_mm: number }>} */ ([]))
const pontoTecnicoSelecionadoId = ref(/** @type {string | null} */ (null))

const moduloSelecionado = computed(() =>
  moduloSelecionadoId.value ? modulosAtivos.value.find((m) => m.id === moduloSelecionadoId.value) ?? null : null
)

const pontoTecnicoSelecionado = computed(() =>
  pontoTecnicoSelecionadoId.value ? pontosTecnicos.value.find((p) => p.id === pontoTecnicoSelecionadoId.value) ?? null : null
)

// Bind com default para tipo e profundidade (módulos antigos podem não ter tipoModulo)
const tipoModuloModel = computed({
  get: () => moduloSelecionado.value?.tipoModulo || 'balcao_simples',
  set: (v) => { if (moduloSelecionado.value) moduloSelecionado.value.tipoModulo = v },
})
const profundidadeModuloModel = computed({
  get: () => moduloSelecionado.value?.profundidade_mm ?? 600,
  set: (v) => { if (moduloSelecionado.value) moduloSelecionado.value.profundidade_mm = Number(v) || 600 },
})
const alturaPisoZModuloModel = computed({
  get: () => moduloSelecionado.value?.alturaPisoZ_mm ?? 0,
  set: (v) => { if (moduloSelecionado.value) moduloSelecionado.value.alturaPisoZ_mm = Math.max(0, Number(v) || 0) },
})

function definirArmarioAereo() {
  if (moduloSelecionado.value) moduloSelecionado.value.alturaPisoZ_mm = 1500
}

// Ordem de desenho: módulo selecionado por cima (último no v-for)
const modulosOrdenadosParaZIndex = computed(() => {
  const list = modulosAtivos.value.slice()
  const id = moduloSelecionadoId.value
  if (!id) return list
  const idx = list.findIndex((m) => m.id === id)
  if (idx === -1) return list
  const [sel] = list.splice(idx, 1)
  list.push(sel)
  return list
})

// Viewport: zoom centralizado + pan (arrastar); preparado para multi-touch (pinch)
const viewportScale = ref(1)
const viewportX = ref(0)
const viewportY = ref(0)
const ZOOM_MIN = 0.15
const ZOOM_MAX = 8

// Terreno para multi-touch (Capacitor/tablet): último estado de toques para pinch
const lastTouchDistance = ref(null)
const lastTouchCenter = ref(null)

const gridPatternImage = ref(null)

function s() { return pixelRatio.value }
function rulerPx() { return RULER_MM * s() }

function gerarIdModulo() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `mod-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function gerarIdPontoTecnico() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `pt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function adicionarPontoTecnico(tipo) {
  const L = Number(dimensoesSala.value.largura_mm) || 3000
  const P = Number(dimensoesSala.value.profundidade_mm) || 2500
  const x = Math.max(100, L / 2 - 50)
  const y = Math.max(100, P / 2 - 50)
  pontosTecnicos.value = [
    ...pontosTecnicos.value,
    { id: gerarIdPontoTecnico(), tipo, x_mm: x, y_mm: y },
  ]
  pontoTecnicoSelecionadoId.value = pontosTecnicos.value[pontosTecnicos.value.length - 1].id
  moduloSelecionadoId.value = null
}

const stageConfig = computed(() => ({
  width: stageWidth.value,
  height: stageHeight.value,
}))

// Viewport group: arrastar = pan; zoom via @wheel (e futuramente pinch). Pan travado quando Desenhar Parede ativo.
const viewportGroupConfig = computed(() => ({
  x: viewportX.value,
  y: viewportY.value,
  scaleX: viewportScale.value,
  scaleY: viewportScale.value,
  draggable: !modoDesenhoParede.value,
  listening: true,
  onDragmove: onViewportDragMove,
  onDragend: onViewportDragEnd,
}))

// Grid infinito: um Rect cobrindo área enorme com fillPatternImage (pattern 100x100 repete)
const gridRectConfig = computed(() => ({
  x: -10000,
  y: -10000,
  width: 20000,
  height: 20000,
  fillPatternImage: gridPatternImage.value,
  fillPatternRepeat: 'repeat',
  fillPatternScale: { x: 1, y: 1 },
  listening: true,
}))

function createGridPatternImage() {
  const size = 100
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
  if (!canvas) return
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const cinzaClaro = 'rgba(148, 163, 184, 0.28)'
  const cinzaEscuro = 'rgba(100, 116, 139, 0.45)'
  for (let i = 0; i <= 10; i++) {
    const x = i * 10
    const isMajor = i % 10 === 0
    ctx.strokeStyle = isMajor ? cinzaEscuro : cinzaClaro
    ctx.lineWidth = isMajor ? 1.5 : 1
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, size)
    ctx.stroke()
  }
  for (let j = 0; j <= 10; j++) {
    const y = j * 10
    const isMajor = j % 10 === 0
    ctx.strokeStyle = isMajor ? cinzaEscuro : cinzaClaro
    ctx.lineWidth = isMajor ? 1.5 : 1
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y)
    ctx.stroke()
  }
  const img = new Image()
  img.onload = () => { gridPatternImage.value = img }
  img.src = canvas.toDataURL('image/png')
}

// Réguas fixas: faixa sempre na borda do stage (topo 0..largura, esquerda 0..altura); fora do grupo de zoom/pan
const rulerBgTopConfig = computed(() => ({
  x: 0, y: 0, width: stageWidth.value, height: rulerPx(),
  fill: 'rgba(248, 250, 252, 0.98)', listening: false,
}))
const rulerBgLeftConfig = computed(() => ({
  x: 0, y: 0, width: rulerPx(), height: stageHeight.value,
  fill: 'rgba(248, 250, 252, 0.98)', listening: false,
}))

const rulerBorderVConfig = computed(() => ({
  points: [rulerPx(), 0, rulerPx(), stageHeight.value],
  stroke: 'rgba(148, 163, 184, 0.5)', strokeWidth: 1,
}))
const rulerBorderHConfig = computed(() => ({
  points: [rulerPx(), rulerPx(), stageWidth.value, rulerPx()],
  stroke: 'rgba(148, 163, 184, 0.5)', strokeWidth: 1,
}))

// Ticks e labels em coordenadas do stage, posição = viewportX/Y + conteúdo * scale (sincronia com pan/zoom)
const rulerTicksFixed = computed(() => {
  const w = stageWidth.value
  const h = stageHeight.value
  const R = rulerPx()
  const scale = viewportScale.value
  const vX = viewportX.value
  const vY = viewportY.value
  const stroke = 'rgba(148, 163, 184, 0.6)'
  const ticks = []
  const kMinX = Math.floor(-vX / scale / STEP_MM_10)
  const kMaxX = Math.ceil((w - vX) / scale / STEP_MM_10)
  for (let k = kMinX; k <= kMaxX; k++) {
    const x = vX + k * STEP_MM_10 * scale
    if (x < 0 || x > w) continue
    const isMajor = k % 10 === 0
    ticks.push({ points: [x, R, x, R - (isMajor ? 10 : 5)], stroke, strokeWidth: 1 })
  }
  const kMinY = Math.floor(-vY / scale / STEP_MM_10)
  const kMaxY = Math.ceil((h - vY) / scale / STEP_MM_10)
  for (let k = kMinY; k <= kMaxY; k++) {
    const y = vY + k * STEP_MM_10 * scale
    if (y < 0 || y > h) continue
    const isMajor = k % 10 === 0
    ticks.push({ points: [R, y, R - (isMajor ? 10 : 5), y], stroke, strokeWidth: 1 })
  }
  return ticks
})

// Labels: mesma matemática do viewportScale — números aumentam/diminuem e se movem com pan, faixa da régua não sai da borda
const rulerLabelsFixed = computed(() => {
  const w = stageWidth.value
  const h = stageHeight.value
  const R = rulerPx()
  const scale = viewportScale.value
  const vX = viewportX.value
  const vY = viewportY.value
  const fill = '#64748b'
  const fontSize = Math.max(8, Math.min(14, 10 * scale))
  const labels = []
  const kMinX = Math.floor(-vX / scale / STEP_MM_100)
  const kMaxX = Math.ceil((w - vX) / scale / STEP_MM_100)
  for (let k = kMinX; k <= kMaxX; k++) {
    const x = vX + k * STEP_MM_100 * scale
    if (x < 0 || x > w) continue
    labels.push({
      x: x - 14, y: 4, width: 28,
      text: String(k * STEP_MM_100),
      fontSize, fill, align: 'center',
    })
  }
  const kMinY = Math.floor(-vY / scale / STEP_MM_100)
  const kMaxY = Math.ceil((h - vY) / scale / STEP_MM_100)
  for (let k = kMinY; k <= kMaxY; k++) {
    const y = vY + k * STEP_MM_100 * scale
    if (y < 0 || y > h) continue
    labels.push({
      x: 4, y: y - fontSize / 2 - 2, width: R - 8,
      text: String(k * STEP_MM_100),
      fontSize, fill, align: 'right',
    })
  }
  return labels
})

// —— Pontos técnicos (Tomada, Ponto de Água) ——
function getPontoTecnicoGroupConfig(pt) {
  const L = Math.max(100, Number(dimensoesSala.value.largura_mm) || 3000)
  const P = Math.max(100, Number(dimensoesSala.value.profundidade_mm) || 2500)
  const { minX, maxX, minY, maxY } = getLimitesSala(L, P, 0, 0)
  return {
    x: pt.x_mm,
    y: pt.y_mm,
    draggable: true,
    dragBoundFunc: (pos) => ({
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y)),
    }),
    onDragmove: (e) => onPontoTecnicoDragMove(e, pt),
    onDragend: (e) => onPontoTecnicoDragEnd(e, pt),
  }
}

function getPontoTecnicoCircleConfig(pt) {
  const selecionado = pontoTecnicoSelecionadoId.value === pt.id
  const isTomada = pt.tipo === 'tomada'
  return {
    x: 0,
    y: 0,
    radius: 14,
    fill: isTomada ? '#f59e0b' : '#0ea5e9',
    stroke: selecionado ? '#1e293b' : (isTomada ? '#d97706' : '#0284c7'),
    strokeWidth: selecionado ? 2.5 : 1.5,
    listening: false,
  }
}

function getPontoTecnicoLabelConfig(pt) {
  return {
    x: -24,
    y: 20,
    width: 48,
    text: pt.tipo === 'tomada' ? 'Tomada' : 'Ponto de Água',
    fontSize: 10,
    fontFamily: 'system-ui, sans-serif',
    fill: '#475569',
    align: 'center',
    listening: false,
  }
}

function onPontoTecnicoDragMove(e, pt) {
  const node = e.target
  if (!node || !pt) return
  pt.x_mm = node.x()
  pt.y_mm = node.y()
}

function onPontoTecnicoDragEnd(e, pt) {
  const node = e.target
  if (node && pt) {
    pt.x_mm = node.x()
    pt.y_mm = node.y()
  }
}

function onPontoTecnicoClick(e, pt) {
  pontoTecnicoSelecionadoId.value = pt.id
  moduloSelecionadoId.value = null
  paredeSelecionada.value = null
  const node = e?.target
  if (node && typeof node.moveToTop === 'function') node.moveToTop()
}

// Cota automática do ponto técnico selecionado (até paredes e chão)
const cotaPontoEsquerdaMm = computed(() =>
  pontoTecnicoSelecionado.value ? Math.round(pontoTecnicoSelecionado.value.x_mm) : 0
)
const cotaPontoTopoMm = computed(() =>
  pontoTecnicoSelecionado.value ? Math.round(pontoTecnicoSelecionado.value.y_mm) : 0
)
const cotaPontoDireitaMm = computed(() => {
  if (!pontoTecnicoSelecionado.value) return 0
  const L = Number(dimensoesSala.value.largura_mm) || 3000
  return Math.round(L - pontoTecnicoSelecionado.value.x_mm)
})
const cotaPontoChaoMm = computed(() => {
  if (!pontoTecnicoSelecionado.value) return 0
  const P = Number(dimensoesSala.value.profundidade_mm) || 2500
  return Math.round(P - pontoTecnicoSelecionado.value.y_mm)
})
const cotaPontoParedeMaisProximaMm = computed(() => {
  if (!pontoTecnicoSelecionado.value) return 0
  const a = cotaPontoEsquerdaMm.value
  const b = cotaPontoTopoMm.value
  const c = cotaPontoDireitaMm.value
  const d = cotaPontoChaoMm.value
  return Math.min(a, b, c, d)
})

// Avisos Medição Fina: módulo sobre ponto / ponto sob módulo
const moduloCobrePontoTecnico = computed(() => {
  const mod = moduloSelecionado.value
  if (!mod || !modoMedicaoFina.value) return false
  const L = Number(mod.x_mm) || 0
  const T = Number(mod.y_mm) || 0
  const R = L + (Number(mod.largura_mm) || 600)
  const B = T + (Number(mod.altura_mm) || 600)
  return pontosTecnicos.value.some((pt) => {
    const x = Number(pt.x_mm) || 0
    const y = Number(pt.y_mm) || 0
    return x >= L && x <= R && y >= T && y <= B
  })
})
const pontoDentroDeModulo = computed(() => {
  const pt = pontoTecnicoSelecionado.value
  if (!pt || !modoMedicaoFina.value) return false
  const px = Number(pt.x_mm) || 0
  const py = Number(pt.y_mm) || 0
  return modulosAtivos.value.some((mod) => {
    const L = Number(mod.x_mm) || 0
    const T = Number(mod.y_mm) || 0
    const R = L + (Number(mod.largura_mm) || 600)
    const B = T + (Number(mod.altura_mm) || 600)
    return px >= L && px <= R && py >= T && py <= B
  })
})

// Configs das setas de cota do ponto técnico selecionado
const cotaPontoEsquerdaConfig = computed(() => {
  if (!pontoTecnicoSelecionado.value) return null
  const pt = pontoTecnicoSelecionado.value
  const stroke = '#0ea5e9'
  return {
    points: [0, pt.y_mm, pt.x_mm, pt.y_mm],
    stroke,
    strokeWidth: 1.5,
    fill: stroke,
    pointerLength: 6,
    pointerWidth: 6,
    pointerAtBeginning: true,
    pointerAtEnding: true,
  }
})
const cotaPontoTopoConfig = computed(() => {
  if (!pontoTecnicoSelecionado.value) return null
  const pt = pontoTecnicoSelecionado.value
  const stroke = '#0ea5e9'
  return {
    points: [pt.x_mm, 0, pt.x_mm, pt.y_mm],
    stroke,
    strokeWidth: 1.5,
    fill: stroke,
    pointerLength: 6,
    pointerWidth: 6,
    pointerAtBeginning: true,
    pointerAtEnding: true,
  }
})
const cotaPontoChaoConfig = computed(() => {
  if (!pontoTecnicoSelecionado.value) return null
  const pt = pontoTecnicoSelecionado.value
  const P = Number(dimensoesSala.value.profundidade_mm) || 2500
  const stroke = '#0ea5e9'
  return {
    points: [pt.x_mm, pt.y_mm, pt.x_mm, P],
    stroke,
    strokeWidth: 1.5,
    fill: stroke,
    pointerLength: 6,
    pointerWidth: 6,
    pointerAtBeginning: true,
    pointerAtEnding: true,
  }
})
const cotaPontoEsquerdaLabelConfig = computed(() => {
  if (!pontoTecnicoSelecionado.value) return null
  const pt = pontoTecnicoSelecionado.value
  const midX = pt.x_mm / 2
  return {
    x: midX - 18,
    y: pt.y_mm - 20,
    width: 36,
    text: `${cotaPontoEsquerdaMm.value} mm`,
    fontSize: 10,
    fill: '#0ea5e9',
    align: 'center',
  }
})
const cotaPontoTopoLabelConfig = computed(() => {
  if (!pontoTecnicoSelecionado.value) return null
  const pt = pontoTecnicoSelecionado.value
  const midY = pt.y_mm / 2
  return {
    x: pt.x_mm - 28,
    y: midY - 5,
    width: 56,
    text: `${cotaPontoTopoMm.value} mm`,
    fontSize: 10,
    fill: '#0ea5e9',
    align: 'center',
  }
})
const cotaPontoChaoLabelConfig = computed(() => {
  if (!pontoTecnicoSelecionado.value) return null
  const pt = pontoTecnicoSelecionado.value
  const P = Number(dimensoesSala.value.profundidade_mm) || 2500
  const midY = pt.y_mm + (P - pt.y_mm) / 2
  return {
    x: pt.x_mm - 28,
    y: midY - 5,
    width: 56,
    text: `${cotaPontoChaoMm.value} mm (chão)`,
    fontSize: 10,
    fill: '#0ea5e9',
    align: 'center',
  }
})

// Dimensões L e P reativos (usados em várias funções)
const salaL = computed(() => Math.max(100, Number(dimensoesSala.value.largura_mm) || 3000))
const salaP = computed(() => Math.max(100, Number(dimensoesSala.value.profundidade_mm) || 2500))

// Config do grupo de cada parede: posição, arrastável (só na direção perpendicular), clique
function getParedeGroupConfig(borda) {
  const L = salaL.value
  const P = salaP.value
  const e = Math.max(0, Number(espessuraAlvenariaMm.value) || 150)
  const MIN_LADO = 200
  let dragBoundFunc
  if (borda === 'norte') {
    dragBoundFunc = (pos) => ({ x: 0, y: Math.max(0, Math.min(P - MIN_LADO, pos.y)) })
  } else if (borda === 'sul') {
    dragBoundFunc = (pos) => ({ x: 0, y: Math.max(-P + MIN_LADO, pos.y) })
  } else if (borda === 'oeste') {
    dragBoundFunc = (pos) => ({ x: Math.max(0, Math.min(L - MIN_LADO, pos.x)), y: 0 })
  } else {
    dragBoundFunc = (pos) => ({ x: Math.max(-L + MIN_LADO, pos.x), y: 0 })
  }
  return {
    x: 0,
    y: 0,
    draggable: true,
    dragBoundFunc,
    listening: true,
    onClick: (e) => onParedeClick(borda, e),
    onDragend: (e) => onParedeDragEnd(borda, e),
  }
}

// Sombra projetada para dentro da sala (sensação de altura); proporcional ao pé-direito
function getSombraParedeConfig() {
  const peDireito = Math.max(500, Number(peDireitoSalaMm.value) || 2600)
  const k = peDireito / 2600
  const offset = Math.max(2, Math.min(12, 4 * k))
  const blur = Math.max(2, Math.min(16, 4 + 4 * k))
  return {
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowBlur: blur,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  }
}

// Offset da sombra para dentro (4 paredes): norte=+y, sul=-y, oeste=+x, leste=-x
function getSombraOffsetParede(borda) {
  const peDireito = Math.max(500, Number(peDireitoSalaMm.value) || 2600)
  const k = Math.max(2, Math.min(10, 3 * (peDireito / 2600)))
  if (borda === 'norte') return { shadowOffsetX: 0, shadowOffsetY: k }
  if (borda === 'sul') return { shadowOffsetX: 0, shadowOffsetY: -k }
  if (borda === 'oeste') return { shadowOffsetX: k, shadowOffsetY: 0 }
  return { shadowOffsetX: -k, shadowOffsetY: 0 }
}

// Config da v-line de cada parede (pontos, traço, espessura); destaque laranja quando selecionada; sombra para dentro
function getParedeLineConfig(borda) {
  const L = salaL.value
  const P = salaP.value
  const e = Math.max(0, Number(espessuraAlvenariaMm.value) || 150)
  const aberta = bordasVaoLivre.value[borda]
  const selecionada = paredeSelecionada.value === borda
  const stroke = selecionada ? '#ea580c' : (modoMedicaoFina.value ? '#ea580c' : '#64748b')
  const m = e / 2
  let points
  if (borda === 'norte') points = [-m, -m, L + m, -m]
  else if (borda === 'sul') points = [-m, P + m, L + m, P + m]
  else if (borda === 'oeste') points = [-m, -m, -m, P + m]
  else points = [L + m, -m, L + m, P + m]
  const sombra = getSombraParedeConfig()
  const offsetSombra = getSombraOffsetParede(borda)
  return {
    points,
    stroke,
    strokeWidth: aberta ? 2 : e,
    dash: aberta ? [10, 8] : null,
    hitStrokeWidth: Math.max(24, e),
    listening: false,
    ...sombra,
    ...offsetSombra,
  }
}

function onParedeClick(borda, e) {
  if (aguardandoCliqueParede.value) {
    adicionarModuloNaParede(borda, e)
    aguardandoCliqueParede.value = false
    return
  }
  selectParede(borda)
}

function adicionarModuloNaParede(borda, e) {
  const stage = e?.target?.getStage?.()
  if (!stage) return
  const pos = stage.getPointerPosition()
  if (!pos) return
  const L = salaL.value
  const P = salaP.value
  const scale = viewportScale.value
  const vX = viewportX.value
  const vY = viewportY.value
  const contentX = (pos.x - vX) / scale
  const contentY = (pos.y - vY) / scale
  const w = 600
  const h = 600
  let x_mm, y_mm
  if (borda === 'norte') {
    x_mm = Math.max(0, Math.min(L - w, contentX - w / 2))
    y_mm = 0
  } else if (borda === 'sul') {
    x_mm = Math.max(0, Math.min(L - w, contentX - w / 2))
    y_mm = P - h
  } else if (borda === 'oeste') {
    x_mm = 0
    y_mm = Math.max(0, Math.min(P - h, contentY - h / 2))
  } else {
    x_mm = L - w
    y_mm = Math.max(0, Math.min(P - h, contentY - h / 2))
  }
  modulosAtivos.value = [
    ...modulosAtivos.value,
    {
      id: gerarIdModulo(),
      tipoModulo: 'balcao_simples',
      x_mm,
      y_mm,
      largura_mm: w,
      altura_mm: h,
      profundidade_mm: 600,
      alturaPisoZ_mm: 0,
    },
  ]
  moduloSelecionadoId.value = modulosAtivos.value[modulosAtivos.value.length - 1].id
  paredeSelecionada.value = null
}

function onParedeDragEnd(borda, e) {
  const node = e?.target
  if (!node) return
  const L = salaL.value
  const P = salaP.value
  const dx = node.x()
  const dy = node.y()
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
  if (borda === 'norte') {
    const delta = dy
    const newP = Math.max(200, P - delta)
    dimensoesSala.value = { ...dimensoesSala.value, profundidade_mm: newP }
    modulosAtivos.value.forEach((m) => { m.y_mm -= delta })
    pontosTecnicos.value.forEach((pt) => { pt.y_mm -= delta })
  } else if (borda === 'sul') {
    const delta = dy
    const newP = Math.max(200, P + delta)
    dimensoesSala.value = { ...dimensoesSala.value, profundidade_mm: newP }
  } else if (borda === 'oeste') {
    const delta = dx
    const newL = Math.max(200, L - delta)
    dimensoesSala.value = { ...dimensoesSala.value, largura_mm: newL }
    modulosAtivos.value.forEach((m) => { m.x_mm -= delta })
    pontosTecnicos.value.forEach((pt) => { pt.x_mm -= delta })
  } else {
    const delta = dx
    const newL = Math.max(200, L + delta)
    dimensoesSala.value = { ...dimensoesSala.value, largura_mm: newL }
  }
  node.position({ x: 0, y: 0 })
}

// Snapping em mm: borda 0, linhas 100mm e borda interna (maxMm)
const SNAP_THRESHOLD_MM = 5
const SNAP_INTER_MODULOS_MM = 5
const SNAP_PAREDE_ALVENARIA_MM = 80

// Geometria: distância ponto–segmento e ponto mais próximo no segmento
function distPointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-10) {
    return { dist: Math.hypot(px - ax, py - ay), closestX: ax, closestY: ay }
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const qx = ax + t * dx
  const qy = ay + t * dy
  return {
    dist: Math.hypot(px - qx, py - qy),
    closestX: qx,
    closestY: qy,
  }
}

function segmentAngleRad(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax)
}

function snapToGridMm(valMm, originMm, maxMm) {
  if (Math.abs(valMm - originMm) < SNAP_THRESHOLD_MM) return originMm
  if (maxMm != null && Math.abs(valMm - maxMm) < SNAP_THRESHOLD_MM) return maxMm
  const rest = valMm - originMm
  const mult = Math.round(rest / STEP_MM_100) * STEP_MM_100
  if (Math.abs(rest - mult) < SNAP_THRESHOLD_MM) return originMm + mult
  return valMm
}

// Limites da sala conforme bordas em vão livre (parede = limite; vão livre = sem limite)
function getLimitesSala(L, P, w, h) {
  const v = bordasVaoLivre.value
  const minX = v.oeste ? -1e6 : 0
  const maxX = v.leste ? 1e6 : L - w
  const minY = v.norte ? -1e6 : 0
  const maxY = v.sul ? 1e6 : P - h
  return { minX, maxX, minY, maxY }
}

/**
 * Snap inter-módulos: se a borda do módulo que está sendo arrastado ficar a menos de 5mm da face de outro, encaixa.
 * Bordas em vão livre não entram como candidatos de snap nem como limite.
 * @param {Object} [opts] - { skipBounds: true } para não restringir a L/P (ex.: modo alvenaria).
 */
function snapToBordasEModulos(pos, currentModId, w, h, L, P, opts = {}) {
  const v = bordasVaoLivre.value
  const maxX = L - w
  const maxY = P - h
  const lim = getLimitesSala(L, P, w, h)
  const minX = opts.skipBounds ? -1e6 : lim.minX
  const limMaxX = opts.skipBounds ? 1e6 : lim.maxX
  const minY = opts.skipBounds ? -1e6 : lim.minY
  const limMaxY = opts.skipBounds ? 1e6 : lim.maxY
  const list = modulosAtivos.value
  const candX = []
  const candY = []
  if (!v.oeste) candX.push(0)
  if (!v.leste) candX.push(maxX)
  if (!v.norte) candY.push(0)
  if (!v.sul) candY.push(maxY)
  const myLeft = pos.x
  const myRight = pos.x + w
  const myTop = pos.y
  const myBottom = pos.y + h
  for (let i = 0; i < list.length; i++) {
    const o = list[i]
    if (o.id === currentModId) continue
    const oL = Number(o.x_mm) || 0
    const oT = Number(o.y_mm) || 0
    const oW = Math.max(1, Number(o.largura_mm) || 600)
    const oH = Math.max(1, Number(o.altura_mm) || 600)
    const oRight = oL + oW
    const oBottom = oT + oH
    if (Math.abs(myLeft - oRight) < SNAP_INTER_MODULOS_MM) candX.push(oRight)
    if (Math.abs(myRight - oL) < SNAP_INTER_MODULOS_MM) candX.push(oL - w)
    if (Math.abs(myTop - oBottom) < SNAP_INTER_MODULOS_MM) candY.push(oBottom)
    if (Math.abs(myBottom - oT) < SNAP_INTER_MODULOS_MM) candY.push(oT - h)
  }
  let bestX = pos.x
  let bestY = pos.y
  let minDx = Infinity
  let minDy = Infinity
  for (let i = 0; i < candX.length; i++) {
    const cx = candX[i]
    if (cx >= minX && cx <= limMaxX) {
      const d = Math.abs(cx - pos.x)
      if (d < minDx) {
        minDx = d
        bestX = cx
      }
    }
  }
  for (let i = 0; i < candY.length; i++) {
    const cy = candY[i]
    if (cy >= minY && cy <= limMaxY) {
      const d = Math.abs(cy - pos.y)
      if (d < minDy) {
        minDy = d
        bestY = cy
      }
    }
  }
  const gridX = snapToGridMm(bestX, minX, v.leste ? null : limMaxX)
  const gridY = snapToGridMm(bestY, minY, v.sul ? null : limMaxY)
  return {
    x: Math.max(minX, Math.min(limMaxX, gridX)),
    y: Math.max(minY, Math.min(limMaxY, gridY)),
    rotation: 0,
    segmentIndex: null,
  }
}

/**
 * Snap ao polígono de alvenaria: distância ponto–segmento; se perto de uma parede, encaixa e rotaciona paralelo.
 * Retorna { x, y, rotation (graus), segmentIndex }.
 */
function snapToAlvenariaEModulos(pos, currentModId, w, h, mod) {
  const pts = listaPontos.value
  const L = salaL.value
  const P = salaP.value
  if (pts.length < 2) {
    const out = snapToBordasEModulos(pos, currentModId, w, h, L, P)
    return { ...out, rotation: mod.rotacao_graus ?? 0, segmentIndex: null }
  }
  const cx = pos.x + w / 2
  const cy = pos.y + h / 2
  const segs = segmentosAlvenaria.value
  let bestDist = Infinity
  let bestSegIdx = -1
  let bestQx = cx
  let bestQy = cy
  let bestAngle = 0
  for (let s = 0; s < segs.length; s++) {
    const { i, j } = segs[s]
    const ax = pts[i].x
    const ay = pts[i].y
    const bx = pts[j].x
    const by = pts[j].y
    const { dist, closestX: qx, closestY: qy } = distPointToSegment(cx, cy, ax, ay, bx, by)
    if (dist < bestDist) {
      bestDist = dist
      bestSegIdx = s
      bestQx = qx
      bestQy = qy
      bestAngle = segmentAngleRad(ax, ay, bx, by)
    }
  }
  if (bestSegIdx >= 0 && bestDist < SNAP_PAREDE_ALVENARIA_MM) {
    const alpha = bestAngle
    const sinA = Math.sin(alpha)
    const cosA = Math.cos(alpha)
    const x = bestQx - w / 2 - (h / 2) * sinA
    const y = bestQy - h / 2 + (h / 2) * cosA
    const gridX = snapToGridMm(x, -1e6, 1e6)
    const gridY = snapToGridMm(y, -1e6, 1e6)
    const rotGraus = (alpha * 180) / Math.PI
    const out = snapToBordasEModulos({ x: gridX, y: gridY }, currentModId, w, h, L, P, { skipBounds: true })
    mod.rotacao_graus = rotGraus
    mod.segmentIndex = bestSegIdx
    return { ...out, rotation: rotGraus, segmentIndex: bestSegIdx }
  }
  mod.segmentIndex = null
  const out = snapToBordasEModulos(pos, currentModId, w, h, L, P)
  return { ...out, rotation: mod.rotacao_graus ?? 0, segmentIndex: null }
}

function getModuloGroupConfig(mod) {
  const L = Math.max(100, Number(dimensoesSala.value.largura_mm) || 3000)
  const P = Math.max(100, Number(dimensoesSala.value.profundidade_mm) || 2500)
  const w = Math.max(1, Number(mod.largura_mm) || 600)
  const h = Math.max(1, Number(mod.altura_mm) || 600)
  const currentId = mod.id
  const useAlvenaria = listaPontos.value.length >= 2
  return {
    x: mod.x_mm,
    y: mod.y_mm,
    rotation: mod.rotacao_graus ?? 0,
    draggable: true,
    dragBoundFunc: (pos) => {
      const snapped = useAlvenaria
        ? snapToAlvenariaEModulos(pos, currentId, w, h, mod)
        : snapToBordasEModulos(pos, currentId, w, h, L, P)
      return { x: snapped.x, y: snapped.y }
    },
    onDragmove: (e) => onModuloDragMove(e, mod),
    onDragend: (e) => onModuloDragEnd(e, mod),
  }
}

function getModuloRectConfig(mod) {
  const w = Math.max(1, Number(mod.largura_mm) || 600)
  const h = Math.max(1, Number(mod.altura_mm) || 600)
  const selecionado = moduloSelecionadoId.value === mod.id
  const medicaoFina = modoMedicaoFina.value
  const stroke = medicaoFina ? (selecionado ? '#c2410c' : '#ea580c') : (selecionado ? '#475569' : '#94a3b8')
  const fill = medicaoFina ? (selecionado ? '#fed7aa' : '#ffedd5') : (selecionado ? '#cbd5e1' : '#e2e8f0')
  return {
    width: w,
    height: h,
    fill,
    stroke,
    strokeWidth: selecionado ? 2 : 1.5,
    cornerRadius: 6,
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowBlur: 8,
    shadowOffset: { x: 0, y: 2 },
    listening: false,
  }
}

function getModuloLabelConfig(mod) {
  const w = Math.max(1, Number(mod.largura_mm) || 600)
  const h = Math.max(1, Number(mod.altura_mm) || 600)
  const fontSize = Math.max(12, Math.min(16, 14))
  return {
    x: 0,
    y: h / 2 - fontSize / 2 - 1,
    width: w,
    text: `${mod.largura_mm} × ${mod.altura_mm}`,
    fontSize,
    fontFamily: 'system-ui, sans-serif',
    fill: '#475569',
    align: 'center',
    listening: false,
  }
}

function getModuloCotaLarguraConfig(mod) {
  const w = Math.max(1, Number(mod.largura_mm) || 600)
  return {
    x: 0,
    y: -24,
    width: w,
    text: `${mod.largura_mm} mm`,
    fontSize: 13,
    fontFamily: 'system-ui, sans-serif',
    fill: '#334155',
    align: 'center',
    fontStyle: '600',
    listening: false,
  }
}

// Cotas dinâmicas: do módulo selecionado (em mm no viewport)
const distEsquerdaMm = computed(() =>
  moduloSelecionado.value ? Math.round(moduloSelecionado.value.x_mm) : 0
)
const distTopoMm = computed(() =>
  moduloSelecionado.value ? Math.round(moduloSelecionado.value.y_mm) : 0
)

const cotaLeftConfig = computed(() => {
  if (!moduloSelecionado.value) return null
  const mod = moduloSelecionado.value
  const stroke = '#475569'
  return {
    points: [0, mod.y_mm, mod.x_mm, mod.y_mm],
    stroke,
    strokeWidth: 2,
    fill: stroke,
    pointerLength: 8,
    pointerWidth: 8,
    pointerAtBeginning: true,
    pointerAtEnding: true,
  }
})

const cotaTopConfig = computed(() => {
  if (!moduloSelecionado.value) return null
  const mod = moduloSelecionado.value
  const stroke = '#475569'
  return {
    points: [mod.x_mm, 0, mod.x_mm, mod.y_mm],
    stroke,
    strokeWidth: 2,
    fill: stroke,
    pointerLength: 8,
    pointerWidth: 8,
    pointerAtBeginning: true,
    pointerAtEnding: true,
  }
})

const cotaLeftLabelConfig = computed(() => {
  if (!moduloSelecionado.value || distEsquerdaMm.value < 0) return null
  const mod = moduloSelecionado.value
  const midX = mod.x_mm / 2
  return {
    x: midX - 20,
    y: mod.y_mm - 24,
    width: 40,
    text: `${distEsquerdaMm.value} mm`,
    fontSize: 11,
    fill: '#475569',
    align: 'center',
    fontStyle: '500',
  }
})

const cotaTopLabelConfig = computed(() => {
  if (!moduloSelecionado.value || distTopoMm.value < 0) return null
  const mod = moduloSelecionado.value
  const midY = mod.y_mm / 2
  return {
    x: mod.x_mm - 36,
    y: midY - 6,
    width: 72,
    text: `${distTopoMm.value} mm`,
    fontSize: 11,
    fill: '#475569',
    align: 'center',
    fontStyle: '500',
  }
})

function onModuloDragMove(e, mod) {
  const node = e.target
  if (!node || !mod) return
  mod.x_mm = node.x()
  mod.y_mm = node.y()
  const L = Number(dimensoesSala.value.largura_mm) || 3000
  const P = Number(dimensoesSala.value.profundidade_mm) || 2500
  const w = Number(mod.largura_mm) || 600
  const h = Number(mod.altura_mm) || 600
  const useAlvenaria = listaPontos.value.length >= 2
  const snapped = useAlvenaria
    ? snapToAlvenariaEModulos({ x: mod.x_mm, y: mod.y_mm }, mod.id, w, h, mod)
    : snapToBordasEModulos({ x: mod.x_mm, y: mod.y_mm }, mod.id, w, h, L, P)
  const posChanged = snapped.x !== mod.x_mm || snapped.y !== mod.y_mm
  const rot = snapped.rotation ?? mod.rotacao_graus ?? 0
  const rotChanged = useAlvenaria && (mod.rotacao_graus ?? 0) !== rot
  if (posChanged) {
    mod.x_mm = snapped.x
    mod.y_mm = snapped.y
    node.position({ x: mod.x_mm, y: mod.y_mm })
  }
  if (rotChanged) {
    mod.rotacao_graus = rot
    node.rotation(rot)
  }
}

function onModuloClick(e, mod) {
  moduloSelecionadoId.value = mod.id
  pontoTecnicoSelecionadoId.value = null
  paredeSelecionada.value = null
  const node = e?.target
  if (node && typeof node.moveToTop === 'function') node.moveToTop()
}

function onModuloDragEnd(e, mod) {
  const node = e.target
  if (node && mod) {
    mod.x_mm = node.x()
    mod.y_mm = node.y()
  }
}

function adicionarModulo2D() {
  const L = Number(dimensoesSala.value.largura_mm) || 3000
  const P = Number(dimensoesSala.value.profundidade_mm) || 2500
  const w = 600
  const h = 600
  const x = Math.max(0, (L - w) / 2)
  const y = Math.max(0, (P - h) / 2)
  modulosAtivos.value = [
    ...modulosAtivos.value,
    {
      id: gerarIdModulo(),
      tipoModulo: 'balcao_simples',
      x_mm: x,
      y_mm: y,
      largura_mm: w,
      altura_mm: h,
      profundidade_mm: 600,
      alturaPisoZ_mm: 0,
    },
  ]
  moduloSelecionadoId.value = modulosAtivos.value[modulosAtivos.value.length - 1].id
}

/** Captura estado atual e exibe JSON no console. Preparado para envio via axios ao backend (Lightsail). */
function salvarAmbiente() {
  const folga = modoMedicaoFina.value ? Math.max(0, Number(folgaInstalacaoMm.value) || 0) : 0
  const peDireito = Math.max(500, Number(peDireitoSalaMm.value) || 2600)
  const payload = {
    nome_projeto: 'Visual Lab',
    timestamp: new Date().toISOString(),
    modo: modoMedicaoFina.value ? 'medicao_fina' : 'orcamento',
    ambiente: {
      dimensoes_mm: {
        largura_mm: Number(dimensoesSala.value.largura_mm) || 3000,
        profundidade_mm: Number(dimensoesSala.value.profundidade_mm) || 2500,
      },
      pe_direito_mm: peDireito,
      bordas_vao_livre: { ...bordasVaoLivre.value },
      paredes_ajustes: { ...paredesAjustes.value },
      paredes: listaPontos.value.length >= 2
        ? segmentosAlvenaria.value.map((seg, idx) => ({
            indice: idx,
            i: seg.i,
            j: seg.j,
            altura_mm: peDireito,
          }))
        : ['norte', 'sul', 'leste', 'oeste'].map((borda) => ({
            borda,
            altura_mm: peDireito,
          })),
      conferencia_paredes: modoMedicaoFina.value ? {
        largura_mm: conferenciaParedes.value.largura_mm ?? null,
        profundidade_mm: conferenciaParedes.value.profundidade_mm ?? null,
      } : undefined,
      folga_instalacao_mm: modoMedicaoFina.value ? folga : undefined,
      viewport: {
        scale: viewportScale.value,
        x: viewportX.value,
        y: viewportY.value,
      },
      modulos: modulosAtivos.value.map((m) => ({
        id: m.id,
        tipoModulo: m.tipoModulo || 'balcao_simples',
        x_mm: Math.round(m.x_mm),
        y_mm: Math.round(m.y_mm),
        largura_mm: Number(m.largura_mm) || 600,
        altura_mm: Number(m.altura_mm) || 600,
        profundidade_mm: Number(m.profundidade_mm) ?? 600,
        altura_piso_z_mm: Number(m.alturaPisoZ_mm) ?? 0,
        pecas: calcularPecas(m, folga),
      })),
      pontos_tecnicos: pontosTecnicos.value.map((pt) => ({
        id: pt.id,
        tipo: pt.tipo,
        x_mm: Math.round(pt.x_mm),
        y_mm: Math.round(pt.y_mm),
      })),
    },
  }
  const json = JSON.stringify(payload, null, 2)
  console.log('Visual Lab — Estado do projeto (para backend):', json)
  // Futuro: await axios.post('/api/visual-lab/salvar', payload)
}

function ajustarMedida(campo, delta) {
  const mod = moduloSelecionado.value
  if (!mod || (campo !== 'largura_mm' && campo !== 'altura_mm')) return
  const atual = Number(mod[campo]) || 600
  const novo = Math.max(1, atual + delta)
  mod[campo] = novo
}

/**
 * Calcula o array de peças (explosão) do módulo conforme o tipo, descontando espessura do MDF (18mm).
 * Na Medição Fina, folgaMm é descontada da largura final (fechamento lateral).
 * @param {{ tipoModulo?: string, largura_mm?: number, altura_mm?: number, profundidade_mm?: number }} modulo
 * @param {number} [folgaMm] Folga de instalação (mm); subtraída da largura quando em Medição Fina.
 * @returns {{ nome: string, largura_mm: number, altura_mm: number }[]}
 */
function calcularPecas(modulo, folgaMm = 0) {
  const e = ESPESSURA_MDF_MM
  const folga = Math.max(0, Number(folgaMm) || 0)
  const L = Math.max(1, Number(modulo.largura_mm) || 600) - folga
  const A = Math.max(1, Number(modulo.altura_mm) || 600)
  const P = Math.max(e, Number(modulo.profundidade_mm) || 600)
  const tipo = modulo.tipoModulo || 'balcao_simples'

  if (tipo === 'balcao_simples') {
    return [
      { nome: 'tampo', largura_mm: L, altura_mm: P },
      { nome: 'base', largura_mm: L, altura_mm: P },
      { nome: 'lateral_esquerda', largura_mm: P, altura_mm: A - 2 * e },
      { nome: 'lateral_direita', largura_mm: P, altura_mm: A - 2 * e },
      { nome: 'fundo', largura_mm: L - 2 * e, altura_mm: A - 2 * e },
    ]
  }

  return []
}

// Zoom centralizado: ponto sob o cursor permanece fixo
function onStageWheel(e) {
  e.preventDefault()
  const container = stageContainer2d.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  const pointerStageX = (e.clientX - rect.left) * (stageWidth.value / rect.width)
  const pointerStageY = (e.clientY - rect.top) * (stageHeight.value / rect.height)
  const delta = -e.deltaY * 0.002
  const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, viewportScale.value * (1 + delta)))
  const ratio = newScale / viewportScale.value
  viewportX.value = pointerStageX - (pointerStageX - viewportX.value) * ratio
  viewportY.value = pointerStageY - (pointerStageY - viewportY.value) * ratio
  viewportScale.value = newScale
}

function onViewportDragMove(e) {
  const node = e.target
  if (node) {
    viewportX.value = node.x()
    viewportY.value = node.y()
  }
}

function onViewportDragEnd(e) {
  const node = e.target
  if (node) {
    viewportX.value = node.x()
    viewportY.value = node.y()
  }
}

function resetarVisao() {
  viewportScale.value = 1
  viewportX.value = 0
  viewportY.value = 0
}

// Preparação para multi-touch (Capacitor/tablet): pinch-to-zoom
function getTouchDistance(touches) {
  if (touches.length < 2) return null
  const a = touches[0]
  const b = touches[1]
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
}
function getTouchCenter(touches, containerRect) {
  if (touches.length < 2) return null
  const cx = (touches[0].clientX + touches[1].clientX) / 2
  const cy = (touches[0].clientY + touches[1].clientY) / 2
  return {
    stageX: (cx - containerRect.left) * (stageWidth.value / containerRect.width),
    stageY: (cy - containerRect.top) * (stageHeight.value / containerRect.height),
  }
}
function onStageTouchStart(e) {
  if (e.touches.length === 2) {
    lastTouchDistance.value = getTouchDistance(e.touches)
    const rect = stageContainer2d.value?.getBoundingClientRect()
    if (rect) lastTouchCenter.value = getTouchCenter(e.touches, rect)
  }
}
function onStageTouchMove(e) {
  if (e.touches.length === 2 && lastTouchDistance.value != null && lastTouchCenter.value) {
    const dist = getTouchDistance(e.touches)
    const rect = stageContainer2d.value?.getBoundingClientRect()
    if (!rect || dist == null) return
    const center = getTouchCenter(e.touches, rect)
    if (!center) return
    const ratio = dist / lastTouchDistance.value
    const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, viewportScale.value * ratio))
    const r = newScale / viewportScale.value
    viewportX.value = center.stageX - (center.stageX - viewportX.value) * r
    viewportY.value = center.stageY - (center.stageY - viewportY.value) * r
    viewportScale.value = newScale
    lastTouchDistance.value = dist
    lastTouchCenter.value = center
  }
}
function onStageTouchEnd(e) {
  if (e.touches.length < 2) {
    lastTouchDistance.value = null
    lastTouchCenter.value = null
  }
}

function updateStageSize() {
  if (!stageContainer2d.value || typeof window === 'undefined') return
  const el = stageContainer2d.value
  const w = Math.max(1, el.clientWidth || 0)
  const h = Math.max(1, el.clientHeight || 0)
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  pixelRatio.value = dpr
  // Stage com largura e altura totais do container (pixels físicos para grid nítido)
  stageWidth.value = w * dpr
  stageHeight.value = h * dpr
}

async function init2D() {
  await nextTick()
  updateStageSize()
  createGridPatternImage()
  const el = stageContainer2d.value
  if (!el) return
  const ro = new ResizeObserver(() => updateStageSize())
  ro.observe(el)
  el.__resizeObserver = ro
  window.addEventListener('resize', updateStageSize)
  window.addEventListener('orientationchange', onOrientationChange)
}

function onOrientationChange() {
  setTimeout(updateStageSize, 100)
}

function destroy2D() {
  window.removeEventListener('resize', updateStageSize)
  window.removeEventListener('orientationchange', onOrientationChange)
  const el = stageContainer2d.value
  if (el?.__resizeObserver) {
    el.__resizeObserver.disconnect()
    delete el.__resizeObserver
  }
  moduloSelecionadoId.value = null
}

// —— 3D (Three.js) ——
const stageContainer3d = ref(null)
const dims3d = ref({ largura: 600, altura: 600, profundidade: 18 })

let scene = null
let camera = null
let renderer = null
let controls = null
let cubeMesh = null
let animationId = null
let threeConfig = null
const TARGET_FPS_30_INTERVAL = 1000 / 30

async function init3D() {
  if (!stageContainer3d.value) return
  threeConfig = await getThreeConfig()
  const width = stageContainer3d.value.clientWidth
  const height = stageContainer3d.value.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1e293b)

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 10000)
  camera.position.set(150, 150, 150)

  const antialias = threeConfig.quality === 'high'
  const pixelRatio = threeConfig.quality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1
  renderer = new THREE.WebGLRenderer({ antialias })
  renderer.setSize(width, height)
  renderer.setPixelRatio(pixelRatio)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = threeConfig.shadows
  if (threeConfig.shadows) {
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
  }
  stageContainer3d.value.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const dir = new THREE.DirectionalLight(0xffffff, 0.8)
  dir.position.set(2, 3, 2)
  if (threeConfig.shadows) {
    dir.castShadow = true
    dir.shadow.mapSize.width = 1024
    dir.shadow.mapSize.height = 1024
  }
  scene.add(dir)

  if (threeConfig.shadows) {
    const groundGeometry = new THREE.PlaneGeometry(500, 500)
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x334155 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -50
    ground.receiveShadow = true
    scene.add(ground)
  }

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 10
  controls.maxDistance = 800

  let lastRenderTime = 0
  function animate(now = 0) {
    animationId = requestAnimationFrame(animate)
    if (threeConfig?.targetFps != null) {
      const elapsed = now - lastRenderTime
      if (elapsed < TARGET_FPS_30_INTERVAL) return
      lastRenderTime = now
    }
    controls.update()
    renderer.render(scene, camera)
  }
  animate()
}

function gerarCubo3D() {
  if (!scene || !camera) return
  if (cubeMesh) {
    scene.remove(cubeMesh)
    cubeMesh.geometry.dispose()
    cubeMesh.material.dispose()
  }
  const L = (dims3d.value.largura || 600) / 10
  const A = (dims3d.value.altura || 600) / 10
  const P = (dims3d.value.profundidade || 18) / 10
  const geometry = new THREE.BoxGeometry(L, A, P)
  const material = new THREE.MeshStandardMaterial({
    color: 0xc4a574,
    roughness: 0.7,
    metalness: 0.05,
  })
  cubeMesh = new THREE.Mesh(geometry, material)
  if (threeConfig?.shadows) {
    cubeMesh.castShadow = true
    cubeMesh.receiveShadow = true
  }
  scene.add(cubeMesh)
  const maxDim = Math.max(L, A, P)
  const dist = maxDim * 2.2
  camera.position.set(dist * 0.7, dist * 0.7, dist)
  camera.lookAt(0, 0, 0)
  if (controls) controls.update()
}

function destroy3D() {
  if (animationId) cancelAnimationFrame(animationId)
  animationId = null
  if (cubeMesh && scene) {
    scene.remove(cubeMesh)
    cubeMesh.geometry?.dispose()
    cubeMesh.material?.dispose()
    cubeMesh = null
  }
  if (controls) controls.dispose()
  if (renderer && stageContainer3d.value?.contains(renderer.domElement)) {
    stageContainer3d.value.removeChild(renderer.domElement)
  }
  renderer?.dispose()
  renderer = null
  scene = null
  camera = null
  controls = null
}

watch(tabAtiva, (t) => {
  if (t === '2d') {
    setTimeout(() => { init2D() }, 50)
    destroy3D()
  } else {
    setTimeout(() => { init3D() }, 50)
    destroy2D()
  }
})

function onKeyDown(e) {
  if (e.key === 'Shift') shiftKeyPressed.value = true
}
function onKeyUp(e) {
  if (e.key === 'Shift') shiftKeyPressed.value = false
}

onMounted(() => {
  if (tabAtiva.value === '2d') init2D()
  else init3D()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onBeforeUnmount(() => {
  destroy2D()
  destroy3D()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<style scoped>
.visual-lab {
  /* Fullscreen: sem scroll na página */
  box-sizing: border-box;
}
.canvas-area {
  /* Área de desenho preenche 100% do espaço restante */
  min-height: 0;
}
.canvas-area-stage {
  width: 100%;
  height: 100%;
}
.visual-lab-2d-stage :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
