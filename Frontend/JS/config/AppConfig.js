export const AppConfig = {
    // URL da sua API na AWS (Quando o DNS propagar, já vai funcionar)
    API_BASE_URL: "https://api.iniciantevencedor.com.br/api",
    
    // Se estiver testando localmente sem HTTPS, descomente a linha abaixo:
    // API_BASE_URL: "http://localhost:3000/api",

    TIMEOUT: 15000, // Tempo máximo de espera (15s)
    
    ROUTES: {
        LOGIN: '/index.html',
        DASHBOARD: '/dashboard.html'
    },

    // Chaves para salvar no navegador (Local Storage)
    STORAGE_KEYS: {
        TOKEN: 'acasa_token',
        USER: 'acasa_user_data'
    }
};