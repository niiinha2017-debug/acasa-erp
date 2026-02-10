<template>
    <Card minimal class="overflow-hidden">
      <PageHeader
        :title="isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'"
        :subtitle="isEdit ? `ID: #${fornecedorId}` : 'Cadastro de parceiros comerciais'"
        icon="pi pi-truck"
        :backTo="'/fornecedor'"
        minimal
      />

      <div class="p-6 md:p-8 relative">
        <Loading v-if="loading" />

        <form v-else class="space-y-12" @submit.prevent="confirmarSalvarFornecedor">
          
          <section class="page-section space-y-4">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">01. Identificação Jurídica</h3>
            <div class="grid grid-cols-12 gap-x-6 gap-y-4">
              <Input
                class="col-span-12 md:col-span-4"
                v-model="cnpjMask"
                label="CNPJ *"
                required
                placeholder="00.000.000/0000-00"
                @blur="tratarBuscaCnpj"
              />
              <Input
                class="col-span-12 md:col-span-8"
                v-model="form.razao_social"
                label="Razão Social *"
                required
                placeholder="Ex: CITYFER COMÉRCIO LTDA"
              />
              <Input
                class="col-span-12 md:col-span-7"
                v-model="form.nome_fantasia"
                label="Nome Fantasia *"
                required
                placeholder="Ex: CITYFER"
              />
              <Input
                class="col-span-12 md:col-span-5"
                v-model="ieMask"
                label="Inscrição Estadual"
                placeholder="Inscrição Estadual"
              />
            </div>
          </section>

          <section class="page-section space-y-4">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">02. Contato e Comercial</h3>
            <div class="grid grid-cols-12 gap-x-6 gap-y-4">
              <Input
                class="col-span-12 md:col-span-4"
                v-model="form.email"
                label="E-mail"
                placeholder="contato@empresa.com"
                :forceUpper="false"
              />
              <Input
                class="col-span-12 md:col-span-4"
                v-model="telefoneMask"
                label="Telefone"
                placeholder="(00) 0000-0000"
              />
              <Input
                class="col-span-12 md:col-span-4"
                v-model="whatsappMask"
                label="WhatsApp"
                placeholder="(00) 00000-0000"
              />

              <div class="col-span-12 line-separator"></div>

              <Input
                class="col-span-12 md:col-span-8"
                v-model="form.forma_pagamento"
                label="Condição de Pagamento Padrão"
                placeholder="Ex: BOLETO 30 DIAS"
              />
              <Input
                class="col-span-12 md:col-span-4"
                v-model.number="form.data_vencimento"
                type="number"
                label="Melhor Dia Vencimento"
                placeholder="Ex: 10"
              />
            </div>  
          </section>

          <section class="page-section space-y-4">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">03. Localização</h3>
            <div class="grid grid-cols-12 gap-x-6 gap-y-4">
  <Input
    class="col-span-12 md:col-span-3"
    v-model="cepMask"
    label="CEP"
    placeholder="00000-000"
    @blur="tratarBuscaCep"
  />

  <Input
    class="col-span-12 md:col-span-7"
    v-model="form.endereco"
    label="Endereço"
    placeholder="Rua, Av..."
  />

  <Input
    id="numero-input"
    class="col-span-12 md:col-span-2"
    v-model="form.numero"
    label="Nº"
    placeholder="123"
  />

  <Input
    class="col-span-12 md:col-span-12"
    v-model="form.complemento"
    label="Complemento"
    placeholder="Ex: GALPÃO 2 / BLOCO B"
  />

  <Input
    class="col-span-12 md:col-span-5"
    v-model="form.bairro"
    label="Bairro"
    placeholder="Bairro"
  />

  <Input
    class="col-span-12 md:col-span-5"
    v-model="form.cidade"
    label="Cidade"
    placeholder="Cidade"
  />

  <Input
    class="col-span-12 md:col-span-2"
    v-model="form.estado"
    label="UF"
    maxlength="2"
    placeholder="SP"
  />
</div>

          </section>

          <div class="page-actions">
            <Button
              v-if="isEdit && can('fornecedores.excluir')"
              variant="danger"
              type="button"
              @click="confirmarExcluirFornecedor"
            >
              <i class="pi pi-trash mr-2 text-xs"></i>
              Excluir
            </Button>
            <div class="flex-1"></div>
            <Button variant="outline" type="button" @click="router.push('/fornecedor')">
              Voltar
            </Button>
            <Button
              v-if="can(isEdit ? 'fornecedores.editar' : 'fornecedores.criar')"
              variant="primary"
              type="submit"
            >
              <i class="pi pi-save mr-2 text-xs"></i>
              {{ isEdit ? 'Salvar' : 'Cadastrar' }}
            </Button>
          </div>
        </form>
      </div>
    </Card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FornecedorService } from '@/services/index'
