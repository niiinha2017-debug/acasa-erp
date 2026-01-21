<template>
  <div class="page-container space-y-4">
    <PageHeader
      title="Relatório de Ponto"
      subtitle="RH / Gestão de Horas"
      icon="pi pi-clock"
      iconClass="bg-slate-900 text-white shadow-lg"
    />

    <div v-if="rows.length" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard title="Meta Diária" :value="`${resumo.metaDia.toFixed(2)}h`" icon="pi pi-calendar" />
      <MetricCard title="Trabalhado" :value="resumo.totalHorasHHMM" icon="pi pi-briefcase" />
      <MetricCard 
        title="Saldo do Período" 
        :value="resumo.totalSaldoHHMM" 
        :variant="resumo.totalSaldo >= 0 ? 'success' : 'danger'"
      />
    </div>

    <Card :shadow="true" class="overflow-visible">
      <div class="p-6 space-y-6">
        <div class="grid grid-cols-12 gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          <SearchInput class="col-span-12 md:col-span-4" mode="select" label="Funcionário" :options="funcionarioOptions" v-model="filtros.funcionario_id" />
          <Input class="col-span-12 md:col-span-3" label="Início" v-model="filtros.data_ini" type="date" />
          <Input class="col-span-12 md:col-span-3" label="Fim" v-model="filtros.data_fim" type="date" />
          <div class="col-span-12 md:col-span-2 flex gap-2">
            <Button variant="primary" label="Buscar" :loading="loadingTabela" @click="buscar" class="flex-1" />
            <Button variant="outline" icon="pi pi-file-pdf" :disabled="!canPdf" @click="abrirPdfMensal" />
          </div>
        </div>

        <Table :boxed="true" :columns="columns" :rows="rows" :loading="loadingTabela">
          <template #cell-data_hora="{ row }">
            <div class="text-xs font-bold">{{ fmtData(row.data_hora) }}</div>
            <div class="text-[10px] text-slate-400 font-medium uppercase">{{ fmtHora(row.data_hora) }}</div>
          </template>
          <template #cell-tipo="{ row }"><StatusBadge :value="row.tipo" /></template>
          <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
          <template #cell-acoes="{ row }">
            <div class="flex justify-end gap-2">
              <Button variant="ghost" size="sm" label="Editar" @click="abrirModalEditar(row)" />
              <Button variant="ghost" size="sm" label="Justificar" @click="abrirModalJustificar(row)" />
            </div>
          </template>
        </Table>
      </div>
    </Card>

    <div v-if="modalEditar.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <Card class="w-full max-w-md !p-0 shadow-2xl">
        <div class="p-6 border-b bg-slate-50/50 flex justify-between items-center">
          <h3 class="font-bold">Ajustar Registro</h3>
          <Button variant="ghost" icon="pi pi-times" @click="modalEditar.open = false" />
        </div>
        <div class="p-6 space-y-4">
          <Input label="Data e Hora" type="datetime-local" v-model="modalEditar.form.data_hora_local" />
          <SearchInput mode="select" label="Tipo" :options="optionsTipo" v-model="modalEditar.form.tipo" />
          <Input label="Obs." v-model="modalEditar.form.observacao" :forceUpper="true" />
        </div>
        <div class="p-4 bg-slate-50 flex gap-2">
          <Button variant="secondary" label="Voltar" class="flex-1" @click="modalEditar.open = false" />
          <Button variant="primary" label="Salvar" class="flex-1" :loading="modalEditar.saving" @click="salvarEdicao" />
        </div>
      </Card>
    </div>

    <div v-if="modalJust.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <Card class="w-full max-w-2xl !p-0 shadow-2xl flex flex-col max-h-[90vh]">
        <div class="p-6 border-b flex justify-between items-center">
          <div>
            <h3 class="font-bold">Justificativa</h3>
            <p class="text-[10px] text-slate-500 uppercase">Funcionário {{ modalJust.funcionario_id }} • {{ modalJust.dia }}</p>
          </div>
          <Button variant="ghost" icon="pi pi-times" @click="fecharModalJust" />
        </div>
        <div class="p-6 overflow-y-auto space-y-6">
          <div class="grid grid-cols-12 gap-4">
            <Input class="col-span-12 md:col-span-6" label="Tipo" v-model="modalJust.form.tipo" placeholder="Ex: ATESTADO" :forceUpper="true" />
            <Input class="col-span-12 md:col-span-6" label="Data" type="date" v-model="modalJust.form.data" />
            <Input class="col-span-12" label="Descrição" v-model="modalJust.form.descricao" />
            <div class="col-span-12 p-4 border-2 border-dashed rounded-xl border-slate-200">
              <input type="file" @change="onFileChange" class="text-xs w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-slate-900 file:text-white cursor-pointer" />
            </div>
          </div>
          <div class="space-y-3">
            <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Justificativas do mês</p>
            <div class="border rounded-xl divide-y">
              <div v-for="j in modalJust.lista" :key="j.id" class="p-3 flex justify-between items-center bg-white">
                <div class="text-xs">
                  <span class="font-bold">{{ fmtData(j.data) }}</span> - {{ j.tipo }}
                  <p class="text-slate-500 italic">{{ j.descricao || 'Sem descrição' }}</p>
                </div>
                <div class="flex gap-1">
                  <Button variant="ghost" icon="pi pi-trash" @click="excluirJustificativa(j)" />
                </div>
              </div>
              <div v-if="!modalJust.lista.length" class="p-8 text-center text-xs text-slate-400 italic">Nenhum registro no período.</div>
            </div>
          </div>
        </div>
        <div class="p-4 bg-slate-50 border-t flex gap-2">
          <Button variant="secondary" label="Cancelar" @click="fecharModalJust" />
          <Button variant="primary" label="Salvar Justificativa" :loading="modalJust.saving" @click="salvarJustificativa" class="flex-1" />
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