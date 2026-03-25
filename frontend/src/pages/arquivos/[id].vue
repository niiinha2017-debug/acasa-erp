<template>
  <PageShell :padded="false" variant="minimal">
    <div class="av-wrap">

      <!-- Topbar fixa -->
      <div class="av-topbar">
        <div class="av-topbar__left">
          <button class="av-btn av-btn--ghost" @click="voltar">
            <i class="pi pi-arrow-left"></i> Voltar
          </button>
          <div class="av-title">
            <span class="av-title__name">{{ nomeArquivo }}</span>
            <span class="av-title__type">{{ tipoVisualizacao }}</span>
          </div>
        </div>
        <div class="av-topbar__right">
          <template v-if="isImage">
            <button class="av-btn av-btn--ghost" @click="zoomOut" :disabled="zoom <= 0.3">
              <i class="pi pi-minus"></i>
            </button>
            <span class="av-zoom-label">{{ Math.round(zoom * 100) }}%</span>
            <button class="av-btn av-btn--ghost" @click="zoomIn" :disabled="zoom >= 3">
              <i class="pi pi-plus"></i>
            </button>
          </template>
          <button class="av-btn av-btn--secondary" @click="download" :disabled="!id || downloadEmAndamento">
            <i class="pi pi-download"></i>
            {{ downloadEmAndamento ? 'Baixando...' : 'Download' }}
          </button>
          <button class="av-btn av-btn--primary" @click="compartilharWhatsApp" :disabled="!id">
            <i class="pi pi-whatsapp"></i> WhatsApp
          </button>
        </div>
      </div>

      <!-- Área de visualização -->
      <div class="av-body">
        <div v-if="loading" class="av-state">
          <i class="pi pi-spin pi-spinner" style="font-size:2rem;color:#94a3b8"></i>
          <span>Carregando...</span>
        </div>

        <div v-else-if="erro" class="av-state av-state--error">
          <i class="pi pi-exclamation-triangle"></i> {{ erro }}
        </div>

        <template v-else>
          <!-- Imagem -->
          <div v-if="isImage" class="av-image-wrap" :class="{ 'av-image-wrap--zoomed': zoom > 1 }">
            <img
              :src="blobUrl"
              :style="zoom > 1 ? { transform: `scale(${zoom})`, transformOrigin: 'top center' } : {}"
              class="av-image"
              alt="arquivo"
            />
          </div>

          <!-- PDF -->
          <iframe
            v-else-if="isPdf"
            :src="blobUrl"
            class="av-iframe"
          />

          <!-- DOCX renderizado direto no DOM -->
          <div
            v-else-if="isDocx"
            class="av-docx"
            v-html="docxHtml || '<p style=\'color:#94a3b8;padding:2rem\'>Carregando documento...</p>'"
          />

          <!-- Não suportado -->
          <div v-else class="av-state">
            <i class="pi pi-file" style="font-size:2rem;color:#94a3b8"></i>
            <span>Visualização não suportada. Use o Download.</span>
          </div>
        </template>
      </div>

    </div>
  </PageShell>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArquivosService } from '@/services/index'
import { getApiBaseUrl } from '@/services/api'
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
const isDocx = computed(() => {
  const m = mimeFinal.value
  const n = nomeArquivo.value.toLowerCase()
  return m.includes('wordprocessingml') || m.includes('msword') || n.endsWith('.docx') || n.endsWith('.doc')
})
const tipoVisualizacao = computed(() => {
  if (isImage.value) return 'Imagem'
  if (isPdf.value) return 'PDF'
  if (isDocx.value) return 'DOCX'
  return 'Arquivo'
})


const loading = ref(false)
const downloadEmAndamento = ref(false)
const erro = ref('')
const blobUrl = ref('')
const docxHtml = ref('')
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

    // Se for DOCX, busca o HTML autenticado e injeta direto no DOM
    if (isDocx.value) {
      try {
        const htmlRes = await ArquivosService.htmlDocx(id.value)
        // Extrai só o conteúdo do <body> para injetar no div
        const raw = String(htmlRes.data || '')
        const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i)
        docxHtml.value = bodyMatch ? bodyMatch[1] : raw
      } catch (e) {
        console.warn('Falha ao carregar DOCX:', e)
      }
    }
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
    const isTauri = typeof window !== 'undefined' && (!!window.__TAURI__ || !!window.__TAURI_INTERNALS__)
    if (isTauri) {
      try {
        const nomeSeguro = String(nomeComExtensao)
          .replace(/[\\/:*?"<>|]+/g, '_')
          .replace(/\s+/g, ' ')
          .trim() || `ARQUIVO_${id.value}`
        const { save } = await import('@tauri-apps/plugin-dialog')
        const { writeFile } = await import('@tauri-apps/plugin-fs')
        const resNative = await ArquivosService.baixarBlob(id.value)
        const blobNative = resNative?.data instanceof Blob
          ? resNative.data
          : new Blob([resNative?.data], { type: 'application/octet-stream' })
        if (blobNative) {
          const targetPath = await save({
            defaultPath: nomeSeguro,
            title: 'Salvar arquivo',
          })
          if (targetPath) {
            const bytes = new Uint8Array(await blobNative.arrayBuffer())
            await writeFile(targetPath, bytes)
            notify.success('Arquivo salvo com sucesso.')
            return
          }
          return
        }
      } catch (nativeErr) {
        console.warn('[Download nativo Tauri fallback->url/blob]', nativeErr)
      }

      try {
        const tk = await ArquivosService.downloadToken(id.value)
        const relativeUrl = String(tk?.data?.url || '')
        if (relativeUrl) {
          const base = String(getApiBaseUrl() || '').replace(/\/+$/, '')
          const root = /^https?:\/\//i.test(base)
            ? base.replace(/\/api$/i, '')
            : String(import.meta.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3001').replace(/\/+$/, '')
          const absoluteUrl = relativeUrl.startsWith('http')
            ? relativeUrl
            : `${root}${relativeUrl}`
          const openerMod = await import('@tauri-apps/plugin-opener').catch(() => null)
          const openUrlFn = openerMod?.openUrl ?? openerMod?.default?.openUrl
          if (typeof openUrlFn === 'function') {
            await openUrlFn(absoluteUrl)
            notify.success('Download aberto no sistema.')
            return
          }
        }
      } catch (tauriErr) {
        console.warn('[Download Tauri URL fallback->blob]', tauriErr)
      }
    }

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

onMounted(() => {
  carregarBlob()
  // Calcula o offset do topo baseado na altura real do header do layout
  const header = document.querySelector('.default-layout__header')
  if (header) {
    const top = header.getBoundingClientRect().bottom
    document.documentElement.style.setProperty('--av-top', `${top}px`)
  }
})

onBeforeUnmount(() => {
  document.documentElement.style.removeProperty('--av-top')
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
})
</script>

<style scoped>
/* ── Novo layout simplificado ─────────────────────────────────── */

.av-wrap {
  display: flex;
  flex-direction: column;
  position: fixed;
  top: var(--av-top, 56px);
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', sans-serif;
  z-index: 50;
}

.av-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 1.25rem;
  border-bottom: 1px solid rgba(214,224,234,0.6);
  background: var(--ds-color-surface);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.av-topbar__left,
.av-topbar__right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.av-title { display: flex; flex-direction: column; }
.av-title__name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ds-color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40vw;
}
.av-title__type {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ds-color-text-soft);
}

.av-zoom-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ds-color-text-soft);
  min-width: 3rem;
  text-align: center;
}

