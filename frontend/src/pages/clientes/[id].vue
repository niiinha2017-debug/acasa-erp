<template>
  <Card class="mt-4 mb-8 mx-2 lg:mx-4 shadow-xl rounded-[2.5rem] overflow-hidden">
    <PageHeader
      :title="isEdit ? `Editar Cliente #${clienteId}` : 'Novo Cliente'"
      subtitle="Gerenciamento de dados cadastrais e contato"
      icon="pi pi-user-plus"
      :backTo="'/clientes'"
      class="border-b border-border-ui"
    />

    <div class="p-8 lg:p-12">
      <Loading v-if="loading" />

      <form v-else class="space-y-10" @submit.prevent="salvar" autocomplete="off">
        
        <div class="grid grid-cols-12 gap-6 items-end">
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

        <hr class="border-border-ui opacity-50" />

        <div class="grid grid-cols-12 gap-6">
          <Input
            :class="isJuridica ? 'col-span-12 md:col-span-6' : 'col-span-12 md:col-span-9'"
            v-model="form.nome_completo"
            :label="isJuridica ? 'Razão Social' : 'Nome Completo'"
            placeholder="Digite o nome principal..."
            required
          />

          <Input
            v-if="isJuridica"
            class="col-span-12 md:col-span-3"
            v-model="form.nome_fantasia"
            label="Nome Fantasia"
            placeholder="Opcional"
          />

          <Input
            class="col-span-12 md:col-span-3"
            v-model="form.data_nascimento"
            :label="isJuridica ? 'Data de Abertura' : 'Data de Nascimento'"
            type="date"
            required
          />
        </div>

        <div class="grid grid-cols-12 gap-6">
          <template v-if="!isJuridica">
            <Input class="col-span-12 md:col-span-4" v-model="form.cpf" label="CPF" @input="form.cpf = maskCPF(form.cpf)" />
            <Input class="col-span-12 md:col-span-4" v-model="form.rg" label="RG" @input="form.rg = maskRG(form.rg)" />
          </template>

          <template v-else>
            <Input class="col-span-12 md:col-span-4" v-model="form.cnpj" label="CNPJ" @input="form.cnpj = maskCNPJ(form.cnpj)" @blur="onBlurCnpj" />
            <Input class="col-span-12 md:col-span-4" v-model="form.ie" label="IE" @input="form.ie = maskIE(form.ie)" />
          </template>

          <Input class="col-span-12 md:col-span-4" v-model="form.status" label="Status" placeholder="ATIVO" required />
        </div>

        <hr class="border-border-ui opacity-50" />

        <div class="grid grid-cols-12 gap-6 items-start">
          <Input class="col-span-12 md:col-span-4" v-model="form.email" label="E-mail" type="email" :forceUpper="false" />
          <Input class="col-span-12 md:col-span-4" v-model="form.whatsapp" label="WhatsApp" @input="form.whatsapp = maskTelefone(form.whatsapp)" />
          <Input class="col-span-12 md:col-span-4" v-model="form.telefone" label="Fixo" @input="form.telefone = maskTelefone(form.telefone)" />
          
          <div class="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-border-ui mt-2">
            <CustomCheckbox v-model="form.enviar_aniversario_email" label="Aviso por E-mail" :disabled="!form.email" />
            <CustomCheckbox v-model="form.enviar_aniversario_whatsapp" label="Aviso por WhatsApp" :disabled="!form.whatsapp" />
          </div>

          <div class="col-span-12 md:col-span-4 flex flex-col pt-4">
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-1">Estado Civil</label>
            <div class="relative w-full">
              <select v-model="form.estado_civil" class="w-full h-14 px-5 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 outline-none text-sm shadow-sm focus:ring-4 focus:ring-brand-primary/10 appearance-none">
                <option value="">SELECIONE...</option>
                <option value="SOLTEIRO">SOLTEIRO</option>
                <option value="CASADO">CASADO</option>
                <option value="DIVORCIADO">DIVORCIADO</option>
                <option value="VIUVO">VIÚVO(A)</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-slate-400">
                <i class="pi pi-chevron-down text-[10px]"></i>
              </div>
            </div>
          </div>

          <div class="col-span-12 md:col-span-8 pt-4">
            <transition name="fade">
              <Input v-if="form.estado_civil === 'CASADO'" v-model="form.nome_conjuge" label="Nome do Cônjuge" class="animate-page-in" />
            </transition>
          </div>
        </div>

