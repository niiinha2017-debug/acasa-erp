<template>
  <div class="w-full min-h-[200px] flex items-center justify-center">
    <p class="text-slate-500 dark:text-slate-400 text-sm">Redirecionando...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePage({ meta: { perm: 'contratos.ver' } })

onMounted(() => {
  useRouter().replace('/contratos')
})
</script>

