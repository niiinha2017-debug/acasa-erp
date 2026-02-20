<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        title="DRE Mensal"
        subtitle="Demonstração do Resultado do Exercício por mês (receita, despesas e resultado)"
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

      <div class="px-4 md:px-6 pb-6 pt-4 border-t border-border-ui space-y-6">
        <div v-if="loading" class="h-48 flex items-center justify-center text-brand-primary animate-pulse font-mono text-sm">
          Carregando...
        </div>

        <template v-else>
          <div v-if="erro" class="p-4 rounded-xl bg-rose-500/10 text-rose-600 text-sm">{{ erro }}</div>

          <template v-else>
            <!-- Cards: Receita, Despesas, Resultado -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="p-5 rounded-xl border border-border-ui bg-bg-page">
                <p class="text-xs font-bold text-text-muted uppercase">Receita (vendas)</p>
                <p class="text-xl font-black text-emerald-600 mt-1">{{ formatar(dre.receita_total) }}</p>
                <p class="text-[10px] text-text-muted mt-1">{{ nomeMes(dre.mes) }}/{{ dre.ano }}</p>
              </div>
              <div class="p-5 rounded-xl border border-border-ui bg-bg-page">
                <p class="text-xs font-bold text-text-muted uppercase">Despesas</p>
                <p class="text-xl font-black text-amber-600 mt-1">{{ formatar(dre.despesas_total) }}</p>
                <p class="text-[10px] text-text-muted mt-1">{{ nomeMes(dre.mes) }}/{{ dre.ano }}</p>
              </div>
              <div class="p-5 rounded-xl border border-border-ui bg-bg-page">
                <p class="text-xs font-bold text-text-muted uppercase">Resultado</p>
                <p
                  class="text-xl font-black mt-1"
                  :class="dre.resultado >= 0 ? 'text-emerald-600' : 'text-rose-600'"
                >
                  {{ formatar(dre.resultado) }}
                </p>
                <p class="text-[10px] text-text-muted mt-1">{{ nomeMes(dre.mes) }}/{{ dre.ano }}</p>
              </div>
            </div>

            <!-- Despesas por categoria -->
            <div v-if="dre.despesas_por_categoria && dre.despesas_por_categoria.length">
              <h3 class="text-sm font-bold text-text-muted uppercase mb-3">Despesas por categoria</h3>
              <div class="rounded-xl border border-border-ui overflow-hidden">
                <table class="w-full text-sm">
                  <thead class="bg-bg-page border-b border-border-ui">
                    <tr>
                      <th class="text-left py-3 px-4 font-bold text-text-muted">Categoria</th>
                      <th class="text-right py-3 px-4 font-bold text-text-muted">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, i) in dre.despesas_por_categoria"
                      :key="row.categoria"
                      :class="i % 2 === 0 ? 'bg-bg-card' : 'bg-bg-page'"
                      class="border-b border-border-ui last:border-b-0"
                    >
                      <td class="py-3 px-4">{{ row.categoria || 'Sem categoria' }}</td>
                      <td class="py-3 px-4 text-right font-medium">{{ formatar(row.total) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p v-else class="text-sm text-text-muted">Nenhuma despesa no mês.</p>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

definePage({ meta: { perm: 'dashboard.visualizar' } });

const loading = ref(true);
const erro = ref('');
const dre = ref({
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
  receita_total: 0,
  despesas_total: 0,
  despesas_por_categoria: [],
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

import api from '@/services/api';

const buscarDados = async () => {
  loading.value = true;
  erro.value = '';
  try {
    const { data } = await api.get('/analytics/dre-mensal', {
      params: { mes: filtros.mes, ano: filtros.ano },
    });
    if (data.erro) {
      erro.value = data.erro;
      return;
    }
    dre.value = data;
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Falha ao carregar DRE mensal.';
  } finally {
    loading.value = false;
  }
};

onMounted(buscarDados);
</script>
