<template>
  <Card>
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          {{ isEdit ? `Editar Plano #${planoId}` : 'Novo Plano de Corte' }}
        </h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          {{ isEdit
            ? 'Ajuste itens, quantidades e valores do serviço.'
            : 'Cadastre um novo plano de corte para o fornecedor.' }}
        </p>
      </div>

      <Button variant="secondary" size="sm" @click="router.push('/plano-corte')">
        <i class="pi pi-arrow-left mr-2 text-xs"></i>
        Voltar
      </Button>
    </header>

    <!-- BODY -->
    <div class="p-6 space-y-8">
      <!-- BLOCO: DADOS GERAIS -->
      <section class="space-y-4">
        <div class="grid grid-cols-12 gap-5">
          <div class="col-span-12 md:col-span-6">
            <label class="text-xs font-black uppercase text-gray-500">Fornecedor</label>
            <select
              v-model="fornecedorId"
              class="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold"
              :disabled="isEdit"
            >
              <option v-for="f in fornecedores" :key="f.id" :value="f.id">
                {{ f.razao_social }}
              </option>
            </select>
          </div>

          <div class="col-span-12 md:col-span-3">
            <Input v-model="dataVenda" type="date" label="Data da Venda *" />
          </div>

          <div class="col-span-12 md:col-span-3">
            <label class="text-xs font-black uppercase text-gray-500">Status</label>
            <select
              v-model="statusPlano"
              class="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold"
            >
              <option value="ABERTO">ABERTO</option>
              <option value="EM_PRODUCAO">EM PRODUÇÃO</option>
              <option value="CONCLUIDO">CONCLUÍDO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>
        </div>
      </section>

      <div class="h-px w-full bg-gray-100"></div>

      <!-- BLOCO: ADICIONAR ITEM -->
      <section class="space-y-4">
        <div>
          <h3 class="text-sm font-black uppercase text-gray-900">Itens do Plano</h3>
          <p class="text-xs font-semibold text-gray-400">
            Adicione produtos ou serviços ao plano.
          </p>
        </div>

        <div class="grid grid-cols-12 gap-5 items-end">
          <div class="col-span-12 md:col-span-5">
            <label class="text-xs font-black uppercase text-gray-500">Item</label>
            <select
              v-model="itemId"
              class="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold"
            >
              <option :value="null">Selecione…</option>
              <option v-for="i in itensDisponiveis" :key="i.id" :value="i.id">
                {{ i.nome }} {{ i.cor ? `- ${i.cor}` : '' }}
              </option>
            </select>
          </div>

          <div class="col-span-12 md:col-span-2">
            <Input v-model="qtd" label="Qtd (m²)" type="number" step="0.01" />
          </div>

          <div class="col-span-12 md:col-span-3">
            <Input v-model="valorUnitInput" label="Valor Unitário" />
          </div>

          <div class="col-span-12 md:col-span-2">
            <Button
              variant="secondary"
              class="w-full"
              :disabled="!podeAdicionar"
              @click="adicionarNaLista"
            >
              + Incluir
            </Button>
          </div>
        </div>

        <!-- TABELA -->
        <div class="overflow-hidden rounded-2xl border border-gray-100">
          <Table :columns="columns" :rows="produtos">
            <template #cell-item="{ row }">
              <strong>{{ row.item?.nome || 'Item' }}</strong>
            </template>

            <template #cell-valor_unitario="{ row }">
              {{ maskMoneyBR(row.valor_unitario) }}
            </template>

            <template #cell-valor_total="{ row }">
              {{ maskMoneyBR(row.valor_total) }}
            </template>

            <template #cell-acoes="{ index }">
              <Button variant="danger" size="sm" @click="removerDaLista(index)">
                <i class="pi pi-trash text-xs"></i>
              </Button>
            </template>
          </Table>
        </div>

        <!-- TOTAL -->
        <div class="flex justify-end">
          <div class="text-right">
            <div class="text-xs font-black uppercase text-gray-400">Total do Serviço</div>
            <div class="text-2xl font-black text-gray-900">
              {{ maskMoneyBR(totalGeral) }}
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- FOOTER -->
    <footer class="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
      <Button
        variant="secondary"
        :loading="salvando"
        @click="salvar"
      >
        {{ isEdit ? 'Salvar Alterações' : 'Criar Plano' }}
      </Button>

      <Button
        v-if="isEdit"
        variant="primary"
        :loading="encaminhando"
        @click="encaminharParaProducao"
      >
        Encaminhar para Produção
      </Button>
    </footer>
  </Card>
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

const router = useRouter()
const route = useRoute()

const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')
const planoId = computed(() => (isEdit.value ? Number(rawId.value) : null))

const carregando = ref(false)
const salvando = ref(false)
const encaminhando = ref(false)

const fornecedores = ref([])
const itensDisponiveis = ref([])

const fornecedorId = ref(null)
const dataVenda = ref('')
const statusPlano = ref('ABERTO')
const produtos = ref([])

const itemId = ref(null)
const qtd = ref('')
const valorUnitInput = ref('0,00')

const columns = [
  { key: 'item', label: 'Item' },
  { key: 'quantidade', label: 'Qtd', width: '80px' },
  { key: 'valor_unitario', label: 'Unitário', width: '140px' },
  { key: 'valor_total', label: 'Total', width: '140px' },
  { key: 'acoes', label: '', width: '60px' },
]

watch(valorUnitInput, (v) => {
  const n = String(v).replace(/\D/g, '')
  const valor = n ? Number(n) / 100 : 0
  valorUnitInput.value = maskMoneyBR(valor)
})

const totalGeral = computed(() =>
  produtos.value.reduce((acc, p) => acc + p.valor_total, 0)
)

const podeAdicionar = computed(() =>
  itemId.value && Number(qtd.value) > 0
)

function adicionarNaLista() {
  const item = itensDisponiveis.value.find(i => i.id === itemId.value)
  const v = Number(String(valorUnitInput.value).replace(/\D/g, '')) / 100
  const q = Number(qtd.value)

  produtos.value.push({
    item_id: item.id,
    item: { nome: item.nome },
    quantidade: q,
    valor_unitario: v,
    valor_total: q * v,
  })

  itemId.value = null
  qtd.value = ''
  valorUnitInput.value = '0,00'
}

function removerDaLista(idx) {
  produtos.value.splice(idx, 1)
}

async function salvar() {
  salvando.value = true
  try {
    const payload = {
      fornecedor_id: fornecedorId.value,
      data_venda: dataVenda.value,
      status: statusPlano.value,
      valor_total: totalGeral.value,
      produtos: produtos.value,
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

async function encaminharParaProducao() {
  encaminhando.value = true
  try {
    await api.post('/producao/encaminhar', {
      origem_tipo: 'PLANO_CORTE',
      origem_id: planoId.value,
    })
    router.push('/producao/agenda')
  } finally {
    encaminhando.value = false
  }
}

onMounted(async () => {
  carregando.value = true
  try {
    const resF = await api.get('/fornecedores')
    fornecedores.value = resF.data

    if (isEdit.value) {
      const { data } = await api.get(`/plano-corte/${planoId.value}`)
      fornecedorId.value = data.fornecedor_id
      dataVenda.value = data.data_venda
      statusPlano.value = data.status
      produtos.value = data.produtos || []

      const resItens = await api.get('/plano-corte-itens', {
        params: { fornecedor_id: data.fornecedor_id },
      })
      itensDisponiveis.value = resItens.data
    }
  } finally {
    carregando.value = false
  }
})
</script>
