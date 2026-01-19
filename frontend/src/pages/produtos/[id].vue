<template>
  <Card :shadow="true">
    <PageHeader
      :title="isEdit ? 'Editar Produto' : 'Novo Produto'"
      subtitle="Cadastro de produtos"
      icon="pi pi-box"
      :backTo="'/produtos'"
    />

    <div class="p-6 relative">
      <Loading v-if="loading" />

      <form v-else class="grid grid-cols-12 gap-4" @submit.prevent="salvar">
        <!-- FORNECEDOR -->
        <div class="col-span-12">
          <SearchInput
            v-model="form.fornecedor_id"
            mode="select"
            label="Fornecedor *"
            :options="fornecedorOptions"
            required
          />
        </div>

        <!-- NOME / STATUS -->
        <div class="col-span-12 md:col-span-8">
          <Input v-model="form.nome_produto" label="Nome do Produto *" required />
        </div>

        <div class="col-span-12 md:col-span-4">
          <SearchInput
            v-model="form.status"
            mode="select"
            label="Status *"
            :options="statusOptions"
            required
          />
        </div>

        <!-- MARCA / COR / MEDIDA -->
        <div class="col-span-12 md:col-span-4">
          <Input v-model="form.marca" label="Marca" />
        </div>

        <div class="col-span-12 md:col-span-4">
          <Input v-model="form.cor" label="Cor" />
        </div>

        <div class="col-span-12 md:col-span-4">
          <Input v-model="form.medida" label="Medida" />
        </div>

        <!-- UNIDADE -->
        <div class="col-span-12 md:col-span-4">
<SearchInput
  v-model="form.unidade"
  mode="select"
  label="Unidade *"
  :options="unidadesOptions"
  required
/>

        </div>

        <!-- QTD / VALOR UNIT / TOTAL -->
        <div class="col-span-12 md:col-span-4">
          <Input v-model="quantidadeInput" label="Quantidade *" inputmode="numeric" required />
        </div>

        <div class="col-span-12 md:col-span-4">
          <Input v-model="valorUnitarioMask" label="Valor Unitário *" inputmode="numeric" required />
        </div>

        <div class="col-span-12 md:col-span-4">
          <Input :model-value="valorTotalMask" label="Valor Total" readonly />
        </div>

        <div class="col-span-12">
          <div class="h-px w-full bg-gray-100"></div>
        </div>

        <div class="col-span-12 flex items-center justify-end gap-3">
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
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { maskMoneyBR } from '@/utils/masks'
import { UNIDADES } from '@/constantes'
import { ProdutosService, FornecedorService } from '@/services/index'

const route = useRoute()
const router = useRouter()

const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')
const produtoId = computed(() => (isEdit.value ? Number(String(rawId.value).replace(/\D/g, '')) : null))

const loading = ref(false)
const salvando = ref(false)

const fornecedor = ref([])
const fornecedorOptions = computed(() =>
  (fornecedor.value || []).map(f => ({ label: f.razao_social, value: f.id }))
)

const statusOptions = [
  { label: 'ATIVO', value: 'ATIVO' },
  { label: 'INATIVO', value: 'INATIVO' },
]

// ======= FORM (estado numérico) =======
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

// ======= Inputs auxiliares (máscaras) =======
const quantidadeInput = ref('')
const valorUnitarioMask = ref('R$ 0,00')

const valorTotalNumerico = computed(() => {
  const qtd = Number(form.value.quantidade || 0)
  const v = Number(form.value.valor_unitario || 0)
  return qtd * v
})

watch(valorTotalNumerico, (t) => {
  form.value.valor_total = t
})

const valorTotalMask = computed(() => maskMoneyBR(valorTotalNumerico.value))

watch(quantidadeInput, (v) => {
  const n = String(v || '').replace(/\D/g, '')
  form.value.quantidade = n ? Number(n) : 0
  if (v !== n) quantidadeInput.value = n
})

watch(valorUnitarioMask, (v) => {
  const n = String(v || '').replace(/\D/g, '')
  const valor = n ? Number(n) / 100 : 0
  form.value.valor_unitario = valor

  const formatado = maskMoneyBR(valor)
  if (v !== formatado) valorUnitarioMask.value = formatado
})

// ======= UNIDADES (constantes) =======
// robusto: tenta achar opções que representem unidades dentro da categoria MODULO
const unidadesOptions = computed(() =>
  UNIDADES.map(u => ({ label: u.label, value: u.key }))
)


// ======= CRUD =======
function validar() {
  if (!form.value.fornecedor_id) return 'Selecione o fornecedor.'
  if (!form.value.nome_produto) return 'Informe o nome do produto.'
  if (!form.value.unidade) return 'Selecione a unidade.'
  if (!form.value.quantidade || Number(form.value.quantidade) <= 0) return 'Informe a quantidade.'
  if (!form.value.valor_unitario || Number(form.value.valor_unitario) <= 0) return 'Informe o valor unitário.'
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
  quantidadeInput.value = ''
  valorUnitarioMask.value = 'R$ 0,00'
}

async function carregarFornecedor() {
  const { data } = await FornecedorService.listar()
  fornecedor.value = data || []
}

async function carregarProduto() {
  const { data } = await ProdutosService.buscar(produtoId.value)
  form.value = {
    ...form.value,
    ...data,
    fornecedor_id: data.fornecedor_id ?? null,
    quantidade: Number(data.quantidade || 0),
    valor_unitario: Number(data.valor_unitario || 0),
    valor_total: Number(data.valor_total || 0),
    status: data.status || 'ATIVO',
  }

  quantidadeInput.value = form.value.quantidade ? String(form.value.quantidade) : ''
  valorUnitarioMask.value = maskMoneyBR(form.value.valor_unitario || 0)
}

async function salvar() {
  const erro = validar()
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

    await ProdutosService.salvar(isEdit.value ? produtoId.value : null, payload)
    router.push('/produtos')
  } catch (err) {
    console.error(err)
    alert(err?.response?.data?.message || 'Erro ao salvar.')
  } finally {
    salvando.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await carregarFornecedor()

    if (isEdit.value) {
      await carregarProduto()
    } else {
      resetForm()
    }
  } catch (err) {
    console.error('[PRODUTOS] erro no mounted:', err)
    alert('Erro ao carregar dados iniciais.')
    router.push('/produtos')
  } finally {
    loading.value = false
  }
})

</script>
