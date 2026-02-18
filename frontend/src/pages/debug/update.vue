<template>
  <div class="p-6 space-y-4">
    <h1 class="text-xl font-bold">Debug de Atualização</h1>

    <div class="space-y-1">
      <p><strong>Versão do app (build atual):</strong> {{ appVersion }}</p>
      <p><strong>Ambiente:</strong> {{ ambiente }}</p>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="border rounded-lg p-4">
        <h2 class="font-semibold mb-2">Desktop (Tauri)</h2>
        <p><strong>URL:</strong> https://aplicativo.acasamarcenaria.com.br/updates/tauri/latest.json</p>
        <p><strong>Versão no servidor:</strong> {{ tauri?.version ?? '-' }}</p>
        <p><strong>Tem update?</strong> {{ tauriHasUpdateLabel }}</p>
      </div>

      <div class="border rounded-lg p-4">
        <h2 class="font-semibold mb-2">Android</h2>
        <p><strong>URL:</strong> https://aplicativo.acasamarcenaria.com.br/updates/android/version.json</p>
        <p><strong>Versão no servidor:</strong> {{ android?.version ?? '-' }}</p>
        <p><strong>Tem update?</strong> {{ androidHasUpdateLabel }}</p>
      </div>
    </div>

    <div class="text-xs text-slate-500">
      <p>Use esta tela só para debug. Os dados são lidos diretamente dos JSON do servidor.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?'

const tauri = ref(null)
const android = ref(null)

const ambiente = computed(() => {
  if (typeof window === 'undefined') return 'SSR'
  if (window.__TAURI__ || window.__TAURI_INTERNALS__) return 'Desktop (Tauri)'
  try {
    // Vai ser refinado pelo próprio Capacitor no app real
    return 'Web / Android (Capacitor)'
  } catch {
    return 'Web'
  }
})

function isNewer(server, current) {
  const parse = (v) => String(v || '0').split('.').map((n) => parseInt(n, 10) || 0).slice(0, 3)
  const s = parse(server)
  const c = parse(current)
  for (let i = 0; i < 3; i++) {
    if (s[i] > c[i]) return true
    if (s[i] < c[i]) return false
  }
  return false
}

const tauriHasUpdateLabel = computed(() => {
  if (!tauri.value?.version) return 'não dá para determinar'
  return isNewer(tauri.value.version, appVersion) ? 'SIM' : 'NÃO'
})

const androidHasUpdateLabel = computed(() => {
  if (!android.value?.version) return 'não dá para determinar'
  return isNewer(android.value.version, appVersion) ? 'SIM' : 'NÃO'
})

onMounted(async () => {
  try {
    const [tauriRes, androidRes] = await Promise.allSettled([
      fetch('https://aplicativo.acasamarcenaria.com.br/updates/tauri/latest.json', { cache: 'no-store' }),
      fetch('https://aplicativo.acasamarcenaria.com.br/updates/android/version.json', { cache: 'no-store' }),
    ])

    if (tauriRes.status === 'fulfilled' && tauriRes.value.ok) {
      tauri.value = await tauriRes.value.json()
    }
    if (androidRes.status === 'fulfilled' && androidRes.value.ok) {
      android.value = await androidRes.value.json()
    }
  } catch {
    // debug apenas
  }
})
</script>

