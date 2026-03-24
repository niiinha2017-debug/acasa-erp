<template>
  <div
    ref="rootRef"
    class="visualizador-3d relative w-full h-full min-h-[320px] bg-slate-900 rounded-xl overflow-hidden"
  >
    <div ref="containerRef" class="absolute inset-0 w-full h-full" />
    <div
      v-if="!modelUrl && !temExtrudavel"
      class="absolute inset-0 flex flex-col items-center justify-center text-slate-500"
    >
      <i class="pi pi-cube text-4xl mb-2 opacity-50" />
      <span class="text-sm font-medium">Nenhum modelo 3D carregado</span>
      <span class="text-xs mt-1 text-center px-4">Croqui salvo (extrudável) ou arquivo .glb / .gltf / .obj</span>
    </div>
    <div
      v-else-if="loading && !extrudavelAtivo"
      class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/80"
    >
      <i class="pi pi-spin pi-spinner text-3xl mb-2" />
      <span class="text-sm">Carregando modelo...</span>
    </div>
    <div
      v-else-if="error"
      class="absolute inset-0 flex flex-col items-center justify-center text-rose-400 bg-slate-900/90 p-4"
    >
      <i class="pi pi-exclamation-triangle text-2xl mb-2" />
      <span class="text-sm text-center">{{ error }}</span>
    </div>
    <button
      v-if="showFullscreenButton && podeOverlayControles"
      type="button"
      class="absolute top-2 right-2 z-10 pointer-events-auto flex items-center gap-1.5 rounded-lg border border-slate-600/80 bg-slate-800/90 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 shadow-md hover:bg-slate-700/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
      @click="toggleFullscreen"
    >
      <i class="pi text-xs" :class="isFullscreen ? 'pi-window-minimize' : 'pi-window-maximize'" />
      {{ isFullscreen ? 'Sair da tela cheia' : 'Tela cheia' }}
    </button>
    <div
      v-if="podeOverlayControles"
      class="absolute bottom-3 left-3 right-3 flex justify-between items-center pointer-events-none"
    >
      <span class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
        Arraste para rotacionar • Scroll para zoom
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount, defineExpose } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { isTauri } from '@/utils/platform.js'

const props = defineProps({
  /** Exibe o botão de tela cheia (Fullscreen API no container do viewer). */
  showFullscreenButton: { type: Boolean, default: true },
  /** URL do modelo (blob ou API). Suporta .gltf, .glb, .obj */
  modelUrl: { type: String, default: '' },
  /**
   * JSON extrudável (mm): { ambiente: { peDireito, escala }, paredes: [...], pontos: [...] }.
   * Quando presente com paredes, desenha primitivas no lugar (ou além) do arquivo.
   */
  extrudavelJson: { type: Object, default: null },
  /** Incremente para forçar redesenho a partir do mesmo objeto (ex.: após GET no banco). */
  extrudavelRevision: { type: Number, default: 0 },
})

const temExtrudavel = computed(() => {
  const j = props.extrudavelJson
  return !!(j && Array.isArray(j.paredes) && j.paredes.length > 0)
})

const extrudavelAtivo = computed(() => temExtrudavel.value && !props.modelUrl)

const podeOverlayControles = computed(
  () => (props.modelUrl || extrudavelAtivo.value) && !loading.value && !error.value,
)

const rootRef = ref(null)
const containerRef = ref(null)
const isFullscreen = ref(false)
const loading = ref(false)
const error = ref('')

let scene = null
let camera = null
let renderer = null
let controls = null
let mesh = null
let animationId = null

