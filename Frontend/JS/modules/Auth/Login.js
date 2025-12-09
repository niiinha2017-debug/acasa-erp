import { api } from "../core/ApiService.js";
import { AppConfig } from "../config/api.js";

export async function fazerLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
        alert("Preencha o e-mail e a senha.");
        return;
    }

    try {
        const result = await api.post("/auth/login", { email, senha });

        if (result.success) {
            localStorage.setItem(AppConfig.STORAGE_KEYS.TOKEN, result.token);
            localStorage.setItem(AppConfig.STORAGE_KEYS.USER, JSON.stringify(result.user));

            alert("Login realizado com sucesso!");

            // ❗NÃO REDIRECIONA PRA DASHBOARD  
            // Aqui você define a próxima página no futuro.
            // Exemplo:
            // window.location.href = "/Frontend/alguma-pagina.html";
        }
    } catch (err) {
        alert(err.message || "Erro ao fazer login");
    }
}

window.fazerLogin = fazerLogin;
