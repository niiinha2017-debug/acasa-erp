import { ref, computed } from 'vue'
import api from '@/services/api'
import { storage } from '@/utils/storage'

// Estado Global (Singleton)
const token = ref(storage.getToken())
const usuarioLogado = ref(storage.getUser())
const loading = ref(false)
const error = ref('')

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value)

  // ✅ Permissões vindas do backend (usuario.permissoes)
  const permissoes = computed(() => {
    const user = usuarioLogado.value
    return Array.isArray(user?.permissoes) ? user.permissoes : []
  })

  // ✅ temAcesso por chave (ex: 'clientes.ver')
// ✅ temAcesso por chave (ex: 'clientes.ver')
const temAcesso = (chave) => {
  const user = usuarioLogado.value;
  
  // 1. Se não houver usuário, nega tudo
  if (!user) return false;

  // 2. SE FOR ADMIN, RETORNA TRUE PARA QUALQUER PÁGINA
  // Usamos toUpperCase() para evitar problemas com 'Admin' vs 'ADMIN'
  if (user.setor?.toUpperCase() === 'ADMIN') {
    return true;
  }

  // 3. Caso contrário, verifica as permissões específicas
  return permissoes.value.includes(chave);
}

  async function login({ usuario, senha }) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await api.post('/auth/login', { usuario, senha })

      storage.setToken(data.token)
      storage.setUser(data.usuario)

      token.value = data.token
      usuarioLogado.value = data.usuario

      return data
    } catch (e) {
      error.value = e?.response?.data?.message || 'Credenciais inválidas'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function solicitarCadastro(dados) {
    loading.value = true
    try {
      const { data } = await api.post('/auth/cadastro', dados)
      return data
    } catch (e) {
      error.value = 'Erro ao solicitar cadastro'
      throw e
    } finally {
      loading.value = false
    }
  }

  function logout() {
    storage.removeToken()
    storage.removeUser()
    token.value = null
    usuarioLogado.value = null
    window.location.href = '/login'
  }

  return {
    token,
    usuarioLogado,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    solicitarCadastro,
    temAcesso,
    permissoes, // ✅ agora existe e funciona
  }
}
