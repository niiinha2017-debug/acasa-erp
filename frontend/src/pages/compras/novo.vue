<template>
  <div class="page-container">
    <div class="card card--shadow">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Nova Compra</h2>
          <p class="card-subtitle">Compra de insumos ou compra vinculada à venda por ambientes.</p>
        </div>

        <div class="header-actions">
          <Button label="Voltar" variant="outline" size="md" @click="router.back()" />
        </div>
      </header>

      <div class="card-body">
        <div class="type-box">
          <label class="check">
            <input type="checkbox" :checked="tipoCompra === 'INSUMOS'" @change="setTipo('INSUMOS')" />
            <span>Compra de INSUMOS (Marcenaria)</span>
          </label>

          <label class="check">
            <input type="checkbox" :checked="tipoCompra === 'CLIENTE_AMBIENTE'" @change="setTipo('CLIENTE_AMBIENTE')" />
            <span>Compra de CLIENTE x AMBIENTES (Venda)</span>
          </label>
        </div>

        <div class="form-grid">
          <div v-if="tipoCompra === 'CLIENTE_AMBIENTE'" class="form-group col-span-3">
            <Input v-model="form.venda_id" label="Venda (ID)" type="number" placeholder="Ex: 123" :required="true" />
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

        <div v-if="tipoCompra === 'CLIENTE_AMBIENTE'" class="section">
          <div class="section-divider"></div>

          <div class="section-header header-between">
            <div>
              <h3 class="card-title section-title">Ambientes</h3>
              <p class="section-subtitle">Selecione os ambientes. O rateio é diluído automaticamente.</p>
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

            <div v-if="!ambientes.length" class="empty-items col-span-12">
              Informe a venda para carregar os ambientes.
            </div>
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
              <b :class="{ 'rateio-bad': somaRateio !== totalCalculado }">{{ format.currency(somaRateio) }}</b>
            </div>
          </div>
        </div>

        <div class="section-divider"></div>

        <div class="items-header header-between" style="margin-bottom: 15px;">
          <div>
            <h3 class="card-title items-title">Itens</h3>
            <p class="items-subtitle">Materiais/serviços desta compra.</p>
          </div>
          <Button label="+ Adicionar item" variant="secondary" size="sm" @click="addItem" />
        </div>

        <div class="items-list">
          <div v-for="(it, idx) in itens" :key="idx" class="item-card card--shadow-sm">
            <div class="form-grid">
              <div class="form-group col-span-6">
                <Input v-model="it.descricao" label="Descrição" placeholder="Ex: MDF 18mm" :required="true" />
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
          </div>
<div v-if="!filtrados.length" class="search-select__empty">
  <div>Nenhum resultado encontrado</div>

  <button
    v-if="permitirCadastro"
    type="button"
    class="btn btn--outline btn--sm"
    style="margin-top: 10px;"
    @click="emitirCadastrar"
  >
    + Cadastrar item
  </button>
</div>

        </div>

        <div class="flex justify-end" style="margin-top: 20px;">
          <div class="total-box">
            <span class="cell-muted">Total da compra:</span>
            <strong class="text-xl text-primary">{{ format.currency(totalCalculado) }}</strong>
          </div>
        </div>
      </div>

      <footer class="card-footer footer-end">
        <Button 
          label="Salvar Compra" 
          variant="primary" 
          size="md"
          :loading="salvando" 
          @click="salvar" 
        />
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import api from '@/services/api'
import { format } from '@/utils/format'

import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const router = useRouter()
const salvando = ref(false)

const tipoCompra = ref('INSUMOS')
function setTipo(t) {
  tipoCompra.value = t
  if (t === 'INSUMOS') {
    form.value.venda_id = ''
    ambientes.value = []
    ambientesSelecionados.value = new Set()
    rateios.value = []
    somaRateio.value = 0
  }
}

const form = ref({ venda_id: '', status: 'RASCUNHO', observacao: '' })
const itens = ref([])

const fornecedorOptions = ref([])
const fornecedorSelecionado = ref(null)

const ambientes = ref([])
const ambientesSelecionados = ref(new Set())
const rateios = ref([])
const somaRateio = ref(0)

function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100 }

const totalCalculado = computed(() => round2(itens.value.reduce((acc, it) => acc + Number(it.valor_total || 0), 0)))

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

