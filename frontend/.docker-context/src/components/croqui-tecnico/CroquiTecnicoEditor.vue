<template>
  <div class="croqui-tecnico-editor flex h-full w-full overflow-hidden bg-slate-900">
    <!-- Biblioteca de símbolos (lateral) -->
    <div class="w-20 flex-shrink-0 flex flex-col gap-2 p-2 bg-slate-800 border-r border-slate-700">
      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Símbolos</p>
      <button
        v-for="sym in simbolos"
        :key="sym.tipo"
        type="button"
        class="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 cursor-grab active:cursor-grabbing touch-manipulation"
        draggable="true"
        @dragstart="onDragStartSimbolo($event, sym)"
      >
        <i :class="sym.icon" class="text-2xl mb-1" />
        <span class="text-[10px] font-medium leading-tight text-center">{{ sym.label }}</span>
      </button>
    </div>

    <!-- Área do canvas (foto de fundo + desenho) -->
    <div
      class="flex-1 min-w-0 min-h-0 relative"
      @dragover.prevent
      @drop="onContainerDrop"
    >
      <div ref="containerRef" class="w-full h-full" />
      <!-- Sem foto: CTA para tirar/carregar -->
      <div
        v-if="!fotoDataUrl"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-800/95 z-10"
      >
      <p class="text-slate-300 text-lg font-medium">Use a foto da parede como fundo do croqui</p>
      <div class="flex flex-wrap gap-3 justify-center">
        <label class="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer touch-manipulation">
          <i class="pi pi-camera text-4xl" />
          <span class="font-medium">Tirar foto</span>
          <input
            ref="inputFotoRef"
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden"
            @change="onFotoSelect"
          />
        </label>
        <label class="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-slate-600 hover:bg-slate-500 text-white cursor-pointer touch-manipulation">
          <i class="pi pi-upload text-4xl" />
          <span class="font-medium">Carregar imagem</span>
          <input
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFotoSelect"
          />
        </label>
      </div>
      </div>
    </div>
  </div>

  <!-- Modal: valor da cota (mm) -->
  <Teleport to="body">
    <div
      v-if="modalCotaOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      @click.self="fecharModalCota"
    >
      <div class="bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full border border-slate-600">
        <h3 class="text-lg font-semibold text-white mb-2">Cota (mm)</h3>
        <input
          ref="inputCotaRef"
          v-model="cotaMmEdit"
          type="number"
          min="1"
          inputmode="numeric"
          class="w-full rounded-xl border-2 border-slate-600 bg-slate-700 text-white px-4 py-4 text-xl"
          placeholder="Ex: 3155"
          @keyup.enter="aplicarCota"
        />
        <div class="flex gap-2 mt-4">
          <button type="button" class="flex-1 py-3 rounded-xl border border-slate-600 text-slate-200" @click="fecharModalCota">Cancelar</button>
          <button type="button" class="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium" @click="aplicarCota">OK</button>
        </div>
      </div>
    </div>
    <!-- Modal: ponto técnico (altura opcional) -->
    <div
      v-if="modalPontoOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      @click.self="fecharModalPonto"
    >
      <div class="bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full border border-slate-600">
        <h3 class="text-lg font-semibold text-white mb-2">Altura do ponto (mm)</h3>
        <input
          ref="inputPontoRef"
          v-model="pontoAlturaMm"
          type="number"
          min="0"
          inputmode="numeric"
          class="w-full rounded-xl border-2 border-slate-600 bg-slate-700 text-white px-4 py-4 text-xl"
          placeholder="Opcional. Ex: 1200"
          @keyup.enter="aplicarPonto"
        />
        <div class="flex gap-2 mt-4">
          <button type="button" class="flex-1 py-3 rounded-xl border border-slate-600 text-slate-200" @click="fecharModalPonto">Cancelar</button>
          <button type="button" class="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium" @click="aplicarPonto">OK</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Konva from 'konva'

const SCALE_MM_PER_PX = 10

