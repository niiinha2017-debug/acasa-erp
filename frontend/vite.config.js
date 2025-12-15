import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  
  // 🛑 REMOVER ESTA SEÇÃO: O Vite já trata as variáveis de ambiente (VITE_*)
  // define: {
  //   'import.meta.env.VITE_API_URL': JSON.stringify('https://iniciantevencedor.com.br/api')
  // }
})