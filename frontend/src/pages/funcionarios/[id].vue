<template>
  <div class="page-container">
    <Card style="margin-bottom: 24px;">
      <!-- TOPO: título + voltar -->
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Editar Funcionário</h2>
          <p class="cell-muted">{{ form.nome || 'Carregando...' }}</p>
        </div>

        <Button variant="secondary" @click="router.push('/funcionarios')">Voltar</Button>
      </header>

      <!-- BODY: conteúdo -->
      <div class="card-body">
        <div v-if="carregandoDados" style="text-align: center; padding: 60px 0;">
          <div class="spinner" style="margin: 0 auto 15px;"></div>
          <p class="cell-muted">Buscando informações do colaborador...</p>
        </div>

        <template v-else>
          <div class="form-grid">
            <!-- =======================
                 1. INFORMAÇÕES PESSOAIS
            ======================== -->
            <div class="col-span-12">
              <h3 class="card-title" style="font-size: 1.05rem;">1. Informações Pessoais</h3>
            </div>

            <div class="col-span-6">
              <Input v-model="form.nome" label="Nome Completo *" required />
            </div>

            <div class="col-span-3">
              <Input v-model="cpfMask" label="CPF *" disabled hint="CPF não editável" />
            </div>

            <div class="col-span-3">
              <Input v-model="rgMask" label="RG" />
            </div>

            <div class="col-span-4">
              <Input v-model="whatsappMask" label="WhatsApp" />
            </div>

            <div class="col-span-4">
              <Input v-model="telefoneMask" label="Telefone" />
            </div>

            <div class="col-span-4">
              <Input v-model="form.email" label="E-mail" type="email" />
            </div>

            <div class="col-span-4">
              <Input v-model="form.estado_civil" label="Estado Civil" />
            </div>

            <div class="col-span-4">
              <Input v-model="form.escolaridade" label="Escolaridade" />
            </div>

            <div class="col-span-4">
              <Input v-model="form.data_nascimento" label="Data de Nascimento" type="date" />
            </div>

            <div class="form-divider"></div>

            <!-- ENDEREÇO (PADRÃO FIXO) -->
            <div class="col-span-12">
              <h3 class="card-title" style="font-size: 1.05rem;">Endereço</h3>
            </div>

            <div class="col-span-3">
              <Input v-model="cepMask" label="CEP" />
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

            <div class="form-divider"></div>

            <!-- PAGAMENTO -->
            <div class="col-span-4">
              <Input
                v-model="form.forma_pagamento"
                label="Forma de Pagamento"
                placeholder="PIX / TRANSFERENCIA / DINHEIRO"
              />
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
                <Input
                  v-model="form.pix_tipo_chave"
                  label="Tipo da Chave PIX"
                  placeholder="CPF / CNPJ / EMAIL / TELEFONE / ALEATORIA"
                />
              </div>
              <div class="col-span-8">
                <Input v-model="form.pix_chave" label="Chave PIX" />
              </div>
            </template>

            <div class="form-divider"></div>

            <!-- BENEFÍCIOS -->
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
        </template>
      </div>
    </Card>

    <!-- RODAPÉ: ações lado direito -->
    <footer style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 30px; padding-bottom: 40px;">
      <Button variant="secondary" @click="router.push('/funcionarios')">Descartar</Button>
      <Button variant="primary" :loading="salvando" @click="atualizar">Salvar Alterações</Button>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'
import { maskCPF, maskRG, maskTelefone, maskCEP, maskMoneyBR, onlyNumbers } from '@/utils/masks'
import { buscarCep, calcularCustoHora } from '@/utils/utils'

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

const router = useRouter()
const route = useRoute()

const salvando = ref(false)
const carregandoDados = ref(true)

const form = ref({
  // pessoais
  nome: '',
  cpf: '',
  rg: '',
  telefone: '',
  whatsapp: '',
  email: '',
  estado_civil: '',
  escolaridade: '',
  data_nascimento: '',

  // endereço
  cep: '',
  endereco: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',

  // empresa/horários (4 horários)
  setor: '',
  cargo: '',
  registro: '',
  horario_entrada_1: '',
  horario_saida_1: '',
  horario_entrada_2: '',
  horario_saida_2: '',

  // financeiro
  salario_base: 0,
  custo_hora: 0,
  admissao: '',
  demissao: '',

  // pagamento
  forma_pagamento: '',
  data_pagamento: '',
  banco: '',
  agencia: '',
  conta: '',
  pix_tipo_chave: '',
  pix_chave: '',

  // benefícios
  tem_vale: false,
  vale: 0,
  tem_vale_transporte: false,
  vale_transporte: 0
})

