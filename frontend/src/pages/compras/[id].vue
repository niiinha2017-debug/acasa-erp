<template>
  <Card class="mt-4 mb-8 mx-2 lg:mx-4 shadow-xl rounded-[2.5rem] overflow-hidden animate-page-in">
    <PageHeader
      :title="isEdit ? `Compra #${compraId}` : 'Nova Compra'"
      subtitle="Registre uma nova entrada de materiais."
      icon="pi pi-shopping-cart"
      :backTo="'/compras'"
      class="border-b border-border-ui"
    />

    <div class="p-8 lg:p-12">
      <Loading v-if="loading" />

      <form v-else class="space-y-10" @submit.prevent="confirmarSalvarCompra" autocomplete="off">
        <!-- Identificação -->
        <div class="grid grid-cols-12 gap-6 items-end bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-2xl">
          <div class="col-span-12 md:col-span-4">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">
              Destino do Gasto
            </label>

            <div class="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                class="flex-1 justify-center !h-12 !rounded-xl"
                :class="tipoCompra === 'INSUMOS' ? 'ring-2 ring-brand-primary bg-brand-primary/10' : ''"
                @click="tipoCompra = 'INSUMOS'"
              >
                <span class="text-[10px] font-black uppercase">Estoque</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                class="flex-1 justify-center !h-12 !rounded-xl"
                :class="tipoCompra === 'CLIENTE_AMBIENTE' ? 'ring-2 ring-brand-primary bg-brand-primary/10' : ''"
                @click="tipoCompra = 'CLIENTE_AMBIENTE'"
              >
                <span class="text-[10px] font-black uppercase">Venda</span>
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
            placeholder="Selecione..."
          />

          <Input
            class="col-span-12 md:col-span-3"
            v-model="form.data_compra"
            label="Data da Compra *"
            type="date"
            required
          />
        </div>

        <!-- Cliente x Ambiente (somente quando Venda) -->
        <div v-if="tipoCompra === 'CLIENTE_AMBIENTE'" class="space-y-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Cliente x Ambiente
              </span>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-6 items-end">
            <SearchInput
              class="col-span-12 md:col-span-6"
              v-model="vendaSelecionada"
              mode="select"
              label="Venda *"
              :options="vendaOptions"
              required
              placeholder="Selecione..."
            />

            <SearchInput
              class="col-span-12 md:col-span-6"
              v-model="ambienteSelecionado"
              mode="select"
              label="Ambiente"
              :options="ambienteOptions"
              :required="!todosAmbientesMes"
              :readonly="todosAmbientesMes"
              placeholder="Selecione..."
            />

            <div class="col-span-12">
              <CustomCheckbox
                label="Aplicar em TODOS os ambientes do mês"
                description="Quando marcado, o rateio será dividido entre todos os ambientes desta venda."
                :model-value="todosAmbientesMes"
                @update:model-value="(v) => { todosAmbientesMes = v; if (v) ambienteSelecionado = null }"
              />
            </div>
          </div>
        </div>

        <!-- Itens -->
        <div class="space-y-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Itens da Nota
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between gap-4">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
              Adicione os itens da compra
            </p>

            <Button
              variant="ghost"
              size="sm"
              type="button"
              class="text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/5 text-brand-primary"
              @click="abrirModalProduto"
            >
              <i class="pi pi-plus-circle mr-2"></i>
              Produto não cadastrado?
            </Button>
          </div>

          <div class="grid grid-cols-12 gap-6 items-end bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-2xl border border-border-ui">
            <SearchInput
  class="col-span-12 md:col-span-6"
  :key="itemNovoKey"
  v-model="itemNovo.produto_id"
  mode="select"
  label="Produto"
  :options="produtoOptions"
  @update:modelValue="onSelecionarProdutoNovo"
  placeholder="Selecione..."
/>

<Input
  class="col-span-6 md:col-span-2"
  v-model="itemNovo.quantidade"
  label="Qtd"
  type="number"
  placeholder="0"
/>

