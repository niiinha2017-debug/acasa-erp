<template>
  <div class="w-full max-w-[1400px] mx-auto pb-20 animate-in fade-in duration-700">
    <Card :shadow="true" class="!rounded-[3rem] overflow-hidden border-none shadow-2xl shadow-slate-200/50 bg-white">
      
      <header class="p-10 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex items-center gap-5">
          <div class="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
            <i class="pi pi-user-plus text-2xl"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Gestão de Pessoas</span>
              <span class="w-1 h-1 rounded-full bg-slate-300"></span>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ficha de Registro</span>
            </div>
            <h2 class="text-2xl font-black text-slate-800 uppercase italic tracking-tight">
              {{ isEditing ? `Editar: ${form.nome}` : 'Novo Colaborador' }}
            </h2>
          </div>
        </div>
        <Button variant="secondary" class="!rounded-2xl !h-12 !px-6 border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest" @click="router.push('/funcionarios')">
          <i class="pi pi-arrow-left mr-2"></i> Voltar
        </Button>
      </header>

      <div class="p-8 md:p-12">
        <Loading v-if="loading" />

        <form v-else class="space-y-16" @submit.prevent="confirmarSalvarFuncionario">
          
          <section class="grid grid-cols-12 gap-8">
            <div class="col-span-12 lg:col-span-3">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Seção 01</span>
              <h3 class="text-lg font-black text-slate-800 uppercase italic">Dados Pessoais</h3>
            </div>
            <div class="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-6 gap-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
              <Input class="md:col-span-4" v-model="form.nome" label="Nome Completo *" required />
              <Input class="md:col-span-2" v-model="cpfUi" label="CPF *" required />
              <Input class="md:col-span-2" v-model="rgUi" label="RG" />
              <Input class="md:col-span-2" v-model="form.data_nascimento" label="Data Nascimento" type="date" />
              <Input class="md:col-span-2" v-model="whatsappUi" label="WhatsApp / Celular" />
              <Input class="md:col-span-3" v-model="emailUi" label="E-mail Pessoal" :forceUpper="false" />
              <Input class="md:col-span-3" v-model="form.estado_civil" label="Estado Civil" />
            </div>
          </section>

          <section class="grid grid-cols-12 gap-8">
            <div class="col-span-12 lg:col-span-3">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Seção 02</span>
              <h3 class="text-lg font-black text-slate-800 uppercase italic">Endereço</h3>
            </div>
            <div class="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-6 gap-6">
              <Input class="md:col-span-2" v-model="cepUi" label="CEP" @blur="tratarBuscaCep" />
              <Input class="md:col-span-3" v-model="form.endereco" label="Logradouro" />
              <Input class="md:col-span-1" v-model="form.numero" label="Nº" />
              <Input class="md:col-span-2" v-model="form.complemento" label="Complemento" />
              <Input class="md:col-span-2" v-model="form.bairro" label="Bairro" />
              <Input class="md:col-span-2" v-model="form.cidade" label="Cidade" />
            </div>
          </section>

          <section class="relative bg-white rounded-[3rem] p-8 md:p-12 border border-slate-200 shadow-xl shadow-slate-100/50">
            <div class="flex flex-col md:flex-row justify-between items-center border-b border-slate-100 pb-8 mb-10 gap-6">
              <h3 class="text-xl font-black uppercase italic tracking-tight text-slate-800">Contrato & Alocação</h3>
              <div class="bg-slate-50 px-8 py-4 rounded-[2rem] border border-slate-100 shadow-inner text-right">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Custo Hora</span>
                <span class="text-3xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{{ custoHoraExibicao }}</span>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-10">
              <div class="col-span-12 lg:col-span-4 space-y-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unidade *</label>
                  <select v-model="form.unidade" class="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100 transition-all">
                    <option value="">SELECIONE</option>
                    <option value="FÁBRICA">FÁBRICA</option>
                    <option value="LOJA">LOJA</option>
                  </select>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Setor *</label>
                  <select v-model="form.setor" :disabled="!form.unidade" class="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 outline-none disabled:opacity-50 transition-all uppercase">
                    <option value="">SELECIONE</option>
                    <option v-for="opt in setorOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cargo *</label>
                  <select v-model="form.cargo" :disabled="!form.setor" class="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 outline-none disabled:opacity-50 transition-all uppercase">
                    <option value="">SELECIONE</option>
                    <option v-for="opt in cargoOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>

                <Input v-model="form.admissao" label="Data de Admissão" type="date" class="!bg-slate-50" />
              </div>

              <div class="col-span-12 lg:col-span-8 bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  <Input v-model="form.horario_entrada_1" label="Entrada 1" type="time" class="!bg-white" @update:modelValue="atualizarCargaHoraria" />
                  <Input v-model="form.horario_saida_1" label="Saída 1" type="time" class="!bg-white" @update:modelValue="atualizarCargaHoraria" />
                  <Input v-model="form.horario_entrada_2" label="Entrada 2" type="time" class="!bg-white" @update:modelValue="atualizarCargaHoraria" />
                  <Input v-model="form.horario_saida_2" label="Saída 2" type="time" class="!bg-white" @update:modelValue="atualizarCargaHoraria" />
                </div>
                
                <div class="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-slate-200/60">
                  <div class="flex gap-10">
                    <div>
                      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Semanal</p>
                      <p class="text-2xl font-black text-slate-800 italic">{{ Number(cargaHorariaSemanal).toFixed(1) }}h</p>
                    </div>
                    <div class="w-px h-10 bg-slate-200"></div>
                    <div>
                      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mensal</p>
                      <p class="text-2xl font-black text-slate-900 italic">{{ Number(cargaHorariaMensal).toFixed(1) }}h</p>
                    </div>
                  </div>

                  <div class="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <span class="text-[9px] font-black text-slate-400 uppercase px-3 border-r border-slate-100">Sábado</span>
                    <div class="flex gap-2">
                      <input v-model="form.horario_sabado_entrada_1" type="time" class="w-20 h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center outline-none" @change="atualizarCargaHoraria" />
                      <input v-model="form.horario_sabado_saida_1" type="time" class="w-20 h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center outline-none" @change="atualizarCargaHoraria" />
                    </div>
                  </div>
                </div>
                <p class="text-[10px] font-bold text-slate-400 uppercase mt-4 text-center">Tempo de casa: {{ tempoServico }}</p>
              </div>
            </div>
          </section>

          <section class="grid grid-cols-12 gap-8">
            <div class="col-span-12 lg:col-span-3">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Seção 04</span>
              <h3 class="text-lg font-black text-slate-800 uppercase italic">Financeiro</h3>
            </div>
