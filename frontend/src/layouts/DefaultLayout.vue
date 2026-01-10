<script setup>
// Certifique-se que o arquivo se chama Menu.vue (M maiúsculo)
// e está dentro da pasta src/layouts/
import Menu from './Menu.vue' 
</script>

<template>
  <div class="layout-default">
    <Menu /> 
    <main class="page-content">
      <div class="content-wrapper">
        <slot /> 
      </div>
    </main>
  </div>
</template>

<style scoped>
.layout-default {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.page-content {
  flex: 1;
  display: flex;
  justify-content: center; /* Centraliza o wrapper em telas gigantes */
  background-color: var(--bg-page); /* Usa sua variável do ui.css */
}

.content-wrapper {
  width: 100%;
  max-width: 1440px;      /* Largura confortável para ERPs */
  padding: 32px;          /* O respiro lateral que faltava nas fotos */
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 16px;        /* Reduz o espaço em telas pequenas */
  }
}
</style>