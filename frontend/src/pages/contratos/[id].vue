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
              <VueDatePicker
                v-model="dataFimDate"
                :min-date="dataInicioDate"
                :max-date="dataFimMaximoDate"
                :time-picker="false"
                format="dd/MM/yyyy"
                :locale="ptBR"
                auto-apply
                :text-input="{ format: 'dd/MM/yyyy', openMenu: true, enterSubmit: true, tabSubmit: true }"
                placeholder="DD/MM/AAAA"
              />
            </div>
            <p class="col-span-12 md:col-span-6 -mt-3 text-xs text-text-soft">
              Data prévia até {{ dataFimMaximoLabel }}.
            </p>
          </div>

          <!-- Compartilhar contrato (assinatura quando rascunho; PDF quando já assinado) -->
          <section
            v-if="isEdit"
            class="rounded-2xl border border-border-ui bg-bg-page p-6 space-y-4"
          >
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              {{ isContratoAssinado ? 'Compartilhar contrato assinado' : 'Enviar para assinatura' }}
            </div>
            <p class="text-sm text-text-soft">
              {{
                isContratoAssinado
                  ? 'Contrato já assinado. Você pode reenviar o PDF por WhatsApp ou por e-mail para leitura/arquivo.'
                  : 'Envie o contrato para o cliente assinar por WhatsApp ou por e-mail. Após a assinatura, o contrato ficará vigente.'
              }}
            </p>

            <div class="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
              <p class="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Envio por WhatsApp e e-mail
              </p>
              <p class="text-xs text-text-soft">
                {{
                  isContratoAssinado
                    ? 'No WhatsApp abre a mensagem com link do PDF. No e-mail envia automaticamente pelo sistema usando o SMTP configurado no servidor.'
                    : 'No WhatsApp abre a mensagem com link para leitura e assinatura. No e-mail envia automaticamente pelo sistema usando o SMTP configurado no servidor.'
                }}
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
            </div>
            <p v-if="!telefoneCliente" class="text-xs text-amber-600 dark:text-amber-400">
              Cadastre o telefone do cliente para habilitar o envio por WhatsApp.
            </p>
            <p v-if="!emailCliente" class="text-xs text-amber-600 dark:text-amber-400">
              Cadastre o e-mail do cliente para habilitar o envio por e-mail.
            </p>
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
                :disabled="salvando"
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
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { ptBR } from 'date-fns/locale'

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
const isContratoAssinado = computed(() => String(form.value.status || '').toUpperCase() === 'VIGENTE')

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

const dataFimMaximo = computed(() => addOneYearYmd(form.value.data_inicio))
const dataFimMaximoLabel = computed(() => formatYmdBr(dataFimMaximo.value))
const dataInicioDate = computed(() => parseYmdLocal(form.value.data_inicio))
const dataFimMaximoDate = computed(() => parseYmdLocal(dataFimMaximo.value))
const dataFimDate = ref(null)

function formatYmdBr(ymd) {
  if (!ymd) return '--/--/----'
  const [y, m, d] = String(ymd).split('-')
  if (!y || !m || !d) return '--/--/----'
  return `${d}/${m}/${y}`
}

function parseYmdLocal(ymd) {
  if (!ymd) return null
  const [y, m, d] = String(ymd).split('-').map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
  const dt = new Date(y, m - 1, d)
  return Number.isNaN(dt.getTime()) ? null : dt
}

function formatDateYmd(v) {
  if (!v) return ''
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

watch(
  () => form.value.data_fim,
  (v) => {
    const parsed = parseYmdLocal(v)
    const current = dataFimDate.value instanceof Date ? dataFimDate.value.getTime() : null
    const next = parsed instanceof Date ? parsed.getTime() : null
    if (current !== next) dataFimDate.value = parsed
  },
  { immediate: true },
)

watch(dataFimDate, (v) => {
  const next = formatDateYmd(v)
  if (form.value.data_fim !== next) form.value.data_fim = next
})


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
    form.value = {
      cliente_id: raw?.cliente_id,
      venda_id: raw?.venda_id ?? null,
      numero: raw?.numero || '',
      descricao: raw?.descricao || '',
      status: raw?.status || 'RASCUNHO',
      valor: Number(raw?.valor || 0),
      data_inicio: raw?.data_inicio ? String(raw.data_inicio).slice(0, 10) : '',
      data_fim: raw?.data_fim ? String(raw.data_fim).slice(0, 10) : '',
    }
    statusInicial.value = String(raw?.status || 'RASCUNHO').toUpperCase()
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

/** Abre URL externa (Tauri/web) sem sair da página atual do ERP. */
async function abrirUrlExterno(url, preOpenedWindow = null) {
  const isTauri = typeof window !== 'undefined' && (window.__TAURI__ || window.__TAURI_INTERNALS__)
  if (isTauri) {
    try {
      const tauri = window.__TAURI__ ?? window.__TAURI_INTERNALS__
      if (tauri?.opener?.open) {
        await tauri.opener.open(url)
        return
      }
      if (typeof tauri?.opener?.openUrl === 'function') {
        await tauri.opener.openUrl(url)
        return
      }
      if (tauri?.shell?.open) {
        await tauri.shell.open(url)
        return
      }
    } catch (e) {
      console.error('[Contrato] Tauri open:', e)
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
  if (
    String(payload.status || '').toUpperCase() === 'VIGENTE' &&
    statusInicial.value !== 'VIGENTE'
  ) {
    return notify.error('Para segurança, use apenas o link de assinatura do contrato.')
  }

  salvando.value = true
  try {
    if (isEdit.value) {
      await ContratosService.salvar(contratoId.value, payload)
      notify.success('Contrato atualizado.')
      closeTabAndGo('/contratos')
    } else {
      const { data } = await ContratosService.salvar(null, payload)
      notify.success('Contrato criado. Use os botões abaixo para gerar PDF e enviar por WhatsApp ou e-mail.')
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

    await router.push({
      path: `/arquivos/${String(arquivoId).replace(/\D/g, '')}`,
      query: {
        name: `CONTRATO_${String(id).replace(/\D/g, '')}.pdf`,
        type: 'application/pdf',
      },
    })
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
  // Pré-abre aba para evitar bloqueio de popup após await.
  const popup = window.open('about:blank', '_blank', 'noopener,noreferrer')
  obterLinkLoading.value = true
  try {
    const { data } = await ContratosService.linkPublicoPdf(id)
    const link = data?.link || data?.linkPdf || data?.linkAceitar
    if (!link) return notify.error('Não foi possível gerar o link do contrato.')
    const msg = isContratoAssinado.value
      ? `Olá! Segue o link para visualizar e baixar o contrato assinado: ${link}`
      : `Olá! Segue o link para ler e assinar o contrato: ${link}`
    const numero = String(telefoneCliente.value).replace(/\D/g, '')
    const phone = numero.length >= 11 ? numero.slice(-11) : numero
    const wa = `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`
    const abriu = await abrirUrlExterno(wa, popup)
    if (abriu) {
      notify.success('WhatsApp aberto com a mensagem pronta.')
    } else {
      popup?.close?.()
      try {
        await navigator.clipboard.writeText(wa)
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


