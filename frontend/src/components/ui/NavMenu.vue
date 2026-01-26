<template>
  <div class="relative inline-flex" ref="menuRef">
    <button 
      @click.stop="toggleMenu" 
      type="button"
      class="flex items-center justify-center gap-2 px-4 py-2 transition-all duration-200 rounded-lg group"
      :class="isOpen 
        ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'"
    >
      <span class="text-[11px] font-bold uppercase tracking-wider">{{ label }}</span>
      <i 
        class="pi pi-chevron-down text-[10px] opacity-50 transition-transform duration-300" 
        :class="{'rotate-180': isOpen}"
      ></i>
    </button>

    <transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-800 z-[9999] overflow-hidden py-2 transition-all"
      >
        <div v-if="visibleItems.length === 0" class="px-6 py-4 text-[10px] text-slate-400 italic uppercase font-bold text-center">
          Nenhum item disponível
        </div>
        
        <div v-else class="flex flex-col px-1.5">
          <template v-for="(item, index) in visibleItems" :key="index">
            <hr v-if="item.divider" class="my-1.5 border-slate-100 dark:border-slate-800 mx-2">
            
            <a 
              v-else
              @click="handleNav(item.to)" 
              class="flex items-center px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-brand-primary hover:text-white cursor-pointer transition-all duration-150 group/item"
            >
              <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 group-hover/item:bg-white/20 mr-3 transition-colors">
                  <i v-if="item.icon" :class="[item.icon, 'pi text-xs opacity-60 group-hover/item:opacity-100 group-hover/item:scale-110']"></i> 
              </div>
              
              <div class="flex flex-col">
                <span class="uppercase text-[10px] font-bold tracking-wide">{{ item.label }}</span>
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
import { useRouter } from 'vue-router'
import { can } from '@/services/permissions'

const props = defineProps({
  label: { type: String, required: true },
  items: { type: Array, required: true }
})

const router = useRouter()
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

const handleClose = () => isOpen.value = false

const visibleItems = computed(() => {
  return (props.items || []).filter(item => {
    if (item.divider) return true
    if (!item.perm) return true
    try { return can(item.perm) } catch (e) { return true }
  })
})

const handleNav = (to) => {
  isOpen.value = false
  router.push(to)
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
.dropdown-enter-active, .dropdown-leave-active {
  transition: all 0.2s ease-out;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>