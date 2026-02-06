import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import VueRouter from 'unplugin-vue-router/vite'

export default defineConfig(({ mode }) => {
  // ✅ modos "app" (ajuste se você usa outro nome)
  const isNative = mode === 'capacitor' || mode === 'tauri'

  return {
    // ✅ no app precisa ser relativo (senão dá tela branca)
    base: isNative ? './' : '/',

    plugins: [
      VueRouter(),
      vue(),
      tailwindcss(),

      VitePWA({
        // ✅ no app DESLIGA PWA/SW
        disable: isNative,

        registerType: 'autoUpdate',
        devOptions: { enabled: !isNative },

        scope: '/',
        manifest: {
          name: 'ACASA Ponto',
          short_name: 'Ponto',
          start_url: '/',
          scope: '/',
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
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
