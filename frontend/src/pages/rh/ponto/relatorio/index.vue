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
            <Button variant="primary" class="flex-1 !h-12 !rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20" @click="buscar" :loading="loadingTabela">
              BUSCAR
            </Button>
            <Button variant="outline" class="!h-12 !w-12 !p-0 !rounded-xl border-slate-200" :disabled="!canPdf" @click="abrirPdfMensal">
              <i class="pi pi-file-pdf text-rose-500"></i>
            </Button>
          </div>
        </div>
      </header>

      <div class="p-2">
        <Table :columns="columns" :rows="rows" :loading="loadingTabela" class="!border-none">
          
          <template #cell-data_hora="{ row }">
            <div class="flex flex-col py-1">
              <span class="text-sm font-black text-slate-700 uppercase italic tracking-tighter">{{ fmtData(row.data_hora) }}</span>
              <span class="text-[10px] font-bold text-slate-400 tabular-nums">{{ fmtHora(row.data_hora) }}</span>
            </div>
          </template>

          <template #cell-tipo="{ row }">
            <span class="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200/50">
              {{ row.tipo }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <StatusBadge :value="row.status" class="scale-90 origin-left" />
          </template>

          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2 pr-4">
              <button @click="abrirModalEditar(row)" class="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center">
                <i class="pi pi-pencil text-[10px]"></i>
              </button>
              <button @click="abrirModalJustificar(row)" class="px-3 h-9 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-all text-[9px] font-black uppercase tracking-widest">
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
          <Button variant="primary" class="flex-1 !rounded-xl font-black uppercase text-[10px] tracking-widest" :loading="modalEditar.saving" @click="confirmarSalvarEdicao">Salvar</Button>
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
  variant="primary"
  class="flex-1 !rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20"
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
import { PontoRelatorioService, PontoJustificativasService, PontoRegistrosService, FuncionarioService } from '@/services/index'
import { notify } from '@/services/notify'
import { consolidarSaldoPeriodo } from '@/utils/utils'
import { confirm } from '@/services/confirm'

// DATA & STATES
const loadingTabela = ref(false), rows = ref([]), funcionarioOptions = ref([])
const filtros = reactive({ funcionario_id: '', data_ini: '', data_fim: '', tipo: null })

const columns = [
  { key: 'data_hora', label: 'Data/Hora', width: '130px' },
  { key: 'funcionario', label: 'Funcionário' },
  { key: 'tipo', label: 'Tipo', width: '100px' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'acoes', label: '', width: '200px', align: 'right' }
]

const optionsTipo = [{ label: 'ENTRADA', value: 'ENTRADA' }, { label: 'SAIDA', value: 'SAIDA' }]

// COMPUTED LOGIC
const canPdf = computed(() => filtros.funcionario_id && filtros.data_ini)
const resumo = computed(() => consolidarSaldoPeriodo({ registros: rows.value, horasSemana: 48, diasSemana: 6 }))

// FORMATTERS
const fmtData = (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '-'
const fmtHora = (v) => v ? new Date(v).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
const toIsoShort = (date) => new Date(date).toISOString().slice(0, 10)

// ACTIONS
async function buscar() {
  try {
    loadingTabela.value = true
    const { data } = await PontoRelatorioService.listarRegistros({ ...filtros, funcionario_id: filtros.funcionario_id || undefined })
    rows.value = data || []
  } catch (e) { notify?.error?.('Erro ao buscar registros') } finally { loadingTabela.value = false }
}

function limpar() { Object.assign(filtros, { funcionario_id: '', data_ini: '', data_fim: '', tipo: null }); rows.value = [] }

// EDIT LOGIC
const modalEditar = reactive({ open: false, saving: false, id: null, form: { data_hora_local: '', tipo: null, observacao: '' }})
function abrirModalEditar(row) {
  Object.assign(modalEditar, { open: true, id: row.id, form: { data_hora_local: row.data_hora?.slice(0, 16), tipo: row.tipo, observacao: row.observacao }})
}
async function salvarEdicao() {
  try {
    modalEditar.saving = true
    await PontoRegistrosService.atualizar(modalEditar.id, { ...modalEditar.form, data_hora: new Date(modalEditar.form.data_hora_local).toISOString() })
    notify?.success?.('Sucesso'); modalEditar.open = false; buscar()
  } catch (e) { notify?.error?.('Erro') } finally { modalEditar.saving = false }
}

// JUSTIFICATION LOGIC (ORIGINAL)
const modalJust = reactive({ open: false, saving: false, funcionario_id: null, dia: '', lista: [], file: null, form: { funcionario_id: null, data: '', tipo: '', descricao: '' }})
async function abrirModalJustificar(row) {
  const fid = row.funcionario?.id || row.funcionario_id
  const dataRef = new Date(row.data_hora)
  Object.assign(modalJust, { open: true, funcionario_id: fid, dia: toIsoShort(dataRef), form: { funcionario_id: fid, data: toIsoShort(dataRef), tipo: '', descricao: '' }})
  const { data } = await PontoJustificativasService.listar({ funcionario_id: fid, mes: dataRef.getMonth() + 1, ano: dataRef.getFullYear() })
  modalJust.lista = data || []
}
const fecharModalJust = () => modalJust.open = false
const onFileChange = (e) => modalJust.file = e.target.files[0]

// EXCLUIR JUSTIFICATIVA (confirm)
async function confirmarExcluirJustificativa(j) {
  const ok = await confirm.show(
    'Excluir Justificativa',
    `Deseja remover a justificativa "${j?.tipo || 'JUSTIFICATIVA'}" do dia ${fmtData(j?.data)}?`,
  )
  if (!ok) return
  await excluirJustificativa(j)
}

// SALVAR EDIÇÃO DO REGISTRO (confirm)
async function confirmarSalvarEdicao() {
  const ok = await confirm.show(
    'Salvar Ajuste',
    'Deseja salvar o ajuste deste registro de ponto?',
  )
  if (!ok) return
  await salvarEdicao()
}

// SALVAR JUSTIFICATIVA (confirm)
async function confirmarSalvarJustificativa() {
  const ok = await confirm.show(
    'Salvar Justificativa',
    'Deseja salvar esta justificativa?',
  )
  if (!ok) return
  await salvarJustificativa()
}

async function salvarJustificativa() {
  try {
    modalJust.saving = true
    const resp = await PontoJustificativasService.salvar(modalJust.form)
    if (modalJust.file && resp.data?.id) await PontoJustificativasService.anexarArquivo(resp.data.id, modalJust.file)
    notify?.success?.('Salvo'); fecharModalJust(); buscar()
  } catch (e) { notify?.error?.('Erro') } finally { modalJust.saving = false }
}

async function excluirJustificativa(j) {
  try {
    await PontoJustificativasService.remover(j.id)
    notify?.success?.('Removido'); abrirModalJustificar({ data_hora: j.data, funcionario_id: j.funcionario_id })
  } catch (e) { notify?.error?.('Erro') }
}

async function abrirPdfMensal() {
  const d = new Date(filtros.data_ini)
  const resp = await PontoRelatorioService.pdfMensal({ funcionario_id: filtros.funcionario_id, mes: d.getMonth() + 1, ano: d.getFullYear() })
  window.open(URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' })), '_blank')
}

onMounted(async () => {
  const { data } = await FuncionarioService.listar()
  funcionarioOptions.value = (data?.data || data || []).filter(f => f.status === 'ATIVO').map(f => ({ label: f.nome, value: f.id }))
  filtros.data_ini = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  filtros.data_fim = new Date().toISOString().slice(0, 10)
})
</script>