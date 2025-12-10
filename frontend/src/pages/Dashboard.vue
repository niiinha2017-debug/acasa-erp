<script setup>
// Aqui vai a lógica do painel (carregar dados, gráficos, etc)
</script>

<template>
  <div class="layout-erp">
    
    <aside class="sidebar">
      <div class="brand">ACASA ERP</div>
      <nav>
        <ul>
          <li><a href="#">🏠 Início</a></li>
          <li><a href="#">💰 Financeiro</a></li>
          <li><a href="#">👥 Clientes</a></li>
          <li><a href="#">⚙️ Configurações</a></li>
          <li class="sair"><a href="#" @click="$emit('logout')">🚪 Sair</a></li>
        </ul>
      </nav>
    </aside>

    <main class="content">
      <header class="top-bar">
        <h2>Visão Geral</h2>
        <div class="user-info">Olá, Administrador</div>
      </header>
      
      <div class="dashboard-widgets">
        <div class="card-widget">
          <h3>Vendas Hoje</h3>
          <p class="valor">R$ 0,00</p>
        </div>
        <div class="card-widget">
          <h3>Contas a Pagar</h3>
          <p class="valor">R$ 0,00</p>
        </div>
      </div>
    </main>

  </div>
</template>

<style scoped>
/* CSS Básico só para não ficar tudo branco e bagunçado */
.layout-erp { display: flex; min-height: 100vh; font-family: 'Segoe UI', sans-serif; }
.sidebar { width: 250px; background-color: #1e3a8a; color: white; display: flex; flex-direction: column; }
.brand { padding: 20px; font-size: 1.5rem; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); }
nav ul { list-style: none; padding: 0; }
nav a { display: block; padding: 15px 20px; color: white; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.05); }
nav a:hover { background-color: rgba(255,255,255,0.1); }
.content { flex: 1; background-color: #f4f7fb; padding: 20px; }
.top-bar { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
.dashboard-widgets { display: flex; gap: 20px; }
.card-widget { background: white; padding: 20px; border-radius: 8px; flex: 1; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.valor { font-size: 1.5rem; font-weight: bold; color: #1e3a8a; }
</style>