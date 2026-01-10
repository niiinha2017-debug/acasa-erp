<template>
  <div class="form-group" :class="colSpan" @click.stop>
    <label v-if="label" class="form-label">
      {{ label }} <span v-if="required" class="required">*</span>
    </label>

    <div class="search-container">
      <span class="search-icon-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </span>

      <input
        class="form-input has-icon"
        type="text"
        :placeholder="placeholder"
        :required="required"
        :readonly="readonly"
        v-model="texto"
        @focus="abrir = true"
      />

      <div v-if="abrir" class="search-select__dropdown">
        <div
          v-for="opt in filtrados"
          :key="opt.value"
          class="search-select__option"
          @click="selecionar(opt)"
        >
          {{ opt.label }}
        </div>
        <div v-if="!filtrados.length" class="search-select__empty">
          Nenhum resultado encontrado
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Pesquisar...' },
  required: Boolean,
  readonly: Boolean,
  colSpan: { type: String, default: 'col-span-4' }
})

const emit = defineEmits(['update:modelValue'])

const texto = ref('')
const abrir = ref(false)

const filtrados = computed(() => {
  const termo = texto.value?.toLowerCase().trim() || ''
  if (!termo) return props.options
  return props.options.filter(opt => opt.label.toLowerCase().includes(termo))
})

function selecionar(opt) {
  texto.value = opt.label
  emit('update:modelValue', opt.value)
  abrir.value = false
}

watch(() => props.modelValue, (val) => {
  const opt = props.options.find(o => o.value === val)
  if (opt) texto.value = opt.label
  else if (!val) texto.value = ''
}, { immediate: true })

const fechar = () => { abrir.value = false }
onMounted(() => document.addEventListener('click', fechar))
onUnmounted(() => document.removeEventListener('click', fechar))
</script>

