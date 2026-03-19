import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import VueRouter from 'unplugin-vue-router/vite'
import { readFileSync } from 'fs'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const apiProxyTarget = String(env.VITE_API_PROXY_TARGET || process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3001').replace(/\/+$/, '')

  return {
  // Capacitor precisa base relativa (senão tela branca)
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || '0.0.0'),
  },

  plugins: [
    VueRouter(),
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: './public/manifest.webmanifest',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
      },
      includeAssets: ['logo.png', 'pwa-192.png', 'pwa-512.png'],
      devOptions: {
        enabled: true,
      },
      base: './',
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
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  }
})
