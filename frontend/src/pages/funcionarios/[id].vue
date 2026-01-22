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

      <form v-else class="space-y-12">
        <!-- 01. Informações Pessoais -->
        <div class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              01. Informações Pessoais
            </span>
          </div>

          <Input
            class="col-span-12 md:col-span-6"
            v-model="form.nome"
            label="Nome Completo *"
            required
            placeholder="NOME SEM ABREVIAÇÕES"
          />
          <Input
            class="col-span-12 md:col-span-3"
            v-model="cpfUi"
            label="CPF *"
            required
            placeholder="000.000.000-00"
          />
          <Input class="col-span-12 md:col-span-3" v-model="rgUi" label="RG" placeholder="00.000.000-0" />

          <Input
            class="col-span-12 md:col-span-4"
            v-model="emailUi"
            label="E-mail Pessoal"
            placeholder="exemplo@email.com"
            :forceUpper="false"
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="whatsappUi"
            label="WhatsApp / Celular"
            placeholder="(00) 0 0000-0000"
          />
          <Input class="col-span-12 md:col-span-4" v-model="form.data_nascimento" label="Data de Nascimento" type="date" />

          <Input class="col-span-12 md:col-span-6" v-model="form.estado_civil" label="Estado Civil" placeholder="SOLTEIRO(A), CASADO(A)..." />
          <Input class="col-span-12 md:col-span-6" v-model="form.escolaridade" label="Escolaridade" placeholder="ENSINO MÉDIO, SUPERIOR..." />
        </div>

        <div class="h-px bg-slate-100/50"></div>

        <!-- 02. Localização -->
        <div class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              02. Localização
            </span>
          </div>

          <Input class="col-span-12 md:col-span-3" v-model="cepUi" label="CEP" placeholder="00000-000" @blur="tratarBuscaCep" />
          <Input class="col-span-12 md:col-span-7" v-model="form.endereco" label="Rua / Logradouro" />
          <Input id="numero-input" class="col-span-12 md:col-span-2" v-model="form.numero" label="Nº" />

          <Input class="col-span-12 md:col-span-4" v-model="form.complemento" label="Complemento" placeholder="APTO, BLOCO, FUNDOS..." />
          <Input class="col-span-12 md:col-span-3" v-model="form.bairro" label="Bairro" />
          <Input class="col-span-12 md:col-span-3" v-model="form.cidade" label="Cidade" />
          <Input class="col-span-12 md:col-span-2" v-model="form.estado" label="UF" maxlength="2" />
        </div>

        <div class="h-px bg-slate-100/50"></div>

        <!-- 03. Contrato e Jornada -->
        <div class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              03. Contrato e Jornada
            </span>
          </div>

          <!-- Unidade -->
          <div class="col-span-12 md:col-span-4">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">
              Unidade
            </label>
            <select
              v-model="form.unidade"
              class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 focus:border-brand-primary outline-none transition-all text-sm shadow-sm"
            >
              <option value="">SELECIONE...</option>
              <option value="FABRICA">FÁBRICA</option>
              <option value="LOJA">LOJA</option>
            </select>
          </div>

          <!-- Setor (auto) -->
          <Input class="col-span-12 md:col-span-4" v-model="form.setor" label="Setor" readonly />

          <!-- Função (select) -->
          <div class="col-span-12 md:col-span-4">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">
              Função
            </label>
            <select
              v-model="form.funcao"
              class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 focus:border-brand-primary outline-none transition-all text-sm shadow-sm"
            >
              <option value="">SELECIONE...</option>
              <option v-for="o in funcaoOptions" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
          </div>

          <!-- Vínculo -->
          <Input class="col-span-12 md:col-span-3" v-model="form.registro" label="Nº Registro (Matrícula)" />
          <Input class="col-span-12 md:col-span-3" v-model="form.admissao" label="Data de Admissão" type="date" />
          <Input class="col-span-12 md:col-span-3" v-model="form.demissao" label="Data de Demissão" type="date" />

          <div class="col-span-12 md:col-span-3">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Tempo de Casa</label>
            <div class="h-12 flex items-center px-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 font-bold text-sm">
              {{ tempoServico || '—' }}
            </div>
          </div>

          <!-- Horários seg-sex -->
          <div class="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50">
            <Input v-model="form.horario_entrada_1" label="Entrada 1" type="time" />
            <Input v-model="form.horario_saida_1" label="Saída 1" type="time" />
            <Input v-model="form.horario_entrada_2" label="Entrada 2" type="time" />
            <Input v-model="form.horario_saida_2" label="Saída 2" type="time" />
          </div>

          <!-- Horários sábado -->
          <div class="col-span-12 grid grid-cols-2 gap-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50">
            <Input v-model="form.horario_sabado_entrada_1" label="Sábado - Entrada" type="time" />
            <Input v-model="form.horario_sabado_saida_1" label="Sábado - Saída" type="time" />
          </div>
        </div>

        <div class="h-px bg-slate-100/50"></div>

        <!-- 04. Financeiro e Pagamento -->
        <div class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              04. Financeiro e Pagamento
            </span>
          </div>

          <Input class="col-span-12 md:col-span-3" v-model="salarioBaseUi" label="Salário Base (R$)" />
          <Input class="col-span-12 md:col-span-3" v-model="salarioAdicionalUi" label="Adicional / Gratificação" />

          <!-- Dia pagamento -->
          <div class="col-span-12 md:col-span-3">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Dia Pagto Padrão</label>
            <select
              v-model="form.dia_pagamento"
              class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 focus:border-brand-primary outline-none transition-all text-sm shadow-sm"
            >
              <option :value="5">DIA 05</option>
              <option :value="10">DIA 10</option>
            </select>
          </div>

          <!-- Custo Hora (cor neutra) -->
          <div class="col-span-12 md:col-span-3">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Custo Hora</label>
            <div class="h-12 flex items-center px-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 font-black text-sm">
              {{ custoHoraExibicao }}
            </div>
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest ml-1">Forma de Pagamento</label>
            <select
              v-model="form.forma_pagamento"
              class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 focus:border-brand-primary outline-none transition-all text-sm shadow-sm"
            >
              <option value="DINHEIRO">DINHEIRO</option>
              <option value="PIX">PIX</option>
              <option value="TRANSFERENCIA">TRANSFERÊNCIA</option>
            </select>
          </div>

          <Input class="col-span-12 md:col-span-8" v-model="form.banco" label="Banco" placeholder="EX: ITAÚ, NUBANK..." />
          <Input class="col-span-12 md:col-span-3" v-model="form.agencia" label="Agência" />
          <Input class="col-span-12 md:col-span-3" v-model="form.conta" label="Conta com Dígito" />
          <Input class="col-span-12 md:col-span-3" v-model="form.pix_tipo_chave" label="Tipo Chave PIX" />
          <Input class="col-span-12 md:col-span-3" v-model="form.pix_chave" label="Chave PIX" />
        </div>

        <div class="h-px bg-slate-100/50"></div>

        <!-- 05. Arquivos -->
        <div class="grid grid-cols-12 gap-x-6 gap-y-6">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              05. Arquivos
            </span>
          </div>

          <div class="col-span-12 md:col-span-8">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Adicionar arquivo</label>
            <input
              type="file"
              class="w-full h-12 px-4 py-2 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 outline-none text-sm shadow-sm"
              @change="(e) => (arquivoSelecionado = e.target.files?.[0] || null)"
              :disabled="!isEditing || enviandoArquivo"
            />
            <p v-if="!isEditing" class="mt-2 text-xs text-slate-400 font-bold">
              Salve o funcionário antes de anexar arquivos.
            </p>
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
              Enviar Arquivo
            </Button>
          </div>

          <div class="col-span-12">
            <div v-if="arquivosLoading" class="text-sm font-bold text-slate-400">Carregando arquivos...</div>
            <div v-else-if="!arquivos?.length" class="text-sm font-bold text-slate-400">Nenhum arquivo anexado.</div>

            <div v-else class="space-y-2">
              <div
                v-for="a in arquivos"
                :key="a.id"
                class="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div class="min-w-0">
                  <div class="font-black text-slate-700 text-sm truncate">{{ a.nome }}</div>
                  <div class="text-xs font-bold text-slate-400">
                    {{ a.mime || '—' }} • {{ a.tamanho || 0 }} bytes
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <a
                    :href="a.url"
                    target="_blank"
                    class="h-10 px-4 inline-flex items-center justify-center rounded-2xl bg-white border border-slate-200 font-black text-slate-700 text-xs uppercase tracking-widest"
                  >
                    Abrir
                  </a>

                  <Button variant="danger" size="sm" type="button" class="!rounded-2xl" @click="removerArquivo(a.id)">
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 06. Benefícios -->
        <div class="bg-slate-900 rounded-[2.5rem] p-8 text-white grid grid-cols-12 gap-6 items-center">
          <div class="col-span-12 md:col-span-4">
            <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">06. Benefícios Adicionais</h3>
            <div class="space-y-4">
              <CustomCheckbox v-model="form.tem_vale" label="Habilitar Vale Antecipação" class="dark-check" />
              <CustomCheckbox v-model="form.tem_vale_transporte" label="Habilitar Vale Transporte" class="dark-check" />
            </div>
          </div>

          <div class="col-span-12 md:col-span-8 grid grid-cols-2 gap-4">
            <div v-if="form.tem_vale" class="transition-all animate-in fade-in slide-in-from-left-4">
              <Input v-model="valeUi" label="Valor do Vale (R$)" class="inverted-input" />
            </div>
            <div v-if="form.tem_vale_transporte" class="transition-all animate-in fade-in slide-in-from-left-4">
              <Input v-model="valeTransporteUi" label="Valor VT (R$)" class="inverted-input" />
            </div>
          </div>
        </div>

        <!-- ações -->
        <div class="flex items-center justify-between gap-3 pt-8 border-t border-gray-100">
          <Button variant="secondary" type="button" @click="router.push('/funcionarios')" class="!rounded-2xl !px-8">
            Cancelar
          </Button>

          <Button
            variant="primary"
            :loading="salvando"
            type="button"
            @click="salvar"
            class="!rounded-2xl !px-12 h-14 shadow-xl shadow-brand-primary/20"
          >
            <i class="pi pi-save mr-2"></i>
            Salvar Funcionário
          </Button>
        </div>
      </form>
    </div>
  </Card>
