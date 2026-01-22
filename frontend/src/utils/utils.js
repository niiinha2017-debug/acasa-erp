//src/utils/utils.js

import api from '@/services/api'

/* =====================
   CEP
===================== */
export async function buscarCep(cep) {
  const n = cep.replace(/\D/g, '') // Garante que só tenha números
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

export function calcularCustoHora(salarioMensal, horasSemana = 48, semanasMes = 4.5) {
  const s = Number(salarioMensal || 0)
  const hs = Number(horasSemana || 0)
  const sm = Number(semanasMes || 0)

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

export function consolidarSaldoPeriodo({ registros = [], horasSemana = 48, diasSemana = 6 }) {
  const metaDia = calcularHorasDiaPorSemana(horasSemana, diasSemana)

  const porDia = new Map()
  for (const r of registros) {
    const dia = new Date(r.data_hora).toISOString().slice(0, 10)
    if (!porDia.has(dia)) porDia.set(dia, [])
    porDia.get(dia).push(r)
  }

  const dias = Array.from(porDia.keys()).sort()
  const linhas = dias.map((dia) => {
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

  return {
    metaDia,
    linhas,
    totalHoras,
    totalHorasHHMM: horasDecimalParaHHMM(totalHoras),
    totalSaldo,
    totalSaldoHHMM: horasDecimalParaHHMMComSinal(totalSaldo),
  }
}

