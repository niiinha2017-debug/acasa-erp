<template>
  <div class="h-48 flex items-center justify-center text-text-soft text-sm">
    Redirecionando para Status de Projetos...
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

definePage({ meta: { perm: 'dashboard.visualizar' } });

const router = useRouter();

onMounted(() => {
  router.replace('/relatorios/status-projetos');
});
</script>
