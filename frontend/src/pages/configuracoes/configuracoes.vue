<template>
  <div class="space-y-6 pb-10">
    <PageHeader
      title="Configurações da Empresa"
      subtitle="Gestão de dados fiscais, bancários e documentos oficiais."
      icon="pi pi-building"
      :showBack="false"
      iconClass="bg-gray-900 text-white shadow-lg"
    >
      <template #actions>
        <div class="flex items-center gap-3">
          <Button variant="secondary" @click="gerarPdfDados" class="!rounded-2xl shadow-sm">
            <i class="pi pi-file-pdf mr-2 text-xs"></i>
            Exportar Dados
          </Button>
          
          <Button variant="primary" :loading="salvando" @click="salvar" class="!rounded-2xl !px-8 shadow-xl shadow-gray-900/10">
            <i class="pi pi-save mr-2 text-xs"></i>
            Salvar Alterações
          </Button>
        </div>
      </template>
    </PageHeader>

    <Card :shadow="true" class="mt-8">
      <div class="p-8 grid grid-cols-12 gap-8">
        
        <div class="col-span-12 lg:col-span-3 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-slate-800 pb-6 lg:pb-0 lg:pr-8">
          
          <div class="relative self-center mb-8">
            <div
              class="w-40 h-40 rounded-[2rem] flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900 shadow-inner border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-brand-primary cursor-pointer transition-all"
              @click="fileInput?.click()"
            >
              <img v-if="form.logo_url" :src="form.logo_url" class="object-contain w-full h-full p-4" />
              <div v-else class="flex flex-col items-center">
                <i class="pi pi-cloud-upload text-4xl text-gray-300"></i>
                <span class="text-[10px] font-bold text-gray-400 mt-2 uppercase">Logo</span>
              </div>
            </div>
            <button 
              v-if="form.logo_url"
              type="button"
              @click.stop="removerLogo" 
              class="absolute -top-2 -right-2 bg-rose-500 text-white shadow-xl rounded-full w-10 h-10 flex items-center justify-center hover:bg-rose-600 transition-all z-[50]"
            >
              <i class="pi pi-trash text-sm"></i>
            </button>
            <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />
          </div>

          <div class="space-y-4">
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              Documentos
              <label class="cursor-pointer text-brand-primary hover:underline">
                Anexar <input type="file" class="hidden" @change="handleDocumentUpload" />
              </label>
            </h3>
            <div v-if="form.documentos.length === 0" class="text-center p-4 border border-dashed border-gray-100 dark:border-slate-800 rounded-xl">
              <p class="text-[10px] text-slate-400">Nenhum documento anexado.</p>
            </div>
            <div v-for="(doc, index) in form.documentos" :key="index" class="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-900 rounded-lg group">
              <div class="flex items-center gap-2 overflow-hidden">
                <i class="pi pi-file-pdf text-rose-500"></i>
                <span class="text-[10px] font-bold truncate text-slate-600 dark:text-slate-400">{{ doc.nome }}</span>
              </div>
              <button @click="removerDocumento(index)" class="opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity">
                <i class="pi pi-times-circle"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-9 space-y-8">
          
          <div>
            <h3 class="text-[11px] font-black text-brand-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span class="w-4 h-[2px] bg-brand-primary"></span>
              Identificação Jurídica
            </h3>
            <div class="grid grid-cols-12 gap-4">
              <Input v-model="form.razao_social" label="Razão Social" class="col-span-12 md:col-span-8" />
              <Input v-model="form.nome_fantasia" label="Nome Fantasia" class="col-span-12 md:col-span-4" />
              <Input v-model="cnpjMask" label="CNPJ" class="col-span-12 md:col-span-6" @blur="onCnpjBlur" />
              <Input v-model="ieMask" label="Inscrição Estadual" class="col-span-12 md:col-span-6" />
            </div>
          </div>

          <div>
            <h3 class="text-[11px] font-black text-brand-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span class="w-4 h-[2px] bg-brand-primary"></span>
              Localização e Contato
            </h3>
            <div class="grid grid-cols-12 gap-4">
              <Input v-model="cepMask" label="CEP" class="col-span-12 md:col-span-3" @blur="onCepBlur" />
              <Input v-model="form.logradouro" label="Endereço Completo" class="col-span-12 md:col-span-7" />
              <Input v-model="form.numero" label="Nº" class="col-span-12 md:col-span-2" />
              <Input v-model="form.bairro" label="Bairro" class="col-span-12 md:col-span-5" />
              <Input v-model="form.cidade" label="Cidade" class="col-span-12 md:col-span-5" />
              <Input v-model="form.uf" label="UF" class="col-span-12 md:col-span-2" maxlength="2" />
              <Input v-model="form.email" label="E-mail Administrativo" class="col-span-12 md:col-span-6" />
              <Input v-model="telefoneMask" label="WhatsApp / Fone" class="col-span-12 md:col-span-6" />
            </div>
          </div>

