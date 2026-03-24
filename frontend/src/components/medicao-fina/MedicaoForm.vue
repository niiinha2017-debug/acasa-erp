<template>
  <div class="medicao-form ds-editor-form space-y-10">
    <!-- Formulário de Conferência: checklist Elétrica, Hidráulica, Gás, Alvenaria -->
    <section class="space-y-3">
      <div class="section-divider ds-section-divider relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border-ui/50"></div>
        </div>
        <div class="relative flex justify-center">
          <span class="section-title ds-section-title">Conferência da obra</span>
        </div>
      </div>
      <p class="medicao-form__hint">Marque quando cada item estiver conferido no local.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="medicao-form__choice">
          <input v-model="form.conferencia_eletrica_ok" type="checkbox" class="medicao-form__checkbox" />
          <span class="medicao-form__choice-label">Elétrica</span>
        </label>
        <label class="medicao-form__choice">
          <input v-model="form.conferencia_hidraulica_ok" type="checkbox" class="medicao-form__checkbox" />
          <span class="medicao-form__choice-label">Hidráulica</span>
        </label>
        <label class="medicao-form__choice">
          <input v-model="form.conferencia_gas_ok" type="checkbox" class="medicao-form__checkbox" />
          <span class="medicao-form__choice-label">Gás</span>
        </label>
        <label class="medicao-form__choice">
          <input v-model="form.conferencia_alvenaria_ok" type="checkbox" class="medicao-form__checkbox" />
          <span class="medicao-form__choice-label">Alvenaria</span>
        </label>
      </div>
    </section>

    <!-- Variáveis críticas -->
    <section class="space-y-4">
      <div class="section-divider ds-section-divider relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border-ui/50"></div>
        </div>
        <div class="relative flex justify-center">
          <span class="section-title ds-section-title">Variáveis críticas (cm)</span>
        </div>
      </div>
      <p class="medicao-form__hint">
        Digite as medidas da obra em <strong>centímetros (cm)</strong>. Ex.: 270 = 2,70 m (pé-direito), 240 = 2,40 m (largura).
      </p>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Input
          variant="line"
          v-model.number="form.altura_cm"
          type="number"
          label="Altura / Pé-direito (cm)"
          placeholder="Ex: 270"
          min="0"
          step="0.1"
        />
        <Input
          variant="line"
          v-model.number="form.largura_cm"
          type="number"
          label="Largura (cm)"
          placeholder="Ex: 240"
          min="0"
          step="0.1"
        />
        <Input
          variant="line"
          v-model.number="form.profundidade_cm"
          type="number"
          label="Profundidade (cm)"
          placeholder="Ex: 150"
          min="0"
          step="0.1"
        />
      </div>
      <div class="flex flex-wrap gap-6">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.prumo_ok"
            type="checkbox"
            class="medicao-form__checkbox"
          />
          <span class="medicao-form__choice-label">Prumo OK</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.esquadro_ok"
            type="checkbox"
            class="medicao-form__checkbox"
          />
          <span class="medicao-form__choice-label">Esquadro OK</span>
        </label>
      </div>
    </section>

    <!-- Medidas do projeto Promob (conferência) -->
    <section class="space-y-4">
      <div class="section-divider ds-section-divider relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border-ui/50"></div>
        </div>
        <div class="relative flex justify-center">
          <span class="section-title ds-section-title">Medida do projeto Promob (cm)</span>
        </div>
      </div>
      <p class="medicao-form__hint">
        Valores do projeto no Promob, também em <strong>cm</strong>, para conferir com a medida real.
      </p>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Input
          variant="line"
          v-model.number="form.altura_promob_cm"
          type="number"
          label="Altura Promob (cm)"
          placeholder="Ex: 270"
          min="0"
          step="0.1"
        />
        <Input
          variant="line"
          v-model.number="form.largura_promob_cm"
          type="number"
          label="Largura Promob (cm)"
          placeholder="Ex: 240"
          min="0"
          step="0.1"
        />
        <Input
          variant="line"
          v-model.number="form.profundidade_promob_cm"
          type="number"
          label="Profundidade Promob (cm)"
          placeholder="Ex: 150"
          min="0"
          step="0.1"
        />
      </div>
    </section>

    <!-- Tabela de Medidas: Medida do Projeto x Medida Real (alerta se diferença > 5mm) -->
    <section class="space-y-2">
      <div class="section-divider ds-section-divider relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border-ui/50"></div>
        </div>
        <div class="relative flex justify-center">
          <span class="section-title ds-section-title">Tabela de medidas</span>
        </div>
      </div>
      <p class="medicao-form__hint">
        Informe a <strong>Medida Real</strong> (obra) ao lado da <strong>Medida do Projeto</strong>. Diferença &gt; 5 mm destaca em vermelho.
      </p>
      <div class="medicao-form__table-shell">
        <table class="medicao-form__table">
          <thead class="medicao-form__table-head">
            <tr>
              <th class="medicao-form__th medicao-form__th--left">Dimensão</th>
              <th class="medicao-form__th">Medida do Projeto</th>
              <th class="medicao-form__th">Medida Real</th>
              <th class="medicao-form__th">Δ (cm)</th>
            </tr>
          </thead>
          <tbody class="medicao-form__table-body">
            <tr
              v-for="row in linhasConferencia"
              :key="row.key"
              :class="row.alerta ? 'medicao-form__tr--danger' : ''"
            >
              <td class="medicao-form__td medicao-form__td--left">{{ row.label }}</td>
              <td class="medicao-form__td">{{ formatCm(row.promob) }}</td>
              <td class="medicao-form__td">{{ formatCm(row.real) }}</td>
              <td class="medicao-form__td medicao-form__td--bold" :class="row.alerta ? 'medicao-form__td--danger' : ''">
                {{ formatCm(row.diff) }}
                <span v-if="row.alerta" class="medicao-form__td-alert"> &gt; 5mm</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Checklist interferências -->
    <section class="space-y-3">
      <div class="section-divider ds-section-divider relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border-ui/50"></div>
        </div>
        <div class="relative flex justify-center">
          <span class="section-title ds-section-title">Interferências</span>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label
          v-for="item in interferenciasOpcoes"
          :key="item.key"
          class="medicao-form__choice"
        >
          <input
            v-model="form.interferencias"
            type="checkbox"
            :value="item.key"
            class="medicao-form__checkbox"
          />
          <span class="medicao-form__choice-label">{{ item.label }}</span>
        </label>
      </div>
    </section>

    <!-- Observações do montador -->
    <section class="space-y-2">
      <div class="section-divider ds-section-divider relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border-ui/50"></div>
        </div>
        <div class="relative flex justify-center">
          <span class="section-title ds-section-title">Observações do montador</span>
        </div>
      </div>
      <textarea
        v-model="form.observacoes_montador"
        rows="3"
        placeholder="Ex: Parede de drywall, precisa de bucha específica"
        class="medicao-form__textarea"
      />
    </section>

    <!-- Fotos: situação da obra -->
    <section class="space-y-4">
      <div class="section-divider ds-section-divider relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border-ui/50"></div>
        </div>
        <div class="relative flex justify-center">
          <span class="section-title ds-section-title">Fotos da obra</span>
        </div>
      </div>
      <p class="medicao-form__hint">
        Registre a situação do ambiente com fotos (upload direto do celular).
      </p>
      <div
        v-for="cat in categoriasFoto"
        :key="cat.key"
        class="medicao-form__gallery-group"
      >
        <div class="medicao-form__gallery-label">{{ cat.label }}</div>
        <div class="flex flex-wrap gap-3 items-start">
          <div
            v-for="(f, idx) in (fotosPorCategoria[cat.key] || [])"
            :key="f.id || idx"
            class="relative group"
          >
            <img
              :src="previewUrl(f)"
              alt="Preview"
              class="medicao-form__thumb"
              @error="($event.target).style.display = 'none'"
            />
            <button
              v-if="medicaoId"
              type="button"
              class="medicao-form__thumb-remove"
              title="Remover"
              @click="$emit('remover-foto', f, cat.key)"
            >
              ×
            </button>
          </div>
          <label v-if="medicaoId" class="medicao-form__thumb-add">
            <input
              type="file"
              accept="image/*"
              class="hidden"
              @change="$emit('file-select', $event, cat.key)"
            />
            <i class="pi pi-camera text-2xl" style="color: var(--ds-color-text-faint)" />
            <span class="medicao-form__thumb-add-label">Add</span>
          </label>
        </div>
      </div>
      <p v-if="!medicaoId" class="medicao-form__hint">
        Salve a medição primeiro para adicionar fotos.
      </p>
    </section>

    <!-- Galeria de fotos: Lado A (Medição) | Lado B (3D/Produção) — upload celular, associado ao ambiente -->
    <section class="space-y-4">
      <div class="section-divider ds-section-divider relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border-ui/50"></div>
        </div>
        <div class="relative flex justify-center">
          <span class="section-title ds-section-title">Galeria de fotos</span>
        </div>
      </div>
      <p class="medicao-form__hint">
        Upload direto do celular. Fotos salvas no banco vinculadas a este ambiente.
      </p>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Lado A: Medição -->
        <div class="medicao-form__gallery-column">
          <div class="medicao-form__gallery-column-head">
            <h3 class="medicao-form__gallery-column-title">Lado A — Medição</h3>
            <p class="medicao-form__gallery-column-sub">Local vazio, pontos elétricos e hidráulicos (medidor)</p>
          </div>
          <div class="medicao-form__gallery-body">
            <template v-for="cat in galeriaLadoA" :key="cat.key">
              <div>
                <div class="medicao-form__gallery-cat-label">{{ cat.label }}</div>
                <div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  <div
                    v-for="(f, idx) in (fotosPorCategoria[cat.key] || [])"
                    :key="f.id || idx"
                    class="relative group aspect-square"
                  >
                    <img :src="previewUrl(f)" alt="Foto" class="medicao-form__gallery-img" @error="($event.target).style.display = 'none'" />
                    <button
                      v-if="medicaoId"
                      type="button"
                      class="medicao-form__thumb-remove medicao-form__thumb-remove--corner"
                      title="Remover"
                      @click="$emit('remover-foto', f, cat.key)"
                    >×</button>
                  </div>
                  <label v-if="medicaoId" class="medicao-form__gallery-add">
                    <input type="file" accept="image/*" capture="environment" class="hidden" @change="$emit('file-select', $event, cat.key)" />
                    <i class="pi pi-camera text-xl" style="color: var(--ds-color-text-faint)" />
                    <span class="medicao-form__thumb-add-label">Add</span>
                  </label>
                </div>
              </div>
            </template>
          </div>
        </div>
        <!-- Lado B: 3D/Produção -->
        <div class="medicao-form__gallery-column">
          <div class="medicao-form__gallery-column-head">
            <h3 class="medicao-form__gallery-column-title">Lado B — 3D / Produção</h3>
            <p class="medicao-form__gallery-column-sub">Print do Promob e fotos do móvel sendo montado</p>
          </div>
          <div class="medicao-form__gallery-body">
            <template v-for="cat in galeriaLadoB" :key="cat.key">
              <div>
                <div class="medicao-form__gallery-cat-label">{{ cat.label }}</div>
                <div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  <div
                    v-for="(f, idx) in (fotosPorCategoria[cat.key] || [])"
                    :key="f.id || idx"
                    class="relative group aspect-square"
                  >
                    <img :src="previewUrl(f)" alt="Foto" class="medicao-form__gallery-img" @error="($event.target).style.display = 'none'" />
                    <button
                      v-if="medicaoId"
                      type="button"
                      class="medicao-form__thumb-remove medicao-form__thumb-remove--corner"
                      title="Remover"
                      @click="$emit('remover-foto', f, cat.key)"
                    >×</button>
                  </div>
                  <label v-if="medicaoId" class="medicao-form__gallery-add">
                    <input type="file" accept="image/*" capture="environment" class="hidden" @change="$emit('file-select', $event, cat.key)" />
                    <i class="pi pi-camera text-xl" style="color: var(--ds-color-text-faint)" />
                    <span class="medicao-form__thumb-add-label">Add</span>
                  </label>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
      <p v-if="!medicaoId" class="medicao-form__hint">
        Salve a medição primeiro para adicionar fotos à galeria.
      </p>
    </section>

    <!-- Concluída + Salvar + Validar Medição -->
    <section class="medicao-form__actions ds-editor-actions">
      <div class="medicao-form__actions-row">
        <label class="medicao-form__choice">
          <input v-model="form.concluida" type="checkbox" class="medicao-form__checkbox" />
          <span class="medicao-form__choice-label medicao-form__choice-label--bold">
            Medição concluída (projeto pronto para cálculo)
          </span>
        </label>
        <Button
          type="button"
          :disabled="salvando"
          @click="$emit('salvar')"
        >
          <i v-if="salvando" class="pi pi-spin pi-spinner mr-1" />
          {{ salvando ? 'Salvando...' : 'Salvar' }}
        </Button>
        <Button
          v-if="projetoId"
          type="button"
          variant="success"
          :disabled="validando"
          @click="$emit('validar-medicao')"
        >
          <i v-if="validando" class="pi pi-spin pi-spinner mr-1" />
          {{ validando ? 'Validando...' : 'Validar Medição' }}
        </Button>
      </div>
      <p v-if="projetoId" class="medicao-form__hint">
        <strong>Validar Medição</strong> altera o status do projeto para &quot;Pronto para Produção&quot;.
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const props = defineProps({
  form: { type: Object, required: true },
  interferenciasOpcoes: { type: Array, required: true },
  categoriasFoto: { type: Array, required: true },
  fotosPorCategoria: { type: Object, default: () => ({}) },
  galeriaLadoA: { type: Array, default: () => [] },
  galeriaLadoB: { type: Array, default: () => [] },
  medicaoId: { type: Number, default: null },
  salvando: { type: Boolean, default: false },
  validando: { type: Boolean, default: false },
  projetoId: { type: Number, default: null },
  previewUrl: { type: Function, default: () => '' },
})

