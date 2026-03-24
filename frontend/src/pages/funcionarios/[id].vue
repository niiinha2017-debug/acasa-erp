<template>
  <PageShell :padded="false">
    <section class="login-font funcionario-editor animate-page-in">
      <PageHeader
        :title="isEdit ? `Editar Funcionário #${funcionarioId}` : 'Novo Funcionário'"
        subtitle="Gerenciamento de dados pessoais, contratuais e operacionais"
        icon="pi pi-id-card"
      />

      <div class="funcionario-body">
      <Loading v-if="loading" />

      <form v-else class="funcionario-form space-y-10 clientes-line-form" @submit.prevent="confirmarSalvar" autocomplete="off">
        
        <div class="section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
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
            class="col-span-12 md:col-span-3"
            v-model="form.pis"
            label="PIS"
            placeholder="Nº PIS"
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
          <div v-if="!isEdit" class="col-span-12 md:col-span-12">
            <CustomCheckbox
              v-model="form.criar_usuario"
              label="Criar usuário de acesso e enviar senha provisória por e-mail"
              :description="form.email ? 'Ao salvar, o colaborador receberá um e-mail com a senha de primeiro acesso. Depois você gerencia as permissões em Configurações → Equipe.' : 'Preencha o e-mail acima para criar o usuário e enviar a senha.'"
            />
          </div>
        </div>

        <div class="section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
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

        <div class="section-divider relative">

          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
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

        <div class="section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Dados da Empresa
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Select
            class="col-span-12 md:col-span-3"
            v-model="form.unidade"
            label="Vínculo de Local"
            placeholder="LOJA ou FÁBRICA"
            :options="vinculoLocalOptions"
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

        <div class="section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Remuneração e Benefícios
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input class="col-span-12 md:col-span-4" v-model="salarioBaseMask" label="Salário Base (R$)" placeholder="0,00" />
          <Input class="col-span-12 md:col-span-4" v-model="salarioAdicionalMask" label="Complementos" placeholder="0,00" />
          <Input class="col-span-12 md:col-span-4" v-model="form.impostos_encargos_percentual" label="Impostos/Encargos (%)" type="number" step="0.01" min="0" placeholder="0" />

          <div class="col-span-12 funcionario-cost-grid">
            <div class="funcionario-cost-card">
              <span class="funcionario-cost-card__label">Salário base</span>
              <strong class="funcionario-cost-card__value">{{ salarioBaseResumo }}</strong>
            </div>
            <div class="funcionario-cost-card">
              <span class="funcionario-cost-card__label">Impostos estimados</span>
              <strong class="funcionario-cost-card__value">{{ impostosEncargosValorFormatado }}</strong>
              <span class="funcionario-cost-card__hint">{{ impostosEncargosResumo }}</span>
            </div>
            <div class="funcionario-cost-card">
              <span class="funcionario-cost-card__label">Benefícios mensais</span>
              <strong class="funcionario-cost-card__value">{{ beneficiosMensaisFormatado }}</strong>
            </div>
            <div class="funcionario-cost-card funcionario-cost-card--total">
              <span class="funcionario-cost-card__label">Custo total mensal</span>
              <strong class="funcionario-cost-card__value">{{ custoTotalMensalFormatado }}</strong>
            </div>
          </div>

          <div class="col-span-12 md:col-span-6 funcionario-benefit-card space-y-4">
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

          <div class="col-span-12 md:col-span-6 funcionario-benefit-card space-y-4">
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

        <div class="section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
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

        <div class="section-divider relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="section-title bg-bg-page dark:bg-slate-900 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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

        <template v-if="isEdit">
          <div class="section-divider relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-ui/50"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="section-title bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Documentos do funcionário
              </span>
            </div>
          </div>

          <div class="funcionario-files">
            <div class="funcionario-files__header">
              <span class="funcionario-files__eyebrow">Arquivos vinculados ao cadastro</span>
              <button
                type="button"
                class="funcionario-files__link"
                @click="abrirArquivosFuncionario"
              >
                Gerenciar documentos
              </button>
            </div>

            <div v-if="loadingArquivos" class="funcionario-files__state">
              Carregando arquivos...
            </div>

            <div v-else-if="arquivosDoFuncionario.length === 0" class="funcionario-files__state funcionario-files__state--empty">
              Nenhum documento vinculado a este funcionário.
            </div>

            <ul v-else class="funcionario-files__list">
              <li
                v-for="arquivo in arquivosDoFuncionario"
                :key="arquivo.id"
                class="funcionario-files__item"
              >
                <div class="funcionario-files__meta">
                  <span class="funcionario-files__name">{{ arquivo.nome || arquivo.filename || `Arquivo #${arquivo.id}` }}</span>
                  <span class="funcionario-files__info">
                    {{ formatFileType(arquivo.mime_type) }}<span v-if="arquivo.categoria"> • {{ arquivo.categoria }}</span>
                  </span>
                </div>

                <div class="funcionario-files__actions">
                  <button
                    type="button"
                    class="funcionario-files__action"
                    @click="abrirArquivoFuncionario(arquivo)"
                  >
                    Ver
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </template>

              <div class="pt-10 mt-6 border-t border-border-ui">

                <div
                  class="funcionario-form__actions flex flex-col-reverse gap-4 md:flex-row md:items-center"
                  :class="isEdit && can('funcionarios.excluir') ? 'md:justify-between' : 'md:justify-end'"
                >
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

            <div class="funcionario-form__actions-main flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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

      <ArquivosModal
        v-if="arquivosModalOpen && isEdit"
        :open="arquivosModalOpen"
        ownerType="FUNCIONARIO"
        :ownerId="funcionarioId"
        :canManage="can('funcionarios.editar')"
        @close="fecharArquivosFuncionario"
      />
    </section>
  </PageShell>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FuncionariosService, ArquivosService } from '@/services/index'
