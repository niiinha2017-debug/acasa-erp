<template>
  <!--
    PÁGINA MODELO — Use como base para novas telas.
    Copie este arquivo, renomeie e adapte: título, blocos e conteúdo.
    Acesse: /modelo
  -->
  <div class="w-full max-w-5xl mx-auto space-y-8">
    <!-- Cabeçalho da página -->
    <header class="space-y-1">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-dark flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
          <i class="pi pi-palette text-sm"></i>
        </div>
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Página modelo
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Layout de referência para adaptar em novas telas
          </p>
        </div>
      </div>
    </header>

    <!-- Cards de resumo / ações rápidas -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="(card, i) in cardsExemplo"
        :key="i"
        class="group relative rounded-2xl overflow-hidden bg-white dark:bg-slate-800/90 p-0
          shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)]
          dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.15)]
          hover:shadow-[0_4px_12px_rgba(58,120,168,0.12),0_12px_28px_rgba(0,0,0,0.08)]
          dark:hover:shadow-[0_4px_16px_rgba(58,120,168,0.2),0_12px_32px_rgba(0,0,0,0.25)]
          border border-slate-100 dark:border-slate-700/80
          hover:border-brand-primary/20 dark:hover:border-brand-primary/30
          transition-all duration-300 ease-out"
      >
        <!-- Faixa superior decorativa -->
        <div class="h-1.5 w-full bg-gradient-to-r from-brand-primary via-brand-primary to-brand-dark opacity-90 group-hover:opacity-100 transition-opacity" />

        <div class="flex items-start justify-between gap-4 p-5">
          <div class="flex-1 min-w-0">
            <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              {{ card.label }}
            </p>
            <p class="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2 tracking-tight tabular-nums">
              {{ card.valor }}
            </p>
            <p v-if="card.desc" class="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {{ card.desc }}
            </p>
          </div>
          <div class="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-brand-primary/15 to-brand-dark/10 dark:from-brand-primary/25 dark:to-brand-dark/20 flex items-center justify-center text-brand-primary dark:text-brand-primary border border-brand-primary/20 dark:border-brand-primary/30 group-hover:from-brand-primary/25 group-hover:to-brand-dark/20 group-hover:scale-105 transition-all duration-300">
            <i :class="card.icon" class="text-base"></i>
          </div>
        </div>
      </div>
    </section>

    <!-- Área principal (card único, estilo “conteúdo”) -->
    <section class="rounded-2xl overflow-hidden bg-white dark:bg-slate-800/90
      shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)]
      dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.15)]
      border border-slate-100 dark:border-slate-700/80">
      <!-- Faixa de destaque no topo do card -->
      <div class="h-1.5 w-full bg-gradient-to-r from-brand-primary via-brand-primary to-brand-dark" />

      <div class="p-6 md:p-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">
            Conteúdo principal
          </h2>
          <div class="flex items-center gap-2">
            <button type="button" class="btn-secondary-tw text-xs">
              <i class="pi pi-filter mr-1.5"></i>
              Filtrar
            </button>
            <button type="button" class="btn-primary-tw text-xs">
              <i class="pi pi-plus mr-1.5"></i>
              Nova ação
            </button>
          </div>
        </div>

        <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Aqui entra o conteúdo da sua tela: tabelas, formulários, listas, etc.
          Use os mesmos componentes (Button, Input, PageHeader quando quiser) e
          mantenha o padrão de espaçamento e bordas desta página.
        </p>

        <div class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Dicas de uso
          </p>
          <ul class="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <li class="flex items-center gap-2">
              <i class="pi pi-check text-brand-primary text-xs"></i>
              Copie este arquivo e renomeie para a nova rota (ex: <code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs">minha-tela.vue</code>).
            </li>
            <li class="flex items-center gap-2">
              <i class="pi pi-check text-brand-primary text-xs"></i>
              Mantenha header + cards (ou só header) + área principal.
            </li>
            <li class="flex items-center gap-2">
              <i class="pi pi-check text-brand-primary text-xs"></i>
              Use as classes <code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs">btn-primary-tw</code> e <code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs">btn-secondary-tw</code> para botões.
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
definePage({
  path: '/modelo',
  meta: {
    title: 'Página modelo',
    public: false,
  },
})

const cardsExemplo = [
  { label: 'Exemplo 1', valor: 'R$ 12.500', desc: 'Descrição opcional', icon: 'pi pi-chart-line' },
  { label: 'Exemplo 2', valor: '42', desc: 'Quantidade', icon: 'pi pi-box' },
  { label: 'Exemplo 3', valor: 'Ativo', desc: 'Status', icon: 'pi pi-check-circle' },
]
</script>
