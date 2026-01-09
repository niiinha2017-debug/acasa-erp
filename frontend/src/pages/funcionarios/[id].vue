<template>
  <div class="page-container">
    <Card style="margin-bottom: 24px;">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Editar Funcionário</h2>
          <p class="cell-muted">Atualize as informações do colaborador</p>
        </div>
        <Button variant="secondary" @click="router.push('/funcionarios')">Voltar</Button>
      </header>

      <div class="card-body">
        <div class="form-grid">
          <div class="col-span-12">
            <h3 class="card-title" style="font-size: 1.05rem;">1. Informações Pessoais</h3>
          </div>

          <div class="col-span-6"><Input v-model="form.nome" label="Nome Completo *" class="uppercase-field" /></div>
          <div class="col-span-3"><Input v-model="cpfUi" label="CPF *" /></div>
          <div class="col-span-3"><Input v-model="rgUi" label="RG" /></div>
          <div class="col-span-4"><Input v-model="whatsappUi" label="WhatsApp" /></div>
          <div class="col-span-4"><Input v-model="telefoneUi" label="Telefone" /></div>
          <div class="col-span-4"><Input v-model="form.email" label="E-mail" type="email" /></div>
          <div class="col-span-4"><Input v-model="form.estado_civil" label="Estado Civil" class="uppercase-field" /></div>
          <div class="col-span-4"><Input v-model="form.escolaridade" label="Escolaridade" class="uppercase-field" /></div>
          <div class="col-span-4"><Input v-model="form.data_nascimento" label="Data de Nascimento" type="date" /></div>

          <div class="form-divider"></div>

          <div class="col-span-12"><h3 class="card-title" style="font-size: 1.05rem;">Endereço</h3></div>
          <div class="col-span-3"><Input v-model="cepUi" label="CEP" /></div>
          <div class="col-span-7"><Input v-model="form.endereco" label="Endereço" class="uppercase-field" /></div>
          <div class="col-span-2"><Input v-model="form.numero" label="Nº" class="uppercase-field" /></div>
          <div class="col-span-5"><Input v-model="form.bairro" label="Bairro" class="uppercase-field" /></div>
          <div class="col-span-5"><Input v-model="form.cidade" label="Cidade" class="uppercase-field" /></div>
          <div class="col-span-2"><Input v-model="form.estado" label="UF" class="uppercase-field" /></div>

          <div class="form-divider"></div>

          <div class="col-span-12"><h3 class="card-title" style="font-size: 1.05rem;">2. Empresa e Horários</h3></div>
          <div class="col-span-4"><Input v-model="form.setor" label="Setor" class="uppercase-field" /></div>
          <div class="col-span-4"><Input v-model="form.cargo" label="Cargo" class="uppercase-field" /></div>
          <div class="col-span-4"><Input v-model="form.registro" label="Matrícula" class="uppercase-field" /></div>

          <div class="col-span-3"><Input v-model="form.horario_entrada_1" label="Entrada (1)" type="time" /></div>
          <div class="col-span-3"><Input v-model="form.horario_saida_1" label="Saída (1)" type="time" /></div>
          <div class="col-span-3"><Input v-model="form.horario_entrada_2" label="Entrada (2)" type="time" /></div>
          <div class="col-span-3"><Input v-model="form.horario_saida_2" label="Saída (2)" type="time" /></div>

          <div class="form-divider"></div>

          <div class="col-span-12"><h3 class="card-title" style="font-size: 1.05rem;">3. Financeiro</h3></div>
          <div class="col-span-3"><Input v-model="salarioBaseUi" label="Salário Base (R$)" @blur="syncFinanceiro" /></div>
          <div class="col-span-3"><Input v-model="custoHoraUi" label="Custo Hora (Auto)" disabled /></div>
          <div class="col-span-3"><Input v-model="form.admissao" label="Data Admissão" type="date" /></div>
          <div class="col-span-3"><Input v-model="form.demissao" label="Data Demissão" type="date" /></div>

          <div class="col-span-4"><Input v-model="form.forma_pagamento" label="Forma de Pagamento" class="uppercase-field" /></div>
          <div class="col-span-4"><Input v-model="form.banco" label="Banco" class="uppercase-field" /></div>
          
          <template v-if="form.forma_pagamento === 'PIX'">
            <div class="col-span-4"><Input v-model="form.pix_tipo_chave" label="Tipo Chave" class="uppercase-field" /></div>
            <div class="col-span-8"><Input v-model="form.pix_chave" label="Chave PIX" /></div>
          </template>

          <template v-if="form.forma_pagamento === 'TRANSFERENCIA'">
            <div class="col-span-4"><Input v-model="form.agencia" label="Agência" class="uppercase-field" /></div>
            <div class="col-span-4"><Input v-model="form.conta" label="Conta" class="uppercase-field" /></div>
          </template>

          <div class="form-divider"></div>

          <div class="col-span-12 check-row">
            <label><input type="checkbox" v-model="form.tem_vale" /> Vale</label>
            <label><input type="checkbox" v-model="form.tem_vale_transporte" /> Vale Transporte</label>
          </div>
          <div class="col-span-3" v-if="form.tem_vale"><Input v-model="valeUi" label="Valor Vale" @blur="syncFinanceiro" /></div>
          <div class="col-span-3" v-if="form.tem_vale_transporte"><Input v-model="valeTransporteUi" label="Valor VT" @blur="syncFinanceiro" /></div>
        </div>
      </div>
    </Card>

    <footer class="form-actions">
      <Button variant="secondary" @click="router.push('/funcionarios')">Cancelar</Button>
      <Button variant="primary" :loading="salvando" @click="salvar">Salvar Alterações</Button>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'

