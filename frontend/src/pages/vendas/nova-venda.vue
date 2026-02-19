<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Fechamento da Venda"
        subtitle="Defina o valor final e condições a partir do orçamento aprovado"
        icon="pi pi-dollar"
      >
        <template #actions>
          <RouterLink
            to="/orcamentos"
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-soft hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <i class="pi pi-arrow-left text-xs"></i>
            Voltar para Orçamentos
          </RouterLink>
        </template>
      </PageHeader>

      <div class="p-6 md:p-8 border-t border-border-ui space-y-8">
        <Loading v-if="loading" />

        <div v-else class="space-y-8">
          <!-- RESUMO DO ORÇAMENTO -->
          <section v-if="orcamento" class="space-y-3">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Resumo do Orçamento
            </div>
            <div class="rounded-2xl border border-border-ui bg-bg-page p-4 space-y-2">
              <p class="text-sm font-bold text-text-main">
                Cliente:
                <span class="font-normal">
                  {{ orcamento.cliente_nome_snapshot || orcamento.cliente?.nome_completo || orcamento.cliente?.razao_social || '-' }}
                </span>
              </p>
              <p class="text-sm font-bold text-text-main">
                Orçamento:
                <span class="font-normal">#{{ orcamento.id }}</span>
              </p>
              <p class="text-sm font-bold text-text-main">
                Valor orçado (soma dos itens):
                <span class="font-black text-brand-primary">
                  {{ format.currency(totalOrcado) }}
                </span>
              </p>
            </div>

            <div class="rounded-2xl border border-border-ui bg-white overflow-hidden">
              <div class="flex items-center justify-between px-4 pt-4 pb-2">
                <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
                  Itens da Venda (não altera o orçamento)
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  @click="adicionarItemVenda"
                >
                  + Adicionar ambiente
                </Button>
              </div>
              <Table :columns="columnsItens" :rows="rowsItens" :boxed="false">
                <template #cell-nome_ambiente="{ row }">
                  <Input
                    v-model="itens[row.__idx].nome_ambiente"
                    :forceUpper="false"
                  />
                </template>
                <template #cell-descricao="{ row }">
                  <textarea
                    v-model="itens[row.__idx].descricao"
                    rows="3"
                    class="w-full p-2 rounded-xl border border-border-ui bg-bg-page text-sm text-text-main outline-none resize-y focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  ></textarea>
                </template>
                <template #cell-valor_orcado="{ row }">
                  <span class="font-bold">
                    {{ format.currency(row.valor_unitario || 0) }}
                  </span>
                </template>
                <template #cell-valor_rateado="{ row }">
                  <Input
                    :modelValue="format.currency(itens[row.__idx].valor_final || 0)"
                    type="text"
                    inputmode="numeric"
                    :forceUpper="false"
                    class="w-full text-right"
                    @update:modelValue="(val) => { itens[row.__idx].valor_final = moedaParaNumero(val); sincronizarValorFinalComTotal() }"
                  />
                </template>
                <template #cell-acoes="{ row }">
                  <div class="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      @click="editarItemVenda(row.__idx)"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      type="button"
                      @click="removerItemVenda(row.__idx)"
                    >
                      Excluir
                    </Button>
                  </div>
                </template>
              </Table>
            </div>
          </section>

          <!-- FECHAMENTO / VALOR FINAL -->
          <section class="space-y-4">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Fechamento da Venda
            </div>

            <div class="grid grid-cols-12 gap-4 items-end">
              <div class="col-span-12 md:col-span-4">
                <Input
                  :modelValue="format.currency(valorFinal)"
                  label="Valor final da venda (com desconto) *"
                  type="text"
                  inputmode="numeric"
                  :forceUpper="false"
                  @update:modelValue="onValorFinalInput"
                />
              </div>

              <div class="col-span-12 md:col-span-4">
                <Input
                  v-model="formaPagamentoTexto"
                  label="Condição de pagamento (texto para o contrato)"
                  placeholder="Ex: 30% na assinatura e 70% na entrega..."
                />
              </div>

              <div class="col-span-12 md:col-span-2">
                <Input
                  v-model="dataVenda"
                  type="date"
                  label="Data da venda"
                  :forceUpper="false"
                />
              </div>
            </div>

            <p class="text-[11px] text-text-soft">
              O valor final informado será utilizado como base da venda e dos recebimentos.
            </p>
          </section>

          <!-- FORMAS DE PAGAMENTO (SEM VALIDAR COM VALOR FINAL) -->
          <section class="space-y-4">
            <div class="flex items-center justify-between gap-4">
              <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
                Formas de pagamento
              </div>

              <Button
                variant="secondary"
                size="sm"
                type="button"
                @click="adicionarPagamento"
              >
                + Adicionar pagamento
              </Button>
            </div>

            <Table
              :columns="columnsPagamentos"
              :rows="rowsPagamentos"
              :boxed="true"
              empty-text="Nenhum pagamento definido."
            >
              <template #cell-forma="{ row }">
                <SearchInput
                  v-model="pagamentos[row.__idx].forma_pagamento_chave"
                  mode="select"
                  placeholder="Selecione..."
                  :options="FORMAS_PAGAMENTO_OPTIONS"
                />
              </template>

              <template #cell-parcelas="{ row }">
                <Input
                  v-model.number="pagamentos[row.__idx].parcelas"
                  type="number"
                  min="1"
                  max="24"
                  :forceUpper="false"
                />
              </template>

              <template #cell-data_recebimento="{ row }">
                <div class="space-y-1.5">
                  <div
                    v-for="(parc, i) in normalizeDatasParcelas(pagamentos[row.__idx])"
                    :key="i"
                    class="flex items-center gap-2"
                  >
                    <span class="w-5 text-[10px] font-bold text-text-soft text-right">{{ i + 1 }} —</span>
                    <div class="flex-1 min-w-0">
                      <Input
                        v-model="pagamentos[row.__idx].datas_parcelas[i].data"
                        type="date"
                        :forceUpper="false"
                        class="w-full"
                      />
                    </div>
                    <div class="w-28">
                      <Input
                        :modelValue="format.currency(pagamentos[row.__idx].datas_parcelas[i].valor || 0)"
                        type="text"
                        inputmode="numeric"
                        :forceUpper="false"
                        class="w-full text-right"
                        @update:modelValue="(val) => { pagamentos[row.__idx].datas_parcelas[i].valor = moedaParaNumero(val); recomputarTotalPagamento(row.__idx) }"
                      />
                    </div>
                  </div>
                </div>
              </template>

              <template #cell-acoes="{ row }">
                <div class="flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    :disabled="pagamentos.length === 1"
                    @click="removerPagamento(row.__idx)"
                  >
                    Remover
                  </Button>
                </div>
              </template>
            </Table>

            <p class="text-[11px] text-text-soft">
              Essas formas de pagamento serão usadas para registrar como a venda será recebida.
            </p>
          </section>

          <!-- COMISSÕES (APENAS TIPO + NOME, SEM TAXAS) -->
          <section class="space-y-4">
            <div class="flex items-center justify-between gap-4">
              <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
                Comissões (somente tipo e nome)
              </div>

              <Button
                variant="secondary"
                size="sm"
                type="button"
                @click="adicionarComissao"
              >
                + Adicionar comissionado
              </Button>
            </div>

            <Table
              :columns="columnsComissoes"
              :rows="rowsComissoes"
              :boxed="true"
              empty-text="Nenhum comissionado definido."
            >
              <template #cell-tipo="{ row }">
                <SearchInput
                  v-model="comissoes[row.__idx].tipo_comissao_chave"
                  mode="select"
                  placeholder="Selecione o tipo"
                  :options="COMISSOES_OPTIONS"
                />
              </template>

              <template #cell-responsavel="{ row }">
                <Input
                  v-model="comissoes[row.__idx].responsavel_nome"
                  placeholder="Nome do comissionado"
                  :forceUpper="false"
                />
              </template>

              <template #cell-acoes="{ row }">
                <div class="flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    @click="removerComissao(row.__idx)"
                  >
                    Remover
                  </Button>
                </div>
              </template>
            </Table>

            <p class="text-[11px] text-text-soft">
              As taxas e valores das comissões serão calculados automaticamente a partir do tipo configurado no sistema.
            </p>
          </section>

          <!-- ARQUIVOS VINCULADOS AO ORÇAMENTO -->
          <section v-if="orcamento" class="space-y-6 border-t border-border-ui pt-6">
            <!-- Imagens para PDF do orçamento -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-xs font-black uppercase tracking-widest text-text-soft">
                  Imagens do orçamento
                </div>
                <div class="flex items-center gap-2">
                  <input
                    ref="fileInputImagemPdf"
                    type="file"
                    class="hidden"
                    accept="image/*"
                    @change="(e) => onPickArquivo(e, 'IMAGEM_PDF')"
                  />
                  <Button
                    v-if="can('orcamentos.editar') && can('arquivos.criar')"
                    size="sm"
                    variant="ghost"
                    type="button"
                    @click="clicarAdicionarArquivo('IMAGEM_PDF')"
                  >
                    <i class="pi pi-upload mr-1"></i> ADICIONAR IMAGEM
                  </Button>
                </div>
              </div>
              <p class="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                Imagens vinculadas ao orçamento original. Serão reutilizadas nos documentos relacionados à venda.
              </p>
              <div class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden max-h-[200px] overflow-y-auto">
                <Table
                  :columns="colArquivos"
                  :rows="imagensParaPdf"
                  :loading="loadingImagensPdf"
                  empty-text="Nenhuma imagem."
                  :boxed="false"
                >
                  <template #cell-nome="{ row }">
                    <div class="flex flex-col">
                      <span class="text-xs font-black text-text-main">{{ row.nome || row.filename }}</span>
                      <span class="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                        {{ row.mime_type || 'IMAGEM' }}
                      </span>
                    </div>
                  </template>
                  <template #cell-acoes="{ row }">
                    <div class="flex justify-end gap-2">
                      <Button
                        v-if="can('arquivos.ver') || can('orcamentos.ver')"
                        variant="secondary"
                        size="sm"
                        type="button"
                        @click="abrirArquivo(row)"
                      >
                        Ver
                      </Button>
                      <Button
                        v-if="can('arquivos.excluir') && can('orcamentos.editar')"
                        variant="danger"
                        size="sm"
                        type="button"
                        @click="excluirArquivo(row.id, 'IMAGEM_PDF')"
                      >
                        Excluir
                      </Button>
                    </div>
                  </template>
                </Table>
              </div>
            </div>

            <!-- Anexos do orçamento -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-xs font-black uppercase tracking-widest text-text-soft">
                  Anexos do orçamento
                </div>
                <div class="flex items-center gap-2">
                  <input
                    ref="fileInputAnexos"
                    type="file"
                    class="hidden"
                    @change="(e) => onPickArquivo(e, 'ANEXO')"
                  />
                  <Button
                    v-if="can('orcamentos.editar') && can('arquivos.criar')"
                    size="sm"
                    variant="ghost"
                    type="button"
                    @click="clicarAdicionarArquivo('ANEXO')"
                  >
                    <i class="pi pi-upload mr-1"></i> ADICIONAR ARQUIVO
                  </Button>
                </div>
              </div>
              <p class="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                PDFs e outros arquivos anexados ao orçamento. Ficam vinculados ao orçamento e podem ser consultados pela venda.
              </p>
              <div class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden max-h-[200px] overflow-y-auto">
                <Table
                  :columns="colArquivos"
                  :rows="anexosDocumentos"
                  :loading="loadingAnexos"
                  empty-text="Nenhum anexo ou documento."
                  :boxed="false"
                >
                  <template #cell-nome="{ row }">
                    <div class="flex flex-col">
                      <span class="text-xs font-black text-text-main">{{ row.nome || row.filename }}</span>
                      <span class="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                        {{ row.mime_type || 'ARQUIVO' }}
                      </span>
                    </div>
                  </template>
                  <template #cell-acoes="{ row }">
                    <div class="flex justify-end gap-2">
                      <Button
                        v-if="can('arquivos.ver') || can('orcamentos.ver')"
                        variant="secondary"
                        size="sm"
                        type="button"
                        @click="abrirArquivo(row)"
                      >
                        Ver
                      </Button>
                      <Button
                        v-if="can('arquivos.excluir') && can('orcamentos.editar')"
                        variant="danger"
                        size="sm"
                        type="button"
                        @click="excluirArquivo(row.id, 'ANEXO')"
                      >
                        Excluir
                      </Button>
                    </div>
                  </template>
                </Table>
              </div>
            </div>
          </section>

          <!-- AÇÕES -->
          <section class="flex justify-end gap-3 pt-4 border-t border-border-ui">
            <Button
              variant="primary"
              :disabled="saving || !orcamento || valorFinal <= 0"
              :loading="saving"
              @click="criarVenda"
            >
              <i class="pi pi-check mr-2" />
              Criar venda
            </Button>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { OrcamentosService, VendaService, ArquivosService } from '@/services'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { format } from '@/utils/format'
