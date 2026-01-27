<template>
  <div class="page-container">
    <Card>
      <PageHeader
        :title="isNovo ? 'Novo Orçamento' : `Orçamento #${orcamentoId}`"
        subtitle="Cadastro operacional do orçamento"
        icon="pi pi-briefcase"
        :backTo="'/orcamentos'"
      >
        <template #actions>
          <Button
            variant="primary"
            size="sm"
            type="button"
            @click="gerarPdf"
            :disabled="saving || uploading || isNovo"
          >
            <i class="pi pi-file-pdf mr-2"></i> GERAR PDF
          </Button>
        </template>
      </PageHeader>

      <div class="p-6 space-y-8">
        <!-- CLIENTE -->
        <div class="space-y-3">
          <div class="text-xs font-black uppercase tracking-widest text-slate-500">
            Cliente
          </div>

          <div class="max-w-2xl">
            <SearchInput
              v-model="draft.cliente_id"
              mode="select"
              :options="clientesOptions"
              label="Quem é o cliente?"
              placeholder="Pesquisar cliente..."
            />
          </div>
        </div>

        <div class="h-px bg-slate-100"></div>

        <!-- ITEM (FORM) -->
        <div class="space-y-4">
          <div class="text-xs font-black uppercase tracking-widest text-slate-500">
            Itens do Orçamento
          </div>

          <div class="p-6 rounded-3xl border border-slate-100 bg-white space-y-6">
            <div class="grid grid-cols-12 gap-6">
              <div class="col-span-12 md:col-span-8">
                <Input
                  v-model="ambForm.nome_ambiente"
                  label="ITEM / AMBIENTE"
                  placeholder="Ex: COZINHA"
                />
              </div>

              <div class="col-span-12 md:col-span-4">
                <Input
                  v-model="ambForm.valor_unitario"
                  label="VALOR"
                  @input="aplicarMascaraDinheiro"
                  placeholder="R$ 0,00"
                />
              </div>

              <div class="col-span-12">
<div class="col-span-12">
  <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">
    ACABAMENTO / DESCRIÇÃO (TÓPICOS)
  </label>
  <textarea
    v-model="ambForm.descricao"
    rows="4"
    class="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm outline-none resize-none"
    placeholder="* MDF azul&#10;* MDF verde&#10;* puxador perfil"
  ></textarea>
</div>

              </div>

              <div class="col-span-12">
                <Input
                  v-model="ambForm.observacao"
                  label="OBSERVAÇÕES TÉCNICAS"
                  placeholder="MDF Branco TX, puxador perfil..."
                />
              </div>
            </div>

            <div class="flex justify-end">
              <Button variant="primary" type="button" @click="handleAdicionarOuEditar">
                <i class="pi pi-plus-circle mr-2"></i>
                {{ editIdx !== null ? 'Atualizar Item' : 'Adicionar Item' }}
              </Button>
            </div>
          </div>

          <!-- TABELA ITENS -->
          <div v-if="rowsTabela.length > 0">
            <Table :columns="columns" :rows="rowsTabela" boxed>
              <template #cell-descricao="{ row }">
                <div class="whitespace-pre-line">
                  {{ row.descricao || '-' }}
                </div>
              </template>

              <template #cell-observacao="{ row }">
                <div class="whitespace-pre-line font-bold">
                  {{ row.observacao || '-' }}
                </div>
              </template>

              <template #cell-valor_unitario="{ row }">
                <span class="font-bold">
                  {{ format.currency(row.valor_unitario) }}
                </span>
              </template>

              <template #cell-acoes="{ row }">
                <TableActions
                  :id="row.id ?? row.__idx"
                  @edit="iniciarEdicao(row.__idx)"
                  @delete="confirmarRemoverItem(row.__idx)"
                />
              </template>
            </Table>
          </div>
        </div>

        <div class="h-px bg-slate-100"></div>

        <!-- ARQUIVOS + TOTAL -->
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-12 lg:col-span-7 space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-xs font-black uppercase tracking-widest text-slate-500">
                Arquivos
              </div>

              <div class="flex items-center gap-2">
                <input type="file" ref="fileInput" class="hidden" @change="uploadArquivoInteligente" />

                <Button size="sm" variant="ghost" type="button" @click="abrirFilePicker">
                  <i class="pi pi-plus mr-1"></i> ANEXAR
                </Button>
              </div>
            </div>

            <div class="p-6 rounded-3xl border border-slate-100 bg-slate-50/50">
              <div v-if="uploading" class="py-6">
                <Loading />
              </div>

              <div v-else-if="arquivos.length === 0" class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nenhum arquivo anexado
              </div>

              <div v-else class="flex flex-wrap gap-2">
                <div
                  v-for="file in arquivos"
                  :key="file.id"
                  class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100"
                >
                  <i :class="['pi', getFileIcon(file.nome_original), 'text-brand-primary text-xs']"></i>

                  <span class="text-[10px] font-bold text-slate-700 truncate max-w-[180px]">
                    {{ file.nome_original }}
                  </span>

                  <!-- ABRIR (autenticado) -->
                  <button
                    type="button"
                    @click="abrirArquivo(file.id)"
                    class="text-slate-400 hover:text-slate-700"
                    title="Ver arquivo"
                  >
                    <i class="pi pi-external-link text-[10px]"></i>
                  </button>

                  <!-- EXCLUIR -->
                  <button
                    type="button"
                    @click="confirmarDeletarAnexo(file.id)"
                    class="text-red-400 hover:text-red-600"
                    title="Excluir"
                  >
                    <i class="pi pi-times text-[10px]"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-12 lg:col-span-5 space-y-4">
            <div class="p-6 rounded-3xl border border-slate-100 bg-white">
              <div class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                Total do Orçamento
              </div>

              <div class="text-3xl font-black">
                {{ format.currency(total) }}
              </div>
            </div>

            <!-- AÇÕES PADRÃO -->
            <FormActions
              :is-edit="!isNovo"
              :loading-save="saving"
              @save="salvarTudo"
              @delete="confirmarExcluirOrcamento"
              class="flex-row-reverse"
            />
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>


