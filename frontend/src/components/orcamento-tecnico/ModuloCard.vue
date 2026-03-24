<template>
  <div class="border-t border-border-ui first:border-t-0" :class="ferragensAbertas ? 'bg-bg-page/40' : ''">

    <!-- Linha principal -->
    <div class="flex items-center gap-2 px-10 py-1.5 min-h-[2.25rem]">
      <input
        v-model="mod.nome"
        type="text"
        placeholder="Nome do módulo"
        class="flex-1 min-w-0 h-7 px-2 rounded border border-transparent bg-transparent text-xs text-text-main
               hover:border-border-ui focus:outline-none focus:border-brand-primary focus:bg-bg-card transition-colors"
      />

      <!-- Dimensões -->
      <div class="flex items-center gap-1 shrink-0">
        <input v-model.number="mod.largura_mm" type="number" min="0" step="1" placeholder="0"
          class="w-16 h-7 px-1.5 text-right text-xs tabular-nums rounded border border-transparent bg-transparent
                 hover:border-border-ui focus:outline-none focus:border-brand-primary focus:bg-bg-card transition-colors text-text-main" />
        <span class="text-[10px] text-text-faint">×</span>
        <input v-model.number="mod.altura_mm" type="number" min="0" step="1" placeholder="0"
          class="w-16 h-7 px-1.5 text-right text-xs tabular-nums rounded border border-transparent bg-transparent
                 hover:border-border-ui focus:outline-none focus:border-brand-primary focus:bg-bg-card transition-colors text-text-main" />
        <span class="text-[10px] text-text-faint">mm</span>
      </div>

      <!-- Seletor de material -->
      <div class="w-44 shrink-0 flex items-center gap-1 rounded border px-1.5 transition-colors"
        :class="isPromob && mod.material_nao_encontrado
          ? 'border-rose-300 bg-rose-50/60'
          : 'border-transparent hover:border-border-ui focus-within:border-brand-primary focus-within:bg-bg-card'">
        <SearchInput
          v-model="mod.material_id"
          mode="select"
          hide-search-icon
          :options="materialOptions"
          :placeholder="isPromob && mod.material_nao_encontrado ? 'Não encontrado' : 'Buscar MDF'"
          class="flex-1 [&_.search-container]:!gap-0 [&_.search-container]:!h-7 [&_input]:!h-7 [&_input]:!text-xs [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!px-1 [&_input]:!shadow-none"
          @update:modelValue="$emit('selecionar-material', mod, $event)"
        />
        <i v-if="isPromob && mod.material_nao_encontrado" class="pi pi-exclamation-triangle text-[10px] text-rose-500 shrink-0" />
      </div>

      <!-- Custo -->
      <span class="w-20 shrink-0 text-right text-xs font-bold tabular-nums" :class="custoColorClass">
        {{ formatCurrency(custoModulo) }}
      </span>

      <!-- Toggle ferragens -->
      <button type="button"
        class="relative shrink-0 h-6 px-2 rounded border text-[10px] transition-colors flex items-center gap-1"
        :class="ferragensAbertasClass"
        @click="$emit('toggle-ferragens', mod)">
        <i class="pi pi-wrench text-[9px]" />
        <span v-if="qtdFerragensPendentes > 0"
          class="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-px">
          {{ qtdFerragensPendentes }}
        </span>
      </button>

      <!-- Remover -->
      <button type="button"
        class="shrink-0 h-6 w-6 flex items-center justify-center rounded text-text-faint hover:bg-red-50 hover:text-red-400 transition-colors"
        @click="$emit('remover')">
        <i class="pi pi-minus text-[10px]" />
      </button>
    </div>

    <!-- Hint material Promob -->
    <p v-if="isPromob && mod.material_nome_original"
      class="px-10 pb-1.5 text-[11px]"
      :class="mod.material_nao_encontrado ? 'text-rose-600 font-semibold' : 'text-sky-700'">
      Arquivo: {{ mod.material_nome_original }}
    </p>

    <!-- Painel de ferragens -->
    <div v-show="ferragensAbertas" class="border-t border-dashed border-border-ui bg-bg-page/60 px-10 py-2 flex flex-col gap-0">

      <!-- Buscar ferragem -->
      <div class="pb-2 border-b border-border-ui/50 mb-1">
        <SearchInput
          v-model="mod._ferragemBuscaId"
          mode="select"
          hide-search-icon
          :options="ferragemOptions"
          placeholder="Adicionar ferragem..."
          class="w-full [&_.search-container]:!gap-0 [&_.search-container]:!h-7 [&_input]:!h-7 [&_input]:!text-xs [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!px-1 [&_input]:!shadow-none"
          @update:modelValue="$emit('selecionar-ferragem', mod, $event)"
        />
      </div>

      <!-- Header colunas -->
      <template v-if="mod.ferragens.length">
        <div class="grid grid-cols-[1fr_56px_88px_88px_24px] gap-2 px-0.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-faint">
          <span>Ferragem</span>
          <span class="text-right">Qtd</span>
          <span class="text-right">Venda un</span>
          <span class="text-right">Total</span>
          <span />
        </div>

        <div v-for="(fer, fIdx) in mod.ferragens" :key="fer._id"
          class="grid grid-cols-[1fr_56px_88px_88px_24px] gap-2 items-center py-1.5 border-t border-border-ui/40 first:border-t-0">
          <div class="min-w-0">
            <span class="block truncate text-[11px]"
              :class="fer.nao_encontrada ? 'text-rose-600 font-semibold' : 'text-text-main'"
              :title="nomeFerragemFn(fer)">
              {{ nomeFerragemFn(fer) }}
            </span>
            <SearchInput v-if="fer.nao_encontrada"
              v-model="fer._resolver_produto_id"
              mode="select"
              :options="ferragemOptions"
              placeholder="Selecionar ferragem válida"
              class="mt-0.5 [&_.search-container]:!gap-0 [&_.search-container]:!h-6 [&_input]:!h-6 [&_input]:!text-[10px] [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!px-0"
              @update:modelValue="$emit('resolver-ferragem', mod, fer, $event)"
            />
          </div>
          <input v-model.number="fer.quantidade" type="number" min="1" step="1"
            class="w-full bg-transparent border-0 text-[11px] tabular-nums text-right text-text-main focus:outline-none" />
          <span class="text-right text-[11px] tabular-nums text-text-soft">
            {{ formatCurrency(precoVendaFerragemFn(fer)) }}
          </span>
          <span class="text-right text-[11px] tabular-nums font-semibold" :class="custoColorClass">
            {{ formatCurrency(custoFerragemFn(fer)) }}
          </span>
          <button type="button"
            class="h-6 w-6 flex items-center justify-center rounded text-text-faint hover:bg-red-50 hover:text-red-400 transition-colors"
            @click="$emit('remover-ferragem', mod, fIdx)">
            <i class="pi pi-times text-[9px]" />
          </button>
        </div>
      </template>

      <p v-else class="text-[11px] text-text-faint italic py-1">
        Nenhuma ferragem — use o campo acima para adicionar.
      </p>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const props = defineProps({
  mod: { type: Object, required: true },
  materialOptions: { type: Array, default: () => [] },
  ferragemOptions: { type: Array, default: () => [] },
  custoModulo: { type: Number, default: 0 },
  ferragensAbertas: { type: Boolean, default: false },
  qtdFerragensPendentes: { type: Number, default: 0 },
  isPromob: { type: Boolean, default: false },
  isTecnico: { type: Boolean, default: false },
  nomeFerragemFn: { type: Function, required: true },
  precoVendaFerragemFn: { type: Function, required: true },
  custoFerragemFn: { type: Function, required: true },
})

defineEmits([
  'selecionar-material',
  'toggle-ferragens',
  'remover',
  'selecionar-ferragem',
  'resolver-ferragem',
  'remover-ferragem',
])

const custoColorClass = computed(() => {
  if (props.isTecnico) return 'text-brand-primary'
  return props.isPromob ? 'text-sky-700' : 'text-amber-700'
})

const ferragensAbertasClass = computed(() => {
  if (!props.ferragensAbertas)
    return 'border-border-ui text-text-faint hover:bg-bg-page hover:text-text-soft'
  if (props.isPromob && !props.isTecnico)
    return 'border-sky-300 bg-sky-50 text-sky-700'
  return 'border-amber-300 bg-amber-50 text-amber-700'
})

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}
</script>