import { FORMAS_PAGAMENTO, COMISSOES } from '@/constantes'
import { moedaParaNumero } from '@/utils/number'

definePage({ meta: { perm: 'vendas.criar' } })

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)

const orcamento = ref(null)
const itens = ref([])

const valorFinal = ref(0)
const formaPagamentoTexto = ref('')
const dataVenda = ref(new Date().toISOString().slice(0, 10))

const FORMAS_PAGAMENTO_OPTIONS = (FORMAS_PAGAMENTO || []).map((x) => ({
  label: x.label,
  value: x.key,
}))

const FORMAS_COM_DATA_POR_PARCELA = ['PIX', 'DINHEIRO', 'CHEQUE', 'TRANSFERENCIA']

const COMISSOES_OPTIONS = Object.entries(COMISSOES || {}).map(([key, v]) => ({
  label: v.label,
  value: key,
}))

const pagamentos = ref([
  {
    forma_pagamento_chave: '',
    valor: 0, // continua existindo só para compatibilidade/validação
    parcelas: 1,
    data_recebimento: '',
    // cada parcela com sua própria data e valor
    datas_parcelas: [{ data: '', valor: 0 }],
  },
])

const comissoes = ref([
  {
    tipo_comissao_chave: 'VENDEDOR',
    responsavel_nome: '',
  },
])

