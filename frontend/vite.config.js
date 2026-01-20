import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/ponto/',

  plugins: [
    VueRouter({
      dts: 'src/typed-router.d.ts',
      routesFolder: 'src/pages',
    }),

    vue(),

    VitePWA({
      registerType: 'autoUpdate',

      devOptions: {
        enabled: true,
      },

      // ✅ isola o SW e o PWA só dentro de /ponto
      scope: '/ponto/',
      manifest: {
        name: 'ACASA Ponto',
        short_name: 'Ponto',
        start_url: '/ponto/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#111827',
        icons: [
          { src: '/ponto/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/ponto/pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
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
    fs: {
      allow: ['..'],
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
