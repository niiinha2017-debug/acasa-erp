<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        :title="isNovo ? 'Novo Orçamento' : `Orçamento #${orcamentoId}`"
        subtitle="Cadastro operacional do orçamento"
        icon="pi pi-briefcase"
      >
        <template #actions>
          <RouterLink
            to="/orcamentos"
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-soft hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <i class="pi pi-arrow-left text-xs"></i>
            Voltar
          </RouterLink>
          <Button
            v-if="!isNovo && can('vendas.criar')"
            variant="secondary"
            size="sm"
            type="button"
            class="mr-2"
            @click="irParaFechamentoVenda"
          >
            <i class="pi pi-dollar mr-2"></i>
            Fechar venda
          </Button>
          <Button
            v-if="can('orcamentos.ver')"
            variant="primary"
            size="sm"
            type="button"
            @click="gerarPdf"
            :disabled="saving || isNovo"
          >
            <i class="pi pi-file-pdf mr-2"></i> GERAR PDF
          </Button>
        </template>
      </PageHeader>

      <div class="p-6 md:p-8 border-t border-border-ui space-y-8">
        <!-- CLIENTE -->
        <div class="space-y-3">
          <div class="text-xs font-black uppercase tracking-widest text-text-soft">
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

        <div class="h-px bg-border-ui"></div>

        <!-- ITEM (FORM) -->
        <div class="space-y-4">
          <div class="text-xs font-black uppercase tracking-widest text-text-soft">
            Itens do Orçamento
          </div>

          <div class="p-6 rounded-2xl border border-border-ui bg-bg-page space-y-6">
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
                <label class="text-[10px] font-black uppercase text-text-soft mb-2 block ml-1">
                  ACABAMENTO / DESCRIÇÃO (TÓPICOS)
                </label>
                <textarea
                  v-model="ambForm.descricao"
                  rows="4"
                  class="w-full p-4 rounded-2xl bg-bg-page border border-border-ui text-sm text-text-main outline-none resize-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  placeholder="* MDF azul&#10;* MDF verde&#10;* puxador perfil"
                ></textarea>
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
                  perm-edit="orcamentos.editar"
                  perm-delete="orcamentos.editar"
                  @edit="iniciarEdicao(row.__idx)"
                  @delete="confirmarRemoverItem(row.__idx)"
                />
              </template>
            </Table>
          </div>
        </div>

        <div class="h-px bg-border-ui"></div>

        <!-- 1. IMAGENS PARA O PDF + 2. ANEXOS/DOCUMENTOS -->
        <div class="space-y-6">
            <!-- 1. Imagens para o PDF do orçamento -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-xs font-black uppercase tracking-widest text-text-soft">
                  Imagens para o PDF do orçamento
                </div>
                <div class="flex items-center gap-2">
                  <input ref="fileInputImagemPdf" type="file" class="hidden" accept="image/*" @change="(e) => onPickArquivo(e, 'IMAGEM_PDF')" />
                  <Button
                    v-if="can(permSalvarOrc()) && can('arquivos.criar')"
                    size="sm"
                    variant="ghost"
                    type="button"
                    @click="clicarAdicionarArquivo('IMAGEM_PDF')"
                  >
                    <i class="pi pi-upload mr-1"></i> ADICIONAR IMAGEM
                  </Button>
                </div>
              </div>
              <p class="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                Estas imagens serão incluídas no PDF ao clicar em &quot;Gerar PDF&quot;. Cada imagem é redimensionada para caber na folha A4: até 2 imagens por página, com área útil de aproximadamente 199 mm (largura) × 131 mm (altura) por imagem. O PDF exibe ainda as dimensões em pixels abaixo de cada imagem.
              </p>
              <div class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden max-h-[200px] overflow-y-auto">
                <Table
                  :columns="colArquivos"
                  :rows="imagensParaPdf"
                  :loading="loadingImagensPdf"
                  empty-text="Nenhuma imagem para o PDF."
                  :boxed="false"
                >
                  <template #cell-nome="{ row }">
                    <div class="flex flex-col">
                      <span class="text-xs font-black text-text-main">{{ row.nome || row.filename }}</span>
                      <span class="text-[10px] font-bold text-text-soft uppercase tracking-wider">{{ row.mime_type || 'IMAGEM' }}</span>
                    </div>
                  </template>
                  <template #cell-acoes="{ row }">
                    <div class="flex justify-end gap-2">
                      <Button v-if="can('arquivos.ver') || can('orcamentos.ver')" variant="secondary" size="sm" type="button" @click="abrirArquivo(row)">Ver</Button>
                      <Button v-if="can('arquivos.excluir') && can(permSalvarOrc())" variant="danger" size="sm" type="button" @click="excluirArquivo(row.id, 'IMAGEM_PDF')">Excluir</Button>
                    </div>
                  </template>
                </Table>
              </div>
            </div>

            <!-- 2. Anexos e documentos (PDF etc) -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-xs font-black uppercase tracking-widest text-text-soft">
                  Anexos e documentos
                </div>
                <div class="flex items-center gap-2">
                  <input ref="fileInputAnexos" type="file" class="hidden" @change="(e) => onPickArquivo(e, 'ANEXO')" />
                  <Button
                    v-if="can(permSalvarOrc()) && can('arquivos.criar')"
                    size="sm"
                    variant="ghost"
                    type="button"
                    @click="clicarAdicionarArquivo('ANEXO')"
                  >
                    <i class="pi pi-upload mr-1"></i> ADICIONAR ARQUIVO
                  </Button>
                </div>
              </div>
              <p class="text-[10px] font-bold text-text-soft uppercase tracking-wider">
                PDFs e outros arquivos anexados ao orçamento. Não são inseridos no PDF gerado; ficam apenas vinculados ao orçamento.
              </p>
              <div class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden max-h-[200px] overflow-y-auto">
                <Table
                  :columns="colArquivos"
                  :rows="anexosDocumentos"
                  :loading="loadingAnexos"
                  empty-text="Nenhum anexo ou documento."
                  :boxed="false"
                >
                  <template #cell-nome="{ row }">
                    <div class="flex flex-col">
                      <span class="text-xs font-black text-text-main">{{ row.nome || row.filename }}</span>
                      <span class="text-[10px] font-bold text-text-soft uppercase tracking-wider">{{ row.mime_type || 'ARQUIVO' }}</span>
                    </div>
                  </template>
                  <template #cell-acoes="{ row }">
                    <div class="flex justify-end gap-2">
                      <Button v-if="can('arquivos.ver') || can('orcamentos.ver')" variant="secondary" size="sm" type="button" @click="abrirArquivo(row)">Ver</Button>
                      <Button v-if="can('arquivos.excluir') && can(permSalvarOrc())" variant="danger" size="sm" type="button" @click="excluirArquivo(row.id, 'ANEXO')">Excluir</Button>
                    </div>
                  </template>
                </Table>
              </div>
            </div>
        </div>

        <!-- Barra de finalização fixa embaixo -->
        <div class="sticky bottom-0 left-0 right-0 border-t border-border-ui bg-bg-card -mx-6 md:-mx-8 px-6 md:px-8 py-4 mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase text-text-soft tracking-widest">Total do orçamento</span>
            <span class="text-xl font-black text-text-main">{{ format.currency(total) }}</span>
          </div>
          <FormActions
            :is-edit="!isNovo"
            :loading-save="saving"
            @save="salvarTudo"
            @delete="confirmarExcluirOrcamento"
            class="flex-row-reverse gap-2 w-full sm:w-auto"
          />
        </div>
      </div>
    </div>
  </div>
