<template>
  <div
    class="flex flex-col"
    :class="minimal ? 'border-b border-border-ui pb-4' : 'border-b border-border-ui'"
  >
    <header
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      :class="minimal ? 'px-0 py-0' : 'px-6 py-6 md:px-8 gap-6'"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div v-if="icon" class="flex-shrink-0 text-text-soft" :class="minimal ? 'text-lg' : 'text-2xl'">
          <i :class="icon"></i>
        </div>
        <div class="min-w-0 flex flex-col gap-0.5">
          <h1 class="font-semibold text-text-main" :class="minimal ? 'text-xl' : 'text-2xl'">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="text-sm text-text-soft">
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
  minimal: { type: Boolean, default: false },
})

const emit = defineEmits(['back'])

function onBack() {
  emit('back')
  if (props.backTo) return router.push(props.backTo)
  router.back()
}
</script>
