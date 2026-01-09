<template>
  <div class="page-container">
    <Card style="margin-bottom: 24px;">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Novo Funcionário</h2>
          <p class="cell-muted">Cadastro de colaborador</p>
        </div>
        <Button variant="secondary" @click="router.push('/funcionarios')">Voltar</Button>
      </header>

      <div class="card-body">
        <div class="form-grid">
          <div class="col-span-12">
            <h3 class="card-title" style="font-size: 1.05rem;">1. Informações Pessoais</h3>
          </div>

          <div class="col-span-6">
            <Input v-model="form.nome" label="Nome Completo *" required class="uppercase-input" />
          </div>

          <div class="col-span-3">
            <Input v-model="cpfUi" label="CPF *" required />
          </div>

          <div class="col-span-3">
            <Input v-model="rgUi" label="RG" />
          </div>

          <div class="col-span-4">
            <Input v-model="whatsappUi" label="WhatsApp" />
          </div>

          <div class="col-span-4">
            <Input v-model="telefoneUi" label="Telefone" />
          </div>

          <div class="col-span-4">
            <Input v-model="form.email" label="E-mail" type="email" />
          </div>

          <div class="col-span-4">
            <Input v-model="form.estado_civil" label="Estado Civil" class="uppercase-input" />
          </div>

          <div class="col-span-4">
            <Input v-model="form.escolaridade" label="Escolaridade" class="uppercase-input" />
          </div>

          <div class="col-span-4">
            <Input v-model="form.data_nascimento" label="Data de Nascimento" type="date" />
          </div>

          <div class="form-divider"></div>

          <div class="col-span-12">
            <h3 class="card-title" style="font-size: 1.05rem;">Endereço</h3>
          </div>

          <div class="col-span-3">
            <Input v-model="cepUi" label="CEP" />
          </div>

          <div class="col-span-7">
            <Input v-model="form.endereco" label="Endereço" class="uppercase-input" />
          </div>

          <div class="col-span-2">
            <Input v-model="form.numero" label="Nº" class="uppercase-input" />
          </div>

          <div class="col-span-5">
            <Input v-model="form.bairro" label="Bairro" class="uppercase-input" />
          </div>

          <div class="col-span-5">
            <Input v-model="form.cidade" label="Cidade" class="uppercase-input" />
          </div>

          <div class="col-span-2">
            <Input v-model="form.estado" label="UF" class="uppercase-input" />
          </div>

          <div class="form-divider"></div>

          <div class="col-span-12">
            <h3 class="card-title" style="font-size: 1.05rem;">2. Empresa e Horários</h3>
          </div>

          <div class="col-span-4"><Input v-model="form.setor" label="Setor" class="uppercase-input" /></div>
          <div class="col-span-4"><Input v-model="form.cargo" label="Cargo" class="uppercase-input" /></div>
          <div class="col-span-4"><Input v-model="form.registro" label="Matrícula" class="uppercase-input" /></div>

          <div class="col-span-3"><Input v-model="form.horario_entrada_1" label="Entrada (1)" type="time" /></div>
          <div class="col-span-3"><Input v-model="form.horario_saida_1" label="Saída (1)" type="time" /></div>
          <div class="col-span-3"><Input v-model="form.horario_entrada_2" label="Entrada (2)" type="time" /></div>
          <div class="col-span-3"><Input v-model="form.horario_saida_2" label="Saída (2)" type="time" /></div>

          <div class="form-divider"></div>

          <div class="col-span-12">
            <h3 class="card-title" style="font-size: 1.05rem;">3. Financeiro</h3>
          </div>

          <div class="col-span-3">
            <Input v-model="salarioBaseUi" label="Salário Base (R$)" @blur="normalizarSalario" />
          </div>

          <div class="col-span-3">
            <Input v-model="custoHoraUi" label="Custo Hora (Auto)" disabled />
          </div>

          <div class="col-span-3"><Input v-model="form.admissao" label="Data Admissão" type="date" /></div>
          <div class="col-span-3"><Input v-model="form.demissao" label="Data Demissão" type="date" /></div>

          <div class="form-divider"></div>

          <div class="col-span-4">
            <Input v-model="form.forma_pagamento" label="Forma de Pagamento" placeholder="PIX / TRANSFERENCIA" class="uppercase-input" />
          </div>

          <div class="col-span-4"><Input v-model="form.data_pagamento" label="Data de Pagamento" type="date" /></div>
          <div class="col-span-4"><Input v-model="form.banco" label="Banco" class="uppercase-input" /></div>

          <template v-if="form.forma_pagamento === 'TRANSFERENCIA'">
            <div class="col-span-4"><Input v-model="form.agencia" label="Agência" class="uppercase-input" /></div>
            <div class="col-span-4"><Input v-model="form.conta" label="Conta" class="uppercase-input" /></div>
          </template>

          <template v-if="form.forma_pagamento === 'PIX'">
            <div class="col-span-4"><Input v-model="form.pix_tipo_chave" label="Tipo Chave" class="uppercase-input" /></div>
            <div class="col-span-8"><Input v-model="form.pix_chave" label="Chave PIX" /></div>
          </template>

          <div class="form-divider"></div>

          <div class="col-span-12 check-row">
            <label style="display:flex; align-items:center; gap:10px;">
              <input type="checkbox" v-model="form.tem_vale" /> Vale
            </label>
            <label style="display:flex; align-items:center; gap:10px;">
              <input type="checkbox" v-model="form.tem_vale_transporte" /> Vale Transporte
            </label>
          </div>

          <div class="col-span-3" v-if="form.tem_vale">
            <Input v-model="valeUi" label="Valor do Vale (R$)" @blur="normalizarVale" />
          </div>

          <div class="col-span-3" v-if="form.tem_vale_transporte">
            <Input v-model="valeTransporteUi" label="Vale Transporte (R$)" @blur="normalizarValeTransporte" />
          </div>
        </div>
      </div>
    </Card>

    <footer style="display:flex; justify-content:flex-end; gap:12px; margin-top:30px; padding-bottom:40px;">
      <Button variant="secondary" @click="router.push('/funcionarios')">Descartar</Button>
      <Button variant="primary" :loading="salvando" @click="salvar">Salvar</Button>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

