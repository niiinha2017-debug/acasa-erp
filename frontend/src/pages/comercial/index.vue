<template>
  <PageShell :padded="false">
    <section class="comercial-hub ds-page-context animate-page-in">
      <PageHeader
        title="Visão geral – Vendas"
        subtitle="Orçamentos, fechamento de venda e contratos (área comercial)"
        icon="pi pi-briefcase"
      />

      <div class="comercial-hub__body ds-page-context__content space-y-6 pb-6">
        <div
          v-if="can('vendas.criar')"
          class="ds-card ds-card--default"
        >
          <div class="px-4 py-3 border-b border-[var(--ds-color-border)]">
            <span class="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ds-color-text-faint)]">
              Meu progresso em vendas
            </span>
          </div>
          <div class="p-4">
            <div v-if="loadingResumoVendedor" class="py-4 text-sm text-[var(--ds-color-text-soft)]">
              <i class="pi pi-spin pi-spinner mr-2" />
              Carregando progresso...
            </div>
            <div v-else class="space-y-3">
              <div class="text-xs text-[var(--ds-color-text-soft)]">
                <span class="font-semibold text-[var(--ds-color-text)]">
                  Vendedor: {{ resumoVendedor.vendedor || 'Não identificado' }}
                </span>
                <span class="mx-2">•</span>
                <span>Fonte: {{ resumoVendedor.fonte_vendedor || 'Usuário autenticado' }}</span>
                <RouterLink
                  :to="resumoVendedor.link_referencia || '/vendas/fechamento'"
                  class="ml-2 font-semibold text-[var(--ds-color-primary)] hover:underline"
                >
                  Ver referência
                </RouterLink>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="ds-card ds-card--default p-4">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--ds-color-text-faint)] mb-1">Minhas vendas</p>
                  <p class="text-xl font-black text-[var(--ds-color-text)]">{{ resumoVendedor.minhas_vendas_total ?? 0 }}</p>
                </div>
                <div class="ds-card ds-card--default p-4">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--ds-color-text-faint)] mb-1">Fechadas no mês</p>
                  <p class="text-xl font-black text-[var(--ds-color-text)]">{{ resumoVendedor.minhas_vendas_mes ?? 0 }}</p>
                </div>
                <div class="ds-card ds-card--default p-4">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--ds-color-text-faint)] mb-1">Em produção</p>
                  <p class="text-xl font-black text-[var(--ds-color-text)]">{{ resumoVendedor.minhas_em_producao ?? 0 }}</p>
                </div>
                <div class="ds-card ds-card--default p-4">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--ds-color-text-faint)] mb-1">Finalizadas</p>
                  <p class="text-xl font-black text-[var(--ds-color-text)]">{{ resumoVendedor.minhas_finalizadas ?? 0 }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <RouterLink
            v-if="can('orcamentos.ver')"
            to="/orcamentos"
            class="ds-card ds-card--default ds-card--hoverable group flex flex-col p-6 no-underline text-inherit"
          >
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[color-mix(in_srgb,var(--ds-color-primary)_14%,transparent)] text-[var(--ds-color-primary)] group-hover:opacity-90 transition-colors">
              <i class="pi pi-file-edit text-xl"></i>
            </div>
            <h3 class="text-base font-bold text-[var(--ds-color-text)] uppercase tracking-tight mb-1">Orçamento</h3>
            <p class="text-xs text-[var(--ds-color-text-soft)]">Propostas e negociações</p>
          </RouterLink>

          <RouterLink
            v-if="can('vendas.criar') && can('orcamentos.ver')"
            to="/vendas/fechamento"
            class="ds-card ds-card--default ds-card--hoverable group flex flex-col p-6 no-underline text-inherit"
          >
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[color-mix(in_srgb,var(--ds-color-primary)_14%,transparent)] text-[var(--ds-color-primary)] group-hover:opacity-90 transition-colors">
              <i class="pi pi-shopping-cart text-xl"></i>
            </div>
            <h3 class="text-base font-bold text-[var(--ds-color-text)] uppercase tracking-tight mb-1">Fechamento de venda</h3>
            <p class="text-xs text-[var(--ds-color-text-soft)]">Converter orçamento em venda</p>
          </RouterLink>

          <RouterLink
            v-if="can('contratos.ver')"
            to="/contratos"
            class="ds-card ds-card--default ds-card--hoverable group flex flex-col p-6 no-underline text-inherit"
          >
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[color-mix(in_srgb,var(--ds-color-primary)_14%,transparent)] text-[var(--ds-color-primary)] group-hover:opacity-90 transition-colors">
              <i class="pi pi-file text-xl"></i>
            </div>
            <h3 class="text-base font-bold text-[var(--ds-color-text)] uppercase tracking-tight mb-1">Contrato</h3>
            <p class="text-xs text-[var(--ds-color-text-soft)]">Contratos comerciais</p>
          </RouterLink>

          <RouterLink
            v-if="can('contratos.clausulas.editar')"
            to="/contratos/clausulas"
            class="ds-card ds-card--default ds-card--hoverable group flex flex-col p-6 no-underline text-inherit"
          >
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[color-mix(in_srgb,var(--ds-color-primary)_14%,transparent)] text-[var(--ds-color-primary)] group-hover:opacity-90 transition-colors">
              <i class="pi pi-file-edit text-xl"></i>
            </div>
            <h3 class="text-base font-bold text-[var(--ds-color-text)] uppercase tracking-tight mb-1">Cláusulas</h3>
            <p class="text-xs text-[var(--ds-color-text-soft)]">Modelos de orçamento e contrato</p>
          </RouterLink>

          <RouterLink
            v-if="can('agendamentos.ver')"
            to="/agenda-geral"
            class="ds-card ds-card--default ds-card--hoverable group flex flex-col p-6 no-underline text-inherit"
          >
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[color-mix(in_srgb,var(--ds-color-primary)_14%,transparent)] text-[var(--ds-color-primary)] group-hover:opacity-90 transition-colors">
              <i class="pi pi-calendar-clock text-xl"></i>
            </div>
            <h3 class="text-base font-bold text-[var(--ds-color-text)] uppercase tracking-tight mb-1">Agenda</h3>
            <p class="text-xs text-[var(--ds-color-text-soft)]">Produção, material carregado e montagem</p>
          </RouterLink>
        </div>

        <div
          v-if="can('agendamentos.ver')"
          class="ds-card ds-card--default"
        >
          <div class="px-4 py-3 border-b border-[var(--ds-color-border)] flex items-center justify-between">
            <span class="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ds-color-text-faint)]">
              Próximos agendamentos (agenda produção)
            </span>
            <RouterLink
              to="/agenda-geral"
              class="text-xs font-bold text-[var(--ds-color-primary)] hover:underline"
            >
              Ver agenda completa
            </RouterLink>
          </div>
          <div class="p-4">
            <div v-if="loadingAgenda" class="py-6 text-center text-[var(--ds-color-text-soft)] text-sm">
              <i class="pi pi-spin pi-spinner mr-2" />
              Carregando...
            </div>
            <div v-else-if="proximosAgendamentos.length === 0" class="py-6 text-center text-[var(--ds-color-text-soft)] text-sm">
              Nenhum agendamento nos próximos dias.
            </div>
            <ul v-else class="space-y-2">
              <li
                v-for="ev in proximosAgendamentos"
                :key="ev.id"
                class="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 border-b border-[var(--ds-color-border)] last:border-0 text-sm"
              >
                <span class="font-bold text-[var(--ds-color-text)] shrink-0">
                  {{ formatarDataAgenda(ev.inicio_em) }}
                </span>
                <span class="text-[var(--ds-color-text-soft)]">{{ formatarHoraAgenda(ev.inicio_em) }} – {{ formatarHoraAgenda(ev.fim_em) }}</span>
                <span class="font-medium text-[var(--ds-color-text)]">{{ ev.titulo }}</span>
                <span class="text-[var(--ds-color-text-soft)]">
                  — {{ ev.cliente?.nome_completo || ev.cliente?.razao_social || 'Cliente' }}
                  <span class="text-[10px] uppercase">({{ labelOrigemAgenda(ev) }})</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div v-if="!temAlgumAcesso" class="ds-alert ds-alert--warning text-center">
          <p class="text-sm text-[var(--ds-color-text)]">Você não tem permissão para acessar nenhum módulo comercial.</p>
        </div>
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { AgendaService } from '@/services'
import api from '@/services/api'
import { can } from '@/services/permissions'
import storage from '@/utils/storage'
import PageShell from '@/components/ui/PageShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'

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
