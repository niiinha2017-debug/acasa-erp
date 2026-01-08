<template>
  <div class="page-container">
    <Card>
      <header class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 class="card-title">Editar Constante</h2>
          <p style="font-size: var(--font-size-sm); margin: 0; opacity: .85;">
            Atualize os dados da constante.
          </p>
        </div>

        <Button variant="danger" size="sm" type="button" :disabled="loading" @click="excluir">
          Excluir
        </Button>
      </header>

      <div style="padding: 16px 20px;">
        <form class="form-grid" @submit.prevent="salvar">
          <Input
            v-model="form.categoria"
            label="Categoria"
            placeholder="Ex: FORMA_PAGAMENTO"
            :required="true"
            class="col-span-4"
          />

          <Input
            v-model="form.chave"
            label="Chave"
            placeholder="Ex: PIX"
            :required="true"
            class="col-span-4"
          />

          <Input
            v-model="form.rotulo"
            label="Rótulo"
            placeholder="Ex: Pix"
            :required="true"
            class="col-span-4"
          />

          <div class="form-group col-span-4">
            <label class="form-label">Tipo <span class="required">*</span></label>
            <select v-model="form.tipo" class="form-input" required>
              <option value="TEXTO">TEXTO</option>
              <option value="NUMERO">NUMERO</option>
              <option value="BOOLEANO">BOOLEANO</option>
              <option value="JSON">JSON</option>
            </select>
          </div>

          <Input
            v-model.number="form.ordem"
            label="Ordem"
            type="number"
            class="col-span-4"
          />

          <div class="form-group col-span-4">
            <label class="form-label">Status</label>
            <select v-model="form.ativo" class="form-input">
              <option :value="true">Ativo</option>
              <option :value="false">Inativo</option>
            </select>
          </div>

          <!-- Valores condicionais -->
          <Input
            v-if="form.tipo === 'TEXTO'"
            v-model="form.valor_texto"
            label="Valor (Texto)"
            placeholder="Ex: Cartão de Crédito"
            class="col-span-12"
          />

          <Input
            v-if="form.tipo === 'NUMERO'"
            v-model="form.valor_numero"
            label="Valor (Número)"
            placeholder="Ex: 2.99"
            class="col-span-6"
          />

          <div v-if="form.tipo === 'BOOLEANO'" class="form-group col-span-6">
            <label class="form-label">Valor (Booleano)</label>
            <select v-model="form.valor_booleano" class="form-input">
              <option :value="true">true</option>
              <option :value="false">false</option>
            </select>
          </div>

          <div v-if="form.tipo === 'JSON'" class="form-group col-span-12">
            <label class="form-label">Valor (JSON)</label>
            <textarea
              v-model="valorJsonTexto"
              class="form-input"
              rows="6"
              placeholder='Ex: {"taxa": 2.99}'
            />
            <p style="margin-top: 6px; font-size: var(--font-size-sm); opacity: .85;">
              JSON precisa ser válido.
            </p>
          </div>

          <div class="col-span-12" style="display:flex; justify-content:flex-end; gap:10px;">
            <Button variant="outline" type="button" @click="router.back()">
              Voltar
            </Button>

            <Button type="submit" :loading="loading" :disabled="loading">
              Salvar alterações
            </Button>
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
import { ref, computed, onMounted } from 'vue'
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
  categoria: '',
  chave: '',
  rotulo: '',
  tipo: 'TEXTO',
  valor_texto: '',
  valor_numero: '',
  valor_booleano: true,
  ordem: 0,
  ativo: true,
})

const valorJsonTexto = ref('')

function aplicarNoForm(data) {
  form.value.categoria = data?.categoria ?? ''
  form.value.chave = data?.chave ?? ''
  form.value.rotulo = data?.rotulo ?? ''
  form.value.tipo = data?.tipo ?? 'TEXTO'
  form.value.ordem = data?.ordem ?? 0
  form.value.ativo = !!data?.ativo

  form.value.valor_texto = data?.valor_texto ?? ''
  form.value.valor_numero = data?.valor_numero ?? ''
  form.value.valor_booleano = data?.valor_booleano ?? true

  // valor_json pode vir como objeto; mantemos editável no textarea
  valorJsonTexto.value = data?.valor_json ? JSON.stringify(data.valor_json, null, 2) : ''
}

const payload = computed(() => {
  const base = {
    categoria: form.value.categoria,
    chave: form.value.chave,
    rotulo: form.value.rotulo,
    tipo: form.value.tipo,
    ordem: form.value.ordem,
    ativo: form.value.ativo,

    valor_texto: null,
    valor_numero: null,
    valor_booleano: null,
    valor_json: null,
  }

  if (base.tipo === 'TEXTO') base.valor_texto = form.value.valor_texto || null
  if (base.tipo === 'NUMERO') base.valor_numero = form.value.valor_numero || null
  if (base.tipo === 'BOOLEANO') base.valor_booleano = !!form.value.valor_booleano
  if (base.tipo === 'JSON') base.valor_json = valorJsonTexto.value || null

  return base
})

async function carregar() {
  erro.value = ''
  loading.value = true

  try {
    const { data } = await api.get(`/constantes/${id.value}`)
    aplicarNoForm(data)
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Não foi possível carregar a constante.'
  } finally {
    loading.value = false
  }
}

async function salvar() {
  erro.value = ''
  loading.value = true

  try {
    if (payload.value.tipo === 'JSON' && payload.value.valor_json) {
      JSON.parse(payload.value.valor_json)
    }

    await api.patch(`/constantes/${id.value}`, payload.value)
    router.push('/constantes')
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao salvar alterações.'
  } finally {
    loading.value = false
  }
}

async function excluir() {
  // sem modal (você não pediu) — se quiser confirmação, você manda depois
  erro.value = ''
  loading.value = true

  try {
    await api.delete(`/constantes/${id.value}`)
    router.push('/constantes')
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Erro ao excluir.'
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
</script>
