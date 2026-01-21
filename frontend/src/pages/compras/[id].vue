<template>
  <Card :shadow="true">
    <PageHeader
      :title="isEdit ? `Compra #${compraId}` : 'Nova Compra'"
      subtitle="Registre uma nova entrada de materiais."
      icon="pi pi-shopping-cart"
      :backTo="'/compras'"
    />

    <div class="p-6 relative">
      <div
        v-if="loading"
        class="absolute inset-0 z-20 flex items-center justify-center bg-[var(--bg-page)]/70 backdrop-blur-md rounded-[inherit]"
      >
        <Loading />
      </div>

      <form v-else class="space-y-8" @submit.prevent>
        <!-- 01 -->
        <section class="space-y-4">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
              01. Origem e Fornecedor
            </span>
            <div class="flex-1 h-px bg-[var(--border-ui)]"></div>
          </div>

          <div class="grid grid-cols-12 gap-4 items-end">
            <div class="col-span-12 md:col-span-4">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                Origem do Gasto
              </label>

              <div class="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  class="flex-1 justify-center transition-all"
                  :class="tipoCompra === 'INSUMOS' ? 'ring-2 ring-brand-primary bg-brand-primary/10' : ''"
                  @click="tipoCompra = 'INSUMOS'"
                >
                  <span class="text-xs font-black uppercase">Estoque</span>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  class="flex-1 justify-center transition-all"
                  :class="tipoCompra === 'CLIENTE_AMBIENTE' ? 'ring-2 ring-brand-primary bg-brand-primary/10' : ''"
                  @click="tipoCompra = 'CLIENTE_AMBIENTE'"
                >
                  <span class="text-xs font-black uppercase">Venda</span>
                </Button>
              </div>
            </div>

            <SearchInput
              class="col-span-12 md:col-span-5"
              v-model="fornecedorSelecionado"
              mode="select"
              label="Fornecedor *"
              :options="fornecedorOptions"
              required
              placeholder="Selecione o fornecedor..."
            />

            <Input
              class="col-span-12 md:col-span-3"
              v-model="form.data_compra"
              label="Data da Compra *"
              type="date"
              required
            />
          </div>
        </section>

        <div class="h-px bg-[var(--border-ui)]"></div>

        <!-- 02 -->
        <section v-if="tipoCompra === 'CLIENTE_AMBIENTE'" class="space-y-4">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
              02. Cliente x Ambiente
            </span>
            <div class="flex-1 h-px bg-[var(--border-ui)]"></div>
          </div>

          <div class="grid grid-cols-12 gap-4 items-end">
            <SearchInput
              class="col-span-12 md:col-span-8"
              v-model="vendaSelecionada"
              mode="select"
              label="Venda / Cliente Relacionado *"
              :options="vendaOptions"
              required
              placeholder="Selecione a venda para rateio..."
            />

            <div class="col-span-12 md:col-span-4">
              <div class="rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-4">
                <p class="text-[9px] font-black uppercase tracking-widest text-brand-primary">Informativo</p>
                <p class="mt-1 text-xs font-semibold text-[var(--text-main)] opacity-70 leading-relaxed">
                  O valor desta compra será debitado diretamente no lucro da venda selecionada.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div v-if="tipoCompra === 'CLIENTE_AMBIENTE'" class="h-px bg-[var(--border-ui)]"></div>

        <!-- 03 -->
        <section class="space-y-4">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div class="flex items-center gap-2 flex-1">
              <span class="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
                03. Itens da Nota
              </span>
              <div class="flex-1 h-px bg-[var(--border-ui)]"></div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              type="button"
              class="text-[10px] font-bold uppercase tracking-wider"
              :disabled="!fornecedorSelecionado"
              @click="abrirModalProduto"
            >
              <i class="pi pi-plus mr-2"></i>
              Produto não cadastrado?
            </Button>
          </div>

          <div class="grid grid-cols-12 gap-4 p-5 rounded-3xl border border-[var(--border-ui)] bg-[var(--bg-page)]/50 items-end shadow-inner">
            <SearchInput
              class="col-span-12 md:col-span-5"
              :key="itemNovoKey"
              v-model="itemNovo.produto_id"
              mode="select"
              label="Buscar Produto *"
              :options="produtoOptions"
              @update:modelValue="onSelecionarProdutoNovo"
              placeholder="Digite e selecione..."
              required
            />

            <Input
              class="col-span-12 md:col-span-2"
              v-model="itemNovo.quantidade"
              label="Quantidade *"
              type="number"
              required
            />

            <Input
              class="col-span-12 md:col-span-3"
              v-model="itemNovo.valorUnitarioMask"
              label="Valor Unitário *"
              placeholder="0,00"
              required
              @input="itemNovo.valorUnitarioMask = maskMoneyBR($event.target.value)"
            />

            <Input
              class="col-span-12 md:col-span-2"
              :modelValue="subtotalNovoMask"
              label="Subtotal"
              readonly
            />

            <div class="col-span-12">
              <Button
                variant="primary"
                size="lg"
                class="w-full shadow-lg shadow-brand-primary/10"
                type="button"
                @click="registrarItemNovo"
              >
                <i class="pi pi-plus-circle mr-2 text-xs"></i>
                Adicionar Item à Nota
              </Button>
            </div>
          </div>

          <div
            v-if="itens.length > 0"
            class="rounded-3xl border border-[var(--border-ui)] overflow-hidden bg-[var(--bg-card)] shadow-sm"
          >
            <Table :columns="columnsItens" :rows="itens" boxed>
              <template #cell-nome_produto="{ row }">
                <div class="flex flex-col py-2">
                  <span class="font-black text-[var(--text-main)] uppercase text-xs">{{ row.nome_produto }}</span>
                  <div class="flex gap-1.5 mt-1.5">
                    <span
                      v-if="row.marca"
                      class="text-[8px] bg-slate-800 text-white px-2 py-0.5 rounded-full uppercase font-black"
                    >
                      {{ row.marca }}
                    </span>
                    <span
                      v-if="row.unidade"
                      class="text-[8px] bg-[var(--bg-page)] text-slate-500 px-2 py-0.5 rounded-full uppercase font-black border border-[var(--border-ui)]"
                    >
                      {{ row.unidade }}
                    </span>
                  </div>
                </div>
              </template>

              <template #cell-valor_unitario="{ value }">
                <span class="text-xs font-bold text-slate-500">
                  R$ {{ Number(value).toLocaleString('pt-br', { minimumFractionDigits: 2 }) }}
                </span>
              </template>

              <template #cell-valor_total="{ value }">
                <span class="text-sm font-black text-[var(--text-main)]">
                  R$ {{ Number(value).toLocaleString('pt-br', { minimumFractionDigits: 2 }) }}
                </span>
              </template>

              <template #cell-acoes="{ row }">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="text-danger hover:bg-danger/10"
                  @click="removerItemPorKey(row._key)"
                >
                  <i class="pi pi-trash"></i>
                </Button>
              </template>
            </Table>

            <div class="flex items-center justify-between p-5 bg-slate-950 text-white">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-white/5 rounded-lg text-brand-primary border border-white/10">
                  <i class="pi pi-calculator"></i>
                </div>
                <span class="text-[10px] uppercase font-black tracking-widest text-slate-400">Resumo da Nota</span>
              </div>

              <div class="text-right">
                <p class="text-[10px] uppercase font-bold text-brand-primary/80">Valor Geral</p>
                <p class="text-2xl font-black tabular-nums">
                  R$ {{ totalCalculado.toLocaleString('pt-br', { minimumFractionDigits: 2 }) }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </form>
    </div>

    <FormActions class="px-6 pb-6">
      <template #left>
        <Button variant="secondary" type="button" @click="router.back()">Descartar</Button>
      </template>

      <template #right>
        <Button
          v-if="isEdit"
          variant="ghost"
          type="button"
          class="text-danger mr-2"
          :loading="excluindo"
          @click="excluirCompra"
        >
          Excluir Registro
        </Button>

        <Button variant="primary" type="button" :loading="salvando" @click="salvar">
          {{ isEdit ? 'Atualizar Compra' : 'Confirmar e Salvar' }}
        </Button>
      </template>
    </FormActions>

    <!-- MODAL PRODUTO INLINE -->
    <Transition name="fade">
      <div
        v-if="modalProdutoOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
        @click.self="fecharModalProduto()"
      >
        <div class="w-full max-w-3xl bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-ui)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <header class="flex items-start justify-between p-8 border-b border-[var(--border-ui)] bg-slate-500/5">
            <div>
              <h3 class="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Novo Produto</h3>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cadastro Rápido</p>
            </div>
            <button
              @click="fecharModalProduto()"
              class="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-ui)] text-slate-400 hover:text-red-500 transition-all"
            >
              <i class="pi pi-times"></i>
            </button>
          </header>

          <div class="p-10">
            <form class="grid grid-cols-12 gap-5" @submit.prevent="salvarProduto">
              <div class="col-span-12">
                <SearchInput
                  v-model="modalProduto.form.fornecedor_id"
                  label="Fornecedor *"
                  mode="select"
                  :options="fornecedorOptions"
                  required
                />
              </div>

              <div class="col-span-12 md:col-span-8">
                <Input v-model="modalProduto.form.nome_produto" label="Nome do Produto *" required />
              </div>

              <div class="col-span-12 md:col-span-4">
                <SearchInput
                  v-model="modalProduto.form.unidade"
                  label="Unidade *"
                  mode="select"
                  :options="unidadesOptions"
                  required
                />
              </div>

              <div class="col-span-12 md:col-span-6">
                <Input v-model="modalProduto.form.marca" label="Marca" />
              </div>
              <div class="col-span-12 md:col-span-3">
                <Input v-model="modalProduto.form.cor" label="Cor" />
              </div>
              <div class="col-span-12 md:col-span-3">
                <Input v-model="modalProduto.form.medida" label="Medida" />
              </div>

              <div class="col-span-12 flex justify-end gap-3 pt-8 border-t border-[var(--border-ui)] mt-4">
                <Button variant="secondary" type="button" @click="fecharModalProduto()">Cancelar</Button>
                <Button variant="primary" type="submit" :loading="modalProduto.salvando" class="!px-8">
                  Cadastrar e Usar
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Card>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { CompraService, FornecedorService, VendaService, ProdutosService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { maskMoneyBR } from '@/utils/masks'
import { moedaParaNumero, numeroParaMoeda } from '@/utils/number'
import { UNIDADES } from '@/constantes/unidades'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const salvando = ref(false)
const excluindo = ref(false)
const itemNovoKey = ref(0)

const isEdit = computed(() => route.params.id && route.params.id !== 'novo')
const compraId = computed(() => (isEdit.value ? Number(route.params.id) : null))

const tipoCompra = ref('INSUMOS')
const fornecedorSelecionado = ref(null)
const vendaSelecionada = ref(null)

const form = ref({
  data_compra: new Date().toISOString().split('T')[0],
})

const itens = ref([])
const itensRemoverIds = ref([])

const listaFornecedores = ref([])
const listaVendas = ref([])
const produtoMap = ref(new Map())
const produtoOptions = ref([])

const fornecedorOptions = computed(() =>
  listaFornecedores.value.map((f) => ({
    value: f.id,
    label: f.razao_social || f.nome_fantasia,
  })),
)

const vendaOptions = computed(() =>
  listaVendas.value.map((v) => ({
    value: v.id,
    label: v.cliente?.nome_completo || `Venda #${v.id}`,
  })),
)

const unidadesOptions = computed(() =>
  (Array.isArray(UNIDADES) ? UNIDADES : []).map((u) => ({
    value: u.key,
    label: u.label,
  })),
)

const itemNovo = reactive({
  produto_id: null,
  nome_produto: '',
  marca: '',
  cor: '',
  unidade: '',
  quantidade: 1,
  valorUnitarioMask: '0,00',
  valor_total: 0,
})

const totalCalculado = computed(() => {
  const total = itens.value.reduce((acc, it) => acc + Number(it.valor_total || 0), 0)
  return parseFloat(total.toFixed(2))
})

const subtotalNovoMask = computed(() => {
  const vUnit = moedaParaNumero(itemNovo.valorUnitarioMask)
  const qtd = Number(itemNovo.quantidade || 0)
  return numeroParaMoeda(vUnit * qtd)
})

const columnsItens = [
  { key: 'nome_produto', label: 'Produto' },
  { key: 'quantidade', label: 'Qtd', align: 'center' },
  { key: 'valor_unitario', label: 'V. Unit.' },
  { key: 'valor_total', label: 'Subtotal' },
  { key: 'acoes', label: '', width: '80px', align: 'right' },
]

/* -------------------------
   MODAL PRODUTO INLINE
-------------------------- */
const modalProdutoOpen = ref(false)

const modalProduto = ref({
  salvando: false,
  form: {
    fornecedor_id: null,
    nome_produto: '',
    marca: '',
    cor: '',
    medida: '',
    unidade: 'UN',
    status: 'ATIVO',
  },
})

const abrirModalProduto = () => {
  if (!fornecedorSelecionado.value) return notify.warn('Selecione um fornecedor.')
  modalProduto.value.form.fornecedor_id = fornecedorSelecionado.value
  modalProdutoOpen.value = true
}

const fecharModalProduto = () => {
  modalProdutoOpen.value = false
  modalProduto.value.form = {
    fornecedor_id: null,
    nome_produto: '',
    marca: '',
    cor: '',
    medida: '',
    unidade: 'UN',
    status: 'ATIVO',
  }
}

async function salvarProduto() {
  modalProduto.value.salvando = true
  try {
    const payload = {
      fornecedor_id: modalProduto.value.form.fornecedor_id,
      nome_produto: modalProduto.value.form.nome_produto,
      marca: modalProduto.value.form.marca || null,
      cor: modalProduto.value.form.cor || null,
      medida: modalProduto.value.form.medida || null,
      unidade: modalProduto.value.form.unidade,
      status: modalProduto.value.form.status,
    }

    const res = await ProdutosService.criar(payload)
    const data = res?.data ?? res

    await carregarProdutosPorFornecedor()

    if (data?.id) {
      itemNovo.produto_id = data.id
      onSelecionarProdutoNovo(data.id)
    }

    fecharModalProduto()
    notify.success('Produto cadastrado.')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao cadastrar produto.')
  } finally {
    modalProduto.value.salvando = false
  }
}

/* -------------------------
   LOAD / COMPRA
-------------------------- */
const carregarDadosIniciais = async () => {
  loading.value = true
  try {
    const [fornRes, vendRes] = await Promise.all([FornecedorService.listar(), VendaService.listar()])

    const fornData = fornRes?.data ?? fornRes
    const vendData = vendRes?.data ?? vendRes

    listaFornecedores.value = Array.isArray(fornData) ? fornData : []
    listaVendas.value = Array.isArray(vendData) ? vendData : []

    if (isEdit.value) await buscarCompra()
  } catch (err) {
    console.error(err)
    notify.error('Erro ao carregar dados auxiliares.')
  } finally {
    loading.value = false
  }
}

const buscarCompra = async () => {
  try {
    const res = await CompraService.buscar(compraId.value)
    const data = res?.data ?? res

    tipoCompra.value = data.tipo_compra || 'INSUMOS'
    fornecedorSelecionado.value = data.fornecedor_id ?? null
    vendaSelecionada.value = data.venda_id ?? null
    form.value.data_compra = data.data_compra?.split('T')[0] || form.value.data_compra

    itens.value = (data.itens || []).map((it) => ({
      ...it,
      _key: it._key || `db-${it.id}`,
    }))

    itensRemoverIds.value = []
  } catch (err) {
    notify.error('Compra não encontrada.')
    router.push('/compras')
  }
}

const carregarProdutosPorFornecedor = async () => {
  if (!fornecedorSelecionado.value) return

  try {
    const res = await ProdutosService.listar({ fornecedor_id: fornecedorSelecionado.value })
    const data = res?.data ?? res

    produtoOptions.value = (Array.isArray(data) ? data : []).map((p) => ({
      value: p.id,
      label: `${p.nome_produto} (${p.marca || 'S/M'})`,
    }))

    produtoMap.value = new Map()
    ;(Array.isArray(data) ? data : []).forEach((p) => produtoMap.value.set(p.id, p))
  } catch (err) {
    produtoOptions.value = []
    produtoMap.value = new Map()
    notify.error('Erro ao carregar produtos do fornecedor.')
  }
}

const onSelecionarProdutoNovo = (id) => {
  const p = produtoMap.value.get(id)
  if (!p) return

  itemNovo.nome_produto = p.nome_produto
  itemNovo.unidade = p.unidade || ''
  itemNovo.valorUnitarioMask = numeroParaMoeda(Number(p.valor_unitario || 0))
}

const resetItemNovo = () => {
  Object.assign(itemNovo, {
    produto_id: null,
    nome_produto: '',
    marca: '',
    cor: '',
    unidade: '',
    quantidade: 1,
    valorUnitarioMask: '0,00',
    valor_total: 0,
  })
  itemNovoKey.value++
}

const registrarItemNovo = () => {
  if (!itemNovo.produto_id) return notify.warn('Selecione um produto.')

  const vUnit = moedaParaNumero(itemNovo.valorUnitarioMask)
  const qtd = Number(itemNovo.quantidade)

  if (qtd <= 0) return notify.warn('Informe a quantidade.')
  if (vUnit <= 0) return notify.warn('Informe o valor unitário.')

  itens.value.push({
    ...itemNovo,
    valor_unitario: vUnit,
    valor_total: parseFloat((vUnit * qtd).toFixed(2)),
    _key: Date.now(),
  })

  resetItemNovo()
}

const removerItemPorKey = async (key) => {
  const item = itens.value.find((it) => it._key === key)

  const ok = await confirm.show('Remover Item', 'Tem certeza que deseja remover este produto da lista?')
  if (!ok) return

  if (isEdit.value && item?.id) itensRemoverIds.value.push(item.id)

  itens.value = itens.value.filter((it) => it._key !== key)
  notify.success('Item removido da lista.')
}

const salvar = async () => {
  if (itens.value.length === 0) return notify.warn('Adicione ao menos um item.')
  if (!fornecedorSelecionado.value) return notify.warn('Selecione um fornecedor.')

  salvando.value = true

  const payload = {
    tipo_compra: tipoCompra.value,
    fornecedor_id: fornecedorSelecionado.value,
    venda_id: tipoCompra.value === 'CLIENTE_AMBIENTE' ? vendaSelecionada.value : null,
    data_compra: form.value.data_compra,
    valor_total: totalCalculado.value,
    itens: itens.value.map((it) => {
      const item = {
        produto_id: it.produto_id,
        quantidade: Number(it.quantidade),
        unidade: it.unidade,
        valor_unitario: Number(it.valor_unitario),
        valor_total: Number(it.valor_total),
      }
      if (it.id) item.id = it.id
      return item
    }),
  }

  if (isEdit.value && itensRemoverIds.value.length) payload.itens_remover_ids = itensRemoverIds.value

  try {
    await CompraService.salvar(compraId.value, payload)
    notify.success('Compra salva com sucesso!')
    router.push('/compras')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao salvar compra.')
  } finally {
    salvando.value = false
  }
}

const excluirCompra = async () => {
  const ok = await confirm.show(
    'Excluir Compra',
    `Deseja realmente excluir a Compra #${compraId.value}? Esta ação não pode ser desfeita.`,
  )
  if (!ok) return

  excluindo.value = true
  try {
    await CompraService.remover(compraId.value)
    notify.success('Compra excluída com sucesso!')
    router.push('/compras')
  } catch (err) {
    notify.error('Erro ao excluir a compra.')
  } finally {
    excluindo.value = false
  }
}

watch(tipoCompra, (t) => {
  if (t !== 'CLIENTE_AMBIENTE') vendaSelecionada.value = null
})

watch(fornecedorSelecionado, async (id) => {
  if (!id) {
    produtoOptions.value = []
    produtoMap.value = new Map()
    resetItemNovo()
    return
  }
  resetItemNovo()
  await carregarProdutosPorFornecedor()
})

onMounted(carregarDadosIniciais)
</script>
