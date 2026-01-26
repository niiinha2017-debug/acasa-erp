<template>
  <Card :shadow="true">
    <PageHeader
      title="Agenda de Produção"
      subtitle="Chão de fábrica: grade semanal de tarefas."
      icon="pi pi-calendar"
      :backTo="'/'"
    />

    <div class="p-6 relative">
      <Loading v-if="loading" />

      <div v-else class="space-y-6">
        <!-- CONTROLES -->
        <section class="grid grid-cols-12 gap-4 items-end">
          <div class="col-span-12 md:col-span-3">
            <Input v-model="semanaInicio" type="date" label="Semana (início) *" />
          </div>

          <div class="col-span-12 md:col-span-3">
            <SearchInput
              v-model="busca"
              mode="search"
              label="Buscar"
              placeholder="Buscar por título, status, funcionário, origem..."
            />
          </div>

          <div class="col-span-12 md:col-span-6 flex items-end justify-end gap-2">
            <Button variant="secondary" size="md" type="button" @click="voltarSemana">◀</Button>
            <Button variant="secondary" size="md" type="button" @click="avancarSemana">▶</Button>

            <Button variant="secondary" size="md" type="button" :loading="refreshing" @click="carregar">
              Atualizar
            </Button>

            <Button variant="primary" size="md" type="button" @click="abrirNovaTarefaSolta">
              + Nova tarefa
            </Button>
          </div>
        </section>

        <div class="h-px bg-slate-100"></div>

        <!-- RESUMO -->
        <section class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-3">
            <div class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Tarefas (semana)</div>
            <div class="text-lg font-black text-gray-900">{{ tarefasFiltradas.length }}</div>
          </div>

          <div class="col-span-12 md:col-span-3">
            <div class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Custo (semana)</div>
            <div class="text-lg font-black text-gray-900">{{ format.currency(totalCustoSemana) }}</div>
          </div>

          <div class="col-span-12 md:col-span-6" />
        </section>

        <div class="h-px bg-slate-100"></div>

        <!-- GRADE SEMANAL -->
        <section class="space-y-3">
          <div class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            Semana: {{ semanaLabel }}
          </div>

          <!-- Cabeçalho dias -->
          <div class="grid grid-cols-7 gap-2">
            <div
              v-for="d in diasSemana"
              :key="d.key"
              class="rounded-2xl border border-slate-100 bg-slate-50/50 p-3"
            >
              <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {{ d.label }}
              </div>
              <div class="text-sm font-black text-gray-900">
                {{ format.date(d.date) }}
              </div>
            </div>
          </div>

          <!-- Linhas (slots) -->
          <div class="space-y-2">
            <div
              v-for="slot in SLOTS"
              :key="slot"
              class="grid grid-cols-7 gap-2"
            >
              <div
                v-for="d in diasSemana"
                :key="d.key + '-' + slot"
                class="min-h-[110px] rounded-2xl border border-slate-100 bg-white p-2"
                @dblclick="abrirNovaTarefaNoSlot(d.date, slot)"
              >
                <!-- topo do slot -->
                <div class="flex items-center justify-between">
                  <div class="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {{ slot }}
                  </div>

                  <button
                    type="button"
                    class="text-slate-300 hover:text-slate-600"
                    title="Criar tarefa"
                    @click.stop="abrirNovaTarefaNoSlot(d.date, slot)"
                  >
                    <i class="pi pi-plus text-[10px]"></i>
                  </button>
                </div>

                <!-- tarefas dentro do slot -->
                <div class="mt-2 space-y-2">
                  <div
                    v-for="t in tarefasNoSlot(d.date, slot)"
                    :key="t.id"
                    class="rounded-xl border border-slate-100 bg-slate-50/50 p-2 cursor-pointer hover:bg-slate-50"
                    @click.stop="editarTarefa(t)"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <div class="text-[11px] font-black text-gray-900 truncate">
                          {{ t.titulo }}
                        </div>
                        <div class="text-[10px] font-bold text-slate-400 truncate">
                          {{ t.funcionario?.nome || `FUNC #${t.funcionario_id}` }} · {{ t.status }}
                        </div>
                      </div>

                      <div class="flex gap-1">
                        <button
                          type="button"
                          class="text-slate-400 hover:text-slate-700"
                          title="Editar"
                          @click.stop="editarTarefa(t)"
                        >
                          <i class="pi pi-pencil text-[10px]"></i>
                        </button>

                        <button
                          type="button"
                          class="text-red-400 hover:text-red-600"
                          title="Excluir"
                          @click.stop="removerTarefa(t)"
                        >
                          <i class="pi pi-times text-[10px]"></i>
                        </button>
                      </div>
                    </div>

                    <div class="mt-1 text-[10px] font-black text-gray-800">
                      {{ format.date(t.inicio_em) }} → {{ format.date(t.fim_em) }}
                    </div>

                    <div class="mt-1 text-[10px] font-black text-gray-900">
                      {{ format.currency(Number(t.custo_total || 0)) }}
                    </div>
                  </div>

                  <div
                    v-if="tarefasNoSlot(d.date, slot).length === 0"
                    class="text-[10px] font-black uppercase tracking-widest text-slate-200 select-none"
                  >
                    —
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">
            * Clique no “+” (ou duplo clique no slot) para criar tarefa.
          </div>
        </section>
      </div>
    </div>

    <!-- MODAL: TAREFA (reaproveitado do seu) -->
    <transition name="fade-slide">
      <div
        v-if="tarefaModal.open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
        @click.self="fecharModalTarefa"
      >
        <div class="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
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

          <div class="p-6 space-y-6">
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-12 md:col-span-6">
                <SearchInput
                  v-model="tarefaModal.funcionario_id"
                  mode="select"
                  label="Funcionário *"
                  placeholder="Selecione..."
                  :options="funcionariosOptions"
                />
              </div>

              <div class="col-span-12 md:col-span-6">
                <SearchInput
                  v-model="tarefaModal.status"
                  mode="select"
                  label="Status *"
                  placeholder="Selecione..."
                  :options="STATUS_TAREFA"
                />
              </div>

              <div class="col-span-12">
                <Input v-model="tarefaModal.titulo" label="Título *" />
              </div>

              <div class="col-span-12">
                <Input v-model="tarefaModal.observacao" label="Observação" />
              </div>

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
          </div>

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
// GRADE FIXA (ajuste aqui)
// ===============================
const SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
] // <- você muda aqui

