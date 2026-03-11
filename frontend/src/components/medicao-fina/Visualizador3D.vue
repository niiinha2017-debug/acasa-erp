<template>
  <div class="visualizador-3d relative w-full h-full min-h-[320px] bg-slate-900 rounded-xl overflow-hidden">
    <div ref="containerRef" class="absolute inset-0 w-full h-full" />
    <div
      v-if="!modelUrl"
      class="absolute inset-0 flex flex-col items-center justify-center text-slate-500"
    >
      <i class="pi pi-cube text-4xl mb-2 opacity-50" />
      <span class="text-sm font-medium">Nenhum modelo 3D carregado</span>
      <span class="text-xs mt-1">Exporte .obj ou .gltf do Promob e faça o upload</span>
    </div>
    <div
      v-else-if="loading"
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
    <div
      v-if="modelUrl && !loading && !error"
      class="absolute bottom-3 left-3 right-3 flex justify-between items-center pointer-events-none"
    >
      <span class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
        Arraste para rotacionar • Scroll para zoom
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

const props = defineProps({
  /** URL do modelo (blob ou API). Suporta .gltf, .glb, .obj */
  modelUrl: { type: String, default: '' },
})

const containerRef = ref(null)
const loading = ref(false)
const error = ref('')

let scene = null
let camera = null
let renderer = null
let controls = null
let mesh = null
let animationId = null

function initScene() {
  if (!containerRef.value) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1e293b)

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
  camera.position.set(2, 2, 2)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  containerRef.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 0.8)
  dir.position.set(5, 10, 5)
  scene.add(dir)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.screenSpacePanning = true
  controls.minDistance = 0.5
  controls.maxDistance = 50

  const grid = new THREE.GridHelper(4, 20, 0x334155, 0x475569)
  grid.position.y = -0.01
  scene.add(grid)
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
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  const scale = maxDim > 0 ? 2 / maxDim : 1
  object.position.sub(center)
  object.scale.multiplyScalar(scale)
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
    let root = object
    if (object && object.scene) root = object.scene
    if (root && root instanceof THREE.Object3D) {
      mesh = root
      scene.add(mesh)
      centerAndScale(mesh)
      if (controls) controls.target.set(0, 0, 0)
      if (camera) camera.position.set(2, 2, 2)
    }
    loading.value = false
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
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (controls) controls.update()
  if (renderer && scene && camera) renderer.render(scene, camera)
}

watch(
  () => props.modelUrl,
  (url) => {
    if (url) loadModel(url)
    else {
      clearModel()
      error.value = ''
      loading.value = false
    }
  },
  { immediate: true }
)

onMounted(() => {
  initScene()
  window.addEventListener('resize', onResize)
  animate()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (animationId) cancelAnimationFrame(animationId)
  if (containerRef.value && renderer?.domElement) {
    try {
      containerRef.value.removeChild(renderer.domElement)
    } catch (_) {}
  }
  clearModel()
  controls = null
  renderer = null
  camera = null
  scene = null
})
</script>
