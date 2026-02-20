<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Visão geral – Vendas"
        subtitle="Orçamentos, fechamento de venda e contratos (área comercial)"
        icon="pi pi-briefcase"
      />

      <div class="px-4 md:px-6 pb-5 md:pb-6 pt-4 border-t border-border-ui space-y-6">
        <!-- Resumo (Vendas só vê números da área comercial) -->
        <div
          v-if="temAlgumAcesso && podeVerResumo"
          class="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <div class="rounded-xl border border-border-ui bg-bg-page p-4">
            <p class="text-[10px] font-bold uppercase tracking-wider text-text-soft mb-1">Orçamentos</p>
            <p class="text-xl font-black text-text-main">{{ resumo.orcamentos_em_andamento ?? '–' }}</p>
          </div>
          <div class="rounded-xl border border-border-ui bg-bg-page p-4">
            <p class="text-[10px] font-bold uppercase tracking-wider text-text-soft mb-1">Aprovados sem venda</p>
            <p class="text-xl font-black text-text-main">{{ resumo.orcamentos_aprovados_sem_venda ?? '–' }}</p>
          </div>
          <div class="rounded-xl border border-border-ui bg-bg-page p-4">
            <p class="text-[10px] font-bold uppercase tracking-wider text-text-soft mb-1">Vendas este mês</p>
            <p class="text-xl font-black text-text-main">{{ resumo.vendas_fechadas_mes ?? '–' }}</p>
          </div>
          <div class="rounded-xl border border-border-ui bg-bg-page p-4">
            <p class="text-[10px] font-bold uppercase tracking-wider text-text-soft mb-1">Contratos</p>
            <p class="text-xl font-black text-text-main">{{ resumo.contratos_total ?? '–' }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <RouterLink
            v-if="can('orcamentos.ver')"
            to="/orcamentos"
            class="group flex flex-col p-6 rounded-2xl border border-border-ui bg-bg-page hover:border-brand-primary/50 hover:shadow-lg transition-all duration-200"
          >
            <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-brand-primary/10 transition-colors">
              <i class="pi pi-file-edit text-xl text-brand-primary"></i>
            </div>
            <h3 class="text-base font-bold text-text-main uppercase tracking-tight mb-1">Orçamento</h3>
            <p class="text-xs text-text-soft">Propostas e negociações</p>
          </RouterLink>

          <RouterLink
            v-if="can('vendas.criar')"
            to="/vendas/fechamento"
            class="group flex flex-col p-6 rounded-2xl border border-border-ui bg-bg-page hover:border-brand-primary/50 hover:shadow-lg transition-all duration-200"
          >
            <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-brand-primary/10 transition-colors">
              <i class="pi pi-shopping-cart text-xl text-brand-primary"></i>
            </div>
            <h3 class="text-base font-bold text-text-main uppercase tracking-tight mb-1">Fechamento de venda</h3>
            <p class="text-xs text-text-soft">Converter orçamento em venda</p>
          </RouterLink>

          <RouterLink
            v-if="can('contratos.ver')"
            to="/contratos"
            class="group flex flex-col p-6 rounded-2xl border border-border-ui bg-bg-page hover:border-brand-primary/50 hover:shadow-lg transition-all duration-200"
          >
            <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-brand-primary/10 transition-colors">
              <i class="pi pi-file text-xl text-brand-primary"></i>
            </div>
            <h3 class="text-base font-bold text-text-main uppercase tracking-tight mb-1">Contrato</h3>
            <p class="text-xs text-text-soft">Contratos comerciais</p>
          </RouterLink>

          <RouterLink
            v-if="can('orcamentos.editar')"
            to="/contratos/clausulas"
            class="group flex flex-col p-6 rounded-2xl border border-border-ui bg-bg-page hover:border-brand-primary/50 hover:shadow-lg transition-all duration-200"
          >
            <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-brand-primary/10 transition-colors">
              <i class="pi pi-file-edit text-xl text-brand-primary"></i>
            </div>
            <h3 class="text-base font-bold text-text-main uppercase tracking-tight mb-1">Cláusulas</h3>
            <p class="text-xs text-text-soft">Modelos de orçamento e contrato</p>
          </RouterLink>

          <RouterLink
            v-if="can('agendamentos.ver')"
            to="/agendamentos?visao=geral"
            class="group flex flex-col p-6 rounded-2xl border border-border-ui bg-bg-page hover:border-brand-primary/50 hover:shadow-lg transition-all duration-200"
          >
            <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-brand-primary/10 transition-colors">
              <i class="pi pi-calendar-clock text-xl text-brand-primary"></i>
            </div>
            <h3 class="text-base font-bold text-text-main uppercase tracking-tight mb-1">Agenda</h3>
            <p class="text-xs text-text-soft">Produção, montagem e entregas</p>
          </RouterLink>
        </div>

        <!-- Próximos agendamentos (agenda da produção) -->
        <div
          v-if="can('agendamentos.ver')"
          class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden"
        >
          <div class="px-4 py-3 border-b border-border-ui flex items-center justify-between">
            <span class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Próximos agendamentos (agenda produção)
            </span>
            <RouterLink
              to="/agendamentos?visao=geral"
              class="text-xs font-bold text-brand-primary hover:underline"
            >
              Ver agenda completa
            </RouterLink>
          </div>
          <div class="p-4">
            <div v-if="loadingAgenda" class="py-6 text-center text-text-soft text-sm">
              <i class="pi pi-spin pi-spinner mr-2" />
              Carregando...
            </div>
            <div v-else-if="proximosAgendamentos.length === 0" class="py-6 text-center text-text-soft text-sm">
              Nenhum agendamento nos próximos dias.
            </div>
            <ul v-else class="space-y-2">
              <li
                v-for="ev in proximosAgendamentos"
                :key="ev.id"
                class="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 border-b border-border-ui last:border-0 text-sm"
              >
                <span class="font-bold text-text-main shrink-0">
                  {{ formatarDataAgenda(ev.inicio_em) }}
                </span>
                <span class="text-text-soft">{{ formatarHoraAgenda(ev.inicio_em) }} – {{ formatarHoraAgenda(ev.fim_em) }}</span>
                <span class="font-medium text-text-main">{{ ev.titulo }}</span>
                <span class="text-text-soft">
                  — {{ ev.cliente?.nome_completo || ev.cliente?.razao_social || 'Cliente' }}
                  <span class="text-[10px] uppercase">({{ labelOrigemAgenda(ev) }})</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div v-if="!temAlgumAcesso" class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-6 text-center">
          <p class="text-sm text-amber-800 dark:text-amber-200">Você não tem permissão para acessar nenhum módulo comercial.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { AgendaService } from '@/services'
import api from '@/services/api'
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'orcamentos.ver' } })

