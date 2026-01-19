<template>
  <Card :shadow="true">
    <PageHeader
      :title="titulo"
      subtitle="Produção: tarefas, custos e arquivos do projeto."
      icon="pi pi-cog"
      :backTo="'/producao'"
    />

    <div class="p-6 relative">
      <Loading v-if="loading" />

      <div v-else class="space-y-8">
        <!-- DADOS DO PROJETO -->
        <section class="space-y-4">
          <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            Projeto
          </div>

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-3">
              <Input :modelValue="String(projeto?.id || '')" label="Projeto ID" readonly />
            </div>

            <div class="col-span-12 md:col-span-5">
              <Input
                :modelValue="origemLabel"
                label="Origem"
                readonly
              />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input :modelValue="String(projeto?.status || '')" label="Status" readonly />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input :modelValue="format.date(projeto?.encaminhado_em)" label="Encaminhado em" readonly />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input :modelValue="format.date(projeto?.criado_em)" label="Criado em" readonly />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input :modelValue="format.date(projeto?.atualizado_em)" label="Atualizado em" readonly />
            </div>
          </div>
        </section>

        <div class="h-px bg-slate-100"></div>

        <!-- TAREFAS -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
              Tarefas
            </div>

            <Button variant="secondary" size="sm" type="button" @click="abrirNovaTarefa">
              + Nova tarefa
            </Button>
          </div>

          <Table
            :columns="columnsTarefas"
            :rows="rowsTarefas"
            :loading="tarefasLoading"
            emptyText="Nenhuma tarefa cadastrada."
            :boxed="true"
          >
            <template #cell-funcionario="{ row }">
              <div class="font-black text-gray-900">{{ row.funcionario?.nome || '—' }}</div>
              <div class="text-xs font-bold text-gray-400">ID: {{ row.funcionario_id }}</div>
            </template>

            <template #cell-status="{ row }">
              <StatusBadge :value="row.status" />
            </template>

            <template #cell-janela="{ row }">
              <div class="text-xs font-black text-gray-900">
                {{ format.date(row.inicio_em) }} → {{ format.date(row.fim_em) }}
              </div>
            </template>

            <template #cell-custo="{ row }">
              <div class="font-black text-gray-900">
                {{ format.currency(Number(row.custo_total || 0)) }}
              </div>
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end gap-2">
                <Button variant="ghost" size="sm" type="button" @click="editarTarefa(row)">
                  Editar
                </Button>
                <Button variant="danger" size="sm" type="button" @click="removerTarefa(row)">
                  Excluir
                </Button>
              </div>
            </template>
          </Table>

          <div class="flex justify-end">
            <div class="text-sm font-black uppercase tracking-tight text-gray-900">
              Custo total (projeto):
              <span class="text-brand-primary">{{ format.currency(totalCustoProjeto) }}</span>
            </div>
          </div>
        </section>

        <div class="h-px bg-slate-100"></div>

        <!-- ARQUIVOS DA PRODUÇÃO -->
        <section class="space-y-4">
          <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            Arquivos da Produção
          </div>

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-4">
              <SearchInput
                v-model="upload.tipo"
                mode="select"
                label="Tipo do arquivo"
                placeholder="Selecione..."
                :options="TIPOS_ARQUIVO"
              />
            </div>

            <div class="col-span-12 md:col-span-8">
              <label class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2 block">
                Selecionar arquivos
              </label>
              <input
                type="file"
                multiple
                class="w-full h-12 px-4 rounded-2xl bg-gray-100 border-none font-bold text-gray-700"
                @change="onFiles"
              />
            </div>
          </div>

          <div class="flex justify-end">
            <Button
              variant="primary"
              size="md"
              type="button"
              :loading="uploading"
              :disabled="!podeUpload"
              @click="enviarArquivos"
            >
              Enviar arquivos
            </Button>
          </div>

          <Table
            :columns="columnsArquivos"
            :rows="rowsArquivos"
            :loading="arquivosLoading"
            emptyText="Nenhum arquivo anexado na produção."
            :boxed="true"
          >
            <template #cell-tipo="{ row }">
              <div class="font-black text-gray-900">{{ row.tipo }}</div>
            </template>

            <template #cell-nome="{ row }">
              <div class="font-black text-gray-900">{{ row.nome || row.filename || '—' }}</div>
            </template>

            <template #cell-criado="{ row }">
              <div class="text-xs font-black text-gray-900">{{ format.date(row.criado_em) }}</div>
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end gap-2">
                <Button variant="secondary" size="sm" type="button" @click="baixarArquivo(row)">
                  Baixar
                </Button>
                <Button variant="danger" size="sm" type="button" @click="removerArquivo(row)">
                  Excluir
                </Button>
              </div>
            </template>
          </Table>
        </section>
      </div>
    </div>
        <!-- MODAL: TAREFA (inline, operacional) -->
    <transition name="fade-slide">
      <div
        v-if="tarefaModal.open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
        @click.self="fecharModalTarefa"
      >
        <div class="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <!-- HEADER -->
          <div class="flex items-start justify-between gap-4 p-6 border-b border-gray-100 bg-gray-50/40">
            <div>
              <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
                Tarefa
              </div>
              <div class="text-lg font-black uppercase tracking-tight text-gray-900">
                {{ tarefaModal.isEdit ? 'Editar tarefa' : 'Nova tarefa' }}
              </div>
            </div>

            <Button variant="secondary" size="sm" type="button" @click="fecharModalTarefa">
              Fechar
            </Button>
          </div>

          <!-- BODY -->
          <div class="p-6 space-y-6">
            <div class="grid grid-cols-12 gap-4">
              <!-- FUNCIONÁRIO -->
              <div class="col-span-12 md:col-span-6">
                <SearchInput
                  v-model="tarefaModal.funcionario_id"
                  mode="select"
                  label="Funcionário *"
                  placeholder="Selecione..."
                  :options="funcionariosOptions"
                />
              </div>

              <!-- STATUS -->
              <div class="col-span-12 md:col-span-6">
                <SearchInput
                  v-model="tarefaModal.status"
                  mode="select"
                  label="Status *"
                  placeholder="Selecione..."
                  :options="STATUS_TAREFA"
                />
              </div>

              <!-- TÍTULO -->
              <div class="col-span-12">
                <Input v-model="tarefaModal.titulo" label="Título *" />
              </div>

              <!-- OBS -->
              <div class="col-span-12">
                <Input v-model="tarefaModal.observacao" label="Observação" />
              </div>

              <!-- INÍCIO -->
              <div class="col-span-12 md:col-span-6">
                <label class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2 block">
                  Início *
                </label>
                <input
                  v-model="tarefaModal.inicio_em"
                  type="datetime-local"
                  class="w-full h-12 px-4 rounded-2xl bg-gray-100 border-none font-bold text-gray-700 focus:ring-2 focus:ring-brand-primary/20 transition-all"
                />
              </div>

              <!-- FIM -->
              <div class="col-span-12 md:col-span-6">
                <label class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2 block">
                  Fim *
                </label>
                <input
                  v-model="tarefaModal.fim_em"
                  type="datetime-local"
                  class="w-full h-12 px-4 rounded-2xl bg-gray-100 border-none font-bold text-gray-700 focus:ring-2 focus:ring-brand-primary/20 transition-all"
                />
              </div>
            </div>

            <!-- ALERTA OPERACIONAL -->
            <div
              v-if="!tarefaModal.isEdit && (!String(projeto?.origem_tipo || '').trim() || !projeto?.origem_id)"
              class="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-black uppercase tracking-widest"
            >
              Origem do projeto não está carregada. Encaminhe a origem ou recarregue o projeto.
            </div>
          </div>

          <!-- FOOTER -->
          <div class="flex items-center justify-end gap-2 p-6 border-t border-gray-100 bg-gray-50/40">
            <Button variant="secondary" size="md" type="button" @click="fecharModalTarefa">
              Cancelar
            </Button>

            <Button
              variant="primary"
              size="md"
              type="button"
              :loading="savingTarefa"
              :disabled="!podeSalvarTarefa"
              @click="salvarTarefaModal"
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </transition>

  </Card>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ProducaoService, FuncionarioService } from '@/services/index'
