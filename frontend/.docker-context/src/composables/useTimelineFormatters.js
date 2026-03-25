/**
 * Formatadores e helpers puros para a Timeline de Apontamento.
 * Uso: const { formatarData, timeLabel, iniciaisTarefa, ... } = useTimelineFormatters()
 */
export function useTimelineFormatters() {
  function pad2(n) {
    return String(n).padStart(2, '0')
  }

  function toDateOnly(d) {
    const x = new Date(d)
    return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`
  }

  function toDateTimeLocal(d) {
    const x = new Date(d)
    return `${toDateOnly(x)}T${pad2(x.getHours())}:${pad2(x.getMinutes())}`
  }

  function formatarData(val) {
    if (!val) return '—'
    return new Date(val).toLocaleDateString('pt-BR')
  }

  function timeLabel(val) {
    if (!val) return '—'
    return new Date(val).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  function formatarHorasParaExibicao(horasDecimais) {
    if (horasDecimais == null || Number.isNaN(horasDecimais)) return '—'
    const h = Math.floor(horasDecimais)
    const m = Math.round((horasDecimais - h) * 60)
    if (h > 0 && m > 0) return `${h}h ${m}min`
    if (h > 0) return `${h}h`
    if (m > 0) return `${m}min`
    return '0h'
  }

  function calcularHorasReais(item) {
    if (!item?.inicio_em || !item?.fim_em) return null
    const inicioMs = new Date(item.inicio_em).getTime()
    const fimMs = new Date(item.fim_em).getTime()
    let diffMs = fimMs - inicioMs
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000
    let pausaMs = 0
    if (Number(item.pausa_total_segundos) > 0) {
      pausaMs = Number(item.pausa_total_segundos) * 1000
    } else if (item.pausa_inicio_em && item.pausa_fim_em) {
      pausaMs = new Date(item.pausa_fim_em).getTime() - new Date(item.pausa_inicio_em).getTime()
      if (pausaMs < 0) pausaMs = 0
    }
    diffMs = Math.max(0, diffMs - pausaMs)
    return diffMs / (1000 * 60 * 60)
  }

  /**
   * Horas a exibir: usa o valor salvo pelo backend (item.horas) quando existir, para a conta bater com o que foi gravado.
   * Recalcula só quando não houver horas salvas (ex.: registro antigo ou em andamento que ainda não tem fim).
   */
  function horasExibir(item) {
    const horasSalvas = item?.horas
    if (horasSalvas != null && typeof horasSalvas === 'number' && !Number.isNaN(horasSalvas)) {
      return Math.round(horasSalvas * 100) / 100
    }
    const calculado = calcularHorasReais(item)
    if (calculado != null) return Math.round(calculado * 100) / 100
    return 0
  }

  function iniciaisTarefa(tarefa) {
    if (!tarefa) return 'TA'
    const nome = tarefa?.cliente?.nome_completo || tarefa?.cliente?.razao_social || tarefa?.titulo || ''
    const partes = String(nome).trim().split(/\s+/).filter(Boolean)
    if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase().slice(0, 2)
    if (partes.length === 1 && partes[0].length >= 2) return partes[0].slice(0, 2).toUpperCase()
    return 'TA'
  }

  function tarefaAtrasada(tarefa) {
    if (!tarefa) return false
    if (String(tarefa?.status || '').toUpperCase() === 'CONCLUIDO') return false
    return !!(tarefa.fim_em && new Date(tarefa.fim_em) < new Date())
  }

  return {
    pad2,
    toDateOnly,
    toDateTimeLocal,
    formatarData,
    timeLabel,
    formatarHorasParaExibicao,
    calcularHorasReais,
    horasExibir,
    iniciaisTarefa,
    tarefaAtrasada,
  }
}
