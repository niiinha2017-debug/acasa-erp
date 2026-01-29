<template>
  <div class="w-full max-w-[1200px] mx-auto px-2 sm:px-4 pb-16 space-y-4 animate-page-in">

    <!-- Header -->
    <Card :shadow="true" class="!rounded-3xl overflow-hidden">
      <div class="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <i class="pi pi-user text-lg"></i>
          </div>
          <div>
            <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">
              {{ isEditing ? `Editar Funcionário` : 'Novo Funcionário' }}
            </h1>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Cadastro operacional
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          class="!h-10 !rounded-xl !px-4 text-[10px] font-black uppercase tracking-widest"
          type="button"
          @click="router.push('/funcionarios')"
        >
          <i class="pi pi-arrow-left mr-2 text-[10px]"></i>
          Voltar
        </Button>
      </div>

      <div class="p-6 sm:p-8">
        <Loading v-if="loading" />

        <form v-else class="space-y-8" @submit.prevent="confirmarSalvarFuncionario">

          <!-- Dados pessoais -->
          <section class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Dados pessoais
              </h2>
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Seção 01
              </span>
            </div>

            <div class="grid grid-cols-12 gap-4">
              <Input class="col-span-12 md:col-span-8" v-model="form.nome" label="Nome Completo *" required />
              <Input class="col-span-12 md:col-span-4" v-model="cpfUi" label="CPF *" required />

              <Input class="col-span-12 md:col-span-4" v-model="rgUi" label="RG" />
              <Input class="col-span-12 md:col-span-4" v-model="form.data_nascimento" label="Data Nascimento" type="date" />
              <Input class="col-span-12 md:col-span-4" v-model="whatsappUi" label="WhatsApp" />

              <Input class="col-span-12 md:col-span-6" v-model="emailUi" label="E-mail" :forceUpper="false" />
              <Input class="col-span-12 md:col-span-6" v-model="form.estado_civil" label="Estado Civil" />
            </div>
          </section>

          <div class="h-px bg-slate-100"></div>

          <!-- Endereço -->
          <section class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Endereço
              </h2>
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Seção 02
              </span>
            </div>

            <div class="grid grid-cols-12 gap-4">
              <Input class="col-span-12 md:col-span-3" v-model="cepUi" label="CEP" @blur="tratarBuscaCep" />
              <Input class="col-span-12 md:col-span-7" v-model="form.endereco" label="Logradouro" />
              <Input class="col-span-12 md:col-span-2" v-model="form.numero" label="Nº" />

              <Input class="col-span-12 md:col-span-4" v-model="form.complemento" label="Complemento" />
              <Input class="col-span-12 md:col-span-4" v-model="form.bairro" label="Bairro" />
              <Input class="col-span-12 md:col-span-4" v-model="form.cidade" label="Cidade" />
            </div>
          </section>

          <div class="h-px bg-slate-100"></div>

          <!-- Contrato / Alocação -->
          <section class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Contrato e alocação
              </h2>
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Seção 03
              </span>
            </div>

            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-12 md:col-span-4 space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade *</label>
                <select
                  v-model="form.unidade"
                  class="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                >
                  <option value="">SELECIONE</option>
                  <option value="FÁBRICA">FÁBRICA</option>
                  <option value="LOJA">LOJA</option>
                </select>
              </div>

              <div class="col-span-12 md:col-span-4 space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Setor *</label>
                <select
                  v-model="form.setor"
                  :disabled="!form.unidade"
                  class="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 outline-none disabled:opacity-50 transition-all uppercase"
                >
                  <option value="">SELECIONE</option>
                  <option v-for="opt in setorOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>

              <div class="col-span-12 md:col-span-4 space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo *</label>
                <select
                  v-model="form.cargo"
                  :disabled="!form.setor"
                  class="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 outline-none disabled:opacity-50 transition-all uppercase"
                >
                  <option value="">SELECIONE</option>
                  <option v-for="opt in cargoOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>

              <Input class="col-span-12 md:col-span-4" v-model="form.admissao" label="Admissão" type="date" />
              <Input class="col-span-12 md:col-span-4" v-model="form.demissao" label="Demissão" type="date" />
              <Input class="col-span-12 md:col-span-4" v-model="form.registro" label="Registro" />

              <div class="col-span-12 md:col-span-6">
                <div class="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Custo hora</p>
                  <p class="text-2xl font-black text-slate-900 tabular-nums italic">{{ custoHoraExibicao }}</p>
                </div>
              </div>

              <div class="col-span-12 md:col-span-6">
                <div class="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Tempo de casa</p>
                  <p class="text-lg font-black text-slate-800 italic">{{ tempoServico }}</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
              <Input class="col-span-6 md:col-span-3" v-model="form.horario_entrada_1" label="Entrada 1" type="time" @update:modelValue="atualizarCargaHoraria" />
              <Input class="col-span-6 md:col-span-3" v-model="form.horario_saida_1" label="Saída 1" type="time" @update:modelValue="atualizarCargaHoraria" />
              <Input class="col-span-6 md:col-span-3" v-model="form.horario_entrada_2" label="Entrada 2" type="time" @update:modelValue="atualizarCargaHoraria" />
              <Input class="col-span-6 md:col-span-3" v-model="form.horario_saida_2" label="Saída 2" type="time" @update:modelValue="atualizarCargaHoraria" />

              <Input class="col-span-6 md:col-span-3" v-model="form.horario_sabado_entrada_1" label="Sábado entrada" type="time" @update:modelValue="atualizarCargaHoraria" />
              <Input class="col-span-6 md:col-span-3" v-model="form.horario_sabado_saida_1" label="Sábado saída" type="time" @update:modelValue="atualizarCargaHoraria" />

              <div class="col-span-12 md:col-span-6 grid grid-cols-2 gap-4">
                <div class="rounded-2xl border border-slate-200 bg-white p-4">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Semanal</p>
                  <p class="text-xl font-black text-slate-900 tabular-nums italic">{{ Number(cargaHorariaSemanal).toFixed(1) }}h</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-white p-4">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensal</p>
                  <p class="text-xl font-black text-slate-900 tabular-nums italic">{{ Number(cargaHorariaMensal).toFixed(1) }}h</p>
                </div>
              </div>
            </div>
          </section>

          <div class="h-px bg-slate-100"></div>

          <!-- Financeiro -->
          <section class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Financeiro
              </h2>
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Seção 04
              </span>
            </div>

            <div class="grid grid-cols-12 gap-4">
              <Input class="col-span-12 md:col-span-3" :modelValue="salarioBaseInput" @update:modelValue="updateSalarioBase" label="Salário Base (R$)" />
              <Input class="col-span-12 md:col-span-3" :modelValue="salarioAdicionalInput" @update:modelValue="updateSalarioAdicional" label="Gratificação (R$)" />
              <Input class="col-span-12 md:col-span-3" :modelValue="valeInput" @update:modelValue="updateVale" label="Vale (R$)" />
              <Input class="col-span-12 md:col-span-3" :modelValue="valeTransporteInput" @update:modelValue="updateValeTransporte" label="Vale Transporte (R$)" />

              <div class="col-span-12 md:col-span-3 space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dia de Pagamento</label>
                <select v-model="form.dia_pagamento" class="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 outline-none">
                  <option :value="5">DIA 05</option>
                  <option :value="10">DIA 10</option>
                  <option :value="20">DIA 20</option>
                </select>
              </div>
            </div>
          </section>

          <div class="h-px bg-slate-100"></div>

          <!-- Arquivos -->
          <section class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Documentos anexos
              </h2>
              <Button
                variant="primary"
                type="button"
                class="!h-10 !rounded-xl !px-4 text-[10px] font-black uppercase tracking-widest"
                @click="abrirArquivosFuncionario"
              >
                <i class="pi pi-folder-open mr-2 text-[10px]"></i>
                Abrir Arquivos
              </Button>
            </div>

            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Upload / visualização dentro do sistema (PWA)
            </p>
          </section>

          <!-- Footer -->
          <footer class="pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Campos com * são obrigatórios
            </p>

            <div class="flex items-center gap-3 w-full md:w-auto">
              <Button
                variant="secondary"
                type="button"
                class="!h-12 !rounded-2xl !px-6 text-[10px] font-black uppercase tracking-widest"
                @click="router.push('/funcionarios')"
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                type="submit"
                class="!h-12 !rounded-2xl !px-8 text-[10px] font-black uppercase tracking-widest"
                :loading="salvando"
              >
                <i class="pi pi-save mr-2 text-[10px]"></i>
                Salvar
              </Button>
            </div>
          </footer>

        </form>
      </div>
    </Card>

    <!-- Modal Global -->
    <ArquivosModal
      v-if="modalArquivosOpen && ownerIdArquivos"
      :open="modalArquivosOpen"
      owner-type="FUNCIONARIO"
      :owner-id="ownerIdArquivos"
      categoria="ANEXO"
      @close="modalArquivosOpen = false"
    />
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

