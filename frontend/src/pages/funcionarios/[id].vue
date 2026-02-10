<template>
  <div class="w-full min-h-screen pb-0 space-y-4 animate-page-in">

    <div class="w-full bg-white">
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
  <Input
    class="col-span-12 md:col-span-8"
    v-model="form.nome"
    label="Nome Completo *"
    placeholder="Ex: JOÃO DA SILVA"
    required
  />

  <Input
    class="col-span-12 md:col-span-4"
    v-model="cpfUi"
    label="CPF *"
    placeholder="000.000.000-00"
    required
  />

  <Input
    class="col-span-12 md:col-span-4"
    v-model="rgUi"
    label="RG"
    placeholder="00.000.000-0"
  />

  <Input
    class="col-span-12 md:col-span-4"
    v-model="form.data_nascimento"
    label="Data Nascimento"
    type="date"
    placeholder="AAAA-MM-DD"
  />

  <Input
    class="col-span-12 md:col-span-4"
    v-model="telefoneUi"
    label="Telefone"
    placeholder="(00) 0000-0000"
  />

  <Input
    class="col-span-12 md:col-span-4"
    v-model="whatsappUi"
    label="WhatsApp"
    placeholder="(00) 00000-0000"
  />

  <Input
    class="col-span-12 md:col-span-4"
    v-model="emailUi"
    label="E-mail"
    placeholder="nome@dominio.com"
    :forceUpper="false"
  />

  <Input
    class="col-span-12 md:col-span-4"
    v-model="form.estado_civil"
    label="Estado Civil"
    placeholder="Ex: SOLTEIRO"
  />

  <Input
    class="col-span-12 md:col-span-6"
    v-model="form.contato_referencia_nome"
    label="Contato de Referência - Nome"
    placeholder="Ex: MARIA SILVA"
  />

  <Input
    class="col-span-12 md:col-span-6"
    v-model="contatoReferenciaTelefoneUi"
    label="Contato de Referência - Telefone"
    placeholder="(00) 0000-0000"
  />
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
  <Input
    class="col-span-12 md:col-span-3"
    v-model="cepUi"
    label="CEP"
    placeholder="00000-000"
    @blur="tratarBuscaCep"
  />

  <Input
    class="col-span-12 md:col-span-7"
    v-model="form.endereco"
    label="Logradouro"
    placeholder="Ex: RUA DAS FLORES"
  />

  <Input
    class="col-span-12 md:col-span-2"
    v-model="form.numero"
    label="Nº"
    placeholder="123"
  />

  <Input
    class="col-span-12 md:col-span-4"
    v-model="form.complemento"
    label="Complemento"
    placeholder="Ex: AP 12 / BLOCO B"
  />

  <Input
    class="col-span-12 md:col-span-4"
    v-model="form.bairro"
    label="Bairro"
    placeholder="Ex: CENTRO"
  />

  <Input
    class="col-span-12 md:col-span-4"
    v-model="form.cidade"
    label="Cidade"
    placeholder="Ex: SÃO PAULO"
  />
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
      class="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all uppercase"
    >
      <option value="">SELECIONE</option>
      <option v-for="opt in unidadeOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
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

  <Input class="col-span-12 md:col-span-4" v-model="form.data_inicio" label="Data de Inicio" type="date" />
  <Input class="col-span-12 md:col-span-4" v-model="form.admissao" label="Data de Admissao" type="date" />
  <Input class="col-span-12 md:col-span-4" v-model="form.demissao" label="Data de Demissao" type="date" />
</div>

<div class="h-px bg-slate-100"></div>

