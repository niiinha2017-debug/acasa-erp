<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    
    <Card :shadow="true" class="overflow-visible !rounded-[3rem] border-none shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)]">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-10 border-b border-slate-100 bg-slate-50/50">
        <div class="flex items-center gap-6">
          <div class="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-900/20 rotate-3 hover:rotate-0 transition-transform duration-500">
            <i class="pi pi-box text-3xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-black tracking-tighter text-slate-800 uppercase italic leading-none">
              {{ isEdit ? `Plano de Corte #${planoId}` : 'Novo Plano de Corte' }}
            </h2>
            <div class="flex items-center gap-2 mt-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ordem de Industrialização / Venda</p>
            </div>
          </div>
        </div>

        <button 
          @click="router.back()" 
          class="flex items-center gap-3 px-6 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm group"
        >
          <i class="pi pi-arrow-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
          <span class="text-[10px] font-black uppercase tracking-widest">Painel Geral</span>
        </button>
      </header>

      <div class="p-10">
        <template v-if="!loading">
          <section class="grid grid-cols-12 gap-8 mb-12">
            <div class="col-span-12 md:col-span-6">
<SearchInput
  v-model="fornecedorSelecionado"
  mode="select"
  label="Fornecedor Destinatário"
  :options="fornecedorOptions"
  required
  @update:modelValue="onSelecionarFornecedor"
/>

            </div>

            <div class="col-span-12 md:col-span-3">
              <Input v-model="dataVenda" label="Data do Pedido" type="date" required />
            </div>

            <div class="col-span-12 md:col-span-3">
<SearchInput
  v-model="statusPlano"
  mode="select"
  label="Status da Venda"
  :options="statusPlanoOptions"
  :readonly="isEdit"
/>

            </div>
          </section>

          <section class="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 shadow-inner mb-10">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">Adicionar Insumos ao Plano</h3>
<button
  v-if="can(permSalvarPlano())"
  type="button"
  @click="abrirModalProduto()"
  class="text-[10px] font-black uppercase text-emerald-600 hover:tracking-widest transition-all italic"
>
  + Cadastrar Novo Produto
</button>

            </div>

            <div class="grid grid-cols-12 gap-6 items-end">
              <div class="col-span-12 md:col-span-5">
<SearchInput
  v-model="itemNovo.item_id"
  mode="select"
  label="Produto / Material"
  :options="produtoOptions"
  @update:modelValue="onSelecionarProdutoNovo"
/>

              </div>
              <div class="col-span-6 md:col-span-2">
                <Input v-model="itemNovo.quantidade" label="Quantidade" placeholder="0" type="number" />
              </div>
              <div class="col-span-6 md:col-span-2">
                <Input v-model="itemNovo.valorUnitarioMask" label="Vl. Unitário (Custo)" />
              </div>
              
              <div class="col-span-12 md:col-span-3">
                <div class="flex items-center gap-3">
                  <div class="flex-1 px-4 h-14 rounded-2xl bg-white border border-slate-200 flex flex-col justify-center">
                    <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Item</span>
                    <span class="text-sm font-black text-emerald-600">{{ itemNovoTotalExibicao }}</span>
                  </div>
<Button
  v-if="can(permSalvarPlano())"
  variant="primary"
  class="!h-14 !w-14 !rounded-2xl shadow-xl shadow-slate-900/20"
  :disabled="!podeAdicionarItem"
  @click="registrarItemNovo()"
>
  <i class="pi pi-plus text-lg"></i>
</Button>

                </div>
              </div>
            </div>
          </section>

          <Table
            :columns="columnsItens"
            :rows="itens"
            class="premium-table"
            empty-text="Nenhum item adicionado."
          >
            <template #cell-produto="{ row }">
              <div class="flex flex-col">
                <span class="font-black text-slate-700 uppercase italic tracking-tighter">{{ row.item?.nome_produto }}</span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                   {{ row.item?.cor || 'PADRÃO' }} • {{ row.item?.marca || 'MARCA NÃO INFO.' }}
                </span>
              </div>
            </template>

            <template #cell-valor_unitario="{ row }">
              <span class="font-bold text-slate-500 text-xs">{{ maskMoneyBR(row.valor_unitario || 0) }}</span>
            </template>

            <template #cell-valor_total="{ row }">
              <span class="font-black text-slate-800">{{ maskMoneyBR(row.valor_total || 0) }}</span>
            </template>

            <template #cell-acoes="{ index }">
              <div class="flex justify-end">
<button
  v-if="can(permSalvarPlano())"
  @click="confirmarRemoverItemPlano(index)"
  class="w-10 h-10 rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center"
>
  <i class="pi pi-trash text-xs"></i>
