<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ClientesAPI } from '@/services/clientes.api.js'
import * as masks from '@/utils/format.js' // Supondo que seus helpers estão aqui

// UI Components
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const router = useRouter()
const loading = ref(false)
const tipoPessoa = ref('PF') 

const form = ref({
  nome_completo: '',
  razao_social: '',
  data_nascimento: '',
  cpf: '',
  rg: '',
  cnpj: '',
  ie: '',
  email: '',
  telefone: '',
  whatsapp: '',
  cep: '',
  endereco: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  indicacao_id: null,
  enviar_aniversario_email: true,
  enviar_aniversario_whatsapp: false
})

// --- LÓGICA DE INDICAÇÃO ---
const buscaIndicacao = ref('')
const clientesEncontrados = ref([])
const clienteSelecionadoNome = ref('')

const pesquisarClientes = async () => {
  if (buscaIndicacao.value.length < 3) return
  try {
    const data = await ClientesAPI.buscarPorNome(buscaIndicacao.value)
    clientesEncontrados.value = data
  } catch (e) { console.error(e) }
}

const selecionarIndicacao = (cliente) => {
  form.value.indicacao_id = cliente.id
  clienteSelecionadoNome.value = cliente.nome_completo
  clientesEncontrados.value = []
  buscaIndicacao.value = ''
}

// --- LÓGICA DE CEP ---
const handleCep = async () => {
  form.value.cep = masks.maskCEP(form.value.cep)
  if (form.value.cep.length === 9) {
    const data = await masks.buscarCep(form.value.cep)
    if (data) {
      form.value.endereco = data.logradouro
      form.value.bairro = data.bairro
      form.value.cidade = data.localidade
      form.value.estado = data.uf
    }
  }
}

// --- APLICAÇÃO DE MÁSCARAS ---
watch(() => form.value.cpf, (v) => form.value.cpf = masks.maskCPF(v))
watch(() => form.value.cnpj, (v) => form.value.cnpj = masks.maskCNPJ(v))
watch(() => form.value.rg, (v) => form.value.rg = masks.maskRG(v))
watch(() => form.value.telefone, (v) => form.value.telefone = masks.maskTelefone(v))
watch(() => form.value.whatsapp, (v) => form.value.whatsapp = masks.maskTelefone(v))

const salvar = async () => {
  loading.value = true
  try {
    await ClientesAPI.criar(form.value)
    router.push('/clientes')
  } catch (err) {
    alert("Erro ao salvar cadastro.")
  } finally { loading.value = false }
}
</script>

<template>
  <div class="page-container">
    <Card title="Cadastro de Cliente">
      <form @submit.prevent="salvar" class="form-wrapper">
        
        <div class="tipo-selector">
          <button type="button" :class="{ active: tipoPessoa === 'PF' }" @click="tipoPessoa = 'PF'">Pessoa Física</button>
          <button type="button" :class="{ active: tipoPessoa === 'PJ' }" @click="tipoPessoa = 'PJ'">Pessoa Jurídica</button>
        </div>

        <div class="main-info">
          <Input v-model="form.nome_completo" :label="tipoPessoa === 'PF' ? 'Nome Completo' : 'Nome Fantasia'" required />
          
          <div class="indicacao-container">
            <label class="input-label">Quem indicou?</label>
            <div v-if="clienteSelecionadoNome" class="selected-badge">
              {{ clienteSelecionadoNome }} <span @click="form.indicacao_id = null; clienteSelecionadoNome = ''">✕</span>
            </div>
            <Input v-else v-model="buscaIndicacao" placeholder="Pesquisar cliente..." @input="pesquisarClientes" />
            <ul v-if="clientesEncontrados.length" class="search-list">
              <li v-for="c in clientesEncontrados" :key="c.id" @click="selecionarIndicacao(c)">{{ c.nome_completo }}</li>
            </ul>
          </div>
        </div>

        <div class="grid-row three-cols">
          <Input v-if="tipoPessoa === 'PF'" v-model="form.cpf" label="CPF" required />
          <Input v-if="tipoPessoa === 'PF'" v-model="form.rg" label="RG" />
          <Input v-if="tipoPessoa === 'PJ'" v-model="form.cnpj" label="CNPJ" required />
          <Input v-if="tipoPessoa === 'PJ'" v-model="form.ie" label="I.E." />
          <Input v-model="form.data_nascimento" label="Nascimento" type="date" required />
        </div>

        <div class="grid-row">
          <Input v-model="form.email" label="E-mail" type="email" required />
          <div class="row">
            <Input v-model="form.telefone" label="Telefone" />
            <Input v-model="form.whatsapp" label="WhatsApp" />
          </div>
        </div>

        <h3 class="section-title">Endereço</h3>
        <div class="grid-row address-grid">
          <Input v-model="form.cep" label="CEP" @input="handleCep" maxlength="9" />
          <Input v-model="form.endereco" label="Logradouro" />
          <Input v-model="form.numero" label="Nº" />
        </div>
        <div class="grid-row three-cols">
          <Input v-model="form.bairro" label="Bairro" />
          <Input v-model="form.cidade" label="Cidade" readonly />
          <Input v-model="form.estado" label="UF" readonly />
        </div>

        <div class="checkbox-row">
          <label><input type="checkbox" v-model="form.enviar_aniversario_email"> Enviar E-mail</label>
          <label><input type="checkbox" v-model="form.enviar_aniversario_whatsapp"> Enviar WhatsApp</label>
        </div>

        <div class="actions">
          <Button type="button" variant="outline" @click="router.back()">Cancelar</Button>
          <Button type="submit" :disabled="loading">Salvar Cliente</Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<style scoped>
.form-wrapper { display: flex; flex-direction: column; gap: 1.2rem; }
.grid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.three-cols { grid-template-columns: 1fr 1fr 1fr; }
.address-grid { grid-template-columns: 140px 1fr 100px; }

.tipo-selector button { padding: 10px 20px; border: 1px solid var(--border-color); cursor: pointer; background: #fff; }
.tipo-selector button.active { background: var(--primary-color); color: #fff; }

.indicacao-container { position: relative; margin-top: 0.5rem; }
.search-list { position: absolute; width: 100%; background: #fff; border: 1px solid #ddd; z-index: 50; }
.search-list li { padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; }
.selected-badge { background: #e3f2fd; padding: 5px 10px; border-radius: 4px; display: inline-flex; align-items: center; gap: 8px; }

.checkbox-row { display: flex; gap: 2rem; margin: 1rem 0; }
.section-title { border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 1rem; }
.actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
</style>