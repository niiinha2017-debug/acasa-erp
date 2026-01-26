<template>
  <Card class="mt-4 mb-8 mx-2 lg:mx-4 shadow-xl rounded-[2.5rem] overflow-hidden animate-page-in">
    <PageHeader
      :title="isEdit ? `Editar Cliente #${clienteId}` : 'Novo Cliente'"
      subtitle="Gerenciamento de dados cadastrais e contato"
      icon="pi pi-user-plus"
      :backTo="'/clientes'"
      class="border-b border-border-ui"
    />

    <div class="p-8 lg:p-12">
      <Loading v-if="loading" />

      <form v-else class="space-y-10" @submit.prevent="testarSalvar" autocomplete="off">
        
        <!-- Seção de Tipo de Cliente e Indicação -->
        <div class="grid grid-cols-12 gap-6 items-end bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-2xl">
          <div class="col-span-12 md:col-span-3 pb-2">
            <CustomCheckbox
              v-model="isJuridica"
              label="Pessoa Jurídica"
            />
          </div>

          <div class="col-span-12 md:col-span-9">
            <SearchInput
              v-model="form.indicacao_id"
              mode="select"
              label="Quem indicou?"
              placeholder="Pesquisar cliente existente..."
              :options="clientesOptions"
              labelKey="label"
              valueKey="value"
            />
          </div>
        </div>

        <!-- Separador estilizado -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Dados Principais
            </span>
          </div>
        </div>

        <!-- Dados Pessoais/Jurídicos -->
        <div class="grid grid-cols-12 gap-6">
          <Input
            :class="isJuridica ? 'col-span-12 md:col-span-6' : 'col-span-12 md:col-span-9'"
            v-model="form.nome_completo"
            :label="isJuridica ? 'Razão Social' : 'Nome Completo'"
            placeholder="Digite o nome principal..."
            required
            force-upper
          />

          <Input
            v-if="isJuridica"
            class="col-span-12 md:col-span-3"
            v-model="form.nome_fantasia"
            label="Nome Fantasia"
            placeholder="Opcional"
            force-upper
          />

          <Input
            class="col-span-12 md:col-span-3"
            v-model="form.data_nascimento"
            :label="isJuridica ? 'Data de Abertura' : 'Data de Nascimento'"
            type="date"
            required
          />
        </div>

        <!-- Documentos -->
        <div class="grid grid-cols-12 gap-6">
          <template v-if="!isJuridica">
            <Input class="col-span-12 md:col-span-4" v-model="form.cpf" label="CPF" @input="form.cpf = maskCPF(form.cpf)" />
            <Input class="col-span-12 md:col-span-4" v-model="form.rg" label="RG" @input="form.rg = maskRG(form.rg)" />
          </template>

          <template v-else>
            <Input class="col-span-12 md:col-span-4" v-model="form.cnpj" label="CNPJ" @input="form.cnpj = maskCNPJ(form.cnpj)" @blur="onBlurCnpj" />
            <Input class="col-span-12 md:col-span-4" v-model="form.ie" label="IE" @input="form.ie = maskIE(form.ie)" />
          </template>

          <div class="col-span-12 md:col-span-4">
            <Select
              v-model="form.status"
              label="Status"
              :options="opcoesStatus"
              force-upper
              required
            />
          </div>
        </div>

        <!-- Separador estilizado -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Contato
            </span>
          </div>
        </div>

        <!-- Contato -->
        <div class="grid grid-cols-12 gap-6">
          <Input class="col-span-12 md:col-span-4" v-model="form.email" label="E-mail" type="email" :force-upper="false" />
          <Input class="col-span-12 md:col-span-4" v-model="form.whatsapp" label="WhatsApp" @input="form.whatsapp = maskTelefone(form.whatsapp)" />
          <Input class="col-span-12 md:col-span-4" v-model="form.telefone" label="Fixo" @input="form.telefone = maskTelefone(form.telefone)" />
          
          <!-- Checkboxes de notificação -->
          <div class="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-border-ui">
            <CustomCheckbox 
              v-model="form.enviar_aniversario_email" 
              :label="'Aviso por E-mail'" 
              :description="form.email ? 'Será enviado para o e-mail cadastrado' : 'Cadastre um e-mail primeiro'"
              :disabled="!form.email" 
            />
            <CustomCheckbox 
              v-model="form.enviar_aniversario_whatsapp" 
              :label="'Aviso por WhatsApp'" 
              :description="form.whatsapp ? 'Será enviado para o WhatsApp cadastrado' : 'Cadastre um WhatsApp primeiro'"
              :disabled="!form.whatsapp" 
            />
          </div>

          <!-- Estado Civil usando o novo componente Select -->
          <div class="col-span-12 md:col-span-4">
            <Select
              v-model="form.estado_civil"
              label="Estado Civil"
              placeholder="SELECIONE..."
              :options="opcoesEstadoCivil"
              force-upper
            />
          </div>

          <!-- Nome do Cônjuge (ao lado do select, visível apenas se CASADO) -->
          <div class="col-span-12 md:col-span-8">
            <transition name="slide-fade">
              <Input 
                v-if="form.estado_civil === 'CASADO'"
                v-model="form.nome_conjuge" 
                label="Nome do Cônjuge" 
                placeholder="Digite o nome completo do cônjuge"
                force-upper
              />
            </transition>
          </div>
        </div>

        <!-- Separador estilizado -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Endereço
            </span>
          </div>
        </div>

        <!-- Endereço -->
        <div class="grid grid-cols-12 gap-6">
          <Input 
            class="col-span-12 md:col-span-3" 
            v-model="form.cep" 
            label="CEP" 
            placeholder="00000-000"
            @input="form.cep = maskCEP(form.cep)" 
            @blur="onBlurCep" 
          />
          <Input 
            class="col-span-12 md:col-span-7" 
            v-model="form.endereco" 
            label="Logradouro" 
            placeholder="Rua, Avenida, etc..."
            force-upper
          />
          <Input 
            class="col-span-12 md:col-span-2" 
            v-model="form.numero" 
            label="Nº" 
            placeholder="123"
            force-upper
          />
          
          <Input 
            class="col-span-12 md:col-span-4" 
            v-model="form.bairro" 
            label="Bairro" 
            force-upper
          />
          <Input 
            class="col-span-12 md:col-span-5" 
            v-model="form.cidade" 
            label="Cidade" 
            force-upper
          />
          <Input 
            class="col-span-12 md:col-span-3" 
            v-model="form.estado" 
            label="UF (Estado)" 
            placeholder="Ex: SP"
            force-upper
          />
          <Input 
            class="col-span-12" 
            v-model="form.complemento" 
            label="Complemento / Referência" 
            placeholder="Apt, Bloco, Próximo a..."
            force-upper
          />
        </div>

        <!-- Ações do Formulário - Apenas Salvar e Excluir -->
        <div class="pt-10 mt-6 border-t border-border-ui">
          <div class="flex items-center justify-between gap-4">
            <!-- Espaço vazio à esquerda para balancear -->
            <div></div>

            <!-- Botão Salvar -->
            <Button
              variant="primary"
              size="lg"
              type="submit"
              :loading="saving"
              class="!rounded-xl px-8 py-3
                     bg-gradient-to-r from-brand-primary to-brand-primary/90
                     hover:from-brand-primary hover:to-brand-primary
                     hover:shadow-2xl hover:shadow-brand-primary/30
                     active:scale-[0.98]
                     transition-all duration-300
                     group relative overflow-hidden"
            >
              <!-- Efeito de brilho -->
              <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent 
                          translate-x-[-100%] group-hover:translate-x-[100%] 
                          transition-transform duration-700"></div>
              
              <!-- Conteúdo -->
              <span class="relative flex items-center justify-center gap-2 font-bold tracking-wide text-white">
                <i class="pi pi-save text-[14px] group-hover:rotate-12 transition-transform"></i>
                {{ isEdit ? 'ATUALIZAR CLIENTE' : 'CADASTRAR CLIENTE' }}
              </span>
            </Button>

            <!-- Botão Excluir (apenas em edição) -->
            <Button
              v-if="isEdit"
              variant="danger"
              size="lg"
              :loading="deleting"
              class="!rounded-xl px-6 py-3
                     hover:shadow-xl hover:shadow-red-500/20
                     transition-all duration-200"
              @click="excluir"
            >
              <i class="pi pi-trash mr-2 text-[12px]"></i>
              EXCLUIR
            </Button>

            <!-- Espaço vazio à direita para balancear quando não houver botão excluir -->
            <div v-if="!isEdit"></div>
          </div>
        </div>
      </form>
    </div>
  </Card>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClienteService } from '@/services/index'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { maskCPF, maskCNPJ, maskCEP, maskTelefone, maskRG, maskIE } from '@/utils/masks'
