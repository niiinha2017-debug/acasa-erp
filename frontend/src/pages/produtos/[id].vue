<template>
  <div class="login-font w-full h-full rounded-2xl border border-border-ui bg-bg-card overflow-hidden animate-page-in">
    <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>
    <PageHeader
      :title="isEdit ? `Editar Produto #${produtoId}` : 'Novo Produto'"
      subtitle="Gerenciamento de insumos e controle de materiais"
      icon="pi pi-box"
      :showBack="false"
      class="border-b border-border-ui"
    />

    <div class="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div v-if="loading" class="py-24 flex flex-col items-center justify-center gap-4">
        <div class="w-10 h-10 border-2 border-border-ui border-t-brand-primary rounded-full animate-spin"></div>
        <p class="text-xs font-medium text-text-muted uppercase tracking-widest">Carregando...</p>
      </div>

      <form v-else class="space-y-10 produtos-line-form" @submit.prevent="confirmarSalvarProduto" autocomplete="off">
        <div class="grid grid-cols-12 gap-6 items-end bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-2xl">
          <div class="col-span-12 md:col-span-6">
            <SearchInput
              v-model="form.fornecedor_id"
              mode="select"
              label="Fornecedor Principal *"
              :options="fornecedorOptions"
              required
              placeholder="Selecione o fornecedor"
            />
          </div>

          <div class="col-span-12 md:col-span-3">
            <SearchInput
              v-model="form.unidade"
              mode="select"
              label="Unidade"
              :options="unidadesOptions"
              required
            />
          </div>

          <div class="col-span-12 md:col-span-3">
            <SearchInput
              v-model="form.status"
              mode="select"
              label="Status"
              :options="statusOptions"
              required
            />
          </div>
        </div>

        <div class="space-y-10">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Dados Principais
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input
            class="col-span-12 md:col-span-8"
            v-model="form.nome_produto"
            label="Nome do Produto"
            placeholder="Ex: Chapa MDF Branco TX"
            required
            force-upper
          />

          <Input
            class="col-span-12 md:col-span-4"
            v-model="quantidadeInput"
            label="Qtd. em Estoque"
            type="number"
            required
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="estoqueMinimoInput"
            label="Estoque Mínimo"
            type="number"
            placeholder="0"
          />

          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.marca"
            label="Marca"
            placeholder="Ex: Duratex"
            force-upper
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.cor"
            label="Cor"
            placeholder="Ex: Branco TX"
            force-upper
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.medida"
            label="Medida"
            placeholder="Ex: 2750x1840mm"
            force-upper
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.categoria"
            label="Categoria"
            placeholder="Ex: Chapas, Acabamento"
            force-upper
          />
          <SearchInput
            class="col-span-12 md:col-span-4"
            v-model="form.categoria_base"
            mode="select"
            label="Categoria Base"
            :options="categoriasBaseOptions"
            placeholder="Selecione..."
            required
          />
          <SearchInput
            class="col-span-12 md:col-span-4"
            v-model="form.tipo_aplicacao"
            mode="select"
            label="Tipo de Aplicacao"
            :options="tipoAplicacaoOptions"
            placeholder="Selecione..."
            required
          />
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Dimensoes e Custos
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input class="col-span-12 md:col-span-3" v-model="form.largura_mm" label="Largura (mm)" type="number" />
          <Input class="col-span-12 md:col-span-3" v-model="form.comprimento_mm" label="Comprimento (mm)" type="number" />
          <Input class="col-span-12 md:col-span-3" v-model="form.espessura_mm" label="Espessura (mm)" type="number" />
          <Input class="col-span-12 md:col-span-3" v-model="precoM2Mask" label="Preco por m2" />

          <Input class="col-span-12 md:col-span-4" v-model="valorUnitarioMask" label="Custo Unitario (R$)" required />
          <div class="col-span-12 md:col-span-8">
            <div class="p-4 bg-slate-900 rounded-xl text-white flex flex-col justify-center h-full">
              <span class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">Total em Inventario</span>
              <span class="text-xl font-semibold tabular-nums">{{ valorTotalMask }}</span>
            </div>
          </div>
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Imagem principal e galeria
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-12 md:col-span-5">
            <div
              class="relative group aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-slate-300 cursor-pointer"
              @click="previewImagem ? abrirPreviewImagem() : (imagemInput?.click())"
            >
              <img v-if="previewImagem" :src="previewImagem" class="w-full h-full object-contain p-4" />
              <div v-else class="text-center p-6">
                <i class="pi pi-image text-slate-300 text-3xl mb-2"></i>
                <p class="text-[10px] text-slate-400 font-medium uppercase tracking-tighter leading-tight">
                  {{ isEdit ? 'Sem imagem anexada' : 'Clique para enviar imagem' }}
                </p>
              </div>

              <div
                v-if="(isEdit && can('produtos.editar')) || (!isEdit && can('produtos.criar'))"
                class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                @click.stop
              >
                <button type="button" @click.stop="imagemInput?.click()" class="p-2 bg-white rounded-lg text-slate-900 hover:scale-110 transition-transform">
                  <i class="pi pi-upload"></i>
                </button>
                <button v-if="previewImagem" type="button" @click.stop="confirmarRemoverImagem" class="p-2 bg-white rounded-lg text-rose-600 hover:scale-110 transition-transform">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
            <input ref="imagemInput" type="file" class="hidden" accept="image/*" @change="onImagemPick" />
          </div>

          <div class="col-span-12 md:col-span-7 space-y-3">
            <div class="rounded-2xl border border-border-ui bg-slate-50/70 dark:bg-slate-800/30 p-5">
              <p class="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2">Imagem principal</p>
              <p class="text-sm text-slate-600 dark:text-slate-300">
                Clique na área ao lado para anexar a imagem principal (usada no card e na listagem).
              </p>
            </div>
            <!-- Galeria: fotos adicionais (apenas em edição) -->
            <div v-if="isEdit && produtoId" class="rounded-2xl border border-border-ui bg-slate-50/70 dark:bg-slate-800/30 p-4">
              <p class="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2">Galeria de fotos</p>
              <div class="flex flex-wrap gap-2 items-start">
                <div
                  v-for="arq in galeriaFotos"
                  :key="arq.id"
                  class="relative group w-20 h-20 rounded-xl overflow-hidden border border-border-ui bg-slate-100 dark:bg-slate-700 shrink-0"
                >
                  <img :src="arq.url" class="w-full h-full object-cover" alt="" />
                  <button
                    v-if="can('produtos.editar')"
                    type="button"
                    class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    @click="removerFotoGaleria(arq)"
                  >
                    <i class="pi pi-trash text-sm" />
                  </button>
                </div>
                <label
                  v-if="can('produtos.editar')"
                  class="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-colors shrink-0"
                >
                  <i class="pi pi-plus text-2xl text-text-muted" />
                  <input type="file" class="hidden" accept="image/*" @change="onGaleriaPick" />
                </label>
              </div>
              <p class="text-[10px] text-slate-500 mt-2">Fotos adicionais do produto (miniatura chapa/ferragem).</p>
            </div>

            <!-- Retalhos (sobras) vinculados a este material -->
            <div v-if="isEdit && produtoId" class="col-span-12 rounded-2xl border border-border-ui bg-slate-50/70 dark:bg-slate-800/30 p-4">
              <p class="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2 flex items-center gap-2">
                <i class="pi pi-box text-amber-500" />
                Retalhos (sobras)
              </p>
              <p class="text-[10px] text-slate-500 mb-3">Sobras cadastradas no Totem ao concluir tarefas, vinculadas a este material.</p>
              <div v-if="retalhosList.length === 0" class="text-sm text-text-muted py-4 text-center">
                Nenhum retalho registrado para este produto.
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full text-sm border border-border-ui rounded-xl overflow-hidden">
                  <thead>
                    <tr class="bg-slate-100 dark:bg-slate-700/50">
                      <th class="text-left py-2 px-3 font-medium text-text-muted w-14">Foto</th>
                      <th class="text-left py-2 px-3 font-medium text-text-muted">Dimensões (mm)</th>
                      <th class="text-right py-2 px-3 font-medium text-text-muted">Área (m²)</th>
                      <th class="text-left py-2 px-3 font-medium text-text-muted">Tarefa</th>
                      <th class="text-left py-2 px-3 font-medium text-text-muted">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in retalhosList" :key="r.id" class="border-t border-border-ui">
                      <td class="py-2 px-3">
                        <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                          <img v-if="r.produto?.imagem_url || r.imagem_url" :src="r.imagem_url || r.produto?.imagem_url" class="w-full h-full object-cover" alt="" />
                          <i v-else class="pi pi-box text-amber-500 text-lg" />
                        </div>
                      </td>
                      <td class="py-2 px-3 text-text-main">{{ r.largura_mm }} × {{ r.comprimento_mm }}</td>
                      <td class="py-2 px-3 text-right tabular-nums text-text-main">{{ Number(r.quantidade_m2).toFixed(4) }}</td>
                      <td class="py-2 px-3 text-text-muted text-xs">{{ r.agenda_fabrica?.titulo || '—' }}</td>
                      <td class="py-2 px-3 text-text-muted text-xs">{{ r.criado_em ? new Date(r.criado_em).toLocaleDateString('pt-BR') : '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-10 mt-6 border-t border-border-ui">
          <div class="flex items-center justify-between gap-4">
            <Button type="button" variant="ghost" @click="confirmarDescartarProduto">
              Cancelar
            </Button>

            <Button
              v-if="can(isEdit ? 'produtos.editar' : 'produtos.criar')"
              variant="primary"
              size="lg"
              type="submit"
              :loading="salvando"
              :disabled="!camposDesbloqueados"
              class="!rounded-xl px-8 py-3 bg-gradient-to-r from-brand-primary to-brand-primary/90 hover:from-brand-primary hover:to-brand-primary hover:shadow-2xl hover:shadow-brand-primary/30 active:scale-[0.98] transition-all duration-300 group relative overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span class="relative flex items-center justify-center gap-2 font-bold tracking-wide text-white">
                <i class="pi pi-save text-[14px] group-hover:rotate-12 transition-transform"></i>
                {{ isEdit ? 'ATUALIZAR PRODUTO' : 'CADASTRAR PRODUTO' }}
              </span>
            </Button>
          </div>
        </div>
        </div>
      </form>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modalImagemOpen"
          class="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-8"
          @click.self="modalImagemOpen = false"
        >
          <div class="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl">
            <button @click="modalImagemOpen = false" class="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center">
              <i class="pi pi-times"></i>
            </button>
            <div class="p-4 flex items-center justify-center bg-white min-h-[400px]">
              <img :src="previewImagem" class="max-h-[80vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.login-font {
  font-family: 'Manrope', 'Segoe UI', sans-serif;
}

.produtos-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > label),
.produtos-line-form :deep(.search-container > label) {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgb(100 116 139);
}

