<script setup>
import { onMounted, ref } from 'vue';
import MenuTop from '../components/Menu.vue'; // O Menu que criamos
import { AppConfig } from '../config';

// Simulando dados que viriam da API
const kpis = ref({
  vendas: 'R$ 45.200',
  producao: '12 Pedidos',
  contas: 'R$ 1.200',
  clientes: '5'
});

// Proteção simples: Se não tiver token, chuta pro Login
onMounted(() => {
  const token = localStorage.getItem(AppConfig.STORAGE_KEYS.TOKEN);
  if (!token) {
    // Como não temos Router ainda, recarregamos a página e o App.vue vai decidir
    // Mas por enquanto, vamos só avisar no console
    console.warn("Usuário não logado!");
  }
});
</script>

<template>
  <MenuTop />

  <section class="pagina">
    
    <div class="titulo-pagina">
      <i class="fas fa-chart-line"></i> Visão Geral
    </div>

    <div class="kpi-container">
      
      <div class="card-info-kpi positivo">
        <span>Vendas do Mês</span>
        <h3>{{ kpis.vendas }}</h3>
      </div>

      <div class="card-info-kpi pendente">
        <span>Em Produção</span>
        <h3>{{ kpis.producao }}</h3>
      </div>

      <div class="card-info-kpi negativo">
        <span>Contas Vencendo</span>
        <h3>{{ kpis.contas }}</h3>
      </div>

      <div class="card-info-kpi">
        <span>Novos Clientes</span>
        <h3>{{ kpis.clientes }}</h3>
      </div>

    </div>

    <div class="card">
      <h2 class="subtitulo-secao">Acesso Rápido</h2>
      
      <div class="row">
        <div class="col">
          <button class="botao botao-primario" style="width: 100%">
            <i class="fas fa-plus"></i> Novo Pedido
          </button>
        </div>
        <div class="col">
          <button class="botao botao-secundario" style="width: 100%">
            <i class="fas fa-users"></i> Ver Clientes
          </button>
        </div>
        <div class="col">
          <button class="botao botao-secundario" style="width: 100%">
            <i class="fas fa-box"></i> Estoque
          </button>
        </div>
      </div>
    </div>

  </section>
</template>

<style scoped>
/* Aqui você pode colocar ajustes finos se precisar */
/* Mas a maioria já vem do seu Main.css global */
</style>