</button>

              </div>
            </template>
          </Table>

          <div class="flex justify-end mt-12">
            <div class="relative group">
              <div class="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-slate-900 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div class="relative flex flex-col items-end p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl min-w-[300px]">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total da Industrialização</span>
                <span class="text-4xl font-black text-slate-900 tracking-tighter mt-2 italic">
                  {{ maskMoneyBR(totalCalculado) }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="py-40 flex flex-col items-center justify-center gap-6">
          <div class="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Sincronizando Dados...</p>
        </div>
      </div>

      <footer class="flex items-center justify-between p-10 border-t border-slate-100 bg-slate-50/50">
<Button
  v-if="isEdit && can('plano_corte.excluir')"
  variant="danger"
  @click="confirmarExcluirPlano"
  class="!rounded-2xl !px-8 !h-14 font-black text-[10px] uppercase tracking-widest"
>
  Excluir Plano
</Button>

        <div v-else></div>

        <div class="flex items-center gap-6">



<Button
  v-if="can(permSalvarPlano())"
  variant="primary"
  :loading="salvando"
  @click="salvar"
  class="!rounded-[1.5rem] !px-12 !h-14 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] font-black text-[10px] uppercase tracking-widest bg-slate-900 hover:bg-black"
>
  <i class="pi pi-check-circle mr-3"></i>
  {{ isEdit ? 'Atualizar Plano' : 'Confirmar Venda' }}
</Button>

        </div>
      </footer>
    </Card>

    <Teleport to="body">
  <Transition name="fade">
    <div
      v-if="modalProduto.aberto"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      @click.self="fecharModalProduto()"
    >
      <div class="w-full max-w-2xl max-h-[85vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        <!-- Header (PADRÃO) -->
        <header class="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div class="flex items-center gap-4">
            <div class="w-11 h-11 rounded-[1.1rem] bg-slate-900 flex items-center justify-center text-white shadow-lg">
              <i class="pi pi-box text-lg"></i>
            </div>

            <div>
              <h3 class="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">
                Novo Insumo
              </h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Cadastro rápido para este fornecedor
                </p>
              </div>
            </div>
          </div>

          <button
            class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
            @click="fecharModalProduto()"
            type="button"
          >
            <i class="pi pi-times text-xs"></i>
          </button>
        </header>

        <!-- Body (PADRÃO) -->
        <div class="p-6 overflow-y-auto">
          <form class="grid grid-cols-12 gap-x-6 gap-y-6" @submit.prevent="salvarProduto">
            <div class="col-span-12">
              <Input
                v-model="modalProduto.form.nome_produto"
                label="Nome do Produto"
                placeholder="EX: MDF BRANCO TX"
                required
              />
            </div>

            <div class="col-span-12 md:col-span-6">
              <Input
                v-model="modalProduto.form.marca"
                label="Marca / Fabricante"
                placeholder="EX: DURATEX"
              />
            </div>

            <div class="col-span-12 md:col-span-6">
              <SearchInput
                v-model="modalProduto.form.unidade"
                mode="select"
                label="Unidade Medida"
                :options="unidadesOptions"
                placeholder="SELECIONE..."
                required
              />
            </div>

            <div class="col-span-12 md:col-span-6">
              <Input
                v-model="modalProduto.form.cor"
                label="Cor / Acabamento"
                placeholder="EX: BRANCO TX"
              />
            </div>

            <div class="col-span-12 md:col-span-6">
              <Input
                v-model="modalProduto.form.medida"
                label="Espessura/Medida"
                placeholder="EX: 18MM"
              />
            </div>

            <!-- Footer (PADRÃO) -->
            <div class="col-span-12 flex items-center justify-end gap-4 pt-6 border-t border-slate-100 mt-2">
              <button
                type="button"
                @click="fecharModalProduto()"
                class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>

              <Button
                variant="primary"
                type="submit"
                :loading="modalProduto.salvando"
                class="!h-12 !rounded-[1.2rem] !px-8 shadow-xl shadow-brand-primary/20 font-black text-[10px] uppercase tracking-widest"
              >
                <i class="pi pi-check-circle mr-3"></i>
                Cadastrar e Usar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { maskMoneyBR } from '@/utils/masks'
import { PlanoCorteService, FornecedorService } from '@/services/index'
import { PIPELINE_PLANO_CORTE, UNIDADES } from '@/constantes'
import { confirm } from '@/services/confirm'

import { can } from '@/services/permissions'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'plano_corte.ver' } })



const router = useRouter()
const route = useRoute()

// ID & ESTADO
const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')
const planoId = computed(() => (isEdit.value ? Number(String(rawId.value).replace(/\D/g, '')) : null))

const permSalvarPlano = () => (isEdit.value ? 'plano_corte.editar' : 'plano_corte.criar')


