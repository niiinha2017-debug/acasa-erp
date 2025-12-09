console.log("TESTE LOGIN.JS — CARREGOU");

import { api } from "../../services/ApiService.js";

window.fazerLogin = async function () {
    console.log("FUNÇÃO CHAMADA — OK");

    const email = document.querySelector("#email").value.trim();
    const senha = document.querySelector("#senha").value.trim();

    if (!email || !senha) {
        alert("Preencha e-mail e senha.");
        return;
    }

    try {
        const response = await api.post("/auth/login", {
            email,
            senha
        });

        console.log("RESPOSTA LOGIN:", response);

        if (!response.token) {
            alert("Usuário ou senha inválidos.");
            return;
        }

        // Salvar token e user
        localStorage.setItem("ACASA_TOKEN", response.token);
        localStorage.setItem("ACASA_USER", JSON.stringify(response.user));

        window.location.href = "/Frontend/index.html";

    } catch (error) {
        console.error("ERRO LOGIN:", error);
        alert("Erro ao fazer login.");
    }
};
