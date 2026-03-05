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
        class="absolute left-0 top-full mt-1 min-w-[180px] py-1 bg-bg-card rounded-lg border border-border-ui z-[9999] overflow-visible shadow-lg"
      >
        <div v-if="visibleItems.length === 0" class="px-3 py-2.5 text-xs text-text-soft">
          Nenhum item disponível
        </div>

        <div v-else class="flex flex-col overflow-visible">
          <template v-for="(item, index) in visibleItems" :key="index">
            <hr v-if="item.divider" class="my-1 border-border-ui" />

            <div
              v-else-if="item.children?.length"
              class="nav-submenu-trigger relative flex items-center justify-between gap-2 px-3 py-2 text-xs text-text-main cursor-pointer overflow-visible transition-colors"
              :class="[item.etapaKey ? getStatusHoverBgClass(item.etapaKey) : 'hover:bg-black/5 dark:hover:bg-white/5', { 'bg-black/5 dark:bg-white/5': openSubmenuIndex === index }]"
              @click.stop.prevent="toggleSubmenu(index)"
              @mouseenter="clearSubmenuLeaveTimer(); openSubmenuIndex = index"
              @mouseleave="scheduleSubmenuClose()"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <i v-if="item.icon" :class="[item.icon, 'pi text-[11px] opacity-70 flex-shrink-0']" />
                <span class="font-medium truncate">{{ item.label }}</span>
              </div>
              <i class="pi pi-chevron-right text-[10px] opacity-60 flex-shrink-0" />
              <!-- Lista lateral (flyout) à direita -->
              <transition name="dropdown">
                <div
                  v-if="openSubmenuIndex === index"
                  class="absolute left-full top-0 ml-0.5 min-w-[180px] py-1.5 px-0 bg-bg-card rounded-lg border border-border-ui shadow-lg z-[10001] overflow-visible"
                  @click.stop
                  @mouseenter="clearSubmenuLeaveTimer()"
                  @mouseleave="scheduleSubmenuClose()"
                >
                  <template v-for="(child, childIndex) in visibleChildren(item)" :key="child.divider ? `div-${childIndex}` : (child.to || childIndex)">
                    <hr v-if="child.divider" class="my-1 border-border-ui" />
                    <a
                      v-else
                      @click="handleNavChild(child.to)"
                      class="flex items-center gap-2.5 px-3 py-2 text-xs text-text-main hover:text-brand-primary transition-colors rounded-md"
                      :class="child.etapaKey ? getStatusHoverBgClass(child.etapaKey) : 'hover:bg-black/5 dark:hover:bg-white/5'"
                    >
                      <i v-if="child.icon" :class="[child.icon, 'pi text-[11px] opacity-70']" />
                      <span class="font-medium">{{ child.label }}</span>
                    </a>
                  </template>
                </div>
              </transition>
            </div>

            <a
              v-else
              @click="handleNav(item.to)"
              class="flex items-center gap-2.5 px-3 py-2 text-xs text-text-main hover:text-brand-primary transition-colors rounded-md"
              :class="item.etapaKey ? getStatusHoverBgClass(item.etapaKey) : 'hover:bg-black/5 dark:hover:bg-white/5'"
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
import { getStatusHoverBgClass } from '@/constantes'

const props = defineProps({
  label: { type: String, required: true },
  items: { type: Array, required: true },
})

const router = useRouter()
const route = useRoute()
const isOpen = ref(false)
const openSubmenuIndex = ref(null)
const menuRef = ref(null)
let submenuLeaveTimer = null

const toggleMenu = () => {
  if (!isOpen.value) {
    window.dispatchEvent(new CustomEvent('close-all-nav-menus'))
    isOpen.value = true
    openSubmenuIndex.value = null
  } else {
    isOpen.value = false
    openSubmenuIndex.value = null
  }
}

function clearSubmenuLeaveTimer() {
  if (submenuLeaveTimer) {
    clearTimeout(submenuLeaveTimer)
    submenuLeaveTimer = null
  }
}

function scheduleSubmenuClose() {
  submenuLeaveTimer = setTimeout(() => {
    openSubmenuIndex.value = null
    submenuLeaveTimer = null
  }, 150)
}

function toggleSubmenu(index) {
  openSubmenuIndex.value = openSubmenuIndex.value === index ? null : index
}

const handleClose = () => {
  isOpen.value = false
  openSubmenuIndex.value = null
}

function visibleChildren(item) {
  const list = item.children || []
  return list.filter((child) => {
    if (!child.perm) return true
    try {
      return Array.isArray(child.perm) ? child.perm.some((p) => can(p)) : can(child.perm)
    } catch (e) {
      return true
    }
  })
}

const visibleItems = computed(() => {
  return (props.items || []).filter((item) => {
    if (item.divider) return true
    if (item.children?.length) {
      return visibleChildren(item).length > 0
    }
    if (!item.perm) return true
    try {
      return Array.isArray(item.perm) ? item.perm.some((p) => can(p)) : can(item.perm)
    } catch (e) {
      return true
    }
  })
})

const handleNav = (to) => {
  isOpen.value = false
  openSubmenuIndex.value = null
  const target = router.resolve(to).fullPath
  if (target === route.fullPath) {
    window.dispatchEvent(new CustomEvent('acasa-tabs-duplicate-current', { detail: { to: target } }))
    return
  }
  router.push(target)
}

function handleNavChild(to) {
  handleNav(to)
}

const closeOutside = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    isOpen.value = false
    openSubmenuIndex.value = null
  }
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
