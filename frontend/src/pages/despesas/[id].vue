<template>
  <div class="page-container">
    <Card>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">{{ isEdit ? 'Editar Lançamento' : 'Nova Despesa/Vale' }}</h2>
        </div>
        <Button variant="outline" size="sm" @click="router.back()">Voltar</Button>
      </header>

      <div class="card-body">
        <form class="form-grid" @submit.prevent="salvar">
          
          <div class="form-group col-span-4">
            <label class="form-label">Movimentação <span class="required">*</span></label>
            <select v-model="form.tipo_movimento" class="form-input" required>
              <option value="SAÍDA">SAÍDA</option>
              <option value="ENTRADA">ENTRADA</option>
            </select>
          </div>

          <SearchInput 
            v-model="form.funcionario_id" 
            label="Funcionário (Vale/Pagamento)" 
            :options="listaFuncionarios"
            class="col-span-8"
          />

          <SearchInput 
            v-model="form.categoria" 
            label="Item (Ex: Água, Vale) *" 
            :options="cat.opcoes.value"
            required
            class="col-span-6"
            @update:model-value="vincularClassificacaoChave"
          />

          <Input 
            v-model="form.classificacao" 
            label="Classificação (Chave Auto)" 
            readonly 
            class="col-span-6" 
          />

          <Input v-model="form.local" label="Local / Fornecedor *" required class="col-span-8" />
          <Input v-model="form.valor_total" label="Valor Total *" type="number" step="0.01" required class="col-span-4" />
          
          <hr class="col-span-12 my-2 border-gray-100" />

          <SearchInput 
            v-model="form.forma_pagamento" 
            label="Forma de Pagamento *" 
            :options="pag.opcoes.value"
            required
            class="col-span-5"
          />

          <Input 
            v-model.number="form.quantidade_parcelas" 
            label="Qtd. Parcelas (Recorrente)" 
            type="number" 
            min="1"
            class="col-span-3" 
          />
          
          <SearchInput 
            v-model="form.status" 
            label="Status *" 
            :options="sta.opcoes.value"
            required
            class="col-span-4"
          />

          <Input v-model="form.data_vencimento" label="1º Vencimento *" type="date" required class="col-span-4" />
          <Input v-model="form.data_pagamento" label="Data de Pagamento" type="date" class="col-span-4" />
          <Input v-model="form.data_registro" label="Data do Registro *" type="date" required class="col-span-4" />

          <div class="col-span-12 flex justify-end gap-3 mt-6">
            <Button v-if="isEdit" variant="danger" type="button" @click="excluir">Excluir</Button>
            <Button variant="primary" type="submit" :loading="loading">
              {{ isEdit ? 'Salvar' : 'Gerar Lançamentos' }}
            </Button>
          </div>
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

// LÓGICA: Classificação vem da CHAVE da constante
function vincularClassificacaoChave(rotuloSelecionado) {
  form.value.categoria = rotuloSelecionado
  const opt = cat.opcoes.value.find(o => o.label === rotuloSelecionado)
  if (opt) {
    // Agora pega a CHAVE (ex: CUSTO FIXO) e não o rótulo
    form.value.classificacao = opt.value 
  }
}

async function salvar() {
  loading.value = true
  try {
    const payload = { 
      ...form.value, 
      valor_total: Number(form.value.valor_total),
      // O backend deve usar a quantidade_parcelas para criar N registros recorrentes
      quantidade_parcelas: Number(form.value.quantidade_parcelas)
    }
    
    if (isEdit.value) await api.patch(`/despesas/${id.value}`, payload)
    else await api.post('/despesas', payload)
    
    router.push('/despesas')
  } catch (e) { alert('Erro ao processar lançamento.') }
  finally { loading.value = false }
}

async function carregarFuncionarios() {
  try {
    const { data } = await api.get('/funcionarios')
    listaFuncionarios.value = data.map(f => ({ label: f.nome, value: f.id }))
  } catch (e) { console.error(e) }
}

onMounted(async () => {
  await Promise.all([
    cat.carregarCategoria('SAÍDA'),
    pag.carregarCategoria('FORMA DE PAGAMENTO FINANCEIRO'),
    sta.carregarCategoria('STATUS FINANCEIRO'),
    carregarFuncionarios()
  ])
  if (isEdit.value) {
    const { data } = await api.get(`/despesas/${id.value}`)
    Object.assign(form.value, data)
    if (data.data_vencimento) form.value.data_vencimento = data.data_vencimento.slice(0, 10)
    if (data.data_pagamento) form.value.data_pagamento = data.data_pagamento.slice(0, 10)
    if (data.data_registro) form.value.data_registro = data.data_registro.slice(0, 10)
  }
})
</script>