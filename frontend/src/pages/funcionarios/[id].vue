<template>
  <div class="page-container">
    <header class="header-between" style="margin-bottom: 20px;">
      <div>
        <h2 class="card-title">Editar Funcionário</h2>
        <p class="cell-muted">{{ form.nome || 'Carregando...' }}</p>
      </div>
      <div class="header-actions" style="display: flex; gap: 10px;">
        <Button variant="secondary" @click="router.push('/funcionarios')">Voltar</Button>
        <Button variant="primary" :loading="salvando" @click="atualizar">Salvar Alterações</Button>
      </div>
    </header>

    <div v-if="carregandoDados" style="text-align: center; padding: 100px;">
       <div class="spinner" style="margin: 0 auto 15px;"></div>
       <p class="cell-muted">Buscando informações do colaborador...</p>
    </div>

    <template v-else>
      <Card style="margin-bottom: 24px;">
        <div class="card-header"><h3 class="card-title">1. Informações Pessoais e Residência</h3></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="col-span-6"><Input v-model="form.nome" label="Nome Completo *" required /></div>
            <div class="col-span-3"><Input v-model="form.cpf" label="CPF *" disabled hint="CPF não editável" /></div>
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
        <div class="card-header"><h3 class="card-title">2. Contrato, Horários e Financeiro</h3></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="col-span-4"><Input v-model="form.setor" label="Setor" /></div>
            <div class="col-span-4"><Input v-model="form.cargo" label="Cargo" /></div>
            <div class="col-span-4"><Input v-model="form.registro" label="Matrícula/Registro" /></div>

            <div class="col-span-4" style="margin-top: 15px;"><Input v-model="form.horario_entrada" label="Entrada" type="time" /></div>
            <div class="col-span-4" style="margin-top: 15px;"><Input v-model="form.horario_almoco" label="Almoço" type="time" /></div>
            <div class="col-span-4" style="margin-top: 15px;"><Input v-model="form.horario_saida" label="Saída" type="time" /></div>

            <div class="col-span-12" style="margin: 20px 0; border-bottom: 1px solid var(--border-soft);"></div>
            
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
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'
import { maskMoneyBR } from '@/utils/masks'
import { buscarCep } from '@/utils/utils'

import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

const router = useRouter()
const route = useRoute()
const salvando = ref(false)
const carregandoDados = ref(true)

const form = ref({
  nome: '', cpf: '', rg: '', whatsapp: '', email: '', estado_civil: '',
  cep: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '',
  setor: '', cargo: '', registro: '',
  horario_entrada: '', horario_almoco: '', horario_saida: '',
  salario_base: 0, custo_hora: 0, forma_pagamento: '', conta_bancaria: '',
  admissao: ''
})

// Máscaras reativas
const salarioBaseMask = computed({
  get: () => maskMoneyBR(form.value.salario_base || 0),
  set: (val) => form.value.salario_base = Number(val.replace(/\D/g, '')) / 100
})

const custoHoraMask = computed({
  get: () => maskMoneyBR(form.value.custo_hora || 0),
  set: (val) => form.value.custo_hora = Number(val.replace(/\D/g, '')) / 100
})

async function buscarDados() {
  try {
    const { data } = await api.get(`/funcionarios/${route.params.id}`)
    
    // Tratamento crucial para o input type="date"
    if (data.admissao) {
      data.admissao = data.admissao.split('T')[0]
    }
    
    form.value = data
  } catch (err) {
    alert('Erro ao carregar funcionário')
    router.push('/funcionarios')
  } finally {
    carregandoDados.value = false
  }
}

watch(() => form.value.cep, async (val) => {
  if (!val) return
  
  // Limpa para verificar se tem 8 dígitos
  const n = val.replace(/\D/g, '')
  
  if (n.length === 8) {
    const dadosEnd = await buscarCep(n)
    
    if (dadosEnd) {
      form.value.endereco = dadosEnd.logradouro
      form.value.bairro = dadosEnd.bairro
      form.value.cidade = data.localidade || dadosEnd.municipio // ViaCEP usa localidade
      form.value.estado = dadosEnd.uf
      
      // Dica: Se quiser formatar o CEP no campo enquanto digita
      form.value.cep = n.replace(/(\d{5})(\d{3})/, '$1-$2')
    }
  }
})

async function atualizar() {
  salvando.value = true
  try {
    // Removemos campos que não devem ser enviados ou que o Prisma gera sozinho
    const { id, criado_em, atualizado_em, ...payload } = form.value
    await api.put(`/funcionarios/${route.params.id}`, payload)
    router.push('/funcionarios')
  } catch (err) {
    alert('Erro ao atualizar dados')
  } finally {
    salvando.value = false
  }
}

onMounted(buscarDados)
</script>