</template>



<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { OrcamentosService, ClienteService } from '@/services/index'
import { format } from '@/utils/format'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'
import { ArquivosService } from '@/services/arquivos.service'


definePage({ meta: { perm: 'orcamentos.ver' } })

const route = useRoute()
const router = useRouter()

const arquivosOpen = ref(false)

const orcamentoIdReal = ref(null)
const orcamentoId = computed(() => orcamentoIdReal.value || route.params.id)
const isNovo = computed(() => String(orcamentoId.value) === 'novo' || !orcamentoId.value)

const permSalvarOrc = () => (isNovo.value ? 'orcamentos.criar' : 'orcamentos.editar')

// estado
const clientesOptions = ref([])
const saving = ref(false)
const editIdx = ref(null)

const draft = reactive({ cliente_id: null, ambientes: [] })
const ambForm = reactive({ nome_ambiente: '', descricao: '', valor_unitario: '', observacao: '' })

const imagensParaPdf = ref([])
const anexosDocumentos = ref([])
const loadingImagensPdf = ref(false)
const loadingAnexos = ref(false)
const fileInputImagemPdf = ref(null)
const fileInputAnexos = ref(null)

const colArquivos = [
  { key: 'nome', label: 'ARQUIVO' },
  { key: 'acoes', label: '', align: 'right', width: '220px' },
]


