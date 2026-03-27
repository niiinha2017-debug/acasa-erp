<template>
  <PageShell :padded="false">
    <section class="ds-page-context ds-page-context--form animate-page-in">
      <PageHeader
        :title="`Editar Orçamento #${route.params.id}`"
        subtitle="Edite o orçamento, adicione ambientes e anexos"
        icon="pi pi-file-edit"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <Button variant="secondary" @click="voltar">
              <i class="pi pi-arrow-left" />
              Voltar
            </Button>
            <Button
              variant="secondary"
              :loading="loadingPdf"
              @click="gerarPdf"
            >
              <i class="pi pi-file-pdf" />
              Gerar PDF
            </Button>
            <Button
              variant="primary"
              :loading="salvando"
              @click="salvar"
            >
              <i class="pi pi-save" />
              Salvar Alterações
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="ds-page-context__content px-4 md:px-8 pb-8 pt-6">
        <div class="w-full">

          <!-- Cliente Section -->
          <section class="orcamento-section">
            <h2 class="text-sm font-black uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
              <i class="pi pi-user" />
              Dados do Cliente
            </h2>

            <div v-if="loading" class="py-8 text-center text-text-muted">
              <i class="pi pi-spin pi-spinner text-2xl" />
              <p class="mt-2">Carregando orçamento...</p>
            </div>

            <div v-else-if="cliente" class="bg-[var(--ds-color-surface-muted)] rounded-lg p-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <i class="pi pi-user text-xl" />
                </div>
                <div>
                  <div class="font-semibold text-text-main">{{ cliente.nome_completo || cliente.razao_social || 'Cliente' }}</div>
                  <div class="text-sm text-text-muted">
                    {{ cliente.cpf || cliente.cnpj || 'Sem documento' }}
                  </div>
                  <div class="text-sm text-text-muted">
                    {{ cliente.whatsapp || cliente.telefone || 'Sem telefone' }}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Ambientes / Itens Section -->
          <section class="orcamento-section">
            <div class="orcamento-section__header">
              <h2 class="text-sm font-black uppercase tracking-wider text-text-muted flex items-center gap-2">
                <i class="pi pi-box" />
                Ambientes / Itens
              </h2>
              <div class="text-sm text-text-muted">
                {{ itens.length }} ambiente(s) · Total: {{ formatValor(valorTotal) }}
              </div>
            </div>

            <div class="orcamento-items">
              <div
                v-for="(item, index) in itens"
                :key="item.id || index"
                class="orcamento-item"
              >
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold">
                      {{ index + 1 }}
                    </span>
                    <span class="text-sm font-semibold text-text-main">Ambiente {{ index + 1 }}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="removerItem(index)"
                  >
                    <i class="pi pi-trash text-danger" />
                  </Button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] gap-4">
                  <Input
                    v-model="item.nome_ambiente"
                    label="Nome do Ambiente *"
                    placeholder="Ex: Cozinha, Sala, Quarto..."
                    required
                  />
                  <Input
                    v-model="item.valor_unitario"
                    type="text"
                    label="Valor (R$) *"
                    placeholder="0,00"
                    :force-upper="false"
                    required
                  />
                </div>

                <div class="mt-3">
                  <label class="ds-field-label mb-1.5 block">
                    Descrição / Especificações
                  </label>
                  <textarea
                    v-model="item.descricao"
                    rows="3"
                    placeholder="Descreva os itens, materiais, acabamentos..."
                    class="ds-control-input w-full resize-none"
                  />
                </div>

                <div class="mt-3">
                  <label class="ds-field-label mb-1.5 block">
                    Observações Técnicas
                  </label>
                  <textarea
                    v-model="item.observacao"
                    rows="2"
                    placeholder="Observações para a equipe técnica..."
                    class="ds-control-input w-full resize-none"
                  />
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              class="w-full mt-4"
              @click="adicionarItem"
            >
              <i class="pi pi-plus" />
              Adicionar Ambiente
            </Button>
          </section>

          <!-- Anexos Section -->
          <section class="orcamento-section">
            <h2 class="text-sm font-black uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
              <i class="pi pi-paperclip" />
              Anexos
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Imagens -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-semibold text-text-main flex items-center gap-2">
                    <i class="pi pi-image text-brand-primary" />
                    Imagens
                  </label>
                  <input
                    ref="inputImagens"
                    type="file"
                    accept="image/*"
                    multiple
                    class="hidden"
                    @change="onSelecionarImagens"
                  >
                  <Button variant="outline" size="sm" @click="$refs.inputImagens.click()">
                    <i class="pi pi-plus" />
                    Adicionar
                  </Button>
                </div>

                <div v-if="imagens.length === 0" class="text-sm text-text-muted py-4 text-center bg-[var(--ds-color-surface-muted)] rounded-lg">
                  Nenhuma imagem adicionada
                </div>

                <div v-else class="space-y-2 max-h-60 overflow-y-auto">
                  <div
                    v-for="(img, idx) in imagens"
                    :key="img.id || idx"
                    class="flex items-center gap-3 p-2 bg-[var(--ds-color-surface-muted)] rounded-lg"
                  >
                    <div class="w-10 h-10 rounded bg-white dark:bg-surface-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        v-if="img.preview || img.url"
                        :src="img.preview || img.url"
                        class="w-full h-full object-cover"
                      >
                      <i v-else class="pi pi-image text-text-muted" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm truncate">{{ img.nome }}</div>
                      <div class="text-xs text-text-muted">{{ formatBytes(img.tamanho) }}</div>
                    </div>
                    <button
                      class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                      @click="removerImagem(idx)"
                    >
                      <i class="pi pi-times" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Arquivos -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-semibold text-text-main flex items-center gap-2">
                    <i class="pi pi-file text-brand-primary" />
                    Arquivos
                  </label>
                  <input
                    ref="inputArquivos"
                    type="file"
                    multiple
                    class="hidden"
                    @change="onSelecionarArquivos"
                  >
                  <Button variant="outline" size="sm" @click="$refs.inputArquivos.click()">
                    <i class="pi pi-plus" />
                    Adicionar
                  </Button>
                </div>

                <div v-if="arquivos.length === 0" class="text-sm text-text-muted py-4 text-center bg-[var(--ds-color-surface-muted)] rounded-lg">
                  Nenhum arquivo adicionado
                </div>

                <div v-else class="space-y-2 max-h-60 overflow-y-auto">
                  <div
                    v-for="(arq, idx) in arquivos"
                    :key="arq.id || idx"
                    class="flex items-center gap-3 p-2 bg-[var(--ds-color-surface-muted)] rounded-lg"
                  >
                    <div class="w-10 h-10 rounded bg-white dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                      <i :class="getIconArquivo(arq.tipo)" class="text-brand-primary" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm truncate">{{ arq.nome }}</div>
                      <div class="text-xs text-text-muted">{{ formatBytes(arq.tamanho) }}</div>
                    </div>
                    <button
                      class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                      @click="removerArquivo(idx)"
                    >
                      <i class="pi pi-times" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Resumo -->
          <section class="orcamento-section orcamento-section--total">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-semibold text-text-main">Valor Total do Orçamento</div>
                <div class="text-xs text-text-muted">
                  {{ itens.length }} ambiente(s) · {{ itens.length }} item(ns)
                </div>
              </div>
              <div class="text-3xl font-black text-brand-primary">
                {{ formatValor(valorTotal) }}
              </div>
            </div>
          </section>

          <!-- Ações -->
          <div class="orcamento-actions flex items-center justify-between">
            <Button variant="ghost" @click="voltar">
              <i class="pi pi-arrow-left" />
              Cancelar
            </Button>
            <div class="flex items-center gap-2">
              <Button
                variant="secondary"
                :loading="loadingPdf"
                @click="gerarPdf"
              >
                <i class="pi pi-file-pdf" />
                Gerar PDF
              </Button>
              <Button
                variant="primary"
                size="lg"
                :loading="salvando"
                @click="salvar"
              >
                <i class="pi pi-save" />
                Salvar Alterações
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { OrcamentosService, ArquivosService } from '@/services'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'orcamentos.editar' } })

