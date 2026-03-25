export const format = {
  currency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)
  },

  date(value) {
    if (!value) return '—'

    const s = String(value)
    const dpart = s.includes('T') ? s.split('T')[0] : s

    const m = dpart.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) {
      const [, y, mo, d] = m
      return `${d}/${mo}/${y}`
    }

    return new Date(value).toLocaleDateString('pt-BR')
  },
}

// ✅ adiciona isso:
export default format
