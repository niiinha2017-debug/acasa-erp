<template>
  <Card :shadow="true">
    <PageHeader
      title="Agenda de Produção"
      subtitle="Chão de fábrica: tarefas no intervalo, status e custo por funcionário."
      icon="pi pi-calendar"
      :backTo="'/'"
    />

    <div class="p-6 relative">
      <Loading v-if="loading" />

      <div v-else class="space-y-6">
        <!-- FILTROS -->
        <section class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-4">
            <Input v-model="filtros.inicio" type="date" label="Início *" />
          </div>

          <div class="col-span-12 md:col-span-4">
            <Input v-model="filtros.fim" type="date" label="Fim *" />
          </div>

          <div class="col-span-12 md:col-span-4">
            <SearchInput
              v-model="busca"
              mode="search"
              label="Buscar"
              placeholder="Buscar por origem, status, funcionário, tarefa..."
            />
          </div>
        </section>

        <div class="h-px bg-slate-100"></div>

        <!-- RESUMO -->
        <section class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-3">
            <div class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Projetos</div>
            <div class="text-lg font-black text-gray-900">{{ totalProjetos }}</div>
          </div>

          <div class="col-span-12 md:col-span-3">
            <div class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Tarefas (intervalo)</div>
            <div class="text-lg font-black text-gray-900">{{ totalTarefas }}</div>
          </div>

          <div class="col-span-12 md:col-span-3">
            <div class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Custo (intervalo)</div>
            <div class="text-lg font-black text-gray-900">{{ format.currency(totalCusto) }}</div>
          </div>

          <div class="col-span-12 md:col-span-3 flex items-end justify-end gap-2">
            <Button variant="secondary" size="md" type="button" :loading="refreshing" @click="carregar">
              Atualizar
            </Button>
          </div>
        </section>

        <div class="h-px bg-slate-100"></div>

        <!-- LISTA (PROJETOS) -->
        <section class="space-y-3">
          <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            Projetos no intervalo
          </div>

          <Table
            :columns="columnsProjetos"
            :rows="rowsProjetos"
            :loading="refreshing"
            emptyText="Nenhum projeto no intervalo."
            :boxed="true"
          >
            <template #cell-origem="{ row }">
              <div class="font-black text-gray-900">{{ row.origem_tipo }} #{{ row.origem_id }}</div>
              <div class="text-xs font-bold text-gray-400">Projeto #{{ row.id }}</div>
            </template>

            <template #cell-status="{ row }">
              <StatusBadge :value="row.status" />
            </template>

            <template #cell-janela="{ row }">
              <div class="text-xs font-black text-gray-900">
                {{ format.date(row.janela_intervalo?.inicio_min) }} → {{ format.date(row.janela_intervalo?.fim_max) }}
              </div>
            </template>

            <template #cell-tarefas="{ row }">
              <div class="text-xs font-black text-gray-900">{{ row.total_tarefas_intervalo || 0 }}</div>
            </template>

            <template #cell-custo="{ row }">
              <div class="font-black text-gray-900">{{ format.currency(row.total_custo_intervalo || 0) }}</div>
            </template>

            <template #cell-acoes="{ row }">
              <div class="flex justify-end">
                <Button variant="secondary" size="sm" type="button" @click="abrirDetalhe(row)">
                  Ver tarefas
                </Button>
              </div>
            </template>
          </Table>
        </section>

        <!-- DETALHE (TAREFAS DO PROJETO SELECIONADO) -->
        <div v-if="selecionado" class="mt-8">
          <div class="h-px bg-slate-100 mb-6"></div>

          <section class="space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
                  Tarefas do projeto
                </div>
                <div class="text-lg font-black text-gray-900">
                  {{ selecionado.origem_tipo }} #{{ selecionado.origem_id }}
                  <span class="text-gray-400">·</span>
                  Projeto #{{ selecionado.id }}
                </div>
              </div>

              <div class="flex gap-2">
                <Button variant="secondary" size="sm" type="button" @click="abrirNovaTarefaGarantia">
                  + Tarefa (Garantia)
                </Button>

                <Button variant="ghost" size="sm" type="button" @click="selecionado = null">
                  Fechar
                </Button>
              </div>
            </div>

            <Table
              :columns="columnsTarefas"
              :rows="rowsTarefasSelecionado"
              :loading="false"
              emptyText="Nenhuma tarefa no intervalo."
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
                <div class="font-black text-gray-900">{{ format.currency(Number(row.custo_total || 0)) }}</div>
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
                Custo do projeto (intervalo):
                <span class="text-brand-primary">{{ format.currency(selecionado.total_custo_intervalo || 0) }}</span>
              </div>
            </div>
          </section>

          <!-- ARQUIVOS DO PROJETO (dentro da agenda, como você pediu) -->
          <div class="h-px bg-slate-100 my-6"></div>

          <section class="space-y-3">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
              Arquivos do projeto
            </div>

            <Table
              :columns="columnsArquivos"
              :rows="rowsArquivosSelecionado"
              :loading="false"
              emptyText="Nenhum arquivo anexado."
              :boxed="true"
            >
              <template #cell-nome="{ row }">
                <div class="font-black text-gray-900">
                  {{ row.nome_original || row.nome_arquivo || '—' }}
                </div>
              </template>

              <template #cell-criado="{ row }">
                <div class="text-xs font-black text-gray-900">{{ format.date(row.criado_em) }}</div>
              </template>
            </Table>
          </section>
        </div>
      </div>
    </div>

    <!-- MODAL: TAREFA -->
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
              <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Tarefa</div>
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

            <!-- ALERTA -->
            <div
              v-if="!selecionado"
              class="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-black uppercase tracking-widest"
            >
              Selecione um projeto antes de criar tarefa.
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
import { ProducaoService, FuncionarioService } from '@/services/index'
import { format } from '@/utils/format'

