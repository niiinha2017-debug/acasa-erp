<template>
  <div class="page-container">
    <Card>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Editar Despesa</h2>
          <p class="cell-muted">Atualize os dados do lançamento.</p>
        </div>

        <Button variant="danger" size="sm" type="button" :disabled="loading" @click="excluir">
          Excluir
        </Button>
      </header>

      <div style="padding: 16px 20px;">
        <form class="form-grid" @submit.prevent="salvar">
          <Input v-model="form.tipo_movimento" label="Entrada / Saída" class="col-span-3" :required="true" />
          <Input v-model="form.categoria" label="Categoria" class="col-span-3" :required="true" />
          <Input v-model="form.classificacao" label="Classificação" class="col-span-3" :required="true" />
          <Input v-model="form.local" label="Local" class="col-span-3" :required="true" />

          <Input v-model="form.valor_total" label="Valor total" class="col-span-3" :required="true" />
          <Input v-model="form.forma_pagamento" label="Forma de pagamento" class="col-span-3" :required="true" />
          <Input v-model.number="form.quantidade_parcelas" label="Qtd. parcelas" type="number" class="col-span-3" />
          <Input v-model="form.status" label="Status" class="col-span-3" :required="true" />

          <Input v-model="form.data_vencimento" label="Data de vencimento" type="date" class="col-span-4" :required="true" />
          <Input v-model="form.data_pagamento" label="Data de pagamento" type="date" class="col-span-4" />
          <Input v-model="form.data_registro" label="Data do registro" type="date" class="col-span-4" />

          <Input v-model="form.funcionario_id" label="Funcionário (ID)" type="number" class="col-span-4" />

          <div class="col-span-12" style="display:flex; justify-content:flex-end; gap:10px;">
            <Button variant="outline" type="button" @click="router.back()">Voltar</Button>
            <Button type="submit" :loading="loading" :disabled="loading">Salvar alterações</Button>
          </div>

          <div v-if="erro" class="col-span-12">
            <p style="color: var(--danger); font-size: var(--font-size-sm); margin: 0;">
              {{ erro }}
            </p>
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

import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => Number(route.params.id))

const loading = ref(false)
const erro = ref('')

const form = ref({
  tipo_movimento: '',
  categoria: '',
  classificacao: '',
  local: '',
  valor_total: '',
  forma_pagamento: '',
  quantidade_parcelas: 1,
  data_registro: '',
  data_vencimento: '',
  data_pagamento: '',
  funcionario_id: '',
  status: '',
})

function aplicar(data) {
  form.value.tipo_movimento = data?.tipo_movimento ?? ''
  form.value.categoria = data?.categoria ?? ''
  form.value.classificacao = data?.classificacao ?? ''
  form.value.local = data?.local ?? ''
  form.value.valor_total = data?.valor_total ?? ''
  form.value.forma_pagamento = data?.forma_pagamento ?? ''
  form.value.quantidade_parcelas = data?.quantidade_parcelas ?? 1
  form.value.data_registro = data?.data_registro ? String(data.data_registro).slice(0,10) : ''
  form.value.data_vencimento = data?.data_vencimento ? String(data.data_vencimento).slice(0,10) : ''
  form.value.data_pagamento = data?.data_pagamento ? String(data.data_pagamento).slice(0,10) : ''
  form.value.funcionario_id = data?.funcionario_id ?? ''
  form.value.status = data?.status ?? ''
}

async function carregar() {
  erro.value = ''
  loading.value = true
  try {
    const { data } = await api.get(`/despesas/${id.value}`)
    aplicar(data)
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao carregar despesa'
  } finally {
    loading.value = false
  }
}

async function salvar() {
  erro.value = ''
  loading.value = true
  try {
    const payload = {
      ...form.value,
      quantidade_parcelas: Number(form.value.quantidade_parcelas || 1),
      funcionario_id: form.value.funcionario_id ? Number(form.value.funcionario_id) : null,
      data_pagamento: form.value.data_pagamento || null,
    }

    await api.patch(`/despesas/${id.value}`, payload)
    router.push('/despesas')
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao salvar alterações'
  } finally {
    loading.value = false
  }
}

async function excluir() {
  if (!confirm(`Deseja excluir a despesa #${id.value}?`)) return
  erro.value = ''
  loading.value = true
  try {
    await api.delete(`/despesas/${id.value}`)
    router.push('/despesas')
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao excluir'
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
</script>