defineEmits(['salvar', 'validar-medicao', 'file-select', 'remover-foto'])

const LIMITE_DIFF_CM = 0.5 // 5mm

function formatCm (v) {
  if (v == null || v === '' || Number.isNaN(v)) return '—'
  return Number(v).toFixed(2)
}

const linhasConferencia = computed(() => {
  const f = props.form || {}
  const rows = [
    { key: 'altura', label: 'Altura', promob: f.altura_promob_cm, real: f.altura_cm },
    { key: 'largura', label: 'Largura', promob: f.largura_promob_cm, real: f.largura_cm },
    { key: 'profundidade', label: 'Profundidade', promob: f.profundidade_promob_cm, real: f.profundidade_cm },
  ]
  return rows.map((r) => {
    const promob = r.promob != null && !Number.isNaN(Number(r.promob)) ? Number(r.promob) : null
    const real = r.real != null && !Number.isNaN(Number(r.real)) ? Number(r.real) : null
    const diff = (promob != null && real != null) ? Math.abs(real - promob) : null
    const alerta = diff != null && diff > LIMITE_DIFF_CM
    return { ...r, diff, alerta }
  })
})
</script>

<style scoped>
/* ── Hints / descrições ── */
.medicao-form__hint {
  margin: 0;
  color: var(--ds-color-text-faint);
  font-size: 0.76rem;
  line-height: 1.5;
}

