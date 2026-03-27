<template>
  <PageShell :padded="false">
    <section class="rel-totem ds-page-context animate-page-in">
      <PageHeader
        title="Relatório Totem Fábrica"
        subtitle="Tempo registrado por funcionário e tarefa"
        icon="pi pi-clock"
      >
        <template #actions>
          <div class="rel-totem__filters">
            <Input v-model="filtros.data_inicio" type="date" label="De" :force-upper="false" />
            <Input v-model="filtros.data_fim" type="date" label="Até" :force-upper="false" />
            <Button variant="secondary" class="!rounded-xl self-end" @click="carregar">
              <i class="pi pi-refresh mr-2 text-xs" />Atualizar
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="rel-totem__body ds-page-context__content pb-6">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-2xl text-[var(--ds-color-primary)]" />
        </div>

        <template v-else>
          <!-- Cards resumo -->
          <section class="rel-totem__summary">
            <article v-for="card in cardsResumo" :key="card.id" class="rel-totem__chip" :class="card.cls">
              <span class="rel-totem__chip-label">{{ card.label }}</span>
              <strong class="rel-totem__chip-value">{{ card.valor }}</strong>
            </article>
          </section>

          <!-- Tabela por funcionário -->
          <div class="ds-card ds-card--default overflow-hidden native-table-flush">
            <div class="rel-totem__section-head">
              <i class="pi pi-users text-xs" />
              <span>Horas por Funcionário</span>
            </div>
            <div class="native-table-flush-scroll overflow-x-auto">
              <table class="w-full text-sm min-w-[480px]">
                <thead>
                  <tr class="border-b border-border-ui bg-slate-50 dark:bg-slate-800/50">
                    <th class="py-2 px-4 text-left text-xs font-bold uppercase tracking-wide text-text-muted">Funcionário</th>
                    <th class="py-2 px-4 text-right text-xs font-bold uppercase tracking-wide text-text-muted">Horas</th>
                    <th class="py-2 px-4 text-right text-xs font-bold uppercase tracking-wide text-text-muted">Custo</th>
                    <th class="py-2 px-4 text-right text-xs font-bold uppercase tracking-wide text-text-muted">Apontamentos</th>
                    <th class="py-2 px-4 text-right text-xs font-bold uppercase tracking-wide text-text-muted">Tarefas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!dados.funcionarios?.length">
                    <td colspan="5" class="py-6 px-4 text-center text-text-muted text-sm">Nenhum apontamento no período.</td>
                  </tr>
                  <tr
                    v-for="func in dados.funcionarios"
                    :key="func.funcionario_id"
                    class="border-b border-border-ui hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td class="py-3 px-4 font-medium text-text-main">{{ func.nome }}</td>
                    <td class="py-3 px-4 text-right tabular-nums font-semibold text-text-main">{{ formatarHoras(func.total_horas) }}</td>
                    <td class="py-3 px-4 text-right tabular-nums text-text-muted">{{ formatarMoeda(func.total_custo) }}</td>
                    <td class="py-3 px-4 text-right tabular-nums text-text-muted">{{ func.total_apontamentos }}</td>
                    <td class="py-3 px-4 text-right tabular-nums text-text-muted">{{ func.total_tarefas }}</td>
                  </tr>
                </tbody>
                <tfoot v-if="dados.funcionarios?.length">
                  <tr class="border-t-2 border-border-ui bg-slate-50/70 dark:bg-slate-800/40">
                    <td class="py-3 px-4 font-bold text-text-main">Total</td>
                    <td class="py-3 px-4 text-right tabular-nums font-bold text-text-main">{{ formatarHoras(dados.resumo?.total_horas) }}</td>
                    <td class="py-3 px-4 text-right tabular-nums font-bold text-text-muted">{{ formatarMoeda(dados.resumo?.total_custo) }}</td>
                    <td class="py-3 px-4 text-right tabular-nums font-bold text-text-muted">{{ dados.resumo?.total_apontamentos }}</td>
                    <td class="py-3 px-4 text-right tabular-nums font-bold text-text-muted">{{ dados.resumo?.total_tarefas }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Tabela por tarefa -->
          <div class="ds-card ds-card--default overflow-hidden native-table-flush">
            <div class="rel-totem__section-head">
              <i class="pi pi-list text-xs" />
              <span>Detalhamento por Tarefa</span>
            </div>
            <div class="native-table-flush-scroll overflow-x-auto">
              <table class="w-full text-sm min-w-[600px]">
                <thead>
                  <tr class="border-b border-border-ui bg-slate-50 dark:bg-slate-800/50">
                    <th class="py-2 px-4 text-left text-xs font-bold uppercase tracking-wide text-text-muted">Tarefa</th>
                    <th class="py-2 px-4 text-left text-xs font-bold uppercase tracking-wide text-text-muted">Cliente</th>
                    <th class="py-2 px-4 text-left text-xs font-bold uppercase tracking-wide text-text-muted">Etapa</th>
                    <th class="py-2 px-4 text-center text-xs font-bold uppercase tracking-wide text-text-muted">Status</th>
                    <th class="py-2 px-4 text-right text-xs font-bold uppercase tracking-wide text-text-muted">Horas</th>
                    <th class="py-2 px-4 text-right text-xs font-bold uppercase tracking-wide text-text-muted">Custo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!dados.tarefas?.length">
                    <td colspan="6" class="py-6 px-4 text-center text-text-muted text-sm">Nenhuma tarefa no período.</td>
                  </tr>
                  <template v-for="tarefa in dados.tarefas" :key="tarefa.tipo + tarefa.id">
                    <tr
                      class="border-b border-border-ui hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                      @click="toggleTarefa(tarefa)"
                    >
                      <td class="py-3 px-4 font-medium text-text-main">
                        <div class="flex items-center gap-2">
                          <i
                            class="pi text-[10px] transition-transform"
                            :class="tarefaExpandida(tarefa) ? 'pi-chevron-down' : 'pi-chevron-right'"
                          />
                          {{ tarefa.titulo }}
                        </div>
                      </td>
                      <td class="py-3 px-4 text-text-muted">{{ tarefa.cliente_nome || '—' }}</td>
                      <td class="py-3 px-4 text-text-muted">{{ getSubetapaLabel(tarefa.subetapa) || '—' }}</td>
                      <td class="py-3 px-4 text-center">
                        <span class="rel-totem__status-badge" :class="statusClass(tarefa.status)">
                          {{ statusLabel(tarefa.status) }}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-right tabular-nums font-semibold text-text-main">{{ formatarHoras(tarefa.total_horas) }}</td>
                      <td class="py-3 px-4 text-right tabular-nums text-text-muted">{{ formatarMoeda(tarefa.total_custo) }}</td>
                    </tr>
                    <!-- Sub-rows: funcionários da tarefa -->
                    <template v-if="tarefaExpandida(tarefa)">
                      <tr
                        v-for="(func, fIdx) in tarefa.funcionarios"
                        :key="`${tarefa.tipo}-${tarefa.id}-f${fIdx}`"
                        class="border-b border-border-ui/50 bg-slate-50/40 dark:bg-slate-800/20"
                      >
                        <td class="py-2 px-4 pl-10 text-text-muted text-xs">
                          <span class="rel-totem__func-dot" />
                          {{ func.nome }}
                        </td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td class="py-2 px-4 text-right tabular-nums text-xs text-text-muted">{{ formatarHoras(func.horas) }}</td>
                        <td class="py-2 px-4 text-right tabular-nums text-xs text-text-muted">{{ formatarMoeda(func.custo) }}</td>
                      </tr>
                    </template>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageShell from '@/components/ui/PageShell.vue'
import { RelatorioTotemService } from '@/services'
import { getSubetapaLabel } from '@/constantes'
import { notify } from '@/services/notify'

definePage({ meta: { perm: 'agendamentos.producao' } })

function formatYmdLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const hoje = new Date()
const filtros = ref({
  data_inicio: formatYmdLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
  data_fim: formatYmdLocal(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)),
})

