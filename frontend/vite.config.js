import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import path from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'))

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },

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
    // Um único CSS evita "Unable to preload CSS" no webview Tauri ao navegar entre rotas
    cssCodeSplit: false,
  },

  server: {
    port: 5173,
    host: '127.0.0.1', // necessário para o Tauri conectar em dev
    strictPort: true,  // falha se 5173 estiver em uso (evita porta errada no Tauri)
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
