import { reactive } from 'vue'

// A lista de notificações ativa na tela
export const notifications = reactive([])
const MOJIBAKE_REGEX = /(Ã.|Â|�|â€™|â€œ|â€|ðŸ)/u

export const notify = {
  // Função mestre para adicionar qualquer aviso
  add(message, type = 'success', timeout = 3000) {
    const text = String(message ?? '')
    if (type === 'error') {
      // Debug ingest desativado
    }
    if (MOJIBAKE_REGEX.test(text)) {
      // Mojibake detectado (log desativado)
    }
    const id = Date.now()
    notifications.push({ id, message, type })

    // Remove automaticamente depois do tempo (3 segundos)
    setTimeout(() => {
      this.remove(id)
    }, timeout)
  },

  // Atalhos para não precisar digitar o tipo toda hora
  success(msg) { this.add(msg, 'success') },
  error(msg) { this.add(msg, 'error', 12000) }, // Erro fica mais tempo para leitura
  info(msg) { this.add(msg, 'info') },
  warn(msg) { this.add(msg, 'info') },
  warning(msg) { this.add(msg, 'info') }, // alias para warn

  remove(id) {
    const index = notifications.findIndex(n => n.id === id)
    if (index !== -1) notifications.splice(index, 1)
  }
}