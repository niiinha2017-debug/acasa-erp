// =========================
//  AUTH - LOGIN MODULE
// =========================

// Import loader global
import { showLoader, hideLoader } from "../../Shared/helpers/loader.js";

// Import API base config
import API from "../../config/api.js"; 
// (vamos criar api.js em seguida se ainda não existir)


// ====================================================
//  FUNÇÃO PRINCIPAL DE LOGIN
// ====================================================
export async function fazerLogin() {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
        return alert("Preencha e-mail e senha!");
    }

    try {
        showLoader("Validando credenciais...");

        const response = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (!response.ok) {
            hideLoader();
            return alert(data.message || "Falha ao acessar o sistema.");
        }

        // Salva token no navegador
        localStorage.setItem("ACASA_TOKEN", data.token);
        localStorage.setItem("ACASA_USER", JSON.stringify(data.user));

        hideLoader();
        window.location.href = "dashboard.html"; // Página após login

    } catch (error) {
        hideLoader();
        alert("Erro ao conectar ao servidor.");
        console.error("LOGIN ERROR:", error);
    }
}
