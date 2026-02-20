<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Venda Plano de Corte"
        subtitle="Cortes internos — cadastre os produtos na hora e venda por metragem"
        icon="pi pi-ruler"
        :backTo="'/plano-corte'"
        class="border-b border-border-ui"
      />

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui">
        <p v-if="!fornecedorSelecionado && fornecedorCarregado" class="mb-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-200">
          Cadastre um fornecedor (próprio) em <strong>Produtos plano de corte</strong> para usar cortes internos.
        </p>

        <section class="grid grid-cols-12 gap-6 mb-8">
          <div class="col-span-12 md:col-span-4">
            <Input v-model="dataVenda" label="Data do Pedido *" type="date" required />
          </div>

          <div class="col-span-12 md:col-span-4">
            <SearchInput
              v-model="statusPlano"
              mode="select"
              label="Status"
              :options="statusPlanoOptions"
            />
          </div>
        </section>

        <div class="relative mb-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Adicionar Itens por Metragem
            </span>
          </div>
        </div>

        <div class="rounded-2xl border border-border-ui bg-slate-50/50 dark:bg-slate-800/20 p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <span class="text-xs font-bold text-text-muted uppercase tracking-wider">Itens do pedido</span>
            <Button
              v-if="can('plano_corte.criar')"
              variant="ghost"
              size="sm"
              class="text-[10px] font-bold uppercase"
              @click="abrirModalProduto"
            >
              <i class="pi pi-plus mr-2"></i>
              Cadastrar Novo Produto
            </Button>
          </div>

          <div class="grid grid-cols-12 gap-6 items-end">
            <div class="col-span-12 md:col-span-4">
              <SearchInput
                v-model="itemNovo.item_id"
                mode="select"
                label="Produto / Material"
                :options="produtoOptions"
                @update:modelValue="onSelecionarProdutoNovo"
              />
            </div>

            <div class="col-span-6 md:col-span-2">
              <Input v-model="itemNovo.largura_mm" label="Largura (mm)" type="number" />
            </div>

            <div class="col-span-6 md:col-span-2">
              <Input v-model="itemNovo.comprimento_mm" label="Comprimento (mm)" type="number" />
            </div>

            <div class="col-span-6 md:col-span-2">
              <Input v-model="itemNovo.espessura_mm" label="Espessura (mm)" type="number" />
            </div>

            <div class="col-span-6 md:col-span-2">
              <Input v-model="itemNovo.quantidade" label="Qtd" type="number" placeholder="0" />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input v-model="itemNovo.precoM2Mask" label="Preco por m2" placeholder="0,00" />
            </div>

            <div class="col-span-12 md:col-span-9 flex flex-wrap items-end gap-3">
              <div class="flex-1 min-w-[140px] px-4 py-3 rounded-xl border border-border-ui bg-bg-card flex flex-col justify-center">
                <span class="text-[10px] font-bold text-text-muted uppercase tracking-wider">Área por peça</span>
                <span class="text-sm font-bold text-text-main">{{ areaPecaExibicao }}</span>
              </div>
              <div class="flex-1 min-w-[140px] px-4 py-3 rounded-xl border border-border-ui bg-bg-card flex flex-col justify-center">
                <span class="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total item</span>
                <span class="text-sm font-bold text-text-main">{{ itemNovoTotalExibicao }}</span>
              </div>
              <Button
                v-if="can('plano_corte.criar')"
                variant="primary"
                class="h-11 min-w-[44px]"
                :disabled="!podeAdicionarItem"
                @click="registrarItemNovo"
              >
                <i class="pi pi-plus"></i>
              </Button>
            </div>
          </div>
        </div>

        <Table
          :columns="columnsItens"
          :rows="itens"
          :boxed="false"
          empty-text="Nenhum item adicionado."
        >
          <template #cell-produto="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-sm font-bold text-text-main uppercase tracking-tight">{{ row.item?.nome_produto }}</span>
              <span class="text-[10px] font-medium text-text-muted uppercase tracking-wider mt-0.5">
                {{ row.item?.cor || 'Padrão' }} • {{ row.item?.marca || 'Sem marca' }}
              </span>
              <span class="text-[10px] font-medium text-text-muted uppercase tracking-wider mt-0.5">
                {{ row.largura_mm }}×{{ row.comprimento_mm }}mm • {{ row.espessura_mm || '-' }}mm
              </span>
            </div>
          </template>

          <template #cell-valor_unitario="{ row }">
            <span class="text-sm text-text-main tabular-nums">{{ maskMoneyBR(row.valor_unitario || 0) }}</span>
          </template>

          <template #cell-valor_total="{ row }">
            <span class="text-sm font-bold text-text-main tabular-nums">{{ maskMoneyBR(row.valor_total || 0) }}</span>
          </template>

          <template #cell-acoes="{ index }">
            <div class="flex justify-center">
              <button
                v-if="can('plano_corte.criar')"
                type="button"
                @click="confirmarRemoverItemPlano(index)"
                class="w-9 h-9 rounded-lg text-text-muted hover:bg-rose-500/10 hover:text-rose-500 transition-all flex items-center justify-center"
              >
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          </template>
        </Table>

        <div class="flex justify-end mt-8">
          <div class="rounded-2xl border border-border-ui bg-slate-50/50 dark:bg-slate-800/30 px-6 py-4 min-w-[240px] text-right">
            <span class="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total do Pedido</span>
            <span class="text-2xl font-bold text-text-main tabular-nums block mt-1">
              {{ maskMoneyBR(totalCalculado) }}
            </span>
          </div>
        </div>

        <div class="pt-10 mt-6 border-t border-border-ui flex flex-wrap items-center justify-between gap-4">
          <Button type="button" variant="ghost" @click="router.push('/plano-corte')">
            Cancelar
          </Button>
          <div class="flex flex-wrap items-center gap-3">
            <Button
              v-if="can('plano_corte.criar')"
              variant="secondary"
              size="lg"
              :loading="salvando"
              @click="salvarApenas"
            >
              <i class="pi pi-save mr-2"></i>
              Salvar
            </Button>
            <Button
              v-if="can('plano_corte.criar')"
              variant="secondary"
              size="lg"
              :loading="salvando"
              @click="salvarEGerarPdf"
            >
              <i class="pi pi-file-pdf mr-2"></i>
              Gerar PDF
            </Button>
            <Button
              v-if="can('plano_corte.criar')"
              variant="primary"
              size="lg"
              :loading="enviandoProducao"
              @click="abrirModalEnviarProducao"
            >
              <i class="pi pi-send mr-2"></i>
              Enviar para Produção
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Enviar para Produção -->
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
                    Cria agendamento na agenda com este plano
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-border-ui text-text-muted hover:text-rose-500 hover:border-rose-200 transition-all"
                @click="fecharModalEnviarProducao"
              >
                <i class="pi pi-times text-sm"></i>
              </button>
            </header>
            <form class="p-6 space-y-4" @submit.prevent="confirmarEnviarProducao">
              <Input
                v-model="modalEnviarProducao.titulo"
                label="Título do agendamento *"
                placeholder="Ex: Plano de Corte - Cortes internos"
                required
              />
              <div class="grid grid-cols-2 gap-4">
                <Input
                  v-model="modalEnviarProducao.inicio_em"
                  label="Início *"
                  type="datetime-local"
                  required
                />
                <Input
                  v-model="modalEnviarProducao.fim_em"
                  label="Término *"
                  type="datetime-local"
                  required
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Equipe (mín. 1) *</label>
                <div class="flex flex-wrap gap-2">
                  <SearchInput
                    v-model="modalEnviarProducao.funcionarioSelecionado"
                    mode="select"
                    class="flex-1 min-w-[200px]"
                    :options="funcionariosOptions"
                    placeholder="Selecione funcionário..."
                    @update:modelValue="adicionarEquipe"
                  />
                  <div v-if="modalEnviarProducao.equipe_ids.length" class="flex flex-wrap gap-2 mt-2">
                    <span
                      v-for="id in modalEnviarProducao.equipe_ids"
                      :key="id"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-medium"
                    >
                      {{ funcionarioNomeById(id) }}
                      <button type="button" class="hover:text-rose-500" @click="removerEquipe(id)">&times;</button>
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex justify-end gap-3 pt-4 border-t border-border-ui">
                <Button type="button" variant="ghost" @click="fecharModalEnviarProducao">
                  Cancelar
                </Button>
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

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modalProduto.aberto"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          @click.self="fecharModalProduto"
        >
          <div class="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border-ui bg-bg-card shadow-xl overflow-hidden flex flex-col">
            <div class="h-1 w-full bg-brand-primary" />
            <header class="flex items-center justify-between px-6 py-4 border-b border-border-ui">
              <div class="flex items-center gap-3">
                <i class="pi pi-box text-2xl text-text-soft"></i>
                <div>
                  <h3 class="text-lg font-semibold text-text-main">Novo Insumo</h3>
                  <p class="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                    Cadastre o produto na hora (cortes internos)
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-border-ui text-text-muted hover:text-rose-500 hover:border-rose-200 transition-all"
                @click="fecharModalProduto"
              >
                <i class="pi pi-times text-sm"></i>
              </button>
            </header>

            <div class="p-6 overflow-y-auto">
              <form class="grid grid-cols-12 gap-x-6 gap-y-6" @submit.prevent="salvarProduto">
                <div class="col-span-12">
                  <Input
                    v-model="modalProduto.form.nome_produto"
                    label="Nome do Produto"
                    placeholder="EX: MDF BRANCO TX"
                    required
                  />
                </div>

                <div class="col-span-12 md:col-span-6">
                  <Input v-model="modalProduto.form.marca" label="Marca" placeholder="EX: DURATEX" />
                </div>

                <div class="col-span-12 md:col-span-6">
                  <SearchInput
                    v-model="modalProduto.form.unidade"
                    mode="select"
                    label="Unidade"
                    :options="unidadesOptions"
                    placeholder="SELECIONE..."
                    required
                  />
                </div>

                <div class="col-span-12 md:col-span-6">
                  <Input v-model="modalProduto.form.cor" label="Cor" placeholder="EX: BRANCO TX" />
                </div>

                <div class="col-span-12 md:col-span-6">
                  <Input v-model="modalProduto.form.medida" label="Medida" placeholder="EX: 18MM" />
                </div>

                <div class="col-span-12 md:col-span-4">
                  <Input v-model="modalProduto.form.largura_mm" label="Largura (mm)" type="number" />
                </div>

                <div class="col-span-12 md:col-span-4">
                  <Input v-model="modalProduto.form.comprimento_mm" label="Comprimento (mm)" type="number" />
                </div>

                <div class="col-span-12 md:col-span-4">
                  <Input v-model="modalProduto.form.espessura_mm" label="Espessura (mm)" type="number" />
                </div>

                <div class="col-span-12 md:col-span-6">
                  <Input v-model="modalProduto.form.precoM2Mask" label="Preco por m2" placeholder="0,00" />
                </div>

                <div class="col-span-12 flex items-center justify-end gap-4 pt-6 border-t border-border-ui mt-2">
                  <Button type="button" variant="ghost" @click="fecharModalProduto">
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    :loading="modalProduto.salvando"
                  >
                    <i class="pi pi-check-circle mr-2"></i>
                    Cadastrar e Usar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { maskMoneyBR } from '@/utils/masks'
