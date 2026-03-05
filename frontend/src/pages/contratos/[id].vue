<template>
  <div class="w-full max-w-[900px] mx-auto animate-page-in">
    <div class="rounded-2xl border border-border-ui bg-bg-card overflow-hidden">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>
      <PageHeader
        :title="isEdit ? `Editar Contrato #${contratoId}` : 'Novo Contrato'"
        subtitle="Dados do contrato comercial"
        icon="pi pi-file"
        class="border-b border-border-ui"
      >
        <template #actions>
          <RouterLink
            v-if="!isEdit && vendaIdFromQuery"
            :to="`/vendas/venda/${vendaIdFromQuery}`"
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <i class="pi pi-arrow-left text-xs"></i>
            Voltar ao fechamento
          </RouterLink>
          <RouterLink
            v-else
            to="/contratos"
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <i class="pi pi-arrow-left text-xs"></i>
            Voltar
          </RouterLink>
        </template>
      </PageHeader>

      <div class="p-6 md:p-8 relative">
        <Loading v-if="loading" />

        <form v-else class="space-y-8" @submit.prevent="salvar" autocomplete="off">
          <div
            v-if="clientePendenteValidacao"
            class="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200"
          >
            <div class="font-semibold">Cliente não validado</div>
            <div class="text-xs mt-1">
              O contrato não será gerado enquanto o cliente/contratante não for validado. Valide o contratante na venda (botão &quot;Validar contratante&quot;) antes de criar o contrato.
            </div>
          </div>

          <div class="grid grid-cols-12 gap-6">
            <SearchInput
              class="col-span-12"
              v-model="form.venda_id"
              mode="select"
              label="Venda *"
              :options="vendaOptions"
              placeholder="Selecione a venda"
              labelKey="label"
              valueKey="value"
            />

            <Input
              class="col-span-12 md:col-span-4"
              v-model="form.numero"
              label="Número do contrato (opcional - gerado automaticamente se vazio)"
              placeholder="Ex: CONT-2025-001"
            />

            <SearchInput
              class="col-span-12 md:col-span-4"
              v-model="form.status"
              mode="select"
              label="Status *"
              :options="statusOptions"
              placeholder="Selecione"
              labelKey="label"
              valueKey="value"
            />

            <div class="col-span-12 md:col-span-4">
              <label class="block text-xs font-semibold tracking-wide text-text-soft ml-0.5 mb-1.5">Valor *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-soft">R$</span>
                <input
                  :value="valorMask"
                  @input="onValorInput($event)"
                  type="text"
                  inputmode="numeric"
                  placeholder="0,00"
                  required
                  class="w-full h-10 pl-9 pr-3 rounded-xl border border-border-ui bg-bg-card text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
              </div>
            </div>

            <Input
              class="col-span-12"
              v-model="form.descricao"
              label="Descrição"
              placeholder="Descrição ou observações do contrato"
            />

            <Input
              class="col-span-12 md:col-span-6"
              v-model="form.data_inicio"
              label="Data de início"
              type="date"
              disabled
            />

            <div class="col-span-12 md:col-span-6">
              <label class="block text-xs font-semibold tracking-wide text-text-soft ml-0.5 mb-1.5">Data de término</label>
              <Input
                v-model="form.data_fim"
                type="date"
                :min="form.data_inicio || undefined"
                :max="dataFimMaximo || undefined"
                :forceUpper="false"
              />
            </div>
            <p class="col-span-12 md:col-span-6 -mt-3 text-xs text-text-soft">
              Data prévia até {{ dataFimMaximoLabel }}.
            </p>
          </div>

          <!-- Enviar PDF por WhatsApp e e-mail -->
          <section
            v-if="isEdit"
            class="rounded-2xl border border-border-ui bg-bg-page p-6 space-y-4"
          >
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Enviar PDF por WhatsApp ou e-mail
            </div>
            <p class="text-sm text-text-soft">
              Gere o PDF do contrato (botão abaixo) e envie ao cliente por WhatsApp ou e-mail. O cliente recebe o link e abre o PDF normalmente para visualizar e baixar. A assinatura será feita pelo cliente na residência dele (impresso ou conforme combinado).
            </p>
            <div class="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                :loading="obterLinkLoading"
                :disabled="!telefoneCliente || obterLinkLoading"
                @click="enviarPorWhatsApp"
              >
                <i class="pi pi-whatsapp mr-1.5"></i>
                Enviar por WhatsApp
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                :loading="enviarEmailLoading"
                :disabled="!emailCliente || enviarEmailLoading"
                @click="enviarContratoPorEmailSistema"
              >
                <i class="pi pi-send mr-1.5"></i>
                Enviar e-mail pelo sistema
              </Button>
            </div>
            <p v-if="!telefoneCliente" class="text-xs text-amber-600 dark:text-amber-400">
              Cadastre o telefone do cliente para habilitar o envio por WhatsApp.
            </p>
            <p v-if="!emailCliente" class="text-xs text-amber-600 dark:text-amber-400">
              Cadastre o e-mail do cliente para habilitar o envio por e-mail.
            </p>
          </section>

          <!-- Incluir / excluir contrato assinado (upload PDF) – quando cliente assinou fora do sistema -->
          <section
            v-if="isEdit"
            class="rounded-2xl border border-border-ui bg-bg-page p-6 space-y-4"
          >
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Incluir contrato assinado
            </div>
            <p class="text-sm text-text-soft">
              Quando o cliente tiver assinado o contrato (impresso ou por outro meio), envie o PDF assinado aqui. O sistema salva o arquivo e marca o contrato como vigente.
            </p>
            <div v-if="pdfAssinadoArquivoId" class="flex flex-wrap items-center gap-3">
              <span class="text-sm text-text-soft">Há um PDF assinado vinculado a este contrato.</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                :loading="excluindoPdfAssinado"
                :disabled="excluindoPdfAssinado"
                @click="excluirPdfAssinado"
              >
                <i v-if="excluindoPdfAssinado" class="pi pi-spin pi-spinner mr-1.5"></i>
                <i v-else class="pi pi-trash mr-1.5"></i>
                Excluir PDF assinado
              </Button>
            </div>
            <template v-if="form.status !== 'VIGENTE'">
              <div class="flex flex-wrap items-center gap-3">
                <input
                  ref="inputContratoAssinado"
                  type="file"
                  accept=".pdf,application/pdf"
                  class="hidden"
                  @change="onFileContratoAssinadoChange"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  :loading="incluirAssinadoLoading"
                  :disabled="incluirAssinadoLoading"
                  @click="abrirSeletorArquivo"
                >
                  <i v-if="incluirAssinadoLoading" class="pi pi-spin pi-spinner mr-1.5"></i>
                  <i v-else class="pi pi-upload mr-1.5"></i>
                  Escolher PDF assinado
                </Button>
                <span v-if="arquivoContratoAssinado" class="text-sm text-text-soft">
                  {{ arquivoContratoAssinado.name }}
                </span>
              </div>
              <Button
                v-if="arquivoContratoAssinado"
                type="button"
                variant="primary"
                size="sm"
                :loading="incluirAssinadoLoading"
                :disabled="incluirAssinadoLoading"
                @click="enviarContratoAssinado"
              >
                <i v-if="incluirAssinadoLoading" class="pi pi-spin pi-spinner mr-1.5"></i>
                Incluir contrato assinado e marcar como vigente
              </Button>
            </template>
          </section>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border-ui">
            <div v-if="isEdit" class="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                :disabled="gerandoPdf"
                @click="gerarPdfContrato"
              >
                <i v-if="gerandoPdf" class="pi pi-spin pi-spinner mr-2"></i>
                <i v-else class="pi pi-file-pdf mr-2"></i>
                Gerar PDF do Contrato
              </Button>
            </div>
            <div class="flex justify-end gap-3 w-full sm:w-auto">
              <RouterLink
                to="/contratos"
                class="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-border-ui rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </RouterLink>
              <Button
                type="submit"
                variant="primary"
                :disabled="salvando || clientePendenteValidacao"
              >
                <i v-if="salvando" class="pi pi-spin pi-spinner mr-2"></i>
                {{ isEdit ? 'Salvar alterações' : 'Criar contrato' }}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { ContratosService, VendaService } from '@/services/index'
