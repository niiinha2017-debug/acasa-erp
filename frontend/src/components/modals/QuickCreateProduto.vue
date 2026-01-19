<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 flex items-center justify-center p-4 z-[var(--z-index-modal)] bg-slate-900/60 backdrop-blur-md transition-all duration-300"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-2xl bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-ui)] shadow-[0_30px_60px_rgba(0,0,0,0.3)] overflow-hidden animate-slide-up-custom transition-colors duration-300">
        
        <header class="flex justify-between items-start px-10 py-8 border-b border-[var(--border-ui)] bg-slate-500/5">
          <div>
            <h3 class="text-2xl font-black text-[var(--text-main)] tracking-tighter uppercase leading-none">
              Cadastrar produto
            </h3>
            <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-3">
              Ficha Técnica do Item
            </p>
          </div>

          <button
            class="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--bg-page)] border border-[var(--border-ui)] text-slate-400 hover:text-red-500 hover:border-red-500/20 transition-all shadow-sm"
            @click="emit('close')"
            type="button"
          >
            <i class="pi pi-times text-sm"></i>
          </button>
        </header>

        <div class="p-10">
          <div class="grid grid-cols-12 gap-6">
            <div class="col-span-12 md:col-span-7">
              <Input 
                v-model="form.nome_produto" 
                label="Nome do Produto" 
                placeholder="Ex: MDF CRU" 
                required 
              />
            </div>

            <div class="col-span-6 md:col-span-5">
              <Input v-model="form.marca" label="Marca / Fabricante" placeholder="Ex: Duratex" />
            </div>

            <div class="col-span-6 md:col-span-4">
              <Input v-model="form.cor" label="Cor / Acabamento" placeholder="Ex: Branco Tx" />
            </div>

            <div class="col-span-6 md:col-span-4">
              <Input v-model="form.medida" label="Espessura" placeholder="Ex: 18mm" />
            </div>

            <div class="col-span-12 md:col-span-4">
              <SearchInput
  v-model="form.unidade"
  mode="select"
  label="Unidade Medida *"
  :options="unidadesOptions"
  placeholder="Selecione..."
  required
/>

            </div>

            <div class="col-span-12 md:col-span-5">
              <Input 
                v-model="form.valor_unitario_mask" 
                label="Valor de Custo (Un)" 
                placeholder="0,00" 
                @input="form.valor_unitario_mask = maskMoneyBR(form.valor_unitario_mask)"
              />
            </div>

            <div class="col-span-12 flex items-center pt-4">
              <CustomCheckbox
                label="Disponibilidade Ativa"
                description="Habilitar este produto para novos pedidos de compra"
                :model-value="form.status === 'ATIVO'"
                @update:model-value="(val) => form.status = val ? 'ATIVO' : 'INATIVO'"
              />
            </div>
          </div>
        </div>

        <footer class="flex justify-end items-center gap-4 px-10 py-8 border-t border-[var(--border-ui)] bg-slate-500/5">
          <button 
            type="button" 
            @click="emit('close')"
            class="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-[var(--text-main)] transition-colors px-4"
          >
            Descartar
          </button>

          <Button
            type="button"
            variant="primary"
            class="min-w-[200px] h-14 shadow-xl shadow-brand-primary/20"
            :loading="salvando"
            @click="salvar"
          >
            <i class="pi pi-check-circle mr-2"></i> Salvar Produto
          </Button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, ref, watch, onMounted, onUnmounted } from 'vue'
import { ProdutosService } from '@/services/index'
import { notify } from '@/services/notify'
import { maskMoneyBR } from '@/utils/masks'
import { UNIDADES } from '@/constantes/unidades'

const props = defineProps({
  open: { type: Boolean, default: false },
  textoInicial: { type: String, default: '' },
  fornecedorId: { type: Number, default: null },
})

const emit = defineEmits(['close', 'created'])
const salvando = ref(false)

const form = reactive({
  nome_produto: '',
  cor: '',
  medida: '',
  unidade: 'METRO',
  marca: '',
  valor_unitario_mask: '0,00',
  status: 'ATIVO',
})

const unidadesOptions = computed(() =>
  (Array.isArray(UNIDADES) ? UNIDADES : []).map((u) => ({ value: u.key, label: u.label })),
)

const handleEsc = (e) => {
  if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', handleEsc))
onUnmounted(() => window.removeEventListener('keydown', handleEsc))

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  
  // Reset limpo toda vez que o modal abre
  Object.assign(form, {
    nome_produto: props.textoInicial || '',
    cor: '',
    medida: '',
    unidade: 'METRO',
    marca: '',
    valor_unitario_mask: '0,00',
    status: 'ATIVO',
  })
})

async function salvar() {
  if (!props.fornecedorId) return notify.warn('Selecione um fornecedor antes.')
  if (!form.nome_produto?.trim()) return notify.warn('Informe o nome do produto.')

  const valorRaw = String(form.valor_unitario_mask || '').replace(/\D/g, '')
  const valorNum = Number(valorRaw) / 100

  salvando.value = true
  try {
    const payload = {
      fornecedor_id: props.fornecedorId,
      nome_produto: form.nome_produto.trim(),
      cor: form.cor || null,
      medida: form.medida || null,
      unidade: form.unidade || 'METRO',
      marca: form.marca || null,
      valor_unitario: isNaN(valorNum) ? 0 : valorNum,
      status: form.status,
    }

    const res = await ProdutosService.criar(payload)
    emit('created', res?.data || res)
    emit('close')
    notify.success('Produto cadastrado!')
  } catch (error) {
    notify.error(error?.response?.data?.message || 'Erro ao salvar produto.')
  } finally {
    salvando.value = false
  }
}
</script>