<template>
  <div class="space-y-6 pb-20">
    <PageHeader :title="isNovo ? 'Novo Orçamento' : `Orçamento #${orcamentoId}`">
      <template #actions>
        <Button variant="outline" size="sm" @click="gerarPdf">
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
            <div class="col-span-12 md:col-span-6">
  <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">
    Descrição do ambiente (Enter para nova linha)
  </label>
  <textarea
    v-model="ambForm.descricao"
    rows="6"
    class="w-full p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-ui)] text-sm outline-none"
    placeholder="Ex:\nArmário inferior\nArmário superior\nNicho com LED"
  ></textarea>
</div>
            <div class="col-span-3"><Input v-model="ambForm.valor_unitario" label="Valor" @input="aplicarMascaraDinheiro" /></div>
            <div class="col-span-12 md:col-span-6">
  <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">
    Observação (tipo de madeira / detalhes)
  </label>
  <textarea
    v-model="ambForm.observacao"
    rows="6"
    class="w-full p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-ui)] text-sm outline-none"
    placeholder="Ex: MDF Branco TX 18mm, fita de borda 1mm, puxador cava..."
  ></textarea>
</div>
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
  <div
    v-for="file in arquivos"
    :key="file.id"
    class="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border rounded-xl shadow-sm"
  >
    <div class="flex items-center gap-2 truncate">
      <i :class="getFileIcon(file.nome_original)" class="text-brand-primary"></i>
      <span class="text-[10px] font-bold truncate">{{ file.nome_original }}</span>
    </div>

    <div class="flex gap-1">
      <Button size="sm" variant="ghost" @click="abrirArquivo(file.id)">
        <i class="pi pi-external-link"></i>
      </Button>
      <Button size="sm" variant="ghost" class="text-red-400" @click="deletarAnexo(file.id)">
        <i class="pi pi-trash"></i>
      </Button>
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

const orcamentoIdReal = ref(null)
const orcamentoId = computed(() => orcamentoIdReal.value || route.params.id)
const isNovo = computed(() => String(orcamentoId.value) === 'novo' || !orcamentoId.value)


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

async function handleAdicionarOuEditar() {
  if (!ambForm.nome_ambiente) return

  const id = await ensureOrcamentoId()
  if (!id) return

  const base = editIdx.value !== null ? (draft.ambientes[editIdx.value] || {}) : {}

  const payloadItem = {
    nome_ambiente: ambForm.nome_ambiente,
    descricao: ambForm.descricao,
    observacao: ambForm.observacao || '',
    valor_unitario: parseMoney(ambForm.valor_unitario),
    valor_total: parseMoney(ambForm.valor_unitario), // seu backend trava igual unitário
  }

  // EDITAR item existente
  if (base.id) {
    await OrcamentosService.atualizarItem(id, base.id, payloadItem)

    // atualiza lista local
    draft.ambientes.splice(editIdx.value, 1, { ...base, ...payloadItem })
  }
  // ADICIONAR novo item
  else {
    const created = await OrcamentosService.adicionarItem(id, payloadItem)

    // grava o item com ID vindo do banco
    draft.ambientes.push({ id: created.data.id, ...payloadItem })
  }

  Object.keys(ambForm).forEach((k) => (ambForm[k] = ''))
  editIdx.value = null
}


function iniciarEdicao(idx) {
  const a = draft.ambientes[idx]
  Object.assign(ambForm, { ...a, valor_unitario: a.valor_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) })
  editIdx.value = idx
}

async function removerDaLista(idx) {
  const item = draft.ambientes[idx]
  if (!confirm('Remover este item?')) return

  if (item?.id && orcamentoId.value && String(orcamentoId.value) !== 'novo') {
    await OrcamentosService.removerItem(orcamentoId.value, item.id)
  }

  draft.ambientes.splice(idx, 1)
}

// --- ARQUIVOS ---
async function uploadArquivoInteligente(event) {
  const file = event.target.files[0]
  if (!file) return

  const id = await ensureOrcamentoId()
  if (!id) return

  uploading.value = true
  try {
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
  const e = String(n || '').split('.').pop().toLowerCase()
  return e === 'pdf' ? 'pi pi-file-pdf' : (e.includes('doc') ? 'pi pi-file-word' : 'pi pi-image')
}

// --- SALVAMENTO E PDF (RESOLVENDO OS ERROS DO CONSOLE) ---
async function salvarTudo() {
  if (!draft.cliente_id) return alert('Selecione um cliente.')
  if (!draft.ambientes.length) return alert('Adicione ao menos 1 item.')

  saving.value = true
  try {
    let id = orcamentoId.value

    // 1) garante orçamento criado
    if (isNovo.value) {
      const res = await OrcamentosService.criar({ cliente_id: draft.cliente_id })
      id = res.data.id
      router.replace(`/orcamentos/${id}`)
    } else {
      // 2) se for edição, atualiza cliente (se mudou)
      await OrcamentosService.atualizar(id, { cliente_id: draft.cliente_id })
    }

    // 3) sincroniza itens
    for (const it of draft.ambientes) {
      const payloadItem = {
        nome_ambiente: it.nome_ambiente,
        descricao: it.descricao,
        observacao: it.observacao || '',
        valor_unitario: Number(it.valor_unitario || 0),
        valor_total: Number(it.valor_unitario || 0), // backend trava igual unitário
      }

      if (it.id) {
        await OrcamentosService.atualizarItem(id, it.id, payloadItem)
      } else {
        const created = await OrcamentosService.adicionarItem(id, payloadItem)
        it.id = created.data?.id // ✅ salva o id no objeto local
      }
    }

    router.push('/orcamentos')
  } finally {
    saving.value = false
  }
}

async function confirmarExclusao() {
  if (confirm('Deseja excluir permanentemente este orçamento?')) {
    await OrcamentosService.remover(orcamentoId.value)
    router.push('/orcamentos')
  }
}

async function gerarPdf() {
  const id = await ensureOrcamentoId()
  if (!id) return
  OrcamentosService.abrirPdf(id)
}


async function ensureOrcamentoId() {
  if (!draft.cliente_id) {
    alert('Selecione um cliente.')
    return null
  }

  // 1) se já temos id guardado, usa
  if (orcamentoIdReal.value) return orcamentoIdReal.value

  // 2) se a rota já tem um id (não é "novo"), guarda e usa
  const rid = route.params?.id
  if (rid && String(rid) !== 'novo') {
    orcamentoIdReal.value = rid
    return orcamentoIdReal.value
  }

  // 3) senão, cria agora
  const res = await OrcamentosService.criar({ cliente_id: draft.cliente_id })
  orcamentoIdReal.value = res.data.id
  router.replace(`/orcamentos/${orcamentoIdReal.value}`)
  return orcamentoIdReal.value
}

onMounted(async () => {
  const { data: clis } = await ClienteService.listar()
  clientesOptions.value = (clis || []).map(c => ({
    label: c.nome_completo || c.razao_social || `ID #${c.id}`,
    value: c.id,
  }))

  if (route.params.id && String(route.params.id) !== 'novo') {
    orcamentoIdReal.value = route.params.id

    const res = await OrcamentosService.detalhar(orcamentoIdReal.value)
    draft.cliente_id = res.data.cliente_id
    draft.ambientes = res.data.itens || []

    const resArqs = await OrcamentosService.listarArquivos(orcamentoIdReal.value)
    arquivos.value = resArqs.data
  }
})

</script>