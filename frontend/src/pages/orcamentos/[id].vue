<template>
  <Card>
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          Orçamento #{{ id }}
        </h2>
        <p class="text-sm font-semibold text-gray-500 mt-1">
          Cliente: <span class="text-gray-900">{{ snapshot.nome || '-' }}</span>
        </p>
      </div>

      <div class="flex gap-2">
        <Button variant="secondary" size="sm" @click="abrirPdf">
          PDF
        </Button>
        <Button variant="secondary" size="sm" @click="router.push('/orcamentos')">
          Voltar
        </Button>
      </div>
    </header>

    <div class="p-6 space-y-8">
      <div v-if="loading" class="text-center py-4 text-gray-500 font-bold">Carregando...</div>

      <template v-else>
        <section>
          <h3 class="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-primary mb-4">
            Dados Fixo do Orçamento
          </h3>
          <div class="grid grid-cols-12 gap-5">
            <div class="col-span-12 md:col-span-6">
              <Input v-model="snapshot.nome" label="Nome do Cliente" />
            </div>
            <div class="col-span-12 md:col-span-6">
              <Input v-model="snapshot.cpf" label="CPF/CNPJ" />
            </div>
            <div class="col-span-12">
              <Button variant="primary" size="sm" :loading="salvando" @click="salvarSnapshot">
                Salvar Dados do Cliente
              </Button>
            </div>
          </div>
        </section>

        <div class="h-px bg-gray-100"></div>

        <section>
          <h3 class="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-primary mb-4">
            Itens e Ambientes
          </h3>
          <div class="grid grid-cols-12 gap-5 items-end bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div class="col-span-12 md:col-span-4">
              <Input v-model="novoItem.nome_ambiente" label="Nome do Ambiente" placeholder="Ex: Escritório" />
            </div>
            <div class="col-span-12 md:col-span-4">
              <Input v-model="novoItem.descricao" label="Descrição / Detalhes" placeholder="Ex: MDF Preto TX" />
            </div>
            <div class="col-span-12 md:col-span-2">
              <Input v-model="novoItem.valor_total" label="Valor Total (R$)" type="number" step="0.01" />
            </div>
            <div class="col-span-12 md:col-span-2">
              <Button 
                className="w-full" 
                variant="primary" 
                :disabled="!podeAdicionarItem" 
                :loading="adicionandoItem" 
                @click="adicionarItem"
              >
                Adicionar
              </Button>
            </div>
          </div>
        </section>

        <section class="overflow-hidden border border-gray-100 rounded-2xl">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500">
                <th class="p-4">Ambiente</th>
                <th class="p-4">Descrição</th>
                <th class="p-4 text-right">Valor</th>
                <th class="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody class="text-sm font-semibold text-gray-700">
              <tr v-if="!orc?.itens?.length">
                <td colspan="4" class="p-8 text-center text-gray-400 italic">Nenhum item adicionado ao orçamento.</td>
              </tr>
              <tr v-for="it in orc?.itens" :key="it.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                <td class="p-4 text-gray-900">{{ it.nome_ambiente }}</td>
                <td class="p-4 text-gray-500">{{ it.descricao }}</td>
                <td class="p-4 text-right">{{ format.currency(it.valor_total) }}</td>
                <td class="p-4 text-center">
                  <button 
                    @click="removerItem(it.id)"
                    class="text-danger hover:scale-110 transition disabled:opacity-50"
                    :disabled="removendoItemId === it.id"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50/80 font-black text-gray-900">
              <tr>
                <td colspan="2" class="p-4 text-right text-xs uppercase tracking-widest text-gray-500">Total do Orçamento</td>
                <td class="p-4 text-right text-lg text-brand-primary">{{ format.currency(totalItens) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </section>
      </template>
    </div>

    <footer class="p-6 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 class="text-[10px] font-black uppercase tracking-widest text-gray-400">Anexos e Projetos</h4>
          <input ref="fileInput" type="file" class="hidden" id="file-upload" @change="onFileChange" />
          <label for="file-upload" class="mt-2 inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer hover:border-brand-primary transition">
            {{ arquivoSelecionado ? arquivoSelecionado.name : 'Selecionar Arquivo' }}
          </label>
          <Button 
            v-if="arquivoSelecionado"
            variant="primary" 
            size="sm" 
            className="ml-2"
            :loading="enviandoArquivo" 
            @click="enviarArquivo"
          >
            Enviar
          </Button>
        </div>
        
        <div class="flex flex-wrap gap-2">
          <div v-for="a in arquivos" :key="a.id" class="flex items-center gap-2 bg-white p-2 px-3 rounded-lg border border-gray-100 shadow-sm">
            <span class="text-[10px] font-bold text-gray-600 truncate max-w-[120px]">{{ a.nome_original }}</span>
            <button @click="abrirArquivo(a.id)" class="text-brand-primary hover:underline text-[10px] font-black">Abrir</button>
            <button @click="removerArquivo(a.id)" class="text-danger font-black text-[10px]">X</button>
          </div>
        </div>
      </div>
    </footer>
  </Card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import api from '@/services/api'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { format } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const loading = ref(false)
const salvando = ref(false)
const erro = ref('')

const orc = ref(null)
const arquivos = ref([])

// Padronizado com os dados do documento (Cliente Eduardo)
const snapshot = ref({ 
  nome: '', 
  cpf: '',
  contato: '',
  endereco: '' 
})

const novoItem = ref({
  nome_ambiente: '',
  descricao: '',
  valor_unitario: '',
  valor_total: '',
})

const adicionandoItem = ref(false)
const removendoItemId = ref(null)

const arquivoSelecionado = ref(null)
const enviandoArquivo = ref(false)
const removendoArquivoId = ref(null)
const fileInput = ref(null)

const totalItens = computed(() => {
  const itens = orc.value?.itens || []
  return itens.reduce((acc, i) => acc + Number(i.valor_total || 0), 0)
})

const podeAdicionarItem = computed(() => {
  return (
    novoItem.value.nome_ambiente &&
    novoItem.value.descricao &&
    String(novoItem.value.valor_total).length
  )
})

async function carregar() {
  erro.value = ''
  loading.value = true
  try {
    const { data } = await api.get(`/orcamentos/${id}`)
    orc.value = data

    // Mapeamento dos campos conforme documento do cliente
    snapshot.value = {
      nome: data?.cliente_nome_snapshot || '',
      cpf: data?.cliente_cpf_snapshot || '',
      contato: data?.cliente_contato_snapshot || '', // Extraído do documento: (16) 99274 0174
      endereco: data?.cliente_endereco_snapshot || '' // Extraído do documento: Rua Duque de Caxias 1281
    }

    await carregarArquivos()
  } catch (e) {
    erro.value = 'Não foi possível carregar o orçamento.'
  } finally {
    loading.value = false
  }
}

async function carregarArquivos() {
  try {
    const { data } = await api.get(`/orcamentos/${id}/arquivos`)
    arquivos.value = data || []
  } catch (e) {
    console.error('Erro ao carregar arquivos:', e)
  }
}

async function salvarSnapshot() {
  salvando.value = true
  try {
    await api.patch(`/orcamentos/${id}`, {
      cliente_nome_snapshot: snapshot.value.nome,
      cliente_cpf_snapshot: snapshot.value.cpf,
      cliente_contato_snapshot: snapshot.value.contato,
      cliente_endereco_snapshot: snapshot.value.endereco,
    })
    await carregar()
  } catch (e) {
    erro.value = 'Não foi possível salvar os dados do orçamento.'
  } finally {
    salvando.value = false
  }
}

async function adicionarItem() {
  adicionandoItem.value = true
  try {
    await api.post(`/orcamentos/${id}/itens`, {
      nome_ambiente: novoItem.value.nome_ambiente,
      descricao: novoItem.value.descricao,
      valor_unitario: Number(novoItem.value.valor_unitario || 0),
      valor_total: Number(novoItem.value.valor_total),
    })

    novoItem.value = { nome_ambiente: '', descricao: '', valor_unitario: '', valor_total: '' }
    await carregar()
  } catch (e) {
    erro.value = 'Não foi possível adicionar o ambiente.'
  } finally {
    adicionandoItem.value = false
  }
}

async function removerItem(itemId) {
  if (!confirm('Deseja realmente excluir este ambiente?')) return
  removendoItemId.value = itemId
  try {
    await api.delete(`/orcamentos/${id}/itens/${itemId}`)
    await carregar()
  } catch (e) {
    erro.value = 'Não foi possível remover o item.'
  } finally {
    removendoItemId.value = null
  }
}

function onFileChange(e) {
  const file = e.target?.files?.[0]
  arquivoSelecionado.value = file || null
}

async function enviarArquivo() {
  if (!arquivoSelecionado.value) return
  enviandoArquivo.value = true
  erro.value = ''

  try {
    const fd = new FormData()
    fd.append('arquivo', arquivoSelecionado.value)

    await api.post(`/orcamentos/${id}/arquivos`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    arquivoSelecionado.value = null
    if (fileInput.value) fileInput.value.value = ''
    await carregarArquivos()
  } catch (e) {
    erro.value = 'Não foi possível enviar o arquivo.'
  } finally {
    enviandoArquivo.value = false
  }
}

function abrirArquivo(arquivoId) {
  const base = import.meta.env.VITE_API_URL
  window.open(`${base}/orcamentos/${id}/arquivos/${arquivoId}/abrir`, '_blank')
}

async function removerArquivo(arquivoId) {
  if (!confirm('Excluir este anexo?')) return
  removendoArquivoId.value = arquivoId
  try {
    await api.delete(`/orcamentos/${id}/arquivos/${arquivoId}`)
    await carregarArquivos()
  } catch (e) {
    erro.value = 'Não foi possível remover o arquivo.'
  } finally {
    removendoArquivoId.value = null
  }
}

function abrirPdf() {
  const base = import.meta.env.VITE_API_URL
  window.open(`${base}/orcamentos/${id}/pdf`, '_blank')
}

function formatarTamanho(bytes) {
  const b = Number(bytes || 0)
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

onMounted(carregar)
</script>
