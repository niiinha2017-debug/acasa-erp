<template>
  <div class="w-full">
    <Card :shadow="true">
      <!-- HEADER -->
      <div class="flex flex-col gap-4 px-8 pt-8 pb-6 border-b border-gray-100">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight uppercase">
              {{ isEditing ? 'Editar' : 'Novo' }} Funcionário
            </h2>
          </div>

          <Button
            variant="outline"
            size="sm"
            type="button"
            @click="router.push('/funcionarios')"
          >
            Voltar
          </Button>
        </div>
      </div>

      <!-- BODY -->
      <div class="p-8">
        <div class="grid grid-cols-12 gap-6">
          <!-- 1. Informações Pessoais -->
          <div class="col-span-12">
            <div class="pb-3 mb-4 border-b border-gray-100">
              <h3 class="text-sm font-black text-gray-900 tracking-tight uppercase">
                1. Informações Pessoais
              </h3>
            </div>
          </div>

          <div class="col-span-12 md:col-span-6">
            <Input v-model="form.nome" label="Nome Completo" required />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="cpfUi" label="CPF" required />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="rgUi" label="RG" />
          </div>

          <div class="col-span-12 md:col-span-4">
            <Input v-model="form.email" label="E-mail" />
          </div>
          <div class="col-span-12 md:col-span-4">
            <Input v-model="whatsappUi" label="WhatsApp" />
          </div>
          <div class="col-span-12 md:col-span-4">
            <Input v-model="form.data_nascimento" label="Data Nascimento" type="date" />
          </div>

          <div class="col-span-12 md:col-span-6">
            <Input v-model="form.estado_civil" label="Estado Civil" />
          </div>
          <div class="col-span-12 md:col-span-6">
            <Input v-model="form.escolaridade" label="Escolaridade" />
          </div>

          <div class="col-span-12">
            <div class="h-px bg-gray-100 my-2"></div>
          </div>

          <!-- 2. Endereço -->
          <div class="col-span-12">
            <div class="pb-3 mb-4 border-b border-gray-100">
              <h3 class="text-sm font-black text-gray-900 tracking-tight uppercase">
                2. Endereço
              </h3>
            </div>
          </div>

          <div class="col-span-12 md:col-span-3">
            <Input v-model="cepUi" label="CEP" />
          </div>
          <div class="col-span-12 md:col-span-7">
            <Input v-model="form.endereco" label="Rua/Logradouro" />
          </div>
          <div class="col-span-12 md:col-span-2">
            <Input v-model="form.numero" label="Nº" />
          </div>

          <div class="col-span-12 md:col-span-4">
            <Input v-model="form.complemento" label="Complemento" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.bairro" label="Bairro" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.cidade" label="Cidade" />
          </div>
          <div class="col-span-12 md:col-span-2">
            <Input v-model="form.estado" label="UF" />
          </div>

          <div class="col-span-12">
            <div class="h-px bg-gray-100 my-2"></div>
          </div>

          <!-- 3. Dados da Empresa e Horários -->
          <div class="col-span-12">
            <div class="pb-3 mb-4 border-b border-gray-100">
              <h3 class="text-sm font-black text-gray-900 tracking-tight uppercase">
                3. Dados da Empresa e Horários
              </h3>
            </div>
          </div>

          <div class="col-span-12 md:col-span-4">
            <Input v-model="form.setor" label="Setor" />
          </div>
          <div class="col-span-12 md:col-span-4">
            <Input v-model="form.cargo" label="Cargo" />
          </div>
          <div class="col-span-12 md:col-span-4">
            <Input v-model="form.funcao" label="Função" />
          </div>

          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.registro" label="Nº Registro" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.admissao" label="Data Admissão" type="date" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.demissao" label="Data Demissão" type="date" />
          </div>

          <!-- tempo de casa: NÃO vira card, só uma linha neutra -->
          <div class="col-span-12 md:col-span-3" v-if="form.admissao">
            <div class="h-full flex items-center">
              <div class="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm">
                <span class="font-black text-gray-900">Tempo Casa:</span>
                <span class="ml-2 font-semibold text-gray-500">{{ tempoServico }}</span>
              </div>
            </div>
          </div>

          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.horario_entrada_1" label="Entrada 1" type="time" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.horario_saida_1" label="Saída 1" type="time" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.horario_entrada_2" label="Entrada 2" type="time" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.horario_saida_2" label="Saída 2" type="time" />
          </div>

          <div class="col-span-12">
            <div class="h-px bg-gray-100 my-2"></div>
          </div>

          <!-- 4. Financeiro e Pagamento -->
          <div class="col-span-12">
            <div class="pb-3 mb-4 border-b border-gray-100">
              <h3 class="text-sm font-black text-gray-900 tracking-tight uppercase">
                4. Financeiro e Pagamento
              </h3>
            </div>
          </div>

          <div class="col-span-12 md:col-span-3">
            <Input v-model="salarioBaseUi" label="Salário Base" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="salarioAdicionalUi" label="Adicional" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.data_pagamento" label="Data Pagto Padrão" type="date" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input :model-value="custoHoraExibicao" label="Custo Hora (Calculado)" disabled />
          </div>

          <div class="col-span-12 md:col-span-4">
            <label class="block text-xs font-black uppercase tracking-[0.18em] text-gray-500 mb-2">
              Forma de Pagamento
            </label>
            <select
              v-model="form.forma_pagamento"
              class="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              <option value="DINHEIRO">DINHEIRO</option>
              <option value="PIX">PIX</option>
              <option value="TRANSFERENCIA">TRANSFERÊNCIA</option>
            </select>
          </div>

          <div class="col-span-12 md:col-span-8">
            <Input v-model="form.banco" label="Banco" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.agencia" label="Agência" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.conta" label="Conta" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.pix_tipo_chave" label="Tipo Chave PIX" />
          </div>
          <div class="col-span-12 md:col-span-3">
            <Input v-model="form.pix_chave" label="Chave PIX" />
          </div>

          <!-- checkboxes: neutro, sem “card” visual -->
          <div class="col-span-12">
            <div class="rounded-2xl border border-gray-100 bg-white p-4 flex flex-wrap gap-8 items-center">
              <label class="flex items-center gap-2 text-sm font-black text-gray-700">
                <input
                  type="checkbox"
                  v-model="form.tem_vale"
                  class="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
                />
                Tem Vale
              </label>

              <label class="flex items-center gap-2 text-sm font-black text-gray-700">
                <input
                  type="checkbox"
                  v-model="form.tem_vale_transporte"
                  class="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
                />
                Tem VT
              </label>
            </div>
          </div>

          <div class="col-span-12 md:col-span-6" v-if="form.tem_vale">
            <Input v-model="valeUi" label="Valor Vale" />
          </div>
          <div class="col-span-12 md:col-span-6" v-if="form.tem_vale_transporte">
            <Input v-model="valeTransporteUi" label="Valor VT" />
          </div>
        </div>

        <!-- FOOTER -->
        <div class="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <Button variant="primary" :loading="salvando" type="button" @click="salvar">
            Salvar Dados
          </Button>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

