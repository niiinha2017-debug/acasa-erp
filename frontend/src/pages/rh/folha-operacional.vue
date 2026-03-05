<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-5 animate-page-in">
    <div class="bg-bg-card border border-border-ui rounded-2xl shadow-sm overflow-hidden">
      <header class="p-6 border-b border-border-ui bg-bg-page/60">
        <h1 class="text-xl font-black text-text-main uppercase tracking-wide">
          Fechamento de Folha Operacional
        </h1>
        <p class="text-[11px] font-bold text-text-soft uppercase mt-2 tracking-wider">
          Feriados · Fechamento · Pagamento a funcionário — Créditos (salário base, horas extras 50%, domingo/feriado 100%) e débitos (Vale/Adiantamento) em tempo real.
        </p>
      </header>

      <div class="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div class="md:col-span-2">
          <label class="text-[10px] font-black text-text-soft uppercase ml-1 mb-1 block">Início</label>
          <input
            v-model="filtros.data_ini"
            type="date"
            class="w-full h-11 bg-bg-page border border-border-ui rounded-xl px-4 text-xs font-bold outline-none"
            @change="carregarDados"
          />
        </div>
        <div class="md:col-span-2">
          <label class="text-[10px] font-black text-text-soft uppercase ml-1 mb-1 block">Fim</label>
          <input
            v-model="filtros.data_fim"
            type="date"
            class="w-full h-11 bg-bg-page border border-border-ui rounded-xl px-4 text-xs font-bold outline-none"
            @change="carregarDados"
          />
        </div>
        <div class="md:col-span-4">
          <label class="text-[10px] font-black text-text-soft uppercase ml-1 mb-1 block">Funcionário</label>
          <select
            v-model="filtros.funcionario_id"
            class="w-full h-11 bg-bg-page border border-border-ui rounded-xl px-4 text-xs font-bold outline-none"
            @change="carregarDados"
          >
            <option value="">Selecione...</option>
            <option
              v-for="f in funcionarios"
              :key="f.id"
              :value="String(f.id)"
            >
              {{ f.nome }} #{{ f.id }}
            </option>
          </select>
        </div>
        <div class="md:col-span-4 flex gap-2 items-center">
          <button
            type="button"
            :disabled="loading"
            @click="carregarDados"
            class="h-11 px-5 rounded-xl bg-brand-primary text-white font-black text-[10px] uppercase tracking-widest"
          >
            <i class="pi pi-refresh mr-2" v-if="!loading"></i>
            <i class="pi pi-spin pi-spinner mr-2" v-else></i>
            Atualizar
          </button>
          <RouterLink
            to="/rh/ponto/horas-extras"
            class="text-xs font-bold text-brand-primary hover:underline"
          >
            Configurar feriados
          </RouterLink>
        </div>
      </div>

      <!-- Resumo: 3 cards (paleta A Casa / Tailwind) -->
      <div class="px-6 pb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          class="rounded-xl border border-border-ui bg-bg-card p-5 border-l-4 border-emerald-500 shadow-sm"
        >
          <p class="text-[10px] font-black text-text-soft uppercase tracking-wider">Ganhos Totais</p>
          <p class="text-2xl font-black text-emerald-600 tabular-nums mt-1">
            R$ {{ numeroParaMoeda(ganhosTotais) }}
          </p>
          <p class="text-[10px] text-text-soft mt-1">Salário Base + Horas Extras + Adicional Feriado</p>
        </div>
        <div
          class="rounded-xl border border-border-ui bg-bg-card p-5 border-l-4 border-amber-500 shadow-sm"
        >
          <p class="text-[10px] font-black text-text-soft uppercase tracking-wider">Total de Vales</p>
          <p class="text-2xl font-black text-amber-600 tabular-nums mt-1">
            R$ {{ numeroParaMoeda(totalVales) }}
          </p>
          <p class="text-[10px] text-text-soft mt-1">Vales e adiantamentos no período</p>
        </div>
        <div
          class="rounded-xl border border-border-ui bg-bg-card p-5 border-l-4 border-blue-600 shadow-sm"
        >
          <p class="text-[10px] font-black text-text-soft uppercase tracking-wider">Saldo a Pagar</p>
          <p class="text-2xl font-black text-blue-600 tabular-nums mt-1">
            R$ {{ numeroParaMoeda(saldoAPagar) }}
          </p>
          <p class="text-[10px] text-text-soft mt-1">Ganhos Totais − Vales</p>
        </div>
      </div>

      <!-- Tabela de auditoria -->
      <div class="px-6 pb-6">
        <h2 class="text-sm font-black text-text-main uppercase tracking-wider mb-1">Tabela de Auditoria</h2>
        <p class="text-[10px] text-text-soft mb-3">Horas extras: valor = horas × (custo/hora × 1,5), ou seja 50% de acréscimo sobre o valor da hora.</p>
        <div v-if="loading" class="py-10 text-center text-text-soft text-xs font-bold uppercase">
          Carregando...
        </div>
        <div
          v-else-if="!filtros.funcionario_id"
          class="py-10 rounded-xl border border-border-ui bg-bg-page/60 text-center text-[11px] text-text-soft font-bold uppercase"
        >
          Selecione o funcionário e o período.
        </div>
        <div
          v-else-if="!itensAuditoria.length"
          class="py-10 rounded-xl border border-border-ui bg-bg-page/60 text-center text-[11px] text-text-soft font-bold uppercase"
        >
          Nenhum lançamento no período.
        </div>
        <div v-else class="overflow-x-auto rounded-xl border border-border-ui">
          <table class="w-full min-w-[520px]">
            <thead>
              <tr class="text-[10px] font-black text-text-soft uppercase tracking-widest bg-bg-page/80">
                <th class="px-4 py-3 text-left">Data</th>
                <th class="px-4 py-3 text-left">Descrição</th>
                <th class="px-4 py-3 text-left">Tipo</th>
                <th class="px-4 py-3 text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in itensAuditoria"
                :key="idx"
                class="border-t border-border-ui hover:bg-bg-page/40"
              >
                <td class="px-4 py-3 text-xs font-bold text-text-main tabular-nums">{{ fmtData(item.data) }}</td>
                <td class="px-4 py-3 text-xs text-text-main">
                  <span>{{ item.descricao }}</span>
                  <p v-if="item.detalhe" class="text-[10px] text-text-soft mt-0.5">{{ item.detalhe }}</p>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="text-xs font-bold px-2 py-1 rounded-lg"
                    :class="item.tipo === 'Provento' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ item.tipo }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right font-bold tabular-nums" :class="item.tipo === 'Desconto' ? 'text-amber-600' : 'text-emerald-600'">
                  {{ item.tipo === 'Desconto' ? '−' : '' }} R$ {{ numeroParaMoeda(item.valor) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            :disabled="gerandoPdf || !filtros.funcionario_id"
            @click="finalizarPagamento"
            class="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="pi pi-file-pdf mr-2" v-if="!gerandoPdf"></i>
            <i class="pi pi-spin pi-spinner mr-2" v-else></i>
            Finalizar pagamento
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { PontoRelatorioService, DespesaService } from '@/services/index'
import { notify } from '@/services/notify'
import { numeroParaMoeda } from '@/utils/number'

definePage({ meta: { perm: 'ponto_relatorio.ver' } })

const loading = ref(false)
const gerandoPdf = ref(false)
const funcionarios = ref([])
const fechamentoLinha = ref(null)
const vales = ref([])

const filtros = reactive({
  data_ini: '',
  data_fim: '',
  funcionario_id: '',
})

function getHojeISO() {
  return new Date().toISOString().slice(0, 10)
}
function getMesInicioISO() {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
}
function getMesFimISO() {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)
}

const ganhosTotais = computed(() => {
  const l = fechamentoLinha.value
  if (!l) return 0
  const base = Number(l.salario_contratado ?? 0)
  const he = Number(l.valor_total_horas_extras ?? 0)
  const feriado = Number(l.valor_feriados_trabalhados ?? 0)
  return base + he + feriado
})

const totalVales = computed(() => {
  return vales.value.reduce((acc, d) => acc + Number(d.valor_total ?? 0), 0)
})

const saldoAPagar = computed(() => {
  return Math.max(0, ganhosTotais.value - totalVales.value)
})

const itensAuditoria = computed(() => {
  const l = fechamentoLinha.value
  const out = []
  if (l) {
    const base = Number(l.salario_contratado ?? 0)
    const valorHoraExtra = Number(l.valor_hora_extra ?? 0)
    const horasExtrasTotal = Number(l.horas_extras ?? 0)
    const complemento44 = Number(l.horas_extras_complemento_44h ?? 0)
    const heBatidas = Math.max(0, horasExtrasTotal - complemento44)
    const feriado = Number(l.valor_feriados_trabalhados ?? 0)
    if (base > 0) {
      out.push({
        data: filtros.data_ini,
        descricao: 'Salário Base',
        tipo: 'Provento',
        valor: base,
      })
    }
    // Horas extras: 50% sobre o valor da hora → valor = horas × (custo/hora × 1,5)
    if (heBatidas > 0) {
      const valorHeBatidas = Math.round(heBatidas * valorHoraExtra * 100) / 100
      out.push({
        data: filtros.data_fim,
        descricao: 'Horas Extras (batidas)',
        tipo: 'Provento',
        valor: valorHeBatidas,
        detalhe: `${heBatidas.toFixed(2).replace('.', ',')} h × R$ ${(valorHoraExtra || 0).toFixed(2)} (hora + 50%)`,
      })
    }
    if (complemento44 > 0) {
      const valorComplemento = Math.round(complemento44 * valorHoraExtra * 100) / 100
      out.push({
        data: filtros.data_fim,
        descricao: 'Complemento 44h (dif. jornada legal)',
        tipo: 'Provento',
        valor: valorComplemento,
        detalhe: `${complemento44.toFixed(2).replace('.', ',')} h × R$ ${(valorHoraExtra || 0).toFixed(2)} (dif. 44h − carga semanal)`,
      })
    }
    if (feriado > 0) {
      out.push({
        data: filtros.data_fim,
        descricao: 'Adicional Feriado',
        tipo: 'Provento',
        valor: feriado,
      })
    }
  }
  for (const d of vales.value) {
    const dataVenc = d.data_vencimento
      ? new Date(d.data_vencimento).toISOString().slice(0, 10)
      : filtros.data_fim
    out.push({
      data: dataVenc,
      descricao: d.categoria || 'Vale',
      tipo: 'Desconto',
      valor: Number(d.valor_total ?? 0),
    })
  }
  out.sort((a, b) => {
    const cmpData = String(a.data).localeCompare(String(b.data))
    if (cmpData !== 0) return cmpData
    return a.tipo === 'Provento' ? -1 : 1
  })
  return out
})

function fmtData(str) {
  if (!str) return '—'
  const [y, m, d] = String(str).split('-')
  if (!y || !m || !d) return str
  return `${d}/${m}/${y}`
}

async function carregarFuncionarios() {
  try {
    const { data } = await PontoRelatorioService.listarFuncionariosAtivos()
    funcionarios.value = Array.isArray(data) ? data : []
  } catch {
    funcionarios.value = []
  }
}

async function carregarDados() {
  if (!filtros.data_ini || !filtros.data_fim || !filtros.funcionario_id) {
    fechamentoLinha.value = null
    vales.value = []
    return
  }
  loading.value = true
  fechamentoLinha.value = null
  vales.value = []
  try {
    const [fechRes, despesasRes] = await Promise.all([
      PontoRelatorioService.fechamentoFolha({
        data_ini: filtros.data_ini,
        data_fim: filtros.data_fim,
        funcionario_id: filtros.funcionario_id,
        apenas_ativos: true,
      }),
      DespesaService.listarComFuncionario({
        data_ini: filtros.data_ini,
        data_fim: filtros.data_fim,
        funcionario_id: filtros.funcionario_id,
        categorias: 'Vale,Adiantamento,Adiantamento de salário,Salário',
      }),
    ])
    const linhas = fechRes?.data?.linhas ?? []
    fechamentoLinha.value = linhas.find(
      (r) => String(r.funcionario_id) === String(filtros.funcionario_id)
    ) || linhas[0] || null
    const raw = despesasRes?.data
    vales.value = Array.isArray(raw) ? raw : []
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao carregar dados.')
    fechamentoLinha.value = null
    vales.value = []
  } finally {
    loading.value = false
  }
}

async function finalizarPagamento() {
  if (!filtros.funcionario_id) {
    notify.warn('Selecione um funcionário.')
    return
  }
  const func = funcionarios.value.find(
    (f) => String(f.id) === String(filtros.funcionario_id)
  )
  const nomeFuncionario = func?.nome ?? `Funcionário #${filtros.funcionario_id}`

  gerandoPdf.value = true
  try {
    // Salva o pagamento na tabela de despesas (mesmo lançamento de salário/vale/adiantamento)
    if (saldoAPagar.value > 0) {
      const hoje = getHojeISO()
      await DespesaService.salvar(null, {
        tipo_movimento: 'SAIDA',
        unidade: 'FABRICA',
        categoria: 'SALARIO',
        classificacao: 'DESPESA_FIXA',
        local: `Pagamento folha ${fmtData(filtros.data_ini)} a ${fmtData(filtros.data_fim)}`,
        valor_total: saldoAPagar.value.toFixed(2),
        forma_pagamento: 'DINHEIRO',
        quantidade_parcelas: 1,
        data_vencimento: filtros.data_fim,
        data_registro: hoje,
        data_pagamento: hoje,
        status: 'PAGO',
        funcionario_id: Number(filtros.funcionario_id),
      })
    }

    const { data } = await PontoRelatorioService.reciboFolhaPdf({
      nome_funcionario: nomeFuncionario,
      data_ini: filtros.data_ini,
      data_fim: filtros.data_fim,
      ganhos_totais: ganhosTotais.value,
      total_vales: totalVales.value,
      saldo_a_pagar: saldoAPagar.value,
      itens_auditoria: itensAuditoria.value.map((i) => ({
        data: i.data,
        descricao: i.descricao,
        tipo: i.tipo,
        valor: i.valor,
      })),
    })
    const blob = new Blob([data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recibo-folha-${nomeFuncionario.replace(/\s+/g, '-')}.pdf`
    a.target = '_blank'
    a.rel = 'noopener'
    a.click()
    URL.revokeObjectURL(url)
    notify.success(saldoAPagar.value > 0 ? 'Pagamento registrado e recibo gerado.' : 'Recibo gerado.')
    if (saldoAPagar.value > 0) carregarDados()
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao registrar pagamento ou gerar recibo.')
  } finally {
    gerandoPdf.value = false
  }
}

onMounted(() => {
  filtros.data_ini = getMesInicioISO()
  filtros.data_fim = getMesFimISO()
  carregarFuncionarios().then(() => {
    if (funcionarios.value.length && !filtros.funcionario_id) {
      filtros.funcionario_id = String(funcionarios.value[0].id)
      carregarDados()
    }
  })
})
</script>
