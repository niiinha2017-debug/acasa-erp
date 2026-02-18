<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="Despesas por Categoria"
        subtitle="Distribuição das despesas (SAÍDA) por categoria"
        icon="pi pi-wallet"
      >
        <template #actions>
          <NuxtLink to="/relatorios" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border-ui text-sm font-medium text-text-muted hover:bg-bg-page">
            <i class="pi pi-arrow-left"></i>
            Voltar
          </NuxtLink>
          <Button variant="outline" size="sm" @click="buscarDados">
            <i class="pi pi-refresh mr-2"></i>
            Atualizar
          </Button>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-6 pt-4 border-t border-border-ui">
        <div v-if="loading" class="h-80 flex items-center justify-center text-brand-primary animate-pulse font-mono text-sm">
          Carregando dados...
        </div>

        <div v-else-if="!(listaCategorias && listaCategorias.length)" class="h-80 flex items-center justify-center text-text-muted text-center px-4">
          Nenhuma despesa (SAÍDA) no período. Verifique se o servidor Python está em <code class="text-slate-600 bg-slate-100 px-1 rounded">localhost:8001</code>.
        </div>

        <div v-else class="h-80">
          <apexchart
            v-if="listaCategorias && listaCategorias.length"
            type="bar"
            height="100%"
            :options="chartOptions"
            :series="series"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

definePage({ meta: { perm: 'dashboard.visualizar' } })

const loading = ref(true);
const categorias = ref([]);
const series = ref([{ name: 'Total de Despesas', data: [] }]);

const listaCategorias = computed(() => {
  const c = categorias.value;
  return Array.isArray(c) ? c : [];
});

const chartOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
  colors: ['#f97316'],
  plotOptions: {
    bar: { horizontal: false, borderRadius: 4 },
  },
  xaxis: {
    type: 'category',
    categories: listaCategorias.value || [],
    labels: { style: { colors: '#94a3b8' } },
  },
  yaxis: {
    labels: {
      style: { colors: '#94a3b8' },
      formatter: (v) => `R$ ${Number(v).toFixed(0)}`,
    },
  },
  grid: { borderColor: '#334155' },
  dataLabels: { enabled: false },
  tooltip: {
    theme: 'dark',
    y: { formatter: (v) => `R$ ${Number(v).toFixed(2)}` },
  },
}));

const analyticsBase = import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:8001';

const buscarDados = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${analyticsBase}/api/analytics/dre-despesas`);
    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error('Resposta da API não é lista:', data?.erro || data);
      categorias.value = [];
      series.value = [{ name: 'Total de Despesas', data: [] }];
      return;
    }

    const porCategoria = {};
    data.forEach((item) => {
      const cat = (item.categoria || 'SEM CATEGORIA').toString().toUpperCase();
      const valor = Number(item.total || 0);
      porCategoria[cat] = (porCategoria[cat] || 0) + valor;
    });

    const cats = Object.keys(porCategoria).sort();
    categorias.value = cats;
    series.value = [{ name: 'Total de Despesas', data: cats.map((c) => porCategoria[c]) }];
  } catch (e) {
    console.error('Erro ao carregar DRE:', e);
    categorias.value = [];
    series.value = [{ name: 'Total de Despesas', data: [] }];
  } finally {
    loading.value = false;
  }
};

onMounted(buscarDados);
</script>
