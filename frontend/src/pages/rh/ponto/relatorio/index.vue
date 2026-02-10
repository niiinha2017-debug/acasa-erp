<template>
    <div v-if="rows.length" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <i class="pi pi-calendar text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400">Meta Diária</p>
          <p class="text-2xl font-black text-slate-700 tracking-tighter">{{ resumo.metaDia.toFixed(2) }}h</p>
        </div>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center font-black italic">HH</div>
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400">Trabalhado</p>
          <p class="text-2xl font-black text-slate-700 tracking-tighter">{{ resumo.totalHorasHHMM }}</p>
        </div>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div :class="resumo.totalSaldo >= 0 ? 'bg-emerald-500' : 'bg-rose-500'" class="w-12 h-12 rounded-xl text-white flex items-center justify-center transition-colors">
          <i class="pi pi-chart-bar text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400">Saldo Período</p>
          <p :class="resumo.totalSaldo >= 0 ? 'text-emerald-600' : 'text-rose-600'" class="text-2xl font-black tracking-tighter italic">
            {{ resumo.totalSaldoHHMM }}
          </p>
        </div>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/10">
          <i class="pi pi-wallet text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400">Custo PerÃ­odo</p>
          <p class="text-2xl font-black text-slate-700 tracking-tighter">R$ {{ custoTotalExibicao }}</p>
          <p class="text-[9px] font-bold text-slate-400 uppercase mt-1">Custo/Hora: R$ {{ custoHoraExibicao }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <header class="p-6 bg-slate-50/60 border-b border-slate-100 grid grid-cols-12 gap-4 items-end">
        <div class="col-span-12 md:col-span-3">
          <label class="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block italic">Funcionário</label>
          <div class="relative">
            <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
            <select v-model="filtros.funcionario_id" class="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-[10px] font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all">
            <option value="">Selecione...</option>
            <option v-for="o in funcionarioOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          </div>
        </div>
        <div class="col-span-5 md:col-span-3">
          <label class="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block italic">Início</label>
          <input v-model="filtros.data_ini" type="date" class="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary" />
        </div>
        <div class="col-span-5 md:col-span-3">
          <label class="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block italic">Fim</label>
          <input v-model="filtros.data_fim" type="date" class="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary" />
        </div>
<div class="col-span-12 md:col-span-3 grid grid-cols-3 gap-2">
  <button
    @click="buscar"
    :disabled="loadingTabela"
    class="w-full h-11 bg-brand-primary text-white rounded-xl font-black text-[10px] uppercase italic tracking-widest hover:bg-brand-dark transition-all flex items-center justify-center gap-2"
  >
    <i class="pi pi-search" v-if="!loadingTabela"></i>
    <i class="pi pi-spin pi-spinner" v-else></i>
    <span class="hidden md:block">Buscar</span>
  </button>

  <button
    @click="gerarRelatorioMensal"
    :disabled="loadingPdf || !filtros.funcionario_id || !filtros.data_ini"
    class="w-full h-11 bg-white border border-slate-200 text-brand-primary rounded-xl font-black text-[10px] uppercase italic tracking-widest hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center gap-2"
  >
    <i class="pi pi-file-pdf" v-if="!loadingPdf"></i>
    <i class="pi pi-spin pi-spinner" v-else></i>
    <span class="hidden md:block">PDF</span>
  </button>

  <button
    @click="gerarRelatorioEquipe"
    :disabled="loadingPdfEquipe || !filtros.data_ini"
    class="w-full h-11 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase italic tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
  >
    <i class="pi pi-users" v-if="!loadingPdfEquipe"></i>
    <i class="pi pi-spin pi-spinner" v-else></i>
    <span class="hidden md:block">Equipe</span>
  </button>
</div>

      </header>

      <div v-if="!rows.length" class="p-10 md:p-14">
        <div class="w-full border border-slate-200 rounded-2xl bg-slate-50/60 p-8 md:p-10 text-center">
          <div class="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <i class="pi pi-clipboard text-xl"></i>
          </div>
          <h3 class="mt-4 text-sm font-black uppercase tracking-widest text-slate-700">Prévia do Relatório</h3>
          <p class="mt-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Selecione um funcionário e defina o período para gerar o relatório do mês.
          </p>
          <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              class="h-10 px-5 rounded-xl font-black text-[10px] uppercase bg-white border border-slate-200 text-slate-500"
              :disabled="!filtros.funcionario_id || loadingPdf"
              @click="gerarRelatorioMensal"
            >
              Relatorio do Funcionario
            </button>
            <button
              type="button"
              class="h-10 px-5 rounded-xl font-black text-[10px] uppercase bg-brand-primary text-white"
              :disabled="!filtros.data_ini || loadingPdfEquipe"
              @click="gerarRelatorioEquipe"
            >
              Relatorio da Equipe
            </button>

          </div>
        </div>
      </div>

      <div v-else class="overflow-x-auto p-3">
        <table class="w-full border-separate border-spacing-y-2">
          <thead>
            <tr class="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">
              <th class="px-6 py-2 text-left">Data</th>
              <th class="px-2 py-2">Ent 1</th>
              <th class="px-2 py-2">Sai 1</th>
              <th class="px-2 py-2">Ent 2</th>
              <th class="px-2 py-2">Sai 2</th>
              <th class="px-2 py-2 text-right">Horas</th>
              <th class="px-6 py-2 text-right">Custo</th>
              <th class="px-6 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rowsAgrupadas" :key="row.data" class="group bg-white hover:bg-slate-50 transition-all border border-slate-100">
              <td class="px-6 py-4 rounded-l-3xl">
                <div class="flex flex-col">
                  <span class="text-sm font-black text-slate-700 uppercase italic leading-none">{{ fmtData(row.data) }}</span>
                  <span class="text-[9px] font-bold text-slate-400 uppercase mt-1 italic">{{ getDiaSemana(row.data) }}</span>
                </div>
              </td>

              <td v-for="col in ['ent1', 'sai1', 'ent2', 'sai2']" :key="col" class="px-2 py-4 text-center">
                <div class="flex items-center justify-center gap-2 group/btn">
                  <span class="tabular-nums font-black text-sm" :class="[row[col]?.hora ? (col.startsWith('ent') ? 'text-blue-600' : 'text-slate-600') : 'text-slate-200', isFimDeSemanaErro(row.data, row[col]?.hora) ? 'text-rose-500' : '']">
                    {{ row[col]?.hora || '--:--' }}
                  </span>
                  <div v-if="row[col]?.id" class="flex items-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                    <button @click="abrirModalEditar(row[col])" class="text-slate-300 hover:text-blue-500 p-1"><i class="pi pi-pencil text-[9px]"></i></button>
                    <button @click="confirmarExcluirDireto(row[col].id)" class="text-slate-300 hover:text-rose-500 p-1"><i class="pi pi-trash text-[9px]"></i></button>
                  </div>
                  <button v-else @click="abrirModalNovoNaPosicao(row, col)" class="opacity-0 group-hover/btn:opacity-100 text-slate-200 hover:text-brand-primary transition-opacity p-1">
                    <i class="pi pi-plus text-[9px]"></i>
                  </button>
                </div>
              </td>

              <td class="px-2 py-4 text-right">
                <div class="text-[11px] font-black text-slate-600 tabular-nums">{{ row.horasHHMM }}</div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="text-[11px] font-black text-brand-primary tabular-nums">R$ {{ row.custoDiaExibicao }}</div>
              </td>

              <td class="px-6 py-4 rounded-r-3xl text-right">
                <button @click="abrirModalJustificar(row)" class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[9px] font-black uppercase hover:bg-brand-primary hover:text-white transition-all">Justificar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="modalEditar.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white w-full max-w-md rounded-2xl overflow-hidden border border-slate-200 shadow-sm animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 sm:px-7 sm:py-5 flex justify-between items-center bg-white border-b border-slate-100">
          <h3 class="font-black text-slate-700 uppercase italic">{{ modalEditar.id ? 'Ajustar Horário' : 'Novo Horário' }}</h3>
          <button @click="modalEditar.open = false" class="text-slate-400 hover:text-rose-500"><i class="pi pi-times"></i></button>
        </div>
        <div class="p-6 sm:p-7 space-y-4 overflow-y-auto">
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase italic">Data e Hora</label>
            <input type="datetime-local" v-model="modalEditar.form.data_hora_local" class="w-full h-10 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase italic">Tipo</label>
            <select v-model="modalEditar.form.tipo" class="w-full h-10 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary">
              <option value="ENTRADA">ENTRADA</option>
              <option value="SAIDA">SAÍDA</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase italic">Observação</label>
            <input v-model="modalEditar.form.observacao" class="w-full h-10 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary" placeholder="Motivo do ajuste..." />
          </div>
        </div>
        <div class="px-6 py-4 sm:px-7 sm:py-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 modal-just-footer">
          <button @click="modalEditar.open = false" class="flex-1 h-10 rounded-xl font-black text-[10px] uppercase bg-white border border-slate-200 text-slate-500">Cancelar</button>
          <button @click="confirmarSalvarEdicao" :disabled="modalEditar.saving" class="flex-1 h-10 rounded-xl font-black text-[10px] uppercase bg-brand-primary text-white">
            {{ modalEditar.saving ? 'Gravando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="modalJust.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 shadow-sm">
        <div class="px-6 py-4 sm:px-7 sm:py-5 flex justify-between items-center bg-white border-b border-slate-100">
          <div>
            <h3 class="font-black text-slate-700 uppercase italic text-xl leading-none">Justificativa</h3>
            <p class="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest italic">Data: {{ fmtData(modalJust.dia) }}</p>
          </div>
          <button @click="modalJust.open = false" class="text-slate-400 hover:text-rose-500"><i class="pi pi-times"></i></button>
        </div>
        <div class="p-6 sm:p-7 space-y-6 overflow-y-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase italic">Tipo (Ex: Atestado)</label>
              <input v-model="modalJust.form.tipo" class="w-full h-10 bg-slate-50 rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase italic">Data</label>
              <input type="date" v-model="modalJust.form.data" class="w-full h-10 bg-slate-50 rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary" />
            </div>
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase italic">Descrição</label>
            <textarea v-model="modalJust.form.descricao" class="w-full h-24 bg-slate-50 rounded-xl p-4 font-bold outline-none resize-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary"></textarea>
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase italic">Anexo</label>
            <input ref="justificativaFileRef" type="file" class="hidden" accept="image/*,.pdf,.doc,.docx" @change="onJustificativaFilePick" />
            <div
              @click="justificativaFileRef?.click()"
              class="rounded-2xl p-4 transition-all cursor-pointer hover:bg-brand-primary/5 flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-brand-secondary/40 flex items-center justify-center text-brand-primary shrink-0">
                  <i class="pi pi-cloud-upload"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-black text-slate-700 uppercase truncate">{{ justificativaArquivoNome || 'Clique para selecionar arquivo (PDF, imagem, doc)' }}</p>
                  <p class="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Atestado, comprovante, etc.</p>
                </div>
              </div>
              <button
                v-if="justificativaArquivoNome"
                type="button"
                @click.stop="limparJustificativaArquivo"
                class="shrink-0 w-9 h-9 rounded-xl text-slate-400 hover:text-rose-500 flex items-center justify-center"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 sm:px-7 sm:py-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 modal-just-footer">
          <button @click="modalJust.open = false" class="flex-1 h-10 rounded-xl font-black text-[10px] uppercase bg-white border border-slate-200 text-slate-500">Fechar</button>
          <button @click="confirmarSalvarJustificativa" :disabled="modalJust.saving" class="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase bg-brand-primary text-white shadow-lg shadow-brand-primary/20">Lançar Justificativa</button>
        </div>
      </div>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  PontoRelatorioService,
  PontoJustificativasService,
  PontoRegistrosService,
  FuncionarioService,
} from '@/services/index'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'
import { calcularHorasTrabalhadasNoDia, consolidarSaldoPeriodo, horasDecimalParaHHMM } from '@/utils/utils'
import { confirm } from '@/services/confirm'
import { listDays, groupRegistrosByDia } from '@/utils/ponto'
import { useRouter } from 'vue-router'
import { numeroParaMoeda } from '@/utils/number'

definePage({ meta: { perm: 'ponto_relatorio.ver' } })


const loadingTabela = ref(false)
const rows = ref([])
const funcionarioOptions = ref([])
const funcionarios = ref([])
const router = useRouter()

const loadingPdf = ref(false)
const loadingPdfEquipe = ref(false)

async function gerarRelatorioMensal() {
  if (!filtros.funcionario_id) return notify.warn('Selecione um funcionário')

  const { mes, ano } = getMesAnoReferencia()
  const funcionario_id = Number(String(filtros.funcionario_id).replace(/\D/g, ''))

  try {
    loadingPdf.value = true

    const { data } = await PontoRelatorioService.pdfMensalSalvar({ funcionario_id, mes, ano })

    router.push(
      `/arquivos/${data.arquivoId}?name=RELATORIO_PONTO_${String(mes).padStart(2,'0')}_${ano}&type=application/pdf`
    )
  } catch (e) {
    console.log('[PONTO] ERRO PDF:', e?.response?.status, e?.response?.data)
    notify.error(e?.response?.data?.message || 'Erro ao gerar PDF')
  } finally {
    loadingPdf.value = false
  }
}

async function gerarRelatorioEquipe() {
  if (!filtros.data_ini) return notify.warn('Selecione o periodo')

  const { mes, ano } = getMesAnoReferencia()

  try {
    loadingPdfEquipe.value = true

    const { data } = await PontoRelatorioService.pdfMensalEquipeSalvar({ mes, ano })
    const arquivos = Array.isArray(data?.arquivos) ? data.arquivos : []

    if (arquivos.length) {
      arquivos.forEach((a) => {
        const nome = String(a.funcionario_nome || 'FUNCIONARIO')
          .replace(/\s+/g, '_')
          .toUpperCase()
        const url = `/arquivos/${a.arquivoId}?name=RELATORIO_PONTO_${String(mes).padStart(2,'0')}_${ano}_${nome}&type=application/pdf`
        window.open(url, '_blank', 'noopener')
      })
      return
    }

    notify.warn('Nenhum relatorio gerado')
  } catch (e) {
    const status = e?.response?.status
    if (status === 404) {
      // Fallback: gera individualmente com o endpoint ja existente
      const lista = Array.isArray(funcionarios.value) ? funcionarios.value : []
      if (!lista.length) {
        notify.error('Lista de funcionarios vazia')
        return
      }

      for (const f of lista) {
        try {
          const { data } = await PontoRelatorioService.pdfMensalSalvar({
            funcionario_id: f.id,
            mes,
            ano,
          })
          const nome = String(f.nome || 'FUNCIONARIO')
            .replace(/\s+/g, '_')
            .toUpperCase()
          const url = `/arquivos/${data.arquivoId}?name=RELATORIO_PONTO_${String(mes).padStart(2,'0')}_${ano}_${nome}&type=application/pdf`
          window.open(url, '_blank', 'noopener')
        } catch (err) {
          console.log('[PONTO] ERRO PDF FUNCIONARIO:', f?.id, err?.response?.status, err?.response?.data)
        }
      }

      return
    }

    console.log('[PONTO] ERRO PDF EQUIPE:', e?.response?.status, e?.response?.data)
    notify.error(e?.response?.data?.message || 'Erro ao gerar PDF da equipe')
  } finally {
    loadingPdfEquipe.value = false
  }
}


const filtros = reactive({ funcionario_id: '', data_ini: '', data_fim: '' })

// ✅ remove domingo dos REGISTROS (pra não contar no resumo)
const rowsFiltrados = computed(() => {
  return (rows.value || []).filter((r) => {
    const dia = new Date(r.data_hora).getDay()
    return dia !== 0 // 0 = Domingo
  })
})

// ✅ agora pode usar rowsFiltrados
const registrosPorDia = computed(() => groupRegistrosByDia(rowsFiltrados.value))
const resumo = computed(() => consolidarSaldoPeriodo({ registros: rowsFiltrados.value }))

// STATES DOS MODAIS
const modalEditar = reactive({
  open: false,
  saving: false,
  id: null,
  form: { funcionario_id: null, data_hora_local: '', tipo: 'ENTRADA', observacao: '' },
})

const modalJust = reactive({
  open: false,
  saving: false,
  dia: '',
  lista: [],
  form: { funcionario_id: null, data: '', tipo: '', descricao: '', arquivo_id: null },
})

const justificativaFileRef = ref(null)
const justificativaFileToUpload = ref(null)
const justificativaArquivoNome = ref('')

// HELPERS
const fmtData = (v) => (v ? v.split('-').reverse().join('/') : '-')
const fmtHoraLocal = (iso) => {
  if (!iso) return '--:--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--:--'
  const temFuso = /Z$|[+-]\d{2}:\d{2}$/.test(iso)
  const opts = { hour: '2-digit', minute: '2-digit' }
  if (temFuso) opts.timeZone = 'UTC'
  return d.toLocaleTimeString('pt-BR', opts)
}

const getDiaSemana = (dataStr) => {
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  const data = new Date(dataStr + 'T12:00:00')
  return dias[data.getDay()]
}

function getMesAnoReferencia() {
  // pega do filtro INICIO (ex.: 2026-02-01)
  const base = filtros.data_ini || new Date().toISOString().slice(0, 10)
  const [y, m] = String(base).split('-').map((n) => Number(n))
  return { mes: m, ano: y }
}


const isFimDeSemanaErro = (dataStr, horaStr) => {
  if (!horaStr) return false
  const data = new Date(dataStr + 'T12:00:00')
  const [h, m] = horaStr.split(':').map(Number)
  return data.getDay() === 6 && (h > 12 || (h === 12 && m > 0))
}

const funcionarioSelecionado = computed(() => {
  const id = Number(filtros.funcionario_id || 0)
  return funcionarios.value.find((f) => Number(f.id) === id) || null
})

const custoHora = computed(() => Number(funcionarioSelecionado.value?.custo_hora || 0))
const custoHoraExibicao = computed(() => numeroParaMoeda(custoHora.value))
const custoTotalExibicao = computed(() => numeroParaMoeda(resumo.value.totalHoras * custoHora.value))

const rowsAgrupadas = computed(() => {
  if (!filtros.data_ini || !filtros.data_fim) return []

  // ✅ lista dias e REMOVE domingo (pra não aparecer na tabela)
  const dias = listDays(filtros.data_ini, filtros.data_fim).filter((dia) => {
    const d = new Date(dia + 'T12:00:00')
    return d.getDay() !== 0
  })

  const map = registrosPorDia.value

  return dias
    .map((dia) => {
      const regsDia = (map.get(dia) || [])
        .filter((r) => r.status === 'ATIVO')
        .slice()
        .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))

      const batidas = regsDia.map((reg) => ({
        id: reg.id,
        hora: fmtHoraLocal(reg.data_hora),
        tipo: reg.tipo,
        data_hora: reg.data_hora,
        observacao: reg.observacao,
      }))

      const entradas = batidas.filter((b) => b.tipo === 'ENTRADA')
      const saidas = batidas.filter((b) => b.tipo === 'SAIDA')
      const horasDia = calcularHorasTrabalhadasNoDia(regsDia)

      return {
        data: dia,
        funcionario_id: filtros.funcionario_id,
        ent1: entradas[0],
        sai1: saidas[0],
        ent2: entradas[1],
        sai2: saidas[1],
        horasHHMM: horasDecimalParaHHMM(horasDia),
        custoDiaExibicao: numeroParaMoeda(horasDia * custoHora.value),
      }
    })
    .sort((a, b) => b.data.localeCompare(a.data))
})

