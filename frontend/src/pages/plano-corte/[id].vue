<template>
  <div class="page-container">
    <Card v-if="!carregandoDados" shadow>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Edição de Plano #{{ route.params.id }}</h2>
          <p class="cell-muted">Ajuste itens, quantidades e valores do serviço.</p>
        </div>
        <div class="header-actions">
          <Button variant="outline" size="md" label="Voltar" @click="router.push('/plano-corte')" />
        </div>
      </header>

      <div class="card-body">
        <div class="form-grid">
          <div class="col-span-6 form-group">
            <label class="form-label">Fornecedor</label>
            <select v-model="fornecedorId" class="form-input" disabled>
              <option v-for="f in fornecedores" :key="f.id" :value="f.id">
                {{ f.razao_social }}
              </option>
            </select>
          </div>

          <div class="col-span-3 form-group">
            <Input v-model="dataVenda" type="date" label="Data da Venda *" />
          </div>

          <div class="col-span-3 form-group">
            <label class="form-label">Status do Plano</label>
            <select v-model="statusPlano" class="form-input">
              <option value="ABERTO">ABERTO</option>
              <option value="EM_PRODUCAO">EM PRODUÇÃO</option>
              <option value="CONCLUIDO">CONCLUÍDO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          <div class="col-span-12 section-divider">
            <h3 class="card-title">Produtos / Serviços do Plano</h3>
          </div>

          <div class="col-span-5 form-group">
            <label class="form-label">Item disponível</label>
            <select v-model="itemId" class="form-input">
              <option :value="null">Selecione para adicionar...</option>
              <option v-for="i in itensDisponiveis" :key="i.id" :value="i.id">
                {{ i.nome }} {{ i.cor ? '- ' + i.cor : '' }}
              </option>
            </select>
          </div>

          <div class="col-span-2 form-group">
            <Input v-model="qtd" label="Qtd (m²)" type="number" step="0.01" />
          </div>

          <div class="col-span-3 form-group">
            <Input v-model="valorUnitInput" label="Valor Unitário" placeholder="R$ 0,00" />
          </div>

          <div class="col-span-2 form-group" style="display: flex; align-items: flex-end;">
            <Button variant="secondary" class="w-full" :disabled="!podeAdicionar" @click="adicionarNaLista">
              + Incluir
            </Button>
          </div>

          <div class="col-span-12 card-body--flush">
            <Table :columns="columns" :rows="produtos">
              <template #cell-item="{ row }">
                <strong>{{ row.item?.nome || row.nome_item || 'Item' }}</strong>
              </template>
              
              <template #cell-valor_unitario="{ row }">
                {{ maskMoneyBR(row.valor_unitario) }}
              </template>
              
              <template #cell-valor_total="{ row }">
                {{ maskMoneyBR(row.valor_total) }}
              </template>

              <template #cell-acoes="{ index }">
                <Button variant="danger" size="sm" @click="removerDaLista(index)">
                  🗑
                </Button>
              </template>
            </Table>
          </div>

          <div class="col-span-12" style="display: flex; justify-content: flex-end; margin-top: 20px;">
            <div style="background: var(--bg-input); padding: 15px 30px; border-radius: 8px; border: 1px solid var(--border-soft); text-align: right;">
              <span class="cell-muted" style="display: block; font-size: 0.8rem;">TOTAL DO SERVIÇO</span>
              <strong style="font-size: 1.8rem; color: var(--primary);">
                {{ maskMoneyBR(totalGeral) }}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <footer class="card-footer footer-end flex gap-2">
        <Button
          variant="secondary"
          size="md"
          label="Atualizar Plano"
          :loading="salvando"
          @click="salvar"
        />

        <Button
          variant="primary"
          size="md"
          label="Encaminhar para Produção"
          :loading="encaminhando"
          :disabled="jaEncaminhado"
          @click="encaminharParaProducao"
        />
      </footer>
    </Card>

    <Card v-else style="padding: 100px; text-align: center;">
      <div class="spinner" style="margin: 0 auto 20px;"></div>
      <p class="cell-muted">Buscando dados do plano...</p>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'
