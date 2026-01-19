<template>
  <header 
    class="flex items-center justify-between gap-6 px-10 py-10 transition-all duration-500"
    :class="['bg-[var(--bg-page)]/50 backdrop-blur-sm']"
  >
    <div class="flex items-center gap-6 min-w-0">
      <div
        v-if="icon"
        class="w-16 h-16 rounded-[2rem] flex items-center justify-center flex-shrink-0 shadow-xl border border-[var(--border-ui)] transition-all duration-300"
        :class="iconClass"
      >
        <i :class="icon" class="text-2xl"></i>
      </div>

      <div class="min-w-0 flex flex-col gap-2">
        <h2 class="text-3xl font-black tracking-tighter text-[var(--text-main)] uppercase leading-none transition-colors duration-300">
          {{ title }}
        </h2>

        <p v-if="subtitle" class="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] opacity-80 transition-colors">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-4 flex-shrink-0">
      <slot name="actions" />

      <Button
        v-if="showBack"
        variant="secondary"
        size="md"
        type="button"
        class="!rounded-2xl !px-6 shadow-sm"
        @click="onBack"
      >
        <i class="pi pi-arrow-left mr-3 text-[10px]"></i>
        <span class="text-[11px] font-black uppercase tracking-widest">Voltar</span>
      </Button>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Button from './Button.vue' // Garantindo o import do seu botão tunado

const router = useRouter()

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  // Dica: No Dark Mode, use "bg-slate-800 text-white" ou "bg-brand-primary text-white"
  iconClass: { type: String, default: 'bg-slate-900 dark:bg-brand-primary text-white' },
  showBack: { type: Boolean, default: true },
  backTo: { type: [String, Object], default: '' },
})

function onBack() {
  if (props.backTo) return router.push(props.backTo)
  router.back()
}
</script>