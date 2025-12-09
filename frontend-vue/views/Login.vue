<script setup>
import { ref } from 'vue';
import api from '../services/api'; // Sua API configurada

const email = ref('admin@acasa.com');
const senha = ref('123456'); // Variável local do input
const carregando = ref(false);

const fazerLogin = async () => {
  carregando.value = true;

  try {
    console.log("Enviando dados:", { email: email.value, senha: senha.value });

    // AQUI ESTÁ O SEGREDO: Enviamos 'senha' (português) para o backend entender
    const response = await api.post('/auth/login', { 
      email: email.value, 
      senha: senha.value  // <--- Antes estava 'password', agora está 'senha'
    });

    // Se chegou aqui, funcionou!
    console.log("Resposta do servidor:", response);
    
    // O axios devolve os dados dentro de .data
    const token = response.data.token;
    const usuario = response.data.user;

    // Salva no navegador
    localStorage.setItem('acasa_token', token);
    localStorage.setItem('acasa_user', JSON.stringify(usuario));

    alert("✅ Sucesso! Bem-vindo " + usuario.nome);
    
    // Redirecionamento provisório (até instalarmos o Router)
    // window.location.reload(); 

  } catch (error) {
    console.error("Erro completo:", error);
    // Tenta pegar a mensagem de erro do backend, senão mostra erro genérico
    const msg = error.response?.data?.message || error.message || "Erro desconhecido";
    alert("❌ Falha no login: " + msg);
  } finally {
    carregando.value = false;
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2 class="auth-title">A Casa ERP</h2>
      <form @submit.prevent="fazerLogin">
        
        <div class="auth-group">
          <label class="label">E-mail</label>
          <input type="text" v-model="email" class="input">
        </div>
        
        <div class="auth-group">
          <label class="label">Senha</label>
          <input type="password" v-model="senha" class="input">
        </div>
        
        <button type="submit" class="botao botao-primario" :disabled="carregando">
          {{ carregando ? 'Conectando...' : 'Acessar' }}
        </button>

      </form>
    </div>
  </div>
</template>

<style scoped>
/* Garante que carregue seu CSS */
@import '../assets/CSS/pages/Login.css';
</style>