const route = useRoute()
const router = useRouter()
const orcamentoId = computed(() => route.params.id)

// Estado
const loading = ref(false)
const salvando = ref(false)
const loadingPdf = ref(false)
const cliente = ref(null)
const itens = ref([])
const imagens = ref([])
const arquivos = ref([])
const itensRemovidos = ref([])

// Helpers
function formatValor(valor) {
  const n = Number(valor || 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseValorMonetario(valor) {
  const raw = String(valor ?? '').trim()
  if (!raw) return 0
  let normalized = raw.replace(/[R$\s]/g, '').replace(/[^\d,.-]/g, '')
  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.')
  }
  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getIconArquivo(mimeType) {
  if (!mimeType) return 'pi pi-file'
  if (mimeType.includes('pdf')) return 'pi pi-file-pdf'
  if (mimeType.includes('word') || mimeType.includes('doc')) return 'pi pi-file-word'
  if (mimeType.includes('excel') || mimeType.includes('sheet') || mimeType.includes('csv')) return 'pi pi-file-excel'
  if (mimeType.includes('image')) return 'pi pi-image'
  return 'pi pi-file'
}

const valorTotal = computed(() => {
  return itens.value.reduce((acc, item) => acc + parseValorMonetario(item.valor_unitario), 0)
})

// Métodos
function adicionarItem() {
  itens.value.push({
    nome_ambiente: '',
    descricao: '',
    observacao: '',
    valor_unitario: ''
  })
}

function removerItem(index) {
  const item = itens.value[index]
  if (item.id) {
    itensRemovidos.value.push(item.id)
  }
  itens.value.splice(index, 1)
}

function onSelecionarImagens(event) {
  const files = event.target.files
  if (!files) return

  for (const file of files) {
    const reader = new FileReader()
    reader.onload = (e) => {
      imagens.value.push({
        arquivo: file,
        nome: file.name,
        tamanho: file.size,
        tipo: file.type,
        preview: e.target.result,
        novo: true
      })
    }
    reader.readAsDataURL(file)
  }
  event.target.value = ''
}

function removerImagem(index) {
  const img = imagens.value[index]
  if (img.id && !img.novo) {
    // TODO: marcar para exclusão no backend
  }
  imagens.value.splice(index, 1)
}

function onSelecionarArquivos(event) {
  const files = event.target.files
  if (!files) return

  for (const file of files) {
    arquivos.value.push({
      arquivo: file,
      nome: file.name,
      tamanho: file.size,
      tipo: file.type,
      novo: true
    })
  }
  event.target.value = ''
}

function removerArquivo(index) {
  const arq = arquivos.value[index]
  if (arq.id && !arq.novo) {
    // TODO: marcar para exclusão no backend
  }
  arquivos.value.splice(index, 1)
}

async function carregarOrcamento() {
  loading.value = true
  try {
    const { data } = await OrcamentosService.detalhar(orcamentoId.value)
    if (data?.cliente) {
      cliente.value = data.cliente
    }
    if (data?.itens) {
      itens.value = data.itens.map(item => ({
        id: item.id,
        nome_ambiente: item.nome_ambiente || '',
        descricao: item.descricao || '',
        observacao: item.observacao || '',
        valor_unitario: item.valor_unitario || item.valor_total || ''
      }))
    }
  } catch (e) {
    console.error(e)
    notify.error('Erro ao carregar orçamento')
  } finally {
    loading.value = false
  }
}

async function carregarArquivos() {
  try {
    const { data } = await ArquivosService.listar({
      ownerType: 'ORCAMENTO',
      ownerId: orcamentoId.value
    })
    if (data) {
      imagens.value = []
      arquivos.value = []
      for (const arq of data) {
        const item = {
          id: arq.id,
          nome: arq.nome || arq.filename,
          tamanho: arq.tamanho || 0,
          tipo: arq.mime_type,
          url: arq.url
        }
        if (arq.categoria === 'IMAGEM_PDF' || arq.mime_type?.startsWith('image/')) {
          imagens.value.push(item)
        } else {
          arquivos.value.push(item)
        }
      }
    }
  } catch (e) {
    console.error(e)
  }
}

async function salvar() {
  if (itens.value.length === 0) {
    notify.error('Adicione pelo menos um ambiente')
    return
  }

  for (const item of itens.value) {
    if (!item.nome_ambiente || !item.valor_unitario) {
      notify.error('Preencha o nome e valor de todos os ambientes')
      return
    }
  }

  salvando.value = true
  try {
    // Atualizar itens existentes
    for (const item of itens.value) {
      if (item.id) {
        await OrcamentosService.atualizarItem(orcamentoId.value, item.id, {
          nome_ambiente: item.nome_ambiente,
          descricao: item.descricao,
          observacao: item.observacao,
          valor_unitario: parseValorMonetario(item.valor_unitario)
        })
      } else {
        await OrcamentosService.adicionarItem(orcamentoId.value, {
          nome_ambiente: item.nome_ambiente,
          descricao: item.descricao,
          observacao: item.observacao,
          valor_unitario: parseValorMonetario(item.valor_unitario)
        })
      }
    }

    // Remover itens excluídos
    for (const itemId of itensRemovidos.value) {
      await OrcamentosService.removerItem(orcamentoId.value, itemId)
    }

    // Upload de novas imagens
    for (const img of imagens.value.filter(i => i.novo)) {
      if (img.arquivo) {
        await ArquivosService.upload({
          ownerType: 'ORCAMENTO',
          ownerId: orcamentoId.value,
          categoria: 'IMAGEM_PDF',
          file: img.arquivo
        })
      }
    }

    // Upload de novos arquivos
    for (const arq of arquivos.value.filter(a => a.novo)) {
      if (arq.arquivo) {
        await ArquivosService.upload({
          ownerType: 'ORCAMENTO',
          ownerId: orcamentoId.value,
          categoria: 'ARQUIVO',
          file: arq.arquivo
        })
      }
    }

    notify.success('Orçamento atualizado com sucesso!')
    itensRemovidos.value = []
    await carregarOrcamento()
    await carregarArquivos()
  } catch (e) {
    console.error(e)
    const msg = e?.response?.data?.message || 'Erro ao salvar orçamento'
    notify.error(Array.isArray(msg) ? msg.join(', ') : msg)
  } finally {
    salvando.value = false
  }
}

async function gerarPdf() {
  loadingPdf.value = true
  try {
    const { data } = await OrcamentosService.abrirPdf(orcamentoId.value, {
      incluirTermos: true
    })
    if (data?.arquivoId) {
      const baseUrl = import.meta.env.VITE_API_URL || ''
      const url = `${baseUrl}/uploads/relatorios/orcamento_${orcamentoId.value}.pdf`
      window.open(url, '_blank')
      notify.success('PDF gerado com sucesso!')
    }
  } catch (e) {
    console.error(e)
    notify.error('Erro ao gerar PDF')
  } finally {
    loadingPdf.value = false
  }
}

function voltar() {
  router.push('/comercial/orcamentos')
}

onMounted(() => {
  carregarOrcamento()
  carregarArquivos()
})
</script>

<style scoped>
.orcamento-section {
  padding: 1.25rem 0;
}

.orcamento-section__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin-bottom: 0.75rem;
}

.orcamento-section + .orcamento-section {
  border-top: 1px solid var(--ds-color-border, #e5e7eb);
}

.orcamento-items {
  display: flex;
  flex-direction: column;
}

.orcamento-item {
  padding: 0.9rem;
  border: 1px solid var(--ds-color-border, #e5e7eb);
  border-radius: 0;
  background: transparent;
}

.orcamento-item + .orcamento-item {
  margin-top: 0.75rem;
}

.orcamento-item :deep(textarea.ds-control-input) {
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}

.orcamento-item :deep(textarea.ds-control-input:focus) {
  box-shadow: none;
  border-color: var(--ds-color-border, #e5e7eb);
}

.orcamento-section--total {
  background: color-mix(in srgb, var(--ds-color-primary) 6%, transparent);
  border-radius: 0.75rem;
  padding-inline: 1rem;
}

.orcamento-actions {
  border-top: 1px solid var(--ds-color-border, #e5e7eb);
  padding-top: 1.25rem;
}
</style>
