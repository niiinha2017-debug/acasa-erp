<template>
  <div class="search-container relative flex flex-col gap-1.5" :class="[colSpan, { 'z-[100]': abrir }]" @click.stop>
    <label v-if="label" class="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-0.5">
      {{ label }} <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <div class="relative group">
      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/60 group-focus-within:text-brand-primary transition-all duration-300 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </span>

      <input
        ref="inputRef"
        :id="inputName"
        :name="inputName"
        v-model="texto"
        type="text"
        :placeholder="placeholder"
        :required="required"
        :readonly="readonly"
        autocomplete="off"
        class="w-full h-10 pl-11 pr-11 transition-all duration-200 outline-none border rounded-lg text-sm font-medium
               bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700
               focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 
               placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs"
        @focus="abrir = true"
        @input="abrir = true"
      />

      <button
        v-if="texto"
        type="button"
        @click.stop="limparBusca"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <Teleport to="body">
        <transition name="dropdown">
          <div
            v-if="abrir"
            ref="dropdownRef"
            :style="floatingStyles"
            class="fixed z-[10000] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 
                   rounded-xl shadow-2xl shadow-slate-200/50 dark:shadow-black/40 overflow-hidden pointer-events-auto"
          >
            <div v-if="filtrados.length" class="max-h-60 overflow-y-auto p-1.5 custom-scroll">
              <div
                v-for="opt in filtrados"
                :key="opt.value"
                class="flex items-center px-3 py-2.5 text-xs font-semibold rounded-lg cursor-pointer transition-all 
                       text-slate-600 dark:text-slate-300 hover:bg-brand-primary hover:text-white group"
                @click.stop="selecionar(opt)"
              >
                <div class="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-white/50 mr-3 transition-all"></div>
                <span class="truncate uppercase tracking-tight">{{ opt.label }}</span>
              </div>
            </div>

            <div v-else class="px-6 py-8 text-[10px] font-bold text-slate-400 uppercase italic tracking-widest text-center">
               Nenhum resultado encontrado
            </div>
          </div>
        </transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Pesquisar...' },
  required: Boolean,
  readonly: Boolean,
  colSpan: { type: String, default: 'col-span-4' },
  mode: { type: String, default: 'search' }, 
  labelKey: { type: String, default: 'label' },
  valueKey: { type: String, default: 'value' },
})

const emit = defineEmits(['update:modelValue'])

const texto = ref('')
const abrir = ref(false)
const inputRef = ref(null)
const dropdownRef = ref(null)
const inputName = `search_${Math.random().toString(36).substring(7)}`

const floatingStyles = ref({
  width: '0px',
  top: '0px',
  left: '0px'
})

// Cálculos de posição
const updatePosition = () => {
  if (abrir.value && inputRef.value) {
    const rect = inputRef.value.getBoundingClientRect()
    floatingStyles.value = {
      width: `${rect.width}px`,
      top: `${rect.bottom + 8}px`, // 8px abaixo do input
      left: `${rect.left}px`
    }
  }
}

// Watchers para disparar o reposicionamento
watch(abrir, async (val) => {
  if (val) {
    await nextTick()
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
  } else {
    window.removeEventListener('scroll', updatePosition, true)
    window.removeEventListener('resize', updatePosition)
  }
})

const normalizados = computed(() =>
  (props.options || []).map((o) => ({
    label: o?.[props.labelKey],
    value: o?.[props.valueKey],
  }))
)

const filtrados = computed(() => {
  const termo = String(texto.value || '').toLowerCase().trim()
  if (!termo) return normalizados.value
  return normalizados.value.filter((opt) =>
    String(opt.label || '').toLowerCase().includes(termo)
  )
})

function limparBusca() {
  texto.value = ''
  emit('update:modelValue', props.mode === 'select' ? null : '')
  abrir.value = false
  inputRef.value?.focus()
}

function selecionar(opt) {
  texto.value = opt?.label ? String(opt.label) : ''
  emit('update:modelValue', props.mode === 'select' ? opt.value : texto.value)
  abrir.value = false
}

watch(() => props.modelValue, (val) => {
  if (!val && val !== 0) {
    if (texto.value !== '') texto.value = ''
    return
  }
  if (props.mode === 'select') {
    const encontrada = normalizados.value.find((o) => String(o.value) === String(val))
    if (encontrada && texto.value !== encontrada.label) texto.value = encontrada.label
  } else if (texto.value !== String(val)) {
    texto.value = String(val)
  }
}, { immediate: true })

function fecharAoClicarFora(e) {
  if (!e.target.closest('.search-container') && !e.target.closest('[ref="dropdownRef"]')) {
    abrir.value = false
  }
}

onMounted(() => document.addEventListener('click', fecharAoClicarFora))
onUnmounted(() => {
  document.removeEventListener('click', fecharAoClicarFora)
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
})
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { 
  background: rgba(0,0,0,0.1); 
  border-radius: 10px; 
}
.dark .custom-scroll::-webkit-scrollbar-thumb { 
  background: rgba(255,255,255,0.1); 
}
</style>