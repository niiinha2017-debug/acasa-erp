<template>
  <Card :shadow="true" class="overflow-visible">
    <PageHeader 
      title="Agenda de Produção" 
      subtitle="Chão de fábrica: grade semanal de tarefas." 
      icon="pi pi-calendar" 
      backTo="/" 
    />

    <div class="p-6 relative">
      <Loading v-if="loading" />

      <div v-else class="space-y-8">
        <section class="flex flex-col md:flex-row gap-4 items-end justify-between bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-2/3">
            <Input v-model="semanaInicio" type="date" label="Semana (início) *" />
            <SearchInput 
              v-model="busca" 
              mode="search" 
              label="Buscar" 
              placeholder="Título, status, funcionário..." 
            />
          </div>

          <div class="flex items-center gap-2">
            <div class="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
              <button @click="voltarSemana" class="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">◀</button>
              <button @click="avancarSemana" class="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">▶</button>
            </div>
            
            <Button v-if="can('producao.ver')" variant="secondary" :loading="refreshing" @click="carregar">
              <i class="pi pi-refresh"></i>
            </Button>
            
            <Button v-if="can('producao.criar')" variant="primary" @click="abrirNovaTarefaSolta">
              + Nova Tarefa
            </Button>
          </div>
        </section>

        <section class="grid grid-cols-2 md:grid-cols-4 gap-6 px-2">
          <header>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tarefas (Filtro)</p>
            <p class="text-2xl font-black text-slate-800 tracking-tighter italic">{{ tarefasFiltradas.length }}</p>
          </header>
          <header>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Custo Total</p>
            <p class="text-2xl font-black text-emerald-600 tracking-tighter italic">{{ format.currency(totalCustoSemana) }}</p>
          </header>
        </section>

        <section v-if="projetosPendentes.length" class="bg-amber-50/40 p-6 rounded-[2.5rem] border border-amber-100">
          <h3 class="text-[11px] font-black uppercase tracking-widest text-amber-600 mb-4 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Projetos Encaminhados (Sem Tarefas)
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <button 
              v-for="p in projetosPendentes" :key="p.id" 
              @click="abrirNovaTarefaDeProjeto(p)"
              class="group bg-white p-4 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all text-left"
            >
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{{ p.origem_tipo }} #{{ p.origem_id }}</p>
              <p class="text-xs font-bold text-slate-700 mt-1 group-hover:text-amber-700">Agendar 1ª Tarefa</p>
              <p class="text-[9px] text-slate-400 mt-2 italic italic">Encaminhado em: {{ format.date(p.encaminhado_em) }}</p>
            </button>
          </div>
        </section>

        <section class="space-y-4">
          <div class="flex items-center justify-between px-2">
            <h3 class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Semana: {{ semanaLabel }}</h3>
          </div>
          
          <div class="overflow-x-auto pb-4 custom-scrollbar">
            <div class="min-w-[1100px] space-y-3">
              <div class="grid grid-cols-7 gap-3">
                <div v-for="d in diasSemana" :key="d.key" class="p-4 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200 relative overflow-hidden">
                  <p class="text-[9px] font-black uppercase opacity-50 tracking-[0.2em] mb-1">{{ d.label }}</p>
                  <p class="text-sm font-black italic tracking-tight">{{ format.date(d.date) }}</p>
                  <div class="absolute -right-2 -bottom-2 opacity-10 text-4xl font-black italic select-none">{{ d.label[0] }}</div>
                </div>
              </div>

              <div v-for="slot in SLOTS" :key="slot" class="grid grid-cols-7 gap-3">
                <div 
                  v-for="d in diasSemana" :key="d.key + '-' + slot"
                  @dblclick="can('producao.criar') && abrirNovaTarefaNoSlot(d.date, slot)"
                  class="group min-h-[140px] rounded-[2rem] border border-slate-100 bg-white p-3 hover:border-brand-primary/40 transition-all hover:shadow-md relative"
                >
                  <header class="flex justify-between items-center mb-2 px-1">
                    <span class="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">{{ slot }}</span>
                    <button v-if="can('producao.criar')" @click.stop="abrirNovaTarefaNoSlot(d.date, slot)" class="opacity-0 group-hover:opacity-100 text-brand-primary hover:scale-110 transition-all">
                      <i class="pi pi-plus-circle text-sm"></i>
                    </button>
                  </header>

                  <div class="space-y-2">
                    <div 
                      v-for="t in tarefasNoSlot(d.date, slot)" :key="t.id"
                      @click.stop="can('producao.editar') && editarTarefa(t)"
                      class="p-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all cursor-pointer group/task relative"
                    >
                      <div class="flex justify-between items-start mb-1">
                        <p class="text-[10px] font-black text-slate-800 leading-tight uppercase truncate pr-4">{{ t.titulo }}</p>
                        <button v-if="can('producao.excluir')" @click.stop="confirmarRemoverTarefa(t)" class="opacity-0 group-hover/task:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity absolute top-2 right-2">
                          <i class="pi pi-times-circle text-[12px]"></i>
                        </button>
                      </div>

                      <div class="flex flex-col gap-1 text-[9px] font-bold">
                        <span class="text-slate-400 flex items-center gap-1">
                          <i class="pi pi-clock text-[8px]"></i> {{ Number(t.horas_total || 0).toFixed(1) }}h
                        </span>
                        <span class="text-emerald-600 font-black tracking-tight">
                          {{ format.currency(Number(t.custo_total || 0)) }}
                        </span>
                        <div class="mt-1 flex items-center gap-1">
                           <span class="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[8px] uppercase font-black">
                             {{ t.status }}
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <Teleport to="body">
      <transition name="fade">
        <div v-if="tarefaModal.open" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="confirmarFecharModalTarefa">
          <div class="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
            <header class="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">Gestão de Fábrica</p>
                <h3 class="text-xl font-black italic uppercase text-slate-800 tracking-tight">
                  {{ tarefaModal.isEdit ? 'Editar Detalhes' : 'Agendar Nova Tarefa' }}
                </h3>
              </div>
              <button @click="confirmarFecharModalTarefa" class="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm">
                <i class="pi pi-times"></i>
              </button>
            </header>

            <form class="p-8 grid grid-cols-12 gap-5" @submit.prevent="confirmarSalvarTarefa">
              <div v-if="!tarefaModal.isEdit" class="col-span-12">
                <SearchInput 
                   v-model="tarefaModal._origem_key" 
                   mode="select" 
                   label="Vincular ao Projeto/Origem *" 
                   placeholder="Selecione o projeto de origem..."
                   :options="projetosOptions" 
                   @update:modelValue="setOrigemFromKey" 
                />
              </div>

              <div class="col-span-12 md:col-span-6">
                <SearchInput v-model="tarefaModal.funcionario_id" mode="select" label="Responsável" placeholder="Quem vai executar?" :options="funcionariosOptions" />
              </div>
              <div class="col-span-12 md:col-span-6">
                <SearchInput v-model="tarefaModal.status" mode="select" label="Status Atual *" :options="STATUS_TAREFA" />
              </div>
              
              <div class="col-span-12">
                <Input v-model="tarefaModal.titulo" label="Título da Tarefa *" placeholder="Ex: Montagem da Estrutura" />
              </div>

              <div class="col-span-12">
                <Input v-model="tarefaModal.observacao" label="Observações / Instruções" placeholder="Detalhes técnicos..." />
              </div>

              <div class="col-span-12 md:col-span-6">
                <Input v-model="tarefaModal.inicio_em" type="datetime-local" label="Início Previsto *" />
              </div>
              <div class="col-span-12 md:col-span-6">
                <Input v-model="tarefaModal.fim_em" type="datetime-local" label="Finalização Prevista *" />
              </div>

              <footer class="col-span-12 flex justify-end gap-3 mt-6">
                <Button variant="secondary" type="button" @click="confirmarFecharModalTarefa">Descartar</Button>
                <Button 
                   variant="primary" 
                   type="submit" 
                   :loading="savingTarefa" 
                   :disabled="!podeSalvarTarefa"
                >
                  <i class="pi pi-check mr-2"></i>
                  {{ tarefaModal.isEdit ? 'Salvar Alterações' : 'Confirmar Agendamento' }}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      </transition>
    </Teleport>
  </Card>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ProducaoService, FuncionarioService } from '@/services/index'