// AÇÕES
async function buscar() {
  if (!filtros.funcionario_id) return notify.warn('Selecione um funcionário')

  try {
    loadingTabela.value = true
    const { data } = await PontoRelatorioService.listarRegistros({ ...filtros })
    rows.value = data || []
  } catch (e) {
    console.log('[PONTO] ERRO buscar:', e?.response?.status, e?.response?.data)
    notify.error(e?.response?.data?.message || 'Erro ao buscar')
  } finally {
    loadingTabela.value = false
  }
}

async function confirmarExcluirDireto(id) {
  if (!(await confirm.show('Excluir', 'Deseja apagar este registro?'))) return

  try {
    await PontoRegistrosService.remover(id)
    notify.success('Apagado!')
    await buscar()
  } catch (e) {
    console.log('[PONTO] ERRO excluir:', e?.response?.status, e?.response?.data)
    notify.error(e?.response?.data?.message || 'Erro ao excluir')
  }
}

function abrirModalNovoNaPosicao(row, coluna) {
  const f = funcionarioSelecionado.value

  const h = {
    ent1: f?.horario_entrada_1 || '07:30',
    sai1: f?.horario_saida_1 || '12:00',
    ent2: f?.horario_entrada_2 || '13:30',
    sai2: f?.horario_saida_2 || '17:30',
  }

  Object.assign(modalEditar, {
    open: true,
    id: null,
    form: {
      funcionario_id: filtros.funcionario_id,
      data_hora_local: `${row.data}T${h[coluna]}`,
      tipo: coluna.startsWith('ent') ? 'ENTRADA' : 'SAIDA',
      observacao: 'AJUSTE MANUAL',
    },
  })
}

