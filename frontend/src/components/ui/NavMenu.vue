<template>
  <div class="relative inline-flex items-center flex-shrink-0" ref="menuRef">
    <button
      @click.stop="toggleMenu"
      type="button"
      class="flex items-center justify-center gap-1.5 px-0 py-0.5 rounded-md text-sm font-medium text-text-soft hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 border-b-2 border-transparent hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-200 outline-none leading-none"
      :class="{ 'text-text-main bg-black/5 dark:bg-white/5 border-slate-400 dark:border-slate-500': isOpen }"
    >
      <span class="whitespace-nowrap">{{ label }}</span>
      <i
        class="pi pi-chevron-down text-[10px] opacity-60 transition-transform duration-200 flex-shrink-0"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Teleport to="body">
      <transition name="dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="fixed min-w-[200px] p-1 bg-bg-card rounded-lg border border-border-ui z-[9999] overflow-visible shadow-sm"
          :style="dropdownStyle"
        >
        <div v-if="visibleItems.length === 0" class="px-4 py-2.5 text-sm text-text-soft">
          Nenhum item disponível
        </div>

        <div v-else class="flex flex-col gap-0.5 overflow-visible">
          <template v-for="(item, index) in visibleItems" :key="index">
            <hr v-if="item.divider" class="my-0.5 border-border-ui" />

            <div
              v-else-if="item.heading"
              class="px-4 py-1.5 pt-2 first:pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
            >
              {{ item.heading }}
            </div>

            <div
              v-else-if="item.children?.length"
              class="nav-submenu-trigger relative flex items-center gap-3 px-4 py-2.5 text-sm text-text-main cursor-pointer overflow-visible rounded-md transition-colors duration-200"
              :class="[item.etapaKey ? getStatusHoverBgClass(item.etapaKey) : 'hover:bg-slate-50 dark:hover:bg-slate-800/50', { 'bg-slate-50 dark:bg-slate-800/50': openSubmenuIndex === index }]"
              @click.stop.prevent="toggleSubmenu(index)"
              @mouseenter="clearSubmenuLeaveTimer(); openSubmenuIndex = index"
              @mouseleave="scheduleSubmenuClose()"
            >
              <i v-if="item.icon" :class="[item.icon, 'pi text-xs opacity-70 w-5 flex-shrink-0']" />
              <span class="font-medium truncate flex-1 min-w-0">{{ item.label }}</span>
              <i class="pi pi-chevron-right text-[10px] opacity-60 flex-shrink-0" />
              <!-- Lista lateral (flyout) à direita -->
              <transition name="dropdown">
                <div
                  v-if="openSubmenuIndex === index"
                  class="absolute left-full top-0 ml-0.5 min-w-[200px] p-1 bg-bg-card rounded-lg border border-border-ui shadow-sm z-[10001] overflow-visible"
                  @click.stop
                  @mouseenter="clearSubmenuLeaveTimer()"
                  @mouseleave="scheduleSubmenuClose()"
                >
                  <template v-for="(child, childIndex) in visibleChildren(item)" :key="child.divider ? `div-${childIndex}` : (child.to || childIndex)">
                    <hr v-if="child.divider" class="my-0.5 border-border-ui" />
                    <a
                      v-else
                      @click="handleNavChild(child.to)"
                      class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-main hover:text-brand-primary rounded-md transition-colors duration-200"
                      :class="child.etapaKey ? getStatusHoverBgClass(child.etapaKey) : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'"
                    >
                      <i v-if="child.icon" :class="[child.icon, 'pi text-xs opacity-70 w-5 flex-shrink-0']" />
                      <span class="font-medium">{{ child.label }}</span>
                    </a>
                  </template>
                </div>
              </transition>
            </div>

            <a
              v-else
              @click="handleNav(item.to)"
              class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-main hover:text-brand-primary rounded-md transition-colors duration-200"
              :class="item.etapaKey ? getStatusHoverBgClass(item.etapaKey) : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'"
            >
              <i v-if="item.icon" :class="[item.icon, 'pi text-xs opacity-70 w-5 flex-shrink-0']" />
              <span class="font-medium">{{ item.label }}</span>
            </a>
          </template>
        </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
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
const dropdownRef = ref(null)
const dropdownStyle = ref({ left: '0', top: '0' })
let submenuLeaveTimer = null

function updateDropdownPosition() {
  if (!menuRef.value || !isOpen.value) return
  const rect = menuRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    left: `${rect.left}px`,
    top: `${rect.bottom + 4}px`,
  }
}

watch(isOpen, (open) => {
  if (open) nextTick(updateDropdownPosition)
})

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
    if (item.heading) return true
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
  if (!menuRef.value) return
  const inMenu = menuRef.value.contains(e.target)
  const inDropdown = dropdownRef.value?.contains(e.target)
  if (!inMenu && !inDropdown) {
    isOpen.value = false
    openSubmenuIndex.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', closeOutside)
  window.addEventListener('close-all-nav-menus', handleClose)
  window.addEventListener('scroll', updateDropdownPosition, true)
  window.addEventListener('resize', updateDropdownPosition)
})

onUnmounted(() => {
  document.removeEventListener('click', closeOutside)
  window.removeEventListener('close-all-nav-menus', handleClose)
  window.removeEventListener('scroll', updateDropdownPosition, true)
  window.removeEventListener('resize', updateDropdownPosition)
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
