<template>
  <div class="relative inline-flex" ref="menuRef">
    <button 
      @click.stop="toggleMenu" 
      type="button"
      class="flex items-center justify-center gap-1.5 px-4 py-2 transition-all duration-300 rounded-xl"
      :class="isOpen 
        ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
        : 'text-[var(--text-main)] hover:bg-slate-500/10'"
    >
      <span class="text-xs font-black uppercase tracking-widest">{{ label }}</span>
      <i 
        class="pi pi-chevron-down text-[9px] opacity-70 transition-transform duration-300" 
        :class="{'rotate-180': isOpen}"
      ></i>
    </button>

    <transition name="fade-slide">
      <div
        v-if="isOpen"
        class="absolute left-0 top-full mt-2 w-72 bg-[var(--bg-card)] rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[var(--border-ui)] z-[9999] overflow-hidden py-3 backdrop-blur-xl transition-colors duration-300"
      >
        <div v-if="visibleItems.length === 0" class="px-6 py-4 text-[10px] text-slate-500 italic uppercase font-black">
          Vazio
        </div>
        
        <div v-else class="flex flex-col px-2">
          <template v-for="(item, index) in visibleItems" :key="index">
            <hr v-if="item.divider" class="my-2 border-[var(--border-ui)] opacity-50">
            
            <a 
              v-else
              @click="handleNav(item.to)" 
              class="flex items-center px-4 py-3 rounded-xl text-sm font-bold text-[var(--text-main)] hover:bg-brand-primary hover:text-white cursor-pointer transition-all duration-200 group"
            >
              <div class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-500/10 group-hover:bg-white/20 mr-4 transition-all">
                  <i v-if="item.icon" :class="[item.icon, 'pi text-xs opacity-60 group-hover:opacity-100 group-hover:scale-110']"></i> 
              </div>
              
              <div class="flex flex-col">
                <span class="uppercase text-[11px] tracking-tight">{{ item.label }}</span>
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
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
}
</style>