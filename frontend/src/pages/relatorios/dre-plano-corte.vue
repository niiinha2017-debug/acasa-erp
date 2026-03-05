<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="DRE do plano de corte"
        subtitle="Receita (venda) do plano de corte. Custo hora de produção e despesas do período rateados pela participação na receita total. Sem custo de compra."
        icon="pi pi-calculator"
      >
        <template #actions>
          <RouterLink to="/relatorios" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border-ui text-sm font-medium text-text-muted hover:bg-bg-page">
            <i class="pi pi-arrow-left"></i>
            Voltar
          </RouterLink>
          <div class="flex items-center gap-2">
            <select
              v-model="filtros.mes"
              class="h-9 rounded-lg border border-border-ui bg-bg-page px-3 text-sm"
            >
              <option v-for="m in 12" :key="m" :value="m">{{ nomeMes(m) }}</option>
            </select>
            <input
              v-model.number="filtros.ano"
              type="number"
              min="2020"
              max="2030"
              class="h-9 w-24 rounded-lg border border-border-ui bg-bg-page px-3 text-sm"
            />
            <Button variant="outline" size="sm" @click="buscarDados">
              <i class="pi pi-refresh mr-2"></i>
              Atualizar
            </Button>
          </div>
        </template>
      </PageHeader>

      <div class="px-4 md:px-6 pb-6 pt-4 border-t border-border-ui">
        <div v-if="loading" class="h-48 flex items-center justify-center text-brand-primary animate-pulse font-mono text-sm">
          Carregando...
        </div>

        <template v-else>
          <div v-if="erro" class="p-4 rounded-xl bg-rose-500/10 text-rose-600 text-sm">{{ erro }}</div>

          <div v-else class="rounded-xl border border-border-ui overflow-hidden">
            <table class="w-full text-sm">
              <tbody class="divide-y divide-border-ui">
                <tr class="bg-bg-card">
                  <td class="py-2.5 px-4 font-semibold text-text-main">Receita (venda plano de corte)</td>
                  <td class="py-2.5 px-4 text-right font-semibold text-emerald-600">{{ formatar(dre.receita) }}</td>
                </tr>
                <tr class="bg-bg-card">
                  <td class="py-2 px-4 pl-6 text-text-muted">(–) Custo hora de produção (rateado)</td>
                  <td class="py-2 px-4 text-right font-medium text-amber-600">{{ formatar(dre.custo_hora_producao_rateado) }}</td>
                </tr>
                <tr class="bg-bg-card">
                  <td class="py-2 px-4 pl-6 text-text-muted">(–) Despesas do período (rateado)</td>
                  <td class="py-2 px-4 text-right font-medium text-amber-600">{{ formatar(dre.despesas_total_rateado) }}</td>
                </tr>
                <tr class="bg-bg-card border-t-2 border-border-ui">
                  <td class="py-3 px-4 font-bold text-text-main">Resultado</td>
                  <td
                    class="py-3 px-4 text-right font-bold"
                    :class="dre.resultado >= 0 ? 'text-emerald-600' : 'text-rose-600'"
                  >
                    {{ formatar(dre.resultado) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '@/services/api';

definePage({ meta: { perm: 'dashboard.visualizar' } });

const loading = ref(true);
const erro = ref('');
const dre = ref({
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
  receita: 0,
  custo_hora_producao_rateado: 0,
  despesas_total_rateado: 0,
  resultado: 0,
});

const filtros = reactive({
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
});

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function nomeMes(m) {
  return MESES[Number(m) - 1] || '';
}

function formatar(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
}

const buscarDados = async () => {
  loading.value = true;
  erro.value = '';
  try {
    const { data } = await api.get('/analytics/dre-plano-corte', {
      params: { mes: filtros.mes, ano: filtros.ano },
    });
    if (data.erro) {
      erro.value = data.erro;
    } else {
      dre.value = data;
    }
  } catch (e) {
    const status = e?.response?.status;
    const body = e?.response?.data;
    const raw = typeof body === 'string' ? body : (body?.message || '');
    if (status === 404 || (typeof raw === 'string' && raw.includes('Cannot GET'))) {
      erro.value = 'Rota do relatório não encontrada. Reinicie o servidor do backend (npm run start) e tente novamente.';
    } else {
      erro.value = raw || e?.message || 'Falha ao carregar DRE do plano de corte.';
    }
  } finally {
    loading.value = false;
  }
};

onMounted(buscarDados);
</script>
