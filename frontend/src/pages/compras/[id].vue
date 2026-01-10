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

          <!-- Dados principais -->
          <div class="form-grid">
            <div v-if="tipoCompra === 'CLIENTE_AMBIENTE'" class="form-group col-span-3">
              <Input
                v-model="form.venda_id"
                label="Venda (ID)"
                type="number"
                placeholder="Ex: 123"
                :required="true"
              />
            </div>

            <div class="form-group" :class="tipoCompra === 'CLIENTE_AMBIENTE' ? 'col-span-5' : 'col-span-9'">
              <SearchInput
                v-model="fornecedorSelecionado"
                label="Fornecedor"
                :options="fornecedorOptions"
                placeholder="Buscar fornecedor..."
                :required="true"
                colSpan="col-span-12"
              />
            </div>

            <div class="form-group col-span-3">
              <Input v-model="form.status" label="Status" placeholder="RASCUNHO" :required="true" />
            </div>

            <div class="form-group col-span-12">
              <Input v-model="form.observacao" label="Observação" placeholder="Opcional" />
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

              <!-- Descrição fica “snapshot” pra não travar, mas você pode remover se quiser -->
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

    <!-- MODAL PRODUTO -->
    <div v-if="modalProduto.aberto" class="modal-backdrop" @click.self="fecharModalProduto()">
      <div class="modal card card--shadow">
        <header class="card-header header-between">
          <div>
            <h3 class="card-title">Cadastrar Produto</h3>
            <p class="card-subtitle">Crie um produto e ele já entra na busca.</p>
          </div>
          <Button label="Fechar" variant="outline" size="sm" @click="fecharModalProduto()" />
        </header>

        <div class="card-body">
          <div class="form-grid">
            <div class="form-group col-span-6">
              <Input v-model="modalProduto.form.nome" label="Nome" placeholder="Ex: MDF 18mm Duratex" :required="true" />
            </div>

            <div class="form-group col-span-3">
              <Input v-model="modalProduto.form.unidade" label="Unidade" placeholder="UN / PL / M" />
            </div>

            <div class="form-group col-span-3">
              <Input v-model="modalProduto.form.preco" label="Preço sugerido" type="number" placeholder="0" />
            </div>

            <div class="form-group col-span-12">
              <Input v-model="modalProduto.form.observacao" label="Observação" placeholder="Opcional" />
            </div>
          </div>
        </div>

        <footer class="card-footer footer-between">
          <div></div>
          <div class="flex gap-2">
            <Button label="Cancelar" variant="outline" @click="fecharModalProduto()" />
            <Button label="Salvar Produto" variant="primary" :loading="modalProduto.salvando" @click="salvarProduto()" />
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import api from '@/services/api'
import format from '@/utils/format'

import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const route = useRoute()
const router = useRouter()

const compraId = computed(() => {
  const n = Number(route.params.id)
  return Number.isFinite(n) ? n : null
})

const isEdit = computed(() => compraId.value !== null)

const loading = ref(false)
const salvando = ref(false)
const excluindo = ref(false)

const tipoCompra = ref('INSUMOS')

const form = ref({ venda_id: '', status: 'RASCUNHO', observacao: '' })

const itens = ref([])

// fornecedores
const fornecedorOptions = ref([])
const fornecedorSelecionado = ref(null)

// produtos
const produtoOptions = ref([])
const produtoMap = ref(new Map()) // id -> produto

// ambientes/rateio
const ambientes = ref([])
const ambientesSelecionados = ref(new Set())
const rateios = ref([])
const somaRateio = ref(0)

function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100 }

const totalCalculado = computed(() =>
  round2(itens.value.reduce((acc, it) => acc + Number(it.valor_total || 0), 0))
)

function rateioAutomaticoValores(total, nomes) {
  const qtd = nomes.length
  if (!qtd) return []
  const base = round2(total / qtd)
  const arr = nomes.map((n) => ({ nome_ambiente: n, valor_alocado: base }))
  const soma = round2(arr.reduce((a, r) => a + Number(r.valor_alocado || 0), 0))
  const diff = round2(total - soma)
  arr[arr.length - 1].valor_alocado = round2(arr[arr.length - 1].valor_alocado + diff)
  return arr
}

function recalcularSomaRateio() {
  somaRateio.value = round2(rateios.value.reduce((acc, r) => acc + Number(r.valor_alocado || 0), 0))
}

function ratearAutomatico() {
  const nomes = Array.from(ambientesSelecionados.value)
  if (!nomes.length) return alert('Selecione pelo menos 1 ambiente.')
  rateios.value = rateioAutomaticoValores(totalCalculado.value, nomes)
  recalcularSomaRateio()
}

function selecionarTodosAmbientes() {
  ambientesSelecionados.value = new Set(ambientes.value)
  ratearAutomatico()
}