// ===== modal arquivos global =====
const modalArquivosOpen = ref(false)
const ownerIdArquivos = ref(null)

// ===== id / modo =====
const paramId = computed(() => String(route.params.id || 'novo'))
const isEditing = computed(() => paramId.value !== 'novo')
const id = computed(() => (isEditing.value ? paramId.value.replace(/\D/g, '') : null))

const fmtDate = (d) => (d ? String(d).split('T')[0] : '')

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

// ===== helpers money =====
function toMoneyNumber(v) {
  const digits = onlyNumbers(v)
  return digits ? Number(digits) / 100 : 0
}
function normalizarNumero(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

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

const calcularHorasDia = () => {
  const periodo1 = timeToDecimal(form.value.horario_saida_1) - timeToDecimal(form.value.horario_entrada_1)
  const periodo2 = timeToDecimal(form.value.horario_saida_2) - timeToDecimal(form.value.horario_entrada_2)
  return Math.max(0, periodo1) + Math.max(0, periodo2)
}

const calcularHorasSabado = () => {
  return timeToDecimal(form.value.horario_sabado_saida_1) - timeToDecimal(form.value.horario_sabado_entrada_1)
}

// ===== Carga Horária Calculada =====
const cargaHorariaSemanal = computed(() => {
  const horasDia = calcularHorasDia()
  const horasSabado = calcularHorasSabado()
  return (horasDia * 5) + (horasSabado > 0 ? horasSabado : 0)
})

const cargaHorariaMensal = computed(() => cargaHorariaSemanal.value * 4.5)

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

  form.value.custo_hora = total / horasMensais
}

