<template>
  <div class="w-screen h-screen bg-slate-100 relative">
    <div class="absolute top-4 left-4 z-10">
      <button
        type="button"
        class="h-10 px-4 rounded-xl border border-slate-200 bg-white/95 text-xs font-black uppercase tracking-widest text-slate-700 shadow-sm"
        @click="voltar"
      >
        Voltar
      </button>
    </div>

    <div
      v-if="loading"
      class="w-full h-full flex items-center justify-center text-[11px] font-black uppercase tracking-widest text-text-soft"
    >
      Carregando PDF...
    </div>

    <div
      v-else-if="erro"
      class="w-full h-full flex items-center justify-center px-6 text-center text-[11px] font-black uppercase tracking-widest text-rose-600"
    >
      {{ erro }}
    </div>
    <iframe
      v-else
      :src="blobUrl"
      class="w-full h-full border-0"
      title="PDF"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArquivosService } from '@/services/index'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'arquivos.ver', layout: 'auth' } })

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id || '').replace(/\D/g, ''))
const nomeArquivo = computed(() => String(route.query?.name || `ARQUIVO_${id.value}`))

const loading = ref(false)
const erro = ref('')
const blobUrl = ref('')

function voltar() {
  const from = String(route.query?.from || '').trim()
  if (from) {
    router.push(from)
    return
  }
  router.back()
}

function inferMimeFromFileName(fileName) {
  const lower = String(fileName || '').trim().toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  return ''
}

function normalizeMime(value, fileName) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw || raw === 'application/octet-stream' || raw === 'binary/octet-stream') {
    return inferMimeFromFileName(fileName)
  }
  return raw
}

async function carregarPdf() {
  if (!id.value) {
    erro.value = 'ID invalido.'
    return
  }

  loading.value = true
  erro.value = ''
  try {
    const res = await ArquivosService.baixarBlob(id.value)
    const contentType = normalizeMime(
      res?.headers?.['content-type'] || route.query?.type || 'application/pdf',
      nomeArquivo.value,
    ) || 'application/pdf'
    const blob = new Blob([res.data], { type: contentType })
    blobUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    console.error(e)
    erro.value = 'Falha ao abrir PDF.'
    notify.error('Falha ao abrir PDF.')
  } finally {
    loading.value = false
  }
}

onMounted(carregarPdf)

onBeforeUnmount(() => {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
})
</script>
