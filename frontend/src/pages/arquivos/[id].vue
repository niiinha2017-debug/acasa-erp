<template>
  <div class="w-full min-h-[70vh] animate-page-in">
    <div class="w-full max-w-[1200px] mx-auto p-4 space-y-3">
      <div class="flex items-center justify-between gap-3">
        <Button variant="secondary" size="md" class="!h-10" @click="voltar">
          <i class="pi pi-arrow-left mr-2 text-xs"></i> Voltar
        </Button>

        <div class="flex items-center gap-2">
          <Button variant="secondary" size="md" class="!h-10" @click="zoomOut">-</Button>
          <div class="px-3 h-10 flex items-center rounded-xl border border-slate-200 text-xs font-black">
            {{ Math.round(zoom * 100) }}%
          </div>
          <Button variant="secondary" size="md" class="!h-10" @click="zoomIn">+</Button>

          <Button variant="primary" size="md" class="!h-10" @click="download" :disabled="!blobUrl">
            <i class="pi pi-download mr-2 text-xs"></i> Download
          </Button>
        </div>
      </div>

      <Card>
        <div class="p-4 border-b border-slate-100">
          <div class="text-sm font-black text-slate-800 truncate">{{ nomeArquivo }}</div>
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {{ mimeFinal || 'ARQUIVO' }}
          </div>
        </div>

        <div class="p-4 overflow-auto">
          <div v-if="loading" class="p-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
            Carregando...
          </div>

          <div v-else-if="erro" class="p-6 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest">
            {{ erro }}
          </div>

          <div v-else class="flex justify-center">
            <img
              v-if="isImage"
              :src="blobUrl"
              :style="{ transform: `scale(${zoom})` }"
              class="origin-top"
              alt="arquivo"
            />

            <iframe
              v-else-if="isPdf"
              :src="blobUrl"
              class="w-full"
              style="height: 75vh;"
            />

            <div v-else class="p-10 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Visualização não suportada. Use Download.
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArquivosService } from '@/services/index'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'arquivos.ver' } })

const route = useRoute()
const router = useRouter()
const mimeDetectado = ref('')


const id = computed(() => String(route.params.id || '').replace(/\D/g, ''))

const nomeArquivo = computed(() => String(route.query.name || `ARQUIVO_${id.value}`))
const mimeType = computed(() => String(route.query.type || ''))

const mimeFinal = computed(() => (mimeDetectado.value || mimeType.value || '').toLowerCase())

const isImage = computed(() => mimeFinal.value.startsWith('image/'))
const isPdf = computed(() => mimeFinal.value.includes('pdf'))


const loading = ref(false)
const erro = ref('')
const blobUrl = ref('')
const zoom = ref(1)

function zoomIn() { zoom.value = Math.min(3, zoom.value + 0.1) }
function zoomOut() { zoom.value = Math.max(0.3, zoom.value - 0.1) }

function voltar() {
  router.back()
}

async function carregarBlob() {
  if (!id.value) {
    erro.value = 'ID inválido.'
    return
  }

  loading.value = true
  erro.value = ''
  try {
    const res = await ArquivosService.baixarBlob(id.value)
const contentType = String(res?.headers?.['content-type'] || mimeType.value || 'application/octet-stream')
mimeDetectado.value = contentType

    const blob = new Blob([res.data], { type: contentType })
    blobUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    console.error(e)
    erro.value = 'Falha ao abrir arquivo.'
    notify.error('Falha ao abrir arquivo.')
  } finally {
    loading.value = false
  }
}

function download() {
  if (!blobUrl.value) return
  const a = document.createElement('a')
  a.href = blobUrl.value
  a.download = nomeArquivo.value || 'arquivo'
  a.click()
}

onMounted(carregarBlob)

onBeforeUnmount(() => {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
})
</script>
  