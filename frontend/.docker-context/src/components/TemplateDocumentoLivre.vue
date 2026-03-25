<template>
  <article
    class="template-documento-livre login-font w-full max-w-[210mm] mx-auto rounded-2xl border border-border-ui bg-white dark:bg-bg-card overflow-hidden shadow-sm print:shadow-none print:rounded-none"
  >
    <!-- Barra superior (identidade visual) -->
    <div class="h-1 w-full bg-brand-primary rounded-t-2xl print:rounded-none" />

    <!-- Cabeçalho fixo: logo + dados da empresa -->
    <header class="px-6 sm:px-8 pt-6 pb-5 border-b border-border-ui bg-slate-50/50 dark:bg-slate-800/20">
      <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div class="flex-shrink-0">
          <img
            :src="logoUrl"
            alt="Logo"
            class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-contain border border-border-ui bg-white dark:bg-slate-900"
          />
        </div>
        <div class="min-w-0 flex flex-col gap-0.5">
          <h1 class="text-lg sm:text-xl font-bold text-text-main tracking-tight">
            A Casa <span class="text-brand-primary">Móveis Planejados</span>
          </h1>
          <p v-if="exibirDadosEmpresa" class="text-xs text-text-soft">
            CNPJ 28.638.791/0001-07
            <span v-if="linhaExtraEmpresa"> · {{ linhaExtraEmpresa }}</span>
          </p>
        </div>
      </div>
    </header>

    <!-- Título opcional do documento (ex.: Comunicado, Aviso) -->
    <div
      v-if="titulo"
      class="px-6 sm:px-8 py-4 border-b border-border-ui/50 bg-slate-50/30 dark:bg-slate-800/10"
    >
      <h2 class="text-sm font-bold uppercase tracking-wider text-text-soft">
        {{ titulo }}
      </h2>
    </div>

    <!-- Corpo: texto livre (slot ou prop conteudo) -->
    <div class="documento-corpo px-6 sm:px-8 py-6 sm:py-8 text-text-main leading-relaxed text-sm sm:text-base">
      <slot>
        <div
          v-if="conteudo"
          class="conteudo-html"
          v-html="conteudo"
        />
        <p v-else class="text-text-soft text-sm italic">
          Conteúdo do documento (use o slot ou a prop <code>conteudo</code>).
        </p>
      </slot>
    </div>

    <!-- Rodapé opcional (data de geração, etc.) -->
    <footer
      v-if="exibirRodape"
      class="px-6 sm:px-8 py-3 border-t border-border-ui/50 text-[10px] text-text-soft uppercase tracking-wider"
    >
      Documento gerado em {{ dataGeracao }}
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** URL da logo (padrão: /logo.png) */
  logoUrl: {
    type: String,
    default: '/logo.png',
  },
  /** Título do documento (ex.: "Comunicado", "Aviso") */
  titulo: {
    type: String,
    default: '',
  },
  /** Conteúdo em HTML quando não se usa o slot */
  conteudo: {
    type: String,
    default: '',
  },
  /** Exibir linha CNPJ e opcionalmente linha extra no cabeçalho */
  exibirDadosEmpresa: {
    type: Boolean,
    default: true,
  },
  /** Texto extra no cabeçalho (ex.: endereço ou telefone) */
  linhaExtraEmpresa: {
    type: String,
    default: '',
  },
  /** Exibir rodapé com data de geração */
  exibirRodape: {
    type: Boolean,
    default: true,
  },
})

const dataGeracao = computed(() =>
  new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }),
)
</script>

<style scoped>
.template-documento-livre {
  /* Leitura confortável em telas grandes */
}
.documento-corpo :deep(p) {
  margin-bottom: 0.75em;
}
.documento-corpo :deep(p:last-child) {
  margin-bottom: 0;
}
.documento-corpo :deep(ul),
.documento-corpo :deep(ol) {
  margin-left: 1.25em;
  margin-bottom: 0.75em;
}
.documento-corpo :deep(h3) {
  font-size: 1rem;
  font-weight: 700;
  margin-top: 1em;
  margin-bottom: 0.5em;
}
@media print {
  .template-documento-livre {
    max-width: none;
    box-shadow: none;
  }
}
</style>