import { PlanoCorteService, FornecedorService, AgendaService, FuncionarioService } from '@/services/index'
import { PIPELINE_PLANO_CORTE, UNIDADES } from '@/constantes'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { closeTabAndGo } from '@/utils/tabs'

definePage({ meta: { perm: 'plano_corte.criar' } })

const router = useRouter()
const salvando = ref(false)

const statusPlanoOptions = computed(() =>
  (PIPELINE_PLANO_CORTE || []).map((s) => ({
    label: s.label,
    value: s.key,
  })),
)

const statusPlano = ref('')
const dataVenda = ref(new Date().toISOString().slice(0, 10))

const fornecedor = ref([])
/** Cortes internos: o fornecedor é você mesmo; usamos o primeiro cadastrado como "interno". */
const fornecedorSelecionado = ref(null)
const fornecedorCarregado = ref(false)
const fornecedorOptions = computed(() => fornecedor.value.map((f) => ({ label: f.razao_social, value: f.id })))

const itensDisponiveis = ref([])
const itens = ref([])

const itemNovo = ref({
  item_id: null,
  largura_mm: '',
  comprimento_mm: '',
  espessura_mm: '',
  quantidade: '',
  precoM2Mask: 'R$ 0,00',
})

const unidadesOptions = computed(() => (UNIDADES || []).map((u) => ({ label: u.label, value: u.key })))

