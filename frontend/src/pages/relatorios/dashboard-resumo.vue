<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />
      <PageHeader
        title="Dashboard Resumo"
        subtitle="KPIs: contas a pagar, a receber e clientes ativos"
        icon="pi pi-chart-line"
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
        <div v-if="loading" class="h-48 flex items-center justify-center text-brand-primary animate-pulse text-sm">Carregando...</div>
        <div v-else-if="erro" class="h-48 flex items-center justify-center text-red-600">{{ erro }}</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="p-5 rounded-xl border border-border-ui bg-bg-page">
            <p class="text-xs font-bold text-text-muted uppercase">Total a pagar</p>
            <p class="text-xl font-black text-amber-600 mt-1">{{ formatar(total_a_pagar) }}</p>
          </div>
          <div class="p-5 rounded-xl border border-border-ui bg-bg-page">
            <p class="text-xs font-bold text-text-muted uppercase">Total a receber</p>
            <p class="text-xl font-black text-emerald-600 mt-1">{{ formatar(total_a_receber) }}</p>
          </div>
          <div class="p-5 rounded-xl border border-border-ui bg-bg-page">
            <p class="text-xs font-bold text-text-muted uppercase">Clientes ativos</p>
            <p class="text-xl font-black text-text-main mt-1">{{ resumo.clientes_ativos ?? 0 }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
definePage({ meta: { perm: 'dashboard.visualizar' } });
const loading = ref(true);
const erro = ref('');
const resumo = ref({ total_a_pagar: 0, total_a_receber: 0, clientes_ativos: 0 });
const base = import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:8001';

const total_a_pagar = computed(() => Number(resumo.value?.total_a_pagar ?? 0));
const total_a_receber = computed(() => Number(resumo.value?.total_a_receber ?? 0));

function formatar(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const buscarDados = async () => {
  loading.value = true;
  erro.value = '';
  try {
    const r = await fetch(`${base}/api/analytics/dashboard/resumo`);
    const json = await r.json();
    if (json.erro) { erro.value = json.erro; return; }
    resumo.value = json;
  } catch (e) {
    erro.value = 'Falha ao conectar no servidor (porta 8001).';
  } finally {
    loading.value = false;
  }
};
onMounted(buscarDados);
</script>
