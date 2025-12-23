<script setup>
// 👇 Importando o seu CSS de Login
import '../assets/CSS/Login.css'
</script>

<template>
  <div class="auth-layout">
    <div class="auth-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Se o seu Login.css já tiver as classes de container (.auth-layout, etc),
  você nem precisa desse style aqui embaixo. 
  Mas vou deixar um básico de segurança para centralizar tudo caso o CSS falhe.
*/
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>