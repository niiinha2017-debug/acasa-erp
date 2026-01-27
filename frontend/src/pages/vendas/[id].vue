<template>
  <Card :shadow="true" class="overflow-hidden border-none">
    <PageHeader
      :title="isEdit ? `Venda #${vendaId}` : 'Nova Venda'"
      subtitle="Pós-venda: venda líquida, rateio, taxas e comissões."
      icon="pi pi-shopping-cart"
      :backTo="'/vendas'"
      class="bg-slate-50/50 border-b border-slate-100"
    />

    <div class="p-6 relative">
      <Loading v-if="loading" />

      <div v-else class="space-y-8">
        <!-- ===================== -->
        <!-- DADOS GERAIS -->
        <!-- ===================== -->
        <section class="space-y-4">
          <div class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
            Dados Gerais
          </div>

          <div class="grid grid-cols-12 gap-4 items-end">
            <div class="col-span-12 md:col-span-4">
              <SearchInput
                v-model="clienteFiltroId"
                mode="select"
                label="Cliente *"
                placeholder="Selecione o cliente..."
                :options="clientesOptions"
                required
                :readonly="isEdit"
              />
            </div>

            <div class="col-span-12 md:col-span-4">
              <SearchInput
                v-model="form.orcamento_id"
                mode="select"
                label="Orçamento *"
                placeholder="Selecione o orçamento..."
                :options="orcamentosOptions"
                :readonly="!clienteFiltroId || isEdit"
                required
              />
              <p
                v-if="isEdit"
                class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400"
              >
                * Orçamento não altera após salvar a venda.
              </p>
            </div>

            <div class="col-span-12 md:col-span-2">
              <Input :modelValue="'VENDA FECHADA'" label="Status" readonly />
            </div>

            <div class="col-span-12 md:col-span-2">
              <Input v-model="form.data_venda" type="date" label="Data da venda" :forceUpper="false" />
            </div>
          </div>
        </section>

        <div class="h-px bg-slate-100" />

        <!-- ===================== -->
        <!-- ITENS -->
        <!-- ===================== -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Itens do Orçamento
            </div>

            <Button
              v-if="isEdit"
              variant="secondary"
              size="sm"
              type="button"
              @click="abrirModalNovoItem"
            >
              + Novo item
            </Button>
          </div>

          <div v-if="rowsItens.length > 0">
            <Table :columns="columnsItens" :rows="rowsItens" :boxed="true" emptyText="Nenhum item.">
              <template #cell-descricao="{ row }">
                <div class="whitespace-pre-line">{{ row.descricao || '-' }}</div>
              </template>

              <template #cell-observacao="{ row }">
                <div class="whitespace-pre-line font-bold">{{ row.observacao || '-' }}</div>
              </template>

              <template #cell-quantidade="{ row }">
                <Input
                  v-if="isEdit"
                  v-model.number="form.itens[row.__idx].quantidade"
                  type="number"
                  min="1"
                  :forceUpper="false"
                />
                <span v-else class="font-bold">{{ row.quantidade }}</span>
              </template>

              <template #cell-valor_unitario="{ row }">
                <span class="font-bold">{{ format.currency(row.valor_unitario) }}</span>
              </template>

              <template #cell-valor_total="{ row }">
                <span class="font-bold">{{ format.currency(totalItem(row)) }}</span>
              </template>

              <template #cell-acoes="{ row }">
                <div v-if="isEdit" class="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    @click="row.id ? iniciarEdicaoItem(row) : editarItemLocal(row)"
                  >
                    Editar
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    @click="confirmarRemoverItemVenda(row)"
                  >
                    Remover
                  </Button>
                </div>

                <span
                  v-else
                  class="text-[10px] font-black uppercase tracking-widest text-slate-300"
                >
                  —
                </span>
              </template>
            </Table>
          </div>

          <div v-else class="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            Selecione um orçamento para carregar os itens.
          </div>

          <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">
            * Itens são clonados do orçamento ao salvar. Em edição, as alterações afetam apenas a venda.
          </div>
        </section>

        <div class="h-px bg-slate-100" />

        <!-- ===================== -->
        <!-- PAGAMENTOS / RATEIO -->
        <!-- ===================== -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Pagamentos (Rateio)
            </div>

            <Button variant="secondary" size="sm" type="button" @click="addPagamento">
              + Adicionar pagamento
            </Button>
          </div>

          <div class="grid grid-cols-12 gap-4 items-end">
            <div class="col-span-12 md:col-span-4">
              <Input
                v-model.number="form.valor_vendido"
                type="number"
                label="Valor total vendido (cobrado) *"
                :forceUpper="false"
              />
            </div>
          </div>

          <Table :columns="columnsPagamentos" :rows="rowsPagamentos" :boxed="true" emptyText="Nenhum pagamento.">
            <template #cell-forma="{ row }">
              <SearchInput
                v-model="form.pagamentos[row.__idx].forma_pagamento_chave"
                mode="select"
                placeholder="Selecione..."
                :options="FORMAS_PAGAMENTO_OPTIONS"
              />
            </template>