function initScene() {
  if (!containerRef.value) return false
  const width = Math.max(1, containerRef.value.clientWidth)
  const height = Math.max(1, containerRef.value.clientHeight)

  const tauri = isTauri()
  /** No Tauri/WebView2, WebGL com AA + DPR alto pode derrubar o processo inteiro em alguns drivers. */
  const glOpts = {
    antialias: !tauri,
    alpha: false,
    powerPreference: tauri ? 'low-power' : 'high-performance',
    failIfMajorPerformanceCaveat: false,
    stencil: false,
    depth: true,
    preserveDrawingBuffer: true,
  }

  try {
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1e293b)

    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(2, 2, 2)

    renderer = new THREE.WebGLRenderer(glOpts)
    renderer.setSize(width, height)
    renderer.setPixelRatio(tauri ? 1 : Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    if (tauri) {
      renderer.toneMapping = THREE.LinearToneMapping
      renderer.toneMappingExposure = 1
    } else {
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1
    }
    containerRef.value.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 0.65)
    scene.add(ambient)
    const dir = new THREE.DirectionalLight(0xffffff, 0.75)
    dir.position.set(5, 10, 5)
    scene.add(dir)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = true
    controls.minDistance = 0.2
    controls.maxDistance = 120
    controls.maxPolarAngle = Math.PI * 0.95

    return true
  } catch (e) {
    console.error('[Visualizador3D] initScene', e)
    error.value =
      'Não foi possível usar o visualizador 3D neste ambiente (WebGL). Abra no navegador ou atualize o driver de vídeo.'
    scene = null
    camera = null
    renderer = null
    controls = null
    return false
  }
}

/**
 * Ambiente medido a partir do JSON extrudável (mesmo fluxo que MedicaoCanvas → buildExtrudavelJson).
 * Cada parede: BoxGeometry em metros com
 *   width  = comprimento ao longo da parede,
 *   height = pé-direito (Y),
 *   depth  = espessura (Z local, perpendicular ao comprimento após rotação Y).
 * Plano do piso: XZ (Y = 0 no piso); coords do JSON: x_mm → X, y_mm → -Z.
 */
function renderizarAmbiente3D(data) {
  if (!scene || !data?.paredes?.length) {
    clearModel()
    return
  }
  clearModel()
  loading.value = false
  error.value = ''

  const escala = Number(data.ambiente?.escala) > 0 ? Number(data.ambiente.escala) : 1
  const peMm = Number(data.ambiente?.peDireito) > 0 ? Number(data.ambiente.peDireito) : 2600
  const peDireitoM = (peMm * escala) / 1000

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x8b9cbe,
    metalness: 0.06,
    roughness: 0.84,
  })
  const group = new THREE.Group()

  const mmToM = escala / 1000

  for (const w of data.paredes) {
    const sx = Number(w.start?.x ?? 0) * mmToM
    const sz = -Number(w.start?.y ?? 0) * mmToM
    const ex = Number(w.end?.x ?? 0) * mmToM
    const ez = -Number(w.end?.y ?? 0) * mmToM
    const dx = ex - sx
    const dz = ez - sz
    const lenGeo = Math.sqrt(dx * dx + dz * dz)
    const lenM = (Number(w.lengthMm) > 0 ? Number(w.lengthMm) * escala : 0) / 1000
    const comprimentoM = Math.max(lenGeo, lenM)
    if (comprimentoM < 1e-5) continue

    const espessuraM = (Number(w.espessura) > 0 ? Number(w.espessura) : 150) * mmToM

    const theta =
      lenGeo >= 1e-5
        ? Math.atan2(dz, dx)
        : ((Number(w.angleDeg) || 0) * Math.PI) / 180

    let cx
    let cz
    if (lenGeo >= 1e-5) {
      cx = (sx + ex) / 2
      cz = (sz + ez) / 2
    } else {
      const ux = Math.cos(theta)
      const uz = Math.sin(theta)
      cx = sx + ux * (comprimentoM / 2)
      cz = sz + uz * (comprimentoM / 2)
    }

    // Three.BoxGeometry(width, height, depth) → largura=X, altura=Y, profundidade=Z (local)
    const geom = new THREE.BoxGeometry(comprimentoM, peDireitoM, espessuraM)
    const m = new THREE.Mesh(geom, wallMat)
    m.position.set(cx, peDireitoM / 2, cz)
    m.rotation.y = theta
    group.add(m)
  }

  const coresTipo = {
    tomada: 0xfacc15,
    agua: 0x38bdf8,
    gas: 0xf97316,
    viga: 0x64748b,
  }
  const raioEsferaM = Math.max(0.04, peDireitoM * 0.025)
  for (const pt of data.pontos || []) {
    const wall = data.paredes.find((w) => Number(w.id) === Number(pt.paredeId))
    if (!wall) continue
    const sx = Number(wall.start?.x ?? 0) * mmToM
    const sz = -Number(wall.start?.y ?? 0) * mmToM
    const ex = Number(wall.end?.x ?? 0) * mmToM
    const ez = -Number(wall.end?.y ?? 0) * mmToM
    const wx = ex - sx
    const wz = ez - sz
    const L = Math.sqrt(wx * wx + wz * wz)
    if (L < 1e-6) continue
    const dM = (Number(pt.distanciaDaQuina) || 0) * mmToM
    const t = Math.min(1, Math.max(0, dM / L))
    const px = sx + wx * t
    const pz = sz + wz * t
    const altM = (Number(pt.alturaPiso) || 0) * mmToM
    const py = Math.min(Math.max(altM + raioEsferaM, raioEsferaM), peDireitoM - raioEsferaM)
    const tipo = String(pt.tipo || '').toLowerCase()
    const cor = coresTipo[tipo] ?? 0xe879f9
    const mat = new THREE.MeshStandardMaterial({
      color: cor,
      emissive: cor,
      emissiveIntensity: 0.35,
      metalness: 0.2,
      roughness: 0.45,
    })
    const esf = new THREE.Mesh(new THREE.SphereGeometry(raioEsferaM, 22, 18), mat)
    esf.position.set(px, py, pz)
    group.add(esf)
  }

  mesh = group
  scene.add(mesh)
  enquadrarCameraNoAmbienteReal(group)
}

