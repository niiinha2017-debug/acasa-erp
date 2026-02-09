<template>
  <div class="p-6">
    <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-bold text-white">Projeção de Fluxo de Caixa</h2>
          <p class="text-sm text-slate-400">Considerando carência de 60 dias para materiais</p>
        </div>
        <button @click="buscarDados" class="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
          <span class="text-emerald-400">🔄 Atualizar</span>
        </button>
      </div>

      <div v-if="loading" class="h-80 flex items-center justify-center text-emerald-500 animate-pulse font-mono">
        CONECTANDO AO PYTHON...
      </div>

      <div v-else class="h-80">
        <apexchart
          type="area"
          height="100%"
          :options="chartOptions"
          :series="series"
        ></apexchart>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

definePage({ meta: { perm: 'dashboard.visualizar' } })

const loading = ref(true);
const series = ref([{ name: 'Saldo Projetado', data: [] }]);

const chartOptions = {
  chart: { type: 'area', toolbar: { show: false }, background: 'transparent' },
  colors: ['#10b981'],
  stroke: { curve: 'smooth', width: 3 },
  xaxis: { type: 'datetime', labels: { style: { colors: '#94a3b8' } } },
  yaxis: { labels: { style: { colors: '#94a3b8' }, formatter: (v) => `R$ ${v.toFixed(0)}` } },
  grid: { borderColor: '#334155' },
  dataLabels: { enabled: false },
  tooltip: { theme: 'dark' }
};

const buscarDados = async () => {
  loading.value = true;
  try {
    const response = await fetch('http://localhost:8000/api/analytics/fluxo-caixa');
    const data = await response.json();
    series.value[0].data = data.map(i => ({ x: i.Data, y: i.Saldo_Caixa }));
  } catch (e) {
    console.error("Erro:", e);
  } finally {
    loading.value = false;
  }
};

onMounted(buscarDados);
</script>