.produtos-line-form :deep(input.w-full),
.produtos-line-form :deep(select.w-full) {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom-width: 2px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.produtos-line-form :deep(input.w-full:focus),
.produtos-line-form :deep(select.w-full:focus) {
  box-shadow: none;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { maskMoneyBR } from '@/utils/masks'
import { UNIDADES } from '@/constantes'
import { CATEGORIAS_BASE } from '@/constantes/categorias-base'
import { ProdutosService, FornecedorService, EstoqueRetalhoService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { ArquivosService } from '@/services/arquivos.service' 
import PageHeader from '@/components/ui/PageHeader.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { closeTabAndGo } from '@/utils/tabs'

definePage({ meta: { perm: 'produtos.ver' } })

const route = useRoute()
const router = useRouter()

const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')
const produtoId = computed(() =>
  isEdit.value ? Number(String(rawId.value).replace(/\D/g, '')) : null,
)
const modalImagemOpen = ref(false)

function abrirPreviewImagem() {
  if (!previewImagem.value) return
  modalImagemOpen.value = true
}


const imagemInput = ref(null)
const uploadingImagem = ref(false)
const removendoImagem = ref(false)
const galeriaFotos = ref([])
const uploadingGaleria = ref(false)
const retalhosList = ref([])

const loading = ref(false)
const salvando = ref(false)

const fornecedor = ref([])
const fornecedorOptions = computed(() =>
  (fornecedor.value || []).map((f) => ({
    label: f?.label || f?.razao_social || f?.nome_fantasia || '-',
    value: f?.value ?? f?.id,
  })),
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
  largura_mm: null,
  comprimento_mm: null,
  espessura_mm: null,
  preco_m2: 0,
  quantidade: 0,
  estoque_minimo: 0,
  valor_unitario: 0,
  valor_total: 0,
  status: 'ATIVO',
  categoria: '',
  categoria_base: 'PRIMARIA',
  tipo_aplicacao: 'MDF',
  imagem_url: '',
})

// Arquivo pendente (criação): permite enviar imagem antes de salvar
const pendingImagemFile = ref(null)
const pendingImagemObjectUrl = ref('')
watch(pendingImagemFile, (file) => {
  if (pendingImagemObjectUrl.value) URL.revokeObjectURL(pendingImagemObjectUrl.value)
  pendingImagemObjectUrl.value = file ? URL.createObjectURL(file) : ''
}, { immediate: true })
const previewImagem = computed(() => {
  if (pendingImagemFile.value && pendingImagemObjectUrl.value) return pendingImagemObjectUrl.value
  const url = String(form.value.imagem_url || '').trim()
  return url.length ? url : ''
})

// ======= Inputs auxiliares (máscaras) =======
const quantidadeInput = ref('')
const estoqueMinimoInput = ref('')
const valorUnitarioMask = ref('R$ 0,00')
const precoM2Mask = ref('R$ 0,00')

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
watch(estoqueMinimoInput, (v) => {
  const n = String(v || '').replace(/\D/g, '')
  form.value.estoque_minimo = n ? Number(n) : 0
})

watch(valorUnitarioMask, (v) => {
  const n = String(v || '').replace(/\D/g, '')
  const valor = n ? Number(n) / 100 : 0
  form.value.valor_unitario = valor

  const formatado = maskMoneyBR(valor)
  if (v !== formatado) valorUnitarioMask.value = formatado
})

watch(precoM2Mask, (v) => {
  const n = String(v || '').replace(/\D/g, '')
  const valor = n ? Number(n) / 100 : 0
  form.value.preco_m2 = valor

  const formatado = maskMoneyBR(valor)
  if (v !== formatado) precoM2Mask.value = formatado
})

// Cálculo automático: Preço por M² = Custo Unitário / área em m² (quando Largura, Comprimento e Custo Unitário preenchidos)
function calcularPrecoM2Automatico() {
  const larg = Number(form.value.largura_mm) || 0
  const comp = Number(form.value.comprimento_mm) || 0
  const custo = Number(form.value.valor_unitario) || 0
  if (larg <= 0 || comp <= 0 || custo <= 0) return
  const areaM2 = (larg / 1000) * (comp / 1000)
  if (areaM2 <= 0) return
  const precoM2 = custo / areaM2
  form.value.preco_m2 = Math.round(precoM2 * 100) / 100
  precoM2Mask.value = maskMoneyBR(form.value.preco_m2)
}
watch(
  () => [form.value.largura_mm, form.value.comprimento_mm, form.value.valor_unitario],
  () => calcularPrecoM2Automatico(),
  { deep: true },
)

// ======= UNIDADES (constantes) =======
const unidadesOptions = computed(() => UNIDADES.map((u) => ({ label: u.label, value: u.key })))
const categoriasBaseOptions = computed(() => CATEGORIAS_BASE)
const tipoAplicacaoOptions = [
  { label: 'MDF', value: 'MDF' },
  { label: 'Complemento', value: 'COMPLEMENTO' },
  { label: 'Insumo', value: 'INSUMO' },
]

// ======= CRUD =======
function validar() {
  if (!form.value.fornecedor_id) return 'Selecione o fornecedor.'
  if (!form.value.nome_produto) return 'Informe o nome do produto.'
  if (!form.value.unidade) return 'Selecione a unidade.'
  if (!form.value.quantidade || Number(form.value.quantidade) <= 0) return 'Informe a quantidade.'
  if (!form.value.valor_unitario || Number(form.value.valor_unitario) <= 0) return 'Informe o valor unitário.'
  if (!form.value.status) return 'Informe o status.'
  if (!form.value.categoria_base) return 'Selecione a categoria base.'
  if (!form.value.tipo_aplicacao) return 'Selecione o tipo de aplicacao.'
  return null
}

function resetForm() {
  form.value = {
    fornecedor_id: null,
    nome_produto: '',
    marca: '',
    cor: '',
    medida: '',
    categoria: '',
    categoria_base: 'PRIMARIA',
    tipo_aplicacao: 'MDF',
    unidade: '',
    largura_mm: null,
    comprimento_mm: null,
    espessura_mm: null,
    preco_m2: 0,
    quantidade: 0,
    estoque_minimo: 0,
    valor_unitario: 0,
    valor_total: 0,
    status: 'ATIVO',
    imagem_url: '',
  }
  quantidadeInput.value = ''
  estoqueMinimoInput.value = ''
  valorUnitarioMask.value = 'R$ 0,00'
  precoM2Mask.value = 'R$ 0,00'
  pendingImagemFile.value = null
}

async function carregarFornecedor() {
  const res = await FornecedorService.select()
  const data = res?.data ?? res
  fornecedor.value = Array.isArray(data) ? data : []
}

async function carregarProduto() {
  const res = await ProdutosService.buscar(produtoId.value)
  const data = res?.data ?? res

  form.value = {
    ...form.value,
    ...data,
    fornecedor_id: data.fornecedor_id ?? null,
    largura_mm: data.largura_mm ?? null,
    comprimento_mm: data.comprimento_mm ?? null,
    espessura_mm: data.espessura_mm ?? null,
    preco_m2: Number(data.preco_m2 || 0),
    quantidade: Number(data.quantidade || 0),
    estoque_minimo: Number(data.estoque_minimo ?? 0),
    categoria: data.categoria || '',
    categoria_base: data.categoria_base || 'PRIMARIA',
    tipo_aplicacao:
      String(data.tipo_aplicacao || '').toUpperCase() === 'MATERIA_PRIMA'
        ? 'MDF'
        : (data.tipo_aplicacao || 'MDF'),
    valor_unitario: Number(data.valor_unitario || 0),
    valor_total: Number(data.valor_total || 0),
    status: data.status || 'ATIVO',
    imagem_url: data.imagem_url || '',
  }

  quantidadeInput.value = form.value.quantidade ? String(form.value.quantidade) : ''
  estoqueMinimoInput.value = form.value.estoque_minimo != null && form.value.estoque_minimo !== '' ? String(form.value.estoque_minimo) : ''
  valorUnitarioMask.value = maskMoneyBR(form.value.valor_unitario || 0)
  precoM2Mask.value = maskMoneyBR(form.value.preco_m2 || 0)
}

async function onImagemPick(e) {
  const file = e?.target?.files?.[0]
  if (!file) return

  if (!file.type?.startsWith('image/')) {
    notify.error('Selecione um arquivo de imagem.')
    if (imagemInput.value) imagemInput.value.value = ''
    return
  }

  if (!isEdit.value) {
    pendingImagemFile.value = file
    if (imagemInput.value) imagemInput.value.value = ''
    return
  }

  if (!can('produtos.editar')) {
    notify.error('Acesso negado.')
    if (imagemInput.value) imagemInput.value.value = ''
    return
  }

  uploadingImagem.value = true
  try {
    const res = await ArquivosService.upload({
      ownerType: 'PRODUTO',
      ownerId: produtoId.value,
      categoria: 'IMAGEM',
      slotKey: 'IMAGEM_PRINCIPAL',
      file,
    })

    const arq = res?.data ?? res
    const url = arq?.url
    if (!url) {
      notify.error('Upload ok, mas não retornou URL.')
      return
    }

    form.value.imagem_url = url
    await ProdutosService.salvar(produtoId.value, { imagem_url: url })

    notify.success('Imagem atualizada!')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao enviar imagem.')
  } finally {
    uploadingImagem.value = false
    if (imagemInput.value) imagemInput.value.value = ''
  }
}


async function confirmarRemoverImagem() {
  if (!isEdit.value) {
    pendingImagemFile.value = null
    return
  }
  if (!can('produtos.editar')) return notify.error('Acesso negado.')

  const ok = await confirm.show('Remover imagem', 'Deseja remover a imagem deste produto?')
  if (!ok) return

  removendoImagem.value = true
  try {
    await ProdutosService.salvar(produtoId.value, { imagem_url: null })
    form.value.imagem_url = ''
    notify.success('Imagem removida!')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao remover imagem.')
  } finally {
    removendoImagem.value = false
  }
}

async function carregarGaleriaFotos() {
  if (!isEdit.value || !produtoId.value) return
  try {
    const res = await ArquivosService.listar({ ownerType: 'PRODUTO', ownerId: produtoId.value })
    const arr = res?.data ?? res
    const lista = Array.isArray(arr) ? arr : (arr?.data ?? [])
    galeriaFotos.value = lista.filter((a) => String(a.slot_key || '').startsWith('GALERIA_'))
  } catch {
    galeriaFotos.value = []
  }
}

async function carregarRetalhos() {
  if (!isEdit.value || !produtoId.value) return
  try {
    const res = await EstoqueRetalhoService.listarPorProduto(produtoId.value)
    const data = res?.data ?? res
    retalhosList.value = Array.isArray(data) ? data : []
  } catch {
    retalhosList.value = []
  }
}

async function onGaleriaPick(e) {
  const file = e?.target?.files?.[0]
  if (!file || !produtoId.value || !can('produtos.editar')) return
  if (!file.type?.startsWith('image/')) {
    notify.error('Selecione um arquivo de imagem.')
    e.target.value = ''
    return
  }
  uploadingGaleria.value = true
  try {
    await ArquivosService.upload({
      ownerType: 'PRODUTO',
      ownerId: produtoId.value,
      categoria: 'GALERIA',
      slotKey: 'GALERIA_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      file,
    })
    notify.success('Foto adicionada à galeria.')
    await carregarGaleriaFotos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao enviar foto.')
  } finally {
    uploadingGaleria.value = false
    e.target.value = ''
  }
}

async function removerFotoGaleria(arq) {
  if (!can('produtos.editar')) return
  const ok = await confirm.show('Remover foto', 'Remover esta foto da galeria?')
  if (!ok) return
  try {
    await ArquivosService.remover(arq.id)
    galeriaFotos.value = galeriaFotos.value.filter((f) => f.id !== arq.id)
    notify.success('Foto removida.')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao remover.')
  }
}

async function confirmarSalvarProduto() {
  const perm = isEdit.value ? 'produtos.editar' : 'produtos.criar'
  if (!can(perm)) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    isEdit.value ? 'Salvar Alterações' : 'Finalizar Cadastro',
    isEdit.value
      ? `Deseja salvar as alterações do Produto #${produtoId.value}?`
      : 'Deseja finalizar o cadastro deste produto?',
  )
  if (!ok) return
  await salvar()
}
function abrirImagem() {
  if (!previewImagem.value) return
  window.open(previewImagem.value, '_blank')
}


async function confirmarDescartarProduto() {
  const ok = await confirm.show('Descartar', 'Deseja sair sem salvar? As alterações serão perdidas.')
  if (!ok) return
  router.push('/produtos')
}

async function salvar() {
  const perm = isEdit.value ? 'produtos.editar' : 'produtos.criar'
  if (!can(perm)) return notify.error('Acesso negado.')

  const erro = validar()
  if (erro) return alert(erro)

  salvando.value = true
  try {
    const payload = {
      ...form.value,
      fornecedor_id: Number(form.value.fornecedor_id),
      largura_mm:
        form.value.largura_mm === null || form.value.largura_mm === ''
          ? null
          : Number(form.value.largura_mm),
      comprimento_mm:
        form.value.comprimento_mm === null || form.value.comprimento_mm === ''
          ? null
          : Number(form.value.comprimento_mm),
      espessura_mm:
        form.value.espessura_mm === null || form.value.espessura_mm === ''
          ? null
          : Number(form.value.espessura_mm),
      preco_m2: Number(form.value.preco_m2 || 0),
      quantidade: Number(form.value.quantidade || 0),
      valor_unitario: Number(form.value.valor_unitario || 0),
      valor_total: Number(form.value.valor_total || 0),
      unidade: form.value.unidade ? String(form.value.unidade) : null,
      marca: form.value.marca ? String(form.value.marca) : null,
      cor: form.value.cor ? String(form.value.cor) : null,
      medida: form.value.medida ? String(form.value.medida) : null,

      // ✅ imagem opcional
      imagem_url: String(form.value.imagem_url || '').trim() || null,
      estoque_minimo: Number(form.value.estoque_minimo ?? 0),
      categoria: form.value.categoria ? String(form.value.categoria).trim() : null,
      categoria_base: form.value.categoria_base ? String(form.value.categoria_base).trim().toUpperCase() : 'PRIMARIA',
      tipo_aplicacao: form.value.tipo_aplicacao ? String(form.value.tipo_aplicacao).trim().toUpperCase() : 'MDF',
    }

    const res = await ProdutosService.salvar(isEdit.value ? produtoId.value : null, payload)
    const produtoSalvo = res?.data ?? res
    const idNovo = produtoSalvo?.id

    if (!isEdit.value && idNovo && pendingImagemFile.value) {
      uploadingImagem.value = true
      try {
        const up = await ArquivosService.upload({
          ownerType: 'PRODUTO',
          ownerId: idNovo,
          categoria: 'IMAGEM',
          slotKey: 'IMAGEM_PRINCIPAL',
          file: pendingImagemFile.value,
        })
        const arq = up?.data ?? up
        if (arq?.url) await ProdutosService.salvar(idNovo, { imagem_url: arq.url })
      } catch (err) {
        notify.error(err?.response?.data?.message || 'Erro ao enviar imagem.')
      } finally {
        uploadingImagem.value = false
      }
    }

    closeTabAndGo('/produtos')
  } catch (err) {
    console.error(err)
    alert(err?.response?.data?.message || 'Erro ao salvar.')
  } finally {
    salvando.value = false
  }
}

onBeforeUnmount(() => {
  if (pendingImagemObjectUrl.value) URL.revokeObjectURL(pendingImagemObjectUrl.value)
})

onMounted(async () => {
  const perm = isEdit.value ? 'produtos.editar' : 'produtos.criar'
  if (!can(perm)) {
    notify.error('Acesso negado.')
    router.push('/produtos')
    return
  }

  loading.value = true
  try {
    await carregarFornecedor()
    if (isEdit.value) {
      await carregarProduto()
      await Promise.all([carregarGaleriaFotos(), carregarRetalhos()])
    } else {
      resetForm()
      const idFornecedor = route.query.fornecedor
      if (idFornecedor) form.value.fornecedor_id = Number(idFornecedor)
    }
  } catch (err) {
  console.error('[PRODUTOS] erro no mounted:', err)
  notify.error('Erro ao carregar dados iniciais.')
  router.push('/produtos')
} finally {

    loading.value = false
  }
})

</script>
