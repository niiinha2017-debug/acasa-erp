<template>
  <section class="orcamento-tecnico-overview ds-surface p-4 md:p-5">
    <div class="orcamento-tecnico-overview__header">
      <div>
        <p class="orcamento-tecnico-overview__eyebrow">Contexto do projeto</p>
        <h2 class="orcamento-tecnico-overview__title">{{ nomeCliente }}</h2>
        <p class="orcamento-tecnico-overview__subtitle">{{ titulo }}</p>
      </div>

      <div class="orcamento-tecnico-overview__badges">
        <span class="ds-status-pill ds-status-pill--neutral">#{{ orcamentoId }}</span>
        <span class="ds-status-pill" :class="temMedicaoTecnico ? 'ds-status-pill--success' : 'ds-status-pill--warning'">
          {{ temMedicaoTecnico ? 'Com medição técnica' : 'Sem medição técnica' }}
        </span>
      </div>
    </div>

    <div class="orcamento-tecnico-overview__grid">
      <article class="orcamento-tecnico-kpi">
        <span class="orcamento-tecnico-kpi__label">Contato principal</span>
        <strong class="orcamento-tecnico-kpi__value">{{ contato }}</strong>
      </article>
      <article class="orcamento-tecnico-kpi">
        <span class="orcamento-tecnico-kpi__label">Ambientes medidos</span>
        <strong class="orcamento-tecnico-kpi__value">{{ totalAmbientes }}</strong>
      </article>
      <article class="orcamento-tecnico-kpi">
        <span class="orcamento-tecnico-kpi__label">Área real</span>
        <strong class="orcamento-tecnico-kpi__value">{{ Number(areaReal).toFixed(3) }} m²</strong>
      </article>
      <article class="orcamento-tecnico-kpi">
        <span class="orcamento-tecnico-kpi__label">Base vendedor</span>
        <strong class="orcamento-tecnico-kpi__value">{{ formatCurrency(precoEstimadoBase) }}</strong>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  nomeCliente: { type: String, default: '' },
  titulo: { type: String, default: '' },
  orcamentoId: { type: [Number, String], default: '' },
  temMedicaoTecnico: { type: Boolean, default: false },
  contato: { type: String, default: '' },
  totalAmbientes: { type: [Number, String], default: 0 },
  areaReal: { type: Number, default: 0 },
  precoEstimadoBase: { type: Number, default: 0 },
})

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}
</script>

<style scoped>
.orcamento-tecnico-overview {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.orcamento-tecnico-overview__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.orcamento-tecnico-overview__eyebrow {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 500;
}
.orcamento-tecnico-overview__title {
  margin-top: 0.2rem;
  color: var(--ds-color-text);
  font-size: clamp(1.15rem, 1.02rem + 0.45vw, 1.55rem);
  font-weight: 620;
  letter-spacing: -0.02em;
}
.orcamento-tecnico-overview__subtitle {
  margin-top: 0.3rem;
  color: var(--ds-color-text-soft);
  font-size: 0.84rem;
}
.orcamento-tecnico-overview__badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}
.orcamento-tecnico-overview__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}
.orcamento-tecnico-kpi {
  border: 1px solid var(--ds-color-border);
  border-radius: 1rem;
  background: var(--ds-color-surface-muted);
  padding: 0.9rem 1rem;
}
.orcamento-tecnico-kpi__label {
  display: block;
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 500;
}
.orcamento-tecnico-kpi__value {
  display: block;
  margin-top: 0.35rem;
  color: var(--ds-color-text);
  font-size: 0.98rem;
  font-weight: 620;
  line-height: 1.35;
}
</style>
