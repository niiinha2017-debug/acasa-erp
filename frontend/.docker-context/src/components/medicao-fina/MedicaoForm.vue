<template>
  <div class="space-y-6">
    <!-- Formulário de Conferência: checklist Elétrica, Hidráulica, Gás, Alvenaria -->
    <section class="space-y-3">
      <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        Conferência da obra
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Marque quando cada item estiver conferido no local.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition">
          <input
            v-model="form.conferencia_eletrica_ok"
            type="checkbox"
            class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
          />
          <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Elétrica</span>
        </label>
        <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition">
          <input
            v-model="form.conferencia_hidraulica_ok"
            type="checkbox"
            class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
          />
          <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Hidráulica</span>
        </label>
        <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition">
          <input
            v-model="form.conferencia_gas_ok"
            type="checkbox"
            class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
          />
          <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Gás</span>
        </label>
        <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition">
          <input
            v-model="form.conferencia_alvenaria_ok"
            type="checkbox"
            class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
          />
          <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Alvenaria</span>
        </label>
      </div>
    </section>

    <!-- Variáveis críticas -->
    <section class="space-y-4">
      <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        Variáveis críticas (cm)
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Digite as medidas da obra em <strong>centímetros (cm)</strong>. Ex.: 270 = 2,70 m (pé-direito), 240 = 2,40 m (largura).
      </p>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Input
          v-model.number="form.altura_cm"
          type="number"
          label="Altura / Pé-direito (cm)"
          placeholder="Ex: 270"
          min="0"
          step="0.1"
        />
        <Input
          v-model.number="form.largura_cm"
          type="number"
          label="Largura (cm)"
          placeholder="Ex: 240"
          min="0"
          step="0.1"
        />
        <Input
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
            class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span class="text-sm text-slate-700 dark:text-slate-300">Prumo OK</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.esquadro_ok"
            type="checkbox"
            class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span class="text-sm text-slate-700 dark:text-slate-300">Esquadro OK</span>
        </label>
      </div>
    </section>

    <!-- Medidas do projeto Promob (conferência) -->
    <section class="space-y-4">
      <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        Medida do projeto Promob (cm)
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Valores do projeto no Promob, também em <strong>cm</strong>, para conferir com a medida real.
      </p>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Input
          v-model.number="form.altura_promob_cm"
          type="number"
          label="Altura Promob (cm)"
          placeholder="Ex: 270"
          min="0"
          step="0.1"
        />
        <Input
          v-model.number="form.largura_promob_cm"
          type="number"
          label="Largura Promob (cm)"
          placeholder="Ex: 240"
          min="0"
          step="0.1"
        />
        <Input
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
      <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        Tabela de medidas
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Informe a <strong>Medida Real</strong> (obra) ao lado da <strong>Medida do Projeto</strong>. Diferença &gt; 5 mm destaca em vermelho.
      </p>
      <div class="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-100 dark:bg-slate-700/50">
            <tr>
              <th class="text-left py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">Dimensão</th>
              <th class="text-right py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">Medida do Projeto</th>
              <th class="text-right py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">Medida Real</th>
              <th class="text-right py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">Δ (cm)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-600">
            <tr
              v-for="row in linhasConferencia"
              :key="row.key"
              :class="row.alerta ? 'bg-red-500/10 dark:bg-red-500/20' : ''"
            >
              <td class="py-2 px-3 text-slate-700 dark:text-slate-300">{{ row.label }}</td>
              <td class="py-2 px-3 text-right text-slate-600 dark:text-slate-400">{{ formatCm(row.promob) }}</td>
              <td class="py-2 px-3 text-right text-slate-600 dark:text-slate-400">{{ formatCm(row.real) }}</td>
              <td class="py-2 px-3 text-right font-medium" :class="row.alerta ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'">
                {{ formatCm(row.diff) }}
                <span v-if="row.alerta" class="text-[10px] uppercase text-red-600 dark:text-red-400"> &gt; 5mm</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Checklist interferências -->
    <section class="space-y-3">
      <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        Interferências
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label
          v-for="item in interferenciasOpcoes"
          :key="item.key"
          class="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
        >
          <input
            v-model="form.interferencias"
            type="checkbox"
            :value="item.key"
            class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span class="text-sm text-slate-700 dark:text-slate-300">{{ item.label }}</span>
        </label>
      </div>
    </section>

    <!-- Observações do montador -->
    <section class="space-y-2">
      <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Observações do montador
      </label>
      <textarea
        v-model="form.observacoes_montador"
        rows="3"
        placeholder="Ex: Parede de drywall, precisa de bucha específica"
        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 resize-y min-h-[80px]"
      />
    </section>

    <!-- Fotos: situação da obra -->
    <section class="space-y-4">
      <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        Fotos da obra
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Registre a situação do ambiente com fotos (upload direto do celular).
      </p>
      <div
        v-for="cat in categoriasFoto"
        :key="cat.key"
        class="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-slate-50/50 dark:bg-slate-800/50"
      >
        <div class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
          {{ cat.label }}
        </div>
        <div class="flex flex-wrap gap-3 items-start">
          <div
            v-for="(f, idx) in (fotosPorCategoria[cat.key] || [])"
            :key="f.id || idx"
            class="relative group"
          >
            <img
              :src="previewUrl(f)"
              alt="Preview"
              class="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100"
              @error="($event.target).style.display = 'none'"
            />
            <button
              v-if="medicaoId"
              type="button"
              class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              title="Remover"
              @click="$emit('remover-foto', f, cat.key)"
            >
              ×
            </button>
          </div>
          <label
            v-if="medicaoId"
            class="w-20 h-20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 cursor-pointer transition"
          >
            <input
              type="file"
              accept="image/*"
              class="hidden"
              @change="$emit('file-select', $event, cat.key)"
            />
            <i class="pi pi-camera text-2xl text-slate-400 mb-0.5" />
            <span class="text-[10px] text-slate-500">Add</span>
          </label>
        </div>
      </div>
      <p v-if="!medicaoId" class="text-xs text-slate-500">
        Salve a medição primeiro para adicionar fotos.
      </p>
    </section>

    <!-- Galeria de fotos: Lado A (Medição) | Lado B (3D/Produção) — upload celular, associado ao ambiente -->
    <section class="space-y-4">
      <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        Galeria de fotos
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Upload direto do celular. Fotos salvas no banco vinculadas a este ambiente.
      </p>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Lado A: Medição -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 overflow-hidden">
          <div class="px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Lado A — Medição
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Local vazio, pontos elétricos e hidráulicos (medidor)
            </p>
          </div>
          <div class="p-4 space-y-4">
            <template v-for="cat in galeriaLadoA" :key="cat.key">
              <div>
                <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{{ cat.label }}</div>
                <div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  <div
                    v-for="(f, idx) in (fotosPorCategoria[cat.key] || [])"
                    :key="f.id || idx"
                    class="relative group aspect-square"
                  >
                    <img
                      :src="previewUrl(f)"
                      alt="Foto"
                      class="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100"
                      @error="($event.target).style.display = 'none'"
                    />
                    <button
                      v-if="medicaoId"
                      type="button"
                      class="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                      title="Remover"
                      @click="$emit('remover-foto', f, cat.key)"
                    >
                      ×
                    </button>
                  </div>
                  <label
                    v-if="medicaoId"
                    class="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 cursor-pointer transition"
                  >
                    <input type="file" accept="image/*" capture="environment" class="hidden" @change="$emit('file-select', $event, cat.key)" />
                    <i class="pi pi-camera text-xl text-slate-400 mb-0.5" />
                    <span class="text-[10px] text-slate-500">Add</span>
                  </label>
                </div>
              </div>
            </template>
          </div>
        </div>
        <!-- Lado B: 3D/Produção -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 overflow-hidden">
          <div class="px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Lado B — 3D / Produção
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Print do Promob e fotos do móvel sendo montado
            </p>
          </div>
          <div class="p-4 space-y-4">
            <template v-for="cat in galeriaLadoB" :key="cat.key">
              <div>
                <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{{ cat.label }}</div>
                <div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  <div
                    v-for="(f, idx) in (fotosPorCategoria[cat.key] || [])"
                    :key="f.id || idx"
                    class="relative group aspect-square"
                  >
                    <img
                      :src="previewUrl(f)"
                      alt="Foto"
                      class="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100"
                      @error="($event.target).style.display = 'none'"
                    />
                    <button
                      v-if="medicaoId"
                      type="button"
                      class="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                      title="Remover"
                      @click="$emit('remover-foto', f, cat.key)"
                    >
                      ×
                    </button>
                  </div>
                  <label
                    v-if="medicaoId"
                    class="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 cursor-pointer transition"
                  >
                    <input type="file" accept="image/*" capture="environment" class="hidden" @change="$emit('file-select', $event, cat.key)" />
                    <i class="pi pi-camera text-xl text-slate-400 mb-0.5" />
                    <span class="text-[10px] text-slate-500">Add</span>
                  </label>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
      <p v-if="!medicaoId" class="text-xs text-slate-500">
        Salve a medição primeiro para adicionar fotos à galeria.
      </p>
    </section>

    <!-- Concluída + Salvar + Validar Medição -->
    <section class="flex flex-col gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
      <div class="flex flex-wrap items-center gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.concluida"
            type="checkbox"
            class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
          />
          <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">
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
          variant="primary"
          :disabled="validando"
          class="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
          @click="$emit('validar-medicao')"
        >
          <i v-if="validando" class="pi pi-spin pi-spinner mr-1" />
          {{ validando ? 'Validando...' : 'Validar Medição' }}
        </Button>
      </div>
      <p v-if="projetoId" class="text-[11px] text-slate-500 dark:text-slate-400">
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
