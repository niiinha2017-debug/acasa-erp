//src/utils/utils.js

import api from '@/services/api'

/* =====================
   CEP
===================== */
export async function buscarCep(cep) {
  const n = String(cep ?? '').replace(/\D/g, '') // Garante que só tenha números
  if (n.length !== 8) return null

  try {
    const res = await fetch(`https://viacep.com.br/ws/${n}/json`)
    const data = await res.json()
    return data.erro ? null : data
  } catch (err) {
    return null
  }
}

export async function buscarCnpj(cnpj) {
  const limpo = String(cnpj || '').replace(/\D/g, '')
  if (limpo.length !== 14) return null

  try {
    const res = await api.get(`/utils/cnpj/${limpo}`)
    console.log('[buscarCnpj] status:', res.status)
    console.log('[buscarCnpj] data:', res.data)
    return res.data || null
  } catch (err) {
    console.log('[buscarCnpj] ERRO status:', err?.response?.status)
    console.log('[buscarCnpj] ERRO data:', err?.response?.data)
    return null
  }
}

/** Média de semanas por mês no ano (52/12) — usado para custo/hora consistente com o ano civil */
const SEMANAS_POR_MES = 52 / 12

/**
 * Custo por hora a partir do salário mensal e da carga horária semanal.
 * Fórmula: salário mensal / (horas por semana × semanas por mês).
 * @param {number} salarioMensal - Salário base mensal
 * @param {number} horasSemana - Carga horária semanal (ex.: 44 ou 48)
 * @param {number} [semanasMes=52/12] - Semanas por mês (padrão: média do ano)
 */
export function calcularCustoHora(salarioMensal, horasSemana = 48, semanasMes = SEMANAS_POR_MES) {
  const s = Number(salarioMensal || 0)
  const hs = Number(horasSemana || 0)
  const sm = Number(semanasMes || 0) || SEMANAS_POR_MES

  const horasMes = hs * sm
  if (!horasMes) return 0

  const v = s / horasMes
  return Math.round(v * 100) / 100
}


export function calcularHorasDiaPorSemana(horasSemana = 48, diasSemana = 6) {
  const hs = Number(horasSemana)
  const ds = Number(diasSemana)
  if (!hs || !ds) return 0
  return hs / ds
}

/** Converte "HH:MM" ou "HH:MM:SS" em horas decimais */
export function parseHHMMToDecimal(str) {
  if (!str || typeof str !== 'string') return 0
  const parts = str.trim().split(/[:\s]/).map(Number)
  const h = Number(parts[0]) || 0
  const m = Number(parts[1]) || 0
  const s = Number(parts[2]) || 0
  return h + m / 60 + s / 3600
}

/**
 * Calcula a carga horária diária a partir dos horários cadastrados.
 * Seg-Sex: (saida_1 - entrada_1) + (saida_2 - entrada_2)
 * Sábado: (sabado_saida - sabado_entrada) se preenchido
 * @param {Object} f - Funcionário com horario_entrada_1, saida_1, entrada_2, saida_2, horario_sabado_*
 * @returns {{ cargaSegSex: number, cargaSabado: number, cargaSemana: number }}
 */
export function derivarCargaDosHorarios(f) {
  if (!f) return { cargaSegSex: 0, cargaSabado: 0, cargaSemana: 0 }

  let cargaSegSex = 0
  const e1 = parseHHMMToDecimal(f.horario_entrada_1)
  const s1 = parseHHMMToDecimal(f.horario_saida_1)
  const e2 = parseHHMMToDecimal(f.horario_entrada_2)
  const s2 = parseHHMMToDecimal(f.horario_saida_2)
  if (s1 > e1) cargaSegSex += s1 - e1
  if (s2 > e2) cargaSegSex += s2 - e2

  let cargaSabado = 0
  const es = parseHHMMToDecimal(f.horario_sabado_entrada_1)
  const ss = parseHHMMToDecimal(f.horario_sabado_saida_1)
  if (ss > es) cargaSabado = ss - es

  const cargaSemana = 5 * cargaSegSex + cargaSabado
  return { cargaSegSex, cargaSabado, cargaSemana }
}

/**
 * Retorna a meta diária (em horas) para um dado dia da semana.
 * 0=Dom (0), 1-5=Seg-Sex (cargaSegSex), 6=Sáb (cargaSabado).
 * Se não houver horários, usa carga_horaria_dia ou carga_horaria_semana/6.
 */