.av-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.av-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.av-btn--ghost {
  background: transparent;
  border-color: rgba(214,224,234,0.8);
  color: var(--ds-color-text-soft);
}
.av-btn--ghost:hover:not(:disabled) { background: rgba(0,0,0,0.04); }
.av-btn--secondary {
  background: rgba(214,224,234,0.35);
  border-color: rgba(214,224,234,0.8);
  color: var(--ds-color-text);
}
.av-btn--secondary:hover:not(:disabled) { background: rgba(214,224,234,0.6); }
.av-btn--primary {
  background: var(--ds-color-primary);
  color: #fff;
}
.av-btn--primary:hover:not(:disabled) { opacity: 0.9; }

/* Área principal de visualização */
.av-body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background: #f8fafc;
  position: relative;
}

.av-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  background: #fff;
  overflow: auto;
}

.av-docx {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2rem 3rem;
  background: #fff;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: #1a1a1a;
}
.av-docx :deep(img) { max-width: 100%; height: auto; display: block; margin: 0.5em 0; }
.av-docx :deep(table) { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
.av-docx :deep(td), .av-docx :deep(th) { border: 1px solid #d1d5db; padding: 6px 10px; vertical-align: top; }
.av-docx :deep(th) { background: #f8fafc; font-weight: 600; }
.av-docx :deep(p) { margin: 0 0 0.6em; }
.av-docx :deep(h1) { font-size: 1.5em; margin: 0 0 0.5em; font-weight: 700; }
.av-docx :deep(h2) { font-size: 1.25em; margin: 1em 0 0.4em; font-weight: 700; }
.av-docx :deep(h3) { font-size: 1.05em; margin: 0.8em 0 0.3em; font-weight: 600; }
.av-docx :deep(ul), .av-docx :deep(ol) { margin: 0 0 0.7em; padding-left: 1.5em; }
.av-docx :deep(li) { margin-bottom: 0.25em; }
.av-docx :deep(strong), .av-docx :deep(b) { font-weight: 700; }

.av-image-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 1rem;
}
.av-image-wrap--zoomed { align-items: flex-start; }

.av-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  transition: transform 0.15s ease;
}

.av-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--ds-color-text-soft);
  font-size: 0.85rem;
  font-weight: 600;
}
.av-state--error { color: #be123c; }

/* ── CSS antigo (mantido para não quebrar outras referências) ─── */
.arquivo-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
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
  flex: 1;
  min-height: 0;
  width: 100%;
  margin-inline: auto;
  padding: 0.35rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  min-height: 0;
  padding: 0.75rem 0 0;
  display: flex;
  flex-direction: column;
}

.arquivo-viewer__preview-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  border: 1px solid rgba(214, 224, 234, 0.72);
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.45);
  padding: 0.75rem;
}

.arquivo-viewer__image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.5rem;
  transform-origin: center center;
  display: block;
  transition: transform 0.15s ease;
}

.arquivo-viewer__preview-shell--zoomed {
  align-items: flex-start;
  overflow: auto;
}

.arquivo-viewer__preview-shell--doc {
  align-items: stretch;
  padding: 0;
  overflow: hidden;
}

.arquivo-viewer__pdf {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  border: 0;
  border-radius: 1rem;
  background: #fff;
}

.arquivo-viewer__docx {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  border: 0;
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
    padding-top: 1.2rem;
    padding-bottom: 0.85rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .arquivo-viewer__content {
    padding: 0.35rem 1.5rem 0.75rem;
  }
}

@media (min-width: 1024px) {
  .arquivo-viewer :deep(.ds-header-block) {
    padding-top: 1.35rem;
    padding-bottom: 1rem;
    padding-left: 2rem;
    padding-right: 2rem;
  }

  .arquivo-viewer__content {
    padding: 0.35rem 2rem 0.75rem;
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
  