<div class="mt-8">
  <h3 class="text-[11px] font-black text-brand-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
    <span class="w-4 h-[2px] bg-brand-primary"></span>
    Dados Bancários e Pix
  </h3>
  
  <div class="grid grid-cols-12 gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60 shadow-inner">
    <Input v-model="form.banco_titular" label="Titular da Conta" class="col-span-12 md:col-span-6" />
    <Input v-model="form.banco_nome" label="Banco" class="col-span-12 md:col-span-6" />
    <Input v-model="form.banco_agencia" label="Agência" class="col-span-12 md:col-span-3" />
    <Input v-model="form.banco_conta" label="Conta Corrente" class="col-span-12 md:col-span-4" />
    
    <div class="col-span-12 md:col-span-5 relative">
      <Input v-model="form.pix" label="Chave Pix" placeholder="CNPJ, E-mail ou Celular" />
      <button 
        v-if="form.pix"
        type="button"
        @click="copiarPix"
        class="absolute right-2 bottom-2 p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
      >
        <i class="pi pi-copy text-xs"></i>
      </button>
    </div>
  </div>
</div>

        </div> </div> </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ConfiguracaoService } from '@/services/index'
import { notify } from '@/services/notify' 
import { confirm } from '@/services/confirm'
import { maskCNPJ, maskCEP, maskTelefone, maskIE, onlyNumbers } from '@/utils/masks'
import { buscarCep, buscarCnpj } from '@/utils/utils'

const fileInput = ref(null)
const salvando = ref(false)

const form = ref({
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  ie: '',
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
  email: '',
  telefone: '',
  logo_url: '',
  // Campos bancários e Pix
  banco_titular: 'Gustavo Costa de Souza',
  banco_nome: '',
  banco_agencia: '0782',
  banco_conta: '130012271',
  pix: '', 
  documentos: []
})

// --- MÁSCARAS ---
const cnpjMask = computed({
  get: () => maskCNPJ(form.value.cnpj),
  set: (v) => (form.value.cnpj = onlyNumbers(v).slice(0, 14)),
})
const cepMask = computed({
  get: () => maskCEP(form.value.cep),
  set: (v) => (form.value.cep = onlyNumbers(v).slice(0, 8)),
})
const ieMask = computed({
  get: () => maskIE(form.value.ie),
  set: (v) => (form.value.ie = onlyNumbers(v).slice(0, 12)),
})
const telefoneMask = computed({
  get: () => maskTelefone(form.value.telefone),
  set: (v) => (form.value.telefone = onlyNumbers(v).slice(0, 11)),
})

// --- BUSCAS ---
const onCnpjBlur = async () => {
  const cnpj = form.value.cnpj.replace(/\D/g, '')
  if (cnpj.length !== 14) return
  try {
    const d = await buscarCnpj(cnpj)
    if (d) {
      form.value.razao_social = d.razao_social || form.value.razao_social
      form.value.nome_fantasia = d.nome_fantasia || form.value.nome_fantasia
      form.value.logradouro = d.endereco || ''
      form.value.numero = d.numero || ''
      form.value.bairro = d.bairro || ''
      form.value.cidade = d.cidade || ''
      form.value.uf = (d.estado || '').toUpperCase() 
      form.value.cep = (d.cep || '').replace(/\D/g, '')
      if (d.ie) form.value.ie = d.ie
      // Sugestão: Se o Pix estiver vazio, sugere o CNPJ
      if (!form.value.pix) form.value.pix = maskCNPJ(cnpj)
      notify.success('Dados importados com sucesso!')
    }
  } catch (err) { notify.error('Erro ao consultar CNPJ') }
}