<Input
  class="col-span-6 md:col-span-4"
  v-model="itemNovo.valorUnitarioMask"
  label="Valor Unitário"
  placeholder="0,00"
  @input="itemNovo.valorUnitarioMask = maskMoneyBR($event.target.value)"
/>


            <div class="col-span-12">
              <Button
                variant="primary"
                size="lg"
                class="w-full !rounded-xl"
                type="button"
                @click="registrarItemNovo"
              >
                ADICIONAR ITEM
              </Button>
            </div>
          </div>

          <div v-if="itens.length" class="border border-border-ui rounded-2xl overflow-hidden">
            <Table :columns="columnsItens" :rows="itens" boxed>
<template #cell-nome_produto="{ row }">
  <div class="py-2">
    <div class="font-black text-slate-700 uppercase text-xs">
      {{ row.nome_produto }}
    </div>

    <div v-if="descDoItem(row)" class="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {{ descDoItem(row) }}
    </div>
  </div>
</template>


              <template #cell-valor_unitario="{ value }">
                <span class="text-xs font-bold text-slate-500">
                  R$ {{ Number(value).toLocaleString('pt-br', { minimumFractionDigits: 2 }) }}
                </span>
              </template>

              <template #cell-valor_total="{ value }">
                <span class="text-sm font-black text-slate-800">
                  R$ {{ Number(value).toLocaleString('pt-br', { minimumFractionDigits: 2 }) }}
                </span>
              </template>

<template #cell-acoes="{ row }">
  <div class="flex justify-end gap-2">
    <Button
      variant="ghost"
      size="sm"
      type="button"
      @click="editarItemPorKey(row._key)"
    >
      <i class="pi pi-pencil text-[12px]"></i>
    </Button>

    <Button
      variant="ghost"
      size="sm"
      type="button"
      class="text-red-500 hover:bg-red-50"
      @click="removerItem(row._key)"
    >
      <i class="pi pi-trash text-[12px]"></i>
    </Button>
  </div>
</template>


            </Table>

            <div class="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/20 border-t border-border-ui">
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total da Compra</span>
              <span class="text-lg font-black">
                R$ {{ Number(totalCalculado).toLocaleString('pt-br', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Footer (igual Cliente: simples, sem firula) -->
        <div class="pt-10 mt-6 border-t border-border-ui">
          <div class="flex items-center justify-between gap-4">
            <div></div>

    
<Button
  v-if="can(isEdit ? 'compras.editar' : 'compras.criar')"
  variant="primary"
  size="lg"
  type="submit"
  :loading="salvando"
  :disabled="!podeSalvar"
>

              <i class="pi pi-save mr-2 text-[12px]"></i>
              {{ isEdit ? 'ATUALIZAR COMPRA' : 'SALVAR COMPRA' }}
            </Button>

<Button
  v-if="isEdit && can('compras.excluir')"
  type="button"
  variant="danger"
  size="lg"
  :loading="excluindo"
  @click="confirmarExcluirCompra"
>
              <i class="pi pi-trash mr-2 text-[12px]"></i>
              EXCLUIR
            </Button>

            <div v-if="!isEdit"></div>
          </div>
        </div>
      </form>
    </div>

    <QuickCreateProduto
      :open="modalProdutoOpen"
      :fornecedor-id="fornecedorSelecionado ? Number(fornecedorSelecionado) : null"
      :texto-inicial="''"
      @close="fecharModalProduto"
      @created="onProdutoCriado"
    />
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
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'compras.ver' } })


// =======================
// STATE
// =======================
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const salvando = ref(false)
const excluindo = ref(false)

const tipoCompra = ref('INSUMOS')
const fornecedorSelecionado = ref(null)
const vendaSelecionada = ref(null)

const form = reactive({
  data_compra: new Date().toISOString().split('T')[0],
})

const itens = ref([])
const itensRemoverIds = ref([])

const modalProdutoOpen = ref(false)

const listaFornecedores = ref([])
const listaVendas = ref([])

const produtoOptions = ref([])
const produtoMap = ref(new Map())

const listaAmbientes = ref([])        // [{ nome: 'COZINHA' }, ...]
const ambienteSelecionado = ref(null) // string
const todosAmbientesMes = ref(false)

