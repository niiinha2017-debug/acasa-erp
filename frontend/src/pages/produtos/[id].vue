<template>
  <div class="w-full max-w-5xl mx-auto py-8 px-4 animate-in fade-in duration-500">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <i class="pi pi-box text-xl"></i>
          </div>
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
            {{ isEdit ? 'Editar Produto' : 'Novo Produto' }}
          </h1>
        </div>
        <p class="text-sm text-slate-500">Gestão de insumos e controle de materiais de estoque.</p>
      </div>

      <button
        type="button"
        @click="confirmarDescartarProduto"
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-sm font-medium"
      >
        <i class="pi pi-arrow-left text-xs"></i>
        <span>Voltar para lista</span>
      </button>
    </header>

    <Card class="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden !rounded-2xl">
      <div v-if="loading" class="py-24 flex flex-col items-center justify-center gap-4">
        <div class="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        <p class="text-xs font-medium text-slate-400 uppercase tracking-widest">Carregando...</p>
      </div>

      <form v-else @submit.prevent="confirmarSalvarProduto" class="divide-y divide-slate-100">
        <div class="p-8">
          <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12 lg:col-span-8 space-y-6">
              <div class="flex items-center gap-2 mb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Identificação Geral</h3>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchInput
                  v-model="form.fornecedor_id"
                  mode="select"
                  label="Fornecedor Principal"
                  :options="fornecedorOptions"
                  required
                />
                <SearchInput
                  v-model="form.status"
                  mode="select"
                  label="Status do Cadastro"
                  :options="statusOptions"
                  required
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-2">
                  <Input
                    v-model="form.nome_produto"
                    label="Nome do Produto"
                    placeholder="Ex: Chapa de MDF 18mm"
                    required
                  />
                </div>
                <SearchInput
                  v-model="form.unidade"
                  mode="select"
                  label="Unidade"
                  :options="unidadesOptions"
                  required
                />
              </div>
            </div>

            <div class="col-span-12 lg:col-span-4">
              <div class="flex flex-col h-full">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 ml-1">Imagem do Produto</span>
                
                <div 
                  class="relative group aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-slate-300"
                  :class="{'cursor-pointer': previewImagem}"
                  @click="previewImagem ? abrirPreviewImagem() : null"
                >
                  <img v-if="previewImagem" :src="previewImagem" class="w-full h-full object-contain p-4" />
                  <div v-else class="text-center p-6">
                    <i class="pi pi-image text-slate-300 text-3xl mb-2"></i>
                    <p class="text-[10px] text-slate-400 font-medium uppercase tracking-tighter leading-tight">
                      {{ isEdit ? 'Sem imagem anexada' : 'Salve para anexar' }}
                    </p>
                  </div>

                  <div v-if="isEdit && can('produtos.editar')" class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
            </div>
          </div>
        </div>

        <div class="p-8 bg-slate-50/30">
          <div class="flex items-center gap-2 mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Atributos Técnicos</h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input v-model="form.marca" label="Marca / Fabricante" placeholder="Ex: Duratex" />
            <Input v-model="form.cor" label="Cor / Acabamento" placeholder="Ex: Branco Texturizado" />
            <Input v-model="form.medida" label="Dimensões" placeholder="Ex: 2750x1840mm" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <Input v-model="form.largura_mm" label="Largura (mm)" type="number" />
            <Input v-model="form.comprimento_mm" label="Comprimento (mm)" type="number" />
            <Input v-model="form.espessura_mm" label="Espessura (mm)" type="number" />
            <Input v-model="precoM2Mask" label="Preco m2 (R$)" />
          </div>
        </div>

        <div class="p-8">
          <div class="grid grid-cols-12 gap-6 items-end">
            <div class="col-span-12 md:col-span-4">
              <Input
                v-model="quantidadeInput"
                label="Qtd. em Estoque"
                type="number"
                required
              />
            </div>
            <div class="col-span-12 md:col-span-4">
              <Input
                v-model="valorUnitarioMask"
                label="Custo Unitário (R$)"
                required
              />
            </div>
            <div class="col-span-12 md:col-span-4">
              <div class="p-4 bg-slate-900 rounded-xl text-white flex flex-col justify-center">
                <span class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">Total em Inventário</span>
                <span class="text-xl font-semibold tabular-nums">{{ valorTotalMask }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-8 flex items-center justify-end gap-4 bg-slate-50/50">
          <button
            type="button"
            @click="router.push('/produtos')"
            class="px-6 py-3 text-sm font-semibold text-slate-500 hover:text-rose-600 transition-colors"
          >
            Cancelar
          </button>

          <Button
            v-if="can(isEdit ? 'produtos.editar' : 'produtos.criar')"
            type="submit"
            :loading="salvando"
            variant="primary"
            class="!h-12 !px-8 !rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg shadow-slate-200 active:scale-95 transition-all"
          >
            {{ isEdit ? 'Atualizar Produto' : 'Confirmar Cadastro' }}
          </Button>
        </div>
      </form>
    </Card>

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
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { maskMoneyBR } from '@/utils/masks'
import { UNIDADES } from '@/constantes'
import { ProdutosService, FornecedorService } from '@/services/index'
import { confirm } from '@/services/confirm'
import { ArquivosService } from '@/services/arquivos.service' 

import { can } from '@/services/permissions'
import { notify } from '@/services/notify'

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

const loading = ref(false)
const salvando = ref(false)

const fornecedor = ref([])
const fornecedorOptions = computed(() =>
  (fornecedor.value || []).map((f) => ({ label: f.razao_social, value: f.id })),
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
  valor_unitario: 0,
  valor_total: 0,
  status: 'ATIVO',

  // ✅ novo campo
  imagem_url: '',
})

