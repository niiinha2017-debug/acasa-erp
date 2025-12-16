<template>
  <div class="login-page">
    <router-view />
  </div>
</template>

<script setup>
</script>


<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-content {
  width: 100%;
  max-width: 440px;
}
</style>