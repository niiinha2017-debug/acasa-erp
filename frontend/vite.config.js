import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/',

  plugins: [
    VueRouter({
      dts: 'src/typed-router.d.ts',
      routesFolder: 'src/pages',
    }),

    vue(),

 VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    navigateFallbackDenylist: [
      /^\/ponto(\/|$)/,
      /^\/uploads(\/|$)/,
    ],
  },

      devOptions: {
        enabled: true,
      },

      manifest: {
        name: 'ACASA ERP',
        short_name: 'ERP',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#111827',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
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
      // Direciona para o Python (Analytics)
      '/api/analytics': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Direciona para o Node (Geral)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
