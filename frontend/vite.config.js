import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import path from 'path'

export default defineConfig({
  // Define a raiz para caminhos absolutos. Isso mata o erro de MIME type nos assets.
  base: '/', 
  
  plugins: [
    // O VueRouter deve vir ANTES do plugin do vue
    VueRouter({
      dts: 'src/typed-router.d.ts',
      routesFolder: 'src/pages',
    }),
    vue(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // Garante que o build limpe a pasta antes de gerar novos arquivos
    emptyOutDir: true,
    // Organiza melhor os arquivos gerados
    assetsDir: 'assets',
    // Evita problemas de carregamento de módulos dinâmicos em alguns servidores
    modulePreload: {
      polyfill: true
    }
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