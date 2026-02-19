<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />
      <PageHeader
        title="Status de Obras"
        subtitle="Quantidade de obras por status"
        icon="pi pi-sitemap"
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
        <div v-else class="flex flex-wrap gap-4">
          <div v-for="item in dados" :key="item.status" class="px-6 py-4 rounded-xl border border-border-ui bg-bg-page min-w-[140px]">
            <p class="text-xs font-bold text-text-muted uppercase">{{ item.status || 'N/A' }}</p>
            <p class="text-2xl font-black text-text-main mt-1">{{ item.total }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
definePage({ meta: { perm: 'dashboard.visualizar' } });
import api from '@/services/api';

const loading = ref(true);
const erro = ref('');
const dados = ref([]);

const buscarDados = async () => {
  loading.value = true;
  erro.value = '';
  try {
    const { data } = await api.get('/analytics/status-obras');
    if (data?.erro) { erro.value = data.erro; dados.value = []; return; }
    dados.value = Array.isArray(data) ? data : [];
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Falha ao carregar status.';
    dados.value = [];
  } finally {
    loading.value = false;
  }
};
onMounted(buscarDados);
</script>
