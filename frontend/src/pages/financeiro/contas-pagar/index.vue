<script setup>
import { ref, onMounted, computed } from 'vue';
import { financeiroService } from '@/services/financeiro.service';
import { formatCurrency } from '@/utils/number'; // Vi que você tem utils/number.js!

const contas = ref([]);
const loading = ref(true);
const filtroStatus = ref('TODOS');

const buscarDados = async () => {
  loading.value = true;
  try {
    const { data } = await financeiroService.getContasPagar();
    contas.value = data;
  } finally {
    loading.value = false;
  }
};

const contasFiltradas = computed(() => {
  if (filtroStatus.value === 'TODOS') return contas.value;
  return contas.value.filter(c => c.status === filtroStatus.value);
});

onMounted(buscarDados);
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">Contas a Pagar</h1>
        <p class="text-gray-500">Gerencie suas obrigações financeiras e fluxo de caixa.</p>
      </div>
      
      <button class="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95">
        <span class="mr-2">＋</span> Nova Conta
      </button>
    </div>

    <div class="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit mb-6">
      <button 
        v-for="status in ['TODOS', 'PENDENTE', 'PAGO', 'ATRASADO']" 
        :key="status"
        @click="filtroStatus = status"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-bold transition-all',
          filtroStatus === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        {{ status }}
      </button>
    </div>

    <div class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50/50 border-b border-gray-100">
          <tr>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Fornecedor</th>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Vencimento</th>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Valor</th>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">Status</th>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="conta in contasFiltradas" :key="conta.id" class="group hover:bg-blue-50/30 transition-colors">
            <td class="px-6 py-4">
              <div class="font-bold text-gray-800">{{ conta.fornecedor?.nome_fantasia }}</div>
              <div class="text-xs text-gray-400">{{ conta.categoria || 'Geral' }}</div>
            </td>
            <td class="px-6 py-4 text-gray-600 font-medium">
              {{ new Date(conta.data_vencimento).toLocaleDateString('pt-BR') }}
            </td>
            <td class="px-6 py-4 font-black text-gray-900">
              {{ formatCurrency(conta.valor) }}
            </td>
            <td class="px-6 py-4">
              <div class="flex justify-center">
                <span :class="{
                  'bg-orange-100 text-orange-600': conta.status === 'PENDENTE',
                  'bg-green-100 text-green-600': conta.status === 'PAGO',
                  'bg-red-100 text-red-600': conta.status === 'ATRASADO'
                }" class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {{ conta.status }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <button class="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all">
                ⚙️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="contasFiltradas.length === 0" class="p-20 text-center text-gray-400">
        Nenhuma conta encontrada para este filtro.
      </div>
    </div>
  </div>
</template>