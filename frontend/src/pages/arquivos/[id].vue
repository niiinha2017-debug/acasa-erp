<template>
  <PageShell :padded="false" variant="minimal">
    <section class="arquivo-viewer animate-page-in">
      <PageHeader
        :title="nomeArquivo || 'Visualizar Arquivo'"
        subtitle="Visualize, baixe ou compartilhe o documento selecionado"
        icon="pi pi-file"
        variant="minimal"
      >
        <template #actions>
          <div class="arquivo-viewer__header-actions">
            <Button variant="secondary" class="arquivo-viewer__toolbar-btn" @click="voltar">
              <i class="pi pi-arrow-left"></i>
              Voltar
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="arquivo-viewer__content">
        <section class="arquivo-viewer__summary-bar">
          <div class="arquivo-viewer__summary-row">
            <div class="arquivo-viewer__summary-item">
              <span class="arquivo-viewer__meta-label">Formato</span>
              <span class="arquivo-viewer__summary-value">{{ mimeFinal || 'ARQUIVO' }}</span>
            </div>
            <div class="arquivo-viewer__summary-item">
              <span class="arquivo-viewer__meta-label">Visualização</span>
              <span class="arquivo-viewer__summary-value">{{ tipoVisualizacao }}</span>
            </div>
            <div class="arquivo-viewer__summary-item">
              <span class="arquivo-viewer__meta-label">Zoom</span>
              <span class="arquivo-viewer__summary-value">{{ Math.round(zoom * 100) }}%</span>
            </div>
            <div class="arquivo-viewer__summary-item arquivo-viewer__summary-item--actions">
              <div class="arquivo-viewer__zoom-controls">
                <button type="button" class="arquivo-viewer__zoom-btn" @click="zoomOut" :disabled="!isImage">
                  <i class="pi pi-minus"></i>
                </button>
                <button type="button" class="arquivo-viewer__zoom-btn" @click="zoomIn" :disabled="!isImage">
                  <i class="pi pi-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="arquivo-viewer__toolbar">
          <Button variant="secondary" class="arquivo-viewer__toolbar-btn" @click="download" :disabled="!id || downloadEmAndamento">
            <i class="pi pi-download"></i>
            {{ downloadEmAndamento ? 'Baixando...' : 'Download' }}
          </Button>
          <Button variant="primary" class="arquivo-viewer__toolbar-btn" @click="compartilharWhatsApp" :disabled="!id">
            <i class="pi pi-whatsapp"></i>
            Compartilhar pelo WhatsApp
          </Button>
        </section>

        <section class="arquivo-viewer__panel">
          <header class="arquivo-viewer__panel-head">
            <div class="arquivo-viewer__panel-copy">
              <div class="arquivo-viewer__panel-title">{{ nomeArquivo }}</div>
              <div class="arquivo-viewer__panel-subtitle">{{ mimeFinal || 'Arquivo' }}</div>
            </div>
          </header>

          <div class="arquivo-viewer__panel-body">
            <div v-if="loading" class="arquivo-viewer__state">
              Carregando...
            </div>

            <div v-else-if="erro" class="arquivo-viewer__state arquivo-viewer__state--error">
              {{ erro }}
            </div>

            <div v-else class="arquivo-viewer__preview-shell">
              <img
                v-if="isImage"
                :src="blobUrl"
                :style="{ transform: `scale(${zoom})` }"
                class="arquivo-viewer__image"
                alt="arquivo"
              />

              <iframe
                v-else-if="isPdf"
                :src="blobUrl"
                class="arquivo-viewer__pdf"
              />

              <div v-else class="arquivo-viewer__state arquivo-viewer__state--empty">
                Visualização não suportada. Use Download.
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  </PageShell>
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

