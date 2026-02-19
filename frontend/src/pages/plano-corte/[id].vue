<template>
  <div class="login-font w-full h-full mt-4 mb-8 mx-2 lg:mx-4 rounded-2xl border border-border-ui bg-bg-card overflow-hidden animate-page-in">
    <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>
    <PageHeader
      :title="isEdit ? `Editar Plano de Corte #${planoId}` : 'Novo Plano de Corte'"
      subtitle="Ordem de industrialização e controle de produção"
      icon="pi pi-sitemap"
      :backTo="'/plano-corte'"
      class="border-b border-border-ui"
    >
      <template #actions>
        <Button
          v-if="isEdit && can('agendamentos.criar')"
          variant="secondary"
          size="sm"
          type="button"
          @click="abrirModalEnviarProducao"
        >
          <i class="pi pi-send mr-2"></i>
          Enviar para Produção
        </Button>
        <Button
          v-if="isEdit"
          variant="secondary"
          size="sm"
          :loading="gerandoPdf"
          @click="gerarPdf"
        >
          <i class="pi pi-file-pdf mr-2"></i>
          Gerar PDF
        </Button>
      </template>
    </PageHeader>

    <div class="p-8 lg:p-12">
      <Loading v-if="loading" />

      <form v-else class="space-y-10" @submit.prevent="salvar" autocomplete="off">
        <!-- Identificação (igual compras: sem venda) -->
        <div class="grid grid-cols-12 gap-6 items-end bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-2xl">
          <SearchInput
            class="col-span-12 md:col-span-5"
            v-model="fornecedorSelecionado"
            mode="select"
            label="Fornecedor *"
            :options="fornecedorOptions"
            required
            placeholder="Selecione..."
            @update:modelValue="onSelecionarFornecedor"
          />

          <Input
            class="col-span-12 md:col-span-3"
            v-model="dataPlano"
            label="Data do Plano *"
            type="date"
            required
          />

          <SearchInput
            class="col-span-12 md:col-span-4"
            v-model="statusPlano"
            mode="select"
            label="Status"
            :options="statusPlanoOptions"
            placeholder="Selecione..."
            :readonly="isEdit"
          />
        </div>

        <!-- Itens do Plano -->
        <div class="space-y-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Itens do Plano
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between gap-4">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
              Adicione os itens ao plano
            </p>
            <Button
              v-if="can(permSalvarPlano())"
              variant="ghost"
              size="sm"
              type="button"
              class="text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/5 text-brand-primary"
              @click="abrirModalProduto"
            >
              <i class="pi pi-plus-circle mr-2"></i>
              Produto não cadastrado?
            </Button>
          </div>

          <div class="grid grid-cols-12 gap-6 items-end bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-2xl border border-border-ui">
            <SearchInput
              class="col-span-12 md:col-span-6"
              v-model="itemNovo.item_id"
              mode="select"
              label="Produto / Material"
              :options="produtoOptions"
              placeholder="Selecione..."
              @update:modelValue="onSelecionarProdutoNovo"
            />
            <Input
              class="col-span-6 md:col-span-2"
              v-model="itemNovo.quantidade"
              label="Qtd"
              type="number"
              placeholder="0"
            />
            <Input
              class="col-span-6 md:col-span-4"
              v-model="itemNovo.valorUnitarioMask"
              label="Valor Unitário"
              placeholder="0,00"
            />
            <div class="col-span-12">
              <Button
                variant="primary"
                size="lg"
                class="w-full !rounded-xl"
                type="button"
                :disabled="!podeAdicionarItem"
                @click="registrarItemNovo"
              >
                ADICIONAR ITEM
              </Button>
            </div>
          </div>

          <div v-if="itens.length" class="border border-border-ui rounded-2xl overflow-hidden">
            <Table :columns="columnsItens" :rows="itens" boxed>
              <template #cell-produto="{ row }">
                <div class="py-2">
                  <div class="font-black text-slate-700 uppercase text-xs">
                    {{ row.item?.nome_produto }}
                  </div>
                  <div v-if="row.item?.cor || row.item?.marca" class="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {{ [row.item?.cor, row.item?.marca].filter(Boolean).join(' • ') }}
                  </div>
                </div>
              </template>
              <template #cell-valor_unitario="{ row }">
                <span class="text-xs font-bold text-slate-500">
                  {{ maskMoneyBR(row.valor_unitario || 0) }}
                </span>
              </template>
              <template #cell-valor_total="{ row }">
                <span class="text-sm font-black text-slate-800">
                  {{ maskMoneyBR(row.valor_total || 0) }}
                </span>
              </template>
              <template #cell-acoes="{ index }">
                <div class="flex justify-center gap-2">
                  <button
                    v-if="can(permSalvarPlano())"
                    type="button"
                    class="h-9 px-3 rounded-lg flex items-center gap-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
                    @click="confirmarRemoverItemPlano(index)"
                  >
                    <i class="pi pi-trash text-sm"></i>
                    Excluir
                  </button>
                </div>
              </template>
            </Table>
            <div class="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/20 border-t border-border-ui">
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total do Plano</span>
              <span class="text-lg font-black">{{ maskMoneyBR(totalCalculado) }}</span>
            </div>
          </div>
        </div>

        <!-- Footer (igual compras) -->
        <div class="pt-10 mt-6 border-t border-border-ui">
          <div class="flex items-center justify-between gap-4">
            <Button type="button" variant="ghost" @click="router.push('/plano-corte')">
              Cancelar
            </Button>
            <Button
              v-if="can(permSalvarPlano())"
              variant="primary"
              size="lg"
              type="submit"
              :loading="salvando"
            >
              <i class="pi pi-save mr-2 text-[12px]"></i>
              {{ isEdit ? 'ATUALIZAR PLANO' : 'SALVAR PLANO' }}
            </Button>
            <Button
              v-if="isEdit && can('plano_corte.excluir')"
              type="button"
              variant="danger"
              size="lg"
              :loading="excluindo"
              @click="confirmarExcluirPlano"
            >
              <i class="pi pi-trash mr-2 text-[12px]"></i>
              EXCLUIR
            </Button>
          </div>
        </div>
      </form>
    </div>

    <!-- Modal Novo Produto (igual estilo compras) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modalProduto.aberto"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          @click.self="fecharModalProduto"
        >
          <div class="w-full max-w-2xl bg-white dark:bg-bg-card rounded-2xl border border-border-ui overflow-hidden flex flex-col">
            <header class="flex items-center justify-between px-6 py-5 border-b border-border-ui bg-slate-50/50 dark:bg-slate-800/20">
              <h3 class="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Novo Insumo</h3>
              <button
                type="button"
                class="w-10 h-10 flex items-center justify-center rounded-xl border border-border-ui text-slate-400 hover:text-rose-500"
                @click="fecharModalProduto"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </header>
            <div class="p-6">
              <form class="grid grid-cols-12 gap-6" @submit.prevent="salvarProduto">
                <div class="col-span-12">
                  <Input v-model="modalProduto.form.nome_produto" label="Nome do Produto" placeholder="EX: MDF BRANCO TX" required />
                </div>
                <div class="col-span-12 md:col-span-6">
                  <Input v-model="modalProduto.form.marca" label="Marca" placeholder="EX: DURATEX" />
                </div>
                <div class="col-span-12 md:col-span-6">
                  <SearchInput v-model="modalProduto.form.unidade" mode="select" label="Unidade" :options="unidadesOptions" placeholder="SELECIONE..." required />
                </div>
                <div class="col-span-12 md:col-span-6">
                  <Input v-model="modalProduto.form.cor" label="Cor / Acabamento" placeholder="EX: BRANCO TX" />
                </div>
                <div class="col-span-12 md:col-span-6">
                  <Input v-model="modalProduto.form.medida" label="Espessura/Medida" placeholder="EX: 18MM" />
                </div>
                <div class="col-span-12 flex items-center justify-end gap-4 pt-4 border-t border-border-ui">
                  <button type="button" class="text-[10px] font-black uppercase text-slate-400 hover:text-slate-800" @click="fecharModalProduto">Cancelar</button>
                  <Button variant="primary" type="submit" :loading="modalProduto.salvando" class="!rounded-xl">
                    <i class="pi pi-check-circle mr-2"></i>
                    Cadastrar e Usar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Enviar para Produção -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modalEnviarProducao.aberto"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          @click.self="fecharModalEnviarProducao"
        >
          <div class="w-full max-w-md rounded-2xl border border-border-ui bg-bg-card shadow-xl overflow-hidden flex flex-col">
            <div class="h-1 w-full bg-brand-primary" />
            <header class="flex items-center justify-between px-6 py-4 border-b border-border-ui">
              <div class="flex items-center gap-3">
                <i class="pi pi-send text-2xl text-text-soft"></i>
                <div>
                  <h3 class="text-lg font-semibold text-text-main">Enviar para Produção</h3>
                  <p class="text-[10px] font-medium text-text-muted uppercase tracking-wider">Cria agendamento na agenda com este plano</p>
                </div>
              </div>
              <button type="button" class="w-9 h-9 flex items-center justify-center rounded-lg border border-border-ui text-text-muted hover:text-rose-500" @click="fecharModalEnviarProducao">
                <i class="pi pi-times text-sm"></i>
              </button>
            </header>
            <form class="p-6 space-y-4" @submit.prevent="confirmarEnviarProducao">
              <Input v-model="modalEnviarProducao.titulo" label="Título do agendamento *" placeholder="Ex: Plano de Corte #..." required />
              <div class="grid grid-cols-2 gap-4">
                <Input v-model="modalEnviarProducao.inicio_em" label="Início *" type="datetime-local" required />
                <Input v-model="modalEnviarProducao.fim_em" label="Término *" type="datetime-local" required />
              </div>
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Equipe (mín. 1) *</label>
                <div class="flex flex-wrap gap-2">
                  <SearchInput
                    v-model="modalEnviarProducao.funcionarioSelecionado"
                    mode="select"
                    class="flex-1 min-w-[200px]"
                    :options="funcionariosOptionsEnviarProducao"
                    placeholder="Selecione funcionário..."
                    @update:modelValue="adicionarEquipeEnviarProducao"
                  />
                  <div v-if="modalEnviarProducao.equipe_ids.length" class="flex flex-wrap gap-2 mt-2 w-full">
                    <span
                      v-for="id in modalEnviarProducao.equipe_ids"
                      :key="id"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-medium"
                    >
                      {{ funcionarioNomeByIdEnviarProducao(id) }}
                      <button type="button" class="hover:text-rose-500" @click="removerEquipeEnviarProducao(id)">&times;</button>
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex justify-end gap-3 pt-4 border-t border-border-ui">
                <Button type="button" variant="ghost" @click="fecharModalEnviarProducao">Cancelar</Button>
                <Button type="submit" variant="primary" :loading="modalEnviarProducao.salvando">
                  <i class="pi pi-send mr-2"></i>
                  Enviar para Produção
                </Button>
              </div>
            </form>
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
import { AgendaService, FuncionarioService, PlanoCorteService, FornecedorService } from '@/services/index'
import { PIPELINE_PLANO_CORTE, UNIDADES } from '@/constantes'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'plano_corte.ver' } })