const produtoOptions = computed(() =>
  itensDisponiveis.value.map((i) => ({ label: `${i.nome_produto} ${i.cor ? `(${i.cor})` : ''}`, value: i.id })),
)

const areaPeca = computed(() => {
  const largura = Number(itemNovo.value.largura_mm) || 0
  const comprimento = Number(itemNovo.value.comprimento_mm) || 0
  if (!largura || !comprimento) return 0
  return (largura / 1000) * (comprimento / 1000)
})

const precoM2 = computed(() => {
  const raw = String(itemNovo.value.precoM2Mask || '').replace(/\D/g, '')
  return raw ? Number(raw) / 100 : 0
})

const valorUnitario = computed(() => Number((areaPeca.value * precoM2.value).toFixed(2)))
const itemNovoTotal = computed(() => {
  const qtd = Number(itemNovo.value.quantidade) || 0
  return Number((valorUnitario.value * qtd).toFixed(2))
})

const areaPecaExibicao = computed(() => `${areaPeca.value.toFixed(3)} m2`)
const itemNovoTotalExibicao = computed(() => maskMoneyBR(itemNovoTotal.value))

const podeAdicionarItem = computed(() =>
  !!itemNovo.value.item_id &&
  Number(itemNovo.value.quantidade) > 0 &&
  Number(itemNovo.value.largura_mm) > 0 &&
  Number(itemNovo.value.comprimento_mm) > 0 &&
  precoM2.value > 0,
)