function inferMimeFromFileName(fileName) {
  const lower = String(fileName || '').trim().toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.bmp')) return 'image/bmp'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
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

async function sniffMimeFromBlob(blob) {
  try {
    const buffer = await blob.slice(0, 16).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    if (bytes.length >= 8) {
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      if (isPng) return 'image/png'
    }
    if (bytes.length >= 3) {
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      if (isJpeg) return 'image/jpeg'
    }
    if (bytes.length >= 6) {
      const header = String.fromCharCode(...bytes.slice(0, 6))
      if (header === 'GIF87a' || header === 'GIF89a') return 'image/gif'
    }
    if (bytes.length >= 4) {
      const isWebpRiff = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      const isWebpTag = bytes.length >= 12 && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
      if (isWebpRiff && isWebpTag) return 'image/webp'
      const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
      if (isPdf) return 'application/pdf'
    }
  } catch {}
  return ''
}

const mimeFinal = computed(() => normalizeMime(mimeDetectado.value || mimeType.value, nomeArquivo.value))

const isImage = computed(() => mimeFinal.value.startsWith('image/'))
const isPdf = computed(() => mimeFinal.value.includes('pdf'))
const tipoVisualizacao = computed(() => {
  if (isImage.value) return 'Imagem'
  if (isPdf.value) return 'PDF'
  return 'Arquivo'
})


const loading = ref(false)
const downloadEmAndamento = ref(false)
const erro = ref('')
const blobUrl = ref('')
const zoom = ref(1)

function zoomIn() { zoom.value = Math.min(3, zoom.value + 0.1) }
function zoomOut() { zoom.value = Math.max(0.3, zoom.value - 0.1) }

function voltar() {
  const from = String(route.query?.from || '').trim()
  if (from) {
    router.push(from)
    return
  }
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
    const rawBlob = res?.data instanceof Blob
      ? res.data
      : new Blob([res.data], { type: 'application/octet-stream' })
    const sniffedMime = await sniffMimeFromBlob(rawBlob)
    const contentType = normalizeMime(
      sniffedMime || res?.headers?.['content-type'] || mimeType.value || 'application/octet-stream',
      nomeArquivo.value,
    ) || 'application/octet-stream'
    mimeDetectado.value = contentType

    const blob = new Blob([rawBlob], { type: contentType })
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
    const rawBlob = res?.data instanceof Blob
      ? res.data
      : new Blob([res.data], { type: 'application/octet-stream' })
    const sniffedMime = await sniffMimeFromBlob(rawBlob)
    const contentType = normalizeMime(
      sniffedMime || res?.headers?.['content-type'] || mimeType.value || 'application/octet-stream',
      nomeArquivo.value,
    ) || 'application/octet-stream'
    const blob = new Blob([rawBlob], { type: contentType })

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

<style scoped>
.arquivo-viewer {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.arquivo-viewer :deep(.ds-shell-card) {
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  backdrop-filter: none;
}

.arquivo-viewer :deep(.ds-header-block) {
  padding-top: 1.25rem;
  padding-bottom: 1rem;
  padding-left: 1rem;
  padding-right: 1rem;
}

.arquivo-viewer :deep(.ds-header-title) {
  font-size: clamp(1.35rem, 1.08rem + 0.45vw, 1.8rem);
  font-weight: 620;
  letter-spacing: -0.03em;
}

.arquivo-viewer :deep(.ds-header-subtitle) {
  max-width: 38rem;
  color: var(--ds-color-text-faint);
  font-size: 0.84rem;
  font-weight: 430;
}

.arquivo-viewer :deep(.ds-header-icon) {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 999px;
  border-color: rgba(214, 224, 234, 0.7);
  background: transparent;
  color: var(--ds-color-primary);
  font-size: 0.92rem;
  box-shadow: none;
}

.dark .arquivo-viewer :deep(.ds-header-icon) {
  border-color: rgba(51, 71, 102, 0.72);
  background: transparent;
}

.arquivo-viewer__header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
}

.arquivo-viewer__content {
  width: 100%;
  margin-inline: auto;
  padding: 0.35rem 1rem 1.75rem;
  display: grid;
  gap: 1rem;
}

.arquivo-viewer__summary-bar {
  padding: 1rem 1.15rem;
  border-top: 1px solid rgba(214, 224, 234, 0.55);
  border-bottom: 1px solid rgba(214, 224, 234, 0.55);
  overflow: hidden;
}

.arquivo-viewer__summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  gap: 1rem;
  align-items: center;
}

.arquivo-viewer__summary-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.arquivo-viewer__summary-item--actions {
  align-items: flex-end;
}

.arquivo-viewer__meta-label {
  display: block;
  margin-bottom: 0.15rem;
  color: var(--ds-color-text-soft);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.arquivo-viewer__summary-value {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 560;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arquivo-viewer__zoom-controls {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.arquivo-viewer__zoom-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border: 1px solid rgba(214, 224, 234, 0.78);
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.74);
  color: var(--ds-color-text-soft);
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.arquivo-viewer__zoom-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  color: var(--ds-color-primary);
  border-color: rgba(44, 111, 163, 0.24);
  background: rgba(44, 111, 163, 0.06);
}

.arquivo-viewer__zoom-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.arquivo-viewer__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.arquivo-viewer__toolbar-btn {
  min-height: 2.55rem;
  padding-inline: 1rem;
  border-radius: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.arquivo-viewer__panel {
  overflow: hidden;
  border-top: 1px solid rgba(214, 224, 234, 0.45);
  border-bottom: 1px solid rgba(214, 224, 234, 0.45);
}

.arquivo-viewer__panel-head {
  background: transparent;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(214, 224, 234, 0.45);
}

.arquivo-viewer__panel-copy {
  min-width: 0;
}

.arquivo-viewer__panel-title {
  color: var(--ds-color-text);
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.01em;
  word-break: break-word;
}

.arquivo-viewer__panel-subtitle {
  margin-top: 0.2rem;
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.arquivo-viewer__panel-body {
  padding: 1rem 0 0;
}

.arquivo-viewer__preview-shell {
  min-height: 60vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: auto;
  border: 1px solid rgba(214, 224, 234, 0.72);
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.45);
}

.arquivo-viewer__image {
  max-width: 100%;
  transform-origin: top center;
}

.arquivo-viewer__pdf {
  width: 100%;
  min-height: 75vh;
  border: 0;
  border-radius: 1rem;
  background: #fff;
}

.arquivo-viewer__state {
  padding: 2.5rem 1.5rem;
  text-align: center;
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.arquivo-viewer__state--error {
  border: 1px solid rgba(244, 63, 94, 0.2);
  border-radius: 1rem;
  background: rgba(255, 241, 242, 0.92);
  color: #be123c;
}

.arquivo-viewer__state--empty {
  width: 100%;
  min-height: 18rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark .arquivo-viewer__summary-bar,
.dark .arquivo-viewer__panel,
.dark .arquivo-viewer__panel-head {
  border-color: rgba(51, 71, 102, 0.55);
}

.dark .arquivo-viewer__zoom-btn {
  background: rgba(18, 30, 49, 0.74);
  border-color: rgba(51, 71, 102, 0.78);
}

.dark .arquivo-viewer__preview-shell {
  border-color: rgba(51, 71, 102, 0.72);
  background: rgba(15, 23, 42, 0.34);
}

.dark .arquivo-viewer__pdf {
  background: rgba(15, 23, 42, 0.6);
}

@media (min-width: 768px) {
  .arquivo-viewer :deep(.ds-header-block) {
    padding-top: 1.6rem;
    padding-bottom: 1.15rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .arquivo-viewer__content {
    padding: 0.35rem 1.5rem 1.9rem;
  }
}

@media (min-width: 1024px) {
  .arquivo-viewer :deep(.ds-header-block) {
    padding-top: 1.85rem;
    padding-bottom: 1.25rem;
    padding-left: 2rem;
    padding-right: 2rem;
  }

  .arquivo-viewer__content {
    padding: 0.35rem 2rem 2rem;
  }
}

@media (max-width: 900px) {
  .arquivo-viewer__summary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .arquivo-viewer__summary-item--actions {
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .arquivo-viewer__content {
    padding-inline: 0.75rem;
    padding-bottom: 1.25rem;
  }

  .arquivo-viewer__summary-bar {
    padding-inline: 0.9rem;
  }

  .arquivo-viewer__summary-row {
    grid-template-columns: 1fr;
  }

  .arquivo-viewer__toolbar {
    justify-content: stretch;
  }

  .arquivo-viewer__toolbar-btn,
  .arquivo-viewer__header-actions :deep(button) {
    width: 100%;
  }

  .arquivo-viewer__zoom-controls {
    width: 100%;
  }

  .arquivo-viewer__zoom-btn {
    flex: 1;
  }

  .arquivo-viewer__preview-shell {
    min-height: 50vh;
  }

  .arquivo-viewer__pdf {
    min-height: 62vh;
  }
}
</style>
  