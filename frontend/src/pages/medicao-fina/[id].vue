<template>
  <section
    class="medicao-fina-page medicao-fina-page--immersive ds-page-context ds-page-context--editor animate-page-in"
    :class="{
      'medicao-fina-page--planta-fullscreen': vistaEditor === 'planta2d',
      'medicao-fina-page--projeto-tecnico': modoPTImersivo,
    }"
  >
    <PageHeader
      v-show="!modoPTImersivo"
      :title="pageTitle"
      :subtitle="pageSubtitle"
      icon="pi pi-ruler"
    >
      <template #actions>
        <div class="medicao-fina-page__header-actions ds-page-context__actions">
          <span v-if="statusTarefaLabel" class="ds-status-pill" :class="statusTarefaVariant">
            {{ statusTarefaLabel }}
          </span>
          <Button variant="ghost" size="sm" class="!rounded-xl" @click="voltar">
            <i class="pi pi-arrow-left mr-2 text-xs" />
            {{ backLabel }}
          </Button>
        </div>
      </template>
    </PageHeader>

    <div
      v-if="!erroCarregamento && (tarefa || contextoDiretoProjeto) && !loading && !loadingMedicao && vistaEditor !== 'planta2d' && !modoPTImersivo"
      class="medicao-fina-page__context-strip"
      aria-label="Contexto do projeto"
    >
      <span v-if="clienteNome" class="medicao-fina-page__context-chip">
        <i class="pi pi-user text-[10px]" />
        {{ clienteNome }}
      </span>
      <span class="medicao-fina-page__context-chip">
        <i class="pi pi-briefcase text-[10px]" />
        {{ projetoLabel }}
      </span>
      <span class="medicao-fina-page__context-chip">
        <i class="pi pi-home text-[10px]" />
        {{ ambienteAtualLabel }}
      </span>
      <span class="medicao-fina-page__context-chip medicao-fina-page__context-chip--accent">
        {{ rotuloVistaOuModo }}
      </span>
    </div>

    <div class="medicao-fina-page__body ds-page-context__content">
        <div v-if="erroCarregamento" class="medicao-fina-page__state ds-alert ds-alert--danger">
          <p class="medicao-fina-page__state-title">{{ erroCarregamento }}</p>
          <p v-if="!tarefa?.projeto_id" class="medicao-fina-page__state-copy">Vincule um projeto à tarefa na Agenda da Produção.</p>
          <router-link :to="backTo" class="medicao-fina-page__state-link">{{ backLabel }}</router-link>
        </div>

        <div v-else-if="!tarefa && !loading" class="medicao-fina-page__state ds-alert ds-alert--info">
          <p class="medicao-fina-page__state-title">{{ contextoDiretoProjeto ? 'Projeto não encontrado.' : 'Tarefa não encontrada.' }}</p>
          <router-link :to="backTo" class="medicao-fina-page__state-link">{{ backLabel }}</router-link>
        </div>

        <Loading v-else-if="loading || loadingMedicao" />

        <template v-else>
          <div
            v-if="modoPTImersivo"
            ref="fullscreenHostRef"
            class="medicao-fina-page__projeto-tecnico-root"
          >
            <div class="medicao-fina-page__pt-toolbar">
              <Button variant="ghost" size="sm" class="!rounded-xl shrink-0" type="button" @click="sairModoProjetoTecnico">
                <i class="pi pi-times mr-2 text-xs" />
                Sair
              </Button>
              <span class="medicao-fina-page__pt-title truncate">{{ ambienteAtualLabel }}</span>
              <div class="medicao-fina-page__pt-tabs" role="tablist" aria-label="Vista imersiva">
                <button
                  type="button"
                  class="medicao-fina-page__pt-tab"
                  :class="{ 'medicao-fina-page__pt-tab--on': painelPT === 'split' }"
                  @click="setPainelProjetoTecnico('split')"
                >
                  Dividido
                </button>
                <button
                  type="button"
                  class="medicao-fina-page__pt-tab"
                  :class="{ 'medicao-fina-page__pt-tab--on': painelPT === '2d' }"
                  @click="setPainelProjetoTecnico('2d')"
                >
                  2D
                </button>
                <button
                  type="button"
                  class="medicao-fina-page__pt-tab"
                  :class="{ 'medicao-fina-page__pt-tab--on': painelPT === '3d' }"
                  @click="setPainelProjetoTecnico('3d')"
                >
                  3D
                </button>
              </div>
              <Button variant="secondary" size="sm" class="!rounded-xl shrink-0" type="button" :disabled="salvando || loadingMedicao" @click="atualizar3dDoBanco">
                <i class="pi pi-refresh mr-2 text-xs" />
                Atualizar 3D
              </Button>
              <Button variant="primary" size="sm" class="!rounded-xl shrink-0 !font-bold" type="button" :loading="salvando" :disabled="salvando" @click="salvar">
                Salvar croqui
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="!rounded-xl shrink-0"
                type="button"
                :disabled="!extrudavelParaVisualizador?.paredes?.length"
                @click="capturarThumbnail3d"
              >
                <i class="pi pi-camera mr-2 text-xs" />
                Thumbnail
              </Button>
            </div>
            <div class="medicao-fina-page__pt-split">
              <div
                v-show="painelPT === 'split' || painelPT === '2d'"
                class="medicao-fina-page__pt-pane medicao-fina-page__pt-pane--2d"
              >
                <MedicaoCanvas
                  :key="`pt-planta-${ambienteAtualIndex}`"
                  class="medicao-fina-page__croqui medicao-fina-page__croqui--fill"
                  :model-value="esquemaPlantaParaCanvas"
                  :foto-url="dadosAmbienteAtual?.backgroundImage ?? null"
                  @update:model-value="atualizarEsquemaPlanta"
                />
              </div>
              <div
                v-show="painelPT === 'split' || painelPT === '3d'"
                class="medicao-fina-page__pt-pane medicao-fina-page__pt-pane--3d"
              >
                <Visualizador3D
                  ref="viewer3dRef"
                  :extrudavel-json="extrudavelParaVisualizador"
                  :extrudavel-revision="extrudavelRevisionCombinada"
                />
              </div>
            </div>
          </div>

          <template v-else>
          <div
            class="medicao-fina-page__toolbar ds-shell-card"
            :class="{ 'medicao-fina-page__toolbar--planta': vistaEditor === 'planta2d' }"
          >
            <div class="medicao-fina-page__toolbar-primary">
              <div class="medicao-fina-page__toolbar-group medicao-fina-page__toolbar-group--actions">
                <Button
                  v-if="vistaEditor === 'planta2d'"
                  variant="ghost"
                  size="sm"
                  class="medicao-fina-page__toolbar-icon-btn !rounded-xl !min-h-11 !min-w-11 shrink-0"
                  :title="backLabel"
                  :aria-label="backLabel"
                  @click="voltar"
                >
                  <i class="pi pi-arrow-left text-base" />
                </Button>
                <span
                  v-if="vistaEditor === 'planta2d' && statusTarefaLabel"
                  class="ds-status-pill medicao-fina-page__toolbar-status max-sm:hidden"
                  :class="statusTarefaVariant"
                >
                  {{ statusTarefaLabel }}
                </span>
                <Button variant="secondary" class="!rounded-xl" @click="novoAmbiente">
                  <i class="pi pi-plus mr-2 text-xs opacity-90" />
                  Novo ambiente
                </Button>
                <Button
                  variant="secondary"
                  class="!rounded-xl"
                  type="button"
                  :disabled="salvando || loadingMedicao"
                  title="Recarregar croqui do servidor e atualizar o 3D"
                  @click="atualizar3dDoBanco"
                >
                  <i class="pi pi-refresh mr-2 text-xs" />
                  Atualizar 3D
                </Button>
                <Button
                  variant="secondary"
                  class="!rounded-xl !font-semibold"
                  type="button"
                  :disabled="loadingMedicao"
                  title="Tela cheia: planta 2D + visualização 3D (sem menu do ERP)"
                  @click="entrarModoProjetoTecnico"
                >
                  <i class="pi pi-window-maximize mr-2 text-xs" />
                  Modo Projeto Técnico
                </Button>
                <Button
                  variant="ghost"
                  class="!rounded-xl"
                  type="button"
                  :disabled="!extrudavelParaVisualizador?.paredes?.length"
                  title="Salvar PNG da vista 3D atual na medição (requer croqui salvo)"
                  @click="capturarThumbnail3d"
                >
                  <i class="pi pi-camera mr-2 text-xs" />
                  Capturar thumbnail
                </Button>
                <Button variant="primary" class="medicao-fina-page__toolbar-save !rounded-xl !font-bold" :loading="salvando" :disabled="salvando" @click="salvar">
                  <i v-if="!salvando" class="pi pi-check mr-2 text-xs" />
                  {{ salvando ? 'Salvando...' : 'Salvar croqui' }}
                </Button>
              </div>
            </div>

            <div class="medicao-fina-page__toolbar-segments" role="presentation">
              <div class="medicao-fina-page__segment-wrap" role="tablist" aria-label="Vista do editor">
                <button
                  type="button"
                  class="ds-segmented__button medicao-fina-page__segment-btn"
                  :class="{ 'ds-segmented__button--active': vistaEditor === 'foto' }"
                  @click="vistaEditor = 'foto'"
                >
                  <i class="pi pi-image" />
                  <span>Croqui na foto</span>
                </button>
                <button
                  type="button"
                  class="ds-segmented__button medicao-fina-page__segment-btn"
                  :class="{ 'ds-segmented__button--active': vistaEditor === 'planta2d' }"
                  @click="vistaEditor = 'planta2d'"
                >
                  <i class="pi pi-th-large" />
                  <span>Planta 2D</span>
                </button>
              </div>
              <div
                v-show="vistaEditor === 'foto'"
                class="medicao-fina-page__segment-wrap"
                role="tablist"
                aria-label="Modo do editor"
              >
                <button
                  type="button"
                  class="ds-segmented__button medicao-fina-page__segment-btn"
                  :class="{ 'ds-segmented__button--active': modo === 'ponto' }"
                  @click="modo = 'ponto'"
                >
                  <i class="pi pi-map-marker" />
                  <span>Ponto técnico</span>
                </button>
                <button
                  type="button"
                  class="ds-segmented__button medicao-fina-page__segment-btn"
                  :class="{ 'ds-segmented__button--active': modo === 'cota' }"
                  @click="modo = 'cota'"
                >
                  <i class="pi pi-arrows-h" />
                  <span>Cota</span>
                </button>
              </div>
            </div>
          </div>

          <div class="medicao-fina-page__workspace">
            <aside v-show="vistaEditor !== 'planta2d'" class="medicao-fina-page__rail">
              <section class="medicao-fina-page__panel ds-shell-card">
                <div class="medicao-fina-page__panel-head">
                  <div>
                    <p class="medicao-fina-page__panel-kicker">Ambiente ativo</p>
                    <h3 class="medicao-fina-page__panel-title">{{ ambienteAtualLabel }}</h3>
                  </div>
                  <span class="medicao-fina-page__mode-badge" :class="modoBadgeClass">{{ rotuloVistaOuModo }}</span>
                </div>

                <div class="medicao-fina-page__panel-grid">
                  <article class="medicao-fina-page__mini-stat">
                    <span class="medicao-fina-page__mini-stat-label">Foto base</span>
                    <strong class="medicao-fina-page__mini-stat-value">{{ ambienteAtualTemFoto ? 'OK' : 'Pendente' }}</strong>
                  </article>
                  <article class="medicao-fina-page__mini-stat">
                    <span class="medicao-fina-page__mini-stat-label">Pontos</span>
                    <strong class="medicao-fina-page__mini-stat-value">{{ totalPontosAmbienteAtual }}</strong>
                  </article>
                  <article class="medicao-fina-page__mini-stat">
                    <span class="medicao-fina-page__mini-stat-label">Símbolos</span>
                    <strong class="medicao-fina-page__mini-stat-value">{{ totalSimbolosAmbienteAtual }}</strong>
                  </article>
                  <article class="medicao-fina-page__mini-stat">
                    <span class="medicao-fina-page__mini-stat-label">Cotas</span>
                    <strong class="medicao-fina-page__mini-stat-value">{{ totalCotasAmbienteAtual }}</strong>
                  </article>
                  <article v-if="totalParedesPlanta > 0 || totalPontosPlanta > 0" class="medicao-fina-page__mini-stat">
                    <span class="medicao-fina-page__mini-stat-label">Planta 2D</span>
                    <strong class="medicao-fina-page__mini-stat-value">{{ totalParedesPlanta }}p · {{ totalPontosPlanta }}pt</strong>
                  </article>
                </div>

                <p class="medicao-fina-page__panel-copy">
                  {{ painelModoDescricao }}
                </p>
              </section>

              <section class="medicao-fina-page__panel ds-shell-card">
                <div class="medicao-fina-page__panel-head">
                  <div>
                    <p class="medicao-fina-page__panel-kicker">Navegação</p>
                    <h3 class="medicao-fina-page__panel-title">Ambientes do croqui</h3>
                  </div>
                  <span class="medicao-fina-page__panel-counter">{{ ambientes.length }}</span>
                </div>

                <div class="medicao-fina-page__ambientes-list">
                  <button
                    v-for="card in ambienteCards"
                    :key="card.index"
                    type="button"
                    class="medicao-fina-page__ambiente-card"
                    :class="{ 'medicao-fina-page__ambiente-card--active': card.index === ambienteAtualIndex }"
                    @click="ambienteAtualIndex = card.index"
                  >
                    <span class="medicao-fina-page__ambiente-card-title">{{ card.label }}</span>
                    <span class="medicao-fina-page__ambiente-card-meta">{{ card.summary }}</span>
                  </button>
                </div>
              </section>

              <section class="medicao-fina-page__panel ds-shell-card">
                <div class="medicao-fina-page__panel-head">
                  <div>
                    <p class="medicao-fina-page__panel-kicker">Comparação técnica</p>
                    <h3 class="medicao-fina-page__panel-title">Referência pré-orçamento</h3>
                  </div>
                </div>

                <p v-if="loadingComparativoPre" class="medicao-fina-page__panel-copy">
                  Carregando medidas do pré-orçamento...
                </p>
                <template v-else-if="ambientePreOrcamentoAtual">
                  <div class="medicao-fina-page__mini-compare-grid">
                    <article class="medicao-fina-page__mini-stat">
                      <span class="medicao-fina-page__mini-stat-label">Largura</span>
                      <strong class="medicao-fina-page__mini-stat-value">{{ formatMmFromM(ambientePreOrcamentoAtual.largura_m) }}</strong>
                    </article>
                    <article class="medicao-fina-page__mini-stat">
                      <span class="medicao-fina-page__mini-stat-label">Pé-direito</span>
                      <strong class="medicao-fina-page__mini-stat-value">{{ formatMmFromM(ambientePreOrcamentoAtual.pe_direito_m) }}</strong>
                    </article>
                    <article class="medicao-fina-page__mini-stat">
                      <span class="medicao-fina-page__mini-stat-label">Profundidade</span>
                      <strong class="medicao-fina-page__mini-stat-value">{{ formatMmFromM(ambientePreOrcamentoAtual.profundidade_m) }}</strong>
                    </article>
                  </div>

                  <div v-if="ambientePreOrcamentoAtual.paredes?.length" class="medicao-fina-page__paredes-pre-list">
                    <p class="medicao-fina-page__paredes-pre-title">Paredes cadastradas no pré:</p>
                    <ul>
                      <li v-for="parede in ambientePreOrcamentoAtual.paredes" :key="parede.id || parede.nome">
                        <span>{{ parede.nome || 'Parede' }}</span>
                        <strong>{{ formatMmFromM(parede.largura_m) }}</strong>
                      </li>
                    </ul>
                  </div>
                </template>
                <p v-else class="medicao-fina-page__panel-copy">
                  Sem referência de pré-orçamento para este ambiente.
                </p>
              </section>

              <section class="medicao-fina-page__panel ds-shell-card">
                <div class="medicao-fina-page__panel-head">
                  <div>
                    <p class="medicao-fina-page__panel-kicker">Guia rápido</p>
                    <h3 class="medicao-fina-page__panel-title">Sequência recomendada</h3>
                  </div>
                </div>

                <ul class="medicao-fina-page__checklist">
                  <li v-for="item in orientacoesEditor" :key="item.title" class="medicao-fina-page__checklist-item">
                    <span class="medicao-fina-page__checklist-icon">
                      <i :class="item.icon" />
                    </span>
                    <div>
                      <p class="medicao-fina-page__checklist-title">{{ item.title }}</p>
                      <p class="medicao-fina-page__checklist-copy">{{ item.copy }}</p>
                    </div>
                  </li>
                </ul>
              </section>
            </aside>

            <div class="medicao-fina-page__canvas-column">
              <div class="medicao-fina-page__editor-shell ds-shell-card">
                <!-- Wrapper único: Croqui tem 2 raízes (div + Teleport); v-show no componente não ocultava tudo -->
                <div
                  v-show="vistaEditor === 'foto'"
                  class="medicao-fina-page__editor-viewport"
                >
                  <CroquiTecnicoEditor
                    ref="editorRef"
                    class="medicao-fina-page__croqui medicao-fina-page__croqui--fill"
                    :model-value="dadosAmbienteAtual"
                    :modo="modo"
                    @update:model-value="atualizarAmbienteAtual"
                  />
                </div>
                <div
                  v-show="vistaEditor === 'planta2d'"
                  class="medicao-fina-page__editor-viewport"
                >
                  <MedicaoCanvas
                    :key="`planta-${ambienteAtualIndex}`"
                    class="medicao-fina-page__croqui medicao-fina-page__croqui--fill"
                    :model-value="esquemaPlantaParaCanvas"
                    :foto-url="dadosAmbienteAtual?.backgroundImage ?? null"
                    @update:model-value="atualizarEsquemaPlanta"
                  />
                </div>
              </div>

              <div
                v-show="vistaEditor !== 'planta2d'"
                class="medicao-fina-page__viewer3d-wrap ds-shell-card overflow-hidden flex flex-col min-h-[220px] shrink-0"
              >
                <div class="flex items-center justify-between gap-2 border-b border-border-ui px-3 py-2">
                  <h3 class="text-xs font-black uppercase tracking-wide text-text-main m-0">Pré-visualização 3D</h3>
                  <span class="text-[10px] text-text-soft truncate max-w-[10rem]" title="Extrusão a partir da planta 2D salva">Extrusão planta</span>
                </div>
                <div class="medicao-fina-page__viewer3d-host flex-1 min-h-[200px]">
                  <Visualizador3D
                    ref="viewer3dRef"
                    :extrudavel-json="extrudavelParaVisualizador"
                    :extrudavel-revision="extrudavelRevisionCombinada"
                  />
                </div>
              </div>
            </div>
          </div>
          </template>
        </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, defineAsyncComponent, nextTick } from 'vue'