const totalCalculado = computed(() => itens.value.reduce((acc, it) => acc + (it.valor_total || 0), 0))

const columnsItens = [
  { key: 'produto', label: 'Item' },
  { key: 'quantidade', label: 'Qtd', width: '100px', align: 'center' },
  { key: 'valor_unitario', label: 'Vl. Unit', width: '140px' },
  { key: 'valor_total', label: 'Total', width: '140px' },
  { key: 'acoes', label: '', width: '60px', align: 'right' },
]

watch(
  () => itemNovo.value.precoM2Mask,
  (v) => {
    const n = String(v || '').replace(/\D/g, '')
    itemNovo.value.precoM2Mask = maskMoneyBR(n ? Number(n) / 100 : 0)
  },
)

const modalProduto = ref({
  aberto: false,
  salvando: false,
  form: {
    fornecedor_id: null,
    nome_produto: '',
    marca: '',
    cor: '',
    medida: '',
    unidade: 'UN',
    largura_mm: '',
    comprimento_mm: '',
    espessura_mm: '',
    precoM2Mask: 'R$ 0,00',
    status: 'ATIVO',
  },
})

function abrirModalProduto() {
  if (!fornecedorSelecionado.value) {
    notify.warn('Cadastre um fornecedor (próprio) em Produtos plano de corte primeiro.')
    return
  }
  modalProduto.value.form.fornecedor_id = Number(fornecedorSelecionado.value)
  modalProduto.value.aberto = true
}

