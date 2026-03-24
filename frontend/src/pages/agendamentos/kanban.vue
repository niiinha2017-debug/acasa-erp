<template>
	<div class="p-4 text-sm text-text-soft">Redirecionando para agenda...</div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
	router.replace('/agenda-geral')
})
</script>

