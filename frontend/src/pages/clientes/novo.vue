<template>
  <div class="page-container">
    <Card>
      <header class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 class="card-title">Novo Cliente</h2>
          <p class="form-label" style="font-weight: normal; margin: 0;">Insira os dados cadastrais abaixo.</p>
        </div>
        <Button variant="secondary" @click="router.push('/clientes')">Voltar</Button>
      </header>

      <div class="card-body">
        <div class="check-row" style="margin-bottom: 25px;">
          <button 
            type="button" 
            :class="['btn btn--sm', tipoPessoa === 'FISICA' ? 'btn--primary' : 'btn--secondary']" 
            @click="setTipo('FISICA')"
          >
            Pessoa Física
          </button>
          <button 
            type="button" 
            :class="['btn btn--sm', tipoPessoa === 'JURIDICA' ? 'btn--primary' : 'btn--secondary']" 
            @click="setTipo('JURIDICA')"
          >
            Pessoa Jurídica
          </button>
        </div>

        <form @submit.prevent="salvar" class="form-grid">
          <div class="col-span-12 form-group" style="position: relative;">
            <Input 
              v-model="indicacaoBusca" 
              label="Indicação (Buscar Cliente)" 
              placeholder="Digite um nome..." 
              @focus="abrirSugestoes = true" 
              @blur="setTimeout(() => abrirSugestoes = false, 200)" 
            />
            <div v-if="abrirSugestoes && sugestoesIndicacao.length" class="suggestions-list">
              <div v-for="c in sugestoesIndicacao" :key="c.id" class="suggestion-item" @mousedown="selecionarIndicacao(c)">
                {{ c.nome_completo }}
              </div>
            </div>
          </div>

          <div class="col-span-8 form-group">
            <Input v-model="form.nome_completo" :label="tipoPessoa === 'FISICA' ? 'Nome Completo *' : 'Nome Fantasia *'" required />
          </div>
          <div class="col-span-4 form-group">
            <label class="form-label">Data {{ tipoPessoa === 'FISICA' ? 'Nascimento' : 'Abertura' }} *</label>
            <input v-model="dataBase" type="date" class="form-input" required />
          </div>

          <template v-if="tipoPessoa === 'FISICA'">
            <div class="col-span-6 form-group"><Input v-model="cpfMask" label="CPF" placeholder="000.000.000-00" /></div>
            <div class="col-span-6 form-group"><Input v-model="rgMask" label="RG" /></div>
          </template>
          <template v-else>
            <div class="col-span-12 form-group"><Input v-model="form.razao_social" label="Razão Social" /></div>
            <div class="col-span-6 form-group"><Input v-model="cnpjMask" label="CNPJ" placeholder="00.000.000/0000-00" /></div>
            <div class="col-span-6 form-group"><Input v-model="form.ie" label="Inscrição Estadual" /></div>
          </template>

          <div class="col-span-6 form-group"><Input v-model="form.email" label="E-mail *" required /></div>
          <div class="col-span-3 form-group"><Input v-model="telefoneMask" label="Telefone" /></div>
          <div class="col-span-3 form-group"><Input v-model="whatsMask" label="WhatsApp" /></div>

          <div class="col-span-12" style="display: flex; gap: 20px; padding: 15px; background: var(--bg-page); border-radius: 8px; align-items: center;">
            <span class="form-label" style="margin: 0;">Enviar felicitações:</span>
            <label style="display: flex; gap: 8px; cursor: pointer; align-items: center;">
              <input type="checkbox" v-model="form.enviar_aniversario_email"> <span class="form-label" style="margin:0">E-mail</span>
            </label>
            <label style="display: flex; gap: 8px; cursor: pointer; align-items: center;">
              <input type="checkbox" v-model="form.enviar_aniversario_whatsapp"> <span class="form-label" style="margin:0">WhatsApp</span>
            </label>
          </div>
<div class="col-span-12 section-divider">
  <h3 class="card-title">Endereço</h3>
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
  <Input v-model="form.estado" label="UF" />
</div>

          <div class="col-span-12" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; border-top: 1px solid var(--border-soft); padding-top: 20px;">
            <Button variant="secondary" type="button" @click="router.push('/clientes')">Cancelar</Button>
            <Button variant="primary" type="submit" :loading="loading">Finalizar Cadastro</Button>
          </div>
        </form>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import { maskCPF, maskCNPJ, maskTelefone, maskCEP, maskRG } from '@/utils/masks'
import { buscarCep } from '@/utils/utils' 

const router = useRouter()
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

const sugestoesIndicacao = computed(() => {
  const termo = (indicacaoBusca.value || '').trim().toLowerCase()
  if (!termo) return []
  return todosClientes.value.filter(c => (c.nome_completo || '').toLowerCase().includes(termo)).slice(0, 8)
})

const indicacaoSelecionadaNome = computed(() => {
  if (!form.value.indicacao_id) return ''
  return todosClientes.value.find(c => c.id === form.value.indicacao_id)?.nome_completo || ''
})

function setTipo(tipo) {
  tipoPessoa.value = tipo
  if (tipo === 'FISICA') { form.value.cnpj = ''; form.value.ie = '' }
  else { form.value.cpf = ''; form.value.rg = '' }
}

function selecionarIndicacao(cliente) {
  form.value.indicacao_id = cliente.id
  indicacaoBusca.value = cliente.nome_completo
  abrirSugestoes.value = false
}

async function salvar() {
  loading.value = true
  try {
    if (dataBase.value) form.value.data_nascimento = new Date(`${dataBase.value}T00:00:00`).toISOString()
    await api.post('/clientes', form.value)
    alert('Cliente cadastrado com sucesso!')
    router.push('/clientes')
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao salvar')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/clientes')
    todosClientes.value = data
  } catch (e) { console.error("Erro ao carregar clientes") }
})
</script>

<style scoped>
.suggestions-list {
  position: absolute; top: 100%; left: 0; right: 0;
  background: white; border: 1px solid var(--border-soft);
  z-index: 50; border-radius: 8px; box-shadow: var(--shadow-md);
}
.suggestion-item { padding: 10px; cursor: pointer; border-bottom: 1px solid var(--border-soft); }
.suggestion-item:hover { background: var(--bg-page); }
.form-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr); /* Força 12 colunas iguais */
  gap: 16px; /* Espaçamento padrão entre campos */
  width: 100%;
}

/* Garante que o componente de Input ocupe todo o espaço da coluna dele */
:deep(.input-wrapper), 
:deep(.input-container) {
  width: 100%;
}

/* Evita que o formulário "quebre" em telas menores antes da hora */
.form-group {
  min-width: 0; 
}

</style>