import { maskCPF, maskRG, maskTelefone, maskCEP, onlyNumbers, maskMoneyBR } from '@/utils/masks'
import { buscarCep, calcularCustoHora } from '@/utils/utils'
import { moedaParaNumero, numeroParaMoeda } from '@/utils/number'

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

const router = useRouter()
const route = useRoute()
const id = route.params.id // Pega o ID da URL
const salvando = ref(false)

const form = ref({
  nome: '', cpf: '', rg: '', telefone: '', whatsapp: '', email: '',
  estado_civil: '', escolaridade: '', data_nascimento: '',
  cep: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '',
  setor: '', cargo: '', registro: '',
  horario_entrada_1: '', horario_saida_1: '', horario_entrada_2: '', horario_saida_2: '',
  salario_base: 0, custo_hora: 0, admissao: '', demissao: '',
  forma_pagamento: '', banco: '', agencia: '', conta: '',
  pix_tipo_chave: '', pix_chave: '',
  tem_vale: false, vale: 0, tem_vale_transporte: false, vale_transporte: 0,
})

const cpfUi = ref(''); const rgUi = ref(''); const whatsappUi = ref(''); 
const telefoneUi = ref(''); const cepUi = ref('');
const salarioBaseUi = ref('0,00'); const custoHoraUi = ref('0,00');
const valeUi = ref('0,00'); const valeTransporteUi = ref('0,00');

// Busca dados iniciais
onMounted(async () => {
  try {
    const { data } = await api.get(`/funcionarios/${id}`)
    form.value = { ...data }
    
    // Atualiza as UIs para as máscaras funcionarem
    cpfUi.value = data.cpf || ''
    rgUi.value = data.rg || ''
    whatsappUi.value = data.whatsapp || ''
    telefoneUi.value = data.telefone || ''
    cepUi.value = data.cep || ''
    
    salarioBaseUi.value = numeroParaMoeda(data.salario_base || 0)
    valeUi.value = numeroParaMoeda(data.vale || 0)
    valeTransporteUi.value = numeroParaMoeda(data.vale_transporte || 0)
    
    syncFinanceiro()
  } catch (err) {
    alert('Erro ao carregar dados do funcionário')
    router.push('/funcionarios')
  }
})

// Maiúsculas automáticas
const fieldsToUpper = ['nome', 'estado_civil', 'escolaridade', 'endereco', 'bairro', 'cidade', 'estado', 'setor', 'cargo', 'registro', 'forma_pagamento', 'banco']
fieldsToUpper.forEach(f => {
  watch(() => form.value[f], (v) => { if (v) form.value[f] = v.toUpperCase() })
})

// Watchers de Máscaras
watch(cpfUi, (v) => { cpfUi.value = maskCPF(v); form.value.cpf = onlyNumbers(v) })
watch(rgUi, (v) => { rgUi.value = maskRG(v); form.value.rg = onlyNumbers(v) })
watch(whatsappUi, (v) => { whatsappUi.value = maskTelefone(v); form.value.whatsapp = onlyNumbers(v) })
watch(telefoneUi, (v) => { telefoneUi.value = maskTelefone(v); form.value.telefone = onlyNumbers(v) })
watch(cepUi, (v) => { 
  cepUi.value = maskCEP(v); 
  form.value.cep = onlyNumbers(v);
  if (form.value.cep.length === 8) handleCep(form.value.cep)
})

// Dinheiro real-time
watch(salarioBaseUi, (v) => salarioBaseUi.value = maskMoneyBR(v))
watch(valeUi, (v) => valeUi.value = maskMoneyBR(v))
watch(valeTransporteUi, (v) => valeTransporteUi.value = maskMoneyBR(v))

function syncFinanceiro() {
  form.value.salario_base = moedaParaNumero(salarioBaseUi.value) || 0
  form.value.vale = moedaParaNumero(valeUi.value) || 0
  form.value.vale_transporte = moedaParaNumero(valeTransporteUi.value) || 0
  form.value.custo_hora = calcularCustoHora(form.value.salario_base)
  custoHoraUi.value = numeroParaMoeda(form.value.custo_hora)
}

async function handleCep(n) {
  const d = await buscarCep(n)
  if (d) {
    form.value.endereco = d.logradouro || ''; form.value.bairro = d.bairro || ''
    form.value.cidade = d.localidade || ''; form.value.estado = d.uf || ''
  }
}

async function salvar() {
  salvando.value = true
  try {
    syncFinanceiro()
    const payload = { ...form.value, email: form.value.email?.toLowerCase().trim() || null }
    await api.put(`/funcionarios/${id}`, payload)
    alert('Atualizado com sucesso!')
    router.push('/funcionarios')
  } catch (err) {
    alert(err.response?.data?.error || 'Erro ao atualizar')
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 30px; padding-bottom: 40px; }
.check-row { display: flex; gap: 20px; align-items: center; margin: 10px 0; }
.check-row label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500; }
:deep(.uppercase-field input) { text-transform: uppercase !important; }
</style>