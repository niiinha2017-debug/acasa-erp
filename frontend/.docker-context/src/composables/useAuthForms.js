import { ref, reactive } from 'vue'
import { emailValido, normalizarUsuario } from '@/utils/validators'

export function useAuthForms() {
  const showModalCadastro = ref(false)
  const cadastro = reactive({ nome: '', email: '', usuario: '', senha: '' })
  
  // Toda aquela lógica de resetCadastro, abrirCadastro vai aqui...
  
  return { showModalCadastro, cadastro, emailValido }
}