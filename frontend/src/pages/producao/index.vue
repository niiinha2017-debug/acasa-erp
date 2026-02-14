<template>
  <div class="w-full max-w-[1000px] mx-auto space-y-8 animate-page-in">
    <PageHeader
      title="Produção"
      subtitle="Plano de corte e vendas por metragem"
      icon="pi pi-cogs"
    />

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
import { computed } from 'vue'
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'plano_corte.ver' } })

const temAlgumAcesso = computed(() =>
  can('plano_corte.ver') || can('plano_corte.criar')
)
</script>
