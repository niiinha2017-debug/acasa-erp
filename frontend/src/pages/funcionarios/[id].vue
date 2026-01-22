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
        <!-- 01 -->
        <div class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
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
        </div>

        <div class="h-px bg-slate-100/50"></div>

        <!-- 02 -->
        <div class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
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
        </div>

        <div class="h-px bg-slate-100/50"></div>

        <!-- 03 -->
        <div class="grid grid-cols-12 gap-x-6 gap-y-8">
          <!-- HEADER DO 03 COM A CARGA NA MESMA LINHA -->
          <div class="col-span-12 flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
              <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                03. Contrato e Jornada
              </span>
            </div>

            <!-- CARGA AQUI (junto das horas) -->
            <div class="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-2">
              <span class="text-[9px] font-black text-emerald-600 uppercase">
                Carga: {{ cargaHorariaSemanal.toFixed(1) }}h/sem
              </span>
            </div>
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Unidade</label>
            <select v-model="form.unidade" class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 outline-none text-sm shadow-sm">
              <option value="">SELECIONE...</option>
              <option value="FABRICA">FÁBRICA</option>
              <option value="LOJA">LOJA</option>
            </select>
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Setor</label>
            <select
              v-model="form.setor"
              class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 outline-none text-sm shadow-sm"
              :disabled="!form.unidade"
            >
              <option value="">SELECIONE...</option>
              <option v-for="o in setorOptions" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Função</label>
            <select
              v-model="form.funcao"
              class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 outline-none text-sm shadow-sm"
              :disabled="!form.unidade || !form.setor"
            >
              <option value="">SELECIONE...</option>
              <option v-for="o in funcaoOptions" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
          </div>

          <Input class="col-span-12 md:col-span-4" v-model="form.registro" label="Nº Registro" />
          <Input class="col-span-12 md:col-span-4" v-model="form.admissao" label="Data de Admissão" type="date" />
          <Input class="col-span-12 md:col-span-4" v-model="form.demissao" label="Data de Demissão" type="date" />

          <div class="col-span-12 md:col-span-4">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Tempo de Casa</label>
            <div class="h-12 flex items-center px-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 font-bold text-sm italic">
              {{ tempoServico }}
            </div>
          </div>

          <!-- HORÁRIOS -->
          <div class="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50">
            <Input v-model="form.horario_entrada_1" label="Entrada 1" type="time" />
            <Input v-model="form.horario_saida_1" label="Saída 1" type="time" />
            <Input v-model="form.horario_entrada_2" label="Entrada 2" type="time" />
            <Input v-model="form.horario_saida_2" label="Saída 2" type="time" />
          </div>

          <div class="col-span-12 grid grid-cols-2 gap-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50">
            <Input v-model="form.horario_sabado_entrada_1" label="Sábado - Entrada" type="time" />
            <Input v-model="form.horario_sabado_saida_1" label="Sábado - Saída" type="time" />
          </div>
        </div>

        <div class="h-px bg-slate-100/50"></div>

        <!-- 04 -->
        <div class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              04. Financeiro e Pagamento
            </span>
          </div>

          <Input class="col-span-12 md:col-span-3" v-model="salarioBaseUi" label="Salário Base (R$)" :forceUpper="false" />
          <Input class="col-span-12 md:col-span-3" v-model="salarioAdicionalUi" label="Adicional / Gratificação" :forceUpper="false" />

          <div class="col-span-12 md:col-span-3">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Dia Pagto</label>
            <select v-model="form.dia_pagamento" class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 outline-none text-sm">
              <option :value="5">DIA 05</option>
              <option :value="10">DIA 10</option>
            </select>
          </div>

          <div class="col-span-12 md:col-span-3">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Custo Hora (DSR)</label>
            <div class="h-12 flex items-center px-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 font-black text-sm">
              {{ custoHoraExibicao }}
            </div>
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Forma de Pagamento</label>
            <select v-model="form.forma_pagamento" class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 outline-none text-sm">
              <option value="DINHEIRO">DINHEIRO</option>
              <option value="PIX">PIX</option>
              <option value="TRANSFERENCIA">TRANSFERÊNCIA</option>
            </select>
          </div>

          <Input class="col-span-12 md:col-span-8" v-model="form.banco" label="Banco" placeholder="EX: ITAÚ, NUBANK..." />
          <Input class="col-span-12 md:col-span-3" v-model="form.agencia" label="Agência" />
          <Input class="col-span-12 md:col-span-3" v-model="form.conta" label="Conta" />
          <Input class="col-span-12 md:col-span-3" v-model="form.pix_tipo_chave" label="Tipo PIX" />
          <Input class="col-span-12 md:col-span-3" v-model="form.pix_chave" label="Chave PIX" />
        </div>

        <div class="h-px bg-slate-100/50"></div>

        <!-- 05 -->
        <div class="grid grid-cols-12 gap-x-6 gap-y-8 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100/50">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              05. Benefícios Adicionais
            </span>
          </div>

          <div class="col-span-12 md:col-span-4 space-y-4 pt-2">
            <CustomCheckbox v-model="form.tem_vale" label="Habilitar Vale Antecipação" />
            <CustomCheckbox v-model="form.tem_vale_transporte" label="Habilitar Vale Transporte" />
          </div>

          <div class="col-span-12 md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div v-if="form.tem_vale" class="animate-in fade-in slide-in-from-top-2">
              <Input v-model="valeUi" label="Valor do Vale (R$)" :forceUpper="false" />
            </div>
            <div v-if="form.tem_vale_transporte" class="animate-in fade-in slide-in-from-top-2">
              <Input v-model="valeTransporteUi" label="Valor VT (R$)" :forceUpper="false" />
            </div>
          </div>
        </div>

        <!-- 06 -->
        <div class="grid grid-cols-12 gap-x-6 gap-y-6">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              06. Arquivos e Documentos
            </span>
          </div>

          <div class="col-span-12 md:col-span-8">
            <input
              type="file"
              class="w-full h-12 px-4 py-2 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 text-sm"
              @change="(e) => (arquivoSelecionado.value = e.target.files?.[0] || null)"
              :disabled="!isEditing"
            />
          </div>

          <div class="col-span-12 md:col-span-4 flex items-end">
            <Button
              variant="primary"
              type="button"
              class="w-full !rounded-2xl h-12"
              :loading="enviandoArquivo"
              :disabled="!isEditing || !arquivoSelecionado"
              @click="enviarArquivo"
            >
              Anexar Documento
            </Button>
          </div>

          <div class="col-span-12 space-y-2">
            <div v-for="a in arquivos" :key="a.id" class="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div class="min-w-0">
                <div class="font-black text-slate-700 text-sm truncate">{{ a.nome }}</div>
                <div class="text-xs font-bold text-slate-400 uppercase tracking-tighter">{{ a.mime }}</div>
              </div>
              <div class="flex gap-2">
                <a :href="a.url" target="_blank" class="h-9 px-4 flex items-center rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase">Abrir</a>
                <Button variant="danger" size="sm" class="!rounded-xl h-9" @click="removerArquivo(a.id)">Excluir</Button>
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="flex items-center justify-between gap-3 pt-8 border-t border-slate-100">
          <Button variant="secondary" @click="router.push('/funcionarios')" class="!rounded-2xl !px-8">Cancelar</Button>
          <Button variant="primary" :loading="salvando" @click="salvar" class="!rounded-2xl !px-12 h-14 shadow-xl shadow-brand-primary/20">
            <i class="pi pi-save mr-2"></i> Salvar Registro
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