import { closeTabAndGo } from '@/utils/tabs'
import { clientePrecisaValidacaoParaContrato } from '@/utils/validators'

definePage({ meta: { perm: 'contratos.ver' } })

const route = useRoute()
const router = useRouter()
const contratoId = computed(() => route.params.id)
const vendaIdFromQuery = computed(() => {
  const raw = route.query?.vendaId
  const n = Number(String(raw || '').replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
})
const isEdit = computed(() => {
  const id = contratoId.value
  return id && id !== 'novo' && !isNaN(Number(id))
})

const loading = ref(true)
const salvando = ref(false)
const gerandoPdf = ref(false)
const obterLinkLoading = ref(false)
const enviarEmailLoading = ref(false)
const incluirAssinadoLoading = ref(false)
const arquivoContratoAssinado = ref(null)
const inputContratoAssinado = ref(null)
const pdfAssinadoArquivoId = ref(null)
const excluindoPdfAssinado = ref(false)
const statusInicial = ref('RASCUNHO')
const vendaOptions = ref([])
const contratoCliente = ref(null)
const telefoneCliente = computed(() => {
  const c = contratoCliente.value
  const t = c?.whatsapp ?? c?.telefone ?? ''
  const digits = String(t).replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-11)
  return digits || ''
})
const emailCliente = computed(() => {
  const c = contratoCliente.value
  const e = (c?.email ?? c?.email_secundario ?? '').trim()
  return e || ''
})
/** Regra: contrato não pode ser gerado se o cliente não for validado (nome, documento, endereço completos). */
const clientePendenteValidacao = computed(
  () =>
    !isEdit.value &&
    !!contratoCliente.value &&
    clientePrecisaValidacaoParaContrato(contratoCliente.value),
)