const columns = [
  { key: 'nome_ambiente', label: 'Item/Ambiente' },
  { key: 'descricao', label: 'Acabamento' },
  { key: 'observacao', label: 'Observações' },
  { key: 'valor_unitario', label: 'Valor', align: 'right' },
  { key: 'acoes', label: '', width: '140px', align: 'right' },
]

function aplicarMascaraDinheiro(e) {
  let v = e.target.value.replace(/\D/g, '')
  if (!v) { ambForm.valor_unitario = ''; return }
  ambForm.valor_unitario = (Number(v) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseMoney(v) {
  if (typeof v === 'number') return v
  return Number(String(v).replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0
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
    valor_total: parseMoney(ambForm.valor_unitario),
  }

  if (base.id) {
    await OrcamentosService.atualizarItem(id, base.id, payloadItem)
    draft.ambientes.splice(editIdx.value, 1, { ...base, ...payloadItem })
  } else {
    const created = await OrcamentosService.adicionarItem(id, payloadItem)
    draft.ambientes.push({ id: created.data.id, ...payloadItem })
  }

  Object.keys(ambForm).forEach((k) => (ambForm[k] = ''))
  editIdx.value = null
}

function iniciarEdicao(idx) {
  const a = draft.ambientes[idx]
  Object.assign(ambForm, {
    ...a,
    valor_unitario: Number(a.valor_unitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  })
  editIdx.value = idx
}

async function confirmarRemoverItem(idx) {
  const item = draft.ambientes[idx]
  const ok = await confirm.show('Remover Item', `Deseja remover "${item?.nome_ambiente || 'ITEM'}"?`)
  if (!ok) return
  await removerDaLista(idx)
}

async function removerDaLista(idx) {
  const item = draft.ambientes[idx]
  if (item?.id && orcamentoId.value && String(orcamentoId.value) !== 'novo') {
    await OrcamentosService.removerItem(orcamentoId.value, item.id)
  }
  draft.ambientes.splice(idx, 1)
}

async function confirmarExcluirOrcamento() {
  if (!can('orcamentos.excluir')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Excluir Orçamento', `Deseja excluir permanentemente o Orçamento #${orcamentoId.value}?`)
  if (!ok) return
  await OrcamentosService.remover(orcamentoId.value)
  router.push('/orcamentos')
}

async function salvarTudo() {
  const perm = permSalvarOrc()
  if (!can(perm)) return notify.error('Acesso negado.')

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

      if (it.id) await OrcamentosService.atualizarItem(id, it.id, payloadItem)
      else {
        const created = await OrcamentosService.adicionarItem(id, payloadItem)
        it.id = created.data?.id
      }
    }

    await router.push('/orcamentos')
  } finally {
    saving.value = false
  }
}

async function carregarImagensParaPdf() {
  const id = orcamentoIdReal.value
  if (!id || String(id) === 'novo') {
    imagensParaPdf.value = []
    return
  }
  loadingImagensPdf.value = true
  try {
    const res = await ArquivosService.listar({
      ownerType: 'ORCAMENTO',
      ownerId: Number(String(id).replace(/\D/g, '')),
      categoria: 'IMAGEM_PDF',
    })
    const arr = res?.data?.data ?? res?.data ?? res
    imagensParaPdf.value = Array.isArray(arr) ? arr : []
  } finally {
    loadingImagensPdf.value = false
  }
}

async function carregarAnexosDocumentos() {
  const id = orcamentoIdReal.value
  if (!id || String(id) === 'novo') {
    anexosDocumentos.value = []
    return
  }
  loadingAnexos.value = true
  try {
    const res = await ArquivosService.listar({
      ownerType: 'ORCAMENTO',
      ownerId: Number(String(id).replace(/\D/g, '')),
      categoria: 'ANEXO',
    })
    const arr = res?.data?.data ?? res?.data ?? res
    anexosDocumentos.value = Array.isArray(arr) ? arr : []
  } finally {
    loadingAnexos.value = false
  }
}

function carregarArquivos() {
  carregarImagensParaPdf()
  carregarAnexosDocumentos()
}

function abrirArquivo(row) {
  const oid = String(orcamentoIdReal.value || '').replace(/\D/g, '')
  const backTo = encodeURIComponent(`/orcamentos/${oid || 'novo'}`)
  const name = encodeURIComponent(row?.nome || row?.filename || 'ARQUIVO')
  const type = encodeURIComponent(row?.mime_type || '')

  router.push(`/arquivos/${row.id}?name=${name}&type=${type}&backTo=${backTo}`)
}

async function excluirArquivo(arquivoId, _categoria) {
  if (!can('arquivos.excluir') || !can(permSalvarOrc())) return notify.error('Acesso negado.')

  const ok = await confirm.show('Excluir arquivo?', 'Esta ação não pode ser desfeita.')
  if (!ok) return

  try {
    await ArquivosService.remover(Number(arquivoId))
    notify.success('Arquivo removido.')
    await carregarArquivos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao excluir arquivo.')
  }
}

async function clicarAdicionarArquivo(categoria) {
  if (!can(permSalvarOrc()) || !can('arquivos.criar')) return notify.error('Acesso negado.')

  await ensureOrcamentoId()
  await Promise.resolve()

  const input = categoria === 'IMAGEM_PDF' ? fileInputImagemPdf.value : fileInputAnexos.value
  if (!input) return notify.error('Input de arquivo não montado.')
  input.click()
}

async function onPickArquivo(e, categoria) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return

  if (!can('arquivos.criar') || !can(permSalvarOrc())) return notify.error('Acesso negado.')

  const id = await ensureOrcamentoId()
  if (!id) return

  try {
    await ArquivosService.upload({
      ownerType: 'ORCAMENTO',
      ownerId: Number(String(id).replace(/\D/g, '')),
      categoria: categoria || 'ANEXO',
      file,
    })
    notify.success(categoria === 'IMAGEM_PDF' ? 'Imagem adicionada ao PDF.' : 'Arquivo anexado.')
    await carregarArquivos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao anexar arquivo.')
  }
}


async function gerarPdf() {
  if (!can('orcamentos.ver')) return notify.error('Acesso negado.')

  const id = await ensureOrcamentoId()
  if (!id) return

  try {
    const { data } = await OrcamentosService.abrirPdf(id)
    const arquivoId = data?.arquivoId
    if (!arquivoId) return notify.error('Não retornou arquivoId.')

await router.push({
  path: `/arquivos/${String(arquivoId).replace(/\D/g, '')}`,
  query: {
    name: `ORCAMENTO_${String(id).replace(/\D/g, '')}.pdf`,
    type: 'application/pdf',
  },
})

  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || 'Erro ao gerar PDF.'
    notify.error(msg)
    console.error('[Orcamento PDF]', e?.response?.data || e)
  }
}

function irParaFechamentoVenda() {
  if (!orcamentoId.value || String(orcamentoId.value) === 'novo') return
  router.push({
    path: '/vendas/nova-venda',
    query: { orcamentoId: String(orcamentoId.value) },
  })
}


async function ensureOrcamentoId() {
  if (!draft.cliente_id) {
    alert('Selecione um cliente.')
    return null
  }

  if (orcamentoIdReal.value) return orcamentoIdReal.value

  const rid = route.params?.id
  if (rid && String(rid) !== 'novo') {
    orcamentoIdReal.value = rid
    return orcamentoIdReal.value
  }

  // ✅ cria primeiro
  const res = await OrcamentosService.criar({ cliente_id: draft.cliente_id })
  orcamentoIdReal.value = res.data.id

  await router.replace(`/orcamentos/${orcamentoIdReal.value}`)

  // ✅ agora sim (opcional)
  await carregarArquivos()

  return orcamentoIdReal.value
}

onMounted(async () => {
  const { data: clis } = await ClienteService.listar()
  clientesOptions.value = (clis || []).map(c => ({
    label: c.nome_completo || c.razao_social || `ID #${c.id}`,
    value: c.id,
  }))

  const qCliente = route.query?.cliente_id
  if (qCliente && String(route.params.id) === 'novo') {
    draft.cliente_id = Number(String(qCliente).replace(/\D/g, '')) || null
  }

  // ✅ edição: carrega tudo e só depois busca anexos
  if (route.params.id && String(route.params.id) !== 'novo') {
    orcamentoIdReal.value = route.params.id

    const res = await OrcamentosService.detalhar(orcamentoIdReal.value)
    draft.cliente_id = res.data.cliente_id
    draft.ambientes = res.data.itens || []

    await carregarArquivos()
  }
})

</script>