import { format } from '@/utils/format'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'
import { notify } from '@/services/notify'


definePage({ meta: { perm: 'producao.ver' } })


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

const projetosPendentes = computed(() =>
  (projetosRaw.value || []).filter((p) => p.encaminhado_em && (!p.tarefas || p.tarefas.length === 0))
)


const tarefaModal = reactive({
  open: false,
  isEdit: false,
  tarefaId: null,

  // ✅ origem do projeto (obrigatório no create)
  origem_tipo: '',
  origem_id: 0,

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
const projetosOptions = computed(() => {
  return (projetosRaw.value || []).map((p) => ({
    label: `${p.codigo ? p.codigo + ' · ' : ''}${p.origem_tipo} #${p.origem_id}`,
    value: `${p.origem_tipo}::${p.origem_id}`,
  }))
})


function setOrigemFromKey(v) {
  const s = String(v || '')
  const [tipo, idStr] = s.split('::')
  tarefaModal.origem_tipo = String(tipo || '').trim()
  tarefaModal.origem_id = Number(idStr || 0)
}

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

function abrirNovaTarefaDeProjeto(p) {
  if (!can('producao.criar')) return notify.error('Acesso negado.')

  tarefaModal.open = true
  tarefaModal.isEdit = false
  tarefaModal.tarefaId = null

  tarefaModal.origem_tipo = p.origem_tipo
  tarefaModal.origem_id = p.origem_id
  tarefaModal._origem_key = `${p.origem_tipo}::${p.origem_id}`

  tarefaModal.funcionario_id = null
  tarefaModal.titulo = ''
  tarefaModal.status = 'PENDENTE'
  tarefaModal.observacao = ''
  tarefaModal.inicio_em = ''
  tarefaModal.fim_em = ''
}


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
    return horaStr(t.inicio_em).slice(0, 2) === slotHHMM.slice(0, 2)
  })
}