import { medicaoPlanta2dFullscreen } from '@/shared/medicao-planta-chrome'
import {
  medicaoProjetoTecnicoImmersivo,
  medicaoProjetoTecnicoPainel,
} from '@/shared/medicao-projeto-tecnico-chrome'
import { useRoute, useRouter } from 'vue-router'
import { TotemFabricaService, MedicaoFinaService } from '@/services'
import { getExecucaoEtapaLabel, getSubetapaLabel } from '@/constantes'
import { notify } from '@/services/notify'
import { buildExtrudavelJson } from '@/utils/croqui-extrudavel.js'
import Button from '@/components/ui/Button.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Loading from '@/components/common/Loading.vue'
import CroquiTecnicoEditor from '@/components/croqui-tecnico/CroquiTecnicoEditor.vue'
import MedicaoCanvas from '@/components/medicao-fina/MedicaoCanvas.vue'

const Visualizador3D = defineAsyncComponent(() => import('@/components/medicao-fina/Visualizador3D.vue'))

/** Refs importados: leitura no template via computed */
const modoPTImersivo = computed(() => medicaoProjetoTecnicoImmersivo.value)
const painelPT = computed(() => medicaoProjetoTecnicoPainel.value)

function setPainelProjetoTecnico(m) {
  medicaoProjetoTecnicoPainel.value = m
}