<template #cell-data_prevista="{ row }">
  <Input
    v-model="form.pagamentos[row.__idx].data_prevista_recebimento"
    type="date"
    :forceUpper="false"
  />
</template>

<template #cell-data_recebimento="{ row }">
  <Input
    v-model="form.pagamentos[row.__idx].data_recebimento"
    type="date"
    :forceUpper="false"
  />
</template>



            <template #cell-parcelas="{ row }">
              <Input
                v-if="form.pagamentos[row.__idx].forma_pagamento_chave === 'CREDITO'"
                v-model.number="form.pagamentos[row.__idx].parcelas"
                type="number"
                min="1"
                max="12"
                :forceUpper="false"
              />
              <span v-else class="text-slate-300">—</span>
            </template>

            <template #cell-valor="{ row }">
              <Input
                v-model.number="form.pagamentos[row.__idx].valor"
                type="number"
                :forceUpper="false"
              />
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  type="button"
                  :disabled="form.pagamentos.length === 1"
                  @click="confirmarRemoverPagamento(row.__idx)"
                >
                  Remover
                </Button>
              </div>
            </template>
          </Table>

          <div class="flex items-center justify-end gap-6 pt-2">
            <div class="text-sm font-black uppercase tracking-tight">
              Total rateado:
              <span class="text-brand-primary">{{ format.currency(somaPagamentos) }}</span>
            </div>

            <div class="text-sm font-black uppercase tracking-tight">
              Diferença:
              <span :class="pagamentosBatendo ? 'text-emerald-600' : 'text-rose-600'">
                {{ format.currency(diferencaRateio) }}
              </span>
            </div>
          </div>
        </section>

        <div class="h-px bg-slate-100" />

        <!-- ===================== -->
        <!-- COMISSÕES -->
        <!-- ===================== -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Comissões
            </div>

            <Button variant="secondary" size="sm" type="button" @click="addComissao">
              + Adicionar comissão
            </Button>
          </div>

          <Table :columns="columnsComissoes" :rows="rowsComissoes" :boxed="true" emptyText="Nenhuma comissão.">
            <template #cell-tipo="{ row }">
              <SearchInput
                v-model="form.comissoes[row.__idx].tipo_comissao_chave"
                mode="select"
                :options="COMISSOES_OPTIONS"
              />
            </template>

            <template #cell-responsavel="{ row }">
              <Input
                v-model="form.comissoes[row.__idx].responsavel_nome"
                placeholder="Nome do responsável"
                :forceUpper="false"
              />
            </template>

            <template #cell-percentual="{ row }">
              <Input :modelValue="pctComissao(row.tipo_comissao_chave)" type="number" readonly :forceUpper="false" />
            </template>

            <template #cell-valor="{ row }">
              <span class="font-black text-slate-900">{{ format.currency(valorComissao(row)) }}</span>
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end">
                <Button variant="danger" size="sm" type="button" @click="confirmarRemoverComissao(row.__idx)">
                  Remover
                </Button>
              </div>
            </template>
          </Table>

          <div class="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            * O percentual de comissão é fixo conforme configurações do sistema.
          </div>
        </section>

        <div class="h-px bg-slate-100" />

        <!-- ===================== -->
        <!-- RESUMO -->
        <!-- ===================== -->
        <section class="space-y-4">
          <div class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
            Taxas e Resumo Líquido
          </div>

          <div class="grid grid-cols-12 gap-4 items-end">
            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(valor_bruto)" label="Total vendido (base)" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(valor_taxa_pagamento)" label="Taxa Cartão/Meio" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <CustomCheckbox v-model="form.tem_nota_fiscal" label="Emitir Nota Fiscal" />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input
                :modelValue="`${form.tem_nota_fiscal ? form.taxa_nota_fiscal_percentual_aplicado : 0}%`"
                label="Alíquota NF"
                readonly
              />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(valor_taxa_nf)" label="Valor Imposto NF" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(total_taxas)" label="Total de Impostos/Taxas" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="format.currency(valor_comissoes)" label="Total Comissões" readonly />
            </div>

            <div class="col-span-12 md:col-span-3">
              <div class="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                <Input
                  :modelValue="format.currency(lucro_bruto)"
                  label="Resultado Líquido"
                  readonly
                />
              </div>
            </div>
          </div>
        </section>

        <div class="h-px bg-slate-100" />

        <!-- ===================== -->
        <!-- ARQUIVOS -->
        <!-- ===================== -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Arquivos e Comprovantes
            </div>

            <div class="flex items-center gap-2">
              <input type="file" ref="fileInput" class="hidden" @change="uploadArquivo" />
              <Button
                variant="secondary"
                size="sm"
                type="button"
                :disabled="!isEdit"
                @click="abrirFilePicker"
              >
                + Anexar Arquivo
              </Button>
            </div>
          </div>

          <div class="p-6 rounded-3xl border border-slate-100 bg-slate-50/50">
            <Loading v-if="uploading" class="py-6" />

            <div
              v-else-if="(arquivos || []).length === 0"
              class="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center py-4"
            >
              Nenhum arquivo anexado até o momento.
            </div>

            <div v-else class="flex flex-wrap gap-2">
              <div
                v-for="file in arquivos"
                :key="file.id"
                class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 hover:shadow-sm transition-shadow"
              >
                <span class="text-[10px] font-bold text-slate-700 truncate max-w-[200px]">
                  {{ file.nome_original || 'ARQUIVO' }}
                </span>

                <div class="flex items-center gap-2 ml-2">
                  <button
                    type="button"
                    @click="abrirArquivo(file.id)"
                    class="text-slate-400 hover:text-brand-primary"
                    title="Visualizar"
                  >
                    <i class="pi pi-external-link text-[10px]"></i>
                  </button>

                  <button
                    type="button"
                    @click="confirmarDeletarArquivoVenda(file.id)"
                    class="text-red-400 hover:text-red-600"
                    title="Excluir"
                  >
                    <i class="pi pi-times text-[10px]"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">
            * O upload fica disponível apenas após a criação da venda no sistema.
          </div>
        </section>
      </div>
    </div>

    <!-- ===================== -->
    <!-- FOOTER AÇÕES -->
    <!-- ===================== -->
    <footer class="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/30">
      <Button
        variant="secondary"
        size="md"
        type="button"
        :disabled="!isEdit || saving"
        @click="confirmarEnviarParaProducao"
      >
        Enviar para produção
      </Button>