import { format } from '@/utils/format'

// ✅ sem importar componentes (já estão no main.js)

// ===============================
// ROUTE
// ===============================
const route = useRoute()
const router = useRouter()

const projetoId = computed(() => {
  const v = route.params.id
  const n = Number(String(v).replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
})

// ===============================
// STATE
// ===============================
const loading = ref(true)

const projeto = ref(null)

// tarefas
const tarefasLoading = ref(false)
const tarefas = ref([])

// arquivos
const arquivosLoading = ref(false)
const arquivos = ref([])

const uploading = ref(false)
const upload = reactive({
  tipo: '',
  files: [],
})

// funcionários (pra criar/editar tarefa)
const funcionariosLoading = ref(false)
const funcionariosOptions = ref([])

// modal tarefa
const tarefaModal = reactive({
  open: false,
  isEdit: false,
  tarefaId: null,

  funcionario_id: null,
  titulo: '',
  status: 'PENDENTE',
  observacao: '',
  inicio_em: '',
  fim_em: '',
})

const savingTarefa = ref(false)
const deletingTarefa = ref(false)

// ===============================
// CONSTANTES (operacional)
// ===============================
const TIPOS_ARQUIVO = [
  { label: 'PLANTA', value: 'PLANTA' },
  { label: 'PROJETO TÉCNICO', value: 'PROJETO_TECNICO' },
  { label: 'PLANO DE CORTE', value: 'PLANO_CORTE' },
  { label: 'OUTRO', value: 'OUTRO' },
]

const STATUS_TAREFA = [
  { label: 'PENDENTE', value: 'PENDENTE' },
  { label: 'EM_ANDAMENTO', value: 'EM_ANDAMENTO' },
  { label: 'FINALIZADA', value: 'FINALIZADA' },
  { label: 'CANCELADA', value: 'CANCELADA' },
]

// ===============================
// TABLE COLUMNS
// ===============================
const columnsTarefas = [
  { key: 'funcionario', label: 'Funcionário', width: '240px' },
  { key: 'titulo', label: 'Tarefa' },
  { key: 'status', label: 'Status', width: '160px' },
  { key: 'janela', label: 'Janela', width: '220px' },
  { key: 'custo', label: 'Custo', width: '160px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '220px', align: 'right' },
]

const columnsArquivos = [
  { key: 'tipo', label: 'Tipo', width: '200px' },
  { key: 'nome', label: 'Arquivo' },
  { key: 'criado', label: 'Criado em', width: '160px' },
  { key: 'acoes', label: 'Ações', width: '220px', align: 'right' },
]

// ===============================
// COMPUTEDS
// ===============================
const titulo = computed(() => {
  if (!projetoId.value) return 'Projeto de Produção'
  return `Projeto de Produção #${projetoId.value}`
})

const origemLabel = computed(() => {
  const p = projeto.value
  if (!p) return ''
  const t = String(p.origem_tipo || '')
  const id = p.origem_id
  return t && id ? `${t} #${id}` : ''
})

const rowsTarefas = computed(() => (tarefas.value || []).map((t) => t))
const rowsArquivos = computed(() => (arquivos.value || []).map((a) => a))

const totalCustoProjeto = computed(() => {
  return (tarefas.value || []).reduce((acc, t) => acc + Number(t.custo_total || 0), 0)
})

const podeUpload = computed(() => {
  return !!projetoId.value && !!upload.tipo && (upload.files || []).length > 0 && !uploading.value
})

// ===============================
// HELPERS
// ===============================
function isoToInputDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${hh}:${mm}`
}

function inputDateTimeToISO(v) {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

// ===============================
// LOADERS (BACKEND)
// ===============================
async function carregarFuncionarios() {
  funcionariosLoading.value = true
  try {
    const { data } = await FuncionarioService.listar()
    const arr = Array.isArray(data) ? data : []
    funcionariosOptions.value = arr.map((f) => ({
      label: `${f.nome} (#${f.id})`,
      value: f.id,
    }))
  } finally {
    funcionariosLoading.value = false
  }
}