const atualizarCargaHoraria = () => {
  recalcularCustoHora()
}

watch(
  () => [
    form.value.horario_entrada_1,
    form.value.horario_saida_1,
    form.value.horario_entrada_2,
    form.value.horario_saida_2,
    form.value.horario_sabado_entrada_1,
    form.value.horario_sabado_saida_1,
  ],
  () => recalcularCustoHora(),
  { immediate: true },
)

// ===== Tempo de Serviço =====
const tempoServico = computed(() => {
  if (!form.value.admissao) return '---'
  const inicio = new Date(form.value.admissao)
  const fim = form.value.demissao ? new Date(form.value.demissao) : new Date()
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return '---'

  let anos = fim.getFullYear() - inicio.getFullYear()
  let meses = fim.getMonth() - inicio.getMonth()
  if (meses < 0) { anos--; meses += 12 }

  return anos > 0 ? `${anos} anos e ${meses} meses` : `${meses} meses`
})

// ===== Unidade / Setor / Cargo =====
const unidadeKey = computed(() =>
  form.value.unidade === 'FABRICA' ? 'FÁBRICA' : form.value.unidade
)

const setorOptions = computed(() => {
  const grupos = FUNCIONARIOS_LOCAL_SETOR_CARGO?.[unidadeKey.value] || []
  return grupos.map(g => ({ label: String(g.setor).replaceAll('_', ' '), value: g.setor }))
})

const cargoOptions = computed(() => {
  const grupos = FUNCIONARIOS_LOCAL_SETOR_CARGO?.[unidadeKey.value] || []
  const grupo = grupos.find(g => g.setor === form.value.setor)
  return (grupo?.cargo || []).map(v => ({ label: String(v).replaceAll('_', ' '), value: v }))
})

watch(() => form.value.unidade, () => {
  form.value.setor = ''
  form.value.cargo = ''
})

watch(() => form.value.setor, () => {
  form.value.cargo = ''
})

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

// ===== salvar =====
function montarPayload() {
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

async function confirmarSalvarFuncionario() {
  const ok = await confirm.show(
    'Salvar Registro',
    `Deseja salvar o registro de "${form.value.nome}"?`,
  )
  if (!ok) return
  await salvar()
}

async function salvar() {
  if (!form.value.nome || String(form.value.cpf || '').length < 11) {
    alert('Preencha Nome e CPF corretamente.')
    return
  }

  if (!form.value.unidade || !form.value.setor || !form.value.cargo) {
    alert('Preencha Unidade, Setor e Cargo corretamente.')
    return
  }

  salvando.value = true
  try {
    recalcularCustoHora()
    const payload = montarPayload()

    const { data } = await FuncionarioService.salvar(isEditing.value ? id.value : null, payload)

    // se era novo: vira edição e fica na tela
    if (!isEditing.value) {
      const newId = data?.id
      if (newId) {
        await router.replace(`/funcionarios/${newId}`)
        await carregar()
        return
      }
    }

    router.push('/funcionarios')
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao salvar')
  } finally {
    salvando.value = false
  }
}

// ===== abrir modal arquivos (global) =====
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
  await carregar()
  return Number(newId)
}

async function abrirArquivosFuncionario() {
  const funcionarioId = await garantirIdParaUpload()
  ownerIdArquivos.value = funcionarioId
  modalArquivosOpen.value = true
}

// ===== Load =====
async function carregar() {
  if (!isEditing.value) {
    form.value = novoForm()
    ownerIdArquivos.value = null
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
  } catch {
    router.push('/funcionarios')
  } finally {
    loading.value = false
  }
}

onMounted(carregar)

// reage quando id muda
watch(
  () => String(route.params.id || 'novo'),
  (next, prev) => {
    if (next !== prev) carregar()
  },
)
</script>


