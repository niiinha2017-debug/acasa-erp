/* Frontend/app.js */

// Importa as ferramentas da nossa "Caixa de Ferramentas" V4
import { api } from './JS/core/ApiService.js'; 
import { AppConfig } from './JS/config/AppConfig.js';
import { DOMHelper } from './JS/utils/DOMHelper.js';

// Função de Login
async function fazerLogin() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    if (!email || !senha) {
        DOMHelper.notify('Preencha e-mail e senha.', 'info');
        return;
    }

    try {
        // 1. Mostra o spinner de carregamento
        DOMHelper.showLoading(true);

        // 2. Chama a API (O ApiService já trata erros de conexão)
        // OBS: Se sua API AWS esperar { "username": ... } mude aqui.
        // Vou assumir o padrão { email, password }
        const resposta = await api.post('/login', { email, password: senha });

        // 3. Se chegou aqui, deu certo! Salva o Token.
        // O backend deve retornar algo como { token: "...", user: {...} }
        if (resposta && resposta.token) {
            localStorage.setItem(AppConfig.STORAGE_KEYS.TOKEN, resposta.token);
            
            if (resposta.user) {
                localStorage.setItem(AppConfig.STORAGE_KEYS.USER, JSON.stringify(resposta.user));
            }

            // 4. Redireciona para o Dashboard
            window.location.href = AppConfig.ROUTES.DASHBOARD;
        } else {
            throw new Error('Resposta do servidor inválida (sem token).');
        }

    } catch (error) {
        // Se der erro (senha errada, servidor fora), o DOMHelper avisa
        console.error(error);
        DOMHelper.notify(error.message || 'Erro ao fazer login', 'error');
    } finally {
        // Esconde o spinner (sempre roda, dando erro ou certo)
        DOMHelper.showLoading(false);
    }
}

// CRUCIAL: Como é um módulo, a função 'fazerLogin' fica "presa" dentro do arquivo.
// Precisamos "pendurar" ela na janela (window) para o HTML conseguir clicar.
window.fazerLogin = fazerLogin;