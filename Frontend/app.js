import { api } from './JS/core/ApiService.js'; 
import { AppConfig } from './JS/config/AppConfig.js';
import { DOMHelper } from './JS/utils/DOMHelper.js';

async function fazerLogin() {
    // ... seu código novo ...
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    // ... (o restante do código que fizemos antes)
    if (!email || !senha) { DOMHelper.notify('Preencha...', 'info'); return; }
    try {
        DOMHelper.showLoading(true);
        const resposta = await api.post('/login', { email, password: senha });
        if (resposta && resposta.token) {
            localStorage.setItem(AppConfig.STORAGE_KEYS.TOKEN, resposta.token);
            if (resposta.user) localStorage.setItem(AppConfig.STORAGE_KEYS.USER, JSON.stringify(resposta.user));
            window.location.href = AppConfig.ROUTES.DASHBOARD;
        }
    } catch (error) { console.error(error); DOMHelper.notify(error.message, 'error'); } 
    finally { DOMHelper.showLoading(false); }
}
window.fazerLogin = fazerLogin;