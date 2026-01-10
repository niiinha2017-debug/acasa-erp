<template>
  <div class="page-container">
    <div class="card card--shadow">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">
            {{ isEdit ? `Editar Compra #${compraId}` : 'Nova Compra' }}
          </h2>
          <p class="card-subtitle">
            {{ tipoCompra === 'INSUMOS'
              ? 'Compra de INSUMOS (Marcenaria)'
              : 'Compra de CLIENTE x AMBIENTES (Venda)' }}
          </p>
        </div>

        <div class="header-actions">
          <Button label="Voltar" variant="outline" size="md" @click="router.back()" />
        </div>
      </header>

      <div class="card-body">
        <div v-if="loading" class="loading-box">Carregando...</div>

        <template v-else>
          <div class="section mb-6">
            <div class="section-header">
              <h3 class="section-title">Tipo de Compra</h3>
              <p class="section-subtitle">Selecione o tipo de compra que está realizando.</p>
            </div>

            <div class="type-box flex gap-4 mt-4">
              <CustomCheckbox
                label="Compra de INSUMOS"
                description="Uso interno da marcenaria"
                :model-value="tipoCompra === 'INSUMOS'"
                :disabled="isEdit"
                @update:model-value="() => (tipoCompra = 'INSUMOS')"
              />

              <CustomCheckbox
                label="Compra de CLIENTE x AMBIENTES"
                description="Venda vinculada a projeto"
                :model-value="tipoCompra === 'CLIENTE_AMBIENTE'"
                :disabled="isEdit"
                @update:model-value="() => (tipoCompra = 'CLIENTE_AMBIENTE')"
              />
            </div>
          </div>

          <div class="form-grid mt-6">
            <div v-if="tipoCompra === 'CLIENTE_AMBIENTE'" class="form-group col-span-6">
              <SearchInput
                v-model="vendaSelecionada"
                label="Venda *"
                :options="vendaOptions"
                placeholder="Buscar venda pelo nome..."
                :required="true"
                colSpan="col-span-12"
              />
            </div>

            <div class="form-group" :class="tipoCompra === 'CLIENTE_AMBIENTE' ? 'col-span-6' : 'col-span-12'">
              <SearchInput
                v-model="fornecedorSelecionado"
                label="Fornecedor *"
                :options="fornecedorOptions"
                placeholder="Buscar fornecedor..."
                :required="true"
                colSpan="col-span-12"
              />
            </div>
          </div>

          <div v-if="tipoCompra === 'CLIENTE_AMBIENTE'" class="section mt-8">
            <div class="section-divider"></div>

            <div class="section-header header-between">
              <div>
                <h3 class="card-title section-title">Ambientes</h3>
                <p class="section-subtitle">Selecione os ambientes e ajuste o rateio.</p>
              </div>

              <div class="section-actions flex gap-2">
                <Button label="Selecionar todos" variant="outline" size="sm" @click="selecionarTodosAmbientes" />
                <Button label="Ratear automaticamente" variant="secondary" size="sm" @click="ratearAutomatico" />
              </div>
            </div>

            <div class="ambientes-grid flex flex-wrap gap-4 mt-4">
              <CustomCheckbox 
                v-for="a in ambientes" 
                :key="a"
                :label="a"
                :model-value="ambientesSelecionados.has(a)"
                @update:model-value="toggleAmbiente(a)"
              />
            </div>

            <div class="rateio-box mt-6 p-4 bg-light rounded-lg">
              <h4 class="rateio-title font-bold mb-4">Rateio (editável)</h4>

              <div v-for="(r, idx) in rateios" :key="r.nome_ambiente" class="rateio-row grid grid-cols-12 gap-4 items-center mb-2">
                <div class="rateio-name col-span-4">{{ r.nome_ambiente }}</div>
                <div class="rateio-input col-span-3">
                  <Input v-model="r.valor_alocado" type="number" placeholder="0" @input="recalcularSomaRateio" />
                </div>
                <div class="rateio-hint col-span-3 text-muted">{{ format.currency(r.valor_alocado) }}</div>
                <div class="col-span-2 flex justify-end">
                  <Button label="X" variant="danger" size="sm" @click="removerRateio(idx)" />
                </div>
              </div>

              <div class="rateio-total mt-4 pt-4 border-t flex justify-between items-center">
                <span>Soma rateio:</span>
                <b :class="{ 'text-danger': somaRateio !== totalCalculado, 'text-success': somaRateio === totalCalculado }">
                  {{ format.currency(somaRateio) }}
                </b>
              </div>
            </div>
          </div>

          <div class="section-divider"></div>

          <div class="section-header header-between mt-8">
            <div>
              <h3 class="card-title items-title">Itens</h3>
              <p class="items-subtitle">Materiais/serviços desta compra.</p>
            </div>

            <div class="flex gap-2">
              <Button label="+ Adicionar item" variant="secondary" size="sm" @click="addItem()" />
              <Button label="+ Novo produto" variant="outline" size="sm" @click="abrirModalProduto()" />
            </div>
          </div>

          <div class="items-list mt-4">
            <div v-for="(it, idx) in itens" :key="it._key" class="item-card card--shadow-sm mb-4 p-4 border rounded-lg">
              <div class="form-grid">
                <div class="form-group col-span-6">
                  <SearchInput
                    v-model="it.produto_id"
                    label="Produto"
                    :options="produtoOptions"
                    placeholder="Buscar produto..."
                    colSpan="col-span-12"
                    @update:modelValue="(v) => aplicarProdutoNoItem(idx, v)"
                  />
                </div>

                <div class="form-group col-span-2">
                  <Input v-model="it.unidade" label="Unidade" placeholder="UN / PL" />
                </div>

                <div class="form-group col-span-2">
                  <Input v-model="it.quantidade" label="Qtd" type="number" @input="() => recalcularItem(idx)" />
                </div>

                <div class="form-group col-span-2">
                  <Input v-model="it.valor_unitario" label="Vlr Unit." type="number" @input="() => recalcularItem(idx)" />
                </div>

                <div class="form-group col-span-3">
                  <Input v-model="it.valor_total" label="Total" type="number" readonly />
                </div>

                <div class="col-span-9 flex justify-end items-end pb-1">
                  <Button label="Remover" variant="danger" size="sm" @click="removerItem(idx)" />
                </div>
              </div>

              <div class="item-snapshot mt-2 text-sm text-muted">
                <span>Descrição:</span>
                <b class="ml-2">{{ it.descricao || '—' }}</b>
              </div>
            </div>
          </div>

          <div class="total-box-wrapper flex justify-end mt-6">
            <div class="total-box p-4 bg-primary-light rounded-lg">
              <span class="cell-muted mr-4">Total da compra:</span>
              <strong class="text-2xl text-primary">{{ format.currency(totalCalculado) }}</strong>
            </div>
          </div>
        </template>
      </div>

      <footer class="card-footer footer-between">
        <div class="footer-left">
          <Button
            v-if="isEdit"
            label="Excluir compra"
            variant="danger"
            :loading="excluindo"
            @click="excluir"
          />
        </div>

        <div class="footer-right flex gap-2">
          <Button
            :label="isEdit ? 'Salvar Alterações' : 'Criar Compra'"
            variant="primary"
            size="md"
            :loading="salvando"
            @click="salvar"
          />
        </div>
      </footer>
    </div>

    <div v-if="modalProduto.aberto" class="modal-backdrop" @click.self="fecharModalProduto()">
      <div class="modal-card-container">
        <div class="card card--shadow modal-content-box">
          <header class="card-header header-between">
            <div>
              <h3 class="card-title">Novo Produto</h3>
              <p class="muted">Cadastre um novo produto abaixo.</p>
            </div>
            <Button label="✕" variant="ghost" size="sm" @click="fecharModalProduto()" />
          </header>

          <div class="card-body">
            <form class="form-grid" @submit.prevent="salvarProduto">
              <SearchInput
                v-model="modalProduto.form.fornecedor_id"
                label="Fornecedor *"
                :options="fornecedorOptions"
                required
                class="col-span-12"
              />

              <Input v-model="modalProduto.form.nome_produto" label="Nome do Produto *" required class="col-span-8" />
              
              <div class="col-span-4 flex items-end pb-2">
                 <CustomCheckbox 
                  label="Ativo" 
                  :model-value="modalProduto.form.status === 'ATIVO'"
                  @update:model-value="(v) => modalProduto.form.status = v ? 'ATIVO' : 'INATIVO'" 
                />
              </div>

              <Input v-model="modalProduto.form.marca" label="Marca" class="col-span-4" />
              <Input v-model="modalProduto.form.cor" label="Cor" class="col-span-4" />
              <Input v-model="modalProduto.form.medida" label="Medida" class="col-span-4" />

              <SearchInput
                v-model="modalProduto.form.unidade"
                label="Unidade *"
                :options="unidadesOptions"
                required
                class="col-span-4"
              />

              <Input v-model="modalProduto.quantidadeMask" label="Quantidade *" required class="col-span-4" />
              <Input v-model="modalProduto.valorUnitarioInput" label="Valor Unitário *" required class="col-span-4" />
              <Input :model-value="modalProduto.valorTotalMask" label="Valor Total" readonly class="col-span-4" />

              <div class="col-span-12 flex justify-end gap-3 mt-6">
                <Button variant="outline" type="button" @click="fecharModalProduto()">Cancelar</Button>
                <Button variant="primary" type="submit" :loading="modalProduto.salvando">Salvar Produto</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import api from '@/services/api'
