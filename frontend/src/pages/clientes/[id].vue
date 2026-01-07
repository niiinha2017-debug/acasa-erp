<template>
  <div class="page-container">
    <Card>
      <header class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 class="card-title">Editar Cliente</h2>
          <p class="form-label" style="font-weight: normal; margin: 0;">Altere os dados abaixo e salve as alterações.</p>
        </div>
        <Button variant="secondary" @click="router.push('/clientes')">Voltar</Button>
      </header>

      <div class="card-body">
        <form @submit.prevent="salvar" class="form-grid">
          
          <div class="col-span-12">
             <div class="badge" :class="tipoPessoa === 'FISICA' ? 'badge-success' : 'badge-warning'">
               Pessoa {{ tipoPessoa === 'FISICA' ? 'Física' : 'Jurídica' }}
             </div>
          </div>

          <div class="col-span-12 form-group" style="position: relative;">
            <Input v-model="indicacaoBusca" label="Indicação" placeholder="Buscar cliente..." />
          </div>

          <div class="col-span-8 form-group">
            <Input v-model="form.nome_completo" :label="tipoPessoa === 'FISICA' ? 'Nome Completo *' : 'Nome Fantasia *'" required />
          </div>
          <div class="col-span-4 form-group">
            <label class="form-label">Data {{ tipoPessoa === 'FISICA' ? 'Nascimento' : 'Abertura' }} *</label>
            <input v-model="dataBase" type="date" class="form-input" required />
          </div>

          <template v-if="tipoPessoa === 'FISICA'">
            <div class="col-span-6 form-group"><Input v-model="cpfMask" label="CPF" /></div>
            <div class="col-span-6 form-group"><Input v-model="rgMask" label="RG" /></div>
          </template>
          <template v-else>
            <div class="col-span-12 form-group"><Input v-model="form.razao_social" label="Razão Social" /></div>
            <div class="col-span-6 form-group"><Input v-model="cnpjMask" label="CNPJ" /></div>
            <div class="col-span-6 form-group"><Input v-model="form.ie" label="IE" /></div>
          </template>

          <div class="col-span-12" style="margin-top: 15px; border-top: 1px solid var(--border-soft); padding-top: 20px;">
            <h3 class="card-title" style="font-size: 1.1rem;">Endereço</h3>
          </div>

          <div class="col-span-3 form-group">
            <Input v-model="cepMask" label="CEP" @blur="tratarBuscaCep" />
          </div>
          <div class="col-span-6 form-group">
            <Input v-model="form.endereco" label="Logradouro" />
          </div>
          <div class="col-span-3 form-group">
            <Input v-model="form.numero" id="numero-input" label="Nº" />
          </div>

          <div class="col-span-5 form-group">
            <Input v-model="form.bairro" label="Bairro" />
          </div>
          <div class="col-span-5 form-group">
            <Input v-model="form.cidade" label="Cidade" />
          </div>
          <div class="col-span-2 form-group">
            <Input v-model="form.estado" label="UF" maxlength="2" />
          </div>

          <div class="col-span-12" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; border-top: 1px solid var(--border-soft); padding-top: 20px;">
            <Button variant="secondary" type="button" @click="router.push('/clientes')">Cancelar</Button>
            <Button variant="primary" type="submit" :loading="loading">Salvar Alterações</Button>
          </div>
        </form>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import { maskCPF, maskCNPJ, maskTelefone, maskCEP, maskRG } from '@/utils/masks'
import { buscarCep } from '@/utils/utils' 

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const tipoPessoa = ref('FISICA')
const todosClientes = ref([])
const abrirSugestoes = ref(false)
const indicacaoBusca = ref('')
const dataBase = ref('')

const form = ref({
  indicacao_id: null,
  nome_completo: '',
  razao_social: '',
  data_nascimento: '',
  cpf: '', rg: '', cnpj: '', ie: '',
  telefone: '', whatsapp: '', email: '',
  enviar_aniversario_email: true,
  enviar_aniversario_whatsapp: false,
  cep: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '',
})

// Máscaras Computadas (Reaproveitadas do Cadastro)
const cpfMask = computed({ get: () => form.value.cpf, set: (v) => (form.value.cpf = maskCPF(v)) })
const rgMask = computed({ get: () => form.value.rg, set: (v) => (form.value.rg = maskRG(v)) })
const cnpjMask = computed({ get: () => form.value.cnpj, set: (v) => (form.value.cnpj = maskCNPJ(v)) })
const telefoneMask = computed({ get: () => form.value.telefone, set: (v) => (form.value.telefone = maskTelefone(v)) })
const whatsMask = computed({ get: () => form.value.whatsapp, set: (v) => (form.value.whatsapp = maskTelefone(v)) })
const cepMask = computed({ get: () => form.value.cep, set: (v) => (form.value.cep = maskCEP(v)) })

async function tratarBuscaCep() {
  const cepLimpo = form.value.cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return
  const dados = await buscarCep(cepLimpo)
  if (dados) {
    form.value.endereco = dados.logradouro
    form.value.bairro = dados.bairro
    form.value.cidade = dados.localidade
    form.value.estado = dados.uf
    document.getElementById('numero-input')?.focus()
  }
}

function setTipo(tipo) {
  tipoPessoa.value = tipo
}

onMounted(async () => {
  loading.value = true
  const clientId = route.params.id
  try {
    // 1. Carrega todos para a lista de indicação
    const resClientes = await api.get('/clientes')
    todosClientes.value = resClientes.data

    // 2. Carrega os dados do cliente atual
    const { data } = await api.get(`/clientes/${clientId}`)
    form.value = data
    
    // Ajusta o tipo de pessoa baseado nos dados vindos do banco
    tipoPessoa.value = data.cnpj ? 'JURIDICA' : 'FISICA'
    
    // Formata a data para o input type="date" (YYYY-MM-DD)
    if (data.data_nascimento) {
      dataBase.value = data.data_nascimento.split('T')[0]
    }

    // Se houver indicação, preenche o nome na busca
    if (data.indicacao_id) {
      const ind = todosClientes.value.find(c => c.id === data.indicacao_id)
      if (ind) indicacaoBusca.value = ind.nome_completo
    }
  } catch (e) {
    alert("Erro ao carregar dados do cliente")
  } finally {
    loading.value = false
  }
})

async function salvar() {
  loading.value = true
  try {
    if (dataBase.value) form.value.data_nascimento = new Date(`${dataBase.value}T00:00:00`).toISOString()
    await api.put(`/clientes/${route.params.id}`, form.value)
    alert('Cadastro atualizado!')
    router.push('/clientes')
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao atualizar')
  } finally {
    loading.value = false
  }
}
</script>