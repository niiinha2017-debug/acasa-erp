<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        :title="isEditMode ? `Editar venda #${vendaId}` : 'Fechamento da Venda'"
        :subtitle="isEditMode ? 'Altere itens, parcelas e comissões (mesma tela do fechamento).' : 'Defina o valor final e condições a partir do orçamento aprovado'"
        icon="pi pi-dollar"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <Button
              v-if="isEditMode && can('agendamentos.criar')"
              variant="secondary"
              size="sm"
              type="button"
              @click="abrirModalEnviarProducao"
            >
              <i class="pi pi-send mr-1" />
              Enviar para produção
            </Button>
            <RouterLink
              v-if="isEditMode"
              :to="`/vendas/venda/${vendaId}`"
              class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-soft hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <i class="pi pi-arrow-left text-xs"></i>
              Voltar para detalhe
            </RouterLink>
            <RouterLink
              v-else
              to="/orcamentos"
              class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-soft hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <i class="pi pi-arrow-left text-xs"></i>
              Voltar para Orçamentos
            </RouterLink>
          </div>
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

            <!-- FECHAMENTO / VALOR FINAL -->
            <section class="space-y-4 rounded-2xl border border-border-ui bg-bg-page p-4">
              <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
                Fechamento da Venda
              </div>

              <div class="grid grid-cols-12 gap-4 items-end">
                <div class="col-span-12 md:col-span-3">
                  <Input
                    v-model.number="percentualDesconto"
                    label="Desconto aplicado (%)"
                    type="number"
                    min="0"
                    :max="DESCONTO_MAXIMO_PERCENTUAL"
                    :step="DESCONTO_STEP"
                    :forceUpper="false"
                    @update:modelValue="onPercentualDescontoInput"
                  />
                </div>

                <div class="col-span-12 md:col-span-4">
                  <Input
                    :modelValue="format.currency(valorFinal)"
                    label="Valor final da venda (com desconto) *"
                    type="text"
                    inputmode="numeric"
                    :forceUpper="false"
                    disabled
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

                <div class="col-span-12">
                  <Input
                    v-model="enderecoEntrega"
                    label="Endereço da entrega"
                    placeholder="Rua, número, bairro, cidade/UF"
                    :forceUpper="false"
                  />
                </div>

              </div>

            </section>

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
                <template #cell-observacao="{ row }">
                  <Input
                    v-model="itens[row.__idx].observacao"
                    :forceUpper="false"
                    placeholder="Ex.: PUXADOR REFIL"
                  />
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
          <!-- FORMAS DE PAGAMENTO (SEM VALIDAR COM VALOR FINAL) -->
          <section class="space-y-4">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Formas de pagamento
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
                <Select
                  v-model="pagamentos[row.__idx].parcelas"
                  :options="PARCELAS_OPTIONS_FILTRADAS"
                  labelKey="label"
                  valueKey="value"
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
                        :modelValue="
                          String(pagamentos[row.__idx].forma_pagamento_chave || '').toUpperCase() === 'CREDITO'
                            ? format.currency(valorCobradoVenda)
                            : format.currency(pagamentos[row.__idx].datas_parcelas[i].valor || 0)
                        "
                        type="text"
                        inputmode="numeric"
                        :forceUpper="false"
                        :disabled="String(pagamentos[row.__idx].forma_pagamento_chave || '').toUpperCase() === 'CREDITO'"
                        class="w-full text-right"
                        @update:modelValue="
                          (val) => {
                            if (String(pagamentos[row.__idx].forma_pagamento_chave || '').toUpperCase() === 'CREDITO') return
                            pagamentos[row.__idx].datas_parcelas[i].valor = moedaParaNumero(val)
                            recomputarTotalPagamento(row.__idx)
                          }
                        "
                      />
                    </div>
                  </div>
                </div>
              </template>

            </Table>

            <div class="rounded-xl border border-border-ui bg-bg-page px-4 py-3 space-y-1">
              <p class="text-[11px] text-text-soft">
                Valor base da venda: <strong>{{ format.currency(valorFinal) }}</strong>
              </p>
              <p class="text-[11px] text-text-soft">
                Taxa aplicada: <strong>{{ Number(taxaCobradaPercentual || 0).toFixed(2).replace('.', ',') }}%</strong>
                <span v-if="taxaCobradaPercentual > 0"> (crédito acima de 10x)</span>
              </p>
              <p class="text-[12px] text-text-main font-bold">
                Preço cobrado da venda: {{ format.currency(valorCobradoVenda) }}
              </p>
            </div>
          </section>

          <!-- INDICAÇÃO -->
          <section class="space-y-4">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Indicação
            </div>
            <div class="rounded-2xl border border-border-ui bg-white p-4">
              <Input
                v-model="indicacaoNome"
                label="Nome da indicação"
                placeholder="Digite o nome"
                :forceUpper="false"
              />
            </div>
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
              @click="salvarVenda"
            >
              <i class="pi pi-check mr-2" />
              {{ isEditMode ? 'Salvar alterações' : 'Criar venda' }}
            </Button>
          </section>
        </div>
      </div>
    </div>

    <!-- Modal Enviar para Produção (Comercial – só após contrato assinado) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modalEnviarProducao.aberto"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          @click.self="fecharModalEnviarProducao"
        >
          <div class="w-full max-w-md rounded-2xl border border-border-ui bg-bg-card shadow-xl overflow-hidden flex flex-col">
            <div class="h-1 w-full bg-brand-primary" />
            <header class="flex items-center justify-between px-6 py-4 border-b border-border-ui">
              <div class="flex items-center gap-3">
                <i class="pi pi-send text-2xl text-text-soft"></i>
                <div>
                  <h3 class="text-lg font-semibold text-text-main">Enviar para Produção</h3>
                  <p class="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                    Cria agendamento na agenda para esta venda
                  </p>
                </div>
              </div>
              <button type="button" class="w-9 h-9 flex items-center justify-center rounded-lg border border-border-ui text-text-muted hover:text-rose-500" @click="fecharModalEnviarProducao">
                <i class="pi pi-times text-sm"></i>
              </button>
            </header>
            <form class="p-6 space-y-4" @submit.prevent="confirmarEnviarProducao">
              <Input v-model="modalEnviarProducao.titulo" label="Título do agendamento *" placeholder="Ex: Produção Venda #..." required />
              <div class="grid grid-cols-2 gap-4">
                <Input v-model="modalEnviarProducao.inicio_em" label="Início *" type="datetime-local" required />
                <Input v-model="modalEnviarProducao.fim_em" label="Término *" type="datetime-local" required />
              </div>
              <div class="flex justify-end gap-3 pt-4 border-t border-border-ui">
                <Button type="button" variant="ghost" @click="fecharModalEnviarProducao">Cancelar</Button>
                <Button type="submit" variant="primary" :loading="modalEnviarProducao.salvando">
                  <i class="pi pi-send mr-2"></i>
                  Enviar para Produção
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AgendaService, ConfiguracaoService, ContratosService, FuncionarioService, OrcamentosService, VendaService, ArquivosService } from '@/services'
import { notify } from '@/services/notify'
import { can } from '@/services/permissions'
import { format } from '@/utils/format'
import { FORMAS_PAGAMENTO, TAXAS_CARTAO, VENDA_FECHAMENTO_REGRAS } from '@/constantes'
import { moedaParaNumero } from '@/utils/number'
import { onlyNumbers } from '@/utils/masks'
import { closeTabAndGo } from '@/utils/tabs'

