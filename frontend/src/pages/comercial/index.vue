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
        <div
          v-if="can('vendas.criar')"
          class="rounded-2xl border border-border-ui bg-bg-page overflow-hidden"
        >
          <div class="px-4 py-3 border-b border-border-ui">
            <span class="text-[11px] font-black uppercase tracking-[0.18em] text-text-soft">
              Meu progresso em vendas
            </span>
          </div>
          <div class="p-4">
            <div v-if="loadingResumoVendedor" class="py-4 text-sm text-text-soft">
              <i class="pi pi-spin pi-spinner mr-2" />
              Carregando progresso...
            </div>
            <div v-else class="space-y-3">
              <div class="text-xs text-text-soft">
                <span class="font-semibold text-text-main">
                  Vendedor: {{ resumoVendedor.vendedor || 'Não identificado' }}
                </span>
                <span class="mx-2">•</span>
                <span>Fonte: {{ resumoVendedor.fonte_vendedor || 'Usuário autenticado' }}</span>
                <RouterLink
                  :to="resumoVendedor.link_referencia || '/vendas/fechamento'"
                  class="ml-2 font-semibold text-brand-primary hover:underline"
                >
                  Ver referência
                </RouterLink>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="rounded-xl border border-border-ui bg-bg-card p-4">
                <p class="text-[10px] font-bold uppercase tracking-wider text-text-soft mb-1">Minhas vendas</p>
                <p class="text-xl font-black text-text-main">{{ resumoVendedor.minhas_vendas_total ?? 0 }}</p>
              </div>
              <div class="rounded-xl border border-border-ui bg-bg-card p-4">
                <p class="text-[10px] font-bold uppercase tracking-wider text-text-soft mb-1">Fechadas no mês</p>
                <p class="text-xl font-black text-text-main">{{ resumoVendedor.minhas_vendas_mes ?? 0 }}</p>
              </div>
              <div class="rounded-xl border border-border-ui bg-bg-card p-4">
                <p class="text-[10px] font-bold uppercase tracking-wider text-text-soft mb-1">Em produção</p>
                <p class="text-xl font-black text-text-main">{{ resumoVendedor.minhas_em_producao ?? 0 }}</p>
              </div>
              <div class="rounded-xl border border-border-ui bg-bg-card p-4">
                <p class="text-[10px] font-bold uppercase tracking-wider text-text-soft mb-1">Finalizadas</p>
                <p class="text-xl font-black text-text-main">{{ resumoVendedor.minhas_finalizadas ?? 0 }}</p>
              </div>
              </div>
            </div>
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
            v-if="can('vendas.criar') && can('orcamentos.ver')"
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
            v-if="can('contratos.clausulas.editar')"
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
            to="/agendamentos/loja"
            class="group flex flex-col p-6 rounded-2xl border border-border-ui bg-bg-page hover:border-brand-primary/50 hover:shadow-lg transition-all duration-200"
          >
            <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-brand-primary/10 transition-colors">
              <i class="pi pi-calendar-clock text-xl text-brand-primary"></i>
            </div>
            <h3 class="text-base font-bold text-text-main uppercase tracking-tight mb-1">Agenda</h3>
            <p class="text-xs text-text-soft">Produção, material carregado e montagem</p>
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
              to="/agendamentos/fabrica"
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
import storage from '@/utils/storage'

definePage({ meta: { perm: 'orcamentos.ver' } })

const temAlgumAcesso = computed(() =>
  can('orcamentos.ver') || can('vendas.criar') || can('contratos.ver') || can('contratos.clausulas.editar') || can('agendamentos.ver')
)

const loadingResumoVendedor = ref(false)
const resumoVendedor = ref({
  vendedor: null,
  vendedor_usuario_id: null,
  vendedor_funcionario_id: null,
  fonte_vendedor: 'Usuário autenticado',
  link_referencia: '/vendas/fechamento',
  minhas_vendas_total: 0,
  minhas_vendas_mes: 0,
  minhas_em_producao: 0,
  minhas_finalizadas: 0,
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
  if (ev?.plano_corte_id) return 'Serviço de corte'
  if (ev?.orcamento_id) return 'Orçamento'
  if (ev?.venda_id) return 'Venda'
  return 'Cliente'
}

async function carregarAgenda() {
  if (!can('agendamentos.ver')) return
  loadingAgenda.value = true
  try {
    const user = storage.getUser() || {}
    const funcionarioId = Number(user?.funcionario_id || 0)
    if (!funcionarioId) {
      proximosAgendamentos.value = []
      return
    }
    const res = await AgendaService.buscarPorFuncionario(funcionarioId)
    let data = Array.isArray(res?.data) ? res.data : []
    const agora = new Date()
    data = data.filter((ev) => {
      const inicio = new Date(ev?.inicio_em)
      return !Number.isNaN(inicio.getTime()) && inicio >= agora
    })
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

async function carregarResumoVendedor() {
  if (!can('vendas.criar')) return
  loadingResumoVendedor.value = true
  try {
    const { data } = await api.get('/analytics/dashboard/resumo-vendedor')
    resumoVendedor.value = data ?? resumoVendedor.value
  } catch {
    // silencia; card é complementar
  } finally {
    loadingResumoVendedor.value = false
  }
}

onMounted(() => {
  carregarResumoVendedor()
  carregarAgenda()
})
</script>