const router = useRouter()
const route = useRoute()

const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')
const planoId = computed(() => (isEdit.value ? Number(String(rawId.value).replace(/\D/g, '')) : null))
const permSalvarPlano = () => (isEdit.value ? 'plano_corte.editar' : 'plano_corte.criar')

const loading = ref(true)
const salvando = ref(false)
const excluindo = ref(false)
const gerandoPdf = ref(false)

const statusPlanoOptions = computed(() =>
  (PIPELINE_PLANO_CORTE || []).map((s) => ({ label: s.label, value: s.key }))
)

const unidadesOptions = computed(() => (UNIDADES || []).map((u) => ({ label: u.label, value: u.key })))

function planoKey(key) {
  const k = (PIPELINE_PLANO_CORTE || []).find((p) => p.key === key)?.key
  return k || (PIPELINE_PLANO_CORTE?.[0]?.key || 'EM_ABERTO')
}

const dataPlano = ref('')
const statusPlano = ref('')
const fornecedor = ref([])
const fornecedorSelecionado = ref(null)
const fornecedorOptions = computed(() => fornecedor.value.map((f) => ({ label: f.razao_social || f.nome_fantasia, value: f.id })))

const itensDisponiveis = ref([])
const itens = ref([])
const itemNovo = ref({ item_id: null, unidade: '', quantidade: '', valorUnitarioMask: 'R$ 0,00' })

