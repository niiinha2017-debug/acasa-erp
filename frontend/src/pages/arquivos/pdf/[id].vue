<template>
  <div class="w-screen h-screen bg-slate-100">
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
import { useRoute } from 'vue-router'
import { ArquivosService } from '@/services/index'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'arquivos.ver', layout: 'auth' } })

const route = useRoute()
const id = computed(() => String(route.params.id || '').replace(/\D/g, ''))

const loading = ref(false)
const erro = ref('')
const blobUrl = ref('')

async function carregarPdf() {
  if (!id.value) {
    erro.value = 'ID invalido.'
    return
  }

  loading.value = true
  erro.value = ''
  try {
    const res = await ArquivosService.baixarBlob(id.value)
    const contentType = String(res?.headers?.['content-type'] || 'application/pdf')
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
