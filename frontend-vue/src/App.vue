<script setup>
import { ref, computed } from 'vue';
import Login from './views/Login.vue';
import Dashboard from './views/Dashboard.vue';
import { AppConfig } from './config';

// Verifica se tem token salvo
const token = localStorage.getItem(AppConfig.STORAGE_KEYS.TOKEN);
const usuarioLogado = ref(!!token); // true se tiver token, false se não

// Função simples para atualizar a tela quando logar
const aoLogar = () => {
  usuarioLogado.value = true;
};
</script>

<template>
  <Dashboard v-if="usuarioLogado" />
  <Login v-else @login-sucesso="aoLogar" />
</template>