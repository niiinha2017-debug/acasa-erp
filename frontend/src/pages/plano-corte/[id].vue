<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-700">
    
    <Card :shadow="true" class="overflow-visible !rounded-[2.5rem]">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 p-8 border-b border-[var(--border-ui)] bg-slate-500/5">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-brand-primary flex items-center justify-center text-white shadow-2xl shadow-brand-primary/20 transition-all">
            <i class="pi pi-box text-2xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-black tracking-tight text-[var(--text-main)] uppercase leading-tight">
              {{ isEdit ? `Plano de Corte #${planoId}` : 'Novo Plano de Corte' }}
            </h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Gestão de Produção e Industrialização</p>
          </div>
        </div>

        <Button variant="secondary" @click="router.back()" class="!rounded-xl !px-6 !h-10 border-[var(--border-ui)]">
          <i class="pi pi-arrow-left mr-2 text-[10px]"></i>
          Voltar
        </Button>
      </header>

      <div class="p-8">
        <template v-if="!loading">
          <section class="grid grid-cols-12 gap-6 mb-10">
            <div class="col-span-12">
              <h3 class="text-[11px] font-black uppercase tracking-[0.25em] text-brand-primary mb-4 flex items-center gap-2">
                <span class="w-8 h-[2px] bg-brand-primary/20"></span>
                Dados do Cabeçalho
              </h3>
            </div>

            <div class="col-span-12 md:col-span-6">
              <SearchInput
                v-model="fornecedorSelecionado"
                label="Fornecedor *"
                :options="fornecedorOptions"
                required
                @update:modelValue="onSelecionarFornecedor"
              />
            </div>

            <div class="col-span-12 md:col-span-3">
              <Input v-model="dataVenda" label="Data *" type="date" required />
            </div>

            <div class="col-span-12 md:col-span-3">
<SearchInput
  v-model="statusPlano"
  mode="select"
  label="Status *"
  :options="statusPlanoOptions"
  labelKey="label"
  valueKey="value"
  required