const produtoOptions = computed(() =>
  itensDisponiveis.value.map((i) => ({
    label: `${i.nome_produto} ${i.cor ? `(${i.cor})` : ''}`.trim(),
    value: i.id,
  }))
)
const podeAdicionarItem = computed(() => !!itemNovo.value.item_id && Number(itemNovo.value.quantidade) > 0)
const totalCalculado = computed(() => itens.value.reduce((acc, it) => acc + (it.valor_total || 0), 0))

const columnsItens = [
  { key: 'produto', label: 'Insumo', width: '40%' },
  { key: 'quantidade', label: 'Qtd', width: '80px', align: 'center' },
  { key: 'valor_unitario', label: 'Custo Unit.', width: '140px' },
  { key: 'valor_total', label: 'Total', width: '140px' },
  { key: 'acoes', label: '', width: '100px', align: 'center' },
]

watch(
  () => itemNovo.value.valorUnitarioMask,
  (v) => {
    const n = String(v || '').replace(/\D/g, '')
    itemNovo.value.valorUnitarioMask = maskMoneyBR(n ? Number(n) / 100 : 0)
  }
)

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

const funcionariosOptionsEnviarProducao = ref([])
const modalEnviarProducao = ref({
  aberto: false,
  titulo: '',
  inicio_em: '',
  fim_em: '',
  funcionarioSelecionado: null,
  equipe_ids: [],
  salvando: false,
})

