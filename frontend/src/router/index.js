// --- Importações CORRETAS ---
import { createRouter, createWebHistory } from 'vue-router';

import Login from '@/views/Login.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue'; // (Assumindo que você usa layouts)
import Index from '@/views/Index.vue';

// 🛑 Novo caminho para ClientesList e ClientesCreate 
import ClientesList from '@/views/Clientes/ClientesList.vue'; 
import ClientesCreate from '@/views/Clientes/ClientesCreate.vue'; 


// --- Rotas CORRIGIDAS ---

const routes = [
  {
    path: '/login',
    component: Login
  },
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', component: Index, name: 'Home' },
      
      // ROTAS DE CLIENTES
      { 
          path: 'clientes', 
          component: ClientesList, // Use a variável importada
          name: 'ClientesListagem'
      },
      { 
          path: 'clientes/novo', 
          component: ClientesCreate, // Use a variável importada (SEM .vue)
          name: 'ClientesCadastro' 
      }
    ]
  }
];

export default createRouter({
  history: createWebHistory(),
  routes
})