async function carregarProjeto() {
  if (!projetoId.value) return

  tarefasLoading.value = true
  try {
    // ✅ endpoint novo do backend:
    // GET /producao/projetos/:id
    const { data } = await ProducaoService.projetos.buscar(projetoId.value)

    projeto.value = data || null
    tarefas.value = Array.isArray(data?.tarefas) ? data.tarefas : []
  } finally {
    tarefasLoading.value = false
  }
}

async function carregarArquivos() {
  if (!projetoId.value) return
  arquivosLoading.value = true
  try {
    const { data } = await ProducaoService.arquivos.listar(projetoId.value)
    arquivos.value = Array.isArray(data) ? data : []
  } finally {
    arquivosLoading.value = false
  }
}

// ===============================
// TAREFAS (MODAL)
// ===============================
function abrirNovaTarefa() {
  tarefaModal.open = true
  tarefaModal.isEdit = false
  tarefaModal.tarefaId = null

  tarefaModal.funcionario_id = null
  tarefaModal.titulo = ''
  tarefaModal.status = 'PENDENTE'
  tarefaModal.observacao = ''
  tarefaModal.inicio_em = ''
  tarefaModal.fim_em = ''
}

function editarTarefa(row) {
  tarefaModal.open = true
  tarefaModal.isEdit = true
  tarefaModal.tarefaId = row.id

  tarefaModal.funcionario_id = row.funcionario_id ?? null
  tarefaModal.titulo = row.titulo ?? ''
  tarefaModal.status = row.status ?? 'PENDENTE'
  tarefaModal.observacao = row.observacao ?? ''
  tarefaModal.inicio_em = isoToInputDateTime(row.inicio_em)
  tarefaModal.fim_em = isoToInputDateTime(row.fim_em)
}

