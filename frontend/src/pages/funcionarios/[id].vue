<template>
  <div class="page-container">
    <Card>
      <!-- HEADER -->
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">{{ isEditing ? 'Editar' : 'Novo' }} Funcionário</h2>
        </div>

        <Button variant="secondary" @click="router.push('/funcionarios')">Voltar</Button>
      </header>

      <!-- BODY -->
      <div class="card-body">
        <div class="form-grid">
          <!-- 1. Informações Pessoais -->
          <div class="col-span-12">
            <h3 class="card-title" style="font-size: 1rem;">1. Informações Pessoais</h3>
          </div>

          <div class="col-span-6">
            <Input v-model="form.nome" label="Nome Completo" required />
          </div>
          <div class="col-span-3">
            <Input v-model="cpfUi" label="CPF" required />
          </div>
          <div class="col-span-3">
            <Input v-model="rgUi" label="RG" />
          </div>

          <div class="col-span-4">
            <Input v-model="form.email" label="E-mail" />
          </div>
          <div class="col-span-4">
            <Input v-model="whatsappUi" label="WhatsApp" />
          </div>
          <div class="col-span-4">
            <Input v-model="form.data_nascimento" label="Data Nascimento" type="date" />
          </div>

          <div class="col-span-6">
            <Input v-model="form.estado_civil" label="Estado Civil" />
          </div>
          <div class="col-span-6">
            <Input v-model="form.escolaridade" label="Escolaridade" />
          </div>

          <div class="form-divider"></div>

          <!-- 2. Endereço -->
          <div class="col-span-12">
            <h3 class="card-title" style="font-size: 1rem;">2. Endereço</h3>
          </div>

          <div class="col-span-3">
            <Input v-model="cepUi" label="CEP" />
          </div>
          <div class="col-span-7">
            <Input v-model="form.endereco" label="Rua/Logradouro" />
          </div>
          <div class="col-span-2">
            <Input v-model="form.numero" label="Nº" />
          </div>

          <div class="col-span-4">
            <Input v-model="form.complemento" label="Complemento" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.bairro" label="Bairro" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.cidade" label="Cidade" />
          </div>
          <div class="col-span-2">
            <Input v-model="form.estado" label="UF" />
          </div>

          <div class="form-divider"></div>

          <!-- 3. Dados da Empresa e Horários -->
          <div class="col-span-12">
            <h3 class="card-title" style="font-size: 1rem;">3. Dados da Empresa e Horários</h3>
          </div>

          <div class="col-span-4">
            <Input v-model="form.setor" label="Setor" />
          </div>
          <div class="col-span-4">
            <Input v-model="form.cargo" label="Cargo" />
          </div>
          <div class="col-span-4">
            <Input v-model="form.funcao" label="Função" />
          </div>

          <div class="col-span-3">
            <Input v-model="form.registro" label="Nº Registro" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.admissao" label="Data Admissão" type="date" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.demissao" label="Data Demissão" type="date" />
          </div>

          <div class="col-span-3" v-if="form.admissao">
            <div style="display:flex; align-items:center; height: 100%;">
              <div style="width:100%; padding: 10px; border: 1px solid var(--border-soft); border-radius: var(--border-radius-md); background: var(--bg-input); text-align: center;">
                <b>Tempo Casa:</b> {{ tempoServico }}
              </div>
            </div>
          </div>

          <div class="col-span-3">
            <Input v-model="form.horario_entrada_1" label="Entrada 1" type="time" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.horario_saida_1" label="Saída 1" type="time" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.horario_entrada_2" label="Entrada 2" type="time" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.horario_saida_2" label="Saída 2" type="time" />
          </div>

          <div class="form-divider"></div>

          <!-- 4. Financeiro e Pagamento -->
          <div class="col-span-12">
            <h3 class="card-title" style="font-size: 1rem;">4. Financeiro e Pagamento</h3>
          </div>

          <div class="col-span-3">
            <Input v-model="salarioBaseUi" label="Salário Base" />
          </div>
          <div class="col-span-3">
            <Input v-model="salarioAdicionalUi" label="Adicional" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.data_pagamento" label="Data Pagto Padrão" type="date" />
          </div>
          <div class="col-span-3">
            <Input :model-value="custoHoraExibicao" label="Custo Hora (Calculado)" disabled />
          </div>

          <div class="col-span-4 form-group">
            <label class="input-label">Forma de Pagamento</label>
            <select v-model="form.forma_pagamento" class="input-field">
              <option value="DINHEIRO">DINHEIRO</option>
              <option value="PIX">PIX</option>
              <option value="TRANSFERENCIA">TRANSFERÊNCIA</option>
            </select>
          </div>

          <div class="col-span-8">
            <Input v-model="form.banco" label="Banco" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.agencia" label="Agência" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.conta" label="Conta" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.pix_tipo_chave" label="Tipo Chave PIX" />
          </div>
          <div class="col-span-3">
            <Input v-model="form.pix_chave" label="Chave PIX" />
          </div>

          <div class="col-span-12" style="display:flex; gap: 18px; align-items:center; padding: 10px; border: 1px solid var(--border-soft); border-radius: var(--border-radius-md); background: var(--bg-input);">
            <label style="display:flex; gap: 8px; align-items:center;">
              <input type="checkbox" v-model="form.tem_vale" />
              Tem Vale
            </label>

            <label style="display:flex; gap: 8px; align-items:center;">
              <input type="checkbox" v-model="form.tem_vale_transporte" />
              Tem VT
            </label>
          </div>

          <div class="col-span-6" v-if="form.tem_vale">
            <Input v-model="valeUi" label="Valor Vale" />
          </div>
          <div class="col-span-6" v-if="form.tem_vale_transporte">
            <Input v-model="valeTransporteUi" label="Valor VT" />
          </div>
        </div>
      </div>

      <!-- FOOTER (ações) -->
      <footer class="card-footer" style="display:flex; justify-content:flex-end;">
        <Button variant="primary" :loading="salvando" @click="salvar">Salvar Dados</Button>
      </footer>
    </Card>
  </div>
