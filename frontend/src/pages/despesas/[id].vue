<template>
  <div class="page-container">
    <Card>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">{{ isEdit ? 'Editar Lançamento' : 'Nova Despesa/Vale' }}</h2>
          <p class="cell-muted">Registre os detalhes financeiros e vínculos de funcionários.</p>
        </div>
        <Button variant="outline" size="sm" @click="router.back()">Voltar</Button>
      </header>

      <div class="card-body">
        <form class="form-grid" @submit.prevent="salvar">
          
          <div class="form-group col-span-3">
            <label class="form-label">Movimentação <span class="required">*</span></label>
            <select v-model="form.tipo_movimento" class="form-input" required>
              <option value="SAÍDA">SAÍDA</option>
              <option value="ENTRADA">ENTRADA</option>
            </select>
          </div>

          <SearchInput 
            v-model="form.funcionario_id" 
            label="Funcionário (Para Vales)" 
            placeholder="Selecione o funcionário..."
            :options="listaFuncionarios"
            class="col-span-5"
          />

          <Input 
            v-model="form.local" 
            label="Local / Fornecedor *" 
            placeholder="Ex: Madeireira Silva"
            required 
            class="col-span-4" 
          />

          <SearchInput 
            v-model="form.categoria" 
            label="Item (Ex: Água, Vale, Energia) *" 
            :options="cat.opcoes.value"
            required
            class="col-span-4"
            @update:model-value="vincularClassificacao"
          />

          <Input 
            v-model="form.classificacao" 
            label="Classificação (Auto)" 
            readonly 
            class="col-span-4" 
          />

          <Input 
            v-model="form.valor_total" 
            label="Valor Total *" 
            type="number" 
            step="0.01" 
            required 
            class="col-span-4" 
          />
          
          <hr class="col-span-12 my-2 border-gray-100" />

          <SearchInput 
            v-model="form.forma_pagamento" 
            label="Forma de Pagamento *" 
            :options="pag.opcoes.value"
            required
            class="col-span-4"
          />

          <Input 
            v-model.number="form.quantidade_parcelas" 
            label="Qtd. Parcelas" 
            type="number" 
            class="col-span-2" 
          />
          
          <SearchInput 
            v-model="form.status" 
            label="Status Financeiro *" 
            :options="sta.opcoes.value"
            required
            class="col-span-6"
          />

          <Input v-model="form.data_vencimento" label="Data de Vencimento *" type="date" required class="col-span-4" />
          <Input v-model="form.data_pagamento" label="Data de Pagamento" type="date" class="col-span-4" />
          <Input v-model="form.data_registro" label="Data do Registro" type="date" class="col-span-4" />

          <div class="col-span-12 flex-end gap-2 mt-4">
            <Button v-if="isEdit" variant="danger" type="button" @click="excluir">Excluir</Button>
            <Button variant="primary" type="submit" :loading="loading">
              {{ isEdit ? 'Salvar Alterações' : 'Cadastrar Lançamento' }}
            </Button>
          </div>
          
          <p v-if="erro" class="col-span-12 error-message">{{ erro }}</p>
        </form>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useConstantes } from '@/composables/useConstantes'

import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)
const isEdit = computed(() => !!id.value && id.value !== 'novo')
const loading = ref(false)
const erro = ref('')

const cat = useConstantes()
const pag = useConstantes()
const sta = useConstantes()
const listaFuncionarios = ref([])

const form = ref({
  tipo_movimento: 'SAÍDA',
  categoria: '',      
  classificacao: '',  
  local: '',
  valor_total: '',
  forma_pagamento: '', 
  quantidade_parcelas: 1,
  funcionario_id: null,
  data_registro: new Date().toISOString().slice(0, 10),
  data_vencimento: '',
  data_pagamento: '',
  status: ''
})

async function carregarFuncionarios() {
  try {
    const { data } = await api.get('/funcionarios')
    listaFuncionarios.value = data.map(f => ({ label: f.nome, value: f.id }))
  } catch (e) { console.error("Erro funcionários:", e) }
}

function vincularClassificacao(itemSelecionado) {
  form.value.categoria = itemSelecionado
  const opt = cat.opcoes.value.find(o => o.value === itemSelecionado)
  if (opt) {
    form.value.classificacao = opt.label 
  }
}

async function carregarDados() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const { data } = await api.get(`/despesas/${id.value}`)
    Object.assign(form.value, data)
    if (data.data_vencimento) form.value.data_vencimento = data.data_vencimento.slice(0, 10)
    if (data.data_pagamento) form.value.data_pagamento = data.data_pagamento.slice(0, 10)
    if (data.data_registro) form.value.data_registro = data.data_registro.slice(0, 10)
  } catch (e) { erro.value = 'Erro ao carregar dados.' }
  finally { loading.value = false }
}

async function salvar() {
  erro.value = ''
  loading.value = true
  try {
    const payload = { ...form.value, valor_total: Number(form.value.valor_total) }
    if (isEdit.value) await api.patch(`/despesas/${id.value}`, payload)
    else await api.post('/despesas', payload)
    router.push('/despesas')
  } catch (e) { erro.value = e.response?.data?.message || 'Erro ao salvar.' }
  finally { loading.value = false }
}

async function excluir() {
  if (!confirm('Deseja excluir este registro?')) return
  try {
    await api.delete(`/despesas/${id.value}`)
    router.push('/despesas')
  } catch (e) { erro.value = 'Erro ao excluir.' }
}

onMounted(async () => {
  await Promise.all([
    cat.carregarCategoria('SAÍDA'),
    pag.carregarCategoria('FORMA DE PAGAMENTO'),
    sta.carregarCategoria('STATUS FINANCEIRO'),
    carregarFuncionarios()
  ])
  if (isEdit.value) carregarDados()
})
</script>

<style scoped>
.flex-end { display: flex; justify-content: flex-end; }
.error-message { color: var(--danger); font-size: 13px; margin-top: 10px; }
</style>