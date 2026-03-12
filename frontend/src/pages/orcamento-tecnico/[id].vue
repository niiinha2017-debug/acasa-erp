<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />
      <PageHeader
        :title="`Orçamento Técnico #${id}`"
        :subtitle="breadcrumb"
        icon="pi pi-file-edit"
        class="border-b border-border-ui"
      >
        <template #actions>
          <Button variant="ghost" size="sm" class="!rounded-xl" @click="router.push('/orcamento-tecnico')">
            <i class="pi pi-arrow-left mr-2" />
            Voltar
          </Button>
        </template>
      </PageHeader>

      <div class="p-4 md:p-6 border-t border-border-ui bg-bg-page">
        <Loading v-if="loading" />
        <template v-else-if="erro">
          <p class="text-rose-500">{{ erro }}</p>
          <Button variant="ghost" size="sm" class="mt-2" @click="router.push('/orcamento-tecnico')">Voltar à lista</Button>
        </template>
        <template v-else-if="orcamento">
          <div class="mb-6 p-4 rounded-xl bg-bg-card border border-border-ui">
            <p class="text-sm text-text-soft">
              Agendamento: <span class="font-medium text-text-main">{{ orcamento.agenda_loja?.titulo || `#${orcamento.agenda_loja_id}` }}</span>
              <span v-if="orcamento.agenda_loja?.cliente?.nome_completo" class="ml-2">— {{ orcamento.agenda_loja.cliente.nome_completo }}</span>
            </p>
            <p class="text-xs text-text-soft mt-1">Criado em {{ format.date(orcamento.criado_em) }}</p>
          </div>

          <div class="rounded-xl border border-border-ui overflow-hidden">
            <table class="w-full text-sm text-left">
              <thead class="bg-bg-card border-b border-border-ui">
                <tr>
                  <th class="px-3 py-2.5 font-semibold text-text-main">Ambiente</th>
                  <th class="px-3 py-2.5 font-semibold text-text-main">Descrição</th>
                  <th class="px-3 py-2.5 font-semibold text-text-main w-28 text-right">Valor un.</th>
                  <th class="px-3 py-2.5 font-semibold text-text-main w-28 text-right">Total</th>
                  <th class="px-3 py-2.5 font-semibold text-text-main max-w-[200px]">Observação</th>
                </tr>
              </thead>
              <tbody class="bg-bg-page divide-y divide-border-ui">
                <tr v-for="item in orcamento.itens" :key="item.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td class="px-3 py-2 text-text-main">{{ item.nome_ambiente }}</td>
                  <td class="px-3 py-2 text-text-main">{{ item.descricao }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ format.currency(item.valor_unitario) }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ format.currency(item.valor_total) }}</td>
                  <td class="px-3 py-2 text-text-soft max-w-[200px] truncate" :title="item.observacao">{{ item.observacao || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="!orcamento.itens?.length" class="px-4 py-6 text-center text-text-soft">Nenhum item.</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { OrcamentoTecnicoService } from '@/services'
import { format } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import Loading from '@/components/common/Loading.vue'

definePage({ meta: { perm: 'agendamentos.producao' } })

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(String(route.params?.id || '').replace(/\D/g, '')) || null)

const loading = ref(true)
const erro = ref('')
const orcamento = ref(null)

const breadcrumb = computed(() =>
  orcamento.value?.agenda_loja?.cliente?.nome_completo
    ? orcamento.value.agenda_loja.cliente.nome_completo
    : `Orçamento técnico #${id.value}`
)

async function carregar() {
  if (!id.value) {
    erro.value = 'ID não informado.'
    loading.value = false
    return
  }
  loading.value = true
  erro.value = ''
  try {
    const res = await OrcamentoTecnicoService.buscar(id.value)
    orcamento.value = res?.data ?? res ?? null
  } catch (e) {
    erro.value = e?.response?.data?.message || 'Não foi possível carregar o orçamento técnico.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  carregar()
})
</script>