definePage({ meta: { perm: 'agendamentos.producao' } })

const route = useRoute()
const router = useRouter()
const id = computed(() => {
  const raw = route.params?.id
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
})
const contextoDiretoProjeto = computed(() => String(route.query?.source || '').trim().toLowerCase() === 'projeto')
const projetoIdDireto = computed(() => (contextoDiretoProjeto.value ? id.value : null))
const tarefaId = computed(() => (contextoDiretoProjeto.value ? null : id.value))

const loading = ref(true)
const loadingMedicao = ref(false)
const erroCarregamento = ref('')
const tarefa = ref(null)
const dadosProjeto = ref(null)
const medicaoId = ref(null)
const ambientePadrao = ref('')
const nomesAmbientesProjeto = ref([])
const comparativoPre = ref(null)
const loadingComparativoPre = ref(false)
const salvando = ref(false)
const editorRef = ref(null)
/** Incrementado após salvar / “Atualizar 3D” para forçar redesenho no Three.js */
const extrudavelViewerRevision = ref(0)

/** 'foto' = croqui sobre foto; 'planta2d' = desenho esquemático (MedicaoCanvas) */
const vistaEditor = ref('foto')

watch(
  vistaEditor,
  (v) => {
    medicaoPlanta2dFullscreen.value = v === 'planta2d' && !medicaoProjetoTecnicoImmersivo.value
  },
  { immediate: true },
)

