import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url' // ✅ ADD

export default defineConfig({
  // 🔴 ESSENCIAL: app roda em /ponto/
  base: '/ponto/',

  // ✅ ADD
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  plugins: [
    vue(),
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false, // PWA só em build
      },

      manifest: {
        name: 'ACASA Ponto',
        short_name: 'Ponto',

        // 🔴 SUBPASTA CORRETA
        start_url: '/ponto/',
        scope: '/ponto/',

        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#111827',

        // 🔴 ÍCONES PRECISAM SER ABSOLUTOS + SUBPASTA
        icons: [
          { src: '/ponto/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/ponto/pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],

  // 🔧 SOMENTE DEV (não afeta produção)
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
