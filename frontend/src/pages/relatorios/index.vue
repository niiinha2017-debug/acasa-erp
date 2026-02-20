<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Relatórios"
        subtitle="Dashboard, DRE e relatórios"
        icon="pi pi-chart-bar"
        :show-back="false"
      />

      <div class="px-4 md:px-6 pb-6 pt-4 border-t border-border-ui">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="rel in relatorios"
            :key="rel.to"
            type="button"
            class="w-full text-left block p-5 rounded-xl border border-border-ui bg-bg-page hover:border-brand-primary/50 hover:bg-slate-50 transition-colors cursor-pointer"
            @click="irPara(rel.to)"
          >
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-brand-primary/10 text-brand-primary">
                <i :class="rel.icon" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="font-bold text-text-main uppercase tracking-tight">{{ rel.label }}</h3>
                <p class="text-xs text-text-muted mt-1">{{ rel.desc }}</p>
              </div>
              <i class="pi pi-chevron-right text-text-muted text-sm" />
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

definePage({ meta: { perm: 'dashboard.visualizar' } })

const router = useRouter()

function irPara(to) {
  router.push(to)
}

const relatorios = [
  {
    label: 'DRE Mensal',
    desc: 'Receita, despesas e resultado do mês (competência)',
    to: '/relatorios/dre-mensal',
    icon: 'pi pi-calculator',
  },
  {
    label: 'Despesas por Categoria',
    desc: 'Distribuição das despesas (SAÍDA) por categoria',
    to: '/relatorios/despesas-categoria',
    icon: 'pi pi-wallet',
  },
  {
    label: 'Horas Trabalhadas',
    desc: 'Horas por funcionário no período (fechamento folha)',
    to: '/relatorios/horas-trabalhadas',
    icon: 'pi pi-clock',
  },
  {
    label: 'Feriados Nacionais',
    desc: 'Calendário de feriados do Brasil (Brasil API)',
    to: '/relatorios/feriados',
    icon: 'pi pi-calendar',
  },
  {
    label: 'Status de Obras',
    desc: 'Quantidade de obras por status (Medição, Corte, Montagem)',
    to: '/relatorios/status-obras',
    icon: 'pi pi-sitemap',
  },
  {
    label: 'Dashboard Resumo',
    desc: 'KPIs: total a pagar, a receber e clientes ativos',
    to: '/relatorios/dashboard-resumo',
    icon: 'pi pi-chart-line',
  },
]
</script>
