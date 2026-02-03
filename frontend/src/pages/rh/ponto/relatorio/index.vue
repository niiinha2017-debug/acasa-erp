<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
    
    <div v-if="rows.length" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
          <i class="pi pi-calendar text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400">Meta Diária</p>
          <p class="text-2xl font-black text-slate-800 tracking-tighter">{{ resumo.metaDia.toFixed(2) }}h</p>
        </div>
      </div>

      <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner font-black italic">
          HH
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400">Trabalhado</p>
          <p class="text-2xl font-black text-slate-800 tracking-tighter">{{ resumo.totalHorasHHMM }}</p>
        </div>
      </div>

      <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div :class="resumo.totalSaldo >= 0 ? 'bg-emerald-500' : 'bg-rose-500'" class="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg transition-colors">
          <i class="pi pi-chart-bar text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400">Saldo Período</p>
          <p :class="resumo.totalSaldo >= 0 ? 'text-emerald-600' : 'text-rose-600'" class="text-2xl font-black tracking-tighter italic">
            {{ resumo.totalSaldoHHMM }}
          </p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      
      <header class="p-6 bg-slate-50/50 border-b border-slate-100 grid grid-cols-12 gap-4 items-end">
        <div class="col-span-12 md:col-span-4">
          <label class="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block italic">Funcionário</label>
          <select v-model="filtros.funcionario_id" class="w-full h-11 bg-white border border-slate-200 rounded-2xl px-4 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-slate-900 transition-all">
            <option value="">Selecione...</option>
            <option v-for="o in funcionarioOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="col-span-5 md:col-span-3">
          <label class="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block italic">Início</label>
          <input v-model="filtros.data_ini" type="date" class="w-full h-11 bg-white border border-slate-200 rounded-2xl px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900" />
        </div>
        <div class="col-span-5 md:col-span-3">
          <label class="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block italic">Fim</label>
          <input v-model="filtros.data_fim" type="date" class="w-full h-11 bg-white border border-slate-200 rounded-2xl px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900" />
        </div>
        <div class="col-span-2 md:col-span-2">
          <button @click="buscar" class="w-full h-11 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase italic tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            <i class="pi pi-search"></i>
            <span class="hidden md:block">Buscar</span>
          </button>
        </div>
      </header>

      <div class="overflow-x-auto p-2">
        <table class="w-full border-separate border-spacing-y-2">
          <thead>
            <tr class="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">
              <th class="px-6 py-2 text-left">Data</th>
              <th class="px-2 py-2">Ent 1</th>
              <th class="px-2 py-2">Sai 1</th>
              <th class="px-2 py-2">Ent 2</th>
              <th class="px-2 py-2">Sai 2</th>
              <th class="px-6 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rowsAgrupadas" :key="row.data" class="group bg-white hover:bg-slate-50 transition-all shadow-sm">
              
              <td class="px-6 py-4 rounded-l-3xl border-y border-l border-slate-50">
                <div class="flex flex-col">
                  <span class="text-sm font-black text-slate-800 uppercase italic leading-none">{{ fmtData(row.data) }}</span>
                  <span class="text-[9px] font-bold text-slate-400 uppercase mt-1 italic">{{ getDiaSemana(row.data) }}</span>
                </div>
              </td>

              <td v-for="col in ['ent1', 'sai1', 'ent2', 'sai2']" :key="col" class="px-2 py-4 border-y border-slate-50 text-center">
                <div class="flex items-center justify-center gap-2 group/btn">
                  <span 
                    class="tabular-nums font-black text-sm transition-all"
                    :class="[
                      row[col]?.hora ? (col.startsWith('ent') ? 'text-blue-600' : 'text-slate-600') : 'text-slate-200',
                      isFimDeSemanaErro(row.data, row[col]?.hora) ? 'text-rose-500' : ''
                    ]"
                  >
                    {{ row[col]?.hora || '--:--' }}
                  </span>

                  <div v-if="row[col]?.id" class="flex items-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                    <button @click="abrirModalEditar(row[col])" class="text-slate-300 hover:text-blue-500 p-1">
                      <i class="pi pi-pencil text-[9px]"></i>
                    </button>
                    <button @click="confirmarExcluirDireto(row[col].id)" class="text-slate-300 hover:text-rose-500 p-1">
                      <i class="pi pi-trash text-[9px]"></i>
                    </button>
                  </div>
                  <button v-else @click="abrirModalNovoNaPosicao(row, col)" class="opacity-0 group-hover/btn:opacity-100 text-slate-200 hover:text-slate-900 transition-opacity p-1">
                    <i class="pi pi-plus text-[9px]"></i>
                  </button>
                </div>
              </td>

              <td class="px-6 py-4 rounded-r-3xl border-y border-r border-slate-50 text-right space-x-2">
                 <button @click="abrirModalJustificar(row)" class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-[9px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all">
                  Justificar
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!loadingTabela && rowsAgrupadas.length === 0" class="p-20 text-center">
          <i class="pi pi-clock text-slate-100 text-6xl mb-4 block"></i>
          <p class="text-slate-400 font-black uppercase italic text-xs tracking-widest">Nenhum registro para exibir</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  PontoRelatorioService,
  PontoJustificativasService,
  PontoRegistrosService,
  FuncionarioService,
} from '@/services/index'
import { notify } from '@/services/notify'
import { consolidarSaldoPeriodo } from '@/utils/utils'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'