<hr class="border-border-ui opacity-50" />

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
          />
          <Input 
            class="col-span-12 md:col-span-2" 
            v-model="form.numero" 
            label="Nº" 
            placeholder="123"
          />
          
          <Input 
            class="col-span-12 md:col-span-4" 
            v-model="form.bairro" 
            label="Bairro" 
          />
          <Input 
            class="col-span-12 md:col-span-5" 
            v-model="form.cidade" 
            label="Cidade" 
          />
          <Input 
            class="col-span-12 md:col-span-3" 
            v-model="form.estado" 
            label="UF (Estado)" 
            placeholder="Ex: SP"
          />
          <Input 
            class="col-span-12" 
            v-model="form.complemento" 
            label="Complemento / Referência" 
            placeholder="Apt, Bloco, Próximo a..."
          />
        </div>

        <div class="pt-10 mt-6 border-t border-border-ui">
          <FormActions
            :isEdit="isEdit"
            :loadingSave="saving"
            :loadingDelete="deleting"
            :showDelete="isEdit"
            @delete="excluir"
          />
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
    .filter(c => !isEdit.value || Number(c.id) !== clienteId.value) // Filtra para não indicar a si mesmo
    .map(c => ({
      label: c.nome_completo || c.razao_social || `ID #${c.id}`,
      value: c.id
    }))
})

// -- Operacional --
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

// -- Handlers Data --
async function carregarDados() {
  try {
    const [resClientes, resUnico] = await Promise.all([
      ClienteService.listar(),
      isEdit.value ? ClienteService.buscar(clienteId.value) : null
    ])

    listaClientes.value = Array.isArray(resClientes?.data) ? resClientes.data : []

    if (resUnico?.data) {
      const c = resUnico.data
      Object.assign(form, {
        ...c,
        data_nascimento: c.data_nascimento?.split('T')[0] || '',
        enviar_aniversario_email: !!c.enviar_aniversario_email,
        enviar_aniversario_whatsapp: !!c.enviar_aniversario_whatsapp
      })
      isJuridica.value = !!c.cnpj
    }
  } catch (err) {
    notify.error('Erro ao carregar dados.')
  }
}

// Limpa campos específicos ao trocar tipo de pessoa
watch(isJuridica, (val) => {
  if (val) { form.cpf = ''; form.rg = '' } 
  else { form.cnpj = ''; form.ie = ''; form.nome_fantasia = '' }
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


async function salvar() {
  saving.value = true
  try {
    const payload = {
      ...form,

      // PJ: usa nome_completo como razão social
      razao_social: isJuridica.value ? form.nome_completo : null,

      // email opcional (manda null se vazio)
      email: form.email ? String(form.email).toLowerCase().trim() : null,

      // cônjuge só se casado
      nome_conjuge: form.estado_civil === 'CASADO' ? (form.nome_conjuge || null) : null,

      // flags: se não tem contato, não marca
      enviar_aniversario_email: form.email ? !!form.enviar_aniversario_email : false,
      enviar_aniversario_whatsapp: form.whatsapp ? !!form.enviar_aniversario_whatsapp : false,
    }

    await ClienteService.salvar(isEdit.value ? clienteId.value : null, payload)
    notify.success('Dados salvos com sucesso!')
    router.push('/clientes')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao salvar.')
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
    notify.success('Cliente removido.')
    router.push('/clientes')
  } catch {
    notify.error('Erro ao excluir.')
  } finally {
    deleting.value = false
  }
}

onMounted(carregarDados)
</script>