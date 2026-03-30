import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import path from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const lifecycle = String(process.env.npm_lifecycle_event || '')
  const devPort = Number(env.VITE_PORT || process.env.VITE_PORT || 5173)
  const apiProxyTarget = String(env.VITE_API_PROXY_TARGET || process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3000').replace(/\/+$/, '')
  const isTauriBuild =
    Boolean(process.env.TAURI_PLATFORM) ||
    Boolean(process.env.TAURI_ENV_PLATFORM) ||
    lifecycle.includes('tauri')

  return {
  // Web precisa de caminhos absolutos (/assets/...) para funcionar em rotas como /aceitar/:token.
  // Tauri empacotado continua usando relativo.
  base: isTauriBuild ? './' : '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },

  plugins: [
    VueRouter({
      // Em alguns ambientes Windows a escrita do arquivo gerado falha com UNKNOWN.
      // Como este projeto usa JS, desativar o d.ts nao afeta runtime.
      dts: false,
      routesFolder: 'src/pages',
    }),
    vue(),
  ],

  resolve: {
    // Um único módulo konva: evita Stage de um bundle + Layer de outro (erro "only add layers to the stage")
    dedupe: ['konva'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      // backend compartilhado (dev: ../backend; imagem OCI: COPY coloca em /backend)
      '@backend': path.resolve(__dirname, '..', 'backend'),
    },
  },

  build: {
    emptyOutDir: true,
    assetsDir: 'assets',
    modulePreload: { polyfill: true },
    sourcemap: true,
    // Um único CSS evita "Unable to preload CSS" no webview Tauri ao navegar entre rotas
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue') && !id.includes('vue-router')) return 'vue'
            if (id.includes('vue-router')) return 'vue-router'
            if (id.includes('apexcharts') || id.includes('vue3-apexcharts')) return 'charts'
            if (id.includes('@vueuse/core')) return 'vueuse'
            if (id.includes('@vuepic/vue-datepicker')) return 'datepicker'
            if (id.includes('axios')) return 'axios'
            if (id.includes('qrcode')) return 'qrcode'
            if (id.includes('primeicons')) return 'primeicons'
            if (id.includes('@tauri-apps') || id.includes('@capacitor')) return 'native'
            // demais deps em vendor para não inflar o chunk principal
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },

  server: {
    port: devPort,
    host: '127.0.0.1', // necessário para o Tauri conectar em dev
    strictPort: true,  // falha se a porta configurada estiver em uso (evita porta errada no Tauri)
    fs: { allow: [path.resolve(__dirname, '..')] },
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  }
})
