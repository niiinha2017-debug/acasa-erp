<template>
  <div class="login-font w-full h-full mt-4 mb-8 mx-2 lg:mx-4 rounded-2xl border border-border-ui bg-bg-card overflow-hidden animate-page-in">
    <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>
    <PageHeader
      :title="isEdit ? `Editar Funcionário #${funcionarioId}` : 'Novo Funcionário'"
      subtitle="Gerenciamento de dados pessoais e contratuais"
      icon="pi pi-users"
      :showBack="false"
      class="border-b border-border-ui"
    />

    <div class="p-8 lg:p-12">
      <Loading v-if="loading" />

      <form v-else class="space-y-10 clientes-line-form" @submit.prevent="confirmarSalvar" autocomplete="off">
        
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Dados Pessoais
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input
            class="col-span-12 md:col-span-6"
            v-model="form.nome"
            label="Nome Completo"
            required
            placeholder="NOME DO FUNCIONÁRIO"
            force-upper
          />
          <Input
            class="col-span-12 md:col-span-3"
            v-model="cpfMask"
            label="CPF"
            required
            placeholder="000.000.000-00"
          />
          <Input
            class="col-span-12 md:col-span-3"
            v-model="form.rg"
            label="RG"
            placeholder="EX: 00.000.000-0"
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.data_nascimento"
            type="date"
            label="Data de Nascimento"
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="telefoneMask"
            label="Telefone/WhatsApp"
            placeholder="(00) 00000-0000"
          />
                    <Input
            class="col-span-12 md:col-span-4"
            v-model="form.email"
            label="E-mail"
            type="email"
            placeholder="exemplo@email.com"
            :force-upper="false"
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="whatsappMask"
            label="WhatsApp"
            placeholder="(00) 00000-0000"
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.estado_civil"
            label="Estado Civil"
            placeholder="EX: CASADO"
            force-upper
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.escolaridade"
            label="Escolaridade"
            placeholder="EX: ENSINO MÉDIO"
            force-upper
          />
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Endereço
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input
            class="col-span-12 md:col-span-3"
            v-model="cepMask"
            label="CEP"
            placeholder="00000-000"
            @blur="tratarBuscaCep"
          />
          <Input class="col-span-12 md:col-span-5" v-model="form.endereco" label="Endereço" placeholder="RUA, AVENIDA..." force-upper />
          <Input class="col-span-12 md:col-span-2" v-model="form.numero" label="Número" placeholder="123" force-upper />
          <Input class="col-span-12 md:col-span-2" v-model="form.complemento" label="Complemento" placeholder="APTO, CASA" force-upper />
          <Input class="col-span-12 md:col-span-4" v-model="form.bairro" label="Bairro" placeholder="EX: CENTRO" force-upper />
          <Input class="col-span-12 md:col-span-5" v-model="form.cidade" label="Cidade" placeholder="EX: CAMPINAS" force-upper />
          <Input class="col-span-12 md:col-span-3" v-model="form.estado" label="UF" placeholder="EX: SP" force-upper />
        </div>

        <div class="relative">

          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Contrato e Datas
            </span>
          </div>
        </div>

                <div class="grid grid-cols-12 gap-6">
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.data_inicio"
            type="date"
            label="Início das Atividades (Registro)"
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.admissao"
            type="date"
            label="Data de Admissão"
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.demissao"
            type="date"
            label="Data de Demissão"
          />
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Dados da Empresa
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Select
            class="col-span-12 md:col-span-3"
            v-model="form.unidade"
            label="Unidade"
            placeholder="Selecione"
            :options="unidadeOptions"
            required
            forceUpper
          />
          <Select
            class="col-span-12 md:col-span-3"
            v-model="form.setor"
            label="Setor"
            placeholder="Selecione"
            :options="setorOptions"
            :disabled="!form.unidade"
            required
            forceUpper
          />
          <Select
            class="col-span-12 md:col-span-3"
            v-model="form.cargo"
            label="Cargo"
            placeholder="Selecione"
            :options="cargoOptions"
            :disabled="!form.unidade || !form.setor"
            required
            forceUpper
          />
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Remuneração e Benefícios
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input class="col-span-12 md:col-span-4" v-model="salarioBaseMask" label="Salário Base" placeholder="0,00" />
          <Input class="col-span-12 md:col-span-4" v-model="salarioAdicionalMask" label="Complementos" placeholder="0,00" />

          <div class="col-span-12 md:col-span-6 space-y-4">
            <CustomCheckbox
              v-model="form.tem_vale"
              label="Recebe vale alimentação/refeição?"
              :description="form.tem_vale ? 'Informe o valor mensal' : 'Marcado automaticamente como NÃO'"
            />
            <Input
              v-if="form.tem_vale"
              v-model="valeMask"
              label="Valor do Vale"
              placeholder="0,00"
            />
          </div>

          <div class="col-span-12 md:col-span-6 space-y-4">
            <CustomCheckbox
              v-model="form.tem_vale_transporte"
              label="Recebe vale transporte?"
              :description="form.tem_vale_transporte ? 'Informe o valor mensal' : 'Marcado automaticamente como NÃO'"
            />
            <Input
              v-if="form.tem_vale_transporte"
              v-model="valeTransporteMask"
              label="Valor do Vale Transporte"
              placeholder="0,00"
            />
          </div>
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Horários e Carga Horária
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input class="col-span-12 md:col-span-3" v-model="horarioEntrada1Mask" label="Entrada 1" placeholder="08:00" />
          <Input class="col-span-12 md:col-span-3" v-model="horarioSaida1Mask" label="Saída 1" placeholder="12:00" />
          <Input class="col-span-12 md:col-span-3" v-model="horarioEntrada2Mask" label="Entrada 2" placeholder="13:00" />
          <Input class="col-span-12 md:col-span-3" v-model="horarioSaida2Mask" label="Saída 2" placeholder="17:00" />
          <Input class="col-span-12 md:col-span-3" v-model="horarioSabadoEntrada1Mask" label="Entrada (Sábado)" placeholder="08:00" />
          <Input class="col-span-12 md:col-span-3" v-model="horarioSabadoSaida1Mask" label="Saída (Sábado)" placeholder="12:00" />
          <Input class="col-span-12 md:col-span-3" v-model="form.carga_horaria_dia" label="Carga Diária (h)" type="number" step="0.01" />
          <Input class="col-span-12 md:col-span-3" v-model="form.carga_horaria_semana" label="Carga Semanal (h)" type="number" step="0.01" />
          <Input class="col-span-12 md:col-span-3" v-model="custoHoraMask" label="Custo Hora" placeholder="0,00" />
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Forma de Pagamento
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input class="col-span-12 md:col-span-4" v-model="form.forma_pagamento" label="Forma de Pagamento" placeholder="EX: PIX" force-upper />
          <Input class="col-span-12 md:col-span-4" v-model="form.dia_pagamento" label="Dia do Pagamento" type="number" min="1" max="31" />
          <Input class="col-span-12 md:col-span-4" v-model="form.banco" label="Banco" placeholder="EX: ITAÚ" force-upper />
          <Input class="col-span-12 md:col-span-4" v-model="form.agencia" label="Agência" force-upper />
          <Input class="col-span-12 md:col-span-4" v-model="form.conta" label="Conta" force-upper />
          <Input class="col-span-12 md:col-span-4" v-model="form.pix_tipo_chave" label="Tipo da Chave PIX" placeholder="EX: CPF" force-upper />
          <Input class="col-span-12 md:col-span-4" v-model="form.pix_chave" label="Chave PIX" />
        </div>

                <div class="pt-10 mt-6 border-t border-border-ui">

          <div class="flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
            <Button
              v-if="isEdit && can('funcionarios.excluir')"
              type="button"
              variant="danger"
              size="lg"
              :loading="deleting"
              class="!rounded-xl px-6"
              @click="confirmarExcluir"
            >
              <i class="pi pi-trash mr-2"></i>
              Excluir
            </Button>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="secondary"
                size="lg"
                type="button"
                class="!rounded-xl px-6"
                @click="voltarParaLista"
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                size="lg"
                type="submit"
                :loading="saving"
                class="!rounded-xl px-8 py-3 bg-gradient-to-r from-brand-primary to-brand-primary/90 hover:shadow-2xl hover:shadow-brand-primary/30 active:scale-[0.98] transition-all group relative overflow-hidden"
              >
                <span class="relative flex items-center justify-center gap-2 font-bold tracking-wide text-white">
                  <i class="pi pi-save group-hover:rotate-12 transition-transform"></i>
                  {{ isEdit ? 'Atualizar Funcionário' : 'Cadastrar Funcionário' }}
                </span>
              </Button>
            </div>
          </div>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FuncionariosService } from '@/services/index'


