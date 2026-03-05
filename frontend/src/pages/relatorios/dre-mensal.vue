<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />

      <PageHeader
        :title="abaAtiva === 'cliente' ? 'DRE por cliente e ambiente' : 'DRE Mensal'"
        :subtitle="abaAtiva === 'cliente' ? 'Cada linha = uma produção (venda) do mês, por ambiente. Despesas do período rateadas pela receita.' : 'Relatório do mês: receita (loja + plano de corte), custos e despesas'"
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

          <template v-else>
            <!-- DRE mensal (resumo do período) - exibido quando acessado pelo menu DRE Mensal -->
            <div v-show="abaAtiva === 'resumo'" class="space-y-6">
            <!-- Relatório do mês (sem cards) -->
            <div class="rounded-xl border border-border-ui overflow-hidden">
              <table class="w-full text-sm">
                <tbody class="divide-y divide-border-ui">
                  <!-- Receita -->
                  <tr class="bg-bg-card">
                    <td class="py-2.5 px-4 font-semibold text-text-main">Receita</td>
                    <td class="py-2.5 px-4 text-right"></td>
                  </tr>
                  <tr class="bg-bg-page">
                    <td class="py-2 px-4 pl-6 text-text-muted">Venda loja</td>
                    <td class="py-2 px-4 text-right font-medium text-emerald-600">{{ formatar(dre.receita_venda_loja) }}</td>
                  </tr>
                  <tr class="bg-bg-page">
                    <td class="py-2 px-4 pl-6 text-text-muted">Venda plano de corte</td>
                    <td class="py-2 px-4 text-right font-medium text-emerald-600">{{ formatar(dre.receita_venda_plano_corte) }}</td>
                  </tr>
                  <tr class="bg-bg-page border-b border-border-ui">
                    <td class="py-2.5 px-4 pl-6 font-semibold text-text-main">Total receita</td>
                    <td class="py-2.5 px-4 text-right font-semibold text-emerald-600">{{ formatar(dre.receita_total) }}</td>
                  </tr>
                  <!-- Deduções -->
                  <tr class="bg-bg-card">
                    <td class="py-2 px-4 pl-6 text-text-muted">(–) Custo da compra</td>
                    <td class="py-2 px-4 text-right font-medium text-amber-600">{{ formatar(dre.custo_compra) }}</td>
                  </tr>
                  <tr class="bg-bg-card">
                    <td class="py-2 px-4 pl-6 text-text-muted">(–) Custo hora de produção</td>
                    <td class="py-2 px-4 text-right font-medium text-amber-600">{{ formatar(dre.custo_hora_producao) }}</td>
                  </tr>
                  <tr class="bg-bg-card">
                    <td class="py-2 px-4 pl-6 text-text-muted">(–) Despesas do período</td>
                    <td class="py-2 px-4 text-right font-medium text-amber-600">{{ formatar(dre.despesas_total) }}</td>
                  </tr>
                  <!-- Resultado -->
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

            <!-- Despesas por categoria (detalhe) -->
            <div v-if="dre.despesas_por_categoria && dre.despesas_por_categoria.length" class="mt-4">
              <h3 class="text-xs font-bold text-text-muted uppercase mb-2">Despesas do período por categoria</h3>
              <div class="rounded-xl border border-border-ui overflow-hidden">
                <table class="w-full text-sm">
                  <thead class="bg-bg-page border-b border-border-ui">
                    <tr>
                      <th class="text-left py-2 px-4 font-bold text-text-muted">Categoria</th>
                      <th class="text-right py-2 px-4 font-bold text-text-muted">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, i) in dre.despesas_por_categoria"
                      :key="row.categoria"
                      :class="i % 2 === 0 ? 'bg-bg-card' : 'bg-bg-page'"
                      class="border-b border-border-ui last:border-b-0"
                    >
                      <td class="py-2 px-4">{{ row.categoria || 'Sem categoria' }}</td>
                      <td class="py-2 px-4 text-right font-medium">{{ formatar(row.total) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            </div>

            <!-- DRE por cliente e ambiente - exibido quando acessado pelo menu DRE de cliente -->
            <div v-show="abaAtiva === 'cliente'" class="space-y-4">
              <div class="flex flex-wrap items-center gap-3">
                <label class="text-sm font-medium text-text-muted">Buscar cliente</label>
                <input
                  v-model="buscaCliente"
                  type="text"
                  placeholder="Digite o nome do cliente..."
                  class="flex-1 min-w-[200px] h-10 rounded-lg border border-border-ui bg-bg-page px-3 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
                <span v-if="buscaCliente" class="text-xs text-text-muted">
                  {{ linhasFiltradasCliente.length }} linha(s)
                </span>
              </div>

              <div v-if="loadingClienteAmbiente" class="py-8 text-center text-text-muted text-sm">Carregando...</div>
              <div v-else-if="dreClienteAmbiente?.erro" class="p-4 rounded-xl bg-rose-500/10 text-rose-600 text-sm">{{ dreClienteAmbiente.erro }}</div>
              <div v-else class="rounded-xl border border-border-ui overflow-hidden overflow-x-auto">
                <table class="w-full text-sm min-w-[640px]">
                  <thead class="bg-bg-page border-b border-border-ui">
                    <tr>
                      <th class="text-left py-2.5 px-3 font-bold text-text-muted">Cliente</th>
                      <th class="text-left py-2.5 px-3 font-bold text-text-muted">Data</th>
                      <th class="text-left py-2.5 px-3 font-bold text-text-muted">Ambiente</th>
                      <th class="text-right py-2.5 px-3 font-bold text-text-muted">Receita</th>
                      <th class="text-right py-2.5 px-3 font-bold text-text-muted">Custo compra</th>
                      <th class="text-right py-2.5 px-3 font-bold text-text-muted">Custo prod.</th>
                      <th class="text-right py-2.5 px-3 font-bold text-text-muted">Desp. período (rateio)</th>
                      <th class="text-right py-2.5 px-3 font-bold text-text-muted">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, i) in linhasFiltradasCliente"
                      :key="`${row.venda_id}-${row.nome_ambiente}`"
                      :class="i % 2 === 0 ? 'bg-bg-card' : 'bg-bg-page'"
                      class="border-b border-border-ui"
                    >
                      <td class="py-2 px-3">{{ row.cliente_nome }}</td>
                      <td class="py-2 px-3 text-text-muted">{{ row.data_venda }}</td>
                      <td class="py-2 px-3">{{ row.nome_ambiente }}</td>
                      <td class="py-2 px-3 text-right font-medium text-emerald-600">{{ formatar(row.receita) }}</td>
                      <td class="py-2 px-3 text-right text-amber-600">{{ formatar(row.custo_compra) }}</td>
                      <td class="py-2 px-3 text-right text-amber-600">{{ formatar(row.custo_hora_producao) }}</td>
                      <td class="py-2 px-3 text-right text-amber-600">{{ formatar(row.despesas_periodo_rateado ?? 0) }}</td>
                      <td class="py-2 px-3 text-right font-medium" :class="row.resultado >= 0 ? 'text-emerald-600' : 'text-rose-600'">{{ formatar(row.resultado) }}</td>
                    </tr>
                    <tr v-if="dreClienteAmbiente?.linhas?.length && dreClienteAmbiente?.despesas_periodo !== undefined" class="bg-bg-page border-t-2 border-border-ui">
                      <td colspan="6" class="py-2.5 px-3 text-text-muted text-right">Total despesas do período (rateio)</td>
                      <td class="py-2.5 px-3 text-right font-medium text-amber-600">{{ formatar(dreClienteAmbiente?.despesas_periodo) }}</td>
                      <td class="py-2.5 px-3"></td>
                    </tr>
                  </tbody>
                </table>
                <p v-if="!dreClienteAmbiente?.linhas?.length" class="py-6 text-center text-sm text-text-muted">Nenhuma venda no mês. Atualize os dados ou escolha outro período.</p>
                <p v-else-if="buscaCliente && !linhasFiltradasCliente.length" class="py-6 text-center text-sm text-text-muted">Nenhum cliente encontrado para &quot;{{ buscaCliente }}&quot;.</p>
              </div>
              <!-- Resumo do(s) cliente(s) filtrado(s) -->
              <div v-if="buscaCliente && linhasFiltradasCliente.length" class="rounded-xl border border-border-ui p-4 bg-bg-page">
                <h4 class="text-xs font-bold text-text-muted uppercase mb-2">Resumo do(s) cliente(s) encontrado(s)</h4>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                  <div>
                    <span class="text-text-muted">Receita</span>
                    <p class="font-semibold text-emerald-600">{{ formatar(totaisClienteFiltrado.receita) }}</p>
                  </div>
                  <div>
                    <span class="text-text-muted">Custo compra</span>
                    <p class="font-semibold text-amber-600">{{ formatar(totaisClienteFiltrado.custo_compra) }}</p>
                  </div>
                  <div>
                    <span class="text-text-muted">Custo prod.</span>
                    <p class="font-semibold text-amber-600">{{ formatar(totaisClienteFiltrado.custo_hora_producao) }}</p>
                  </div>
                  <div>
                    <span class="text-text-muted">Desp. período (rateio)</span>
                    <p class="font-semibold text-amber-600">{{ formatar(totaisClienteFiltrado.despesas_periodo_rateado) }}</p>
                  </div>
                  <div>
                    <span class="text-text-muted">Resultado</span>
                    <p class="font-semibold" :class="totaisClienteFiltrado.resultado >= 0 ? 'text-emerald-600' : 'text-rose-600'">{{ formatar(totaisClienteFiltrado.resultado) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

definePage({ meta: { perm: 'dashboard.visualizar' } });

const route = useRoute();
const abaAtiva = ref(route.query?.aba === 'cliente' ? 'cliente' : 'resumo');
const buscaCliente = ref('');

const loading = ref(true);
const loadingClienteAmbiente = ref(false);
const erro = ref('');
const dre = ref({
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
  receita_venda_loja: 0,
  receita_venda_plano_corte: 0,
  receita_total: 0,
  custo_compra: 0,
  custo_hora_producao: 0,
  despesas_total: 0,
  despesas_por_categoria: [],
  resultado: 0,
});

const dreClienteAmbiente = ref({
  linhas: [],
  despesas_periodo: 0,
  erro: '',
});

const filtros = reactive({
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
});

const linhasFiltradasCliente = computed(() => {
  const linhas = dreClienteAmbiente.value.linhas || [];
  const termo = (buscaCliente.value || '').trim().toLowerCase();
  if (!termo) return linhas;
  return linhas.filter((row) => (row.cliente_nome || '').toLowerCase().includes(termo));
});

const totaisClienteFiltrado = computed(() => {
  const linhas = linhasFiltradasCliente.value;
  let receita = 0;
  let custo_compra = 0;
  let custo_hora_producao = 0;
  let despesas_periodo_rateado = 0;
  for (const r of linhas) {
    receita += Number(r.receita ?? 0);
    custo_compra += Number(r.custo_compra ?? 0);
    custo_hora_producao += Number(r.custo_hora_producao ?? 0);
    despesas_periodo_rateado += Number(r.despesas_periodo_rateado ?? 0);
  }
  const resultado = receita - custo_compra - custo_hora_producao - despesas_periodo_rateado;
  return {
    receita: Math.round(receita * 100) / 100,
    custo_compra: Math.round(custo_compra * 100) / 100,
    custo_hora_producao: Math.round(custo_hora_producao * 100) / 100,
    despesas_periodo_rateado: Math.round(despesas_periodo_rateado * 100) / 100,
    resultado: Math.round(resultado * 100) / 100,
  };
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
  loadingClienteAmbiente.value = true;
  erro.value = '';
  dreClienteAmbiente.value = { linhas: [], despesas_periodo: 0, erro: '' };
  try {
    const resDre = await api.get('/analytics/dre-mensal', { params: { mes: filtros.mes, ano: filtros.ano } });
    const data = resDre.data;
    if (data.erro) {
      erro.value = data.erro;
    } else {
      dre.value = {
        mes: data.mes ?? filtros.mes,
        ano: data.ano ?? filtros.ano,
        receita_venda_loja: data.receita_venda_loja ?? 0,
        receita_venda_plano_corte: data.receita_venda_plano_corte ?? 0,
        receita_total: data.receita_total ?? 0,
        custo_compra: data.custo_compra ?? 0,
        custo_hora_producao: data.custo_hora_producao ?? 0,
        despesas_total: data.despesas_total ?? 0,
        despesas_por_categoria: data.despesas_por_categoria ?? [],
        resultado: data.resultado ?? 0,
      };
    }
  } catch (e) {
    const body = e?.response?.data;
    const raw = typeof body === 'string' ? body : (body?.message || '');
    if (typeof raw === 'string' && raw.includes('Cannot GET')) {
      erro.value = 'Rota do relatório não encontrada no servidor. Verifique se o backend está atualizado e em execução.';
    } else {
      erro.value = raw || e?.message || 'Falha ao carregar DRE mensal.';
    }
  } finally {
    loading.value = false;
  }

  try {
    const resCA = await api.get('/analytics/dre-periodo-cliente-ambiente', { params: { mes: filtros.mes, ano: filtros.ano } });
    const dataCA = resCA.data;
    if (dataCA.erro) {
      dreClienteAmbiente.value = { linhas: [], despesas_periodo: 0, erro: dataCA.erro };
    } else {
      dreClienteAmbiente.value = { linhas: dataCA.linhas || [], despesas_periodo: dataCA.despesas_periodo ?? 0, erro: '' };
    }
  } catch (e) {
    const body = e?.response?.data;
    const msg = typeof body === 'string' && body.includes('Cannot GET')
      ? 'Recurso "DRE por cliente e ambiente" não disponível neste servidor. Atualize o backend ou use a aba DRE mensal.'
      : (body?.message || (typeof body === 'string' ? body : null) || e?.message || 'Falha ao carregar DRE por cliente/ambiente.');
    dreClienteAmbiente.value = { linhas: [], despesas_periodo: 0, erro: msg };
  } finally {
    loadingClienteAmbiente.value = false;
  }
};

onMounted(buscarDados);

watch(() => route.query?.aba, (aba) => {
  if (aba === 'cliente') abaAtiva.value = 'cliente';
  else if (aba !== undefined) abaAtiva.value = 'resumo';
}, { immediate: false });
</script>
