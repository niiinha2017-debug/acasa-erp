<template>
  <PageShell :padded="false">
    <section class="rh-ponto-convites ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Convites do Ponto"
        subtitle="Gere o acesso do relógio de ponto e compartilhe com o colaborador."
        icon="pi pi-link"
        :show-back="false"
      >
        <template #actions>
          <div class="rh-ponto-convites__header-actions ds-page-context__actions">
            <div class="w-full sm:w-80 min-w-0">
              <SearchInput
                v-model="funcionario_id"
                mode="select"
                placeholder="Busque por nome ou CPF..."
                :options="funcionariosOptions"
                labelKey="label"
                valueKey="value"
              />
            </div>

            <Button
              v-if="podeGerar"
              variant="primary"
              class="flex-shrink-0 h-11 rounded-xl font-black uppercase tracking-[0.16em] text-[11px]"
              :loading="loadingGerar"
              :disabled="!funcionario_id"
              @click="confirmarGerarConvite"
            >
              <i class="pi pi-plus mr-2 text-xs"></i>
              Gerar acesso
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="rh-ponto-convites__body ds-page-context__content">
        <Loading v-if="loading" />

        <div v-else class="space-y-4">
          <div
            v-if="convite"
            class="rh-ponto-convites__panel"
          >
            <div class="rh-ponto-convites__hero grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px] items-start">
              <div class="rh-ponto-convites__code-box min-w-0">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-text-soft">Código de ativação</p>
                <p class="mt-2 text-lg md:text-xl font-mono font-black tracking-[0.2em] text-text-main break-all">
                  {{ convite.code }}
                </p>
                <p class="mt-2 text-xs text-text-soft">
                  Envie primeiro pelo WhatsApp ou compartilhe o código para ativação manual.
                </p>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="ds-btn ds-btn--secondary ds-btn--sm rh-ponto-convites__micro-action"
                    @click="handleCopiarCodigo"
                  >
                    <i class="pi pi-copy mr-2 text-xs"></i>
                    Copiar código
                  </button>
                </div>
              </div>

              <div class="rh-ponto-convites__qr-box flex flex-col items-center justify-center min-w-[140px]">
                <p class="text-[10px] font-black uppercase tracking-[0.14em] text-text-soft mb-2">Ativar por QR</p>
                <div v-if="urlQrCode" class="rounded-lg overflow-hidden bg-white p-1 border border-border-ui">
                  <img :src="urlQrCode" alt="QR Code para ativação" class="w-28 h-28 md:w-32 md:h-32 object-contain" />
                </div>
                <p class="mt-2 text-[10px] text-text-soft text-center">Use a camera do celular para abrir a ativação</p>
              </div>
            </div>

            <div class="rh-ponto-convites__actions-row mt-4 flex flex-wrap items-center gap-2">
              <button
                v-if="podeGerar"
                type="button"
                class="ds-btn ds-btn--success ds-btn--md rh-ponto-convites__action"
                @click="abrirWhatsAppFormatado"
              >
                <i class="pi pi-whatsapp mr-2 text-xs"></i>
                Enviar no WhatsApp
              </button>

              <button
                v-if="podeGerar && convite?.pwaUrl"
                type="button"
                class="ds-btn ds-btn--primary ds-btn--md rh-ponto-convites__action"
                @click="abrirWhatsAppPwaIphone"
              >
                <i class="pi pi-mobile mr-2 text-xs"></i>
                Enviar PWA (iPhone)
              </button>

              <Button
                v-if="podeGerar"
                variant="outline"
                class="h-10 rounded-xl font-bold text-[11px] uppercase tracking-[0.14em]"
                @click="handleCopiarLinkAtivacao"
              >
                <i class="pi pi-copy mr-2 text-xs"></i>
                Copiar link de ativação
              </Button>

              <Button
                v-if="podeGerar"
                variant="secondary"
                class="h-10 rounded-xl font-bold text-[11px] uppercase tracking-[0.14em]"
                :loading="loadingGerar"
                :disabled="!funcionario_id"
                @click="confirmarGerarConvite"
              >
                <i class="pi pi-refresh mr-2 text-xs"></i>
                Gerar novo acesso
              </Button>
            </div>

            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <div class="rh-ponto-convites__validity-box">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-text-soft">Validade</p>
                <p
                  class="mt-1 text-sm font-bold tabular-nums"
                  :class="classeCorValidade"
                >
                  {{ textoCountdown }}
                </p>
                <p v-if="dataExpiracao" class="mt-0.5 text-xs text-text-soft">
                  Expira em {{ formatarDataExpiracao(dataExpiracao) }}
                </p>
              </div>

              <div class="rh-ponto-convites__link-box">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-text-soft">Link de ativação</p>
                <p class="mt-2 break-all text-sm font-semibold text-text-main font-mono">{{ linkCurto(convite.webUrl) }}</p>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    :href="convite.webUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ds-btn ds-btn--secondary ds-btn--sm rh-ponto-convites__micro-action"
                  >
                    Abrir
                  </a>
                  <button
                    type="button"
                    class="ds-btn ds-btn--secondary ds-btn--sm rh-ponto-convites__micro-action"
                    @click="handleCopiarLinkAtivacao"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <div class="rh-ponto-convites__link-box">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-text-soft">APK (Android)</p>
                <p class="mt-2 break-all text-sm font-semibold text-text-main font-mono">{{ linkCurto(convite.apkUrl) }}</p>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="ds-btn ds-btn--secondary ds-btn--sm rh-ponto-convites__micro-action"
                    :disabled="baixandoApk"
                    @click="abrirOuBaixarApk"
                  >
                    {{ baixandoApk ? 'Baixando...' : 'Abrir' }}
                  </button>
                  <button
                    type="button"
                    class="ds-btn ds-btn--secondary ds-btn--sm rh-ponto-convites__micro-action"
                    @click="handleCopiarApk"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div class="rh-ponto-convites__link-box">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-text-soft">App relógio de ponto (iPhone / PWA)</p>
                <p class="mt-1 text-[10px] text-text-soft">Abra no iPhone e adicione à tela inicial para usar só o relógio.</p>
                <p class="mt-2 break-all text-sm font-semibold text-text-main font-mono">{{ linkCurto(convite.pwaUrl) }}</p>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    :href="convite.pwaUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ds-btn ds-btn--secondary ds-btn--sm rh-ponto-convites__micro-action"
                  >
                    Abrir
                  </a>
                  <button
                    type="button"
                    class="ds-btn ds-btn--secondary ds-btn--sm rh-ponto-convites__micro-action"
                    @click="handleCopiarPwa"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="rh-ponto-convites__empty"
          >
            <i class="pi pi-user-plus text-3xl text-text-soft"></i>
            <p class="mt-3 text-sm font-semibold text-text-soft">
              Selecione um colaborador, gere o acesso e use as ações de envio quando tudo estiver pronto.
            </p>
          </div>
        </div>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { PontoRelatorioService, PontoService } from '@/services/index'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { openExternalUrl } from '@/utils/url'
