<template>
  <div class="space-y-8 pb-12 animate-in fade-in duration-700">
    <PageHeader
      title="Configurações da Empresa"
      subtitle="Gestão de dados fiscais, bancários e identidade da marca."
      icon="pi pi-building"
      :showBack="false"
      iconClass="bg-slate-900 text-white shadow-2xl shadow-slate-200"
    >
      <template #actions>
        <div class="flex items-center gap-4">
          <Button 
            variant="secondary" 
            @click="gerarPdfDados" 
            class="!rounded-2xl !h-12 border-slate-200 hover:bg-slate-50 transition-all font-bold text-[11px] uppercase tracking-widest"
          >
            <i class="pi pi-file-pdf mr-2"></i>
            Exportar
          </Button>
          
          <Button 
            variant="primary" 
            :loading="salvando" 
            @click="salvar" 
            class="!rounded-2xl !h-12 !px-10 shadow-xl shadow-brand-primary/20 font-black text-[11px] uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-95 transition-all"
          >
            <i class="pi pi-save mr-2"></i>
            Salvar Alterações
          </Button>
        </div>
      </template>
    </PageHeader>

    <Card :shadow="true" class="!rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden">
      <div class="grid grid-cols-12 gap-0">
        
        <div class="col-span-12 lg:col-span-3 bg-slate-50/50 p-8 border-b lg:border-b-0 lg:border-r border-slate-100">
          <div class="sticky top-8">
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Identidade Visual</h3>
            
            <div class="relative flex flex-col items-center group">
              <div
                class="w-48 h-48 rounded-[2.5rem] flex items-center justify-center overflow-hidden bg-white shadow-xl shadow-slate-200/60 border-2 border-dashed border-slate-200 group-hover:border-brand-primary transition-all cursor-pointer relative"
                @click="fileInput?.click()"
              >
                <img v-if="form.logo_url" :src="form.logo_url" class="object-contain w-full h-full p-6 transition-transform group-hover:scale-110" />
                <div v-else class="flex flex-col items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <i class="pi pi-cloud-upload text-xl"></i>
                  </div>
                  <span class="text-[10px] font-black text-slate-400 uppercase">Subir Logo</span>
                </div>
              </div>

              <button 
                v-if="form.logo_url"
                type="button"
                @click.stop="removerLogo" 
                class="absolute -top-2 -right-2 bg-white text-rose-500 shadow-xl rounded-2xl w-11 h-11 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all z-10 border border-rose-100"
              >
                <i class="pi pi-trash"></i>
              </button>
              
              <p class="mt-4 text-[9px] font-bold text-slate-400 text-center uppercase tracking-tighter">
                Recomendado: PNG ou SVG <br> (Fundo transparente)
              </p>
              <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />
            </div>

            <div class="mt-12 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Documentos Legais</h3>
                <label class="cursor-pointer text-[10px] font-black text-brand-primary hover:text-brand-dark uppercase tracking-widest bg-brand-primary/5 px-3 py-1 rounded-full">
                  Anexar <input type="file" class="hidden" @change="handleDocumentUpload" />
                </label>
              </div>

              <div class="space-y-2">
                <div v-if="form.documentos.length === 0" class="text-center py-8 px-4 border border-dashed border-slate-200 rounded-[1.5rem] bg-white/50">
                  <i class="pi pi-folder-open text-slate-200 text-2xl mb-2"></i>
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Nenhum anexo</p>
                </div>

                <div v-for="(doc, index) in form.documentos" :key="index" class="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl hover:border-brand-primary/30 hover:shadow-md transition-all">
                  <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                      <i class="pi pi-file-pdf"></i>
                    </div>
                    <span class="text-[10px] font-black truncate text-slate-600 uppercase tracking-tighter">{{ doc.nome }}</span>
                  </div>
                  <button @click="removerDocumento(index)" class="text-slate-300 hover:text-rose-500 transition-colors px-2">
                    <i class="pi pi-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-9 p-8 lg:p-12 space-y-12">
          
          <section>
            <div class="flex items-center gap-3 mb-8">
              <div class="w-1 h-6 bg-brand-primary rounded-full"></div>
              <h3 class="text-sm font-black text-slate-800 uppercase tracking-[0.15em]">Dados Jurídicos</h3>
            </div>
            <div class="grid grid-cols-12 gap-6">
              <Input v-model="form.razao_social" label="Razão Social" placeholder="Ex: Nome da Empresa LTDA" class="col-span-12 md:col-span-8" />
              <Input v-model="form.nome_fantasia" label="Nome Fantasia" placeholder="Nome Comercial" class="col-span-12 md:col-span-4" />
              <Input v-model="cnpjMask" label="CNPJ" placeholder="00.000.000/0000-00" class="col-span-12 md:col-span-6" @blur="onCnpjBlur" />
              <Input v-model="ieMask" label="Inscrição Estadual" placeholder="Isento ou Número" class="col-span-12 md:col-span-6" />
            </div>
          </section>

          <section>
            <div class="flex items-center gap-3 mb-8">
              <div class="w-1 h-6 bg-brand-primary rounded-full"></div>
              <h3 class="text-sm font-black text-slate-800 uppercase tracking-[0.15em]">Sede Administrativa</h3>
            </div>
            <div class="grid grid-cols-12 gap-6">
              <Input v-model="cepMask" label="CEP" class="col-span-12 md:col-span-3" @blur="onCepBlur" />
              <Input v-model="form.logradouro" label="Endereço" class="col-span-12 md:col-span-7" />
              <Input v-model="form.numero" label="Nº" class="col-span-12 md:col-span-2" />
              <Input v-model="form.bairro" label="Bairro" class="col-span-12 md:col-span-5" />
              <Input v-model="form.cidade" label="Cidade" class="col-span-12 md:col-span-5" />
              <Input v-model="form.uf" label="UF" class="col-span-12 md:col-span-2" maxlength="2" />
              <Input v-model="form.email" label="E-mail de Contato" icon="pi pi-envelope" class="col-span-12 md:col-span-6" />
              <Input v-model="telefoneMask" label="WhatsApp Business" icon="pi pi-whatsapp" class="col-span-12 md:col-span-6" />
            </div>
          </section>

