<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    
    <Card :shadow="true" class="overflow-visible !rounded-[3rem] border-none shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)]">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-10 border-b border-slate-50 bg-slate-50/50">
        <div class="flex items-center gap-6">
          <div class="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500">
            <i class="pi pi-box text-3xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-black tracking-tighter text-slate-800 uppercase italic leading-none">
              {{ isEdit ? 'Editar Produto' : 'Novo Produto' }}
            </h2>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Cadastro de Insumos e Materiais</p>
          </div>
        </div>

        <button 
          @click="confirmarDescartarProduto"
          class="flex items-center gap-3 px-6 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm group"
        >
          <i class="pi pi-arrow-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
          <span class="text-[10px] font-black uppercase tracking-widest">Lista de Produtos</span>
        </button>
      </header>

      <div class="p-10 relative">
        <div v-if="loading" class="py-20 flex flex-col items-center justify-center gap-4">
          <div class="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando Dados...</p>
        </div>

        <form v-else class="grid grid-cols-12 gap-8" @submit.prevent="confirmarSalvarProduto">
          
          <div class="col-span-12">
            <h3 class="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-6 flex items-center gap-3">
              <span class="w-10 h-[3px] bg-emerald-600 rounded-full"></span>
              Identificação Básica
            </h3>
          </div>

          <div class="col-span-12 md:col-span-8">
            <SearchInput
              v-model="form.fornecedor_id"
              mode="select"
              label="Fornecedor Principal *"
              :options="fornecedorOptions"
              required
            />
          </div>

          <div class="col-span-12 md:col-span-4">
            <SearchInput
              v-model="form.status"
              mode="select"
              label="Status do Cadastro *"
              :options="statusOptions"
              required
            />
          </div>

          <div class="col-span-12 md:col-span-9">
            <Input v-model="form.nome_produto" label="Nome Descritivo do Produto *" placeholder="Ex: Chapa de MDF 18mm Branco" required />
          </div>

          <div class="col-span-12 md:col-span-3">
            <SearchInput
              v-model="form.unidade"
              mode="select"
              label="Unidade de Medida *"
              :options="unidadesOptions"
              required
            />
          </div>

          <div class="col-span-12 mt-4">
            <h3 class="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-3">
              <span class="w-10 h-[1px] bg-slate-200 rounded-full"></span>
              Atributos Técnicos
            </h3>
          </div>

          <div class="col-span-12 md:col-span-4">
            <Input v-model="form.marca" label="Marca / Fabricante" placeholder="Marca do material" />
          </div>

          <div class="col-span-12 md:col-span-4">
            <Input v-model="form.cor" label="Cor / Acabamento" placeholder="Ex: Carvalho Natural" />
          </div>

          <div class="col-span-12 md:col-span-4">
            <Input v-model="form.medida" label="Dimensões / Espessura" placeholder="Ex: 2750x1840mm" />
          </div>

          <div class="col-span-12 mt-8 bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100">
            <div class="grid grid-cols-12 gap-8">
              <div class="col-span-12">
                <h3 class="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Valores e Quantidades</h3>
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Dados para controle de custos e saldo inicial</p>
              </div>

              <div class="col-span-12 md:col-span-4">
                <Input v-model="quantidadeInput" label="Quantidade em Estoque" inputmode="numeric" required />
              </div>

              <div class="col-span-12 md:col-span-4">
                <Input v-model="valorUnitarioMask" label="Valor de Custo (Unit.)" inputmode="numeric" required />
              </div>

              <div class="col-span-12 md:col-span-4">
                <div class="flex flex-col justify-end h-full">
                  <div class="h-14 px-6 bg-white border border-slate-200 rounded-2xl flex flex-col justify-center">
                    <span class="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor de Inventário Total</span>
                    <span class="text-lg font-black text-slate-900 tabular-nums italic">{{ valorTotalMask }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-12 flex items-center justify-end gap-6 pt-10 mt-6 border-t border-slate-50">
            <button 
              type="button" 
              @click="router.push('/produtos')"
              class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-rose-500 transition-colors"
            >
              Descartar
            </button>

            <Button 
              variant="primary" 
              type="submit" 
              :loading="salvando"
              class="!h-16 !px-12 !rounded-2xl shadow-2xl shadow-slate-900/20 bg-slate-900 hover:bg-black font-black text-[11px] uppercase tracking-[0.2em]"
            >
              <i class="pi pi-check-circle mr-3"></i>
              {{ isEdit ? 'Salvar Alterações' : 'Finalizar Cadastro' }}
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
import { maskMoneyBR } from '@/utils/masks'
import { UNIDADES } from '@/constantes'
import { ProdutosService, FornecedorService } from '@/services/index'
import { confirm } from '@/services/confirm'

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

async function confirmarSalvarProduto() {
  const ok = await confirm.show(
    isEdit.value ? 'Salvar Alterações' : 'Finalizar Cadastro',
    isEdit.value
      ? `Deseja salvar as alterações do Produto #${produtoId.value}?`
      : 'Deseja finalizar o cadastro deste produto?',
  )
  if (!ok) return
  await salvar()
}

async function confirmarDescartarProduto() {
  const ok = await confirm.show(
    'Descartar',
    'Deseja sair sem salvar? As alterações serão perdidas.',
  )
  if (!ok) return
  router.push('/produtos')
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
