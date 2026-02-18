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

    <div class="space-y-2">
      <h2 class="font-semibold">Log em tempo real (Tauri / Android)</h2>
      <div class="border rounded-lg p-2 max-h-80 overflow-y-auto text-xs font-mono bg-slate-950/90 text-slate-100">
        <div
          v-if="log.length === 0"
          class="text-slate-400 italic"
        >
          Nenhum evento de atualização registrado ainda.
        </div>
        <div
          v-for="entry in log"
          :key="entry.id"
          class="border-b border-slate-800 last:border-0 py-1.5"
        >
          <div class="flex justify-between gap-2">
            <span class="text-[10px] text-slate-400">{{ entry.ts }}</span>
            <span class="text-[10px] text-emerald-300">{{ entry.source }}</span>
          </div>
          <div class="text-[11px] whitespace-pre-wrap">
            {{ entry.message }}
          </div>
          <pre
            v-if="entry.details"
            class="mt-1 text-[10px] whitespace-pre-wrap text-slate-400"
          >{{ entry.details }}</pre>
        </div>
      </div>
      <p class="text-xs text-slate-500">
        Esta tela captura mensagens internas do updater (Tauri e Android) para ajudar a entender por que o app não está se atualizando.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { debugLog } from '@/services/debug-log'

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

const log = debugLog

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

