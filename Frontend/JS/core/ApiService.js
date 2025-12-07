import { AppConfig } from '../config/AppConfig.js';

class ApiService {
    constructor() {
        this.baseUrl = AppConfig.API_BASE_URL;
    }

    async _request(endpoint, method, body = null) {
        // Pega o token salvo
        const token = localStorage.getItem(AppConfig.STORAGE_KEYS.TOKEN);
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Se tiver token, anexa no cabeçalho automaticamente
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);

            // Se der erro 401 (Sessão Expirada), desloga na hora
            if (response.status === 401) {
                this.handleUnauthorized();
                return null;
            }

            // Se der outro erro, lança para o sistema tratar
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro do Servidor: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`[Erro API] ${method} ${endpoint}:`, error);
            throw error;
        }
    }

    handleUnauthorized() {
        // Limpa tudo e manda pro login
        localStorage.removeItem(AppConfig.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(AppConfig.STORAGE_KEYS.USER);
        window.location.href = AppConfig.ROUTES.LOGIN;
    }

    // Métodos Públicos (Simplificados)
    get(endpoint) { return this._request(endpoint, 'GET'); }
    post(endpoint, body) { return this._request(endpoint, 'POST', body); }
    put(endpoint, body) { return this._request(endpoint, 'PUT', body); }
    delete(endpoint) { return this._request(endpoint, 'DELETE'); }
}

// Exporta uma única instância para o projeto todo usar
export const api = new ApiService();