const statusOptions = [
  { label: 'Rascunho', value: 'RASCUNHO' },
  { label: 'Vigente', value: 'VIGENTE' },
  { label: 'Encerrado', value: 'ENCERRADO' },
  { label: 'Cancelado', value: 'CANCELADO' },
]

const form = ref({
  venda_id: null,
  numero: '',
  descricao: '',
  status: 'RASCUNHO',
  valor: 0,
  data_inicio: '',
  data_fim: '',
})

function hojeYmd() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addOneYearYmd(ymd) {
  if (!ymd) return ''
  const [y, m, d] = String(ymd).split('-').map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ''
  const dt = new Date(y, m - 1, d)
  dt.setFullYear(dt.getFullYear() + 1)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/** Normaliza valor vindo da API (ISO, Date, YYYY-MM-DD) para YYYY-MM-DD do input date. */
function normalizarYmd(val) {
  if (val == null || val === '') return ''
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const dataFimMaximo = computed(() => addOneYearYmd(form.value.data_inicio))
const dataFimMaximoLabel = computed(() => formatYmdBr(dataFimMaximo.value))

function formatYmdBr(ymd) {
  if (!ymd) return '--/--/----'
  const [y, m, d] = String(ymd).split('-')
  if (!y || !m || !d) return '--/--/----'
  return `${d}/${m}/${y}`
}

function montarLabelVenda(v) {
  return `Venda #${v.id} - ${v.cliente?.nome_completo || v.cliente?.nome || '-'} (${numeroParaMoeda(v.valor_vendido || v.valor_total)})`
}

function garantirOpcaoVenda(v) {
  if (!v?.id) return
  const id = Number(v.id)
  if (!Number.isFinite(id) || id <= 0) return
  const idx = vendaOptions.value.findIndex((opt) => Number(opt.value) === id)
  const option = { label: montarLabelVenda(v), value: id }
  if (idx >= 0) {
    vendaOptions.value[idx] = option
  } else {
    vendaOptions.value.unshift(option)
  }
}

function sugerirNumeroContrato(vendaId) {
  if (form.value.numero && form.value.numero.trim().length > 0) return
  const ano = new Date().getFullYear()
  const seqBase = vendaId && Number.isFinite(vendaId) ? Number(vendaId) : Date.now() % 1000
  const sequencial = String(seqBase).padStart(3, '0')
  form.value.numero = `CONT-${ano}-${sequencial}`
}

function moedaParaNumero(str) {
  if (str == null || str === '') return 0
  const s = String(str).replace(/\D/g, '')
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n / 100 : 0
}

function numeroParaMoeda(num) {
  const n = Number(num)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const valorMask = computed(() => numeroParaMoeda(form.value.valor))

function onValorInput(ev) {
  form.value.valor = moedaParaNumero(ev.target.value)
}

async function carregarVendas() {
  try {
    const res = await VendaService.listar()
    const lista = Array.isArray(res?.data) ? res.data : []
    vendaOptions.value = lista.map((v) => ({
      label: montarLabelVenda(v),
      value: v.id,
    }))
  } catch (e) {
    vendaOptions.value = []
  }
}

async function carregarContrato() {
  if (!isEdit.value) {
    loading.value = false
    form.value.status = 'RASCUNHO'
    form.value.data_inicio = hojeYmd()
    form.value.data_fim = addOneYearYmd(form.value.data_inicio)
    statusInicial.value = 'RASCUNHO'
    // Pré-preenche cliente/venda quando vier de uma venda específica
    if (vendaIdFromQuery.value) {
      try {
        const res = await VendaService.buscar(vendaIdFromQuery.value)
        const v = res?.data ?? res
        form.value.venda_id = vendaIdFromQuery.value
        form.value.valor = Number(v?.valor_vendido || v?.valor_total || 0)
        contratoCliente.value = v?.cliente ?? null
        garantirOpcaoVenda(v)
      } catch (e) {
        // se falhar, só ignora e deixa o contrato em branco
      }
      sugerirNumeroContrato(vendaIdFromQuery.value)
    } else {
      sugerirNumeroContrato(null)
    }
    return
  }
  try {
    const { data } = await ContratosService.buscar(contratoId.value)
    const raw = data?.data ?? data
    contratoCliente.value = raw?.cliente ?? null
    // Se o contrato não veio com cliente ou cliente sem contato, busca pela venda (cadastro do cliente)
    if (raw?.venda_id && (!contratoCliente.value || (!(contratoCliente.value?.email || contratoCliente.value?.whatsapp || contratoCliente.value?.telefone)))) {
      try {
        const resVenda = await VendaService.buscar(raw.venda_id)
        const v = resVenda?.data ?? resVenda
        if (v?.cliente) contratoCliente.value = v.cliente
      } catch (_) {}
    }
    const dataInicio = normalizarYmd(raw?.data_inicio)
    const dataFim = normalizarYmd(raw?.data_fim)
    form.value = {
      cliente_id: raw?.cliente_id,
      venda_id: raw?.venda_id ?? null,
      numero: raw?.numero || '',
      descricao: raw?.descricao || '',
      status: raw?.status || 'RASCUNHO',
      valor: Number(raw?.valor || 0),
      data_inicio: dataInicio,
      data_fim: dataFim || addOneYearYmd(dataInicio),
    }
    statusInicial.value = String(raw?.status || 'RASCUNHO').toUpperCase()
    pdfAssinadoArquivoId.value = raw?.pdf_assinado_arquivo_id ?? null
  } catch (e) {
    notify.error('Contrato não encontrado.')
    router.push('/contratos')
  } finally {
    loading.value = false
  }
}

// Ao trocar a venda no formulário, atualiza o cliente (e-mail/WhatsApp do cadastro)
watch(
  () => form.value.venda_id,
  async (vendaId) => {
    if (!vendaId) {
      contratoCliente.value = null
      return
    }
    try {
      const res = await VendaService.buscar(vendaId)
      const v = res?.data ?? res
      contratoCliente.value = v?.cliente ?? null
      garantirOpcaoVenda(v)
    } catch (_) {
      contratoCliente.value = null
    }
  },
)

function abrirSeletorArquivo() {
  inputContratoAssinado.value?.click?.()
}

function onFileContratoAssinadoChange(ev) {
  const f = ev.target?.files?.[0]
  if (f && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)))
    arquivoContratoAssinado.value = f
  ev.target.value = ''
}

async function enviarContratoAssinado() {
  const file = arquivoContratoAssinado.value
  if (!file || !can('contratos.editar')) return
  const id = Number(String(contratoId.value).replace(/\D/g, ''))
  if (!id) return notify.error('Contrato inválido.')
  incluirAssinadoLoading.value = true
  try {
    await ContratosService.vigenteAssinaturaPresencial(id, file)
    notify.success('Contrato assinado incluído e marcado como vigente.')
    form.value.status = 'VIGENTE'
    arquivoContratoAssinado.value = null
    await carregarContrato()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao incluir contrato assinado.')
  } finally {
    incluirAssinadoLoading.value = false
  }
}

async function excluirPdfAssinado() {
  if (!can('contratos.editar')) return notify.error('Sem permissão para editar contrato.')
  const id = Number(String(contratoId.value).replace(/\D/g, ''))
  if (!id) return notify.error('Contrato inválido.')
  excluindoPdfAssinado.value = true
  try {
    await ContratosService.excluirPdfAssinado(id)
    notify.success('PDF assinado excluído.')
    pdfAssinadoArquivoId.value = null
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao excluir PDF assinado.')
  } finally {
    excluindoPdfAssinado.value = false
  }
}

/** Abre URL externa (Tauri/web) sem sair da página atual do ERP. */
async function abrirUrlExterno(url, preOpenedWindow = null) {
  const isTauri = typeof window !== 'undefined' && (window.__TAURI__ || window.__TAURI_INTERNALS__)
  if (isTauri) {
    try {
      // Tauri 2 (recomendado): usa plugin-opener pelo pacote JS.
      const openerMod = await import('@tauri-apps/plugin-opener').catch(() => null)
      if (openerMod) {
        if (typeof openerMod.openUrl === 'function') {
          await openerMod.openUrl(url)
          return true
        }
        if (typeof openerMod.open === 'function') {
          await openerMod.open(url)
          return true
        }
        if (typeof openerMod.openPath === 'function') {
          await openerMod.openPath(url)
          return true
        }
      }
      const tauri = window.__TAURI__ ?? window.__TAURI_INTERNALS__
      if (tauri?.opener?.open) {
        await tauri.opener.open(url)
        return true
      }
      if (typeof tauri?.opener?.openUrl === 'function') {
        await tauri.opener.openUrl(url)
        return true
      }
      if (tauri?.shell?.open) {
        await tauri.shell.open(url)
        return true
      }
    } catch (e) {
      return false
    }
  }
  if (preOpenedWindow && !preOpenedWindow.closed) {
    preOpenedWindow.location.href = url
    preOpenedWindow.focus?.()
    return true
  }
  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (opened) return true
  } catch (_) {}
  return false
}

