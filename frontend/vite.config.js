import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import path from 'path'

export default defineConfig({
  base: './',

  plugins: [
    VueRouter({
      dts: 'src/typed-router.d.ts',
      routesFolder: 'src/pages',
    }),
    vue(),
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
    fs: { allow: [path.resolve(__dirname, '..')] },
    proxy: {
      '/api/analytics': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