/* ── Checkbox / choice ── */
.medicao-form__choice {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) 0;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 55%, transparent);
  cursor: pointer;
  transition: color 0.18s ease, border-color 0.18s ease;
}

.medicao-form__checkbox {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  border: 1px solid var(--ds-color-border);
  accent-color: var(--ds-color-success);
  flex-shrink: 0;
}

.medicao-form__choice-label {
  color: var(--ds-color-text);
  font-size: 0.875rem;
  font-weight: 500;
}

.medicao-form__choice-label--bold {
  font-weight: 600;
}

/* ── Tabela de conferência ── */
.medicao-form__table-shell {
  border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
  overflow: hidden;
}

.medicao-form__table {
  width: 100%;
  font-size: 0.875rem;
  border-collapse: collapse;
}

.medicao-form__table-head {
  background: color-mix(in srgb, var(--ds-color-surface-muted) 80%, transparent);
}

.medicao-form__th {
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--ds-color-text-soft);
  text-align: right;
}

.medicao-form__th--left {
  text-align: left;
}

.medicao-form__table-body > tr + tr {
  border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 45%, transparent);
}

.medicao-form__tr--danger {
  background: color-mix(in srgb, var(--ds-color-danger) 10%, transparent);
}

.dark .medicao-form__tr--danger {
  background: color-mix(in srgb, var(--ds-color-danger) 18%, transparent);
}