const loading = ref(false)
const dados = ref({})
const expandidas = ref(new Set())

const cardsResumo = computed(() => {
  const r = dados.value?.resumo || {}
  return [
    { id: 'horas', label: 'Total de horas', valor: formatarHoras(r.total_horas), cls: 'rel-totem__chip--info' },
    { id: 'custo', label: 'Custo total', valor: formatarMoeda(r.total_custo), cls: 'rel-totem__chip--neutral' },
    { id: 'funcs', label: 'Funcionários', valor: String(r.total_funcionarios ?? 0), cls: 'rel-totem__chip--neutral' },
    { id: 'tarefas', label: 'Tarefas', valor: String(r.total_tarefas ?? 0), cls: 'rel-totem__chip--neutral' },
    { id: 'concluidas', label: 'Concluídas', valor: String(r.tarefas_concluidas ?? 0), cls: 'rel-totem__chip--success' },
    { id: 'producao', label: 'Em produção', valor: String(r.tarefas_em_producao ?? 0), cls: 'rel-totem__chip--warning' },
    { id: 'pendentes', label: 'Pendentes', valor: String(r.tarefas_pendentes ?? 0), cls: 'rel-totem__chip--neutral' },
  ]
})

async function carregar() {
  loading.value = true
  try {
    const { data } = await RelatorioTotemService.get({
      data_inicio: filtros.value.data_inicio,
      data_fim: filtros.value.data_fim,
    })
    dados.value = data || {}
  } catch {
    notify.error('Não foi possível carregar o relatório.')
    dados.value = {}
  } finally {
    loading.value = false
  }
}