const itemNovoKey = ref(0)

// item novo com snapshot
const itemNovo = reactive({
  produto_id: null,
  nome_produto: '',
  marca: null,
  cor: null,
  medida: null,
  unidade: '',
  quantidade: 1,
  valorUnitarioMask: '0,00',
})

// =======================
// COMPUTED
// =======================
const isEdit = computed(() => route.params.id && route.params.id !== 'novo')
const compraId = computed(() => (isEdit.value ? Number(route.params.id) : null))

const totalCalculado = computed(() => {
  const total = itens.value.reduce((acc, it) => acc + Number(it.valor_total || 0), 0)
  return round2(total)
})

const fornecedorOptions = computed(() =>
  (Array.isArray(listaFornecedores.value) ? listaFornecedores.value : []).map((f) => ({
    value: f.id,
    label: f.razao_social || f.nome_fantasia,
  })),
)

const vendaOptions = computed(() =>
  (Array.isArray(listaVendas.value) ? listaVendas.value : []).map((v) => ({
    value: v.id,
    label: v.cliente?.nome_completo || `Venda #${v.id}`,
  })),
)

const ambienteOptions = computed(() =>
  (Array.isArray(listaAmbientes.value) ? listaAmbientes.value : []).map((a) => ({
    value: a.nome,
    label: a.nome,
  })),
)

const podeSalvar = computed(() => {
  if (!fornecedorSelecionado.value || !form.data_compra) return false

  if (tipoCompra.value === 'INSUMOS') return true

  if (tipoCompra.value === 'CLIENTE_AMBIENTE') {
    if (!vendaSelecionada.value) return false
    if (!todosAmbientesMes.value && !ambienteSelecionado.value) return false
    // ✅ não exige itens
    return true
  }

  return false
})


// tabela
const columnsItens = [
  { key: 'nome_produto', label: 'Produto' },
  { key: 'quantidade', label: 'Qtd', align: 'center' },
  { key: 'valor_unitario', label: 'V. Unit.' },
  { key: 'valor_total', label: 'Subtotal' },
  { key: 'acoes', label: '', width: '120px', align: 'right' },
]

// =======================
// HELPERS
// =======================
function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

function resetarItemNovo() {
  Object.assign(itemNovo, {
    produto_id: null,
    nome_produto: '',
    marca: null,
    cor: null,
    medida: null,
    unidade: '',
    quantidade: 1,
    valorUnitarioMask: '0,00',
  })
  itemNovoKey.value++
}

function montarRateiosClienteAmbiente(total) {
  const tot = round2(Number(total || 0))

  // 1 ambiente: sempre 1 linha (mesmo com total 0)
  if (!todosAmbientesMes.value) {
    return [
      { nome_ambiente: String(ambienteSelecionado.value || '').trim(), valor_alocado: tot }
    ]
  }

  // todos: se ainda não carregou ambientes, não deixa vazio
  const nomes = (listaAmbientes.value || [])
    .map((a) => String(a?.nome || '').trim())
    .filter(Boolean)

  const unicos = Array.from(new Set(nomes))

  // ✅ fallback: se não tem lista ainda, usa o ambienteSelecionado se existir
  if (!unicos.length) {
    const fallback = String(ambienteSelecionado.value || '').trim()
    if (fallback) return [{ nome_ambiente: fallback, valor_alocado: tot }]
    return [{ nome_ambiente: 'GERAL', valor_alocado: tot }] // último fallback pra não ir vazio
  }

  // se total = 0, pode mandar tudo 0 sem dividir
  if (tot === 0) {
    return unicos.map((nome) => ({ nome_ambiente: nome, valor_alocado: 0 }))
  }

  // total > 0: divide igualmente e ajusta último
  const base = round2(Math.floor((tot / unicos.length) * 100) / 100)
  let soma = 0

  return unicos.map((nome, idx) => {
    const valor = idx === unicos.length - 1 ? round2(tot - soma) : base
    soma = round2(soma + valor)
    return { nome_ambiente: nome, valor_alocado: valor }
  })
}

