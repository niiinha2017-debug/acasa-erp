<template>
  <PageShell :padded="false" variant="minimal">
    <section class="login-font compra-editor ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        :title="isEdit ? `Editar Compra #${compraId}` : 'Nova Compra'"
        subtitle="Registro de entradas, compras vinculadas e rateios de custo"
        icon="pi pi-shopping-cart"
        :backTo="'/compras'"
        variant="minimal"
      />

      <div class="compra-body ds-editor-body">
        <Loading v-if="loading" />

        <form v-else class="compra-form ds-editor-form space-y-12" @submit.prevent="confirmarSalvarCompra" autocomplete="off">
          <div class="compra-form__lead-grid ds-editor-lead-grid grid grid-cols-12 gap-6 items-end pb-4">
            <div class="col-span-12 md:col-span-4">
              <label class="block text-xs font-semibold tracking-wide text-text-soft ml-0.5 mb-2">
                Destino da compra
              </label>

              <div class="inline-flex w-full rounded-2xl border border-border-ui bg-transparent p-1 gap-1">
                <button
                  type="button"
                  class="flex-1 h-11 rounded-[14px] text-sm font-semibold transition-all duration-200"
                  :class="tipoCompra === 'INSUMOS'
                    ? 'bg-slate-100 dark:bg-slate-800 text-brand-primary'
                    : 'text-text-soft hover:text-text-main hover:bg-slate-50 dark:hover:bg-slate-900/60'"
                  @click="tipoCompra = 'INSUMOS'"
                >
                  Estoque
                </button>
                <button
                  type="button"
                  class="flex-1 h-11 rounded-[14px] text-sm font-semibold transition-all duration-200"
                  :class="tipoCompra === 'CLIENTE_AMBIENTE'
                    ? 'bg-slate-100 dark:bg-slate-800 text-brand-primary'
                    : 'text-text-soft hover:text-text-main hover:bg-slate-50 dark:hover:bg-slate-900/60'"
                  @click="tipoCompra = 'CLIENTE_AMBIENTE'"
                >
                  Venda
                </button>
              </div>
            </div>

            <SearchInput
              class="col-span-12 md:col-span-5"
              v-model="fornecedorSelecionado"
              mode="select"
              variant="line"
              label="Fornecedor *"
              :options="fornecedorOptions"
              required
              placeholder="Selecione o fornecedor"
            />

            <Input
              class="col-span-12 md:col-span-3"
              v-model="form.data_compra"
              variant="line"
              label="Data de entrada *"
              type="date"
              required
            />
          </div>

          <div class="section-divider ds-section-divider relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="section-title ds-section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Vínculo da compra
              </span>
            </div>
          </div>

          <section
            v-if="tipoCompra === 'CLIENTE_AMBIENTE'"
            class="space-y-6"
          >
            <div class="grid grid-cols-12 gap-6 items-end">
              <SearchInput
                class="col-span-12 md:col-span-6"
                v-model="vendaSelecionada"
                mode="select"
                variant="line"
                label="Venda *"
                :options="vendaOptions"
                required
                placeholder="Selecione a venda"
              />

              <SearchInput
                class="col-span-12 md:col-span-6"
                v-model="ambienteSelecionado"
                mode="select"
                variant="line"
                label="Ambiente"
                :options="ambienteOptions"
                :required="!todosAmbientesMes"
                :readonly="todosAmbientesMes"
                placeholder="Selecione o ambiente"
              />
            </div>

            <CustomCheckbox
              label="Aplicar em todos os ambientes do mês"
              description="Quando marcado, o rateio será dividido entre todos os ambientes desta venda."
              :model-value="todosAmbientesMes"
              @update:model-value="(v) => { todosAmbientesMes = v; if (v) ambienteSelecionado = null }"
            />
          </section>

          <section
            v-else
            class="compra-inline-note"
          >
            <p class="text-sm font-medium text-text-main">Compra para estoque ou insumos internos.</p>
            <p class="mt-1 text-xs text-text-soft">Nenhum vínculo com venda ou ambiente será enviado nesse lançamento.</p>
          </section>

          <div class="section-divider ds-section-divider relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="section-title ds-section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Itens da nota
              </span>
            </div>
          </div>

          <section class="space-y-4">
            <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="text-sm font-semibold text-text-main">Adicionar item</p>
                <p class="text-xs text-text-soft">Informe produto, quantidade e valor unitário.</p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                type="button"
                class="self-start md:self-auto text-brand-primary compra-item-link"
                :disabled="!temFornecedorSelecionado"
                @click="abrirModalProduto"
              >
                <i class="pi pi-plus-circle mr-2"></i>
                Produto não cadastrado?
              </Button>
            </div>

            <div class="grid grid-cols-12 gap-x-6 gap-y-4 items-end">
              <SearchInput
                class="col-span-12 md:col-span-6"
                :key="itemNovoKey"
                v-model="itemNovo.produto_id"
                mode="select"
                variant="line"
                label="Produto"
                :options="produtoOptions"
                @update:modelValue="onSelecionarProdutoNovo"
                placeholder="Selecione o produto"
              />

              <Input
                class="col-span-6 md:col-span-2"
                v-model="itemNovo.quantidade"
                variant="line"
                label="Qtd"
                type="number"
                placeholder="0"
              />

              <Input
                class="col-span-6 md:col-span-4"
                v-model="itemNovo.valorUnitarioMask"
                variant="line"
                label="Valor unitário"
                placeholder="0,00"
                @input="itemNovo.valorUnitarioMask = maskMoneyBR($event.target.value)"
              />

              <div class="col-span-12 md:col-span-8 flex justify-start md:justify-end pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  class="w-full md:w-auto min-w-[160px]"
                  @click="registrarItemNovo"
                >
                  Adicionar item
                </Button>
              </div>
            </div>
          </section>

          <section v-if="itens.length" class="compra-lista space-y-4">
            <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="text-sm font-semibold text-text-main">Itens lançados</p>
                <p class="mt-1 text-xs text-text-soft">{{ totalItens }} {{ totalItens === 1 ? 'item registrado' : 'itens registrados' }}</p>
              </div>
              <div class="text-sm font-semibold text-text-main">
                Total parcial: R$ {{ Number(totalCalculado).toLocaleString('pt-br', { minimumFractionDigits: 2 }) }}
              </div>
            </div>

            <div class="rounded-2xl border border-border-ui overflow-hidden bg-bg-card">
              <Table :columns="columnsItens" :rows="itens" boxed>
                <template #cell-nome_produto="{ row }">
                  <div class="py-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <div class="font-black text-slate-700 uppercase text-xs">
                        {{ row.nome_produto }}
                      </div>
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
                  <div class="flex justify-center gap-2">
                    <button
                      type="button"
                      class="h-9 px-3 rounded-lg flex items-center gap-1.5 text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 text-xs font-semibold transition-colors"
                      @click="editarItemPorKey(row._key)"
                    >
                      <i class="pi pi-pencil text-sm"></i>
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      class="h-9 px-3 rounded-lg flex items-center gap-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
                      @click="removerItem(row._key)"
                    >
                      <i class="pi pi-trash text-sm"></i>
                      <span>Excluir</span>
                    </button>
                  </div>
                </template>
              </Table>
            </div>
          </section>

          <section
            v-else
            class="compra-inline-empty"
          >
            <p class="text-sm font-semibold text-text-main">Nenhum item lançado ainda.</p>
            <p class="mt-1 text-xs text-text-soft">Selecione um produto, informe quantidade e valor unitário para compor a compra.</p>
          </section>

          <FormActions
            :is-edit="isEdit"
            :loading-save="salvando"
            :loading-delete="excluindo"
            :show-delete="isEdit"
            perm-create="compras.criar"
            perm-edit="compras.editar"
            perm-delete="compras.excluir"
            label-create="Criar compra"
            @save="confirmarSalvarCompra"
            @delete="confirmarExcluirCompra"
          >
            <template #left>
              <div class="text-xs text-text-soft">
                <span class="font-semibold text-text-main">{{ tipoCompraLabel }}</span>
                <span class="mx-2">•</span>
                <span>{{ totalItens }} {{ totalItens === 1 ? 'item' : 'itens' }}</span>
                <span class="mx-2">•</span>
                <span>Total R$ {{ Number(totalCalculado).toLocaleString('pt-br', { minimumFractionDigits: 2 }) }}</span>
              </div>
            </template>
          </FormActions>
        </form>
      </div>

      <QuickCreateProduto
        :open="modalProdutoOpen"
        :fornecedor-id="fornecedorSelecionado ? Number(fornecedorSelecionado) : null"
        :fornecedor-options="fornecedorOptions"
        :texto-inicial="''"
        @close="fecharModalProduto"
        @created="onProdutoCriado"
      />
    </section>
  </PageShell>
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
import { closeTabAndGo } from '@/utils/tabs'
import FormActions from '@/components/ui/FormActions.vue'

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

