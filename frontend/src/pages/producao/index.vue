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
            <div class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              Projetos
            </div>
            <div class="text-lg font-black text-gray-900">
              {{ totalProjetos }}
            </div>
          </div>

          <div class="col-span-12 md:col-span-3">
            <div class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              Tarefas (intervalo)
            </div>
            <div class="text-lg font-black text-gray-900">
              {{ totalTarefas }}
            </div>
          </div>

          <div class="col-span-12 md:col-span-3">
            <div class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              Custo (intervalo)
            </div>
            <div class="text-lg font-black text-gray-900">
              {{ format.currency(totalCusto) }}
            </div>
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
            emptyText="Nenhum projeto com tarefas no intervalo."
            :boxed="true"
          >
            <template #cell-origem="{ row }">
              <div class="font-black text-gray-900">
                {{ row.origem_tipo }} #{{ row.origem_id }}
              </div>
              <div class="text-xs font-bold text-gray-400">
                Projeto #{{ row.id }}
              </div>
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
              <div class="text-xs font-black text-gray-900">
                {{ row.total_tarefas_intervalo || 0 }}
              </div>
            </template>

            <template #cell-custo="{ row }">
              <div class="font-black text-gray-900">
                {{ format.currency(row.total_custo_intervalo || 0) }}
              </div>
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
                <div class="font-black text-gray-900">
                  {{ row.funcionario?.nome || '—' }}
                </div>
                <div class="text-xs font-bold text-gray-400">
                  ID: {{ row.funcionario_id }}
                </div>
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
            </Table>

            <div class="flex justify-end">
              <div class="text-sm font-black uppercase tracking-tight text-gray-900">
                Custo do projeto (intervalo):
                <span class="text-brand-primary">{{ format.currency(selecionado.total_custo_intervalo || 0) }}</span>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  </Card>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ProducaoService } from '@/services/index'
import { format } from '@/utils/format'

/**
 * ✅ SEM IMPORTAR COMPONENTES (já estão no main.js)
 * - Card, PageHeader, Loading, Input, SearchInput, Table, Button, StatusBadge
 */

// ===============================
// HELPERS (DATA)
// ===============================
function toISOStartOfDay(dateStr) {
  // dateStr: 'YYYY-MM-DD'
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

const projetosRaw = ref([]) // retorno do backend (com agregados)
const selecionado = ref(null)

// ===============================
// COLUNAS TABELAS
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
]

// ===============================
// COMPUTEDS (FILTRO)
// ===============================
function projetoMatchBusca(p, q) {
  if (!q) return true

  // campos do projeto
  const base =
    `${p.id} ${p.origem_tipo} ${p.origem_id} ${p.status}`.toLowerCase()

  if (base.includes(q)) return true

  // tarefas
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

async function carregar() {
  // validação mínima
  if (!filtros.inicio || !filtros.fim) return

  const inicioIso = toISOStartOfDay(filtros.inicio)
  const fimIso = toISOEndOfDay(filtros.fim)

  refreshing.value = true
  try {
    const { data } = await ProducaoService.getAgenda(inicioIso, fimIso)
    projetosRaw.value = Array.isArray(data) ? data : []
    // se o selecionado não existir mais na lista, fecha
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
// INIT
// ===============================
onMounted(async () => {
  await carregar()
})
</script>
