<template>
  <div
    class="croqui-ambiente-venda flex overflow-hidden bg-slate-800"
    :class="fullScreen ? 'h-full min-h-0 rounded-none border-0' : 'rounded-xl border-2 border-slate-200 dark:border-slate-600 min-h-[360px]'"
  >
    <!-- Barra lateral fixa: ARRASTE (Porta, Janela, Pilastra + com foto: Tomada, Água, Gás) -->
    <div class="w-20 flex-shrink-0 flex flex-col gap-2 p-2 bg-slate-700/80 border-r border-slate-600">
      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Arraste</p>
      <button
        v-for="sym in simbolosVisiveis"
        :key="sym.tipo"
        type="button"
        class="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-600 hover:bg-slate-500 border border-slate-500 text-white cursor-grab active:cursor-grabbing touch-manipulation"
        draggable="true"
        @dragstart="onDragStart($event, sym)"
      >
        <i :class="sym.icon" class="text-2xl mb-1" />
        <span class="text-[10px] font-medium leading-tight text-center">{{ sym.label }}</span>
      </button>
    </div>

    <!-- Área do canvas: ocupa todo o resto; bloqueia scroll no dedo (touch-action: none) -->
    <div
      class="flex-1 min-w-0 min-h-0 relative bg-slate-900 touch-none"
      :style="fullScreen ? {} : { minHeight: '320px', height: '360px' }"
      @dragover.prevent
      @drop="onDrop"
    >
      <div
        ref="containerRef"
        class="absolute inset-0 w-full h-full"
        :style="fullScreen ? {} : { minHeight: '320px' }"
      />
      <!-- Sem foto e sem desenho: escolher modo -->
      <div
        v-if="!fotoDataUrl && cotas.length === 0 && pontos.length === 0 && simbolos.length === 0"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-800/95 z-10 p-4"
      >
        <p class="text-slate-300 text-center font-medium">Desenhe o cômodo ou use uma foto da parede</p>
        <div class="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            class="flex flex-col items-center gap-2 px-5 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white touch-manipulation"
            @click="iniciarDesenhoPlanta"
          >
            <i class="pi pi-pencil text-3xl" />
            <span class="font-medium text-sm">Desenhar planta</span>
            <span class="text-xs opacity-90">Paredes e cotas (grudam no fechamento)</span>
          </button>
          <label class="flex flex-col items-center gap-2 px-5 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer touch-manipulation">
            <i class="pi pi-camera text-3xl" />
            <span class="font-medium text-sm">Marcar sobre Foto</span>
            <span class="text-xs opacity-90">Foto vai para o fundo; marque tomadas e água na imagem</span>
            <input ref="inputFotoRef" type="file" accept="image/*" capture="environment" class="hidden" @change="onFotoSelect" />
          </label>
        </div>
      </div>
      <!-- Com conteúdo: mini toolbar modo -->
      <div v-else class="absolute top-2 left-2 z-10 flex gap-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-medium touch-manipulation"
          :class="modo === 'cota' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-200'"
          @click="modo = 'cota'"
        >
          Cota
        </button>
        <button
          v-if="fotoDataUrl"
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-medium touch-manipulation"
          :class="modo === 'ponto' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-200'"
          @click="modo = 'ponto'"
        >
          ⚡💧🔥 Ponto
        </button>
      </div>
    </div>
  </div>

  <!-- Modal cota (mm) - teclado numérico -->
  <Teleport to="body">
    <div v-if="modalCota" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" @click.self="fecharCota">
      <div class="bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full border border-slate-600">
        <h3 class="text-lg font-semibold text-white mb-2">Medida (mm)</h3>
        <input
          ref="inputCotaRef"
          v-model="cotaMm"
          type="number"
          inputmode="numeric"
          min="1"
          class="w-full rounded-xl border-2 border-slate-600 bg-slate-700 text-white px-4 py-4 text-xl"
          placeholder="Ex: 3155"
          @keyup.enter="aplicarCota"
        />
        <div class="flex gap-2 mt-4">
          <button type="button" class="flex-1 py-3 rounded-xl border border-slate-600 text-slate-200" @click="fecharCota">Cancelar</button>
          <button type="button" class="flex-1 py-3 rounded-xl bg-amber-500 text-white font-medium" @click="aplicarCota">OK</button>
        </div>
      </div>
    </div>
    <div v-if="modalPonto" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" @click.self="fecharPonto">
      <div class="bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full border border-slate-600">
        <h3 class="text-lg font-semibold text-white mb-2">Altura (mm) – opcional</h3>
        <input
          ref="inputPontoRef"
          v-model="pontoAlturaMm"
          type="number"
          inputmode="numeric"
          min="0"
          class="w-full rounded-xl border-2 border-slate-600 bg-slate-700 text-white px-4 py-4 text-xl"
          placeholder="Ex: 1200"
          @keyup.enter="aplicarPonto"
        />
        <div class="flex gap-2 mt-4">
          <button type="button" class="flex-1 py-3 rounded-xl border border-slate-600 text-slate-200" @click="fecharPonto">Cancelar</button>
          <button type="button" class="flex-1 py-3 rounded-xl bg-amber-500 text-white font-medium" @click="aplicarPonto">OK</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Konva from 'konva'