definePage({ meta: { perm: 'vendas.criar' } })

const route = useRoute()
const router = useRouter()

const vendaId = computed(() => {
  const p = route.query?.vendaId || route.params?.vendaId
  return p ? String(p).replace(/\D/g, '') || null : null
})
const isEditMode = computed(() => !!vendaId.value)

const loading = ref(false)
const saving = ref(false)

const orcamento = ref(null)
const contratos = ref([])
const clienteIdVenda = ref(null)
const configuracaoEmpresa = ref(null)

const contratoAssinado = computed(() =>
  (contratos.value || []).some((c) => String(c.status || '').toUpperCase() === 'VIGENTE'),
)

const modalEnviarProducao = ref({
  aberto: false,
  titulo: '',
  inicio_em: '',
  fim_em: '',
  funcionarioSelecionado: null,
  equipe_ids: [],
  salvando: false,
})
const funcionariosOptionsEnviarProducao = ref([])
const itens = ref([])

const valorFinal = ref(0)
const percentualDesconto = ref(0)
const dataVenda = ref(new Date().toISOString().slice(0, 10))
const enderecoEntrega = ref('')
const indicacaoNome = ref('')
const TIPO_COMISSAO_OCULTA = 'VENDEDOR'
const DESCONTO_MAXIMO_PERCENTUAL = Number(VENDA_FECHAMENTO_REGRAS?.DESCONTO_MAXIMO_PERCENTUAL || 0)
const DESCONTO_STEP = Number(VENDA_FECHAMENTO_REGRAS?.DESCONTO_PERCENTUAL_STEP || 0.5)
const LIMITE_DESCONTO_RESTRINGIR_PAGAMENTO = Number(
  VENDA_FECHAMENTO_REGRAS?.LIMITE_DESCONTO_RESTRINGIR_PAGAMENTO_PERCENTUAL || 7,
)
const FORMAS_REMOVIDAS_FECHAMENTO = new Set(
  (VENDA_FECHAMENTO_REGRAS?.FORMAS_REMOVIDAS_FECHAMENTO || []).map((x) => String(x || '').toUpperCase()),
)
const FORMAS_PERMITIDAS_ACIMA_LIMITE = new Set(
  (VENDA_FECHAMENTO_REGRAS?.FORMAS_PERMITIDAS_ACIMA_LIMITE_DESCONTO || []).map((x) => String(x || '').toUpperCase()),
)