<Button
  variant="primary"
  size="md"
  type="button"
  :loading="saving"
  :disabled="saving"
  @click="confirmarSalvarVenda"
>
  Salvar Venda
</Button>

    </footer>

    <!-- ===================== -->
    <!-- MODAL ITEM EXTRA -->
    <!-- ===================== -->
    <div
      v-if="modalItemOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      @click.self="fecharModalItem"
    >
      <Card :shadow="true" class="w-full max-w-[780px] overflow-hidden border-none">
        <div class="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            {{ modalItemEditando ? 'Editar item' : 'Novo item (extra na venda)' }}
          </div>

          <Button variant="secondary" size="sm" type="button" @click="fecharModalItem">
            Fechar
          </Button>
        </div>

        <div class="p-6 space-y-5">
          <div class="grid grid-cols-12 gap-4 items-end">
            <Input
              class="col-span-12 md:col-span-6"
              v-model="itemDraft.nome_ambiente"
              label="Item/Ambiente *"
              placeholder="Ex: COZINHA / ARMÁRIO / FRETE"
              :forceUpper="false"
            />

            <Input
              class="col-span-12 md:col-span-6"
              v-model="itemDraft.descricao"
              label="Acabamento"
              placeholder="Ex: MDF BRANCO / RIPADO / VIDRO"
              :forceUpper="false"
            />

            <Input
              class="col-span-12"
              v-model="itemDraft.observacao"
              label="Observações"
              placeholder="Texto livre"
              :forceUpper="false"
            />

            <Input
              class="col-span-12 md:col-span-4"
              v-model.number="itemDraft.quantidade"
              type="number"
              min="1"
              label="Quantidade"
              :forceUpper="false"
            />

            <Input
              class="col-span-12 md:col-span-4"
              v-model.number="itemDraft.valor_unitario"
              type="number"
              min="0"
              step="0.01"
              label="Valor unitário"
              :forceUpper="false"
            />

            <Input
              class="col-span-12 md:col-span-4"
              :modelValue="format.currency(totalItem(itemDraft))"
              label="Total"
              readonly
            />
          </div>

          <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">
            * Esse item é extra na venda (não altera o orçamento).
          </div>
        </div>

        <div class="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <Button variant="secondary" type="button" @click="fecharModalItem">
            Cancelar
          </Button>
          <Button variant="primary" type="button" @click="salvarItemDoModal">
            Salvar item
          </Button>
        </div>
      </Card>
    </div>
  </Card>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { confirm } from '@/services/confirm'

