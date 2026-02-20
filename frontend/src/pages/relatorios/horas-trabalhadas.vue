<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-emerald-500 rounded-t-2xl" />

      <PageHeader
        title="Horas Trabalhadas"
        subtitle="Horas por funcionário no período (fechamento folha)"
        icon="pi pi-clock"
      >
        <template #actions>
          <RouterLink to="/relatorios" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border-ui text-sm font-medium text-text-muted hover:bg-bg-page">
            <i class="pi pi-arrow-left"></i>
            Voltar
          </RouterLink>
          <div class="flex items-center gap-2">
            <input
              v-model="filtros.data_ini"
              type="date"
              class="h-9 rounded-lg border border-border-ui bg-bg-page px-3 text-sm"
            />
            <span class="text-text-muted">até</span>
            <input
              v-model="filtros.data_fim"
              type="date"
              class="h-9 rounded-lg border border-border-ui bg-bg-page px-3 text-sm"
            />
            <Button variant="outline" size="sm" @click="buscarDados">
              <i class="pi pi-refresh mr-2"></i>
              Atualizar
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-6 pt-4 border-t border-border-ui">
        <div v-if="loading" class="min-h-[28rem] flex items-center justify-center text-brand-primary animate-pulse font-mono text-sm">
          Carregando dados...
        </div>

        <div v-else-if="!(linhas && linhas.length)" class="min-h-[28rem] flex items-center justify-center text-text-muted text-center px-4">
          Nenhum dado no período. Ajuste as datas e clique em Atualizar.
        </div>

        <div v-else class="space-y-4">
          <div class="min-h-[28rem] h-96 md:h-[32rem]">
            <apexchart
              v-if="linhas && linhas.length"
              type="bar"
              height="100%"
              :options="chartOptions"
              :series="series"
            />
          </div>
          <div v-if="chartImageUrl" class="flex items-center gap-2 text-xs text-text-muted">
            <span>Link do gráfico (QuickChart – use em e-mail/PDF/n8n):</span>
            <a :href="chartImageUrl" target="_blank" rel="noopener" class="text-brand-primary truncate max-w-[280px]">{{ chartImageUrl }}</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

definePage({ meta: { perm: 'dashboard.visualizar' } })

const loading = ref(true);
const linhas = ref([]);
const chartImageUrl = ref('');

const filtros = ref({
  data_ini: '',
  data_fim: '',
});

const series = computed(() => [
  { name: 'Horas trabalhadas', data: (linhas.value || []).map((l) => l.horas_trabalhadas) },
]);

const chartOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
  colors: ['#10b981'],
  plotOptions: {
    bar: { horizontal: false, borderRadius: 4 },
  },
  xaxis: {
    type: 'category',
    categories: (linhas.value || []).map((l) => (l.nome?.length > 18 ? l.nome.slice(0, 16) + '…' : l.nome)),
    labels: { style: { colors: '#94a3b8' }, rotate: -45 },
  },
  yaxis: {
    labels: {
      style: { colors: '#94a3b8' },
      formatter: (v) => `${Number(v).toFixed(1)}h`,
    },
  },
  grid: { borderColor: '#334155' },
  dataLabels: { enabled: false },
  tooltip: {
    theme: 'dark',
    y: { formatter: (v) => `${Number(v).toFixed(2)} horas` },
  },
}));

import api from '@/services/api';

const buscarDados = async () => {
  const di = filtros.value.data_ini;
  const df = filtros.value.data_fim;
  if (!di || !df) {
    linhas.value = [];
    chartImageUrl.value = '';
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const { data } = await api.get('/ponto/relatorio/fechamento', {
      params: { data_ini: di, data_fim: df, apenas_ativos: true },
    });
    linhas.value = data?.linhas ?? [];
    const chartRes = await api.get('/analytics/chart-url', {
      params: { type: 'horas-trabalhadas', data_ini: di, data_fim: df, width: 900, height: 450 },
    });
    chartImageUrl.value = chartRes?.data?.url ?? '';
  } catch (e) {
    console.error('Erro ao carregar horas trabalhadas:', e);
    linhas.value = [];
    chartImageUrl.value = '';
  } finally {
    loading.value = false;
  }
};

function setDefaultPeriod() {
  const hoje = new Date();
  const primeiro = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  filtros.value.data_ini = primeiro.toISOString().slice(0, 10);
  filtros.value.data_fim = ultimo.toISOString().slice(0, 10);
}

onMounted(() => {
  setDefaultPeriod();
  buscarDados();
});
</script>
