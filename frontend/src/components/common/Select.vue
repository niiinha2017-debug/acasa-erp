<template>
  <div class="w-full flex flex-col gap-1.5" :class="{ 'opacity-60 pointer-events-none': disabled }">
    <label 
      v-if="label" 
      :for="selectId" 
      class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-0.5"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <div class="relative group">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        :multiple="multiple"
        :size="size"
        
        :class="[
          /* ESTRUTURA BASE: Mesmo design do Input */
          'w-full h-10 transition-all duration-200 border rounded-lg text-sm font-medium outline-none appearance-none',
          
          /* TEMA: Mesma paleta do Input */
          'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
          
          /* PLACEHOLDER / DEFAULT OPTION */
          { 'text-slate-400 dark:text-slate-500': !modelValue },
          
          /* ESTADOS: Foco elegante com anel fino */
          error 
            ? 'border-red-500 ring-2 ring-red-500/10' 
            : 'focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 hover:border-slate-300 dark:hover:border-slate-600',
          
          /* PADDINGS: Espaço para a seta */
          'pl-4 pr-10',
          
          /* CASE CONTROL */
          { 'uppercase font-bold tracking-wide': forceUpper },
          
          /* MULTIPLE SELECT */
          multiple ? 'h-auto min-h-[40px] py-2' : ''
        ]"
        
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
      >
        <!-- Option placeholder -->
        <option 
          v-if="placeholder && !multiple" 
          value="" 
          disabled 
          :selected="!modelValue"
          class="text-slate-400 dark:text-slate-500"
        >
          {{ placeholder }}
        </option>
        
        <!-- Options -->
        <option
          v-for="option in normalizedOptions"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
          :class="{
            'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20': 
              option.value === modelValue && !multiple
          }"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- Seta customizada (apenas para single select) -->
      <div 
        v-if="!multiple"
        class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-brand-primary transition-colors duration-200"
      >
        <i class="pi pi-chevron-down text-[10px]"></i>
      </div>
    </div>

    <Transition name="slide-up">
      <span v-if="error" class="text-[10px] font-bold text-red-500 ml-0.5 tracking-wide">
        {{ error }}
      </span>
    </Transition>

    <!-- Se for multiple, mostrar contador -->
    <div 
      v-if="multiple && Array.isArray(modelValue) && modelValue.length > 0" 
      class="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-1"
    >
      {{ modelValue.length }} item{{ modelValue.length !== 1 ? 's' : '' }} selecionado{{ modelValue.length !== 1 ? 's' : '' }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { upper } from '@/utils/text'

const props = defineProps({
  modelValue: [String, Number, Array, Boolean],
  options: {
    type: Array,
    default: () => []
  },
  label: String,
  placeholder: String,
  error: String,
  disabled: Boolean,
  required: Boolean,
  multiple: Boolean,
  size: Number,
  id: String,
  forceUpper: { type: Boolean, default: false },
  labelKey: { type: String, default: 'label' },
  valueKey: { type: String, default: 'value' }
})

const emit = defineEmits(['update:modelValue', 'change', 'blur', 'focus'])

const selectId = ref(props.id || `select-${Math.random().toString(36).slice(2)}`)

// Normaliza as opções para garantir que tenham label e value
const normalizedOptions = computed(() => {
  return props.options.map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { label: String(opt), value: opt }
    }
    return {
      label: opt[props.labelKey] || String(opt.value || ''),
      value: opt[props.valueKey] !== undefined ? opt[props.valueKey] : opt.value,
      disabled: opt.disabled || false
    }
  })
})

const handleChange = (e) => {
  let value
  
  if (props.multiple) {
    // Para múltipla seleção
    value = Array.from(e.target.selectedOptions).map(opt => opt.value)
  } else {
    // Para seleção única
    value = e.target.value
    
    // Converter para tipo apropriado
    if (value === 'true') value = true
    else if (value === 'false') value = false
    else if (!isNaN(value) && value !== '') value = Number(value)
  }
  
  emit('update:modelValue', value)
  emit('change', value)
}

const handleBlur = (e) => emit('blur', e)
const handleFocus = (e) => emit('focus', e)
</script>

<style scoped>
/* Estilos específicos do select */
select::-ms-expand {
  display: none; /* Remove seta padrão no IE/Edge */
}

/* Estilização das opções */
option {
  background-color: white;
  color: #1e293b;
}

.dark option {
  background-color: #1e293b;
  color: #e2e8f0;
}

/* Para múltipla seleção */
select[multiple] option:checked {
  background-color: var(--color-brand-primary, #3b82f6);
  color: white;
}

/* Animações */
.slide-up-enter-active { transition: all 0.2s ease-out; }
.slide-up-enter-from { opacity: 0; transform: translateY(-4px); }
</style>