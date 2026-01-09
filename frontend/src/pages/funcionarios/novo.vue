<template>
  <div class="page-container">
<Card style="margin-bottom: 24px;">
  <header class="card-header header-between">
    <div>
      <h2 class="card-title">Cadastro de Funcionário</h2>
      <p class="cell-muted">A Casa - Gestão de Colaboradores</p>
    </div>

    <Button variant="secondary" @click="router.push('/funcionarios')">← Voltar</Button>
  </header>
      <div class="card-body">
        <div class="form-grid">

          <!-- =======================
               1. INFORMAÇÕES PESSOAIS
          ======================== -->
          <div class="col-span-12">
            <h3 class="card-title" style="font-size: 1.05rem;">1. Informações Pessoais</h3>
          </div>

          <div class="col-span-6">
            <Input v-model="form.nome" label="Nome Completo *" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.cpf" label="CPF *" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.rg" label="RG" />
          </div>

          <div class="col-span-4">
            <Input v-model="form.whatsapp" label="WhatsApp" />
          </div>
          <div class="col-span-4">
            <Input v-model="form.email" label="E-mail" />
          </div>
          <div class="col-span-4">
            <Input v-model="form.estado_civil" label="Estado Civil" />
          </div>

          <div class="col-span-4">
            <Input v-model="form.data_nascimento" label="Data de Nascimento" type="date" />
          </div>
          <div class="col-span-4">
            <Input v-model="form.telefone" label="Telefone" />
          </div>
          <div class="col-span-4">
            <Input v-model="form.escolaridade" label="Escolaridade" />
          </div>

          <!-- divisor leve -->
          <div class="form-divider"></div>

          <!-- ENDEREÇO (PADRÃO FIXO) -->
          <div class="col-span-12">
            <h3 class="card-title" style="font-size: 1.05rem;">Endereço</h3>
          </div>

          <div class="col-span-3">
            <Input v-model="form.cep" label="CEP" />
          </div>
          <div class="col-span-7">
            <Input v-model="form.endereco" label="Endereço" />
          </div>
          <div class="col-span-2">
            <Input v-model="form.numero" label="Nº" />
          </div>

          <div class="col-span-5">
            <Input v-model="form.bairro" label="Bairro" />
          </div>
          <div class="col-span-5">
            <Input v-model="form.cidade" label="Cidade" />
          </div>
          <div class="col-span-2">
            <Input v-model="form.estado" label="UF" />
          </div>

          <!-- divisor -->
          <div class="form-divider"></div>

          <!-- =======================
               2. EMPRESA E HORÁRIOS
          ======================== -->
          <div class="col-span-12">
            <h3 class="card-title" style="font-size: 1.05rem;">2. Empresa e Horários</h3>
          </div>

          <div class="col-span-4"><Input v-model="form.setor" label="Setor" /></div>
          <div class="col-span-4"><Input v-model="form.cargo" label="Cargo" /></div>
          <div class="col-span-4"><Input v-model="form.registro" label="Matrícula" /></div>

          <div class="col-span-3">
            <Input v-model="form.horario_entrada_1" label="Entrada (1)" type="time" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.horario_saida_1" label="Saída (1) — Almoço" type="time" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.horario_entrada_2" label="Entrada (2) — Retorno" type="time" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.horario_saida_2" label="Saída (2)" type="time" />
          </div>

          <!-- divisor -->
          <div class="form-divider"></div>

          <!-- =======================
               3. FINANCEIRO
          ======================== -->
          <div class="col-span-12">
            <h3 class="card-title" style="font-size: 1.05rem;">3. Financeiro</h3>
          </div>

          <div class="col-span-3">
            <Input v-model="salarioBaseMask" label="Salário Base (R$)" />
          </div>
          <div class="col-span-3">
            <Input v-model="custoHoraMask" label="Custo Hora (Auto) (R$)" disabled />
          </div>
          <div class="col-span-3">
            <Input v-model="form.admissao" label="Data Admissão" type="date" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.demissao" label="Data Demissão" type="date" />
          </div>

          <!-- Pagamento -->
          <div class="form-divider"></div>

          <div class="col-span-4">
            <Input v-model="form.forma_pagamento" label="Forma de Pagamento" />
          </div>
          <div class="col-span-4">
            <Input v-model="form.data_pagamento" label="Data de Pagamento" type="date" />
          </div>
          <div class="col-span-4">
            <Input v-model="form.banco" label="Banco" />
          </div>

          <template v-if="form.forma_pagamento === 'TRANSFERENCIA'">
            <div class="col-span-4">
              <Input v-model="form.agencia" label="Agência" />
            </div>
            <div class="col-span-4">
              <Input v-model="form.conta" label="Conta" />
            </div>
            <div class="col-span-4"></div>
          </template>

          <template v-if="form.forma_pagamento === 'PIX'">
            <div class="col-span-4">
              <Input v-model="form.pix_tipo_chave" label="Tipo da Chave PIX" />
            </div>
            <div class="col-span-8">
              <Input v-model="form.pix_chave" label="Chave PIX" />
            </div>
          </template>

          <!-- Benefícios -->
          <div class="form-divider"></div>

          <div class="col-span-12 check-row">
            <label class="form-label" style="display:flex; align-items:center; gap:10px;">
              <input type="checkbox" v-model="form.tem_vale" />
              Vale
            </label>

            <label class="form-label" style="display:flex; align-items:center; gap:10px;">
              <input type="checkbox" v-model="form.tem_vale_transporte" />
              Vale Transporte
            </label>
          </div>

          <template v-if="form.tem_vale">
            <div class="col-span-3">
              <Input v-model="valeMask" label="Valor do Vale (R$)" />
            </div>
          </template>

          <template v-if="form.tem_vale_transporte">
            <div class="col-span-3">
              <Input v-model="valeTransporteMask" label="Vale Transporte (R$)" />
            </div>
          </template>

        </div>
      </div>
    </Card>

    <footer style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 30px; padding-bottom: 40px;">
      <Button variant="secondary" @click="router.push('/funcionarios')">Descartar</Button>
      <Button variant="primary" :loading="salvando" @click="salvar">Confirmar Cadastro</Button>
    </footer>
  </div>
