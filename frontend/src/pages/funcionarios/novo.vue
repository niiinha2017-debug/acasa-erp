<template>
  <div class="page-container">
    <header class="header-between" style="margin-bottom: 20px;">
      <div>
        <h2 class="card-title">Cadastro de Funcionário</h2>
        <p class="cell-muted">Organize os dados pessoais e profissionais separadamente.</p>
      </div>
      <div class="header-actions" style="display: flex; gap: 10px;">
        <Button variant="secondary" @click="router.push('/funcionarios')">Cancelar</Button>
        <Button variant="primary" :loading="salvando" @click="salvar">Salvar Funcionário</Button>
      </div>
    </header>

    <Card style="margin-bottom: 24px;">
      <div class="card-header">
        <h3 class="card-title">1. Informações Pessoais e Residência</h3>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="col-span-6"><Input v-model="form.nome" label="Nome Completo *" required /></div>
          <div class="col-span-3"><Input v-model="form.cpf" label="CPF *" /></div>
          <div class="col-span-3"><Input v-model="form.rg" label="RG" /></div>
          
          <div class="col-span-4"><Input v-model="form.whatsapp" label="WhatsApp" /></div>
          <div class="col-span-4"><Input v-model="form.email" label="E-mail" type="email" /></div>
          <div class="col-span-4"><Input v-model="form.estado_civil" label="Estado Civil" /></div>

          <div class="col-span-2" style="margin-top: 15px;"><Input v-model="form.cep" label="CEP" /></div>
          <div class="col-span-8" style="margin-top: 15px;"><Input v-model="form.endereco" label="Endereço" /></div>
          <div class="col-span-2" style="margin-top: 15px;"><Input v-model="form.numero" label="Nº" /></div>
          
          <div class="col-span-5"><Input v-model="form.bairro" label="Bairro" /></div>
          <div class="col-span-5"><Input v-model="form.cidade" label="Cidade" /></div>
          <div class="col-span-2"><Input v-model="form.estado" label="UF" /></div>
        </div>
      </div>
    </Card>

    <Card>
      <div class="card-header">
        <h3 class="card-title">2. Contrato, Horários e Financeiro</h3>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="col-span-4"><Input v-model="form.setor" label="Setor" /></div>
          <div class="col-span-4"><Input v-model="form.cargo" label="Cargo" /></div>
          <div class="col-span-4"><Input v-model="form.registro" label="Matrícula/Registro" /></div>

          <div class="col-span-4" style="margin-top: 15px;"><Input v-model="form.horario_entrada" label="Entrada" type="time" /></div>
          <div class="col-span-4" style="margin-top: 15px;"><Input v-model="form.horario_almoco" label="Almoço" type="time" /></div>
          <div class="col-span-4" style="margin-top: 15px;"><Input v-model="form.horario_saida" label="Saída" type="time" /></div>

          <div class="col-span-12 section-divider" style="margin: 20px 0 10px 0; border-bottom: 1px solid var(--border-soft);"></div>
          
          <div class="col-span-3">
             <Input v-model="salarioBaseMask" label="Salário Base">
                <template #prefix><span style="padding-left: 8px;">R$</span></template>
             </Input>
          </div>
          <div class="col-span-3">
             <Input v-model="custoHoraMask" label="Custo Hora">
                <template #prefix><span style="padding-left: 8px;">R$</span></template>
             </Input>
          </div>
          <div class="col-span-3"><Input v-model="form.forma_pagamento" label="Forma de Pagamento" /></div>
          <div class="col-span-3"><Input v-model="form.admissao" label="Data Admissão" type="date" /></div>
          
          <div class="col-span-12" style="margin-top: 15px;">
            <Input v-model="form.conta_bancaria" label="Dados Bancários (Banco, Agência, Conta)" />
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup>
// CORREÇÃO AQUI: Adicionado o 'watch' no import
import { ref, computed, watch } from 'vue' 
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { maskMoneyBR } from '@/utils/masks'
import { buscarCep } from '@/utils/utils'

// Componentes
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

const router = useRouter()
const salvando = ref(false)

const form = ref({
  nome: '', cpf: '', rg: '', whatsapp: '', email: '', estado_civil: '',
  cep: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '',
  setor: '', cargo: '', registro: '',
  horario_entrada: '', horario_almoco: '', horario_saida: '',
  salario_base: 0, custo_hora: 0, forma_pagamento: '', conta_bancaria: '',
  admissao: ''
})

// Máscaras de Dinheiro
const salarioBaseMask = computed({
  get: () => maskMoneyBR(form.value.salario_base),
  set: (val) => form.value.salario_base = Number(val.replace(/\D/g, '')) / 100
})

const custoHoraMask = computed({
  get: () => maskMoneyBR(form.value.custo_hora),
  set: (val) => form.value.custo_hora = Number(val.replace(/\D/g, '')) / 100
})

// Monitorar CEP
watch(() => form.value.cep, async (val) => {
  if (!val) return
  const n = val.replace(/\D/g, '')
  if (n.length === 8) {
    const dadosEnd = await buscarCep(n)
    if (dadosEnd) {
      form.value.endereco = dadosEnd.logradouro
      form.value.bairro = dadosEnd.bairro
      // CORREÇÃO AQUI: era data.localidade, mudei para dadosEnd.localidade
      form.value.cidade = dadosEnd.localidade || dadosEnd.municipio 
      form.value.estado = dadosEnd.uf
      form.value.cep = n.replace(/(\d{5})(\d{3})/, '$1-$2')
    }
  }
})

// BÔNUS: Máscara de CPF automática
watch(() => form.value.cpf, (val) => {
  if (!val) return
  const n = val.replace(/\D/g, '')
  if (n.length <= 11) {
    form.value.cpf = n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
})

// BÔNUS: Máscara de WhatsApp automática
watch(() => form.value.whatsapp, (val) => {
  if (!val) return
  const n = val.replace(/\D/g, '')
  if (n.length <= 11) {
    form.value.whatsapp = n.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
})

async function salvar() {
  if (!form.value.nome || !form.value.cpf) {
    alert('Por favor, preencha o Nome e o CPF.')
    return
  }

  salvando.value = true
  try {
    // Limpamos as máscaras antes de enviar para o banco
    const payload = {
      ...form.value,
      cpf: form.value.cpf.replace(/\D/g, ''),
      whatsapp: form.value.whatsapp.replace(/\D/g, ''),
      cep: form.value.cep.replace(/\D/g, '')
    }
    
    await api.post('/funcionarios', payload)
    router.push('/funcionarios')
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.error || 'Erro ao salvar funcionário')
  } finally {
    salvando.value = false
  }
}
</script>