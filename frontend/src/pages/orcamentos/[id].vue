<template>
  <div class="page-container">
    <div class="card card--shadow">
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Orçamento #{{ id }}</h2>
          <p class="card-subtitle">
            Cliente: <strong>{{ orc?.cliente_nome_snapshot || '-' }}</strong>
          </p>
        </div>

        <div class="header-actions">
          <Button label="PDF" variant="outline" @click="abrirPdf()" />
          <Button label="Voltar" variant="secondary" @click="router.push('/orcamentos')" />
        </div>
      </header>

      <div class="card-body">
        <div v-if="loading" class="muted">Carregando...</div>

        <template v-else>
          <!-- Snapshot -->
          <div class="section-title">Dados fixos do orçamento</div>
          <div class="form-grid">
            <div class="col-span-6">
              <Input v-model="snapshot.nome" label="Nome (snapshot)" />
            </div>
            <div class="col-span-6">
              <Input v-model="snapshot.cpf" label="CPF (snapshot)" />
            </div>

            <div class="col-span-12">
              <div class="actions-bar">
                <Button
                  label="Salvar dados do orçamento"
                  variant="primary"
                  :loading="salvando"
                  loadingText="Salvando..."
                  @click="salvarSnapshot"
                />
              </div>
            </div>
          </div>

          <div class="section-divider"></div>

          <!-- Itens -->
          <div class="section-title">Itens</div>

          <div class="form-grid">
            <div class="col-span-4">
              <Input v-model="novoItem.nome_ambiente" label="Nome do ambiente" />
            </div>
            <div class="col-span-4">
              <Input v-model="novoItem.descricao" label="Descrição" />
            </div>
            <div class="col-span-2">
              <Input v-model="novoItem.valor_unitario" label="Valor unitário" type="number" />
            </div>
            <div class="col-span-2">
              <Input v-model="novoItem.valor_total" label="Valor total" type="number" />
            </div>

            <div class="col-span-12">
              <div class="actions-bar">
                <Button
                  label="Adicionar item"
                  variant="success"
                  :disabled="!podeAdicionarItem"
                  :loading="adicionandoItem"
                  loadingText="Adicionando..."
                  @click="adicionarItem"
                />
              </div>
            </div>
          </div>

          <div class="items-list">
            <div v-if="!orc?.itens?.length" class="muted">Nenhum item adicionado.</div>

            <div v-for="it in orc.itens" :key="it.id" class="item-card">
              <div class="item-main">
                <div class="item-title">{{ it.nome_ambiente }}</div>
                <div class="muted">{{ it.descricao }}</div>
                <div class="item-values">
                  <span>Unit: {{ format.currency(it.valor_unitario) }}</span>
                  <span>Total: {{ format.currency(it.valor_total) }}</span>
                </div>
              </div>

              <div class="item-actions">
                <Button
                  label="Excluir"
                  size="sm"
                  variant="danger"
                  :loading="removendoItemId === it.id"
                  loadingText="Excluindo..."
                  @click="removerItem(it.id)"
                />
              </div>
            </div>

            <div class="items-total">
              <span>Total</span>
              <strong>{{ formatarMoeda(totalItens) }}</strong>
            </div>
          </div>

          <div class="section-divider"></div>

          <!-- Arquivos -->
          <div class="section-title">Arquivos do orçamento</div>

          <div class="upload-row">
            <input ref="fileInput" type="file" class="file-input" @change="onFileChange" />
            <Button
              label="Enviar arquivo"
              variant="primary"
              :disabled="!arquivoSelecionado"
              :loading="enviandoArquivo"
              loadingText="Enviando..."
              @click="enviarArquivo"
            />
          </div>

          <div class="files-list">
            <div v-if="!arquivos.length" class="muted">Nenhum arquivo anexado.</div>

            <div v-for="a in arquivos" :key="a.id" class="file-row">
              <div class="file-info">
                <div class="file-name">{{ a.nome_original }}</div>
                <div class="muted file-meta">
                  {{ a.mime_type }} • {{ formatarTamanho(a.tamanho) }}
                </div>
              </div>

              <div class="file-actions">
                <Button
                  label="Abrir"
                  size="sm"
                  variant="secondary"
                  @click="abrirArquivo(a.id)"
                />
                <Button
                  label="Excluir"
                  size="sm"
                  variant="danger"
                  :loading="removendoArquivoId === a.id"
                  loadingText="Excluindo..."
                  @click="removerArquivo(a.id)"
                />
              </div>
            </div>
          </div>
        </template>

        <div v-if="erro" class="form-error" style="margin-top: 12px;">
          {{ erro }}
        </div>
      </div>
    </div>
  </div>
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

const snapshot = ref({ nome: '', cpf: '' })

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
    String(novoItem.value.valor_unitario).length &&
    String(novoItem.value.valor_total).length
  )
})

async function carregar() {
  erro.value = ''
  loading.value = true
  try {
    const { data } = await api.get(`/orcamentos/${id}`)
    orc.value = data

    snapshot.value.nome = data?.cliente_nome_snapshot || ''
    snapshot.value.cpf = data?.cliente_cpf_snapshot || ''

    await carregarArquivos()
  } catch (e) {
    erro.value = 'Não foi possível carregar o orçamento.'
  } finally {
    loading.value = false
  }
}

async function carregarArquivos() {
  const { data } = await api.get(`/orcamentos/${id}/arquivos`)
  arquivos.value = data || []
}

async function salvarSnapshot() {
  salvando.value = true
  try {
    await api.patch(`/orcamentos/${id}`, {
      cliente_nome_snapshot: snapshot.value.nome,
      cliente_cpf_snapshot: snapshot.value.cpf,
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
      valor_unitario: Number(novoItem.value.valor_unitario),
      valor_total: Number(novoItem.value.valor_total),
    })

    novoItem.value = { nome_ambiente: '', descricao: '', valor_unitario: '', valor_total: '' }
    await carregar()
  } catch (e) {
    erro.value = 'Não foi possível adicionar o item.'
  } finally {
    adicionandoItem.value = false
  }
}

async function removerItem(itemId) {
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
