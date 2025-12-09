import { Auth } from '../core/Auth.js'; // Se tiver, ou usa lógica local

export function initMenu() {
    console.log("Menu iniciado...");
    
    // 1. Mostrar Nome do Usuário
    const userStr = localStorage.getItem('acasa_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const display = document.getElementById('userNameDisplay');
            if(display) display.innerText = user.nome || user.email || 'Usuário';
        } catch (e) { console.error("Erro ao ler usuário"); }
    }

    // 2. Configurar Botão Sair (Logout)
    const btnLogout = document.getElementById('logoutBtn');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if(confirm("Deseja realmente sair?")) {
                localStorage.removeItem('acasa_token');
                localStorage.removeItem('acasa_user');
                window.location.href = '../index.html'; // Volta para o Login
            }
        });
    }

    // 3. Menu Mobile (Hamburger)
    const btnMobile = document.querySelector('.menu-hamburger');
    const menuContainer = document.getElementById('topbarMenu');
    
    if (btnMobile && menuContainer) {
        btnMobile.addEventListener('click', () => {
            menuContainer.classList.toggle('active'); // CSS faz o resto
        });
    }
}

// Auto-inicia se o documento já estiver carregado
if (document.readyState === 'complete') {
    initMenu();
} else {
    document.addEventListener('DOMContentLoaded', initMenu);
}