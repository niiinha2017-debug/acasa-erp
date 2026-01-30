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
                <Button v-if="canManage"
                  type="button"
                  variant="secondary"
                  size="sm"
                  class="!h-10 !rounded-xl !px-4 text-[10px] font-black uppercase tracking-widest"
                  @click="fileRef?.click()"
                >
                  Selecionar
                </Button>

                <Button v-if="canManage"
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
                  v-for="a in arquivosOrdenados"
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
                      @click="visualizar(a)"
                    >
                      Visualizar
                    </Button>

                    <Button v-if="canManage"
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'

const props = defineProps({
  open: { type: Boolean, default: false },
  ownerType: { type: String, required: true },
  ownerId: { type: [String, Number], required: true },
  categoria: { type: String, default: null },
  slotKey: { type: String, default: null },
  canManage: { type: Boolean, default: true }, // ✅ aqui, no único defineProps
})

const emit = defineEmits(['close', 'updated'])
const router = useRouter()

const arquivos = ref([])
const loading = ref(false)
const uploading = ref(false)
const deletingId = ref(null)
const erro = ref('')

const fileRef = ref(null)
const fileToUpload = ref(null)
const arquivoSelecionadoNome = ref('')

const arquivosOrdenados = computed(() => {
  const arr = Array.isArray(arquivos.value) ? arquivos.value : []
  return [...arr].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))
})

function fechar() {
  fileToUpload.value = null
  arquivoSelecionadoNome.value = ''
  if (fileRef.value) fileRef.value.value = ''
  emit('close')
}

async function carregar() {
  if (!props.ownerType || !props.ownerId) return
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
  if (!props.canManage) return
  const file = e.target.files?.[0]
  if (!file) return
  fileToUpload.value = file
  arquivoSelecionadoNome.value = file.name
}

async function enviar() {
  if (!props.canManage) return notify.error('Acesso negado.')
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

function visualizar(arq) {
  if (!arq?.id) return
  fechar()
  router.push({
    path: `/arquivos/${arq.id}`,
    query: {
      name: arq.nome || arq.filename || `ARQUIVO_${arq.id}`,
      type: arq.mime_type || '',
    },
  })
}

async function remover(arq) {
  if (!props.canManage) return notify.error('Acesso negado.')

  const ok = await confirm.show('Excluir Arquivo', 'Deseja excluir este arquivo?')
  if (!ok) return

  deletingId.value = arq.id
  erro.value = ''
  try {
    await ArquivosService.remover(arq.id)
    notify.success('Arquivo removido!')
    await carregar()
    emit('updated')
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao remover arquivo.'
  } finally {
    deletingId.value = null
  }
}

watch(() => props.open, (v) => { if (v) carregar() })
watch(() => [props.ownerType, props.ownerId, props.categoria, props.slotKey], () => {
  if (props.open) carregar()
})
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
