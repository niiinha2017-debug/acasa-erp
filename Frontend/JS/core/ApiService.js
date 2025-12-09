import { AppConfig } from "../config/api.js";

class ApiService {
    async request(endpoint, method = "GET", body = null) {
        const token = localStorage.getItem(AppConfig.STORAGE_KEYS.TOKEN);

        const headers = {
            "Content-Type": "application/json"
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // 🔥 DEBUG AQUI (antes do fetch)
        console.log("🌐 FETCH:", AppConfig.API_BASE_URL + endpoint, {
            method,
            body,
            headers
        });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), AppConfig.TIMEOUT);

        try {

            const response = await fetch(AppConfig.API_BASE_URL + endpoint, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null,
                signal: controller.signal
            });

            // 🔥 DEBUG DA RESPOSTA
            console.log("📤 RESPONSE STATUS:", response.status);

            const data = await response.json().catch(() => ({}));

            console.log("📤 RESPONSE BODY:", data);

            if (!response.ok || data.success === false) {
                throw new Error(data.message || "Erro na requisição");
            }

            return data;

        } finally {
            clearTimeout(timeout);
        }
    }

    get(endpoint) {
        return this.request(endpoint, "GET");
    }

    post(endpoint, body) {
        return this.request(endpoint, "POST", body);
    }
}

export const api = new ApiService();