async function salvar() {
  if (!isEdit.value && !can('contratos.criar')) return notify.error('Sem permissão para criar contrato.')
  if (isEdit.value && !can('contratos.editar')) return notify.error('Sem permissão para editar contrato.')
  if (clientePendenteValidacao.value) {
    return notify.error(
      'O contrato não pode ser gerado enquanto o cliente não for validado. Valide o contratante na venda (botão "Validar contratante") antes de criar o contrato.',
    )
  }

  const payload = {
    venda_id: form.value.venda_id || null,
    numero: form.value.numero.trim(),
    descricao: form.value.descricao?.trim() || null,
    status: form.value.status,
    valor: form.value.valor,
    data_inicio: form.value.data_inicio || null,
    data_fim: form.value.data_fim || null,
  }

  if (!payload.venda_id) return notify.error('Selecione a venda. O contrato só pode ser criado a partir de uma venda.')
  if (!payload.data_inicio) payload.data_inicio = hojeYmd()
  if (!payload.data_fim) return notify.error('Informe a data de término do contrato.')
  const inicio = new Date(`${payload.data_inicio}T00:00:00`)
  const fim = new Date(`${payload.data_fim}T00:00:00`)
  const fimMax = new Date(`${addOneYearYmd(payload.data_inicio)}T00:00:00`)
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return notify.error('Datas do contrato inválidas.')
  if (fim < inicio) return notify.error('A data de término não pode ser menor que a data de início.')
  if (fim > fimMax) return notify.error('A data de término deve ser em até 1 ano após a data de início.')

  salvando.value = true
  try {
    if (isEdit.value) {
      await ContratosService.salvar(contratoId.value, payload)
      notify.success('Contrato atualizado.')
      closeTabAndGo('/contratos')
    } else {
      const { data } = await ContratosService.salvar(null, payload)
      notify.success('Contrato criado. Gere o PDF e envie por WhatsApp ou e-mail.')
      const novoId = data?.id ?? data?.data?.id
      if (novoId) {
        closeTabAndGo(`/contratos/${novoId}`)
      } else {
        closeTabAndGo('/contratos')
      }
      return
    }
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao salvar contrato.')
  } finally {
    salvando.value = false
  }
}

