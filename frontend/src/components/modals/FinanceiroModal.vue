<template>
  <!-- Modal DENTRO da página -->
  <div v-if="open" class="fixed inset-0 z-[80]">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeSafe" />

    <div class="absolute inset-0 flex items-center justify-center p-4">
      <Card :shadow="true" class="w-full max-w-[980px] overflow-hidden">
        <!-- HEADER -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <div class="text-sm font-black uppercase tracking-wide text-slate-800">
              Fechamento mensal
            </div>
            <div class="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Etapa 1: consolidado • Etapa 2: ajustes + títulos financeiros
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              label="Trocar fornecedor"
              @click="toggleTrocarFornecedor"
            />
            <Button variant="secondary" size="sm" label="Fechar" @click="closeSafe" />
          </div>
        </div>

        <!-- STEPPER -->
        <div class="px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <div
                class="h-8 w-8 rounded-2xl flex items-center justify-center text-xs font-black"
                :class="step === 1 ? 'bg-slate-900 text-white' : 'bg-gray-200 text-slate-700'"
              >
                1
              </div>
              <div class="text-[11px] font-black uppercase tracking-wider text-slate-700">
                Consolidado
              </div>
            </div>

            <div class="h-px w-10 bg-gray-200"></div>

            <div class="flex items-center gap-2">
              <div
                class="h-8 w-8 rounded-2xl flex items-center justify-center text-xs font-black"
                :class="step === 2 ? 'bg-slate-900 text-white' : 'bg-gray-200 text-slate-700'"
              >
                2
              </div>
              <div class="text-[11px] font-black uppercase tracking-wider text-slate-700">
                Ajustes & Parcelas
              </div>
            </div>
          </div>
        </div>

        <!-- BODY -->
        <div class="p-6 relative space-y-6">
          <Loading v-if="loading" />

          <template v-else>
            <!-- ========================== -->
            <!-- ETAPA 1 -->
            <!-- ========================== -->
            <div v-if="step === 1" class="space-y-6">
              <!-- fornecedor obrigatório já vem da página -->
              <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-8 rounded-2xl border border-gray-100 bg-gray-50/40 px-4 py-3">
                  <div class="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400">
                    Fornecedor selecionado
                  </div>
                  <div class="mt-2 text-sm font-black text-slate-800">
                    {{ fornecedorNomeLabel }}
                  </div>
                  <div class="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    mês/ano: {{ String(mes).padStart(2, '0') }}/{{ ano }}
                  </div>
                </div>

                <div class="col-span-12 md:col-span-4 rounded-2xl border border-gray-100 bg-gray-50/40 px-4 py-3 text-right">
                  <div class="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400">
                    Saldo a pagar (auto)
                  </div>
                  <div class="mt-2 text-lg font-black text-slate-800">
                    {{ format.currency(Number(preview.saldo_a_pagar_auto || 0)) }}
                  </div>
                </div>
              </div>

              <!-- trocar fornecedor (opcional) -->
              <div v-if="showTrocarFornecedor" class="grid grid-cols-12 gap-4">
                <SearchInput
                  class="col-span-12"
                  mode="select"
                  label="Trocar fornecedor (opcional)"
                  placeholder="Selecione..."
                  :options="fornecedoresOptions"
                  v-model="fornecedorIdLocal"
                />
                <div class="col-span-12 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ao trocar, o preview recarrega automaticamente
                </div>
              </div>

              <!-- preview automático -->
              <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12">
                  <div class="text-[11px] font-black uppercase tracking-wider text-slate-700">
                    Consolidado automático do mês
                  </div>
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    compras (débito) • plano de corte (crédito/abatimento)
                  </div>
                </div>

                <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div class="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Total compras</div>
                  <div class="text-lg font-black text-slate-800">{{ format.currency(preview.total_compras) }}</div>
                </div>

                <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div class="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Total plano corte</div>
                  <div class="text-lg font-black text-slate-800">{{ format.currency(preview.total_planos) }}</div>
                </div>

                <div class="col-span-12 md:col-span-4 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div class="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Compensado (auto)</div>
                  <div class="text-lg font-black text-slate-800">{{ format.currency(preview.compensado_auto) }}</div>
                </div>

                <div class="col-span-12 md:col-span-6 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div class="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Crédito sobra (auto)</div>
                  <div class="text-lg font-black text-slate-800">{{ format.currency(preview.credito_sobra_auto) }}</div>
                </div>

                <div class="col-span-12 md:col-span-6 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div class="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Saldo a pagar (auto)</div>
                  <div class="text-lg font-black text-slate-800">{{ format.currency(preview.saldo_a_pagar_auto) }}</div>
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <Button variant="secondary" label="Cancelar" @click="closeSafe" />
                <Button variant="primary" label="Continuar" @click="goStep2" />
              </div>
            </div>

            <!-- ========================== -->
            <!-- ETAPA 2 -->
            <!-- ========================== -->
            <div v-else class="space-y-6">
              <!-- ajustes -->
              <div class="space-y-4">
                <div>
                  <div class="text-[11px] font-black uppercase tracking-wider text-slate-700">
                    Ajustes manuais
                  </div>
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    dever soma no débito • creditar soma no crédito (com % liberada)
                  </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                  <Input
                    class="col-span-12 md:col-span-6"
                    label="Valor a dever"
                    :forceUpper="false"
                    :modelValue="moneyInput.dever"
                    @update:modelValue="(v) => (moneyInput.dever = v)"
                    placeholder="0,00"
                  />

                  <Input
                    class="col-span-12 md:col-span-6"
                    label="Valor a creditar"
                    :forceUpper="false"
                    :modelValue="moneyInput.creditar"
                    @update:modelValue="(v) => (moneyInput.creditar = v)"
                    placeholder="0,00"
                  />

                  <Input
                    class="col-span-12 md:col-span-3"
                    label="% liberada"
                    type="number"
                    :forceUpper="false"
                    v-model="ajustes.percentual_liberado"
                  />

                  <Input
                    class="col-span-12 md:col-span-3"
                    label="Desconto (%)"
                    type="number"
                    :forceUpper="false"
                    v-model="ajustes.desconto_percentual"
                  />

                  <div class="col-span-12 md:col-span-6 rounded-2xl border border-gray-100 bg-gray-50/40 px-4 py-3">
                    <div class="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400">Total final (preview)</div>
                    <div class="text-lg font-black text-slate-800">{{ format.currency(totalFinal) }}</div>
                    <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      total = (compras + dever) − (plano + creditar% ) − desconto
                    </div>
                  </div>
                </div>
              </div>

              <!-- pagamento / títulos -->
              <div class="space-y-4">
                <div>
                  <div class="text-[11px] font-black uppercase tracking-wider text-slate-700">
                    Pagamento (títulos financeiros)
                  </div>
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    cheque 6x ou cartão em N vezes
                  </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                  <div class="col-span-12 md:col-span-6">
                    <div class="text-[11px] font-black uppercase tracking-wider text-slate-600">
                      Forma *
                    </div>

                    <div class="mt-2 flex flex-wrap gap-2">
                      <label class="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700">
                        <input type="radio" class="h-4 w-4" value="CHEQUE" v-model="pagamento.forma" />
                        Cheque
                      </label>

                      <label class="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700">
                        <input type="radio" class="h-4 w-4" value="CARTAO" v-model="pagamento.forma" />
                        Cartão
                      </label>
                    </div>
                  </div>

                  <Input
                    class="col-span-12 md:col-span-3"
                    label="Parcelas (N)"
                    type="number"
                    :forceUpper="false"
                    v-model="pagamento.qtd_parcelas"
                  />

                  <Input
                    class="col-span-12 md:col-span-3"
                    label="Primeiro vencimento"
                    type="date"
                    :forceUpper="false"
                    v-model="pagamento.primeiro_vencimento"
                  />
                </div>

                <div class="flex items-center justify-between gap-2">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Gere e ajuste datas/valores
                  </div>

                  <div class="flex gap-2">
                    <Button variant="outline" size="sm" label="Gerar parcelas" @click="gerarParcelas" />
                    <Button
                      v-if="pagamento.forma === 'CHEQUE'"
                      variant="outline"
                      size="sm"
                      label="Auto 6x"
                      @click="autoCheque6x"
                    />
                  </div>
                </div>

                <Table
                  :columns="columnsParcelas"
                  :rows="parcelas"
                  :loading="false"
                  emptyText="Nenhuma parcela gerada."
                  :boxed="true"
                >
                  <template #cell-parcela="{ row }">
                    <div class="font-black text-gray-900">#{{ row.parcela }}</div>
                  </template>

                  <template #cell-vencimento="{ row }">
                    <input
                      type="date"
                      class="h-10 w-full rounded-2xl border border-gray-200 bg-white px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900/10"
                      v-model="row.vencimento_em"
                    />
                  </template>

                  <template #cell-valor="{ row }">
                    <input
                      type="text"
                      class="h-10 w-full rounded-2xl border border-gray-200 bg-white px-3 text-xs font-bold text-right outline-none focus:ring-2 focus:ring-slate-900/10"
                      :value="format.currency(Number(row.valor || 0))"
                      @blur="(e) => onBlurValorParcela(row, e.target.value)"
                    />
                  </template>

                  <template #cell-remove="{ row }">
                    <div class="text-right">
                      <Button variant="ghost" size="sm" label="Remover" @click="removerParcela(row.parcela)" />
                    </div>
                  </template>
                </Table>

                <div class="flex items-center justify-end gap-3">
                  <div class="text-right">
                    <div class="text-[10px] font-black uppercase text-gray-400">Soma parcelas</div>
                    <div class="text-sm font-black text-slate-800">{{ format.currency(somaParcelas) }}</div>
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <Button variant="secondary" label="Voltar" @click="step = 1" />
                <Button variant="primary" :loading="saving" label="Confirmar fechamento" @click="confirmar" />
              </div>
            </div>
          </template>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { FinanceiroService, FornecedoreService } from '@/services/index'