const columnsPagamentos = [
  { key: 'forma', label: 'Forma', width: '220px' },
  { key: 'parcelas', label: 'Parcelas', width: '100px', align: 'right' },
  { key: 'data_recebimento', label: 'Data(s) / Valor(es)', width: '260px' },
  { key: 'acoes', label: '', width: '100px', align: 'right' },
]

const rowsPagamentos = computed(() =>
  (pagamentos.value || []).map((p, idx) => ({ ...p, __idx: idx })),
)

const columnsComissoes = [
  { key: 'tipo', label: 'Tipo', width: '220px' },
  { key: 'responsavel', label: 'Comissionado' },
  { key: 'acoes', label: '', width: '100px', align: 'right' },
]

const rowsComissoes = computed(() =>
  (comissoes.value || []).map((c, idx) => ({ ...c, __idx: idx })),
)

const imagensParaPdf = ref([])
const anexosDocumentos = ref([])
const loadingImagensPdf = ref(false)
const loadingAnexos = ref(false)
const fileInputImagemPdf = ref(null)
const fileInputAnexos = ref(null)

const colArquivos = [
  { key: 'nome', label: 'ARQUIVO' },
  { key: 'acoes', label: '', align: 'right', width: '220px' },
]

const columnsItens = [
  { key: 'nome_ambiente', label: 'Item/Ambiente' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'valor_orcado', label: 'Valor orçado', align: 'right', width: '140px' },
  { key: 'valor_rateado', label: 'Valor após desconto', align: 'right', width: '160px' },
  { key: 'acoes', label: '', width: '150px', align: 'right' },
]

