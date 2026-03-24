<template>
  <div class="medicao-canvas flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-slate-950 text-slate-100">
    <header class="medicao-canvas__toolbar flex-shrink-0 border-b border-slate-800/95 bg-slate-900" aria-label="Ferramentas da planta">
      <div class="medicao-canvas__toolbar-row flex w-full min-w-0 items-center gap-1.5 overflow-x-auto overscroll-x-contain px-2 py-2 sm:gap-2 sm:px-3 sm:py-2.5">
        <div class="medicao-canvas__toolbar-cluster flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            class="medicao-canvas__tool-btn touch-manipulation"
            :class="{ 'medicao-canvas__tool-btn--on': modo === 'parede' }"
            title="Desenhar parede (lápis)"
            aria-label="Modo desenhar parede"
            @click="modo = 'parede'"
          >
            <i class="pi pi-pencil medicao-canvas__tool-btn-icon" />
          </button>
          <button
            type="button"
            class="medicao-canvas__tool-btn touch-manipulation"
            :class="{ 'medicao-canvas__tool-btn--on': modo === 'selecionar' }"
            title="Selecionar"
            aria-label="Selecionar parede ou ponto"
            @click="modo = 'selecionar'"
          >
            <i class="pi pi-arrows-alt medicao-canvas__tool-btn-icon" />
          </button>
          <button
            type="button"
            class="medicao-canvas__tool-btn touch-manipulation"
            :class="{ 'medicao-canvas__tool-btn--on': modo === 'navegar' }"
            title="Navegar: arraste com um dedo. Pinça com 2 dedos em qualquer modo."
            aria-label="Modo navegar"
            @click="modo = 'navegar'"
          >
            <i class="pi pi-compass medicao-canvas__tool-btn-icon" />
          </button>
          <button
            type="button"
            class="medicao-canvas__tool-btn touch-manipulation"
            title="Enquadrar tudo na tela (fit)"
            aria-label="Resetar visão"
            @click="fitToScreen"
          >
            <i class="pi pi-sync medicao-canvas__tool-btn-icon" />
          </button>
        </div>

        <span class="medicao-canvas__toolbar-vdiv" aria-hidden="true" />

        <button
          type="button"
          class="medicao-canvas__tool-btn medicao-canvas__tool-btn--foto touch-manipulation"
          :class="{ 'medicao-canvas__tool-btn--on': croquiFotoAtivo }"
          :disabled="!fotoDisponivel"
          :title="fotoDisponivel ? 'Foto 30% por baixo (calcar)' : 'Sem foto no ambiente'"
          aria-label="Croqui sobre foto"
          @click="croquiFotoAtivo = !croquiFotoAtivo"
        >
          <i class="pi pi-image medicao-canvas__tool-btn-icon" />
          <span class="medicao-canvas__tool-btn-label medicao-canvas__tool-btn-label--inline">Foto</span>
        </button>

        <span class="medicao-canvas__toolbar-vdiv" aria-hidden="true" />

        <span class="medicao-canvas__toolbar-section-label">Pontos</span>

        <div class="medicao-canvas__toolbar-cluster medicao-canvas__toolbar-cluster--symbols flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            v-for="sym in simbolosCatalogo"
            :key="sym.tipo"
            type="button"
            draggable="true"
            class="medicao-canvas__sym-btn touch-manipulation"
            :class="{ 'medicao-canvas__sym-btn--armed': simboloPendente === sym.tipo }"
            :title="`${sym.label}: toque aqui e depois no desenho (ou arraste no PC)`"
            :aria-label="sym.label"
            @click.stop="armarSimbolo(sym)"
            @dragstart="onDragSymStart($event, sym)"
          >
            <i :class="sym.icon" class="medicao-canvas__sym-icon leading-none" />
          </button>
        </div>
      </div>
    </header>

    <div
      ref="wrapRef"
      class="medicao-canvas__viewport relative min-h-0 min-w-0 flex-1 touch-none"
      style="touch-action: none"
      @dragover.prevent
      @drop="onDropSym"
    >
      <div
        v-if="simboloPendente"
        class="medicao-canvas__place-hint pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-sky-500/50 bg-slate-900/90 px-3 py-1.5 text-center text-[11px] font-medium text-sky-200 shadow-lg sm:top-4"
      >
        Toque no desenho para colocar {{ labelTipo(simboloPendente) }}
      </div>
      <div ref="containerRef" class="h-full w-full min-h-[200px] bg-slate-950" />
    </div>

    <Teleport to="body">
      <div
        v-if="modalMedida.open"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        @click.self="cancelarModalMedida"
      >
        <div class="w-full max-w-md rounded-3xl border border-slate-600 bg-slate-900 p-6 shadow-2xl">
          <h3 class="mb-1 text-center text-base font-bold text-white">{{ modalMedida.titulo }}</h3>
          <p class="mb-3 text-center text-xs text-slate-400">O valor abaixo refere-se a:</p>
          <div class="mb-4 flex flex-wrap justify-center gap-2">
            <button
              v-for="opt in opcoesTipoMedida"
              :key="opt.v"
              type="button"
              class="rounded-xl border px-3 py-2 text-xs font-semibold touch-manipulation"
              :class="modalMedida.medidaTipo === opt.v
                ? 'border-sky-500 bg-sky-600/30 text-sky-100'
                : 'border-slate-600 text-slate-400'"
              @click="modalMedida.medidaTipo = opt.v"
            >
              {{ opt.label }}
            </button>
          </div>
          <p class="mb-2 text-center text-[10px] leading-snug text-slate-500">
            Luz = vão útil · Eixo = linha de centro · Externa = alvenaria total (esp. {{ espessuraAlvenariaMm }} mm)
          </p>
          <input
            ref="inputMedidaRef"
            v-model="modalMedida.mmText"
            type="number"
            min="1"
            step="1"
            inputmode="decimal"
            class="medicao-canvas__input-medida mb-6 w-full rounded-2xl border-2 border-sky-500/50 bg-slate-800 px-4 py-5 text-center text-3xl font-bold tracking-tight text-white shadow-inner"
            placeholder="0"
            @keyup.enter="confirmarModalMedida"
          />
          <div class="flex gap-3">
            <button
              type="button"
              class="medicao-canvas__modal-btn flex-1 rounded-2xl border border-slate-600 py-4 text-base text-slate-200 touch-manipulation"
              @click="cancelarModalMedida"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="medicao-canvas__modal-btn flex-1 rounded-2xl bg-sky-600 py-4 text-base font-bold text-white touch-manipulation"
              @click="confirmarModalMedida"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="modalPonto.open"
        class="fixed inset-0 z-[202] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        @click.self="modalPonto.open = false"
      >
        <div class="w-full max-w-md rounded-3xl border border-slate-600 bg-slate-900 p-6 shadow-2xl">
          <h3 class="mb-1 text-center text-base font-bold text-white">Posição do ponto (mm)</h3>
          <p class="mb-4 text-center text-xs text-slate-400">Origem: canto superior esquerdo do plano</p>
          <div class="mb-4 flex gap-3">
            <div class="flex-1">
              <label class="mb-1 block text-[10px] uppercase text-slate-500">X</label>
              <input
                ref="inputPontoRef"
                v-model="modalPonto.mmX"
                type="number"
                inputmode="decimal"
                class="medicao-canvas__input-medida w-full rounded-2xl border-2 border-emerald-500/40 bg-slate-800 px-3 py-4 text-center text-2xl font-bold text-white"
                @keyup.enter="confirmarModalPonto"
              />
            </div>
            <div class="flex-1">
              <label class="mb-1 block text-[10px] uppercase text-slate-500">Y</label>
              <input
                v-model="modalPonto.mmY"
                type="number"
                inputmode="decimal"
                class="medicao-canvas__input-medida w-full rounded-2xl border-2 border-emerald-500/40 bg-slate-800 px-3 py-4 text-center text-2xl font-bold text-white"
                @keyup.enter="confirmarModalPonto"
              />
            </div>
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-2xl border border-slate-600 py-4 text-base text-slate-200 touch-manipulation"
              @click="modalPonto.open = false"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="flex-1 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white touch-manipulation"
              @click="confirmarModalPonto"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="modalVertice.open"
        class="fixed inset-0 z-[205] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        @click.self="modalVertice.open = false"
      >
        <div class="w-full max-w-sm rounded-3xl border border-slate-600 bg-slate-900 p-5 shadow-2xl">
          <h3 class="mb-1 text-center text-sm font-bold text-white">Ângulo no encontro</h3>
          <p class="mb-3 text-center text-[11px] text-slate-400">Entre as duas paredes (esquadro real, ex.: 90, 92, 89)</p>
          <input
            ref="inputVerticeRef"
            v-model="modalVertice.angleText"
            type="number"
            step="0.1"
            inputmode="decimal"
            class="medicao-canvas__input-medida mb-4 w-full rounded-2xl border-2 border-amber-500/40 bg-slate-800 px-4 py-4 text-center text-2xl font-bold text-white"
            @keyup.enter="confirmarModalVertice"
          />
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-2xl border border-slate-600 py-3 text-sm text-slate-200 touch-manipulation"
              @click="modalVertice.open = false"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="flex-1 rounded-2xl bg-amber-600 py-3 text-sm font-bold text-white touch-manipulation"
              @click="confirmarModalVertice"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      <!-- Edição rápida no canvas (duplo clique) -->
      <div
        v-if="floatEdit.open"
        class="medicao-canvas__float-edit fixed z-[260] rounded-xl border border-slate-500 bg-slate-900 p-2 shadow-2xl"
        :style="{ left: floatEdit.left, top: floatEdit.top }"
        role="dialog"
        @click.stop
      >
        <template v-if="floatEdit.kind === 'ponto'">
          <label class="mb-1 block text-[10px] uppercase text-slate-500">X / Y (mm)</label>
          <div class="flex gap-1">
            <input
              ref="floatInputRef"
              v-model="floatEdit.mmX"
              type="number"
              inputmode="numeric"
              class="w-20 rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
              placeholder="X"
              @keyup.enter="aplicarFloatEdit"
            />
            <input
              v-model="floatEdit.mmY"
              type="number"
              inputmode="numeric"
              class="w-20 rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
              placeholder="Y"
              @keyup.enter="aplicarFloatEdit"
            />
          </div>
        </template>
        <div class="mt-1 flex gap-1">
          <button
            type="button"
            class="flex-1 rounded-lg bg-sky-600 py-2 text-xs font-semibold text-white touch-manipulation"
            @click="aplicarFloatEdit"
          >
            OK
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-600 px-2 py-2 text-xs text-slate-300 touch-manipulation"
            @click="fecharFloatEdit"
          >
            ✕
          </button>
        </div>
      </div>

      <aside
        v-if="selecionado"
        class="medicao-canvas__props-overlay fixed z-[240] flex max-h-[min(92dvh,100%)] w-[min(20rem,calc(100vw-1rem))] flex-col rounded-2xl border border-slate-700 bg-slate-900/98 shadow-2xl backdrop-blur-md"
        :style="painelPropsStyle"
        role="dialog"
        aria-label="Propriedades"
      >
        <div class="flex items-center justify-between gap-2 border-b border-slate-800 px-3 py-2.5">
          <div class="min-w-0">
            <h2 class="truncate text-xs font-bold uppercase tracking-wide text-slate-400">
              {{ selecionado.kind === 'parede' ? 'Parede' : labelTipo(selecionado.item.tipo) }}
            </h2>
            <p class="truncate text-[10px] text-slate-500">{{ scaleLabel }}</p>
          </div>
          <button
            type="button"
            class="medicao-canvas__close-btn shrink-0 touch-manipulation"
            title="Fechar"
            aria-label="Fechar painel"
            @click="limparSelecao"
          >
            <i class="pi pi-times text-lg" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <template v-if="selecionado.kind === 'ponto'">
            <label class="mb-1 block text-[10px] font-medium text-slate-500">Dist. parede esq. (mm)</label>
            <input
              v-model.number="selecionado.item.distanciaParedeEsquerdaMm"
              type="number"
              min="0"
              class="mb-3 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-base text-white touch-manipulation"
              @change="emitState"
            />
            <label class="mb-1 block text-[10px] font-medium text-slate-500">Altura chão (mm)</label>
            <input
              v-model.number="selecionado.item.alturaChaoMm"
              type="number"
              min="0"
              class="mb-3 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-base text-white touch-manipulation"
              @change="emitState"
            />
            <button
              type="button"
              class="w-full rounded-xl border border-red-900/50 bg-red-950/50 py-3 text-sm text-red-200 touch-manipulation"
              @click="removerPonto(selecionado.item)"
            >
              Remover
            </button>
          </template>

          <template v-else-if="selecionado.kind === 'parede'">
            <label class="mb-1 block text-[10px] font-medium text-slate-500">Comprimento (mm)</label>
            <input
              v-model.number="selecionado.item.lengthMm"
              type="number"
              min="1"
              class="mb-3 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-base text-white touch-manipulation"
              @change="onParedeLengthChange(selecionado.item)"
            />
            <label class="mb-1 block text-[10px] font-medium text-slate-500">Ângulo (°) — 0° direita, 90° baixo</label>
            <input
              type="number"
              step="0.1"
              class="mb-3 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-base text-white touch-manipulation"
              :value="paredeAnguloExibicao(selecionado.item)"
              @change="onParedeAngleInput(selecionado.item, $event)"
            />
            <p class="text-[10px] text-slate-500">Toque na cota no desenho ou duplo toque na parede para editar a medida.</p>
            <button
              type="button"
              class="mt-4 w-full rounded-xl border border-red-900/50 bg-red-950/50 py-3 text-sm text-red-200 touch-manipulation"
              @click="removerParede(selecionado.item)"
            >
              Remover
            </button>
          </template>
        </div>
      </aside>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import Konva from 'konva'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null,
  },
  /** URL da foto do croqui (mesmo ambiente) para modo calcar 30% */
  fotoUrl: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const GRID_STEP = 24
