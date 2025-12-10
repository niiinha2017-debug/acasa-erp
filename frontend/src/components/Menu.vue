<script setup>
import { ref, onMounted } from 'vue';

// 1. ESTADO (Variáveis que mudam a tela)
const userName = ref('Carregando...');
const isMenuOpen = ref(false); // Controla se o menu mobile está aberto ou fechado

// 2. LÓGICA (Funções)

// Função de Logout
const handleLogout = () => {
  if (confirm("Deseja realmente sair?")) {
    localStorage.removeItem('acasa_token');
    localStorage.removeItem('acasa_user');
    
    // Recarrega a página para voltar ao Login (simples e eficaz)
    window.location.reload(); 
  }
};

// Função Alternar Menu Mobile
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value; // Inverte: se tá aberto fecha, se tá fechado abre
};

// 3. CICLO DE VIDA (Roda quando o componente nasce na tela)
onMounted(() => {
  console.log("Menu Vue iniciado...");
  
  const userStr = localStorage.getItem('acasa_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // Aqui a mágica acontece: atualizamos a variável e o HTML muda sozinho!
      userName.value = user.nome || user.email || 'Usuário';
    } catch (e) {
      console.error("Erro ao ler usuário", e);
      userName.value = 'Usuário';
    }
  } else {
    userName.value = 'Visitante';
  }
});
</script>

<template>
  <header class="topbar">
    
    <button class="menu-hamburger" @click="toggleMenu">
      <i class="fas fa-bars"></i>
    </button>

    <div class="logo">
      <i class="fas fa-home"></i> A Casa
    </div>
    
    <nav id="topbarMenu" :class="{ active: isMenuOpen }">
      <div class="menu-container">
        <button class="category-btn">Dashboard</button>
        <button class="category-btn">Clientes</button>
        <button class="category-btn">Compras</button>
        <button class="category-btn">Produção</button>
        <button class="category-btn">Financeiro</button>
      </div>
    </nav>

    <div class="user-area">
      <span id="userNameDisplay">{{ userName }}</span>
      
      <button id="logoutBtn" title="Sair" @click="handleLogout">
        <i class="fas fa-sign-out-alt"></i>
      </button>
    </div>

  </header>
</template>

<style scoped>
/* Importa o CSS do Menu que já organizamos na pasta assets */
@import '../assets/css/layout/Menu.css';
</style>