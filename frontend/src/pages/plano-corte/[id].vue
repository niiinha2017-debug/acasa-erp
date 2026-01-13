<template>
  <Card :shadow="true">
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          {{ isEdit ? `Editar Plano #${planoId}` : 'Novo Plano de Corte' }}
        </h2>
      </div>

      <Button variant="secondary" size="sm" type="button" @click="router.back()">
        Voltar
      </Button>
    </header>

    <!-- BODY -->
    <div class="p-6">
      <template v-if="!loading">
        <form class="grid grid-cols-12 gap-x-5 gap-y-6" @submit.prevent>
  <!-- Fornecedor -->
  <div class="col-span-12 md:col-span-6">
    <SearchInput
      v-model="fornecedorSelecionado"
      label="Fornecedor *"
      :options="fornecedorOptions"
      required
      :colSpan="12"
      @update:modelValue="(v) => onSelecionarFornecedor(v)"
    />
  </div>

  <!-- Data -->
  <div class="col-span-12 md:col-span-3">
    <Input
      v-model="dataVenda"
      label="Data *"
      type="date"
      required
    />
  </div>

  <!-- Status -->
  <div class="col-span-12 md:col-span-3">
    <SearchInput
      v-model="statusPlano"
      label="Status *"
      :options="statusPlanoOptions"
      required
      :colSpan="12"
    />
  </div>
</form>
        <form class="grid grid-cols-12 gap-x-5 gap-y-6 mt-8" @submit.prevent>
          <!-- Registrar Item -->
          <div class="col-span-12 flex items-end justify-between">
            <h3 class="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-400">
              Registrar Item
            </h3>

            <Button variant="secondary" size="sm" type="button" @click="abrirModalProduto()">
              + Novo Produto
            </Button>
          </div>

          <!-- Produto -->
          <div class="col-span-12 md:col-span-6">
<SearchInput
  v-model="itemNovo.item_id"
              label="Produto *"
              :options="produtoOptions"
              required
              :colSpan="12"
              @update:modelValue="(v) => onSelecionarProdutoNovo(v)"
            />
          </div>

          <!-- Unidade -->
          <div class="col-span-12 md:col-span-2">
            <Input v-model="itemNovo.unidade" label="Unidade" readonly />
          </div>

          <!-- QTD -->
          <div class="col-span-12 md:col-span-2">
            <Input v-model="itemNovo.quantidade" label="QTD *" required />
          </div>

          <!-- Valor Unit -->
          <div class="col-span-12 md:col-span-2">
            <Input v-model="itemNovo.valorUnitarioMask" label="Valor Unit. *" required />
          </div>

          <!-- Subtotal -->
          <div class="col-span-12 md:col-span-4">
            <Input :model-value="itemNovoValorTotalMask" label="Subtotal Item" readonly />
          </div>

          <!-- Ações do item -->
          <div class="col-span-12 md:col-span-8 flex items-end justify-end gap-3 pb-1">
            <Button variant="secondary" type="button" @click="limparItemNovo()">
              Limpar
            </Button>
            <Button variant="primary" type="button" :disabled="!podeAdicionarItem" @click="registrarItemNovo()">
              Adicionar Item
            </Button>
          </div>

          <!-- Itens Adicionados -->
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
                <template #cell-produto="{ row }">
                  <strong>{{ row.item?.nome_produto || 'Item' }}</strong>
                </template>

                <template #cell-valor_unitario="{ row }">
                  {{ maskMoneyBR(row.valor_unitario || 0) }}
                </template>

                <template #cell-valor_total="{ row }">
                  {{ maskMoneyBR(row.valor_total || 0) }}
                </template>

                <template #cell-acoes="{ index }">
                  <Button variant="danger" size="sm" type="button" @click="removerItem(index)">
                    <i class="pi pi-trash text-xs"></i>
                  </Button>
                </template>
              </Table>

              <div class="flex items-center justify-end p-4 border-t border-gray-100 bg-gray-50">
                <span class="text-sm font-black text-gray-900 uppercase">
                  Total: {{ maskMoneyBR(totalCalculado) }}
                </span>
              </div>
            </div>
          </div>
        </form>
      </template>

      <!-- Loading -->
      <div v-else class="flex flex-col items-center justify-center py-20 gap-3">
        <i class="pi pi-spin pi-spinner text-2xl text-brand-primary"></i>
        <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando...</span>
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="flex items-center justify-between p-6 border-t border-gray-100 bg-white">
      <Button v-if="isEdit" variant="danger" type="button" @click="excluir">
        Excluir
      </Button>
      <div v-else></div>

      <div class="flex items-center gap-3">
        <Button
          v-if="isEdit"
          variant="secondary"
          :loading="encaminhando"
          type="button"
          @click="encaminharParaProducao"
        >
          Encaminhar para Produção
        </Button>

        <Button variant="primary" :loading="salvando" type="button" @click="salvar">
          {{ isEdit ? 'Salvar Alterações' : 'Finalizar Plano' }}
        </Button>
      </div>
    </footer>
  </Card>

  <!-- MODAL: NOVO PRODUTO (igual ao da Compras) -->
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
              <Input :model-value="modalProdutoValorTotalMask" label="Valor Total" readonly />
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'
import { maskMoneyBR } from '@/utils/masks'

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Table from '@/components/ui/Table.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import CustomCheckbox from '@/components/ui/CustomCheckbox.vue'

