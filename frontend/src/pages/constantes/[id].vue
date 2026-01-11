<template>
  <Card :shadow="true">
    <!-- HEADER -->
    <header class="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black tracking-tight text-gray-900 uppercase">
          {{ isEdit ? 'Editar Constante' : 'Nova Constante' }}
        </h2>
        <p class="mt-1 text-sm font-semibold text-gray-400">
          Gerencie os parâmetros globais do sistema.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          v-if="isEdit"
          variant="danger"
          size="sm"
          type="button"
          @click="excluir"
        >
          Excluir
        </Button>

        <Button
          variant="secondary"
          size="sm"
          type="button"
          @click="router.push('/constantes')"
        >
          <i class="pi pi-arrow-left mr-2 text-xs"></i>
          Voltar
        </Button>
      </div>
    </header>

    <!-- BODY -->
    <div class="p-6">
      <form class="grid grid-cols-12 gap-5" @submit.prevent="salvar">
        <div class="col-span-12 md:col-span-4">
          <Input
            v-model="form.categoria"
            label="Categoria *"
            placeholder="Ex: STATUS_FINANCEIRO"
            required
            @input="form.categoria = form.categoria.toUpperCase()"
          />
        </div>

        <div class="col-span-12 md:col-span-4">
          <Input
            v-model="form.chave"
            label="Chave (ID Interno) *"
            placeholder="Ex: PAGO"
            required
            @input="form.chave = form.chave.toUpperCase()"
          />
        </div>

        <div class="col-span-12 md:col-span-4">
          <Input
            v-model="form.rotulo"
            label="Rótulo (Exibição) *"
            placeholder="Ex: Pago"
            required
          />
        </div>

        <div class="col-span-12 md:col-span-4">
          <label class="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
            Tipo de Dado <span class="text-danger ml-0.5">*</span>
          </label>
          <select
            v-model="form.tipo"
            required
            class="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition-all
                   focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
          >
            <option value="TEXTO">TEXTO (Cores, Descrições)</option>
            <option value="NUMERO">NÚMERO (Taxas, Prazos)</option>
          </select>
        </div>

        <div class="col-span-12 md:col-span-4">
          <Input
            v-model.number="form.ordem"
            label="Ordem de Exibição"
            type="number"
          />
        </div>

        <div class="col-span-12 md:col-span-4">
          <label class="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
            Status
          </label>
          <select
            v-model="form.ativo"
            class="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition-all
                   focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
          >
            <option :value="true">Ativo</option>
            <option :value="false">Inativo</option>
          </select>
        </div>

        <div class="col-span-12">
          <Input
            v-if="form.tipo === 'TEXTO'"
            v-model="form.valor_texto"
            :label="form.categoria.includes('STATUS') ? 'Cor do Badge (Hex)' : 'Valor em Texto'"
            placeholder="Ex: #3b82f6"
          />

          <div v-if="form.tipo === 'NUMERO'" class="grid grid-cols-12 gap-5">
            <div class="col-span-12 md:col-span-6">
              <Input
                v-model.number="form.valor_numero"
                :label="form.categoria.includes('PAGAMENTO') ? 'Taxa (%)' : 'Valor Numérico'"
                type="number"
                step="0.0001"
                placeholder="Ex: 2.99"
              />
            </div>
          </div>
        </div>

        <div v-if="erro" class="col-span-12">
          <div class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 text-center">
            {{ erro }}
          </div>
        </div>

        <!-- divisória visual opcional -->
        <div class="col-span-12">
          <div class="h-px w-full bg-gray-100"></div>
        </div>
      </form>
    </div>

    <!-- FOOTER -->
    <footer class="flex items-center justify-end gap-2 p-6 border-t border-gray-100">
      <Button variant="outline" type="button" @click="router.push('/constantes')">
        Cancelar
      </Button>
      <Button type="button" :loading="loading" variant="primary" @click="salvar">
        {{ isEdit ? 'Salvar Alterações' : 'Criar Constante' }}
      </Button>
    </footer>
  </Card>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const erro = ref('')

const id = computed(() => route.params.id)
const isEdit = computed(() => !!id.value && id.value !== 'novo')

const form = ref({
  categoria: '',
  chave: '',
  rotulo: '',
  tipo: 'TEXTO',
  valor_texto: '',
  valor_numero: null,
  ordem: 0,
  ativo: true
})

const salvar = async () => {
  erro.value = ''
  loading.value = true
  
  try {
    const payload = {
      categoria: form.value.categoria,
      chave: form.value.chave,
      rotulo: form.value.rotulo,
      ordem: Number(form.value.ordem) || 0,
      ativo: form.value.ativo,
      // Envia apenas o campo que o banco possui
      valor_texto: form.value.tipo === 'TEXTO' ? form.value.valor_texto : null,
      valor_numero: form.value.tipo === 'NUMERO' ? Number(form.value.valor_numero) : null
    }

    if (isEdit.value) {
      await api.patch(`/constantes/${id.value}`, payload)
    } else {
      await api.post('/constantes', payload)
    }
    router.push('/constantes')
  } catch (e) {
    erro.value = e.response?.data?.message || 'Erro ao salvar constante.'
  } finally {
    loading.value = false
  }
}

const carregarDados = async () => {
  if (!isEdit.value) return
  loading.value = true
  try {
    const { data } = await api.get(`/constantes/${id.value}`)
    
    // Define o tipo visual baseado no que veio preenchido
    data.tipo = data.valor_numero !== null ? 'NUMERO' : 'TEXTO'
    
    Object.assign(form.value, data)
  } catch (e) {
    erro.value = 'Erro ao carregar dados.'
  } finally {
    loading.value = false
  }
}

const excluir = async () => {
  if (!confirm('Excluir esta constante?')) return
  try {
    await api.delete(`/constantes/${id.value}`)
    router.push('/constantes')
  } catch (e) { erro.value = 'Erro ao excluir.' }
}

onMounted(carregarDados)
</script>