import { notify } from '@/services/notify'
import { ClienteService, OrcamentosService, VendaService, ProducaoService } from '@/services/index'
import { format } from '@/utils/format'
import { FORMAS_PAGAMENTO, COMISSOES, TAXAS_CARTAO, TAXA_NOTA_FISCAL, PIPELINE_CLIENTE } from '@/constantes'

// =======================
// ROUTE
// =======================
const route = useRoute()
const router = useRouter()

const vendaId = computed(() => {
  const n = Number(String(route.params.id || '').replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
})
const isEdit = computed(() => !!vendaId.value)

// =======================
// UI STATE
// =======================
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)

const clientesOptions = ref([])
const orcamentosOptions = ref([])
const clienteFiltroId = ref('')

const arquivos = ref([])
const fileInput = ref(null)

// =======================
// CONSTANTS / OPTIONS
// =======================
const FORMAS_PAGAMENTO_OPTIONS = (FORMAS_PAGAMENTO || []).map((x) => ({ label: x.label, value: x.key }))
const COMISSOES_OPTIONS = Object.entries(COMISSOES || {}).map(([key, v]) => ({ label: v.label, value: key }))

// =======================
// HELPERS
// =======================
function num(v) {
  const n = Number(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}
function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}
function totalItem(row) {
  const q = Number(row?.quantidade || 0)
  const u = Number(row?.valor_unitario || 0)
  return round2(q * u)
}
function pctComissao(tipo) {
  return Number(COMISSOES?.[String(tipo || '')]?.percentual || 0)
}
function taxaPctPorForma(forma, parcelas) {
  const f = String(forma || '')
  if (f === 'DEBITO') return Number(TAXAS_CARTAO?.DEBITO?.taxa || 0)
  if (f === 'CREDITO') {
    const p = Math.min(12, Math.max(1, Number(parcelas || 1)))
    return Number(TAXAS_CARTAO?.CREDITO?.parcelas?.[p] || 0)
  }
  return 0
}
function pipelineKey(key) {
  const k = PIPELINE_CLIENTE.find((p) => p.key === key)?.key
  if (!k) throw new Error(`PIPELINE_CLIENTE key não encontrada: ${key}`)
  return k
}

// =======================
// FORM
// =======================
const form = reactive({
  orcamento_id: '',
  status: pipelineKey('VENDA_FECHADA'),
  data_venda: new Date().toISOString().slice(0, 10),

  valor_vendido: 0,

  itens: [],

  pagamentos: [
  {
    forma_pagamento_chave: '',
    valor: 0,
    parcelas: 1,
    data_prevista_recebimento: '',
    data_recebimento: '',
    status_financeiro_chave: 'EM_ABERTO',
  },
],


  comissoes: [],

  // backend
  taxa_pagamento_percentual_aplicado: 0,
  tem_nota_fiscal: false,
  taxa_nota_fiscal_percentual_aplicado: Number(TAXA_NOTA_FISCAL?.taxa || 0),
})

// =======================
// ROWS (somente p/ render, edição é feita direto no form pelo __idx no template)
// =======================
const rowsItens = computed(() => (form.itens || []).map((it, idx) => ({ ...it, __idx: idx })))
const rowsPagamentos = computed(() => (form.pagamentos || []).map((p, idx) => ({ ...p, __idx: idx })))
const rowsComissoes = computed(() => (form.comissoes || []).map((c, idx) => ({ ...c, __idx: idx })))

// =======================
// MODAL ITEM EXTRA (LOCAL)
// =======================
const modalItemOpen = ref(false)
const modalItemEditando = ref(false)
const itemEditIdx = ref(null)

const itemDraft = reactive({
  nome_ambiente: '',
  descricao: '',
  observacao: '',
  quantidade: 1,
  valor_unitario: 0,
})