import { format } from '@/utils/format'
import { notify } from '@/services/notify'

const props = defineProps({
  open: { type: Boolean, default: false },

  // obrigatório: modal abre já com fornecedor + mês/ano selecionados na página
  fornecedorId: { type: [Number, String], required: true },
  fornecedorNome: { type: String, default: '' },
  mes: { type: Number, required: true },
  ano: { type: Number, required: true },
})

const emit = defineEmits(['close', 'saved'])

const step = ref(1)
const loading = ref(false)
const saving = ref(false)

const showTrocarFornecedor = ref(false)
const fornecedoresOptions = ref([])
const fornecedorIdLocal = ref(null)

const preview = reactive({
  total_compras: 0,
  total_planos: 0,
  compensado_auto: 0,
  saldo_a_pagar_auto: 0,
  credito_sobra_auto: 0,
})

const ajustes = reactive({
  percentual_liberado: 100,
  desconto_percentual: 0,
})

const moneyInput = reactive({
  dever: '0,00',
  creditar: '0,00',
})

const pagamento = reactive({
  forma: 'CHEQUE',
  qtd_parcelas: 6,
  primeiro_vencimento: '',
})

const parcelas = ref([])

const columnsParcelas = [
  { key: 'parcela', label: 'Parcela', width: '140px' },
  { key: 'vencimento', label: 'Vencimento', width: '220px' },
  { key: 'valor', label: 'Valor', width: '220px', align: 'right' },
  { key: 'remove', label: '', width: '140px', align: 'right' },
]