/** Zoom da câmera (visual); separado de escala mm/px do croqui — limites para uso em tablet */
const VIEW_ZOOM_MIN = 0.5
const VIEW_ZOOM_MAX = 3
const VIEW_ZOOM_WHEEL_FACTOR = 1.085
/** Limite de linhas de grade por eixo (performance com zoom muito baixo) */
const MAX_GRID_LINES = 100
const MIN_WALL_PX = 12
/** Distância em px para ímã nos vértices das paredes */
const SNAP_RADIUS_PX = 32
/** Espessura visual da parede (marcenaria) */
const WALL_VIS_WIDTH_PX = 14
/** Área de toque além do traço visível */
const WALL_HIT_STROKE_PX = 44
/** Distância da linha de cota em relação ao eixo da parede */
const COTA_OFFSET_BASE = 40
const COTA_TICK = 10

const simbolosCatalogo = [
  { tipo: 'TOMADA', label: 'Tomada', icon: 'pi pi-bolt' },
  { tipo: 'AGUA', label: 'Água / esgoto', icon: 'pi pi-circle' },
  { tipo: 'GAS', label: 'Gás', icon: 'pi pi-fire' },
  { tipo: 'VIGA', label: 'Viga / coluna', icon: 'pi pi-box' },
]

/** Traços SVG claros (stroke em coords ~24x24, centrados em 0,0) */
const ICON_PATHS = {
  TOMADA: 'M 2 -10 L -6 8 L -1 8 L -4 14 L 8 -4 L 3 -4 L 6 -12 Z',
  AGUA: 'M 0 -12 C -10 2 -8 10 0 12 C 8 10 10 2 0 -12 Z',
  /** Chama centrada em (0,0), mesma ordem de grandeza que TOMADA/Água — o path antigo era “pesado” para baixo e parecia fora da parede. */
  GAS: 'M 0 -12 Q -8 -2 -6 7 Q -4 11 0 10 Q 4 11 6 7 Q 8 -2 0 -12 Z',
  VIGA: 'M -8 -10 L 8 -10 L 8 -4 L -2 -4 L -2 4 L 8 4 L 8 10 L -8 10 L -8 4 L 2 4 L 2 -4 L -8 -4 Z',
}

const modo = ref('parede')
/** Tablet: arrastar não funciona — toque no ícone e depois no canvas */
const simboloPendente = ref(null)
const wrapRef = ref(null)
const containerRef = ref(null)
const inputMedidaRef = ref(null)
const inputPontoRef = ref(null)
const inputVerticeRef = ref(null)
const floatInputRef = ref(null)

const croquiFotoAtivo = ref(false)
const fotoDisponivel = computed(() => !!String(props.fotoUrl || '').trim())

const espessuraAlvenariaMm = 100
const opcoesTipoMedida = [
  { v: 'eixo', label: 'Eixo' },
  { v: 'luz', label: 'Luz' },
  { v: 'externa', label: 'Externa' },
]

let stage = null
/** Único Layer permitido como filho direto do Stage (regra Konva) */
let worldBaseLayer = null
/** Grupo com pan (x,y) + zoom — filho do worldBaseLayer */
let worldGroup = null
let layerFoto = null
let layerGrid = null
let layerWalls = null
let layerSelExtras = null
let layerVertices = null
let layerCotas = null
let layerCotaHits = null
let layerPoints = null
let layerTemp = null

let hatchPatternCanvas = null

const scaleMmPerPx = ref(2)
const walls = ref([])
const points = ref([])

const wallDraft = ref(null)
let tempLineNode = null
/** Pan: { lastX, lastY } em coords do Stage */
let panDrag = null
/** Pinça: estado inicial do gesto (2 dedos) */
let pinchState = null

