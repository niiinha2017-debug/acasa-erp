<template>
  <div class="relative inline-flex" ref="menuRef">
    <button
      @click.stop="toggleMenu"
      type="button"
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-text-soft hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150 outline-none border-0"
      :class="{ 'text-text-main bg-black/5 dark:bg-white/5': isOpen }"
    >
      <span class="text-xs font-medium">{{ label }}</span>
      <i
        class="pi pi-chevron-down text-[10px] opacity-60 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute left-0 top-full mt-1 min-w-[180px] py-1 bg-bg-card rounded-lg border border-border-ui z-[9999] overflow-hidden shadow-lg"
      >
        <div v-if="visibleItems.length === 0" class="px-3 py-2.5 text-xs text-text-soft">
          Nenhum item disponível
        </div>

        <div v-else class="flex flex-col">
          <template v-for="(item, index) in visibleItems" :key="index">
            <hr v-if="item.divider" class="my-1 border-border-ui" />

            <a
              v-else
              @click="handleNav(item.to)"
              class="flex items-center gap-2.5 px-3 py-2 text-xs text-text-main hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand-primary transition-colors"
            >
              <i v-if="item.icon" :class="[item.icon, 'pi text-[11px] opacity-70']" />
              <span class="font-medium">{{ item.label }}</span>
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
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}
</style>