const fornecedorNomeLabel = computed(() => props.fornecedorNome || `#${props.fornecedorId}`)

function parseMoneyBR(str) {
  if (str == null) return 0
  const s = String(str).replace(/[^\d,.-]/g, '').trim()
  if (!s) return 0
  if (s.includes(',')) {
    const n = s.replace(/\./g, '').replace(',', '.')
    const v = Number(n)
    return Number.isFinite(v) ? v : 0
  }
  const v = Number(s)
  return Number.isFinite(v) ? v : 0
}

const deverNumber = computed(() => parseMoneyBR(moneyInput.dever))
const creditarNumber = computed(() => parseMoneyBR(moneyInput.creditar))

const creditoExtraAplicado = computed(() => {
  const pct = Math.max(0, Math.min(100, Number(ajustes.percentual_liberado || 0)))
  return (creditarNumber.value * pct) / 100
})

// ✅ correto: plano de corte ABATE (crédito)
const debitoBase = computed(() => {
  return Number(preview.total_compras || 0) + Math.max(deverNumber.value, 0)
})

const creditoTotal = computed(() => {
  return Number(preview.total_planos || 0) + Math.max(creditoExtraAplicado.value, 0)
})

const subtotal = computed(() => Math.max(debitoBase.value - creditoTotal.value, 0))

const descontoValor = computed(() => {
  const pct = Math.max(0, Math.min(100, Number(ajustes.desconto_percentual || 0)))
  return (subtotal.value * pct) / 100
})

const totalFinal = computed(() => Math.max(subtotal.value - descontoValor.value, 0))

const somaParcelas = computed(() => (parcelas.value || []).reduce((s, p) => s + Number(p.valor || 0), 0))

function closeSafe() {
  if (saving.value) return
  emit('close')
}

function toggleTrocarFornecedor() {
  showTrocarFornecedor.value = !showTrocarFornecedor.value
  if (showTrocarFornecedor.value) carregarFornecedoresLazy()
}

async function carregarFornecedoresLazy() {
  if (fornecedoresOptions.value.length) return
  loading.value = true
  try {
    const resp = await FornecedoreService.listar({})
    const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []
    fornecedoresOptions.value = (list || []).map((f) => ({
      label: f.nome_fantasia || f.nome || `#${f.id}`,
      value: f.id,
    }))
  } catch (e) {
    notify.error('Falha ao carregar fornecedores.')
  } finally {
    loading.value = false
  }
}

