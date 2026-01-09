<template>
  <div class="page-container">
    <Card shadow>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Novo Plano de Corte</h2>
          <p class="cell-muted">Cadastre a venda do serviço e o consumo de insumo.</p>
        </div>
        <div class="header-actions">
          <Button variant="outline" size="md" label="Voltar" @click="router.push('/plano-corte')" />
        </div>
      </header>

      <div class="card-body">
        <div class="form-grid">
          <div class="col-span-6 form-group">
            <label class="form-label">Fornecedor (Dono da Chapa) *</label>
            <select v-model="fornecedorId" class="form-input" required>
              <option :value="null">Selecione o fornecedor...</option>
              <option v-for="f in fornecedores" :key="f.id" :value="f.id">
                {{ f.razao_social }}
              </option>
            </select>
          </div>

          <div class="col-span-3 form-group">
            <Input v-model="dataVenda" type="date" label="Data da venda *" required />
          </div>

          <div class="col-span-3 form-group">
            <Input v-model="statusPlano" label="Status do Plano" placeholder="ABERTO" />
          </div>

          <div class="col-span-12 section-divider" style="margin-top: 20px;">
            <h3 class="card-title">1. Itens do Serviço (O que será cobrado)</h3>
          </div>

          <div class="col-span-5 form-group">
            <label class="form-label">Item do fornecedor *</label>
            <select v-model="itemId" class="form-input" :disabled="!fornecedorId">
              <option :value="null">Selecione o item...</option>
              <option v-for="i in itensFornecedor" :key="i.id" :value="i.id">
                {{ i.nome }} - {{ i.cor || '' }}
              </option>
            </select>
          </div>

          <div class="col-span-2 form-group">
            <Input v-model="qtd" label="Qtd (m²)" placeholder="0.00" type="number" step="0.01" />
          </div>

          <div class="col-span-3 form-group">
            <Input v-model="valorUnitInput" label="Valor Unitário *" placeholder="R$ 0,00" />
          </div>

          <div class="col-span-2 form-group" style="display: flex; align-items: flex-end;">
            <Button variant="secondary" class="w-full" :disabled="!podeAdicionarProduto" @click="adicionarProduto">
              + Add
            </Button>
          </div>

          <div class="col-span-12 card-body--flush" style="margin-top: 10px;">
            <Table :columns="columnsProdutos" :rows="produtos">
              <template #cell-item="{ row }">
                <strong>{{ row.item?.nome }}</strong>
              </template>
              <template #cell-valor_unitario="{ row }">
                {{ maskMoneyBR(row.valor_unitario) }}
              </template>
              <template #cell-valor_total="{ row }">
                {{ maskMoneyBR(row.valor_total) }}
              </template>
              <template #cell-acoes="{ index }">
                <Button variant="danger" size="sm" @click="removerProduto(index)">🗑</Button>
              </template>
            </Table>
          </div>

          <div class="col-span-12 section-divider" style="margin-top: 30px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <input type="checkbox" v-model="usarConsumo" id="chkConsumo" style="width: 18px; height: 18px;" />
              <label for="chkConsumo" class="card-title" style="margin:0; cursor:pointer;">2. Registrar Consumo de Insumo (Fita/Cola)</label>
            </div>
          </div>

          <template v-if="usarConsumo">
            <div class="col-span-4 form-group">
              <label class="form-label">Fornecedor do Insumo</label>
              <select v-model="fornecedorInsumoId" class="form-input">
                <option :value="null">Selecione...</option>
                <option v-for="f in fornecedores" :key="f.id" :value="f.id">{{ f.razao_social }}</option>
              </select>
            </div>

            <div class="col-span-5 form-group">
              <label class="form-label">Produto do Estoque</label>
              <select v-model="produtoEstoqueId" class="form-input" :disabled="!fornecedorInsumoId">
                <option :value="null">Selecione o produto...</option>
                <option v-for="p in produtosEstoque" :key="p.id" :value="p.id">{{ p.nome_produto }}</option>
              </select>
            </div>

            <div class="col-span-3 form-group">
              <Input v-model="qtdConsumo" label="Qtd (metros) *" type="number" />
            </div>

            <div class="col-span-12">
              <Button variant="secondary" :disabled="!podeAdicionarConsumo" @click="adicionarConsumo">
                + Adicionar fita ao plano
              </Button>
            </div>

            <div class="col-span-12 card-body--flush" style="margin-top: 10px;">
              <Table :columns="columnsConsumos" :rows="consumos">
                <template #cell-produto="{ row }">
                  {{ row.produto?.nome_produto }}
                </template>
                <template #cell-acoes="{ index }">
                  <Button variant="danger" size="sm" @click="removerConsumo(index)">🗑</Button>
                </template>
              </Table>
            </div>
          </template>

          <div class="col-span-12" style="display: flex; justify-content: flex-end; margin-top: 30px;">
            <div style="text-align: right; background: var(--bg-page); padding: 15px 30px; border-radius: 8px; border: 1px solid var(--border-soft);">
              <span class="cell-muted" style="display: block; font-size: 0.9rem;">VALOR TOTAL DO PLANO</span>
              <strong style="font-size: 1.8rem; color: var(--primary);">{{ maskMoneyBR(totalPlano) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <footer class="card-footer footer-end flex gap-2">
        <Button 
          variant="secondary" 
          size="md" 
          label="Salvar Plano" 
          :loading="salvando" 
          @click="salvar(false)" 
        />
        
        <Button 
          variant="primary" 
          size="md" 
          label="Encaminhar para Produção" 
          :loading="encaminhando" 
          @click="salvar(true)" 
        />
      </footer>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Table from '@/components/ui/Table.vue'
import { maskMoneyBR } from '@/utils/masks'

const router = useRouter()
const salvando = ref(false)
const encaminhando = ref(false)


// Dados do Plano
const fornecedores = ref([])
const fornecedorId = ref(null)
const dataVenda = ref(new Date().toISOString().slice(0, 10))
const statusPlano = ref('ABERTO')

// Itens/Produtos
const itensFornecedor = ref([])
const itemId = ref(null)
const qtd = ref('')
const valorUnitInput = ref('0,00')
const statusItem = ref('ABERTO')
const produtos = ref([])

// Consumo
const usarConsumo = ref(false)
const fornecedorInsumoId = ref(null)
const produtosEstoque = ref([])
const produtoEstoqueId = ref(null)
const qtdConsumo = ref('')
const consumos = ref([])

const columnsProdutos = [
  { key: 'item', label: 'Item' },
  { key: 'quantidade', label: 'Qtd (m²)' },
  { key: 'valor_unitario', label: 'V. Unit' },
  { key: 'valor_total', label: 'Total' },
  { key: 'acoes', label: '', width: '50px' } // Coluna de deletar menor
]

const columnsConsumos = [
  { key: 'produto', label: 'Produto' },
  { key: 'quantidade', label: 'Qtd' },
  { key: 'acoes', label: 'Ações' }
]

// Máscara Reativa
watch(valorUnitInput, (v) => {
  const apenasNumeros = String(v || '').replace(/\D/g, '')
  const valorNumerico = apenasNumeros ? Number(apenasNumeros) / 100 : 0
  const formatado = maskMoneyBR(valorNumerico)
  if (v !== formatado) valorUnitInput.value = formatado
})

function converterParaNumero(v) {
  const apenasNumeros = String(v || '').replace(/\D/g, '')
  return apenasNumeros ? Number(apenasNumeros) / 100 : 0
}

const totalPlano = computed(() => {
  return produtos.value.reduce((t, p) => t + (p.valor_total || 0), 0)
})

const fornecedoresOptions = computed(() => 
  fornecedores.value.map(f => ({ value: f.id, label: f.razao_social }))
)

const itensOptions = computed(() => 
  itensFornecedor.value.map(i => ({ value: i.id, label: `${i.nome} - ${i.cor || ''}` }))
)

const produtosEstoqueOptions = computed(() => 
  produtosEstoque.value.map(p => ({ value: p.id, label: p.nome_produto }))
)

const podeAdicionarProduto = computed(() => {
  return !!itemId.value && Number(qtd.value) > 0 && converterParaNumero(valorUnitInput.value) > 0
})

const podeAdicionarConsumo = computed(() => {
  return !!produtoEstoqueId.value && Number(qtdConsumo.value) > 0
})

/* MÉTODOS */
async function carregarFornecedores() {
  const { data } = await api.get('/fornecedores')
  fornecedores.value = data
}

watch(fornecedorId, async (val) => {
  if (!val) return
  const { data } = await api.get('/plano-corte-itens', { params: { fornecedor_id: val } })
  itensFornecedor.value = data
})

watch(fornecedorInsumoId, async (val) => {
  if (!val) return
  const { data } = await api.get('/produtos', { params: { fornecedor_id: val } })
  produtosEstoque.value = data
})

  
function adicionarProduto() {
  const item = itensFornecedor.value.find(i => i.id === itemId.value)
  const vUnit = converterParaNumero(valorUnitInput.value)
  const quantidade = Number(qtd.value) 
  
  produtos.value.push({
    item_id: item.id,
    item: item,
    quantidade,
    valor_unitario: vUnit,
    valor_total: (quantidade * vUnit),
    status: statusItem.value
  })
  
  // Limpar campos após adicionar
  itemId.value = null
  qtd.value = ''
  valorUnitInput.value = '0,00'
}

function removerProduto(index) { produtos.value.splice(index, 1) }

function adicionarConsumo() {
  const prod = produtosEstoque.value.find(p => p.id === produtoEstoqueId.value)
  consumos.value.push({
    produto_id: prod.id,
    produto: prod,
    quantidade: Number(qtdConsumo.value.replace(',', '.'))
  })
  produtoEstoqueId.value = null
  qtdConsumo.value = ''
}

function removerConsumo(index) { consumos.value.splice(index, 1) }

async function salvar(encaminhar = false) {
  if (!fornecedorId.value) return alert('Selecione o fornecedor.')
  if (!produtos.value.length) return alert('Adicione ao menos 1 item do serviço.')

  if (encaminhar) encaminhando.value = true
  else salvando.value = true

  try {
    const payload = {
      fornecedor_id: fornecedorId.value,
      data_venda: dataVenda.value,
      status: statusPlano.value,
      valor_total: totalPlano.value,
      produtos: produtos.value,
      consumos: consumos.value,
    }

    // 1) cria o plano
    const { data } = await api.post('/plano-corte', payload)

    // ✅ precisa vir id do backend
    const planoId = Number(data?.id)
    if (!planoId || Number.isNaN(planoId)) {
      throw new Error('Backend não retornou o id do plano')
    }

    // 2) se for encaminhar, chama produção
    if (encaminhar) {
      await api.post('/producao/encaminhar', {
        origem_tipo: 'PLANO_CORTE',
        origem_id: planoId,
        status: 'ENCAMINHADO_PRODUCAO',
      })

      router.push('/producao/agenda')
      return
    }

    // 3) se for só salvar
    router.push('/plano-corte')
  } catch (err) {
    alert(encaminhar ? 'Erro ao encaminhar para produção.' : 'Erro ao salvar plano.')
  } finally {
    salvando.value = false
    encaminhando.value = false
  }
}


onMounted(carregarFornecedores)
</script>