function formaPagamentoPermitidaPorDesconto(chave) {
  const key = String(chave || '').toUpperCase()
  if (!key) return true
  if (FORMAS_REMOVIDAS_FECHAMENTO.has(key)) return false
  if (Number(percentualDesconto.value || 0) >= LIMITE_DESCONTO_RESTRINGIR_PAGAMENTO) {
    return FORMAS_PERMITIDAS_ACIMA_LIMITE.has(key)
  }
  return true
}

const FORMAS_PAGAMENTO_OPTIONS = computed(() =>
  (FORMAS_PAGAMENTO || [])
    .filter((x) => formaPagamentoPermitidaPorDesconto(x.key))
    .map((x) => ({ label: x.label, value: x.key })),
)
const PARCELAS_OPTIONS = computed(() => {
  const parcelasCredito = TAXAS_CARTAO?.CREDITO?.parcelas || {}
  const byTaxa = Object.entries(parcelasCredito)
    .map(([k, taxa]) => ({
      label: `${Number(k)}x`,
      value: Number(k),
    }))
    .filter((x) => Number.isFinite(x.value) && x.value > 0)
    .sort((a, b) => a.value - b.value)

  if (byTaxa.length) return byTaxa

  return (VENDA_FECHAMENTO_REGRAS?.PARCELAS_OPCOES || [1]).map((n) => ({
    label: `${n}x`,
    value: Number(n),
  }))
})
const pagamentoAtual = computed(() => (pagamentos.value || [])[0] || null)
const PARCELAS_MAX_POR_FORMA = VENDA_FECHAMENTO_REGRAS?.PARCELAS_MAX_POR_FORMA || {}
function toParcelas(value) {
  const clean = String(value ?? '')
    .replace(/\s/g, '')
    .replace(/x/gi, '')
  const n = Number(clean)
  if (!Number.isFinite(n) || n <= 0) return 1
  return Math.floor(n)
}
function maxParcelasDaForma(forma) {
  const key = String(forma || '').toUpperCase()
  if (key === 'CREDITO') {
    const credit = Object.keys(TAXAS_CARTAO?.CREDITO?.parcelas || {})
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n) && n > 0)
    return credit.length ? Math.max(...credit) : 1
  }
  return Number(PARCELAS_MAX_POR_FORMA?.[key] || 1)
}
const taxaCobradaPercentual = computed(() => {
  const forma = String(pagamentoAtual.value?.forma_pagamento_chave || '').toUpperCase()
  const parcelas = toParcelas(pagamentoAtual.value?.parcelas)
  if (forma !== 'CREDITO' || parcelas <= 10) return 0
  const taxa = Number(TAXAS_CARTAO?.CREDITO?.parcelas?.[parcelas] || 0)
  return Number.isFinite(taxa) ? taxa : 0
})
const valorCobradoVenda = computed(() => {
  const base = Number(valorFinal.value || 0)
  const taxa = Number(taxaCobradaPercentual.value || 0)
  return Math.round(base * (1 + taxa / 100) * 100) / 100
})
const PARCELAS_OPTIONS_FILTRADAS = computed(() => {
  const forma = String(pagamentoAtual.value?.forma_pagamento_chave || '').toUpperCase()
  const max = Math.max(1, maxParcelasDaForma(forma))
  return (PARCELAS_OPTIONS.value || []).filter((x) => Number(x.value) <= max)
})

const FORMAS_COM_DATA_POR_PARCELA = ['PIX', 'DINHEIRO', 'CHEQUE', 'TRANSFERENCIA', 'DEBITO']

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

const columnsPagamentos = [
  { key: 'forma', label: 'Forma', width: '220px' },
  { key: 'parcelas', label: 'Parcelas', width: '100px', align: 'right' },
  { key: 'data_recebimento', label: 'Data prevista / valor', width: '260px' },
]

const rowsPagamentos = computed(() =>
  (pagamentos.value || []).map((p, idx) => ({ ...p, __idx: idx })),
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
  { key: 'observacao', label: 'Observações' },
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

function clampPercentualDesconto(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > DESCONTO_MAXIMO_PERCENTUAL) return DESCONTO_MAXIMO_PERCENTUAL
  return n
}