watch(medicaoProjetoTecnicoImmersivo, (im) => {
  if (im) {
    medicaoPlanta2dFullscreen.value = false
  } else if (vistaEditor.value === 'planta2d') {
    medicaoPlanta2dFullscreen.value = true
  }
})

const fullscreenHostRef = ref(null)
const viewer3dRef = ref(null)
let projetoTecnicoPediuFullscreen = false

function onFullscreenChange() {
  const fs = document.fullscreenElement || document.webkitFullscreenElement
  if (!fs && projetoTecnicoPediuFullscreen) {
    projetoTecnicoPediuFullscreen = false
    medicaoProjetoTecnicoImmersivo.value = false
    medicaoProjetoTecnicoPainel.value = 'split'
  }
}

async function entrarModoProjetoTecnico() {
  vistaEditor.value = 'planta2d'
  medicaoProjetoTecnicoPainel.value = 'split'
  medicaoProjetoTecnicoImmersivo.value = true
  medicaoPlanta2dFullscreen.value = false
  await nextTick()
  projetoTecnicoPediuFullscreen = true
  const el = fullscreenHostRef.value
  try {
    if (el?.requestFullscreen) await el.requestFullscreen()
    else if (el?.webkitRequestFullscreen) await el.webkitRequestFullscreen()
  } catch (_) {
    notify.info('Tela cheia não disponível neste navegador. O modo split 2D/3D continua ativo.')
  }
}

async function sairModoProjetoTecnico() {
  projetoTecnicoPediuFullscreen = false
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else if (document.webkitFullscreenElement) await document.webkitExitFullscreen?.()
  } catch (_) {}
  medicaoProjetoTecnicoImmersivo.value = false
  medicaoProjetoTecnicoPainel.value = 'split'
  if (vistaEditor.value === 'planta2d') medicaoPlanta2dFullscreen.value = true
}

async function capturarThumbnail3d() {
  const dataUrl = viewer3dRef.value?.captureThumbnailPng?.()
  if (!dataUrl) {
    notify.error('Não foi possível capturar a imagem 3D. Desenhe paredes na planta e verifique o WebGL.')
    return
  }
  if (!medicaoId.value) {
    notify.warning('Salve o croqui pelo menos uma vez para vincular a medição antes de gravar a miniatura.')
    return
  }
  try {
    await MedicaoFinaService.atualizar(medicaoId.value, { croqui_3d_thumbnail_data_url: dataUrl })
    notify.success('Miniatura 3D salva no servidor.')
  } catch (e) {
    const msg = e?.response?.data?.message || 'Falha ao salvar miniatura.'
    notify.error(msg)
  }
}

onBeforeUnmount(() => {
  medicaoPlanta2dFullscreen.value = false
  medicaoProjetoTecnicoImmersivo.value = false
  medicaoProjetoTecnicoPainel.value = 'split'
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
})

/** Lista de ambientes (cada um = um croqui com foto + pontos + símbolos + cotas) */
const ambientes = ref([{}])
const ambienteAtualIndex = ref(0)

const dadosAmbienteAtual = computed(() => ambientes.value[ambienteAtualIndex.value] ?? {})

const esquemaPlantaVazio = () => ({
  scaleMmPerPx: 2,
  walls: [],
  points: [],
})

const esquemaPlantaParaCanvas = computed(() => {
  const e = dadosAmbienteAtual.value?.esquemaPlanta
  if (e && typeof e === 'object') {
    return {
      scaleMmPerPx: Number(e.scaleMmPerPx) || 2,
      walls: Array.isArray(e.walls) ? e.walls : [],
      points: Array.isArray(e.points) ? e.points : [],
    }
  }
  return esquemaPlantaVazio()
})

function atualizarEsquemaPlanta(payload) {
  atualizarAmbienteAtual({ esquemaPlanta: payload })
}

const totalParedesPlanta = computed(() => (dadosAmbienteAtual.value?.esquemaPlanta?.walls || []).length)
const totalPontosPlanta = computed(() => (dadosAmbienteAtual.value?.esquemaPlanta?.points || []).length)

const backTo = computed(() => String(route.query?.back || '').trim() || (contextoDiretoProjeto.value ? '/producao/medicao-fina?etapa=pos' : '/totem-fabrica'))
const backLabel = computed(() => String(route.query?.backLabel || '').trim() || (contextoDiretoProjeto.value ? 'Voltar para medição fina' : 'Voltar ao totem'))
const tituloTarefa = computed(() => {
  if (route.query?.titulo) return String(route.query.titulo)
  if (tarefa.value?.subetapa) return getSubetapaLabel(tarefa.value.subetapa)
  if (tarefa.value?.titulo) return tarefa.value.titulo
  if (dadosProjeto.value?.cliente?.nome_completo || dadosProjeto.value?.cliente?.razao_social) {
    return dadosProjeto.value?.cliente?.nome_completo || dadosProjeto.value?.cliente?.razao_social
  }
  if (dadosProjeto.value?.codigo) return `Projeto ${dadosProjeto.value.codigo}`
  return contextoDiretoProjeto.value ? `Projeto #${id.value ?? ''}` : `Tarefa #${id.value ?? ''}`
})
const pageTitle = computed(() => String(route.query?.pageTitle || '').trim() || 'Medição Fina')
const pageSubtitle = computed(() => String(route.query?.subtitle || '').trim() || tituloTarefa.value)
const statusTarefaLabel = computed(() => {
  if (route.query?.status) return String(route.query.status)
  return getExecucaoEtapaLabel(tarefa.value?.execucao_etapa) || String(tarefa.value?.status || '').trim()
})
const projetoIdAtual = computed(() => Number(tarefa.value?.projeto_id || projetoIdDireto.value || 0) || null)
const clienteNome = computed(() => {
  return dadosProjeto.value?.cliente?.nome_completo
    || dadosProjeto.value?.cliente?.razao_social
    || dadosProjeto.value?.cliente?.nome
    || ''
})
const projetoLabel = computed(() => {
  if (dadosProjeto.value?.codigo) return `Projeto ${dadosProjeto.value.codigo}`
  if (projetoIdAtual.value) return `Projeto #${projetoIdAtual.value}`
  return 'Projeto em preparação'
})
const ambientePadraoLabel = computed(() => String(ambientePadrao.value || '').trim())
const ambienteAtualNome = computed(() => {
  const nome = String(nomesAmbientesProjeto.value[ambienteAtualIndex.value] || '').trim()
  return nome || ''
})
const ambienteAtualLabel = computed(() => ambienteAtualNome.value || `Ambiente ${ambienteAtualIndex.value + 1}`)
const totalPontosAmbienteAtual = computed(() => (dadosAmbienteAtual.value?.pontos || []).length)
const totalSimbolosAmbienteAtual = computed(() => (dadosAmbienteAtual.value?.simbolos || []).length)
const totalCotasAmbienteAtual = computed(() => (dadosAmbienteAtual.value?.cotas || []).length)
const ambienteAtualTemFoto = computed(() => !!dadosAmbienteAtual.value?.backgroundImage)
/** Faixa de contexto + badge do painel: reflete vista (foto vs planta) e modo do croqui */
const rotuloVistaOuModo = computed(() => {
  if (vistaEditor.value === 'planta2d') return 'Planta 2D'
  return modo.value === 'cota' ? 'Modo cota' : 'Modo ponto'
})
const modoAtualDescricao = computed(() => {
  if (modo.value === 'cota') {
    return 'Use este modo para lançar distâncias lineares e calibrar o desenho pela medida real do ambiente.'
  }
  return 'Use este modo para marcar tomadas, sifão, gás, vigas e outros pontos críticos diretamente sobre a foto.'
})
const painelModoDescricao = computed(() => {
  if (vistaEditor.value === 'planta2d') {
    return 'Desenhe paredes arrastando no quadriculado e informe mm. Arraste ícones da esquerda. Propriedades dos pontos ficam no painel direito do canvas.'
  }
  return modoAtualDescricao.value
})
const modoBadgeClass = computed(() => {
  if (vistaEditor.value === 'planta2d') return 'medicao-fina-page__mode-badge--neutral'
  return modo.value === 'cota'
    ? 'medicao-fina-page__mode-badge--warning'
    : 'medicao-fina-page__mode-badge--primary'
})
const statusTarefaVariant = computed(() => {
  const label = String(statusTarefaLabel.value || '').toLowerCase()
  if (label.includes('concl')) return 'ds-status-pill--success'
  if (label.includes('andamento') || label.includes('agend')) return 'ds-status-pill--warning'
  if (label.includes('erro') || label.includes('pend')) return 'ds-status-pill--danger'
  return 'ds-status-pill--neutral'
})
const ambienteCards = computed(() => ambientes.value.map((amb, index) => {
  const pontos = (amb?.pontos || []).length
  const simbolos = (amb?.simbolos || []).length
  const cotas = (amb?.cotas || []).length
  const pw = (amb?.esquemaPlanta?.walls || []).length
  const pp = (amb?.esquemaPlanta?.points || []).length
  const partes = []
  if (amb?.backgroundImage) partes.push('foto')
  if (pontos) partes.push(`${pontos} pts`)
  if (simbolos) partes.push(`${simbolos} simb`)
  if (cotas) partes.push(`${cotas} cotas`)
  if (pw || pp) partes.push(`planta ${pw}p/${pp}pt`)
  return {
    index,
    label: String(nomesAmbientesProjeto.value[index] || '').trim() || `Ambiente ${index + 1}`,
    summary: partes.length ? partes.join(' • ') : 'Ainda sem registros',
  }
}))
const ambientePreOrcamentoAtual = computed(() => {
  const list = comparativoPre.value?.ambientes
  if (!Array.isArray(list) || !list.length) return null
  const nomeAtual = String(ambienteAtualNome.value || '').trim().toLowerCase()
  if (nomeAtual) {
    const hit = list.find(
      (amb) => String(amb?.nome_ambiente || '').trim().toLowerCase() === nomeAtual,
    )
    if (hit) return hit
  }
  const byIndex = list[ambienteAtualIndex.value]
  if (byIndex) return byIndex
  if (list.length === 1) return list[0]
  return null
})