const rowsItens = computed(() =>
  (itens.value || []).map((it, idx) => ({
    ...it,
    __idx: idx,
  })),
)

const totalOrcado = computed(() =>
  (itens.value || []).reduce((acc, it) => acc + Number(it.valor_unitario || 0), 0),
)

const totalFinal = computed(() =>
  (itens.value || []).reduce((acc, it) => acc + Number(it.valor_final || 0), 0),
)

function pctComissao(tipo) {
  return Number(COMISSOES?.[String(tipo || '')]?.percentual || 0)
}

const descontoTotal = computed(() => {
  const tot = Number(totalOrcado.value || 0)
  const vf = Number(valorFinal.value || 0)
  return Math.max(0, tot - vf)
})

function adicionarPagamento() {
  pagamentos.value.push({
    forma_pagamento_chave: '',
    valor: 0,
    parcelas: 1,
    data_recebimento: '',
    datas_parcelas: [{ data: '', valor: 0 }],
  })
}

function removerPagamento(idx) {
  if (pagamentos.value.length === 1) return
  pagamentos.value.splice(idx, 1)
}

function ensureDatasParcelas(p) {
  if (!FORMAS_COM_DATA_POR_PARCELA.includes(p.forma_pagamento_chave)) return
  const n = Math.max(1, Math.min(24, Number(p.parcelas || 1)))
  if (!Array.isArray(p.datas_parcelas)) p.datas_parcelas = []
  while (p.datas_parcelas.length < n) {
    p.datas_parcelas.push({ data: '', valor: 0 })
  }
  if (p.datas_parcelas.length > n) p.datas_parcelas = p.datas_parcelas.slice(0, n)
}