function funcionarioNomeByIdEnviarProducao(id) {
  const o = funcionariosOptionsEnviarProducao.value.find((f) => String(f.value) === String(id))
  return o?.label || String(id)
}
function adicionarEquipeEnviarProducao(id) {
  if (!id) return
  if (!modalEnviarProducao.value.equipe_ids.includes(id)) modalEnviarProducao.value.equipe_ids.push(id)
  modalEnviarProducao.value.funcionarioSelecionado = null
}
function removerEquipeEnviarProducao(id) {
  modalEnviarProducao.value.equipe_ids = modalEnviarProducao.value.equipe_ids.filter((f) => String(f) !== String(id))
}
function fecharModalEnviarProducao() {
  modalEnviarProducao.value.aberto = false
  modalEnviarProducao.value.titulo = ''
  modalEnviarProducao.value.inicio_em = ''
  modalEnviarProducao.value.fim_em = ''
  modalEnviarProducao.value.funcionarioSelecionado = null
  modalEnviarProducao.value.equipe_ids = []
}
async function abrirModalEnviarProducao() {
  if (!planoId.value) return notify.error('Plano não carregado.')
  if (!fornecedorSelecionado.value) return notify.error('Selecione o fornecedor do plano.')
  try {
    const res = await FuncionarioService.select()
    const lista = Array.isArray(res?.data) ? res.data : []
    funcionariosOptionsEnviarProducao.value = lista
      .map((item) => ({ label: item?.label || item?.nome || '', value: item?.value ?? item?.id ?? null }))
      .filter((opt) => opt.value != null)
  } catch (e) {
    funcionariosOptionsEnviarProducao.value = []
  }
  const now = new Date()
  const fim = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  modalEnviarProducao.value.titulo = `Plano de Corte #${planoId.value} - Produção`
  modalEnviarProducao.value.inicio_em = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  modalEnviarProducao.value.fim_em = `${fim.getFullYear()}-${pad(fim.getMonth() + 1)}-${pad(fim.getDate())}T${pad(fim.getHours())}:${pad(fim.getMinutes())}`
  modalEnviarProducao.value.equipe_ids = []
  modalEnviarProducao.value.aberto = true
}
async function confirmarEnviarProducao() {
  if (!modalEnviarProducao.value.equipe_ids.length) return notify.error('Selecione pelo menos um funcionário na equipe.')
  const inicio = new Date(modalEnviarProducao.value.inicio_em)
  const fim = new Date(modalEnviarProducao.value.fim_em)
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return notify.error('Data de início e término inválidas.')
  if (fim <= inicio) return notify.error('Término deve ser depois do início.')
  if (!planoId.value) return notify.error('Plano não carregado.')
  const fornecedorId = Number(fornecedorSelecionado.value)
  if (!fornecedorId) return notify.error('Fornecedor do plano não informado.')
  modalEnviarProducao.value.salvando = true
  try {
    await AgendaService.criar({
      titulo: modalEnviarProducao.value.titulo,
      inicio_em: inicio.toISOString(),
      fim_em: fim.toISOString(),
      plano_corte_id: planoId.value,
      fornecedor_id: fornecedorId,
      equipe_ids: modalEnviarProducao.value.equipe_ids.map((id) => Number(id)),
      categoria: 'PRODUCAO',
    })
    notify.success('Plano enviado para produção!')
    fecharModalEnviarProducao()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao enviar para produção.')
  } finally {
    modalEnviarProducao.value.salvando = false
  }
}

