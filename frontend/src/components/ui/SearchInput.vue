<template>
  <div
    ref="rootRef"
    class="search-container relative flex flex-col gap-1.5"
    :class="[colSpan, { 'z-[100]': open }]"
    @click.stop
  >
    <label v-if="label" class="text-xs font-semibold tracking-wide text-text-soft ml-0.5 mb-0.5">
      {{ label }} <span v-if="required" class="text-rose-500 ml-0.5">*</span>
    </label>

    <div class="relative group">
      <span
        class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-all duration-300 pointer-events-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        :disabled="disabled"
        autocomplete="off"
        class="w-full h-10 pl-10 pr-16 transition-all duration-200 outline-none border rounded-xl text-sm
               bg-bg-card text-text-main border-border-ui
               focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 hover:border-slate-300 dark:hover:border-slate-600
               placeholder:text-slate-400 placeholder:font-normal"
        @focus="onFocus"
        @input="onInput"
        @keydown="onKeydown"
        @blur="onBlur"
      />

      <button
        v-if="props.mode === 'select'"
        type="button"
        @pointerdown.prevent.stop="toggleDropdown"
        class="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
        :disabled="disabled"
        aria-label="Abrir opções"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <button
        v-if="texto"
        type="button"
        @pointerdown.prevent.stop="limparBusca"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-1"
        :disabled="disabled"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <Teleport to="body">
        <transition name="dropdown">
          <div
            v-if="open"
            ref="dropdownRef"
            :style="floatingStyles"
            class="fixed z-[10000] bg-bg-card border border-border-ui
                   rounded-lg shadow-xl shadow-slate-200/50 dark:shadow-black/40 overflow-hidden pointer-events-auto"
            @pointerdown.prevent
          >
            <div v-if="filtrados.length" class="max-h-60 overflow-y-auto p-1 custom-scroll">
              <div
                v-for="opt in filtrados"
                :key="opt.value"
                class="flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-all
                       text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-primary"
                @pointerdown.prevent.stop="selecionar(opt)"
              >
                <div class="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mr-3 transition-all shrink-0"></div>
                <span class="truncate font-medium">{{ opt.label }}</span>
              </div>
            </div>

            <div v-else class="px-4 py-6 text-xs font-medium text-slate-400 text-center">
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
  disabled: Boolean,
  colSpan: { type: String, default: 'col-span-4' },
  mode: { type: String, default: 'search' }, // 'search' | 'select'
  labelKey: { type: String, default: 'label' },
  valueKey: { type: String, default: 'value' },
})

const emit = defineEmits(['update:modelValue'])

const uid = `si_${Math.random().toString(36).slice(2)}`
const inputName = `search_${Math.random().toString(36).slice(2)}`

const rootRef = ref(null)
const inputRef = ref(null)
const dropdownRef = ref(null)

const texto = ref('')
const open = ref(false)
const typing = ref(false)

const floatingStyles = ref({ width: '0px', top: '0px', left: '0px' })

const normalizados = computed(() =>
  (props.options || []).map((o) => ({
    label: o?.[props.labelKey],
    value: o?.[props.valueKey],
  })),
)

const filtrados = computed(() => {
  const termo = String(texto.value || '').toLowerCase().trim()
  if (!termo) return normalizados.value
  return normalizados.value.filter((opt) =>
    String(opt.label || '').toLowerCase().includes(termo),
  )
})

function isDisabled() {
  return !!props.disabled || !!props.readonly
}

function updatePosition() {
  if (!open.value || !inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  floatingStyles.value = {
    width: `${rect.width}px`,
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
  }
}

function abrirDropdown() {
  if (isDisabled()) return

  // garante 1 aberto por vez
  window.dispatchEvent(new CustomEvent('searchinput:open', { detail: { uid } }))

  open.value = true
  nextTick(updatePosition)
}

function toggleDropdown() {
  if (isDisabled()) return
  if (open.value) {
    fecharDropdown()
  } else {
    abrirDropdown()
    inputRef.value?.focus()
  }
}

function fecharDropdown() {
  if (!open.value) return
  open.value = false
  typing.value = false
}

function onFocus() {
  abrirDropdown()
}

function onInput() {
  if (isDisabled()) return
  typing.value = true
  abrirDropdown()
  if (props.mode === 'search') emit('update:modelValue', texto.value)
}

function onKeydown(e) {
  if (e.key === 'Escape') return fecharDropdown()
  if (e.key === 'Tab') fecharDropdown() // deixa tab normal, só fecha
}

function onBlur() {
  // fecha ao ir para outro input; seleção usa pointerdown, então não perde clique
  setTimeout(() => {
    const active = document.activeElement
    const insideRoot = rootRef.value?.contains(active)
    const insideDrop = dropdownRef.value?.contains(active)
    if (!insideRoot && !insideDrop) fecharDropdown()
    if (props.mode === 'select') syncTextoFromModel()
  }, 0)
}

function limparBusca() {
  texto.value = ''
  emit('update:modelValue', props.mode === 'select' ? null : '')
  fecharDropdown()
  inputRef.value?.focus()
}

function selecionar(opt) {
  const label = opt?.label ? String(opt.label) : ''
  texto.value = label
  emit('update:modelValue', props.mode === 'select' ? opt.value : label)
  typing.value = false
  fecharDropdown()
}

function syncTextoFromModel() {
  if (props.mode !== 'select') return
  const val = props.modelValue

  if (!val && val !== 0) {
    if (texto.value !== '') texto.value = ''
    return
  }

  const encontrada = normalizados.value.find((o) => String(o.value) === String(val))
  const label = encontrada?.label ?? ''
  if (!typing.value && texto.value !== label) texto.value = label
}

watch(
  () => props.modelValue,
  () => {
    if (props.mode === 'select') {
      if (open.value && typing.value) return
      syncTextoFromModel()
      return
    }
    const str = props.modelValue == null ? '' : String(props.modelValue)
    if (!typing.value && texto.value !== str) texto.value = str
  },
  { immediate: true },
)

watch(open, async (val) => {
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

function onDocPointerDown(e) {
  const el = e.target
  const insideRoot = rootRef.value?.contains(el)
  const insideDrop = dropdownRef.value?.contains(el)
  if (!insideRoot && !insideDrop) fecharDropdown()
}

function onDocFocusIn(e) {
  const el = e.target
  const insideRoot = rootRef.value?.contains(el)
  const insideDrop = dropdownRef.value?.contains(el)
  if (!insideRoot && !insideDrop) fecharDropdown()
}

function onOtherOpen(ev) {
  if (ev?.detail?.uid && ev.detail.uid !== uid) fecharDropdown()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
  document.addEventListener('focusin', onDocFocusIn, true)
  window.addEventListener('searchinput:open', onOtherOpen)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  document.removeEventListener('focusin', onDocFocusIn, true)
  window.removeEventListener('searchinput:open', onOtherOpen)
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
