<template>
  <div class="w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    
    <PageHeader
      title="Relatório de Ponto"
      subtitle="RH / Gestão Estratégica de Horas"
      icon="pi pi-clock"
      class="bg-transparent p-0"
    />

    <div v-if="rows.length" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card hoverable class="p-6 flex items-center gap-5 border-none shadow-sm bg-white/80 backdrop-blur">
        <div class="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
          <i class="pi pi-calendar text-2xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Meta Diária</p>
          <p class="text-3xl font-black text-slate-800">{{ resumo.metaDia.toFixed(2) }}h</p>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-5 border-none shadow-sm bg-white/80 backdrop-blur">
        <div class="w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shadow-inner">
          <i class="pi pi-briefcase text-2xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Trabalhado</p>
          <p class="text-3xl font-black text-slate-800">{{ resumo.totalHorasHHMM }}</p>
        </div>
      </Card>

      <Card hoverable class="p-6 flex items-center gap-5 border-none shadow-sm bg-white/80 backdrop-blur">
        <div 
          class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
          :class="resumo.totalSaldo >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'"
        >
          <i class="pi pi-chart-bar text-2xl"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Saldo do Período</p>
          <p class="text-3xl font-black" :class="resumo.totalSaldo >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ resumo.totalSaldoHHMM }}
          </p>
        </div>
      </Card>
    </div>

    <Card :shadow="true" class="!rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-white">
      
      <header class="p-8 lg:p-10 border-b border-slate-50 bg-slate-50/30">
        <div class="grid grid-cols-12 gap-6 items-end">
          <div class="col-span-12 md:col-span-4">
            <SearchInput mode="select" label="FUNCIONÁRIO" :options="funcionarioOptions" v-model="filtros.funcionario_id" class="premium-input" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input label="DATA INÍCIO" v-model="filtros.data_ini" type="date" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input label="DATA FIM" v-model="filtros.data_fim" type="date" />
          </div>
          <div class="col-span-12 md:col-span-2 flex gap-3">
<Button
  v-if="can('ponto_relatorio.ver')"
  variant="primary"
  class="flex-1 ..."
  @click="buscar"
  :loading="loadingTabela"
>
  BUSCAR
</Button>

            <Button variant="outline" class="!h-12 !w-12 !p-0 !rounded-xl border-slate-200" :disabled="!canPdf" @click="abrirPdfMensal">
              <i class="pi pi-file-pdf text-rose-500"></i>
            </Button>
          </div>
        </div>
      </header>

      <div class="p-2">
<Table :columns="columns" :rows="rowsAgrupadas" :loading="loadingTabela" class="!border-none">
  
  <template #cell-data="{ row }">
    <span class="text-sm font-black text-slate-700 uppercase italic">{{ fmtData(row.data) }}</span>
  </template>

  <template #cell-funcionario="{ row }">
    <span class="text-xs font-bold text-slate-600">{{ row.funcionario_nome }}</span>
  </template>

  <template #cell-ent1="{ row }"><span class="tabular-nums text-blue-600 font-bold">{{ row.ent1 || '--:--' }}</span></template>
  <template #cell-sai1="{ row }"><span class="tabular-nums text-slate-500">{{ row.sai1 || '--:--' }}</span></template>
  <template #cell-ent2="{ row }"><span class="tabular-nums text-blue-600 font-bold">{{ row.ent2 || '--:--' }}</span></template>
  <template #cell-sai2="{ row }"><span class="tabular-nums text-slate-500">{{ row.sai2 || '--:--' }}</span></template>

  <template #cell-status="{ row }">
    <StatusBadge :value="row.status" class="scale-90 origin-left" />
  </template>

  <template #cell-acoes="{ row }">
    <div class="flex justify-end gap-2 pr-4">
      <button v-if="can('ponto_relatorio.editar')" @click="abrirModalJustificar(row)" 
        class="px-3 h-8 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase hover:bg-brand-primary hover:text-white transition-all">
        Justificar
      </button>
    </div>
  </template>