function fecharModalProduto() {
  modalProduto.value.aberto = false
  modalProduto.value.form = {
    fornecedor_id: null,
    nome_produto: '',
    marca: '',
    cor: '',
    medida: '',
    unidade: 'UN',
    largura_mm: '',
    comprimento_mm: '',
    espessura_mm: '',
    precoM2Mask: 'R$ 0,00',
    status: 'ATIVO',
  }
}

async function carregarItensDisponiveis(fId) {
  const { data } = await PlanoCorteService.itens.listar(Number(fId))
  itensDisponiveis.value = data || []
}

async function salvarProduto() {
  if (!modalProduto.value.form.nome_produto?.trim()) return
  if (!modalProduto.value.form.fornecedor_id) return

  modalProduto.value.salvando = true
  try {
    const precoM2Valor = Number(String(modalProduto.value.form.precoM2Mask || '').replace(/\D/g, '')) / 100 || 0
    const payload = {
      fornecedor_id: modalProduto.value.form.fornecedor_id,
      nome_produto: modalProduto.value.form.nome_produto.trim(),
      marca: modalProduto.value.form.marca?.trim() || null,
      cor: modalProduto.value.form.cor?.trim() || null,
      medida: modalProduto.value.form.medida?.trim() || null,
      unidade: modalProduto.value.form.unidade || null,
      largura_mm: modalProduto.value.form.largura_mm ? Number(modalProduto.value.form.largura_mm) : null,
      comprimento_mm: modalProduto.value.form.comprimento_mm ? Number(modalProduto.value.form.comprimento_mm) : null,
      espessura_mm: modalProduto.value.form.espessura_mm ? Number(modalProduto.value.form.espessura_mm) : null,
      preco_m2: precoM2Valor || null,
      status: modalProduto.value.form.status,
      quantidade: 0,
      valor_unitario: 0,
      valor_total: 0,
    }

    const { data } = await PlanoCorteService.itens.salvar(null, payload)
    await carregarItensDisponiveis(fornecedorSelecionado.value)

    itemNovo.value.item_id = data.id
    itemNovo.value.largura_mm = data.largura_mm || ''
    itemNovo.value.comprimento_mm = data.comprimento_mm || ''
    itemNovo.value.espessura_mm = data.espessura_mm || ''
    itemNovo.value.precoM2Mask = maskMoneyBR(Number(data.preco_m2 || 0))

    fecharModalProduto()
  } finally {
    modalProduto.value.salvando = false
  }
}

async function confirmarRemoverItemPlano(index) {
  const row = itens.value?.[index]
  const nome = row?.item?.nome_produto || 'ITEM'
  const ok = await confirm.show('Remover Item', `Deseja remover "${nome}" deste plano?`)
  if (!ok) return
  itens.value.splice(index, 1)
}

function registrarItemNovo() {
  const itemId = Number(itemNovo.value.item_id)
  const item = itensDisponiveis.value.find((i) => Number(i.id) === itemId)
  if (!item) return

  const qtd = Number(itemNovo.value.quantidade) || 0
  const vUnit = valorUnitario.value
  const vTotal = itemNovoTotal.value

  itens.value.push({
    item_id: item.id,
    item: {
      nome_produto: item.nome_produto,
      cor: item.cor,
      marca: item.marca,
    },
    quantidade: qtd,
    valor_unitario: vUnit,
    valor_total: vTotal,
    status: 'ATIVO',
    largura_mm: Number(itemNovo.value.largura_mm) || null,
    comprimento_mm: Number(itemNovo.value.comprimento_mm) || null,
    espessura_mm: Number(itemNovo.value.espessura_mm) || null,
    preco_m2: precoM2.value,
  })

  itemNovo.value = {
    item_id: null,
    largura_mm: '',
    comprimento_mm: '',
    espessura_mm: '',
    quantidade: '',
    precoM2Mask: 'R$ 0,00',
  }
}

