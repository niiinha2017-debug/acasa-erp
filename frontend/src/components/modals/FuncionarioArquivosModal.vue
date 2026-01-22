<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="$emit('close')" />

    <div class="absolute inset-0 flex items-center justify-center p-6">
      <Card :shadow="true" class="w-full max-w-3xl overflow-hidden !rounded-[2.5rem]">
        <header class="p-6 bg-slate-500/5 border-b border-[var(--border-ui)] flex items-center justify-between gap-4">
          <div class="min-w-0">
            <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Arquivos do Funcionário</div>
            <div class="text-lg font-black uppercase tracking-widest text-[var(--text-main)] truncate">
              {{ funcionarioNome || '—' }}
            </div>
          </div>

          <Button variant="secondary" class="!rounded-2xl !px-6 h-11" type="button" @click="$emit('close')">
            Fechar
          </Button>
        </header>

        <div class="p-6 space-y-5">
          <!-- resumo -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center px-4">
              <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</div>
              <div class="ml-auto font-black text-slate-800">{{ arquivos.length }}</div>
            </div>
            <div class="h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center px-4">
              <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Tamanho</div>
              <div class="ml-auto font-black text-slate-800">{{ totalMb }}</div>
            </div>
            <div class="h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center px-4">
              <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Último</div>
              <div class="ml-auto font-black text-slate-800">{{ ultimoUpload || '—' }}</div>
            </div>
          </div>

          <!-- seletor bonito -->
          <div class="grid grid-cols-12 gap-3 items-end">
            <div class="col-span-12 md:col-span-8">
              <input ref="fileInput" type="file" class="hidden" @change="onFileChange" />

              <div class="flex items-center gap-3">
                <Button
                  variant="secondary"
                  type="button"
                  class="!rounded-2xl h-12 !px-6"
                  @click="abrirSeletorArquivo"
                >
                  <i class="pi pi-upload mr-2" /> Escolher arquivo
                </Button>

                <div class="h-12 flex-1 flex items-center px-4 rounded-2xl bg-white border border-slate-200 text-sm">
                  <span class="font-bold text-slate-700 truncate">
                    {{ arquivoSelecionado?.name || 'Nenhum arquivo selecionado' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="col-span-12 md:col-span-4">
              <Button
                variant="primary"
                type="button"
                class="w-full !rounded-2xl h-12"
                :loading="enviando"
                :disabled="!funcionarioId || !arquivoSelecionado || enviando || loading"
                @click="enviarArquivo"
              >
                Anexar Documento
              </Button>
            </div>
          </div>

          <!-- lista -->
          <div class="space-y-2">
            <div v-if="loading" class="py-6">
              <Loading />
            </div>

            <div v-else-if="arquivos.length === 0" class="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nenhum arquivo anexado
              </div>
            </div>

            <div
              v-else
              v-for="a in arquivos"
              :key="a.id"
              class="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
            >
              <div class="min-w-0">
                <div class="font-black text-slate-700 text-sm truncate">{{ a.nome }}</div>
                <div class="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                  {{ a.mime || '—' }} • {{ formatSize(a.tamanho) }}
                </div>
              </div>

              <div class="flex gap-2">
<a
  :href="a.url"
  target="_blank"
  rel="noopener noreferrer"
  class="h-9 px-4 flex items-center rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase"
>
  Abrir
</a>


                <Button
                  variant="danger"
                  size="sm"
                  class="!rounded-xl h-9"
                  type="button"
                  @click="remover(a.id)"
                >
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
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

function abrirSeletorArquivo() {
  fileInput.value?.click()
}

function onFileChange(e) {
  arquivoSelecionado.value = e?.target?.files?.[0] || null
}

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
  const first = arquivos.value?.[0]?.criado_em
  if (!first) return ''
  // vem ISO, só mostra data
  return String(first).split('T')[0]
})

async function carregarArquivos() {
  if (!props.funcionarioId) return
  loading.value = true
  try {
    const { data } = await FuncionarioService.listarArquivos(props.funcionarioId)
    arquivos.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
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
  if (!confirm('Deseja excluir este arquivo?')) return
  try {
    await FuncionarioService.removerArquivo(fileId)
    await carregarArquivos()
  } catch {
    alert('Erro ao remover')
  }
}

watch(
  () => props.open,
  (v) => {
    if (v) carregarArquivos()
    else {
      arquivos.value = []
      arquivoSelecionado.value = null
      if (fileInput.value) fileInput.value.value = ''
    }
  }
)
</script>
