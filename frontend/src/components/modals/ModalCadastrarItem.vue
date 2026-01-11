<template>
  <Transition name="fade">
    <div 
      v-if="open" 
      class="fixed inset-0 flex items-center justify-center p-4 z-modal bg-gray-900/40 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div 
        class="w-full max-w-2xl bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden animate-slide-up-custom"
      >
        <header class="flex justify-between items-start px-8 py-6 border-b border-gray-50 bg-gray-50/30">
          <div>
            <h3 class="text-xl font-black text-gray-900 tracking-tighter uppercase">Cadastrar item</h3>
            <p class="text-sm font-semibold text-gray-400 mt-1">Item não encontrado. Cadastre rapidamente.</p>
          </div>
          <button 
            class="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-danger hover:border-danger/20 transition-all shadow-sm"
            @click="emit('close')"
          >
            <i class="pi pi-times text-xs"></i>
          </button>
        </header>

        <div class="p-8">
          <div class="grid grid-cols-12 gap-5">
            <div class="col-span-12 md:col-span-6">
              <Input v-model="form.nome" label="Nome do Item" placeholder="Ex: MDF" :required="true" />
            </div>

            <div class="col-span-6 md:col-span-3">
              <Input v-model="form.cor" label="Cor/Acabamento" placeholder="Ex: Branco" />
            </div>

            <div class="col-span-6 md:col-span-3">
              <Input v-model="form.medida" label="Medida/Espessura" placeholder="Ex: 18mm" />
            </div>

            <div class="col-span-12 md:col-span-4">
              <Input v-model="form.unidade" label="Unidade de Medida" placeholder="METRO / UN" :required="true" />
            </div>

            <div class="col-span-12 md:col-span-8 flex items-end pb-1.5">
              <CustomCheckbox
                label="Item Ativo no Sistema"
                description="Itens inativos não aparecem em novas vendas"
                :model-value="form.status === 'ATIVO'"
                @update:model-value="(val) => form.status = val ? 'ATIVO' : 'INATIVO'"
              />
            </div>
          </div>
        </div>

        <footer class="flex justify-end gap-3 px-8 py-6 border-t border-gray-50 bg-gray-50/30">
          <Button label="Cancelar" variant="outline" @click="emit('close')" />
          <Button
            label="Salvar item"
            variant="success"
            :loading="salvando"
            @click="salvar"
          >
            <template #default>
              <i class="pi pi-check mr-2"></i> Confirmar Cadastro
            </template>
          </Button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import api from '@/services/api'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import CustomCheckbox from '@/components/ui/CustomCheckbox.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  textoInicial: { type: String, default: '' },
  endpoint: { type: String, default: '/plano-corte-item' },
})

const emit = defineEmits(['close', 'created'])
const salvando = ref(false)

const form = reactive({
  nome: '',
  cor: '',
  medida: '',
  unidade: 'METRO',
  status: 'ATIVO',
})

watch(() => props.open, (v) => {
  if (!v) return
  form.nome = props.textoInicial || ''
  form.cor = ''
  form.medida = ''
  form.unidade = 'METRO'
  form.status = 'ATIVO'
})

async function salvar() {
  if (!form.nome?.trim()) return alert('Informe o nome.')
  
  salvando.value = true
  try {
    const payload = { ...form, nome: form.nome.trim() }
    const { data } = await api.post(props.endpoint, payload)
    emit('created', data)
    emit('close')
  } catch (error) {
    alert('Erro ao salvar item.')
  } finally {
    salvando.value = false
  }
}
</script>