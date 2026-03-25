// src/composables/useTheme.js
import { ref, onMounted } from 'vue'

export function useTheme() {
  const currentTheme = ref(localStorage.getItem('theme') || 'light')
  
  const toggleTheme = () => {
    // Alterna entre light e dark
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    
    // Atualiza o link CSS
    const themeLink = document.getElementById('theme-style')
    if (themeLink) {
      themeLink.href = `/${newTheme}.css`
    }
    
    // Atualiza atributo HTML
    document.documentElement.setAttribute('data-theme', newTheme)
    
    // Salva preferência
    localStorage.setItem('theme', newTheme)
    currentTheme.value = newTheme
    
    console.log(`Tema alterado para: ${newTheme}`)
  }
  
  const setTheme = (theme) => {
    if (theme !== 'light' && theme !== 'dark') return
    
    const themeLink = document.getElementById('theme-style')
    if (themeLink) {
      themeLink.href = `/${theme}.css`
    }
    
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    currentTheme.value = theme
  }
  
  onMounted(() => {
    // Carrega tema salvo
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
  })
  
  return {
    currentTheme,
    toggleTheme,
    setTheme
  }
}