</Table>
      </div>
    </Card>

    <div v-if="modalEditar.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <Card class="w-full max-w-md !rounded-[2rem] shadow-2xl overflow-hidden border-none animate-in zoom-in-95">
        <div class="p-8 border-b bg-slate-50/50 flex justify-between items-center">
          <h3 class="font-black text-slate-800 uppercase tracking-tighter italic">Ajustar Registro</h3>
          <button @click="modalEditar.open = false" class="text-slate-400 hover:text-rose-500"><i class="pi pi-times"></i></button>
        </div>
        <div class="p-8 space-y-6">
          <Input label="DATA E HORA" type="datetime-local" v-model="modalEditar.form.data_hora_local" />
          <SearchInput mode="select" label="TIPO DE REGISTRO" :options="optionsTipo" v-model="modalEditar.form.tipo" />
          <Input label="OBSERVAÇÃO" v-model="modalEditar.form.observacao" :forceUpper="true" placeholder="Motivo do ajuste..." />
        </div>
        <div class="p-6 bg-slate-50 flex gap-3">
          <Button variant="secondary" class="flex-1 !rounded-xl font-bold uppercase text-[10px]" @click="modalEditar.open = false">Cancelar</Button>
          <Button
  v-if="can('ponto_relatorio.editar')"
  variant="primary"
  class="flex-1 ..."
  :loading="modalEditar.saving"
  @click="confirmarSalvarEdicao"
>
  Salvar
</Button>

        </div>
      </Card>
    </div>

    <div v-if="modalJust.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <Card class="w-full max-w-2xl !rounded-[2.5rem] shadow-2xl overflow-hidden border-none flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div class="p-8 border-b bg-slate-50/80 flex justify-between items-center">
          <div>
            <h3 class="font-black text-slate-800 uppercase italic">Lançar Justificativa</h3>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ref: {{ modalJust.dia }}</p>
          </div>
          <button @click="fecharModalJust" class="text-slate-400 hover:text-rose-500 transition-colors"><i class="pi pi-times"></i></button>
        </div>
        
        <div class="p-8 overflow-y-auto space-y-8">
          <div class="grid grid-cols-12 gap-6">
            <Input class="col-span-12 md:col-span-6" label="TIPO (EX: ATESTADO)" v-model="modalJust.form.tipo" :forceUpper="true" />
            <Input class="col-span-12 md:col-span-6" label="DATA" type="date" v-model="modalJust.form.data" />
            <Input class="col-span-12" label="DESCRIÇÃO DETALHADA" v-model="modalJust.form.descricao" />
            <div class="col-span-12 p-6 border-2 border-dashed rounded-2xl border-slate-100 bg-slate-50/50 flex flex-col items-center gap-2">
              <i class="pi pi-upload text-slate-300"></i>
              <input type="file" @change="onFileChange" class="text-[10px] font-bold text-slate-400 w-full text-center" />
            </div>
          </div>

          <div class="space-y-4">
            <p class="text-[10px] font-black uppercase text-slate-800 tracking-[0.2em] flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
              Histórico do Mês
            </p>
            <div class="bg-slate-50 rounded-2xl divide-y divide-white border border-slate-100 overflow-hidden">
              <div v-for="j in modalJust.lista" :key="j.id" class="p-4 flex justify-between items-center hover:bg-white transition-colors">
                <div class="flex flex-col">
                  <span class="text-[11px] font-black text-slate-700 uppercase italic">{{ fmtData(j.data) }} — {{ j.tipo }}</span>
                  <span class="text-[10px] text-slate-400 font-medium">{{ j.descricao || 'Sem descrição' }}</span>
                </div>
                <button @click="confirmarExcluirJustificativa(j)" class="text-slate-300 hover:text-rose-500 transition-colors p-2">
                  <i class="pi pi-trash text-xs"></i>
                </button>
              </div>
              <div v-if="!modalJust.lista.length" class="p-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                Nenhuma justificativa registrada.
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 bg-slate-100/50 border-t flex gap-3">
<Button
  v-if="can('ponto_relatorio.editar')"
  variant="primary"
  class="flex-1 ..."
  :loading="modalJust.saving"
  @click="confirmarSalvarJustificativa"
>
  Salvar Justificativa
</Button>

          <Button variant="secondary" class="flex-1 !rounded-xl font-bold uppercase text-[10px]" @click="fecharModalJust">Cancelar</Button>
        </div>
      </Card>
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

definePage({ meta: { perm: 'ponto_relatorio.ver' } })

const router = useRouter()

// =======================
// STATE
// =======================
const loadingTabela = ref(false)
const rows = ref([])
const funcionarioOptions = ref([])

const filtros = reactive({
  funcionario_id: '',
  data_ini: '',
  data_fim: '',
  tipo: null,
})

