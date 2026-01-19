<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Minha Lista</h1>
    
    <div v-if="items.length > 0">
       <pre>{{ items }}</pre> 
    </div>
    <p v-else>Nenhum item encontrado ou carregando...</p>
  </div>
</template>

<script setup>
// Se você tinha uma lógica de carregar dados (fetch), coloque ela aqui
const items = [] // Substitua pela sua variável real de dados
</script>