import { format } from '@/utils/format'
import { maskMoneyBR } from '@/utils/masks'
import { useConstantes } from '@/composables/useConstantes'

import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
// No <script setup>
import CustomCheckbox from '@/components/ui/CustomCheckbox.vue' // Ajuste o caminho conforme necessário

/* -------------------------------------------------------------------------- */
/* ROUTE / MODE (NOVO + EDITAR JUNTOS)                                         */
/* -------------------------------------------------------------------------- */
const route = useRoute()
const router = useRouter()

const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')

const compraId = computed(() => {
  if (!isEdit.value) return null
  const n = Number(rawId.value)
  return Number.isFinite(n) ? n : null
})

/* -------------------------------------------------------------------------- */
/* STATE GERAL                                                                 */
/* -------------------------------------------------------------------------- */
const loading = ref(false)
const salvando = ref(false)
const excluindo = ref(false)

const tipoCompra = ref('INSUMOS')

const form = ref({
  venda_id: null,
})

/* -------------------------------------------------------------------------- */
/* FORNECEDORES                                                                */
/* -------------------------------------------------------------------------- */
const fornecedores = ref([])
const fornecedorSelecionado = ref(null)

const fornecedorOptions = computed(() =>
  fornecedores.value.map(f => ({
    value: f.id,
    label: f.razao_social || f.nome_fantasia || `Fornecedor #${f.id}`,
  }))
)

