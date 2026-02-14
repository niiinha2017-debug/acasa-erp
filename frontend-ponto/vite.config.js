import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import VueRouter from 'unplugin-vue-router/vite'

export default defineConfig({
  // Capacitor precisa base relativa (senão tela branca)
  base: './',

  plugins: [
    VueRouter(),
    vue(),
    tailwindcss(),
  ],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  build: {
    emptyOutDir: true,
    assetsDir: 'assets',
    modulePreload: { polyfill: true },
    sourcemap: true,
  },

  server: {
    port: 5173,
    fs: { allow: ['..'] },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