// Substitua a antiga columns por esta:
const columns = [
  { key: 'data', label: 'DATA', width: '110px' },
  { key: 'funcionario', label: 'FUNCIONÁRIO' },
  { key: 'ent1', label: 'ENT 1', width: '80px' },
  { key: 'sai1', label: 'SAI 1', width: '80px' },
  { key: 'ent2', label: 'ENT 2', width: '80px' },
  { key: 'sai2', label: 'SAI 2', width: '80px' },
  { key: 'status', label: 'STATUS', width: '100px' },
  { key: 'acoes', label: '', width: '120px', align: 'right' },
]

// Adicione esta Computed logo abaixo da 'resumo':
const rowsAgrupadas = computed(() => {
  const grupos = {}

  rows.value.forEach(reg => {
    const dataKey = reg.data_hora.split('T')[0]
    const funcId = reg.funcionario_id
    const key = `${dataKey}_${funcId}`

    if (!grupos[key]) {
      grupos[key] = {
        data: dataKey,
        funcionario_id: funcId,
        funcionario_nome: reg.funcionario?.nome || 'Não identificado',
        status: reg.status,
        batidas: [],
        ent1: '', sai1: '', ent2: '', sai2: ''
      }
    }

    const hora = new Date(reg.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    grupos[key].batidas.push({ hora, tipo: reg.tipo })
  })

  // Organiza as batidas nas colunas certas
  return Object.values(grupos).map(g => {
    // Ordena as batidas por horário para garantir a sequência
    const ordenadas = g.batidas.sort((a, b) => a.hora.localeCompare(b.hora))
    
    // Distribui nas colunas (Simples: 1ª entrada, 1ª saída, etc)
    const entradas = ordenadas.filter(b => b.tipo === 'ENTRADA')
    const saidas = ordenadas.filter(b => b.tipo === 'SAIDA')

    g.ent1 = entradas[0]?.hora || ''
    g.sai1 = saidas[0]?.hora || ''
    g.ent2 = entradas[1]?.hora || ''
    g.sai2 = saidas[1]?.hora || ''
    
    return g
  })
})
const optionsTipo = [
  { label: 'ENTRADA', value: 'ENTRADA' },
  { label: 'SAIDA', value: 'SAIDA' },
]

// =======================
// COMPUTED
// =======================
const canPdf = computed(() => can('ponto_relatorio.ver') && !!filtros.funcionario_id && !!filtros.data_ini)

const resumo = computed(() =>
  consolidarSaldoPeriodo({
    registros: rows.value,
    horasSemana: 48,
    diasSemana: 6,
  }),
)

// =======================
// HELPERS
// =======================
const fmtData = (v) => (v ? new Date(v).toLocaleDateString('pt-BR') : '-')
const fmtHora = (v) => (v ? new Date(v).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')
const toIsoShort = (date) => new Date(date).toISOString().slice(0, 10)

// =======================
// AÇÕES (VER)
// =======================
async function buscar() {
  if (!can('ponto_relatorio.ver')) return notify.error('Acesso negado.')

  try {
    loadingTabela.value = true
    const { data } = await PontoRelatorioService.listarRegistros({
      ...filtros,
      funcionario_id: filtros.funcionario_id || undefined,
    })
    rows.value = data || []
  } catch (e) {
    notify.error('Erro ao buscar registros')
  } finally {
    loadingTabela.value = false
  }
}

function limpar() {
  Object.assign(filtros, { funcionario_id: '', data_ini: '', data_fim: '', tipo: null })
  rows.value = []
}

async function abrirPdfMensal() {
  if (!can('ponto_relatorio.ver')) return notify.error('Acesso negado.')
  if (!canPdf.value) return

  const d = new Date(filtros.data_ini)
  const resp = await PontoRelatorioService.pdfMensal({
    funcionario_id: filtros.funcionario_id,
    mes: d.getMonth() + 1,
    ano: d.getFullYear(),
  })

  window.open(URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' })), '_blank')
}

// =======================
// MODAL EDITAR (EDITAR)
// =======================
const modalEditar = reactive({
  open: false,
  saving: false,
  id: null,
  form: {
    data_hora_local: '',
    tipo: null,
    observacao: '',
  },
})

function abrirModalEditar(row) {
  if (!can('ponto_relatorio.editar')) return notify.error('Acesso negado.')

  Object.assign(modalEditar, {
    open: true,
    id: row.id,
    form: {
      data_hora_local: row.data_hora?.slice(0, 16) || '',
      tipo: row.tipo || null,
      observacao: row.observacao || '',
    },
  })
}

async function salvarEdicao() {
  if (!can('ponto_relatorio.editar')) return notify.error('Acesso negado.')
  if (!modalEditar.id) return

  try {
    modalEditar.saving = true
    await PontoRegistrosService.atualizar(modalEditar.id, {
      ...modalEditar.form,
      data_hora: new Date(modalEditar.form.data_hora_local).toISOString(),
    })
    notify.success('Sucesso')
    modalEditar.open = false
    await buscar()
  } catch (e) {
    notify.error('Erro')
  } finally {
    modalEditar.saving = false
  }
}

async function confirmarSalvarEdicao() {
  if (!can('ponto_relatorio.editar')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Salvar Ajuste', 'Deseja salvar o ajuste deste registro de ponto?')
  if (!ok) return
  await salvarEdicao()
}

// =======================
// MODAL JUSTIFICATIVA (EDITAR)
// =======================
const modalJust = reactive({
  open: false,
  saving: false,
  funcionario_id: null,
  dia: '',
  lista: [],
  file: null,
  form: {
    funcionario_id: null,
    data: '',
    tipo: '',
    descricao: '',
  },
})

async function abrirModalJustificar(row) {
  if (!can('ponto_relatorio.editar')) return notify.error('Acesso negado.')

  const fid = row.funcionario?.id || row.funcionario_id
  const dataRef = new Date(row.data_hora)

  Object.assign(modalJust, {
    open: true,
    funcionario_id: fid,
    dia: toIsoShort(dataRef),
    file: null,
    form: {
      funcionario_id: fid,
      data: toIsoShort(dataRef),
      tipo: '',
      descricao: '',
    },
  })

  const { data } = await PontoJustificativasService.listar({
    funcionario_id: fid,
    mes: dataRef.getMonth() + 1,
    ano: dataRef.getFullYear(),
  })
  modalJust.lista = data || []
}

function fecharModalJust() {
  modalJust.open = false
}

function onFileChange(e) {
  modalJust.file = e?.target?.files?.[0] || null
}

async function salvarJustificativa() {
  if (!can('ponto_relatorio.editar')) return notify.error('Acesso negado.')

  try {
    modalJust.saving = true
    const resp = await PontoJustificativasService.salvar(modalJust.form)

    if (modalJust.file && resp.data?.id) {
      await PontoJustificativasService.anexarArquivo(resp.data.id, modalJust.file)
    }

    notify.success('Salvo')
    fecharModalJust()
    await buscar()
  } catch (e) {
    notify.error('Erro')
  } finally {
    modalJust.saving = false
  }
}

async function confirmarSalvarJustificativa() {
  if (!can('ponto_relatorio.editar')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Salvar Justificativa', 'Deseja salvar esta justificativa?')
  if (!ok) return
  await salvarJustificativa()
}

async function excluirJustificativa(j) {
  if (!can('ponto_relatorio.editar')) return notify.error('Acesso negado.')

  try {
    await PontoJustificativasService.remover(j.id)
    notify.success('Removido')

    // recarrega o modal do mês
    await abrirModalJustificar({ data_hora: j.data, funcionario_id: j.funcionario_id })
  } catch (e) {
    notify.error('Erro')
  }
}

async function confirmarExcluirJustificativa(j) {
  if (!can('ponto_relatorio.editar')) return notify.error('Acesso negado.')
  const ok = await confirm.show(
    'Excluir Justificativa',
    `Deseja remover a justificativa "${j?.tipo || 'JUSTIFICATIVA'}" do dia ${fmtData(j?.data)}?`,
  )
  if (!ok) return
  await excluirJustificativa(j)
}

// =======================
// INIT (protege rota)
// =======================
onMounted(async () => {
  if (!can('ponto_relatorio.ver')) {
    notify.error('Acesso negado.')
    router.push('/')
    return
  }

  const { data } = await FuncionarioService.listar()
  funcionarioOptions.value = (data?.data || data || [])
    .filter((f) => f.status === 'ATIVO')
    .map((f) => ({ label: f.nome, value: f.id }))

  filtros.data_ini = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  filtros.data_fim = new Date().toISOString().slice(0, 10)
})
</script>
