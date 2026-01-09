<template>
  <div class="login-screen">
    <div class="login-split">
      
      <aside class="login-left-side">
        <div class="left-wrap">
          <header class="brand-header">
            <h1 class="brand-title">A Casa</h1>
            <p class="brand-subtitle">Sistema de Gestão</p>
          </header>

          <section class="features-grid">
            <article class="feature-card">
              <div class="feature-icon">🏠</div>
              <div class="feature-content">
                <h3>Financeiro</h3>
                <p>Receitas e despesas</p>
              </div>
            </article>

            <article class="feature-card">
              <div class="feature-icon">🏭</div>
              <div class="feature-content">
                <h3>Produção</h3>
                <p>Processos em tempo real</p>
              </div>
            </article>

            <article class="feature-card">
              <div class="feature-icon">📊</div>
              <div class="feature-content">
                <h3>Gestão</h3>
                <p>Controle e relatórios do negócio</p>
              </div>
            </article>
          </section>
        </div>
      </aside>

      <main class="login-right-side">
        <div class="right-wrap">
          <header class="form-header">
            <h2 class="form-title">Acesso</h2>
            <p class="form-subtitle">Entre com suas credenciais</p>
          </header>

<form class="login-form" @submit.prevent="handleLoginSubmit" autocomplete="off">
  
  <div class="form-group">
    <label class="form-label">Usuário ou e-mail</label>
    <input 
      v-model="formLogin.usuario" 
      type="text" 
      class="form-input" 
      placeholder="Usuario ou seu@email.com" 
      required 
      name="usuario_login_erp" 
      autocomplete="one-time-code" 
    />
    </div>

  <div class="form-group" style="margin-top: var(--spacing-4);">
    <label class="form-label">Senha</label>
    <div class="input-container">
      <input 
        v-model="formLogin.senha" 
        :type="showPassword ? 'text' : 'password'" 
        class="form-input" 
        required 
        name="senha_login_erp"
        autocomplete="new-password" 
      />
      <button 
        type="button" 
        class="password-toggle" 
        @click="showPassword = !showPassword"
        tabindex="-1"
      >
        </button>
    </div>
  </div>

            <button type="submit" class="submit-button" :disabled="loading">
              {{ loading ? 'Entrando...' : 'Entrar no sistema' }}
            </button>

            <div class="form-links">
              <a href="#" class="link" @click.prevent="showModalRecuperacao = true">Esqueci minha senha</a>
              <span class="link-sep">•</span>
              <a href="#" class="link" @click.prevent="showModalCadastro = true">Solicitar cadastro</a>
            </div>

            <div v-if="error" class="error-message">{{ error }}</div>
          </form>
        </div>
      </main>
    </div>

    <div v-if="showModalRecuperacao" class="modal-overlay" @click.self="showModalRecuperacao = false">
      <div class="modal-container">
        <header class="modal-header">
          <h3 class="modal-title">Recuperar Senha</h3>
          <p class="modal-subtitle">Informe seu e-mail cadastrado.</p>
        </header>
        <div class="modal-body">
          <div class="form-group">
            <input type="email" class="form-input" v-model="emailRecuperacao" placeholder="seu@email.com" />
          </div>
        </div>
        <footer class="modal-footer">
          <button type="button" class="btn-cancel" @click="showModalRecuperacao = false">Cancelar</button>
          <button type="button" class="btn btn--primary" style="flex: 2" @click="handleRecuperarSenha">Enviar Link</button>
        </footer>
      </div>
    </div>

<div v-if="showModalCadastro" class="modal-overlay" @click.self="fecharCadastro">
      <div class="modal-container">
        <header class="modal-header">
          <h3 class="modal-title">Solicitar Cadastro</h3>
          <p class="modal-subtitle">Dados para análise de acesso.</p>
        </header>

        <form class="modal-body" @submit.prevent="handleCadastroSubmit">
          <div class="form-grid">
  <div class="form-group col-span-12">
    <label class="form-label">Nome Completo</label>
    <input v-model="formCadastro.nome" type="text" class="form-input" required autocomplete="off" />
  </div>

  <div class="form-group col-span-12">
    <label class="form-label">E-mail</label>
    <input 
      v-model="formCadastro.email" 
      type="email" 
      class="form-input" 
      required 
      name="novo_email_registro"
      autocomplete="new-password" 
    />
  </div>

  <div class="form-group col-span-6">
    <label class="form-label">Usuário</label>
    <input 
      v-model="formCadastro.usuario" 
      type="text" 
      class="form-input" 
      required 
      name="novo_usuario_registro"
      autocomplete="off" 
    />
  </div>

  <div class="form-group col-span-6">
    <label class="form-label">Senha</label>
    <input 
      v-model="formCadastro.senha" 
      type="password" 
      class="form-input" 
      required 
      name="nova_senha_registro"
      autocomplete="new-password" 
    />
  </div>
</div>

          <footer class="modal-footer">
            <button type="button" class="btn-cancel" @click="fecharCadastro">
              Cancelar
            </button>
            <button type="submit" class="btn btn--primary" style="flex: 2" :disabled="loading">
              {{ loading ? 'Enviando...' : 'Solicitar' }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/useauth'
import '@/assets/CSS/Login.css'

const router = useRouter()
const { login, solicitarCadastro, loading, error } = useAuth()

const showPassword = ref(false)
const showModalCadastro = ref(false)
const showModalRecuperacao = ref(false)
const emailRecuperacao = ref('')

const formLogin = reactive({ usuario: '', senha: '' })
const formCadastro = reactive({ nome: '', email: '', usuario: '', senha: '' })

async function handleLoginSubmit() {
  try {
    await login(formLogin)
    router.push('/')
  } catch (e) {
    console.error("Login falhou")
  }
}

async function handleCadastroSubmit() {
  try {
    // 1. Envia para o servidor
    await solicitarCadastro({ 
      ...formCadastro, 
      setor: 'PENDENTE',
      funcao: 'Aguardando',
      status: 'PENDENTE'
    })
    
    // 2. SE CHEGOU AQUI, DEU CERTO:
    // Fecha o modal
    showModalCadastro.value = false
    
    // Limpa os campos para a próxima vez que abrir
    Object.assign(formCadastro, { 
      nome: '', 
      email: '', 
      usuario: '', 
      senha: '' 
    })
    
    alert('Solicitação enviada! Aguarde a aprovação do administrador.')

  } catch (e) {
    // SE DER ERRO:
    // O modal continua aberto e os dados NÃO são limpos 
    // para o usuário poder corrigir o erro (ex: e-mail já existe)
    alert(e?.response?.data?.message || 'Erro: Verifique os campos corretamente.')
  }
}
function fecharCadastro() {
  showModalCadastro.value = false
  // Limpa o formulário ao desistir
  Object.assign(formCadastro, { nome: '', email: '', usuario: '', senha: '' })
}
function handleRecuperarSenha() {
  alert('Se o e-mail existir, as instruções foram enviadas.')
  showModalRecuperacao.value = false
}

</script>

<style scoped>
/* FIX DEFINITIVO PARA TELA CHEIA */
.login-screen {
  position: fixed;
  inset: 0; /* Cola em todos os cantos */
  width: 100vw;
  height: 100vh;
  background: var(--bg-page);
  z-index: 999;
  overflow: hidden;
}

.login-split {
  display: flex;
  width: 100%;
  height: 100%;
}
</style>