function formatMmFromM(valueM) {
  const n = Number(valueM)
  if (!Number.isFinite(n) || n <= 0) return '—'
  return `${Math.round(n * 1000)} mm`
}

function peDireitoMmParaAmbiente(index) {
  const list = comparativoPre.value?.ambientes
  if (!Array.isArray(list) || !list.length) return 2600
  const nome = String(nomesAmbientesProjeto.value[index] || '').trim().toLowerCase()
  if (nome) {
    const hit = list.find((a) => String(a?.nome_ambiente || '').trim().toLowerCase() === nome)
    const m = Number(hit?.pe_direito_m)
    if (Number.isFinite(m) && m > 0) return Math.round(m * 1000)
  }
  const byIndex = list[index]
  const m2 = Number(byIndex?.pe_direito_m)
  if (Number.isFinite(m2) && m2 > 0) return Math.round(m2 * 1000)
  const m3 = Number(list[0]?.pe_direito_m)
  if (Number.isFinite(m3) && m3 > 0) return Math.round(m3 * 1000)
  return 2600
}

function montarExtrudavelParaAmbiente(amb, index) {
  const ep = amb?.esquemaPlanta
  if (!ep || !Array.isArray(ep.walls) || !ep.walls.length) return null
  return buildExtrudavelJson({
    esquemaPlanta: ep,
    peDireitoMm: peDireitoMmParaAmbiente(index),
    escala: 1,
  })
}

const extrudavelParaVisualizador = computed(() => {
  const idx = ambienteAtualIndex.value
  const a = dadosAmbienteAtual.value
  const live = montarExtrudavelParaAmbiente(a, idx)
  if (live?.paredes?.length) return live
  if (a?.extrudavel?.paredes?.length) return a.extrudavel
  return null
})

/** Sincronização 3D em tempo real com edições no canvas (força redesenho se referência não mudar). */
const extrudavelLiveRevision = ref(0)
const extrudavelRevisionCombinada = computed(
  () => extrudavelViewerRevision.value + extrudavelLiveRevision.value,
)

watch(esquemaPlantaParaCanvas, () => {
  extrudavelLiveRevision.value += 1
}, { deep: true })
const orientacoesEditorFoto = [
  {
    title: '1. Capture a parede ou plano base',
    copy: 'Comece com a foto do ambiente para dar contexto real ao croqui e evitar marcações soltas.',
    icon: 'pi pi-camera',
  },
  {
    title: '2. Marque pontos técnicos',
    copy: 'Posicione elétrica, sifão, gás e vigas na imagem antes de medir distâncias finais.',
    icon: 'pi pi-map-marker',
  },
  {
    title: '3. Lance as cotas críticas',
    copy: 'Troque para o modo cota para registrar comprimentos que impactam produção e montagem.',
    icon: 'pi pi-arrows-h',
  },
]
const orientacoesEditorPlanta = [
  {
    title: '1. Desenhe o perímetro',
    copy: 'No modo Parede, arraste no quadriculado e informe o comprimento real em mm; a primeira parede calibra a escala.',
    icon: 'pi pi-th-large',
  },
  {
    title: '2. Posicione pontos técnicos',
    copy: 'Arraste ícones da barra esquerda para o desenho; ajuste distâncias no painel Propriedades.',
    icon: 'pi pi-map-marker',
  },
  {
    title: '3. Use junto da foto se precisar',
    copy: 'Volte em “Croqui na foto” para detalhar sobre a imagem real do ambiente.',
    icon: 'pi pi-image',
  },
]
const orientacoesEditor = computed(() =>
  vistaEditor.value === 'planta2d' ? orientacoesEditorPlanta : orientacoesEditorFoto,
)

function atualizarAmbienteAtual(data) {
  const idx = ambienteAtualIndex.value
  const next = [...ambientes.value]
  next[idx] = { ...(next[idx] || {}), ...data }
  ambientes.value = next
}

function ambienteTemConteudo(a) {
  if (!a) return false
  const ep = a.esquemaPlanta
  const temPlanta = ep && ((ep.walls?.length) || (ep.points?.length))
  return !!(
    a.backgroundImage
    || (a.pontos && a.pontos.length)
    || (a.simbolos && a.simbolos.length)
    || (a.cotas && a.cotas.length)
    || temPlanta
  )
}