function abrirModalProduto() {
  if (!can(permSalvarPlano())) return notify.error('Acesso negado.')
  if (!fornecedorSelecionado.value) return notify.error('Selecione o fornecedor.')
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
  if (!modalProduto.value.form.nome_produto?.trim()) return notify.error('Informe o nome do produto.')
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
      quantidade: 0,
      valor_unitario: 0,
      valor_total: 0,
    }
    const { data } = await PlanoCorteService.itens.salvar(null, payload)
    await carregarItensDisponiveis(fornecedorSelecionado.value)
    itemNovo.value.item_id = data.id
    itemNovo.value.unidade = data.unidade || ''
    fecharModalProduto()
    notify.success('Produto cadastrado.')
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao cadastrar.')
  } finally {
    modalProduto.value.salvando = false
  }
}

async function onSelecionarFornecedor(v) {
  fornecedorSelecionado.value = v
  if (v) await carregarItensDisponiveis(v)
  itens.value = []
  limparItemNovo()
}

function onSelecionarProdutoNovo(v) {
  const item = itensDisponiveis.value.find((i) => Number(i.id) === Number(v))
  itemNovo.value.unidade = item?.unidade || ''
}

function limparItemNovo() {
  itemNovo.value = { item_id: null, unidade: '', quantidade: '', valorUnitarioMask: 'R$ 0,00' }
}

async function confirmarRemoverItemPlano(index) {
  if (!can(permSalvarPlano())) return notify.error('Acesso negado.')
  const row = itens.value?.[index]
  const nome = row?.item?.nome_produto || 'Item'
  const ok = await confirm.show('Remover Item', `Deseja remover "${nome}" do plano?`)
  if (!ok) return
  itens.value.splice(index, 1)
}