const loading = ref(true)
const salvando = ref(false)
const encaminhando = ref(false)

// OPÇÕES (CUIDADO: CERTIFIQUE-SE QUE constantes ESTÁ CARREGADO)
const statusPlanoOptions = computed(() =>
  (PIPELINE_PLANO_CORTE || []).map(s => ({
    label: s.label,
    value: s.key,
  }))
)


const unidadesOptions = computed(() =>
  (UNIDADES || []).map(u => ({ label: u.label, value: u.key }))
)


// CABEÇALHO
const dataVenda = ref('')
const statusPlano = ref('')
const fornecedor = ref([])
const fornecedorSelecionado = ref(null)
const fornecedorOptions = computed(() => fornecedor.value.map(f => ({ label: f.razao_social, value: f.id })))

// ITENS DO PLANO
const itensDisponiveis = ref([])
const itens = ref([])
const itemNovo = ref({ item_id: null, unidade: '', quantidade: '', valorUnitarioMask: 'R$ 0,00' })

// --- LÓGICA DE CÁLCULO DO VALOR TOTAL DO ITEM ---
const itemNovoValorTotalNumerico = computed(() => {
  const qtd = Number(itemNovo.value.quantidade) || 0
  const vUnit = Number(String(itemNovo.value.valorUnitarioMask).replace(/\D/g, '')) / 100 || 0
  return qtd * vUnit
})

const itemNovoTotalExibicao = computed(() => maskMoneyBR(itemNovoValorTotalNumerico.value))
// ------------------------------------------------

const produtoOptions = computed(() => itensDisponiveis.value.map(i => ({ label: `${i.nome_produto} ${i.cor ? `(${i.cor})` : ''}`, value: i.id })))
const podeAdicionarItem = computed(() => !!itemNovo.value.item_id && Number(itemNovo.value.quantidade) > 0)
const totalCalculado = computed(() => itens.value.reduce((acc, it) => acc + (it.valor_total || 0), 0))

const columnsItens = [
  { key: 'produto', label: 'Insumo Selecionado' },
  { key: 'quantidade', label: 'Qtd', width: '100px', align: 'center' },
  { key: 'valor_unitario', label: 'Custo Unit.', width: '140px' },
  { key: 'valor_total', label: 'Total Item', width: '140px' },
  { key: 'acoes', label: '', width: '60px', align: 'right' },
]

// MÁSCARA DINÂMICA
watch(() => itemNovo.value.valorUnitarioMask, (v) => {
  const n = String(v || '').replace(/\D/g, '')
  itemNovo.value.valorUnitarioMask = maskMoneyBR(n ? Number(n) / 100 : 0)
})

// MODAL PRODUTO
const modalProduto = ref({
  aberto: false,
  salvando: false,
  form: {
    fornecedor_id: null,
    nome_produto: '',
    marca: '',
    cor: '',
    medida: '',
    unidade: 'UN',
    status: 'ATIVO',
  },
})


function abrirModalProduto() {
  if (!can(permSalvarPlano())) return notify.error('Acesso negado.')

  if (!fornecedorSelecionado.value) return
  modalProduto.value.form.fornecedor_id = Number(fornecedorSelecionado.value)
  modalProduto.value.aberto = true
}


function fecharModalProduto() {
  modalProduto.value.aberto = false
  modalProduto.value.form = {
    fornecedor_id: null,
    nome_produto: '',
    marca: '',
    cor: '',
    medida: '',
    unidade: 'UN',
    status: 'ATIVO',
  }
}


async function carregarItensDisponiveis(fId) {
  const { data } = await PlanoCorteService.itens.listar(Number(fId))
  itensDisponiveis.value = data || []
}


async function salvarProduto() {
  if (!can(permSalvarPlano())) return notify.error('Acesso negado.')

  if (!modalProduto.value.form.nome_produto?.trim()) return
  if (!modalProduto.value.form.fornecedor_id) return

  modalProduto.value.salvando = true
  try {
    const payload = {
      fornecedor_id: modalProduto.value.form.fornecedor_id,
      nome_produto: modalProduto.value.form.nome_produto.trim(),
      marca: modalProduto.value.form.marca?.trim() || null,
      cor: modalProduto.value.form.cor?.trim() || null,
      medida: modalProduto.value.form.medida?.trim() || null,
      unidade: modalProduto.value.form.unidade || null,
      status: modalProduto.value.form.status,

      // obrigatórios do plano_corte_item
      quantidade: 0,
      valor_unitario: 0,
      valor_total: 0,
    }

    const { data } = await PlanoCorteService.itens.salvar(null, payload)

    await carregarItensDisponiveis(fornecedorSelecionado.value)

    // “Cadastrar e usar”
    itemNovo.value.item_id = data.id
    itemNovo.value.unidade = data.unidade || ''

    fecharModalProduto()
  } finally {
    modalProduto.value.salvando = false
  }
}


