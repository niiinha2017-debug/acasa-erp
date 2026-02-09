<template>
  <div class="w-full max-w-[1200px] mx-auto space-y-6 animate-page-in pb-20">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <i class="pi pi-building text-lg"></i>
        </div>
        <div>
          <h1 class="text-lg font-black text-slate-800 uppercase tracking-tight">Dados da Empresa</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Configurações fiscais e de recebimento
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Button 
         v-if="can('configuracoes.empresa.ver')"
          variant="ghost" 
          class="flex-1 sm:flex-none !rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200"
          @click="confirmarExportarDadosEmpresa"
        >
          <i class="pi pi-external-link mr-2"></i> Exportar
        </Button>
        <Button 
        
  v-if="can('configuracoes.empresa.editar')"
          class="flex-1 sm:flex-none !rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand-primary hover:bg-brand-primary/90"
          :loading="salvando"
          @click="confirmarSalvarDadosEmpresa"
        >
          <i class="pi pi-check-circle mr-2"></i> Salvar Alterações
        </Button>
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div class="grid grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        
        <div class="col-span-12 lg:col-span-4 p-8 bg-slate-50/30 space-y-10">
          
          <section>
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center lg:text-left">
              Logo da Marca
            </h3>

            <div
              class="relative aspect-square w-48 mx-auto lg:ml-0 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden group cursor-pointer hover:border-brand-primary transition-all"
              @click="fileInput?.click()"
            >
              <img
                v-if="logoPreview"
                :src="logoPreview"
                class="object-contain w-full h-full p-6 transition-transform group-hover:scale-105"
                alt="Logo"
              />
              <div v-else class="flex flex-col items-center text-slate-300">
                <i class="pi pi-images text-3xl mb-2"></i>
                <span class="text-[9px] font-black uppercase text-center px-4">Clique para fazer upload</span>
              </div>

              <input
                type="file"
                ref="fileInput"
                class="hidden"
                accept="image/*"
                @change="handleLogoUpload"
              />
            </div>

            <div class="mt-3 flex justify-center lg:justify-start">
              <Button
                v-if="logoPreview"
                variant="ghost"
                size="sm"
                class="!h-9 !rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 text-slate-600 hover:bg-white hover:text-rose-500"
                type="button"
                :loading="removendoLogo"
                @click="confirmarRemoverLogo"
              >
                <i class="pi pi-trash mr-2"></i> Remover logo
              </Button>
            </div>
          </section>

          <section>
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Arquivos e Documentos
            </h3>

            <div class="space-y-2 mb-4">
              <div
                v-for="doc in documentos"
                :key="doc.id"
                class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
              >
                <div class="flex items-center gap-2 overflow-hidden">
                  <i class="pi pi-file text-slate-400"></i>
                  <span class="text-[10px] font-bold text-slate-600 truncate uppercase">
                    {{ doc.nome || doc.filename }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="abrirArquivo(doc)"
                    class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-brand-primary transition-colors"
                  >
                    <i class="pi pi-eye text-xs"></i>
                  </button>

                  <button
                    type="button"
                    @click="confirmarRemoverDocumento(doc)"
                    class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <i class="pi pi-times text-xs"></i>
                  </button>
                </div>
              </div>

              <div v-if="!documentos.length" class="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Nenhum documento anexado</p>
              </div>
            </div>

            <Button
              variant="ghost"
              class="w-full !h-11 !rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-200 text-slate-500 hover:bg-slate-50"
              type="button"
              :loading="anexandoDoc"
              @click="triggerDocumentUpload"
            >
              <i class="pi pi-paperclip mr-2"></i> Anexar Documento
            </Button>

            <input
              type="file"
              ref="documentInput"
              class="hidden"
              @change="handleDocumentUpload"
            />
          </section>
        </div>

        <div class="col-span-12 lg:col-span-8 p-8 lg:p-12 space-y-10">
          
          <section>
            <div class="flex items-center gap-3 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">Informações Fiscais</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input v-model="form.razao_social" label="Razão Social" class="md:col-span-2" />
              <Input v-model="form.nome_fantasia" label="Nome Fantasia" />
              <Input v-model="cnpjMask" label="CNPJ" @blur="onCnpjBlur" />
              <Input v-model="ieMask" label="Inscrição Estadual" />
              <Input v-model="form.email" label="E-mail de Contato" icon="pi pi-envelope" />
            </div>
          </section>

          <section>
            <div class="flex items-center gap-3 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">Endereço Principal</h3>
            </div>

            <div class="grid grid-cols-12 gap-5">
              <Input v-model="cepMask" label="CEP" class="col-span-4" @blur="onCepBlur" />
              <Input v-model="form.logradouro" label="Rua/Logradouro" class="col-span-8" />
              <Input v-model="form.numero" label="Nº" class="col-span-3" />
              <Input v-model="form.bairro" label="Bairro" class="col-span-5" />
              <Input v-model="form.cidade" label="Cidade" class="col-span-4" />
              <Input v-model="form.uf" label="UF" class="col-span-2" maxlength="2" />
              <Input v-model="telefoneMask" label="WhatsApp" icon="pi pi-whatsapp" class="col-span-10" />
            </div>
          </section>

          <section>
            <div class="flex items-center gap-3 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest text-emerald-600">
                Dados Bancários e Pix
              </h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div class="md:col-span-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">
                  Chave Pix (Aparece nos orçamentos)
                </label>
                <div class="relative">
                  <input
                    v-model="form.pix"
                    class="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    placeholder="E-mail, CNPJ ou Celular"
                  />
                  <button
                    type="button"
                    @click="copiarPix"
                    class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-brand-primary transition-colors"
                  >
                    <i class="pi pi-copy text-sm"></i>
                  </button>
                </div>
              </div>

              <Input v-model="form.banco_nome" label="Banco" />
              <Input v-model="form.banco_titular" label="Titular da Conta" />
              <Input v-model="form.banco_agencia" label="Agência" />
              <Input v-model="form.banco_conta" label="Conta Corrente" />
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ConfiguracaoService } from '@/services/index'
import { ArquivosService } from '@/services/arquivos.service'
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { maskCNPJ, maskCEP, maskTelefone, maskIE, onlyNumbers } from '@/utils/masks'
import { buscarCep, buscarCnpj } from '@/utils/utils'
import { can } from '@/services/permissions'

