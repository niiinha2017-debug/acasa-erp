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

     devOptions: { enabled: false },

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