// ===============================
// API
// ===============================
async function carregarFuncionariosSelect(q = '') {
  if (!can('funcionarios.select')) return
  const { data } = await FuncionarioService.select(q)
  funcionariosOptions.value = Array.isArray(data) ? data : []
}



async function carregar() {
  if (!can('producao.ver')) return  
  refreshing.value = true
  try {
    const inicioIso = toISOStartOfDay(semanaInicio.value)
    const fimIso = toISOEndOfDay(semanaFim.value)

    const { data } = await ProducaoService.getAgenda(inicioIso, fimIso)

    projetosRaw.value = Array.isArray(data) ? data : []
  } finally {
    refreshing.value = false
    loading.value = false
  }
}

// salvar (wrapper) - chama sua salvarTarefaModal real
async function confirmarSalvarTarefa() {
  const perm = tarefaModal.isEdit ? 'producao.editar' : 'producao.criar'
  if (!can(perm)) return notify.error('Acesso negado.')

  if (!podeSalvarTarefa.value) return

  const ok = await confirm.show(
    tarefaModal.isEdit ? 'Salvar Alterações' : 'Criar Tarefa',
    tarefaModal.isEdit
      ? `Deseja salvar as alterações da tarefa "${tarefaModal.titulo}"?`
      : `Deseja criar a tarefa "${tarefaModal.titulo}"?`,
  )
  if (!ok) return

  await salvarTarefaModal()
}