async function carregarFornecedores() {
  const { data } = await api.get('/fornecedores')
  fornecedores.value = Array.isArray(data) ? data : []
}

/* -------------------------------------------------------------------------- */
/* VENDAS (BUSCA POR NOME)                                                     */
/* -------------------------------------------------------------------------- */
const vendaSelecionada = ref(null)
const vendaOptions = ref([])

async function carregarVendas() {
  const { data } = await api.get('/vendas')
  const arr = Array.isArray(data) ? data : []

  vendaOptions.value = arr.map(v => ({
    value: v.id,
    label:
      v.nome ||
      v.cliente_nome ||
      v.cliente?.nome ||
      `Venda #${v.id}`,
  }))
}

/* -------------------------------------------------------------------------- */
/* CONSTANTES (UNIDADE)                                                        */
/* -------------------------------------------------------------------------- */
const uni = useConstantes()

const unidadesOptions = computed(() => {
  const lista = Array.isArray(uni.opcoes.value) ? uni.opcoes.value : []

  return lista
    .filter(o => String(o.value || '').toUpperCase() === 'UNIDADE')
    .map(o => ({
      label: o.label,
      value: o.label,
    }))
    .filter(o => o.label)
})

/* -------------------------------------------------------------------------- */
/* ITENS                                                                       */
/* -------------------------------------------------------------------------- */
const itens = ref([])

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

