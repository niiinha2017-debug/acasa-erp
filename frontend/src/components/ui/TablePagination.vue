<template>
  <div class="flex items-center justify-between gap-3 pt-4 border-t border-border-ui">
    <div class="text-xs font-medium text-text-soft">
      {{ from }}-{{ to }} de {{ total }}
    </div>

    <div class="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        type="button"
        class="!h-8 !px-2 !rounded-lg"
        :disabled="page <= 1"
        @click="$emit('update:page', page - 1)"
      >
        <i class="pi pi-chevron-left text-[10px]"></i>
      </Button>

      <div class="flex items-center gap-1">
        <button
          v-for="p in pagesToShow"
          :key="p.key"
          type="button"
          class="min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold border transition-colors"
          :class="p.num === page
            ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
            : 'bg-bg-card text-text-soft border-border-ui hover:bg-slate-50 hover:text-text-main hover:border-slate-300 dark:hover:bg-slate-800'"
          :disabled="p.disabled"
          @click="p.num && $emit('update:page', p.num)"
        >
          {{ p.label }}
        </button>
      </div>

      <Button
        variant="secondary"
        size="sm"
        type="button"
        class="!h-8 !px-2 !rounded-lg"
        :disabled="page >= totalPages"
        @click="$emit('update:page', page + 1)"
      >
        <i class="pi pi-chevron-right text-[10px]"></i>
      </Button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  total: { type: Number, default: 0 },
  maxButtons: { type: Number, default: 5 },
})

defineEmits(['update:page'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const to = computed(() => Math.min(props.total, props.page * props.pageSize))

const pagesToShow = computed(() => {
  const tp = totalPages.value
  const cur = props.page
  const max = props.maxButtons

  let start = Math.max(1, cur - Math.floor(max / 2))
  let end = Math.min(tp, start + max - 1)
  start = Math.max(1, end - max + 1)

  const items = []

  if (start > 1) {
    items.push({ key: 'p1', num: 1, label: '1' })
    if (start > 2) items.push({ key: 'dots1', num: null, label: '...', disabled: true })
  }

  for (let p = start; p <= end; p++) {
    items.push({ key: `p${p}`, num: p, label: String(p) })
  }

  if (end < tp) {
    if (end < tp - 1) items.push({ key: 'dots2', num: null, label: '...', disabled: true })
    items.push({ key: `p${tp}`, num: tp, label: String(tp) })
  }

  return items
})
</script>
