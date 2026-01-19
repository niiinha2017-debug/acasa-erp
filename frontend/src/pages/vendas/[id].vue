<template>
  <Card :shadow="true">
    <!-- HEADER -->
    <PageHeader
      :title="isEdit ? `Venda #${vendaId}` : 'Nova Venda'"
      subtitle="Pós-venda: itens congelados, comissões por constante e cálculo de taxas."
      icon="pi pi-shopping-cart"
      :backTo="'/vendas'"
    />

    <!-- BODY -->
    <div class="p-6 relative">
      <Loading v-if="loading" />

      <div v-else class="space-y-8">
        <!-- DADOS -->
        <section class="space-y-4">
          <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            Dados
          </div>

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-3">
              <Input v-model="form.cliente_id" type="number" label="Cliente (ID) *" required />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input v-model="form.orcamento_id" type="number" label="Orçamento (ID) *" required />
            </div>

            <div class="col-span-12 md:col-span-3">
              <SearchInput
                v-model="form.status"
                mode="select"
                label="Status *"
                placeholder="Selecione..."
                :options="STATUS_VENDA"
                required
              />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input v-model="form.data_venda" type="date" label="Data da venda" />
            </div>

            <div class="col-span-12">
              <Input v-model="form.observacao" label="Observação" />
            </div>
          </div>
        </section>

        <div class="h-px bg-slate-100"></div>

        <!-- PAGAMENTO / TAXAS -->
        <section class="space-y-4">
          <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            Pagamento e taxas
          </div>

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-4">
              <SearchInput
                v-model="form.forma_pagamento_chave"
                mode="select"
                label="Forma de pagamento"
                placeholder="Selecione..."
                :options="FORMAS_PAGAMENTO_OPTIONS"
              />
            </div>

            <div v-if="form.forma_pagamento_chave === 'CREDITO'" class="col-span-12 md:col-span-2">
              <SearchInput
                v-model="form.parcelas_credito"
                mode="select"
                label="Parcelas"
                placeholder="Selecione..."
                :options="PARCELAS_CREDITO_OPTIONS"
              />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input
                :modelValue="formatPercent(form.taxa_pagamento_percentual_aplicado)"
                label="Taxa pagamento (%)"
                readonly
              />
            </div>

            <div class="col-span-12 md:col-span-3">
              <CustomCheckbox
                v-model="form.tem_nota_fiscal"
                label="Nota fiscal"
                description="Se marcado, aplica taxa de NF (constante)."
              />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input
                :modelValue="formatPercent(form.taxa_nota_fiscal_percentual_aplicado)"
                label="Taxa NF (%)"
                readonly
              />
            </div>
          </div>
        </section>

        <div class="h-px bg-slate-100"></div>

        <!-- ITENS -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
              Itens
            </div>

            <Button variant="secondary" size="sm" type="button" @click="addItem">
              + Adicionar item
            </Button>
          </div>

          <Table
            :columns="columnsItens"
            :rows="rowsItens"
            :loading="false"
            emptyText="Nenhum item."
            :boxed="true"
          >
            <template #cell-nome_ambiente="{ row }">
              <Input v-model="row.nome_ambiente" />
            </template>

            <template #cell-descricao="{ row }">
              <Input v-model="row.descricao" />
            </template>

            <template #cell-quantidade="{ row }">
              <Input v-model="row.quantidade" type="number" />
            </template>

            <template #cell-valor_unitario="{ row }">
              <Input v-model="row.valor_unitario" type="number" />
            </template>

            <template #cell-valor_total="{ row }">
              <span class="font-black text-gray-900">
                {{ format.currency(totalItem(row)) }}
              </span>
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  type="button"
                  :disabled="form.itens.length === 1"
                  @click="removerItem(row.__idx)"
                >
                  Remover
                </Button>
              </div>
            </template>
          </Table>

          <div class="flex justify-end">
            <div class="text-sm font-black uppercase tracking-tight text-gray-900">
              Bruto:
              <span class="text-brand-primary">{{ format.currency(valorBruto) }}</span>
            </div>
          </div>
        </section>

        <div class="h-px bg-slate-100"></div>

        <!-- COMISSÕES -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
              Comissões
            </div>

            <Button variant="secondary" size="sm" type="button" @click="addComissao">
              + Adicionar comissão
            </Button>
          </div>

          <Table
            :columns="columnsComissoes"
            :rows="rowsComissoes"
            :loading="false"
            emptyText="Nenhuma comissão."
            :boxed="true"
          >
            <template #cell-tipo="{ row }">
              <SearchInput
                v-model="row.tipo_comissao_chave"
                mode="select"
                placeholder="Selecione..."
                :options="TIPOS_COMISSAO_OPTIONS"
              />
            </template>

            <template #cell-responsavel="{ row }">
              <Input v-model="row.responsavel_nome" placeholder="Nome (opcional)" />
            </template>

            <template #cell-percentual="{ row }">
              <span class="text-xs font-black text-gray-700">
                {{ formatPercent(percentualComissao(row.tipo_comissao_chave)) }}
              </span>
            </template>

            <template #cell-valor="{ row }">
              <span class="font-black text-gray-900">
                {{ format.currency(valorComissao(row)) }}
              </span>
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end">
                <Button variant="danger" size="sm" type="button" @click="removerComissao(row.__idx)">
                  Remover
                </Button>
              </div>
            </template>
          </Table>

          <div class="flex justify-end">
            <div class="text-sm font-black uppercase tracking-tight text-gray-900">
              Comissão total:
              <span class="text-brand-primary">{{ format.currency(somaComissoes) }}</span>
            </div>
          </div>
        </section>

        <div class="h-px bg-slate-100"></div>

        <!-- TOTAIS -->
        <section class="space-y-4">
          <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            Totais (preview)
          </div>

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(valorBruto)" label="Valor bruto" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(valorTaxaPagamento)" label="Taxa pagamento" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(valorNotaFiscal)" label="Nota fiscal" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(valorTotal)" label="Total" readonly />
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="flex items-center justify-end gap-2 p-6 border-t border-gray-100">
      <Button
        v-if="isEdit"
        variant="danger"
        size="md"
        type="button"
        :loading="deleting"
        @click="excluir"
      >
        Excluir
      </Button>

      <Button
        variant="primary"
        size="md"
        type="button"
        :loading="saving"
        :disabled="!podeSalvar || saving"
        @click="salvar"
      >
        Salvar
      </Button>
    </footer>
  </Card>
