import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite' // 👈 ADICIONEI ISSO
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(), // 👈 ELE TEM QUE VIR ANTES DO VUE()
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})