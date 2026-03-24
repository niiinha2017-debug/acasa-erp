<template>
  <div class="timeline-filters">
    <div class="timeline-filters__topline">
      <div class="timeline-filters__status">
        <i class="pi pi-stopwatch text-slate-400" aria-hidden />
        <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {{ visao === 'vendas' ? 'Vendas' : 'Produção' }}
        </span>
      </div>

      <div
        class="timeline-filters__switch"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          class="timeline-filters__switch-btn"
          :class="
            visao === 'vendas'
              ? 'is-active'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          "
          @click="$emit('update:visao', 'vendas')"
        >
          Vendas ({{ totalVendas }})
        </button>
        <button
          type="button"
          role="tab"
          class="timeline-filters__switch-btn"
          :class="
            visao === 'producao'
              ? 'is-active'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          "
          @click="$emit('update:visao', 'producao')"
        >
          Produção ({{ totalProducao }})
        </button>
      </div>
    </div>

    <div class="timeline-filters__grid">
      <label class="timeline-filters__field" title="Data de">
        <span class="timeline-filters__label">Data inicial</span>
        <input
          :value="dataInicio"
          type="date"
          class="timeline-filters__input"
          @input="$emit('update:dataInicio', $event.target.value)"
          @change="$emit('change-dates')"
        />
      </label>

      <label class="timeline-filters__field" title="Data até">
        <span class="timeline-filters__label">Data final</span>
        <input
          :value="dataFim"
          type="date"
          class="timeline-filters__input"
          @input="$emit('update:dataFim', $event.target.value)"
          @change="$emit('change-dates')"
        />
      </label>

      <div class="timeline-filters__field timeline-filters__field--search">
        <SearchInput
          :model-value="buscaCliente"
          placeholder="Buscar cliente..."
          variant="line"
          col-span="col-span-12"
          @update:model-value="$emit('update:buscaCliente', $event)"
        />
      </div>

      <RouterLink
        v-if="linkVerNaAgenda"
        :to="linkVerNaAgenda"
        class="timeline-filters__link"
      >
        Ver na agenda
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'TimelineFilters' })

defineProps({
  visao: { type: String, default: 'vendas' },
  totalVendas: { type: Number, default: 0 },
  totalProducao: { type: Number, default: 0 },
  dataInicio: { type: String, default: '' },
  dataFim: { type: String, default: '' },
  buscaCliente: { type: String, default: '' },
  linkVerNaAgenda: { type: String, default: '' },
})

defineEmits([
  'update:visao',
  'update:dataInicio',
  'update:dataFim',
  'update:buscaCliente',
  'change-dates',
])
</script>

<style scoped>
.timeline-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.35rem 0 0.75rem;
}

.dark .timeline-filters {
  background: transparent;
  box-shadow: none;
}

.timeline-filters__topline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding-bottom: 0.2rem;
}

.timeline-filters__status {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.timeline-filters__switch {
  display: inline-flex;
  padding: 0.22rem;
  border: 1px solid rgba(214, 224, 234, 0.8);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
}

.dark .timeline-filters__switch {
  border-color: rgba(51, 71, 102, 0.8);
  background: rgba(13, 21, 35, 0.55);
}

.timeline-filters__switch-btn {
  min-height: 2.1rem;
  padding: 0 0.9rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.timeline-filters__switch-btn.is-active {
  border-color: rgba(44, 111, 163, 0.14);
  background: rgba(44, 111, 163, 0.08);
  color: var(--ds-color-primary);
}

.timeline-filters__grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 0.85rem;
  padding-top: 0.1rem;
}

.timeline-filters__field {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.timeline-filters__field--search {
  min-width: 0;
}

.timeline-filters__field--search :deep(.search-container) {
  width: 100%;
}

.timeline-filters__field--search :deep(.ds-field) {
  gap: 0;
}

.timeline-filters__field--search :deep(.ds-field-label) {
  display: none;
}

.timeline-filters__field--search :deep(.ds-control-input--line) {
  min-height: 2.65rem !important;
  height: 2.65rem !important;
  padding-top: 0.65rem !important;
  padding-bottom: 0.5rem !important;
}

.timeline-filters__label {
  color: var(--ds-color-text-faint);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.timeline-filters__input {
  width: 100%;
  min-height: 2.65rem;
  padding: 0 0.9rem;
  border: 1px solid rgba(214, 224, 234, 0.92);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.82);
  color: var(--ds-color-text);
  font-size: 0.88rem;
  font-weight: 500;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.timeline-filters__input:focus {
  border-color: rgba(44, 111, 163, 0.32);
  box-shadow: 0 0 0 4px rgba(44, 111, 163, 0.08);
}

.dark .timeline-filters__input {
  border-color: rgba(51, 71, 102, 0.82);
  background: rgba(18, 30, 49, 0.76);
}

.timeline-filters__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.65rem;
  padding: 0 1rem;
  border: 1px solid rgba(214, 224, 234, 0.92);
  border-radius: 1rem;
  color: var(--ds-color-text-soft);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: border-color 0.18s ease, color 0.18s ease, background-color 0.18s ease;
}

.timeline-filters__link:hover {
  border-color: rgba(44, 111, 163, 0.28);
  color: var(--ds-color-primary);
  background: rgba(44, 111, 163, 0.05);
}

@media (min-width: 768px) {
  .timeline-filters__grid {
    grid-template-columns: 10rem 10rem minmax(0, 1fr) auto;
    align-items: end;
  }
}
</style>