function registrarItemNovo() {
  if (!can(permSalvarPlano())) return notify.error('Acesso negado.')
  const itemId = Number(itemNovo.value.item_id)
  const item = itensDisponiveis.value.find((i) => Number(i.id) === itemId)
  if (!item) return
  const qtd = Number(itemNovo.value.quantidade) || 0
  const vUnit = Number(String(itemNovo.value.valorUnitarioMask).replace(/\D/g, '')) / 100 || 0
  const vTotal = Math.round(qtd * vUnit * 100) / 100
  itens.value.push({
    item_id: item.id,
    item: { nome_produto: item.nome_produto, cor: item.cor, marca: item.marca },
    quantidade: qtd,
    valor_unitario: vUnit,
    valor_total: vTotal,
  })
  limparItemNovo()
}

async function salvar() {
  if (!can(permSalvarPlano())) return notify.error('Acesso negado.')
  if (!fornecedorSelecionado.value) return notify.error('Selecione o fornecedor.')
  if (!dataPlano.value?.trim()) return notify.error('Informe a data do plano.')
  if (!itens.value?.length) return notify.error('Adicione pelo menos um item ao plano.')
  salvando.value = true
  try {
    const dataVenda = dataPlano.value.trim()
    const dataVendaIso = dataVenda.includes('T') ? dataVenda : `${dataVenda}T12:00:00.000Z`
    const payload = {
      fornecedor_id: Number(fornecedorSelecionado.value),
      data_venda: dataVendaIso,
      status: isEdit.value ? (statusPlano.value || planoKey('EM_ABERTO')) : (statusPlano.value || planoKey('EM_ABERTO')),
      produtos: itens.value.map((p) => ({
        item_id: Number(p.item_id),
        quantidade: Number(p.quantidade) || 0,
        valor_unitario: Number(p.valor_unitario) || 0,
        valor_total: Number(p.valor_total) || 0,
        status: p.status || 'ATIVO',
      })),
    }
    await PlanoCorteService.salvar(isEdit.value ? planoId.value : null, payload)
    notify.success(isEdit.value ? 'Plano atualizado.' : 'Plano salvo.')
    router.push('/plano-corte')
  } catch (e) {
    const msg = e?.response?.data?.message
    notify.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Erro ao salvar.')
  } finally {
    salvando.value = false
  }
}

async function confirmarExcluirPlano() {
  if (!can('plano_corte.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir Plano', `Deseja excluir o Plano de Corte #${planoId.value}?`)
  if (!ok) return
  excluindo.value = true
  try {
    await PlanoCorteService.remover(planoId.value)
    notify.success('Plano excluído.')
    router.push('/plano-corte')
  } catch (e) {
    notify.error('Erro ao excluir.')
  } finally {
    excluindo.value = false
  }
}

async function gerarPdf() {
  if (!isEdit.value) return
  if (!can('plano_corte.ver')) return notify.error('Acesso negado.')
  gerandoPdf.value = true
  try {
    const { data } = await PlanoCorteService.abrirPdf(planoId.value)
    await router.push({
      path: `/arquivos/${data.arquivoId}`,
      query: {
        name: `PLANO_CORTE_${String(planoId.value).replace(/\D/g, '')}.pdf`,
        type: 'application/pdf',
      },
    })
  } catch (e) {
    notify.error('Erro ao gerar PDF.')
  } finally {
    gerandoPdf.value = false
  }
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
      dataPlano.value = data.data_venda?.slice(0, 10) || ''
      itens.value = (data.produtos || []).map((p) => ({
        ...p,
        item: p.item || { nome_produto: p.nome_produto, cor: p.cor, marca: p.marca },
        quantidade: Number(p.quantidade) || 0,
        valor_unitario: Number(p.valor_unitario) || 0,
        valor_total: Number(p.valor_total) || 0,
      }))
      if (data.fornecedor_id) await carregarItensDisponiveis(data.fornecedor_id)
    } else {
      dataPlano.value = new Date().toISOString().slice(0, 10)
      statusPlano.value = planoKey('EM_ABERTO')
    }
  } catch (err) {
    notify.error('Erro ao carregar.')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