/** Konva.Group não tem batchDraw; redesenha o Stage (único Layer = worldBaseLayer). */
function batchDrawStage() {
  stage?.batchDraw()
}

const selecionado = ref(null)

const floatEdit = ref({
  open: false,
  kind: null,
  wallId: null,
  pointId: null,
  left: '0px',
  top: '0px',
  mmText: '',
  mmX: '',
  mmY: '',
})

const modalMedida = ref({
  open: false,
  modo: 'nova',
  titulo: 'Comprimento da parede',
  wallId: null,
  novaDraft: null,
  mmText: '',
  medidaTipo: 'eixo',
})

const modalPonto = ref({
  open: false,
  pointId: null,
  mmX: '',
  mmY: '',
})

const modalVertice = ref({
  open: false,
  jx: 0,
  jy: 0,
  wFix: null,
  wMove: null,
  angleText: '',
})

const painelPropsStyle = computed(() => ({
  top: 'max(0.5rem, env(safe-area-inset-top, 0px))',
  right: 'max(0.5rem, env(safe-area-inset-right, 0px))',
  bottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
}))

const scaleLabel = computed(() => {
  const s = scaleMmPerPx.value
  if (!Number.isFinite(s) || s <= 0) return '—'
  return `${s.toFixed(3)} mm/px`
})

function getHatchPattern() {
  if (hatchPatternCanvas) return hatchPatternCanvas
  const s = 16
  const c = document.createElement('canvas')
  c.width = s
  c.height = s
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#1a2233'
  ctx.fillRect(0, 0, s, s)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, s)
  ctx.lineTo(s, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-4, s - 4)
  ctx.lineTo(s - 4, -4)
  ctx.stroke()
  hatchPatternCanvas = c
  return c
}

function wallQuadPoints(w) {
  const ang = Math.atan2(w.y2 - w.y1, w.x2 - w.x1)
  const hx = -Math.sin(ang) * (WALL_VIS_WIDTH_PX / 2)
  const hy = Math.cos(ang) * (WALL_VIS_WIDTH_PX / 2)
  return [
    w.x1 + hx, w.y1 + hy,
    w.x2 + hx, w.y2 + hy,
    w.x2 - hx, w.y2 - hy,
    w.x1 - hx, w.y1 - hy,
  ]
}

function wallAngleDegFromGeometry(w) {
  return (Math.atan2(w.y2 - w.y1, w.x2 - w.x1) * 180) / Math.PI
}

function paredeAnguloExibicao(w) {
  if (!w) return 0
  if (w.angleDeg != null && Number.isFinite(w.angleDeg)) return Math.round(w.angleDeg * 10) / 10
  return Math.round(wallAngleDegFromGeometry(w) * 10) / 10
}

function aplicarAnguloParede(w, angleDeg) {
  if (!w.lengthMm || w.lengthMm < 1) w.lengthMm = wallLengthMm(w)
  w.angleDeg = angleDeg
  const Lpx = w.lengthMm / scaleMmPerPx.value
  const r = (angleDeg * Math.PI) / 180
  w.x2 = w.x1 + Lpx * Math.cos(r)
  w.y2 = w.y1 + Lpx * Math.sin(r)
  redesenharWalls()
  emitState()
}

function onParedeAngleInput(w, ev) {
  const v = parseFloat(String(ev.target?.value ?? '').replace(',', '.'))
  if (!Number.isFinite(v)) return
  aplicarAnguloParede(w, v)
}

function distPointToSegSq(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-8) {
    const ddx = px - x1
    const ddy = py - y1
    return ddx * ddx + ddy * ddy
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const qx = x1 + t * dx
  const qy = y1 + t * dy
  const ddx = px - qx
  const ddy = py - qy
  return ddx * ddx + ddy * ddy
}

function minDistMmPontoOutrosMuros(px, py, excludeId) {
  let best = Infinity
  for (const ow of walls.value) {
    if (ow.id === excludeId) continue
    const d2 = distPointToSegSq(px, py, ow.x1, ow.y1, ow.x2, ow.y2)
    if (d2 < best) best = d2
  }
  if (!Number.isFinite(best) || best === Infinity) return 0
  return Math.round(Math.sqrt(best) * scaleMmPerPx.value)
}

function clampViewScale(s) {
  return Math.min(VIEW_ZOOM_MAX, Math.max(VIEW_ZOOM_MIN, s))
}

function getWorldScale() {
  return worldGroup ? worldGroup.scaleX() : 1
}

function screenToWorld(sx, sy) {
  if (!worldGroup) return { x: sx, y: sy }
  const sc = worldGroup.scaleX()
  return {
    x: (sx - worldGroup.x()) / sc,
    y: (sy - worldGroup.y()) / sc,
  }
}

function getVisibleWorldBounds() {
  if (!stage || !worldGroup) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600 }
  }
  const W = stage.width()
  const H = stage.height()
  const corners = [[0, 0], [W, 0], [W, H], [0, H]]
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [sx, sy] of corners) {
    const w = screenToWorld(sx, sy)
    minX = Math.min(minX, w.x)
    minY = Math.min(minY, w.y)
    maxX = Math.max(maxX, w.x)
    maxY = Math.max(maxY, w.y)
  }
  const pad = GRID_STEP * 6
  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
  }
}

function zoomAtStageAnchor(newScale, anchorScreenX, anchorScreenY) {
  if (!worldGroup || !stage) return
  const s0 = worldGroup.scaleX()
  const s1 = clampViewScale(newScale)
  const wx = (anchorScreenX - worldGroup.x()) / s0
  const wy = (anchorScreenY - worldGroup.y()) / s0
  worldGroup.scale({ x: s1, y: s1 })
  worldGroup.position({
    x: anchorScreenX - wx * s1,
    y: anchorScreenY - wy * s1,
  })
  drawInfiniteGrid()
  stage.batchDraw()
}

function onStageWheel(e) {
  if (!worldGroup || !stage) return
  e.evt.preventDefault()
  const p = stage.getPointerPosition()
  if (!p) return
  const s0 = worldGroup.scaleX()
  const next = e.evt.deltaY < 0 ? s0 * VIEW_ZOOM_WHEEL_FACTOR : s0 / VIEW_ZOOM_WHEEL_FACTOR
  zoomAtStageAnchor(next, p.x, p.y)
}

function centroViewportMundo() {
  if (!stage) return { x: 0, y: 0 }
  return screenToWorld(stage.width() / 2, stage.height() / 2)
}

function bboxDesenho() {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const w of walls.value) {
    minX = Math.min(minX, w.x1, w.x2)
    minY = Math.min(minY, w.y1, w.y2)
    maxX = Math.max(maxX, w.x1, w.x2)
    maxY = Math.max(maxY, w.y1, w.y2)
  }
  for (const p of points.value) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  if (!Number.isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}

/** Ajusta zoom e pan para todas as paredes/pontos caberem no viewport (com margem). */
function fitToScreen() {
  if (!stage || !worldGroup) return
  const W = stage.width()
  const H = stage.height()
  const pad = 96
  const b = bboxDesenho()
  if (!b) {
    worldGroup.scale({ x: 1, y: 1 })
    worldGroup.position({ x: 0, y: 0 })
    drawInfiniteGrid()
    updateFotoLayer()
    stage.batchDraw()
    return
  }
  const bw = Math.max(120, b.maxX - b.minX + pad * 2)
  const bh = Math.max(120, b.maxY - b.minY + pad * 2)
  const scaleFit = Math.min(W / bw, H / bh)
  const scl = clampViewScale(scaleFit)
  const cx = (b.minX + b.maxX) / 2
  const cy = (b.minY + b.maxY) / 2
  worldGroup.scale({ x: scl, y: scl })
  worldGroup.position({
    x: W / 2 - cx * scl,
    y: H / 2 - cy * scl,
  })
  drawInfiniteGrid()
  updateFotoLayer()
  stage.batchDraw()
}

function extDistCentroMm(w, end) {
  if (!stage || !w) return 0
  const c = centroViewportMundo()
  const x = end === 'a' ? w.x1 : w.x2
  const y = end === 'a' ? w.y1 : w.y2
  return Math.round(dist(x, y, c.x, c.y) * scaleMmPerPx.value)
}

function extDistVizinhaMm(w, end) {
  if (!w) return 0
  const x = end === 'a' ? w.x1 : w.x2
  const y = end === 'a' ? w.y1 : w.y2
  return minDistMmPontoOutrosMuros(x, y, w.id)
}

const JUNCAO_EPS = 4

function farEndFromJoint(w, jx, jy) {
  if (dist(jx, jy, w.x1, w.y1) < JUNCAO_EPS) return { x: w.x2, y: w.y2 }
  return { x: w.x1, y: w.y1 }
}

