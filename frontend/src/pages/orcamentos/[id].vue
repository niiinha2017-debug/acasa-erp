<template>
  <div class="space-y-6 pb-20">
    <PageHeader :title="isNovo ? 'Novo Orçamento' : `Orçamento #${orcamentoId}`">
      <template #actions>
        <Button variant="outline" size="sm" @click="gerarPdf" :disabled="isNovo">
          <i class="pi pi-file-pdf mr-2"></i> Gerar PDF
        </Button>
      </template>
    </PageHeader>

    <Card shadow>
      <div class="p-8 space-y-8">
        
        <div>
          <div class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Cliente</div>
          <SearchInput v-model="draft.cliente_id" mode="select" :options="clientesOptions" />
        </div>

        <div>
          <div class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Itens do Orçamento</div>
          <div class="grid grid-cols-12 gap-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[1.5rem] border mb-6">
            <div class="col-span-4"><Input v-model="ambForm.nome_ambiente" label="Ambiente" /></div>
            <div class="col-span-5"><Input v-model="ambForm.descricao" label="Acabamento" /></div>
            <div class="col-span-3"><Input v-model="ambForm.valor_unitario" label="Valor" @input="aplicarMascaraDinheiro" /></div>
            <div class="col-span-12"><Input v-model="ambForm.observacao" label="Descritivo Técnico" /></div>
            <div class="col-span-12 flex justify-end">
              <Button variant="primary" @click="handleAdicionarOuEditar">
                {{ editIdx !== null ? 'Atualizar Item' : 'Adicionar Item' }}
              </Button>
            </div>
          </div>

          <Table :columns="columns" :rows="rowsTabela">
            <template #cell-valor_unitario="{ row }">
              <span class="font-bold text-brand-primary">{{ format.currency(row.valor_unitario) }}</span>
            </template>
            <template #cell-acoes="{ row }">
              <div class="flex gap-2">
                <Button size="sm" variant="ghost" @click="iniciarEdicao(row.__idx)"><i class="pi pi-pencil"></i></Button>
                <Button size="sm" variant="ghost" class="text-red-500" @click="removerDaLista(row.__idx)"><i class="pi pi-trash"></i></Button>
              </div>
            </template>
          </Table>
        </div>

        <div class="h-px bg-slate-100 dark:bg-slate-800"></div>

        <div class="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[1.5rem] border border-dashed border-slate-300">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-[10px] font-black uppercase text-slate-400">Anexos (Word/PDF/Fotos)</div>
              <p class="text-xs text-slate-500">Importe arquivos externos do projeto aqui</p>
            </div>
            <input type="file" ref="fileInput" class="hidden" @change="uploadArquivoInteligente" />
            <Button variant="secondary" @click="fileInput.click()" :loading="uploading">
              <i class="pi pi-upload mr-2"></i> Importar Arquivo
            </Button>
          </div>

          <div v-if="arquivos.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div v-for="file in arquivos" :key="file.id" class="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border rounded-xl shadow-sm">
              <div class="flex items-center gap-2 truncate">
                <i :class="getFileIcon(file.nome)" class="text-brand-primary"></i>
                <span class="text-[10px] font-bold truncate">{{ file.nome }}</span>
              </div>
              <div class="flex gap-1">
                <Button size="sm" variant="ghost" @click="abrirArquivo(file.id)"><i class="pi pi-external-link"></i></Button>
                <Button size="sm" variant="ghost" class="text-red-400" @click="deletarAnexo(file.id)"><i class="pi pi-trash"></i></Button>
              </div>
            </div>
          </div>
        </div>

        <FormActions 
          :is-edit="!isNovo"
          :loading-save="saving"
          @save="salvarTudo"
          @delete="confirmarExclusao"
        />
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { OrcamentosService, ClienteService } from '@/services/index'
import { format } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const fileInput = ref(null)

const orcamentoId = computed(() => route.params.id)
const isNovo = computed(() => String(orcamentoId.value) === 'novo')

// ESTADO
const clientesOptions = ref([])
const arquivos = ref([])
const uploading = ref(false)
const saving = ref(false)
const editIdx = ref(null)

