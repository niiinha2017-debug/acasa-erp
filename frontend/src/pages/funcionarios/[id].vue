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
        
        <div class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">01. Informações Pessoais</span>
          </div>

          <Input class="col-span-12 md:col-span-6" v-model="form.nome" label="Nome Completo *" required placeholder="NOME SEM ABREVIAÇÕES" />
          <Input class="col-span-12 md:col-span-3" v-model="cpfUi" label="CPF *" required placeholder="000.000.000-00" />
          <Input class="col-span-12 md:col-span-3" v-model="rgUi" label="RG" placeholder="00.000.000-0" />

          <Input class="col-span-12 md:col-span-4" v-model="emailUi" label="E-mail Pessoal" placeholder="exemplo@email.com" />
          <Input class="col-span-12 md:col-span-4" v-model="whatsappUi" label="WhatsApp / Celular" placeholder="(00) 0 0000-0000" />
          <Input class="col-span-12 md:col-span-4" v-model="form.data_nascimento" label="Data de Nascimento" type="date" />

          <Input class="col-span-12 md:col-span-6" v-model="form.estado_civil" label="Estado Civil" placeholder="SOLTEIRO(A), CASADO(A)..." />
          <Input class="col-span-12 md:col-span-6" v-model="form.escolaridade" label="Escolaridade" placeholder="ENSINO MÉDIO, SUPERIOR..." />
        </div>

        <div class="h-px bg-slate-100/50"></div>

        <div class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">02. Localização</span>
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

        <div class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">03. Contrato e Jornada</span>
          </div>

          <Input class="col-span-12 md:col-span-4" v-model="form.setor" label="Setor / Departamento" />
          <Input class="col-span-12 md:col-span-4" v-model="form.cargo" label="Cargo" />
          <Input class="col-span-12 md:col-span-4" v-model="form.funcao" label="Função Específica" />

          <Input class="col-span-12 md:col-span-3" v-model="form.registro" label="Nº Registro (Matrícula)" />
          <Input class="col-span-12 md:col-span-3" v-model="form.admissao" label="Data de Admissão" type="date" />
          <Input class="col-span-12 md:col-span-3" v-model="form.demissao" label="Data de Demissão" type="date" />
          
          <div class="col-span-12 md:col-span-3">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Tempo de Casa</label>
            <div class="h-12 flex items-center px-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 font-bold text-sm">
              {{ tempoServico || '—' }}
            </div>
          </div>

          <div class="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50">
            <Input v-model="form.horario_entrada_1" label="Entrada 1" type="time" />
            <Input v-model="form.horario_saida_1" label="Saída 1" type="time" />
            <Input v-model="form.horario_entrada_2" label="Entrada 2" type="time" />
            <Input v-model="form.horario_saida_2" label="Saída 2" type="time" />
          </div>
        </div>

        <div class="h-px bg-slate-100/50"></div>

        <div class="grid grid-cols-12 gap-x-6 gap-y-8">
          <div class="col-span-12 flex items-center gap-3 mb-2">
            <div class="w-1.5 h-4 bg-slate-900 rounded-full"></div>
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">04. Financeiro e Pagamento</span>
          </div>

          <Input class="col-span-12 md:col-span-3" v-model="salarioBaseUi" label="Salário Base (R$)" />
          <Input class="col-span-12 md:col-span-3" v-model="salarioAdicionalUi" label="Adicional / Gratificação" />
          <Input class="col-span-12 md:col-span-3" v-model="form.data_pagamento" label="Data Pagto Padrão" type="date" />
          
          <div class="col-span-12 md:col-span-3">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Custo Hora</label>
            <div class="h-12 flex items-center px-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 font-black text-sm">
              {{ custoHoraExibicao }}
            </div>
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest ml-1">Forma de Pagamento</label>
            <select v-model="form.forma_pagamento" class="w-full h-12 px-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 focus:border-brand-primary outline-none transition-all text-sm shadow-sm">
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

        <div class="bg-slate-900 rounded-[2.5rem] p-8 text-white grid grid-cols-12 gap-6 items-center">
          <div class="col-span-12 md:col-span-4">
             <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">05. Benefícios Adicionais</h3>
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

        <div class="flex items-center justify-between gap-3 pt-8 border-t border-gray-100">
          <Button variant="secondary" type="button" @click="router.push('/funcionarios')" class="!rounded-2xl !px-8">
            Cancelar
          </Button>

          <Button variant="primary" :loading="salvando" type="button" @click="salvar" class="!rounded-2xl !px-12 h-14 shadow-xl shadow-brand-primary/20">
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
  color: #e2e8f0 !important; /* texto principal */
}

