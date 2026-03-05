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

          <Button variant="secondary" size="md" class="!h-10" @click="download" :disabled="!id || downloadEmAndamento">
            <i class="pi pi-download mr-2 text-xs"></i> {{ downloadEmAndamento ? 'Baixando...' : 'Download' }}
          </Button>
          <Button variant="primary" size="md" class="!h-10" @click="compartilharWhatsApp" :disabled="!id">
            <i class="pi pi-whatsapp mr-2 text-xs"></i> Compartilhar pelo WhatsApp
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

const contratoId = computed(() => {
  const raw = route.query?.contratoId
  const n = Number(String(raw || '').replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
})

const nomeArquivo = computed(() => String(route.query.name || `ARQUIVO_${id.value}`))
const mimeType = computed(() => String(route.query.type || ''))

const mimeFinal = computed(() => (mimeDetectado.value || mimeType.value || '').toLowerCase())

const isImage = computed(() => mimeFinal.value.startsWith('image/'))
const isPdf = computed(() => mimeFinal.value.includes('pdf'))


const loading = ref(false)
const downloadEmAndamento = ref(false)
const erro = ref('')
const blobUrl = ref('')
const zoom = ref(1)

function zoomIn() { zoom.value = Math.min(3, zoom.value + 0.1) }
function zoomOut() { zoom.value = Math.max(0.3, zoom.value - 0.1) }

function voltar() {
  router.back()
}

async function compartilharWhatsApp() {
  if (!id.value) return

  // Se for PDF de contrato, envia o arquivo PDF (não o link)
  if (contratoId.value && isPdf.value) {
    try {
      const res = await ArquivosService.baixarBlob(id.value)
      const contentType = String(res?.headers?.['content-type'] || 'application/pdf')
      const blob = new Blob([res.data], { type: contentType })
      const nome = (nomeArquivo.value || 'contrato').replace(/\.[^.]+$/i, '') + '.pdf'
      const file = new File([blob], nome, { type: contentType })

      // Tenta compartilhar o arquivo via Web Share API (permite anexar o PDF no WhatsApp)
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Contrato',
          text: 'Segue o PDF do contrato.',
          files: [file],
        })
        notify.success('Compartilhe o PDF pelo app escolhido (ex.: WhatsApp).')
        return
      }

      // Fallback: baixa o PDF e orienta a enviar manualmente
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nome
      a.rel = 'noopener noreferrer'
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      notify.success('PDF baixado. Envie o arquivo pelo WhatsApp anexando-o na conversa.')
    } catch (e) {
      if (e?.name === 'AbortError') return
      console.warn('[Compartilhar contrato]', e)
      notify.error('Não foi possível compartilhar o PDF do contrato.')
    }
    return
  }

  const nome = nomeArquivo.value || 'arquivo'
  const texto = `Segue o documento: ${nome}.`
  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
  await abrirWhatsAppUrl(url)
}

async function abrirWhatsAppUrl(url) {
  const isTauri = typeof window !== 'undefined' && (!!window.__TAURI__ || !!window.__TAURI_INTERNALS__)
  if (isTauri) {
    try {
      // Tauri 2: openUrl(url) abre no app padrão (navegador/WhatsApp)
      const tauri = window.__TAURI__ ?? window.__TAURI_INTERNALS__
      if (typeof tauri?.opener?.openUrl === 'function') {
        await tauri.opener.openUrl(url)
        return
      }
      const openerMod = await import('@tauri-apps/plugin-opener').catch(() => null)
      const openUrlFn = openerMod?.openUrl ?? openerMod?.default?.openUrl
      if (typeof openUrlFn === 'function') {
        await openUrlFn(url)
        return
      }
      if (tauri?.opener?.open) {
        await tauri.opener.open(url)
        return
      }
      if (tauri?.shell?.open) {
        await tauri.shell.open(url)
        return
      }
    } catch (e) {
      console.warn('[WhatsApp Tauri]', e)
    }
    // Fallback Tauri: abrir via link no próprio webview (pode abrir app se o SO permitir)
    try {
      const a = document.createElement('a')
      a.href = url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return
    } catch (_) {}
    notify.error('Não foi possível abrir o WhatsApp. Tente copiar o link manualmente.')
    return
  }

  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.getPlatform() === 'android') {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
      return
    }
  } catch (_) {}
  try {
    const w = window.open(url, '_blank', 'noopener,noreferrer')
    if (w) return
  } catch (_) {}
  try {
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (_) {
    notify.error('Não foi possível abrir o WhatsApp.')
  }
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

async function download() {
  if (!id.value) return
  const nome = nomeArquivo.value || 'arquivo'
  const nomeComExtensao = nome.includes('.') ? nome : `${nome}.pdf`
  downloadEmAndamento.value = true
  try {
    const res = await ArquivosService.baixarBlob(id.value)
    const contentType = String(res?.headers?.['content-type'] || mimeType.value || 'application/octet-stream')
    const blob = new Blob([res.data], { type: contentType })

    // Desktop (Tauri): showSaveFilePicker quando disponível.
    const canUseSavePicker = typeof window !== 'undefined' && 'showSaveFilePicker' in window
    if (canUseSavePicker) {
      try {
        const isPdf = (contentType || '').toLowerCase().includes('pdf')
        const opts = { suggestedName: nomeComExtensao }
        if (isPdf) opts.types = [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }]
        else if ((contentType || '').toLowerCase().startsWith('image/')) opts.types = [{ description: 'Imagem', accept: { [contentType]: ['.png', '.jpg', '.jpeg', '.gif', '.webp'] } }]
        const handle = await window.showSaveFilePicker(opts)
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
        notify.success('Arquivo salvo.')
        downloadEmAndamento.value = false
        return
      } catch (pickerErr) {
        if (pickerErr.name === 'AbortError') {
          downloadEmAndamento.value = false
          return
        }
      }
    }

    // Fallback: link com download (navegador web).
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nomeComExtensao
    a.rel = 'noopener noreferrer'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify.success('Download iniciado.')
  } catch (e) {
    console.error(e)
    notify.error('Falha ao baixar arquivo.')
  } finally {
    downloadEmAndamento.value = false
  }
}

onMounted(carregarBlob)

onBeforeUnmount(() => {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
})
</script>
  