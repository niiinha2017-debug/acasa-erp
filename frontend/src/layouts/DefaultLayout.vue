<script setup>
import Menu from './Menu.vue' // 👈 Importa o menu (mesma pasta)
import '../assets/CSS/Main.css' // 👈 Garante que o CSS global carregue aqui
</script>

<template>
  <div class="layout-default">
    <Menu />
    
    <main class="page-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
/* Ajuste essencial para o conteúdo não ficar escondido atrás do menu */
.page-content {
  padding-top: 80px; /* Ajuste se o seu menu for mais alto ou mais baixo */
  min-height: 100vh;
  /* Se o Main.css já tiver cor de fundo, pode remover a linha abaixo */
  background-color: #f4f6f8; 
}
</style>