function interiorAngleDegAtJ(jx, jy, wA, wB) {
  const f1 = farEndFromJoint(wA, jx, jy)
  const f2 = farEndFromJoint(wB, jx, jy)
  const v1x = f1.x - jx
  const v1y = f1.y - jy
  const v2x = f2.x - jx
  const v2y = f2.y - jy
  const a1 = Math.atan2(v1y, v1x)
  const a2 = Math.atan2(v2y, v2x)
  let d = ((a2 - a1) * 180) / Math.PI
  while (d < 0) d += 360
  while (d > 180) d = 360 - d
  return d
}

function listarJuncoesDoisMuros() {
  const groups = []
  for (const w of walls.value) {
    for (const [x, y] of [[w.x1, w.y1], [w.x2, w.y2]]) {
      let g = groups.find((gr) => dist(gr.x, gr.y, x, y) < JUNCAO_EPS)
      if (!g) {
        g = { x, y, walls: [] }
        groups.push(g)
      }
      if (!g.walls.some((wi) => wi.id === w.id)) g.walls.push(w)
    }
  }
  /* Só encontro exatamente entre 2 paredes (em T com 3 segmentos, use o painel por parede). */
  return groups.filter((g) => g.walls.length === 2)
}

function aplicarAnguloInternoEmJ(jx, jy, wFix, wMove, interiorDeg) {
  const farF = farEndFromJoint(wFix, jx, jy)
  const v1x = farF.x - jx
  const v1y = farF.y - jy
  const L2 = comprimentoPxParede(wMove)
  const base = Math.atan2(v1y, v1x)
  const rad = base + (interiorDeg * Math.PI) / 180
  const nx = jx + L2 * Math.cos(rad)
  const ny = jy + L2 * Math.sin(rad)
  if (dist(wMove.x1, wMove.y1, jx, jy) < JUNCAO_EPS) {
    wMove.x2 = nx
    wMove.y2 = ny
  } else {
    wMove.x1 = nx
    wMove.y1 = ny
  }
  if (wMove.lengthMm == null) wMove.lengthMm = Math.round(L2 * scaleMmPerPx.value)
  wMove.angleDeg = wallAngleDegFromGeometry(wMove)
}

function labelTipo(t) {
  return simbolosCatalogo.find((x) => x.tipo === t)?.label || t
}

function limparSelecao() {
  selecionado.value = null
  redesenharWalls()
  redesenharPoints()
}

function fecharFloatEdit() {
  floatEdit.value.open = false
}

function dist(ax, ay, bx, by) {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2)
}

function comprimentoPxParede(w) {
  return dist(w.x1, w.y1, w.x2, w.y2)
}

function wallLengthMm(w) {
  const px = comprimentoPxParede(w)
  if (w.lengthMm != null && Number.isFinite(w.lengthMm)) return w.lengthMm
  return Math.round(px * scaleMmPerPx.value)
}

function collectWallEndpoints() {
  const pts = []
  for (const w of walls.value) {
    pts.push({ x: w.x1, y: w.y1, id: `${w.id}_a` }, { x: w.x2, y: w.y2, id: `${w.id}_b` })
  }
  return pts
}