/>

            </div>
          </section>

          <section class="bg-slate-500/5 dark:bg-slate-900/40 rounded-[2rem] p-6 border border-[var(--border-ui)] transition-all">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Registrar Item</h3>
              <button 
                type="button" 
                @click="abrirModalProduto()"
                class="text-[10px] font-black uppercase text-brand-primary hover:tracking-widest transition-all"
              >
                + Novo Produto
              </button>
            </div>

            <div class="grid grid-cols-12 gap-5">
              <div class="col-span-12 md:col-span-3">
                <SearchInput
                  v-model="itemNovo.item_id"
                  label="Produto *"
                  :options="produtoOptions"
                  @update:modelValue="onSelecionarProdutoNovo"
                />
              </div>
              <div class="col-span-4 md:col-span-1">
                <Input v-model="itemNovo.unidade" label="Unidade" readonly class="opacity-60" />
              </div>
              <div class="col-span-4 md:col-span-2">
                <Input v-model="itemNovo.quantidade" label="Qtd *" placeholder="0" type="number" />
              </div>
              <div class="col-span-4 md:col-span-2">
                <Input v-model="itemNovo.valorUnitarioMask" label="Valor Unit. *" />
              </div>
              
              <div class="col-span-12 md:col-span-2">
                <Input :model-value="itemNovoTotalExibicao" label="Valor Total" readonly class="font-bold text-brand-primary" />
              </div>

              <div class="col-span-12 md:col-span-2 flex items-end">
                <Button 
                  variant="primary" 
                  class="w-full !h-11 !rounded-2xl shadow-xl shadow-brand-primary/20"
                  :disabled="!podeAdicionarItem" 
                  @click="registrarItemNovo()"
                >
                  <i class="pi pi-plus-circle mr-2"></i>
                  Adicionar
                </Button>
              </div>
            </div>
          </section>

          <div class="mt-10">
            <Table
              :columns="columnsItens"
              :rows="itens"
              :loading="false"
              :boxed="true"
              empty-text="Nenhum item adicionado."
            >
              <template #cell-produto="{ row }">
                <div class="flex flex-col">
                  <span class="font-black text-[var(--text-main)] uppercase">{{ row.item?.nome_produto || 'Item' }}</span>
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{{ row.item?.cor || 'COR NÃO INFO.' }}</span>
                </div>
              </template>

              <template #cell-valor_unitario="{ row }">
                <span class="font-bold text-slate-500">{{ maskMoneyBR(row.valor_unitario || 0) }}</span>
              </template>

              <template #cell-valor_total="{ row }">
                <span class="font-black text-brand-primary">{{ maskMoneyBR(row.valor_total || 0) }}</span>
              </template>

              <template #cell-acoes="{ index }">
                <div class="flex justify-end">
                  <button @click="removerItem(index)" class="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                    <i class="pi pi-trash text-xs"></i>
                  </button>
                </div>
              </template>
            </Table>

            <div class="flex justify-end mt-6 pr-8">
              <div class="flex flex-col items-end p-6 rounded-[2rem] bg-slate-500/5 border border-[var(--border-ui)]">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Geral do Plano</span>
                <span class="text-3xl font-black text-[var(--text-main)] tracking-tighter mt-1">
                  {{ maskMoneyBR(totalCalculado) }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="py-32 flex flex-col items-center justify-center gap-4">
          <div class="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sincronizando Base de Dados...</p>
        </div>
      </div>

      <footer class="flex items-center justify-between p-8 border-t border-[var(--border-ui)] bg-slate-500/5">
        <Button v-if="isEdit" variant="danger" @click="excluir" class="!rounded-2xl !px-8">
          Excluir Registro
        </Button>
        <div v-else></div>

        <div class="flex items-center gap-4">
          <Button v-if="isEdit" variant="secondary" :loading="encaminhando" class="!rounded-2xl !px-8 !h-12 border-[var(--border-ui)]" @click="encaminharParaProducao">
             Produção
          </Button>
          <Button variant="primary" :loading="salvando" @click="salvar" class="!rounded-2xl !px-10 !h-12 shadow-2xl shadow-brand-primary/30">
            <i class="pi pi-check-circle mr-2"></i>
            {{ isEdit ? 'Salvar Alterações' : 'Finalizar Plano' }}
          </Button>
        </div>
      </footer>
    </Card>

    <Transition name="fade">
      <div v-if="modalProduto.aberto" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" @click.self="fecharModalProduto()">
        <div class="w-full max-w-3xl bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-ui)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <header class="flex items-start justify-between p-8 border-b border-[var(--border-ui)] bg-slate-500/5">
            <div>
              <h3 class="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Novo Produto</h3>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cadastro Rápido de Insumo</p>
            </div>
            <button @click="fecharModalProduto()" class="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-ui)] text-slate-400 hover:text-red-500 transition-all">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <div class="p-10">
            <form class="grid grid-cols-12 gap-5" @submit.prevent="salvarProduto">
              <div class="col-span-12">
                <SearchInput v-model="modalProduto.form.fornecedor_id" label="Fornecedor *" :options="fornecedorOptions" required />
              </div>
              <div class="col-span-12 md:col-span-8">
                <Input v-model="modalProduto.form.nome_produto" label="Nome do Produto *" required />
              </div>
              <div class="col-span-12 md:col-span-4">
                <SearchInput v-model="modalProduto.form.unidade" label="Unidade *" :options="unidadesOptions" required />
              </div>
              <div class="col-span-12 flex justify-end gap-3 pt-8 border-t border-[var(--border-ui)] mt-4">
                <Button variant="secondary" type="button" @click="fecharModalProduto()">Cancelar</Button>
                <Button variant="primary" type="submit" :loading="modalProduto.salvando" class="!px-8">Cadastrar e Usar</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { maskMoneyBR } from '@/utils/masks'
import { useConstantes } from '@/composables/useConstantes'
import { PlanoCorteService, FornecedorService } from '@/services/index'

const router = useRouter()
const route = useRoute()
const constantes = useConstantes()

// ID & ESTADO
const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')
const planoId = computed(() => (isEdit.value ? Number(String(rawId.value).replace(/\D/g, '')) : null))

const loading = ref(false)
const salvando = ref(false)
const encaminhando = ref(false)

// OPÇÕES (CUIDADO: CERTIFIQUE-SE QUE constantes ESTÁ CARREGADO)
const statusPlanoOptions = computed(() =>
  constantes.opcoes.value
    .filter(o => o.metadata?.categoria === 'STATUS_PLANO_CORTE')
    .map(o => ({ label: o.label, value: o.value })) // value = KEY (EM_ABERTO etc.)
)

const unidadesOptions = computed(() => constantes.opcoes.value.filter(o => o.metadata?.categoria === 'MODULO' && o.value === 'UNIDADE').map(o => ({ label: o.label, value: o.label })))

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
  { key: 'produto', label: 'Produto / Insumo' },
  { key: 'quantidade', label: 'Qtd', width: '90px', align: 'center' },
  { key: 'valor_unitario', label: 'Vl. Unitário', width: '150px' },
  { key: 'valor_total', label: 'Vl. Total', width: '150px' },
  { key: 'acoes', label: '', width: '80px', align: 'right' },
]

