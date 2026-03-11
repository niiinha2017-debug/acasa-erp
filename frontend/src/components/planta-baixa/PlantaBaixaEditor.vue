<template>
  <div class="planta-baixa-editor flex gap-0 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden">
    <!-- Barra lateral: ferramentas -->
    <div class="w-44 flex-shrink-0 flex flex-col gap-2 p-3 bg-slate-100 dark:bg-slate-700/80 border-r border-slate-200 dark:border-slate-600">
      <p class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Ferramentas</p>
      <button
        type="button"
        class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition"
        :class="modo === 'parede' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-500'"
        @click="modo = 'parede'"
      >
        <i class="pi pi-minus" />
        Desenhar Parede
      </button>
      <button
        type="button"
        class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition"
        :class="modo === 'ponto' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-500'"
        @click="modo = 'ponto'"
      >
        <i class="pi pi-map-marker" />
        Marcar Ponto Técnico
      </button>
      <button
        type="button"
        class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition"
        :class="modo === 'texto' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-500'"
        @click="modo = 'texto'"
      >
        <i class="pi pi-align-left" />
        Adicionar Texto
      </button>

      <!-- Paleta de ícones técnicos (arrastar para o canvas) -->
      <div v-if="modo === 'ponto'" class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Arraste para a planta</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="ico in iconesTecnicos"
            :key="ico.tipo"
            type="button"
            class="flex flex-col items-center justify-center p-2 rounded-lg bg-white dark:bg-slate-600 border-2 border-slate-200 dark:border-slate-500 hover:border-blue-500 text-slate-700 dark:text-slate-200 cursor-grab active:cursor-grabbing"
            draggable="true"
            @dragstart="(e) => onDragStartIcon(e, ico)"
          >
            <i :class="ico.icon" class="text-xl mb-0.5" />
            <span class="text-[10px] font-medium">{{ ico.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Área do canvas (80% da tela) - dragover/drop para ícones da paleta -->
    <div
      ref="containerRef"
      class="flex-1 min-h-0 bg-slate-50 dark:bg-slate-900"
      style="height: 80vh"
      @dragover.prevent
      @drop="onContainerDrop"
    />
  </div>

  <!-- Modal: editar medida da parede (mm) -->
  <Teleport to="body">
    <div
      v-if="modalMedidaOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      @click.self="fecharModalMedida"
    >
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Medida da parede (mm)</h3>
        <input
          ref="inputMedidaRef"
          v-model="medidaEditMm"
          type="number"
          min="1"
          class="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-3 text-lg"
          placeholder="Ex: 3155"
          @keyup.enter="aplicarMedidaParede"
        />
        <div class="flex gap-2 mt-4">
          <button type="button" class="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200" @click="fecharModalMedida">Cancelar</button>
          <button type="button" class="flex-1 py-2 rounded-xl bg-blue-600 text-white font-medium" @click="aplicarMedidaParede">Aplicar</button>
        </div>
      </div>
    </div>
    <!-- Modal: altura do ponto técnico -->
    <div
      v-if="modalAlturaPontoOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      @click.self="fecharModalAlturaPonto"
    >
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Altura do ponto (mm)</h3>
        <input
          ref="inputAlturaRef"
          v-model="alturaPontoMm"
          type="number"
          min="0"
          class="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-3 text-lg"
          placeholder="Ex: 1200"
          @keyup.enter="aplicarAlturaPonto"
        />
        <div class="flex gap-2 mt-4">
          <button type="button" class="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200" @click="fecharModalAlturaPonto">Cancelar</button>
          <button type="button" class="flex-1 py-2 rounded-xl bg-blue-600 text-white font-medium" @click="aplicarAlturaPonto">OK</button>
        </div>
      </div>
    </div>
    <!-- Modal: texto -->
    <div
      v-if="modalTextoOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      @click.self="fecharModalTexto"
    >
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Texto</h3>
        <input
          ref="inputTextoRef"
          v-model="textoConteudo"
          type="text"
          class="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-3"
          placeholder="Digite o texto"
          @keyup.enter="aplicarTexto"
        />
        <div class="flex gap-2 mt-4">
          <button type="button" class="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200" @click="fecharModalTexto">Cancelar</button>
          <button type="button" class="flex-1 py-2 rounded-xl bg-blue-600 text-white font-medium" @click="aplicarTexto">OK</button>
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
  /** Dados iniciais: { walls: [], technicalPoints: [], texts: [] } */
  modelValue: { type: Object, default: () => null },
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const modo = ref('parede')

let stage = null
let layer = null
let wallStart = null
let walls = []
let technicalPoints = []
let texts = []
let paredeEditando = null
let pontoPendente = null
let textoPosPendente = null
let dragIconType = null

const iconesTecnicos = [
  { tipo: 'TOMADA', label: 'Tomada', icon: 'pi pi-bolt' },
  { tipo: 'AGUA', label: 'Água', icon: 'pi pi-circle' },
  { tipo: 'GAS', label: 'Gás', icon: 'pi pi-fire' },
  { tipo: 'AR', label: 'Ar', icon: 'pi pi-snowflake' },
]

const modalMedidaOpen = ref(false)
const medidaEditMm = ref('')
const inputMedidaRef = ref(null)
const modalAlturaPontoOpen = ref(false)
const alturaPontoMm = ref('')
const inputAlturaRef = ref(null)
const modalTextoOpen = ref(false)
const textoConteudo = ref('')
const inputTextoRef = ref(null)

function getStageSize() {
  if (!containerRef.value) return { width: 800, height: 600 }
  const rect = containerRef.value.getBoundingClientRect()
  return { width: rect.width, height: rect.height }
}

function distancia(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

function redesenhar() {
  if (!layer) return
  layer.destroyChildren()
  walls.forEach((w) => {
    const g = new Konva.Group({ name: 'wall', id: w.id })
    const line = new Konva.Line({
      points: [w.x1, w.y1, w.x2, w.y2],
      stroke: '#1e293b',
      strokeWidth: 4,
      lineCap: 'round',
      listening: true,
    })
    const lenPx = distancia(w.x1, w.y1, w.x2, w.y2)
    const cx = (w.x1 + w.x2) / 2
    const cy = (w.y1 + w.y2) / 2
    const label = new Konva.Text({
      x: cx - 30,
      y: cy - 10,
      width: 60,
      text: (w.lengthMm / 1000).toFixed(2) + ' m',
      fontSize: 14,
      fontFamily: 'sans-serif',
      fill: '#0f172a',
      align: 'center',
      listening: true,
    })
    label.on('click', () => abrirModalMedida(w))
    g.add(line)
    g.add(label)
    layer.add(g)
  })
  technicalPoints.forEach((p) => {
    const g = new Konva.Group({ x: p.x, y: p.y, draggable: true, name: 'point', id: p.id })
    const circle = new Konva.Circle({ radius: 14, fill: corPonto(p.tipo), stroke: '#0f172a', strokeWidth: 2 })
    const lbl = new Konva.Text({ y: 22, width: 50, text: p.tipo, fontSize: 10, fontFamily: 'sans-serif', fill: '#0f172a', align: 'center', offsetX: 25 })
    g.add(circle)
    g.add(lbl)
    g.on('dragend', () => { p.x = g.x(); p.y = g.y() })
    layer.add(g)
  })
  texts.forEach((t) => {
    const text = new Konva.Text({
      x: t.x,
      y: t.y,
      text: t.content,
      fontSize: 16,
      fontFamily: 'sans-serif',
      fill: '#0f172a',
      listening: true,
      draggable: true,
    })
    text.on('dragend', () => { t.x = text.x(); t.y = text.y() })
    layer.add(text)
  })
  layer.batchDraw()
}

function corPonto(tipo) {
  const cores = { TOMADA: '#eab308', AGUA: '#0ea5e9', GAS: '#ef4444', AR: '#22c55e' }
  return cores[tipo] || '#94a3b8'
}

function onStageClick(e) {
  const pos = stage.getPointerPosition()
  if (!pos) return
  if (modo.value === 'parede') {
    if (!wallStart) {
      wallStart = { x: pos.x, y: pos.y }
      return
    }
    const lenPx = distancia(wallStart.x, wallStart.y, pos.x, pos.y)
    const lengthMm = Math.round(lenPx * SCALE_MM_PER_PX) || 1000
    walls.push({
      id: 'w' + Date.now(),
      x1: wallStart.x,
      y1: wallStart.y,
      x2: pos.x,
      y2: pos.y,
      lengthMm,
    })
    wallStart = null
    redesenhar()
    emitData()
  } else if (modo.value === 'texto') {
    textoPosPendente = { x: pos.x, y: pos.y }
    textoConteudo.value = ''
    modalTextoOpen.value = true
    setTimeout(() => inputTextoRef.value?.focus(), 100)
  }
}

function onDragStartIcon(e, ico) {
  dragIconType = ico.tipo
  e.dataTransfer.setData('text/plain', ico.tipo)
  e.dataTransfer.effectAllowed = 'copy'
}

function abrirModalMedida(w) {
  paredeEditando = w
  medidaEditMm.value = String(w.lengthMm)
  modalMedidaOpen.value = true
  setTimeout(() => inputMedidaRef.value?.focus(), 100)
}

function fecharModalMedida() {
  modalMedidaOpen.value = false
  paredeEditando = null
}

function aplicarMedidaParede() {
  if (!paredeEditando) return
  const mm = parseInt(medidaEditMm.value, 10)
  if (!Number.isFinite(mm) || mm < 1) return
  const w = paredeEditando
  const lenPx = distancia(w.x1, w.y1, w.x2, w.y2)
  const newLenPx = mm / SCALE_MM_PER_PX
  const angle = Math.atan2(w.y2 - w.y1, w.x2 - w.x1)
  w.x2 = w.x1 + newLenPx * Math.cos(angle)
  w.y2 = w.y1 + newLenPx * Math.sin(angle)
  w.lengthMm = mm
  fecharModalMedida()
  redesenhar()
  emitData()
}

function fecharModalAlturaPonto() {
  modalAlturaPontoOpen.value = false
  pontoPendente = null
}

function aplicarAlturaPonto() {
  if (!pontoPendente) return
  const altura = parseInt(alturaPontoMm.value, 10)
  if (!Number.isFinite(altura) || altura < 0) {
    pontoPendente.alturaMm = null
  } else {
    pontoPendente.alturaMm = altura
  }
  technicalPoints.push({
    id: 'p' + Date.now(),
    tipo: pontoPendente.tipo,
    x: pontoPendente.x,
    y: pontoPendente.y,
    alturaMm: pontoPendente.alturaMm ?? null,
  })
  fecharModalAlturaPonto()
  redesenhar()
  emitData()
}

function fecharModalTexto() {
  modalTextoOpen.value = false
  textoPosPendente = null
}

function aplicarTexto() {
  if (!textoPosPendente) return
  const content = (textoConteudo.value || '').trim()
  if (content) {
    texts.push({
      id: 't' + Date.now(),
      x: textoPosPendente.x,
      y: textoPosPendente.y,
      content,
    })
    redesenhar()
    emitData()
  }
  fecharModalTexto()
}

function emitData() {
  emit('update:modelValue', {
    walls: walls.map((w) => ({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, lengthMm: w.lengthMm })),
    technicalPoints: technicalPoints.map((p) => ({ tipo: p.tipo, x: p.x, y: p.y, alturaMm: p.alturaMm })),
    texts: texts.map((t) => ({ x: t.x, y: t.y, content: t.content })),
  })
}

function loadData(data) {
  if (!data) return
  walls = (data.walls || []).map((w, i) => ({ ...w, id: 'w' + i }))
  technicalPoints = (data.technicalPoints || []).map((p, i) => ({ ...p, id: 'p' + i }))
  texts = (data.texts || []).map((t, i) => ({ ...t, id: 't' + i }))
  redesenhar()
}

function initStage() {
  if (!containerRef.value) return
  const { width, height } = getStageSize()
  stage = new Konva.Stage({
    container: containerRef.value,
    width,
    height,
  })
  layer = new Konva.Layer()
  stage.add(layer)
  stage.on('click', onStageClick)
  loadData(props.modelValue)
}

function onContainerDrop(e) {
  e.preventDefault()
  if (modo.value !== 'ponto') return
  const tipo = e.dataTransfer?.getData('text/plain')
  if (!tipo || !iconesTecnicos.some((i) => i.tipo === tipo)) return
  if (!containerRef.value || !stage) return
  const rect = containerRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  pontoPendente = { tipo, x, y }
  dragIconType = null
  alturaPontoMm.value = ''
  modalAlturaPontoOpen.value = true
  setTimeout(() => inputAlturaRef.value?.focus(), 100)
}

onMounted(() => {
  initStage()
  window.addEventListener('resize', () => {
    if (stage && containerRef.value) {
      const { width, height } = getStageSize()
      stage.width(width)
      stage.height(height)
      stage.batchDraw()
    }
  })
})

onUnmounted(() => {
  if (stage) stage.destroy()
  stage = null
  layer = null
})

watch(() => props.modelValue, (v) => loadData(v), { deep: true })
</script>