// ===== masks =====
const cpfMask = computed(() => maskCPF(form.value.cpf || ''))

const rgMask = computed({
  get: () => maskRG(form.value.rg || ''),
  set: (val) => (form.value.rg = val)
})

const whatsappMask = computed({
  get: () => maskTelefone(form.value.whatsapp || ''),
  set: (val) => (form.value.whatsapp = val)
})

const telefoneMask = computed({
  get: () => maskTelefone(form.value.telefone || ''),
  set: (val) => (form.value.telefone = val)
})

const cepMask = computed({
  get: () => maskCEP(form.value.cep || ''),
  set: (val) => (form.value.cep = val)
})

// ===== money =====
const salarioBaseMask = computed({
  get: () => maskMoneyBR(form.value.salario_base || 0),
  set: (val) => {
    const v = Number(onlyNumbers(val)) / 100
    form.value.salario_base = v
    form.value.custo_hora = calcularCustoHora(v)
  }
})

const custoHoraMask = computed({
  get: () => maskMoneyBR(form.value.custo_hora || 0),
  set: (val) => (form.value.custo_hora = Number(onlyNumbers(val)) / 100)
})

const valeMask = computed({
  get: () => maskMoneyBR(form.value.vale || 0),
  set: (val) => (form.value.vale = Number(onlyNumbers(val)) / 100)
})

const valeTransporteMask = computed({
  get: () => maskMoneyBR(form.value.vale_transporte || 0),
  set: (val) => (form.value.vale_transporte = Number(onlyNumbers(val)) / 100)
})

// ===== CEP auto =====
watch(
  () => onlyNumbers(form.value.cep),
  async (n) => {
    if (!n || n.length !== 8) return
    const d = await buscarCep(n)
    if (!d) return

    form.value.endereco = d.logradouro || form.value.endereco
    form.value.bairro = d.bairro || form.value.bairro
    form.value.cidade = d.localidade || d.municipio || form.value.cidade
    form.value.estado = d.uf || form.value.estado
  }
)

// ===== benefícios: limpar ao desmarcar =====
watch(() => form.value.tem_vale, (v) => { if (!v) form.value.vale = 0 })
watch(() => form.value.tem_vale_transporte, (v) => { if (!v) form.value.vale_transporte = 0 })

// ===== load =====
async function buscarDados() {
  try {
    const { data } = await api.get(`/funcionarios/${route.params.id}`)

    if (data.data_nascimento) data.data_nascimento = String(data.data_nascimento).split('T')[0]
    if (data.admissao) data.admissao = String(data.admissao).split('T')[0]
    if (data.demissao) data.demissao = String(data.demissao).split('T')[0]
    if (data.data_pagamento) data.data_pagamento = String(data.data_pagamento).split('T')[0]

    form.value = { ...form.value, ...data }
  } catch (err) {
    console.error(err)
    alert('Erro ao carregar funcionário')
    router.push('/funcionarios')
  } finally {
    carregandoDados.value = false
  }
}

// ===== save =====
async function atualizar() {
  if (!form.value.nome) return alert('O nome é obrigatório')

  salvando.value = true
  try {
    const payload = {
      ...form.value,
      rg: onlyNumbers(form.value.rg),
      whatsapp: onlyNumbers(form.value.whatsapp),
      telefone: onlyNumbers(form.value.telefone),
      cep: onlyNumbers(form.value.cep),

      data_nascimento: form.value.data_nascimento || null,
      admissao: form.value.admissao || null,
      demissao: form.value.demissao || null,
      data_pagamento: form.value.data_pagamento || null
    }

    // CPF não envia (não editável)
    delete payload.cpf

    await api.patch(`/funcionarios/${route.params.id}`, payload)

    alert('Dados atualizados com sucesso!')
    router.push('/funcionarios')
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.error || 'Erro ao atualizar dados')
  } finally {
    salvando.value = false
  }
}

onMounted(buscarDados)
</script>