function clearModel() {
  if (mesh && scene) {
    scene.remove(mesh)
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose())
      else mesh.material.dispose()
    }
    if (mesh.traverse) {
      mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose())
          else child.material.dispose()
        }
      })
    }
    mesh = null
  }
}

function centerAndScale(object) {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  const scale = maxDim > 0 ? 2 / maxDim : 1
  object.position.sub(center)
  object.scale.multiplyScalar(scale)
}

/** Mantém escala real (metros); só ajusta câmera — evita “cubo miniatura” no centro. */
function enquadrarCameraNoAmbienteReal(object) {
  if (!camera || !object) return
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.5)
  const dist = maxDim * 1.75

  camera.near = Math.max(0.01, maxDim / 8000)
  camera.far = Math.max(200, maxDim * 80)
  camera.updateProjectionMatrix()

  if (controls) {
    controls.target.copy(center)
  }
  camera.position.set(center.x + dist * 0.55, center.y + dist * 0.42, center.z + dist * 0.55)
  if (controls) controls.update()
}

function loadModel(url) {
  if (!scene || !url) return
  clearModel()
  loading.value = true
  error.value = ''

  const lower = (url || '').toLowerCase().split('?')[0]
  const isObj = lower.endsWith('.obj')
  const isGlb = lower.endsWith('.glb')
  const isGltf = lower.endsWith('.gltf')

  const onLoaded = (object) => {
    try {
      let root = object
      if (object && object.scene) root = object.scene
      if (root && root instanceof THREE.Object3D) {
        mesh = root
        scene.add(mesh)
        centerAndScale(mesh)
        if (controls) controls.target.set(0, 0, 0)
        if (camera) camera.position.set(2, 2, 2)
      }
    } catch (e) {
      console.error('[Visualizador3D] onLoaded', e)
      error.value = 'Erro ao montar o modelo 3D.'
    } finally {
      loading.value = false
    }
  }

  const onError = (e) => {
    error.value = (e && (e.message || e.target?.statusText)) || 'Falha ao carregar o modelo 3D.'
    loading.value = false
  }

  if (isObj) {
    const loader = new OBJLoader()
    loader.load(
      url,
      (obj) => {
        obj.traverse((child) => {
          if (child.isMesh && !child.material) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xcbd5e1,
              metalness: 0.1,
              roughness: 0.8,
            })
          }
        })
        onLoaded(obj)
      },
      undefined,
      onError
    )
  } else if (isGlb || isGltf) {
    const loader = new GLTFLoader()
    loader.load(url, onLoaded, undefined, onError)
  } else {
    const loader = new GLTFLoader()
    loader.load(
      url,
      onLoaded,
      undefined,
      () => {
        const loaderObj = new OBJLoader()
        loaderObj.load(url, (obj) => {
          obj.traverse((child) => {
            if (child.isMesh && !child.material) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xcbd5e1,
                metalness: 0.1,
                roughness: 0.8,
              })
            }
          })
          onLoaded(obj)
        }, undefined, onError)
      }
    )
  }
}