// Data de entrada da NF: sempre hoje ao criar (04/03/2026 ou data atual)
const dataHoje = () => new Date().toISOString().split('T')[0]
const form = reactive({
  data_compra: dataHoje(),
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
  categoria_base: null,
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

const totalItens = computed(() => itens.value.length)

const tipoCompraLabel = computed(() => (
  tipoCompra.value === 'CLIENTE_AMBIENTE' ? 'Compra vinculada a venda' : 'Compra para estoque'
))


const fornecedorOptions = computed(() => Array.isArray(listaFornecedores.value) ? listaFornecedores.value : [])
const temFornecedorSelecionado = computed(() => Number(fornecedorSelecionado.value || 0) > 0)


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


// tabela
const columnsItens = [
  { key: 'nome_produto', label: 'Produto' },
  { key: 'quantidade', label: 'Qtd', align: 'center' },
  { key: 'valor_unitario', label: 'V. Unit.' },
  { key: 'valor_total', label: 'Subtotal' },
  { key: 'acoes', label: 'Ações', width: '120px', align: 'center' },
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
    categoria_base: null,
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

  // total > 0: divide igualmente; último ambiente recebe o restante para soma bater exatamente no total
  const base = round2(Math.floor((tot / unicos.length) * 100) / 100)
  let soma = 0
  const resultado = unicos.map((nome, idx) => {
    const isUltimo = idx === unicos.length - 1
    const valor = isUltimo ? round2(tot - soma) : base
    soma = round2(soma + valor)
    return { nome_ambiente: nome, valor_alocado: valor }
  })
  return resultado
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
  itemNovo.categoria_base = p.categoria_base || null
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
    categoria_base: itemNovo.categoria_base || null,
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
    if (!itens.value.length) {
      notify.error('Adicione ao menos um item.')
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

    const fornecedorId = Number(fornecedorSelecionado.value)
    if (!fornecedorId) {
      notify.error('Selecione um fornecedor.')
      salvando.value = false
      return
    }
    const payload = {
      tipo_compra: tipoCompra.value,
      fornecedor_id: fornecedorId,
      venda_id: tipoCompra.value === 'CLIENTE_AMBIENTE' ? Number(vendaSelecionada.value) : null,
      data_compra: form.data_compra,
      valor_total: total,
      itens: itens.value.map((it) => ({
        ...(it.id ? { id: Number(it.id) } : {}),
        produto_id: Number(it.produto_id),
        categoria_base: it.categoria_base ? String(it.categoria_base).trim().toUpperCase() : 'FITA_BORDA',
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
    closeTabAndGo('/compras')
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
    closeTabAndGo('/compras')
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
  try {
    const filtro = fornecedorSelecionado.value
      ? { fornecedor_id: Number(fornecedorSelecionado.value) }
      : undefined
    const res = await ProdutosService.listar(filtro)
    const data = res?.data ?? res
    const arr = Array.isArray(data) ? data : []

produtoOptions.value = arr.map((p) => {
  const esp = p.espessura_mm != null ? `${p.espessura_mm}MM` : ''
  return {
    value: p.id,
    label: `${p.nome_produto}${p.marca ? ` • ${p.marca}` : ''}${p.cor ? ` • ${p.cor}` : ''}${p.medida ? ` • ${p.medida}` : ''}${esp ? ` • ${esp}` : ''}`.trim(),
  }
})


    const map = new Map()
    arr.forEach((p) => {
      map.set(Number(p.id), {
        id: p.id,
        nome_produto: p.nome_produto,
        categoria_base: p.categoria_base || null,
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
    notify.error('Erro ao carregar produtos.')
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
// Só vendas com contrato vigente – compras só podem ser vinculadas a clientes com contrato vigente
const vendRes = await VendaService.listarComContratoVigente()
let fornecedores = []
try {
  const fornRes = await FornecedorService.select()
  const raw = Array.isArray(fornRes?.data) ? fornRes.data : []
  fornecedores = raw.map((f) => {
    const partes = [f?.nome_fantasia, f?.razao_social].filter(Boolean)
    const label = partes.length ? partes.join(' • ') : (f?.label || `ID #${f?.id}`)
    return { value: Number(f?.id ?? f?.value ?? 0), label }
  }).filter((f) => f.value > 0)
} catch {
  const fornListRes = await FornecedorService.listar()
  const rows = Array.isArray(fornListRes?.data) ? fornListRes.data : []
  fornecedores = rows.map((f) => {
    const partes = [f?.nome_fantasia, f?.razao_social].filter(Boolean)
    const label = partes.length ? partes.join(' • ') : `ID #${f?.id}`
    return { value: Number(f?.id ?? 0), label }
  }).filter((f) => f.value > 0)
}

listaFornecedores.value = fornecedores
listaVendas.value = Array.isArray(vendRes?.data) ? vendRes.data : []

if (isEdit.value) {
  await carregarCompra()
} else {
  // Nova compra: data de entrada fixada em hoje; opcionalmente pré-selecionar fornecedor pela sugestão
  form.data_compra = dataHoje()
  const fornecedorId = route.query?.fornecedor_id
  if (fornecedorId) {
    const id = Number(String(fornecedorId).replace(/\D/g, ''))
    if (id && listaFornecedores.value.some((f) => (f.value ?? f.id) === id)) {
      fornecedorSelecionado.value = id
    }
  }
}

await carregarProdutos()

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
  if (!temFornecedorSelecionado.value) {
    notify.warn('Selecione o fornecedor no topo da compra antes de cadastrar o produto.')
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

<style scoped>
.login-font {
  font-family: var(--ds-font-sans);
}

.compra-inline-note {
  padding: 0.25rem 0 0;
}

.compra-inline-empty {
  padding: 1rem 0 0;
  text-align: left;
}

.compra-lista {
  padding-top: 0.25rem;
}

.compra-item-link {
  padding-left: 0;
  padding-right: 0;
}
</style>
