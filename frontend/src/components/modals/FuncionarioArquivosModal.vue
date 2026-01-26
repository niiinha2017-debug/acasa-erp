<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[999] overflow-y-auto">
      <div 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        @click="$emit('close')" 
      />

      <div class="flex min-h-full items-center justify-center p-4">
        <Card 
          :shadow="true" 
          class="relative w-full max-w-3xl overflow-hidden !rounded-[2.5rem] border-none shadow-2xl transition-all bg-white"
        >
          <header class="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-4">
            <div class="flex items-center gap-4 min-w-0">
              <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg flex-shrink-0">
                <i class="pi pi-folder-open text-xl" />
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Documentação Digital</p>
                <h3 class="text-lg font-black text-slate-800 truncate italic uppercase tracking-tight">
                  {{ funcionarioNome || 'Colaborador' }}
                </h3>
              </div>
            </div>

            <button 
              @click="$emit('close')"
              class="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center shadow-sm"
            >
              <i class="pi pi-times" />
            </button>
          </header>

          <div class="p-8 space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="(item, i) in statsItems" :key="i" class="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
                <span class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{{ item.label }}</span>
                <span class="font-black text-slate-700 tracking-tight">{{ item.value }}</span>
              </div>
            </div>

            <div class="bg-white rounded-[2rem] p-6 border-2 border-dashed border-slate-200 hover:border-brand-primary/40 transition-colors group">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div class="md:col-span-8">
                  <input ref="fileInput" type="file" class="hidden" @change="onFileChange" />
                  <div class="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      type="button"
                      class="!rounded-xl h-12 !px-6 whitespace-nowrap !bg-slate-900 !text-white !border-none font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200"
                      @click="abrirSeletorArquivo"
                    >
                      <i class="pi pi-search mr-2 text-xs" /> Buscar
                    </Button>

                    <div class="h-12 flex-1 flex items-center px-4 rounded-xl bg-slate-50 border border-slate-100 text-sm overflow-hidden italic">
                      <span class="font-bold text-slate-400 truncate">
                        {{ arquivoSelecionado?.name || 'Nenhum arquivo selecionado...' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="md:col-span-4">
                  <Button
                    variant="primary"
                    type="button"
                    class="w-full !rounded-xl h-12 shadow-xl shadow-brand-primary/20 font-black text-[10px] uppercase tracking-widest"
                    :loading="enviando"
                    :disabled="!funcionarioId || !arquivoSelecionado || enviando || loading"
                    @click="enviarArquivo"
                  >
                    <i class="pi pi-upload mr-2" /> Anexar
                  </Button>
                </div>
              </div>
            </div>

            <div class="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scroll">
              <div v-if="loading" class="py-10 text-center">
                <Loading />
              </div>

              <div v-else-if="arquivos.length === 0" class="py-16 text-center">
                <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <i class="pi pi-cloud-upload text-2xl text-slate-200" />
                </div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Aguardando primeiro documento
                </p>
              </div>

              <div
                v-else
                v-for="a in arquivos"
                :key="a.id"
                class="group flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:shadow-xl hover:shadow-slate-100 hover:border-brand-primary/20 transition-all"
              >
                <div class="min-w-0 flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all flex items-center justify-center border border-slate-100">
                     <i class="pi pi-file-pdf text-xl" v-if="a.mime?.includes('pdf')" />
                     <i class="pi pi-image text-xl" v-else-if="a.mime?.includes('image')" />
                     <i class="pi pi-file text-xl" v-else />
                  </div>
                  <div class="min-w-0">
                    <div class="font-black text-slate-700 text-sm truncate uppercase tracking-tight">{{ a.nome }}</div>
                    <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {{ a.mime?.split('/')[1] || 'DOC' }} • {{ formatSize(a.tamanho) }}
                    </div>
                  </div>
                </div>

                <div class="flex gap-2">
                  <button
                    type="button"
                    class="h-9 px-4 rounded-xl bg-slate-50 text-slate-600 text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all border border-slate-100"
                    @click="abrirArquivo(a)"
                  >
                    Visualizar
                  </button>

                  <button
                    type="button"
                    class="w-9 h-9 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 flex items-center justify-center"
                    @click="remover(a.id)"
                  >
                    <i class="pi pi-trash text-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { FuncionarioService } from '@/services/index'

const props = defineProps({
  open: Boolean,
  funcionarioId: [Number, String],
  funcionarioNome: String,
})

const emit = defineEmits(['close'])

const loading = ref(false)
const enviando = ref(false)
const arquivos = ref([])
const fileInput = ref(null)
const arquivoSelecionado = ref(null)

const statsItems = computed(() => [
  { label: 'Arquivos', value: arquivos.value.length },
  { label: 'Espaço em Uso', value: totalMb.value },
  { label: 'Último Envio', value: ultimoUpload.value || 'Nenhum' }
])

// --- FUNÇÕES DE AUXÍLIO ---
function abrirSeletorArquivo() { fileInput.value?.click() }
function onFileChange(e) { arquivoSelecionado.value = e?.target?.files?.[0] || null }

function formatSize(bytes) {
  const b = Number(bytes || 0)
  if (!b) return '0 KB'
  const kb = b / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

const totalMb = computed(() => {
  const sum = arquivos.value.reduce((acc, a) => acc + Number(a.tamanho || 0), 0)
  return `${(sum / 1024 / 1024).toFixed(2)} MB`
})

const ultimoUpload = computed(() => {
  const dates = arquivos.value
    .map(a => a.criado_em)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))
    
  if (!dates.length) return ''
  return new Date(dates[0]).toLocaleDateString('pt-BR')
})

// --- ACTIONS ---
async function carregarArquivos() {
  if (!props.funcionarioId) return
  loading.value = true
  try {
    const { data } = await FuncionarioService.listarArquivos(props.funcionarioId)
    arquivos.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Erro ao carregar:', err)
  } finally {
    loading.value = false
  }
}

async function abrirArquivo(a) {
  if (!a?.url) return alert('URL do arquivo não encontrada.')
  window.open(a.url, '_blank')
}

async function enviarArquivo() {
  if (!props.funcionarioId || !arquivoSelecionado.value) return
  enviando.value = true
  try {
    await FuncionarioService.uploadArquivo(props.funcionarioId, arquivoSelecionado.value)
    arquivoSelecionado.value = null
    if (fileInput.value) fileInput.value.value = ''
    await carregarArquivos()
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro no upload')
  } finally {
    enviando.value = false
  }
}

async function remover(fileId) {
  if (!confirm('Esta ação é permanente. Confirmar exclusão?')) return
  try {
    await FuncionarioService.removerArquivo(fileId)
    await carregarArquivos()
  } catch {
    alert('Erro ao remover arquivo.')
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) carregarArquivos()
  else {
    arquivos.value = []
    arquivoSelecionado.value = null
  }
})
</script>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 4px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>