// excluir (wrapper)
async function confirmarRemoverTarefa(row) {
  if (!can('producao.excluir')) return notify.error('Acesso negado.')

  if (!row?.id || deletingTarefa.value) return

  const ok = await confirm.show(
    'Excluir Tarefa',
    `Deseja excluir a tarefa "${row.titulo}"? Esta ação não pode ser desfeita.`,
  )
  if (!ok) return

  deletingTarefa.value = true
  try {
    await ProducaoService.tarefas.remover(row.id)
    await carregar()
  } finally {
    deletingTarefa.value = false
  }
}

// fechar modal (wrapper)
async function confirmarFecharModalTarefa() {
  const ok = await confirm.show(
    'Fechar',
    'Deseja fechar o formulário da tarefa?',
  )
  if (!ok) return
  fecharModalTarefa()
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
  if (!can('producao.criar')) return notify.error('Acesso negado.')

  tarefaModal.open = true
  tarefaModal.isEdit = false
  tarefaModal.tarefaId = null

  tarefaModal.origem_tipo = ''
  tarefaModal.origem_id = 0
  tarefaModal._origem_key = ''

  tarefaModal.funcionario_id = null
  tarefaModal.titulo = ''
  tarefaModal.status = 'PENDENTE'
  tarefaModal.observacao = ''
  tarefaModal.inicio_em = ''
  tarefaModal.fim_em = ''
}


function abrirNovaTarefaNoSlot(dateStr, slotHHMM) {
  if (!can('producao.criar')) return notify.error('Acesso negado.')

  const inicioIso = slotToISO(dateStr, slotHHMM)
  const fimIso = plusHoursISO(inicioIso, 2)

  tarefaModal.open = true
  tarefaModal.isEdit = false
  tarefaModal.tarefaId = null

  tarefaModal.origem_tipo = ''
  tarefaModal.origem_id = 0
  tarefaModal._origem_key = ''

  tarefaModal.funcionario_id = null
  tarefaModal.titulo = ''
  tarefaModal.status = 'PENDENTE'
  tarefaModal.observacao = ''
  tarefaModal.inicio_em = isoToInputDateTime(inicioIso)
  tarefaModal.fim_em = isoToInputDateTime(fimIso)
}


function editarTarefa(row) {
  if (!can('producao.editar')) return notify.error('Acesso negado.')

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

  // ✅ origem obrigatória no create (e também no edit se você quiser)
  if (!String(tarefaModal.origem_tipo || '').trim()) return false
  if (!Number(tarefaModal.origem_id || 0)) return false

  if (!String(tarefaModal.titulo || '').trim()) return false
  if (!String(tarefaModal.inicio_em || '').trim()) return false
  if (!String(tarefaModal.fim_em || '').trim()) return false

  return true
})


// ⚠️ Como o endpoint atual usa origem_tipo/origem_id, aqui você mantém o que você já fazia.
// Se você quer criar tarefa “solta” sem origem, aí sim é backend/Prisma (a gente faz depois).
function montarPayloadCriarTarefa() {
  return {
    origem_tipo: String(tarefaModal.origem_tipo || '').trim(),
    origem_id: Number(tarefaModal.origem_id || 0),

    funcionario_id: tarefaModal.funcionario_id ? Number(tarefaModal.funcionario_id) : null,
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
      await ProducaoService.tarefas.atualizar(tarefaModal.tarefaId, montarPayloadAtualizarTarefa())
    } else {
      await ProducaoService.tarefas.criar(montarPayloadCriarTarefa())
    }
    fecharModalTarefa()
    await carregar()
  } finally {
    savingTarefa.value = false
  }
}

watch(
  () => semanaInicio.value,
  async () => {
    if (loading.value) return // evita rodar durante o primeiro load
    await carregar()
  }
)



// ===============================
// INIT
// ===============================
onMounted(async () => {
  await carregarFuncionariosSelect()
  await carregar()
})
</script>