import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { maskCEP, maskCPF, maskTelefone, maskReais, maskHora } from '@/utils/masks'
import { moedaParaNumero, numeroParaMoeda } from '@/utils/number'
import { buscarCep, calcularCustoHora } from '@/utils/utils'
import { can } from '@/services/permissions'
import { FUNCIONARIOS_LOCAL_SETOR_CARGO } from '@/constantes/funcionarios'







const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isHydrating = ref(false)

const funcionarioId = computed(() => Number(route.params?.id))
const isEdit = computed(() => !!funcionarioId.value)

const form = ref({
  nome: '',
  cpf: '',
  rg: '',
  email: '',
  telefone: '',
  whatsapp: '',
  estado_civil: '',
  escolaridade: '',
  data_nascimento: '',
  data_inicio: '',
  admissao: '',
  demissao: '',
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
  salario_base: '',
  salario_adicional: '',
  custo_hora: '',
  tem_vale: false,
  vale: '',
  tem_vale_transporte: false,
  vale_transporte: '',
  forma_pagamento: '',
  dia_pagamento: '',
  banco: '',
  agencia: '',
  conta: '',
  pix_tipo_chave: '',
  pix_chave: '',
  horario_entrada_1: '',
  horario_saida_1: '',
  horario_entrada_2: '',
  horario_saida_2: '',
  horario_sabado_entrada_1: '',
  horario_sabado_saida_1: '',
  carga_horaria_dia: '',
  carga_horaria_semana: '',
})