async function carregarPreviewObrigatorio() {
  const fornecedor_id = Number(fornecedorIdLocal.value || props.fornecedorId || 0)
  if (!fornecedor_id) return notify.error('Fornecedor inválido.')

  loading.value = true
  try {
    const { data } = await FinanceiroService.previewFechamentoFornecedor({
      fornecedor_id,
      mes: props.mes,
      ano: props.ano,
    })

    preview.total_compras = Number(data?.total_compras || 0)
    preview.total_planos = Number(data?.total_planos || 0)
    preview.compensado_auto = Number(data?.compensado_auto || 0)
    preview.saldo_a_pagar_auto = Number(data?.saldo_a_pagar_auto || 0)
    preview.credito_sobra_auto = Number(data?.credito_sobra_auto || 0)

    if (!pagamento.primeiro_vencimento) {
      const d = new Date(props.ano, props.mes, 5)
      pagamento.primeiro_vencimento = d.toISOString().slice(0, 10)
    }
  } catch (e) {
    notify.error('Falha ao carregar prévia do fechamento.')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  async (v) => {
    if (!v) return

    // reset
    step.value = 1
    showTrocarFornecedor.value = false
    fornecedoresOptions.value = []
    fornecedorIdLocal.value = null

    preview.total_compras = 0
    preview.total_planos = 0
    preview.compensado_auto = 0
    preview.saldo_a_pagar_auto = 0
    preview.credito_sobra_auto = 0

    ajustes.percentual_liberado = 100
    ajustes.desconto_percentual = 0
    moneyInput.dever = '0,00'
    moneyInput.creditar = '0,00'

    pagamento.forma = 'CHEQUE'
    pagamento.qtd_parcelas = 6
    pagamento.primeiro_vencimento = ''
    parcelas.value = []

    await carregarPreviewObrigatorio()
  },
)

watch(
  () => fornecedorIdLocal.value,
  async (v) => {
    if (!props.open) return
    if (!showTrocarFornecedor.value) return
    if (!v) return
    await carregarPreviewObrigatorio()
  },
)

function goStep2() {
  if (!parcelas.value.length) gerarParcelas()
  step.value = 2
}

function addMonthsISO(iso, n) {
  const d = new Date(iso + 'T00:00:00')
  const nd = new Date(d.getFullYear(), d.getMonth() + n, d.getDate())
  return nd.toISOString().slice(0, 10)
}

function gerarParcelas() {
  const n = Math.max(1, Number(pagamento.qtd_parcelas || 1))
  pagamento.qtd_parcelas = n

  const first = pagamento.primeiro_vencimento || new Date().toISOString().slice(0, 10)

  const v = Number(totalFinal.value || 0)
  const per = n > 0 ? Math.floor((v / n) * 100) / 100 : v
  let acc = 0

  const list = []
  for (let i = 1; i <= n; i++) {
    let valor = per
    if (i === n) valor = Math.max(v - acc, 0)
    acc += valor

    list.push({
      parcela: i,
      vencimento_em: addMonthsISO(first, i - 1),
      valor,
    })
  }
  parcelas.value = list
}

function autoCheque6x() {
  pagamento.forma = 'CHEQUE'
  pagamento.qtd_parcelas = 6
  if (!pagamento.primeiro_vencimento) pagamento.primeiro_vencimento = new Date().toISOString().slice(0, 10)
  gerarParcelas()
}

function removerParcela(parcelaNum) {
  parcelas.value = (parcelas.value || []).filter((p) => p.parcela !== parcelaNum)
  parcelas.value = parcelas.value.map((p, idx) => ({ ...p, parcela: idx + 1 }))
}

function onBlurValorParcela(row, text) {
  row.valor = parseMoneyBR(text)
}

function validarParcelas() {
  if (!parcelas.value.length) return 'Gere as parcelas.'
  for (const p of parcelas.value) {
    if (!p.vencimento_em) return 'Preencha vencimento de todas as parcelas.'
    const val = Number(p.valor || 0)
    if (!Number.isFinite(val) || val <= 0) return 'Valor de parcela inválido.'
  }
  return null
}

async function confirmar() {
  const err = validarParcelas()
  if (err) return notify.error(err)

  saving.value = true
  try {
    const fornecedor_id = Number(fornecedorIdLocal.value || props.fornecedorId || 0)

    const payload = {
      fornecedor_id,
      mes: props.mes,
      ano: props.ano,

      valor_dever: deverNumber.value,
      valor_creditar: creditarNumber.value,
      percentual_liberado: Number(ajustes.percentual_liberado || 0),
      desconto_percentual: Number(ajustes.desconto_percentual || 0),

      forma_pagamento_chave: pagamento.forma,

      parcelas: parcelas.value.map((p) => ({
        parcela: p.parcela,
        vencimento_em: p.vencimento_em,
        valor: Number(p.valor || 0),
      })),
    }

    await FinanceiroService.fecharMesFornecedor(payload)

    notify.success('Fechamento gerado e títulos criados.')
    emit('saved')
    closeSafe()
  } catch (e) {
    notify.error('Falha ao gerar fechamento.')
  } finally {
    saving.value = false
  }
}
</script>