.medicao-form__td {
  padding: 0.5rem 0.75rem;
  color: var(--ds-color-text-soft);
  text-align: right;
}

.medicao-form__td--left {
  color: var(--ds-color-text);
  text-align: left;
}

.medicao-form__td--bold {
  font-weight: 500;
}

.medicao-form__td--danger {
  color: var(--ds-color-danger);
}

.medicao-form__td-alert {
  font-size: 0.625rem;
  text-transform: uppercase;
  color: var(--ds-color-danger);
}

/* ── Textarea ── */
.medicao-form__textarea {
  width: 100%;
  min-height: 5rem;
  padding: var(--ds-space-3) var(--ds-space-4);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  font-size: 0.875rem;
  resize: vertical;
}

.medicao-form__textarea::placeholder {
  color: var(--ds-color-text-faint);
}

.medicao-form__textarea:focus {
  outline: none;
  border-color: var(--ds-color-primary);
}

/* ── Galeria de fotos ── */
.medicao-form__gallery-group {
  padding: var(--ds-space-4) 0;
  border-top: 1px solid color-mix(in srgb, var(--ds-color-border) 55%, transparent);
}

.medicao-form__gallery-label {
  margin-bottom: 0.5rem;
  color: var(--ds-color-text-soft);
  font-size: 0.75rem;
  font-weight: 600;
}

