<template>
  <Card :shadow="true" class="overflow-visible">
    <PageHeader
      :title="isEditing ? `Editar Funcionário: ${form.nome}` : 'Novo Funcionário'"
      subtitle="Cadastros / Gestão de Pessoas"
      icon="pi pi-id-card"
      :backTo="'/funcionarios'"
      iconClass="bg-slate-900 text-white shadow-lg"
    />

    <div class="p-8 relative">
      <Loading v-if="loading" />

      <form v-else class="space-y-12" @submit.prevent="salvar">
        <!-- 01. Informações Pessoais -->
        <section class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full" />
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              01. Informações Pessoais
            </span>
          </div>

          <Input class="col-span-12 md:col-span-6" v-model="form.nome" label="Nome Completo *" required placeholder="NOME SEM ABREVIAÇÕES" />
          <Input class="col-span-12 md:col-span-3" v-model="cpfUi" label="CPF *" required placeholder="000.000.000-00" />
          <Input class="col-span-12 md:col-span-3" v-model="rgUi" label="RG" placeholder="00.000.000-0" />

          <Input class="col-span-12 md:col-span-4" v-model="emailUi" label="E-mail Pessoal" placeholder="exemplo@email.com" :forceUpper="false" />
          <Input class="col-span-12 md:col-span-4" v-model="whatsappUi" label="WhatsApp / Celular" placeholder="(00) 0 0000-0000" />
          <Input class="col-span-12 md:col-span-4" v-model="form.data_nascimento" label="Data de Nascimento" type="date" />

          <Input class="col-span-12 md:col-span-6" v-model="form.estado_civil" label="Estado Civil" />
          <Input class="col-span-12 md:col-span-6" v-model="form.escolaridade" label="Escolaridade" />
        </section>

        <div class="h-px bg-slate-100/50" />

        <!-- 02. Localização -->
        <section class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full" />
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              02. Localização
            </span>
          </div>

          <Input class="col-span-12 md:col-span-3" v-model="cepUi" label="CEP" placeholder="00000-000" @blur="tratarBuscaCep" />
          <Input class="col-span-12 md:col-span-7" v-model="form.endereco" label="Rua / Logradouro" />
          <Input class="col-span-12 md:col-span-2" v-model="form.numero" label="Nº" />

          <Input class="col-span-12 md:col-span-4" v-model="form.complemento" label="Complemento" />
          <Input class="col-span-12 md:col-span-4" v-model="form.bairro" label="Bairro" />
          <Input class="col-span-12 md:col-span-4" v-model="form.cidade" label="Cidade" />
        </section>

        <div class="h-px bg-slate-100/50" />

        <!-- 03. Contrato e Jornada -->
        <section class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full" />
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              03. Contrato e Jornada
            </span>
          </div>

          <!-- Unidade / Setor / Função -->
          <div class="col-span-12 md:col-span-4">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">
              Unidade *
            </label>
            <select
              v-model="form.unidade"
              class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 outline-none text-sm shadow-sm"
              required
            >
              <option value="">SELECIONE...</option>
              <option value="FABRICA">FÁBRICA</option>
              <option value="LOJA">LOJA</option>
            </select>
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">
              Setor *
            </label>
            <select
              v-model="form.setor"
              class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 outline-none text-sm shadow-sm"
              :disabled="!form.unidade"
              required
            >
              <option value="">SELECIONE...</option>
              <option v-for="o in setorOptions" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">
              Função *
            </label>
            <select
              v-model="form.funcao"
              class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 outline-none text-sm shadow-sm"
              :disabled="!form.unidade || !form.setor"
              required
            >
              <option value="">SELECIONE...</option>
              <option v-for="o in funcaoOptions" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
          </div>

          <!-- Registro e Datas -->
          <div class="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input class="col-span-1" v-model="form.registro" label="Nº Registro" />
            <Input class="col-span-1" v-model="form.admissao" label="Data de Admissão" type="date" required />
            <Input class="col-span-1" v-model="form.demissao" label="Data de Demissão" type="date" />
            
            <div class="col-span-1">
              <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">
                Tempo de Casa
              </label>
              <div class="h-12 flex items-center px-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 font-bold text-sm italic">
                {{ tempoServico }}
              </div>
            </div>
          </div>

          <!-- CARGA HORÁRIA CALCULADA AUTOMATICAMENTE -->
          <div class="col-span-12 bg-gradient-to-r from-slate-50 to-blue-50/30 p-6 rounded-[2rem] border border-slate-200">
            <div class="flex items-center justify-between mb-6">
              <div>
                <div class="text-sm font-black text-slate-700 mb-1">Carga Horária Calculada</div>
                <div class="text-xs text-slate-500">Valores atualizados automaticamente conforme os horários</div>
              </div>
              <div class="flex gap-3">
                <div class="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                  <div class="text-[10px] font-black text-blue-600 uppercase mb-1">SEMANAL</div>
                  <div class="text-lg font-black text-slate-800">{{ Number(cargaHorariaSemanal).toFixed(1) }}h</div>
                </div>
                <div class="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                  <div class="text-[10px] font-black text-emerald-600 uppercase mb-1">MENSAL</div>
                  <div class="text-lg font-black text-slate-800">{{ Number(cargaHorariaMensal).toFixed(1) }}h</div>
                </div>
              </div>
            </div>

            <!-- Horários de Segunda a Sexta -->
            <div class="mb-6">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span class="text-xs font-black uppercase text-slate-500">SEGUNDA A SEXTA</span>
                <span class="text-xs text-slate-400 ml-auto">{{ Number(calcularHorasDia()).toFixed(1) }}h/dia</span>
              </div>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input 
                  v-model="form.horario_entrada_1" 
                  label="Entrada 1" 
                  type="time" 
                  @update:modelValue="atualizarCargaHoraria"
                />
                <Input 
                  v-model="form.horario_saida_1" 
                  label="Saída 1" 
                  type="time" 
                  @update:modelValue="atualizarCargaHoraria"
                />
                <Input 
                  v-model="form.horario_entrada_2" 
                  label="Entrada 2" 
                  type="time" 
                  @update:modelValue="atualizarCargaHoraria"
                />
                <Input 
                  v-model="form.horario_saida_2" 
                  label="Saída 2" 
                  type="time" 
                  @update:modelValue="atualizarCargaHoraria"
                />
              </div>
            </div>

            <!-- Horário de Sábado -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span class="text-xs font-black uppercase text-slate-500">SÁBADO</span>
                <span class="text-xs text-slate-400 ml-auto">{{ Number(calcularHorasSabado()).toFixed(1) }}h</span>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <Input 
                  v-model="form.horario_sabado_entrada_1" 
                  label="Sábado - Entrada" 
                  type="time" 
                  @update:modelValue="atualizarCargaHoraria"
                />
                <Input 
                  v-model="form.horario_sabado_saida_1" 
                  label="Sábado - Saída" 
                  type="time" 
                  @update:modelValue="atualizarCargaHoraria"
                />
              </div>
            </div>
          </div>

          <!-- Resumo da Jornada -->
          <div class="col-span-12 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center">
                <div class="text-[10px] font-black uppercase text-slate-500 mb-1">HORAS/DIA</div>
                <div class="text-xl font-black text-slate-800">{{ Number(horasDiariasMedias).toFixed(1) }}h</div>
              </div>
              <div class="text-center">
                <div class="text-[10px] font-black uppercase text-slate-500 mb-1">DIAS/SEMANA</div>
                <div class="text-xl font-black text-slate-800">{{ form.horario_sabado_entrada_1 ? '6' : '5' }}</div>
              </div>
              <div class="text-center">
                <div class="text-[10px] font-black uppercase text-slate-500 mb-1">HORAS/SEMANA</div>
                <div class="text-xl font-black text-slate-800">{{ Number(cargaHorariaSemanal).toFixed(1) }}h</div>
              </div>
              <div class="text-center">
                <div class="text-[10px] font-black uppercase text-slate-500 mb-1">SEMANAS/MÊS</div>
                <div class="text-xl font-black text-slate-800">4.5</div>
              </div>
            </div>
          </div>
        </section>

        <div class="h-px bg-slate-100/50" />

        <!-- 04. Financeiro e Pagamento -->
        <section class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full" />
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              04. Financeiro e Pagamento
            </span>
          </div>

          <!-- Salários -->