function toggleAmbiente(nome) {
  const set = new Set(ambientesSelecionados.value)
  if (set.has(nome)) set.delete(nome)
  else set.add(nome)
  ambientesSelecionados.value = set
  ratearAutomatico()
}

function removerRateio(idx) {
  rateios.value.splice(idx, 1)
  ambientesSelecionados.value = new Set(rateios.value.map((r) => r.nome_ambiente))
  recalcularSomaRateio()
}

// itens
function addItem(prefill = {}) {
  itens.value.push({
    id: undefined,
    produto_id: null,
    descricao: '',
    unidade: '',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    _key: `tmp-${Math.random().toString(36).slice(2)}`,
    ...prefill,
  })
}

function removerItem(idx) {
  itens.value.splice(idx, 1)
  recalcularTudo()
}

function recalcularItem(idx) {
  const it = itens.value[idx]
  const qtd = Number(it.quantidade || 0)
  const vu = Number(it.valor_unitario || 0)
  it.valor_total = round2(qtd * vu)
  recalcularTudo()
}

function recalcularTudo() {
  if (tipoCompra.value === 'CLIENTE_AMBIENTE' && ambientesSelecionados.value.size) ratearAutomatico()
  else recalcularSomaRateio()
}

function aplicarProdutoNoItem(idx, produtoId) {
  const id = Number(produtoId || 0)
  if (!id || Number.isNaN(id)) return

  const p = produtoMap.value.get(id)
  if (!p) return

  const it = itens.value[idx]
  it.produto_id = id
  it.descricao = p.nome || p.descricao || it.descricao
  it.unidade = p.unidade || it.unidade
  if (Number(it.valor_unitario || 0) === 0 && p.preco) it.valor_unitario = Number(p.preco)
  recalcularItem(idx)
}

// loaders
async function carregarFornecedores() {
  const { data } = await api.get('/fornecedores')
  const arr = Array.isArray(data) ? data : []
  fornecedorOptions.value = arr.map((f) => ({
    value: f.id,
    label: f.nome_fantasia || f.razao_social || `Fornecedor #${f.id}`,
  }))
}

async function carregarProdutos() {
  const { data } = await api.get('/produtos')
  const arr = Array.isArray(data) ? data : []
  produtoOptions.value = arr.map((p) => ({
    value: p.id,
    label: p.nome || p.descricao || `Produto #${p.id}`,
  }))
  const map = new Map()
  arr.forEach((p) => map.set(p.id, p))
  produtoMap.value = map
}

