<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Convites do Ponto"
        subtitle="Geração de acesso para colaboradores"
        icon="pi pi-link"
        :show-back="false"
      >
        <template #actions>
          <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-80 order-1 sm:order-0 min-w-0">
              <SearchInput
                v-model="funcionario_id"
                mode="select"
                placeholder="Pesquise por nome ou CPF..."
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
              Gerar Convite
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
        <Loading v-if="loading" />

        <div v-else class="space-y-4">
          <div
            v-if="convite"
            class="rounded-2xl border border-border-ui bg-white/70 p-4 md:p-5"
          >
            <!-- Código em destaque + QR Code lado a lado -->
            <div class="grid gap-3 md:grid-cols-[1fr_auto] items-start">
              <div class="rounded-xl border border-slate-200 bg-slate-100/80 p-4 shadow-inner">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Código</p>
                <p class="mt-2 text-lg md:text-xl font-mono font-black tracking-[0.2em] text-slate-900 break-all">
                  {{ convite.code }}
                </p>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50 transition-colors"
                    @click="handleCopiarCodigo"
                  >
                    <i class="pi pi-copy mr-2 text-xs"></i>
                    Copiar
                  </button>
                </div>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white p-3 flex flex-col items-center justify-center min-w-[140px]">
                <p class="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 mb-2">Ativar por QR</p>
                <div v-if="urlQrCode" class="rounded-lg overflow-hidden bg-white p-1 border border-slate-200">
                  <img :src="urlQrCode" alt="QR Code para ativação" class="w-28 h-28 md:w-32 md:h-32 object-contain" />
                </div>
                <p class="mt-2 text-[10px] text-slate-500 text-center">Escaneie para ativar</p>
              </div>
            </div>

            <!-- Link de ativação e APK -->
            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <div class="rounded-xl border border-slate-200 bg-white p-3">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Link de ativação</p>
                <p class="mt-2 break-all text-sm font-semibold text-slate-800 font-mono">{{ linkCurto(convite.webUrl) }}</p>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    :href="convite.webUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50"
                  >
                    Abrir
                  </a>
                  <button
                    type="button"
                    class="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50"
                    @click="handleCopiarLinkAtivacao"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white p-3">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">APK</p>
                <p class="mt-2 break-all text-sm font-semibold text-slate-800 font-mono">{{ linkCurto(convite.apkUrl) }}</p>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    :disabled="baixandoApk"
                    @click="abrirOuBaixarApk"
                  >
                    {{ baixandoApk ? 'Baixando...' : 'Abrir' }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50"
                    @click="handleCopiarApk"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>

            <!-- Validade com countdown -->
            <div class="mt-3">
              <div class="rounded-xl border border-slate-200 bg-white p-3">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Validade</p>
                <p
                  class="mt-1 text-sm font-bold tabular-nums"
                  :class="classeCorValidade"
                >
                  {{ textoCountdown }}
                </p>
                <p v-if="dataExpiracao" class="mt-0.5 text-xs text-slate-500">
                  Expira em {{ formatarDataExpiracao(dataExpiracao) }}
                </p>
              </div>
            </div>

            <!-- Botões de ação -->
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <Button
                v-if="podeGerar"
                variant="secondary"
                class="h-10 rounded-xl font-bold text-[11px] uppercase tracking-[0.14em]"
                @click="handleCopiarLinkAtivacao"
              >
                <i class="pi pi-copy mr-2 text-xs"></i>
                Copiar Ativação
              </Button>

              <Button
                v-if="podeGerar"
                variant="secondary"
                class="h-10 rounded-xl font-bold text-[11px] uppercase tracking-[0.14em]"
                @click="handleCopiarApk"
              >
                <i class="pi pi-copy mr-2 text-xs"></i>
                Copiar APK
              </Button>

              <button
                v-if="podeGerar"
                type="button"
                class="h-10 px-4 rounded-xl bg-[#25D366] text-white text-[11px] font-black uppercase tracking-[0.14em] hover:bg-[#128C7E] transition-colors"
                @click="abrirWhatsAppFormatado"
              >
                <i class="pi pi-whatsapp mr-2 text-xs"></i>
                Enviar no WhatsApp
              </button>
            </div>
          </div>

          <div
            v-else
            class="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center"
          >
            <i class="pi pi-user-plus text-3xl text-slate-400"></i>
            <p class="mt-3 text-sm font-semibold text-slate-600">
              Selecione um funcionário e clique em "Gerar Convite".
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { PontoRelatorioService, PontoService } from '@/services/index'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import PageHeader from '@/components/ui/PageHeader.vue'

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
  convite.value = null
  dataExpiracao.value = null

  try {
    const res = await PontoService.gerarConvite(Number(funcionario_id.value))
    const data = res?.data || {}

    const codigo = data.code || data.codigo || data.token || data.convite || null
    if (!codigo) {
      notify.error('Convite gerado, mas não retornou o código.')
      return
    }

    const pontoBaseUrl = 'https://ponto.acasamarcenaria.com.br'
    const codigoEnc = encodeURIComponent(codigo)
    const fallbackAtivacaoUrl = `${pontoBaseUrl}/ativar?code=${codigoEnc}`
    const fallbackApkUrl = `${pontoBaseUrl}/ponto.apk`

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
    convite.value = {
      ...data,
      code: codigo,
      url: urlAtivacaoVal,
      webUrl: urlAtivacaoVal,
      apkUrl,
    }

    const expiraEm = data.expira_em ?? data.expires_at
    if (expiraEm) {
      dataExpiracao.value = expiraEm
    }

    notify.success('Convite gerado.')
  } catch (e) {
    console.error('[Convites] Erro ao gerar convite', e)
    const mensagem = e?.response?.data?.message
      || (e?.message && /network|fetch|timeout/i.test(e.message)
        ? 'Falha ao conectar com o servidor de autenticação.'
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

  const a = document.createElement('a')
  a.href = apkUrl
  a.download = 'ponto.apk'
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
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
  const mensagem = `Olá ${nomeColaborador}, seu acesso ao Ponto da Marcenaria está pronto! 🛠️
1. Baixe o App: ${linkApk}
*2. Use o Código: ${codigo}*
3. Ou ative pelo link: ${urlAtivacao}
Atenção: Este convite expira em breve!`

  const numeroWhatsApp = funcionario?.whatsapp ? String(funcionario.whatsapp).replace(/\D/g, '') : ''
  const phone = numeroWhatsApp.length >= 11 ? numeroWhatsApp.slice(-11) : numeroWhatsApp
  const urlWhatsApp = phone
    ? `https://wa.me/55${phone}?text=${encodeURIComponent(mensagem)}`
    : `https://wa.me/?text=${encodeURIComponent(mensagem)}`

  const isTauri = typeof window !== 'undefined' && (window.__TAURI__ || window.__TAURI_INTERNALS__)

  if (isTauri) {
    try {
      const tauri = window.__TAURI__ ?? window.__TAURI_INTERNALS__
      if (tauri?.opener?.open) {
        await tauri.opener.open(urlWhatsApp)
        return
      }
      if (typeof tauri?.opener?.openUrl === 'function') {
        await tauri.opener.openUrl(urlWhatsApp)
        return
      }
      if (tauri?.shell?.open) {
        await tauri.shell.open(urlWhatsApp)
        return
      }
    } catch (e) {
      console.error('[PONTO_WHATS_TAURI]', e)
    }
  }

  try {
    const opened = window.open(urlWhatsApp, '_blank', 'noopener,noreferrer')
    if (opened) return
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

function linkCurto(url) {
  const raw = String(url || '').trim()
  if (!raw) return '-'
  return raw.replace(/^https?:\/\//i, '')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.login-font {
  font-family: 'Manrope', 'Segoe UI', sans-serif;
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
</style>