import { saveBlobNativeOrBrowser } from '@/utils/native-download'
import { APP_LINKS } from '@/config/app-links'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageShell from '@/components/ui/PageShell.vue'

definePage({ meta: { perm: 'ponto_convite.criar' } })

const router = useRouter()

const loading = ref(true)
const loadingGerar = ref(false)
const baixandoApk = ref(false)

const funcionarios = ref([])
const funcionario_id = ref(null)
const convite = ref(null)

const dataExpiracao = ref(null)
const tempoRestanteMs = ref(0)
const intervaloCountdown = ref(null)

const permTelaVer = 'ponto_convite.criar'
const permConviteGerenciar = 'ponto_convite.criar'

const podeVerTela = computed(() => can(permTelaVer))
const podeGerar = computed(() => can(permConviteGerenciar))

const funcionariosOptions = computed(() =>
  (funcionarios.value || []).map((f) => ({
    label: `${String(f.nome || '').toUpperCase()} #${f.id}`,
    value: f.id,
  })),
)

const urlAtivacao = computed(() => convite.value?.webUrl ?? '')

const urlQrCode = ref('')

async function gerarQrCode() {
  const url = urlAtivacao.value
  if (!url) {
    urlQrCode.value = ''
    return
  }
  try {
    const mod = await import('qrcode')
    const qr = mod.default ?? mod
    if (qr && typeof qr.toDataURL === 'function') {
      urlQrCode.value = await qr.toDataURL(url, { width: 256, margin: 1 })
    } else {
      urlQrCode.value = ''
    }
  } catch {
    urlQrCode.value = ''
  }
}

