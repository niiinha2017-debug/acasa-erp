<template>
  <PageShell :padded="false">
    <section class="login-font sobra-editor ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        :title="isEdit ? `Editar Sobra #${sobraId}` : 'Lançar Sobra no Estoque'"
        subtitle="Registro de sobra reaproveitável para contagem e controle de estoque"
        icon="pi pi-box"
      />

      <div class="sobra-body ds-editor-body">
        <div v-if="loading" class="py-24 flex flex-col items-center justify-center gap-4">
          <div class="w-10 h-10 border-2 border-border-ui border-t-brand-primary rounded-full animate-spin"></div>
          <p class="text-xs font-medium text-text-muted uppercase tracking-widest">Carregando...</p>
        </div>

        <form v-else class="sobra-form ds-editor-form" @submit.prevent="confirmarSalvar" autocomplete="off">
          <!-- SEÇÃO: Material de Origem -->
          <div class="sobra-form__lead grid grid-cols-12 gap-6 items-end">
            <div class="col-span-12 md:col-span-6">
              <SearchInput
                v-model="form.produto_id"
                mode="select"
                variant="line"
                hide-search-icon
                label="Material de Origem *"
                :options="produtoOptions"
                required
                placeholder="Selecione o produto/material"
                :disabled="isEdit"
              />
            </div>

            <div class="col-span-12 md:col-span-3">
              <SearchInput
                v-model="form.status"
                mode="select"
                variant="line"
                hide-search-icon
                label="Status"
                :options="statusOptions"
                required
              />
            </div>
          </div>

          <!-- Dados do material selecionado -->
          <div v-if="produtoSelecionado" class="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border-ui/50">
            <p class="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2 flex items-center gap-2">
              <i class="pi pi-info-circle text-blue-500" />
              Dados do Material
            </p>
            <div class="grid grid-cols-12 gap-4 text-sm">
              <div class="col-span-6 md:col-span-3">
                <span class="text-text-muted text-xs block">Material</span>
                <span class="font-medium text-text-main">{{ produtoSelecionado.nome_produto || '-' }}</span>
              </div>
              <div class="col-span-6 md:col-span-2">
                <span class="text-text-muted text-xs block">Cor</span>
                <span class="font-medium text-text-main">{{ produtoSelecionado.cor || '-' }}</span>
              </div>
              <div class="col-span-6 md:col-span-2">
                <span class="text-text-muted text-xs block">Marca</span>
                <span class="font-medium text-text-main">{{ produtoSelecionado.marca || '-' }}</span>
              </div>
              <div class="col-span-6 md:col-span-2">
                <span class="text-text-muted text-xs block">Medida original</span>
                <span class="font-medium text-text-main">{{ produtoSelecionado.medida || '-' }}</span>
              </div>
              <div class="col-span-6 md:col-span-3">
                <span class="text-text-muted text-xs block">Espessura</span>
                <span class="font-medium text-text-main">{{ produtoSelecionado.espessura_mm ? `${produtoSelecionado.espessura_mm} mm` : '-' }}</span>
              </div>
            </div>
          </div>

          <!-- SEÇÃO: Dimensões da Sobra -->
          <div class="section-divider ds-section-divider relative mt-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="section-title ds-section-title">Dimensões da Sobra</span>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-6">
            <div class="col-span-12 lg:col-span-4 xl:col-span-3">
              <div class="sobra-imagem w-full max-w-[220px]">
                <div
                  class="sobra-imagem__dropzone relative group w-[200px] max-w-full h-[200px] flex flex-col items-center justify-center overflow-hidden cursor-pointer"
                  @click="previewImagem ? abrirPreviewImagem() : (imagemInput?.click())"
                >
                  <img v-if="previewImagem" :src="previewImagem" class="w-full h-full object-contain p-3" />
                  <div v-else class="text-center p-4">
                    <i class="pi pi-image text-slate-300 text-2xl mb-2"></i>
                    <p class="text-[10px] text-slate-400 font-medium uppercase tracking-tighter leading-tight">
                      Foto da sobra
                    </p>
                  </div>

                  <div
                    v-if="(isEdit && can('produtos.editar')) || (!isEdit && can('produtos.criar'))"
                    class="sobra-imagem__actions absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                    @click.stop
                  >
                    <button type="button" @click.stop="imagemInput?.click()" class="p-2 bg-white rounded-lg text-slate-900 hover:scale-110 transition-transform">
                      <i class="pi pi-upload"></i>
                    </button>
                    <button v-if="previewImagem" type="button" @click.stop="removerImagem" class="p-2 bg-white rounded-lg text-rose-600 hover:scale-110 transition-transform">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </div>
                <input ref="imagemInput" type="file" class="hidden" accept="image/*" @change="onImagemPick" />
                <p class="text-[10px] text-slate-500 mt-3 leading-relaxed">
                  Foto da sobra para referência visual.
                </p>
              </div>
            </div>

            <div class="col-span-12 lg:col-span-8 xl:col-span-9">
              <div class="grid grid-cols-12 gap-6">
                <Input variant="line" class="col-span-12 md:col-span-4" v-model="form.largura_mm" label="Largura (mm) *" type="number" required placeholder="Ex: 800" />
                <Input variant="line" class="col-span-12 md:col-span-4" v-model="form.comprimento_mm" label="Comprimento (mm) *" type="number" required placeholder="Ex: 600" />

                <div class="col-span-12 md:col-span-4">
                  <div class="sobra-resumo">
                    <span class="sobra-resumo__label">Área calculada</span>
                    <span class="sobra-resumo__value">{{ areaM2Display }} m²</span>
                  </div>
                </div>

                <div class="col-span-12">
                  <Input variant="line" v-model="form.observacao" label="Observação" placeholder="Anotações sobre esta sobra (opcional)" />
                </div>
              </div>
            </div>
          </div>

          <!-- AÇÕES -->
          <div class="sobra-form__actions ds-editor-actions mt-6">
            <div class="flex items-center gap-3 justify-between">
              <div class="flex items-center gap-2">
                <Button
                  v-if="isEdit && can('produtos.ver')"
                  type="button"
                  variant="secondary"
                  @click="imprimirEtiqueta"
                >
                  <i class="pi pi-print mr-2 text-[12px]"></i>
                  Imprimir Etiqueta
                </Button>
              </div>
              <div class="flex items-center gap-3">
                <Button type="button" variant="secondary" @click="confirmarDescartar">
                  Cancelar
                </Button>
                <Button
                  v-if="can(isEdit ? 'produtos.editar' : 'produtos.criar')"
                  variant="primary"
                  type="submit"
                  :loading="salvando"
                >
                  <i class="pi pi-save mr-2 text-[12px]"></i>
                  {{ isEdit ? 'Atualizar Sobra' : 'Cadastrar Sobra' }}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Modal preview imagem -->
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
    </section>
  </PageShell>
