<template>
  <div class="page-container">
    <Card>
      <header class="card-header header-between">
        <div>
          <h2 class="card-title">Nova Despesa</h2>
          <p class="cell-muted">Crie um lançamento de despesa.</p>
        </div>
      </header>

      <div style="padding: 16px 20px;">
        <form class="form-grid" @submit.prevent="salvar">
          <Input v-model="form.tipo_movimento" label="Entrada / Saída" placeholder="SAIDA" class="col-span-3" :required="true" />
          <Input v-model="form.categoria" label="Categoria" placeholder="Energia / Água / Combustível..." class="col-span-3" :required="true" />
          <Input v-model="form.classificacao" label="Classificação" placeholder="Custo fixo / Despesa variável..." class="col-span-3" :required="true" />
          <Input v-model="form.local" label="Local" placeholder="Loja / Fábrica" class="col-span-3" :required="true" />

          <Input v-model="form.valor_total" label="Valor total" placeholder="0,00" class="col-span-3" :required="true" />
          <Input v-model="form.forma_pagamento" label="Forma de pagamento" placeholder="PIX / Cartão / Dinheiro..." class="col-span-3" :required="true" />
          <Input v-model.number="form.quantidade_parcelas" label="Qtd. parcelas" type="number" class="col-span-3" />
          <Input v-model="form.status" label="Status" placeholder="EM_ABERTO / PAGO..." class="col-span-3" :required="true" />

          <Input v-model="form.data_vencimento" label="Data de vencimento" type="date" class="col-span-4" :required="true" />
          <Input v-model="form.data_pagamento" label="Data de pagamento" type="date" class="col-span-4" />
          <Input v-model="form.data_registro" label="Data do registro" type="date" class="col-span-4" />

          <Input v-model="form.funcionario_id" label="Funcionário (ID)" type="number" class="col-span-4" />

          <div class="col-span-12" style="display:flex; justify-content:flex-end; gap:10px;">
            <Button variant="outline" type="button" @click="router.back()">Voltar</Button>
            <Button type="submit" :loading="loading" :disabled="loading">Salvar</Button>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const router = useRouter()

const loading = ref(false)
const erro = ref('')

const hojeISO = () => new Date().toISOString().slice(0, 10)

const form = ref({
  tipo_movimento: 'SAIDA',
  categoria: '',
  classificacao: '',
  local: '',
  valor_total: '',
  forma_pagamento: '',
  quantidade_parcelas: 1,
  data_registro: hojeISO(),
  data_vencimento: hojeISO(),
  data_pagamento: '',
  funcionario_id: '',
  status: 'EM_ABERTO',
})

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

    await api.post('/despesas', payload)
    router.push('/despesas')
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao salvar despesa'
  } finally {
    loading.value = false
  }
}
</script>