watch(urlAtivacao, () => {
  gerarQrCode()
}, { immediate: true })

const textoCountdown = computed(() => {
  const ms = tempoRestanteMs.value
  if (ms <= 0) return 'Expirado'
  const segundos = Math.floor((ms / 1000) % 60)
  const minutos = Math.floor((ms / 60000) % 60)
  const horas = Math.floor(ms / 3600000)
  const partes = []
  if (horas > 0) partes.push(`${horas}h`)
  partes.push(`${minutos}m`)
  partes.push(`${segundos}s`)
  return partes.join(' ')
})

const classeCorValidade = computed(() => {
  const ms = tempoRestanteMs.value
  if (ms <= 0) return 'text-red-600'
  const minutosRestantes = ms / 60000
  if (minutosRestantes < 10) return 'text-red-600 animate-pulse'
  if (minutosRestantes < 60) return 'text-orange-600'
  return 'text-slate-800'
})

function iniciarCountdown() {
  if (intervaloCountdown.value) {
    clearInterval(intervaloCountdown.value)
    intervaloCountdown.value = null
  }
  const data = dataExpiracao.value
  if (!data) {
    tempoRestanteMs.value = 0
    return
  }
  const atualizar = () => {
    const agora = Date.now()
    const expira = new Date(data).getTime()
    const restante = expira - agora
    tempoRestanteMs.value = restante > 0 ? restante : 0
    if (restante <= 0 && intervaloCountdown.value) {
      clearInterval(intervaloCountdown.value)
      intervaloCountdown.value = null
    }
  }
  atualizar()
  // Atualiza a cada 2s para reduzir redraws e avisos do event loop (Tao/Tauri); precisão de 1s no final
  const intervaloMs = 2000
  intervaloCountdown.value = setInterval(atualizar, intervaloMs)
}

watch(dataExpiracao, (nova) => {
  if (nova) iniciarCountdown()
}, { immediate: true })

onUnmounted(() => {
  if (intervaloCountdown.value) {
    clearInterval(intervaloCountdown.value)
  }
})

onMounted(async () => {
  if (!podeVerTela.value) {
    notify.error('Acesso negado.')
    loading.value = false
    router.push('/')
    return
  }

  try {
    const res = await PontoRelatorioService.listarFuncionariosAtivos()
    const data = res?.data?.data ?? res?.data ?? res
    funcionarios.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('[Convites] Erro ao listar funcionários', e)
    notify.error(e?.response?.data?.message || 'Falha ao carregar funcionários.')
  } finally {
    loading.value = false
  }
})

async function confirmarGerarConvite() {
  if (!podeGerar.value) return notify.error('Acesso negado.')
  if (!funcionario_id.value) return
  await gerarConvite()
}

