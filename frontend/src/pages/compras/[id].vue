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
          <!-- Tipo -->
          <div class="type-box">
            <label class="check">
              <input
                type="checkbox"
                :checked="tipoCompra === 'INSUMOS'"
                :disabled="isEdit"
                @change="() => (tipoCompra = 'INSUMOS')"
              />
              <span>Compra de INSUMOS (Marcenaria)</span>
            </label>

            <label class="check">
              <input
                type="checkbox"
                :checked="tipoCompra === 'CLIENTE_AMBIENTE'"
                :disabled="isEdit"
                @change="() => (tipoCompra = 'CLIENTE_AMBIENTE')"
              />
              <span>Compra de CLIENTE x AMBIENTES (Venda)</span>
            </label>
          </div>

          <!-- Dados principais (SEM RASCUNHO/STATUS E SEM OBSERVAÇÃO) -->
          <div class="form-grid">
            <!-- VENDA por nome -->
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

            <!-- FORNECEDOR -->
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

          <!-- Ambientes + rateio -->
          <div v-if="tipoCompra === 'CLIENTE_AMBIENTE'" class="section">
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

            <div class="ambientes-grid">
              <label v-for="a in ambientes" :key="a" class="check">
                <input type="checkbox" :checked="ambientesSelecionados.has(a)" @change="toggleAmbiente(a)" />
                <span>{{ a }}</span>
              </label>
            </div>

            <div class="rateio-box">
              <h4 class="rateio-title">Rateio (editável)</h4>

              <div v-for="(r, idx) in rateios" :key="r.nome_ambiente" class="rateio-row">
                <div class="rateio-name">{{ r.nome_ambiente }}</div>
                <div class="rateio-input">
                  <Input v-model="r.valor_alocado" label="" type="number" placeholder="0" @input="recalcularSomaRateio" />
                </div>
                <div class="rateio-hint">{{ format.currency(r.valor_alocado) }}</div>
                <Button label="X" variant="danger" size="sm" @click="removerRateio(idx)" />
              </div>

              <div class="rateio-total">
                <span>Soma rateio:</span>
                <b :class="{ 'rateio-bad': somaRateio !== totalCalculado }">
                  {{ format.currency(somaRateio) }}
                </b>
              </div>
            </div>
          </div>

          <div class="section-divider"></div>

          <!-- Itens -->
          <div class="section-header header-between">
            <div>
              <h3 class="card-title items-title">Itens</h3>
              <p class="items-subtitle">Materiais/serviços desta compra.</p>
            </div>

            <div class="flex gap-2">
              <Button label="+ Adicionar item" variant="secondary" size="sm" @click="addItem()" />
              <Button label="+ Novo produto" variant="outline" size="sm" @click="abrirModalProduto()" />
            </div>
          </div>

          <div class="items-list">
            <div v-for="(it, idx) in itens" :key="it._key" class="item-card card--shadow-sm">
              <div class="form-grid">
                <!-- Busca de produto -->
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

                <div class="col-span-9 flex justify-end items-end">
                  <Button label="Remover" variant="danger" size="sm" @click="removerItem(idx)" />
                </div>
              </div>

              <div class="item-snapshot">
                <span class="cell-muted">Descrição:</span>
                <b>{{ it.descricao || '—' }}</b>
              </div>
            </div>
          </div>

          <div class="total-box-wrapper flex justify-end">
            <div class="total-box">
              <span class="cell-muted">Total da compra:</span>
              <strong class="text-xl text-primary">{{ format.currency(totalCalculado) }}</strong>
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

    <!-- MODAL PRODUTO (IGUAL PRODUTOS) -->
    <div v-if="modalProduto.aberto" class="modal-backdrop" @click.self="fecharModalProduto()">
      <div class="modal card card--shadow">
        <header class="card-header header-between">
          <div>
            <h3 class="card-title">Novo Produto</h3>
            <p class="muted" style="margin: 0;">Cadastre um novo produto abaixo.</p>
          </div>
          <Button label="Fechar" variant="outline" size="sm" @click="fecharModalProduto()" />
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
            <Input v-model="modalProduto.form.status" label="Status *" required class="col-span-4" />

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

            <Input v-model="modalProduto.quantidadeMask" label="Quantidade *" required inputmode="numeric" class="col-span-4" />
            <Input v-model="modalProduto.valorUnitarioInput" label="Valor Unitário *" required inputmode="numeric" class="col-span-4" />
            <Input :model-value="modalProduto.valorTotalMask" label="Valor Total" readonly class="col-span-4" />

            <div class="col-span-12 container-botoes">
              <Button variant="secondary" type="button" @click="fecharModalProduto()">
                Cancelar
              </Button>
              <Button variant="primary" type="submit" :loading="modalProduto.salvando">
                Salvar
              </Button>
            </div>
          </form>
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
async function salvar() {
  if (!fornecedorSelecionado.value) return alert('Selecione o fornecedor.')
  if (tipoCompra.value === 'CLIENTE_AMBIENTE' && !vendaSelecionada.value) {
    return alert('Selecione a venda.')
  }

  salvando.value = true
  try {
    const payload = {
      tipo_compra: tipoCompra.value,
      fornecedor_id: fornecedorSelecionado.value,
      venda_id: tipoCompra.value === 'CLIENTE_AMBIENTE' ? vendaSelecionada.value : null,
      itens,
      rateios,
    }

    if (isEdit.value) {
      await api.put(`/compras/${compraId.value}`, payload)
    } else {
      await api.put('/compras', payload)
    }

    router.push('/compras')
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

/* -------------------------------------------------------------------------- */
/* WATCHERS / INIT                                                             */
/* -------------------------------------------------------------------------- */
watch(vendaSelecionada, async (v) => {
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