</template>

<style scoped>
.login-font {
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.sobra-editor {
  min-height: 100%;
  background: var(--ds-color-surface);
}

.sobra-form__lead {
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(214, 224, 234, 0.55);
}

.sobra-imagem__dropzone {
  border-radius: 1rem;
  border: 1px dashed rgba(177, 190, 204, 0.9);
  background: rgba(248, 250, 252, 0.86);
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.sobra-imagem__dropzone:hover {
  border-color: rgba(148, 163, 184, 0.95);
  background: rgba(241, 245, 249, 0.92);
}

.sobra-imagem__actions {
  background: rgba(15, 23, 42, 0.38);
}

.sobra-resumo {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 70px;
  height: 100%;
  padding: 0.95rem 1rem;
  border-top: 1px solid rgba(214, 224, 234, 0.55);
  border-bottom: 1px solid rgba(214, 224, 234, 0.55);
}

.sobra-resumo__label {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 500;
}

.sobra-resumo__value {
  color: var(--ds-color-text);
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.25;
  font-variant-numeric: tabular-nums;
}

.dark .sobra-imagem__dropzone {
  border-color: rgba(71, 85, 105, 0.9);
  background: rgba(15, 23, 42, 0.4);
}

.dark .sobra-imagem__dropzone:hover {
  border-color: rgba(100, 116, 139, 0.95);
  background: rgba(15, 23, 42, 0.55);
}

.dark .sobra-resumo,
.dark .sobra-form__lead {
  border-color: rgba(51, 71, 102, 0.55);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { ProdutosService } from '@/services/index'
import { ArquivosService } from '@/services/arquivos.service'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { closeTabAndGo } from '@/utils/tabs'
import PageHeader from '@/components/ui/PageHeader.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

definePage({ meta: { perm: 'produtos.ver' } })

const route = useRoute()
const router = useRouter()

const rawId = computed(() => String(route.params.id || 'novo'))
const isEdit = computed(() => rawId.value !== 'novo')
const sobraId = computed(() =>
  isEdit.value ? Number(String(rawId.value).replace(/\D/g, '')) : null,
)

const loading = ref(false)
const salvando = ref(false)
const modalImagemOpen = ref(false)
const imagemInput = ref(null)

const produtos = ref([])
const produtoOptions = computed(() =>
  (produtos.value || []).map((p) => ({
    label: `${p.nome_produto || ''} ${p.cor ? `— ${p.cor}` : ''} ${p.medida ? `(${p.medida})` : ''}`.trim(),
    value: p.id,
  })),
)

const produtoSelecionado = computed(() => {
  if (!form.value.produto_id) return null
  return produtos.value.find((p) => p.id === Number(form.value.produto_id)) || dadosProdutoRemoto.value
})

const dadosProdutoRemoto = ref(null)

const statusOptions = [
  { label: 'Disponível', value: 'DISPONIVEL' },
  { label: 'Reservado', value: 'RESERVADO' },
]

const form = ref({
  produto_id: null,
  largura_mm: null,
  comprimento_mm: null,
  status: 'DISPONIVEL',
  imagem_url: '',
  observacao: '',
})

const areaM2 = computed(() => {
  const l = Number(form.value.largura_mm) || 0
  const c = Number(form.value.comprimento_mm) || 0
  if (l <= 0 || c <= 0) return 0
  return (l * c) / 1_000_000
})

const areaM2Display = computed(() => areaM2.value.toFixed(4))

// Imagem
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

function abrirPreviewImagem() {
  if (!previewImagem.value) return
  modalImagemOpen.value = true
}

function onImagemPick(e) {
  const file = e?.target?.files?.[0]
  if (!file) return
  if (!file.type?.startsWith('image/')) {
    notify.error('Selecione um arquivo de imagem.')
    if (imagemInput.value) imagemInput.value.value = ''
    return
  }
  pendingImagemFile.value = file
  if (imagemInput.value) imagemInput.value.value = ''
}

function removerImagem() {
  pendingImagemFile.value = null
  form.value.imagem_url = ''
}

// Carregar dados
async function carregarProdutos() {
  try {
    const resp = await ProdutosService.listar()
    const arr = resp?.data ?? resp
    const lista = Array.isArray(arr) ? arr : (arr?.data ?? [])
    produtos.value = lista
  } catch {
    produtos.value = []
  }
}

async function carregarSobra() {
  if (!sobraId.value) return
  const resp = await api.get(`/estoque/retalhos/${sobraId.value}`)
  const data = resp?.data ?? resp
  form.value = {
    produto_id: data.produto_id,
    largura_mm: data.largura_mm,
    comprimento_mm: data.comprimento_mm,
    status: data.status || 'DISPONIVEL',
    imagem_url: data.imagem_url || '',
    observacao: data.observacao || '',
  }
  if (data.produto) {
    dadosProdutoRemoto.value = data.produto
  }
}

// Validação
function validar() {
  if (!form.value.produto_id) return 'Selecione o material de origem.'
  if (!form.value.largura_mm || Number(form.value.largura_mm) <= 0) return 'Informe a largura em mm.'
  if (!form.value.comprimento_mm || Number(form.value.comprimento_mm) <= 0) return 'Informe o comprimento em mm.'
  return null
}

async function confirmarSalvar() {
  const perm = isEdit.value ? 'produtos.editar' : 'produtos.criar'
  if (!can(perm)) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    isEdit.value ? 'Salvar Alterações' : 'Cadastrar Sobra',
    isEdit.value
      ? `Deseja salvar as alterações da Sobra #${sobraId.value}?`
      : 'Deseja cadastrar esta sobra no estoque?',
  )
  if (!ok) return
  await salvar()
}

async function salvar() {
  const erro = validar()
  if (erro) return notify.error(erro)

  salvando.value = true
  try {
    const payload = {
      produto_id: Number(form.value.produto_id),
      largura_mm: Number(form.value.largura_mm),
      comprimento_mm: Number(form.value.comprimento_mm),
      status: form.value.status,
      imagem_url: form.value.imagem_url || null,
      observacao: form.value.observacao || null,
    }

    let result
    if (isEdit.value) {
      const resp = await api.put(`/estoque/retalhos/${sobraId.value}`, payload)
      result = resp?.data ?? resp
    } else {
      const resp = await api.post('/estoque/retalhos', payload)
      result = resp?.data ?? resp
    }

    const idSalvo = result?.id || sobraId.value

    // Upload de imagem pendente
    if (pendingImagemFile.value && idSalvo) {
      try {
        const up = await ArquivosService.upload({
          ownerType: 'ESTOQUE_RETALHO',
          ownerId: idSalvo,
          categoria: 'IMAGEM',
          slotKey: 'IMAGEM_PRINCIPAL',
          file: pendingImagemFile.value,
        })
        const arq = up?.data ?? up
        if (arq?.url) {
          await api.put(`/estoque/retalhos/${idSalvo}`, { imagem_url: arq.url })
        }
      } catch (err) {
        notify.error('Sobra salva, mas erro ao enviar imagem.')
      }
    }

    notify.success(isEdit.value ? 'Sobra atualizada!' : 'Sobra cadastrada!')
    closeTabAndGo('/estoque-retalho')
  } catch (err) {
    console.error(err)
    notify.error(err?.response?.data?.message || 'Erro ao salvar sobra.')
  } finally {
    salvando.value = false
  }
}

async function confirmarDescartar() {
  const ok = await confirm.show('Descartar', 'Deseja sair sem salvar? As alterações serão perdidas.')
  if (!ok) return
  router.push('/estoque-retalho')
}

function imprimirEtiqueta() {
  if (!sobraId.value) return
  const url = `${api.defaults.baseURL || '/api'}/estoque/retalhos/${sobraId.value}/etiqueta`
  window.open(url, '_blank')
}

onBeforeUnmount(() => {
  if (pendingImagemObjectUrl.value) URL.revokeObjectURL(pendingImagemObjectUrl.value)
})

onMounted(async () => {
  const perm = isEdit.value ? 'produtos.editar' : 'produtos.criar'
  if (!can(perm)) {
    notify.error('Acesso negado.')
    router.push('/estoque-retalho')
    return
  }

  loading.value = true
  try {
    await carregarProdutos()
    if (isEdit.value) {
      await carregarSobra()
    }
  } catch (err) {
    console.error('[SOBRA] erro no mounted:', err)
    notify.error('Erro ao carregar dados iniciais.')
    router.push('/estoque-retalho')
  } finally {
    loading.value = false
  }
})
</script>