// Máscaras reativas
const cpfMask = computed({
  get: () => form.value.cpf,
  set: (v) => { form.value.cpf = maskCPF(v) }
})

const telefoneMask = computed({
  get: () => form.value.telefone,
  set: (v) => { form.value.telefone = maskTelefone(v) }
})

const whatsappMask = computed({
  get: () => form.value.whatsapp,
  set: (v) => { form.value.whatsapp = maskTelefone(v) }
})

const cepMask = computed({
  get: () => form.value.cep,
  set: (v) => { form.value.cep = maskCEP(v) }
})

// Valor já formatado (com vírgula) não é re-interpretado — evita 2.000,00 virar 200.000,00
function aplicarMaskValor(v) {
  if (v === '' || v == null) return ''
  const s = String(v)
  if (s.includes(',')) return numeroParaMoeda(moedaParaNumero(s))
  return maskReais(s)
}

const salarioBaseMask = computed({
  get: () => form.value.salario_base,
  set: (v) => { form.value.salario_base = aplicarMaskValor(v) }
})
const salarioAdicionalMask = computed({
  get: () => form.value.salario_adicional,
  set: (v) => { form.value.salario_adicional = aplicarMaskValor(v) }
})
const custoHoraMask = computed({
  get: () => form.value.custo_hora,
  set: (v) => { form.value.custo_hora = aplicarMaskValor(v) }
})
const valeMask = computed({
  get: () => form.value.vale,
  set: (v) => { form.value.vale = aplicarMaskValor(v) }
})
const valeTransporteMask = computed({
  get: () => form.value.vale_transporte,
  set: (v) => { form.value.vale_transporte = aplicarMaskValor(v) }
})

const horarioEntrada1Mask = computed({
  get: () => form.value.horario_entrada_1,
  set: (v) => { form.value.horario_entrada_1 = maskHora(v) }
})
const horarioSaida1Mask = computed({
  get: () => form.value.horario_saida_1,
  set: (v) => { form.value.horario_saida_1 = maskHora(v) }
})
const horarioEntrada2Mask = computed({
  get: () => form.value.horario_entrada_2,
  set: (v) => { form.value.horario_entrada_2 = maskHora(v) }
})
const horarioSaida2Mask = computed({
  get: () => form.value.horario_saida_2,
  set: (v) => { form.value.horario_saida_2 = maskHora(v) }
})
const horarioSabadoEntrada1Mask = computed({
  get: () => form.value.horario_sabado_entrada_1,
  set: (v) => { form.value.horario_sabado_entrada_1 = maskHora(v) }
})
const horarioSabadoSaida1Mask = computed({
  get: () => form.value.horario_sabado_saida_1,
  set: (v) => { form.value.horario_sabado_saida_1 = maskHora(v) }
})