<section class="mt-12">
  <div class="flex items-center gap-3 mb-8">
    <div class="w-1.5 h-6 bg-brand-primary rounded-full"></div>
    <h3 class="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Dados Bancários & Recebimento</h3>
  </div>
  
  <div class="grid grid-cols-12 gap-x-6 gap-y-8 p-8 rounded-[2rem] border border-slate-100 bg-slate-50/30">
    
    <div class="col-span-12 md:col-span-6">
       <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Titular da Conta</label>
       <Input v-model="form.banco_titular" placeholder="Nome completo do titular" class="premium-input" />
    </div>

    <div class="col-span-12 md:col-span-6">
       <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Instituição Bancária</label>
       <Input v-model="form.banco_nome" placeholder="Ex: Banco do Brasil, Itaú..." class="premium-input" />
    </div>

    <div class="col-span-12 md:col-span-3">
       <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Agência</label>
       <Input v-model="form.banco_agencia" placeholder="0000" class="premium-input" />
    </div>

    <div class="col-span-12 md:col-span-4">
       <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Número da Conta</label>
       <Input v-model="form.banco_conta" placeholder="00000-0" class="premium-input" />
    </div>
    
    <div class="col-span-12 md:col-span-5 relative">
      <label class="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-2 block ml-1">Chave Pix Principal</label>
      <div class="relative group">
        <Input 
          v-model="form.pix" 
          placeholder="CNPJ, E-mail ou Celular" 
          class="premium-input !border-brand-primary/20 focus:!border-brand-primary pr-12" 
        />
        <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
           <i class="pi pi-qrcode text-slate-300 group-focus-within:text-brand-primary transition-colors"></i>
           <button 
             type="button"
             @click="copiarPix"
             class="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all"
           >
             <i class="pi pi-copy text-sm"></i>
           </button>
        </div>
      </div>
    </div>
  </div>
</section>

        </div>
      </div>
    </Card>
  </div>
</template>

<style scoped>
/* Estilo para os inputs dentro da área escura */
:deep(.premium-dark-input) {
  /* Fundo branco com leve transparência para não "estourar" tanto */
  background-color: rgba(255, 255, 255, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 1rem !important; /* Bordas mais arredondadas */
  height: 3.5rem !important; /* Um pouco mais alto para parecer mais "luxuoso" */
  transition: all 0.3s ease;
  font-weight: 700;
  color: #1e293b !important;
}

:deep(.premium-dark-input:focus) {
  background-color: #ffffff !important;
  border-color: var(--brand-primary) !important;
  box-shadow: 0 0 0 4px rgba(var(--brand-primary-rgb), 0.1) !important;
}

/* Ajuste do placeholder para os inputs dark */
:deep(.premium-dark-input::placeholder) {
  color: #94a3b8 !important;
  font-weight: 500;
  text-transform: lowercase;
}
</style>

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
  banco_titular: '',
  banco_nome: '',
  banco_agencia: '',
  banco_conta: '',
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