/* ✅ COMPONENTES (obrigatório) */
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

/* ✅ SEU SERVICE */
import { FuncionarioService } from '@/services'

/* ✅ máscaras e util */
import { maskCPF, maskRG, maskTelefone, maskCEP, maskMoneyBR, onlyNumbers } from '@/utils/masks'
import { buscarCep, calcularCustoHora } from '@/utils/utils'
import { moedaParaNumero, numeroParaMoeda } from '@/utils/number'
import { upper, raw } from '@/utils/text'

const router = useRouter()
const route = useRoute()
const salvando = ref(false)

/* =========================
   NOVO vs EDITAR
========================= */
const paramId = computed(() => String(route.params.id || 'novo'))
const isEditing = computed(() => paramId.value !== 'novo')
const id = computed(() => (isEditing.value ? paramId.value.replace(/\D/g, '') : null))

/* =========================
   FORM (defaults)
   (date/time como '' pra Input type=date/time)
========================= */
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
    banco: '',
    agencia: '',
    conta: '',
    pix_tipo_chave: '',
    pix_chave: '',

    data_pagamento: ''
  }
}

const form = ref(novoForm())

/* =========================
   UI refs (máscaras)
========================= */
const cpfUi = ref('')
const rgUi = ref('')
const whatsappUi = ref('')
const telefoneUi = ref('')
const cepUi = ref('')

const salarioBaseUi = ref('0,00')
const salarioAdicionalUi = ref('0,00')
const valeUi = ref('0,00')
const valeTransporteUi = ref('0,00')

/* =========================
   Computeds
========================= */
const custoHoraExibicao = computed(() => numeroParaMoeda(form.value.custo_hora))

const tempoServico = computed(() => {
  if (!form.value.admissao) return '---'
  const inicio = new Date(form.value.admissao)
  const fim = form.value.demissao ? new Date(form.value.demissao) : new Date()
  if (Number.isNaN(inicio.getTime())) return '---'

  let anos = fim.getFullYear() - inicio.getFullYear()
  let meses = fim.getMonth() - inicio.getMonth()
  if (meses < 0) {
    anos--
    meses += 12
  }
  return anos > 0 ? `${anos} anos e ${meses} meses` : `${meses} meses`
})

