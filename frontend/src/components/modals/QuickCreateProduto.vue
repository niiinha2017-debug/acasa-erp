<template>
  <!-- MODAL PRINCIPAL -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div class="w-full max-w-2xl max-h-[85vh] bg-bg-card dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-none border border-border-ui overflow-hidden flex flex-col">
          <!-- Header -->
          <header class="flex items-center justify-between px-6 py-5 border-b border-border-ui bg-slate-50/50 dark:bg-slate-800/50">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-lg">
                <i class="pi pi-box text-lg"></i>
              </div>

              <div>
                <h3 class="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase leading-none">
                  Cadastrar Produto
                </h3>
                <div class="flex items-center gap-2 mt-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Ficha Técnica do Item
                  </p>
                </div>
              </div>
            </div>

            <button
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-800 transition-all shadow-sm"
              @click="emit('close')"
              type="button"
            >
              <i class="pi pi-times text-xs"></i>
            </button>
          </header>

          <!-- Body -->
          <div class="p-6 overflow-y-auto">
            <div class="grid grid-cols-12 gap-x-6 gap-y-6">
              <div class="col-span-12 md:col-span-5">
                <SearchInput
                  v-model="form.fornecedor_id"
                  mode="select"
                  label="Fornecedor"
                  :options="fornecedorOptionsInternas"
                  placeholder="SELECIONE..."
                  required
                />
              </div>

              <!-- Nome -->
              <div class="col-span-12 md:col-span-7">
                <Input
                  ref="nomeRef"
                  v-model="form.nome_produto"
                  label="Nome do Produto"
                  placeholder="EX: MDF CRU OU DOBRADIÇA"
                  required
                />
              </div>

              <!-- Marca -->
              <div class="col-span-12 md:col-span-5">
                <Input
                  v-model="form.marca"
                  label="Marca / Fabricante"
                  placeholder="EX: DURATEX"
                />
              </div>

              <!-- Cor -->
              <div class="col-span-12 md:col-span-4">
                <Input
                  v-model="form.cor"
                  label="Cor / Acabamento"
                  placeholder="EX: BRANCO TX"
                />
              </div>

              <!-- Medida -->
              <div class="col-span-12 md:col-span-4">
                <Input
                  v-if="ehFitaBorda"
                  v-model="metragemRoloInput"
                  label="Metragem do Rolo (m)"
                  placeholder="EX: 50"
                  type="number"
                />
                <Input
                  v-else
                  v-model="form.medida"
                  label="Medida"
                  placeholder="EX: 2750X1840MM"
                />
              </div>

              <!-- Unidade -->
              <div class="col-span-12 md:col-span-4">
                <SearchInput
                  v-model="form.unidade"
                  mode="select"
                  label="Unidade Medida"
                  :options="unidadesOptions"
                  placeholder="SELECIONE..."
                  required
                />
              </div>

              <!-- Categoria Base -->
              <div class="col-span-12 md:col-span-4">
                <SearchInput
                  v-model="form.categoria_base"
                  mode="select"
                  label="Categoria Base"
                  :options="categoriasBaseOptions"
                  placeholder="SELECIONE..."
                  required
                />
              </div>

              <div v-if="ehCategoriaComercial" class="col-span-12 md:col-span-8">
                <SearchInput
                  v-model="form.fita_vinculada_id"
                  mode="select"
                  label="Vincular Fita"
                  :options="fitasBordaOptions"
                  placeholder="BUSQUE A FITA DE BORDA"
                />
                <p class="mt-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                  {{ textoVinculoFita }}
                </p>
              </div>

              <!-- Valor unitário -->
              <div class="col-span-12 md:col-span-6">
                <div class="relative">
                  <Input
                    v-model="form.valor_unitario_mask"
                    label="Valor de Custo (UN)"
                    placeholder="0,00"
                    @input="form.valor_unitario_mask = maskMoneyBR($event.target.value)"
                    :forceUpper="false"
                  />
                  <span class="absolute right-4 bottom-4 text-[10px] font-black text-slate-300">BRL</span>
                </div>
              </div>

              <!-- alinhamento -->
              <div class="hidden md:block md:col-span-6"></div>

              <!-- IMAGEM (embaixo do valor) -->
              <div class="col-span-12 md:col-span-8">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                  Imagem do Produto (opcional)
                </label>

                <div class="flex items-center gap-3">
                  <input
                    ref="imagemInput"
                    type="file"
                    class="hidden"
                    accept="image/*"
                    @change="onImagemPick"
                  />

                  <Button
                    type="button"
                    variant="secondary"
                    class="!h-11 !rounded-xl !px-4 text-[10px] font-black uppercase tracking-widest"
                    :loading="salvando"
                    @click="imagemInput?.click()"
                  >
                    <i class="pi pi-upload mr-2 text-[10px]"></i>
                    Selecionar imagem
                  </Button>

                  <span
                    v-if="nomeArquivoImagem"
                    class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    {{ nomeArquivoImagem }}
                  </span>

                  <Button
                    v-if="previewImagem"
                    type="button"
                    variant="ghost"
                    class="!h-11 !rounded-xl !px-4 text-[10px] font-black uppercase tracking-widest border border-slate-200 text-rose-500 hover:bg-rose-50"
                    :loading="salvando"
                    @click="removerImagemLocal"
                  >
                    <i class="pi pi-trash mr-2 text-[10px]"></i>
                    Remover
                  </Button>
                </div>

                <p class="mt-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                  A imagem será enviada automaticamente ao salvar o produto.
                </p>
              </div>

              <!-- Preview -->
              <div class="col-span-12 md:col-span-4">
                <div class="h-full flex flex-col justify-end">
                  <div
                    class="h-32 md:h-40 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden"
                    :class="previewImagem ? 'cursor-zoom-in' : ''"
                    @click="abrirPreviewImagem"
                    title="Clique para visualizar"
                  >
                    <img
                      v-if="previewImagem"
                      :src="previewImagem"
                      class="h-full w-full object-contain p-2"
                      alt="Imagem do produto"
                    />
                    <span v-else class="text-[9px] font-black uppercase tracking-widest text-slate-300">
                      Sem imagem
                    </span>
                  </div>
                </div>
              </div>

              <!-- Status -->
              <div class="col-span-12 md:col-span-6">
                <div class="h-full flex items-end">
                  <div class="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100/60">
                    <CustomCheckbox
                      label="Disponibilidade Ativa"
                      description="HABILITAR ESTE PRODUTO PARA NOVOS PEDIDOS DE COMPRA"
                      :model-value="form.status === 'ATIVO'"
                      @update:model-value="(val) => (form.status = val ? 'ATIVO' : 'INATIVO')"
                    />
                  </div>
                </div>
              </div>

              <div class="hidden md:block md:col-span-6"></div>

              <!-- Erro -->
              <div v-if="erroLocal" class="col-span-12">
                <div class="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                  <p class="text-[10px] font-black uppercase tracking-widest text-rose-600">
                    {{ erroLocal }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <footer class="flex items-center justify-end gap-4 px-6 py-5 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              @click="emit('close')"
              class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <Button
              type="button"
              variant="primary"
              class="!h-12 !rounded-[1.2rem] !px-8 shadow-xl shadow-brand-primary/20 font-black text-[10px] uppercase tracking-widest"
              :loading="salvando"
              @click="salvar"
            >
              <i class="pi pi-check-circle mr-3"></i> Salvar Produto
            </Button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- VIEWER DENTRO DO PWA -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modalImagemOpen"
        class="fixed inset-0 z-[100000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="modalImagemOpen = false"
      >
        <div class="w-full max-w-5xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <header class="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Visualização da imagem
            </span>

            <button
              type="button"
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
              @click="modalImagemOpen = false"
            >
              <i class="pi pi-times text-xs"></i>
            </button>
          </header>

          <div class="p-4">
            <div class="w-full h-[70vh] bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden">
              <img
                :src="previewImagem"
                class="max-h-full max-w-full object-contain"
                alt="Imagem do produto"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>


<script setup>
import { reactive, ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { ProdutosService } from '@/services/index'
import { notify } from '@/services/notify'
import { maskMoneyBR } from '@/utils/masks'
import { moedaParaNumero } from '@/utils/number'
import { UNIDADES } from '@/constantes/unidades'
import { CATEGORIAS_BASE } from '@/constantes/categorias-base'
import { ArquivosService } from '@/services/arquivos.service'

const props = defineProps({
  open: { type: Boolean, default: false },
  textoInicial: { type: String, default: '' },
  fornecedorId: { type: Number, default: null },
  fornecedorOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'created'])

const salvando = ref(false)
const erroLocal = ref('')
const nomeRef = ref(null)

// ===== imagem upload local =====
const imagemInput = ref(null)
const uploadingImagem = ref(false)
const removendoImagem = ref(false)
const modalImagemOpen = ref(false)
const fitasBorda = ref([])
const loadingFitasBorda = ref(false)
const metragemRoloInput = ref('')

const imagemFile = ref(null)          // File selecionado
const imagemTempUrl = ref('')         // preview local (URL.createObjectURL)
const nomeArquivoImagem = computed(() => imagemFile.value?.name || '')

const form = reactive({
  fornecedor_id: null,
  nome_produto: '',
  cor: '',
  medida: '',
  metragem_rolo_m: null,
  unidade: 'M',
  categoria_base: 'PRIMARIA',
  fita_vinculada_id: null,
  fita_vinculada: null,
  marca: '',
  valor_unitario_mask: '0,00',
  status: 'ATIVO',
  imagem_url: '',
})

const previewImagem = computed(() => {
  if (imagemTempUrl.value) return imagemTempUrl.value
  const url = String(form.imagem_url || '').trim()
  return url.length ? url : ''
})

const unidadesOptions = computed(() =>
  (Array.isArray(UNIDADES) ? UNIDADES : []).map((u) => ({
    value: u.key,
    label: u.label,
  })),
)
const fornecedorOptionsInternas = computed(() =>
  (Array.isArray(props.fornecedorOptions) ? props.fornecedorOptions : [])
    .map((f) => ({
      value: Number(f?.value ?? f?.id ?? 0),
      label: String(f?.label ?? f?.nome_fantasia ?? f?.razao_social ?? '').trim(),
    }))
    .filter((f) => f.value > 0 && f.label),
)
const categoriasBaseOptions = computed(() => CATEGORIAS_BASE)
const ehFitaBorda = computed(() => String(form.categoria_base || '').trim().toUpperCase() === 'FITA_BORDA')
const ehCategoriaComercial = computed(() => ['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'].includes(String(form.categoria_base || '').trim().toUpperCase()))

function normalizeNumber(value) {
  const raw = String(value ?? '').replace(',', '.').trim()
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function formatarMetragemRolo(metragem) {
  const valor = normalizeNumber(metragem)
  if (valor == null || valor <= 0) return '-'
  return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} m`
}

function calcularValorFitaPorMetro(produto) {
  const valorUnitario = Number(produto?.valor_unitario || 0)
  const metragemRolo = normalizeNumber(produto?.metragem_rolo_m)
  if (!metragemRolo || metragemRolo <= 0) return 0
  return Math.round(((valorUnitario / metragemRolo) + Number.EPSILON) * 10000) / 10000
}

function montarLabelFita(produto) {
  const partes = [
    produto?.nome_produto,
    produto?.cor,
    formatarMetragemRolo(produto?.metragem_rolo_m),
    maskMoneyBR(Number(produto?.valor_unitario || 0)),
  ].filter(Boolean)

  return partes.join(' · ')
}

const fitasBordaOptions = computed(() =>
  (fitasBorda.value || []).map((produto) => ({
    value: produto.id,
    label: montarLabelFita(produto),
  })),
)

const fitaVinculadaSelecionada = computed(() => {
  const fitaId = Number(form.fita_vinculada_id || 0)
  if (!fitaId) return form.fita_vinculada || null
  return fitasBorda.value.find((produto) => Number(produto.id) === fitaId) || form.fita_vinculada || null
})

const textoVinculoFita = computed(() => {
  if (loadingFitasBorda.value) return 'CARREGANDO FITAS DE BORDA DISPONÍVEIS.'
  if (!fitaVinculadaSelecionada.value) return 'AO SELECIONAR UMA FITA, O ADICIONAL DE FITA / M² SERÁ CALCULADO AUTOMATICAMENTE.'
  return `${maskMoneyBR(calcularValorFitaPorMetro(fitaVinculadaSelecionada.value))}/M A PARTIR DE ${maskMoneyBR(Number(fitaVinculadaSelecionada.value?.valor_unitario || 0))} POR ${formatarMetragemRolo(fitaVinculadaSelecionada.value?.metragem_rolo_m)}.`
})

function norm(v) {
  const s = String(v ?? '').trim().toUpperCase()
  return s || null
}

function limparImagemLocal() {
  if (imagemTempUrl.value) {
    try { URL.revokeObjectURL(imagemTempUrl.value) } catch {}
  }
  imagemTempUrl.value = ''
  imagemFile.value = null
  if (imagemInput.value) imagemInput.value.value = ''
}

function removerImagemLocal() {
  removendoImagem.value = true
  try {
    limparImagemLocal()
    form.imagem_url = ''
  } finally {
    removendoImagem.value = false
  }
}

function resetForm() {
  erroLocal.value = ''
  Object.assign(form, {
    fornecedor_id: props.fornecedorId ? Number(props.fornecedorId) : null,
    nome_produto: props.textoInicial || '',
    cor: '',
    medida: '',
    metragem_rolo_m: null,
    unidade: 'M',
    categoria_base: 'PRIMARIA',
    fita_vinculada_id: null,
    fita_vinculada: null,
    marca: '',
    valor_unitario_mask: '0,00',
    status: 'ATIVO',
    imagem_url: '',
  })
  metragemRoloInput.value = ''
  limparImagemLocal()
}

async function carregarFitasBorda() {
  loadingFitasBorda.value = true
  try {
    const res = await ProdutosService.buscarComFiltros({ categoria_base: 'FITA_BORDA' })
    const data = res?.data ?? res
    fitasBorda.value = (Array.isArray(data) ? data : []).map((produto) => ({
      ...produto,
      metragem_rolo_m: normalizeNumber(produto?.metragem_rolo_m),
      valor_unitario: Number(produto?.valor_unitario || 0),
    }))
  } catch (e) {
    console.log('[MODAL PRODUTO] erro ao carregar fitas:', e?.response?.data || e)
    fitasBorda.value = []
  } finally {
    loadingFitasBorda.value = false
  }
}

async function existeDuplicadoNoFornecedor(payloadCheck, fornecedorId) {
  if (!fornecedorId) return false

  const res = await ProdutosService.listar({ fornecedor_id: Number(fornecedorId) })
  const data = res?.data ?? res
  const lista = Array.isArray(data) ? data : []

  return lista.some((p) => {
    return (
      norm(p.nome_produto) === payloadCheck.nome_produto &&
      norm(p.marca) === payloadCheck.marca &&
      norm(p.cor) === payloadCheck.cor &&
      norm(p.medida) === payloadCheck.medida
    )
  })
}

function abrirPreviewImagem() {
  if (!previewImagem.value) return
  modalImagemOpen.value = true
}

async function onImagemPick(e) {
  const file = e?.target?.files?.[0]
  if (!file) return

  if (!file.type?.startsWith('image/')) {
    notify.error('Selecione um arquivo de imagem.')
    if (imagemInput.value) imagemInput.value.value = ''
    return
  }

  // troca preview temporário
  if (imagemTempUrl.value) {
    try { URL.revokeObjectURL(imagemTempUrl.value) } catch {}
  }

  imagemFile.value = file
  imagemTempUrl.value = URL.createObjectURL(file)
}

const handleEsc = (e) => {
  if (e.key === 'Escape') {
    if (modalImagemOpen.value) {
      modalImagemOpen.value = false
      return
    }
    if (props.open) emit('close')
  }
}

onMounted(() => window.addEventListener('keydown', handleEsc))
onUnmounted(() => {
  window.removeEventListener('keydown', handleEsc)
  if (imagemTempUrl.value) {
    try { URL.revokeObjectURL(imagemTempUrl.value) } catch {}
  }
})

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    resetForm()
    await carregarFitasBorda()
    await nextTick()
    try {
      nomeRef.value?.$el?.querySelector?.('input')?.focus?.()
    } catch {}
  },
)

watch(metragemRoloInput, (value) => {
  const parsed = normalizeNumber(value)
  form.metragem_rolo_m = parsed != null && parsed > 0 ? parsed : null
})

watch(
  () => form.categoria_base,
  (categoriaAtual, categoriaAnterior) => {
    const categoria = String(categoriaAtual || '').trim().toUpperCase()
    const anterior = String(categoriaAnterior || '').trim().toUpperCase()

    if (!['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'].includes(categoria)) {
      form.fita_vinculada_id = null
      form.fita_vinculada = null
    }

    if (categoria !== 'FITA_BORDA') {
      form.metragem_rolo_m = null
      metragemRoloInput.value = ''
      if (anterior === 'FITA_BORDA') {
        form.medida = ''
      }
      return
    }

    form.medida = ''
  },
)

watch(
  () => form.fita_vinculada_id,
  (fitaId) => {
    const fitaSelecionada = fitasBorda.value.find((produto) => Number(produto.id) === Number(fitaId || 0))
    form.fita_vinculada = fitaSelecionada || null
  },
)

async function salvar() {
  erroLocal.value = ''

  const fornecedorIdSelecionado = Number(form.fornecedor_id || props.fornecedorId || 0)
  if (!fornecedorIdSelecionado) {
    notify.warn('Selecione o fornecedor do produto.')
    return
  }
  if (!form.nome_produto?.trim()) {
    notify.warn('Informe o nome do produto.')
    return
  }
  if (!form.unidade) {
    notify.warn('Selecione a unidade.')
    return
  }
  if (!form.categoria_base) {
    notify.warn('Selecione a categoria base.')
    return
  }
  if (ehFitaBorda.value && (!form.metragem_rolo_m || Number(form.metragem_rolo_m) <= 0)) {
    notify.warn('Informe a metragem do rolo da fita.')
    return
  }

  const valorNum = moedaParaNumero(form.valor_unitario_mask)
if (!Number(valorNum || 0)) {
  notify.warn('Informe o valor unitário.')
  return
}

  const payload = {
    fornecedor_id: fornecedorIdSelecionado,
    nome_produto: form.nome_produto.trim(),
    cor: form.cor?.trim() ? form.cor.trim() : null,
    medida: ehFitaBorda.value ? `${String(form.metragem_rolo_m).replace(/\.0+$|0+$/g, '').replace(/\.$/, '')}m` : (form.medida?.trim() ? form.medida.trim() : null),
    metragem_rolo_m: ehFitaBorda.value && form.metragem_rolo_m != null ? Number(form.metragem_rolo_m) : null,
    unidade: form.unidade || 'M',
    marca: form.marca?.trim() ? form.marca.trim() : null,
    categoria_base: form.categoria_base ? String(form.categoria_base).trim().toUpperCase() : 'PRIMARIA',
    fita_vinculada_id:
      ehCategoriaComercial.value && form.fita_vinculada_id
        ? Number(form.fita_vinculada_id)
        : null,
    adicional_fita_m2:
      ehCategoriaComercial.value && fitaVinculadaSelecionada.value
        ? calcularValorFitaPorMetro(fitaVinculadaSelecionada.value)
        : null,
    valor_unitario: Number(valorNum || 0),
    status: form.status,
    imagem_url: null,
  }

  // check duplicado no front
  try {
    const check = {
      nome_produto: norm(payload.nome_produto),
      marca: norm(payload.marca),
      cor: norm(payload.cor),
      medida: norm(payload.medida),
    }

    const dup = await existeDuplicadoNoFornecedor(check, fornecedorIdSelecionado)
    if (dup) {
      erroLocal.value = 'Produto duplicado para este fornecedor (mesmo nome/marca/cor/medida).'
      notify.warn('Produto duplicado.')
      return
    }
  } catch (e) {
    console.log('[MODAL PRODUTO] erro check duplicado:', e?.response?.data || e)
  }

  salvando.value = true
  try {
    // 1) cria produto
    const res = await ProdutosService.salvar(null, payload)
    const produtoCriado = res?.data ?? res
    const id = produtoCriado?.id

    // 2) se tiver imagem selecionada, sobe e grava imagem_url
    if (id && imagemFile.value) {
      uploadingImagem.value = true
      try {
        const up = await ArquivosService.upload({
          ownerType: 'PRODUTO',
          ownerId: id,
          categoria: 'IMAGEM',
          slotKey: 'IMAGEM_PRINCIPAL',
          file: imagemFile.value,
        })

        const arq = up?.data ?? up
        const url = arq?.url

        if (url) {
          form.imagem_url = url
          await ProdutosService.salvar(id, { imagem_url: url })
          produtoCriado.imagem_url = url

          // ✅ troca o preview do blob pela url real
          limparImagemLocal()
        } else {
          notify.error('Upload ok, mas não retornou URL.')
        }
      } catch (err) {
        notify.error(err?.response?.data?.message || 'Erro ao enviar imagem.')
      } finally {
        uploadingImagem.value = false
      }
    }

    emit('created', produtoCriado)
    emit('close')
    notify.success('Produto cadastrado!')
  } catch (error) {
    console.log('[MODAL PRODUTO] erro:', error?.response?.data || error)
    notify.error(error?.response?.data?.message || 'Erro ao salvar produto.')
  } finally {
    salvando.value = false
  }
}
</script>


<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