// =======================
// PRODUTOS
// =======================
const onSelecionarProdutoNovo = (id) => {
  const cleanId = Number(id)
  const p = produtoMap.value.get(cleanId)
  if (!p) return

  itemNovo.produto_id = cleanId
  itemNovo.nome_produto = p.nome_produto
  itemNovo.marca = p.marca ?? null
  itemNovo.cor = p.cor ?? null
  itemNovo.medida = p.medida ?? null
  itemNovo.unidade = p.unidade || ''
  itemNovo.valorUnitarioMask = numeroParaMoeda(Number(p.valor_unitario || 0))
}

const registrarItemNovo = () => {
  if (!itemNovo.produto_id) {
    notify.warn('Selecione um produto.')
    return
  }
if (!itemNovo.unidade) {
  notify.warn('Produto sem unidade. Defina a unidade no cadastro do produto.')
  return
}


  const qtd = Number(itemNovo.quantidade || 0)
  if (qtd <= 0) {
    notify.warn('Informe a quantidade.')
    return
  }

  const vUnit = moedaParaNumero(itemNovo.valorUnitarioMask)
  if (vUnit <= 0) {
    notify.warn('Informe o valor unitário.')
    return
  }

  const valorTotal = round2(vUnit * qtd)

  itens.value.push({
    _key: Date.now() + Math.random(),
    produto_id: Number(itemNovo.produto_id),
    nome_produto: itemNovo.nome_produto,
    marca: itemNovo.marca,
    cor: itemNovo.cor,
    medida: itemNovo.medida,
    unidade: itemNovo.unidade,
    quantidade: qtd,
    valor_unitario: vUnit,
    valor_total: valorTotal,
    id: null,
  })

  resetarItemNovo()
  notify.success('Item adicionado!')
}

const removerItem = async (key) => {
  const item = itens.value.find((it) => it._key === key)
  if (!item) return

  const ok = await confirm.show('Remover Item', 'Tem certeza que deseja remover este item?')
  if (!ok) return

  if (isEdit.value && item.id) itensRemoverIds.value.push(item.id)
  itens.value = itens.value.filter((it) => it._key !== key)

  notify.info('Item removido.')
}

const editarItemPorKey = async (key) => {
  // sem UX extra: edição simples reaproveitando o form de "Item Novo"
  const item = itens.value.find((it) => it._key === key)
  if (!item) return

  itemNovo.produto_id = item.produto_id
  itemNovo.nome_produto = item.nome_produto
  itemNovo.marca = item.marca ?? null
  itemNovo.cor = item.cor ?? null
  itemNovo.medida = item.medida ?? null
  itemNovo.unidade = item.unidade || ''
  itemNovo.quantidade = Number(item.quantidade || 1)
  itemNovo.valorUnitarioMask = numeroParaMoeda(Number(item.valor_unitario || 0))

  // remove da lista e deixa o usuário adicionar de novo
  if (isEdit.value && item.id) itensRemoverIds.value.push(item.id)
  itens.value = itens.value.filter((it) => it._key !== key)

  notify.info('Item carregado para edição.')
}

// =======================
// AMBIENTES (VENDA)
// =======================
const carregarAmbientesDaVenda = async () => {
  if (!vendaSelecionada.value) {
    listaAmbientes.value = []
    ambienteSelecionado.value = null
    return
  }

  try {
    const res = await VendaService.listarAmbientes(Number(vendaSelecionada.value))
    const data = res?.data ?? res
    listaAmbientes.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.log('[COMPRA] erro ao carregar ambientes:', e?.response?.data || e)
    listaAmbientes.value = []
    notify.error('Erro ao carregar ambientes da venda.')
  }
}

// =======================
// SAVE / DELETE
// =======================
const validarFormulario = () => {
  if (!fornecedorSelecionado.value) {
    notify.error('Selecione um fornecedor.')
    return false
  }
  if (!form.data_compra) {
    notify.error('Informe a data da compra.')
    return false
  }

  if (tipoCompra.value === 'CLIENTE_AMBIENTE') {
    if (!vendaSelecionada.value) {
      notify.error('Selecione a venda.')
      return false
    }
    if (!todosAmbientesMes.value && !ambienteSelecionado.value) {
      notify.error('Selecione o ambiente (ou marque todos).')
      return false
    }
  }

  return true
}


