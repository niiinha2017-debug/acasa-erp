import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import path from 'path'

export default defineConfig({
  base: '/', 
  
  plugins: [
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
  emptyOutDir: true,
  assetsDir: 'assets',
  modulePreload: { polyfill: true },
  sourcemap: true,
},

  server: {
    port: 5173,
    // ADICIONE ESTE BLOCO AQUI:
    fs: {
      allow: ['..'] 
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})