function novoAmbiente() {
  const current = dadosAmbienteAtual.value
  if (current && ambienteTemConteudo(current)) {
    ambientes.value = [...ambientes.value, {}]
    ambienteAtualIndex.value = ambientes.value.length - 1
    notify.success('Novo ambiente adicionado. Preencha foto e/ou planta 2D.')
  } else {
    notify.info('Adicione foto, planta 2D ou anotações no ambiente atual antes de criar outro.')
  }
}

function dadosParaSalvar() {
  return {
    ambientes: ambientes.value.map((a, idx) => {
      const base = {
        backgroundImage: a.backgroundImage ?? null,
        scaleMmPerPx: a.scaleMmPerPx ?? 10,
        pontos: (a.pontos || []).map((p) => ({ x: p.x, y: p.y, alturaMm: p.alturaMm })),
        simbolos: (a.simbolos || []).map((s) => ({ tipo: s.tipo, x: s.x, y: s.y })),
        cotas: (a.cotas || []).map((c) => ({ x1: c.x1, y1: c.y1, x2: c.x2, y2: c.y2, lengthMm: c.lengthMm })),
      }
      const ep = a.esquemaPlanta
      if (ep && typeof ep === 'object' && (ep.walls?.length || ep.points?.length || ep.scaleMmPerPx != null)) {
        base.esquemaPlanta = {
          scaleMmPerPx: Number(ep.scaleMmPerPx) || 2,
          walls: Array.isArray(ep.walls) ? ep.walls : [],
          points: Array.isArray(ep.points) ? ep.points : [],
        }
      }
      const ex = montarExtrudavelParaAmbiente(
        { ...a, esquemaPlanta: base.esquemaPlanta || a.esquemaPlanta },
        idx,
      )
      if (ex?.paredes?.length) base.extrudavel = ex
      return base
    }),
  }
}

async function salvar() {
  if (!projetoIdAtual.value) {
    notify.error('Dados da tarefa incompletos.')
    return
  }
  salvando.value = true
  try {
    const payload = dadosParaSalvar()
    if (medicaoId.value) {
      await MedicaoFinaService.atualizar(medicaoId.value, { planta_baixa_json: payload })
    } else {
      const res = await MedicaoFinaService.salvar({
        projeto_id: projetoIdAtual.value,
        nome_ambiente: ambientePadraoLabel.value || ambienteAtualLabel.value,
        planta_baixa_json: payload,
      })
      medicaoId.value = res?.data?.id ?? res?.id ?? null
    }
    notify.success('Croqui salvo.')
    extrudavelViewerRevision.value += 1
  } catch (e) {
    const msg = e?.response?.data?.message || e?.response?.data?.error || 'Não foi possível salvar.'
    notify.error(msg)
  } finally {
    salvando.value = false
  }
}

async function atualizar3dDoBanco() {
  await carregarMedicao()
  extrudavelViewerRevision.value += 1
  notify.success('Visualização 3D sincronizada com o servidor.')
}

function voltar() {
  router.push(backTo.value)
}

async function carregarProjetoDireto() {
  if (!projetoIdDireto.value) {
    erroCarregamento.value = 'Projeto não informado.'
    loading.value = false
    return
  }
  loading.value = true
  erroCarregamento.value = ''
  try {
    const res = await MedicaoFinaService.getProjetoDados(projetoIdDireto.value)
    dadosProjeto.value = res?.data ?? res ?? null
    tarefa.value = null
    await carregarMedicao()
    await carregarComparativoPre()
  } catch (e) {
    erroCarregamento.value = e?.response?.data?.message || 'Não foi possível carregar o projeto.'
    dadosProjeto.value = null
  } finally {
    loading.value = false
  }
}

async function carregarTarefa() {
  if (!id.value) {
    erroCarregamento.value = 'ID da tarefa não informado.'
    loading.value = false
    return
  }
  loading.value = true
  erroCarregamento.value = ''
  try {
    const { data } = await TotemFabricaService.getTarefa(tarefaId.value, 'agenda_fabrica')
    tarefa.value = data
    dadosProjeto.value = null
    if (!data?.projeto_id) {
      erroCarregamento.value = 'Esta tarefa não está vinculada a um projeto. Vincule um projeto na Agenda da Produção.'
      return
    }
    await carregarMedicao()
    await carregarComparativoPre()
  } catch (e) {
    erroCarregamento.value = e?.response?.data?.message || 'Não foi possível carregar a tarefa.'
    tarefa.value = null
  } finally {
    loading.value = false
  }
}

async function carregarMedicao() {
  const projetoId = projetoIdAtual.value
  if (!projetoId) return
  loadingMedicao.value = true
  try {
    const [{ ambientePadrao: ambienteInicial, medicao }, listaAmbientesRes] = await Promise.all([
      MedicaoFinaService.carregarAmbienteInicial(projetoId),
      MedicaoFinaService.listarAmbientes(projetoId),
    ])
    const listaNomes = Array.isArray(listaAmbientesRes?.data)
      ? listaAmbientesRes.data.map((item) => String(item || '').trim()).filter(Boolean)
      : []
    nomesAmbientesProjeto.value = listaNomes
    ambientePadrao.value = ambienteInicial
    medicaoId.value = medicao?.id ?? null
    const pb = medicao?.planta_baixa_json
    if (pb && Array.isArray(pb.ambientes) && pb.ambientes.length) {
      ambientes.value = pb.ambientes.map((a) => ({ ...a }))
      ambienteAtualIndex.value = 0
    } else {
      ambientes.value = [{}]
      ambienteAtualIndex.value = 0
    }
  } catch (e) {
    console.error(e)
    ambientes.value = [{}]
    ambienteAtualIndex.value = 0
    nomesAmbientesProjeto.value = []
  } finally {
    loadingMedicao.value = false
  }
}

async function carregarComparativoPre() {
  const projetoId = projetoIdAtual.value
  if (!projetoId) {
    comparativoPre.value = null
    return
  }
  loadingComparativoPre.value = true
  try {
    const res = await MedicaoFinaService.getComparativoPreOrcamento(projetoId)
    comparativoPre.value = res?.data ?? res ?? null
  } catch (e) {
    comparativoPre.value = null
    console.error(e)
  } finally {
    loadingComparativoPre.value = false
  }
}

const modo = ref('ponto')

function carregarPagina() {
  if (contextoDiretoProjeto.value) {
    carregarProjetoDireto()
    return
  }
  carregarTarefa()
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('webkitfullscreenchange', onFullscreenChange)
  carregarPagina()
})

watch(
  () => route.params?.id,
  (novo, antigo) => {
    if (novo === antigo) return
    carregarPagina()
  },
)
</script>

<style scoped>
/* ── Layout raiz ── */
.medicao-fina-page {
  min-height: 100%;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--ds-color-primary) 8%, transparent), transparent 26%),
    linear-gradient(180deg, var(--ds-color-surface-muted), color-mix(in srgb, var(--ds-color-page) 88%, var(--ds-color-surface)));
}

.medicao-fina-page--immersive {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.medicao-fina-page--immersive > .ds-shell-card:first-of-type {
  flex-shrink: 0;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}

.medicao-fina-page__context-strip {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  padding: 0.4rem 0.75rem;
  margin: 0 0.5rem 0.25rem;
  border-radius: var(--ds-radius-sm);
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 72%, transparent);
  background: color-mix(in srgb, var(--ds-color-surface) 78%, transparent);
}