const totalCalculado = computed(() =>
  round2(itens.value.reduce((acc, it) => acc + Number(it.valor_total || 0), 0))
)

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

function removerItem(idx) {
  itens.value.splice(idx, 1)
}

function recalcularItem(idx) {
  const it = itens.value[idx]
  it.valor_total = round2(Number(it.quantidade || 0) * Number(it.valor_unitario || 0))
}

/* -------------------------------------------------------------------------- */
/* PRODUTOS (BUSCA + MAP)                                                      */
/* -------------------------------------------------------------------------- */
const produtoOptions = ref([])
const produtoMap = ref(new Map())

async function carregarProdutos() {
  const { data } = await api.get('/produtos')
  const arr = Array.isArray(data) ? data : []

  produtoOptions.value = arr.map(p => ({
    value: p.id,
    label: p.nome_produto || p.nome || `Produto #${p.id}`,
  }))

  const map = new Map()
  arr.forEach(p => map.set(p.id, p))
  produtoMap.value = map
}

function aplicarProdutoNoItem(idx, produtoId) {
  const p = produtoMap.value.get(Number(produtoId))
  if (!p) return

  const it = itens.value[idx]
  it.produto_id = p.id
  it.descricao = p.nome_produto || p.nome
  it.unidade = p.unidade
  if (!it.valor_unitario) it.valor_unitario = Number(p.valor_unitario || 0)
  recalcularItem(idx)
}

/* -------------------------------------------------------------------------- */
/* AMBIENTES / RATEIO                                                          */
/* -------------------------------------------------------------------------- */
const ambientes = ref([])
const ambientesSelecionados = ref(new Set())
const rateios = ref([])
const somaRateio = ref(0)

function recalcularSomaRateio() {
  somaRateio.value = round2(rateios.value.reduce((a, r) => a + Number(r.valor_alocado || 0), 0))
}

function rateioAutomaticoValores(total, nomes) {
  const base = round2(total / nomes.length)
  const arr = nomes.map(n => ({ nome_ambiente: n, valor_alocado: base }))
  const diff = round2(total - arr.reduce((a, r) => a + r.valor_alocado, 0))
  arr[arr.length - 1].valor_alocado += diff
  return arr
}

function ratearAutomatico() {
  const nomes = Array.from(ambientesSelecionados.value)
  rateios.value = rateioAutomaticoValores(totalCalculado.value, nomes)
  recalcularSomaRateio()
}

function selecionarTodosAmbientes() {
  ambientesSelecionados.value = new Set(ambientes.value)
  ratearAutomatico()
}

function toggleAmbiente(nome) {
  const set = new Set(ambientesSelecionados.value)
  set.has(nome) ? set.delete(nome) : set.add(nome)
  ambientesSelecionados.value = set
  ratearAutomatico()
}

function removerRateio(idx) {
  rateios.value.splice(idx, 1)
  recalcularSomaRateio()
}

async function carregarAmbientesDaVenda(vendaId) {
  const { data } = await api.get(`/vendas/${vendaId}`)
  const itensVenda = Array.isArray(data?.itens) ? data.itens : []

  ambientes.value = Array.from(
    new Set(itensVenda.map(i => i.nome_ambiente).filter(Boolean))
  )
}

