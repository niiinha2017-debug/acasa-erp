<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        @click.self="fechar"
      >
        <div class="w-full max-w-4xl max-h-[85vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
          <!-- Header -->
          <header class="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-[1.1rem] bg-slate-900 flex items-center justify-center text-white shadow-lg">
                <i class="pi pi-paperclip text-lg"></i>
              </div>

              <div>
                <h3 class="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">
                  Arquivos
                </h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {{ ownerType }} #{{ ownerId }}
                </p>
              </div>
            </div>

            <button
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
              @click="fechar"
              type="button"
            >
              <i class="pi pi-times text-xs"></i>
            </button>
          </header>

          <!-- Body -->
          <div class="p-6 overflow-y-auto space-y-4">
            <!-- Upload -->
            <input ref="fileRef" type="file" class="hidden" @change="onPickFile" />

            <div class="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Enviar arquivo
                </p>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {{ arquivoSelecionadoNome || 'Clique em selecionar' }}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  class="!h-10 !rounded-xl !px-4 text-[10px] font-black uppercase tracking-widest"
                  @click="fileRef?.click()"
                >
                  Selecionar
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  class="!h-10 !rounded-xl !px-4 text-[10px] font-black uppercase tracking-widest"
                  :loading="uploading"
                  :disabled="!fileToUpload"
                  @click="enviar"
                >
                  Enviar
                </Button>
              </div>
            </div>

            <!-- Lista -->
            <div class="rounded-2xl border border-slate-200 overflow-hidden">
              <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Arquivos anexados
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="!h-8 !rounded-xl !px-3 text-[10px] font-black uppercase tracking-widest"
                  :loading="loading"
                  @click="carregar"
                >
                  Atualizar
                </Button>
              </div>

              <div v-if="loading" class="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Carregando...
              </div>

              <div v-else-if="!arquivos.length" class="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nenhum arquivo.
              </div>

              <div v-else class="divide-y divide-slate-200">
                <div
                  v-for="a in arquivos"
                  :key="a.id"
                  class="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div class="min-w-0">
                    <div class="text-[11px] font-black uppercase text-slate-800 truncate">
                      {{ a.nome || a.filename }}
                    </div>
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                      {{ a.mime_type || 'ARQUIVO' }} • {{ a.tamanho ? `${a.tamanho} bytes` : '-' }}
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      class="!h-8 !rounded-xl !px-3 text-[10px] font-black uppercase tracking-widest"
                      :loading="previewingId === a.id"
                      @click="visualizar(a)"
                    >
                      Visualizar
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      class="!h-8 !rounded-xl !px-3 text-[10px] font-black uppercase tracking-widest"
                      :loading="deletingId === a.id"
                      @click="remover(a)"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Preview interno -->
            <div v-if="previewOpen" class="rounded-2xl border border-slate-200 overflow-hidden">
              <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div class="text-[10px] font-black uppercase tracking-widest text-slate-600 truncate">
                  {{ previewNome }}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  class="!h-8 !rounded-xl !px-3 text-[10px] font-black uppercase tracking-widest"
                  @click="fecharPreview"
                >
                  Fechar
                </Button>
              </div>

              <div class="p-4 bg-white">
                <img
                  v-if="previewTipo === 'image'"
                  :src="previewUrl"
                  class="w-full max-h-[55vh] object-contain rounded-xl"
                  alt="Preview"
                />

                <iframe
                  v-else-if="previewTipo === 'pdf'"
                  :src="previewUrl"
                  class="w-full h-[55vh] rounded-xl border border-slate-200"
                />

                <div v-else class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Pré-visualização não disponível.
                </div>
              </div>
            </div>

            <div v-if="erro" class="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-widest text-rose-600">
                {{ erro }}
              </p>
            </div>
          </div>

          <!-- Footer -->
          <footer class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
            <Button
              type="button"
              variant="secondary"
              class="!h-10 !rounded-xl !px-5 text-[10px] font-black uppercase tracking-widest"
              @click="fechar"
            >
              Fechar
            </Button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'

