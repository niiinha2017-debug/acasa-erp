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

  <div class="form-group" style="margin-top: 20px;">
    <label class="form-label">Senha</label>
    
    <div class="input-container" style="position: relative; display: flex; align-items: center;">
      <input 
        v-model="formLogin.senha" 
        :type="showPassword ? 'text' : 'password'" 
        class="form-input" 
        required 
        name="senha_login_erp"
        autocomplete="new-password"
        style="padding-right: 45px; width: 100%;" 
      />
      
      <button 
        type="button" 
        class="password-toggle" 
        @click="showPassword = !showPassword"
        tabindex="-1"
        style="position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: #8892b0; display: flex; align-items: center; justify-content: center; transition: color 0.2s;"
      >
        <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7" />
          <path d="m15 19-2-3" /><path d="m20 17-2-3" /><path d="m4 17 2-3" /><path d="m9 19 2-3" />
        </svg>
      </button>
    </div>
  </div>
  <div class="remember-me" style="display: flex; align-items: center; margin-top: 10px; gap: 8px;">
  <input type="checkbox" id="remember" v-model="lembrarUsuario" style="cursor: pointer;" />
  <label for="remember" style="font-size: 14px; color: #666; cursor: pointer;">Lembrar meu usuário</label>
</div>

  <button type="submit" class="submit-button" :disabled="loading" style="margin-top: 20px;">
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
import { ref, reactive, onMounted } from 'vue' // Adicionado onMounted aqui
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/useauth'
import '@/assets/CSS/Login.css'

const router = useRouter()
const { login, solicitarCadastro, loading, error } = useAuth()

const showPassword = ref(false)
const showModalCadastro = ref(false)
const showModalRecuperacao = ref(false)
const emailRecuperacao = ref('')
const lembrarUsuario = ref(false)

const formLogin = reactive({ usuario: '', senha: '' })
const formCadastro = reactive({ nome: '', email: '', usuario: '', senha: '' })

// 1. LOGICA DE INICIALIZAÇÃO (Lembrar usuário do sistema, não do navegador)
onMounted(() => {
  const salvo = localStorage.getItem('erp_lembrar_usuario')
  if (salvo) {
    formLogin.usuario = salvo
    lembrarUsuario.value = true
  }

  // Limpa o lixo que o navegador tenta injetar automaticamente
  setTimeout(() => {
    if (!lembrarUsuario.value) {
      formLogin.usuario = ''
    }
    formLogin.senha = '' 
  }, 100)
})

// 2. SUBMIT DO LOGIN
async function handleLoginSubmit() {
  try {
    await login(formLogin)
    
    // Gerencia a memória do "Lembrar meu usuário"
    if (lembrarUsuario.value) {
      localStorage.setItem('erp_lembrar_usuario', formLogin.usuario)
    } else {
      localStorage.removeItem('erp_lembrar_usuario')
    }

    router.push('/')
  } catch (e) {
    console.error("Login falhou")
  }
}

// 3. SUBMIT DO CADASTRO
async function handleCadastroSubmit() {
  try {
    await solicitarCadastro({ 
      ...formCadastro, 
      setor: 'PENDENTE',
      funcao: 'Aguardando',
      status: 'PENDENTE'
    })
    
    fecharCadastro() // Usa a função de fechar que já limpa os campos
    alert('Solicitação enviada! Aguarde a aprovação do administrador.')
  } catch (e) {
    alert('Erro: Verifique se preencheu todos os campos corretamente.')
  }
}

// 4. AUXILIARES
function fecharCadastro() {
  showModalCadastro.value = false
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