<div class="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-4 gap-6">
  <Input :modelValue="salarioBaseInput" @update:modelValue="updateSalarioBase" label="Salário Base (R$)" />
  <Input :modelValue="salarioAdicionalInput" @update:modelValue="updateSalarioAdicional" label="Gratificação (R$)" />
  <Input :modelValue="valeInput" @update:modelValue="updateVale" label="Vale (R$)" />
  <Input :modelValue="valeTransporteInput" @update:modelValue="updateValeTransporte" label="Vale Transporte (R$)" />

  <div class="space-y-2 md:col-span-1">
    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dia de Pagamento</label>
    <select v-model="form.dia_pagamento" class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 outline-none">
      <option :value="5">DIA 05</option>
      <option :value="10">DIA 10</option>
      <option :value="20">DIA 20</option>
    </select>
  </div>
</div>

          </section>

          <section class="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
            <div class="flex items-center gap-4 mb-8">
              <div class="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
                <i class="pi pi-paperclip"></i>
              </div>
              <h3 class="text-lg font-black text-slate-800 uppercase italic">Documentos Anexos</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="md:col-span-3">
                <div class="flex items-center gap-4 p-4 bg-white rounded-[1.5rem] border border-slate-200">
                  <Button variant="secondary" type="button" class="!rounded-xl h-11" @click="abrirSeletorArquivo">Escolher Arquivo</Button>
                  <span class="text-sm font-bold text-slate-500 truncate italic">
                    {{ arquivoSelecionado?.name || 'Selecione um arquivo...' }}
                  </span>
                  <input ref="fileInput" type="file" class="hidden" @change="onFileChange" />
                </div>
              </div>
              <Button variant="primary" type="button" class="!rounded-[1.5rem] h-14 font-black uppercase text-[10px] tracking-widest" :loading="enviandoArquivo" @click="confirmarEnviarArquivo">
                Anexar
              </Button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div v-for="a in arquivos" :key="a.id" class="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div class="flex items-center gap-3 overflow-hidden">
                   <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                     <i class="pi pi-file"></i>
                   </div>
                   <div class="truncate">
                      <p class="text-sm font-black text-slate-700 truncate">{{ a.nome }}</p>
                      <p class="text-[9px] font-bold text-slate-400 uppercase">{{ a.mime }}</p>
                   </div>
                </div>
                <div class="flex gap-2">
                   <a :href="a.url" target="_blank" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100"><i class="pi pi-eye"></i></a>
                   <button type="button" @click="confirmarRemoverArquivo(a.id)" class="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 border border-rose-100"><i class="pi pi-trash"></i></button>
                </div>
              </div>
            </div>
          </section>

          <footer class="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campos com * são obrigatórios</p>
            </div>

            <div class="flex items-center gap-4 w-full md:w-auto">
               <Button variant="secondary" type="button" class="!rounded-2xl !px-8 !h-14 font-black" @click="router.push('/funcionarios')">Cancelar</Button>
               <Button variant="primary" type="submit" class="!rounded-2xl !px-12 !h-16 shadow-2xl shadow-brand-primary/30 font-black uppercase text-[11px] tracking-widest" :loading="salvando">
                 <i class="pi pi-save mr-3"></i> Salvar Registro
               </Button>
            </div>
          </footer>

        </form>
      </div>
    </Card>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { FuncionarioService } from '@/services/index'