import { maskMoneyBR } from '@/utils/masks'

// Componentes
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Table from '@/components/ui/Table.vue'

const router = useRouter()
const route = useRoute()

// Estados
const carregandoDados = ref(true)
const salvando = ref(false)
const fornecedores = ref([])
const itensDisponiveis = ref([])
const encaminhando = ref(false)

// Form
const fornecedorId = ref(null)
const dataVenda = ref('')
const statusPlano = ref('')
const produtos = ref([])

// Auxiliares de Adição
const itemId = ref(null)
const qtd = ref('')
const valorUnitInput = ref('0,00')

const columns = [
  { key: 'item', label: 'Item / Descrição' },
  { key: 'quantidade', label: 'Qtd', width: '100px' },
  { key: 'valor_unitario', label: 'Unitário', width: '140px' },
  { key: 'valor_total', label: 'Total', width: '140px' },
  { key: 'acoes', label: '', width: '60px' }
]

// Reatividade da Máscara
watch(valorUnitInput, (v) => {
  const n = String(v).replace(/\D/g, '')
  const valor = n ? Number(n) / 100 : 0
  const formatado = maskMoneyBR(valor)
  if (v !== formatado) valorUnitInput.value = formatado
})

const totalGeral = computed(() => produtos.value.reduce((acc, p) => acc + p.valor_total, 0))
const podeAdicionar = computed(() => !!itemId.value && Number(qtd.value) > 0)

function toNum(v) {
  const n = String(v).replace(/\D/g, '')
  return n ? Number(n) / 100 : 0
}

/* API CALLS */
async function buscarTudo() {
  carregandoDados.value = true
  try {
    const [resForn, resPlano] = await Promise.all([
      api.get('/fornecedores'),
      api.get(`/plano-corte/${route.params.id}`)
    ])
    
    fornecedores.value = resForn.data
    
    // Preenche form
    fornecedorId.value = resPlano.data.fornecedor_id
    dataVenda.value = resPlano.data.data_venda
    statusPlano.value = resPlano.data.status
    produtos.value = resPlano.data.produtos || []

    // Carrega itens específicos do fornecedor do plano
    const resItens = await api.get('/plano-corte-itens', { 
      params: { fornecedor_id: resPlano.data.fornecedor_id } 
    })
    itensDisponiveis.value = resItens.data
  } catch (err) {
    alert('Erro ao carregar dados.')
    router.push('/plano-corte')
  } finally {
    carregandoDados.value = false
  }
}

function adicionarNaLista() {
  const itemOriginal = itensDisponiveis.value.find(i => i.id === itemId.value)
  const vUnit = toNum(valorUnitInput.value)
  const q = Number(qtd.value)

  produtos.value.push({
    item_id: itemOriginal.id,
    item: { nome: itemOriginal.nome },
    quantidade: q,
    valor_unitario: vUnit,
    valor_total: q * vUnit
  })

  itemId.value = null
  qtd.value = ''
  valorUnitInput.value = '0,00'
}

function removerDaLista(idx) {
  produtos.value.splice(idx, 1)
}

async function encaminharParaProducao() {
  encaminhando.value = true
  try {
    await api.post('/producao/encaminhar', {
      origem_tipo: 'PLANO_CORTE',
      origem_id: Number(route.params.id),
      status: 'ENCAMINHADO_PRODUCAO'
    })

    // atualiza status local só para UI
    statusPlano.value = 'ENCAMINHADO_PRODUCAO'

    router.push('/producao/agenda')
  } catch (err) {
    alert('Erro ao encaminhar para produção.')
  } finally {
    encaminhando.value = false
  }
}

async function salvar() {
  salvando.value = true
  try {
    const payload = {
      fornecedor_id: fornecedorId.value,
      data_venda: dataVenda.value,
      status: statusPlano.value,
      valor_total: totalGeral.value,
      produtos: produtos.value
    }
    await api.put(`/plano-corte/${route.params.id}`, payload)
    router.push('/plano-corte')
  } catch (err) {
    alert('Erro ao atualizar plano.')
  } finally {
    salvando.value = false
  }
}

onMounted(buscarTudo)
</script>