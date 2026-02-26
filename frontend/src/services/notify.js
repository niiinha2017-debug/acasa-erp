import { reactive } from 'vue'

// A lista de notificações ativa na tela
export const notifications = reactive([])
const MOJIBAKE_REGEX = /(Ã.|Â|�|â€™|â€œ|â€|ðŸ)/u

export const notify = {
  // Função mestre para adicionar qualquer aviso
  add(message, type = 'success', timeout = 3000) {
    const text = String(message ?? '')
    if (type === 'error') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5584e6b5-c550-4991-8207-4f83f59c9ff1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '1125e2'
        },
        body: JSON.stringify({
          sessionId: '1125e2',
          runId: 'pre-fix',
          hypothesisId: 'H5',
          location: 'src/services/notify.js:add:error',
          message: 'Toast de erro emitido',
          data: {
            sample: text.slice(0, 180)
          },
          timestamp: Date.now()
        })
      }).catch(() => {})
      // #endregion
    }
    if (MOJIBAKE_REGEX.test(text)) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5584e6b5-c550-4991-8207-4f83f59c9ff1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '1125e2'
        },
        body: JSON.stringify({
          sessionId: '1125e2',
          runId: 'pre-fix',
          hypothesisId: 'H3',
          location: 'src/services/notify.js:add',
          message: 'Mojibake detectado na mensagem exibida em toast',
          data: {
            type,
            sample: text.slice(0, 180)
          },
          timestamp: Date.now()
        })
      }).catch(() => {})
      // #endregion
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

  remove(id) {
    const index = notifications.findIndex(n => n.id === id)
    if (index !== -1) notifications.splice(index, 1)
  }
}