function formatarMoeda(v) {
  const n = Number(v) || 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarHoras(v) {
  const h = Number(v) || 0
  const hInt = Math.floor(h)
  const min = Math.round((h - hInt) * 60)
  return `${hInt}h${min > 0 ? ` ${min}min` : ''}`
}

function statusLabel(s) {
  const m = {
    PENDENTE: 'Pendente',
    EM_PRODUCAO: 'Em produção',
    EM_ANDAMENTO: 'Em andamento',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
  }
  return m[String(s).toUpperCase()] || s || '—'
}

function statusClass(s) {
  const upper = String(s).toUpperCase()
  if (upper === 'CONCLUIDO') return 'rel-totem__status-badge--success'
  if (upper === 'EM_PRODUCAO' || upper === 'EM_ANDAMENTO') return 'rel-totem__status-badge--info'
  if (upper === 'CANCELADO') return 'rel-totem__status-badge--danger'
  return 'rel-totem__status-badge--neutral'
}

function tarefaKey(t) { return `${t.tipo}:${t.id}` }
function tarefaExpandida(t) { return expandidas.value.has(tarefaKey(t)) }
function toggleTarefa(t) {
  const k = tarefaKey(t)
  if (expandidas.value.has(k)) expandidas.value.delete(k)
  else expandidas.value.add(k)
}

onMounted(carregar)
watch([() => filtros.value.data_inicio, () => filtros.value.data_fim], carregar)
</script>

<style scoped>
.rel-totem__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rel-totem__filters {
  display: grid;
  grid-template-columns: minmax(0, 10rem) minmax(0, 10rem) auto;
  align-items: end;
  gap: 0.75rem;
  width: 100%;
  max-width: 32rem;
}

/* ── Summary chips ── */
.rel-totem__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.rel-totem__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.5rem;
  padding: 0 1rem;
  border: 1px solid var(--ds-color-border);
  border-radius: 9px;
  background: var(--ds-color-bg);
}

.rel-totem__chip-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--ds-color-text-soft);
}

.rel-totem__chip-value {
  font-size: 0.92rem;
  font-weight: 900;
  color: var(--ds-color-text);
}

.rel-totem__chip--success { border-color: rgba(22,163,74,.3); background: rgba(22,163,74,.06); }
.rel-totem__chip--warning { border-color: rgba(245,158,11,.3); background: rgba(245,158,11,.06); }
.rel-totem__chip--info    { border-color: rgba(37,99,235,.25); background: rgba(37,99,235,.05); }

/* ── Section heading ── */
.rel-totem__section-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ds-color-text-soft);
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-bg);
}

/* ── Status badge ── */
.rel-totem__status-badge {
  display: inline-flex;
  align-items: center;
  height: 1.4rem;
  padding: 0 0.5rem;
  border-radius: 5px;
  font-size: 0.58rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.rel-totem__status-badge--success { background: rgba(22,163,74,.1); color: #15803d; }
.rel-totem__status-badge--info    { background: rgba(37,99,235,.1); color: #1d4ed8; }
.rel-totem__status-badge--danger  { background: rgba(239,68,68,.1); color: #b91c1c; }
.rel-totem__status-badge--neutral { background: rgba(100,116,139,.1); color: #475569; }

/* ── Func dot in sub-row ── */
.rel-totem__func-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ds-color-primary);
  margin-right: 0.4rem;
  vertical-align: middle;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .rel-totem__filters {
    grid-template-columns: 1fr 1fr;
    max-width: 100%;
  }
  .rel-totem__filters > :last-child {
    grid-column: 1 / -1;
  }
}
</style>