async function gerarConvite() {
  if (!podeGerar.value) return notify.error('Acesso negado.')
  if (!funcionario_id.value) return

  loadingGerar.value = true

  try {
    const res = await PontoService.gerarConvite(Number(funcionario_id.value))
    const data = res?.data || {}

    const codigo = data.code || data.codigo || data.token || data.convite || null
    if (!codigo) {
      notify.error('Convite gerado, mas não retornou o código.')
      return
    }

    const pontoBaseUrl = APP_LINKS.ponto.baseUrl
    const codigoEnc = encodeURIComponent(codigo)
    const fallbackAtivacaoUrl = `${pontoBaseUrl}/ativar?code=${codigoEnc}`
    const fallbackApkUrl = APP_LINKS.ponto.android || `${pontoBaseUrl}/ponto.apk`

    let urlAtivacaoVal = String(data.url || '').trim() || fallbackAtivacaoUrl
    try {
      const parsed = new URL(urlAtivacaoVal)
      const codeFromUrl = parsed.searchParams.get('code')
      if (!codeFromUrl) {
        parsed.searchParams.set('code', codigo)
        urlAtivacaoVal = parsed.toString()
      }
    } catch {
      urlAtivacaoVal = fallbackAtivacaoUrl
    }

    const apkUrl = String(data.apk_url || '').trim() || fallbackApkUrl
    // PWA/iPhone: usar hash (#code=) para o código não se perder ao abrir como app
    const basePwa = pontoBaseUrl.replace(/\/+$/, '')
    const pwaUrlComCodigo = `${basePwa}/ativar#code=${codigoEnc}`
    convite.value = {
      ...data,
      code: codigo,
      url: urlAtivacaoVal,
      webUrl: urlAtivacaoVal,
      apkUrl,
      pwaUrl: pwaUrlComCodigo,
    }

    const expiraEm = data.expira_em ?? data.expires_at
    dataExpiracao.value = expiraEm || null

    notify.success('Convite gerado.')
  } catch (e) {
    console.error('[Convites] Erro ao gerar convite', e)
    const msgBackend = e?.response?.data?.message
    const isRede = !e?.response && e?.message && /network|fetch|timeout|failed/i.test(String(e.message))
    const mensagem = msgBackend
      || (isRede
        ? 'Falha ao conectar com a API. Verifique se o backend está em execução no servidor.'
        : 'Não foi possível gerar o convite.')
    notify.error(mensagem)
  } finally {
    loadingGerar.value = false
  }
}

function formatarDataExpiracao(v) {
  if (!v) return '-'
  try {
    return new Date(v).toLocaleString('pt-BR')
  } catch {
    return String(v)
  }
}

async function copiarParaAreaTransferencia(texto) {
  if (!podeGerar.value) return notify.error('Acesso negado.')
  try {
    await navigator.clipboard.writeText(texto)
    notify.success('Copiado para a área de transferência!')
  } catch {
    notify.error('Não foi possível copiar.')
  }
}

function handleCopiarCodigo() {
  if (convite.value?.code) copiarParaAreaTransferencia(convite.value.code)
}

function handleCopiarLinkAtivacao() {
  if (convite.value?.webUrl) copiarParaAreaTransferencia(convite.value.webUrl)
}

function handleCopiarApk() {
  if (convite.value?.apkUrl) copiarParaAreaTransferencia(convite.value.apkUrl)
}

function handleCopiarPwa() {
  if (convite.value?.pwaUrl) copiarParaAreaTransferencia(convite.value.pwaUrl)
}

function abrirOuBaixarApk() {
  const apkUrl = convite.value?.apkUrl
  if (!apkUrl) return

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : ''
  const isAndroid = /android/i.test(userAgent)

  if (isAndroid) {
    try {
      const link = document.createElement('a')
      link.href = apkUrl
      link.setAttribute('download', 'ponto.apk')
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      baixandoApk.value = true
      link.click()
      setTimeout(() => {
        baixandoApk.value = false
      }, 3000)
    } catch {
      baixandoApk.value = false
      window.open(apkUrl, '_blank', 'noopener,noreferrer')
    }
    return
  }

  baixarApkComFallback(apkUrl)
}

