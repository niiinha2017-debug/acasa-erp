<template>
  <div class="p-4 md:p-6 space-y-5">
    <header class="rounded-2xl border border-border-ui bg-bg-card p-4 md:p-5">
      <h1 class="text-lg md:text-xl font-black text-text-main">Processo de Orcamento e Pos-venda</h1>
      <p class="text-xs md:text-sm text-text-soft mt-1">
        Fluxo unico para marcenaria: custos do projeto, formacao do preco e passagem para producao.
      </p>
    </header>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <article class="rounded-2xl border border-border-ui bg-bg-card p-4 space-y-3">
        <h2 class="text-sm font-black uppercase tracking-wide text-text-main">Custos Base</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <label class="space-y-1">
            <span class="text-text-soft">Material (R$)</span>
            <input v-model.number="material" type="number" min="0" class="w-full h-10 px-3 rounded-lg border border-border-ui bg-bg-page" />
          </label>
          <label class="space-y-1">
            <span class="text-text-soft">Horas de mao de obra</span>
            <input v-model.number="horasMaoObra" type="number" min="0" step="0.5" class="w-full h-10 px-3 rounded-lg border border-border-ui bg-bg-page" />
          </label>
          <label class="space-y-1">
            <span class="text-text-soft">Custo/hora (R$)</span>
            <input v-model.number="custoHora" type="number" min="0" step="0.01" class="w-full h-10 px-3 rounded-lg border border-border-ui bg-bg-page" />
          </label>
          <label class="space-y-1">
            <span class="text-text-soft">Custos indiretos (R$)</span>
            <input v-model.number="indiretos" type="number" min="0" class="w-full h-10 px-3 rounded-lg border border-border-ui bg-bg-page" />
          </label>
        </div>
      </article>

      <article class="rounded-2xl border border-border-ui bg-bg-card p-4 space-y-3">
        <h2 class="text-sm font-black uppercase tracking-wide text-text-main">Taxas e Recebimento</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <label class="space-y-1">
            <span class="text-text-soft">Taxa maquininha (%)</span>
            <input v-model.number="taxaMaquina" type="number" min="0" step="0.01" class="w-full h-10 px-3 rounded-lg border border-border-ui bg-bg-page" />
          </label>
          <label class="space-y-1">
            <span class="text-text-soft">Margem desejada (%)</span>
            <input v-model.number="margem" type="number" min="0" step="0.01" class="w-full h-10 px-3 rounded-lg border border-border-ui bg-bg-page" />
          </label>
          <label class="space-y-1 sm:col-span-2">
            <span class="text-text-soft">Prazo de recebimento</span>
            <select v-model="prazo" class="w-full h-10 px-3 rounded-lg border border-border-ui bg-bg-page">
              <option value="A_VISTA">A vista</option>
              <option value="30_DIAS">30 dias</option>
              <option value="60_DIAS">60 dias</option>
              <option value="90_DIAS">90 dias</option>
            </select>
          </label>
        </div>
      </article>
    </section>

    <section class="rounded-2xl border border-border-ui bg-bg-card p-4">
      <h2 class="text-sm font-black uppercase tracking-wide text-text-main mb-3">Resumo do Orcamento</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="rounded-xl border border-border-ui bg-bg-page p-3">
          <p class="text-[11px] uppercase tracking-wide text-text-soft">Custo total</p>
          <p class="text-base font-black text-text-main">{{ moeda(custoTotal) }}</p>
        </div>
        <div class="rounded-xl border border-border-ui bg-bg-page p-3">
          <p class="text-[11px] uppercase tracking-wide text-text-soft">Preco sugerido</p>
          <p class="text-base font-black text-text-main">{{ moeda(precoSugerido) }}</p>
        </div>
        <div class="rounded-xl border border-border-ui bg-bg-page p-3">
          <p class="text-[11px] uppercase tracking-wide text-text-soft">Taxa estimada</p>
          <p class="text-base font-black text-text-main">{{ moeda(custoTaxa) }}</p>
        </div>
        <div class="rounded-xl border border-border-ui bg-bg-page p-3">
          <p class="text-[11px] uppercase tracking-wide text-text-soft">Liquido estimado</p>
          <p class="text-base font-black text-text-main">{{ moeda(valorLiquido) }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-border-ui bg-bg-card p-4">
      <h2 class="text-sm font-black uppercase tracking-wide text-text-main mb-3">Fluxo Operacional</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div class="rounded-xl border border-border-ui bg-bg-page p-3">
          <p class="font-black text-text-main">1. Orcamento</p>
          <p class="text-text-soft mt-1">Novo -> Em elaboracao -> Enviado -> Aprovado</p>
        </div>
        <div class="rounded-xl border border-border-ui bg-bg-page p-3">
          <p class="font-black text-text-main">2. Venda e Medida Fina</p>
          <p class="text-text-soft mt-1">Pedido confirmado -> Medida fina -> Projeto tecnico</p>
        </div>
        <div class="rounded-xl border border-border-ui bg-bg-page p-3">
          <p class="font-black text-text-main">3. Pos-venda e Agenda</p>
          <p class="text-text-soft mt-1">Producao -> Montagem -> Entrega -> Pos-venda. Ao entrar em producao, vai para Agenda Geral.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

definePage({ meta: { perm: 'orcamentos.ver' } })

const material = ref(1200)
const horasMaoObra = ref(24)
const custoHora = ref(45)
const indiretos = ref(380)
const taxaMaquina = ref(3.5)
const margem = ref(30)
const prazo = ref('30_DIAS')

const custoMaoObra = computed(() => Number(horasMaoObra.value || 0) * Number(custoHora.value || 0))
const subtotal = computed(() => Number(material.value || 0) + custoMaoObra.value + Number(indiretos.value || 0))
const precoSugerido = computed(() => {
  const perc = Number(margem.value || 0) / 100
  if (perc >= 1) return subtotal.value
  return subtotal.value / (1 - perc)
})
const custoTaxa = computed(() => precoSugerido.value * (Number(taxaMaquina.value || 0) / 100))
const custoTotal = computed(() => subtotal.value + custoTaxa.value)
const valorLiquido = computed(() => Math.max(precoSugerido.value - custoTaxa.value, 0))

function moeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>