.medicao-form__thumb {
  width: 5rem;
  height: 5rem;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface-muted);
}

.medicao-form__thumb-remove {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: var(--ds-color-danger);
  color: #fff;
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity 0.18s ease;
  cursor: pointer;
}

.group:hover .medicao-form__thumb-remove {
  opacity: 1;
}

.medicao-form__thumb-remove--corner {
  top: 0.125rem;
  right: 0.125rem;
  box-shadow: var(--ds-shadow-sm);
}

.medicao-form__thumb-add {
  width: 5rem;
  height: 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--ds-color-border);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

.medicao-form__thumb-add:hover {
  border-color: var(--ds-color-success);
  background: color-mix(in srgb, var(--ds-color-success) 6%, transparent);
}

.medicao-form__thumb-add-label {
  font-size: 0.625rem;
  color: var(--ds-color-text-faint);
}

/* ── Galeria (colunas Lado A / Lado B) ── */
.medicao-form__gallery-column {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ds-color-border) 70%, transparent);
  border-radius: var(--ds-radius-sm);
}

.medicao-form__gallery-column-head {
  padding: var(--ds-space-3) var(--ds-space-4);
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border) 55%, transparent);
}

.medicao-form__gallery-column-title {
  margin: 0;
  color: var(--ds-color-text-soft);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.medicao-form__gallery-column-sub {
  margin: 0.125rem 0 0;
  color: var(--ds-color-text-faint);
  font-size: 0.68rem;
}

.medicao-form__gallery-body {
  padding: var(--ds-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.medicao-form__gallery-cat-label {
  margin-bottom: 0.375rem;
  color: var(--ds-color-text-faint);
  font-size: 0.68rem;
  font-weight: 600;
}

.medicao-form__gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface-muted);
}

.medicao-form__gallery-add {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--ds-color-border);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

.medicao-form__gallery-add:hover {
  border-color: var(--ds-color-success);
  background: color-mix(in srgb, var(--ds-color-success) 6%, transparent);
}

/* ── Ações (rodapé) ── */
.medicao-form__actions-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-4);
}

@media (max-width: 767px) {
  .medicao-form__choice {
    padding: var(--ds-space-3) 0;
  }
}
</style>
