<template>
  <div class="w-full max-w-[1000px] mx-auto space-y-8 animate-page-in">
    <PageHeader
      title="Visão geral – Produção"
      subtitle="Pós-venda, plano de corte e vendas por metragem (área produção)"
      icon="pi pi-cogs"
    />

    <!-- Resumo (Produção só vê números da área produção) -->
    <div
      v-if="temAlgumAcesso && podeVerResumo"
      class="grid grid-cols-2 sm:grid-cols-4 gap-4"
    >
      <div class="rounded-xl border border-border-ui bg-bg-card p-4">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Vendas (total)</p>
        <p class="text-xl font-black text-slate-800 dark:text-white">{{ resumo.vendas_total ?? '–' }}</p>
      </div>
      <div class="rounded-xl border border-border-ui bg-bg-card p-4">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Em produção</p>
        <p class="text-xl font-black text-slate-800 dark:text-white">{{ resumo.vendas_em_producao ?? '–' }}</p>
      </div>
      <div class="rounded-xl border border-border-ui bg-bg-card p-4">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Finalizadas</p>
        <p class="text-xl font-black text-slate-800 dark:text-white">{{ resumo.vendas_finalizadas ?? '–' }}</p>
      </div>
      <div class="rounded-xl border border-border-ui bg-bg-card p-4">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Plano de corte</p>
        <p class="text-xl font-black text-slate-800 dark:text-white">{{ resumo.plano_corte_total ?? '–' }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <RouterLink
        v-if="can('vendas.ver')"
        to="/vendas"
        class="group flex flex-col p-6 rounded-2xl border border-border-ui bg-bg-card hover:border-brand-primary/50 hover:shadow-lg transition-all duration-200"
      >
        <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-brand-primary/10 transition-colors">
          <i class="pi pi-cart-plus text-xl text-brand-primary"></i>
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-1">Pós-venda</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">Lista e kanban das vendas</p>
      </RouterLink>

      <RouterLink
        v-if="can('plano_corte.ver')"
        to="/plano-corte"
        class="group flex flex-col p-6 rounded-2xl border border-border-ui bg-bg-card hover:border-brand-primary/50 hover:shadow-lg transition-all duration-200"
      >
        <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-brand-primary/10 transition-colors">
          <i class="pi pi-sitemap text-xl text-brand-primary"></i>
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-1">Plano de corte</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">Planos e acompanhamento</p>
      </RouterLink>

      <RouterLink
        v-if="can('plano_corte.ver')"
        to="/plano-corte/itens"
        class="group flex flex-col p-6 rounded-2xl border border-border-ui bg-bg-card hover:border-brand-primary/50 hover:shadow-lg transition-all duration-200"
      >
        <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-brand-primary/10 transition-colors">
          <i class="pi pi-box text-xl text-brand-primary"></i>
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-1">Produtos plano de corte</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">Cadastro de itens</p>
      </RouterLink>

      <RouterLink
        v-if="can('plano_corte.criar')"
        to="/plano-corte/venda"
        class="group flex flex-col p-6 rounded-2xl border border-border-ui bg-bg-card hover:border-brand-primary/50 hover:shadow-lg transition-all duration-200"
      >
        <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-brand-primary/10 transition-colors">
          <i class="pi pi-ruler text-xl text-brand-primary"></i>
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-1">Venda plano de corte</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">Venda por metragem</p>
      </RouterLink>
    </div>

    <div v-if="!temAlgumAcesso" class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-6 text-center">
      <p class="text-sm text-amber-800 dark:text-amber-200">Você não tem permissão para acessar nenhum módulo de produção.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { can } from '@/services/permissions'
import api from '@/services/api'

definePage({ meta: { perm: 'vendas.ver' } })

const temAlgumAcesso = computed(() =>
  can('vendas.ver') || can('plano_corte.ver') || can('plano_corte.criar')
)

const podeVerResumo = computed(() =>
  can('vendas.ver') || can('plano_corte.ver')
)

const resumo = ref({
  vendas_total: null,
  vendas_em_producao: null,
  vendas_finalizadas: null,
  plano_corte_total: null,
})

async function carregarResumo() {
  if (!podeVerResumo.value) return
  try {
    const { data } = await api.get('/analytics/dashboard/resumo-producao')
    resumo.value = data ?? {}
  } catch {
    // silencia; resumo é opcional
  }
}

onMounted(() => {
  carregarResumo()
})
</script>