const toStringOrEmpty = (value) => (value === null || value === undefined ? '' : String(value))

const normalizeString = (value) => {
  if (value === null || value === undefined) return undefined
  const trimmed = String(value).trim()
  return trimmed ? trimmed : undefined
}

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isNaN(parsed) ? undefined : parsed
}

const normalizeInteger = (value) => {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = parseInt(String(value), 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

function normalizeKey(v) {
  return String(v || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
}

function mapByNormalized(list, value) {
  const target = normalizeKey(value)
  if (!target) return ''
  return list.find((item) => normalizeKey(item) === target) || ''
}

function humanizeConstKey(v) {
  const s = String(v || '').trim()
  if (!s) return ''
  return s.replace(/_/g, ' ')
}

const unidadeOptions = computed(() => {
  const obj = (FUNCIONARIOS_LOCAL_SETOR_CARGO && typeof FUNCIONARIOS_LOCAL_SETOR_CARGO === 'object')
    ? FUNCIONARIOS_LOCAL_SETOR_CARGO
    : {}
  return Object.keys(obj).map((k) => ({ label: humanizeConstKey(k), value: k }))
})

const setorOptions = computed(() => {
  const unidade = String(form.value.unidade || '').trim()
  if (!unidade) return []
  const setores = (FUNCIONARIOS_LOCAL_SETOR_CARGO?.[unidade] || [])
    .map((x) => x?.setor)
    .filter(Boolean)
  return setores.map((s) => ({ label: humanizeConstKey(s), value: s }))
})

const cargoOptions = computed(() => {
  const unidade = String(form.value.unidade || '').trim()
  const setor = String(form.value.setor || '').trim()
  if (!unidade || !setor) return []
  const rows = (FUNCIONARIOS_LOCAL_SETOR_CARGO?.[unidade] || []).filter((x) => x?.setor === setor)
  const cargos = rows.flatMap((x) => (Array.isArray(x?.cargo) ? x.cargo : [])).filter(Boolean)
  return cargos.map((c) => ({ label: humanizeConstKey(c), value: c }))
})

watch(() => form.value.tem_vale, (val) => {
  if (!val) form.value.vale = ''
})

watch(() => form.value.tem_vale_transporte, (val) => {
  if (!val) form.value.vale_transporte = ''
})

watch(() => form.value.unidade, () => {
  if (isHydrating.value) return
  form.value.setor = ''
  form.value.cargo = ''
})

watch(() => form.value.setor, () => {
  if (isHydrating.value) return
  form.value.cargo = ''
})

watch(
  () => [form.value.salario_base, form.value.carga_horaria_semana],
  () => {
    const salario = moedaParaNumero(form.value.salario_base)
    const horas = Number(String(form.value.carga_horaria_semana || '').replace(',', '.'))
    if (!salario || !horas) return
    form.value.custo_hora = numeroParaMoeda(calcularCustoHora(salario, horas))
  }
)

async function tratarBuscaCep() {
  if (!form.value.cep || String(form.value.cep).length < 9) return
  const data = await buscarCep(form.value.cep)
  if (!data) return

  form.value.endereco = data.logradouro || form.value.endereco
  form.value.bairro = data.bairro || form.value.bairro
  form.value.cidade = data.localidade || form.value.cidade
  form.value.estado = data.uf || form.value.estado
}


function voltarParaLista() {
  router.push('/funcionarios')
}

async function carregarDados() {
    if (!isEdit.value) return
  loading.value = true
  try {
    const res = await FuncionariosService.buscarPorId(funcionarioId.value)

    // Formata datas para o input type="date" (YYYY-MM-DD)
    const data = res?.data || res

    const unidades = Object.keys(FUNCIONARIOS_LOCAL_SETOR_CARGO || {})
    const unidadeNormalizada = mapByNormalized(unidades, data.unidade)
    const setoresDisponiveis = (FUNCIONARIOS_LOCAL_SETOR_CARGO?.[unidadeNormalizada] || [])
      .map((x) => x?.setor)
      .filter(Boolean)
    const setorNormalizado = mapByNormalized(setoresDisponiveis, data.setor)
    const cargosDisponiveis = (FUNCIONARIOS_LOCAL_SETOR_CARGO?.[unidadeNormalizada] || [])
      .filter((x) => x?.setor === setorNormalizado)
      .flatMap((x) => (Array.isArray(x?.cargo) ? x.cargo : []))
      .filter(Boolean)
    const cargoNormalizado = mapByNormalized(cargosDisponiveis, data.cargo)

    isHydrating.value = true
    form.value = {
      nome: data.nome ?? '',
      cpf: data.cpf ?? '',
      rg: data.rg ?? '',
      email: data.email ?? '',
      telefone: data.telefone ?? '',
      whatsapp: data.whatsapp ?? '',
      estado_civil: data.estado_civil ?? '',
      escolaridade: data.escolaridade ?? '',
      data_nascimento: data.data_nascimento?.split('T')[0] || '',
      data_inicio: data.data_inicio?.split('T')[0] || '',
      admissao: data.admissao?.split('T')[0] || '',
      demissao: data.demissao?.split('T')[0] || '',
      unidade: unidadeNormalizada || (data.unidade ?? ''),
      setor: setorNormalizado || (data.setor ?? ''),
      cargo: cargoNormalizado || (data.cargo ?? ''),
      cep: data.cep ?? '',
      endereco: data.endereco ?? '',
      numero: data.numero ?? '',
      complemento: data.complemento ?? '',
      bairro: data.bairro ?? '',
      cidade: data.cidade ?? '',
      estado: data.estado ?? '',
      salario_base: data.salario_base != null && data.salario_base !== '' ? numeroParaMoeda(data.salario_base) : '',
      salario_adicional: data.salario_adicional != null && data.salario_adicional !== '' ? numeroParaMoeda(data.salario_adicional) : '',
      custo_hora: data.custo_hora != null && data.custo_hora !== '' ? numeroParaMoeda(data.custo_hora) : '',
      tem_vale: !!data.tem_vale,
      vale: data.vale != null && data.vale !== '' ? numeroParaMoeda(data.vale) : '',
      tem_vale_transporte: !!data.tem_vale_transporte,
      vale_transporte: data.vale_transporte != null && data.vale_transporte !== '' ? numeroParaMoeda(data.vale_transporte) : '',
      forma_pagamento: data.forma_pagamento ?? '',
      dia_pagamento: toStringOrEmpty(data.dia_pagamento),
      banco: data.banco ?? '',
      agencia: data.agencia ?? '',
      conta: data.conta ?? '',
      pix_tipo_chave: data.pix_tipo_chave ?? '',
      pix_chave: data.pix_chave ?? '',
      horario_entrada_1: data.horario_entrada_1 ?? '',
      horario_saida_1: data.horario_saida_1 ?? '',
      horario_entrada_2: data.horario_entrada_2 ?? '',
      horario_saida_2: data.horario_saida_2 ?? '',
      horario_sabado_entrada_1: data.horario_sabado_entrada_1 ?? '',
      horario_sabado_saida_1: data.horario_sabado_saida_1 ?? '',
      carga_horaria_dia: toStringOrEmpty(data.carga_horaria_dia),
      carga_horaria_semana: toStringOrEmpty(data.carga_horaria_semana),
    }
    isHydrating.value = false

  } catch (e) {
    notify.error('Erro ao carregar funcionário.')
  } finally {
    loading.value = false
  }
}

async function confirmarSalvar() {
  const ok = await confirm.show(
    isEdit.value ? 'Atualizar' : 'Cadastrar',
    'Deseja salvar os dados do funcionário?'
  )
  if (!ok) return

    saving.value = true
    try {
    const payload = {

      nome: form.value.nome,
      cpf: form.value.cpf,
      rg: normalizeString(form.value.rg),
      email: normalizeString(form.value.email),
      telefone: normalizeString(form.value.telefone),
      whatsapp: normalizeString(form.value.whatsapp),
      estado_civil: normalizeString(form.value.estado_civil),
      escolaridade: normalizeString(form.value.escolaridade),
      data_nascimento: normalizeString(form.value.data_nascimento),
      data_inicio: normalizeString(form.value.data_inicio),
      admissao: normalizeString(form.value.admissao),
      demissao: normalizeString(form.value.demissao),
      unidade: normalizeString(form.value.unidade),
      setor: normalizeString(form.value.setor),
      cargo: normalizeString(form.value.cargo),
      cep: normalizeString(form.value.cep),
      endereco: normalizeString(form.value.endereco),
      numero: normalizeString(form.value.numero),
      complemento: normalizeString(form.value.complemento),
      bairro: normalizeString(form.value.bairro),
      cidade: normalizeString(form.value.cidade),
      estado: normalizeString(form.value.estado),
      forma_pagamento: normalizeString(form.value.forma_pagamento),
      banco: normalizeString(form.value.banco),
      agencia: normalizeString(form.value.agencia),
      conta: normalizeString(form.value.conta),
      pix_tipo_chave: normalizeString(form.value.pix_tipo_chave),
      pix_chave: normalizeString(form.value.pix_chave),
      horario_entrada_1: normalizeString(form.value.horario_entrada_1),
      horario_saida_1: normalizeString(form.value.horario_saida_1),
      horario_entrada_2: normalizeString(form.value.horario_entrada_2),
      horario_saida_2: normalizeString(form.value.horario_saida_2),
      horario_sabado_entrada_1: normalizeString(form.value.horario_sabado_entrada_1),
      horario_sabado_saida_1: normalizeString(form.value.horario_sabado_saida_1),
      tem_vale: !!form.value.tem_vale,
      tem_vale_transporte: !!form.value.tem_vale_transporte,
    }

    if (form.value.salario_base !== '') payload.salario_base = moedaParaNumero(form.value.salario_base)
    if (form.value.salario_adicional !== '') payload.salario_adicional = moedaParaNumero(form.value.salario_adicional)
    if (form.value.custo_hora !== '') payload.custo_hora = moedaParaNumero(form.value.custo_hora)
    if (form.value.tem_vale && form.value.vale !== '') payload.vale = moedaParaNumero(form.value.vale)
    if (form.value.tem_vale_transporte && form.value.vale_transporte !== '') payload.vale_transporte = moedaParaNumero(form.value.vale_transporte)

    const cargaDia = normalizeNumber(form.value.carga_horaria_dia)
    if (cargaDia !== undefined) payload.carga_horaria_dia = cargaDia

    const cargaSemana = normalizeNumber(form.value.carga_horaria_semana)
    if (cargaSemana !== undefined) payload.carga_horaria_semana = cargaSemana

    const diaPagamento = normalizeInteger(form.value.dia_pagamento)
    if (diaPagamento !== undefined) payload.dia_pagamento = diaPagamento

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key]
      }
    })

    if (isEdit.value) {
      await FuncionariosService.atualizar(funcionarioId.value, payload)
    } else {
      await FuncionariosService.criar(payload)
    }


    notify.success('Sucesso!')
    voltarParaLista()
  } catch (e) {

    notify.error(e?.response?.data?.message || 'Erro ao salvar.')
  } finally {
    saving.value = false
  }
}

async function confirmarExcluir() {
  const ok = await confirm.show('Excluir?', 'Esta ação é irreversível.')
    if (!ok) return
  deleting.value = true
  try {
    await FuncionariosService.remover(funcionarioId.value)

    notify.success('Removido!')
    voltarParaLista()
  } catch (e) {


    notify.error('Erro ao excluir.')
  } finally {
    deleting.value = false
  }
}

onMounted(carregarDados)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
.login-font { font-family: 'DM Sans', sans-serif; }

.clientes-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > label) {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgb(100 116 139);
}

.clientes-line-form :deep(input.w-full) {
  border-top: 0; border-left: 0; border-right: 0;
  border-bottom-width: 2px;
  border-radius: 0;
  background: transparent;
}

.clientes-line-form :deep(select.w-full) {
  border-top: 0; border-left: 0; border-right: 0;
  border-bottom-width: 2px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
</style>
