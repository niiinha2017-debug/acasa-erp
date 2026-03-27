<template>
  <PageShell :padded="false" variant="minimal">
    <section class="login-font ds-page-context ds-page-context--list animate-page-in">
      <PageHeader
        title="Etapa 3 — Gerar Markup"
        subtitle="Revise parcelas, comissão, NF e taxas. Esta é a etapa final do fluxo após importar arquivos e validar o status."
        icon="pi pi-percentage"
        variant="minimal"
      >
        <template #actions>
          <Button variant="secondary" size="sm" @click="router.push(`/arquivos/importacao/${clienteId}`)">
            <i class="pi pi-arrow-left" />
            Voltar à importação
          </Button>
          <Button type="button" variant="secondary" size="sm" :loading="loading" @click="carregar">
            <i class="pi pi-refresh" />
            Reler contrato
          </Button>
        </template>
      </PageHeader>

      <div class="ds-page-context__content px-4 md:px-8 pb-8 pt-5 space-y-6">
        <div v-if="loading && !resultado" class="py-16 text-center text-text-muted font-semibold">
          <i class="pi pi-spin pi-spinner text-2xl" />
          <p class="mt-2">Lendo contrato...</p>
        </div>

        <template v-else-if="resultado">
          <div
            v-if="resultado.alertas?.length"
            class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/30 px-4 py-3 space-y-2"
          >
            <div class="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">
              Alertas
            </div>
            <ul class="list-disc pl-5 text-sm text-text-main space-y-1">
              <li v-for="(a, i) in resultado.alertas" :key="i">{{ a }}</li>
            </ul>
          </div>

          <div class="ds-card ds-card--default p-5 space-y-4">
            <h2 class="text-sm font-black uppercase tracking-wider text-text-muted">Dados do contrato</h2>
            <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div>
                <dt class="text-[10px] font-bold uppercase text-text-muted">Cliente</dt>
                <dd class="font-semibold text-text-main">{{ resultado.financeiro?.nome_cliente || '—' }}</dd>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold uppercase text-text-muted">Valor da venda</label>
                <input
                  v-model="valorVendaEditavel"
                  type="text"
                  inputmode="decimal"
                  placeholder="Ex: 35.000,00"
                  class="w-full rounded-lg border border-border-ui bg-[var(--ds-color-surface)] px-3 py-2 text-sm tabular-nums font-semibold text-text-main"
                  @blur="onBlurValorVenda"
                />
                <p class="text-[10px] text-text-muted">Lido do contrato: {{ formatValor(resultado.financeiro?.valor_total) }}</p>
              </div>
              <div>
                <dt class="text-[10px] font-bold uppercase text-text-muted">Data de fechamento</dt>
                <dd class="font-semibold text-text-main">{{ resultado.financeiro?.data_fechamento ? formatDateIso(resultado.financeiro.data_fechamento) : '—' }}</dd>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold uppercase text-text-muted">Entrega prevista (OS)</label>
                <input
                  v-model="dataEntregaEditavel"
                  type="date"
                  class="w-full rounded-lg border border-border-ui bg-[var(--ds-color-surface)] px-3 py-2 text-sm text-text-main"
                />
                <p class="text-[10px] text-text-muted">{{ dataEntregaEditavel ? '' : 'Sem data: será usado 30 dias a partir de hoje' }}</p>
              </div>
            </dl>

            <div v-if="parcelasNormalizadas.length" class="border-t border-border-ui pt-4">
              <h3 class="text-[10px] font-black uppercase text-text-muted mb-2">Parcelas (PDF)</h3>
              <div class="overflow-x-auto rounded-lg border border-border-ui">
                <table class="min-w-full text-xs">
                  <thead>
                    <tr class="bg-[var(--ds-color-surface-muted)] text-left text-text-muted">
                      <th class="px-3 py-2 font-bold">#</th>
                      <th class="px-3 py-2 font-bold">Vencimento</th>
                      <th class="px-3 py-2 font-bold">Valor</th>
                      <th class="px-3 py-2 font-bold">Forma</th>
                      <th class="px-3 py-2 font-bold">Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(p, idx) in parcelasNormalizadas" :key="idx" class="border-t border-border-ui">
                      <td class="px-3 py-2 tabular-nums text-text-muted">{{ idx + 1 }}</td>
                      <td class="px-3 py-2 tabular-nums">{{ p.vencimento ? formatDateIso(p.vencimento) : '—' }}</td>
                      <td class="px-3 py-2 tabular-nums font-semibold">{{ formatValor(p.valor) }}</td>
                      <td class="px-3 py-2">{{ p.forma || '—' }}</td>
                      <td class="px-3 py-2 text-text-muted max-w-[14rem] truncate" :title="p.descricao">{{ p.descricao || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div
            v-if="resultado?.financeiro && valorBruto > 0"
            class="ds-card ds-card--default p-5 space-y-5 border-l-4 border-l-emerald-500/80"
          >
            <h2 class="text-sm font-black uppercase tracking-wider text-text-muted">Markup</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
              <div class="space-y-1">
                <label class="text-[10px] font-bold uppercase text-text-muted">Taxa cartão (processamento)</label>
                <div class="rounded-lg border border-border-ui bg-[var(--ds-color-surface-muted)] px-3 py-2 text-sm tabular-nums font-semibold">
                  {{ formatValor(valorTaxasCartaoProcessamento) }}
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold uppercase text-text-muted">Antecipação (crédito)</label>
                <div class="rounded-lg border border-border-ui bg-[var(--ds-color-surface-muted)] px-3 py-2 text-sm tabular-nums font-semibold">
                  {{ formatValor(valorTaxasCartaoAntecipacao) }}
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold uppercase text-text-muted">Taxas totais (cartão)</label>
                <div class="rounded-lg border border-border-ui bg-[var(--ds-color-surface-muted)] px-3 py-2 text-sm tabular-nums font-semibold">
                  {{ formatValor(valorTaxasCartao) }}
                </div>
                <p class="text-[10px] text-text-muted">
                  {{ parcelasCartaoCount ? `${parcelasCartaoCount} parcela(s) em CARTÃO` : 'Sem parcelas em cartão' }}
                </p>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold uppercase text-text-muted flex items-center gap-2">
                  <input v-model="temNotaFiscal" type="checkbox" class="rounded border-border-ui" />
                  Nota fiscal (impostos %)
                </label>
                <input
                  :value="taxaNotaPercentual"
                  type="text"
                  inputmode="decimal"
                  :disabled="!temNotaFiscal"
                  class="w-full rounded-lg border border-border-ui bg-[var(--ds-color-surface)] px-3 py-2 text-sm tabular-nums disabled:opacity-50"
                  @input="onInputPercentualNota"
                />
                <p class="text-[10px] text-text-muted">Valor: {{ formatValor(valorImpostoNota) }}</p>
              </div>
            </div>

            <div class="border-t border-border-ui pt-4">
              <h3 class="text-[10px] font-black uppercase text-text-muted mb-3">Nomes dos comissionados</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div v-for="(slot, idx) in slotsComissionados" :key="slot.key" class="space-y-1">
                  <label class="text-[10px] font-bold uppercase text-text-muted" :for="`com-nome-${slot.key}`">
                    {{ slot.label }} (nome)
                  </label>
                  <input
                    :id="`com-nome-${slot.key}`"
                    v-model="comissionadosNomes[slot.key]"
                    type="text"
                    autocomplete="off"
                    maxlength="120"
                    :placeholder="`Quem recebe comissão de ${slot.label.toLowerCase()}`"
                    class="w-full rounded-lg border border-border-ui bg-[var(--ds-color-surface)] px-3 py-2 text-sm text-text-main placeholder:text-text-muted/70"
                  />
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-border-ui bg-[var(--ds-color-surface-muted)] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div>
                <div class="text-[10px] font-bold uppercase text-text-muted">Valor bruto (contrato)</div>
                <div class="text-lg font-black tabular-nums text-text-main">{{ formatValor(valorBruto) }}</div>
              </div>
              <div>
                <div class="text-[10px] font-bold uppercase text-text-muted">Deduções</div>
                <ul class="mt-1 space-y-0.5 text-xs tabular-nums">
                  <li class="flex justify-between gap-2"><span>Impostos (NF)</span><span>− {{ formatValor(valorImpostoNota) }}</span></li>
                  <li class="flex justify-between gap-2">
                    <span>Comissões <span class="text-text-muted">({{ percentualComissaoAplicado.toFixed(2).replace('.', ',') }}%)</span></span>
                    <span>− {{ formatValor(valorComissao) }}</span>
                  </li>
                  <li class="flex justify-between gap-2"><span>Taxas cartão (processamento)</span><span>− {{ formatValor(valorTaxasCartaoProcessamento) }}</span></li>
                  <li class="flex justify-between gap-2"><span>Antecipação (crédito)</span><span>− {{ formatValor(valorTaxasCartaoAntecipacao) }}</span></li>
                </ul>
              </div>
              <div class="sm:col-span-2 lg:col-span-1 flex flex-col justify-center">
                <div class="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">Valor líquido</div>
                <div class="text-2xl font-black tabular-nums text-emerald-700 dark:text-emerald-300">
                  {{ formatValor(valorLiquidoMarkup) }}
                </div>
              </div>
            </div>

            <div v-if="avisosMarkup.length" class="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/25 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
              <span class="font-bold">Validação:</span>
              <ul class="list-disc pl-5 mt-1 space-y-0.5">
                <li v-for="(av, i) in avisosMarkup" :key="i">{{ av }}</li>
              </ul>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <Button
                v-if="podeSalvarContasReceber"
                type="button"
                variant="primary"
                size="sm"
                :loading="salvandoContasReceber"
                :disabled="salvandoContasReceber || valorBruto <= 0"
                @click="validarESalvarContasReceber"
              >
                <i class="pi pi-check-circle" />
                Validar e salvar no Contas a Receber
              </Button>
              <span v-else class="text-xs text-text-muted">
                Permissão «contas a receber: criar» necessária para gravar.
              </span>
            </div>
          </div>
        </template>

        <div v-else-if="erro" class="ds-alert ds-alert--warning text-sm">
          {{ erro }}
        </div>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import {
  COMISSOES,
  TAXAS_CARTAO,
  TAXA_NOTA_FISCAL,
  getTaxaAntecipacaoPercentual,
} from '@/constantes'

definePage({ meta: { perm: ['clientes.ver', 'arquivos.ver'] } })

const route = useRoute()
const router = useRouter()

const clienteId = computed(() => String(route.params.clienteId || '').replace(/\D/g, ''))

const loading = ref(false)
const resultado = ref(null)
const erro = ref('')

/** Valor da venda editável pelo usuário (string para permitir formatação BR). */
const valorVendaEditavel = ref('')
/** Data de entrega editável (formato yyyy-mm-dd para input[type=date]). */
const dataEntregaEditavel = ref('')

/** Nomes por papel — objeto para reatividade estável ao digitar. */
const comissionadosNomes = ref({
  VENDEDOR: '',
  ARQUITETO: '',
  PROJETISTA: '',
})
const temNotaFiscal = ref(true)
const taxaNotaPercentual = ref(Number(TAXA_NOTA_FISCAL?.taxa ?? 4.5))
const salvandoContasReceber = ref(false)

const podeSalvarContasReceber = computed(() => can('contas_receber.criar'))

/** Ordem fixa dos 3 campos de nome (mesmas chaves que COMISSOES). */
const slotsComissionados = computed(() => {
  const ordem = ['VENDEDOR', 'ARQUITETO', 'PROJETISTA']
  return ordem.map((key) => ({
    key,
    label: COMISSOES?.[key]?.label || key,
  }))
})

function normalizarParcelasRaw(raw) {
  if (raw == null) return []
  let arr = raw
  if (!Array.isArray(arr)) {
    if (typeof arr === 'object' && Array.isArray(arr.parcelas)) {
      arr = arr.parcelas
    } else if (typeof arr === 'object' && arr !== null) {
      arr = [arr]
    } else {
      return []
    }
  }
  const out = []
  for (const p of arr) {
    if (!p || typeof p !== 'object') continue
    const valor = Number(p.valor ?? p.valor_parcela ?? p.value ?? 0)
    if (!Number.isFinite(valor) || valor <= 0) continue
    const vencimento = p.vencimento ?? p.data ?? p.data_vencimento ?? null
    const forma = String(p.forma || p.forma_pagamento || 'OUTROS')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
    const descricao = String(p.descricao ?? p.texto ?? '').trim()
    out.push({ valor, vencimento, forma, descricao })
  }
  return out
}

const parcelasNormalizadas = computed(() => normalizarParcelasRaw(resultado.value?.financeiro?.parcelas))

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

function taxaProcessamentoCartaoPercentParaParcela(p) {
  const d = String(p.descricao || '').toLowerCase()
  const deb = TAXAS_CARTAO?.DEBITO
  const cred = TAXAS_CARTAO?.CREDITO
  if (/d[eé]bito|debito/i.test(d) && deb && Number(deb.taxa) >= 0) {
    return Number(deb.taxa)
  }
  const m = d.match(/(\d+)\s*x\b/)
  const n = m ? Math.min(18, Math.max(1, parseInt(m[1], 10))) : 1
  const map = cred?.parcelas || {}
  return Number(map[n] ?? map[12] ?? 3.49)
}

function taxaAntecipacaoCreditoPercentParaParcela(p) {
  const d = String(p.descricao || '').toLowerCase()
  if (/d[eé]bito|debito/i.test(d)) return 0
  return Number(getTaxaAntecipacaoPercentual('CREDITO') || 0)
}

const parcelasCartaoCount = computed(() =>
  parcelasNormalizadas.value.filter((p) => p.forma === 'CARTAO').length,
)

const valorTaxasCartaoProcessamento = computed(() => {
  let s = 0
  for (const p of parcelasNormalizadas.value) {
    if (p.forma !== 'CARTAO') continue
    const pct = taxaProcessamentoCartaoPercentParaParcela(p)
    s += (Number(p.valor) * pct) / 100
  }
  return round2(s)
})

const valorTaxasCartaoAntecipacao = computed(() => {
  let s = 0
  for (const p of parcelasNormalizadas.value) {
    if (p.forma !== 'CARTAO') continue
    const pct = taxaAntecipacaoCreditoPercentParaParcela(p)
    s += (Number(p.valor) * pct) / 100
  }
  return round2(s)
})

const valorTaxasCartao = computed(() =>
  round2(valorTaxasCartaoProcessamento.value + valorTaxasCartaoAntecipacao.value),
)
const temAntecipacaoMarkup = computed(() => valorTaxasCartaoAntecipacao.value > 0)

const valorBruto = computed(() => {
  const editado = parseNumBr(valorVendaEditavel.value)
  if (Number.isFinite(editado) && editado > 0) return round2(editado)
  const v = Number(resultado.value?.financeiro?.valor_total)
  if (Number.isFinite(v) && v > 0) return round2(v)
  const sum = parcelasNormalizadas.value.reduce((acc, p) => acc + Number(p.valor), 0)
  return round2(sum)
})

/** Soma os % de COMISSOES para cada papel em que há nome preenchido. */
const comissaoPercentualSomadaPorNomes = computed(() => {
  let s = 0
  for (const slot of slotsComissionados.value) {
    const nome = String(comissionadosNomes.value[slot.key] || '').trim()
    if (nome) s += Number(COMISSOES?.[slot.key]?.percentual ?? 0)
  }
  return round2(s)
})

const percentualComissaoAplicado = computed(() => comissaoPercentualSomadaPorNomes.value)

const valorComissao = computed(() =>
  round2((valorBruto.value * percentualComissaoAplicado.value) / 100),
)

const valorImpostoNota = computed(() => {
  if (!temNotaFiscal.value) return 0
  const pct = round2(Number(taxaNotaPercentual.value) || 0)
  return round2((valorBruto.value * pct) / 100)
})

const valorLiquidoMarkup = computed(() =>
  round2(
    valorBruto.value - valorImpostoNota.value - valorComissao.value - valorTaxasCartao.value,
  ),
)

function formatValor(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const avisosMarkup = computed(() => {
  const list = []
  const bruto = valorBruto.value
  const somaParc = round2(parcelasNormalizadas.value.reduce((s, p) => s + p.valor, 0))
  if (bruto > 0 && parcelasNormalizadas.value.length > 0) {
    const tol = bruto * 0.02
    if (Math.abs(somaParc - bruto) > tol) {
      list.push(
        `Soma das parcelas do PDF (${formatValor(somaParc)}) difere do valor bruto (${formatValor(bruto)}). O Contas a Receber manterá as parcelas revisadas do PDF.`,
      )
    }
  }
  if (valorLiquidoMarkup.value < 0) {
    list.push('Valor líquido negativo — revise percentuais ou parcelas antes de salvar.')
  }
  if (temAntecipacaoMarkup.value) {
    list.push('Antecipação de crédito ativa: o Contas a Receber será consolidado em parcela única.')
  }
  if (!parcelasNormalizadas.value.length && bruto > 0) {
    list.push('Nenhuma parcela extraída do PDF; ao salvar, será gerada uma conta única com o valor total.')
  }
  return list
})

function parseNumBr(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return 0
  const only = s.replace(/[^\d.,-]/g, '')
  const hasComma = only.includes(',')
  const hasDot = only.includes('.')
  let norm = only
  if (hasComma && !hasDot) norm = only.replace(/\./g, '').replace(',', '.')
  else if (hasComma && hasDot) norm = only.replace(/\./g, '').replace(',', '.')
  else norm = only.replace(',', '.')
  const n = parseFloat(norm)
  return Number.isFinite(n) ? n : 0
}

function onInputPercentualNota(e) {
  taxaNotaPercentual.value = round2(parseNumBr(e?.target?.value))
}

function onBlurValorVenda(e) {
  const n = parseNumBr(e?.target?.value)
  valorVendaEditavel.value = n > 0 ? n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
}

/** Converte ISO (yyyy-mm-dd ou com T) para o formato do input[type=date]. */
function isoParaInputDate(iso) {
  if (!iso) return ''
  const s = String(iso)
  const dpart = s.includes('T') ? s.split('T')[0] : s
  return dpart.match(/^\d{4}-\d{2}-\d{2}$/) ? dpart : ''
}

/** Aplicado apenas quando não há markup salvo para o cliente. */
function aplicarMarkupPadraoContrato() {
  comissionadosNomes.value = { VENDEDOR: '', ARQUITETO: '', PROJETISTA: '' }
  temNotaFiscal.value = true
  taxaNotaPercentual.value = Number(TAXA_NOTA_FISCAL?.taxa ?? 4.5)
  valorVendaEditavel.value = ''
  dataEntregaEditavel.value = isoParaInputDate(resultado.value?.financeiro?.data_entrega_prevista)
}

/** Preenche os campos com os dados da última OS salva. */
function aplicarMarkupSalvo(os) {
  if (!os) return
  temNotaFiscal.value = os.tem_nota_fiscal ?? true
  taxaNotaPercentual.value = Number(os.taxa_nota_percentual ?? TAXA_NOTA_FISCAL?.taxa ?? 4.5)
  const com = os.comissionados ?? {}
  comissionadosNomes.value = {
    VENDEDOR: com.VENDEDOR?.nome ?? '',
    ARQUITETO: com.ARQUITETO?.nome ?? '',
    PROJETISTA: com.PROJETISTA?.nome ?? '',
  }
  // Pré-popula valor e data se salvos anteriormente
  const totalMarkup = os.comissionados?.total_markup
  if (totalMarkup > 0) {
    valorVendaEditavel.value = Number(totalMarkup).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  dataEntregaEditavel.value = isoParaInputDate(resultado.value?.financeiro?.data_entrega_prevista)
}

function formatDateIso(iso) {
  if (!iso) return '—'
  const s = String(iso)
  const dpart = s.includes('T') ? s.split('T')[0] : s
  const m = dpart.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

async function validarESalvarContasReceber() {
  if (!podeSalvarContasReceber.value) {
    notify.error('Sem permissão para criar contas a receber.')
    return
  }
  const id = clienteId.value
  if (!id) return
  const bruto = valorBruto.value
  if (!(bruto > 0)) {
    notify.error('Valor bruto inválido; verifique o contrato.')
    return
  }

  const linhasResumo = [
    `Valor da venda: ${formatValor(bruto)}`,
    `NF (−): ${formatValor(valorImpostoNota.value)}`,
    `Comissão (−): ${formatValor(valorComissao.value)}`,
    `Taxas cartão processamento (−): ${formatValor(valorTaxasCartaoProcessamento.value)}`,
    `Antecipação crédito (−): ${formatValor(valorTaxasCartaoAntecipacao.value)}`,
    `Taxas cartão total (−): ${formatValor(valorTaxasCartao.value)}`,
    `Líquido: ${formatValor(valorLiquidoMarkup.value)}`,
  ]
  const nomesPreenchidos = slotsComissionados.value
    .map((s) => {
      const n = String(comissionadosNomes.value[s.key] || '').trim()
      return n ? `${s.label}: ${n}` : null
    })
    .filter(Boolean)
  if (nomesPreenchidos.length) {
    linhasResumo.push(`Comissionados:\n${nomesPreenchidos.join('\n')}`)
  }
  const avisos = avisosMarkup.value
  const textoAvisos = avisos.length ? `\n\nAtenção:\n${avisos.map((a) => `• ${a}`).join('\n')}` : ''

  const ok = await confirm.show(
    'Validar e salvar no Contas a Receber',
    `Gravar parcelas e demais registros da importação.\n\n${linhasResumo.join('\n')}${textoAvisos}\n\nContinuar?`,
  )
  if (!ok) return

  salvandoContasReceber.value = true
  try {
    const dataEntrega = dataEntregaEditavel.value || undefined

    const comissionadosPayload = {}
    for (const slot of slotsComissionados.value) {
      const nome = String(comissionadosNomes.value[slot.key] || '').trim()
      if (nome) {
        comissionadosPayload[slot.key] = {
          nome,
          percentual: Number(COMISSOES?.[slot.key]?.percentual ?? 0),
        }
      }
    }

    const { data } = await ArquivosService.confirmarImportacaoLeitura(id, {
      ...(dataEntrega ? { data_entrega_prevista: dataEntrega } : {}),
      valor_bruto: valorBruto.value,
      valor_impostos_nf: valorImpostoNota.value,
      valor_comissao: valorComissao.value,
      valor_taxas_cartao: valorTaxasCartao.value,
      valor_taxas_processamento_cartao: valorTaxasCartaoProcessamento.value,
      valor_taxas_antecipacao_credito: valorTaxasCartaoAntecipacao.value,
      valor_liquido: valorLiquidoMarkup.value,
      taxa_nota_percentual: Number(taxaNotaPercentual.value) || 0,
      tem_nota_fiscal: temNotaFiscal.value,
      comissionados: Object.keys(comissionadosPayload).length ? comissionadosPayload : undefined,
      parcelas: parcelasNormalizadas.value.map((p) => ({
        valor: Number(p?.valor || 0),
        vencimento: p?.vencimento || null,
        forma: p?.forma || null,
        descricao: p?.descricao || null,
      })),
    })
    const nCr = data?.contas_receber_ids?.length ?? 0
    const nEt = data?.producao_etapa_ids?.length ?? 0
    const agendaInfo = data?.agenda_fabrica_id ? ` Agenda medida fina #${data.agenda_fabrica_id} pronta.` : ''
    notify.success(
      `Ordem de serviço #${data?.ordem_servico_id ?? '—'}: ${nCr} conta(s) a receber, ${nEt} tarefa(s) por ambiente.${agendaInfo}`,
    )
    if (Array.isArray(data?.alertas) && data.alertas.length) {
      data.alertas.forEach((a) => notify.warning(String(a)))
    }
  } catch (e) {
    console.error(e)
    const apiMsg = e?.response?.data?.message
    notify.error(Array.isArray(apiMsg) ? apiMsg.join(' | ') : apiMsg || 'Não foi possível salvar.')
  } finally {
    salvandoContasReceber.value = false
  }
}

async function carregar() {
  const id = clienteId.value
  if (!id) {
    erro.value = 'Cliente inválido na URL.'
    return
  }
  loading.value = true
  erro.value = ''
  try {
    // Carrega consolidação e markup salvo em paralelo
    const orcIds = route.query.orc_ids ? String(route.query.orc_ids) : undefined
    const [{ data }, markupRes] = await Promise.allSettled([
      ArquivosService.consolidacaoCliente(id, { orcIds }),
      ArquivosService.markupSalvoCliente(id),
    ]).then((results) => {
      const consolidacao = results[0].status === 'fulfilled' ? results[0].value : null
      const markup = results[1].status === 'fulfilled' ? results[1].value : null
      if (!consolidacao) throw results[0].reason
      return [consolidacao, markup]
    })

    resultado.value = data

    // Se há markup salvo, pré-popula os campos; caso contrário aplica os defaults
    const os = markupRes?.data ?? null
    if (os) {
      aplicarMarkupSalvo(os)
    } else {
      aplicarMarkupPadraoContrato()
    }
  } catch (e) {
    console.error(e)
    resultado.value = null
    const msg = e?.response?.data?.message
    erro.value = Array.isArray(msg) ? msg.join(' | ') : msg || 'Não foi possível consolidar os documentos.'
    notify.error('Falha na leitura dos documentos.')
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
</script>