<!-- Financeiro -->
<section class="space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="text-[11px] font-black uppercase tracking-widest text-slate-500">
      Financeiro
    </h2>
    <span class="text-[10px] font-black uppercase tracking-widest text-slate-300">
      Secao 04
    </span>
  </div>

  <div class="grid grid-cols-12 gap-4">
    <Input
      class="col-span-12 md:col-span-3"
      :modelValue="salarioBaseInput"
      @update:modelValue="updateSalarioBase"
      label="Salario Base (R$)"
      placeholder="0,00"
    />

    <Input
      class="col-span-12 md:col-span-3"
      :modelValue="salarioAdicionalInput"
      @update:modelValue="updateSalarioAdicional"
      label="Gratificacao (%)"
      placeholder="0"
      type="number"
    />

    <div class="col-span-12 md:col-span-3">
      <div class="w-full bg-slate-50/60 p-3 rounded-2xl border border-slate-100/60">
        <CustomCheckbox
          label="Vale"
          :model-value="form.tem_vale"
          @update:model-value="(val) => { form.tem_vale = !!val; if (!val) updateVale('0') }"
        />
      </div>
    </div>

    <div class="col-span-12 md:col-span-3">
      <div class="w-full bg-slate-50/60 p-3 rounded-2xl border border-slate-100/60">
        <CustomCheckbox
          label="Vale Transporte"
          :model-value="form.tem_vale_transporte"
          @update:model-value="(val) => { form.tem_vale_transporte = !!val; if (!val) updateValeTransporte('0') }"
        />
      </div>
    </div>

    <Input
      v-if="form.tem_vale"
      class="col-span-12 md:col-span-3"
      :modelValue="valeInput"
      @update:modelValue="updateVale"
      label="Valor do Vale (R$)"
      placeholder="0,00"
    />

    <Input
      v-if="form.tem_vale_transporte"
      class="col-span-12 md:col-span-3"
      :modelValue="valeTransporteInput"
      @update:modelValue="updateValeTransporte"
      label="Valor do Vale Transporte (R$)"
      placeholder="0,00"
    />

  </div>
</section>

<div class="h-px bg-slate-100"></div>

<div class="grid grid-cols-12 gap-4">
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

<div class="h-px bg-slate-100"></div>
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

          <!-- Arquivos -->
<section class="space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="text-[11px] font-black uppercase tracking-widest text-slate-500">
      Documentos anexos
    </h2>

    <div class="flex items-center gap-2">
      <input ref="fileInput" type="file" class="hidden" @change="onPickArquivo" />

      <Button
        v-if="can(permSalvar()) && can('arquivos.criar')"
        variant="primary"
        type="button"
        class="!h-10 !rounded-xl !px-4 text-[10px] font-black uppercase tracking-widest"
        @click="clicarAdicionarArquivo"
      >
        <i class="pi pi-upload mr-2 text-[10px]"></i>
        Adicionar
      </Button>
    </div>
  </div>


  <div v-if="isEditing" class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
    <Table
      :columns="colArquivos"
      :rows="arquivos"
      :loading="loadingArquivos"
      empty-text="Nenhum arquivo anexado."
      :boxed="false"
    >
      <template #cell-nome="{ row }">
        <div class="flex flex-col">
          <span class="text-xs font-black text-slate-800">
            {{ row.nome || row.filename }}
          </span>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {{ row.mime_type || 'ARQUIVO' }}
          </span>
        </div>
      </template>

      <template #cell-acoes="{ row }">
        <div class="flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" @click="abrirArquivo(row)">
            Ver
          </Button>

          <Button
            v-if="can('arquivos.excluir')"
            variant="danger"
            size="sm"
            type="button"
            @click="excluirArquivo(row.id)"
          >
            Excluir
          </Button>
        </div>
      </template>
    </Table>
  </div>
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
  v-if="can(isEditing ? 'funcionarios.editar' : 'funcionarios.criar')"
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
    </div>

  </div>
</template>



<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { FuncionarioService } from '@/services/index'

import { maskCPF, maskRG, maskTelefone, maskCEP, onlyNumbers, maskMoneyBR } from '@/utils/masks'
import { buscarCep } from '@/utils/utils'
import { numeroParaMoeda } from '@/utils/number'
import { upper, raw } from '@/utils/text'
import { FUNCIONARIOS_LOCAL_SETOR_CARGO } from '@/constantes'
import { confirm } from '@/services/confirm'
import { notify } from '@/services/notify'
import { ArquivosService } from '@/services/arquivos.service'


import { can } from '@/services/permissions'

definePage({ meta: { perm: 'funcionarios.ver', fullWidth: true } })


const router = useRouter()
const route = useRoute()

const salvando = ref(false)
const loading = ref(false)