// preview simples (não altera lógica)
const previewImagem = computed(() => {
  const url = String(form.value.imagem_url || '').trim()
  return url.length ? url : ''
})

// ======= Inputs auxiliares (máscaras) =======
const quantidadeInput = ref('')
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

// ======= UNIDADES (constantes) =======
const unidadesOptions = computed(() => UNIDADES.map((u) => ({ label: u.label, value: u.key })))

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
    largura_mm: null,
    comprimento_mm: null,
    espessura_mm: null,
    preco_m2: 0,
    quantidade: 0,
    valor_unitario: 0,
    valor_total: 0,
    status: 'ATIVO',
    imagem_url: '',
  }
  quantidadeInput.value = ''
  valorUnitarioMask.value = 'R$ 0,00'
  precoM2Mask.value = 'R$ 0,00'
}

async function carregarFornecedor() {
  const res = await FornecedorService.listar()
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
    valor_unitario: Number(data.valor_unitario || 0),
    valor_total: Number(data.valor_total || 0),
    status: data.status || 'ATIVO',
    imagem_url: data.imagem_url || '',
  }

  quantidadeInput.value = form.value.quantidade ? String(form.value.quantidade) : ''
  valorUnitarioMask.value = maskMoneyBR(form.value.valor_unitario || 0)
  precoM2Mask.value = maskMoneyBR(form.value.preco_m2 || 0)
}

async function onImagemPick(e) {
  if (!isEdit.value) {
    notify.warn('Salve o produto primeiro para anexar imagem.')
    if (imagemInput.value) imagemInput.value.value = ''
    return
  }

  if (!can('produtos.editar')) {
    notify.error('Acesso negado.')
    if (imagemInput.value) imagemInput.value.value = ''
    return
  }

  const file = e?.target?.files?.[0]
  if (!file) return

  if (!file.type?.startsWith('image/')) {
    notify.error('Selecione um arquivo de imagem.')
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
  if (!isEdit.value) return
  if (!can('produtos.editar')) return notify.error('Acesso negado.')

  const ok = await confirm.show('Remover imagem', 'Deseja remover a imagem deste produto?')
  if (!ok) return

  removendoImagem.value = true
  try {
    // opcional: remover arquivo do slot (se seu backend tiver listagem por slot/categoria)
    // se não tiver, só limpa o campo do produto mesmo:
    await ProdutosService.salvar(produtoId.value, { imagem_url: null })
    form.value.imagem_url = ''
    notify.success('Imagem removida!')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao remover imagem.')
  } finally {
    removendoImagem.value = false
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
  const perm = isEdit.value ? 'produtos.editar' : 'produtos.criar'
  if (!can(perm)) {
    notify.error('Acesso negado.')
    router.push('/produtos')
    return
  }

  loading.value = true
  try {
    await carregarFornecedor()
    if (isEdit.value) await carregarProduto()
    else resetForm()
} catch (err) {
  console.error('[PRODUTOS] erro no mounted:', err)
  notify.error('Erro ao carregar dados iniciais.')
  router.push('/produtos')
} finally {

    loading.value = false
  }
})

</script>