function addItem() {
  itens.value.push({ descricao: '', unidade: '', quantidade: 1, valor_unitario: 0, valor_total: 0 })
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

async function carregarFornecedores() {
  const { data } = await api.get('/fornecedores')
  const arr = Array.isArray(data) ? data : []
  fornecedorOptions.value = arr.map((f) => ({
    value: f.id,
    label: f.nome_fantasia || f.razao_social || `Fornecedor #${f.id}`,
  }))
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

  const nomes = Array.from(new Set(itensVenda.map((i) => String(i?.nome_ambiente || '').trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b))

  ambientes.value = nomes
  ambientesSelecionados.value = new Set()
  rateios.value = []
  somaRateio.value = 0
}

async function salvar() {
  if (!fornecedorSelecionado.value) return alert('Selecione um fornecedor.')
  if (!form.value.status) return alert('Informe o status.')

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
      tipo_compra: tipoCompra.value,
      venda_id: tipoCompra.value === 'CLIENTE_AMBIENTE' ? Number(form.value.venda_id) : undefined,
      fornecedor_id: Number(fornecedorSelecionado.value),
      status: form.value.status,
      observacao: form.value.observacao || null,
      itens: itens.value.map((it) => ({
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

    const { data } = await api.post('/compras', payload)
    router.push(`/compras/${data.id}`)
  } finally {
    salvando.value = false
  }
}

watch(
  () => form.value.venda_id,
  async (v) => {
    if (tipoCompra.value !== 'CLIENTE_AMBIENTE') return
    const id = Number(v)
    if (!id || Number.isNaN(id)) return
    await carregarAmbientesDaVenda(id)
  },
)

onMounted(async () => {
  await carregarFornecedores()
  addItem()
})
</script>

<style scoped>
.card-subtitle { color: var(--text-muted); font-size: var(--font-size-sm); margin: 0; }
.header-actions { display: flex; gap: 10px; }

.type-box {
  display: flex; gap: 16px; flex-wrap: wrap;
  padding: 12px 14px;
  border: 1px solid var(--border-soft);
  border-radius: var(--border-radius-md);
  background: var(--bg-input);
  margin-bottom: 16px;
}
.check { display: flex; gap: 8px; align-items: center; font-size: var(--font-size-sm); color: var(--text-primary); }

.section-divider { border-top: 1px solid var(--border-soft); margin: 18px 0; }
.section-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.section-title { margin: 0; }
.section-subtitle { margin: 4px 0 0; color: var(--text-muted); font-size: var(--font-size-sm); }
.section-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.ambientes-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
@media (max-width: 900px) { .ambientes-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .ambientes-grid { grid-template-columns: 1fr; } }

.rateio-box {
  margin-top: 14px;
  border: 1px solid var(--border-soft);
  border-radius: var(--border-radius-md);
  padding: 12px;
  background: var(--bg-card);
}
.rateio-title { margin: 0 0 10px; font-size: var(--font-size-sm); color: var(--text-secondary); }
.rateio-row {
  display: grid;
  grid-template-columns: 1fr 240px 130px 46px;
  gap: 10px; align-items: end;
  padding: 10px 0;
  border-top: 1px solid var(--border-soft);
}
.rateio-row:first-of-type { border-top: 0; }
.rateio-name { font-weight: 600; color: var(--text-primary); }
.rateio-hint { text-align: right; color: var(--text-secondary); font-size: var(--font-size-sm); }
.rateio-total { display: flex; justify-content: flex-end; gap: 10px; padding-top: 10px; border-top: 1px solid var(--border-soft); }
.rateio-bad { color: var(--danger); }

.items-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.items-title { margin: 0; }
.items-subtitle { margin: 4px 0 0; color: var(--text-muted); font-size: var(--font-size-sm); }

.items-list { display: flex; flex-direction: column; gap: 12px; }
.item-card { border: 1px solid var(--border-soft); border-radius: var(--border-radius-md); padding: 14px; background: var(--bg-card); }
.item-actions { display: flex; justify-content: flex-end; margin-top: 6px; }
.empty-items { padding: 14px; border: 1px dashed var(--border-soft); border-radius: var(--border-radius-md); color: var(--text-muted); font-size: var(--font-size-sm); }

.total-box {
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid var(--border-soft);
  border-radius: var(--border-radius-md);
  background: var(--bg-input);
  display: flex; justify-content: space-between; align-items: center;
}
</style>