function normalizeDatasParcelas(p) {
  ensureDatasParcelas(p)
  return Array.isArray(p.datas_parcelas) ? p.datas_parcelas : []
}

function recomputarTotalPagamento(idx) {
  const p = pagamentos.value[idx]
  if (!p || !Array.isArray(p.datas_parcelas)) return
  p.valor = p.datas_parcelas.reduce(
    (acc, parc) => acc + Number(parc?.valor || 0),
    0,
  )
}

function mostrarDataPorParcela(p) {
  if (!p || !FORMAS_COM_DATA_POR_PARCELA.includes(p.forma_pagamento_chave)) return false
  const n = Math.max(1, Math.min(24, Number(p.parcelas || 1)))
  if (n <= 1) return false
  ensureDatasParcelas(p)
  return true
}

function adicionarComissao() {
  comissoes.value.push({
    tipo_comissao_chave: 'VENDEDOR',
    responsavel_nome: '',
  })
}

function removerComissao(idx) {
  comissoes.value.splice(idx, 1)
}

async function carregarImagensParaPdf() {
  const id = orcamento.value?.id
  if (!id) {
    imagensParaPdf.value = []
    return
  }
  loadingImagensPdf.value = true
  try {
    const res = await ArquivosService.listar({
      ownerType: 'ORCAMENTO',
      ownerId: Number(String(id).replace(/\D/g, '')),
      categoria: 'IMAGEM_PDF',
    })
    const arr = res?.data?.data ?? res?.data ?? res
    imagensParaPdf.value = Array.isArray(arr) ? arr : []
  } finally {
    loadingImagensPdf.value = false
  }
}

async function carregarAnexosDocumentos() {
  const id = orcamento.value?.id
  if (!id) {
    anexosDocumentos.value = []
    return
  }
  loadingAnexos.value = true
  try {
    const res = await ArquivosService.listar({
      ownerType: 'ORCAMENTO',
      ownerId: Number(String(id).replace(/\D/g, '')),
      categoria: 'ANEXO',
    })
    const arr = res?.data?.data ?? res?.data ?? res
    anexosDocumentos.value = Array.isArray(arr) ? arr : []
  } finally {
    loadingAnexos.value = false
  }
}