import { maskCPF, maskRG, maskTelefone, maskCEP, onlyNumbers, maskMoneyBR } from '@/utils/masks'
import { buscarCep } from '@/utils/utils'
import { numeroParaMoeda } from '@/utils/number'

import { upper, raw } from '@/utils/text'

import { FUNCIONARIOS_LOCAL_SETOR_CARGO } from '@/constantes'
import { confirm } from '@/services/confirm'

const router = useRouter()
const route = useRoute()

const salvando = ref(false)
const loading = ref(false)

// ===== id / modo =====
const paramId = computed(() => String(route.params.id || 'novo'))
const isEditing = computed(() => paramId.value !== 'novo')
const id = computed(() => (isEditing.value ? paramId.value.replace(/\D/g, '') : null))

const fmtDate = (d) => (d ? String(d).split('T')[0] : '')

// ===== arquivos =====
const arquivos = ref([])
const arquivosLoading = ref(false)
const arquivoSelecionado = ref(null)
const enviandoArquivo = ref(false)
const fileInput = ref(null)


// ===== Form =====
function novoForm() {
  return {
    nome: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    telefone: '',
    whatsapp: '',
    email: '',
    estado_civil: '',
    escolaridade: '',

    unidade: '',
    setor: '',
    cargo: '',

    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',

    registro: '',
    admissao: '',
    demissao: '',

    salario_base: 0,
    salario_adicional: 0,
    custo_hora: 0,

    tem_vale: false,
    vale: 0,

    tem_vale_transporte: false,
    vale_transporte: 0,

    horario_entrada_1: '07:30',
    horario_saida_1: '12:00',
    horario_entrada_2: '13:30',
    horario_saida_2: '17:30',

    horario_sabado_entrada_1: '08:00',
    horario_sabado_saida_1: '12:00',

    forma_pagamento: 'DINHEIRO',
    dia_pagamento: 5,
    banco: '',
    agencia: '',
    conta: '',
    pix_tipo_chave: '',
    pix_chave: '',
  }
}

const form = ref(novoForm())

// ===== Refs para inputs monetários =====
const salarioBaseInput = ref('')
const salarioAdicionalInput = ref('')
const valeInput = ref('')
const valeTransporteInput = ref('')

// ===== Sincronização dos inputs monetários =====
watch(() => form.value.salario_base, (val) => {
  salarioBaseInput.value = maskMoneyBR(Number(val || 0))
}, { immediate: true })

watch(() => form.value.salario_adicional, (val) => {
  salarioAdicionalInput.value = maskMoneyBR(Number(val || 0))
}, { immediate: true })

watch(() => form.value.vale, (val) => {
  valeInput.value = maskMoneyBR(Number(val || 0))
}, { immediate: true })