function snapXY(x, y) {
  const pts = collectWallEndpoints()
  let best = null
  let bestD = SNAP_RADIUS_PX
  for (const p of pts) {
    const d = dist(x, y, p.x, p.y)
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return best ? { x: best.x, y: best.y } : { x, y }
}

/** Projeta (x,y) no segmento de parede mais próximo se estiver dentro de maxDistPx — símbolos ficam no eixo da parede. */
function projectToNearestWallSegment(x, y, maxDistPx) {
  let best = null
  for (const w of walls.value) {
    const dx = w.x2 - w.x1
    const dy = w.y2 - w.y1
    const len2 = dx * dx + dy * dy
    if (len2 < 1e-10) continue
    let t = ((x - w.x1) * dx + (y - w.y1) * dy) / len2
    t = Math.max(0, Math.min(1, t))
    const px = w.x1 + t * dx
    const py = w.y1 + t * dy
    const d = dist(x, y, px, py)
    if (d <= maxDistPx && (!best || d < best.d)) best = { x: px, y: py, d }
  }
  return best
}

function emitState() {
  emit('update:modelValue', {
    scaleMmPerPx: scaleMmPerPx.value,
    walls: walls.value.map((w) => ({
      id: w.id,
      x1: w.x1,
      y1: w.y1,
      x2: w.x2,
      y2: w.y2,
      lengthMm: w.lengthMm,
      angleDeg: w.angleDeg != null && Number.isFinite(w.angleDeg) ? w.angleDeg : undefined,
    })),
    points: points.value.map((p) => ({
      id: p.id,
      tipo: p.tipo,
      x: p.x,
      y: p.y,
      distanciaParedeEsquerdaMm: p.distanciaParedeEsquerdaMm ?? null,
      alturaChaoMm: p.alturaChaoMm ?? null,
    })),
  })
}

function drawInfiniteGrid() {
  if (!layerGrid) return
  layerGrid.destroyChildren()
  const g = new Konva.Group({ listening: false })
  const b = getVisibleWorldBounds()
  const spanX = Math.max(1, b.maxX - b.minX)
  const spanY = Math.max(1, b.maxY - b.minY)
  let step = GRID_STEP
  while (spanX / step > MAX_GRID_LINES) step *= 2
  while (spanY / step > MAX_GRID_LINES) step *= 2
  const lineColor = 'rgba(148, 163, 184, 0.1)'
  const strong = 'rgba(148, 163, 184, 0.2)'
  const sw = 1 / Math.max(getWorldScale(), 0.01)
  const x0 = Math.floor(b.minX / step) * step
  const y0 = Math.floor(b.minY / step) * step
  let ix = 0
  for (let x = x0; x <= b.maxX + step; x += step) {
    g.add(new Konva.Line({
      points: [x, b.minY, x, b.maxY],
      stroke: ix % 5 === 0 ? strong : lineColor,
      strokeWidth: sw,
      listening: false,
    }))
    ix++
  }
  let iy = 0
  for (let y = y0; y <= b.maxY + step; y += step) {
    g.add(new Konva.Line({
      points: [b.minX, y, b.maxX, y],
      stroke: iy % 5 === 0 ? strong : lineColor,
      strokeWidth: sw,
      listening: false,
    }))
    iy++
  }
  layerGrid.add(g)
  batchDrawStage()
}

function corTipoStroke(tipo) {
  const m = { TOMADA: '#fde047', AGUA: '#7dd3fc', GAS: '#fca5a5', VIGA: '#d6d3d1' }
  return m[tipo] || '#e2e8f0'
}

function addArrowHead(x, y, dirX, dirY, size, layer) {
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1
  const ux = dirX / len
  const uy = dirY / len
  const px = -uy
  const py = ux
  const tipX = x + ux * size
  const tipY = y + uy * size
  layer.add(new Konva.Line({
    points: [
      tipX, tipY,
      x + px * size * 0.45, y + py * size * 0.45,
      x - px * size * 0.45, y - py * size * 0.45,
    ],
    closed: true,
    fill: '#cbd5e1',
    stroke: '#f1f5f9',
    strokeWidth: 0.5,
    listening: false,
  }))
}

function redesenharCotas() {
  if (!layerCotas) return
  layerCotas.destroyChildren()
  const g = new Konva.Group({ listening: false })

  walls.value.forEach((w, index) => {
    const lenPx = comprimentoPxParede(w)
    if (lenPx < 2) return

    const ang = Math.atan2(w.y2 - w.y1, w.x2 - w.x1)
    const nx = -Math.sin(ang)
    const ny = Math.cos(ang)
    const side = index % 2 === 0 ? 1 : -1
    const off = COTA_OFFSET_BASE + (index % 3) * 6
    const ox = nx * off * side
    const oy = ny * off * side

    const ax = w.x1 + ox
    const ay = w.y1 + oy
    const bx = w.x2 + ox
    const by = w.y2 + oy

    const ux = Math.cos(ang)
    const uy = Math.sin(ang)

    g.add(new Konva.Line({
      points: [w.x1, w.y1, w.x1 + nx * COTA_TICK * side, w.y1 + ny * COTA_TICK * side],
      stroke: 'rgba(226, 232, 240, 0.45)',
      strokeWidth: 1,
      listening: false,
    }))
    g.add(new Konva.Line({
      points: [w.x2, w.y2, w.x2 + nx * COTA_TICK * side, w.y2 + ny * COTA_TICK * side],
      stroke: 'rgba(226, 232, 240, 0.45)',
      strokeWidth: 1,
      listening: false,
    }))

    g.add(new Konva.Line({
      points: [ax, ay, bx, by],
      stroke: '#e2e8f0',
      strokeWidth: 1.25,
      listening: false,
    }))

    const arrowS = 8
    addArrowHead(ax, ay, -ux, -uy, arrowS, g)
    addArrowHead(bx, by, ux, uy, arrowS, g)

    const mm = wallLengthMm(w)
    const cx = (ax + bx) / 2
    const cy = (ay + by) / 2
    let deg = (ang * 180) / Math.PI
    if (deg > 90) deg -= 180
    if (deg < -90) deg += 180

    const label = `${mm} mm`
    const t = new Konva.Text({
      x: cx,
      y: cy,
      text: label,
      fontSize: 12,
      fontStyle: 'bold',
      fill: '#f8fafc',
      align: 'center',
      verticalAlign: 'middle',
      rotation: deg,
      listening: false,
    })
    t.offsetX(t.width() / 2)
    t.offsetY(t.height() / 2)
    g.add(t)
  })

  layerCotas.add(g)
  batchDrawStage()
}

function redesenharCotaHits() {
  if (!layerCotaHits) return
  layerCotaHits.destroyChildren()
  walls.value.forEach((w, index) => {
    const lenPx = comprimentoPxParede(w)
    if (lenPx < 2) return
    const ang = Math.atan2(w.y2 - w.y1, w.x2 - w.x1)
    const nx = -Math.sin(ang)
    const ny = Math.cos(ang)
    const side = index % 2 === 0 ? 1 : -1
    const off = COTA_OFFSET_BASE + (index % 3) * 6
    const ax = w.x1 + nx * off * side
    const ay = w.y1 + ny * off * side
    const bx = w.x2 + nx * off * side
    const by = w.y2 + ny * off * side
    const cx = (ax + bx) / 2
    const cy = (ay + by) / 2
    let deg = (ang * 180) / Math.PI
    if (deg > 90) deg -= 180
    if (deg < -90) deg += 180
    const hit = new Konva.Rect({
      x: cx - 52,
      y: cy - 18,
      width: 104,
      height: 36,
      rotation: deg,
      offsetX: 52,
      offsetY: 18,
      fill: 'rgba(56,189,248,0.12)',
      stroke: 'rgba(56,189,248,0.35)',
      strokeWidth: 1,
      cornerRadius: 8,
    })
    hit.on('click tap', (e) => {
      e.cancelBubble = true
      abrirModalMedidaGrande(w)
    })
    layerCotaHits.add(hit)
  })
  batchDrawStage()
}

function redesenharSelExtras() {
  if (!layerSelExtras) return
  layerSelExtras.destroyChildren()
  if (selecionado.value?.kind !== 'parede' || !stage) {
    batchDrawStage()
    return
  }
  const w = selecionado.value.item
  const cx = stage.width() / 2
  const cy = stage.height() / 2
  const g = new Konva.Group({ listening: false })
  const mk = (ex, ey, label) => {
    g.add(new Konva.Line({
      points: [ex, ey, cx, cy],
      stroke: 'rgba(251, 191, 36, 0.35)',
      strokeWidth: 1,
      dash: [4, 4],
    }))
    g.add(new Konva.Text({
      x: (ex + cx) / 2 - 24,
      y: (ey + cy) / 2 - 8,
      width: 48,
      text: label,
      fontSize: 9,
      fill: '#fcd34d',
      align: 'center',
    }))
  }
  mk(w.x1, w.y1, `↔${extDistCentroMm(w, 'a')}`)
  mk(w.x2, w.y2, `↔${extDistCentroMm(w, 'b')}`)
  layerSelExtras.add(g)
  batchDrawStage()
}

function redesenharVertices() {
  if (!layerVertices) return
  layerVertices.destroyChildren()
  if (modo.value !== 'selecionar') {
    batchDrawStage()
    return
  }
  for (const j of listarJuncoesDoisMuros()) {
    const [wA, wB] = [...j.walls].sort((a, b) => String(a.id).localeCompare(String(b.id)))
    const c = new Konva.Circle({
      x: j.x,
      y: j.y,
      radius: 12,
      fill: 'rgba(251, 191, 36, 0.35)',
      stroke: '#fbbf24',
      strokeWidth: 2,
    })
    c.hitStrokeWidth(36)
    c.on('click tap', (e) => {
      e.cancelBubble = true
      modalVertice.value = {
        open: true,
        jx: j.x,
        jy: j.y,
        wFix: wA,
        wMove: wB,
        angleText: String(Math.round(interiorAngleDegAtJ(j.x, j.y, wA, wB) * 10) / 10),
      }
      nextTick(() => inputVerticeRef.value?.focus?.())
    })
    layerVertices.add(c)
  }
  batchDrawStage()
}

function bindWallEvents(lineNode, w) {
  lineNode.on('click tap', (e) => {
    e.cancelBubble = true
    if (modo.value !== 'selecionar') return
    selecionado.value = { kind: 'parede', item: w }
    redesenharWalls()
    redesenharPoints()
  })

  lineNode.on('dblclick dbltap', (e) => {
    e.cancelBubble = true
    abrirModalMedidaGrande(w)
  })
}

function redesenharWalls() {
  if (!layerWalls) return
  layerWalls.destroyChildren()
  const pat = getHatchPattern()
  walls.value.forEach((w) => {
    const sel = selecionado.value?.kind === 'parede' && selecionado.value.item.id === w.id
    const quad = wallQuadPoints(w)
    const poly = new Konva.Line({
      points: quad,
      closed: true,
      fill: sel ? '#243047' : '#1a2233',
      stroke: sel ? '#38bdf8' : '#475569',
      strokeWidth: 1.5,
      listening: false,
    })
    if (pat) {
      poly.fillPatternImage(pat)
      poly.fillPatternRepeat('repeat')
      poly.fillPatternScaleX(1)
      poly.fillPatternScaleY(1)
    }
    layerWalls.add(poly)

    const hitLn = new Konva.Line({
      points: [w.x1, w.y1, w.x2, w.y2],
      stroke: 'rgba(0,0,0,0.02)',
      strokeWidth: 3,
      lineCap: 'round',
      hitStrokeWidth: WALL_HIT_STROKE_PX,
    })
    bindWallEvents(hitLn, w)
    layerWalls.add(hitLn)
  })
  batchDrawStage()
  redesenharSelExtras()
  redesenharVertices()
  redesenharCotas()
  redesenharCotaHits()
}

function buildPontoIconGroup(p, sel) {
  const g = new Konva.Group({
    x: p.x,
    y: p.y,
    draggable: modo.value === 'selecionar',
  })

  const hit = new Konva.Circle({
    radius: 26,
    fill: 'rgba(0,0,0,0.01)',
    strokeEnabled: false,
  })
  g.add(hit)

  const pathData = ICON_PATHS[p.tipo] || ICON_PATHS.TOMADA
  const icon = new Konva.Path({
    data: pathData,
    stroke: corTipoStroke(p.tipo),
    strokeWidth: sel ? 2.4 : 2,
    lineJoin: 'round',
    lineCap: 'round',
    fill: sel ? 'rgba(248,250,252,0.12)' : 'rgba(15,23,42,0.35)',
  })
  try {
    const sr = icon.getSelfRect()
    icon.offsetX(sr.x + sr.width / 2)
    icon.offsetY(sr.y + sr.height / 2)
  } catch (_) {
    icon.offsetX(0)
    icon.offsetY(0)
  }
  g.add(icon)

  if (sel) {
    g.add(new Konva.Circle({
      radius: 18,
      stroke: '#fff',
      strokeWidth: 2,
      listening: false,
    }))
  }

  g.on('click tap', (e) => {
    e.cancelBubble = true
    selecionado.value = { kind: 'ponto', item: p }
    modo.value = 'selecionar'
    redesenharWalls()
    redesenharPoints()
  })

  g.on('dblclick dbltap', (e) => {
    e.cancelBubble = true
    abrirFloatEditPonto(p, e)
  })

  g.on('dragend', () => {
    p.x = g.x()
    p.y = g.y()
    emitState()
    redesenharCotas()
  })

  return g
}

function redesenharPoints() {
  if (!layerPoints) return
  layerPoints.destroyChildren()
  points.value.forEach((p) => {
    const sel = selecionado.value?.kind === 'ponto' && selecionado.value.item.id === p.id
    layerPoints.add(buildPontoIconGroup(p, sel))
  })
  batchDrawStage()
}

function posicaoFloatEditNaTela(e) {
  const evt = e?.evt
  let clientX
  let clientY
  if (evt?.changedTouches?.[0]) {
    clientX = evt.changedTouches[0].clientX
    clientY = evt.changedTouches[0].clientY
  } else if (evt) {
    clientX = evt.clientX
    clientY = evt.clientY
  } else if (stage && containerRef.value) {
    const p = stage.getPointerPosition()
    if (p) {
      const r = containerRef.value.getBoundingClientRect()
      clientX = r.left + p.x
      clientY = r.top + p.y
    }
  }
  if (clientX == null) return { left: '12px', top: '12px' }
  return {
    left: `${Math.min(window.innerWidth - 200, Math.max(8, clientX - 80))}px`,
    top: `${Math.min(window.innerHeight - 120, Math.max(8, clientY - 20))}px`,
  }
}

function abrirModalMedidaGrande(w) {
  fecharFloatEdit()
  modalMedida.value = {
    open: true,
    modo: 'editar',
    titulo: 'Comprimento (mm)',
    wallId: w.id,
    novaDraft: null,
    mmText: String(wallLengthMm(w)),
    medidaTipo: 'eixo',
  }
  nextTick(() => {
    inputMedidaRef.value?.focus?.()
    inputMedidaRef.value?.select?.()
  })
}

function confirmarModalPonto() {
  const p = points.value.find((x) => x.id === modalPonto.value.pointId)
  if (!p) return
  const s = scaleMmPerPx.value
  if (!Number.isFinite(s) || s <= 0) return
  const xmm = parseFloat(String(modalPonto.value.mmX).replace(',', '.'))
  const ymm = parseFloat(String(modalPonto.value.mmY).replace(',', '.'))
  if (!Number.isFinite(xmm) || !Number.isFinite(ymm)) return
  p.x = xmm / s
  p.y = ymm / s
  modalPonto.value.open = false
  modalPonto.value.pointId = null
  emitState()
  redesenharPoints()
  redesenharCotas()
}

function abrirFloatEditParede(w) {
  abrirModalMedidaGrande(w)
}

function abrirFloatEditPonto(p, e) {
  fecharFloatEdit()
  const pos = posicaoFloatEditNaTela(e)
  const s = scaleMmPerPx.value
  floatEdit.value = {
    open: true,
    kind: 'ponto',
    wallId: null,
    pointId: p.id,
    left: pos.left,
    top: pos.top,
    mmText: '',
    mmX: String(Math.round((p.x * s) * 10) / 10),
    mmY: String(Math.round((p.y * s) * 10) / 10),
  }
  nextTick(() => floatInputRef.value?.focus?.())
}

function aplicarFloatEdit() {
  const fe = floatEdit.value
  if (!fe.open) return
  if (fe.kind === 'ponto' && fe.pointId) {
    const p = points.value.find((x) => x.id === fe.pointId)
    if (!p) return
    const s = scaleMmPerPx.value
    if (!Number.isFinite(s) || s <= 0) return
    const xmm = parseFloat(String(fe.mmX).replace(',', '.'))
    const ymm = parseFloat(String(fe.mmY).replace(',', '.'))
    if (!Number.isFinite(xmm) || !Number.isFinite(ymm)) return
    p.x = xmm / s
    p.y = ymm / s
    emitState()
    redesenharPoints()
    redesenharCotas()
  }
  fecharFloatEdit()
}

function clearTempLine() {
  if (tempLineNode && layerTemp) {
    tempLineNode.destroy()
    tempLineNode = null
    batchDrawStage()
  }
}

function updateTempLine(x1, y1, x2, y2) {
  if (!layerTemp) return
  if (!tempLineNode) {
    tempLineNode = new Konva.Line({
      stroke: '#94a3b8',
      strokeWidth: 3,
      dash: [8, 5],
      lineCap: 'round',
      hitStrokeWidth: 24,
    })
    layerTemp.add(tempLineNode)
  }
  tempLineNode.points([x1, y1, x2, y2])
  batchDrawStage()
}

function getStageSize() {
  if (!containerRef.value) return { width: 800, height: 600 }
  const r = containerRef.value.getBoundingClientRect()
  return { width: Math.max(320, r.width), height: Math.max(200, r.height) }
}

/** Evita scroll da página ao usar roda sobre o canvas Konva */
function nativeCanvasWheelBlock(ev) {
  ev.preventDefault()
}

/** Tablet: touchmove precisa ser non-passive para pinça e pan não perderem o gesto para o browser */
function nativeCanvasTouchMoveBlock(ev) {
  if (ev.touches.length >= 2) {
    ev.preventDefault()
    return
  }
  if (panDrag) ev.preventDefault()
}

function touchToStageLocal(touch) {
  if (!containerRef.value || !touch) return null
  const r = containerRef.value.getBoundingClientRect()
  return { x: touch.clientX - r.left, y: touch.clientY - r.top }
}

function isDescendantOfGroup(node, group) {
  if (!node || !group) return false
  let n = node
  while (n) {
    if (n === group) return true
    n = typeof n.getParent === 'function' ? n.getParent() : null
  }
  return false
}

function isBackgroundCanvasTarget(t) {
  if (!t || !stage) return false
  return t === stage || t === worldBaseLayer || t === worldGroup
}

function pointerToWorldSnapped() {
  const pos = stage?.getPointerPosition()
  if (!pos) return null
  const w = screenToWorld(pos.x, pos.y)
  return snapXY(w.x, w.y)
}

function onStageMouseDown(e) {
  if (!stage) return
  const evt = e.evt
  const touches = evt.touches

  if (touches && touches.length === 2 && containerRef.value && worldGroup) {
    wallDraft.value = null
    clearTempLine()
    panDrag = null
    const t0 = touches[0]
    const t1 = touches[1]
    const dist0 = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY)
    pinchState = { lastDist: Math.max(dist0, 24) }
    evt.preventDefault?.()
    return
  }

  if (evt.button === 1 && worldGroup) {
    const pos = stage.getPointerPosition()
    if (pos) panDrag = { lastX: pos.x, lastY: pos.y }
    evt.preventDefault?.()
    return
  }

  if (floatEdit.value.open && isBackgroundCanvasTarget(e.target)) {
    fecharFloatEdit()
  }

  /** Símbolo armado deve vir antes do modo navegar, senão o pan captura o toque e o ponto nunca é colocado. */
  if (simboloPendente.value) {
    if (isAlvoBloqueiaColocarSimbolo(e)) return
    const pos = touches?.length === 1
      ? touchToStageLocal(touches[0])
      : stage.getPointerPosition()
    if (!pos) return
    const w = screenToWorld(pos.x, pos.y)
    const tipo = simboloPendente.value
    colocarPontoTipo(tipo, w.x, w.y)
    simboloPendente.value = null
    evt?.preventDefault?.()
    return
  }

  if (modo.value === 'navegar' && (!touches || touches.length === 1) && evt.button !== 2) {
    const pos = touches?.length === 1 ? touchToStageLocal(touches[0]) : stage.getPointerPosition()
    if (pos) panDrag = { lastX: pos.x, lastY: pos.y }
    return
  }

  if (modo.value === 'selecionar' && !isAlvoParedeOuPonto(e)) {
    selecionado.value = null
    redesenharWalls()
    redesenharPoints()
    return
  }
  if (modo.value !== 'parede') return
  if (isDescendantOfGroup(e.target, layerWalls) || isDescendantOfGroup(e.target, layerPoints)) return
  const pos = pointerToWorldSnapped()
  if (!pos) return
  wallDraft.value = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y }
}