function fecharModalTarefa() {
  tarefaModal.open = false
}

function montarPayloadCriarTarefa() {
  const p = projeto.value || {}

  return {
    origem_tipo: String(p.origem_tipo || '').trim(),
    origem_id: Number(p.origem_id),

    funcionario_id: Number(tarefaModal.funcionario_id),
    titulo: String(tarefaModal.titulo || '').trim(),
    status: String(tarefaModal.status || 'PENDENTE').trim(),
    observacao: tarefaModal.observacao ? String(tarefaModal.observacao).trim() : null,

    inicio_em: inputDateTimeToISO(tarefaModal.inicio_em),
    fim_em: inputDateTimeToISO(tarefaModal.fim_em),
  }
}

function montarPayloadAtualizarTarefa() {
  return {
    funcionario_id: Number(tarefaModal.funcionario_id),
    titulo: String(tarefaModal.titulo || '').trim(),
    status: String(tarefaModal.status || 'PENDENTE').trim(),
    observacao: tarefaModal.observacao ? String(tarefaModal.observacao).trim() : null,
    inicio_em: inputDateTimeToISO(tarefaModal.inicio_em),
    fim_em: inputDateTimeToISO(tarefaModal.fim_em),
  }
}

const podeSalvarTarefa = computed(() => {
  if (savingTarefa.value) return false
  if (!tarefaModal.funcionario_id) return false
  if (!String(tarefaModal.titulo || '').trim()) return false
  if (!String(tarefaModal.inicio_em || '').trim()) return false
  if (!String(tarefaModal.fim_em || '').trim()) return false

  if (!tarefaModal.isEdit) {
    const p = projeto.value || {}
    if (!String(p.origem_tipo || '').trim()) return false
    if (!p.origem_id) return false
  }
  return true
})

async function salvarTarefaModal() {
  if (!podeSalvarTarefa.value) return
  savingTarefa.value = true
  try {
    if (tarefaModal.isEdit && tarefaModal.tarefaId) {
      const payload = montarPayloadAtualizarTarefa()
      await ProducaoService.tarefas.atualizar(tarefaModal.tarefaId, payload)
    } else {
      const payload = montarPayloadCriarTarefa()
      await ProducaoService.tarefas.criar(payload)
    }

    fecharModalTarefa()
    await carregarProjeto()
  } finally {
    savingTarefa.value = false
  }
}

async function removerTarefa(row) {
  if (!row?.id || deletingTarefa.value) return
  deletingTarefa.value = true
  try {
    await ProducaoService.tarefas.remover(row.id)
    await carregarProjeto()
  } finally {
    deletingTarefa.value = false
  }
}

// ===============================
// ARQUIVOS
// ===============================
function onFiles(e) {
  const files = Array.from(e?.target?.files || [])
  upload.files = files
}

async function enviarArquivos() {
  if (!podeUpload.value) return
  uploading.value = true
  try {
    await ProducaoService.arquivos.upload(projetoId.value, upload.tipo, upload.files)
    upload.files = []
    await carregarArquivos()
  } finally {
    uploading.value = false
  }
}

async function baixarArquivo(row) {
  if (!projetoId.value || !row?.id) return
  const res = await ProducaoService.arquivos.baixar(projetoId.value, row.id)

  const blob = res?.data
  const nome = row.nome || row.filename || `arquivo_${row.id}`

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

async function removerArquivo(row) {
  if (!projetoId.value || !row?.id) return
  await ProducaoService.arquivos.remover(projetoId.value, row.id)
  await carregarArquivos()
}

// ===============================
// INIT
// ===============================
onMounted(async () => {
  if (!projetoId.value) {
    router.push('/producao')
    return
  }

  loading.value = true
  try {
    await carregarFuncionarios()
    await carregarProjeto()
    // backend de arquivos pode não existir ainda
    await carregarArquivos().catch(() => null)
  } finally {
    loading.value = false
  }
})
</script>