function resetItemDraft() {
  itemDraft.nome_ambiente = ''
  itemDraft.descricao = ''
  itemDraft.observacao = ''
  itemDraft.quantidade = 1
  itemDraft.valor_unitario = 0
  itemEditIdx.value = null
  modalItemEditando.value = false
}

function abrirModalNovoItem() {
  resetItemDraft()
  modalItemOpen.value = true
}

function fecharModalItem() {
  modalItemOpen.value = false
}

function editarItemLocal(row) {
  if (!row) return
  const base = form.itens?.[row.__idx]
  if (!base) return

  modalItemEditando.value = true
  itemEditIdx.value = row.__idx

  itemDraft.nome_ambiente = base.nome_ambiente || ''
  itemDraft.descricao = base.descricao || ''
  itemDraft.observacao = base.observacao || ''
  itemDraft.quantidade = Number(base.quantidade || 1)
  itemDraft.valor_unitario = Number(base.valor_unitario || 0)

  modalItemOpen.value = true
}


// SALVAR VENDA
async function confirmarSalvarVenda() {
  const ok = await confirm.show(
    isEdit.value ? 'Salvar Venda' : 'Criar Venda',
    isEdit.value
      ? `Deseja salvar as alterações da Venda #${vendaId.value}?`
      : 'Deseja criar esta venda agora?',
  )
  if (!ok) return
  await salvar()
}

// ENVIAR PARA PRODUÇÃO
async function confirmarEnviarParaProducao() {
  if (!isEdit.value) return

  const ok = await confirm.show(
    'Enviar para Produção',
    `Deseja enviar a Venda #${vendaId.value} para Produção?`,
  )
  if (!ok) return

  await enviarParaProducao()
}

// REMOVER ITEM (apenas itens locais, já que itens com id não removem)
async function confirmarRemoverItemVenda(row) {
  const ok = await confirm.show(
    'Remover Item',
    `Deseja remover "${row?.nome_ambiente || 'ITEM'}" desta venda?`,
  )
  if (!ok) return
  removerItem(row)
}

// REMOVER PAGAMENTO
async function confirmarRemoverPagamento(idx) {
  const ok = await confirm.show(
    'Remover Pagamento',
    'Deseja remover este pagamento do rateio?',
  )
  if (!ok) return
  removerPagamento(idx)
}

// REMOVER COMISSÃO
async function confirmarRemoverComissao(idx) {
  const ok = await confirm.show(
    'Remover Comissão',
    'Deseja remover esta comissão?',
  )
  if (!ok) return
  removerComissao(idx)
}

// REMOVER ARQUIVO
async function confirmarDeletarArquivoVenda(arquivoId) {
  const ok = await confirm.show(
    'Excluir Arquivo',
    'Deseja excluir este arquivo?',
  )
  if (!ok) return
  await deletarArquivo(arquivoId)
}


function salvarItemDoModal() {
  if (!String(itemDraft.nome_ambiente || '').trim()) {
    notify.warn('Preencha Item/Ambiente')
    return
  }

  const payload = {
    nome_ambiente: String(itemDraft.nome_ambiente || '').trim(),
    descricao: String(itemDraft.descricao || ''),
    observacao: String(itemDraft.observacao || ''),
    quantidade: Math.max(1, Number(itemDraft.quantidade || 1)),
    valor_unitario: round2(num(itemDraft.valor_unitario || 0)),
  }

  if (modalItemEditando.value && itemEditIdx.value !== null) {
    Object.assign(form.itens[itemEditIdx.value], payload)
    fecharModalItem()
    return
  }

  form.itens.push(payload)
  fecharModalItem()
}

function removerItem(row) {
  // item com id = backend (não temos endpoint de delete)
  if (row?.id) {
    notify.warn('Remoção de item do orçamento não disponível (sem endpoint).')
    return
  }
  const idx = row?.__idx
  if (idx === undefined || idx === null) return
  form.itens.splice(idx, 1)
}

// =======================
// TABELAS (itens)
// =======================
const columnsItens = [
  { key: 'nome_ambiente', label: 'Item/Ambiente' },
  { key: 'descricao', label: 'Acabamento' },
  { key: 'observacao', label: 'Observações' },
  { key: 'quantidade', label: 'Qtd', align: 'right', width: '110px' },
  { key: 'valor_unitario', label: 'Valor', align: 'right', width: '160px' },
  { key: 'valor_total', label: 'Total', align: 'right', width: '160px' },
  { key: 'acoes', label: '', align: 'right', width: '140px' },
]

