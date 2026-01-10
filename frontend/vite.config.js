import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import path from 'path'

export default defineConfig({
  base: '/', // ⬅️ ADICIONE ISSO para o build de produção
  plugins: [
    VueRouter({
      dts: 'src/typed-router.d.ts',
    }),
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // O proxy só funciona no 'npm run dev' (desenvolvimento)
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
  // DICA: Adicione isso para limpar o console de avisos de arquivos grandes
  build: {
    chunkSizeWarningLimit: 2000,
  }
})