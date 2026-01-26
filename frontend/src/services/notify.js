import { reactive } from 'vue'

// A lista de notificações ativa na tela
export const notifications = reactive([])

export const notify = {
  // Função mestre para adicionar qualquer aviso
  add(message, type = 'success', timeout = 3000) {
    const id = Date.now()
    notifications.push({ id, message, type })

    // Remove automaticamente depois do tempo (3 segundos)
    setTimeout(() => {
      this.remove(id)
    }, timeout)
  },

  // Atalhos para não precisar digitar o tipo toda hora
  success(msg) { this.add(msg, 'success') },
  error(msg) { this.add(msg, 'error', 5000) }, // Erro fica 5 seg na tela
  info(msg) { this.add(msg, 'info') },
  warn(msg) { this.add(msg, 'info') },

  remove(id) {
    const index = notifications.findIndex(n => n.id === id)
    if (index !== -1) notifications.splice(index, 1)
  }
}