const STATUS_TAREFA = [
  { label: 'PENDENTE', value: 'PENDENTE' },
  { label: 'EM_ANDAMENTO', value: 'EM_ANDAMENTO' },
  { label: 'FINALIZADA', value: 'FINALIZADA' },
  { label: 'CANCELADA', value: 'CANCELADA' },
]

// ===============================
// HELPERS DATA
// ===============================
function pad(n) { return String(n).padStart(2, '0') }

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + Number(days || 0))
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toISOStartOfDay(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toISOString()
}
function toISOEndOfDay(dateStr) {
  const d = new Date(`${dateStr}T23:59:59`)
  return d.toISOString()
}

function texto(x) {
  return String(x ?? '').toLowerCase().trim()
}

function isoToInputDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function inputDateTimeToISO(v) {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function slotToISO(dateStr, slotHHMM) {
  return new Date(`${dateStr}T${slotHHMM}:00`).toISOString()
}

function plusHoursISO(iso, h = 2) {
  const d = new Date(iso)
  d.setHours(d.getHours() + h)
  return d.toISOString()
}

function mesmaData(aISO, dateStr) {
  const d = new Date(aISO)
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  return `${y}-${m}-${day}` === dateStr
}

function horaStr(iso) {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ===============================
// STATE
// ===============================
const loading = ref(true)
const refreshing = ref(false)

const semanaInicio = ref(todayStr()) // você escolhe a data
const semanaFim = computed(() => addDays(semanaInicio.value, 6))

const busca = ref('')

const projetosRaw = ref([]) // vem do endpoint atual
const funcionariosOptions = ref([])

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
// DIAS (Seg–Sáb)
// ===============================
const diasSemana = computed(() => {
  const base = semanaInicio.value
  const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] // se você quiser só Seg–Sáb, removemos Dom no array
  // aqui vou usar Seg–Sáb conforme você pediu:
  return [0,1,2,3,4,5].map((i) => ({
    key: `${base}-${i}`,
    label: labels[i],
    date: addDays(base, i),
  }))
})

const semanaLabel = computed(() => `${format.date(semanaInicio.value)} → ${format.date(semanaFim.value)}`)

// ===============================
// FLATTEN tarefas (do retorno atual)
// ===============================
const todasTarefas = computed(() => {
  const out = []
  for (const p of (projetosRaw.value || [])) {
    for (const t of (p.tarefas || [])) {
      out.push({
        ...t,
        origem_tipo: p.origem_tipo,
        origem_id: p.origem_id,
      })
    }
  }
  return out
})

const tarefasFiltradas = computed(() => {
  const q = texto(busca.value)
  if (!q) return todasTarefas.value
  return todasTarefas.value.filter((t) => {
    const base =
      `${t.id} ${t.titulo} ${t.status} ${t.funcionario?.nome || ''} ${t.funcionario_id} ${t.origem_tipo} ${t.origem_id}`.toLowerCase()
    return base.includes(q)
  })
})

const totalCustoSemana = computed(() =>
  tarefasFiltradas.value.reduce((acc, t) => acc + Number(t.custo_total || 0), 0)
)

// tarefas por slot = mesmas data + inicio dentro do slot (simples e operacional)
function tarefasNoSlot(dateStr, slotHHMM) {
  return tarefasFiltradas.value.filter((t) => {
    if (!t.inicio_em) return false
    if (!mesmaData(t.inicio_em, dateStr)) return false
    return horaStr(t.inicio_em).startsWith(slotHHMM)
  })
}

// ===============================
// API
// ===============================
async function carregarFuncionarios() {
  const { data } = await FuncionarioService.listar()
  const arr = Array.isArray(data) ? data : []
  funcionariosOptions.value = arr.map((f) => ({
    label: `${f.nome} (#${f.id})`,
    value: f.id,
  }))
}

async function carregar() {
  refreshing.value = true
  try {
    const inicioIso = toISOStartOfDay(semanaInicio.value)
    const fimIso = toISOEndOfDay(semanaFim.value)
    const { data } = await ProducaoService.agenda(inicioIso, fimIso)
    projetosRaw.value = Array.isArray(data) ? data : []
  } finally {
    refreshing.value = false
    loading.value = false
  }
}

// ===============================
// SEMANA NAV
// ===============================
function voltarSemana() {
  semanaInicio.value = addDays(semanaInicio.value, -7)
  carregar()
}
function avancarSemana() {
  semanaInicio.value = addDays(semanaInicio.value, 7)
  carregar()
}

// ===============================
// MODAL
// ===============================
function abrirNovaTarefaSolta() {
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

function abrirNovaTarefaNoSlot(dateStr, slotHHMM) {
  const inicioIso = slotToISO(dateStr, slotHHMM)
  const fimIso = plusHoursISO(inicioIso, 2) // padrão 2h (você altera)
  tarefaModal.open = true
  tarefaModal.isEdit = false
  tarefaModal.tarefaId = null
  tarefaModal.funcionario_id = null
  tarefaModal.titulo = ''
  tarefaModal.status = 'PENDENTE'
  tarefaModal.observacao = ''
  tarefaModal.inicio_em = isoToInputDateTime(inicioIso)
  tarefaModal.fim_em = isoToInputDateTime(fimIso)
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
  if (!tarefaModal.funcionario_id) return false
  if (!String(tarefaModal.titulo || '').trim()) return false
  if (!String(tarefaModal.inicio_em || '').trim()) return false
  if (!String(tarefaModal.fim_em || '').trim()) return false
  return true
})

// ⚠️ Como o endpoint atual usa origem_tipo/origem_id, aqui você mantém o que você já fazia.
// Se você quer criar tarefa “solta” sem origem, aí sim é backend/Prisma (a gente faz depois).
function montarPayloadCriarTarefa() {
  return {
    // manter o seu padrão atual: origem obrigatória
    origem_tipo: 'PRODUCAO',
    origem_id: 0,

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
  if (!confirm('Excluir tarefa?')) return
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
