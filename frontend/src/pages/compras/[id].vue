<template>
  <Card :shadow="true">
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          {{ isEdit ? `Editar Compra #${compraId}` : 'Nova Compra' }}
        </h2>
      </div>

      <Button variant="secondary" size="sm" type="button" @click="router.back()">
        Voltar
      </Button>
    </header>

    <div class="p-6">
      <template v-if="!loading">
        <form class="grid grid-cols-12 gap-x-5 gap-y-6" @submit.prevent>
          
          <div class="col-span-12">
            <label class="block text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-400 mb-2">
              Tipo de Compra
            </label>
            <div class="flex items-center gap-4">
              <span class="text-sm font-black text-gray-900 uppercase">
                {{ tipoCompra === 'INSUMOS' ? 'INSUMOS (Marcenaria)' : 'CLIENTE x AMBIENTES (Venda)' }}
              </span>
              <CustomCheckbox
                label="Mudar para Cliente x Ambientes"
                :model-value="tipoCompra === 'CLIENTE_AMBIENTE'"
                @update:model-value="(v) => (tipoCompra = v ? 'CLIENTE_AMBIENTE' : 'INSUMOS')"
              />
            </div>
          </div>

   <div class="col-span-12 md:col-span-8">
  <SearchInput
    v-model="fornecedorSelecionado"
    label="Fornecedor *"
    :options="fornecedorOptions"
    required
    :colSpan="12"
  />
</div>

<div class="col-span-12 md:col-span-4">
  <Input
    v-model="form.data_compra"
    label="Data da Compra *"
    type="date"
    required
  />
</div>
          <div v-if="tipoCompra === 'CLIENTE_AMBIENTE'" class="col-span-12">
            <SearchInput
              v-model="vendaSelecionada"
              label="Venda / Cliente *"
              :options="vendaOptions"
              required
              :colSpan="12"
            />
          </div>

          <div class="col-span-12 h-px bg-gray-100 my-2"></div>

          <div class="col-span-12 flex items-end justify-between">
            <h3 class="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-400">
              Registrar Item
            </h3>
<Button
  variant="secondary"
  size="sm"
  type="button"
  :disabled="!fornecedorSelecionado"
  @click="abrirModalProduto()"
>
  + Novo Produto
</Button>


          </div>

          <div class="col-span-12 md:col-span-6">
<SearchInput
  :key="itemNovoKey"
  v-model="itemNovo.produto_id"
  label="Produto *"
  :options="produtoOptions"
  required
  :colSpan="12"
  @update:modelValue="(v) => onSelecionarProdutoNovo(v)"
/>

          </div>

          <div class="col-span-12 md:col-span-2">
            <Input v-model="itemNovo.unidade" label="Unidade" readonly />
          </div>

          <div class="col-span-12 md:col-span-2">
            <Input v-model="itemNovo.quantidade" label="QTD *" required />
          </div>

          <div class="col-span-12 md:col-span-2">
            <Input v-model="itemNovo.valorUnitarioMask" label="Valor Unit. *" required />
          </div>

          <div class="col-span-12 md:col-span-4">
            <Input :model-value="itemNovo.valorTotalMask" label="Subtotal Item" readonly />
          </div>

          <div class="col-span-12 md:col-span-8 flex items-end justify-end gap-3 pb-1">
            <Button variant="secondary" type="button" @click="limparItemNovo()">
              Limpar
            </Button>
            <Button variant="primary" type="button" @click="registrarItemNovo()">
              Adicionar Item
            </Button>
          </div>

          <div class="col-span-12 mt-4">
            <label class="block text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-400 mb-3">
              Itens Adicionados
            </label>
            <div class="border border-gray-100 rounded-2xl overflow-hidden">
<Table
  :columns="columnsItens"
  :rows="itens"
  :loading="false"
  empty-text="Nenhum item adicionado."