function carregarArquivos() {
  carregarImagensParaPdf()
  carregarAnexosDocumentos()
}

function abrirArquivo(row) {
  const oid = String(orcamento.value?.id || '').replace(/\D/g, '')
  const backTo = encodeURIComponent(`/vendas/fechamento?orcamentoId=${oid}`)
  const name = encodeURIComponent(row?.nome || row?.filename || 'ARQUIVO')
  const type = encodeURIComponent(row?.mime_type || '')

  router.push(`/arquivos/${row.id}?name=${name}&type=${type}&backTo=${backTo}`)
}

async function excluirArquivo(arquivoId, _categoria) {
  if (!can('arquivos.excluir') || !can('orcamentos.editar')) return notify.error('Acesso negado.')

  try {
    await ArquivosService.remover(Number(arquivoId))
    notify.success('Arquivo removido.')
    await carregarArquivos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao excluir arquivo.')
  }
}

function clicarAdicionarArquivo(categoria) {
  if (!can('orcamentos.editar') || !can('arquivos.criar')) return notify.error('Acesso negado.')
  if (!orcamento.value?.id) return notify.error('Orçamento não carregado.')

  const input = categoria === 'IMAGEM_PDF' ? fileInputImagemPdf.value : fileInputAnexos.value
  if (!input) return notify.error('Input de arquivo não montado.')
  input.click()
}

async function onPickArquivo(e, categoria) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return

  if (!can('arquivos.criar') || !can('orcamentos.editar')) return notify.error('Acesso negado.')
  if (!orcamento.value?.id) return notify.error('Orçamento não carregado.')

  try {
    await ArquivosService.upload({
      ownerType: 'ORCAMENTO',
      ownerId: Number(String(orcamento.value.id).replace(/\D/g, '')),
      categoria: categoria || 'ANEXO',
      file,
    })
    notify.success(categoria === 'IMAGEM_PDF' ? 'Imagem adicionada.' : 'Arquivo anexado.')
    await carregarArquivos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao anexar arquivo.')
  }
}

function aplicarRateio() {
  const tot = Number(totalOrcado.value || 0)
  const vf = Number(valorFinal.value || 0)
  if (tot <= 0 || vf <= 0) {
    itens.value = (itens.value || []).map((it) => ({ ...it, valor_final: it.valor_unitario || 0 }))
    return
  }
  const fator = vf / tot
  itens.value = (itens.value || []).map((it) => ({
    ...it,
    valor_final: Math.round(Number(it.valor_unitario || 0) * fator * 100) / 100,
  }))
}

function sincronizarValorFinalComTotal() {
  const soma = Number(totalFinal.value || 0)
  valorFinal.value = soma
}

function onValorFinalInput(v) {
  const n = Number(String(v || '').replace(/\D/g, ''))
  valorFinal.value = Number.isFinite(n) ? n / 100 : 0
  aplicarRateio()
}

function adicionarItemVenda() {
  itens.value.push({
    nome_ambiente: '',
    descricao: '',
    valor_unitario: 0,
    valor_final: 0,
  })
}

function editarItemVenda(_idx) {
  // Os campos já são editáveis na própria linha.
  // Mantemos o botão por clareza visual para o vendedor.
}

function removerItemVenda(idx) {
  if (!itens.value || itens.value.length === 0) return
  itens.value.splice(idx, 1)
  sincronizarValorFinalComTotal()
}

async function carregarOrcamento() {
  const idParam = route.query?.orcamentoId || route.params?.orcamentoId
  const id = Number(String(idParam || '').replace(/\D/g, ''))
  if (!id) {
    notify.error('Orçamento não informado.')
    return
  }

  loading.value = true
  try {
    const { data } = await OrcamentosService.detalhar(id)
    orcamento.value = data
    itens.value = (data?.itens || []).map((it) => ({
      nome_ambiente: it.nome_ambiente,
      descricao: it.descricao,
      valor_unitario: Number(it.valor_unitario || 0), // orçado (referência)
      valor_final: Number(it.valor_unitario || 0), // valor de venda inicial (pode ser alterado)
    }))
    const soma = (itens.value || []).reduce((acc, it) => acc + Number(it.valor_unitario || 0), 0)
    valorFinal.value = soma
    aplicarRateio()

    await carregarArquivos()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao carregar orçamento.')
  } finally {
    loading.value = false
  }
}