.dark .medicao-fina-page__context-strip {
  border-color: color-mix(in srgb, var(--ds-color-border-strong) 55%, transparent);
  background: color-mix(in srgb, var(--ds-color-surface) 40%, transparent);
}

.medicao-fina-page__context-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: var(--ds-color-text-soft);
  max-width: 100%;
}

.medicao-fina-page__context-chip--accent {
  font-weight: 800;
  color: var(--ds-color-primary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.65rem;
}

.dark .medicao-fina-page {
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--ds-color-primary) 10%, transparent), transparent 28%),
    linear-gradient(180deg, var(--ds-color-page), color-mix(in srgb, var(--ds-color-page) 90%, black));
}

.medicao-fina-page__body {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding-bottom: var(--ds-space-5);
}

.medicao-fina-page--immersive .medicao-fina-page__body {
  flex: 1 1 0%;
  min-height: 0;
  overflow: hidden;
  gap: 0.5rem;
  padding-bottom: 0.35rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.medicao-fina-page--projeto-tecnico.medicao-fina-page--immersive .medicao-fina-page__body {
  padding-left: 0;
  padding-right: 0;
  padding-bottom: 0;
  gap: 0;
}

/* Modo Projeto Técnico: split Konva | Three (fullscreen API no host) */
.medicao-fina-page__projeto-tecnico-root {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: rgb(15 23 42);
}

.medicao-fina-page__pt-toolbar {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.5rem;
  padding: 0.4rem 0.55rem;
  border-bottom: 1px solid rgb(51 65 85 / 0.65);
  background: rgb(15 23 42 / 0.98);
}

.medicao-fina-page__pt-title {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(226 232 240);
  flex: 1 1 6rem;
  min-width: 0;
}

.medicao-fina-page__pt-tabs {
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid rgb(71 85 105 / 0.85);
  overflow: hidden;
}

.medicao-fina-page__pt-tab {
  padding: 0.32rem 0.75rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(148 163 184);
  background: transparent;
  border: none;
  cursor: pointer;
  touch-action: manipulation;
}

.medicao-fina-page__pt-tab--on {
  background: rgb(51 65 85 / 0.95);
  color: rgb(248 250 252);
}

.medicao-fina-page__pt-split {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: row;
}

.medicao-fina-page__pt-pane {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.medicao-fina-page__pt-pane--2d {
  flex: 1 1 50%;
  border-right: 1px solid rgb(51 65 85 / 0.55);
}

.medicao-fina-page__pt-pane--3d {
  flex: 1 1 50%;
}

.medicao-fina-page__pt-pane--3d :deep(.visualizador-3d) {
  border-radius: 0;
  min-height: 100%;
}

@media (max-width: 720px) {
  .medicao-fina-page__pt-split {
    flex-direction: column;
  }

  .medicao-fina-page__pt-pane--2d {
    flex: 1 1 42%;
    border-right: none;
    border-bottom: 1px solid rgb(51 65 85 / 0.55);
  }

  .medicao-fina-page__pt-pane--3d {
    flex: 1 1 58%;
  }
}

.medicao-fina-page__header-actions {
  align-items: center;
}

.medicao-fina-page__hero {
  margin-top: 0.15rem;
}

.medicao-fina-page__hero-main {
  max-width: 48rem;
}

.medicao-fina-page__hero-meta {
  max-width: 28rem;
}

/* ── Toolbar ── */
.medicao-fina-page__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem 1.15rem;
  padding: var(--ds-space-4);
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 72%, transparent);
  background: color-mix(in srgb, var(--ds-color-surface) 92%, transparent);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--ds-color-border) 35%, transparent);
}

.dark .medicao-fina-page__toolbar {
  border-color: color-mix(in srgb, var(--ds-color-border-strong) 55%, transparent);
  background: color-mix(in srgb, var(--ds-color-surface) 78%, transparent);
  box-shadow: 0 1px 0 rgb(0 0 0 / 0.25);
}

.medicao-fina-page__toolbar-primary {
  flex: 1 1 12rem;
  min-width: 0;
}

.medicao-fina-page__toolbar-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-3);
}

.medicao-fina-page__toolbar-group--actions {
  gap: 0.5rem 0.65rem;
}

.medicao-fina-page__toolbar-segments {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem 0.65rem;
  flex: 1 1 14rem;
  min-width: 0;
}

.medicao-fina-page__segment-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  padding: 0.28rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 80%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--ds-color-surface) 70%, transparent);
}

.dark .medicao-fina-page__segment-wrap {
  border-color: rgba(51, 71, 102, 0.75);
  background: rgba(15, 23, 42, 0.45);
}

.medicao-fina-page__segment-btn {
  gap: 0.4rem;
  min-height: 2.35rem;
  padding-left: 0.75rem;
  padding-right: 0.85rem;
  border-radius: 999px;
  font-size: 0.78rem;
}

.medicao-fina-page__segment-btn i {
  font-size: 0.8rem;
  opacity: 0.92;
}

@media (max-width: 420px) {
  .medicao-fina-page__segment-btn span {
    display: none;
  }

  .medicao-fina-page__segment-btn {
    min-width: 2.6rem;
    padding-left: 0.65rem;
    padding-right: 0.65rem;
    justify-content: center;
  }
}

.medicao-fina-page__toolbar-save {
  box-shadow: 0 2px 12px color-mix(in srgb, var(--ds-color-primary) 28%, transparent);
}

.medicao-fina-page__toolbar--planta {
  border-color: rgb(51 65 85 / 0.55);
  background: linear-gradient(180deg, rgb(15 23 42 / 0.92), rgb(15 23 42 / 0.78));
  box-shadow: inset 0 1px 0 rgb(148 163 184 / 0.06);
}

.dark .medicao-fina-page__toolbar--planta {
  background: linear-gradient(180deg, rgb(15 23 42 / 0.95), rgb(15 23 42 / 0.82));
}

/* ── Workspace grid ── */
.medicao-fina-page__workspace {
  display: grid;
  grid-template-columns: minmax(17rem, 22rem) minmax(0, 1fr);
  gap: var(--ds-space-3);
  align-items: stretch;
}

.medicao-fina-page--planta-fullscreen .medicao-fina-page__workspace {
  grid-template-columns: minmax(0, 1fr);
  gap: 0.35rem;
}

.medicao-fina-page--immersive .medicao-fina-page__workspace {
  flex: 1 1 0%;
  min-height: 0;
  overflow: hidden;
}

.medicao-fina-page__rail {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.medicao-fina-page--immersive .medicao-fina-page__rail {
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.medicao-fina-page__canvas-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 0.5rem;
}

.medicao-fina-page__viewer3d-host {
  flex: 1 1 auto;
  min-height: 200px;
  position: relative;
}

.medicao-fina-page--immersive .medicao-fina-page__toolbar {
  flex-shrink: 0;
  padding: 0.55rem 0.85rem;
  gap: 0.55rem 0.85rem;
}

.medicao-fina-page__toolbar--planta {
  padding: 0.45rem 0.65rem;
}

.medicao-fina-page--planta-fullscreen .medicao-fina-page__editor-shell {
  border: 0;
  box-shadow: none;
  border-radius: var(--ds-radius-sm);
  background: transparent;
}

.medicao-fina-page--planta-fullscreen .medicao-fina-page__editor-shell.ds-shell-card {
  padding: 0;
}

/* ── Estado vazio / erro ── */
.medicao-fina-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  text-align: center;
}

