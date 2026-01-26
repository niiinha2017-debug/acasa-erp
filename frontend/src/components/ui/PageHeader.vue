<template>
<header 
  class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-6 py-8 md:px-10 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md"
>
    <div class="flex items-center gap-5 min-w-0">
      <div
        v-if="icon"
        class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300"
        :class="iconClass"
      >
        <i :class="icon" class="text-xl"></i>
      </div>

      <div class="min-w-0 flex flex-col gap-1">
        <h2 class="text-xl md:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-tight transition-colors">
          {{ title }}
        </h2>

        <p v-if="subtitle" class="text-[10px] md:text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] transition-colors">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
      <slot name="actions" />

      <Button
        v-if="showBack"
        variant="secondary"
        size="sm"
        type="button"
        class="!rounded-lg !px-4"
        @click="onBack"
      >
        <i class="pi pi-arrow-left mr-2 text-[9px]"></i>
        Voltar
      </Button>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Button from './Button.vue'

const router = useRouter()

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  // Estilo padrão mais "clean"
  iconClass: { type: String, default: 'bg-white dark:bg-slate-800 text-brand-primary' },
  showBack: { type: Boolean, default: true },
  backTo: { type: [String, Object], default: '' },
})

function onBack() {
  if (props.backTo) return router.push(props.backTo)
  router.back()
}
</script>