/* -------------------------------------------------------------------------- */
/* MODAL PRODUTO (IGUAL CADASTRO)                                              */
/* -------------------------------------------------------------------------- */
const modalProduto = reactive({
  aberto: false,
  salvando: false,
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

function abrirModalProduto() {
  modalProduto.aberto = true
}

function fecharModalProduto() {
  modalProduto.aberto = false
}

watch(() => modalProduto.quantidadeMask, v => {
  modalProduto.form.quantidade = Number(String(v || '').replace(/\D/g, '')) || 0
})

watch(() => modalProduto.valorUnitarioInput, v => {
  const n = String(v || '').replace(/\D/g, '')
  const valor = n ? Number(n) / 100 : 0
  modalProduto.form.valor_unitario = valor
  modalProduto.valorUnitarioInput = maskMoneyBR(valor)
})

watch(
  () => [modalProduto.form.quantidade, modalProduto.form.valor_unitario],
  () => {
    const total = modalProduto.form.quantidade * modalProduto.form.valor_unitario
    modalProduto.form.valor_total = total
    modalProduto.valorTotalMask = maskMoneyBR(total)
  },
  { deep: true }
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

/* -------------------------------------------------------------------------- */
/* CARREGAR COMPRA (EDITAR)                                                    */
/* -------------------------------------------------------------------------- */
async function carregarCompra() {
  if (!isEdit.value || !compraId.value) return

  const { data } = await api.get(`/compras/${compraId.value}`)

  tipoCompra.value = data.tipo_compra
  fornecedorSelecionado.value = data.fornecedor_id
  vendaSelecionada.value = data.venda_id
  form.value.venda_id = data.venda_id

  itens.value = data.itens || []
  rateios.value = data.rateios || []
}

/* -------------------------------------------------------------------------- */
/* SALVAR / EXCLUIR                                                            */
/* -------------------------------------------------------------------------- */
/* ... (restante do código acima permanece igual) ... */

async function salvar() {
  if (!fornecedorSelecionado.value) return alert('Selecione o fornecedor.')
  
  if (tipoCompra.value === 'CLIENTE_AMBIENTE') {
    if (!vendaSelecionada.value) return alert('Selecione a venda.')
    
    // Validação opcional: O rateio deve bater com o total
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
      itens: itens.value,    // ADICIONADO .value
      rateios: rateios.value, // ADICIONADO .value
      valor_total: totalCalculado.value // Geralmente o backend pede o total geral
    }

    if (isEdit.value) {
      await api.put(`/compras/${compraId.value}`, payload)
    } else {
      await api.post('/compras', payload) // ALTERADO para POST
    }

    router.push('/compras')
  } catch (error) {
    console.error(error)
    alert('Erro ao salvar compra. Verifique os dados.')
  } finally {
    salvando.value = false
  }
}

/* -------------------------------------------------------------------------- */
/* WATCHERS / INIT                                                            */
/* -------------------------------------------------------------------------- */

// Adicionei um watch para recalcular o rateio se o total da compra mudar
watch(totalCalculado, () => {
  if (tipoCompra.value === 'CLIENTE_AMBIENTE' && ambientesSelecionados.value.size > 0) {
    ratearAutomatico()
  }
})

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

/* -------------------------------------------------------------------------- */
/* WATCHERS / INIT                                                             */
/* -------------------------------------------------------------------------- */
watch(vendaSelecionada, async (v) => {
  // Limpa ambientes se trocar de venda
  ambientes.value = []
  ambientesSelecionados.value = new Set()
  rateios.value = []

  if (tipoCompra.value === 'CLIENTE_AMBIENTE' && v) {
    form.value.venda_id = v
    await carregarAmbientesDaVenda(v)
  }
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      carregarFornecedores(),
      carregarProdutos(),
      carregarVendas(),
      uni.carregarCategoria('MODULO'),
    ])

    await carregarCompra()
    if (!itens.value.length) addItem()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* Estilos para garantir que o modal apareça corretamente */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-card-container {
  width: 100%;
  max-width: 850px;
  max-height: 95vh;
  overflow-y: auto;
}

.modal-content-box {
  background: white;
  border-radius: 12px;
}

.section-divider {
  height: 1px;
  background: var(--border-soft);
  margin: 24px 0;
}

.bg-light { background-color: #f9fafb; }
.bg-primary-light { background-color: rgba(37, 99, 235, 0.05); }

/* Ajustes de tipografia */
.section-title { font-size: 1.1rem; font-weight: 600; color: var(--text-main); }
.section-subtitle { font-size: 0.85rem; color: var(--text-muted); }
</style>