import { buscarCep, buscarCnpj } from '@/utils/utils'

const route = useRoute()
const router = useRouter()

// -- State --
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isJuridica = ref(false)
const listaClientes = ref([])

const clienteId = computed(() => Number(route.params?.id))
const isEdit = computed(() => !!clienteId.value)

// Opções para os Selects
const opcoesEstadoCivil = [
  { value: '', label: 'SELECIONE...' },
  { value: 'SOLTEIRO', label: 'SOLTEIRO' },
  { value: 'CASADO', label: 'CASADO' },
  { value: 'DIVORCIADO', label: 'DIVORCIADO' },
  { value: 'VIUVO', label: 'VIÚVO(A)' }
]

const opcoesStatus = [
  { value: 'ATIVO', label: 'ATIVO' },
  { value: 'INATIVO', label: 'INATIVO' },
  { value: 'PENDENTE', label: 'PENDENTE' },
  { value: 'BLOQUEADO', label: 'BLOQUEADO' }
]

const form = reactive({
  indicacao_id: null,
  nome_completo: '',
  razao_social: '',
  nome_fantasia: '',
  data_nascimento: '',
  cpf: '',
  rg: '',
  cnpj: '',
  ie: '',
  telefone: '',
  whatsapp: '',
  estado_civil: '',
  nome_conjuge: '',
  email: '',
  enviar_aniversario_email: true,
  enviar_aniversario_whatsapp: false,
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  status: 'ATIVO',
})