/* =========================
   Helpers
========================= */
const fmtDate = (d) => (d ? String(d).split('T')[0] : '')

function syncFinanceiro() {
  form.value.salario_base = moedaParaNumero(salarioBaseUi.value)
  form.value.salario_adicional = moedaParaNumero(salarioAdicionalUi.value)
  form.value.vale = moedaParaNumero(valeUi.value)
  form.value.vale_transporte = moedaParaNumero(valeTransporteUi.value)

  form.value.custo_hora = calcularCustoHora(form.value.salario_base + form.value.salario_adicional)
}

function preencherUIComForm() {
  cpfUi.value = form.value.cpf ? maskCPF(form.value.cpf) : ''
  rgUi.value = form.value.rg || ''
  whatsappUi.value = form.value.whatsapp ? maskTelefone(form.value.whatsapp) : ''
  telefoneUi.value = form.value.telefone ? maskTelefone(form.value.telefone) : ''
  cepUi.value = form.value.cep ? maskCEP(form.value.cep) : ''

  salarioBaseUi.value = numeroParaMoeda(form.value.salario_base || 0)
  salarioAdicionalUi.value = numeroParaMoeda(form.value.salario_adicional || 0)
  valeUi.value = numeroParaMoeda(form.value.vale || 0)
  valeTransporteUi.value = numeroParaMoeda(form.value.vale_transporte || 0)
}

/* =========================
   Carregar (novo vs editar)
========================= */
async function carregar() {
  if (!isEditing.value) {
    form.value = novoForm()
    preencherUIComForm()
    syncFinanceiro()
    return
  }

  try {
    const { data } = await FuncionarioService.buscar(id.value)

    form.value = {
      ...novoForm(),
      ...data,
      data_nascimento: fmtDate(data.data_nascimento),
      admissao: fmtDate(data.admissao),
      demissao: fmtDate(data.demissao),
      data_pagamento: fmtDate(data.data_pagamento)
    }

    preencherUIComForm()
    syncFinanceiro()
  } catch (err) {
    router.push('/funcionarios')
  }
}

onMounted(carregar)

/* 🔥 importante com auto-routes: muda id sem reload */
watch(() => paramId.value, () => carregar())

/* =========================
   WATCHERS (máscaras)
========================= */
watch(cpfUi, (v) => {
  cpfUi.value = maskCPF(v)
  form.value.cpf = onlyNumbers(cpfUi.value)
})

watch(rgUi, (v) => {
  rgUi.value = maskRG(v)
  form.value.rg = raw(rgUi.value)
})

watch(whatsappUi, (v) => {
  whatsappUi.value = maskTelefone(v)
  form.value.whatsapp = onlyNumbers(whatsappUi.value)
})

watch(telefoneUi, (v) => {
  telefoneUi.value = maskTelefone(v)
  form.value.telefone = onlyNumbers(telefoneUi.value)
})

watch(cepUi, async (v) => {
  cepUi.value = maskCEP(v)
  form.value.cep = onlyNumbers(cepUi.value)

  if (form.value.cep.length === 8) {
    const d = await buscarCep(form.value.cep)
    if (d) {
      form.value.endereco = upper(d.logradouro)
      form.value.bairro = upper(d.bairro)
      form.value.cidade = upper(d.localidade)
      form.value.estado = upper(d.uf)
    }
  }
})

watch(salarioBaseUi, (v) => {
  salarioBaseUi.value = maskMoneyBR(v)
  syncFinanceiro()
})

watch(salarioAdicionalUi, (v) => {
  salarioAdicionalUi.value = maskMoneyBR(v)
  syncFinanceiro()
})

watch(valeUi, (v) => {
  valeUi.value = maskMoneyBR(v)
  syncFinanceiro()
})

watch(valeTransporteUi, (v) => {
  valeTransporteUi.value = maskMoneyBR(v)
  syncFinanceiro()
})

/* =========================
   SALVAR (usa SEU service)
   - novo: POST /funcionarios
   - editar: PUT /funcionarios/:id
========================= */
async function salvar() {
  if (!form.value.nome || String(form.value.cpf || '').length < 11) {
    return alert('Nome e CPF obrigatórios.')
  }

  salvando.value = true
  try {
    syncFinanceiro()

    const payload = {
      ...form.value,
      email: raw(form.value.email ? String(form.value.email).toLowerCase().trim() : '')
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