<div class="col-span-12 md:col-span-6 grid grid-cols-2 gap-4">
  <div>
    <Input
      type="text"
      inputmode="numeric"
      :modelValue="salarioBaseInput"
      @update:modelValue="updateSalarioBase"
      label="Salário Base (R$)"
      :forceUpper="false"
      placeholder="0,00"
    />
    <div class="text-xs text-slate-400 mt-1">Remuneração mensal fixa</div>
  </div>

  <div>
    <Input
      type="text"
      inputmode="numeric"
      :modelValue="salarioAdicionalInput"
      @update:modelValue="updateSalarioAdicional"
      label="Adicional / Gratificação"
      :forceUpper="false"
      placeholder="0,00"
    />
    <div class="text-xs text-slate-400 mt-1">Bonificações extras</div>
  </div>
</div>


          <!-- Cálculos Automáticos -->
          <div class="col-span-12 md:col-span-6 grid grid-cols-2 gap-4">
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">
                Dia Pagamento
              </label>
              <select v-model="form.dia_pagamento" 
                class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 outline-none text-sm">
                <option :value="5">DIA 05</option>
                <option :value="10">DIA 10</option>
                <option :value="15">DIA 15</option>
                <option :value="20">DIA 20</option>
              </select>
            </div>
            
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">
                Custo Hora (DSR)
              </label>
              <div class="h-12 flex items-center justify-between px-4 rounded-2xl bg-slate-100 border border-slate-200">
                <span class="text-slate-900 font-black text-sm">
                  {{ custoHoraExibicao }}
                </span>
                <button 
                  type="button"
                  @click="recalcularCustoHora"
                  class="text-xs font-black text-blue-600 hover:text-blue-800"
                  title="Recalcular"
                >
                  <i class="pi pi-refresh"></i>
                </button>
              </div>
              <div class="text-xs text-slate-400 mt-1">Baseado na carga horária</div>
            </div>
          </div>

          <!-- Forma de Pagamento -->
          <div class="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">
                Forma de Pagamento
              </label>
              <select v-model="form.forma_pagamento" 
                class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 outline-none text-sm">
                <option value="DINHEIRO">DINHEIRO</option>
                <option value="PIX">PIX</option>
                <option value="TRANSFERENCIA">TRANSFERÊNCIA</option>
                <option value="DEPOSITO">DEPÓSITO</option>
              </select>
            </div>
            
            <Input class="col-span-2" v-model="form.banco" label="Banco" placeholder="EX: ITAÚ, NUBANK, CAIXA..." />
          </div>

          <!-- Dados Bancários (condicional) -->
          <div v-if="form.forma_pagamento !== 'DINHEIRO'" class="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input v-model="form.agencia" label="Agência" />
            <Input v-model="form.conta" label="Conta" />
            <Input v-model="form.pix_tipo_chave" label="Tipo Chave" placeholder="CPF, EMAIL, CELULAR..." />
          </div>
          
          <!-- Chave PIX (condicional) -->
          <div v-if="form.forma_pagamento === 'PIX'" class="col-span-12">
            <Input v-model="form.pix_chave" label="Chave PIX" />
          </div>
        </section>

        <div class="h-px bg-slate-100/50" />

        <!-- 05. Benefícios Adicionais -->
        <section class="grid grid-cols-12 gap-x-6 gap-y-8 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100/50">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full" />
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              05. Benefícios Adicionais
            </span>
          </div>

          <!-- Checkboxes -->
          <div class="col-span-12 md:col-span-4 space-y-4 pt-2">
            <CustomCheckbox v-model="form.tem_vale" label="Habilitar Vale Antecipação" />
            <CustomCheckbox v-model="form.tem_vale_transporte" label="Habilitar Vale Transporte" />
          </div>

          <!-- Campos condicionais -->
          <div class="col-span-12 md:col-span-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-if="form.tem_vale" class="animate-in fade-in slide-in-from-top-2">
  <Input
    type="text"
    inputmode="numeric"
    :modelValue="valeInput"
    @update:modelValue="updateVale"
    label="Valor do Vale (R$)"
    :forceUpper="false"
    placeholder="0,00"
  />
