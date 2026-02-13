<template>
  <div class="relative inline-flex" ref="menuRef">
    <button
      @click.stop="toggleMenu"
      type="button"
      class="flex items-center justify-center gap-2 px-3.5 py-2 transition-all duration-200 rounded-xl group select-none"
      :class="isOpen
        ? 'bg-white dark:bg-slate-800 text-text-main shadow-sm border border-border-ui'
        : 'text-text-soft hover:bg-white/80 hover:text-text-main dark:hover:bg-slate-800/80 border border-transparent'"
    >
      <span class="text-[11px] font-extrabold uppercase tracking-[0.14em]">{{ label }}</span>
      <i
        class="pi pi-chevron-down text-[10px] opacity-50 transition-transform duration-300"
        :class="{ 'rotate-180': isOpen }"
      ></i>
    </button>

    <transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute left-0 top-full mt-2 w-64 bg-bg-card rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-border-ui z-[9999] overflow-hidden py-1.5 transition-all"
      >
        <div v-if="visibleItems.length === 0" class="px-4 py-3 text-xs text-text-soft italic text-center">
          Nenhum item disponivel
        </div>

        <div v-else class="flex flex-col p-1">
          <template v-for="(item, index) in visibleItems" :key="index">
            <hr v-if="item.divider" class="my-1.5 border-border-ui mx-2" />

            <a
              v-else
              @click="handleNav(item.to)"
              class="flex items-center px-3 py-2.5 rounded-xl text-text-soft hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-primary cursor-pointer transition-all duration-150 group/item"
            >
              <div class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 group-hover/item:bg-white dark:group-hover/item:bg-slate-700 mr-2.5 transition-colors">
                <i v-if="item.icon" :class="[item.icon, 'pi text-xs opacity-70 group-hover/item:text-brand-primary']"></i>
              </div>

              <div class="flex flex-col">
                <span class="text-xs font-medium">{{ item.label }}</span>
              </div>
            </a>
          </template>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { can } from '@/services/permissions'

const props = defineProps({
  label: { type: String, required: true },
  items: { type: Array, required: true },
})

const router = useRouter()
const route = useRoute()
const isOpen = ref(false)
const menuRef = ref(null)

const toggleMenu = () => {
  if (!isOpen.value) {
    window.dispatchEvent(new CustomEvent('close-all-nav-menus'))
    isOpen.value = true
  } else {
    isOpen.value = false
  }
}

const handleClose = () => (isOpen.value = false)

const visibleItems = computed(() => {
  return (props.items || []).filter((item) => {
    if (item.divider) return true
    if (!item.perm) return true
    try {
      return can(item.perm)
    } catch (e) {
      return true
    }
  })
})

const handleNav = (to) => {
  isOpen.value = false
  const target = router.resolve(to).fullPath
  if (target === route.fullPath) {
    window.dispatchEvent(new CustomEvent('acasa-tabs-duplicate-current', { detail: { to: target } }))
    return
  }
  router.push(target)
}

const closeOutside = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.target)) isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', closeOutside)
  window.addEventListener('close-all-nav-menus', handleClose)
})

onUnmounted(() => {
  document.removeEventListener('click', closeOutside)
  window.removeEventListener('close-all-nav-menus', handleClose)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease-out;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