const columnsPagamentos = [
  { key: 'forma', label: 'Forma', width: '220px' },
  { key: 'parcelas', label: 'Parcelas', width: '120px', align: 'right' },
  { key: 'valor', label: 'Valor', width: '160px', align: 'right' },
  { key: 'data_prevista', label: 'Previsto', width: '150px' },
  { key: 'data_recebimento', label: 'Recebido', width: '150px' },
  { key: 'acoes', label: 'Ações', width: '140px', align: 'right' },
]


const columnsComissoes = [
  { key: 'tipo', label: 'Tipo', width: '220px' },
  { key: 'responsavel', label: 'Responsável' },
  { key: 'percentual', label: '%', width: '120px', align: 'right' },
  { key: 'valor', label: 'Valor', width: '160px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '140px', align: 'right' },
]

// =======================
// PAGAMENTOS / RATEIO
// =======================
function addPagamento() {
  form.pagamentos.push({
    forma_pagamento_chave: '',
    valor: 0,
    parcelas: 1,
    data_prevista_recebimento: '',
    data_recebimento: '',
    status_financeiro_chave: 'EM_ABERTO',
  })
}

function removerPagamento(idx) {
  if (form.pagamentos.length === 1) return
  form.pagamentos.splice(idx, 1)
}

const somaPagamentos = computed(() =>
  round2((form.pagamentos || []).reduce((acc, p) => acc + num(p?.valor || 0), 0)),
)
const diferencaRateio = computed(() => round2(somaPagamentos.value - num(form.valor_vendido || 0)))
const pagamentosBatendo = computed(() => diferencaRateio.value === 0)

// =======================
// COMISSÕES
// =======================
function addComissao() {
  form.comissoes.push({ tipo_comissao_chave: 'VENDEDOR', responsavel_nome: '' })
}
function removerComissao(idx) {
  form.comissoes.splice(idx, 1)
}

const valor_bruto = computed(() => round2(num(form.valor_vendido || 0)))

const valorComissao = (row) => {
  const pct = pctComissao(row?.tipo_comissao_chave)
  return round2(valor_bruto.value * (pct / 100))
}
const valor_comissoes = computed(() =>
  round2((form.comissoes || []).reduce((acc, c) => acc + valorComissao(c), 0)),
)

// =======================
// TAXAS
// =======================
const valor_taxa_pagamento = computed(() =>
  round2(
    (form.pagamentos || []).reduce((acc, p) => {
      const v = num(p?.valor || 0)
      const pct = taxaPctPorForma(p?.forma_pagamento_chave, p?.parcelas)
      return acc + round2(v * (pct / 100))
    }, 0),
  ),
)

const taxa_pagamento_percentual_calc = computed(() => {
  const base = num(form.valor_vendido || 0)
  if (base <= 0) return 0
  return round2((valor_taxa_pagamento.value / base) * 100)
})

watch(
  [() => form.pagamentos, () => form.valor_vendido],
  () => {
    form.taxa_pagamento_percentual_aplicado = taxa_pagamento_percentual_calc.value
  },
  { deep: true },
)

watch(() => form.tem_nota_fiscal, (v) => {
  form.taxa_nota_fiscal_percentual_aplicado = v ? Number(TAXA_NOTA_FISCAL?.taxa || 0) : 0
})

const valor_taxa_nf = computed(() => {
  if (!form.tem_nota_fiscal) return 0
  return round2(valor_bruto.value * (num(form.taxa_nota_fiscal_percentual_aplicado || 0) / 100))
})

const total_taxas = computed(() => round2(valor_taxa_pagamento.value + valor_taxa_nf.value))
const lucro_bruto = computed(() => round2(valor_bruto.value - total_taxas.value - valor_comissoes.value))

// =======================
// VALIDAÇÃO
// =======================
const podeSalvar = computed(() => {
  if (!clienteFiltroId.value && !isEdit.value) return false
  if (!form.orcamento_id) return false
  if (!form.data_venda) return false
  if (valor_bruto.value <= 0) return false
  if (!form.itens?.length) return false
  if (!form.pagamentos?.length) return false
  if (!pagamentosBatendo.value) return false
  return true
})

// =======================
// LOADERS
// =======================
async function carregarClientesOptions() {
  const { data } = await ClienteService.listar()
  const rows = Array.isArray(data) ? data : (data?.rows || data?.data || [])
  clientesOptions.value = rows.map((c) => ({
    label: c.nome_completo || c.razao_social || c.nome_fantasia || c.nome || `CLIENTE #${c.id}`,
    value: c.id,
  }))
}

async function carregarOrcamentosOptions(clienteId) {
  const { data } = await OrcamentosService.listar()
  const rows = Array.isArray(data) ? data : (data?.rows || data?.data || [])
  orcamentosOptions.value = rows
    .filter((o) => Number(o?.cliente_id) === Number(clienteId))
    .map((o) => ({ label: `Orçamento #${o.id}`, value: o.id }))
}

async function carregarOrcamentoNaVenda(orcamentoId) {
  loading.value = true
  try {
    const { data } = await OrcamentosService.detalhar(orcamentoId)

    form.itens = (data?.itens || []).map((it) => ({
      nome_ambiente: it.nome_ambiente,
      descricao: it.descricao,
      observacao: '',
      quantidade: 1,
      valor_unitario: Number(it.valor_unitario || 0),
    }))

    const soma = round2((form.itens || []).reduce((acc, it) => acc + totalItem(it), 0))
    form.valor_vendido = round2(soma)

    if (form.pagamentos.length === 1 && num(form.pagamentos[0].valor) === 0 && form.valor_vendido > 0) {
      form.pagamentos[0].valor = round2(form.valor_vendido)
    }
  } catch (e) {
    console.error(e)
    notify.error('Erro ao carregar orçamento')
  } finally {
    loading.value = false
  }
}

async function carregarVenda() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const { data } = await VendaService.buscar(vendaId.value)

    clienteFiltroId.value = data?.cliente_id ? String(data.cliente_id) : ''
    await carregarOrcamentosOptions(clienteFiltroId.value)

    form.orcamento_id = data?.orcamento_id ?? ''
    form.data_venda = data?.data_venda ? String(data.data_venda).slice(0, 10) : form.data_venda
    form.valor_vendido = round2(num(data?.valor_vendido || 0))

    form.taxa_pagamento_percentual_aplicado = round2(num(data?.taxa_pagamento_percentual_aplicado || 0))
    form.taxa_nota_fiscal_percentual_aplicado = round2(num(data?.taxa_nota_fiscal_percentual_aplicado || 0))
    form.tem_nota_fiscal = num(form.taxa_nota_fiscal_percentual_aplicado) > 0

    form.itens = (data?.itens || []).map((it) => ({
      id: it.id,
      nome_ambiente: it.nome_ambiente,
      descricao: it.descricao,
      observacao: it.observacao || '',
      quantidade: Number(it.quantidade || 1),
      valor_unitario: Number(it.valor_unitario || 0),
    }))

form.pagamentos = (data?.pagamentos || []).map((p) => ({
  id: p.id,
  forma_pagamento_chave: p.forma_pagamento_chave || '',
  valor: round2(num(p.valor || 0)),
  parcelas: 1,
  data_prevista_recebimento: p.data_prevista_recebimento ? String(p.data_prevista_recebimento).slice(0, 10) : '',
  data_recebimento: p.data_recebimento ? String(p.data_recebimento).slice(0, 10) : '',
  status_financeiro_chave: p.status_financeiro_chave || 'EM_ABERTO',
}))

if (!form.pagamentos.length) {
  form.pagamentos = [{
    forma_pagamento_chave: '',
    valor: round2(form.valor_vendido),
    parcelas: 1,
    data_prevista_recebimento: '',
    data_recebimento: '',
    status_financeiro_chave: 'EM_ABERTO',
  }]
}

    form.comissoes = (data?.comissoes || []).map((c) => ({
      id: c.id,
      tipo_comissao_chave: c.tipo_comissao_chave || 'VENDEDOR',
      responsavel_nome: c.responsavel_nome || '',
    }))

    await listarArquivos()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao carregar venda')
  } finally {
    loading.value = false
  }
}