import { useConstantes } from '@/composables/useConstantes'

/* ------------------------------------------------------------------
 * ROUTER / CONTEXTO
 * ------------------------------------------------------------------ */
const router = useRouter()
const route = useRoute()

const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')
const planoId = computed(() => (isEdit.value ? Number(rawId.value) : null))

const loading = ref(false)
const salvando = ref(false)
const encaminhando = ref(false)

/* ------------------------------------------------------------------
 * CONSTANTES (GLOBAL – PADRÃO ÚNICO)
 * ------------------------------------------------------------------ */
const constantes = useConstantes()

/**
 * STATUS DO PLANO
 * Categoria: STATUS PRODUÇÃO
 * Chave: PLANO DE CORTE
 */
const statusPlanoOptions = computed(() => {
  return constantes.opcoes.value
    .filter(o => o.metadata?.categoria === 'STATUS PRODUÇÃO')
    .filter(o => o.value === 'PLANO DE CORTE')
    .map(o => ({
      label: o.label, // Ex: Em aberto / Produção / Finalizado
      value: o.label, // salva exatamente o texto
    }))
})

/**
 * UNIDADES DO PRODUTO
 * Categoria: MODULO
 * Chave: UNIDADE
 */
const unidadesOptions = computed(() => {
  return constantes.opcoes.value
    .filter(o => o.metadata?.categoria === 'MODULO')
    .filter(o => o.value === 'UNIDADE')
    .map(o => ({
      label: o.label, // Caixa / Metros / Rolo / Unidade
      value: o.label,
    }))
})

/* ------------------------------------------------------------------
 * CAMPOS DO PLANO
 * ------------------------------------------------------------------ */
const dataVenda = ref('')
const statusPlano = ref('')

/* ------------------------------------------------------------------
 * FORNECEDOR
 * ------------------------------------------------------------------ */
const fornecedor = ref([])

const fornecedorOptions = computed(() =>
  fornecedor.value.map(f => ({
    label: f.razao_social,
    value: f.id,
    raw: f,
  }))
)

const fornecedorSelecionado = ref(null)

/* ------------------------------------------------------------------
 * ITENS DISPONÍVEIS (plano_corte_item)
 * ------------------------------------------------------------------ */
const itensDisponiveis = ref([])

const produtoOptions = computed(() =>
  itensDisponiveis.value.map(i => ({
    label: `${i.nome_produto}${i.cor ? ` - ${i.cor}` : ''}`,
    value: i.id,
    raw: i,
  }))
)

/* ------------------------------------------------------------------
 * ITEM NOVO DO PLANO
 * ------------------------------------------------------------------ */
const itemNovo = ref({
  item_id: null,
  unidade: '',
  quantidade: '',
  valorUnitarioMask: '0,00',
})

const podeAdicionarItem = computed(() => {
  return !!itemNovo.value.item_id && Number(itemNovo.value.quantidade) > 0
})

const subtotalItem = computed(() => {
  const v = Number(String(itemNovo.value.valorUnitarioMask).replace(/\D/g, '')) / 100
  const q = Number(itemNovo.value.quantidade)
  return (q || 0) * (v || 0)
})

const itemNovoValorTotalMask = computed(() =>
  maskMoneyBR(subtotalItem.value)
)

watch(
  () => itemNovo.value.valorUnitarioMask,
  v => {
    const n = String(v || '').replace(/\D/g, '')
    const valor = n ? Number(n) / 100 : 0
    itemNovo.value.valorUnitarioMask = maskMoneyBR(valor)
  }
)

