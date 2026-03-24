<template>
  <div class="relative inline-flex items-center flex-shrink-0" ref="menuRef">
    <button
      @click.stop="toggleMenu"
      type="button"
      class="ds-nav-menu-trigger outline-none"
      :class="{ 'is-open': isOpen, 'is-active': hasActiveMatch }"
      :aria-expanded="isOpen ? 'true' : 'false'"
    >
      <span class="ds-nav-menu-trigger__row">
        <span class="ds-nav-menu-trigger__label">{{ label }}</span>
        <i
          class="pi pi-chevron-down text-[10px] opacity-60 transition-transform duration-200 flex-shrink-0"
          :class="{ 'rotate-180': isOpen }"
        />
      </span>
    </button>

    <Teleport to="body">
      <transition name="dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="ds-floating-panel ds-nav-menu-panel fixed z-[9999] overflow-visible"
          :style="dropdownStyle"
        >
          <div v-if="visibleItems.length === 0" class="px-4 py-2.5 text-sm text-text-soft">
            Nenhum item disponível
          </div>

          <div v-else class="flex flex-col gap-0.5 overflow-visible">
            <div class="ds-nav-menu-panel-header">
              <span class="ds-nav-menu-panel-eyebrow">{{ eyebrow || 'Navegação' }}</span>
              <div class="ds-nav-menu-panel-copy">
                <strong class="ds-nav-menu-panel-title">{{ label }}</strong>
              </div>
            </div>

            <template v-for="(item, index) in visibleItems" :key="index">
              <hr v-if="item.divider" class="my-0.5 border-border-ui" />

              <div
                v-else-if="item.heading"
                class="ds-nav-menu-heading"
              >
                {{ item.heading }}
              </div>

              <div
                v-else-if="item.children?.length"
                class="nav-submenu-trigger ds-nav-menu-item relative cursor-pointer overflow-visible"
                :class="[
                  item.etapaKey ? getStatusHoverBgClass(item.etapaKey) : '',
                  { 'is-open': openSubmenuIndex === index, 'is-active': getItemState(item).isActive, 'is-current': getItemState(item).isCurrent },
                ]"
                @click.stop.prevent="toggleSubmenu(index)"
                @mouseenter="clearSubmenuLeaveTimer(); openSubmenuIndex = index"
                @mouseleave="scheduleSubmenuClose()"
              >
                <i v-if="item.icon" :class="[item.icon, 'pi text-xs opacity-70 w-5 flex-shrink-0']" />
                <span class="ds-nav-menu-item__content">
                  <span class="ds-nav-menu-item__label">{{ item.label }}</span>
                </span>
                <i class="pi pi-chevron-right text-[10px] opacity-60 flex-shrink-0" />
                <transition name="dropdown">
                  <div
                    v-if="openSubmenuIndex === index"
                    class="ds-floating-panel ds-nav-menu-panel absolute left-full top-0 ml-0.5 z-[10001] overflow-visible"
                    @click.stop
                    @mouseenter="clearSubmenuLeaveTimer()"
                    @mouseleave="scheduleSubmenuClose()"
                  >
                    <template v-for="(child, childIndex) in visibleChildren(item)" :key="child.divider ? `div-${childIndex}` : (child.to || childIndex)">
                      <hr v-if="child.divider" class="my-0.5 border-border-ui" />
                      <button
                        v-else
                        type="button"
                        @click="handleNavChild(child.to)"
                        class="ds-nav-menu-item w-full text-left"
                        :class="[
                          child.etapaKey ? getStatusHoverBgClass(child.etapaKey) : '',
                          { 'is-active': getItemState(child).isActive, 'is-current': getItemState(child).isCurrent },
                        ]"
                      >
                        <i v-if="child.icon" :class="[child.icon, 'pi text-xs opacity-70 w-5 flex-shrink-0']" />
                        <span class="ds-nav-menu-item__content">
                          <span class="ds-nav-menu-item__label">{{ child.label }}</span>
                        </span>
                      </button>
                    </template>
                  </div>
                </transition>
              </div>

              <button
                v-else
                type="button"
                @click="handleNav(item.to)"
                class="ds-nav-menu-item w-full text-left"
                :class="[
                  item.etapaKey ? getStatusHoverBgClass(item.etapaKey) : '',
                  { 'is-active': getItemState(item).isActive, 'is-current': getItemState(item).isCurrent },
                ]"
              >
                <i v-if="item.icon" :class="[item.icon, 'pi text-xs opacity-70 w-5 flex-shrink-0']" />
                <span class="ds-nav-menu-item__content">
                  <span class="ds-nav-menu-item__label">{{ item.label }}</span>
                </span>
              </button>
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
import { findBestNavItemMatch, getNavItemState } from '@/services/navigation'
import { getStatusHoverBgClass } from '@/constantes'

const props = defineProps({
  label: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  description: { type: String, default: '' },
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

watch(() => route.fullPath, () => {
  isOpen.value = false
  openSubmenuIndex.value = null
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

const activeMatch = computed(() => findBestNavItemMatch(visibleItems.value, route))
const hasActiveMatch = computed(() => activeMatch.value.state.score >= 0)

function getItemState(item) {
  return getNavItemState(item, route)
}

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
