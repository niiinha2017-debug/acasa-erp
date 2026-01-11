<template>
  <div class="search-container relative flex flex-col gap-1.5" :class="[colSpan, { 'z-50': abrir }]" @click.stop>
    <label v-if="label" class="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
      {{ label }} <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>

    <div class="relative group">
      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary group-focus-within:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </span>

      <input
        class="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition-all duration-200
               focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 placeholder:text-gray-400 placeholder:font-normal"
        type="text"
        :placeholder="placeholder"
        :required="required"
        :readonly="readonly"
        v-model="texto"
        @focus="abrir = true"
        @input="abrir = true"
      />

      <transition name="fade">
        <div
          v-if="abrir"
          class="absolute top-[calc(100%+8px)] left-0 right-0 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl z-[9999] overflow-hidden"
        >
          <div v-if="filtrados.length" class="max-h-60 overflow-y-auto p-1.5">
            <div
              v-for="opt in filtrados"
              :key="opt.value"
              class="flex items-center px-4 py-2.5 text-sm font-medium text-gray-600 rounded-lg cursor-pointer transition-colors hover:bg-brand-primary/10 hover:text-brand-primary"
              @click.stop="selecionar(opt)"
            >
              {{ opt.label }}
            </div>
          </div>

          <div v-else class="px-4 py-3 text-sm font-semibold text-gray-400">
            Nenhum resultado
          </div>
        </div>
      </transition>
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
  colSpan: { type: String, default: 'col-span-4' },
})

const emit = defineEmits(['update:modelValue'])

const texto = ref('')
const abrir = ref(false)

const filtrados = computed(() => {
  const termo = String(texto.value || '').toLowerCase().trim()
  if (!termo) return props.options
  return props.options.filter((opt) =>
    String(opt.label || '').toLowerCase().includes(termo)
  )
})

function selecionar(opt) {
  texto.value = opt.label
  emit('update:modelValue', opt.value)
  abrir.value = false
}

function fecharAoClicarFora(e) {
  if (!e.target.closest('.search-container')) {
    abrir.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    const opt = props.options.find((o) => o.value === val)
    if (opt) texto.value = opt.label
    else if (!val) texto.value = ''
  },
  { immediate: true }
)

onMounted(() => document.addEventListener('click', fecharAoClicarFora))
onUnmounted(() => document.removeEventListener('click', fecharAoClicarFora))
</script>