// excluir plano (confirm)
async function confirmarExcluirPlano() {
  if (!can('plano_corte.excluir')) return notify.error('Acesso negado.')

  if (!isEdit.value) return

  const ok = await confirm.show(
    'Excluir Plano de Corte',
    `Deseja excluir permanentemente o Plano de Corte #${planoId.value}? Esta ação não pode ser desfeita.`,
  )
  if (!ok) return

  salvando.value = true
  try {
    await PlanoCorteService.excluir(planoId.value)
    router.push('/plano-corte')
  } finally {
    salvando.value = false
  }
}

// AÇÕES
async function onSelecionarFornecedor(v) {
  fornecedorSelecionado.value = v
  if (v) await carregarItensDisponiveis(v)
  itens.value = []
  limparItemNovo()
}

function planoKey(key) {
  const k = PIPELINE_PLANO_CORTE.find(p => p.key === key)?.key
  if (!k) throw new Error(`PIPELINE_PLANO_CORTE key não encontrada: ${key}`)
  return k
}


function onSelecionarProdutoNovo(v) {
  const itemId = Number(v)
  const item = itensDisponiveis.value.find(i => Number(i.id) === itemId)
  itemNovo.value.unidade = item?.unidade || ''
}


function limparItemNovo() { itemNovo.value = { item_id: null, unidade: '', quantidade: '', valorUnitarioMask: 'R$ 0,00' } }

// remover item (confirm)
async function confirmarRemoverItemPlano(index) {
  if (!can(permSalvarPlano())) return notify.error('Acesso negado.')

  const row = itens.value?.[index]
  const nome = row?.item?.nome_produto || 'ITEM'

  const ok = await confirm.show('Remover Item', `Deseja remover "${nome}" deste plano?`)
  if (!ok) return

  removerItem(index)
}

function removerItem(index) {
  if (!can(permSalvarPlano())) return notify.error('Acesso negado.')
  itens.value.splice(index, 1)
}

// adicionar item
function registrarItemNovo() {
  if (!can(permSalvarPlano())) return notify.error('Acesso negado.')

  const itemId = Number(itemNovo.value.item_id)
  const item = itensDisponiveis.value.find(i => Number(i.id) === itemId)
  if (!item) return

  // 1. Calcule os valores ANTES de limpar o formulário
  const qtd = Number(itemNovo.value.quantidade) || 0
  const vUnit = Number(String(itemNovo.value.valorUnitarioMask).replace(/\D/g, '')) / 100 || 0
  const vTotal = Number((qtd * vUnit).toFixed(2)) // Força 2 casas decimais

  // 2. Adicione ao array com os valores calculados manualmente
  itens.value.push({
    item_id: item.id,
    item: { 
      nome_produto: item.nome_produto, 
      cor: item.cor, 
      marca: item.marca 
    },
    quantidade: qtd,
    valor_unitario: vUnit,
    valor_total: vTotal, // <--- Valor estático e seguro
    status: 'ATIVO'
  })

  limparItemNovo()
}



async function salvar() {
  const perm = permSalvarPlano()
  if (!can(perm)) return notify.error('Acesso negado.')

  salvando.value = true
  try {
const payload = {
  fornecedor_id: Number(fornecedorSelecionado.value),
  data_venda: dataVenda.value,
  produtos: itens.value,
  ...(isEdit.value ? {} : { status: statusPlano.value }),
}


    await PlanoCorteService.salvar(isEdit.value ? planoId.value : null, payload)
    router.push('/plano-corte')
  } finally { salvando.value = false }
}

onMounted(async () => {
  loading.value = true
  try {
    const { data: fData } = await FornecedorService.listar()
    fornecedor.value = fData || []


    if (isEdit.value) {
      const { data } = await PlanoCorteService.buscar(planoId.value)

      fornecedorSelecionado.value = data.fornecedor_id ?? null
      statusPlano.value = data.status ?? ''

      dataVenda.value = data.data_venda?.slice(0, 10) || ''

      itens.value = (data.produtos || []).map(p => ({
        ...p,
        quantidade: Number(p.quantidade) || 0,
        valor_unitario: Number(p.valor_unitario) || 0,
        valor_total: Number(p.valor_total) || 0,
      }))

      if (data.fornecedor_id) await carregarItensDisponiveis(data.fornecedor_id)
    } else {
      dataVenda.value = new Date().toISOString().slice(0, 10)
      statusPlano.value = planoKey('EM_ABERTO')

    }
  } catch (err) {
  } finally {
    loading.value = false
  }
})

</script>