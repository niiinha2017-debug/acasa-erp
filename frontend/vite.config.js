import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import path from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'))
const lifecycle = String(process.env.npm_lifecycle_event || '')
const isTauriBuild =
  Boolean(process.env.TAURI_PLATFORM) ||
  Boolean(process.env.TAURI_ENV_PLATFORM) ||
  lifecycle.includes('tauri')

export default defineConfig({
  // Web precisa de caminhos absolutos (/assets/...) para funcionar em rotas como /aceitar/:token.
  // Tauri empacotado continua usando relativo.
  base: isTauriBuild ? './' : '/',
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
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
