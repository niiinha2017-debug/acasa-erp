export const format = {
  currency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  },

  date(value) {
    return new Date(value).toLocaleDateString('pt-BR')
  }
}