function abrirModalEditar(batida) {
  Object.assign(modalEditar, {
    open: true,
    id: batida.id,
    form: {
      funcionario_id: filtros.funcionario_id,
      data_hora_local: batida.data_hora.slice(0, 16).replace(' ', 'T'),
      tipo: batida.tipo,
      observacao: batida.observacao || '',
    },
  })
}

async function confirmarSalvarEdicao() {
  try {
    modalEditar.saving = true

    const payload = {
      funcionario_id: Number(modalEditar.form.funcionario_id),
      tipo: modalEditar.form.tipo,
      observacao: modalEditar.form.observacao || null,
      data_hora: `${modalEditar.form.data_hora_local}:00`,
    }

    if (modalEditar.id) {
      await PontoRegistrosService.atualizar(modalEditar.id, payload)
    } else {
      await PontoRegistrosService.salvar(payload)
    }

    notify.success('Sucesso!')
    modalEditar.open = false
    await buscar()
  } catch (e) {
    console.log('[PONTO] ERRO salvar/editar:', e?.response?.status, e?.response?.data)
    notify.error(e?.response?.data?.message || 'Erro ao salvar')
  } finally {
    modalEditar.saving = false
  }
}

function onJustificativaFilePick(e) {
  const file = e?.target?.files?.[0]
  if (!file) return
  justificativaFileToUpload.value = file
  justificativaArquivoNome.value = file.name
}