async function gerarPdfContrato() {
  if (!can('contratos.ver')) return notify.error('Acesso negado.')
  if (!isEdit.value) {
    return notify.error('Salve o contrato antes de gerar o PDF.')
  }

  gerandoPdf.value = true
  try {
    const id = Number(String(contratoId.value).replace(/\D/g, ''))
    if (!id) return notify.error('ID do contrato inválido.')

    const { data } = await ContratosService.abrirPdf(id)
    const arquivoId = data?.arquivoId
    if (!arquivoId) return notify.error('Não retornou arquivoId.')

    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const q = new URLSearchParams({
      name: `CONTRATO_${id}.pdf`,
      type: 'application/pdf',
      contratoId: String(id),
    })
    const url = `${base}/arquivos/${String(arquivoId).replace(/\D/g, '')}?${q.toString()}`
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (opened) {
      notify.success('PDF aberto em nova aba. Você pode imprimir e depois enviar o contrato assinado aqui na mesma tela.')
    } else {
      await router.push({ path: `/arquivos/${String(arquivoId).replace(/\D/g, '')}`, query: { name: `CONTRATO_${id}.pdf`, type: 'application/pdf', contratoId: String(id) } })
    }
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || 'Erro ao gerar PDF do contrato.'
    notify.error(msg)
  } finally {
    gerandoPdf.value = false
  }
}