</template>

<style scoped>
/* Inputs dentro da área escura */
.inverted-input :deep(label) {
  color: #94a3b8 !important;
}

.inverted-input :deep(input) {
  background-color: #1e293b !important;
  border: 1px solid #334155 !important;
  color: white !important;
}

/* Checkbox dentro da área escura */
.dark-check :deep(*) {
  color: #e2e8f0 !important;
}

.dark-check :deep(.text-slate-900),
.dark-check :deep(.text-slate-800),
.dark-check :deep(.text-slate-700) {
  color: #e2e8f0 !important;
}

.dark-check :deep(.text-slate-500),
.dark-check :deep(.text-slate-400) {
  color: #94a3b8 !important;
}
</style>



<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { FuncionarioService } from '@/services/index'

import { maskCPF, maskRG, maskTelefone, maskCEP, onlyNumbers } from '@/utils/masks'
import { buscarCep, calcularCustoHora } from '@/utils/utils'
import { moedaParaNumero, numeroParaMoeda } from '@/utils/number'
import { upper, raw } from '@/utils/text'

// ✅ constantes (ajuste o path conforme seu projeto)
import { FUNCIONARIOS_LOCAL_SETOR_FUNCAO } from '@/constantes'

const router = useRouter()
const route = useRoute()
const salvando = ref(false)
const loading = ref(false)