<script setup>
import { ref, reactive, computed, onMounted,nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { OrcamentosService, ClienteService } from '@/services/index'
import { format } from '@/utils/format'
import { confirm } from '@/services/confirm'

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
  { key: 'observacao', label: 'Observações' },
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

const descricaoFormatada = String(ambForm.descricao || '')
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(Boolean)
  .map(l => l.replace(/^\*\s*/, '• '))
  .join('\n')


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

  if (item?.id && orcamentoId.value && String(orcamentoId.value) !== 'novo') {
    await OrcamentosService.removerItem(orcamentoId.value, item.id)
  }

  draft.ambientes.splice(idx, 1)
}


// remover item (confirm)
async function confirmarRemoverItem(idx) {
  const item = draft.ambientes[idx]
  const ok = await confirm.show(
    'Remover Item',
    `Deseja remover "${item?.nome_ambiente || 'ITEM'}"?`,
  )
  if (!ok) return
  await removerDaLista(idx)
}

// deletar anexo (confirm)
async function confirmarDeletarAnexo(arquivoId) {
  const arq = arquivos.value?.find(a => a.id === arquivoId)
  const ok = await confirm.show(
    'Excluir Anexo',
    `Deseja excluir "${arq?.nome_original || 'ARQUIVO'}"?`,
  )
  if (!ok) return
  await deletarAnexo(arquivoId)
}

// excluir orçamento (confirm)
async function confirmarExcluirOrcamento() {
  const ok = await confirm.show(
    'Excluir Orçamento',
    `Deseja excluir permanentemente o Orçamento #${orcamentoId.value}?`,
  )
  if (!ok) return
  await OrcamentosService.remover(orcamentoId.value)
  router.push('/orcamentos')
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

async function abrirArquivo(arquivoId) {
  const oid = orcamentoId.value || route.params.id
  if (!oid) return
  await OrcamentosService.abrirArquivo(oid, arquivoId)
}



async function deletarAnexo(id) {
  const oid = await ensureOrcamentoId()
  if (!oid) return

  await OrcamentosService.removerArquivo(oid, id)
  arquivos.value = arquivos.value.filter(a => a.id !== id)
}


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

    if (isNovo.value) {
      const res = await OrcamentosService.criar({ cliente_id: draft.cliente_id })
      id = res.data.id
      orcamentoIdReal.value = id
      router.replace(`/orcamentos/${id}`)
    } else {
      await OrcamentosService.atualizar(id, { cliente_id: draft.cliente_id })
    }

    for (const it of draft.ambientes) {
      const payloadItem = {
        nome_ambiente: it.nome_ambiente,
        descricao: it.descricao,
        observacao: it.observacao || '',
        valor_unitario: Number(it.valor_unitario || 0),
        valor_total: Number(it.valor_unitario || 0),
      }

      if (it.id) {
        await OrcamentosService.atualizarItem(id, it.id, payloadItem)
      } else {
        const created = await OrcamentosService.adicionarItem(id, payloadItem)
        it.id = created.data?.id
      }
    }

    await router.push('/orcamentos')
  } catch (err) {
    console.error('Erro ao salvar orçamento:', err)
  } finally {
    saving.value = false
  }
}


async function gerarPdf() {
  const id = await ensureOrcamentoId()
  if (!id) return
  OrcamentosService.abrirPdf(id)
}

function abrirFilePicker() {
  if (fileInput.value) fileInput.value.click()
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

  // ✅ pega cliente_id do query quando for /orcamentos/novo
  const qCliente = route.query?.cliente_id
  if (qCliente && String(route.params.id) === 'novo') {
    draft.cliente_id = Number(String(qCliente).replace(/\D/g, '')) || null
  }

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