// =======================
// ITENS (EDIT): endpoint PUT item (backend)
// =======================
async function iniciarEdicaoItem(row) {
  if (!isEdit.value || !row?.id) return
  try {
    await VendaService.atualizarItem(vendaId.value, row.id, {
      nome_ambiente: row.nome_ambiente,
      descricao: row.descricao,
      observacao: row.observacao || '',
      quantidade: Number(row.quantidade || 1),
      valor_unitario: round2(num(row.valor_unitario || 0)),
    })
    await carregarVenda()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao salvar item')
  }
}

// =======================
// PAYLOAD
// =======================
function montarPayload() {
  return {
    orcamento_id: Number(form.orcamento_id),
    status: pipelineKey('VENDA_FECHADA'),
    data_venda: form.data_venda ? String(form.data_venda) : undefined,
    valor_vendido: round2(num(form.valor_vendido || 0)),

    taxa_pagamento_percentual_aplicado: round2(num(form.taxa_pagamento_percentual_aplicado || 0)),
    tem_nota_fiscal: Boolean(form.tem_nota_fiscal),
    taxa_nota_fiscal_percentual_aplicado: round2(num(form.taxa_nota_fiscal_percentual_aplicado || 0)),

pagamentos: (form.pagamentos || []).map((p) => ({
  forma_pagamento_chave: String(p.forma_pagamento_chave || ''),
  valor: round2(num(p.valor || 0)),
  data_prevista_recebimento: p.data_prevista_recebimento || null,
  data_recebimento: p.data_recebimento || null,
  status_financeiro_chave: p.status_financeiro_chave || 'EM_ABERTO',
})),


    comissoes: (form.comissoes || []).map((c) => ({
      tipo_comissao_chave: String(c.tipo_comissao_chave || ''),
      percentual_aplicado: round2(pctComissao(c.tipo_comissao_chave)),
      responsavel_nome: c.responsavel_nome || null,
    })),
  }
}

