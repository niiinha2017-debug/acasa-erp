<template>
  <Teleport to="body">
    <Transition name="modal-bounce">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md"
        @click.self="fechar"
      >
        <div class="w-full max-w-4xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col border border-white/20">
          
          <header class="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white">
            <div class="flex items-center gap-5">
              <div class="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200 rotate-2">
                <i class="pi pi-folder-open text-xl"></i>
              </div>

              <div>
                <div class="flex items-center gap-2">
                   <h3 class="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Arquivos</h3>
                   <span class="px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary text-[9px] font-black uppercase tracking-widest">Digital Assets</span>
                </div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                  {{ ownerType }} • ID #{{ ownerId }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button 
                @click="abrirEmArquivos"
                class="h-11 px-5 rounded-2xl bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2"
              >
                Gerenciador Full
              </button>
              <button
                class="w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-90"
                @click="fechar"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            
            <div v-if="canManage" class="group relative">
              <input ref="fileRef" type="file" class="hidden" @change="onPickFile" />
              <div 
                @click="fileRef?.click()"
                class="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 transition-all cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 flex flex-col items-center justify-center text-center group"
              >
                <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white transition-all duration-500 shadow-sm">
                  <i class="pi pi-cloud-upload text-slate-400 group-hover:text-brand-primary"></i>
                </div>
                <h4 class="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                  {{ arquivoSelecionadoNome || 'Arraste ou clique para selecionar' }}
                </h4>
                <p class="text-[9px] font-bold text-slate-400 uppercase mt-1">Upload de documentos, imagens e contratos</p>
              </div>

              <Transition name="fade">
                <div v-if="fileToUpload" class="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-[2rem] flex items-center justify-center gap-4 animate-in zoom-in-95">
                  <div class="text-center px-6">
                    <p class="text-[10px] font-black text-slate-900 uppercase truncate max-w-[200px] mb-4">{{ arquivoSelecionadoNome }}</p>
                    <div class="flex gap-2">
                       <Button variant="secondary" @click="fileToUpload = null; arquivoSelecionadoNome = ''" class="!h-10 !rounded-xl">Cancelar</Button>
                       <Button variant="primary" :loading="uploading" @click="enviar" class="!h-10 !rounded-xl !px-8 shadow-lg shadow-brand-primary/20">Confirmar Upload</Button>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between px-2">
                <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Repositório Local</h4>
                <button @click="carregar" class="text-[10px] font-black text-brand-primary uppercase hover:underline">Recarregar</button>
              </div>

              <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div v-for="i in 2" :key="i" class="h-24 rounded-3xl bg-slate-50 animate-pulse"></div>
              </div>

              <div v-else-if="!arquivos.length" class="py-20 flex flex-col items-center justify-center text-center opacity-40">
                <i class="pi pi-inbox text-4xl mb-4 text-slate-200"></i>
                <p class="text-[10px] font-black uppercase tracking-widest">O deserto está vazio</p>
              </div>

              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  v-for="a in arquivosOrdenados"
                  :key="a.id"
                  class="group p-5 rounded-3xl border border-slate-100 bg-white hover:border-brand-primary/20 hover:shadow-xl hover:shadow-slate-200/50 transition-all flex items-center justify-between"
                >
                  <div class="flex items-center gap-4 min-w-0">
                    <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                      <i :class="getFileIcon(a.mime_type)" class="text-lg"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="text-[11px] font-black uppercase text-slate-800 truncate">{{ a.nome || a.filename }}</div>
                      <div class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{{ formatSize(a.tamanho) }} • {{ a.mime_type?.split('/')[1] }}</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button @click="visualizar(a)" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg active:scale-90 transition-all">
                      <i class="pi pi-eye text-[10px]"></i>
                    </button>
                    <button v-if="canManage" @click="remover(a)" class="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white active:scale-90 transition-all">
                      <i class="pi pi-trash text-[10px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer class="px-8 py-5 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <div v-if="erro" class="flex items-center gap-2 text-rose-500 animate-pulse">
               <i class="pi pi-exclamation-triangle text-xs"></i>
               <span class="text-[9px] font-black uppercase tracking-widest">{{ erro }}</span>
            </div>
            <div v-else class="flex items-center gap-2 text-slate-400">
               <i class="pi pi-shield text-[10px]"></i>
               <span class="text-[9px] font-black uppercase tracking-widest">Acesso Seguro • SSD Encryption</span>
            </div>
            <Button variant="secondary" class="!h-11 !rounded-2xl !px-8 text-[10px]" @click="fechar">Fechar Módulo</Button>
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

    const payload = res?.data
    arquivos.value = Array.isArray(payload) ? payload : (payload?.data || [])
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao carregar arquivos.'
    arquivos.value = []
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

function abrirEmArquivos() {
  const ot = String(props.ownerType || '').trim().toUpperCase()
  const oid = String(props.ownerId || '').replace(/\D/g, '')
  const cat = props.categoria ? String(props.categoria || '').trim().toUpperCase() : ''

  router.push({
    path: '/arquivos',
    query: {
      // manda nos 2 formatos pra não ter erro nunca
      owner_type: ot,
      owner_id: oid,
      categoria: cat,

      ownerType: ot,
      ownerId: oid,
    },
  })

  fechar()
}


function getFileIcon(mime) {
  if (mime?.includes('pdf')) return 'pi pi-file-pdf'
  if (mime?.includes('image')) return 'pi pi-image'
  return 'pi pi-file'
}

function formatSize(bytes) {
  if (!bytes) return '0 KB'
  const kb = bytes / 1024
  return kb > 1000 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`
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

watch(
  () => props.open,
  (v) => { if (v) carregar() },
  { immediate: true }
)

watch(
  () => [props.ownerType, props.ownerId, props.categoria, props.slotKey],
  () => { if (props.open) carregar() },
  { immediate: true }
)


</script>


<style scoped>
.modal-bounce-enter-active { animation: bounce-in 0.4s ease-out; }
.modal-bounce-leave-active { animation: bounce-in 0.2s reverse ease-in; }

@keyframes bounce-in {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>
