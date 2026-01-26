<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[100] overflow-y-auto">
      <div 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        @click="$emit('close')" 
      />

      <div class="flex min-h-full items-center justify-center p-6">
        <Card 
          :shadow="true" 
          class="relative w-full max-w-3xl overflow-hidden !rounded-[2.5rem] border-none shadow-2xl transition-all bg-white"
        >
          <header class="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                <i class="pi pi-paperclip text-xl"></i>
              </div>
              <div>
                <h2 class="text-lg font-black tracking-tight text-slate-800 uppercase italic leading-tight">
                  {{ orcamentoTitulo || 'Documentação' }}
                </h2>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Anexos do Orçamento #{{ orcamentoId }}
                </p>
              </div>
            </div>

            <button 
              @click="$emit('close')" 
              class="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center shadow-sm"
            >
              <i class="pi pi-times"></i>
            </button>
          </header>

          <div class="p-8 space-y-8">
            <div class="grid grid-cols-3 gap-4">
              <div v-for="(item, i) in statsItems" :key="i" class="p-4 rounded-[1.2rem] bg-slate-50 border border-slate-100/50">
                <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{{ item.label }}</p>
                <p class="text-sm font-black text-slate-700 tracking-tight">{{ item.value }}</p>
              </div>
            </div>

            <div class="p-6 rounded-[2rem] bg-slate-50/50 border-2 border-dashed border-slate-200 group hover:border-brand-primary/50 transition-all">
              <div class="flex flex-col md:flex-row gap-4 items-center">
                <div class="flex-1 w-full">
                  <input ref="fileInput" type="file" class="hidden" @change="onFileChange" />
                  <div 
                    @click="abrirSeletorArquivo"
                    class="h-14 px-5 rounded-2xl bg-white border border-slate-200 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group-hover:border-brand-primary/30"
                  >
                    <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-primary">
                      <i class="pi pi-search text-xs"></i>
                    </div>
                    <span class="text-[11px] font-black uppercase tracking-widest text-slate-400 truncate flex-1">
                      {{ arquivoSelecionado?.name || 'Localizar arquivo no computador...' }}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  class="!h-14 !rounded-2xl !px-8 shadow-xl shadow-brand-primary/20 font-black text-[10px] uppercase tracking-widest whitespace-nowrap"
                  :loading="enviando"
                  :disabled="!arquivoSelecionado"
                  @click="enviarArquivo"
                >
                  <i class="pi pi-upload mr-2"></i> Subir Arquivo
                </Button>
              </div>
            </div>

            <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scroll">
              <div v-if="loading" class="py-12 flex justify-center"><Loading /></div>

              <div v-else-if="arquivos.length === 0" class="py-16 text-center">
                <div class="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <i class="pi pi-folder-open text-2xl text-slate-200" />
                </div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Nenhum anexo encontrado</p>
              </div>

              <div
                v-else
                v-for="a in arquivos"
                :key="a.id"
                class="group flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-slate-200/50 transition-all"
              >
                <div class="flex items-center gap-4 min-w-0">
                  <div class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                    <i :class="[a.nome_original.endsWith('.pdf') ? 'pi pi-file-pdf' : 'pi pi-file', 'text-xl']" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-[11px] font-black text-slate-700 uppercase truncate leading-tight tracking-tight">{{ a.nome_original }}</p>
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {{ formatSize(a.tamanho) }} • {{ a.mime_type?.split('/')[1] || 'doc' }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    @click="abrirArquivo(a)"
                    class="h-9 px-4 rounded-xl bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                  >
                    Visualizar
                  </button>

                  <button
                    @click="remover(a.id)"
                    class="w-9 h-9 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 flex items-center justify-center"
                  >
                    <i class="pi pi-trash text-[10px]"></i>
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
import { OrcamentosService } from '@/services/index'

const props = defineProps({
  open: Boolean,
  orcamentoId: [Number, String],
  orcamentoTitulo: String,
})

defineEmits(['close'])

const loading = ref(false)
const enviando = ref(false)
const arquivos = ref([])
const fileInput = ref(null)
const arquivoSelecionado = ref(null)

// Computed amigável para os mini-cards de estatísticas
const statsItems = computed(() => [
  { label: 'Total', value: arquivos.value.length },
  { label: 'Tamanho', value: totalMb.value },
  { label: 'Último', value: ultimoUpload.value || '—' }
])

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
  const dt = arquivos.value?.[0]?.criado_em || arquivos.value?.[0]?.created_at
  if (!dt) return ''
  return String(dt).split('T')[0]
})

async function carregarArquivos() {
  if (!props.orcamentoId) return
  loading.value = true
  try {
    const { data } = await OrcamentosService.listarArquivos(props.orcamentoId)
    arquivos.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

async function abrirArquivo(a) {
  if (!props.orcamentoId) return
  try {
    await OrcamentosService.abrirArquivo(props.orcamentoId, a.id)
  } catch (err) {
    alert('Não foi possível abrir o arquivo.')
  }
}

async function enviarArquivo() {
  if (!props.orcamentoId || !arquivoSelecionado.value) return
  enviando.value = true
  try {
    await OrcamentosService.anexarArquivo(props.orcamentoId, arquivoSelecionado.value)
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
  if (!confirm('Deseja excluir este arquivo permanentemente?')) return
  try {
    await OrcamentosService.removerArquivo(props.orcamentoId, fileId)
    await carregarArquivos()
  } catch {
    alert('Erro ao remover arquivo.')
  }
}

watch(() => props.open, (v) => {
  if (v) carregarArquivos()
  else {
    arquivos.value = []
    arquivoSelecionado.value = null
    if (fileInput.value) fileInput.value.value = ''
  }
})
</script>