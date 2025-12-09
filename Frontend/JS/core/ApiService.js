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

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), AppConfig.TIMEOUT);

        try {
            const response = await fetch(AppConfig.API_BASE_URL + endpoint, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null,
                signal: controller.signal
            });

            const data = await response.json().catch(() => ({}));

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
