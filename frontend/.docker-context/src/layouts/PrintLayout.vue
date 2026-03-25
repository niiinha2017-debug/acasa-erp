<template>
  <div class="bg-white min-h-screen p-0">
    <slot />
  </div>
</template>

<style scoped>
@media print {
  /* Esconde qualquer coisa que tenha sobrado e que não deva sair no papel */
  .no-print { display: none !important; }
}
</style>