import { notify } from '@/services/notify'
import ArquivosModal from '@/components/modals/ArquivosModal.vue'

definePage({ meta: { perm: 'funcionarios.ver' } })
import { confirm } from '@/services/confirm'
import { maskCEP, maskCPF, maskTelefone, maskReais, maskHora } from '@/utils/masks'
import { moedaParaNumero, numeroParaMoeda } from '@/utils/number'
import { buscarCep, calcularCustoHora, derivarCargaDosHorarios } from '@/utils/utils'
import { can } from '@/services/permissions'
import { closeTabAndGo } from '@/utils/tabs'
import { FUNCIONARIOS_LOCAL_SETOR_CARGO } from '@/constantes/funcionarios'







const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isHydrating = ref(false)
const loadingArquivos = ref(false)
const arquivosDoFuncionario = ref([])
const arquivosModalOpen = ref(false)

const funcionarioId = computed(() => Number(route.params?.id))
const isEdit = computed(() => !!funcionarioId.value)

const form = ref({
  nome: '',
  cpf: '',
  rg: '',
  pis: '',
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
  impostos_encargos_percentual: '',
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
  criar_usuario: true,
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

const normalizeSelectString = (value) => {
  if (value === null || value === undefined) return undefined

  if (typeof value === 'object') {
    const raw = value.value ?? value.label ?? ''
    return normalizeString(raw)
  }

  return normalizeString(value)
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

/** Opções para Vínculo de Local: LOJA ou FÁBRICA (pré-configura perfil de permissões do usuário) */
const vinculoLocalOptions = computed(() => [
  { label: 'LOJA', value: 'LOJA' },
  { label: 'FÁBRICA', value: 'FÁBRICA' },
])

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

/** Custo total mensal: base*(1 + impostos/100) + adicional + vale + vale_transporte */
const custoTotalMensal = computed(() => {
  const base = moedaParaNumero(form.value.salario_base)
  if (!base && base !== 0) return null
  const pct = Number(String(form.value.impostos_encargos_percentual || '').replace(',', '.')) || 0
  const adicional = moedaParaNumero(form.value.salario_adicional) || 0
  const vale = form.value.tem_vale ? (moedaParaNumero(form.value.vale) || 0) : 0
  const vt = form.value.tem_vale_transporte ? (moedaParaNumero(form.value.vale_transporte) || 0) : 0
  return base * (1 + pct / 100) + adicional + vale + vt
})

const impostosEncargosValor = computed(() => {
  const base = moedaParaNumero(form.value.salario_base)
  const pct = Number(String(form.value.impostos_encargos_percentual || '').replace(',', '.')) || 0
  if (!base || !pct) return 0
  return base * (pct / 100)
})

const beneficiosMensais = computed(() => {
  const vale = form.value.tem_vale ? (moedaParaNumero(form.value.vale) || 0) : 0
  const vt = form.value.tem_vale_transporte ? (moedaParaNumero(form.value.vale_transporte) || 0) : 0
  return vale + vt
})

const custoTotalMensalFormatado = computed(() => {
  const v = custoTotalMensal.value
  if (v == null || (typeof v === 'number' && Number.isNaN(v))) return '–'
  return numeroParaMoeda(Math.round(v * 100) / 100)
})

const salarioBaseResumo = computed(() => {
  const valor = moedaParaNumero(form.value.salario_base)
  if (!valor && valor !== 0) return '–'
  return numeroParaMoeda(Math.round(valor * 100) / 100)
})

const impostosEncargosValorFormatado = computed(() => {
  return numeroParaMoeda(Math.round(impostosEncargosValor.value * 100) / 100)
})

const beneficiosMensaisFormatado = computed(() => {
  return numeroParaMoeda(Math.round(beneficiosMensais.value * 100) / 100)
})

const impostosEncargosResumo = computed(() => {
  const pct = Number(String(form.value.impostos_encargos_percentual || '').replace(',', '.')) || 0
  if (!pct) return 'Informe a alíquota para compor o custo'
  return `${pct.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}% sobre o salário base`
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
  () => [
    form.value.horario_entrada_1,
    form.value.horario_saida_1,
    form.value.horario_entrada_2,
    form.value.horario_saida_2,
    form.value.horario_sabado_entrada_1,
    form.value.horario_sabado_saida_1,
  ],
  () => {
    if (isHydrating.value) return

    const derivado = derivarCargaDosHorarios(form.value)
    if (!derivado.cargaSegSex && !derivado.cargaSabado && !derivado.cargaSemana) {
      form.value.carga_horaria_dia = ''
      form.value.carga_horaria_semana = ''
      return
    }

    form.value.carga_horaria_dia = derivado.cargaSegSex.toFixed(2)
    form.value.carga_horaria_semana = derivado.cargaSemana.toFixed(2)
  }
)

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
  const cepLimpo = String(form.value.cep ?? '').replace(/\D/g, '')
  if (cepLimpo.length !== 8) return
  const data = await buscarCep(cepLimpo)
  if (!data) {
    notify.warn('CEP não encontrado.')
    return
  }

  form.value.cep = data.cep ? maskCEP(data.cep) : form.value.cep
  form.value.endereco = data.logradouro || form.value.endereco
  form.value.bairro = data.bairro || form.value.bairro
  form.value.cidade = data.localidade || form.value.cidade
  form.value.estado = data.uf || form.value.estado
}


function voltarParaLista() {
  closeTabAndGo('/funcionarios')
}

function formatFileType(mimeType) {
  const raw = String(mimeType || '').toLowerCase()
  if (!raw) return 'Arquivo'
  if (raw.includes('pdf')) return 'PDF'
  if (raw.includes('image')) return 'Imagem'
  if (raw.includes('sheet') || raw.includes('excel') || raw.includes('spreadsheet')) return 'Planilha'
  if (raw.includes('word') || raw.includes('document')) return 'Documento'
  return raw.split('/')[1] || 'Arquivo'
}

async function carregarArquivosFuncionario() {
  if (!isEdit.value || !can('arquivos.ver')) {
    arquivosDoFuncionario.value = []
    return
  }

  loadingArquivos.value = true
  try {
    const resArquivos = await ArquivosService.listar({
      ownerType: 'FUNCIONARIO',
      ownerId: funcionarioId.value,
    })
    const payload = resArquivos?.data
    const rows = Array.isArray(payload) ? payload : (payload?.data || [])
    arquivosDoFuncionario.value = rows.sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))
  } catch {
    arquivosDoFuncionario.value = []
  } finally {
    loadingArquivos.value = false
  }
}

function abrirArquivosFuncionario() {
  if (!isEdit.value || !can('funcionarios.ver')) return
  arquivosModalOpen.value = true
}

async function fecharArquivosFuncionario() {
  arquivosModalOpen.value = false
  await carregarArquivosFuncionario()
}

function abrirArquivoFuncionario(arquivo) {
  if (!arquivo?.id || !isEdit.value) return
  const nome = arquivo.nome || arquivo.filename || `ARQUIVO_${arquivo.id}`
  const type = arquivo.mime_type || ''
  const from = `/funcionarios/${funcionarioId.value}`
  const path = String(type).toLowerCase().includes('pdf') ? `/arquivos/pdf/${arquivo.id}` : `/arquivos/${arquivo.id}`
  router.push({
    path,
    query: { name: nome, type, from },
  })
}

function aplicarCustosConstantesNoFormulario(data) {
  if (!data || typeof data !== 'object') return

  if (data.salario_base !== undefined && data.salario_base !== null) {
    form.value.salario_base = numeroParaMoeda(data.salario_base)
  }
  if (data.impostos_encargos_percentual !== undefined && data.impostos_encargos_percentual !== null) {
    form.value.impostos_encargos_percentual = String(data.impostos_encargos_percentual)
  }
  if (data.salario_adicional !== undefined && data.salario_adicional !== null) {
    form.value.salario_adicional = numeroParaMoeda(data.salario_adicional)
  }
  if (data.custo_hora !== undefined && data.custo_hora !== null) {
    form.value.custo_hora = numeroParaMoeda(data.custo_hora)
  }
}

async function carregarCustosConstantes(funcId) {
  if (!funcId) return
  try {
    const res = await FuncionariosService.buscarCustosConstantes(funcId)
    const data = res?.data ?? res
    aplicarCustosConstantesNoFormulario(data)
  } catch (e) {
    console.warn('[FUNCIONARIOS] Não foi possível carregar custos constantes.', e)
  }
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
      cpf: data.cpf ? maskCPF(data.cpf) : '',
      rg: data.rg ?? '',
      pis: data.pis ?? '',
      email: data.email ?? '',
      telefone: data.telefone ? maskTelefone(data.telefone) : '',
      whatsapp: data.whatsapp ? maskTelefone(data.whatsapp) : '',
      estado_civil: data.estado_civil ?? '',
      escolaridade: data.escolaridade ?? '',
      data_nascimento: data.data_nascimento?.split('T')[0] || '',
      data_inicio: data.data_inicio?.split('T')[0] || '',
      admissao: data.admissao?.split('T')[0] || '',
      demissao: data.demissao?.split('T')[0] || '',
      unidade: unidadeNormalizada || (data.unidade ?? ''),
      setor: setorNormalizado || (data.setor ?? ''),
      cargo: cargoNormalizado || (data.cargo ?? ''),
      cep: data.cep ? maskCEP(data.cep) : '',
      endereco: data.endereco ?? '',
      numero: data.numero ?? '',
      complemento: data.complemento ?? '',
      bairro: data.bairro ?? '',
      cidade: data.cidade ?? '',
      estado: data.estado ?? '',
      salario_base: data.salario_base != null && data.salario_base !== '' ? numeroParaMoeda(data.salario_base) : '',
      impostos_encargos_percentual: data.impostos_encargos_percentual != null && data.impostos_encargos_percentual !== '' ? String(data.impostos_encargos_percentual) : '',
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
    // Só libera os watchers no próximo tick para não limpar setor/cargo ao carregar
    await nextTick()
    isHydrating.value = false

    await carregarCustosConstantes(funcionarioId.value)
    await carregarArquivosFuncionario()

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
      pis: normalizeString(form.value.pis) ?? null,
      email: normalizeString(form.value.email),
      telefone: normalizeString(form.value.telefone),
      whatsapp: normalizeString(form.value.whatsapp),
      estado_civil: normalizeString(form.value.estado_civil),
      escolaridade: normalizeString(form.value.escolaridade),
      data_nascimento: normalizeString(form.value.data_nascimento),
      data_inicio: normalizeString(form.value.data_inicio),
      admissao: normalizeString(form.value.admissao),
      demissao: normalizeString(form.value.demissao),
      unidade: normalizeSelectString(form.value.unidade) ?? null,
      setor: normalizeSelectString(form.value.setor) ?? null,
      cargo: normalizeSelectString(form.value.cargo) ?? null,
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
    const impPct = normalizeNumber(form.value.impostos_encargos_percentual)
    if (impPct !== undefined) payload.impostos_encargos_percentual = impPct
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

    let savedId = null

    if (isEdit.value) {
      const updated = await FuncionariosService.atualizar(funcionarioId.value, payload)
      savedId = Number(updated?.data?.id ?? updated?.id ?? funcionarioId.value)
    } else {
      payload.criar_usuario = !!form.value.criar_usuario
      const created = await FuncionariosService.criar(payload)
      savedId = Number(created?.data?.id ?? created?.id ?? 0)
    }

    if (savedId) {
      await carregarCustosConstantes(savedId)
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
.funcionario-editor {
  min-height: 100%;
  background: var(--ds-color-surface);
  font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.funcionario-editor :deep(.ds-shell-card) {
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  backdrop-filter: none;
}

.funcionario-editor :deep(.ds-header-block) {
  padding-top: 1rem;
  padding-bottom: 0.8rem;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 768px) {
  .funcionario-editor :deep(.ds-header-block) {
    padding-top: 1.25rem;
    padding-bottom: 1rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .funcionario-editor :deep(.ds-header-block) {
    padding-top: 1.4rem;
    padding-bottom: 1rem;
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.funcionario-editor :deep(.ds-header-title) {
  font-size: clamp(1.35rem, 1.08rem + 0.45vw, 1.8rem);
  font-weight: 620;
  letter-spacing: -0.03em;
}

.funcionario-editor :deep(.ds-header-subtitle) {
  max-width: 38rem;
  color: var(--ds-color-text-faint);
  font-size: 0.78rem;
  font-weight: 430;
}

.funcionario-editor :deep(.ds-header-icon) {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  border-color: rgba(214, 224, 234, 0.72);
  background: transparent;
  color: var(--ds-color-text-faint);
  font-size: 0.84rem;
  box-shadow: none;
}

.dark .funcionario-editor :deep(.ds-header-icon) {
  border-color: rgba(51, 71, 102, 0.72);
  background: transparent;
}

.funcionario-body {
  width: min(100%, 1680px);
  margin: 0 auto;
  padding: 0.95rem 1rem 1.5rem;
}

@media (min-width: 768px) {
  .funcionario-body {
    padding: 1.2rem 1.5rem 1.75rem;
  }
}

@media (min-width: 1024px) {
  .funcionario-body {
    padding: 1.25rem 1.75rem 2rem;
  }
}

.funcionario-form {
  width: 100%;
  max-width: none;
  margin: 0 auto;
}

.funcionario-form__actions-main {
  margin-left: auto;
}

.funcionario-form > * + * {
  margin-top: 3.1rem !important;
}

.section-divider {
  margin-top: 0.9rem;
}

.section-title {
  background: var(--ds-color-surface);
  display: block;
  width: fit-content;
  margin: 0 auto;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

.clientes-line-form :deep(.ds-field-label),
.clientes-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > label),
.clientes-line-form :deep(.search-container > label) {
  width: auto;
  justify-content: flex-start;
  margin-left: 0;
  margin-bottom: 0.6rem;
  color: var(--ds-color-text-faint);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-align: left;
  text-transform: none;
}

.clientes-line-form :deep(input.ds-control-input) {
  min-height: 46px !important;
  height: 46px !important;
  padding-left: 0.1rem !important;
  padding-right: 0.1rem !important;
  padding-top: 0.75rem !important;
  padding-bottom: 0.55rem !important;
  font-size: 0.88rem !important;
  font-weight: 430 !important;
  line-height: 1.45 !important;
  border-top: 0 !important;
  border-left: 0 !important;
  border-right: 0 !important;
  border-bottom-width: 1px !important;
  border-bottom-style: solid !important;
  border-bottom-color: rgba(188, 203, 221, 0.75) !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

.clientes-line-form :deep(select.ds-control-input) {
  min-height: 46px !important;
  height: 46px !important;
  padding-left: 0.1rem !important;
  padding-right: 3.25rem !important;
  padding-top: 0.75rem !important;
  padding-bottom: 0.55rem !important;
  font-size: 0.88rem !important;
  font-weight: 430 !important;
  line-height: 1.45 !important;
  border-top: 0 !important;
  border-left: 0 !important;
  border-right: 0 !important;
  border-bottom-width: 1px !important;
  border-bottom-style: solid !important;
  border-bottom-color: rgba(188, 203, 221, 0.75) !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

.clientes-line-form :deep(.select-field__chevron-pill) {
  width: 1.85rem !important;
  height: 1.85rem !important;
  border-color: rgba(188, 203, 221, 0.88) !important;
  background: rgba(248, 250, 252, 0.96) !important;
  box-shadow: none !important;
}

.clientes-line-form :deep(input.ds-control-input:focus) {
  border-bottom-color: var(--ds-color-primary) !important;
  box-shadow: none !important;
  outline: none !important;
}

.clientes-line-form :deep(select.ds-control-input:focus) {
  border-bottom-color: var(--ds-color-primary) !important;
  box-shadow: none !important;
  outline: none !important;
}

.clientes-line-form :deep(input.ds-control-input::placeholder) {
  color: var(--ds-color-text-faint);
  font-size: 0.84rem;
  font-weight: 400;
  opacity: 1;
}

.clientes-line-form :deep(select.ds-control-input option) {
  font-size: 0.84rem;
  font-weight: 500;
}

.clientes-line-form :deep(.ds-checkbox) {
  padding-left: 0;
  padding-right: 0;
  border-radius: 0;
  gap: 0.55rem;
}

.clientes-line-form :deep(.ds-checkbox:hover) {
  background: transparent;
  border-color: transparent;
}

.clientes-line-form :deep(.ds-checkbox__box) {
  width: 1rem;
  height: 1rem;
  border-radius: 999px;
}

.clientes-line-form :deep(.ds-checkbox__label) {
  font-size: 0.84rem;
  font-weight: 450;
}

.clientes-line-form :deep(.ds-checkbox__description) {
  font-size: 0.72rem;
}

.funcionario-cost-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 0.15rem;
}

.funcionario-cost-card {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-height: 5.4rem;
  padding: 1rem 1rem 0.95rem;
  border: 1px solid rgba(214, 224, 234, 0.72);
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.72);
}

.dark .funcionario-cost-card {
  border-color: rgba(51, 71, 102, 0.72);
  background: rgba(15, 23, 42, 0.46);
}

.funcionario-cost-card--total {
  border-color: rgba(44, 111, 163, 0.2);
  background: rgba(44, 111, 163, 0.06);
}

.funcionario-cost-card__label {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 500;
}

.funcionario-cost-card__value {
  color: var(--ds-color-text);
  font-size: 1.12rem;
  font-weight: 650;
  line-height: 1.2;
}

.funcionario-cost-card__hint {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  line-height: 1.35;
}

.funcionario-benefit-card {
  padding: 1rem 1rem 1.1rem;
  border: 1px solid rgba(214, 224, 234, 0.72);
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.48);
}

.dark .funcionario-benefit-card {
  border-color: rgba(51, 71, 102, 0.72);
  background: rgba(15, 23, 42, 0.34);
}

.funcionario-files {
  border-top: 1px solid rgba(214, 224, 234, 0.55);
  border-bottom: 1px solid rgba(214, 224, 234, 0.55);
}

.dark .funcionario-files {
  border-top-color: rgba(51, 71, 102, 0.55);
  border-bottom-color: rgba(51, 71, 102, 0.55);
}

.funcionario-files__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.95rem 0;
}

.funcionario-files__eyebrow {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
  font-weight: 500;
}

.funcionario-files__link {
  color: var(--ds-color-primary);
  font-size: 0.78rem;
  font-weight: 600;
}

.funcionario-files__state {
  padding: 1rem 0 1.25rem;
  color: var(--ds-color-text-soft);
  font-size: 0.84rem;
}

.funcionario-files__state--empty {
  color: var(--ds-color-text-faint);
}

.funcionario-files__list {
  display: flex;
  flex-direction: column;
}

.funcionario-files__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 0;
  border-top: 1px solid rgba(214, 224, 234, 0.42);
}

.dark .funcionario-files__item {
  border-top-color: rgba(51, 71, 102, 0.42);
}

.funcionario-files__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.funcionario-files__name {
  color: var(--ds-color-text);
  font-size: 0.92rem;
  font-weight: 540;
  line-height: 1.35;
}

.funcionario-files__info {
  color: var(--ds-color-text-faint);
  font-size: 0.72rem;
}

.funcionario-files__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.funcionario-files__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.9rem;
  padding: 0 0.65rem;
  border: 1px solid rgba(214, 224, 234, 0.82);
  border-radius: 0.7rem;
  color: var(--ds-color-text-soft);
  font-size: 0.72rem;
  font-weight: 600;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.funcionario-files__action:hover {
  border-color: rgba(44, 111, 163, 0.24);
  color: var(--ds-color-primary);
  background: rgba(44, 111, 163, 0.05);
}

@media (max-width: 768px) {
  .funcionario-body {
    padding: 0.9rem 0.75rem 1.35rem;
  }

  .funcionario-form > * + * {
    margin-top: 2.5rem !important;
  }

  .funcionario-cost-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .funcionario-cost-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
