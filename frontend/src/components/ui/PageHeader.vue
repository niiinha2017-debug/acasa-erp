<template>
  <div class="flex flex-col border-b border-slate-200 dark:border-slate-700">
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-6 py-6 md:px-8">
      <div class="flex items-center gap-4 min-w-0">
        <div v-if="icon" class="flex-shrink-0 text-slate-400 dark:text-slate-500 text-2xl">
          <i :class="icon"></i>
        </div>

        <div class="min-w-0 flex flex-col gap-1">
          <h1 class="text-2xl font-semibold text-slate-900 dark:text-white">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="text-sm text-slate-500 dark:text-slate-400">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
        <slot name="actions" />

        <Button
          v-if="showBack"
          variant="outline"
          size="sm"
          @click="onBack"
        >
          <i class="pi pi-arrow-left text-xs mr-2"></i>
          Voltar
        </Button>
      </div>
    </header>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Button from './Button.vue'

const router = useRouter()

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  backTo: { type: [String, Object], default: '' },
})

const emit = defineEmits(['back'])

function onBack() {
  emit('back')
  if (props.backTo) return router.push(props.backTo)
  router.back()
}
</script>