const draft = reactive({ cliente_id: null, ambientes: [] })
const ambForm = reactive({ nome_ambiente: '', descricao: '', valor_unitario: '', observacao: '' })

const columns = [
  { key: 'nome_ambiente', label: 'Item/Ambiente' },
  { key: 'descricao', label: 'Acabamento' },
  { key: 'valor_unitario', label: 'Valor', align: 'right' },
  { key: 'acoes', label: '', align: 'right' }
]

// --- FUNÇÕES DA TABELA ---
function aplicarMascaraDinheiro(e) {
  let v = e.target.value.replace(/\D/g, '')
  if (!v) { ambForm.valor_unitario = ''; return }
  ambForm.valor_unitario = (Number(v) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseMoney(v) {
  if (typeof v === 'number') return v
  return Number(v.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0
}

const rowsTabela = computed(() => draft.ambientes.map((a, idx) => ({ ...a, __idx: idx })))
const total = computed(() => draft.ambientes.reduce((acc, a) => acc + parseMoney(a.valor_unitario), 0))

function handleAdicionarOuEditar() {
  if (!ambForm.nome_ambiente) return
  const item = { ...ambForm, valor_unitario: parseMoney(ambForm.valor_unitario) }
  if (editIdx.value !== null) draft.ambientes.splice(editIdx.value, 1, item)
  else draft.ambientes.push(item)
  Object.keys(ambForm).forEach(k => ambForm[k] = '')
  editIdx.value = null
}

function iniciarEdicao(idx) {
  const a = draft.ambientes[idx]
  Object.assign(ambForm, { ...a, valor_unitario: a.valor_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) })
  editIdx.value = idx
}

function removerDaLista(idx) { draft.ambientes.splice(idx, 1) }

// --- ARQUIVOS ---
async function uploadArquivoInteligente(event) {
  const file = event.target.files[0]
  if (!file) return
  uploading.value = true
  try {
    let id = orcamentoId.value
    if (isNovo.value) {
      const res = await OrcamentosService.criar({ cliente_id: draft.cliente_id })
      id = res.data.id
      router.replace(`/orcamentos/${id}`)
    }
    await OrcamentosService.anexarArquivo(id, file)
    const resArqs = await OrcamentosService.listarArquivos(id)
    arquivos.value = resArqs.data
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

function abrirArquivo(id) { window.open(OrcamentosService.abrirArquivoUrl(orcamentoId.value || route.params.id, id), '_blank') }
async function deletarAnexo(id) { if(confirm('Excluir?')) { await OrcamentosService.removerArquivo(orcamentoId.value, id); arquivos.value = arquivos.value.filter(a => a.id !== id) } }
function getFileIcon(n) { 
  const e = n.split('.').pop().toLowerCase()
  return e === 'pdf' ? 'pi pi-file-pdf' : (e.includes('doc') ? 'pi pi-file-word' : 'pi pi-image')
}

// --- SALVAMENTO E PDF (RESOLVENDO OS ERROS DO CONSOLE) ---
async function salvarTudo() {
  if (!draft.cliente_id) return alert('Selecione um cliente.')
  saving.value = true
  try {
    const payload = { cliente_id: draft.cliente_id, itens: draft.ambientes }
    if (isNovo.value) await OrcamentosService.criar(payload)
    else await OrcamentosService.atualizar(orcamentoId.value, payload)
    router.push('/orcamentos')
  } finally { saving.value = false }
}

async function confirmarExclusao() {
  if (confirm('Deseja excluir permanentemente este orçamento?')) {
    await OrcamentosService.remover(orcamentoId.value)
    router.push('/orcamentos')
  }
}

function gerarPdf() {
  if (isNovo.value) return
  OrcamentosService.abrirPdf(orcamentoId.value)
}

onMounted(async () => {
  const { data: clis } = await ClienteService.listar()
  clientesOptions.value = clis.map(c => ({ label: c.nome, value: c.id }))
  if (!isNovo.value) {
    const res = await OrcamentosService.detalhar(orcamentoId.value)
    draft.cliente_id = res.data.cliente_id
    draft.ambientes = res.data.itens || []
    const resArqs = await OrcamentosService.listarArquivos(orcamentoId.value)
    arquivos.value = resArqs.data
  }
})
</script>