function onStageMouseMove(e) {
  if (!stage || !worldGroup) return
  if (e.evt?.touches?.length >= 2 && wallDraft.value) {
    wallDraft.value = null
    clearTempLine()
  }

  if (pinchState && e.evt?.touches?.length === 2 && containerRef.value) {
    e.evt.preventDefault()
    const t = e.evt.touches
    const r = containerRef.value.getBoundingClientRect()
    const midX = (t[0].clientX + t[1].clientX) / 2 - r.left
    const midY = (t[0].clientY + t[1].clientY) / 2 - r.top
    const dist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const ratio = dist / Math.max(pinchState.lastDist, 8)
    const s0 = worldGroup.scaleX()
    const s1 = clampViewScale(s0 * ratio)
    zoomAtStageAnchor(s1, midX, midY)
    pinchState.lastDist = Math.max(dist, 8)
    return
  }

  if (panDrag) {
    let pos = null
    const te = e.evt
    if (te.touches?.length >= 1) pos = touchToStageLocal(te.touches[0])
    if (!pos) pos = stage.getPointerPosition()
    if (!pos) return
    const dx = pos.x - panDrag.lastX
    const dy = pos.y - panDrag.lastY
    panDrag.lastX = pos.x
    panDrag.lastY = pos.y
    worldGroup.position({
      x: worldGroup.x() + dx,
      y: worldGroup.y() + dy,
    })
    drawInfiniteGrid()
    stage.batchDraw()
    return
  }

  if (!wallDraft.value || modo.value !== 'parede') return
  const pos = pointerToWorldSnapped()
  if (!pos) return
  wallDraft.value.x2 = pos.x
  wallDraft.value.y2 = pos.y
  updateTempLine(wallDraft.value.x1, wallDraft.value.y1, pos.x, pos.y)
}