</template>


<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { maskCPF, maskRG, maskTelefone, maskCEP, maskMoneyBR, onlyNumbers } from '@/utils/masks'
import { buscarCep, calcularCustoHora } from '@/utils/utils'

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

const router = useRouter()
const salvando = ref(false)

const form = ref({
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
  setor: '',
  cargo: '',
  funcao: '',

  // endereço
  cep: '',
  endereco: '',
  numero: '',
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
  vale: 0,

  // horários (4 horários)
  horario_entrada_1: '',
  horario_saida_1: '',
  horario_entrada_2: '',
  horario_saida_2: '',

  // pagamento
forma_pagamento: '',
data_pagamento: '',

banco: '',
agencia: '',
conta: '',
pix_tipo_chave: '',
pix_chave: '',

tem_vale: false,
vale: 0,

tem_vale_transporte: false,
vale_transporte: 0,


  // produção
  custo_hora_producao: 0,
})

// =====================
// MÁSCARAS / CÁLCULOS
// =====================
const salarioBaseMask = computed({
  get: () => maskMoneyBR(form.value.salario_base),
  set: (val) => {
    const v = Number(val.replace(/\D/g, '')) / 100
    form.value.salario_base = v
    form.value.custo_hora = calcularCustoHora(v)
    form.value.custo_hora_producao = calcularCustoHora(v)
  },
})

const custoHoraMask = computed({
  get: () => maskMoneyBR(form.value.custo_hora),
  set: (val) => (form.value.custo_hora = Number(val.replace(/\D/g, '')) / 100),
})

// =====================
// WATCHERS (CPF / WHATS / CEP)
// =====================
watch(() => form.value.cpf, (val) => {
  form.value.cpf = maskCPF(val)
})

watch(() => form.value.rg, (val) => {
  form.value.rg = maskRG(val)
})

watch(() => form.value.whatsapp, (val) => {
  form.value.whatsapp = maskTelefone(val)
})

watch(() => form.value.telefone, (val) => {
  form.value.telefone = maskTelefone(val)
})

watch(() => form.value.tem_vale, (v) => {
  if (!v) form.value.vale = 0
})

watch(() => form.value.tem_vale_transporte, (v) => {
  if (!v) form.value.vale_transporte = 0
})


watch(() => form.value.cep, async (val) => {
  const masked = maskCEP(val)
  form.value.cep = masked

  const n = onlyNumbers(masked)
  if (n.length === 8) {
    const d = await buscarCep(n)
    if (d) {
      form.value.endereco = d.logradouro
      form.value.bairro = d.bairro
      form.value.cidade = d.localidade
      form.value.estado = d.uf
    }
  }
})

// =====================
// SALVAR
// =====================
async function salvar() {
  if (!form.value.nome || !form.value.cpf) {
    return alert('Nome e CPF são obrigatórios')
  }

  salvando.value = true
  try {
const payload = {
  ...form.value,
  cpf: onlyNumbers(form.value.cpf),
  rg: onlyNumbers(form.value.rg),
  whatsapp: onlyNumbers(form.value.whatsapp),
  telefone: onlyNumbers(form.value.telefone),
  cep: onlyNumbers(form.value.cep),

  data_nascimento: form.value.data_nascimento || undefined,
  admissao: form.value.admissao || undefined,
  demissao: form.value.demissao || undefined,
  data_pagamento: form.value.data_pagamento || undefined,
}


    await api.post('/funcionarios', payload)
    router.push('/funcionarios')
  } catch (err) {
    alert(err?.response?.data?.message || err?.response?.data?.error || 'Erro ao salvar')
  } finally {
    salvando.value = false
  }
}
</script>
