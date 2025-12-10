<script setup>
import { ref } from 'vue'

// --- IMPORTANTE: Trazendo o CSS isolado do Login ---
// O "@" significa "src", então ele acha a pasta certinho
import './assets/CSS/pages/Login.css' 

const email = ref('')
const password = ref('')

const handleLogin = () => {
  // Aqui futuramente entra a lógica do Supabase/Backend
  console.log("Tentando logar:", email.value)
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      
      <div class="login-header">
        <h1 class="titulo-pagina" style="justify-content: center;">
           ACASA ERP
        </h1>
        <p class="subtitulo-pagina" style="text-align: center;">
          Bem-vindo de volta
        </p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="label" for="email">E-mail</label>
          <input 
            type="email" 
            id="email" 
            class="input" 
            v-model="email"
            placeholder="seu@email.com" 
            required
          />
        </div>

        <div class="form-group">
          <label class="label" for="password">Senha</label>
          <input 
            type="password" 
            id="password" 
            class="input" 
            v-model="password"
            placeholder="Sua senha" 
            required
          />
        </div>

        <div class="actions" style="margin-top: 25px;">
          <button type="submit" class="botao botao-primario full-width">
            ACESSAR SISTEMA
          </button>
        </div>

        <div class="footer-links" style="text-align: center; margin-top: 15px;">
          <a href="#" style="font-size: 0.85rem; color: var(--cinza-500);">Esqueci minha senha</a>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Ajuste fino local caso o Login.css precise de algo extra */
.full-width {
  width: 100%;
  justify-content: center;
}
</style>