// ==========================================
// ESTADO E FILTROS
// ==========================================
const loadingTabela = ref(false)
const rows = ref([])
const funcionarioOptions = ref([])

const filtros = reactive({
  funcionario_id: '',
  data_ini: '',
  data_fim: '',
})

// Opções para o modal que você já tem integrado
const optionsTipo = [
  { label: 'ENTRADA', value: 'ENTRADA' },
  { label: 'SAIDA', value: 'SAIDA' },
]

// ==========================================
// HELPERS DE FORMATAÇÃO (O toque do Designer)
// ==========================================
const fmtData = (v) => v ? v.split('-').reverse().join('/') : '-'

const getDiaSemana = (dataStr) => {
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  const data = new Date(dataStr + 'T12:00:00')
  return dias[data.getDay()]
}

// Alerta visual para Sábados após as 12:00
const isFimDeSemanaErro = (dataStr, horaStr) => {
  if (!horaStr) return false
  const data = new Date(dataStr + 'T12:00:00')
  const [h, m] = horaStr.split(':').map(Number)
  // 6 = Sábado. Se for sábado e hora > 12 ou (hora == 12 e min > 0)
  return data.getDay() === 6 && (h > 12 || (h === 12 && m > 0))
}

// ==========================================
// LÓGICA DE AGRUPAMENTO (Resolve as duplicadas)
// ==========================================
const rowsAgrupadas = computed(() => {
  const grupos = {}
  
  rows.value.filter(r => r.status === 'ATIVO').forEach(reg => {
    const dataKey = reg.data_hora.split('T')[0]
    const key = dataKey

    if (!grupos[key]) {
      grupos[key] = {
        data: dataKey,
        funcionario_id: reg.funcionario.id,
        batidas: []
      }
    }

    grupos[key].batidas.push({
      id: reg.id,
      hora: reg.data_hora.split('T')[1].substring(0, 5),
      tipo: reg.tipo,
      data_hora: reg.data_hora,
      observacao: reg.observacao
    })
  })

  return Object.values(grupos).map(g => {
    // Ordena por horário para distribuir nas colunas corretamente
    const ordenadas = g.batidas.sort((a, b) => a.hora.localeCompare(b.hora))
    const entradas = ordenadas.filter(b => b.tipo === 'ENTRADA')
    const saidas = ordenadas.filter(b => b.tipo === 'SAIDA')

    return {
      ...g,
      ent1: entradas[0] || null,
      sai1: saidas[0] || null,
      ent2: entradas[1] || null,
      sai2: saidas[1] || null
    }
  }).sort((a, b) => b.data.localeCompare(a.data)) // Mais recentes primeiro
})

const resumo = computed(() => consolidarSaldoPeriodo({ registros: rows.value }))

// ==========================================
// AÇÕES DE CRIAÇÃO, EDIÇÃO E EXCLUSÃO
// ==========================================

async function buscar() {
  if (!filtros.funcionario_id) return notify.warn('Selecione um funcionário')
  try {
    loadingTabela.value = true
    const { data } = await PontoRelatorioService.listarRegistros({ ...filtros })
    rows.value = data || []
  } catch (e) {
    notify.error('Erro ao buscar registros')
  } finally {
    loadingTabela.value = false
  }
}

// EXCLUIR DIRETO (A lixeira da tabela)
async function confirmarExcluirDireto(id) {
  if (!(await confirm.show('Excluir Batida', 'Deseja realmente apagar este registro?'))) return
  try {
    await PontoRegistrosService.remover(id)
    notify.success('Registro apagado')
    await buscar() // Recarrega para limpar a tela
  } catch (e) {
    notify.error('Erro ao excluir')
  }
}

// CRIAR DIRETO NA CÉLULA VAZIA
function abrirModalNovoNaPosicao(row, coluna) {
  const sugestaoHorario = { ent1: '08:00', sai1: '12:00', ent2: '13:00', sai2: '18:00' }
  
  // Aqui você usa o seu estado do modal já existente
  Object.assign(modalEditar, {
    open: true,
    id: null,
    form: {
      funcionario_id: row.funcionario_id,
      data_hora_local: `${row.data}T${sugestaoHorario[coluna]}`,
      tipo: coluna.startsWith('ent') ? 'ENTRADA' : 'SAIDA',
      observacao: 'LANÇAMENTO MANUAL'
    }
  })
}

// EDITAR (Abre o modal com os dados da batida)
function abrirModalEditar(batida) {
  Object.assign(modalEditar, {
    open: true,
    id: batida.id,
    form: {
      data_hora_local: batida.data_hora.slice(0, 16),
      tipo: batida.tipo,
      observacao: batida.observacao || ''
    }
  })
}

// ==========================================
// CICLO DE VIDA
// ==========================================
onMounted(async () => {
  const { data } = await FuncionarioService.listar()
  funcionarioOptions.value = (data?.data || data || [])
    .filter(f => f.status === 'ATIVO')
    .map(f => ({ label: f.nome, value: f.id }))

  // Setup de datas iniciais (Mês atual)
  const hoje = new Date()
  filtros.data_ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  filtros.data_fim = hoje.toISOString().slice(0, 10)
})
</script>