function onSelecionarProdutoNovo(v) {
  const itemId = Number(v)
  const item = itensDisponiveis.value.find((i) => Number(i.id) === itemId)
  if (!item) return

  itemNovo.value.largura_mm = item.largura_mm || ''
  itemNovo.value.comprimento_mm = item.comprimento_mm || ''
  itemNovo.value.espessura_mm = item.espessura_mm || ''
  itemNovo.value.precoM2Mask = maskMoneyBR(Number(item.preco_m2 || 0))
}

function buildPayload() {
  const dataStr = (dataVenda.value || '').trim()
  const dataVendaIso = dataStr.includes('T') ? dataStr : `${dataStr}T12:00:00.000Z`
  return {
    fornecedor_id: Number(fornecedorSelecionado.value),
    data_venda: dataVendaIso,
    status: statusPlano.value || (PIPELINE_PLANO_CORTE?.[0]?.key || 'EM_ABERTO'),
    produtos: itens.value.map((p) => ({
      item_id: Number(p.item_id),
      quantidade: Number(p.quantidade) || 0,
      valor_unitario: Number(p.valor_unitario) || 0,
      valor_total: Number(p.valor_total) || 0,
      status: p.status || 'ATIVO',
    })),
  }
}

/** Salva o plano e retorna o ID (ou null). */
async function salvarPlano() {
  if (!fornecedorSelecionado.value) return null
  if (!itens.value.length) return null
  try {
    const { data } = await PlanoCorteService.salvar(null, buildPayload())
    return data?.id ?? null
  } catch (e) {
    notify.error('Erro ao salvar plano.')
    return null
  }
}

async function salvarApenas() {
  if (!fornecedorSelecionado.value) return notify.error('Cadastre um fornecedor (próprio) em Produtos plano de corte para usar cortes internos.')
  if (!itens.value.length) return notify.error('Adicione ao menos um item.')
  salvando.value = true
  try {
    const planoId = await salvarPlano()
    if (planoId) {
      notify.success('Plano salvo!')
      closeTabAndGo('/plano-corte')
    }
  } finally {
    salvando.value = false
  }
}

async function salvarEGerarPdf() {
  if (!fornecedorSelecionado.value) return notify.error('Cadastre um fornecedor (próprio) em Produtos plano de corte para usar cortes internos.')
  if (!itens.value.length) return notify.error('Adicione ao menos um item.')

  salvando.value = true
  try {
    let planoId = await salvarPlano()
    if (!planoId) return

    const pdfRes = await PlanoCorteService.abrirPdf(planoId)
    await router.push({
      path: `/arquivos/${pdfRes?.data?.arquivoId}`,
      query: {
        name: `PLANO_CORTE_${String(planoId).replace(/\D/g, '')}.pdf`,
        type: 'application/pdf',
      },
    })
  } catch (e) {
    notify.error('Erro ao gerar PDF.')
  } finally {
    salvando.value = false
  }
}

const enviandoProducao = ref(false)
const planoIdParaProducao = ref(null)
const modalEnviarProducao = ref({
  aberto: false,
  salvando: false,
  titulo: '',
  inicio_em: '',
  fim_em: '',
  funcionarioSelecionado: null,
  equipe_ids: [],
})
const funcionariosOptions = ref([])

function funcionarioNomeById(id) {
  const opt = funcionariosOptions.value.find((f) => String(f.value) === String(id))
  return opt?.label || `#${id}`
}

function adicionarEquipe(id) {
  if (!id) return
  if (!modalEnviarProducao.value.equipe_ids.includes(id)) {
    modalEnviarProducao.value.equipe_ids.push(id)
  }
  modalEnviarProducao.value.funcionarioSelecionado = null
}

