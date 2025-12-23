<template>
  <div class="login-split">

    <!-- LADO ESQUERDO -->
    <div class="login-left-side">
      <div class="left-content">

        <div class="brand-header">
          <h1 class="brand-title">A Casa</h1>
          <h2 class="brand-subtitle">Sistema de Gestão</h2>
        </div>

<div class="features-grid">
  <div class="feature-card">
    <div class="feature-icon">🏠</div>
    <div class="feature-content">
      <h3>Financeiro</h3>
      <p>Receitas e despesas</p>
    </div>
  </div>

  <div class="feature-card">
    <div class="feature-icon">🏭</div>
    <div class="feature-content">
      <h3>Produção</h3>
      <p>Processos em tempo real</p>
    </div>
  </div>

  <div class="feature-card">
    <div class="feature-icon">📊</div>
    <div class="feature-content">
      <h3>Gestão</h3>
      <p>Controle e relatórios do negócio</p>
    </div>
  </div>
</div>
      </div>
    </div>

    <!-- LADO DIREITO -->
    <div class="login-right-side">
      <div class="right-content">

        <div class="form-header">
          <h2 class="form-title">Acesso</h2>
          <p class="form-subtitle">Entre com suas credenciais</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">

          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input
              type="email"
              class="form-input"
              v-model="email"
              placeholder="admin@acasa.com"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Senha</label>
            <div class="input-container">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                v-model="password"
                required
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <!-- LINK ESQUECI SENHA -->
          <div class="mt-1">
            <a
              href="#"
              class="request-access-link"
              @click.prevent="exibirModalEsqueciSenha = true"
            >
              Esqueci minha senha
            </a>
          </div>

          <button
            type="submit"
            class="submit-button"
            :disabled="isLoading"
            :aria-busy="isLoading"
          >
            {{ isLoading ? 'Entrando...' : 'Entrar no sistema' }}
          </button>

          <p class="request-access-link">
            Ainda não tem acesso?
            <a href="#" @click.prevent="showModal = true">Solicitar Cadastro</a>
          </p>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

        </form>

      </div>
    </div>

<!-- MODAL SOLICITAR ACESSO -->
<div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
  <div class="modal-container">
    <div class="modal-header">
      <h3>Solicitar Acesso</h3>
      <p>Seus dados serão analisados pelo administrador.</p>
    </div>

    <form @submit.prevent="handleRequestAccess">
      <div class="form-group">
        <label class="form-label">Nome Completo</label>
        <input class="form-input" v-model="formRequest.nome" required />
      </div>

      <div class="form-group">
        <label class="form-label">E-mail</label>
        <input class="form-input" v-model="formRequest.email" required />
      </div>

      <div class="form-group">
        <label class="form-label">Usuário</label>
        <input class="form-input" v-model="formRequest.usuario" required />
      </div>

      <div class="form-group">
        <label class="form-label">Senha</label>
        <input type="password" class="form-input" v-model="formRequest.senha" required />
      </div>

      <div class="modal-footer modal-footer-actions">
        <button type="button" class="btn-cancel" @click="showModal = false">
          Cancelar
        </button>
        <button type="submit" class="submit-button">
          Enviar
        </button>
      </div>
    </form>
  </div>
</div>

   <!-- MODAL RECUPERAR SENHA -->
<div
  v-if="exibirModalEsqueciSenha"
  class="modal-overlay"
  @click.self="exibirModalEsqueciSenha = false"
>
  <div class="modal-container">

    <div class="modal-header">
      <h3>Recuperar Senha</h3>
      <p>Digite seu e-mail cadastrado para receber as instruções.</p>
    </div>

    <form @submit.prevent="enviarSolicitacaoSenha">

      <div class="form-group">
        <label class="form-label">E-mail</label>
        <input
          type="email"
          class="form-input"
          v-model="emailRecuperacao"
          placeholder="seu@email.com"
          required
        />
      </div>

      <div class="modal-footer modal-footer-actions">
  <button
    type="button"
    class="btn-cancel"
    @click="exibirModalEsqueciSenha = false"
  >
    Cancelar
  </button>

  <button
    type="submit"
    class="submit-button"
    :disabled="carregando"
  >
    {{ carregando ? 'Enviando...' : 'Enviar Link' }}
  </button>
</div>


    </form>

  </div>
</div>
  </div>
</template>



<script setup>
import '../assets/CSS/Login.css';
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/services/useauth';
import api from '@/services/api'; // Certifique-se que aponta para seu axios

const exibirModalEsqueciSenha = ref(false);
const emailRecuperacao = ref('');
const carregando = ref(false);

const enviarSolicitacaoSenha = async () => {
  if (!emailRecuperacao.value) {
    return alert('Por favor, digite seu e-mail.');
  }

  try {
    carregando.value = true;
    // Chama a rota do backend que cria o token e envia o e-mail
    await api.post('/auth/forgot-password', { email: emailRecuperacao.value }); 
    
    alert('Se o e-mail existir no sistema, você receberá um link de recuperação em instantes.');
    exibirModalEsqueciSenha.value = false;
  } catch (error) {
    alert('Erro ao processar solicitação. Tente novamente.');
  } finally {
    carregando.value = false;
  }
};

const router = useRouter();
const auth = useAuth();

// Login
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

// Modal
const showModal = ref(false);
const isRequesting = ref(false);
const formRequest = reactive({
  nome: '',
  email: '',
  usuario: '',
  senha: ''
});

const handleLogin = async () => {
  isLoading.value = true;
  try {
    const result = await auth.login({ email: email.value, password: password.value });
    if (result?.success !== false) {
  console.log('REDIRECT PARA / AGORA')
  router.push('/')
}

    else errorMessage.value = result?.message || 'Erro ao fazer login';
  } catch (err) {
    errorMessage.value = 'Erro inesperado';
  } finally { isLoading.value = false; }
};

const handleRequestAccess = async () => {
  isRequesting.value = true;
  try {
    // Usamos o 'api' (axios) em vez de 'fetch' para seguir o padrão do seu projeto
    const response = await api.post('/users/registrar', {
      name: formRequest.nome,      // Mapeando 'nome' do formulário para 'name' do banco
      email: formRequest.email,
      usuario: formRequest.usuario,
      password: formRequest.senha  // Mapeando 'senha' para 'password' do banco
    });

    if (response.status === 201 || response.status === 200) {
      alert('Solicitação enviada com sucesso! Aguarde a aprovação do administrador.');
      showModal.value = false;
      // Limpa os campos após enviar
      formRequest.name = '';
      formRequest.email = '';
      formRequest.usuario = '';
      formRequest.senha = '';
    }
  } catch (err) {
    console.error('Erro detalhado:', err.response?.data);
    const mensagem = err.response?.data?.message || 'Erro ao enviar solicitação.';
    alert(mensagem);
  } finally {
    isRequesting.value = false;
  }
};
</script>

<route lang="yaml">
meta:
  layout: auth
  public: true
</route>