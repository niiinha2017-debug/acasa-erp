<template>
  <div class="w-full max-w-[1000px] mx-auto space-y-6 animate-page-in">
    <div class="rounded-2xl border border-border-ui bg-bg-card overflow-hidden">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl"></div>

      <PageHeader
        title="Modelos de Cláusulas"
        subtitle="Textos padrão para Orçamentos e Contratos"
        icon="pi pi-file"
        class="border-b border-border-ui"
      >
        <template #actions>
          <!-- Espaço reservado para logo; evitar erro enquanto PNG não existe -->
          <div
            class="h-10 px-3 flex items-center justify-center rounded bg-white/50 border border-border-ui text-[11px] font-semibold text-slate-600"
          >
            Cláusulas
          </div>
        </template>
      </PageHeader>

      <div class="p-6 md:p-8 space-y-6">
        <div class="inline-flex rounded-full bg-slate-100 dark:bg-slate-900 p-1">
          <button
            type="button"
            class="px-4 py-1.5 text-xs font-semibold rounded-full transition-colors"
            :class="
              abaAtual === 'ORCAMENTO'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            "
            @click="abaAtual = 'ORCAMENTO'"
          >
            Cláusulas de Orçamento
          </button>
          <button
            type="button"
            class="px-4 py-1.5 text-xs font-semibold rounded-full transition-colors"
            :class="
              abaAtual === 'CONTRATO'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            "
            @click="abaAtual = 'CONTRATO'"
          >
            Cláusulas de Contrato
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="salvarAtual">
          <!-- ORÇAMENTO -->
          <div v-if="abaAtual === 'ORCAMENTO'" class="space-y-6">
            <div
              v-for="mod in modulosOrcamento"
              :key="mod.modulo_key"
              class="rounded-xl border border-border-ui bg-white/70 dark:bg-slate-900/40 p-4 space-y-2"
            >
              <Input
                v-model="mod.titulo"
                :label="`Título - ${mod.modulo_key}`"
              />

              <label class="block text-xs font-semibold tracking-wide text-text-soft ml-0.5">
                Texto da cláusula ({{ mod.modulo_key }})
              </label>
              <textarea
                v-model="mod.texto"
                class="w-full min-h-[160px] rounded-xl border border-border-ui bg-bg-card text-sm text-text-main p-3 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              ></textarea>
            </div>

            <p class="text-[11px] text-slate-500">
              Você pode usar variáveis como
              <code class="px-1 py-0.5 rounded bg-slate-100 text-[11px]">[[cliente_nome]]</code>,
              <code class="px-1 py-0.5 rounded bg-slate-100 text-[11px]">[[valor_total]]</code>,
              <code class="px-1 py-0.5 rounded bg-slate-100 text-[11px]">[[data_entrega]]</code>
              e preenchê-las no backend na hora de gerar o PDF.
            </p>
          </div>

          <!-- CONTRATO -->
          <div v-else class="space-y-6">
            <div
              v-for="mod in modulosContrato"
              :key="mod.modulo_key"
              class="rounded-xl border border-border-ui bg-white/70 dark:bg-slate-900/40 p-4 space-y-2"
            >
              <Input
                v-model="mod.titulo"
                :label="`Título - ${mod.modulo_key}`"
              />

              <label class="block text-xs font-semibold tracking-wide text-text-soft ml-0.5">
                Texto da cláusula ({{ mod.modulo_key }})
              </label>
              <textarea
                v-model="mod.texto"
                class="w-full min-h-[160px] rounded-xl border border-border-ui bg-bg-card text-sm text-text-main p-3 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              ></textarea>
            </div>

            <p class="text-[11px] text-slate-500">
              Este texto será usado como base para os contratos gerados. Assim como no orçamento,
              use variáveis (por exemplo
              <code class="px-1 py-0.5 rounded bg-slate-100 text-[11px]">[[cliente_nome]]</code>,
              <code class="px-1 py-0.5 rounded bg-slate-100 text-[11px]">[[valor_final]]</code>)
              para montar o PDF de forma dinâmica.
            </p>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-border-ui">
            <Button
              type="submit"
              variant="primary"
              :disabled="salvando"
            >
              <i v-if="salvando" class="pi pi-spin pi-spinner mr-2"></i>
              Salvar {{ abaAtual === 'ORCAMENTO' ? 'Orçamento' : 'Contrato' }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { notify } from '@/services/notify'
import api from '@/services/api'
import { can } from '@/services/permissions'

definePage({ meta: { perm: 'orcamentos.editar' } })

const abaAtual = ref('ORCAMENTO')
const salvando = ref(false)

const modulosOrcamento = ref([])
const modulosContrato = ref([])

async function carregar(tipo) {
  if (!can('orcamentos.editar')) {
    notify.error('Acesso negado.')
    return
  }
  try {
    const { data } = await api.get(`/clausulas/${tipo}`)
    const lista = Array.isArray(data) ? data : []
    const normalizados = lista.map((m, idx) => ({
      id: m.id,
      modulo_key: m.modulo_key,
      titulo: m.titulo || m.modulo_key,
      texto: m.texto || '',
      ordem: typeof m.ordem === 'number' ? m.ordem : idx + 1,
    }))

    if (tipo === 'ORCAMENTO') {
      modulosOrcamento.value = normalizados
    } else {
      modulosContrato.value = normalizados
    }
  } catch (e) {
    notify.error('Erro ao carregar cláusulas.')
  }
}

async function salvar(tipo) {
  if (!can('orcamentos.editar')) {
    notify.error('Acesso negado.')
    return
  }

  salvando.value = true
  try {
    const origem = tipo === 'ORCAMENTO' ? modulosOrcamento.value : modulosContrato.value
    const payload = {
      modulos: origem.map((m, index) => ({
        id: m.id,
        modulo_key: m.modulo_key,
        titulo: m.titulo,
        texto: m.texto,
        ordem: typeof m.ordem === 'number' ? m.ordem : index + 1,
      })),
    }

    await api.put(`/clausulas/${tipo}`, payload)
    notify.success('Cláusulas salvas com sucesso.')
  } catch (e) {
    notify.error('Erro ao salvar cláusulas.')
  } finally {
    salvando.value = false
  }
}

function salvarAtual() {
  salvar(abaAtual.value)
}

onMounted(async () => {
  await Promise.all([carregar('ORCAMENTO'), carregar('CONTRATO')])
})

watch(abaAtual, () => {
  // nada especial por enquanto; o conteúdo já está carregado no mounted
})
</script>