// =======================
// ACTIONS
// =======================
async function salvar() {
  if (saving.value) return
  saving.value = true
  try {
    const payload = montarPayload()

    if (isEdit.value) {
      await VendaService.salvar(vendaId.value, payload)
      notify.success('Salvo!')
      router.push('/vendas')
      return
    }

    await VendaService.salvar(null, payload)
    notify.success('Criado!')
    router.push('/vendas')
  } catch (e) {
    console.error(e)
    notify.error('Erro ao salvar venda')
  } finally {
    saving.value = false
  }
}


async function enviarParaProducao() {
  if (!isEdit.value) return
  try {
    await ProducaoService.encaminhar({
      origem_tipo: 'VENDA_CLIENTE',
      origem_id: vendaId.value,
      status: pipelineKey('EM_PRODUCAO'),
    })
    notify.success('Enviado para produção!')
    await carregarVenda()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao enviar para produção')
  }
}

// =======================
// ARQUIVOS
// =======================
async function listarArquivos() {
  if (!isEdit.value) return
  const { data } = await VendaService.listarArquivos(vendaId.value)
  arquivos.value = Array.isArray(data) ? data : (data?.rows || data?.data || [])
}

function abrirFilePicker() {
  if (!isEdit.value) return
  fileInput.value?.click?.()
}

async function uploadArquivo(event) {
  if (!isEdit.value) return
  const file = event?.target?.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    await VendaService.uploadArquivo(vendaId.value, file)
    notify.success('Arquivo anexado!')
    await listarArquivos()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao anexar arquivo')
  } finally {
    uploading.value = false
    if (event?.target) event.target.value = ''
  }
}

async function abrirArquivo(arquivoId) {
  if (!isEdit.value) return
  try {
    await VendaService.abrirArquivo(vendaId.value, arquivoId)
  } catch (e) {
    console.error(e)
    notify.error('Erro ao abrir arquivo')
  }
}

async function deletarArquivo(arquivoId) {
  if (!isEdit.value) return
  try {
    await VendaService.removerArquivo(vendaId.value, arquivoId)
    notify.success('Excluído!')
    await listarArquivos()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao excluir arquivo')
  }
}


// =======================
// WATCHERS
// =======================
watch(
  () => clienteFiltroId.value,
  async (val) => {
    if (isEdit.value) return
    form.orcamento_id = ''
    orcamentosOptions.value = []
    form.itens = []
    if (!val) return

    try {
      await carregarOrcamentosOptions(val)
    } catch (e) {
      console.error(e)
      notify.error('Erro ao carregar orçamentos')
    }
  },
)

watch(
  () => form.orcamento_id,
  async (val) => {
    if (!val) return
    if (isEdit.value) return
    await carregarOrcamentoNaVenda(val)
  },
)

watch(
  () => form.valor_vendido,
  (v) => {
    if (form.pagamentos.length === 1 && num(form.pagamentos[0].valor) === 0 && num(v) > 0) {
      form.pagamentos[0].valor = round2(num(v))
    }
  },
)

// =======================
// INIT
// =======================
onMounted(async () => {
  loading.value = true
  try {
    await carregarClientesOptions()
    if (isEdit.value) await carregarVenda()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao inicializar')
  } finally {
    loading.value = false
  }
})
</script>



