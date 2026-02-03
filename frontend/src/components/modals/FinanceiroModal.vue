<template>
  <div v-if="open" class="modal-overlay">
    <div class="modal-content max-w-5xl">
      
      <header class="flex justify-between items-center p-6 border-b bg-slate-50">
        <div>
          <h2 class="text-xl font-black text-slate-800 uppercase italic">Fechamento Mensal</h2>
          <p class="text-xs text-slate-500 font-bold uppercase tracking-widest">
            {{ fornecedorNome }} | REF: {{ form.mes }}/{{ form.ano }}
          </p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-rose-500 transition-colors">
          <i class="pi pi-times text-xl"></i>
        </button>
      </header>

      <div class="p-6 grid grid-cols-12 gap-8">
        
        <div class="col-span-12 lg:col-span-6 space-y-4">
          <h3 class="text-sm font-black text-rose-600 uppercase flex items-center gap-2">
            <i class="pi pi-arrow-circle-up"></i> Débitos (Saídas)
          </h3>
          
          <div class="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 font-bold uppercase">Compras Automáticas:</span>
              <span class="font-black text-slate-800 italic">R$ {{ preview.total_compras.toLocaleString() }}</span>
            </div>
            
            <hr class="border-rose-200/50">

            <div class="space-y-1">
              <label class="text-[10px] font-black text-rose-500 uppercase italic">Ajuste de Débito Manual (R$)</label>
              <input 
                v-model="form.valor_dever" 
                type="number" 
                class="w-full bg-white border-2 border-rose-200 rounded-lg p-2 font-black text-lg focus:border-rose-500 outline-none transition-all"
                placeholder="0,00"
              />
            </div>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-6 space-y-4">
          <h3 class="text-sm font-black text-emerald-600 uppercase flex items-center gap-2">
            <i class="pi pi-arrow-circle-down"></i> Créditos (Abatimentos)
          </h3>
          
          <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 font-bold uppercase">Planos de Corte:</span>
              <span class="font-black text-slate-800 italic">R$ {{ preview.total_planos.toLocaleString() }}</span>
            </div>

            <hr class="border-emerald-200/50">

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-emerald-500 uppercase italic italic">Crédito Manual (R$)</label>
                <input 
                  v-model="form.valor_creditar" 
                  type="number" 
                  class="w-full bg-white border-2 border-emerald-200 rounded-lg p-2 font-black text-lg focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-emerald-500 uppercase italic">Liberar %</label>
                <input 
                  v-model="form.percentual_liberado" 
                  type="number" 
                  class="w-full bg-white border-2 border-emerald-200 rounded-lg p-2 font-black text-lg focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-12 border-t pt-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-black text-slate-700 uppercase italic">Condição de Pagamento</h3>
            <div class="flex gap-4">
               <label class="flex items-center gap-2 cursor-pointer font-bold text-xs uppercase">
                 <input type="radio" v-model="form.forma_pagamento_chave" value="CHEQUE" class="accent-indigo-600"> CHEQUE
               </label>
               <label class="flex items-center gap-2 cursor-pointer font-bold text-xs uppercase">
                 <input type="radio" v-model="form.forma_pagamento_chave" value="CARTAO" class="accent-indigo-600"> CARTÃO
               </label>
            </div>
          </div>

          <div class="bg-slate-50 rounded-xl p-2 border border-dashed border-slate-300">
             <div v-for="(p, idx) in form.parcelas" :key="idx" class="flex gap-2 mb-2">
                <input v-model="p.parcela" type="text" readonly class="w-12 text-center bg-transparent font-bold text-xs">
                <input v-model="p.vencimento_em" type="date" class="flex-1 rounded border p-1 text-xs font-bold uppercase">
                <input v-model="p.valor" type="number" class="w-32 rounded border p-1 text-xs font-black text-right">
             </div>
             <button @click="adicionarParcela" class="text-[10px] font-black text-indigo-600 uppercase p-2 hover:underline">
               + Adicionar Parcela
             </button>
          </div>
        </div>

      </div>

      <footer class="p-6 bg-slate-900 flex justify-between items-center rounded-b-xl shadow-2xl">
        <div class="flex gap-8">
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-400 font-bold uppercase italic">Abatimento Total</span>
            <span class="text-xl font-black text-emerald-400 italic">R$ {{ totalCompensado.toLocaleString() }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-400 font-bold uppercase italic italic">Saldo Final à Pagar</span>
            <span class="text-2xl font-black text-white italic">R$ {{ totalFinal.toLocaleString() }}</span>
          </div>
        </div>

        <button 
          @click="confirmarFechamento"
          class="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-black uppercase italic tracking-widest transition-all shadow-xl active:scale-95"
        >
          Confirmar Fechamento
        </button>
      </footer>

    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'

const props = defineProps(['open', 'preview', 'fornecedorNome'])
const emit = defineEmits(['close', 'confirm'])

const form = reactive({
  fornecedor_id: props.preview.fornecedor_id,
  mes: props.preview.mes,
  ano: props.preview.ano,
  valor_dever: 0,
  valor_creditar: 0,
  percentual_liberado: 100,
  desconto_percentual: 0,
  forma_pagamento_chave: 'CHEQUE',
  parcelas: [
    { parcela: 1, valor: 0, vencimento_em: '' }
  ]
})

// LÓGICA DE CÁLCULO REATIVO (Igual ao seu NestJS)
const totalCompensado = computed(() => {
  const debitoBase = Number(props.preview.total_compras) + Number(form.valor_dever)
  const creditoExtra = (Number(form.valor_creditar) * Number(form.percentual_liberado)) / 100
  const creditoTotal = Number(props.preview.total_planos) + creditoExtra
  return Math.min(debitoBase, creditoTotal)
})

const totalFinal = computed(() => {
  const debitoBase = Number(props.preview.total_compras) + Number(form.valor_dever)
  const creditoExtra = (Number(form.valor_creditar) * Number(form.percentual_liberado)) / 100
  const creditoTotal = Number(props.preview.total_planos) + creditoExtra
  
  const subtotal = Math.max(debitoBase - creditoTotal, 0)
  const desconto = (subtotal * Number(form.desconto_percentual)) / 100
  return subtotal - desconto
})

function adicionarParcela() {
  form.parcelas.push({ parcela: form.parcelas.length + 1, valor: 0, vencimento_em: '' })
}

function confirmarFechamento() {
  emit('confirm', { ...form })
}
</script>

<style scoped>
/* Estilo minimalista mas robusto */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
</style>