async function criarVenda() {
  if (!can('vendas.criar')) {
    notify.error('Acesso negado.')
    return
  }
  if (!orcamento.value) {
    notify.error('Orçamento não carregado.')
    return
  }
  if (!valorFinal.value || valorFinal.value <= 0) {
    notify.error('Informe o valor final da venda.')
    return
  }

  saving.value = true
  try {
    const pagamentosPayload = (function () {
      const list = []
      for (const p of pagamentos.value || []) {
        const forma = String(p.forma_pagamento_chave || '')
        const formaUpper = forma.toUpperCase()
        const nParcelas = Math.max(1, Math.min(24, Number(p.parcelas || 1)))
        const parcelas = Array.isArray(p.datas_parcelas) ? p.datas_parcelas : []

        // Cartão de crédito: 1 data/valor na tela, N parcelas geradas a cada 30 dias
        if (formaUpper === 'CREDITO' && parcelas.length && parcelas[0]?.data) {
          const base = parcelas[0]
          const valorParcela = Number(base.valor || 0)
          const dataBase = new Date(base.data)

          if (!Number.isNaN(dataBase.getTime())) {
            for (let i = 0; i < nParcelas; i++) {
              const d = new Date(dataBase)
              d.setDate(d.getDate() + 30 * i)
              const y = d.getFullYear()
              const m = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')

              list.push({
                forma_pagamento_chave: forma,
                valor: valorParcela,
                data_recebimento: `${y}-${m}-${day}`,
              })
            }
            continue
          }
        }

        // Demais formas: cada linha (data/valor) vira um pagamento
        if (parcelas.length) {
          for (const parc of parcelas) {
            list.push({
              forma_pagamento_chave: forma,
              valor: Number(parc?.valor || 0),
              data_recebimento: parc?.data || null,
            })
          }
        } else {
          list.push({
            forma_pagamento_chave: forma,
            valor: Number(p.valor || 0),
            data_recebimento: p.data_recebimento || null,
          })
        }
      }
      return list
    })()

    const comissoesPayload = (comissoes.value || []).map((c) => ({
      tipo_comissao_chave: String(c.tipo_comissao_chave || ''),
      percentual_aplicado: pctComissao(c.tipo_comissao_chave),
      responsavel_nome: c.responsavel_nome || null,
    }))

    const itensPayload = (itens.value || []).map((it) => ({
      nome_ambiente: it.nome_ambiente,
      descricao: it.descricao,
      quantidade: 1,
      valor_unitario: Number(it.valor_final ?? it.valor_unitario ?? 0),
    }))

    const payload = {
      orcamento_id: Number(orcamento.value.id),
      status: 'VENDA_FECHADA',
      data_venda: dataVenda.value,
      valor_vendido: Number(valorFinal.value),
      itens: itensPayload,
      pagamentos: pagamentosPayload.length ? pagamentosPayload : [
        {
          forma_pagamento_chave: 'PIX',
          valor: Number(valorFinal.value),
        },
      ],
      comissoes: comissoesPayload,
      // formaPagamentoTexto pode ser usada depois no pós-venda/contrato se você quiser
    }

    const { data } = await VendaService.salvar(null, payload)
    notify.success('Venda criada. Você será redirecionada para o contrato.')
    const id = data?.id
    if (id) {
      router.push({ path: '/contratos/novo', query: { vendaId: String(id) } })
    } else {
      router.push('/vendas')
    }
  } catch (e) {
    console.error(e)
    notify.error(e?.response?.data?.message || 'Erro ao criar venda.')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!can('vendas.criar')) {
    notify.error('Acesso negado.')
    router.push('/vendas')
    return
  }
  await carregarOrcamento()
})
</script>