const paramId = computed(() => String(route.params.id || 'novo'))
const isEditing = computed(() => paramId.value !== 'novo')
const id = computed(() => (isEditing.value ? paramId.value.replace(/\D/g, '') : null))

const fmtDate = (d) => (d ? String(d).split('T')[0] : '')

// ===== arquivos (cadastro) =====
const arquivos = ref([])
const arquivosLoading = ref(false)
const arquivoSelecionado = ref(null)
const enviandoArquivo = ref(false)

// ===== unidade/setor/função =====
const unidadeOptions = [
  { label: 'FÁBRICA', value: 'FABRICA' },
  { label: 'LOJA', value: 'LOJA' },
]

const setorLabel = computed(() => {
  if (!form.value.unidade) return ''
  return FUNCIONARIOS_LOCAL_SETOR_FUNCAO?.[form.value.unidade]?.setor || ''
})

const funcaoOptions = computed(() => {
  const unidade = form.value.unidade
  const list = FUNCIONARIOS_LOCAL_SETOR_FUNCAO?.[unidade]?.funcoes || []
  // formato padrão p/ SearchInput select
  return list.map((v) => ({ label: v.replaceAll('_', ' '), value: v }))
})

// ===== dia pagamento =====
const diaPagamentoOptions = [
  { label: 'Dia 05', value: 5 },
  { label: 'Dia 10', value: 10 },
]

// ===== carga horária padrão (conforme regra que você falou) =====
// seg-sex 07:30-17:30 com 1:30 almoço = 8,5h/dia => 42,5h/semana
// sábado 08:00-12:00 = 4h
// total = 46,5h
const CARGA_SEMANAL_PADRAO = 46.5