</div>

<div v-if="form.tem_vale_transporte" class="animate-in fade-in slide-in-from-top-2">
  <Input
    type="text"
    inputmode="numeric"
    :modelValue="valeTransporteInput"
    @update:modelValue="updateValeTransporte"
    label="Valor VT (R$)"
    :forceUpper="false"
    placeholder="0,00"
  />
</div>

            </div>
          </div>
        </section>

<!-- 06. Arquivos -->
<section class="grid grid-cols-12 gap-x-6 gap-y-6">
  <div class="col-span-12 flex items-center gap-3 mb-2">
    <div class="w-1.5 h-4 bg-slate-900 rounded-full" />
    <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
      06. Arquivos e Documentos
    </span>
  </div>

  <!-- Seletor bonito -->
  <div class="col-span-12 md:col-span-8">
    <!-- input escondido -->
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      @change="onFileChange"
    />

    <div class="flex items-center gap-3">
      <Button
        variant="secondary"
        type="button"
        class="!rounded-2xl h-12 !px-6"
        @click="abrirSeletorArquivo"
      >
        <i class="pi pi-upload mr-2" /> Escolher arquivo
      </Button>

      <div class="h-12 flex-1 flex items-center px-4 rounded-2xl bg-white border border-slate-200 text-sm">
        <span class="font-bold text-slate-700 truncate">
          {{ arquivoSelecionado?.name || 'Nenhum arquivo selecionado' }}
        </span>
      </div>
    </div>
  </div>

  <!-- Botão anexar -->
  <div class="col-span-12 md:col-span-4 flex items-end">
    <Button
      variant="primary"
      type="button"
      class="w-full !rounded-2xl h-12"
      :loading="enviandoArquivo"
      :disabled="!arquivoSelecionado || enviandoArquivo || salvando || loading"
      @click="enviarArquivo"
    >
      Anexar Documento
    </Button>
  </div>

  <!-- Lista -->
  <div class="col-span-12 space-y-2">
    <div
      v-for="a in arquivos"
      :key="a.id"
      class="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
    >
      <div class="min-w-0">
        <div class="font-black text-slate-700 text-sm truncate">{{ a.nome }}</div>
        <div class="text-xs font-bold text-slate-400 uppercase tracking-tighter">{{ a.mime }}</div>
      </div>

      <div class="flex gap-2">
        <a
          :href="a.url"
          target="_blank"
          class="h-9 px-4 flex items-center rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase"
        >
          Abrir
        </a>
        <Button variant="danger" size="sm" class="!rounded-xl h-9" type="button" @click="removerArquivo(a.id)">
          Excluir
        </Button>
      </div>
    </div>
  </div>