const descontoTotal = computed(() => {
  const tot = Number(totalOrcado.value || 0)
  const vf = Number(valorFinal.value || 0)
  return Math.max(0, tot - vf)
})

function aplicarRegraPagamentoPorDesconto() {
  let alterou = false
  pagamentos.value = (pagamentos.value || []).map((p) => {
    const key = String(p?.forma_pagamento_chave || '').toUpperCase()
    if (!key || formaPagamentoPermitidaPorDesconto(key)) return p
    alterou = true
    return {
      ...p,
      forma_pagamento_chave: '',
    }
  })
  if (alterou) {
    notify.error(
      `Com desconto a partir de ${LIMITE_DESCONTO_RESTRINGIR_PAGAMENTO}%, somente PIX, Transferência e Dinheiro são permitidos.`,
    )
  }
}

function normalizarParcelasPeloCatalogo() {
  const permitidas = new Set((PARCELAS_OPTIONS_FILTRADAS.value || []).map((x) => Number(x.value)))
  pagamentos.value = (pagamentos.value || []).map((p) => {
    const atual = toParcelas(p?.parcelas)
    if (permitidas.has(atual)) return p
    return { ...p, parcelas: Number(PARCELAS_OPTIONS_FILTRADAS.value?.[0]?.value || 1) }
  })
}

function ensureDatasParcelas(p) {
  // Cartão de crédito: 1 linha (data 1ª parcela e valor da parcela); as demais são geradas no backend
  if (String(p.forma_pagamento_chave || '').toUpperCase() === 'CREDITO') {
    if (!Array.isArray(p.datas_parcelas)) p.datas_parcelas = []
    if (p.datas_parcelas.length === 0) p.datas_parcelas.push({ data: '', valor: 0 })
    return
  }
  if (!FORMAS_COM_DATA_POR_PARCELA.includes(p.forma_pagamento_chave)) return
  const n = Math.max(1, Math.min(24, toParcelas(p.parcelas)))
  if (!Array.isArray(p.datas_parcelas)) p.datas_parcelas = []
  while (p.datas_parcelas.length < n) {
    p.datas_parcelas.push({ data: '', valor: 0 })
  }
  if (p.datas_parcelas.length > n) p.datas_parcelas = p.datas_parcelas.slice(0, n)
}

function splitValores(total, parcelas) {
  const n = Math.max(1, toParcelas(parcelas))
  const base = Math.round((Number(total || 0) / n) * 100) / 100
  const list = []
  for (let i = 0; i < n; i++) {
    const v = i === n - 1 ? Math.round((Number(total || 0) - base * (n - 1)) * 100) / 100 : base
    list.push(v)
  }
  return list
}

function prefillParcelasValores({ resetDatas = false } = {}) {
  const p = pagamentoAtual.value
  if (!p) return
  const forma = String(p.forma_pagamento_chave || '').toUpperCase()
  const n = Math.max(1, toParcelas(p.parcelas))
  const valores = splitValores(valorCobradoVenda.value, n)

  if (forma === 'CREDITO') {
    const dataAtual = resetDatas ? '' : (p.datas_parcelas?.[0]?.data || '')
    p.datas_parcelas = [{ data: dataAtual, valor: valores[0] || 0 }]
    p.valor = Number(valorCobradoVenda.value || 0)
    return
  }

  ensureDatasParcelas(p)
  p.datas_parcelas = (p.datas_parcelas || []).map((parc, i) => ({
    data: resetDatas ? '' : (parc?.data || ''),
    valor: valores[i] || 0,
  }))
  p.valor = Number(valorCobradoVenda.value || 0)
}

function limparPagamentoAoTrocarForma() {
  const p = pagamentoAtual.value
  if (!p) return
  const max = Math.max(1, maxParcelasDaForma(p.forma_pagamento_chave))
  p.parcelas = Math.max(1, Math.min(toParcelas(p.parcelas), max))
  p.data_recebimento = ''
  p.datas_parcelas = []
  prefillParcelasValores({ resetDatas: true })
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
  const n = Math.max(1, Math.min(24, toParcelas(p.parcelas)))
  if (n <= 1) return false
  ensureDatasParcelas(p)
  return true
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
  const pct = clampPercentualDesconto(percentualDesconto.value)
  percentualDesconto.value = pct
  const vf = tot > 0 ? Math.round(tot * (1 - pct / 100) * 100) / 100 : 0
  valorFinal.value = vf
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
  const tot = Number(totalOrcado.value || 0)
  if (tot <= 0) {
    valorFinal.value = soma
    percentualDesconto.value = 0
    return
  }
  const pct = ((tot - soma) / tot) * 100
  const pctNormalizado = Math.round(pct * 100) / 100
  if (pctNormalizado > DESCONTO_MAXIMO_PERCENTUAL) {
    percentualDesconto.value = DESCONTO_MAXIMO_PERCENTUAL
    notify.error(`Desconto máximo permitido é ${DESCONTO_MAXIMO_PERCENTUAL}%.`)
    aplicarRateio()
    return
  }
  percentualDesconto.value = clampPercentualDesconto(pctNormalizado)
  valorFinal.value = soma
}

