<template>
  <!-- MODAL PRINCIPAL -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div class="w-full max-w-2xl max-h-[85vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
          <!-- Header -->
          <header class="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-[1.1rem] bg-slate-900 flex items-center justify-center text-white shadow-lg">
                <i class="pi pi-box text-lg"></i>
              </div>

              <div>
                <h3 class="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">
                  Cadastrar Produto
                </h3>
                <div class="flex items-center gap-2 mt-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Ficha Técnica do Item
                  </p>
                </div>
              </div>
            </div>

            <button
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
              @click="emit('close')"
              type="button"
            >
              <i class="pi pi-times text-xs"></i>
            </button>
          </header>

          <!-- Body -->
          <div class="p-6 overflow-y-auto">
            <div class="grid grid-cols-12 gap-x-6 gap-y-6">
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
                  v-model="form.medida"
                  label="Espessura"
                  placeholder="EX: 18MM"
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
        class="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
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
import { ArquivosService } from '@/services/arquivos.service'

const props = defineProps({
  open: { type: Boolean, default: false },
  textoInicial: { type: String, default: '' },
  fornecedorId: { type: Number, default: null },
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

const imagemFile = ref(null)          // File selecionado
const imagemTempUrl = ref('')         // preview local (URL.createObjectURL)
const nomeArquivoImagem = computed(() => imagemFile.value?.name || '')

const form = reactive({
  nome_produto: '',
  cor: '',
  medida: '',
  unidade: 'METRO',
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
    nome_produto: props.textoInicial || '',
    cor: '',
    medida: '',
    unidade: 'METRO',
    marca: '',
    valor_unitario_mask: '0,00',
    status: 'ATIVO',
    imagem_url: '',
  })
  limparImagemLocal()
}

async function existeDuplicadoNoFornecedor(payloadCheck) {
  if (!props.fornecedorId) return false

  const res = await ProdutosService.listar({ fornecedor_id: props.fornecedorId })
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
    await nextTick()
    try {
      nomeRef.value?.$el?.querySelector?.('input')?.focus?.()
    } catch {}
  },
)

async function salvar() {
  erroLocal.value = ''

  if (!props.fornecedorId) {
    notify.warn('Selecione um fornecedor antes.')
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

  const valorNum = moedaParaNumero(form.valor_unitario_mask)
if (!Number(valorNum || 0)) {
  notify.warn('Informe o valor unitário.')
  return
}

  const payload = {
    fornecedor_id: props.fornecedorId,
    nome_produto: form.nome_produto.trim(),
    cor: form.cor?.trim() ? form.cor.trim() : null,
    medida: form.medida?.trim() ? form.medida.trim() : null,
    unidade: form.unidade || 'METRO',
    marca: form.marca?.trim() ? form.marca.trim() : null,
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

    const dup = await existeDuplicadoNoFornecedor(check)
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