</template>


<style scoped>
.section-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 10px 0; border-left: 4px solid #3b82f6; padding-left: 10px; }
.form-divider { grid-column: span 12; height: 1px; background: #e2e8f0; margin: 20px 0; }
.tempo-servico-badge { background: #eff6ff; padding: 8px; border-radius: 6px; font-size: 0.8rem; color: #1d4ed8; text-align: center; border: 1px solid #dbeafe; }
.select-custom { width: 100%; height: 42px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0 10px; background: white; }
.form-actions { display: flex; justify-content: flex-end; margin-top: 20px; }
.check-row { display: flex; gap: 20px; background: #f8fafc; padding: 10px; border-radius: 6px; }
</style>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { FuncionarioService } from '@/services'

// máscaras e util
import { maskCPF, maskRG, maskTelefone, maskCEP, maskMoneyBR, onlyNumbers } from '@/utils/masks'
import { buscarCep, calcularCustoHora } from '@/utils/utils'
import { moedaParaNumero, numeroParaMoeda } from '@/utils/number'
import { upper, raw } from '@/utils/text'

const router = useRouter()
const route = useRoute()
const salvando = ref(false)

/* =========================
   NOVO vs EDITAR (sem erro)
========================= */
const routeId = computed(() => String(route.params.id || 'novo'))
const isEditing = computed(() => routeId.value !== 'novo')
const cleanId = computed(() => (isEditing.value ? routeId.value.replace(/\D/g, '') : null))

/* =========================
   FORM (espelho)
========================= */
const initialForm = () => ({
  nome: '',
  cpf: '',
  rg: '',
  data_nascimento: null,
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
  admissao: null,
  demissao: null,

  salario_base: 0,
  salario_adicional: 0,
  custo_hora: 0,

  tem_vale: false,
  vale: 0,
  tem_vale_transporte: false,
  vale_transporte: 0,

  horario_entrada_1: null,
  horario_saida_1: null,
  horario_entrada_2: null,
  horario_saida_2: null,

  forma_pagamento: 'DINHEIRO',
  banco: '',
  agencia: '',
  conta: '',
  pix_tipo_chave: '',
  pix_chave: '',

  data_pagamento: null
})

const form = ref(initialForm())

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

/* exibição */
const custoHoraExibicao = computed(() => numeroParaMoeda(form.value.custo_hora))

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

/* =========================
   helpers
========================= */
function fmtDateInput(v) {
  if (!v) return null
  // vem Date ou ISO
  const s = String(v)
  return s.includes('T') ? s.split('T')[0] : s
}

function syncFinanceiro() {
  form.value.salario_base = moedaParaNumero(salarioBaseUi.value)
  form.value.salario_adicional = moedaParaNumero(salarioAdicionalUi.value)
  form.value.vale = moedaParaNumero(valeUi.value)
  form.value.vale_transporte = moedaParaNumero(valeTransporteUi.value)

  form.value.custo_hora = calcularCustoHora(form.value.salario_base + form.value.salario_adicional)
}

function limparPayload(p) {
  // nunca manda "" em campos de data/hora, manda null
  const camposNull = [
    'data_nascimento',
    'admissao',
    'demissao',
    'data_pagamento',
    'horario_entrada_1',
    'horario_saida_1',
    'horario_entrada_2',
    'horario_saida_2'
  ]
  for (const c of camposNull) {
    if (p[c] === '') p[c] = null
  }

  // email raw e lower
  p.email = raw(p.email ? String(p.email).toLowerCase().trim() : '')

  return p
}

function resetUIFromForm() {
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
   carregar (novo/editar)
========================= */
async function carregar() {
  // NOVO: limpa tudo
  if (!isEditing.value) {
    form.value = initialForm()
    resetUIFromForm()
    return
  }

  // EDITAR
  try {
    const { data } = await FuncionarioService.buscar(cleanId.value)

    form.value = {
      ...initialForm(),
      ...data,
      data_nascimento: fmtDateInput(data.data_nascimento),
      admissao: fmtDateInput(data.admissao),
      demissao: fmtDateInput(data.demissao),
      data_pagamento: fmtDateInput(data.data_pagamento),

      // horários (se vierem vazios)
      horario_entrada_1: data.horario_entrada_1 || null,
      horario_saida_1: data.horario_saida_1 || null,
      horario_entrada_2: data.horario_entrada_2 || null,
      horario_saida_2: data.horario_saida_2 || null
    }

    resetUIFromForm()
    syncFinanceiro()
  } catch (err) {
    router.push('/funcionarios')
  }
}

onMounted(carregar)

// MUITO IMPORTANTE: quando navegar de um id pra outro sem recarregar o componente
watch(() => routeId.value, () => carregar())

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

/* =========================
   SALVAR (NOVO/EDITAR)
========================= */
async function salvar() {
  if (!form.value.nome || String(form.value.cpf || '').length < 11) {
    return alert('Nome e CPF obrigatórios.')
  }

  salvando.value = true
  try {
    syncFinanceiro()

    const payload = limparPayload({ ...form.value })

    // ✅ usa seu service exatamente como você mandou:
    // - POST quando id é null/novo
    // - PUT quando id existe
    await FuncionarioService.salvar(isEditing.value ? cleanId.value : null, payload)

    router.push('/funcionarios')
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao salvar')
  } finally {
    salvando.value = false
  }
}
</script>
