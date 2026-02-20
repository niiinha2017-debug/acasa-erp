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
import { can } from '@/services/permissions'
import api from '@/services/api'

definePage({ meta: { perm: 'orcamentos.ver' } })

const temAlgumAcesso = computed(() =>
  can('orcamentos.ver') || can('vendas.criar') || can('contratos.ver') || can('orcamentos.editar')
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
})
</script>