// -- Computed Filters --
const clientesOptions = computed(() => {
  return listaClientes.value
    .filter(c => !isEdit.value || Number(c.id) !== clienteId.value)
    .map(c => ({
      label: c.nome_completo || c.razao_social || `ID #${c.id}`,
      value: c.id
    }))
})

// -- Handlers --
async function onBlurCep() {
  if (form.cep?.length < 9) return
  const data = await buscarCep(form.cep)
  if (data) {
    form.endereco = data.logradouro || form.endereco
    form.bairro = data.bairro || form.bairro
    form.cidade = data.localidade || form.cidade
    form.estado = data.uf || form.estado
  }
}

async function onBlurCnpj() {
  if (form.cnpj?.length < 18) return
  const data = await buscarCnpj(form.cnpj)
  if (data) {
    form.nome_completo = data.razao_social || data.nome || form.nome_completo
    form.nome_fantasia = data.nome_fantasia || data.fantasia || form.nome_fantasia
    form.email = data.email || form.email
    form.cep = data.cep || form.cep
    onBlurCep()
  }
}

// -- Data Loading --
async function carregarDados() {
  try {
    loading.value = true
    
    // Carregar lista de clientes para a indicação
    const resClientes = await ClienteService.listar()
    listaClientes.value = Array.isArray(resClientes?.data) ? resClientes.data : []

    // Se for edição, carregar os dados do cliente
    if (isEdit.value) {
      const resUnico = await ClienteService.buscar(clienteId.value)
      
      if (resUnico?.data) {
        const c = resUnico.data
        
        // Mapear TODOS os campos do formulário
        Object.assign(form, {
          indicacao_id: c.indicacao_id || null,
          nome_completo: c.nome_completo || '',
          razao_social: c.razao_social || '',
          nome_fantasia: c.nome_fantasia || '',
          data_nascimento: c.data_nascimento?.split('T')[0] || '',
          cpf: c.cpf || '',
          rg: c.rg || '',
          cnpj: c.cnpj || '',
          ie: c.ie || '',
          telefone: c.telefone || '',
          whatsapp: c.whatsapp || '',
          estado_civil: c.estado_civil || '',
          nome_conjuge: c.nome_conjuge || '',
          email: c.email || '',
          enviar_aniversario_email: !!c.enviar_aniversario_email,
          enviar_aniversario_whatsapp: !!c.enviar_aniversario_whatsapp,
          cep: c.cep || '',
          endereco: c.endereco || '',
          numero: c.numero || '',
          complemento: c.complemento || '',
          bairro: c.bairro || '',
          cidade: c.cidade || '',
          estado: c.estado || '',
          status: c.status || 'ATIVO',
        })
        
        // Definir se é pessoa jurídica
        isJuridica.value = !!c.cnpj
      }
    }
  } catch (err) {
    console.error('Erro ao carregar dados:', err)
    notify.error('Erro ao carregar dados.')
  } finally {
    loading.value = false
  }
}

