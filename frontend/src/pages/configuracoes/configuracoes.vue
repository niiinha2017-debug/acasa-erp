<template>
  <div class="p-6 space-y-6">
    <Card :shadow="true">
      <header class="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Dados da Empresa</h2>
          <p class="text-sm font-semibold text-gray-400 mt-1">Configure o cabeçalho padrão para seus documentos.</p>
        </div>
        <Button 
          variant="primary" 
          :loading="salvando" 
          @click="salvar"
        >
          <i class="pi pi-save mr-2 text-xs"></i>
          Salvar Alterações
        </Button>
      </header>

      <div class="p-6 grid grid-cols-12 gap-6">
        
        <div class="col-span-12 lg:col-span-3">
          <div 
            class="relative group flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-gray-50 hover:border-blue-400 transition-all cursor-pointer h-full min-h-[240px]"
            @click="$refs.fileInput.click()"
          >
            <div class="w-32 h-32 rounded-xl flex items-center justify-center mb-4 overflow-hidden bg-white shadow-sm border border-gray-100">
              <img v-if="form.logo_url" :src="form.logo_url" class="object-contain w-full h-full" />
              <div v-else class="flex flex-col items-center">
                <i class="pi pi-cloud-upload text-3xl text-gray-300 group-hover:text-blue-500 transition-colors"></i>
              </div>
            </div>

            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors text-center">
              {{ form.logo_url ? 'Alterar Logo' : 'Upload Logo' }}
            </span>
            
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden" 
              accept="image/*" 
              @change="handleFileUpload" 
            />
            
            <button 
              v-if="form.logo_url"
              type="button"
              @click.stop="form.logo_url = ''"
              class="absolute -top-2 -right-2 bg-white text-rose-500 shadow-md border border-rose-100 rounded-full w-8 h-8 flex items-center justify-center hover:bg-rose-50 transition-colors"
            >
              <i class="pi pi-trash text-xs"></i>
            </button>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-9 grid grid-cols-12 gap-4">
          <Input v-model="form.razao_social" label="Razão Social" class="col-span-12 md:col-span-8" placeholder="Ex: ACASA Moveis Planejados LTDA" />
          <Input v-model="form.nome_fantasia" label="Nome Fantasia" class="col-span-12 md:col-span-4" placeholder="Ex: ACASA" />
          
          <Input v-model="cnpjMask" label="CNPJ" class="col-span-12 md:col-span-6" placeholder="00.000.000/0000-00" />
          <Input v-model="ieMask" label="Inscrição Estadual" class="col-span-12 md:col-span-6" placeholder="000.000.000.000" />
        </div>

        <div class="col-span-12 h-px bg-gray-100 my-2"></div>

        <div class="col-span-12 grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Localização e Contato</h3>
          </div>
          <Input v-model="cepMask" label="CEP" class="col-span-12 md:col-span-3" @blur="onCepBlur" placeholder="00000-000" />
          <Input v-model="form.logradouro" label="Endereço" class="col-span-12 md:col-span-7" />
          <Input v-model="form.numero" label="Nº" class="col-span-12 md:col-span-2" />
          
          <Input v-model="form.bairro" label="Bairro" class="col-span-12 md:col-span-5" />
          <Input v-model="form.cidade" label="Cidade" class="col-span-12 md:col-span-5" />
          <Input v-model="form.uf" label="UF" class="col-span-12 md:col-span-2" maxlength="2" />

          <Input v-model="form.email" label="E-mail de Contato" class="col-span-12 md:col-span-6" placeholder="contato@acasa.com.br" />
          <Input v-model="telefoneMask" label="Telefone/WhatsApp" class="col-span-12 md:col-span-6" placeholder="(00) 00000-0000" />
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ConfiguracaoService } from '@/services/ConfiguracaoService'
import { maskCNPJ, maskCEP, maskTelefone, maskIE } from '@/utils/masks'
import { buscarCep } from '@/utils/utils'

// Componentes UI
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

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
  logo_url: ''
})

// Máscaras Computadas (Lê do form formatado, salva no form limpo)
const cnpjMask = computed({
  get: () => maskCNPJ(form.value.cnpj),
  set: (v) => form.value.cnpj = v.replace(/\D/g, '')
})
const ieMask = computed({
  get: () => maskIE(form.value.ie),
  set: (v) => form.value.ie = v.replace(/\D/g, '')
})
const cepMask = computed({
  get: () => maskCEP(form.value.cep),
  set: (v) => form.value.cep = v.replace(/\D/g, '')
})
const telefoneMask = computed({
  get: () => maskTelefone(form.value.telefone),
  set: (v) => form.value.telefone = v.replace(/\D/g, '')
})

// Lógica de Upload de Logo
function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    alert('A logo deve ter no máximo 2MB')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.logo_url = e.target.result // Salva como Base64
  }
  reader.readAsDataURL(file)
}

// Busca de CEP Automática
async function onCepBlur() {
  const cep = form.value.cep.replace(/\D/g, '')
  if (cep.length === 8) {
    const d = await buscarCep(cep)
    if (d) {
      form.value.logradouro = d.logradouro
      form.value.bairro = d.bairro
      form.value.cidade = d.localidade
      form.value.uf = d.uf
    }
  }
}

// Carregar dados iniciais
async function carregar() {
  try {
    const data = await ConfiguracaoService.carregar()
    if (data) {
      // Mapeia os dados recebidos para o formulário
      Object.assign(form.value, data)
    }
  } catch (err) {
    console.warn('Nenhuma configuração encontrada. Preencha os dados pela primeira vez.')
  }
}

// Salvar no Banco
async function salvar() {
  if (!form.value.razao_social) return alert('Razão Social é obrigatória')
  
  salvando.value = true
  try {
    await ConfiguracaoService.salvar(form.value)
    alert('Configurações da ACASA atualizadas com sucesso!')
  } catch (err) {
    alert('Erro ao salvar configurações.')
  } finally {
    salvando.value = false
  }
}

onMounted(carregar)
</script>