import { notify } from '@/services/notify'
import { maskCNPJ, maskTelefone, maskCEP, maskIE } from '@/utils/masks'
import { buscarCep, buscarCnpj } from '@/utils/utils'
import { confirm } from '@/services/confirm'
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'fornecedores.ver' } })


  const route = useRoute()
  const router = useRouter()
  const isEdit = computed(() => route.params.id && route.params.id !== 'novo')
  const fornecedorId = computed(() => isEdit.value ? route.params.id : null)

  const loading = ref(false)
  const salvando = ref(false)

  const form = ref({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    ie: '',
    email: '',
    telefone: '',
    whatsapp: '',
    forma_pagamento: '',
    data_vencimento: null,
    cep: '',
    endereco: '',
    numero: '',
    complemento: '', // ✅ ADICIONADO
    bairro: '',
    cidade: '',
    estado: '',
  })

  // Masks (mesma lógica)
  const cnpjMask = computed({ get: () => form.value.cnpj, set: (v) => (form.value.cnpj = maskCNPJ(v)) })
  const ieMask = computed({ get: () => form.value.ie, set: (v) => (form.value.ie = maskIE(v)) })
  const telefoneMask = computed({ get: () => form.value.telefone, set: (v) => (form.value.telefone = maskTelefone(v)) })
  const whatsappMask = computed({ get: () => form.value.whatsapp, set: (v) => (form.value.whatsapp = maskTelefone(v)) })
  const cepMask = computed({ get: () => form.value.cep, set: (v) => (form.value.cep = maskCEP(v)) })

  async function tratarBuscaCnpj() {
    if (!form.value.cnpj || String(form.value.cnpj).length < 18) return
    loading.value = true
    try {
      const dados = await buscarCnpj(form.value.cnpj)
      if (dados) {
        Object.assign(form.value, {
          razao_social: dados.razao_social || form.value.razao_social,
          nome_fantasia: dados.nome_fantasia || form.value.nome_fantasia,
          telefone: dados.telefone ? maskTelefone(dados.telefone) : form.value.telefone,
          cep: dados.cep ? maskCEP(dados.cep) : form.value.cep,
          endereco: dados.endereco || form.value.endereco,
          numero: dados.numero || form.value.numero,
          bairro: dados.bairro || form.value.bairro,
          cidade: dados.cidade || form.value.cidade,
          estado: dados.estado || form.value.estado,
          ie: dados.ie || form.value.ie,
        })
        notify.success('Dados importados via CNPJ!')
      }
    } catch (e) {
      notify.error('Erro ao buscar CNPJ.')
    } finally { loading.value = false }
  }

  async function tratarBuscaCep() {
    if (!form.value.cep || String(form.value.cep).length < 9) return
    const dados = await buscarCep(form.value.cep)
    if (dados) {
      form.value.endereco = dados.logradouro || ''
      form.value.bairro = dados.bairro || ''
      form.value.cidade = dados.localidade || ''
      form.value.estado = dados.uf || ''
      document.getElementById('numero-input')?.focus()
    }
  }

  // SALVAR
  async function confirmarSalvarFornecedor() {
    const perm = isEdit.value ? 'fornecedores.editar' : 'fornecedores.criar'
    if (!can(perm)) return notify.error('Acesso negado.')

    const ok = await confirm.show(
      isEdit.value ? 'Salvar Alterações' : 'Finalizar Cadastro',
      isEdit.value
        ? `Deseja salvar as alterações do Fornecedor #${fornecedorId.value}?`
        : 'Deseja finalizar o cadastro deste fornecedor?',
    )
    if (!ok) return
    await salvar()
  }

  // EXCLUIR
  async function confirmarExcluirFornecedor() {
    if (!can('fornecedores.excluir')) return notify.error('Acesso negado.')

    const ok = await confirm.show(
      'Excluir Fornecedor',
      `Deseja realmente excluir o Fornecedor #${fornecedorId.value}? Esta ação não pode ser desfeita.`,
    )
    if (!ok) return
    await excluir()
  }


  async function excluir() {
    if (!can('fornecedores.excluir')) return notify.error('Acesso negado.')
    
    salvando.value = true
    try {
      await FornecedorService.remover(fornecedorId.value)
      notify.success('Fornecedor removido.')
      router.push('/fornecedor')
    } catch (e) {
      notify.error('Erro ao excluir.')
    } finally {
      salvando.value = false
    }
  }


  function payloadParaApi() {
    return {
      ...form.value,
      data_vencimento: form.value.data_vencimento ? Number(form.value.data_vencimento) : null,
    }
  }

  async function salvar() {
    const perm = isEdit.value ? 'fornecedores.editar' : 'fornecedores.criar'
    if (!can(perm)) return notify.error('Acesso negado.')

    salvando.value = true
    try {
      const payload = payloadParaApi()
      await FornecedorService.salvar(fornecedorId.value, payload)
      notify.success('Sucesso!')
      router.push('/fornecedor')
    } catch (e) {
      notify.error('Erro ao salvar.')
    } finally { salvando.value = false }
  }

  onMounted(async () => {
    const perm = isEdit.value ? 'fornecedores.editar' : 'fornecedores.criar'
    if (!can(perm)) {
      notify.error('Acesso negado.')
      router.push('/fornecedor')
      return
    }

    if (isEdit.value) {
      loading.value = true
      try {
        const { data } = await FornecedorService.buscar(fornecedorId.value)
        form.value = { ...form.value, ...data }
      } finally {
        loading.value = false
      }
    }
  })

  </script>