function onPercentualDescontoInput(v) {
  percentualDesconto.value = clampPercentualDesconto(v)
  aplicarRateio()
}

function getRepresentanteEmpresaSelecionado() {
  const cfg = configuracaoEmpresa.value || {}
  return {
    nome: String(cfg.representante_legal_nome || '').trim(),
    cpf: String(cfg.representante_legal_cpf || '').trim(),
    rg: String(cfg.representante_legal_rg || '').trim(),
  }
}

function montarEnderecoCliente(cliente) {
  if (!cliente || typeof cliente !== 'object') return ''
  const partes = [
    cliente.endereco,
    cliente.numero,
    cliente.complemento,
    cliente.bairro,
    cliente.cidade,
    cliente.estado,
  ]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
  return partes.join(', ')
}

async function carregarConfiguracaoEmpresa() {
  try {
    const data = await ConfiguracaoService.carregar()
    configuracaoEmpresa.value = data || {}
  } catch {
    configuracaoEmpresa.value = null
  }
}

function adicionarItemVenda() {
  itens.value.push({
    nome_ambiente: '',
    descricao: '',
    observacao: '',
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
      observacao: it.observacao ?? '',
      valor_unitario: Number(it.valor_unitario || 0), // orçado (referência)
      valor_final: Number(it.valor_unitario || 0), // valor de venda inicial (pode ser alterado)
    }))
    enderecoEntrega.value = montarEnderecoCliente(data?.cliente)
    percentualDesconto.value = 0
    aplicarRateio()

    await carregarArquivos()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao carregar orçamento.')
  } finally {
    loading.value = false
  }
}

/** Carrega venda existente para edição (mesma tela do fechamento). */
async function carregarVenda() {
  const id = vendaId.value
  if (!id) {
    notify.error('Venda não informada.')
    return
  }

  loading.value = true
  try {
    const { data: venda } = await VendaService.buscar(id)
    const orcId = Number(venda?.orcamento_id || 0)
    if (!orcId) {
      notify.error('Venda sem orçamento vinculado.')
      return
    }

    const { data: orc } = await OrcamentosService.detalhar(orcId)
    orcamento.value = orc

    const orcItens = orc?.itens || []
    const vendaItens = venda?.itens || []
    itens.value = orcItens.length
      ? orcItens.map((it, i) => ({
          nome_ambiente: it.nome_ambiente,
          descricao: it.descricao,
          observacao: it.observacao ?? '',
          valor_unitario: Number(it.valor_unitario || 0),
          valor_final: Number(vendaItens[i]?.valor_unitario ?? it.valor_unitario ?? 0),
        }))
      : vendaItens.map((it) => ({
          nome_ambiente: it.nome_ambiente,
          descricao: it.descricao,
          observacao: it.observacao ?? '',
          valor_unitario: Number(it.valor_unitario || 0),
          valor_final: Number(it.valor_unitario || 0),
        }))

    const totalOrcadoAtual = itens.value.reduce((acc, it) => acc + Number(it.valor_unitario || 0), 0)
    const valorVendaAtual = Number(venda?.valor_vendido ?? 0)
    if (totalOrcadoAtual > 0) {
      const pctAtual = ((totalOrcadoAtual - valorVendaAtual) / totalOrcadoAtual) * 100
      percentualDesconto.value = clampPercentualDesconto(Math.round(pctAtual * 100) / 100)
      aplicarRateio()
    } else {
      valorFinal.value = valorVendaAtual
      percentualDesconto.value = 0
    }
    dataVenda.value = venda?.data_venda ? String(venda.data_venda).slice(0, 10) : new Date().toISOString().slice(0, 10)
    enderecoEntrega.value =
      String(venda?.endereco_entrega || '').trim() || montarEnderecoCliente(orc?.cliente)

    const pagos = venda?.pagamentos || []
    pagamentos.value =
      pagos.length > 0
        ? [
            {
              forma_pagamento_chave: pagos[0]?.forma_pagamento_chave || '',
              valor: pagos.reduce((acc, p) => acc + Number(p?.valor || 0), 0),
              parcelas: Math.max(1, pagos.length),
              data_recebimento: pagos[0]?.data_prevista_recebimento
                ? String(pagos[0].data_prevista_recebimento).slice(0, 10)
                : (pagos[0]?.data_recebimento ? String(pagos[0].data_recebimento).slice(0, 10) : ''),
              datas_parcelas: pagos.map((p) => ({
                data: p.data_prevista_recebimento
                  ? String(p.data_prevista_recebimento).slice(0, 10)
                  : (p.data_recebimento ? String(p.data_recebimento).slice(0, 10) : ''),
                valor: Number(p.valor || 0),
              })),
            },
          ]
        : [{ forma_pagamento_chave: '', valor: 0, parcelas: 1, data_recebimento: '', datas_parcelas: [{ data: '', valor: 0 }] }]

    const comis = venda?.comissoes || []
    indicacaoNome.value = String(comis?.[0]?.responsavel_nome || '')

    clienteIdVenda.value = venda?.cliente_id ?? orc?.cliente_id ?? null
    if (can('contratos.ver')) {
      const contratosRes = await ContratosService.listar({ venda_id: id })
      contratos.value = Array.isArray(contratosRes?.data) ? contratosRes.data : []
    } else {
      contratos.value = []
    }

    await carregarArquivos()
  } catch (e) {
    console.error(e)
    notify.error('Erro ao carregar venda.')
  } finally {
    loading.value = false
  }
}