function limparJustificativaArquivo() {
  justificativaFileToUpload.value = null
  justificativaArquivoNome.value = ''
  if (justificativaFileRef.value) justificativaFileRef.value.value = ''
  modalJust.form.arquivo_id = null
}

async function abrirModalJustificar(row) {
  limparJustificativaArquivo()
  Object.assign(modalJust, {
    open: true,
    dia: row.data,
    form: { funcionario_id: filtros.funcionario_id, data: row.data, tipo: '', descricao: '', arquivo_id: null },
  })
}

async function confirmarSalvarJustificativa() {
  try {
    modalJust.saving = true

    const form = { ...modalJust.form }
    const funcionario_id = Number(String(form.funcionario_id || '').replace(/\D/g, ''))

    if (justificativaFileToUpload.value && funcionario_id) {
      const { data } = await ArquivosService.upload({
        ownerType: 'FUNCIONARIO',
        ownerId: funcionario_id,
        file: justificativaFileToUpload.value,
        categoria: 'JUSTIFICATIVA_PONTO',
        slot_key: form.data,
      })
      if (data?.id) form.arquivo_id = data.id
    }

    await PontoJustificativasService.salvar(form)
    notify.success('Justificativa salva!')
    modalJust.open = false
    limparJustificativaArquivo()
    await buscar()
  } catch (e) {
    console.log('[PONTO] ERRO justificar:', e?.response?.status, e?.response?.data)
    notify.error(e?.response?.data?.message || 'Erro ao salvar')
  } finally {
    modalJust.saving = false
  }
}

onMounted(async () => {
  const { data } = await FuncionarioService.listar()
  const lista = (data?.data || data || []).filter((f) => f.status === 'ATIVO')

  funcionarios.value = lista
  funcionarioOptions.value = lista.map((f) => ({ label: f.nome, value: f.id }))

  const hoje = new Date()
  filtros.data_ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  filtros.data_fim = hoje.toISOString().slice(0, 10)
})
</script>

<style scoped>
.modal-just-footer button {
  box-shadow: none !important;
  height: 2.5rem;
  border-radius: 0.75rem;
}

@media (min-width: 640px) {
  .modal-just-footer button {
    height: 2.5rem;
  }
}
</style>