/* ------------------------------------------------------------------
 * ITENS DO PLANO
 * ------------------------------------------------------------------ */
const itens = ref([])

const totalCalculado = computed(() =>
  itens.value.reduce((acc, it) => acc + (it.valor_total || 0), 0)
)

const columnsItens = [
  { key: 'produto', label: 'Produto' },
  { key: 'quantidade', label: 'Qtd', width: '90px' },
  { key: 'valor_unitario', label: 'Unitário', width: '140px' },
  { key: 'valor_total', label: 'Total', width: '140px' },
  { key: 'acoes', label: '', width: '60px' },
]

/* ------------------------------------------------------------------
 * SELEÇÕES
 * ------------------------------------------------------------------ */
function onSelecionarFornecedor(v) {
  const fornecedorId = v?.value ?? v
  fornecedorSelecionado.value = fornecedorId

  if (fornecedorId) carregarItensDisponiveis(fornecedorId)
  else itensDisponiveis.value = []

  limparItemNovo()
  itens.value = []
}

function onSelecionarProdutoNovo(v) {
  const itemId = v?.value ?? v
  itemNovo.value.item_id = itemId

  const item = itensDisponiveis.value.find(i => i.id === itemId)
  itemNovo.value.unidade = item?.unidade || ''
}

/* ------------------------------------------------------------------
 * AÇÕES DO ITEM
 * ------------------------------------------------------------------ */
function limparItemNovo() {
  itemNovo.value.item_id = null
  itemNovo.value.unidade = ''
  itemNovo.value.quantidade = ''
  itemNovo.value.valorUnitarioMask = '0,00'
}

function registrarItemNovo() {
  const item = itensDisponiveis.value.find(i => i.id === itemNovo.value.item_id)
  const v = Number(String(itemNovo.value.valorUnitarioMask).replace(/\D/g, '')) / 100
  const q = Number(itemNovo.value.quantidade)

  itens.value.push({
    item_id: item.id,
    item: { nome_produto: item.nome_produto },
    quantidade: q,
    valor_unitario: v,
    valor_total: q * v,
    status: 'ATIVO',
  })

  limparItemNovo()
}

function removerItem(idx) {
  itens.value.splice(idx, 1)
}

/* ------------------------------------------------------------------
 * API
 * ------------------------------------------------------------------ */
async function carregarFornecedor() {
  const res = await api.get('/fornecedor')
  fornecedor.value = res.data || []
}

async function carregarItensDisponiveis(fornecedorId) {
  const res = await api.get('/plano-corte-itens', {
    params: { fornecedor_id: fornecedorId },
  })
  itensDisponiveis.value = res.data || []
}

/* ------------------------------------------------------------------
 * SALVAR PLANO
 * ------------------------------------------------------------------ */
async function salvar() {
  salvando.value = true
  try {
    const payload = {
      fornecedor_id: fornecedorSelecionado.value,
      data_venda: dataVenda.value,
      status: statusPlano.value,
      produtos: itens.value.map(p => ({
        item_id: p.item_id,
        quantidade: p.quantidade,
        valor_unitario: p.valor_unitario,
        valor_total: p.valor_total,
        status: p.status,
      })),
    }

    if (isEdit.value) {
      await api.put(`/plano-corte/${planoId.value}`, payload)
    } else {
      await api.post('/plano-corte', payload)
    }

    router.push('/plano-corte')
  } finally {
    salvando.value = false
  }
}

/* ------------------------------------------------------------------
 * ON MOUNT
 * ------------------------------------------------------------------ */
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      carregarFornecedor(),
      constantes.carregarCategoria('STATUS PRODUÇÃO'),
      constantes.carregarCategoria('MODULO'),
    ])

    if (!isEdit.value) {
      const hoje = new Date()
      dataVenda.value = hoje.toISOString().slice(0, 10)
    }

    if (isEdit.value) {
      const { data } = await api.get(`/plano-corte/${planoId.value}`)

      fornecedorSelecionado.value = data.fornecedor_id
      statusPlano.value = data.status
      dataVenda.value = data.data_venda?.slice(0, 10)

      itens.value = (data.produtos || []).map(p => ({
        item_id: p.item_id,
        item: p.item,
        quantidade: Number(p.quantidade),
        valor_unitario: Number(p.valor_unitario),
        valor_total: Number(p.valor_total),
        status: p.status,
      }))

      if (data.fornecedor_id) {
        await carregarItensDisponiveis(data.fornecedor_id)
      }
    }
  } finally {
    loading.value = false
  }
})
</script>

