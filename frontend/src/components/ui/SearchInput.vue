<template>
  <div class="search-container relative flex flex-col gap-2" :class="[colSpan, { 'z-[100]': abrir }]" @click.stop>
    <label v-if="label" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
      {{ label }} <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <div class="relative group">
      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary group-focus-within:scale-110 transition-all duration-300 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
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
        autocomplete="one-time-code"
        role="presentation"
        class="w-full h-12 pl-12 pr-12 transition-all duration-300 outline-none border rounded-2xl text-[13px] font-bold
               bg-[var(--bg-page)] text-[var(--text-main)] border-[var(--border-ui)]
               focus:border-brand-primary focus:ring-[6px] focus:ring-brand-primary/10 
               placeholder:text-slate-600 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
        @focus="abrir = true"
        @input="abrir = true"
      />

      <button
        v-if="texto"
        type="button"
        @click.stop="limparBusca"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400 transition-colors p-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <transition name="fade-slide">
        <div
          v-if="abrir"
          class="absolute top-[calc(100%+8px)] left-0 w-full z-[9999] 
                 bg-[var(--bg-card)] backdrop-blur-xl 
                 border border-[var(--border-ui)] rounded-[1.5rem] 
                 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
        >
          <div v-if="filtrados.length" class="max-h-60 overflow-y-auto p-2 custom-scroll">
            <div
              v-for="opt in filtrados"
              :key="opt.value"
              class="flex items-center px-4 py-3 text-[11px] font-black uppercase tracking-wide rounded-xl cursor-pointer transition-all 
                     text-[var(--text-main)] hover:bg-brand-primary hover:text-white group"
              @click.stop="selecionar(opt)"
            >
              <div class="w-1.5 h-1.5 rounded-full bg-brand-primary group-hover:bg-white mr-3 transition-all"></div>
              {{ opt.label }}
            </div>
          </div>

          <div v-else class="px-6 py-6 text-[9px] font-black text-slate-500 uppercase italic tracking-[0.2em] text-center">
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
  mode: { type: String, default: 'search' }, 
  labelKey: { type: String, default: 'label' },
  valueKey: { type: String, default: 'value' },
})

const emit = defineEmits(['update:modelValue'])

const texto = ref('')
const abrir = ref(false)
const inputRef = ref(null)

// Nome aleatório para "enganar" o autofill do Chrome
const inputName = `search_${Math.random().toString(36).substring(7)}`

// Normalização de opções
const normalizados = computed(() =>
  (props.options || []).map((o) => ({
    label: o?.[props.labelKey],
    value: o?.[props.valueKey],
  }))
)

// Filtro de resultados
const filtrados = computed(() => {
  const termo = String(texto.value || '').toLowerCase().trim()
  const lista = normalizados.value
  if (!termo) return lista
  return lista.filter((opt) =>
    String(opt.label || '').toLowerCase().includes(termo)
  )
})

// Função para limpar o campo e devolver o foco
function limparBusca() {
  texto.value = ''
  emit('update:modelValue', props.mode === 'select' ? null : '')
  abrir.value = false
  inputRef.value?.focus()
}

function selecionar(opt) {
  const label = opt?.label ? String(opt.label) : ''
  texto.value = label
  emit('update:modelValue', props.mode === 'select' ? opt.value : label)
  abrir.value = false
}

// Watchers de Sincronização
watch(texto, (novoTexto) => {
  if (props.mode === 'search') {
    emit('update:modelValue', novoTexto)
  }
})

watch(
  () => props.modelValue,
  (val) => {
    if (val === null || val === undefined || val === '') {
      if (texto.value !== '') texto.value = ''
      return
    }

    if (props.mode === 'search') {
      const nv = String(val)
      if (texto.value !== nv) texto.value = nv
    } else {
      const encontrada = normalizados.value.find((o) => String(o.value) === String(val))
      const label = encontrada?.label ? String(encontrada.label) : ''
      if (texto.value !== label) texto.value = label
    }
  },
  { immediate: true }
)

// Fechar ao clicar fora
function fecharAoClicarFora(e) {
  if (!e.target.closest('.search-container')) abrir.value = false
}

onMounted(() => document.addEventListener('click', fecharAoClicarFora))
onUnmounted(() => document.removeEventListener('click', fecharAoClicarFora))
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.max-h-72::-webkit-scrollbar { width: 4px; }
.max-h-72::-webkit-scrollbar-track { background: transparent; }
.max-h-72::-webkit-scrollbar-thumb { 
  background: rgba(255, 255, 255, 0.1); 
  border-radius: 10px; 
}
.max-h-72::-webkit-scrollbar-thumb { 
  background: rgba(0, 0, 0, 0.1); /* Cor cinza suave para fundo branco */
  border-radius: 10px; 
}
</style>
