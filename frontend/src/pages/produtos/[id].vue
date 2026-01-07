<template>
  <div class="page-container">
    <Card>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Editar Produto</h2>
          <p class="form-label" style="margin: 0; color: var(--text-muted);">
            Atualize os dados do produto abaixo.
          </p>
        </div>
        <Button variant="secondary" @click="router.push('/produtos')">Voltar</Button>
      </header>

      <div class="card-body">
        <form class="form-grid" @submit.prevent="salvar">
          <SearchSelect
            v-model="form.fornecedor_id"
            label="Fornecedor"
            required
            col-span="col-span-12"
            :options="fornecedoresOptions"
          />

          <div class="col-span-8 form-group">
            <Input v-model="form.nome_produto" label="Nome do Produto *" required />
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="form.cor" label="Cor" />
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="form.medida" label="Medida" />
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="quantidadeMask" label="Quantidade *" required inputmode="numeric" />
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="valorUnitarioInput" label="Valor Unitário *" required inputmode="numeric" />
          </div>

          <div class="col-span-4 form-group">
            <Input :model-value="valorTotalMask" label="Valor Total" readonly class="bg-gray-50" />
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="form.status" label="Status *" required />
          </div>

          <div class="col-span-12 form-actions">
            <Button variant="secondary" type="button" @click="router.push('/produtos')">Cancelar</Button>
            <Button variant="primary" type="submit" :loading="salvando">Salvar Alterações</Button>
          </div>
        </form>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import api from '@/services/api'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import SearchSelect from '@/components/ui/SearchInput.vue'

import { maskMoneyBR } from '@/utils/masks'

const router = useRouter()
const route = useRoute()
const id = route.params.id

const salvando = ref(false)
const fornecedores = ref([])

// Ref para o campo de texto que o usuário interage
const valorUnitarioInput = ref('0,00')

const form = ref({
  fornecedor_id: null,
  nome_produto: '',
  cor: '',
  medida: '',
  quantidade: 0,
  valor_unitario: 0,
  valor_total: 0,
  status: 'ATIVO',
})

const fornecedoresOptions = computed(() =>
  fornecedores.value.map(f => ({
    value: f.id,
    label: f.razao_social,
  }))
)

/* MÁSCARA QUANTIDADE */
const quantidadeMask = computed({
  get: () => (form.value.quantidade === 0 ? '' : String(form.value.quantidade)),
  set: v => {
    const n = String(v || '').replace(/\D/g, '')
    form.value.quantidade = n ? Number(n) : 0
  },
})

/* MÁSCARA VALOR UNITÁRIO (Lógica idêntica ao NOVO que funcionou) */
watch(valorUnitarioInput, (v) => {
  const apenasNumeros = String(v || '').replace(/\D/g, '')
  const valorNumerico = apenasNumeros ? Number(apenasNumeros) / 100 : 0
  
  form.value.valor_unitario = valorNumerico

  const formatado = maskMoneyBR(valorNumerico)
  if (v !== formatado) {
    valorUnitarioInput.value = formatado
  }
})

/* CÁLCULO TOTAL */
const valorTotalMask = computed(() => {
  const total = Number(form.value.quantidade || 0) * Number(form.value.valor_unitario || 0)
  form.value.valor_total = total
  return maskMoneyBR(total)
})

/* CARREGAR DADOS */
async function carregar() {
  try {
    // 1. Carrega fornecedores
    const resF = await api.get('/fornecedores')
    fornecedores.value = resF.data

    // 2. Carrega o produto
    const { data } = await api.get(`/produtos/${id}`)
    
    // Atualiza o formulário
    form.value = { ...data }

    // 3. Formata o valor do banco para o Input (Ex: 15.5 vira "15,50")
    valorUnitarioInput.value = maskMoneyBR(data.valor_unitario)

  } catch (err) {
    alert('Erro ao carregar produto')
    router.push('/produtos')
  }
}

async function salvar() {
  salvando.value = true
  try {
    // Usamos PATCH para editar
    await api.patch(`/produtos/${id}`, {
      ...form.value,
      fornecedor_id: Number(form.value.fornecedor_id)
    })
    alert('Produto atualizado com sucesso!')
    router.push('/produtos')
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao salvar')
  } finally {
    salvando.value = false
  }
}

onMounted(carregar)
</script>