watch(() => form.value.vale_transporte, (val) => {
  valeTransporteInput.value = maskMoneyBR(Number(val || 0))
}, { immediate: true })


// ===== Funções para atualizar valores monetários =====

function toMoneyNumber(v) {
  const digits = onlyNumbers(v)
  return digits ? Number(digits) / 100 : 0
}
function updateSalarioBase(v) {
  const n = toMoneyNumber(v)
  form.value.salario_base = n
  salarioBaseInput.value = maskMoneyBR(n)
  recalcularCustoHora()
}

function updateSalarioAdicional(v) {
  const n = toMoneyNumber(v)
  form.value.salario_adicional = n
  salarioAdicionalInput.value = maskMoneyBR(n)
  recalcularCustoHora()
}

function updateVale(v) {
  const n = toMoneyNumber(v)
  form.value.vale = n
  valeInput.value = maskMoneyBR(n)
}

function updateValeTransporte(v) {
  const n = toMoneyNumber(v)
  form.value.vale_transporte = n
  valeTransporteInput.value = maskMoneyBR(n)
}

// ===== UI Computed (masks) =====
const cpfUi = computed({
  get: () => (form.value.cpf ? maskCPF(form.value.cpf) : ''),
  set: (v) => (form.value.cpf = onlyNumbers(v)),
})

const rgUi = computed({
  get: () => (form.value.rg || ''),
  set: (v) => (form.value.rg = raw(maskRG(v))),
})

const whatsappUi = computed({
  get: () => (form.value.whatsapp ? maskTelefone(form.value.whatsapp) : ''),
  set: (v) => (form.value.whatsapp = onlyNumbers(v)),
})

const cepUi = computed({
  get: () => (form.value.cep ? maskCEP(form.value.cep) : ''),
  set: (v) => (form.value.cep = onlyNumbers(v)),
})

const emailUi = computed({
  get: () => (form.value.email || ''),
  set: (v) => (form.value.email = String(v || '').toLowerCase().trim()),
})

// ===== Funções para cálculo de horas =====
const timeToDecimal = (t) => {
  if (!t || !String(t).includes(':')) return 0
  const [h, m] = String(t).split(':').map((n) => Number(n))
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return h + m / 60
}

// Calcular horas trabalhadas por dia (considerando os dois períodos)
const calcularHorasDia = () => {
  const periodo1 = timeToDecimal(form.value.horario_saida_1) - timeToDecimal(form.value.horario_entrada_1)
  const periodo2 = timeToDecimal(form.value.horario_saida_2) - timeToDecimal(form.value.horario_entrada_2)
  return Math.max(0, periodo1) + Math.max(0, periodo2)
}

// Calcular horas do sábado
const calcularHorasSabado = () => {
  return timeToDecimal(form.value.horario_sabado_saida_1) - timeToDecimal(form.value.horario_sabado_entrada_1)
}

// ===== Carga Horária Calculada =====
const cargaHorariaSemanal = computed(() => {
  const horasDia = calcularHorasDia()
  const horasSabado = calcularHorasSabado()
  return (horasDia * 5) + (horasSabado > 0 ? horasSabado : 0)
})

const cargaHorariaMensal = computed(() => {
  return cargaHorariaSemanal.value * 4.5
})

const horasDiariasMedias = computed(() => {
  if (cargaHorariaSemanal.value <= 0) return 0
  const diasTrabalhados = form.value.horario_sabado_entrada_1 ? 6 : 5
  return cargaHorariaSemanal.value / diasTrabalhados
})

// ===== Custo Hora =====
const custoHoraExibicao = computed(() => numeroParaMoeda(Number(form.value.custo_hora || 0)))

function recalcularCustoHora() {
  const base = Number(form.value.salario_base || 0)
  const adicional = Number(form.value.salario_adicional || 0)
  const total = base + adicional
  const horasMensais = Number(cargaHorariaMensal.value || 0)

  if (total <= 0 || horasMensais <= 0) {
    form.value.custo_hora = 0
    return
  }

  // Cálculo direto: Total / Horas Mensais
  // O 4.5 semanas/mês já está embutido no cargaHorariaMensal.value
  form.value.custo_hora = total / horasMensais
}