import { maskCPF, maskRG, maskTelefone, maskCEP, onlyNumbers } from '@/utils/masks'
import { buscarCep } from '@/utils/utils'
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

// ===== Tempo (HH:mm -> Decimal) =====
const timeToDecimal = (t) => {
  if (!t || !String(t).includes(':')) return 0
  const [h, m] = String(t).split(':').map((n) => Number(n))
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return h + m / 60
}

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

// ===== Moedas (NÚMERO no estado, TEXTO no input) =====
// -> isso aqui é o que evita o bug do "1,005000" / múltiplos zeros
const createMoneyComputed = (key) =>
  computed({
    get: () => numeroParaMoeda(Number(form.value[key] || 0)),
    set: (v) => {
      form.value[key] = moedaParaNumero(v)
    },
  })

const salarioBaseUi = createMoneyComputed('salario_base')
const salarioAdicionalUi = createMoneyComputed('salario_adicional')
const valeUi = createMoneyComputed('vale')
const valeTransporteUi = createMoneyComputed('vale_transporte')

const custoHoraExibicao = computed(() => numeroParaMoeda(Number(form.value.custo_hora || 0)))

// ===== Carga Horária Semanal =====
const cargaHorariaSemanal = computed(() => {
  const h1 =
    timeToDecimal(form.value.horario_saida_1) - timeToDecimal(form.value.horario_entrada_1)
  const h2 =
    timeToDecimal(form.value.horario_saida_2) - timeToDecimal(form.value.horario_entrada_2)

  const totalDia = (h1 > 0 ? h1 : 0) + (h2 > 0 ? h2 : 0)

  const sab =
    timeToDecimal(form.value.horario_sabado_saida_1) -
    timeToDecimal(form.value.horario_sabado_entrada_1)

  const totalSemana = totalDia * 5 + (sab > 0 ? sab : 0)
  return totalSemana > 0 ? totalSemana : 44
})

// ===== Custo Hora =====
function recalcularCustoHora() {
  const base = Number(form.value.salario_base || 0)
  const adicional = Number(form.value.salario_adicional || 0)
  const total = base + adicional

  if (total <= 0) {
    form.value.custo_hora = 0
    return
  }

  const horasMes = Number(cargaHorariaSemanal.value || 0) * 4.5
  if (!horasMes || horasMes <= 0) {
    form.value.custo_hora = 0
    return
  }

  // 2 casas, sem explosão de float
  form.value.custo_hora = Math.round((total / horasMes) * 100) / 100
}

// recalcula quando salário ou horários mudarem
watch(
  () => [form.value.salario_base, form.value.salario_adicional, cargaHorariaSemanal.value],
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
  if (!arquivoSelecionado.value || !id.value) return
  enviandoArquivo.value = true
  try {
    await FuncionarioService.uploadArquivo(id.value, arquivoSelecionado.value)
    arquivoSelecionado.value = null
    await carregarArquivos()
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro no upload')
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

  salvando.value = true
  try {
    recalcularCustoHora()
    const payload = montarPayload()
    await FuncionarioService.salvar(isEditing.value ? id.value : null, payload)
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

