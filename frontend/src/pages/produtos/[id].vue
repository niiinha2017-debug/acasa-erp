<template>
  <div class="page-container">
    <Card>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">{{ isEdit ? 'Editar Produto' : 'Novo Produto' }}</h2>
          <p class="muted" style="margin: 0;">
            {{ isEdit ? 'Atualize os dados do produto abaixo.' : 'Cadastre um novo produto abaixo.' }}
          </p>
        </div>

        <Button variant="outline" size="sm" type="button" @click="router.push('/produtos')">
          Voltar
        </Button>
      </header>

      <div class="card-body">
        <form class="form-grid" @submit.prevent="salvar">
          <SearchInput
            v-model="form.fornecedor_id"
            label="Fornecedor *"
            :options="fornecedoresOptions"
            required
            class="col-span-12"
          />

          <Input v-model="form.nome_produto" label="Nome do Produto *" required class="col-span-8" />
          <Input v-model="form.status" label="Status *" required class="col-span-4" />

          <Input v-model="form.marca" label="Marca" class="col-span-4" />
          <Input v-model="form.cor" label="Cor" class="col-span-4" />
          <Input v-model="form.medida" label="Medida" class="col-span-4" />

          <!-- ✅ UNIDADE das CONSTANTES -->
          <SearchInput
            v-model="form.unidade"
            label="Unidade *"
            :options="unidadesOptions"
            required
            class="col-span-4"
          />

          <Input v-model="quantidadeMask" label="Quantidade *" required inputmode="numeric" class="col-span-4" />
          <Input v-model="valorUnitarioInput" label="Valor Unitário *" required inputmode="numeric" class="col-span-4" />
          <Input :model-value="valorTotalMask" label="Valor Total" readonly class="col-span-4" />

          <div class="col-span-12 container-botoes">
            <Button variant="secondary" type="button" @click="router.push('/produtos')">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" :loading="salvando">
              {{ isEdit ? 'Salvar Alterações' : 'Salvar' }}
            </Button>
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
import { maskMoneyBR } from '@/utils/masks'
import { useConstantes } from '@/composables/useConstantes'

import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => id.value !== 'novo')

const salvando = ref(false)
const fornecedores = ref([])
const valorUnitarioInput = ref('0,00')

/** ✅ Constantes: CHAVE = UNIDADE */
const uni = useConstantes()
const unidadesOptions = computed(() => uni.opcoes.value || [])

const form = ref({
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
})

const fornecedoresOptions = computed(() =>
  fornecedores.value.map(f => ({ value: f.id, label: f.razao_social }))
)

const quantidadeMask = computed({
  get: () => (form.value.quantidade === 0 ? '' : String(form.value.quantidade)),
  set: v => {
    const n = String(v || '').replace(/\D/g, '')
    form.value.quantidade = n ? Number(n) : 0
  },
})

watch(valorUnitarioInput, (v) => {
  const apenasNumeros = String(v || '').replace(/\D/g, '')
  const valorNumerico = apenasNumeros ? Number(apenasNumeros) / 100 : 0

  form.value.valor_unitario = valorNumerico

  const formatado = maskMoneyBR(valorNumerico)
  if (v !== formatado) valorUnitarioInput.value = formatado
})

const valorTotalMask = computed(() => {
  const total = Number(form.value.quantidade || 0) * Number(form.value.valor_unitario || 0)
  form.value.valor_total = total
  return maskMoneyBR(total)
})

function validarObrigatorios() {
  if (!form.value.fornecedor_id) return 'Selecione o fornecedor.'
  if (!form.value.nome_produto) return 'Informe o nome do produto.'
  if (!form.value.unidade) return 'Selecione a unidade.'
  if (!form.value.quantidade) return 'Informe a quantidade.'
  if (!form.value.valor_unitario) return 'Informe o valor unitário.'
  if (!form.value.status) return 'Informe o status.'
  return null
}

function resetForm() {
  form.value = {
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
  }
  valorUnitarioInput.value = '0,00'
}

async function carregarFornecedores() {
  const res = await api.get('/fornecedores')
  fornecedores.value = res.data
}

async function carregarProduto() {
  const { data } = await api.get(`/produtos/${id.value}`)
  form.value = { ...form.value, ...data }
  valorUnitarioInput.value = maskMoneyBR(Number(data.valor_unitario || 0))
}

async function salvar() {
  const erro = validarObrigatorios()
  if (erro) return alert(erro)

  salvando.value = true
  try {
    const payload = {
      ...form.value,
      fornecedor_id: Number(form.value.fornecedor_id),
      quantidade: Number(form.value.quantidade || 0),
      valor_unitario: Number(form.value.valor_unitario || 0),
      valor_total: Number(form.value.valor_total || 0),
      unidade: form.value.unidade ? String(form.value.unidade) : null,
      marca: form.value.marca ? String(form.value.marca) : null,
      cor: form.value.cor ? String(form.value.cor) : null,
      medida: form.value.medida ? String(form.value.medida) : null,
    }

    if (isEdit.value) {
      await api.put(`/produtos/${id.value}`, payload)  // ✅ PUT atualiza
      alert('Produto atualizado com sucesso!')
    } else {
      await api.post('/produtos', payload)            // ✅ POST cria
      alert('Produto cadastrado com sucesso!')
    }

    router.push('/produtos')
  } catch (err) {
    console.error(err)
    alert(err?.response?.data?.message || 'Erro ao salvar.')
  } finally {
    salvando.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      carregarFornecedores(),
      uni.carregarCategoria('UNIDADE'),
    ])

    if (isEdit.value) await carregarProduto()
    else resetForm()
  } catch (err) {
    console.error(err)
    alert('Erro ao carregar dados.')
    router.push('/produtos')
  }
})
</script>