async function baixarApkComFallback(apkUrl) {
  try {
    const resp = await fetch(apkUrl)
    if (!resp.ok) throw new Error('Falha ao baixar APK')
    const blob = await resp.blob()
    const result = await saveBlobNativeOrBrowser(blob, 'ponto.apk')
    if (result?.cancelled) return
    if (!result?.ok) throw new Error('Falha ao salvar APK')
    return
  } catch {
    const a = document.createElement('a')
    a.href = apkUrl
    a.download = 'ponto.apk'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

async function abrirWhatsAppComMensagem(mensagem) {
  const id = Number(funcionario_id.value)
  const funcionario = funcionarios.value.find((x) => x.id === id)
  const numeroWhatsApp = funcionario?.whatsapp ? String(funcionario.whatsapp).replace(/\D/g, '') : ''
  const phone = numeroWhatsApp.length >= 11 ? numeroWhatsApp.slice(-11) : numeroWhatsApp
  const urlWhatsApp = phone
    ? `https://wa.me/55${phone}?text=${encodeURIComponent(mensagem)}`
    : `https://wa.me/?text=${encodeURIComponent(mensagem)}`

  const isTauri = typeof window !== 'undefined' && (window.__TAURI__ || window.__TAURI_INTERNALS__)
  if (isTauri) {
    const aberto = await openExternalUrl(urlWhatsApp)
    if (aberto) return
    copiarParaAreaTransferencia(urlWhatsApp)
    notify.warn('Link do WhatsApp copiado. Abra o navegador e cole o link, ou use o WhatsApp pelo celular.')
    return
  }

  try {
    if (window.open(urlWhatsApp, '_blank', 'noopener,noreferrer')) return
  } catch {}
  try {
    const anchor = document.createElement('a')
    anchor.href = urlWhatsApp
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  } catch {}
  window.location.href = urlWhatsApp
}

async function abrirWhatsAppPwaIphone() {
  if (!podeGerar.value) return notify.error('Acesso negado.')
  if (!convite.value?.pwaUrl || !convite.value?.webUrl) {
    notify.error('Convite sem link PWA para envio.')
    return
  }

  const codigo = String(convite.value?.code || '').trim()
  const urlAtivacao = String(convite.value?.webUrl || '').trim()
  const linkPwa = convite.value.pwaUrl || APP_LINKS.ponto.baseUrl
  if (!codigo || !urlAtivacao.includes('code=')) {
    notify.error('Token de ativação inválido.')
    return
  }

  const id = Number(funcionario_id.value)
  const funcionario = funcionarios.value.find((x) => x.id === id)
  const nomeColaborador = funcionario?.nome ? String(funcionario.nome).trim() : 'Colaborador'

  const mensagem = `Olá ${nomeColaborador}, seu acesso ao *Relógio de Ponto* está pronto! 📱

*Para usar no iPhone:*
1. Abra este link no Safari: ${linkPwa}
2. Toque em Compartilhar → *Adicionar à Tela de Início*
3. Abra o app na tela inicial e use o código: *${codigo}*

Ou ative direto por este link: ${urlAtivacao}

⏰ Este convite expira em breve!`

  abrirWhatsAppComMensagem(mensagem)
}

async function abrirWhatsAppFormatado() {
  if (!podeGerar.value) return notify.error('Acesso negado.')
  if (!convite.value?.apkUrl || !convite.value?.webUrl) {
    notify.error('Convite sem links válidos para envio.')
    return
  }

  const codigo = String(convite.value?.code || '').trim()
  const urlAtivacao = String(convite.value?.webUrl || '').trim()
  if (!codigo || !urlAtivacao.includes('code=')) {
    notify.error('Token de ativação inválido para WhatsApp.')
    return
  }

  const id = Number(funcionario_id.value)
  const funcionario = funcionarios.value.find((x) => x.id === id)
  const nomeColaborador = funcionario?.nome ? String(funcionario.nome).trim() : 'Colaborador'

  const linkApk = convite.value.apkUrl
  const linkPwa = convite.value.pwaUrl || APP_LINKS.ponto.baseUrl
  const mensagem = `Olá ${nomeColaborador}, seu acesso ao Ponto da Marcenaria está pronto! 🛠️
1. Baixe o App (Android): ${linkApk}
*2. Use o Código: ${codigo}*
3. Ou ative pelo link: ${urlAtivacao}
📱 iPhone: abra este link e adicione à tela inicial para usar o relógio: ${linkPwa}
Atenção: Este convite expira em breve!`

  abrirWhatsAppComMensagem(mensagem)
}

function linkCurto(url) {
  const raw = String(url || '').trim()
  if (!raw) return '-'
  return raw.replace(/^https?:\/\//i, '')
}
</script>

<style scoped>
.rh-ponto-convites__body {
  width: min(100%, 1380px);
  margin: 0 auto;
  padding: 0.85rem 1rem 1.5rem;
}

.rh-ponto-convites__header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

.rh-ponto-convites__panel {
  padding: 0.35rem 0 0.25rem;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-primary) 14%, var(--ds-color-border) 86%);
}

.rh-ponto-convites__code-box,
.rh-ponto-convites__qr-box,
.rh-ponto-convites__link-box,
.rh-ponto-convites__validity-box {
  border: 0;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-primary) 10%, var(--ds-color-border) 90%);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.rh-ponto-convites__code-box {
  padding: 1rem 0 0.25rem;
}