const onCepBlur = async () => {
  const cep = form.value.cep.replace(/\D/g, '')
  if (cep.length !== 8) return
  const d = await buscarCep(cep)
  if (d && !d.erro) {
    form.value.logradouro = d.logradouro
    form.value.bairro = d.bairro
    form.value.cidade = d.localidade
    form.value.uf = d.uf
    notify.success('Endereço atualizado!')
  }
}

// --- LOGO E DOCUMENTOS ---
const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { form.value.logo_url = ev.target.result }
  reader.readAsDataURL(file)
}

const removerLogo = async () => {
  const ok = await confirm.show('Remover Logo', 'Deseja realmente remover a logomarca?')
  if (ok) form.value.logo_url = ''
}

const handleDocumentUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  form.value.documentos.push({ nome: file.name, size: file.size })
  notify.success('Documento anexado.')
}

const removerDocumento = (index) => form.value.documentos.splice(index, 1)

// --- UTILITÁRIOS ---
const copiarPix = () => {
  if (!form.value.pix) return
  navigator.clipboard.writeText(form.value.pix).then(() => {
    notify.success('Chave Pix copiada!')
  })
}

// --- AÇÕES FINAIS ---
const salvar = async () => {
  salvando.value = true
  try {
    await ConfiguracaoService.salvar(form.value)
    notify.success('Configurações salvas!')
  } catch (err) { notify.error('Erro ao salvar.') }
  finally { salvando.value = false }
}

const gerarPdfDados = () => {
  const win = window.open('', '_blank')
  win.document.write(`
    <html>
      <head>
        <title>Dados Cadastrais - ${form.value.nome_fantasia}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .header { display: flex; align-items: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { max-width: 150px; max-height: 100px; margin-right: 20px; }
          .title { font-size: 20px; font-weight: bold; text-transform: uppercase; }
          .section-title { background: #f4f4f4; padding: 10px; font-size: 16px; font-weight: bold; margin-top: 25px; border-left: 5px solid #333; }
          .data-row { margin: 8px 0; font-size: 14px; }
          .label { font-weight: bold; min-width: 120px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="header">
          ${form.value.logo_url ? `<img src="${form.value.logo_url}" class="logo" />` : ''}
          <div class="title">DADOS CADASTRAIS - ${form.value.nome_fantasia}</div>
        </div>

        <div class="data-row"><span class="label">Razão Social:</span> ${form.value.razao_social}</div>
        <div class="data-row"><span class="label">CNPJ:</span> ${cnpjMask.value} ${form.value.ie ? `| <span class="label">IE:</span> ${form.value.ie}` : ''}</div>
        <div class="data-row"><span class="label">Endereço:</span> ${form.value.logradouro}, ${form.value.numero} - ${form.value.bairro}</div>
        <div class="data-row"><span class="label">Cidade:</span> ${form.value.cidade} - ${form.value.uf}</div>
        <div class="data-row"><span class="label">CEP:</span> ${cepMask.value}</div>
        <div class="data-row"><span class="label">Contato:</span> ${form.value.email} | ${telefoneMask.value}</div>

        <div class="section-title">DADOS BANCÁRIOS E PIX</div>
        <div class="data-row"><span class="label">Titular:</span> ${form.value.banco_titular}</div>
        <div class="data-row"><span class="label">Banco:</span> ${form.value.banco_nome || 'Não informado'}</div>
        <div class="data-row"><span class="label">Agência:</span> ${form.value.banco_agencia} | <span class="label" style="min-width:auto">Conta:</span> ${form.value.banco_conta}</div>
        <div class="data-row"><span class="label">Chave PIX:</span> <strong>${form.value.pix || 'Não informada'}</strong></div>

        <div style="margin-top: 50px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #EEE; padding-top: 10px;">
          Documento gerado em ${new Date().toLocaleDateString('pt-BR')} via Sistema ERP ACASA
        </div>
      </body>
    </html>
  `)
  win.document.close()
  setTimeout(() => { win.print() }, 500)
}

onMounted(async () => {
  const data = await ConfiguracaoService.carregar()
  if (data) Object.assign(form.value, data)
})
</script>