function finalizeWallDraftIfAny() {
  if (!wallDraft.value || modo.value !== 'parede') return
  let { x1, y1, x2, y2 } = wallDraft.value
  wallDraft.value = null
  clearTempLine()
  const s2 = snapXY(x2, y2)
  x2 = s2.x
  y2 = s2.y
  const len = dist(x1, y1, x2, y2)
  if (len < MIN_WALL_PX) return

  modalMedida.value = {
    open: true,
    modo: 'nova',
    titulo: 'Comprimento da parede',
    wallId: null,
    novaDraft: { x1, y1, x2, y2, comprimentoPx: len },
    mmText:
      scaleMmPerPx.value > 0 ? String(Math.max(1, Math.round(len * scaleMmPerPx.value))) : '',
    medidaTipo: 'eixo',
  }
  nextTick(() => {
    inputMedidaRef.value?.focus?.()
    inputMedidaRef.value?.select?.()
  })
}

function onStagePointerUp(e) {
  if (!e.evt.touches || e.evt.touches.length < 2) pinchState = null
  const wasPan = !!panDrag
  panDrag = null
  if (wasPan) return
  finalizeWallDraftIfAny()
}

function onGlobalPointerUp() {
  panDrag = null
  pinchState = null
  if (stage) finalizeWallDraftIfAny()
}

function confirmarModalMedida() {
  const mm = parseInt(String(modalMedida.value.mmText || '').replace(/\D/g, ''), 10)
  if (!Number.isFinite(mm) || mm < 1) return
  const m = modalMedida.value
  if (m.modo === 'editar' && m.wallId) {
    const w = walls.value.find((x) => x.id === m.wallId)
    if (w) {
      w.lengthMm = mm
      onParedeLengthChange(w)
    }
    m.open = false
    m.novaDraft = null
    return
  }
  if (m.modo === 'nova' && m.novaDraft) {
    const { x1, y1, x2, y2, comprimentoPx } = m.novaDraft
    if (walls.value.length === 0 && comprimentoPx > 0) {
      scaleMmPerPx.value = mm / comprimentoPx
    }
    const angDeg = wallAngleDegFromGeometry({ x1, y1, x2, y2 })
    walls.value.push({
      id: `w_${Date.now()}`,
      x1,
      y1,
      x2,
      y2,
      lengthMm: mm,
      angleDeg: angDeg,
    })
    m.open = false
    m.novaDraft = null
    redesenharWalls()
    emitState()
  }
}

function cancelarModalMedida() {
  modalMedida.value.open = false
  modalMedida.value.novaDraft = null
  wallDraft.value = null
  clearTempLine()
}

function confirmarModalVertice() {
  const v = parseFloat(String(modalVertice.value.angleText || '').replace(',', '.'))
  if (!Number.isFinite(v) || v <= 0 || v >= 180) return
  const { jx, jy, wFix, wMove } = modalVertice.value
  if (!wFix || !wMove) return
  aplicarAnguloInternoEmJ(jx, jy, wFix, wMove, v)
  modalVertice.value.open = false
  redesenharWalls()
  emitState()
}

function onParedeLengthChange(w) {
  if (!w.lengthMm || w.lengthMm < 1) return
  const ang = w.angleDeg != null && Number.isFinite(w.angleDeg)
    ? (w.angleDeg * Math.PI) / 180
    : Math.atan2(w.y2 - w.y1, w.x2 - w.x1)
  if (w.angleDeg == null || !Number.isFinite(w.angleDeg)) {
    w.angleDeg = (ang * 180) / Math.PI
  }
  const newLenPx = w.lengthMm / scaleMmPerPx.value
  w.x2 = w.x1 + newLenPx * Math.cos(ang)
  w.y2 = w.y1 + newLenPx * Math.sin(ang)
  w.angleDeg = wallAngleDegFromGeometry(w)
  redesenharWalls()
  emitState()
}

function removerParede(w) {
  walls.value = walls.value.filter((x) => x.id !== w.id)
  selecionado.value = null
  redesenharWalls()
  emitState()
}

function removerPonto(p) {
  points.value = points.value.filter((x) => x.id !== p.id)
  selecionado.value = null
  redesenharPoints()
  emitState()
}

function armarSimbolo(sym) {
  wallDraft.value = null
  clearTempLine()
  simboloPendente.value = simboloPendente.value === sym.tipo ? null : sym.tipo
}

function colocarPontoTipo(tipo, x, y) {
  if (!tipo || !simbolosCatalogo.some((s) => s.tipo === tipo)) return
  const proj = projectToNearestWallSegment(x, y, WALL_HIT_STROKE_PX + 10)
  const bx = proj ? proj.x : x
  const by = proj ? proj.y : y
  const sn = snapXY(bx, by)
  points.value.push({
    id: `p_${Date.now()}`,
    tipo,
    x: sn.x,
    y: sn.y,
    distanciaParedeEsquerdaMm: null,
    alturaChaoMm: null,
  })
  redesenharPoints()
  emitState()
}

function isAlvoParedeOuPonto(e) {
  const t = e.target
  return (
    isDescendantOfGroup(t, layerWalls)
    || isDescendantOfGroup(t, layerPoints)
    || isDescendantOfGroup(t, layerCotaHits)
    || isDescendantOfGroup(t, layerVertices)
  )
}

/** Ao colocar símbolo: só bloqueia outro ponto ou vértice de parede — parede/cota permitem marcar em cima do desenho. */
function isAlvoBloqueiaColocarSimbolo(e) {
  const t = e.target
  return isDescendantOfGroup(t, layerPoints) || isDescendantOfGroup(t, layerVertices)
}

function onDragSymStart(e, sym) {
  e.dataTransfer?.setData('text/plain', sym.tipo)
  e.dataTransfer.effectAllowed = 'copy'
  simboloPendente.value = null
}

function onDropSym(e) {
  e.preventDefault()
  const tipo = e.dataTransfer?.getData('text/plain')
  if (!tipo || !simbolosCatalogo.some((s) => s.tipo === tipo)) return
  if (!containerRef.value || !stage) return
  const rect = containerRef.value.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const w = screenToWorld(sx, sy)
  colocarPontoTipo(tipo, w.x, w.y)
}

function loadFromModel(v) {
  if (!v || typeof v !== 'object') return
  if (v.scaleMmPerPx != null && Number.isFinite(Number(v.scaleMmPerPx))) {
    scaleMmPerPx.value = Number(v.scaleMmPerPx)
  }
  walls.value = Array.isArray(v.walls)
    ? v.walls.map((w) => ({
      id: w.id || `w_${Math.random().toString(36).slice(2)}`,
      x1: Number(w.x1),
      y1: Number(w.y1),
      x2: Number(w.x2),
      y2: Number(w.y2),
      lengthMm: w.lengthMm != null ? Number(w.lengthMm) : null,
      angleDeg: w.angleDeg != null && Number.isFinite(Number(w.angleDeg)) ? Number(w.angleDeg) : null,
    }))
    : []
  points.value = Array.isArray(v.points)
    ? v.points.map((p) => ({
      id: p.id || `p_${Math.random().toString(36).slice(2)}`,
      tipo: p.tipo,
      x: Number(p.x),
      y: Number(p.y),
      distanciaParedeEsquerdaMm: p.distanciaParedeEsquerdaMm != null ? Number(p.distanciaParedeEsquerdaMm) : null,
      alturaChaoMm: p.alturaChaoMm != null ? Number(p.alturaChaoMm) : null,
    }))
    : []
  selecionado.value = null
  fecharFloatEdit()
  redesenharWalls()
  redesenharPoints()
}

function updateFotoLayer() {
  if (!layerFoto || !stage) return
  layerFoto.destroyChildren()
  const url = String(props.fotoUrl || '').trim()
  if (!croquiFotoAtivo.value || !url) {
    batchDrawStage()
    return
  }
  const img = new window.Image()
  if (url.startsWith('http://') || url.startsWith('https://')) {
    img.crossOrigin = 'anonymous'
  }
  img.onload = () => {
    if (!layerFoto || !stage || !worldGroup) return
    layerFoto.destroyChildren()
    const sc = worldGroup.scaleX()
    const ww = stage.width() / sc
    const wh = stage.height() / sc
    const iw = img.naturalWidth || img.width
    const ih = img.naturalHeight || img.height
    if (iw < 1 || ih < 1) {
      batchDrawStage()
      return
    }
    const coverSc = Math.max(ww / iw, wh / ih)
    const w = iw * coverSc
    const h = ih * coverSc
    const c = centroViewportMundo()
    layerFoto.add(
      new Konva.Image({
        image: img,
        x: c.x - w / 2,
        y: c.y - h / 2,
        width: w,
        height: h,
        opacity: 0.3,
        listening: false,
      }),
    )
    batchDrawStage()
  }
  img.onerror = () => {
    layerFoto?.destroyChildren()
    batchDrawStage()
  }
  img.src = url
}