import { useRouter } from 'vue-router'
const router = useRouter()

definePage({ meta: { perm: 'configuracoes.empresa.ver' } })



const fileInput = ref(null)
const documentInput = ref(null)

const salvando = ref(false)
const removendoLogo = ref(false)
const anexandoDoc = ref(false)

// ✅ dados “não persistem” no form: vêm da tabela global de arquivos
const logoPreview = ref('')
const documentos = ref([])

function triggerDocumentUpload() {
  documentInput.value?.click()
}

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
  banco_titular: '',
  banco_nome: '',
  banco_agencia: '',
  banco_conta: '',
  pix: '',
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
      if (!form.value.pix) form.value.pix = maskCNPJ(cnpj)
      notify.success('Dados importados com sucesso!')
    }
  } catch {
    notify.error('Erro ao consultar CNPJ')
  }
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

// --- LOGO E DOCUMENTOS (GLOBAL ARQUIVOS) ---
async function carregarLogo() {
  try {
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'LOGO' })
    const arr = res?.data?.data ?? res?.data ?? res
    const lista = Array.isArray(arr) ? arr : []
    const logo = lista.find(a => String(a.slot_key || '') === 'LOGO_PRINCIPAL') || lista[0]
    logoPreview.value = logo?.url || ''
  } catch {
    logoPreview.value = ''
  }
}

async function carregarDocumentos() {
  try {
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'ANEXO' })
    const arr = res?.data?.data ?? res?.data ?? res
    documentos.value = Array.isArray(arr) ? arr : []
  } catch {
    documentos.value = []
  }
}

const handleLogoUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  // preview imediato
  if (logoPreview.value?.startsWith('blob:')) URL.revokeObjectURL(logoPreview.value)
  logoPreview.value = URL.createObjectURL(file)

  try {
    await ArquivosService.upload({
      ownerType: 'EMPRESA',
      ownerId: 1,
      categoria: 'LOGO',
      slotKey: 'LOGO_PRINCIPAL',
      file,
    })
    notify.success('Logo enviada!')
    await carregarLogo()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao enviar logo.')
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function confirmarRemoverLogo() {
  const ok = await confirm.show('Remover Logo', 'Deseja realmente remover a logomarca?')
  if (!ok) return

  removendoLogo.value = true
  try {
    // remove o registro do slot (logo principal)
    const res = await ArquivosService.listar({ ownerType: 'EMPRESA', ownerId: 1, categoria: 'LOGO' })
    const arr = res?.data ?? res
    const lista = Array.isArray(arr) ? arr : []
    const logo = lista.find(a => String(a.slot_key || '') === 'LOGO_PRINCIPAL') || lista[0]
    if (logo?.id) {
      await ArquivosService.remover(logo.id)
    }
    logoPreview.value = ''
    notify.success('Logo removida!')
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao remover logo.')
  } finally {
    removendoLogo.value = false
  }
}

const handleDocumentUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  anexandoDoc.value = true
  try {
    await ArquivosService.upload({
      ownerType: 'EMPRESA',
      ownerId: 1,
      categoria: 'ANEXO',
      file,
    })
    notify.success('Documento anexado.')
    await carregarDocumentos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao anexar documento.')
  } finally {
    anexandoDoc.value = false
    if (documentInput.value) documentInput.value.value = ''
  }
}

async function confirmarRemoverDocumento(doc) {
  const ok = await confirm.show(
    'Remover Documento',
    `Deseja remover o documento "${doc?.nome || doc?.filename || 'SEM NOME'}"?`,
  )
  if (!ok) return

  try {
    await ArquivosService.remover(doc.id)
    notify.success('Documento removido.')
    await carregarDocumentos()
  } catch (err) {
    notify.error(err?.response?.data?.message || 'Erro ao remover documento.')
  }
}

function abrirArquivo(doc) {
  const name = encodeURIComponent(doc?.nome || doc?.filename || 'ARQUIVO')
  const type = encodeURIComponent(doc?.mime_type || '')
  const backTo = encodeURIComponent('/configuracoes/empresa') // ajusta se sua rota for outra
  router.push(`/arquivos/${doc.id}?name=${name}&type=${type}&backTo=${backTo}`)
}

// --- UTILITÁRIOS ---
const copiarPix = () => {
  if (!form.value.pix) return
  navigator.clipboard.writeText(form.value.pix).then(() => {
    notify.success('Chave Pix copiada!')
  })
}

// --- AÇÕES FINAIS ---
const salvar = async () => {
  if (!can('configuracoes.empresa.editar')) return notify.error('Acesso negado.')
  salvando.value = true

  try {
    await ConfiguracaoService.salvar(form.value)
    notify.success('Configurações salvas!')
  } catch {
    notify.error('Erro ao salvar.')
  } finally {
    salvando.value = false
  }
}

async function confirmarSalvarDadosEmpresa() {
  if (!can('configuracoes.empresa.editar')) return notify.error('Acesso negado.')
  const ok = await confirm.show('Salvar Dados da Empresa', 'Deseja salvar as configurações fiscais e de recebimento?')
  if (!ok) return
  await salvar()
}


async function confirmarExportarDadosEmpresa() {
  const ok = await confirm.show(
    'Exportar Dados da Empresa',
    'Deseja exportar os dados cadastrais para impressão/PDF?',
  )
  if (!ok) return
  gerarPdfDados()
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
          ${logoPreview.value ? `<img src="${logoPreview.value}" class="logo" />` : ''}
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
  await carregarLogo()
  await carregarDocumentos()
})
</script>