function onResize() {
  if (!containerRef.value || !camera || !renderer) return
  const width = Math.max(1, containerRef.value.clientWidth)
  const height = Math.max(1, containerRef.value.clientHeight)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function syncFullscreenState() {
  const el = rootRef.value
  if (!el) {
    isFullscreen.value = false
    return
  }
  const doc = document
  const fs =
    doc.fullscreenElement === el ||
    doc.webkitFullscreenElement === el ||
    doc.mozFullScreenElement === el ||
    doc.msFullscreenElement === el
  isFullscreen.value = !!fs
}

function requestFs(el) {
  if (!el) return Promise.resolve()
  const req =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen
  if (typeof req === 'function') {
    const p = req.call(el)
    return p && typeof p.then === 'function' ? p : Promise.resolve()
  }
  return Promise.resolve()
}

function exitFsDoc() {
  const doc = document
  const exit =
    doc.exitFullscreen ||
    doc.webkitExitFullscreen ||
    doc.mozCancelFullScreen ||
    doc.msExitFullscreen
  if (typeof exit === 'function') {
    const p = exit.call(doc)
    return p && typeof p.then === 'function' ? p : Promise.resolve()
  }
  return Promise.resolve()
}

function onFullscreenChange() {
  syncFullscreenState()
  onResize()
}

function toggleFullscreen() {
  const el = rootRef.value
  if (!el) return
  syncFullscreenState()
  if (isFullscreen.value) {
    exitFsDoc().catch(() => {})
  } else {
    requestFs(el).catch(() => {})
  }
}

let resizeObserver = null

function handleWindowResize() {
  onResize()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera) return
  try {
    const gl = renderer.getContext()
    if (gl && typeof gl.isContextLost === 'function' && gl.isContextLost()) return
    if (controls) controls.update()
    renderer.render(scene, camera)
  } catch (e) {
    console.error('[Visualizador3D] animate', e)
  }
}

/** PNG data URL (requer preserveDrawingBuffer no WebGL). */
function captureThumbnailPng() {
  if (!renderer || !scene || !camera) return null
  try {
    if (controls) controls.update()
    renderer.render(scene, camera)
    return renderer.domElement.toDataURL('image/png')
  } catch (e) {
    console.error('[Visualizador3D] captureThumbnailPng', e)
    return null
  }
}

defineExpose({ captureThumbnailPng, onResize })

function aplicarFonteVisualizacao() {
  if (!scene) return
  if (props.modelUrl) {
    loadModel(props.modelUrl)
    return
  }
  if (props.extrudavelJson?.paredes?.length) {
    renderizarAmbiente3D(props.extrudavelJson)
    return
  }
  clearModel()
  error.value = ''
  loading.value = false
}

watch(
  () => [props.modelUrl, props.extrudavelJson, props.extrudavelRevision],
  () => aplicarFonteVisualizacao(),
  { deep: true },
)

onMounted(() => {
  const ok = initScene()
  window.addEventListener('resize', handleWindowResize)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('webkitfullscreenchange', onFullscreenChange)
  document.addEventListener('mozfullscreenchange', onFullscreenChange)
  document.addEventListener('MSFullscreenChange', onFullscreenChange)
  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => onResize())
    resizeObserver.observe(containerRef.value)
  }
  animate()
  if (ok) aplicarFonteVisualizacao()
})

onBeforeUnmount(async () => {
  try {
    const el = rootRef.value
    const doc = document
    const fsEl =
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    if (el && fsEl === el) {
      await exitFsDoc()
    }
  } catch (_) {}
  if (resizeObserver) {
    try {
      resizeObserver.disconnect()
    } catch (_) {}
    resizeObserver = null
  }
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
  document.removeEventListener('mozfullscreenchange', onFullscreenChange)
  document.removeEventListener('MSFullscreenChange', onFullscreenChange)
  window.removeEventListener('resize', handleWindowResize)
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  clearModel()
  if (controls) {
    controls.dispose()
    controls = null
  }
  if (containerRef.value && renderer?.domElement) {
    try {
      containerRef.value.removeChild(renderer.domElement)
    } catch (_) {}
  }
  if (renderer) {
    try {
      renderer.dispose()
      renderer.forceContextLoss?.()
    } catch (_) {}
    renderer = null
  }
  camera = null
  scene = null
})
</script>

<style scoped>
/* Em tela cheia o elemento sai do layout do card; força viewport para o filho absolute (canvas) preencher. */
.visualizador-3d:fullscreen {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  border-radius: 0;
}
.visualizador-3d:-webkit-full-screen {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  border-radius: 0;
}
</style>