const props = defineProps({
  open: { type: Boolean, default: false },
  ownerType: { type: String, required: true },
  ownerId: { type: [String, Number], required: true },
  categoria: { type: String, default: null },
  slotKey: { type: String, default: null }, // opcional (imagem principal)
})

const emit = defineEmits(['close', 'updated'])

const arquivos = ref([])
const loading = ref(false)
const uploading = ref(false)
const deletingId = ref(null)
const erro = ref('')

const fileRef = ref(null)
const fileToUpload = ref(null)
const arquivoSelecionadoNome = ref('')

// preview interno
const previewOpen = ref(false)
const previewUrl = ref('')
const previewTipo = ref('') // 'image' | 'pdf' | 'other'
const previewNome = ref('')
const previewingId = ref(null)

function limparPreviewUrl() {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    try { URL.revokeObjectURL(previewUrl.value) } catch {}
  }
  previewUrl.value = ''
}

function fecharPreview() {
  previewOpen.value = false
  previewTipo.value = ''
  previewNome.value = ''
  previewingId.value = null
  limparPreviewUrl()
}

function fechar() {
  fecharPreview()
  emit('close')
}

onBeforeUnmount(() => {
  fecharPreview()
})

async function carregar() {
  erro.value = ''
  loading.value = true
  try {
    const res = await ArquivosService.listar({
      ownerType: props.ownerType,
      ownerId: props.ownerId,
      categoria: props.categoria,
    })
    const data = res?.data ?? res
    arquivos.value = Array.isArray(data) ? data : []
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao carregar arquivos.'
  } finally {
    loading.value = false
  }
}

function onPickFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  fileToUpload.value = file
  arquivoSelecionadoNome.value = file.name
}

async function enviar() {
  if (!fileToUpload.value) return
  erro.value = ''
  uploading.value = true
  try {
    await ArquivosService.upload({
      ownerType: props.ownerType,
      ownerId: props.ownerId,
      categoria: props.categoria,
      slotKey: props.slotKey,
      file: fileToUpload.value,
    })

    fileToUpload.value = null
    arquivoSelecionadoNome.value = ''
    if (fileRef.value) fileRef.value.value = ''

    notify.success('Arquivo enviado!')
    await carregar()
    emit('updated')
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao enviar arquivo.'
  } finally {
    uploading.value = false
  }
}

async function visualizar(arq) {
  if (!arq?.id) return
  previewingId.value = arq.id
  erro.value = ''
  try {
    const res = await ArquivosService.baixarBlob(arq.id)
    const type = arq?.mime_type || res?.headers?.['content-type'] || 'application/octet-stream'
    const blob = new Blob([res.data], { type })

    limparPreviewUrl()
    const url = URL.createObjectURL(blob)

    previewUrl.value = url
    previewNome.value = arq.nome || arq.filename || `ARQUIVO #${arq.id}`

    const low = String(type).toLowerCase()
    if (low.startsWith('image/')) previewTipo.value = 'image'
    else if (low.includes('pdf')) previewTipo.value = 'pdf'
    else previewTipo.value = 'other'

    previewOpen.value = true
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao visualizar.'
  } finally {
    previewingId.value = null
  }
}

async function remover(arq) {
  const ok = await confirm.show('Excluir Arquivo', 'Deseja excluir este arquivo?')
  if (!ok) return

  deletingId.value = arq.id
  erro.value = ''
  try {
    await ArquivosService.remover(arq.id)
    notify.success('Arquivo removido!')
    if (previewOpen.value) fecharPreview()
    await carregar()
    emit('updated')
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao remover arquivo.'
  } finally {
    deletingId.value = null
  }
}

watch(
  () => props.open,
  (v) => {
    if (v) carregar()
    else fecharPreview()
  },
)
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
