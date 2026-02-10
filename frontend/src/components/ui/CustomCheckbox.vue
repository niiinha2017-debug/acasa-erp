<template>
  <label 
    class="flex items-start gap-3 p-2 rounded-xl transition-all duration-200 select-none group"
    :class="[
      disabled 
        ? 'cursor-not-allowed opacity-40' 
        : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50', 
    ]"
  >
    <div class="relative flex-shrink-0 mt-0.5">
      <input
        type="checkbox"
        class="peer sr-only"
        :checked="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <div class="checkbox-orbit">
        <div class="checkbox-core"></div>
        <div class="checkbox-tick checkbox-tick-long"></div>
        <div class="checkbox-tick checkbox-tick-short"></div>
      </div>
    </div>
    
    <div v-if="label || $slots.default" class="flex flex-col pt-0.5 pointer-events-none">
      <span class="text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description" class="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
        {{ description }}
      </span>
    </div>
  </label>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  label: String,
  description: String,
  disabled: Boolean
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.checkbox-orbit {
  --cb-size: 32px;
  width: var(--cb-size);
  height: var(--cb-size);
  border-radius: 9999px;
  padding: 3px;
  background: linear-gradient(
    135deg,
    var(--color-brand-dark),
    color-mix(in srgb, var(--color-brand-dark) 55%, var(--color-brand-primary)),
    var(--color-brand-primary)
  );
  position: relative;
  transition: padding 0.15s ease;
}

.checkbox-core {
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  background: var(--bg-card);
  transition: transform 0.2s ease;
}

.checkbox-tick {
  position: absolute;
  height: 4px;
  border-radius: 2px;
  background: #fff;
  transition: transform 0.25s ease;
}

.checkbox-tick-long {
  width: 22px;
  left: 12px;
  top: 50%;
  transform: translate(18px, -16px) rotate(-41deg);
}

.checkbox-tick-short {
  width: 14px;
  left: 8px;
  top: 55%;
  transform: translate(-18px, -16px) rotate(45deg);
}

input:checked + .checkbox-orbit .checkbox-core {
  transform: scale(0);
}

input:checked + .checkbox-orbit .checkbox-tick-long,
input:checked + .checkbox-orbit .checkbox-tick-short {
  transform: translate(0, 0) rotate(var(--tick-rotate, 0));
}

.checkbox-tick-long { --tick-rotate: -41deg; }
.checkbox-tick-short { --tick-rotate: 45deg; }

label:hover .checkbox-orbit {
  padding: 3.5px;
}

input:disabled + .checkbox-orbit {
  opacity: 0.5;
}
</style>