function fecharModalEnviarProducao() {
  modalEnviarProducao.value.aberto = false
  modalEnviarProducao.value.titulo = ''
  modalEnviarProducao.value.inicio_em = ''
  modalEnviarProducao.value.fim_em = ''
  modalEnviarProducao.value.funcionarioSelecionado = null
  modalEnviarProducao.value.equipe_ids = []
}
function adicionarEquipeEnviarProducao(id) {
  if (!id) return
  if (!modalEnviarProducao.value.equipe_ids.includes(id)) modalEnviarProducao.value.equipe_ids.push(id)
  modalEnviarProducao.value.funcionarioSelecionado = null
}
function removerEquipeEnviarProducao(id) {
  modalEnviarProducao.value.equipe_ids = modalEnviarProducao.value.equipe_ids.filter((f) => String(f) !== String(id))
}
function funcionarioNomeByIdEnviarProducao(id) {
  const opt = funcionariosOptionsEnviarProducao.value.find((o) => (o.value ?? o.id) === id)
  return opt?.label ?? opt?.nome ?? `#${id}`
}
async function abrirModalEnviarProducao() {
  const id = vendaId.value
  if (!id || !clienteIdVenda.value) {
    notify.error('Venda ou cliente não carregado.')
    return
  }
  try {
    const res = await FuncionarioService.select()
    const lista = Array.isArray(res?.data) ? res.data : []
    funcionariosOptionsEnviarProducao.value = lista
      .map((item) => ({ label: item?.label || item?.nome || '', value: item?.value ?? item?.id ?? null }))
      .filter((opt) => opt.value != null)
  } catch (e) {
    funcionariosOptionsEnviarProducao.value = []
  }
  const now = new Date()
  const fim = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  modalEnviarProducao.value.titulo = `Produção Venda #${id}`
  modalEnviarProducao.value.inicio_em = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  modalEnviarProducao.value.fim_em = `${fim.getFullYear()}-${pad(fim.getMonth() + 1)}-${pad(fim.getDate())}T${pad(fim.getHours())}:${pad(fim.getMinutes())}`
  modalEnviarProducao.value.equipe_ids = []
  modalEnviarProducao.value.aberto = true
}
async function confirmarEnviarProducao() {
  const inicio = new Date(modalEnviarProducao.value.inicio_em)
  const fim = new Date(modalEnviarProducao.value.fim_em)
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return notify.error('Data de início e término inválidas.')
  if (fim <= inicio) return notify.error('Término deve ser depois do início.')
  const cid = clienteIdVenda.value
  if (!cid) return notify.error('Cliente não informado.')
  modalEnviarProducao.value.salvando = true
  try {
    await AgendaService.criar({
      titulo: modalEnviarProducao.value.titulo,
      inicio_em: inicio.toISOString(),
      fim_em: fim.toISOString(),
      cliente_id: cid,
      venda_id: vendaId.value,
      equipe_ids: [],
      categoria: 'PRODUCAO',
    })
    notify.success('Venda enviada para produção!')
    fecharModalEnviarProducao()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao enviar para produção.')
  } finally {
    modalEnviarProducao.value.salvando = false
  }
}

