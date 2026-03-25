/**
 * Fecha a aba atual (no sistema de abas do layout) e navega para o path.
 * Uso: após salvar ou excluir em qualquer formulário.
 * @param {string} to - Caminho de destino (ex: '/orcamentos', '/vendas')
 */
export function closeTabAndGo(to) {
  window.dispatchEvent(
    new CustomEvent('acasa-close-current-tab-and-go', { detail: { to: to || '/' } })
  )
}