// ===============================
// HELPERS (DATA)
// ===============================
function toISOStartOfDay(dateStr) {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toISOString()
}

function toISOEndOfDay(dateStr) {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T23:59:59`)
  return d.toISOString()
}

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDaysStr(baseYYYYMMDD, days) {
  const d = new Date(`${baseYYYYMMDD}T00:00:00`)
  d.setDate(d.getDate() + Number(days || 0))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function texto(x) {
  return String(x ?? '').toLowerCase().trim()
}

function moedaNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

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
// STATE
// ===============================
const loading = ref(true)
const refreshing = ref(false)

const filtros = reactive({
  inicio: todayStr(),
  fim: addDaysStr(todayStr(), 7),
})

const busca = ref('')

const projetosRaw = ref([])
const selecionado = ref(null)

// funcionários p/ modal
const funcionariosOptions = ref([])
const funcionariosLoading = ref(false)

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
// CONSTANTES
// ===============================
const STATUS_TAREFA = [
  { label: 'PENDENTE', value: 'PENDENTE' },
  { label: 'EM_ANDAMENTO', value: 'EM_ANDAMENTO' },
  { label: 'FINALIZADA', value: 'FINALIZADA' },
  { label: 'CANCELADA', value: 'CANCELADA' },
]

// ===============================
// COLUNAS
// ===============================
const columnsProjetos = [
  { key: 'origem', label: 'Origem' },
  { key: 'status', label: 'Status', width: '160px' },
  { key: 'janela', label: 'Janela', width: '220px' },
  { key: 'tarefas', label: 'Tarefas', width: '120px', align: 'right' },
  { key: 'custo', label: 'Custo', width: '160px', align: 'right' },
  { key: 'acoes', label: 'Ações', width: '140px', align: 'right' },
]

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
]

// ===============================
// FILTRO
// ===============================
function projetoMatchBusca(p, q) {
  if (!q) return true

  const base = `${p.id} ${p.origem_tipo} ${p.origem_id} ${p.status}`.toLowerCase()
  if (base.includes(q)) return true

  const tarefas = p.tarefas || []
  for (const t of tarefas) {
    const tStr = `${t.titulo} ${t.status} ${t.funcionario?.nome || ''} ${t.funcionario_id}`.toLowerCase()
    if (tStr.includes(q)) return true
  }

  return false
}

const projetosFiltrados = computed(() => {
  const q = texto(busca.value)
  return (projetosRaw.value || []).filter((p) => projetoMatchBusca(p, q))
})

const rowsProjetos = computed(() => projetosFiltrados.value || [])

const rowsTarefasSelecionado = computed(() => {
  if (!selecionado.value) return []
  return selecionado.value?.tarefas || []
})

const rowsArquivosSelecionado = computed(() => {
  if (!selecionado.value) return []
  return selecionado.value?.arquivos || []
})

// ===============================
// RESUMOS
// ===============================
const totalProjetos = computed(() => rowsProjetos.value.length)

const totalTarefas = computed(() => {
  return rowsProjetos.value.reduce((acc, p) => acc + Number(p.total_tarefas_intervalo || 0), 0)
})

const totalCusto = computed(() => {
  return rowsProjetos.value.reduce((acc, p) => acc + moedaNum(p.total_custo_intervalo), 0)
})

// ===============================
// ACTIONS
// ===============================
function abrirDetalhe(row) {
  selecionado.value = row
}

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

async function carregar() {
  if (!filtros.inicio || !filtros.fim) return

  const inicioIso = toISOStartOfDay(filtros.inicio)
  const fimIso = toISOEndOfDay(filtros.fim)

  refreshing.value = true
  try {
    const { data } = await ProducaoService.agenda(inicioIso, fimIso)
    projetosRaw.value = Array.isArray(data) ? data : []

    if (selecionado.value) {
      const still = projetosRaw.value.find((p) => Number(p.id) === Number(selecionado.value.id))
      selecionado.value = still || null
    }
  } finally {
    refreshing.value = false
    loading.value = false
  }
}

// ===============================
// MODAL TAREFA
// ===============================
function abrirNovaTarefaGarantia() {
  if (!selecionado.value) return

  tarefaModal.open = true
  tarefaModal.isEdit = false
  tarefaModal.tarefaId = null

  tarefaModal.funcionario_id = null
  tarefaModal.titulo = 'GARANTIA'
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

const podeSalvarTarefa = computed(() => {
  if (savingTarefa.value) return false
  if (!selecionado.value) return false
  if (!tarefaModal.funcionario_id) return false
  if (!String(tarefaModal.titulo || '').trim()) return false
  if (!String(tarefaModal.inicio_em || '').trim()) return false
  if (!String(tarefaModal.fim_em || '').trim()) return false
  return true
})

function montarPayloadCriarTarefa() {
  const p = selecionado.value || {}
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

async function salvarTarefaModal() {
  if (!podeSalvarTarefa.value) return
  savingTarefa.value = true
  try {
    if (tarefaModal.isEdit && tarefaModal.tarefaId) {
      await ProducaoService.atualizarTarefa(tarefaModal.tarefaId, montarPayloadAtualizarTarefa())
    } else {
      await ProducaoService.criarTarefa(montarPayloadCriarTarefa())
    }

    fecharModalTarefa()
    await carregar()
  } finally {
    savingTarefa.value = false
  }
}

async function removerTarefa(row) {
  if (!row?.id || deletingTarefa.value) return
  deletingTarefa.value = true
  try {
    await ProducaoService.removerTarefa(row.id)
    await carregar()
  } finally {
    deletingTarefa.value = false
  }
}

// ===============================
// INIT
// ===============================
onMounted(async () => {
  await carregarFuncionarios()
  await carregar()
})
</script>