.rh-ponto-convites__qr-box {
  padding: 1rem 0 0.25rem;
}

.rh-ponto-convites__link-box,
.rh-ponto-convites__validity-box {
  padding: 0.95rem 0 0.2rem;
}

.rh-ponto-convites__actions-row {
  padding-top: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-primary) 10%, var(--ds-color-border) 90%);
}

.rh-ponto-convites__micro-action {
  text-decoration: none;
}

.rh-ponto-convites__action {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  text-decoration: none;
  transition: transform 180ms ease;
}

.rh-ponto-convites__action:hover {
  transform: translateY(-1px);
}

.rh-ponto-convites__empty {
  border: 0;
  border-top: 1px dashed color-mix(in srgb, var(--ds-color-primary) 22%, var(--ds-color-border) 78%);
  border-bottom: 1px dashed color-mix(in srgb, var(--ds-color-primary) 12%, var(--ds-color-border) 88%);
  border-radius: 0;
  background: transparent;
  padding: 2.75rem 1.5rem;
  text-align: center;
}

.rh-ponto-convites :deep(.ds-shell-card) {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.rh-ponto-convites :deep(.ds-header-block) {
  padding-left: 1rem;
  padding-right: 1rem;
}

@keyframes pulse {
  50% { opacity: 0.85; }
}
.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.clientes-line-list :deep(.search-container input.w-full) {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom-width: 2px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.clientes-line-list :deep(.search-container input.w-full:focus) {
  box-shadow: none;
}

.dark .rh-ponto-convites__panel {
  border-top-color: color-mix(in srgb, var(--ds-color-primary) 24%, var(--ds-color-border) 76%);
}

.dark .rh-ponto-convites__code-box,
.dark .rh-ponto-convites__qr-box,
.dark .rh-ponto-convites__link-box,
.dark .rh-ponto-convites__validity-box {
  border-top-color: color-mix(in srgb, var(--ds-color-primary) 18%, var(--ds-color-border) 82%);
}

.dark .rh-ponto-convites__empty {
  border-color: color-mix(in srgb, var(--ds-color-primary) 28%, var(--ds-color-border) 72%);
  background: transparent;
}

@media (min-width: 768px) {
  .rh-ponto-convites__body {
    padding: 1rem 1.5rem 1.75rem;
  }

  .rh-ponto-convites :deep(.ds-header-block) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .rh-ponto-convites__body {
    padding: 1rem 2rem 2rem;
  }

  .rh-ponto-convites :deep(.ds-header-block) {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
</style>
