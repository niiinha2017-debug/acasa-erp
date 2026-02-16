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
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div class="w-full sm:w-80 order-1 sm:order-0">
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
            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-xl border border-slate-200 bg-white p-3">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Link de ativacao</p>
                <p class="mt-2 break-all text-sm font-semibold text-slate-800 font-mono">{{ linkCurto(convite.webUrl) }}</p>
                <div class="mt-2 flex items-center gap-2">
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
                    @click="copiar(convite.webUrl)"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white p-3">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">APK</p>
                <p class="mt-2 break-all text-sm font-semibold text-slate-800 font-mono">{{ linkCurto(convite.apkUrl) }}</p>
                <div class="mt-2 flex items-center gap-2">
                  <a
                    :href="convite.apkUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50"
                  >
                    Abrir
                  </a>
                  <button
                    type="button"
                    class="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50"
                    @click="copiar(convite.apkUrl)"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <div class="rounded-xl border border-slate-200 bg-white p-3">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Codigo</p>
                <p class="mt-1 text-base font-black tracking-[0.2em] text-slate-900">{{ convite.code }}</p>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white p-3">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Validade</p>
                <p class="mt-1 text-sm font-bold text-slate-800">{{ formatDate(convite.expira_em) }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-2">
              <Button
                v-if="podeGerar"
                variant="secondary"
                class="h-10 rounded-xl font-bold text-[11px] uppercase tracking-[0.14em]"
                @click="copiar(convite.webUrl)"
              >
                <i class="pi pi-copy mr-2 text-xs"></i>
                Copiar Ativacao
              </Button>

              <Button
                v-if="podeGerar"
                variant="secondary"
                class="h-10 rounded-xl font-bold text-[11px] uppercase tracking-[0.14em]"
                @click="copiar(convite.apkUrl)"
              >
                <i class="pi pi-copy mr-2 text-xs"></i>
                Copiar APK
              </Button>

              <button
                v-if="podeGerar"
                type="button"
                class="h-10 px-4 rounded-xl bg-[#25D366] text-white text-[11px] font-black uppercase tracking-[0.14em] hover:bg-[#128C7E] transition-colors"
                @click="abrirWhats"
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
              Selecione um funcionario e clique em "Gerar Convite".
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import { PontoRelatorioService, PontoService } from '@/services/index'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import PageHeader from '@/components/ui/PageHeader.vue'

definePage({ meta: { perm: 'ponto_relatorio.ver' } })

const router = useRouter()

const loading = ref(true)
const loadingGerar = ref(false)

const funcionarios = ref([])
const funcionario_id = ref(null)
const convite = ref(null)

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
    console.log('[ERRO listar funcionarios]', e)
    notify.error(e?.response?.data?.message || 'Falha ao carregar funcionarios.')
  } finally {
    loading.value = false
  }
})

async function confirmarGerarConvite() {
  if (!podeGerar.value) return notify.error('Acesso negado.')
  if (!funcionario_id.value) return
  await gerar()
}

async function gerar() {
  if (!podeGerar.value) return notify.error('Acesso negado.')
  if (!funcionario_id.value) return

  loadingGerar.value = true
  convite.value = null

  try {
    const res = await PontoService.gerarConvite(Number(funcionario_id.value))
    const data = res?.data || {}

    const code = data.code || data.codigo || data.token || data.convite || null
    if (!code) {
      notify.error('Convite gerado, mas nao retornou o codigo.')
      return
    }

    const pontoBaseUrl = 'https://ponto.acasamarcenaria.com.br'
    const codeEnc = encodeURIComponent(code)
    const fallbackAtivacaoUrl = `${pontoBaseUrl}/ativar?code=${codeEnc}`
    // APK fica em /ponto.apk na raiz do subdomínio
    const fallbackApkUrl = `${pontoBaseUrl}/ponto.apk`

    let ativacaoUrl = String(data.url || '').trim() || fallbackAtivacaoUrl
    try {
      const parsed = new URL(ativacaoUrl)
      const codeFromUrl = parsed.searchParams.get('code')
      if (!codeFromUrl) {
        parsed.searchParams.set('code', code)
        ativacaoUrl = parsed.toString()
      }
    } catch {
      ativacaoUrl = fallbackAtivacaoUrl
    }

    const apkUrl = String(data.apk_url || '').trim() || fallbackApkUrl
    convite.value = { ...data, code, url: ativacaoUrl, webUrl: ativacaoUrl, apkUrl }
    notify.success('Convite gerado.')
  } catch (e) {
    console.error(e)
    notify.error(e?.response?.data?.message || 'Nao foi possivel gerar o convite.')
  } finally {
    loadingGerar.value = false
  }
}

async function copiar(texto) {
  if (!podeGerar.value) return notify.error('Acesso negado.')
  try {
    await navigator.clipboard.writeText(texto)
    notify.success('Link copiado.')
  } catch {
    notify.error('Nao foi possivel copiar.')
  }
}

async function abrirWhats() {
  if (!podeGerar.value) return notify.error('Acesso negado.')
  if (!convite.value?.apkUrl || !convite.value?.webUrl) {
    notify.error('Convite sem links validos para envio.')
    return
  }

  const token = String(convite.value?.code || '').trim()
  const ativacaoUrl = String(convite.value?.webUrl || '').trim()
  if (!token || !ativacaoUrl.includes('code=')) {
    notify.error('Token de ativacao invalido para WhatsApp.')
    return
  }

  const id = Number(funcionario_id.value)
  const f = funcionarios.value.find((x) => x.id === id)
  const nome = f?.nome ? String(f.nome).trim() : 'tudo bem'

  const msg =
`Ola ${nome}!
Segue seu acesso ao APP do Ponto:

Baixar/instalar APK:
${convite.value.apkUrl}

Link de ativacao:
${ativacaoUrl}

Se expirar, me avise que eu gero outro.`

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`

  // No Tauri: abre no navegador padrão via plugin Opener (ou Shell).
  const isTauri = typeof window !== 'undefined' && (window.__TAURI__ || window.__TAURI_INTERNALS__)

  if (isTauri) {
    try {
      const tauri = window.__TAURI__ ?? window.__TAURI_INTERNALS__
      // Opener (Tauri 2) – abre URL no app padrão
      if (tauri?.opener?.open) {
        await tauri.opener.open(url)
        return
      }
      if (typeof tauri?.opener?.openUrl === 'function') {
        await tauri.opener.openUrl(url)
        return
      }
      // Fallback: Shell (open)
      if (tauri?.shell?.open) {
        await tauri.shell.open(url)
        return
      }
    } catch (e) {
      console.error('[PONTO_WHATS_TAURI]', e)
    }
  }

  // Fallback: comportamento padrão web
  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (opened) return
  } catch {}

  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    return
  } catch {}

  window.location.href = url
}

function formatDate(v) {
  if (!v) return '-'
  try {
    return new Date(v).toLocaleString('pt-BR')
  } catch {
    return String(v)
  }
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