</section>

        <div class="h-px bg-slate-100/50" />

        <!-- Footer -->
        <div class="flex items-center justify-between gap-3 pt-8 border-t border-slate-100">
          <Button variant="secondary" type="button" class="!rounded-2xl !px-8" @click="router.push('/funcionarios')">
            Cancelar
          </Button>

          <Button variant="primary" type="submit" class="!rounded-2xl !px-12 h-14 shadow-xl shadow-brand-primary/20" :loading="salvando">
            <i class="pi pi-save mr-2" /> Salvar Registro
          </Button>
        </div>
      </form>
    </div>
  </Card>
</template>


<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { FuncionarioService } from '@/services/index'

import { maskCPF, maskRG, maskTelefone, maskCEP, onlyNumbers, maskMoneyBR } from '@/utils/masks'
import { buscarCep, calcularCustoHora } from '@/utils/utils'
import { moedaParaNumero, numeroParaMoeda } from '@/utils/number'
import { upper, raw } from '@/utils/text'

import { FUNCIONARIOS_LOCAL_SETOR_FUNCAO } from '@/constantes'

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
    funcao: '',

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

  if (total <= 0) {
    form.value.custo_hora = 0
    return
  }

  // Usa a função do utils que já calcula corretamente
  form.value.custo_hora = calcularCustoHora(total, cargaHorariaSemanal.value, 4.5)
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

async function garantirIdParaUpload() {
  if (isEditing.value && id.value) return Number(id.value)

  if (!form.value.nome || String(form.value.cpf || '').length < 11) {
    alert('Preencha Nome e CPF corretamente antes de anexar.')
    throw new Error('Sem nome/cpf')
  }
  if (!form.value.unidade || !form.value.setor || !form.value.funcao) {
    alert('Preencha Unidade, Setor e Função antes de anexar.')
    throw new Error('Sem unidade/setor/funcao')
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

// ===== Unidade / Setor / Função =====
const setorOptions = computed(() => {
  const grupos = FUNCIONARIOS_LOCAL_SETOR_FUNCAO?.[form.value.unidade] || []
  return grupos.map((g) => ({
    label: String(g.setor || '').replaceAll('_', ' '),
    value: g.setor,
  }))
})

const funcaoOptions = computed(() => {
  const grupos = FUNCIONARIOS_LOCAL_SETOR_FUNCAO?.[form.value.unidade] || []
  const grupo = grupos.find((g) => g.setor === form.value.setor)
  const funcoes = grupo?.funcoes || []
  return funcoes.map((v) => ({
    label: String(v || '').replaceAll('_', ' '),
    value: v,
  }))
})

watch(
  () => form.value.unidade,
  () => {
    form.value.setor = ''
    form.value.funcao = ''
  },
)

watch(
  () => form.value.setor,
  () => {
    form.value.funcao = ''
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


async function removerArquivo(fileId) {
  if (!confirm('Deseja excluir este arquivo?')) return
  try {
    await FuncionarioService.removerArquivo(fileId)
    await carregarArquivos()
  } catch {
    alert('Erro ao remover')
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

  if (!form.value.unidade || !form.value.setor || !form.value.funcao) {
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