>
  <template #cell-nome_produto="{ row }">
    <div class="flex flex-col">
      <span class="font-bold text-gray-900 uppercase">{{ row.nome_produto }}</span>
      <div class="flex gap-2 mt-1">
        <span v-if="row.marca" class="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase">
          {{ row.marca }}
        </span>
        <span v-if="row.cor" class="text-[10px] bg-brand-primary/10 px-2 py-0.5 rounded text-brand-primary uppercase">
          {{ row.cor }}
        </span>
      </div>
    </div>
  </template>

  <template #cell-valor_unitario="{ value }">
    R$ {{ Number(value).toFixed(2) }}
  </template>

  <template #cell-valor_total="{ value }">
    <span class="text-brand-primary font-black">
      R$ {{ Number(value).toFixed(2) }}
    </span>
  </template>
</Table>
              <div class="flex items-center justify-end p-4 border-t border-gray-100 bg-gray-50">
                <span class="text-sm font-black text-gray-900 uppercase">
                  Total: R$ {{ totalCalculado.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </form>
      </template>

      <div v-else class="flex flex-col items-center justify-center py-20 gap-3">
        <i class="pi pi-spin pi-spinner text-2xl text-brand-primary"></i>
        <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando...</span>
      </div>
    </div>

    <footer class="flex items-center justify-between p-6 border-t border-gray-100 bg-white">
      <Button v-if="isEdit" variant="danger" type="button" @click="excluir">
        Excluir
      </Button>
      <div v-else></div>
      
      <Button variant="primary" :loading="salvando" type="button" @click="salvar">
        {{ isEdit ? 'Salvar Alterações' : 'Finalizar Compra' }}
      </Button>
    </footer>
  </Card>

  <!-- MODAL: NOVO PRODUTO -->
  <Transition name="fade">
    <div
      v-if="modalProduto.aberto"
      class="fixed inset-0 z-modal flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
      @click.self="fecharModalProduto()"
    >
      <div class="w-full max-w-3xl bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
        <header class="flex items-start justify-between gap-4 px-8 py-6 border-b border-gray-50 bg-gray-50/30">
          <div>
            <h3 class="text-xl font-black text-gray-900 tracking-tighter uppercase">Novo Produto</h3>
            <p class="text-sm font-semibold text-gray-400 mt-1">Cadastre um novo produto abaixo.</p>
          </div>

          <button
            class="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
            @click="fecharModalProduto()"
          >
            <i class="pi pi-times text-xs"></i>
          </button>
        </header>

        <div class="p-8">
          <form class="grid grid-cols-12 gap-5" @submit.prevent="salvarProduto">
            <div class="col-span-12">
              <SearchInput
                v-model="modalProduto.form.fornecedor_id"
                label="Fornecedor *"
                :options="fornecedorOptions"
                required
                :colSpan="12"
              />
            </div>

            <div class="col-span-12 md:col-span-8">
              <Input v-model="modalProduto.form.nome_produto" label="Nome do Produto *" required />
            </div>

            <div class="col-span-12 md:col-span-4 flex items-end pb-1.5">
              <CustomCheckbox
                label="Ativo"
                :model-value="modalProduto.form.status === 'ATIVO'"
                @update:model-value="(v) => (modalProduto.form.status = v ? 'ATIVO' : 'INATIVO')"
              />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="modalProduto.form.marca" label="Marca" />
            </div>
            <div class="col-span-12 md:col-span-4">
              <Input v-model="modalProduto.form.cor" label="Cor" />
            </div>
            <div class="col-span-12 md:col-span-4">
              <Input v-model="modalProduto.form.medida" label="Medida" />
            </div>

            <div class="col-span-12 md:col-span-4">
              <SearchInput
                v-model="modalProduto.form.unidade"
                label="Unidade *"
                :options="unidadesOptions"
                required
                :colSpan="12"
              />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="modalProduto.quantidadeMask" label="Quantidade *" required />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="modalProduto.valorUnitarioInput" label="Valor Unitário *" required />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input :model-value="modalProduto.valorTotalMask" label="Valor Total" readonly />
            </div>

            <div class="col-span-12 flex justify-end gap-3 pt-2 border-t border-gray-50 mt-2">
              <Button variant="outline" type="button" @click="fecharModalProduto()">
                Cancelar
              </Button>
              <Button variant="primary" type="submit" :loading="modalProduto.salvando">
                <i class="pi pi-check mr-2 text-xs"></i>
                Salvar Produto
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>


<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import api from '@/services/api'
import { maskMoneyBR } from '@/utils/masks'
import { useConstantes } from '@/composables/useConstantes'

import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import CustomCheckbox from '@/components/ui/CustomCheckbox.vue'
import Card from '@/components/ui/Card.vue'
import Table from '@/components/ui/Table.vue'

const route = useRoute()
const router = useRouter()
const itemNovoKey = ref(0)
const statusCompra = ref('EM_ABERTO')


const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')

const compraId = computed(() => {
  if (!isEdit.value) return null
  const n = Number(rawId.value)
  return Number.isFinite(n) ? n : null
})

const loading = ref(false)
const salvando = ref(false)
const excluindo = ref(false)

const tipoCompra = ref('INSUMOS')

const form = ref({
  venda_id: null,
  data_compra: '', // YYYY-MM-DD
})

/* =========================
   FORNECEDOR / VENDAS
========================= */
const fornecedor = ref([])
const fornecedorSelecionado = ref(null)

const fornecedorOptions = computed(() =>
  fornecedor.value.map((f) => ({
    value: f.id,
    label: f.razao_social || f.nome_fantasia || `Fornecedor #${f.id}`,
  })),
)

async function carregarFornecedor() {
  const { data } = await api.get('/fornecedor')
  fornecedor.value = Array.isArray(data) ? data : []
}

const vendaSelecionada = ref(null)
const vendaOptions = ref([])

async function carregarVendas() {
  const { data } = await api.get('/vendas')
  const arr = Array.isArray(data) ? data : []

  vendaOptions.value = arr.map((v) => ({
    value: v.id,
    label: v.nome || v.cliente_nome || v.cliente?.nome || `Venda #${v.id}`,
  }))
}

/* =========================
   UNIDADES (CONST)
========================= */
const uni = useConstantes()

const unidadesOptions = computed(() => {
  const lista = Array.isArray(uni.opcoes.value) ? uni.opcoes.value : []

  return lista
    .filter((o) => String(o.value || '').toUpperCase() === 'UNIDADE')
    .map((o) => ({
      label: o.label,
      value: o.label,
    }))
    .filter((o) => o.label)
})

/* =========================
   ITENS
========================= */
const itens = ref([])

// ✅ FIX: itensValidos DEPOIS de itens
const itensValidos = computed(() => (itens.value || []).filter((i) => i && i.produto_id))

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

const totalCalculado = computed(() =>
  round2(itens.value.reduce((acc, it) => acc + Number(it?.valor_total || 0), 0)),
)

// ✅ colunas mínimas (ajuste keys conforme seu Table.vue se precisar)
const columnsItens = [
  { key: 'nome_produto', label: 'Produto' }, // Alterado de 'descricao' para 'nome_produto'
  { key: 'marca', label: 'Marca' },          // ✅ Nova coluna
  { key: 'cor', label: 'Cor' },              // ✅ Nova coluna
  { key: 'quantidade', label: 'Qtd' },
  { key: 'valor_unitario', label: 'V. Unit.' },
  { key: 'valor_total', label: 'Subtotal' },
]

function dateOnlyToIso(dateOnly) {
  // meio-dia local pra não cair no dia anterior
  if (!dateOnly) return null
  const d = new Date(`${dateOnly}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function isoToDateOnly(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addItem() {
  itens.value.push({
    id: undefined,
    produto_id: null,
    descricao: '',
    unidade: '',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    _key: `tmp-${Math.random().toString(36).slice(2)}`,
  })
}

/* =========================
   PRODUTOS
========================= */
const produtoOptions = ref([])
const produtoMap = ref(new Map())

async function carregarProdutos() {
  if (!fornecedorSelecionado.value) {
    produtoOptions.value = []
    produtoMap.value = new Map()
    return
  }

  const { data } = await api.get('/produtos', {
    params: { fornecedor_id: fornecedorSelecionado.value },
  })

  const arr = Array.isArray(data) ? data : []

  produtoOptions.value = arr.map((p) => ({
    value: p.id,
    label: montarDescricaoProduto(p),
  }))

  const map = new Map()
  arr.forEach((p) => map.set(p.id, p))
  produtoMap.value = map
}


function montarDescricaoProduto(p) {
  const fornecedor =
    p?.fornecedor?.razao_social || p?.fornecedor?.nome_fantasia || ''

  const nome = p?.nome_produto || p?.nome || ''
  const marca = p?.marca || ''
  const cor = p?.cor || ''

  const partes = [fornecedor, nome, marca, cor].filter(Boolean)
  return partes.join(' — ')
}


/* =========================
   ITEM NOVO (registrar)
========================= */
const itemNovo = reactive({
  produto_id: null,
  nome_produto: '', // ✅ Adicionado
  marca: '',        // ✅ Adicionado
  cor: '',          // ✅ Adicionado
  medida: '',       // ✅ Adicionado
  unidade: '',
  quantidade: '1',
  valorUnitarioMask: '0,00',
  valor_total: 0,
  valorTotalMask: '0,00',
})

function limparItemNovo() {
  itemNovo.produto_id = null
  itemNovo.descricao = ''
  itemNovo.unidade = ''
  itemNovo.quantidade = '1'
  itemNovo.valorUnitarioMask = '0,00'
  itemNovo.valor_total = 0
  itemNovo.valorTotalMask = '0,00'

  itemNovoKey.value += 1 // ✅ força SearchInput resetar texto
}


// No seu script setup da página de compra
function onSelecionarProdutoNovo(produtoId) {
  const p = produtoMap.value.get(Number(produtoId))
  if (!p) return

  itemNovo.produto_id = p.id
  itemNovo.nome_produto = p.nome_produto
  itemNovo.marca = p.marca || ''
  itemNovo.cor = p.cor || ''
  itemNovo.unidade = p.unidade || ''
  
  // ✅ Aqui ele já traz o valor_unitario que o Service atualizou na última compra
  itemNovo.valorUnitarioMask = maskMoneyBR(Number(p.valor_unitario || 0))
}

watch(
  () => [itemNovo.quantidade, itemNovo.valorUnitarioMask],
  () => {
    const q = Number(String(itemNovo.quantidade || '').replace(',', '.')) || 0
    const n = String(itemNovo.valorUnitarioMask || '').replace(/\D/g, '')
    const vu = n ? Number(n) / 100 : 0
    const total = round2(q * vu)
    itemNovo.valor_total = total
    itemNovo.valorTotalMask = maskMoneyBR(total)
  },
  { deep: true },
)
watch(fornecedorSelecionado, async () => {
  // limpa seleção atual do item novo quando trocar fornecedor
  limparItemNovo()
  await carregarProdutos()
})

function registrarItemNovo() {
  if (!itemNovo.produto_id) return alert('Selecione o produto.')
  if (!fornecedorSelecionado.value) return alert('Selecione o fornecedor primeiro.')

  const q = Number(String(itemNovo.quantidade || '').replace(',', '.')) || 0
  if (q <= 0) return alert('Quantidade inválida.')

  const n = String(itemNovo.valorUnitarioMask || '').replace(/\D/g, '')
  const vu = n ? Number(n) / 100 : 0

  itens.value.push({
    id: undefined,
    produto_id: itemNovo.produto_id,
    // ✅ Enviando dados linha por linha para o relatório
    nome_produto: itemNovo.nome_produto,
    marca: itemNovo.marca,
    cor: itemNovo.cor,
    medida: itemNovo.medida,
    
    unidade: itemNovo.unidade,
    quantidade: q,
    valor_unitario: vu,
    valor_total: round2(q * vu),
    _key: `tmp-${Math.random().toString(36).slice(2)}`,
  })

  limparItemNovo()
}

/* =========================
   RATEIO (CLIENTE_AMBIENTE)
========================= */
const ambientes = ref([])
const ambientesSelecionados = ref(new Set())
const rateios = ref([])
const somaRateio = ref(0)

function recalcularSomaRateio() {
  somaRateio.value = round2(rateios.value.reduce((a, r) => a + Number(r?.valor_alocado || 0), 0))
}

function rateioAutomaticoValores(total, nomes) {
  const base = round2(total / nomes.length)
  const arr = nomes.map((n) => ({ nome_ambiente: n, valor_alocado: base }))
  const diff = round2(total - arr.reduce((a, r) => a + r.valor_alocado, 0))
  if (arr.length) arr[arr.length - 1].valor_alocado += diff
  return arr
}

function ratearAutomatico() {
  const nomes = Array.from(ambientesSelecionados.value)
  if (!nomes.length) {
    rateios.value = []
    recalcularSomaRateio()
    return
  }
  rateios.value = rateioAutomaticoValores(totalCalculado.value, nomes)
  recalcularSomaRateio()
}

async function carregarAmbientesDaVenda(vendaId) {
  const { data } = await api.get(`/vendas/${vendaId}`)
  const itensVenda = Array.isArray(data?.itens) ? data.itens : []
  ambientes.value = Array.from(new Set(itensVenda.map((i) => i?.nome_ambiente).filter(Boolean)))
}

/* =========================
   MODAL PRODUTO
========================= */
const modalProduto = reactive({
  aberto: false,
  salvando: false,
  targetIdx: null,
  form: {
    fornecedor_id: null,
    nome_produto: '',
    marca: '',
    cor: '',
    medida: '',
    unidade: '',
    quantidade: 0,
    valor_unitario: 0,
    valor_total: 0,
    status: 'ATIVO',
  },
  quantidadeMask: '',
  valorUnitarioInput: '0,00',
  valorTotalMask: '0,00',
})

function abrirModalProduto(idx = null) {
  modalProduto.targetIdx = idx
  modalProduto.aberto = true
}

function fecharModalProduto() {
  modalProduto.aberto = false
  modalProduto.targetIdx = null
}

watch(
  () => modalProduto.quantidadeMask,
  (v) => {
    modalProduto.form.quantidade = Number(String(v || '').replace(/\D/g, '')) || 0
  },
)

watch(
  () => modalProduto.valorUnitarioInput,
  (v) => {
    const n = String(v || '').replace(/\D/g, '')
    const valor = n ? Number(n) / 100 : 0
    modalProduto.form.valor_unitario = valor
    modalProduto.valorUnitarioInput = maskMoneyBR(valor)
  },
)

watch(
  () => [modalProduto.form.quantidade, modalProduto.form.valor_unitario],
  () => {
    const total = Number(modalProduto.form.quantidade || 0) * Number(modalProduto.form.valor_unitario || 0)
    modalProduto.form.valor_total = total
    modalProduto.valorTotalMask = maskMoneyBR(total)
  },
  { deep: true },
)

async function salvarProduto() {
  modalProduto.salvando = true
  try {
    await api.post('/produtos', modalProduto.form)
    await carregarProdutos()
    fecharModalProduto()
  } finally {
    modalProduto.salvando = false
  }
}

/* =========================
   CARREGAR / SALVAR / EXCLUIR
========================= */
async function carregarCompra() {
  if (!isEdit.value || !compraId.value) return

  const { data } = await api.get(`/compras/${compraId.value}`)

  tipoCompra.value = data?.tipo_compra || 'INSUMOS'
  fornecedorSelecionado.value = data?.fornecedor_id ?? null
  vendaSelecionada.value = data?.venda_id ?? null
  form.value.venda_id = data?.venda_id ?? null
  statusCompra.value = data?.status || 'EM_ABERTO'
  form.value.data_compra = isoToDateOnly(data?.data_compra)

itens.value = Array.isArray(data?.itens)
  ? data.itens.filter(Boolean).map((it) => ({
      id: it.id,
      produto_id: it.produto_id,
      // ✅ Mapeando o que vem do banco para o estado da tabela
      nome_produto: it.nome_produto,
      marca: it.marca,
      cor: it.cor,
      medida: it.medida,
      
      unidade: it.unidade,
      quantidade: Number(it.quantidade),
      valor_unitario: Number(it.valor_unitario),
      valor_total: Number(it.valor_total),
      _key: `db-${it.id}`,
    }))
  : []

  rateios.value = Array.isArray(data?.rateios) ? data.rateios.filter(Boolean) : []
  recalcularSomaRateio()
}

async function salvar() {
  if (!fornecedorSelecionado.value) return alert('Selecione o fornecedor.')
  if (!form.value.data_compra) return alert('Informe a data da compra.')

  if (!itensValidos.value.length) {
    return alert('Adicione ao menos 1 item.')
  }

  if (tipoCompra.value === 'CLIENTE_AMBIENTE') {
    if (!vendaSelecionada.value) return alert('Selecione a venda.')

    if (Math.abs(somaRateio.value - totalCalculado.value) > 0.01) {
      return alert('A soma do rateio deve ser igual ao total da compra.')
    }
  }

  salvando.value = true
  try {
    const payload = {
      tipo_compra: tipoCompra.value,
      fornecedor_id: fornecedorSelecionado.value,
      venda_id: tipoCompra.value === 'CLIENTE_AMBIENTE' ? vendaSelecionada.value : null,
      data_compra: dateOnlyToIso(form.value.data_compra),
      status: statusCompra.value,
      
      itens: itensValidos.value,
      rateios: tipoCompra.value === 'CLIENTE_AMBIENTE' ? rateios.value : [],
      valor_total: totalCalculado.value,
    }

    if (isEdit.value) {
      await api.put(`/compras/${compraId.value}`, payload)
    } else {
      await api.post('/compras', payload)
    }

    router.push('/compras')
  } catch (error) {
    console.error(error)
    alert('Erro ao salvar compra. Verifique os dados.')
  } finally {
    salvando.value = false
  }
}

async function excluir() {
  if (!confirm('Deseja excluir esta compra?')) return
  excluindo.value = true
  try {
    await api.delete(`/compras/${compraId.value}`)
    router.push('/compras')
  } finally {
    excluindo.value = false
  }
}

/* =========================
   WATCHERS
========================= */
watch(totalCalculado, () => {
  if (tipoCompra.value === 'CLIENTE_AMBIENTE' && ambientesSelecionados.value.size > 0) {
    ratearAutomatico()
  }
})

watch(vendaSelecionada, async (v) => {
  ambientes.value = []
  ambientesSelecionados.value = new Set()
  rateios.value = []
  somaRateio.value = 0

  if (tipoCompra.value === 'CLIENTE_AMBIENTE' && v) {
    form.value.venda_id = v
    await carregarAmbientesDaVenda(v)
  }
})

watch(tipoCompra, async (novo) => {
  if (novo !== 'CLIENTE_AMBIENTE') {
    ambientes.value = []
    ambientesSelecionados.value = new Set()
    rateios.value = []
    somaRateio.value = 0
    return
  }

  if (vendaSelecionada.value) {
    await carregarAmbientesDaVenda(vendaSelecionada.value)
  }
})

/* =========================
   MOUNT
========================= */
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      carregarFornecedor(),
      carregarProdutos(),
      carregarVendas(),
      uni.carregarCategoria('MODULO'),
    ])

    await carregarCompra()

    if (!isEdit.value) {
      const hoje = new Date()
      const y = hoje.getFullYear()
      const m = String(hoje.getMonth() + 1).padStart(2, '0')
      const d = String(hoje.getDate()).padStart(2, '0')
      form.value.data_compra = `${y}-${m}-${d}`
      statusCompra.value = 'EM_ABERTO'
    }

    if (!itens.value.length) addItem()

    if (tipoCompra.value === 'CLIENTE_AMBIENTE' && vendaSelecionada.value) {
      await carregarAmbientesDaVenda(vendaSelecionada.value)
    }
  } finally {
    loading.value = false
  }
})
</script>