// Gera link público e abre WhatsApp com mensagem pronta.
async function enviarPorWhatsApp() {
  if (obterLinkLoading.value) return
  const id = Number(String(contratoId.value).replace(/\D/g, ''))
  if (!id) return notify.error('Contrato inválido.')
  if (!telefoneCliente.value) return notify.error('Cliente não possui telefone/WhatsApp cadastrado.')
  const isTauri = typeof window !== 'undefined' && (window.__TAURI__ || window.__TAURI_INTERNALS__)
  // Pré-abre aba para evitar bloqueio de popup após await (apenas web).
  const popup = isTauri ? null : window.open('about:blank', '_blank', 'noopener,noreferrer')
  obterLinkLoading.value = true
  try {
    const { data } = await ContratosService.linkPublicoPdf(id)
    const link = data?.link || data?.linkPdf
    if (!link) return notify.error('Não foi possível gerar o link do contrato.')
    const msg = `Olá! Segue o link para visualizar e baixar o PDF do contrato: ${link}`
    const numero = String(telefoneCliente.value).replace(/\D/g, '')
    const phone = numero.length >= 11 ? numero.slice(-11) : numero
    const msgEnc = encodeURIComponent(msg)
    const waShort = `https://wa.me/55${phone}?text=${msgEnc}`
    const waWeb = `https://web.whatsapp.com/send?phone=55${phone}&text=${msgEnc}`
    let abriu = false
    if (isTauri) {
      // Em Tauri, abre sempre fora do app para manter o ERP em foco.
      if (!abriu) abriu = await abrirUrlExterno(waWeb, null)
      if (!abriu) abriu = await abrirUrlExterno(waShort, null)
    } else {
      abriu = await abrirUrlExterno(waShort, popup)
      if (!abriu) abriu = await abrirUrlExterno(waWeb, popup)
    }
    if (abriu) {
      notify.success('WhatsApp aberto com a mensagem pronta.')
    } else {
      popup?.close?.()
      try {
        await navigator.clipboard.writeText(waWeb)
        notify.success('Não foi possível abrir automaticamente. Link do WhatsApp copiado para área de transferência.')
      } catch (_) {
        notify.error('Não foi possível abrir o WhatsApp automaticamente. Tente novamente.')
      }
    }
  } catch (e) {
    popup?.close?.()
    notify.error(e?.response?.data?.message || 'Erro ao gerar link para WhatsApp.')
  } finally {
    obterLinkLoading.value = false
  }
}

// Enviar e-mail automaticamente pelo backend (SMTP do .env) - não abre o app de e-mail
async function enviarContratoPorEmailSistema() {
  if (enviarEmailLoading.value) return
  const id = Number(String(contratoId.value).replace(/\D/g, ''))
  if (!id) return notify.error('Contrato inválido.')
  if (!emailCliente.value) {
    notify.error('Cliente não possui e-mail cadastrado.')
    return
  }
  enviarEmailLoading.value = true
  try {
    await ContratosService.enviarContratoPorEmail(id)
    notify.success('E-mail enviado com sucesso para o cliente.')
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao enviar e-mail.')
  } finally {
    enviarEmailLoading.value = false
  }
}

onMounted(async () => {
  await carregarVendas()
  await carregarContrato()
})
</script>