export function metaDiaParaData(dataStr, funcionario) {
  const d = new Date(dataStr + 'T12:00:00').getDay()
  if (d === 0) return 0

  const cargaDia = Number(funcionario?.carga_horaria_dia || 0)
  const cargaSemana = Number(funcionario?.carga_horaria_semana || 0)
  const derivado = derivarCargaDosHorarios(funcionario)

  if (derivado.cargaSegSex > 0 || derivado.cargaSabado > 0) {
    return d === 6 ? derivado.cargaSabado : derivado.cargaSegSex
  }
  if (cargaDia > 0) return cargaDia
  if (cargaSemana > 0) return cargaSemana / 6
  return 0
}
export function calcularHorasTrabalhadasNoDia(registrosDoDia = []) {
  const regs = [...registrosDoDia]
    .filter(r => r?.status !== 'INVALIDADO')
    .slice()
    .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))

  let totalMs = 0
  let entrada = null

  for (const r of regs) {
    if (r.tipo === 'ENTRADA') {
      entrada = new Date(r.data_hora)
      continue
    }
    if (r.tipo === 'SAIDA' && entrada) {
      const saida = new Date(r.data_hora)
      const diff = saida - entrada
      if (diff > 0) totalMs += diff
      entrada = null
    }
  }

  return totalMs / 3600000 // horas em decimal
}

// mantém esta função (você ainda usa para horas e meta)
export function horasDecimalParaHHMM(h) {
  const totalMin = Math.round((Number(h) || 0) * 60)
  const hh = String(Math.floor(totalMin / 60)).padStart(2, '0')
  const mm = String(totalMin % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

export function horasDecimalParaHHMMComSinal(h) {
  const negativo = Number(h) < 0
  const abs = Math.abs(Number(h) || 0)

  const totalMin = Math.round(abs * 60)
  const hh = String(Math.floor(totalMin / 60)).padStart(2, '0')
  const mm = String(totalMin % 60).padStart(2, '0')

  return `${negativo ? '-' : ''}${hh}:${mm}`
}

/**
 * Consolida saldo do período com base nos registros de ponto.
 * Se `funcionario` for passado, usa meta variável por dia (Seg-Sex vs Sábado) derivada dos horários.
 * Caso contrário, usa meta fixa: horasSemana / diasSemana.
 */
export function consolidarSaldoPeriodo({
  registros = [],
  horasSemana = 48,
  diasSemana = 6,
  funcionario = null,
}) {
  const porDia = new Map()
  for (const r of registros) {
    const dia = new Date(r.data_hora).toISOString().slice(0, 10)
    if (!porDia.has(dia)) porDia.set(dia, [])
    porDia.get(dia).push(r)
  }

  const dias = Array.from(porDia.keys()).sort()
  const metaFix = funcionario
    ? null
    : calcularHorasDiaPorSemana(horasSemana, diasSemana)

  const linhas = dias.map((dia) => {
    const metaDia = funcionario
      ? metaDiaParaData(dia, funcionario)
      : metaFix
    const h = calcularHorasTrabalhadasNoDia(porDia.get(dia))
    const saldo = h - metaDia
    return {
      dia,
      horas: h,
      horasHHMM: horasDecimalParaHHMM(h),
      meta: metaDia,
      metaHHMM: horasDecimalParaHHMM(metaDia),
      saldo,
      saldoHHMM: horasDecimalParaHHMMComSinal(saldo),
    }
  })

  const totalHoras = linhas.reduce((acc, l) => acc + l.horas, 0)
  const totalSaldo = linhas.reduce((acc, l) => acc + l.saldo, 0)
  const derivado = funcionario ? derivarCargaDosHorarios(funcionario) : null
  const metaDiaDisplay =
    metaFix ??
    (derivado?.cargaSegSex > 0 ? derivado.cargaSegSex : derivado?.cargaSabado ?? 0)

  return {
    metaDia: metaDiaDisplay,
    linhas,
    totalHoras,
    totalHorasHHMM: horasDecimalParaHHMM(totalHoras),
    totalSaldo,
    totalSaldoHHMM: horasDecimalParaHHMMComSinal(totalSaldo),
  }
}