const confirmarSalvarCompra = async () => {
  const perm = isEdit.value ? 'compras.editar' : 'compras.criar'
  if (!can(perm)) return notify.error('Acesso negado.')


  if (!validarFormulario()) return

  const ok = await confirm.show(
    isEdit.value ? 'Atualizar Compra' : 'Salvar Compra',
    isEdit.value ? `Deseja atualizar a Compra #${compraId.value}?` : 'Deseja confirmar e salvar esta compra?',
  )
  if (!ok) return

  await salvarCompra()
}

const salvarCompra = async () => {
  const perm = isEdit.value ? 'compras.editar' : 'compras.criar'
  if (!can(perm)) return notify.error('Acesso negado.')
  
  salvando.value = true
  try {
    const total = round2(Number(totalCalculado.value || 0))

    const payload = {
      tipo_compra: tipoCompra.value,
      fornecedor_id: Number(fornecedorSelecionado.value),
      venda_id: tipoCompra.value === 'CLIENTE_AMBIENTE' ? Number(vendaSelecionada.value) : null,
      data_compra: form.data_compra,
      valor_total: total,
      itens: itens.value.map((it) => ({
        ...(it.id ? { id: Number(it.id) } : {}),
        produto_id: Number(it.produto_id),
        quantidade: Number(it.quantidade),
        unidade: it.unidade,
        valor_unitario: Number(it.valor_unitario),
        valor_total: Number(it.valor_total),
      })),
      ...(isEdit.value && itensRemoverIds.value.length
        ? { itens_remover_ids: itensRemoverIds.value.map(Number) }
        : {}),
    }

if (tipoCompra.value === 'CLIENTE_AMBIENTE') {
  payload.rateios = montarRateiosClienteAmbiente(total)
}


    await CompraService.salvar(compraId.value, payload)
    notify.success(isEdit.value ? 'Compra atualizada!' : 'Compra criada!')
    router.push('/compras')
  } catch (e) {
    console.log('[COMPRA] erro salvar:', e?.response?.status, e?.response?.data, e)
    notify.error(e?.response?.data?.message || 'Erro ao salvar compra.')
  } finally {
    salvando.value = false
  }
}

const confirmarExcluirCompra = async () => {
  if (!can('compras.excluir')) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    'Excluir Compra',
    `Deseja realmente excluir a Compra #${compraId.value}?`,
  )
  if (!ok) return

  excluindo.value = true
  try {
    await CompraService.remover(compraId.value)
    notify.success('Compra excluída!')
    router.push('/compras')
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao excluir compra.')
  } finally {
    excluindo.value = false
  }
}

// =======================
// LOADERS
// =======================
const carregarProdutos = async () => {
  if (!fornecedorSelecionado.value) {
    produtoOptions.value = []
    produtoMap.value = new Map()
    return
  }

  try {
    const res = await ProdutosService.listar({ fornecedor_id: Number(fornecedorSelecionado.value) })
    const data = res?.data ?? res
    const arr = Array.isArray(data) ? data : []

produtoOptions.value = arr.map((p) => ({
  value: p.id,
  label: `${p.nome_produto}${p.marca ? ` • ${p.marca}` : ''}${p.cor ? ` • ${p.cor}` : ''}${p.medida ? ` • ${p.medida}` : ''}`,
}))


    const map = new Map()
    arr.forEach((p) => {
      map.set(Number(p.id), {
        id: p.id,
        nome_produto: p.nome_produto,
        marca: p.marca ?? null,
        cor: p.cor ?? null,
        medida: p.medida ?? null,
        unidade: p.unidade ?? '',
        valor_unitario: Number(p.valor_unitario || 0),
      })
    })
    produtoMap.value = map
  } catch (e) {
    console.log('[COMPRA] erro carregarProdutos:', e?.response?.data || e)
    produtoOptions.value = []
    produtoMap.value = new Map()
    notify.error('Erro ao carregar produtos do fornecedor.')
  }
}

