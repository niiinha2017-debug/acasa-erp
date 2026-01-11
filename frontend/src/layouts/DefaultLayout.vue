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
  justify-content: center;
  background-color: var(--bg-page, #f3f4f6); /* fallback */
}

.content-wrapper {
  width: 100%;
  max-width: 1680px;
  padding: clamp(16px, 2vw, 32px);
  box-sizing: border-box;
}
</style>


