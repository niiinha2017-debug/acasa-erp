<template>
  <div class="max-w-6xl mx-auto pb-20 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-black text-slate-800 uppercase tracking-tight">
        {{ isNovo ? 'Novo Orçamento' : `Orçamento #${orcamentoId}` }}
      </h1>

      <Button
        variant="outline"
        size="sm"
        @click="$router.back()"
        class="bg-white shadow-sm border-slate-200"
      >
        <i class="pi pi-arrow-left mr-2"></i> VOLTAR
      </Button>
    </div>

    <Card class="p-0 border-none shadow-xl overflow-hidden">
      <!-- SUBSTITUI CardSection (pra não quebrar) -->
      <div class="bg-slate-50/50 border-b px-8 py-6">
        <div class="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
          Seleção do Cliente
        </div>

        <div class="max-w-2xl">
          <SearchInput
            v-model="draft.cliente_id"
            mode="select"
            :options="clientesOptions"
            placeholder="Buscar cliente..."
          />
        </div>
      </div>

      <div class="p-8 space-y-10">
        <section class="space-y-4">
          <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <i class="pi pi-box text-brand-primary"></i> Itens do Orçamento
          </h2>

          <div class="p-6 rounded-[2rem] border-2 border-slate-100 bg-white space-y-6 shadow-inner">
            <div class="grid grid-cols-12 gap-6">
              <div class="col-span-8">
                <Input v-model="ambForm.nome_ambiente" label="ITEM / AMBIENTE" placeholder="Ex: COZINHA" />
              </div>

              <div class="col-span-4">
                <Input
                  v-model="ambForm.valor_unitario"
                  label="VALOR"
                  @input="aplicarMascaraDinheiro"
                  placeholder="R$ 0,00"
                />
              </div>

              <div class="col-span-6">
                <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">
                  Descritivo (Itens em tópicos)
                </label>
                <textarea
                  v-model="ambForm.descricao"
                  rows="4"
                  class="w-full p-4 rounded-2xl bg-slate-50 border-none text-sm focus:ring-2 ring-brand-primary/20 outline-none transition-all resize-none"
                  placeholder="• Armário em U&#10;• Prateleira com LED"
                ></textarea>
              </div>

              <div class="col-span-6">
                <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">
                  Observações Técnicas
                </label>
                <textarea
                  v-model="ambForm.observacao"
                  rows="4"
                  class="w-full p-4 rounded-2xl bg-slate-50 border-none text-sm focus:ring-2 ring-brand-primary/20 outline-none transition-all resize-none italic"
                  placeholder="MDF Branco TX, puxador perfil..."
                ></textarea>
              </div>
            </div>

            <div class="flex justify-end">
              <Button
                variant="primary"
                class="px-10 py-4 rounded-xl shadow-lg shadow-brand-primary/20 uppercase font-black text-xs tracking-widest"
                @click="handleAdicionarOuEditar"
              >
                <i class="pi pi-plus-circle mr-2"></i>
                {{ editIdx !== null ? 'Atualizar Item' : 'Adicionar Item' }}
              </Button>
            </div>
          </div>
        </section>

        <section v-if="rowsTabela.length > 0" class="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <Table :columns="columns" :rows="rowsTabela" class="border rounded-2xl overflow-hidden shadow-sm">
            <template #cell-valor_unitario="{ row }">
              <span class="font-bold text-slate-800">{{ format.currency(row.valor_unitario) }}</span>
            </template>
            <template #cell-acoes="{ row }">
              <TableActions @edit="iniciarEdicao(row.__idx)" @delete="removerDaLista(row.__idx)" />
            </template>
          </Table>
        </section>

        <div class="grid grid-cols-12 gap-8 pt-6 border-t border-slate-100">
          <div class="col-span-12 lg:col-span-7">
            <div class="p-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <div class="flex items-center justify-between mb-4">
                <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Arquivos do Projeto
                </span>

                <input type="file" ref="fileInput" class="hidden" @change="uploadArquivoInteligente" />

                <!-- AQUI: não chama fileInput.click() -->
                <Button size="sm" variant="ghost" @click="abrirFilePicker" class="text-brand-primary font-bold">
                  <i class="pi pi-plus mr-1"></i> ANEXAR
                </Button>
              </div>

              <div class="flex flex-wrap gap-2">
                <div
                  v-for="file in arquivos"
                  :key="file.id"
                  class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border shadow-sm group"
                >
                  <i :class="['pi', getFileIcon(file.nome_original), 'text-brand-primary text-xs']"></i>
                  <span class="text-[10px] font-bold text-slate-600 truncate max-w-[150px]">
                    {{ file.nome_original }}
                  </span>

                  <button @click="deletarAnexo(file.id)" class="text-red-400 hover:text-red-600">
                    <i class="pi pi-times text-[8px]"></i>
                  </button>

                  <!-- (opcional) abrir ao clicar no nome:
                  <button @click="abrirArquivo(file.id)" class="text-slate-400 hover:text-slate-700">
                    <i class="pi pi-external-link text-[10px]"></i>
                  </button>
                  -->
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-12 lg:col-span-5 space-y-6">
            <div class="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div class="absolute -right-4 -top-4 w-24 h-24 bg-brand-primary/20 rounded-full blur-3xl group-hover:bg-brand-primary/40 transition-all"></div>

              <div class="relative z-10">
                <p class="text-[10px] font-black uppercase opacity-50 tracking-[0.2em] mb-2">
                  Total do Orçamento
                </p>

                <!-- AQUI: era totalOrcamento (não existe), vira total -->
                <div class="text-4xl font-black tracking-tight tracking-tighter">
                  {{ format.currency(total) }}
                </div>

                <div class="h-px bg-white/10 my-4"></div>

                <p class="text-[9px] opacity-40 leading-relaxed">
                  Condições comerciais e prazos sujeitos a alteração conforme validade do orçamento.
                </p>
              </div>
            </div>

            <FormActions
              :is-edit="!isNovo"
              :loading-save="saving"
              @save="salvarTudo"
              @delete="confirmarExclusao"
              class="flex-row-reverse"
            />
          </div>
        </div>
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