const SCALE_MM_PER_PX = 10
const SIMBOLOS_ARRESTAR = [
  { tipo: 'PORTA', label: 'Porta', icon: 'pi pi-minus' },
  { tipo: 'JANELA', label: 'Janela', icon: 'pi pi-th-large' },
  { tipo: 'PILASTRA', label: 'Pilastra', icon: 'pi pi-square' },
]
const PONTOS_ELEVACAO = [
  { tipo: 'TOMADA', label: 'Tomada', icon: 'pi pi-bolt' },
  { tipo: 'AGUA', label: 'Água', icon: 'pi pi-circle' },
  { tipo: 'GAS', label: 'Gás', icon: 'pi pi-fire' },
]

const props = defineProps({
  modelValue: { type: Object, default: () => null },
  /** true = página fullscreen (tablet): preenche altura, sidebar fixa, sem bordas */
  fullScreen: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const inputFotoRef = ref(null)
const modo = ref('cota')
const fotoDataUrl = ref(null)
const cotas = ref([])
const pontos = ref([])
const simbolos = ref([])
const cotaStart = ref(null)
const cotaEditando = ref(null)
const pontoPendente = ref(null)
const modalCota = ref(false)
const modalPonto = ref(false)
const cotaMm = ref('')
const pontoAlturaMm = ref('')
const inputCotaRef = ref(null)
const inputPontoRef = ref(null)

const simbolosVisiveis = computed(() => {
  const base = [...SIMBOLOS_ARRESTAR]
  if (fotoDataUrl.value) base.push(...PONTOS_ELEVACAO)
  return base
})

let stage = null
let layerGrid = null
let layerBg = null
let layerDraw = null

const SNAP_RADIUS = 24
const GRID_STEP = 20

function cor(tipo) {
  const c = { TOMADA: '#eab308', AGUA: '#0ea5e9', GAS: '#ef4444', PORTA: '#78716c', JANELA: '#0ea5e9', PILASTRA: '#57534e' }
  return c[tipo] || '#94a3b8'
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

/** Todos os vértices das paredes (para snapping) */
function getAllVertices() {
  const out = []
  cotas.value.forEach((c) => {
    out.push({ x: c.x1, y: c.y1 })
    out.push({ x: c.x2, y: c.y2 })
  })
  return out
}

/** Gruda o ponto no vértice mais próximo se estiver dentro do raio */
function snapToVertex(px, py) {
  const verts = getAllVertices()
  let best = { x: px, y: py }
  let bestD = SNAP_RADIUS
  verts.forEach((v) => {
    const d = dist(px, py, v.x, v.y)
    if (d < bestD) {
      bestD = d
      best = { x: v.x, y: v.y }
    }
  })
  return best
}

/** Distância de ponto (px,py) ao segmento (x1,y1)-(x2,y2); retorna { dist, x, y, t } (t = 0..1 = posição na linha) */
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy) || 1e-6
  let t = ((px - x1) * dx + (py - y1) * dy) / (len * len)
  t = Math.max(0, Math.min(1, t))
  const x = x1 + t * dx
  const y = y1 + t * dy
  return { dist: dist(px, py, x, y), x, y, t }
}

/** Encontra a parede mais próxima do ponto e retorna posição projetada + ângulo em graus */
function snapToWall(px, py) {
  let best = null
  let bestDist = 36
  cotas.value.forEach((c, idx) => {
    const r = distToSegment(px, py, c.x1, c.y1, c.x2, c.y2)
    if (r.dist < bestDist) {
      bestDist = r.dist
      const angle = Math.atan2(c.y2 - c.y1, c.x2 - c.x1)
      best = { x: r.x, y: r.y, rotation: (angle * 180) / Math.PI, lineIndex: idx }
    }
  })
  return best
}

function getSize() {
  if (!containerRef.value) return { width: 400, height: 320 }
  const r = containerRef.value.getBoundingClientRect()
  const minH = props.fullScreen ? 200 : 320
  return { width: r.width, height: Math.max(r.height, minH) }
}

function emitData() {
  emit('update:modelValue', {
    backgroundImage: fotoDataUrl.value ?? null,
    scaleMmPerPx: SCALE_MM_PER_PX,
    cotas: cotas.value.map((c) => ({ x1: c.x1, y1: c.y1, x2: c.x2, y2: c.y2, lengthMm: c.lengthMm })),
    pontos: pontos.value.map((p) => ({ x: p.x, y: p.y, alturaMm: p.alturaMm })),
    simbolos: simbolos.value.map((s) => ({ tipo: s.tipo, x: s.x, y: s.y, lineIndex: s.lineIndex, rotation: s.rotation })),
  })
}

const temDesenhoOuMarcacao = computed(() => {
  const d = props.modelValue
  if (!d) return cotas.value.length > 0 || pontos.value.length > 0 || simbolos.value.length > 0 || !!fotoDataUrl.value
  const temCotas = (d.cotas && d.cotas.length) || cotas.value.length
  const temPontos = (d.pontos && d.pontos.length) || pontos.value.length
  const temSimbolos = (d.simbolos && d.simbolos.length) || simbolos.value.length
  const temFoto = !!d.backgroundImage || !!fotoDataUrl.value
  return temCotas > 0 || temPontos > 0 || temSimbolos > 0 || (temFoto && (pontos.value.length || simbolos.value.length))
})

function redesenhar() {
  if (!layerDraw) return
  layerDraw.destroyChildren()

  const size = getSize()
  const cotaOffset = 22

  cotas.value.forEach((c) => {
    const g = new Konva.Group({ listening: true })
    const line = new Konva.Line({ points: [c.x1, c.y1, c.x2, c.y2], stroke: '#22c55e', strokeWidth: 3, lineCap: 'round' })
    g.add(line)

    const cx = (c.x1 + c.x2) / 2
    const cy = (c.y1 + c.y2) / 2
    const angle = Math.atan2(c.y2 - c.y1, c.x2 - c.x1)
    const deg = (angle * 180) / Math.PI
    const perpX = -Math.sin(angle) * cotaOffset
    const perpY = Math.cos(angle) * cotaOffset
    const tx = cx + perpX
    const ty = cy + perpY
    const text = new Konva.Text({
      x: tx,
      y: ty,
      width: 70,
      text: (c.lengthMm ?? Math.round(dist(c.x1, c.y1, c.x2, c.y2) * SCALE_MM_PER_PX)) + ' mm',
      fontSize: 13,
      fill: '#22c55e',
      align: 'center',
      listening: true,
      offsetX: 35,
      offsetY: 6,
      rotation: deg,
    })
    text.on('click', (e) => {
      e.cancelBubble = true
      cotaEditando.value = c
      cotaMm.value = String(c.lengthMm ?? '')
      modalCota.value = true
      setTimeout(() => inputCotaRef.value?.focus(), 80)
    })
    g.add(text)
    layerDraw.add(g)
  })

  pontos.value.forEach((p) => {
    const g = new Konva.Group({ x: p.x, y: p.y, draggable: true })
    const circle = new Konva.Circle({ radius: 14, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 })
    const lbl = new Konva.Text({ y: 18, width: 50, text: p.alturaMm != null ? p.alturaMm + ' mm' : 'Ponto', fontSize: 10, fill: '#fff', align: 'center', offsetX: 25 })
    g.add(circle).add(lbl)
    g.on('dragend', () => { p.x = g.x(); p.y = g.y(); emitData() })
    layerDraw.add(g)
  })

  simbolos.value.forEach((s) => {
    const rot = s.rotation != null ? s.rotation : 0
    const g = new Konva.Group({
      x: s.x,
      y: s.y,
      rotation: rot,
      offsetX: 0,
      offsetY: 0,
      draggable: true,
    })
    const circle = new Konva.Circle({ radius: 16, fill: cor(s.tipo), stroke: '#fff', strokeWidth: 2 })
    const lbl = new Konva.Text({ y: 20, width: 60, text: simbolosVisiveis.value.find(x => x.tipo === s.tipo)?.label || s.tipo, fontSize: 9, fill: '#fff', align: 'center', offsetX: 30 })
    g.add(circle).add(lbl)
    g.on('dragend', () => {
      s.x = g.x()
      s.y = g.y()
      const snap = snapToWall(s.x, s.y)
      if (snap && SIMBOLOS_ARRESTAR.some((x) => x.tipo === s.tipo)) {
        s.x = snap.x
        s.y = snap.y
        s.rotation = snap.rotation
        s.lineIndex = snap.lineIndex
      } else {
        s.rotation = undefined
        s.lineIndex = undefined
      }
      emitData()
      redesenhar()
    })
    layerDraw.add(g)
  })

  if (cotaStart.value) {
    const circ = new Konva.Circle({
      x: cotaStart.value.x,
      y: cotaStart.value.y,
      radius: 8,
      fill: 'rgba(34, 197, 94, 0.6)',
      stroke: '#22c55e',
      strokeWidth: 2,
      listening: false,
    })
    layerDraw.add(circ)
  }

  layerDraw.batchDraw()
}

function desenharGrid() {
  if (!layerGrid) return
  layerGrid.destroyChildren()
  const size = getSize()
  const gridColor = 'rgba(148, 163, 184, 0.2)'
  for (let x = 0; x <= size.width + GRID_STEP; x += GRID_STEP) {
    layerGrid.add(new Konva.Line({ points: [x, 0, x, size.height], stroke: gridColor, strokeWidth: 1 }))
  }
  for (let y = 0; y <= size.height + GRID_STEP; y += GRID_STEP) {
    layerGrid.add(new Konva.Line({ points: [0, y, size.width, y], stroke: gridColor, strokeWidth: 1 }))
  }
  layerGrid.batchDraw()
}

function fitBg() {
  if (!layerBg || !fotoDataUrl.value) return
  layerBg.destroyChildren()
  const size = getSize()
  const img = new Image()
  img.onload = () => {
    layerBg.add(new Konva.Image({ image: img, x: 0, y: 0, width: size.width, height: size.height, listening: false }))
    layerBg.batchDraw()
  }
  img.src = fotoDataUrl.value
}

function onStageClick(e) {
  const pos = stage.getPointerPosition()
  if (!pos) return
  if (modo.value === 'cota') {
    const snapped = snapToVertex(pos.x, pos.y)
    if (!cotaStart.value) {
      cotaStart.value = { x: snapped.x, y: snapped.y }
      redesenhar()
      return
    }
    const lenPx = dist(cotaStart.value.x, cotaStart.value.y, snapped.x, snapped.y)
    if (lenPx < 8) return
    cotas.value.push({
      x1: cotaStart.value.x,
      y1: cotaStart.value.y,
      x2: snapped.x,
      y2: snapped.y,
      lengthMm: Math.round(lenPx * SCALE_MM_PER_PX) || 100,
    })
    cotaStart.value = null
    redesenhar()
    emitData()
    return
  }
  if (modo.value === 'ponto' && fotoDataUrl.value) {
    pontoPendente.value = { x: pos.x, y: pos.y }
    pontoAlturaMm.value = ''
    modalPonto.value = true
    setTimeout(() => inputPontoRef.value?.focus(), 80)
  }
}

function onDragStart(e, sym) {
  e.dataTransfer.setData('text/plain', sym.tipo)
  e.dataTransfer.effectAllowed = 'copy'
}

function onDrop(e) {
  e.preventDefault()
  const tipo = e.dataTransfer?.getData('text/plain')
  if (!tipo || !containerRef.value || !stage) return
  const rect = containerRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const isParedeSymbol = SIMBOLOS_ARRESTAR.some((s) => s.tipo === tipo)
  if (isParedeSymbol && cotas.value.length > 0) {
    const snap = snapToWall(x, y)
    if (snap) {
      simbolos.value.push({
        tipo,
        x: snap.x,
        y: snap.y,
        rotation: snap.rotation,
        lineIndex: snap.lineIndex,
      })
    } else {
      simbolos.value.push({ tipo, x, y })
    }
  } else {
    simbolos.value.push({ tipo, x, y })
  }
  redesenhar()
  emitData()
}

function iniciarDesenhoPlanta() {
  fotoDataUrl.value = null
  modo.value = 'cota'
  fitBg()
  desenharGrid()
  redesenhar()
}

function onFotoSelect(ev) {
  const file = ev.target?.files?.[0]
  if (!file) return
  ev.target.value = ''
  const reader = new FileReader()
  reader.onload = () => {
    fotoDataUrl.value = reader.result
    modo.value = 'ponto'
    emitData()
    setTimeout(() => {
      fitBg()
      desenharGrid()
      redesenhar()
    }, 100)
  }
  reader.readAsDataURL(file)
}

function fecharCota() {
  modalCota.value = false
  cotaEditando.value = null
}

function aplicarCota() {
  if (!cotaEditando.value) return
  const mm = parseInt(cotaMm.value, 10)
  if (!Number.isFinite(mm) || mm < 1) { fecharCota(); return }
  const c = cotaEditando.value
  const lenPx = dist(c.x1, c.y1, c.x2, c.y2)
  const newLenPx = mm / SCALE_MM_PER_PX
  const angle = Math.atan2(c.y2 - c.y1, c.x2 - c.x1)
  c.x2 = c.x1 + newLenPx * Math.cos(angle)
  c.y2 = c.y1 + newLenPx * Math.sin(angle)
  c.lengthMm = mm
  fecharCota()
  redesenhar()
  emitData()
}

function fecharPonto() {
  modalPonto.value = false
  pontoPendente.value = null
}

function aplicarPonto() {
  if (!pontoPendente.value) return
  const altura = parseInt(pontoAlturaMm.value, 10)
  pontos.value.push({
    x: pontoPendente.value.x,
    y: pontoPendente.value.y,
    alturaMm: Number.isFinite(altura) && altura >= 0 ? altura : null,
  })
  fecharPonto()
  redesenhar()
  emitData()
}

function load(d) {
  if (!d) return
  fotoDataUrl.value = d.backgroundImage ?? null
  cotas.value = (d.cotas || []).map((c) => ({ ...c }))
  pontos.value = (d.pontos || []).map((p) => ({ ...p }))
  simbolos.value = (d.simbolos || []).map((s) => ({ ...s, lineIndex: s.lineIndex, rotation: s.rotation }))
  redesenhar()
  if (fotoDataUrl.value) setTimeout(fitBg, 50)
  desenharGrid()
}

function init() {
  if (!containerRef.value) return
  const size = getSize()
  stage = new Konva.Stage({ container: containerRef.value, width: size.width, height: size.height })
  layerGrid = new Konva.Layer({ listening: false })
  layerBg = new Konva.Layer({ listening: false })
  layerDraw = new Konva.Layer()
  stage.add(layerGrid).add(layerBg).add(layerDraw)
  stage.on('click', onStageClick)
  desenharGrid()
  load(props.modelValue)
  if (fotoDataUrl.value) fitBg()
}

onMounted(() => {
  init()
  const resize = () => {
    if (stage && containerRef.value) {
      const size = getSize()
      stage.width(size.width)
      stage.height(size.height)
      desenharGrid()
      if (fotoDataUrl.value) fitBg()
      layerDraw?.batchDraw()
    }
  }
  window.addEventListener('resize', resize)
  onUnmounted(() => window.removeEventListener('resize', resize))
})

function marcarSobreFoto() {
  inputFotoRef.value?.click()
}

onUnmounted(() => {
  if (stage) stage.destroy()
  stage = null
  layerGrid = null
  layerBg = null
  layerDraw = null
})

watch(() => props.modelValue, load, { deep: true })

defineExpose({ temDesenhoOuMarcacao })
</script>
