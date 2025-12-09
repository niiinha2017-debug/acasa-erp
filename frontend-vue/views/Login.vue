<script setup>
import { ref } from 'vue';
import { api } from '../services/api'; // Importa sua API configurada

// Variáveis Reativas (v-model)
const email = ref('admin@acasa.com'); // Valor padrão para teste
const senha = ref('123456');
const carregando = ref(false);
const erro = ref('');

// Função de Login
async function fazerLogin() {
    // Limpa erros anteriores
    erro.value = '';

    if (!email.value || !senha.value) {
        erro.value = 'Por favor, preencha todos os campos.';
        return;
    }

    carregando.value = true;

    try {
        // Chama o Backend (usando seu arquivo api.js)
        const resposta = await api.post('/auth/login', { 
            email: email.value, 
            senha: senha.value 
        });

        // Se chegou aqui, deu certo! Salva o token.
        localStorage.setItem('acasa_token', resposta.token);
        localStorage.setItem('acasa_user', JSON.stringify(resposta.user));

        alert('Login realizado! Bem-vindo(a) ' + resposta.user.nome);
        
        // AQUI VAMOS DIRECIONAR PRO DASHBOARD (No futuro usaremos Router)
        // window.location.href = '/dashboard'; 

    } catch (error) {
        console.error(error);
        erro.value = error.message || 'Erro ao conectar com o servidor.';
    } finally {
        carregando.value = false;
    }
}
// Adicione isso logo no começo do <script setup>
const emit = defineEmits(['login-sucesso']);

// ... dentro da função fazerLogin, logo depois de salvar o token:
// localStorage.setItem...
emit('login-sucesso'); // <--- AVISA O APP QUE LOGOU
</script>

<template>
    <div class="auth-container">

        <aside class="auth-left">
            <div class="auth-left-content">
                <div class="auth-logo">
                    <h1><i class="fas fa-home"></i> A Casa</h1>
                    <p>Sistema de Gestão Empresarial</p>
                </div>
                <section class="auth-features">
                    <article class="auth-feature">
                        <h3><i class="fas fa-chart-line"></i> Gestão Estratégica</h3>
                        <p>Controle financeiro e produção em um só lugar.</p>
                    </article>
                </section>
            </div>
        </aside>

        <main class="auth-right">
            <article class="auth-card">
                <h2 class="auth-title">Acessar Sistema</h2>
                <p class="auth-subtitle">Digite suas credenciais</p>

                <form @submit.prevent="fazerLogin" class="auth-form">

                    <div class="auth-group">
                        <label class="auth-label">E-mail</label>
                        <input 
                            type="text" 
                            v-model="email" 
                            class="auth-input" 
                            placeholder="exemplo@acasa.com"
                            autofocus
                        >
                    </div>

                    <div class="auth-group">
                        <label class="auth-label">Senha</label>
                        <input 
                            type="password" 
                            v-model="senha" 
                            class="auth-input" 
                            placeholder="••••••"
                        >
                    </div>

                    <div v-if="erro" class="alert error" style="margin-bottom: 15px; font-size: 0.9rem;">
                        {{ erro }}
                    </div>

                    <button type="submit" class="auth-btn" :disabled="carregando">
                        <span v-if="!carregando">
                            Entrar <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
                        </span>
                        <span v-else>
                            <i class="fas fa-spinner fa-spin"></i> Acessando...
                        </span>
                    </button>

                    <div class="auth-links">
                        <a href="#">Esqueci minha senha</a>
                    </div>

                </form>
            </article>
        </main>

    </div>
</template>

<style scoped>
/* O 'scoped' garante que esse CSS só afete ESSA tela.
   Importamos o CSS específico do Login que você já tinha criado.
*/
@import '../assets/css/pages/Login.css';
</style>