const temAlgumAcesso = computed(() =>
  can('orcamentos.ver') || can('vendas.criar') || can('contratos.ver') || can('orcamentos.editar') || can('agendamentos.ver')
)

const podeVerResumo = computed(() =>
  can('orcamentos.ver') || can('vendas.criar') || can('contratos.ver')
)

const resumo = ref({
  orcamentos_em_andamento: null,
  orcamentos_aprovados_sem_venda: null,
  vendas_fechadas_mes: null,
  contratos_total: null,
})

const loadingAgenda = ref(false)
const proximosAgendamentos = ref([])

function formatarDataAgenda(iso) {
  if (!iso) return '–'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '–'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatarHoraAgenda(iso) {
  if (!iso) return '–'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '–'
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function labelOrigemAgenda(ev) {
  if (ev?.plano_corte_id) return 'Plano de corte'
  if (ev?.orcamento_id) return 'Orçamento'
  if (ev?.venda_id) return 'Venda'
  return 'Cliente'
}

async function carregarAgenda() {
  if (!can('agendamentos.ver')) return
  loadingAgenda.value = true
  try {
    const hoje = new Date()
    const fim = new Date(hoje)
    fim.setDate(fim.getDate() + 14)
    const inicioStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
    const fimStr = `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, '0')}-${String(fim.getDate()).padStart(2, '0')}`
    const res = await AgendaService.listarTodos(inicioStr, fimStr)
    let data = Array.isArray(res?.data) ? res.data : []
    if (can('agendamentos.vendas') && !can('agendamentos.producao')) {
      data = data.filter((ev) => !ev?.plano_corte_id)
    }
    data.sort((a, b) => new Date(a.inicio_em) - new Date(b.inicio_em))
    proximosAgendamentos.value = data.slice(0, 10)
  } catch {
    proximosAgendamentos.value = []
  } finally {
    loadingAgenda.value = false
  }
}

async function carregarResumo() {
  if (!podeVerResumo.value) return
  try {
    const { data } = await api.get('/analytics/dashboard/resumo-vendas')
    resumo.value = data ?? {}
  } catch {
    // silencia; resumo é opcional
  }
}

onMounted(() => {
  carregarResumo()
  carregarAgenda()
})
</script>
