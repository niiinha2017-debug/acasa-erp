export class DOMHelper {
    
    // Mostra/Esconde aviso de carregamento
    static showLoading(isLoading) {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = isLoading ? 'flex' : 'none';
        } else {
            // Fallback simples se não tiver loader no HTML
            document.body.style.cursor = isLoading ? 'wait' : 'default';
        }
    }

    // Notificações (Troque por SweetAlert depois se quiser)
    static notify(message, type = 'info') {
        // type: 'success', 'error', 'info'
        alert(`${type.toUpperCase()}: ${message}`);
    }

    // Formata Moeda (R$)
    static formatMoney(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
}