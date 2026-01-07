<template>
  <div class="page-container">
    <Card>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Cadastrar Produto</h2>
          <p class="form-label" style="margin: 0; color: var(--text-muted);">
            Insira os dados do produto abaixo.
          </p>
        </div>

        <Button variant="secondary" @click="router.push('/produtos')">
          Voltar
        </Button>
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
            <Input
              v-model="form.nome_produto"
              label="Nome do Produto *"
              required
            />
          </div>

          <div class="col-span-4 form-group">
            <Input v-model="form.cor" label="Cor" />
          </div>

          <div class="col-span-4 form-group">
            <Input
              v-model="form.medida"
              label="Medida"
              placeholder="Ex: 2,75 x 1,85"
            />
          </div>

          <div class="col-span-4 form-group">
            <Input
              v-model="quantidadeMask"
              label="Quantidade *"
              required
              inputmode="numeric"
            />
          </div>
<div class="col-span-4 form-group">
  <Input
    v-model="valorUnitarioInput"
    label="Valor Unitário *"
    required
    inputmode="numeric"
  />
</div>

          <div class="col-span-4 form-group">
            <Input
              :model-value="valorTotalMask"
              label="Valor Total"
              readonly
              style="background-color: #f9fafb; cursor: not-allowed;" 
            />
          </div>

          <div class="col-span-4 form-group">
            <Input
              v-model="form.status"
              label="Status *"
              required
            />
          </div>

          <div class="col-span-12 form-actions">
            <Button
              variant="secondary"
              type="button"
              @click="router.push('/produtos')"
            >
              Cancelar
            </Button>

            <Button variant="primary" type="submit" :loading="salvando">
              Salvar Produto
            </Button>
          </div>
        </form>
      </div>
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
import SearchSelect from '@/components/ui/SearchInput.vue'

import { maskMoneyBR } from '@/utils/masks'

const router = useRouter()
const salvando = ref(false)
const fornecedores = ref([])

// Este ref controla o que o usuário digita no campo de dinheiro  

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

/* OPTIONS PARA O SEARCHSELECT */
const fornecedoresOptions = computed(() =>
  fornecedores.value.map(f => ({
    value: f.id,
    label: f.razao_social,
  }))
)

/* MÁSCARA DE QUANTIDADE (Somente números) */
const quantidadeMask = computed({
  get: () => (form.value.quantidade === 0 ? '' : String(form.value.quantidade)),
  set: v => {
    const n = String(v || '').replace(/\D/g, '')
    form.value.quantidade = n ? Number(n) : 0
  },
})

// 1. O que aparece na tela começa como 0,00
const valorUnitarioInput = ref('0,00')

/* REAÇÃO À DIGITAÇÃO: Formata em tempo real */
watch(valorUnitarioInput, (v) => {
  // 1. Pega apenas os números (ex: "15" vira 15)
  const apenasNumeros = String(v || '').replace(/\D/g, '')
  
  // 2. Converte para o valor real (ex: 15 vira 0.15)
  const valorNumerico = apenasNumeros ? Number(apenasNumeros) / 100 : 0
  
  // 3. Atualiza o formulário (para o banco de dados)
  form.value.valor_unitario = valorNumerico

  // 4. ATUALIZA A TELA (Faz o "15" virar "0,15" na hora)
  // Usamos um if para evitar um loop infinito
  const formatado = maskMoneyBR(valorNumerico)
  if (v !== formatado) {
    valorUnitarioInput.value = formatado
  }
})

/* CÁLCULO DO TOTAL */
const valorTotalMask = computed(() => {
  const qtd = Number(form.value.quantidade || 0)
  const unit = Number(form.value.valor_unitario || 0)
  const total = qtd * unit
  
  form.value.valor_total = total
  return maskMoneyBR(total)
})

async function carregarFornecedores() {
  try {
    const { data } = await api.get('/fornecedores')
    fornecedores.value = data
  } catch (err) {
    console.error('Erro ao carregar fornecedores:', err)
  }
}

async function salvar() {
  if (!form.value.fornecedor_id) {
    alert('Selecione um fornecedor')
    return
  }

  salvando.value = true
  try {
    await api.post('/produtos', {
      ...form.value,
      fornecedor_id: Number(form.value.fornecedor_id),
    })
    alert('Produto cadastrado com sucesso!')
    router.push('/produtos')
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao salvar produto')
  } finally {
    salvando.value = false
  }
}

onMounted(() => {
  carregarFornecedores()
  // Inicializa o campo de valor com 0,00
  valorUnitarioInput.value = maskMoneyBR(0)
})
</script>