const arquivos = ref([])
const loadingArquivos = ref(false)
const fileInput = ref(null)
const syncingForm = ref(false)
const pendingFileOpen = ref(false)

const colArquivos = [
  { key: 'nome', label: 'ARQUIVO' },
  { key: 'acoes', label: '', align: 'right', width: '220px' },
]


// ===== id / modo =====
const paramId = computed(() => String(route.params.id || 'novo'))
const isEditing = computed(() => paramId.value !== 'novo')
const permSalvar = () => (isEditing.value ? 'funcionarios.editar' : 'funcionarios.criar')
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
    contato_referencia_nome: '',
    contato_referencia_telefone: '',

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

    data_inicio: '',
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
  salarioAdicionalInput.value = String(val ?? 0)
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
  const n = Number(String(v || '').replace(',', '.'))
  form.value.salario_adicional = Number.isFinite(n) ? n : 0
  salarioAdicionalInput.value = String(form.value.salario_adicional ?? 0)
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

const telefoneUi = computed({
  get: () => (form.value.telefone ? maskTelefone(form.value.telefone) : ''),
  set: (v) => (form.value.telefone = onlyNumbers(v)),
})

const contatoReferenciaTelefoneUi = computed({
  get: () =>
    (form.value.contato_referencia_telefone
      ? maskTelefone(form.value.contato_referencia_telefone)
      : ''),
  set: (v) =>
    (form.value.contato_referencia_telefone = onlyNumbers(v)),
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
  const total = base + (base * (Number(adicional || 0) / 100))
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
const unidadeOptions = computed(() => {
  const src = FUNCIONARIOS_LOCAL_SETOR_CARGO || {}
  return Object.keys(src).map((k) => ({ label: k, value: k }))
})


const setorOptions = computed(() => {
  const grupos = FUNCIONARIOS_LOCAL_SETOR_CARGO?.[form.value.unidade] || []
  return grupos.map(g => ({ label: String(g.setor).replaceAll('_', ' '), value: g.setor }))
})

const cargoOptions = computed(() => {
  const grupos = FUNCIONARIOS_LOCAL_SETOR_CARGO?.[form.value.unidade] || []
  const grupo = grupos.find(g => g.setor === form.value.setor)
  return (grupo?.cargo || []).map(v => ({ label: String(v).replaceAll('_', ' '), value: v }))
})

const normalizarUnidade = (u) => {
  const s = String(u || '').toUpperCase().trim()
  if (s === 'FABRICA') return 'FÁBRICA'
  return u
}


watch(
  () => form.value.unidade,
  (next, prev) => {
    if (syncingForm.value) return
    if (!prev) return // evita limpar no primeiro set
    if (next === prev) return
    form.value.setor = ''
    form.value.cargo = ''
  },
)

watch(
  () => form.value.setor,
  (next, prev) => {
    if (syncingForm.value) return
    if (!prev) return
    if (next === prev) return
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

async function carregarArquivos() {
  if (!isEditing.value || !id.value) {
    arquivos.value = []
    return
  }

  loadingArquivos.value = true
  try {
    const res = await ArquivosService.listar({
      ownerType: 'FUNCIONARIO',
      ownerId: Number(id.value),
      categoria: 'ANEXO',
    })
    const arr = res?.data?.data ?? res?.data ?? res
    arquivos.value = Array.isArray(arr) ? arr : []
  } finally {
    loadingArquivos.value = false
  }
}
function abrirArquivo(row) {
  const backTo = encodeURIComponent(`/funcionarios/${id.value}`)
  const name = encodeURIComponent(row?.nome || row?.filename || 'ARQUIVO')
  const type = encodeURIComponent(row?.mime_type || '')

  router.push(`/arquivos/${row.id}?name=${name}&type=${type}&backTo=${backTo}`)
}
async function excluirArquivo(arquivoId) {
  if (!can('arquivos.excluir')) return notify.error('Acesso negado.')

  const ok = await confirm.show('Excluir arquivo?', 'Esta ação não pode ser desfeita.')
  if (!ok) return

  try {
    await ArquivosService.remover(Number(arquivoId))
    notify.success('Arquivo removido.')
    await carregarArquivos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao excluir arquivo.')
  }
}
async function clicarAdicionarArquivo() {
  if (!can(permSalvar())) return notify.error('Acesso negado.')

  pendingFileOpen.value = true
  await garantirIdParaUpload()
  await nextTick()

  if (pendingFileOpen.value && fileInput.value) {
    fileInput.value.click()
    pendingFileOpen.value = false
  } else if (!fileInput.value) {
    return notify.error('Input de arquivo n??o montado.')
  }
}

async function onPickArquivo(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return

  if (!can('arquivos.criar')) return notify.error('Acesso negado.')

  // se por algum motivo não tiver id, garante novamente
  const funcionarioId = await garantirIdParaUpload()

  try {
    await ArquivosService.upload({
      ownerType: 'FUNCIONARIO',
      ownerId: Number(funcionarioId),
      categoria: 'ANEXO',
      file,
    })
    notify.success('Arquivo anexado.')
    await carregarArquivos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao anexar arquivo.')
  }
}

// ===== salvar =====
function montarPayload() {
  return {
    ...form.value,
    email: emailUi.value,

    // ✅ se backend usa funcao:
    funcao: form.value.cargo,

    salario_base: normalizarNumero(form.value.salario_base),
    salario_adicional: normalizarNumero(form.value.salario_adicional),
    custo_hora: normalizarNumero(form.value.custo_hora),

    vale: normalizarNumero(form.value.vale),
    vale_transporte: normalizarNumero(form.value.vale_transporte),

    dia_pagamento: form.value.dia_pagamento ? Number(form.value.dia_pagamento) : null,
  }
}




async function confirmarSalvarFuncionario() {
  if (!can(permSalvar())) return notify.error('Acesso negado.')

  const ok = await confirm.show(
    'Salvar Registro',
    `Deseja salvar o registro de "${form.value.nome}"?`,
  )
  if (!ok) return
  await salvar()
}


async function salvar() {
  if (!can(permSalvar())) return notify.error('Acesso negado.')

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
    const targetId = isEditing.value ? id.value : null

    await FuncionarioService.salvar(targetId, payload)

    router.push('/funcionarios') // ✅ SEMPRE VOLTA PRO INDEX
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao salvar')
  } finally {
    salvando.value = false
  }
}



// ===== abrir modal arquivos (global) =====
async function garantirIdParaUpload() {
  if (!can(permSalvar())) return notify.error('Acesso negado.')

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


async function carregar() {
  if (!isEditing.value) {
    form.value = novoForm()
    arquivos.value = [] // ✅ limpa anexos na tela de novo
    return
  }

  if (!id.value) {
    router.push('/funcionarios')
    return
  }

loading.value = true
try {
  const { data } = await FuncionarioService.buscar(id.value)

  syncingForm.value = true

  form.value = {
    ...novoForm(),
    ...data,
    unidade: normalizarUnidade(data.unidade),

    data_nascimento: fmtDate(data.data_nascimento),
    data_inicio: fmtDate(data.data_inicio),
    admissao: fmtDate(data.admissao),
    demissao: fmtDate(data.demissao),

    salario_base: normalizarNumero(data.salario_base),
    salario_adicional: normalizarNumero(data.salario_adicional),
    custo_hora: normalizarNumero(data.custo_hora),

    vale: normalizarNumero(data.vale),
    vale_transporte: normalizarNumero(data.vale_transporte),

    dia_pagamento: Number(data.dia_pagamento ?? 5),
  }

  await nextTick()
} catch {
  router.push('/funcionarios')
} finally {
  syncingForm.value = false
  loading.value = false
}
}

onMounted(async () => {
  const perm = isEditing.value ? 'funcionarios.editar' : 'funcionarios.criar'
  if (!can(perm)) {
    notify.error('Acesso negado.')
    router.push('/funcionarios')
    return
  }

  await carregar()
  await carregarArquivos()
})



watch(
  () => String(route.params.id || 'novo'),
  async (next, prev) => {
    if (next === prev) return

    const perm = next !== 'novo' ? 'funcionarios.editar' : 'funcionarios.criar'
    if (!can(perm)) {
      notify.error('Acesso negado.')
      router.push('/funcionarios')
      return
    }

    await carregar()
    await carregarArquivos()
  },
)
</script>