.dark-check :deep(.text-slate-900),
.dark-check :deep(.text-slate-800),
.dark-check :deep(.text-slate-700) {
  color: #e2e8f0 !important;
}

.dark-check :deep(.text-slate-500),
.dark-check :deep(.text-slate-400) {
  color: #94a3b8 !important; /* texto secundário */
}
</style>




<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { FuncionarioService } from '@/services/index'

import { maskCPF, maskRG, maskTelefone, maskCEP, maskMoneyBR, onlyNumbers } from '@/utils/masks'
import { buscarCep, calcularCustoHora } from '@/utils/utils'
import { moedaParaNumero, numeroParaMoeda } from '@/utils/number'
import { upper, raw } from '@/utils/text'

const router = useRouter()
const route = useRoute()
const salvando = ref(false)
const loading = ref(false)


const paramId = computed(() => String(route.params.id || 'novo'))
const isEditing = computed(() => paramId.value !== 'novo')
const id = computed(() => (isEditing.value ? paramId.value.replace(/\D/g, '') : null))

const fmtDate = (d) => (d ? String(d).split('T')[0] : '')

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
    horario_entrada_1: '',
    horario_saida_1: '',
    horario_entrada_2: '',
    horario_saida_2: '',
    forma_pagamento: 'DINHEIRO',
    data_pagamento: '',
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
  get: () => numeroParaMoeda(form.value.salario_base || 0),
  set: (v) => (form.value.salario_base = moedaParaNumero(v)),
})

const salarioAdicionalUi = computed({
  get: () => numeroParaMoeda(form.value.salario_adicional || 0),
  set: (v) => (form.value.salario_adicional = moedaParaNumero(v)),
})

const valeUi = computed({
  get: () => numeroParaMoeda(form.value.vale || 0),
  set: (v) => (form.value.vale = moedaParaNumero(v)),
})

const valeTransporteUi = computed({
  get: () => numeroParaMoeda(form.value.vale_transporte || 0),
  set: (v) => (form.value.vale_transporte = moedaParaNumero(v)),
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

function recalcularCustoHora() {
  console.log('DEBUG', {
  salario_base: form.value.salario_base,
  adicional: form.value.salario_adicional,
  total: (form.value.salario_base || 0) + (form.value.salario_adicional || 0),
  custo: calcularCustoHora((form.value.salario_base || 0) + (form.value.salario_adicional || 0)),
})

  form.value.custo_hora = calcularCustoHora((form.value.salario_base || 0) + (form.value.salario_adicional || 0))
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


/* ======= carregar ======= */
async function carregar() {
  loading.value = true
  try {
    if (!isEditing.value) {
      form.value = novoForm()
      recalcularCustoHora()
      return
    }

    const { data } = await FuncionarioService.buscar(id.value)
    form.value = {
      ...novoForm(),
      ...data,
      data_nascimento: fmtDate(data.data_nascimento),
      admissao: fmtDate(data.admissao),
      demissao: fmtDate(data.demissao),
      data_pagamento: fmtDate(data.data_pagamento),
    }
    recalcularCustoHora()
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
  data_pagamento: form.value.data_pagamento || null,
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