// ===== Atualiza carga horária =====
const atualizarCargaHoraria = () => {
  recalcularCustoHora()
}

// Watch para recálculo automático
watch(
  () => [
    form.value.horario_entrada_1,
    form.value.horario_saida_1,
    form.value.horario_entrada_2,
    form.value.horario_saida_2,
    form.value.horario_sabado_entrada_1,
    form.value.horario_sabado_saida_1
  ],
  () => {
    recalcularCustoHora()
  }
)

// SALVAR (confirm)
async function confirmarSalvarFuncionario() {
  const ok = await confirm.show(
    'Salvar Registro',
    `Deseja salvar o registro de "${form.value.nome}"?`,
  )
  if (!ok) return
  await salvar()
}

// ANEXAR ARQUIVO (confirm)
async function confirmarEnviarArquivo() {
  if (!arquivoSelecionado.value) return

  const ok = await confirm.show(
    'Anexar Arquivo',
    `Deseja anexar o arquivo "${arquivoSelecionado.value.name}"?`,
  )
  if (!ok) return

  await enviarArquivo()
}

// REMOVER ARQUIVO (confirm)
async function confirmarRemoverArquivo(fileId) {
  const arq = arquivos.value?.find(a => a.id === fileId)

  const ok = await confirm.show(
    'Excluir Arquivo',
    `Deseja excluir o arquivo "${arq?.nome || 'SEM NOME'}"?`,
  )
  if (!ok) return

  try {
    await FuncionarioService.removerArquivo(fileId)
    await carregarArquivos()
  } catch {
    alert('Erro ao remover')
  }
}

async function garantirIdParaUpload() {
  if (isEditing.value && id.value) return Number(id.value)

  if (!form.value.nome || String(form.value.cpf || '').length < 11) {
    alert('Preencha Nome e CPF corretamente antes de anexar.')
    throw new Error('Sem nome/cpf')
  }
  if (!form.value.unidade || !form.value.setor || !form.value.cargo) {
    alert('Preencha Unidade, Setor e Cargo antes de anexar.')
    throw new Error('Sem unidade/setor/cargo')
  }

  recalcularCustoHora()
  const payload = montarPayload()

  const { data } = await FuncionarioService.salvar(null, payload)

  const newId = data?.id
  if (!newId) throw new Error('Backend não retornou o id do funcionário.')

  await router.replace(`/funcionarios/${newId}`)

  // ✅ garante estado consistente (vira edição + habilita carregarArquivos)
  await carregar()

  return Number(newId)
}

function abrirSeletorArquivo() {
  fileInput.value?.click()
}

function onFileChange(e) {
  arquivoSelecionado.value = e?.target?.files?.[0] || null
}


// ===== Tempo de Serviço =====
const tempoServico = computed(() => {
  if (!form.value.admissao) return '---'
  const inicio = new Date(form.value.admissao)
  const fim = form.value.demissao ? new Date(form.value.demissao) : new Date()
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return '---'

  let anos = fim.getFullYear() - inicio.getFullYear()
  let meses = fim.getMonth() - inicio.getMonth()
  if (meses < 0) {
    anos--
    meses += 12
  }

  return anos > 0 ? `${anos} anos e ${meses} meses` : `${meses} meses`
})

// ===== Unidade / Setor / Cargo =====
const unidadeKey = computed(() =>
  form.value.unidade === 'FABRICA' ? 'FÁBRICA' : form.value.unidade
)

const setorOptions = computed(() => {
  const grupos = FUNCIONARIOS_LOCAL_SETOR_CARGO?.[unidadeKey.value] || []
  return grupos.map(g => ({ label: String(g.setor).replaceAll('_',' '), value: g.setor }))
})

const cargoOptions = computed(() => {
  const grupos = FUNCIONARIOS_LOCAL_SETOR_CARGO?.[unidadeKey.value] || []
  const grupo = grupos.find(g => g.setor === form.value.setor)
  return (grupo?.cargo || []).map(v => ({ label: String(v).replaceAll('_',' '), value: v }))
})

watch(
  () => [
    form.value.salario_base, 
    form.value.salario_adicional, 
    cargaHorariaSemanal.value
  ],
  () => {
    recalcularCustoHora()
  },
  { immediate: true }
)