.medicao-fina-page__state-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.medicao-fina-page__state-copy {
  margin: 0;
  font-size: 0.82rem;
  color: var(--ds-color-text-soft);
}

.medicao-fina-page__state-link {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--ds-color-primary);
}

/* ── Painéis laterais ── */
.medicao-fina-page__panel {
  padding: var(--ds-space-4);
}

.medicao-fina-page__panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-3);
  margin-bottom: var(--ds-space-4);
}

.medicao-fina-page__panel-kicker {
  margin: 0 0 var(--ds-space-1);
  color: var(--ds-color-text-faint);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.medicao-fina-page__panel-title {
  margin: 0;
  color: var(--ds-color-text);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

/* ── Badges ── */
.medicao-fina-page__panel-counter,
.medicao-fina-page__mode-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.9rem;
  padding: 0 var(--ds-space-3);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.medicao-fina-page__panel-counter {
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 84%, transparent);
  background: color-mix(in srgb, var(--ds-color-surface) 72%, transparent);
  color: var(--ds-color-text-soft);
}

.dark .medicao-fina-page__panel-counter {
  border-color: color-mix(in srgb, var(--ds-color-border-strong) 84%, transparent);
  background: color-mix(in srgb, var(--ds-color-surface) 44%, transparent);
}

.medicao-fina-page__mode-badge--primary {
  background: color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  color: var(--ds-color-primary);
}

.medicao-fina-page__mode-badge--warning {
  background: color-mix(in srgb, var(--ds-color-warning) 14%, transparent);
  color: var(--ds-color-warning);
}

.medicao-fina-page__mode-badge--neutral {
  background: color-mix(in srgb, var(--ds-color-text-soft) 12%, transparent);
  color: var(--ds-color-text-soft);
}

/* ── Mini-stats grid ── */
.medicao-fina-page__panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-3);
}

.medicao-fina-page__mini-stat {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding: var(--ds-space-3) var(--ds-space-4);
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 82%, transparent);
  border-radius: var(--ds-radius-sm);
  background: color-mix(in srgb, var(--ds-color-surface) 62%, transparent);
}

.dark .medicao-fina-page__mini-stat {
  border-color: color-mix(in srgb, var(--ds-color-border-strong) 82%, transparent);
  background: color-mix(in srgb, var(--ds-color-surface) 34%, transparent);
}

.medicao-fina-page__mini-stat-label {
  color: var(--ds-color-text-faint);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.medicao-fina-page__mini-stat-value {
  color: var(--ds-color-text);
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.medicao-fina-page__panel-copy {
  margin: var(--ds-space-3) 0 0;
  color: var(--ds-color-text-soft);
  font-size: 0.82rem;
  line-height: 1.6;
}

.medicao-fina-page__mini-compare-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-3);
}

.medicao-fina-page__paredes-pre-list {
  margin-top: var(--ds-space-3);
}

.medicao-fina-page__paredes-pre-title {
  margin: 0 0 var(--ds-space-2);
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.medicao-fina-page__paredes-pre-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}

.medicao-fina-page__paredes-pre-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--ds-space-2);
  font-size: 0.76rem;
  color: var(--ds-color-text-soft);
}

/* ── Lista de ambientes ── */
.medicao-fina-page__ambientes-list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}

.medicao-fina-page__ambiente-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-1);
  width: 100%;
  padding: var(--ds-space-3) var(--ds-space-4);
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 82%, transparent);
  border-radius: var(--ds-radius-sm);
  background: color-mix(in srgb, var(--ds-color-surface) 62%, transparent);
  color: var(--ds-color-text);
  text-align: left;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.medicao-fina-page__ambiente-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--ds-color-primary) 24%, transparent);
  box-shadow: var(--ds-shadow-md);
}

.medicao-fina-page__ambiente-card--active {
  border-color: color-mix(in srgb, var(--ds-color-primary) 32%, transparent);
  background: color-mix(in srgb, var(--ds-color-primary) 8%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
}

.dark .medicao-fina-page__ambiente-card,
.dark .medicao-fina-page__ambiente-card--active {
  border-color: color-mix(in srgb, var(--ds-color-border-strong) 82%, transparent);
}

.dark .medicao-fina-page__ambiente-card {
  background: color-mix(in srgb, var(--ds-color-surface) 34%, transparent);
}

.dark .medicao-fina-page__ambiente-card--active {
  background: color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ds-color-primary) 12%, transparent);
}

.medicao-fina-page__ambiente-card-title {
  font-size: 0.86rem;
  font-weight: 700;
}

.medicao-fina-page__ambiente-card-meta {
  color: var(--ds-color-text-soft);
  font-size: 0.76rem;
}

/* ── Checklist (guia rápido) ── */
.medicao-fina-page__checklist {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.medicao-fina-page__checklist-item {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) 0;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 50%, transparent);
}

.medicao-fina-page__checklist-item:first-child {
  border-top: 0;
}

.medicao-fina-page__checklist-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ds-color-primary) 10%, transparent);
  color: var(--ds-color-primary);
  font-size: 0.82rem;
}

.medicao-fina-page__checklist-title {
  margin: 0;
  color: var(--ds-color-text);
  font-size: 0.84rem;
  font-weight: 700;
}

.medicao-fina-page__checklist-copy {
  margin: var(--ds-space-1) 0 0;
  color: var(--ds-color-text-soft);
  font-size: 0.76rem;
  line-height: 1.5;
}

/* ── Editor shell ── */
.medicao-fina-page__editor-shell {
  min-height: min(28rem, 52dvh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.medicao-fina-page--immersive .medicao-fina-page__editor-shell {
  flex: 1 1 0%;
  min-height: 0;
  padding: 0;
}

.medicao-fina-page__editor-viewport {
  flex: 1 1 0%;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.medicao-fina-page__croqui {
  flex: 1 1 0%;
  min-height: 0;
  min-width: 0;
}

.medicao-fina-page__croqui--fill {
  flex: 1 1 0%;
  min-height: 0;
  width: 100%;
}

/* ── Responsivo ── */
@media (max-width: 900px) {
  .medicao-fina-page__workspace {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(38dvh, 1fr) auto;
  }

  .medicao-fina-page__canvas-column {
    order: -1;
    min-height: min(48dvh, 560px);
  }

  .medicao-fina-page--immersive .medicao-fina-page__rail {
    max-height: min(40dvh, 380px);
  }

  .medicao-fina-page__mini-compare-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .medicao-fina-page__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .medicao-fina-page__toolbar-primary,
  .medicao-fina-page__toolbar-segments {
    flex: none;
    width: 100%;
  }

  .medicao-fina-page__toolbar-segments {
    justify-content: flex-start;
    padding-top: 0.45rem;
    border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 55%, transparent);
  }

  .dark .medicao-fina-page__toolbar-segments {
    border-top-color: color-mix(in srgb, var(--ds-color-border-strong) 45%, transparent);
  }

  .medicao-fina-page__mini-compare-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .medicao-fina-page__context-strip {
    margin-left: 0.35rem;
    margin-right: 0.35rem;
  }

  .medicao-fina-page--immersive .medicao-fina-page__body {
    padding-left: 0.35rem;
    padding-right: 0.35rem;
  }
}
</style>
