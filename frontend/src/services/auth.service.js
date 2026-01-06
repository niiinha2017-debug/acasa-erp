import api from '@/services/api'

export async function login(payload) {
  return api.post('/auth/login', payload)
}

export async function solicitarCadastro(payload) {
  return api.post('/auth/cadastro', payload)
}

export async function solicitarRecuperacaoSenha(email) {
  return api.post('/recuperacao-senha/solicitar', { email })
}
