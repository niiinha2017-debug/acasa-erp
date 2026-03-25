/**
 * Lógica de cronômetro para apontamentos em andamento na Timeline.
 * Uso: const { isApontamentoEmAndamento, totalHorasTarefa, ... } = useTimelineCronometro(cronometroAgora, { horasExibir })
 */
export function useTimelineCronometro(cronometroAgora, { horasExibir }) {
  function isApontamentoEmAndamento(ap) {
    if (!ap?.inicio_em || !ap?.fim_em) return false
    const diff = new Date(ap.fim_em).getTime() - new Date(ap.inicio_em).getTime()
    return diff >= 0 && diff < 3000
  }

  function isCronometroPausado(ap) {
    return !!ap?.pausa_inicio_em && !ap?.pausa_fim_em
  }

  function elapsedCronometro(ap) {
    if (!ap?.inicio_em) return 0
    const inicio = new Date(ap.inicio_em).getTime()
    const agora = cronometroAgora.value
    let pausadoMs = (Number(ap.pausa_total_segundos) || 0) * 1000
    if (ap.pausa_inicio_em && !ap.pausa_fim_em) {
      pausadoMs += agora - new Date(ap.pausa_inicio_em).getTime()
    } else if (ap.pausa_inicio_em && ap.pausa_fim_em) {
      pausadoMs += new Date(ap.pausa_fim_em).getTime() - new Date(ap.pausa_inicio_em).getTime()
    }
    return Math.max(0, Math.floor((agora - inicio - pausadoMs) / 1000))
  }

  function formatElapsed(seconds) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  function temCronometroRodandoNaTarefa(tarefa) {
    for (const ap of tarefa?.apontamentos_producao || []) {
      if (isApontamentoEmAndamento(ap) && !isCronometroPausado(ap)) return true
    }
    return false
  }

  function totalHorasTarefa(tarefa) {
    const aps = tarefa?.apontamentos_producao || []
    let total = 0
    for (const ap of aps) {
      if (isApontamentoEmAndamento(ap)) {
        total += elapsedCronometro(ap) / 3600
      } else {
        total += horasExibir(ap)
      }
    }
    return Math.round(total * 100) / 100
  }

  return {
    isApontamentoEmAndamento,
    isCronometroPausado,
    elapsedCronometro,
    formatElapsed,
    temCronometroRodandoNaTarefa,
    totalHorasTarefa,
  }
}