function novoForm() {
  return {
    // pessoais
    nome: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    telefone: '',
    whatsapp: '',
    email: '',
    estado_civil: '',
    escolaridade: '',

    // empresa
    unidade: '', // FABRICA | LOJA
    setor: '',   // auto
    cargo: '',
    funcao: '',

    // endereço
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',

    // vínculo
    registro: '',
    admissao: '',
    demissao: '',

    // financeiro
    salario_base: 0,
    salario_adicional: 0,
    custo_hora: 0,

    tem_vale: false,
    vale: 0,
    tem_vale_transporte: false,
    vale_transporte: 0,

    // horários seg-sex
    horario_entrada_1: '',
    horario_saida_1: '',
    horario_entrada_2: '',
    horario_saida_2: '',

    // sábado (somente entrada/saída)
    horario_sabado_entrada_1: '',
    horario_sabado_saida_1: '',

    // pagamento
    forma_pagamento: 'DINHEIRO',
    dia_pagamento: 5, // ✅ dia fixo (05/10)
    banco: '',
    agencia: '',
    conta: '',
    pix_tipo_chave: '',
    pix_chave: '',
  }
}

const form = ref(novoForm())

/* ======= UI (computed get/set) ======= */
const cpfUi = computed({
  get: () => (form.value.cpf ? maskCPF(form.value.cpf) : ''),
  set: (v) => (form.value.cpf = onlyNumbers(maskCPF(v))),
})

const rgUi = computed({
  get: () => (form.value.rg ? String(form.value.rg) : ''),
  set: (v) => (form.value.rg = raw(maskRG(v))),
})

const whatsappUi = computed({
  get: () => (form.value.whatsapp ? maskTelefone(form.value.whatsapp) : ''),
  set: (v) => (form.value.whatsapp = onlyNumbers(maskTelefone(v))),
})

const cepUi = computed({
  get: () => (form.value.cep ? maskCEP(form.value.cep) : ''),
  set: (v) => (form.value.cep = onlyNumbers(maskCEP(v))),
})

const emailUi = computed({
  get: () => (form.value.email ? String(form.value.email) : ''),
  set: (v) => (form.value.email = raw(String(v || '').toLowerCase().trim())),
})

const salarioBaseUi = computed({
  get: () => numeroParaMoeda(Number(form.value.salario_base || 0)),
  set: (v) => (form.value.salario_base = Number(moedaParaNumero(v) || 0)),
})

const salarioAdicionalUi = computed({
  get: () => numeroParaMoeda(Number(form.value.salario_adicional || 0)),
  set: (v) => (form.value.salario_adicional = Number(moedaParaNumero(v) || 0)),
})

const valeUi = computed({
  get: () => numeroParaMoeda(form.value.vale || 0),
  set: (v) => (form.value.vale = Number(moedaParaNumero(v) || 0)),
})

const valeTransporteUi = computed({
  get: () => numeroParaMoeda(form.value.vale_transporte || 0),
  set: (v) => (form.value.vale_transporte = Number(moedaParaNumero(v) || 0)),
})

/* ======= calculados ======= */
const custoHoraExibicao = computed(() => numeroParaMoeda(form.value.custo_hora || 0))

const tempoServico = computed(() => {
  if (!form.value.admissao) return '---'
  const inicio = new Date(form.value.admissao)
  const fim = form.value.demissao ? new Date(form.value.demissao) : new Date()
  if (Number.isNaN(inicio.getTime())) return '---'

  let anos = fim.getFullYear() - inicio.getFullYear()
  let meses = fim.getMonth() - inicio.getMonth()
  if (meses < 0) { anos--; meses += 12 }
  return anos > 0 ? `${anos} anos e ${meses} meses` : `${meses} meses`
})

const toNumber2 = (v) => {
  const n = Number(String(v ?? 0).replace(',', '.'))
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}


function recalcularCustoHora() {
  const base = Number(form.value.salario_base || 0)
  const adicional = Number(form.value.salario_adicional || 0)
  const total = base + adicional

  // ✅ Ajuste do “valor errado”:
  // Se seu calcularCustoHora já considera carga horária internamente, deixe como está.
  // Se ele aceitar a carga semanal, use a linha comentada abaixo.
  form.value.custo_hora = calcularCustoHora(total /*, CARGA_SEMANAL_PADRAO */)
}

/* recalcula custo hora quando mexe em valores */
watch(
  () => [form.value.salario_base, form.value.salario_adicional],
  () => recalcularCustoHora(),
  { immediate: true }
)

