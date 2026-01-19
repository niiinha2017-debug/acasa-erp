<template>
  <div class="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
    <div class="bg-white p-8 rounded-[2rem] shadow-xl w-full max-w-md border border-slate-100">
      <header class="text-center mb-8">
        <span class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Painel Administrativo</span>
        <h1 class="text-2xl font-black uppercase italic">Gerar <span class="text-indigo-600">Acesso</span></h1>
      </header>

      <div class="space-y-6">
        <div class="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-center">
          <p class="text-[10px] font-black text-indigo-400 uppercase mb-2">Código de Ativação</p>
          <h2 class="text-4xl font-black text-indigo-900 tracking-widest">{{ generatedCode }}</h2>
        </div>

        <button @click="gerarNovoCodigo" class="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
          Gerar Novo Código
        </button>

        <div class="pt-4 border-t border-slate-100">
          <p class="text-[11px] text-slate-400 text-center leading-relaxed">
            Envie este código ao funcionário. Ele deverá inseri-lo no terminal para autorizar o dispositivo conforme a LGPD.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const generatedCode = ref('B77D-87B2') // Aqui você chamaria sua API para gerar um código real

function gerarNovoCodigo() {
  // Lógica para gerar código aleatório ou via API
  generatedCode.value = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + 
                        Math.random().toString(36).substring(2, 6).toUpperCase()
}
</script>