// 🛡️ Integração com os Serviços do ERP
import { FuncionarioService } from '@/services'

// Utilitários de Máscara e Transformação
import { maskCPF, maskRG, maskTelefone, maskCEP, onlyNumbers, maskMoneyBR } from '@/utils/masks'
import { buscarCep, calcularCustoHora } from '@/utils/utils'
import { upper, raw } from '@/utils/text'
import { moedaParaNumero, numeroParaMoeda } from '@/utils/number'

// UI Components
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

const router = useRouter()
const salvando = ref(false)

// Estado Inicial Limpo
const form = ref({
  nome: '', cpf: '', rg: '', telefone: '', whatsapp: '', email: '',
  estado_civil: '', escolaridade: '', data_nascimento: '',
  cep: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '',
  setor: '', cargo: '', registro: '',
  horario_entrada_1: '', horario_saida_1: '', horario_entrada_2: '', horario_saida_2: '',
  salario_base: 0, custo_hora: 0, admissao: '', demissao: '',
  forma_pagamento: '', data_pagamento: '', banco: '', agencia: '', conta: '',
  pix_tipo_chave: '', pix_chave: '',
  tem_vale: false, vale: 0, tem_vale_transporte: false, vale_transporte: 0,
})

// Estados da Interface (Camada de Máscaras)
const cpfUi = ref('')
const rgUi = ref('')
const whatsappUi = ref('')
const telefoneUi = ref('')
const cepUi = ref('')
const salarioBaseUi = ref('0,00')
const custoHoraUi = ref('0,00')
const valeUi = ref('0,00')
const valeTransporteUi = ref('0,00')

/**
 * 🔄 SINCRONIZAÇÃO FINANCEIRA
 * Centraliza o cálculo de custo/hora sempre que um valor muda
 */
function syncFinanceiro() {
  form.value.salario_base = moedaParaNumero(salarioBaseUi.value) || 0
  form.value.vale = moedaParaNumero(valeUi.value) || 0
  form.value.vale_transporte = moedaParaNumero(valeTransporteUi.value) || 0
  
  // Regra de negócio: Custo hora é derivado do salário
  form.value.custo_hora = calcularCustoHora(form.value.salario_base)
  custoHoraUi.value = numeroParaMoeda(form.value.custo_hora)
}

/**
 * 🧐 WATCHERS: MAIÚSCULAS AUTOMÁTICAS
 */
const camposUpper = ['nome', 'estado_civil', 'escolaridade', 'endereco', 'bairro', 'cidade', 'estado', 'setor', 'cargo', 'forma_pagamento']
camposUpper.forEach(campo => {
  watch(() => form.value[campo], (v) => form.value[campo] = upper(v))
})

/**
 * 🧐 WATCHERS: MÁSCARAS E BUSCA DE CEP
 */
watch(cpfUi, (v) => { cpfUi.value = maskCPF(v); form.value.cpf = onlyNumbers(v) })
watch(rgUi, (v) => { rgUi.value = maskRG(v); form.value.rg = onlyNumbers(v) })
watch(whatsappUi, (v) => { whatsappUi.value = maskTelefone(v); form.value.whatsapp = onlyNumbers(v) })
watch(telefoneUi, (v) => { telefoneUi.value = maskTelefone(v); form.value.telefone = onlyNumbers(v) })

watch(cepUi, async (v) => {
  cepUi.value = maskCEP(v)
  const limpo = onlyNumbers(v)
  form.value.cep = limpo
  
  if (limpo?.length === 8) {
    const d = await buscarCep(limpo)
    if (d) {
      form.value.endereco = upper(d.logradouro)
      form.value.bairro = upper(d.bairro)
      form.value.cidade = upper(d.localidade)
      form.value.estado = upper(d.uf)
    }
  }
})

/**
 * 🧐 WATCHERS: DINHEIRO
 */
watch(salarioBaseUi, (v) => { salarioBaseUi.value = maskMoneyBR(v); syncFinanceiro() })
watch(valeUi, (v) => { valeUi.value = maskMoneyBR(v); syncFinanceiro() })
watch(valeTransporteUi, (v) => { valeTransporteUi.value = maskMoneyBR(v); syncFinanceiro() })

/**
 * 💾 AÇÃO PRINCIPAL: SALVAR
 */
async function salvar() {
  // Validações Básicas (Blindagem de UI)
  if (!form.value.nome) return alert('Nome é obrigatório')
  if (form.value.cpf.length < 11) return alert('CPF incompleto')
  
  salvando.value = true
  try {
    // Sincronização final para garantir números no payload
    syncFinanceiro()
    
    // Preparação do Payload final
    const payload = { 
      ...form.value,
      email: raw(form.value.email?.toLowerCase().trim())
    }
    
    // Chamada via Service centralizado (POST)
    await FuncionarioService.salvar(null, payload)
    
    alert('Funcionário cadastrado com sucesso!')
    router.push('/funcionarios')
  } catch (err) {
    const erroMsg = err.response?.data?.message || 'Erro ao salvar funcionário'
    alert(Array.isArray(erroMsg) ? erroMsg[0] : erroMsg)
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
/* A "mágica" para o usuário ver tudo em maiúsculo na hora */
:deep(.uppercase-input input) {
  text-transform: uppercase !important;
}
</style>