async function carregarAmbientesDaVenda(vendaId) {
  if (!vendaId) {
    ambientes.value = []
    ambientesSelecionados.value = new Set()
    rateios.value = []
    somaRateio.value = 0
    return
  }

  const { data } = await api.get(`/vendas/${vendaId}`)
  const itensVenda = Array.isArray(data?.itens) ? data.itens : []

  const nomes = Array.from(
    new Set(itensVenda.map((i) => String(i?.nome_ambiente || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b))

  ambientes.value = nomes

  const setAtual = new Set(ambientesSelecionados.value)
  const setNovo = new Set(nomes.filter((n) => setAtual.has(n)))
  ambientesSelecionados.value = setNovo

  if (!setNovo.size && rateios.value.length) {
    ambientesSelecionados.value = new Set(rateios.value.map((r) => r.nome_ambiente))
  }
}

async function carregarCompra() {
  if (!isEdit.value) return

  loading.value = true
  try {
    const { data } = await api.get(`/compras/${compraId.value}`)

    tipoCompra.value = data.tipo_compra || 'INSUMOS'

    form.value.venda_id = data.venda_id ? String(data.venda_id) : ''
    form.value.status = data.status || 'RASCUNHO'
    form.value.observacao = data.observacao || ''

    fornecedorSelecionado.value = data.fornecedor_id ? Number(data.fornecedor_id) : null

    itens.value = (Array.isArray(data.itens) ? data.itens : []).map((i) => ({
      id: i.id,
      produto_id: i.produto_id ? Number(i.produto_id) : null,
      descricao: i.descricao,
      unidade: i.unidade || '',
      quantidade: Number(i.quantidade || 0),
      valor_unitario: Number(i.valor_unitario || 0),
      valor_total: Number(i.valor_total || 0),
      _key: String(i.id),
    }))

    rateios.value = (Array.isArray(data.rateios) ? data.rateios : []).map((r) => ({
      nome_ambiente: r.nome_ambiente,
      valor_alocado: Number(r.valor_alocado || 0),
    }))

    recalcularSomaRateio()

    if (tipoCompra.value === 'CLIENTE_AMBIENTE' && data.venda_id) {
      ambientesSelecionados.value = new Set(rateios.value.map((r) => r.nome_ambiente))
      await carregarAmbientesDaVenda(Number(data.venda_id))
    }

    if (!itens.value.length) addItem()
  } finally {
    loading.value = false
  }
}

// salvar/excluir
async function salvar() {
  if (!fornecedorSelecionado.value) return alert('Selecione um fornecedor.')
  if (!form.value.status) return alert('Informe o status.')
  if (!itens.value.length) return alert('Adicione pelo menos 1 item.')

  // valida itens
  for (const it of itens.value) {
    if (!it.descricao && !it.produto_id) return alert('Selecione um produto ou preencha a descrição.')
    if (Number(it.quantidade || 0) <= 0) return alert('Quantidade precisa ser maior que zero.')
  }

  if (tipoCompra.value === 'CLIENTE_AMBIENTE') {
    if (!form.value.venda_id) return alert('Informe a venda (ID).')
    if (!rateios.value.length) return alert('Selecione ambientes e gere o rateio.')
    if (round2(somaRateio.value) !== round2(totalCalculado.value)) {
      return alert('A soma do rateio precisa ser igual ao total da compra.')
    }
  }

  salvando.value = true
  try {
    const payload = {
      tipo_compra: tipoCompra.value, // no "novo" precisa ir
      venda_id: tipoCompra.value === 'CLIENTE_AMBIENTE' ? Number(form.value.venda_id) : null,
      fornecedor_id: Number(fornecedorSelecionado.value),
      status: form.value.status,
      observacao: form.value.observacao || null,

      itens: itens.value.map((it) => ({
        id: it.id,
        produto_id: it.produto_id ? Number(it.produto_id) : null,
        descricao: it.descricao,
        unidade: it.unidade || '',
        quantidade: Number(it.quantidade || 0),
        valor_unitario: Number(it.valor_unitario || 0),
        valor_total: Number(it.valor_total || 0),
      })),

      rateios:
        tipoCompra.value === 'CLIENTE_AMBIENTE'
          ? rateios.value.map((r) => ({ nome_ambiente: r.nome_ambiente, valor_alocado: Number(r.valor_alocado || 0) }))
          : undefined,
    }

    // ✅ Regra do projeto: PUT para criar/atualizar
    if (isEdit.value) {
      await api.put(`/compras/${compraId.value}`, payload)
      alert('Salvo com sucesso!')
    } else {
      await api.put('/compras', payload) // ajuste aqui se seu backend usar outra rota
      alert('Compra criada com sucesso!')
      router.push('/compras')
    }
  } finally {
    salvando.value = false
  }
}

async function excluir() {
  if (!isEdit.value) return
  if (!confirm('Deseja excluir esta compra?')) return
  excluindo.value = true
  try {
    await api.delete(`/compras/${compraId.value}`)
    router.push('/compras')
  } finally {
    excluindo.value = false
  }
}

// watch venda_id
watch(
  () => form.value.venda_id,
  async (v) => {
    if (tipoCompra.value !== 'CLIENTE_AMBIENTE') return
    const id = Number(v)
    if (!id || Number.isNaN(id)) return
    await carregarAmbientesDaVenda(id)
  },
)

// Modal Produto
const modalProduto = reactive({
  aberto: false,
  salvando: false,
  form: {
    nome: '',
    unidade: '',
    preco: '',
    observacao: '',
  },
})

function abrirModalProduto() {
  modalProduto.aberto = true
  modalProduto.form.nome = ''
  modalProduto.form.unidade = ''
  modalProduto.form.preco = ''
  modalProduto.form.observacao = ''
}

function fecharModalProduto() {
  modalProduto.aberto = false
}

async function salvarProduto() {
  if (!modalProduto.form.nome) return alert('Informe o nome do produto.')

  modalProduto.salvando = true
  try {
    const payload = {
      nome: modalProduto.form.nome,
      unidade: modalProduto.form.unidade || null,
      preco: modalProduto.form.preco ? Number(modalProduto.form.preco) : null,
      observacao: modalProduto.form.observacao || null,
    }

    // ✅ Regra do projeto: PUT
    await api.put('/produtos', payload) // ajuste se sua rota for /produtos/:id ou outro padrão

    await carregarProdutos()
    fecharModalProduto()
    alert('Produto cadastrado!')
  } finally {
    modalProduto.salvando = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([carregarFornecedores(), carregarProdutos()])
    await carregarCompra()
    if (!isEdit.value && !itens.value.length) addItem()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* Se você já tem modal global no ui.css, pode apagar isso aqui */
.modal-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 50;
}
.modal{
  width: min(920px, 100%);
  max-height: 90vh;
  overflow: auto;
  border-radius: 16px;
}

.item-snapshot{
  padding: 8px 12px 12px;
  display: flex;
  gap: 8px;
  align-items: baseline;
  border-top: 1px solid var(--gray-200);
}

.rateio-bad{
  color: var(--danger-600);
}
</style>