</template>



<script setup>
import { reactive, computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { VendaService } from '@/services/index'
import { format } from '@/utils/format'

// ✅ constantes consolidadas (barrel)
import { FORMAS_PAGAMENTO, TAXAS_CARTAO, COMISSOES, TAXA_NOTA_FISCAL, STATUS_FINANCEIRO } from '@/constantes'

// ===== ROUTE =====
const route = useRoute()
const router = useRouter()

const vendaId = computed(() => {
  const v = route.params.id
  const n = Number(String(v).replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
})
const isEdit = computed(() => !!vendaId.value)

// Prefill opcional por query (novo)
const orcamentoIdQuery = computed(() => {
  const v = route.query?.orcamento_id
  if (v === null || v === undefined || v === '') return null
  const n = Number(String(v).replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
})
const clienteIdQuery = computed(() => {
  const v = route.query?.cliente_id
  if (v === null || v === undefined || v === '') return null
  const n = Number(String(v).replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
})

// ===== CONSTANTES DE TELA =====
// ⚠️ Status de venda não foi definido por você nas constantes.
// Mantive exatamente como estava no seu arquivo.
const STATUS_VENDA = [
  { label: 'RASCUNHO', value: 'RASCUNHO' },
  { label: 'FECHADA', value: 'FECHADA' },
  { label: 'CANCELADA', value: 'CANCELADA' },
]

// options
const FORMAS_PAGAMENTO_OPTIONS = (FORMAS_PAGAMENTO || []).map((x) => ({ label: x.label, value: x.key }))
const PARCELAS_CREDITO_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: i + 1 }))
const TIPOS_COMISSAO_OPTIONS = Object.entries(COMISSOES || {}).map(([key, c]) => ({ label: c.label, value: key }))

// status financeiro padrão (para pagamentos)
const STATUS_FINANCEIRO_PADRAO = (STATUS_FINANCEIRO || []).find((s) => s.key === 'EM_ABERTO')?.key || 'EM_ABERTO'

// ===== STATE =====
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

function formVazio() {
  return {
    cliente_id: '',
    orcamento_id: '',
    status: 'RASCUNHO',
    data_venda: '',
    data_entrega: '',
    observacao: '',

    forma_pagamento_chave: '',
    parcelas_credito: 1,
    tem_nota_fiscal: false,

    // snapshot calculado
    taxa_pagamento_percentual_aplicado: 0,
    taxa_nota_fiscal_percentual_aplicado: 0,

    // base (backend recalcula em cima de valor_vendido)
    valor_vendido: 0,

    // tabelas
    itens: [{ nome_ambiente: '', descricao: '', quantidade: 1, valor_unitario: 0 }],
    comissoes: [],

    // ✅ backend exige pagamentos
    pagamentos: [
      {
        forma_pagamento_chave: '',
        valor: 0,
        data_prevista_recebimento: '',
        data_recebimento: '',
        status_financeiro_chave: STATUS_FINANCEIRO_PADRAO,
        observacao: '',
      },
    ],
  }
}

const form = reactive(formVazio())

// ===== TABLE =====
const columnsItens = [
  { key: 'nome_ambiente', label: 'Ambiente', width: '220px' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'quantidade', label: 'Qtd', width: '120px', align: 'right' },
  { key: 'valor_unitario', label: 'Unitário', width: '160px', align: 'right' },
  { key: 'valor_total', label: 'Total', width: '160px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '140px', align: 'right' },
]
const rowsItens = computed(() => (form.itens || []).map((it, idx) => ({ ...it, __idx: idx })))

const columnsComissoes = [
  { key: 'tipo', label: 'Tipo', width: '220px' },
  { key: 'responsavel', label: 'Responsável' },
  { key: 'percentual', label: '%', width: '100px', align: 'right' },
  { key: 'valor', label: 'Valor', width: '160px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '140px', align: 'right' },
]
const rowsComissoes = computed(() => (form.comissoes || []).map((c, idx) => ({ ...c, __idx: idx })))

// ===== HELPERS =====
function num(v) {
  // aceita number e string
  const n = Number(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}
function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}
function totalItem(it) {
  return round2(num(it.quantidade) * num(it.valor_unitario))
}
function formatPercent(v) {
  const n = Number(v || 0)
  return `${round2(n)}`
}

// comissão por constante
function percentualComissao(tipo) {
  if (!tipo) return 0
  return Number(COMISSOES?.[tipo]?.percentual || 0)
}
function valorComissao(c) {
  const p = percentualComissao(c.tipo_comissao_chave)
  return round2(valorBruto.value * (p / 100))
}

// ===== COMPUTEDS =====
const valorBruto = computed(() => round2((form.itens || []).reduce((acc, it) => acc + totalItem(it), 0)))

// valor_vendido (base do backend) = bruto dos itens (snapshot)
watch(
  () => valorBruto.value,
  (v) => {
    form.valor_vendido = round2(v)
    // manter pagamento batendo por padrão (1 pagamento)
    if (form.pagamentos?.length === 1) {
      form.pagamentos[0].valor = round2(v)
    }
  },
  { immediate: true },
)

const valorTaxaPagamento = computed(() =>
  round2(valorBruto.value * (Number(form.taxa_pagamento_percentual_aplicado || 0) / 100)),
)
const valorNotaFiscal = computed(() =>
  round2(valorBruto.value * (Number(form.taxa_nota_fiscal_percentual_aplicado || 0) / 100)),
)
const somaComissoes = computed(() =>
  round2((form.comissoes || []).reduce((acc, c) => acc + valorComissao(c), 0)),
)

// preview
const valorTotal = computed(() =>
  round2(valorBruto.value + valorTaxaPagamento.value + valorNotaFiscal.value + somaComissoes.value),
)

const somaPagamentos = computed(() =>
  round2((form.pagamentos || []).reduce((acc, p) => acc + num(p?.valor || 0), 0)),
)

const pagamentosBatendo = computed(() => round2(somaPagamentos.value - round2(form.valor_vendido || 0)) === 0)

const podeSalvar = computed(() => {
  if (!String(form.orcamento_id || '').trim()) return false
  if (!String(form.status || '').trim()) return false
  if (!form.itens?.length) return false
  if (!form.pagamentos?.length) return false
  if (!pagamentosBatendo.value) return false
  return true
})

// ===== TAXAS AUTOMÁTICAS =====
function recalcularTaxas() {
  const forma = form.forma_pagamento_chave

  let taxaPag = 0
  if (forma === 'DEBITO') {
    taxaPag = Number(TAXAS_CARTAO?.DEBITO?.taxa || 0)
  } else if (forma === 'CREDITO') {
    const p = Number(form.parcelas_credito || 1)
    taxaPag = Number(TAXAS_CARTAO?.CREDITO?.parcelas?.[p] || 0)
  }

  form.taxa_pagamento_percentual_aplicado = taxaPag

  // NF pela constante consolidada (se taxa = null, vira 0)
  const taxaNF = Number(TAXA_NOTA_FISCAL?.taxa || 0)
  form.taxa_nota_fiscal_percentual_aplicado = form.tem_nota_fiscal ? taxaNF : 0

  // manter pagamento alinhado à forma (1º pagamento segue forma escolhida)
  if (form.pagamentos?.length) {
    form.pagamentos[0].forma_pagamento_chave = forma || ''
  }
}

watch(
  () => [form.forma_pagamento_chave, form.parcelas_credito, form.tem_nota_fiscal],
  () => recalcularTaxas(),
  { immediate: true },
)

// ===== ACTIONS =====
function addItem() {
  form.itens.push({ nome_ambiente: '', descricao: '', quantidade: 1, valor_unitario: 0 })
}
function removerItem(idx) {
  if (form.itens.length === 1) return
  form.itens.splice(idx, 1)
}

function addComissao() {
  form.comissoes.push({
    tipo_comissao_chave: '',
    responsavel_nome: '',
  })
}
function removerComissao(idx) {
  form.comissoes.splice(idx, 1)
}

function montarPayload() {
  return {
    // backend valida cliente pelo orçamento — mas pode aceitar cliente_id (se você mandar)
    // aqui eu mando cliente_id só se existir (novo pode vir vazio)
    cliente_id: form.cliente_id ? Number(form.cliente_id) : undefined,

    orcamento_id: Number(form.orcamento_id),
    status: form.status,

    data_venda: form.data_venda ? String(form.data_venda) : undefined,
    data_entrega: form.data_entrega ? String(form.data_entrega) : undefined,

    observacao: form.observacao || null,

    valor_vendido: round2(Number(form.valor_vendido || 0)),

    // snapshot calculado
    taxa_pagamento_percentual_aplicado: Number(form.taxa_pagamento_percentual_aplicado || 0),
    taxa_nota_fiscal_percentual_aplicado: Number(form.taxa_nota_fiscal_percentual_aplicado || 0),
    tem_nota_fiscal: Boolean(form.tem_nota_fiscal),

    // itens (o backend na criação congela do orçamento, mas manter aqui para tela/atualização)
    itens: (form.itens || []).map((it) => ({
      nome_ambiente: it.nome_ambiente,
      descricao: it.descricao,
      quantidade: Number(it.quantidade || 0),
      valor_unitario: Number(it.valor_unitario || 0),
    })),

    // comissão: percentual vem da constante
    comissoes: (form.comissoes || [])
      .filter((c) => c.tipo_comissao_chave)
      .map((c) => ({
        tipo_comissao_chave: c.tipo_comissao_chave,
        percentual_aplicado: percentualComissao(c.tipo_comissao_chave),
        responsavel_nome: c.responsavel_nome || null,
      })),

    // ✅ backend exige pagamentos e valida soma
    pagamentos: (form.pagamentos || []).map((p) => ({
      forma_pagamento_chave: String(p.forma_pagamento_chave || form.forma_pagamento_chave || ''),
      valor: round2(Number(p.valor || 0)),
      data_prevista_recebimento: p.data_prevista_recebimento ? String(p.data_prevista_recebimento) : undefined,
      data_recebimento: p.data_recebimento ? String(p.data_recebimento) : undefined,
      status_financeiro_chave: String(p.status_financeiro_chave || STATUS_FINANCEIRO_PADRAO),
      observacao: p.observacao || null,
    })),
  }
}

async function carregar() {
  if (!isEdit.value) return

  loading.value = true
  try {
    const { data } = await VendaService.buscar(vendaId.value)

    form.cliente_id = data?.cliente_id ?? ''
    form.orcamento_id = data?.orcamento_id ?? ''
    form.status = data?.status ?? 'RASCUNHO'

    form.data_venda = data?.data_venda ? String(data.data_venda).slice(0, 10) : ''
    form.data_entrega = data?.data_entrega ? String(data.data_entrega).slice(0, 10) : ''
    form.observacao = data?.observacao ?? ''

    // backend pode não ter forma_pagamento_chave na venda (fica em pagamentos).
    // se existir, usa. se não, pega do 1º pagamento.
    form.forma_pagamento_chave = data?.forma_pagamento_chave ?? data?.pagamentos?.[0]?.forma_pagamento_chave ?? ''

    // parcelas não existe no banco, fica 1
    form.parcelas_credito = 1

    form.taxa_pagamento_percentual_aplicado = Number(data?.taxa_pagamento_percentual_aplicado || 0)
    form.taxa_nota_fiscal_percentual_aplicado = Number(data?.taxa_nota_fiscal_percentual_aplicado || 0)

    // tenta inferir tem_nota_fiscal
    form.tem_nota_fiscal = Boolean(data?.tem_nota_fiscal ?? (Number(form.taxa_nota_fiscal_percentual_aplicado || 0) > 0))

    // valor vendido
    form.valor_vendido = round2(Number(data?.valor_vendido || 0))

    form.itens = (data?.itens || []).map((it) => ({
      nome_ambiente: it.nome_ambiente,
      descricao: it.descricao,
      quantidade: Number(it.quantidade || 0),
      valor_unitario: Number(it.valor_unitario || 0),
    }))
    if (!form.itens.length) form.itens = [{ nome_ambiente: '', descricao: '', quantidade: 1, valor_unitario: 0 }]

    form.comissoes = (data?.comissoes || []).map((c) => ({
      tipo_comissao_chave: c.tipo_comissao_chave,
      responsavel_nome: c.responsavel_nome || '',
    }))

    form.pagamentos = (data?.pagamentos || []).map((p) => ({
      forma_pagamento_chave: p.forma_pagamento_chave || '',
      valor: round2(Number(p.valor || 0)),
      data_prevista_recebimento: p.data_prevista_recebimento ? String(p.data_prevista_recebimento).slice(0, 10) : '',
      data_recebimento: p.data_recebimento ? String(p.data_recebimento).slice(0, 10) : '',
      status_financeiro_chave: p.status_financeiro_chave || STATUS_FINANCEIRO_PADRAO,
      observacao: p.observacao || '',
    }))

    if (!form.pagamentos.length) {
      form.pagamentos = [
        {
          forma_pagamento_chave: form.forma_pagamento_chave || '',
          valor: round2(form.valor_vendido || 0),
          data_prevista_recebimento: '',
          data_recebimento: '',
          status_financeiro_chave: STATUS_FINANCEIRO_PADRAO,
          observacao: '',
        },
      ]
    }

    recalcularTaxas()
  } finally {
    loading.value = false
  }
}

async function salvar() {
  if (!podeSalvar.value || saving.value) return
  saving.value = true
  try {
    const payload = montarPayload()

    if (isEdit.value) {
      await VendaService.salvar(vendaId.value, payload)
      await carregar()
      return
    }

    const { data } = await VendaService.salvar(null, payload)
    const newId = data?.id
    if (newId) router.push(`/vendas/${newId}`)
    else router.push('/vendas')
  } finally {
    saving.value = false
  }
}

async function excluir() {
  if (!isEdit.value || deleting.value) return
  deleting.value = true
  try {
    await VendaService.remover(vendaId.value)
    router.push('/vendas')
  } finally {
    deleting.value = false
  }
}

// init
onMounted(async () => {
  // Prefill por query (novo)
  if (!isEdit.value) {
    if (clienteIdQuery.value) form.cliente_id = clienteIdQuery.value
    if (orcamentoIdQuery.value) form.orcamento_id = orcamentoIdQuery.value
    recalcularTaxas()
    return
  }

  await carregar()
})
</script>