// MÁSCARA DINÂMICA
watch(() => itemNovo.value.valorUnitarioMask, (v) => {
  const n = String(v || '').replace(/\D/g, '')
  itemNovo.value.valorUnitarioMask = maskMoneyBR(n ? Number(n) / 100 : 0)
})

// MODAL PRODUTO
const modalProduto = ref({ aberto: false, salvando: false, form: { fornecedor_id: null, nome_produto: '', unidade: 'UN', status: 'ATIVO' } })

function abrirModalProduto() {
  modalProduto.value.form.fornecedor_id = fornecedorSelecionado.value
  modalProduto.value.aberto = true
}

function fecharModalProduto() {
  modalProduto.value.aberto = false
  modalProduto.value.form = { fornecedor_id: null, nome_produto: '', unidade: 'UN', status: 'ATIVO' }
}

async function salvarProduto() {
  modalProduto.value.salvando = true
  try {
    const { data } = await PlanoCorteService.itens.criar(modalProduto.value.form)
    await carregarItensDisponiveis(fornecedorSelecionado.value)
    itemNovo.value.item_id = data.id
    itemNovo.value.unidade = data.unidade
    fecharModalProduto()
  } finally { modalProduto.value.salvando = false }
}

// AÇÕES
async function onSelecionarFornecedor(v) {
  fornecedorSelecionado.value = v
  if (v) await carregarItensDisponiveis(v)
  itens.value = []
  limparItemNovo()
}

function onSelecionarProdutoNovo(v) {
  const item = itensDisponiveis.value.find(i => i.id === v)
  itemNovo.value.unidade = item?.unidade || ''
}

function limparItemNovo() { itemNovo.value = { item_id: null, unidade: '', quantidade: '', valorUnitarioMask: 'R$ 0,00' } }

function registrarItemNovo() {
  const item = itensDisponiveis.value.find(i => i.id === itemNovo.value.item_id)
  
  itens.value.push({
    item_id: item.id,
    item: { nome_produto: item.nome_produto, cor: item.cor },
    quantidade: Number(itemNovo.value.quantidade),
    valor_unitario: Number(String(itemNovo.value.valorUnitarioMask).replace(/\D/g, '')) / 100,
    valor_total: itemNovoValorTotalNumerico.value,
    status: 'ATIVO'
  })
  limparItemNovo()
}

function removerItem(index) { itens.value.splice(index, 1) }

async function carregarItensDisponiveis(fId) {
  const { data } = await PlanoCorteService.itens.listar(fId)
  itensDisponiveis.value = data || []
}

async function salvar() {
  salvando.value = true
  try {
    const payload = {
      fornecedor_id: fornecedorSelecionado.value,
      data_venda: dataVenda.value,
      status: statusPlano.value,
      produtos: itens.value
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

    await Promise.all([
      constantes.carregarCategoria('STATUS_PLANO_CORTE'),
      constantes.carregarCategoria('MODULO'),
    ])

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
      statusPlano.value = 'EM_ABERTO'
    }
  } catch (err) {
    console.error('[PLANO CORTE] erro no mounted:', err)
    console.log('[PLANO CORTE] constantes:', constantes)
    console.log('[PLANO CORTE] opcoes:', constantes?.opcoes?.value)
  } finally {
    loading.value = false
  }
})

</script>