const carregarCompra = async () => {
  const res = await CompraService.buscar(compraId.value)
  const compra = res?.data ?? res
  if (!compra) throw new Error('Compra não encontrada')

  tipoCompra.value = compra.tipo_compra || 'INSUMOS'
  fornecedorSelecionado.value = compra.fornecedor_id ?? null
  vendaSelecionada.value = compra.venda_id ?? null
  form.data_compra = compra.data_compra?.split('T')[0] || form.data_compra

  itens.value = (compra.itens || []).map((it) => ({
    ...it,
    _key: it.id ? `db-${it.id}` : Date.now() + Math.random(),
    valor_unitario: Number(it.valor_unitario || 0),
    valor_total: Number(it.valor_total || 0),
  }))

  itensRemoverIds.value = []

  // ambientes: se for venda, carrega lista e tenta setar selecionado pela regra:
  if (tipoCompra.value === 'CLIENTE_AMBIENTE' && vendaSelecionada.value) {
    await carregarAmbientesDaVenda()
    // se a compra tiver rateios, tenta escolher o 1o
    if (Array.isArray(compra.rateios) && compra.rateios.length === 1) {
      todosAmbientesMes.value = false
      ambienteSelecionado.value = compra.rateios[0]?.nome_ambiente || null
    } else if (Array.isArray(compra.rateios) && compra.rateios.length > 1) {
      todosAmbientesMes.value = true
      ambienteSelecionado.value = null
    }
  }
}

function descDoItem(row) {
  const partes = [
    row?.marca,
    row?.cor,
    row?.medida,
    row?.unidade,
  ]
    .map((v) => String(v || '').trim())
    .filter(Boolean)

  return partes.join(' • ')
}


const carregarDadosIniciais = async () => {
  loading.value = true
  try {
    const [fornRes, vendRes] = await Promise.all([FornecedorService.listar(), VendaService.listar()])

    const fornData = fornRes?.data ?? fornRes
    const vendData = vendRes?.data ?? vendRes

    listaFornecedores.value = Array.isArray(fornData) ? fornData : []
    listaVendas.value = Array.isArray(vendData) ? vendData : []

    if (isEdit.value) {
      await carregarCompra()
    }
  } catch (e) {
    console.log('[COMPRA] erro carregarDadosIniciais:', e)
    notify.error('Erro ao carregar dados.')
  } finally {
    loading.value = false
  }
}

// =======================
// MODAL PRODUTO
// =======================
function abrirModalProduto() {
  if (!fornecedorSelecionado.value) {
    notify.warn('Selecione um fornecedor primeiro.')
    return
  }
  modalProdutoOpen.value = true
}

function fecharModalProduto() {
  modalProdutoOpen.value = false
}

async function onProdutoCriado(payload) {
  await carregarProdutos()

  const produto = payload?.data ?? payload
  const id = Number(produto?.id)
  if (id) {
    itemNovo.produto_id = id
    onSelecionarProdutoNovo(id)
  }

  modalProdutoOpen.value = false
}

// =======================
// WATCHERS
// =======================
watch(tipoCompra, (t) => {
  if (t !== 'CLIENTE_AMBIENTE') {
    vendaSelecionada.value = null
    listaAmbientes.value = []
    ambienteSelecionado.value = null
    todosAmbientesMes.value = false
  }
})

watch(vendaSelecionada, async () => {
  todosAmbientesMes.value = false
  ambienteSelecionado.value = null
  await carregarAmbientesDaVenda()
})

watch(fornecedorSelecionado, async (id) => {
  if (!id) {
    produtoOptions.value = []
    produtoMap.value = new Map()
    resetarItemNovo()
    return
  }
  resetarItemNovo()
  await carregarProdutos()
})

// =======================
// INIT
// =======================
onMounted(async () => {
  const perm = isEdit.value ? 'compras.editar' : 'compras.criar'
  if (!can(perm)) {
    notify.error('Acesso negado.')
    router.push('/compras')
    return
  }
  await carregarDadosIniciais()
})

</script>