/* busca CEP quando completo */
watch(
  () => form.value.cep,
  async (cep) => {
    if (String(cep || '').length !== 8) return
    const d = await buscarCep(cep)
    if (!d) return
    form.value.endereco = upper(d.logradouro)
    form.value.bairro = upper(d.bairro)
    form.value.cidade = upper(d.localidade)
    form.value.estado = upper(d.uf)
  }
)

async function tratarBuscaCep() {
  const cep = String(form.value.cep || '')
  if (cep.length !== 8) return

  const d = await buscarCep(cep)
  if (!d) return

  form.value.endereco = upper(d.logradouro)
  form.value.bairro = upper(d.bairro)
  form.value.cidade = upper(d.localidade)
  form.value.estado = upper(d.uf)
}

/* ======= unidade -> setor automático + valida função ======= */
watch(
  () => form.value.unidade,
  (unidade) => {
    if (!unidade) {
      form.value.setor = ''
      form.value.funcao = ''
      return
    }

    const setor = FUNCIONARIOS_LOCAL_SETOR_FUNCAO?.[unidade]?.setor || ''
    form.value.setor = setor

    const funcoes = FUNCIONARIOS_LOCAL_SETOR_FUNCAO?.[unidade]?.funcoes || []
    if (form.value.funcao && !funcoes.includes(form.value.funcao)) {
      form.value.funcao = ''
    }
  }
)

/* ======= arquivos ======= */
async function carregarArquivos() {
  if (!isEditing.value || !id.value) {
    arquivos.value = []
    return
  }

  arquivosLoading.value = true
  try {
    const { data } = await FuncionarioService.listarArquivos(id.value)
    arquivos.value = Array.isArray(data) ? data : []
  } catch {
    arquivos.value = []
  } finally {
    arquivosLoading.value = false
  }
}

async function enviarArquivo() {
  if (!isEditing.value || !id.value) return alert('Salve o funcionário antes de anexar arquivos.')
  if (!arquivoSelecionado.value) return

  enviandoArquivo.value = true
  try {
    await FuncionarioService.uploadArquivo(id.value, arquivoSelecionado.value)
    arquivoSelecionado.value = null
    await carregarArquivos()
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao enviar arquivo')
  } finally {
    enviandoArquivo.value = false
  }
}

async function removerArquivo(arquivoId) {
  if (!arquivoId) return
  try {
    await FuncionarioService.removerArquivo(arquivoId)
    await carregarArquivos()
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao remover arquivo')
  }
}

/* ======= carregar ======= */
async function carregar() {
  loading.value = true
  try {
    if (!isEditing.value) {
      form.value = novoForm()

      // ✅ padrão do horário que você definiu
      form.value.horario_entrada_1 = '07:30'
      form.value.horario_saida_1 = '12:00'
      form.value.horario_entrada_2 = '13:30'
      form.value.horario_saida_2 = '17:30'
      form.value.horario_sabado_entrada_1 = '08:00'
      form.value.horario_sabado_saida_1 = '12:00'

      recalcularCustoHora()
      await carregarArquivos()
      return
    }

    const { data } = await FuncionarioService.buscar(id.value)

  form.value = {
  ...novoForm(),
  ...data,
  data_nascimento: fmtDate(data.data_nascimento),
  admissao: fmtDate(data.admissao),
  demissao: fmtDate(data.demissao),

  // ✅ garante number correto
  salario_base: toNumber2(data.salario_base),
  salario_adicional: toNumber2(data.salario_adicional),
  custo_hora: toNumber2(data.custo_hora),
  vale: toNumber2(data.vale),
  vale_transporte: toNumber2(data.vale_transporte),
}

    // se veio data_pagamento antigo do banco, não usa mais no form
    recalcularCustoHora()
    await carregarArquivos()
  } catch {
    router.push('/funcionarios')
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
watch(() => paramId.value, () => carregar())

/* ======= salvar ======= */
async function salvar() {
  if (!form.value.nome || String(form.value.cpf || '').length < 11) {
    return alert('Nome e CPF obrigatórios.')
  }

  salvando.value = true
  try {
    recalcularCustoHora()

    const { status, ...semStatus } = form.value

    const payload = {
      ...semStatus,
      email: emailUi.value,

      data_nascimento: form.value.data_nascimento || null,
      admissao: form.value.admissao || null,
      demissao: form.value.demissao || null,

      // ✅ dia do pagamento (não é Date)
      dia_pagamento: form.value.dia_pagamento || null,
    }

    await FuncionarioService.salvar(isEditing.value ? id.value : null, payload)
    router.push('/funcionarios')
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao salvar')
  } finally {
    salvando.value = false
  }
}
</script>