function salvarVenda() {
  if (isEditMode.value) {
    if (!can('vendas.editar')) {
      notify.error('Acesso negado.')
      return
    }
  } else {
    if (!can('vendas.criar')) {
      notify.error('Acesso negado.')
      return
    }
  }
  criarOuAtualizarVenda()
}

async function criarOuAtualizarVenda() {
  if (!orcamento.value) {
    notify.error('Orçamento não carregado.')
    return
  }
  if (!valorFinal.value || valorFinal.value <= 0) {
    notify.error('Informe o valor final da venda.')
    return
  }

  {
    const rep = getRepresentanteEmpresaSelecionado()
    if (!rep.nome || onlyNumbers(rep.cpf).length !== 11 || !rep.rg) {
      notify.error('Representante legal da empresa está incompleto no cadastro. Verifique em Configurações > Empresa.')
      return
    }
  }

  saving.value = true
  try {
    const pagamentosPayload = (function () {
      const list = []
      const valorVendaNum = Number(valorCobradoVenda.value || 0)
      const dataVendaStr = (dataVenda.value || '').trim() || null
      // Evita fuso: YYYY-MM-DD como meia-noite UTC vira dia anterior no Brasil; parse como data local
      const parseDataLocal = (str) => {
        if (!str || typeof str !== 'string') return null
        const parts = String(str).trim().split('-').map(Number)
        if (parts.length !== 3) return null
        const [y, m, d] = parts
        if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
        const date = new Date(y, m - 1, d)
        return Number.isNaN(date.getTime()) ? null : date
      }
      for (const p of pagamentos.value || []) {
        const forma = String(p.forma_pagamento_chave || '').trim()
        const formaUpper = forma.toUpperCase()
        if (!formaPagamentoPermitidaPorDesconto(formaUpper)) {
          throw new Error(
            `Forma de pagamento "${formaUpper}" não permitida para desconto de ${Number(percentualDesconto.value || 0).toFixed(2)}%.`,
          )
        }
        const nParcelas = Math.max(1, Math.min(24, toParcelas(p.parcelas)))
        const parcelas = Array.isArray(p.datas_parcelas) ? p.datas_parcelas : []

        // Cartão de crédito: data que passou o cartão = 1ª parcela; demais a cada 30 dias (recorrente)
        if (formaUpper === 'CREDITO' && parcelas.length && parcelas[0]?.data) {
          const base = parcelas[0]
          let valorParcela = Number(base.valor || 0)
          const dataBase = parseDataLocal(base.data) || new Date(base.data)

          if (dataBase && !Number.isNaN(dataBase.getTime())) {
            if (valorParcela <= 0 && valorVendaNum > 0) valorParcela = Math.round((valorVendaNum / nParcelas) * 100) / 100
            // Evita última parcela negativa: limita valor por parcela ao que sobra dividido pelas parcelas
            const maxValorParcela = nParcelas > 1 ? valorVendaNum / (nParcelas - 1) : valorVendaNum
            if (valorParcela > maxValorParcela) valorParcela = Math.round((valorVendaNum / nParcelas) * 100) / 100
            for (let i = 0; i < nParcelas; i++) {
              const d = new Date(dataBase)
              d.setDate(d.getDate() + 30 * i)
              const y = d.getFullYear()
              const m = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              const valorEstaParcela =
                i === nParcelas - 1
                  ? Math.round((valorVendaNum - valorParcela * (nParcelas - 1)) * 100) / 100
                  : valorParcela
              list.push({
                forma_pagamento_chave: forma,
                valor: valorEstaParcela,
                data_prevista_recebimento: `${y}-${m}-${day}`,
                data_recebimento: null,
              })
            }
            continue
          }
        }

        // Cartão de crédito sem data preenchida: gera N parcelas pelo valor total e data da venda.
        if (formaUpper === 'CREDITO' && nParcelas >= 1 && valorVendaNum > 0) {
          const valorParcela = Math.round((valorVendaNum / nParcelas) * 100) / 100
          let dataBase = (dataVendaStr && parseDataLocal(dataVendaStr)) || new Date(dataVendaStr || undefined)
          if (!dataBase || Number.isNaN(dataBase.getTime())) dataBase = new Date()
          for (let i = 0; i < nParcelas; i++) {
            const d = new Date(dataBase)
            d.setDate(d.getDate() + 30 * i)
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            let valorEstaParcela = i === nParcelas - 1 ? valorVendaNum - valorParcela * (nParcelas - 1) : valorParcela
            valorEstaParcela = Math.round(valorEstaParcela * 100) / 100
            list.push({
              forma_pagamento_chave: forma,
              valor: valorEstaParcela,
              data_prevista_recebimento: `${y}-${m}-${day}`,
              data_recebimento: null,
            })
          }
          continue
        }

        // Demais formas: cada linha (data/valor) vira um pagamento
        if (parcelas.length) {
          for (const parc of parcelas) {
            list.push({
              forma_pagamento_chave: forma,
              valor: Number(parc?.valor || 0),
              data_prevista_recebimento: parc?.data || null,
              data_recebimento: null,
            })
          }
        } else {
          list.push({
            forma_pagamento_chave: forma,
            valor: Number(p.valor || 0),
            data_prevista_recebimento: p.data_recebimento || null,
            data_recebimento: null,
          })
        }
      }
      const soma = list.reduce((acc, x) => acc + Number(x.valor || 0), 0)
      const valorVenda = Number(valorCobradoVenda.value || 0)
      // Não força PIX automático: exige correção explícita do rateio no formulário.
      if (list.length === 0 || Math.abs(soma - valorVenda) > 0.01) {
        throw new Error(`A soma dos pagamentos (${soma.toFixed(2)}) precisa bater com o valor da venda (${valorVenda.toFixed(2)}).`)
      }
      return list
    })()

    const nomeIndicacao = String(indicacaoNome.value || '').trim()
    const comissoesPayload = nomeIndicacao
      ? [
          {
            tipo_comissao_chave: TIPO_COMISSAO_OCULTA,
            percentual_aplicado: 0,
            responsavel_nome: nomeIndicacao,
          },
        ]
      : []

    const itensPayload = (itens.value || []).map((it) => ({
      nome_ambiente: it.nome_ambiente,
      descricao: it.descricao,
      observacao: it.observacao ?? '',
      quantidade: 1,
      valor_unitario: Number(it.valor_final ?? it.valor_unitario ?? 0),
    }))

    const representanteEmpresa = getRepresentanteEmpresaSelecionado()
    const payload = {
      orcamento_id: Number(orcamento.value.id),
      status: 'VENDA_FECHADA',
      data_venda: dataVenda.value,
      endereco_entrega: String(enderecoEntrega.value || '').trim() || undefined,
      valor_vendido: Number(valorCobradoVenda.value),
      representante_venda_nome: representanteEmpresa.nome || undefined,
      representante_venda_cpf: representanteEmpresa.cpf || undefined,
      representante_venda_rg: representanteEmpresa.rg || undefined,
      itens: itensPayload,
      pagamentos: pagamentosPayload,
      comissoes: comissoesPayload,
    }

    const id = isEditMode.value ? vendaId.value : null
    const { data } = await VendaService.salvar(id, payload)
    const savedId = data?.id || id
    if (isEditMode.value) {
      notify.success('Venda atualizada.')
      closeTabAndGo(`/vendas/venda/${savedId}`)
    } else {
      notify.success('Venda criada. Você será redirecionada para o contrato.')
      if (savedId) {
        closeTabAndGo(`/contratos/novo?vendaId=${String(savedId)}`)
      } else {
        closeTabAndGo('/vendas')
      }
    }
  } catch (e) {
    console.error(e)
    notify.error(e?.response?.data?.message || (isEditMode.value ? 'Erro ao atualizar venda.' : 'Erro ao criar venda.'))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await carregarConfiguracaoEmpresa()
  const id = vendaId.value
  if (id) {
    if (!can('vendas.editar')) {
      notify.error('Acesso negado.')
      router.push('/vendas')
      return
    }
    await carregarVenda()
  } else {
    if (!can('vendas.criar')) {
      notify.error('Acesso negado.')
      router.push('/vendas')
      return
    }
    await carregarOrcamento()
  }
})

watch(percentualDesconto, () => {
  aplicarRegraPagamentoPorDesconto()
})

watch(PARCELAS_OPTIONS, () => {
  normalizarParcelasPeloCatalogo()
})

watch(
  () => pagamentoAtual.value?.forma_pagamento_chave,
  (nova, antiga) => {
    if (nova === antiga) return
    limparPagamentoAoTrocarForma()
  },
)

watch(
  () => pagamentoAtual.value?.parcelas,
  () => {
    normalizarParcelasPeloCatalogo()
    prefillParcelasValores()
  },
)

watch(valorCobradoVenda, () => {
  prefillParcelasValores()
})

watch(
  pagamentos,
  (lista) => {
    if (!Array.isArray(lista) || lista.length === 0) {
      pagamentos.value = [{ forma_pagamento_chave: '', valor: 0, parcelas: 1, data_recebimento: '', datas_parcelas: [{ data: '', valor: 0 }] }]
      return
    }
    if (lista.length > 1) {
      pagamentos.value = [lista[0]]
    }
  },
  { deep: true },
)
</script>