function initStage() {
  if (!containerRef.value) return
  if (stage) destroyStage()
  if (typeof containerRef.value.replaceChildren === 'function') {
    containerRef.value.replaceChildren()
  } else {
    containerRef.value.innerHTML = ''
  }
  Konva.touchScrollEnabled = false
  const { width, height } = getStageSize()
  stage = new Konva.Stage({
    container: containerRef.value,
    width,
    height,
  })
  worldBaseLayer = new Konva.Layer()
  if (worldBaseLayer.getType() !== 'Layer') {
    console.error('[MedicaoCanvas] Konva.Layer inválido — instale uma única versão de konva (vite dedupe).')
  }
  worldGroup = new Konva.Group({ x: 0, y: 0, scaleX: 1, scaleY: 1 })
  layerFoto = new Konva.Group({ listening: false })
  layerGrid = new Konva.Group({ listening: false })
  layerWalls = new Konva.Group()
  layerSelExtras = new Konva.Group({ listening: false })
  layerVertices = new Konva.Group()
  layerCotas = new Konva.Group({ listening: false })
  layerCotaHits = new Konva.Group()
  layerPoints = new Konva.Group()
  layerTemp = new Konva.Group({ listening: false })
  stage.add(worldBaseLayer)
  worldBaseLayer.add(worldGroup)
  worldGroup.add(layerFoto)
  worldGroup.add(layerGrid)
  worldGroup.add(layerWalls)
  worldGroup.add(layerSelExtras)
  worldGroup.add(layerVertices)
  worldGroup.add(layerCotas)
  worldGroup.add(layerCotaHits)
  worldGroup.add(layerPoints)
  worldGroup.add(layerTemp)
  drawInfiniteGrid()
  updateFotoLayer()

  stage.on('mousedown touchstart', onStageMouseDown)
  stage.on('mousemove touchmove', onStageMouseMove)
  stage.on('mouseup touchend', onStagePointerUp)
  stage.on('wheel', onStageWheel)
  const canvasEl = stage.container()
  if (canvasEl) {
    canvasEl.addEventListener('wheel', nativeCanvasWheelBlock, { passive: false })
    canvasEl.addEventListener('touchmove', nativeCanvasTouchMoveBlock, { passive: false })
  }

  window.addEventListener('mouseup', onGlobalPointerUp)
  window.addEventListener('touchend', onGlobalPointerUp, { passive: true })

  loadFromModel(props.modelValue)
}

function destroyStage() {
  window.removeEventListener('mouseup', onGlobalPointerUp)
  window.removeEventListener('touchend', onGlobalPointerUp, { passive: true })
  if (stage) {
    const canvasEl = stage.container()
    if (canvasEl) {
      canvasEl.removeEventListener('wheel', nativeCanvasWheelBlock, { passive: false })
      canvasEl.removeEventListener('touchmove', nativeCanvasTouchMoveBlock, { passive: false })
    }
    stage.destroy()
    stage = null
  }
  worldBaseLayer = null
  worldGroup = null
  layerFoto = null
  layerGrid = null
  layerWalls = null
  layerSelExtras = null
  layerVertices = null
  layerCotas = null
  layerCotaHits = null
  layerPoints = null
  layerTemp = null
  tempLineNode = null
  panDrag = null
  pinchState = null
}

function resizeStage() {
  if (!stage || !containerRef.value) return
  const { width, height } = getStageSize()
  stage.width(width)
  stage.height(height)
  drawInfiniteGrid()
  updateFotoLayer()
  redesenharWalls()
  redesenharPoints()
}

watch(modo, (m) => {
  simboloPendente.value = null
  wallDraft.value = null
  clearTempLine()
  panDrag = null
  pinchState = null
  if (m === 'parede') selecionado.value = null
  redesenharWalls()
  redesenharPoints()
})

watch(
  () => props.modelValue,
  (v) => {
    if (!stage) return
    loadFromModel(v)
  },
  { deep: true },
)

watch([() => props.fotoUrl, croquiFotoAtivo], () => {
  if (stage) nextTick(() => updateFotoLayer())
})

let resizeObs = null

onMounted(() => {
  nextTick(() => {
    initStage()
    window.addEventListener('resize', resizeStage)
    if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
      resizeObs = new ResizeObserver(() => resizeStage())
      resizeObs.observe(containerRef.value)
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeStage)
  resizeObs?.disconnect()
  resizeObs = null
  destroyStage()
})

defineExpose({
  getState: () => ({
    scaleMmPerPx: scaleMmPerPx.value,
    walls: walls.value,
    points: points.value,
  }),
  fitToScreen,
})
</script>

<style scoped>
.medicao-canvas__toolbar {
  box-shadow: 0 1px 0 rgb(0 0 0 / 0.2);
}

.medicao-canvas__toolbar-row {
  scrollbar-width: thin;
  scrollbar-color: rgb(51 65 85) transparent;
}

.medicao-canvas__toolbar-row::-webkit-scrollbar {
  height: 5px;
}

.medicao-canvas__toolbar-row::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgb(51 65 85);
}

.medicao-canvas__toolbar-vdiv {
  display: inline-block;
  flex-shrink: 0;
  width: 1px;
  height: 2rem;
  align-self: center;
  background: rgb(51 65 85 / 0.95);
}

.medicao-canvas__toolbar-section-label {
  flex-shrink: 0;
  padding: 0 0.15rem 0 0.25rem;
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1.2;
  text-transform: uppercase;
  color: rgb(148 163 184);
}

@media (min-width: 480px) {
  .medicao-canvas__toolbar-section-label {
    font-size: 0.75rem;
    padding-left: 0.35rem;
  }
}

.medicao-canvas__toolbar-hint {
  margin: 0;
  border-top: 1px solid rgb(56 189 248 / 0.18);
  background: rgb(12 74 110 / 0.2);
  padding: 0.35rem 0.75rem;
  text-align: center;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.35;
  color: rgb(125 211 252);
}

@media (min-width: 480px) {
  .medicao-canvas__toolbar-hint {
    font-size: 0.75rem;
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;
  }
}

.medicao-canvas__tool-btn {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0;
  min-height: 2.75rem;
  min-width: 2.75rem;
  padding: 0.35rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(51 65 85 / 0.85);
  background: rgb(30 41 59 / 0.92);
  color: rgb(226 232 240);
}

@media (min-width: 480px) {
  .medicao-canvas__tool-btn {
    min-height: 3rem;
    min-width: 3rem;
    border-radius: 0.8rem;
  }
}

.medicao-canvas__tool-btn--foto {
  gap: 0.45rem;
  min-width: 0;
  padding-left: 0.55rem;
  padding-right: 0.65rem;
}

.medicao-canvas__tool-btn-icon {
  font-size: 1.25rem;
  line-height: 1;
}

@media (min-width: 480px) {
  .medicao-canvas__tool-btn-icon {
    font-size: 1.4rem;
  }
}

.medicao-canvas__tool-btn-label--inline {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  color: rgb(186 230 253 / 0.85);
  white-space: nowrap;
}

@media (min-width: 480px) {
  .medicao-canvas__tool-btn-label--inline {
    font-size: 0.78rem;
  }
}

.medicao-canvas__tool-btn--on .medicao-canvas__tool-btn-label--inline {
  color: rgb(186 230 253);
}

.medicao-canvas__tool-btn--on {
  border-color: rgb(56 189 248 / 0.4);
  background: rgb(14 165 233 / 0.14);
  color: rgb(186 230 253);
  box-shadow: inset 0 0 0 1px rgb(56 189 248 / 0.28);
}

.medicao-canvas__tool-btn:disabled {
  opacity: 0.38;
  pointer-events: none;
}

.medicao-canvas__sym-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  min-width: 2.75rem;
  padding: 0.3rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(51 65 85 / 0.9);
  background: rgb(30 41 59 / 0.95);
  color: rgb(226 232 240);
}

@media (min-width: 480px) {
  .medicao-canvas__sym-btn {
    min-height: 3rem;
    min-width: 3rem;
    border-radius: 0.8rem;
  }
}

.medicao-canvas__sym-icon {
  font-size: 1.35rem;
  line-height: 1;
}

@media (min-width: 480px) {
  .medicao-canvas__sym-icon {
    font-size: 1.55rem;
  }
}

.medicao-canvas__sym-btn:active {
  transform: scale(0.97);
}

.medicao-canvas__sym-btn--armed {
  border-color: rgb(56 189 248 / 0.55);
  background: rgb(14 165 233 / 0.18);
  box-shadow: inset 0 0 0 1px rgb(56 189 248 / 0.35);
}

.medicao-canvas__close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  color: rgb(148 163 184);
}

.medicao-canvas__close-btn:hover {
  background: rgb(51 65 85 / 0.5);
  color: rgb(248 250 252);
}

.medicao-canvas__float-edit {
  min-width: 10rem;
}

.medicao-canvas__input-medida {
  min-height: 3.5rem;
}
</style>
