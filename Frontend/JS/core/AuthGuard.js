import { AppConfig } from '../config/AppConfig.js';

export class AuthGuard {
    
    // Verifica se o usuário pode estar aqui
    static checkPermission() {
        const token = localStorage.getItem(AppConfig.STORAGE_KEYS.TOKEN);
        const path = window.location.pathname;
        
        // Se está na tela de login
        const isLoginPage = path.includes('index.html') || path === '/' || path.endsWith('/Frontend/');

        if (!token && !isLoginPage) {
            // Não tem token e tentou entrar -> Chuta pro Login
            window.location.href = AppConfig.ROUTES.LOGIN;
            return false;
        }

        if (token && isLoginPage) {
            // Já tem token e tentou ir pro login -> Joga pro Dashboard
            window.location.href = AppConfig.ROUTES.DASHBOARD;
            return false;
        }

        return true;
    }

    // Retorna os dados do usuário logado
    static getUser() {
        const data = localStorage.getItem(AppConfig.STORAGE_KEYS.USER);
        return data ? JSON.parse(data) : null;
    }
}