// -- Watchers --
watch(isJuridica, (val) => {
  if (val) { 
    form.cpf = ''; 
    form.rg = '' 
  } else { 
    form.cnpj = ''; 
    form.ie = ''; 
    form.nome_fantasia = '' 
  }
})

watch(() => form.email, (v) => {
  form.email = String(v || '').toLowerCase().trim()
  if (!form.email) form.enviar_aniversario_email = false
})

watch(() => form.whatsapp, (v) => {
  if (!v) form.enviar_aniversario_whatsapp = false
})

watch(() => form.estado_civil, (v) => {
  if (v !== 'CASADO') form.nome_conjuge = ''
})

// -- TESTE: Função simplificada --
const testarSalvar = async (event) => {
  console.log('🔵 FUNÇÃO testarSalvar CHAMADA!')
  console.log('Evento:', event)
  console.log('Dados do formulário:', form)
  
  saving.value = true
  
  try {
    // Teste simples: apenas redirecionar
    console.log('Teste: Redirecionando para /clientes em 2 segundos...')
    
    notify.success('Salvamento simulado. Redirecionando...')
    
    setTimeout(() => {
      console.log('🔴 AGORA VAI REDIRECIONAR!')
      router.push('/clientes').then(() => {
        console.log('✅ Redirecionamento bem-sucedido!')
      }).catch(err => {
        console.error('❌ Erro no redirecionamento:', err)
        // Fallback
        window.location.href = '/clientes'
      })
    }, 2000)
    
  } catch (error) {
    console.error('Erro no teste:', error)
  } finally {
    saving.value = false
  }
}

// -- Form Actions Original --
async function salvar() {
  console.log('🟢 FUNÇÃO salvar CHAMADA!')
  saving.value = true
  
  try {
    console.log('Salvando dados...')
    
    const payload = {
      ...form,
      razao_social: isJuridica.value ? form.nome_completo : null,
      email: form.email ? String(form.email).toLowerCase().trim() : null,
      nome_conjuge: form.estado_civil === 'CASADO' ? (form.nome_conjuge || null) : null,
      enviar_aniversario_email: form.email ? !!form.enviar_aniversario_email : false,
      enviar_aniversario_whatsapp: form.whatsapp ? !!form.enviar_aniversario_whatsapp : false,
      indicacao_id: form.indicacao_id ? Number(form.indicacao_id) : null
    }

    // Remover campos desnecessários
    if (!isJuridica.value) {
      delete payload.cnpj
      delete payload.ie
      delete payload.razao_social
    } else {
      delete payload.cpf
      delete payload.rg
    }

    console.log('Payload enviado:', payload)

    // Chamar o serviço
    const response = await ClienteService.salvar(isEdit.value ? clienteId.value : null, payload)
    console.log('Resposta da API:', response)

    // Sucesso
    notify.success(isEdit.value ? 'Cliente atualizado!' : 'Cliente cadastrado!')
    
    console.log('🟡 Aguardando 1 segundo antes de redirecionar...')
    setTimeout(() => {
      console.log('🔴 Tentando redirecionar para /clientes...')
      router.push('/clientes').then(() => {
        console.log('✅ Redirecionamento bem-sucedido!')
      }).catch(err => {
        console.error('❌ Erro no router.push:', err)
        // Fallback
        window.location.href = '/clientes'
      })
    }, 1000)
    
  } catch (err) {
    console.error('Erro ao salvar:', err)
    notify.error('Erro ao salvar.')
    
  } finally {
    saving.value = false
  }
}

async function excluir() {
  const ok = await confirm.show('Atenção', 'Confirmar exclusão definitiva?')
  if (!ok) return
  
  deleting.value = true
  try {
    await ClienteService.remover(clienteId.value)
    notify.success('Cliente removido!')
    
    setTimeout(() => {
      router.push('/clientes')
    }, 1000)
    
  } catch (err) {
    console.error('Erro ao excluir:', err)
    notify.error('Erro ao excluir.')
  } finally {
    deleting.value = false
  }
}

// Debug: adicionar botão de teste
onMounted(() => {
  console.log('Página carregada. isEdit:', isEdit.value, 'clienteId:', clienteId.value)
  
  // Adicionar botão de teste no console
  window.testRedirect = () => {
    console.log('Testando redirecionamento...')
    router.push('/clientes').then(() => {
      console.log('✅ Teste OK!')
    }).catch(err => {
      console.error('❌ Teste FALHOU:', err)
    })
  }
  
  console.log('Para testar redirecionamento, digite no console: testRedirect()')
  
  carregarDados()
})
</script>