function removerEquipe(id) {
  modalEnviarProducao.value.equipe_ids = modalEnviarProducao.value.equipe_ids.filter((f) => String(f) !== String(id))
}

function fecharModalEnviarProducao() {
  modalEnviarProducao.value.aberto = false
  planoIdParaProducao.value = null
  modalEnviarProducao.value.titulo = ''
  modalEnviarProducao.value.inicio_em = ''
  modalEnviarProducao.value.fim_em = ''
  modalEnviarProducao.value.funcionarioSelecionado = null
  modalEnviarProducao.value.equipe_ids = []
}

async function abrirModalEnviarProducao() {
  if (!fornecedorSelecionado.value) return notify.error('Cadastre um fornecedor (próprio) em Produtos plano de corte para usar cortes internos.')
  if (!itens.value.length) return notify.error('Adicione ao menos um item.')

  salvando.value = true
  try {
    const planoId = await salvarPlano()
    if (!planoId) return

    planoIdParaProducao.value = planoId
    const hoje = new Date()
    const inicio = new Date(hoje)
    inicio.setHours(8, 0, 0, 0)
    const fim = new Date(hoje)
    fim.setHours(18, 0, 0, 0)

    modalEnviarProducao.value.titulo = `Plano de Corte #${planoId} - Cortes internos`
    modalEnviarProducao.value.inicio_em = inicio.toISOString().slice(0, 16)
    modalEnviarProducao.value.fim_em = fim.toISOString().slice(0, 16)
    modalEnviarProducao.value.equipe_ids = []
    modalEnviarProducao.value.aberto = true
  } finally {
    salvando.value = false
  }
}

async function confirmarEnviarProducao() {
  if (!modalEnviarProducao.value.equipe_ids.length) return notify.error('Selecione pelo menos um funcionário na equipe.')

  const inicio = new Date(modalEnviarProducao.value.inicio_em)
  const fim = new Date(modalEnviarProducao.value.fim_em)
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return notify.error('Data de início e término inválidas.')
  if (fim <= inicio) return notify.error('Término deve ser depois do início.')

  const planoId = planoIdParaProducao.value
  if (!planoId) return notify.error('Plano não encontrado. Salve o plano antes.')

  modalEnviarProducao.value.salvando = true
  try {
    await AgendaService.criar({
      titulo: modalEnviarProducao.value.titulo,
      inicio_em: inicio.toISOString(),
      fim_em: fim.toISOString(),
      plano_corte_id: planoId,
      equipe_ids: modalEnviarProducao.value.equipe_ids.map((id) => Number(id)),
      categoria: 'PRODUCAO',
    })
    notify.success('Plano enviado para produção!')
    fecharModalEnviarProducao()
    closeTabAndGo('/plano-corte')
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao enviar para produção.')
  } finally {
    modalEnviarProducao.value.salvando = false
  }
}

async function loadFuncionarios() {
  try {
    const res = await FuncionarioService.select()
    const lista = Array.isArray(res?.data) ? res.data : []
    funcionariosOptions.value = lista
      .map((item) => ({
        label: item?.label || item?.nome || '',
        value: item?.value ?? item?.id ?? null,
      }))
      .filter((opt) => opt.value != null)
  } catch (e) {
    funcionariosOptions.value = []
  }
}

onMounted(async () => {
  statusPlano.value = PIPELINE_PLANO_CORTE?.[0]?.key || 'EM_ABERTO'
  loadFuncionarios()
  try {
    const { data: fData } = await FornecedorService.listar()
    fornecedor.value = Array.isArray(fData) ? fData : []
    const primeiro = fornecedor.value[0]
    if (primeiro?.id) {
      fornecedorSelecionado.value = primeiro.id
      await carregarItensDisponiveis(primeiro.id)
    }
  } finally {
    fornecedorCarregado.value = true
  }
})
</script>
