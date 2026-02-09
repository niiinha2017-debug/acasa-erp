<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <Card :shadow="true" class="overflow-visible !rounded-[3rem] border-none shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)]">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-10 border-b border-slate-100 bg-slate-50/50">
        <div class="flex items-center gap-6">
          <div class="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-900/20 rotate-3 hover:rotate-0 transition-transform duration-500">
            <i class="pi pi-box text-3xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-black tracking-tighter text-slate-800 uppercase italic leading-none">
              Novo Plano de Corte (Metragem)
            </h2>
            <div class="flex items-center gap-2 mt-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Pedido do fornecedor por metragem
              </p>
            </div>
          </div>
        </div>

        <button
          @click="router.back()"
          class="flex items-center gap-3 px-6 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm group"
        >
          <i class="pi pi-arrow-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
          <span class="text-[10px] font-black uppercase tracking-widest">Voltar</span>
        </button>
      </header>

      <div class="p-10">
        <section class="grid grid-cols-12 gap-8 mb-12">
          <div class="col-span-12 md:col-span-6">
            <SearchInput
              v-model="fornecedorSelecionado"
              mode="select"
              label="Fornecedor"
              :options="fornecedorOptions"
              required
              @update:modelValue="onSelecionarFornecedor"
            />
          </div>

          <div class="col-span-12 md:col-span-3">
            <Input v-model="dataVenda" label="Data do Pedido" type="date" required />
          </div>

          <div class="col-span-12 md:col-span-3">
            <SearchInput
              v-model="statusPlano"
              mode="select"
              label="Status"
              :options="statusPlanoOptions"
            />
            <div class="mt-2">
              <span
                class="px-2 py-1 rounded text-[9px] font-black uppercase inline-flex items-center gap-1.5"
                :class="statusPlanoBadgeClass"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="statusPlanoDotClass"></span>
                {{ statusPlanoLabel }}
              </span>
            </div>
          </div>
        </section>

        <section class="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 shadow-inner mb-10">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">Adicionar Itens por Metragem</h3>
            <button
              v-if="can('plano_corte.criar')"
              type="button"
              @click="abrirModalProduto"
              class="text-[10px] font-black uppercase text-emerald-600 hover:tracking-widest transition-all italic"
            >
              + Cadastrar Novo Produto
            </button>
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

            <div class="col-span-12 md:col-span-9">
              <div class="flex items-center gap-3">
                <div class="flex-1 px-4 h-14 rounded-2xl bg-white border border-slate-200 flex flex-col justify-center">
                  <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Area por peca</span>
                  <span class="text-sm font-black text-emerald-600">{{ areaPecaExibicao }}</span>
                </div>
                <div class="flex-1 px-4 h-14 rounded-2xl bg-white border border-slate-200 flex flex-col justify-center">
                  <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total item</span>
                  <span class="text-sm font-black text-emerald-600">{{ itemNovoTotalExibicao }}</span>
                </div>
                <Button
                  v-if="can('plano_corte.criar')"
                  variant="primary"
                  class="!h-14 !w-14 !rounded-2xl shadow-xl shadow-slate-900/20"
                  :disabled="!podeAdicionarItem"
                  @click="registrarItemNovo"
                >
                  <i class="pi pi-plus text-lg"></i>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Table
          :columns="columnsItens"
          :rows="itens"
          class="premium-table"
          empty-text="Nenhum item adicionado."
        >
          <template #cell-produto="{ row }">
            <div class="flex flex-col">
              <span class="font-black text-slate-700 uppercase italic tracking-tighter">{{ row.item?.nome_produto }}</span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {{ row.item?.cor || 'PADRAO' }} • {{ row.item?.marca || 'SEM MARCA' }}
              </span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {{ row.largura_mm }}x{{ row.comprimento_mm }}mm • {{ row.espessura_mm || '-' }}mm
              </span>
            </div>
          </template>

          <template #cell-valor_unitario="{ row }">
            <span class="font-bold text-slate-500 text-xs">{{ maskMoneyBR(row.valor_unitario || 0) }}</span>
          </template>

          <template #cell-valor_total="{ row }">
            <span class="font-black text-slate-800">{{ maskMoneyBR(row.valor_total || 0) }}</span>
          </template>

          <template #cell-acoes="{ index }">
            <div class="flex justify-end">
              <button
                v-if="can('plano_corte.criar')"
                @click="confirmarRemoverItemPlano(index)"
                class="w-10 h-10 rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center"
              >
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          </template>
        </Table>

        <div class="flex justify-end mt-12">
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-slate-900 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <div class="relative flex flex-col items-end p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl min-w-[300px]">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total do Pedido</span>
              <span class="text-4xl font-black text-slate-900 tracking-tighter mt-2 italic">
                {{ maskMoneyBR(totalCalculado) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <footer class="flex items-center justify-between p-10 border-t border-slate-100 bg-slate-50/50">
        <div></div>

        <Button
          v-if="can('plano_corte.criar')"
          variant="primary"
          :loading="salvando"
          @click="salvarEGerarPdf"
          class="!rounded-[1.5rem] !px-12 !h-14 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] font-black text-[10px] uppercase tracking-widest bg-slate-900 hover:bg-black"
        >
          <i class="pi pi-check-circle mr-3"></i>
          Salvar e Gerar PDF
        </Button>
      </footer>
    </Card>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modalProduto.aberto"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          @click.self="fecharModalProduto"
        >
          <div class="w-full max-w-2xl max-h-[85vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
            <header class="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-[1.1rem] bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <i class="pi pi-box text-lg"></i>
                </div>

                <div>
                  <h3 class="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">
                    Novo Insumo
                  </h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Cadastro rapido para este fornecedor
                    </p>
                  </div>
                </div>
              </div>

              <button
                class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
                @click="fecharModalProduto"
                type="button"
              >
                <i class="pi pi-times text-xs"></i>
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

                <div class="col-span-12 flex items-center justify-end gap-4 pt-6 border-t border-slate-100 mt-2">
                  <button
                    type="button"
                    @click="fecharModalProduto"
                    class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>

                  <Button
                    variant="primary"
                    type="submit"
                    :loading="modalProduto.salvando"
                    class="!h-12 !rounded-[1.2rem] !px-8 shadow-xl shadow-brand-primary/20 font-black text-[10px] uppercase tracking-widest"
                  >
                    <i class="pi pi-check-circle mr-3"></i>
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
import { PlanoCorteService, FornecedorService } from '@/services/index'
import { PIPELINE_PLANO_CORTE, UNIDADES } from '@/constantes'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'

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

const statusPlanoPipeline = computed(() =>
  (PIPELINE_PLANO_CORTE || []).find((p) => p.key === statusPlano.value),
)

const statusPlanoBadgeClass = computed(() =>
  statusPlanoPipeline.value?.badgeClass || 'bg-slate-50 text-slate-600 border border-slate-200',
)

const statusPlanoDotClass = computed(() =>
  statusPlanoPipeline.value?.dotClass || 'bg-slate-400',
)

const statusPlanoLabel = computed(() =>
  statusPlanoPipeline.value?.label || statusPlano.value || '—',
)

const fornecedor = ref([])
const fornecedorSelecionado = ref(null)
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
  if (!fornecedorSelecionado.value) return
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

async function onSelecionarFornecedor(v) {
  fornecedorSelecionado.value = v
  itens.value = []
  if (v) await carregarItensDisponiveis(v)
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

async function salvarEGerarPdf() {
  if (!fornecedorSelecionado.value) return notify.error('Selecione um fornecedor.')
  if (!itens.value.length) return notify.error('Adicione ao menos um item.')

  salvando.value = true
  try {
    const payload = {
      fornecedor_id: Number(fornecedorSelecionado.value),
      data_venda: dataVenda.value,
      status: statusPlano.value || (PIPELINE_PLANO_CORTE?.[0]?.key || 'EM_ABERTO'),
      produtos: itens.value,
    }

    const { data } = await PlanoCorteService.salvar(null, payload)
    const planoId = data?.id

    if (planoId) {
      const pdfRes = await PlanoCorteService.abrirPdf(planoId)
      await router.push({
        path: `/arquivos/${pdfRes?.data?.arquivoId}`,
        query: {
          name: `PLANO_CORTE_${String(planoId).replace(/\D/g, '')}.pdf`,
          type: 'application/pdf',
        },
      })
    } else {
      notify.success('Plano criado!')
      router.push('/plano-corte')
    }
  } catch (e) {
    notify.error('Erro ao salvar plano.')
  } finally {
    salvando.value = false
  }
}

onMounted(async () => {
  const { data: fData } = await FornecedorService.listar()
  fornecedor.value = fData || []
  statusPlano.value = PIPELINE_PLANO_CORTE?.[0]?.key || 'EM_ABERTO'
})
</script>