const props = defineProps({
  /** Dados: { backgroundImage, scaleMmPerPx, pontos: [], simbolos: [], cotas: [] } */
  modelValue: { type: Object, default: () => null },
  /** 'ponto' | 'cota' - controlado pela barra flutuante da página */
  modo: { type: String, default: 'ponto' },
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const inputFotoRef = ref(null)
const modoLocal = computed(() => props.modo || 'ponto')

const simbolos = [
  { tipo: 'TOMADA', label: 'Tomada', icon: 'pi pi-bolt' },
  { tipo: 'SIFAO', label: 'Sifão', icon: 'pi pi-circle' },
  { tipo: 'GAS', label: 'Ponto Gás', icon: 'pi pi-fire' },
  { tipo: 'VIGA', label: 'Viga', icon: 'pi pi-box' },
]

let stage = null
let layerBg = null
let layerDraw = null
let fotoDataUrl = ref(null)
let pontos = []
let simbolosPlaced = []
let cotas = []
let cotaStart = null
let pontoPendente = null
let cotaEditando = null
let dragSimboloTipo = null

const modalCotaOpen = ref(false)
const cotaMmEdit = ref('')
const inputCotaRef = ref(null)
const modalPontoOpen = ref(false)
const pontoAlturaMm = ref('')
const inputPontoRef = ref(null)

function getStageSize() {
  if (!containerRef.value) return { width: 800, height: 600 }
  const rect = containerRef.value.getBoundingClientRect()
  return { width: rect.width, height: rect.height }
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

function corSimbolo(tipo) {
  const c = { TOMADA: '#eab308', SIFAO: '#0ea5e9', GAS: '#ef4444', VIGA: '#78716c' }
  return c[tipo] || '#94a3b8'
}

function redesenhar() {
  if (!layerDraw) return
  layerDraw.destroyChildren()

  pontos.forEach((p) => {
    const g = new Konva.Group({ x: p.x, y: p.y, draggable: true, listening: true })
    const circle = new Konva.Circle({ radius: 12, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 })
    const lbl = new Konva.Text({ y: 16, width: 60, text: (p.alturaMm != null ? p.alturaMm + ' mm' : 'Ponto'), fontSize: 11, fill: '#fff', align: 'center', offsetX: 30 })
    g.add(circle)
    g.add(lbl)
    g.on('dragend', () => { p.x = g.x(); p.y = g.y() })
    layerDraw.add(g)
  })

  simbolosPlaced.forEach((s) => {
    const g = new Konva.Group({ x: s.x, y: s.y, draggable: true, listening: true })
    const circle = new Konva.Circle({ radius: 18, fill: corSimbolo(s.tipo), stroke: '#fff', strokeWidth: 2 })
    const lbl = new Konva.Text({ y: 22, width: 56, text: simbolos.find((x) => x.tipo === s.tipo)?.label || s.tipo, fontSize: 9, fill: '#fff', align: 'center', offsetX: 28 })
    g.add(circle)
    g.add(lbl)
    g.on('dragend', () => { s.x = g.x(); s.y = g.y() })
    layerDraw.add(g)
  })

  cotas.forEach((c) => {
    const g = new Konva.Group({ listening: true })
    const line = new Konva.Line({
      points: [c.x1, c.y1, c.x2, c.y2],
      stroke: '#22c55e',
      strokeWidth: 3,
      lineCap: 'round',
    })
    const lenPx = dist(c.x1, c.y1, c.x2, c.y2)
    const cx = (c.x1 + c.x2) / 2
    const cy = (c.y1 + c.y2) / 2
    const text = new Konva.Text({
      x: cx - 35,
      y: cy - 10,
      width: 70,
      text: (c.lengthMm ?? Math.round(lenPx * SCALE_MM_PER_PX)) + ' mm',
      fontSize: 14,
      fontFamily: 'sans-serif',
      fill: '#22c55e',
      align: 'center',
      listening: true,
    })
    text.on('click', (ev) => { ev.cancelBubble = true; abrirModalCota(c) })
    g.add(line)
    g.add(text)
    layerDraw.add(g)
  })

  layerDraw.batchDraw()
}

function onStageClick(e) {
  const pos = stage.getPointerPosition()
  if (!pos) return
  if (modoLocal.value === 'cota') {
    if (!cotaStart) {
      cotaStart = { x: pos.x, y: pos.y }
      return
    }
    const lenPx = dist(cotaStart.x, cotaStart.y, pos.x, pos.y)
    const lengthMm = Math.round(lenPx * SCALE_MM_PER_PX) || 100
    cotas.push({
      id: 'c' + Date.now(),
      x1: cotaStart.x,
      y1: cotaStart.y,
      x2: pos.x,
      y2: pos.y,
      lengthMm,
    })
    cotaStart = null
    redesenhar()
    emitData()
    return
  }
  // modo ponto: clicar na foto adiciona ponto técnico
  pontoPendente = { x: pos.x, y: pos.y }
  pontoAlturaMm.value = ''
  modalPontoOpen.value = true
  setTimeout(() => inputPontoRef.value?.focus(), 100)
}

function onDragStartSimbolo(e, sym) {
  dragSimboloTipo = sym.tipo
  e.dataTransfer.setData('text/plain', sym.tipo)
  e.dataTransfer.effectAllowed = 'copy'
}

function onContainerDrop(e) {
  e.preventDefault()
  const tipo = e.dataTransfer?.getData('text/plain')
  if (!tipo || !simbolos.some((s) => s.tipo === tipo)) return
  if (!containerRef.value || !stage) return
  const rect = containerRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  simbolosPlaced.push({ id: 's' + Date.now(), tipo, x, y })
  dragSimboloTipo = null
  redesenhar()
  emitData()
}

function abrirModalCota(c) {
  cotaEditando = c
  cotaMmEdit.value = String(c.lengthMm ?? '')
  modalCotaOpen.value = true
  setTimeout(() => inputCotaRef.value?.focus(), 100)
}

function fecharModalCota() {
  modalCotaOpen.value = false
  cotaEditando = null
}

function aplicarCota() {
  if (!cotaEditando) return
  const mm = parseInt(cotaMmEdit.value, 10)
  if (!Number.isFinite(mm) || mm < 1) { fecharModalCota(); return }
  const c = cotaEditando
  const lenPx = dist(c.x1, c.y1, c.x2, c.y2)
  const newLenPx = mm / SCALE_MM_PER_PX
  const angle = Math.atan2(c.y2 - c.y1, c.x2 - c.x1)
  c.x2 = c.x1 + newLenPx * Math.cos(angle)
  c.y2 = c.y1 + newLenPx * Math.sin(angle)
  c.lengthMm = mm
  fecharModalCota()
  redesenhar()
  emitData()
}

function fecharModalPonto() {
  modalPontoOpen.value = false
  pontoPendente = null
}

function aplicarPonto() {
  if (!pontoPendente) return
  const altura = parseInt(pontoAlturaMm.value, 10)
  pontos.push({
    id: 'p' + Date.now(),
    x: pontoPendente.x,
    y: pontoPendente.y,
    alturaMm: Number.isFinite(altura) && altura >= 0 ? altura : null,
  })
  fecharModalPonto()
  redesenhar()
  emitData()
}

function onFotoSelect(ev) {
  const file = ev.target?.files?.[0]
  if (!file) return
  ev.target.value = ''
  const reader = new FileReader()
  reader.onload = () => {
    fotoDataUrl.value = reader.result
    emitData()
    setTimeout(() => fitBackgroundImage(), 100)
  }
  reader.readAsDataURL(file)
}

function fitBackgroundImage() {
  if (!layerBg || !fotoDataUrl.value) return
  layerBg.destroyChildren()
  const size = getStageSize()
  const img = new Image()
  img.onload = () => {
    const konvaImg = new Konva.Image({
      image: img,
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      listening: false,
    })
    layerBg.add(konvaImg)
    layerBg.batchDraw()
  }
  img.src = fotoDataUrl.value
}

function emitData() {
  emit('update:modelValue', {
    backgroundImage: fotoDataUrl.value ?? null,
    scaleMmPerPx: SCALE_MM_PER_PX,
    pontos: pontos.map((p) => ({ x: p.x, y: p.y, alturaMm: p.alturaMm })),
    simbolos: simbolosPlaced.map((s) => ({ tipo: s.tipo, x: s.x, y: s.y })),
    cotas: cotas.map((c) => ({ x1: c.x1, y1: c.y1, x2: c.x2, y2: c.y2, lengthMm: c.lengthMm })),
  })
}

function loadData(data) {
  if (!data) return
  fotoDataUrl.value = data.backgroundImage ?? null
  pontos = (data.pontos || []).map((p, i) => ({ ...p, id: 'p' + i }))
  simbolosPlaced = (data.simbolos || []).map((s, i) => ({ ...s, id: 's' + i }))
  cotas = (data.cotas || []).map((c, i) => ({ ...c, id: 'c' + i }))
  redesenhar()
  if (fotoDataUrl.value) setTimeout(() => fitBackgroundImage(), 50)
}

function initStage() {
  if (!containerRef.value) return
  const { width, height } = getStageSize()
  stage = new Konva.Stage({ container: containerRef.value, width, height })
  layerBg = new Konva.Layer()
  layerDraw = new Konva.Layer()
  stage.add(layerBg)
  stage.add(layerDraw)
  stage.on('click', onStageClick)
  loadData(props.modelValue)
  if (fotoDataUrl.value) fitBackgroundImage()
}

onMounted(() => {
  initStage()
  const onResize = () => {
    if (stage && containerRef.value) {
      const { width, height } = getStageSize()
      stage.width(width)
      stage.height(height)
      if (fotoDataUrl.value) fitBackgroundImage()
      layerDraw?.batchDraw()
    }
  }
  window.addEventListener('resize', onResize)
  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
  })
})

onUnmounted(() => {
  if (stage) stage.destroy()
  stage = null
  layerBg = null
  layerDraw = null
})

watch(() => props.modelValue, (v) => loadData(v), { deep: true })
watch(fotoDataUrl, () => { if (stage && fotoDataUrl.value) fitBackgroundImage() })

defineExpose({})
</script>