watch(
  () => form.value.unidade,
  () => {
    form.value.setor = ''
    form.value.cargo = ''
  },
)

watch(
  () => form.value.setor,
  () => {
    form.value.cargo = ''
  },
)

// ===== CEP =====
async function tratarBuscaCep() {
  const cep = onlyNumbers(form.value.cep)
  if (cep.length !== 8) return

  const d = await buscarCep(cep)
  if (!d) return

  form.value.endereco = upper(d.logradouro)
  form.value.bairro = upper(d.bairro)
  form.value.cidade = upper(d.localidade)
  form.value.estado = upper(d.uf)
}

// ===== Arquivos =====
async function carregarArquivos() {
  if (!isEditing.value || !id.value) return
  arquivosLoading.value = true
  try {
    const { data } = await FuncionarioService.listarArquivos(id.value)
    arquivos.value = Array.isArray(data) ? data : []
  } finally {
    arquivosLoading.value = false
  }
}

async function enviarArquivo() {
  if (!arquivoSelecionado.value) return

  enviandoArquivo.value = true
  try {
    const funcionarioId = await garantirIdParaUpload()

    await FuncionarioService.uploadArquivo(funcionarioId, arquivoSelecionado.value)

arquivoSelecionado.value = null
if (fileInput.value) fileInput.value.value = ''
await carregarArquivos()

  } catch (err) {
    alert(err?.response?.data?.message || err?.message || 'Erro no upload')
  } finally {
    enviandoArquivo.value = false
  }
}


// ===== Load / Save =====
function normalizarNumero(v) {
  // Prisma Decimal pode vir como string
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

async function carregar() {
  if (!isEditing.value) {
    form.value = novoForm()
    arquivos.value = []
    return
  }

  if (!id.value) {
    router.push('/funcionarios')
    return
  }

  loading.value = true
  try {
    const { data } = await FuncionarioService.buscar(id.value)

    form.value = {
      ...novoForm(),
      ...data,

      data_nascimento: fmtDate(data.data_nascimento),
      admissao: fmtDate(data.admissao),
      demissao: fmtDate(data.demissao),

      salario_base: normalizarNumero(data.salario_base),
      salario_adicional: normalizarNumero(data.salario_adicional),
      custo_hora: normalizarNumero(data.custo_hora),

      vale: normalizarNumero(data.vale),
      vale_transporte: normalizarNumero(data.vale_transporte),

      dia_pagamento: Number(data.dia_pagamento ?? 5),
    }

    await carregarArquivos()
  } catch {
    router.push('/funcionarios')
  } finally {
    loading.value = false
  }
}

function montarPayload() {
  // garante que vai número pro backend (sem máscara)
  return {
    ...form.value,
    email: emailUi.value,

    salario_base: normalizarNumero(form.value.salario_base),
    salario_adicional: normalizarNumero(form.value.salario_adicional),
    custo_hora: normalizarNumero(form.value.custo_hora),

    vale: normalizarNumero(form.value.vale),
    vale_transporte: normalizarNumero(form.value.vale_transporte),

    dia_pagamento: form.value.dia_pagamento ? Number(form.value.dia_pagamento) : null,
  }
}

async function salvar() {
  if (!form.value.nome || String(form.value.cpf || '').length < 11) {
    alert('Preencha Nome e CPF corretamente.')
    return
  }

  if (!form.value.unidade || !form.value.setor || !form.value.cargo) {
    alert('Preencha Unidade, Setor e Função corretamente.')
    return
  }

  salvando.value = true
  try {
    recalcularCustoHora()
    const payload = montarPayload()

    const { data } = await FuncionarioService.salvar(isEditing.value ? id.value : null, payload)

    // ✅ se era novo: vira edição e fica na tela
    if (!isEditing.value) {
      const newId = data?.id
      if (newId) {
        await router.replace(`/funcionarios/${newId}`)
        await carregar()
        return
      }
    }

    // edição: mantém seu padrão atual
    router.push('/funcionarios')
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao salvar')
  } finally {
    salvando.value = false
  }
}


onMounted(carregar)

// evita carregar duas vezes e evita loop: só reage quando o id efetivamente muda
watch(
  () => String(route.params.id || 'novo'),
  (next, prev) => {
    if (next !== prev) carregar()
  },
)
</script> 

