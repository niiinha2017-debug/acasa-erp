<template>
  <div class="h-dvh w-full bg-slate-900 overflow-hidden flex flex-col selection:bg-brand-primary/30">
    
    <header class="h-16 z-50 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl px-4 flex items-center justify-between gap-4">
      
      <div class="flex items-center gap-4 min-w-0">
        <button
          type="button"
          @click="voltar"
          class="h-10 w-10 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-90"
        >
          <i class="pi pi-arrow-left"></i>
        </button>

        <div class="flex items-center gap-3 min-w-0 border-l border-white/10 pl-4">
          <div class="h-10 w-10 rounded-xl bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30 shadow-inner">
            <i :class="fileIcon" class="text-brand-primary text-lg"></i>
          </div>

          <div class="min-w-0">
            <h1 class="text-xs font-black text-white truncate tracking-tight">
              {{ nomeExibicao }}
            </h1>
            <p class="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] truncate mt-0.5">
              {{ mimeQuery || 'Documento Digital' }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
        <template v-if="isImagem">
          <button
            @click="zoomOut"
            class="h-9 w-9 rounded-xl hover:bg-white/10 text-white text-sm font-black transition-colors"
            title="Diminuir"
          >
            <i class="pi pi-minus text-[10px]"></i>
          </button>
          
          <div class="px-2 text-[10px] font-black text-slate-400 w-12 text-center tabular-nums">
            {{ Math.round(zoom * 100) }}%
          </div>

          <button
            @click="zoomIn"
            class="h-9 w-9 rounded-xl hover:bg-white/10 text-white text-sm font-black transition-colors"
            title="Aumentar"
          >
            <i class="pi pi-plus text-[10px]"></i>
          </button>

          <div class="w-px h-4 bg-white/10 mx-1"></div>
        </template>

        <a
          v-if="blobUrl"
          :href="blobUrl"
          :download="downloadName"
          class="h-9 px-5 rounded-xl bg-brand-primary text-white hover:brightness-110 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-primary/20"
        >
          <i class="pi pi-download text-[10px]"></i>
          Download
        </a>
      </div>
    </header>

    <main class="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950">
      
      <div v-if="loading" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-sm">
        <div class="w-12 h-12 border-4 border-white/10 border-t-brand-primary rounded-full animate-spin mb-4"></div>
        <span class="text-[10px] font-black text-white uppercase tracking-[0.3em] animate-pulse">Processando Buffer...</span>
      </div>

      <div v-else-if="erro" class="h-full flex items-center justify-center p-6 text-center">
        <div class="max-w-xs">
          <div class="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <i class="pi pi-exclamation-circle text-2xl"></i>
          </div>
          <h3 class="text-xs font-black text-white uppercase tracking-widest mb-2">Falha na Visualização</h3>
          <p class="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
            {{ erro }}
          </p>
        </div>
      </div>

      <div class="h-full w-full">
        <iframe 
          v-if="isPdf && blobUrl" 
          :src="blobUrl"
          class="w-full h-full border-none"
        />

        <div
          v-else-if="isImagem"
          class="h-full w-full overflow-auto flex items-start justify-center p-12 scrollbar-hide"
        >
          <div class="relative transition-transform duration-300 ease-out" :style="{ transform: `scale(${zoom})` }">
            <img
              v-if="blobUrl"
              :src="blobUrl"
              class="rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white max-w-none"
              alt="Preview"
            />
          </div>
        </div>

        <div v-else class="h-full flex flex-col items-center justify-center text-center p-10">
          <div class="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5">
            <i :class="fileIcon" class="text-4xl text-slate-600"></i>
          </div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 max-w-[200px] leading-relaxed">
            Visualização indisponível para este formato.
          </p>
          <a :href="blobUrl" :download="downloadName" class="mt-6 text-[9px] font-black text-brand-primary uppercase underline tracking-widest">
            Baixar arquivo original
          </a>
        </div>
      </div>
    </main>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'

definePage({ meta: { public: false } })

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const erro = ref('')
const blobUrl = ref('')

const zoom = ref(1)

const id = computed(() => String(route.params.id || '').replace(/\D/g, ''))
const nomeQuery = computed(() => String(route.query.name || 'ARQUIVO').trim())
const mimeQuery = computed(() => String(route.query.type || '').trim())

const nomeExibicao = computed(() => nomeQuery.value || `Arquivo #${id.value}`)
const downloadName = computed(() => {
  const base = nomeQuery.value || `arquivo_${id.value}`
  return base.includes('.') ? base : base // deixa como veio; sem inventar extensão
})

const isPdf = computed(() => {
  const t = mimeQuery.value.toLowerCase()
  return t.includes('pdf')
})

const isImagem = computed(() => {
  const t = mimeQuery.value.toLowerCase()
  return t.startsWith('image/')
})

const backTo = computed(() => String(route.query.backTo || ''))
function zoomIn() {
  zoom.value = Math.min(3, Number((zoom.value + 0.1).toFixed(2)))
}
function zoomOut() {
  zoom.value = Math.max(0.5, Number((zoom.value - 0.1).toFixed(2)))
}


const fileIcon = computed(() => {
  if (isPdf.value) return 'pi pi-file-pdf'
  if (isImagem.value) return 'pi pi-image'
  return 'pi pi-file'
})

function voltar() {
  if (backTo.value) router.push(backTo.value)
  else router.back()
}


async function carregarBlob() {
  const cleanId = id.value
  if (!cleanId) return

  erro.value = ''
  loading.value = true
zoom.value = 1

  // limpa url anterior
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
  blobUrl.value = ''

  try {
    const { data } = await ArquivosService.baixarBlob(cleanId)
    const url = URL.createObjectURL(data)
    blobUrl.value = url
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao carregar arquivo.'
    notify.error(erro.value)
  } finally {
    loading.value = false
  }
}

onMounted(carregarBlob)

watch(() => id.value, async () => {
  await carregarBlob()
})

onBeforeUnmount(() => {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
})
</script>
