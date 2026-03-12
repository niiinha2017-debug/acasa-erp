<template>
  <div class="w-full h-full">
    <div class="relative overflow-hidden rounded-2xl border border-border-ui bg-bg-card">
      <div class="h-1 w-full bg-brand-primary rounded-t-2xl" />
      <PageHeader
        title="Orçamento Técnico"
        subtitle="Converter medição por ambiente em orçamento (tabela independente)"
        icon="pi pi-file-edit"
        class="border-b border-border-ui"
      >
        <template #actions>
          <Button variant="ghost" size="sm" class="!rounded-xl" :disabled="loading" @click="carregar">
            <i class="pi pi-refresh mr-2" :class="{ 'animate-spin': loading }" />
            Recarregar
          </Button>
        </template>
      </PageHeader>
      <div class="p-6 md:p-8 border-t border-border-ui bg-bg-page space-y-8">
        <!-- Lista dos já salvos -->
        <p v-if="erro" class="text-rose-500 text-sm mb-4">{{ erro }}</p>
        <section v-if="lista.length > 0">
          <h2 class="text-sm font-bold uppercase tracking-wider text-text-soft mb-3">Orçamentos técnicos salvos</h2>
          <div class="rounded-xl border border-border-ui bg-bg-card overflow-hidden">
            <ul class="divide-y divide-border-ui">
              <li
                v-for="ot in lista"
                :key="ot.id"
                class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div class="min-w-0">
                  <span class="font-medium text-text-main">#{{ ot.id }}</span>
                  <span class="text-text-soft mx-2">·</span>
                  <span class="text-text-main">{{ ot.agenda_loja?.titulo || `Agendamento #${ot.agenda_loja_id}` }}</span>
                  <span v-if="ot.agenda_loja?.cliente?.nome_completo" class="text-text-soft text-sm ml-2">
                    — {{ ot.agenda_loja.cliente.nome_completo }}
                  </span>
                  <span class="text-text-soft text-xs ml-2">{{ format.date(ot.criado_em) }}</span>
                </div>
                <Button variant="ghost" size="sm" class="!rounded-xl" @click="router.push(`/orcamento-tecnico/${ot.id}`)">
                  Ver itens
                </Button>
              </li>
            </ul>
          </div>
        </section>
        <Loading v-else-if="loading" />
        <p v-else class="text-text-soft text-sm">Nenhum orçamento técnico salvo ainda.</p>

        <section>
          <h2 class="text-sm font-bold uppercase tracking-wider text-text-soft mb-3">Como gerar um novo</h2>
          <p class="text-text-main mb-4">
            Para gerar um orçamento técnico a partir dos ambientes e paredes já medidos:
          </p>
          <ol class="list-decimal list-inside space-y-2 text-text-main mb-6">
            <li>Acesse a <strong>Agenda de Venda</strong> ou o <strong>Totem Fábrica</strong>.</li>
            <li>Abra a tarefa de medição do agendamento desejado (página de medição por ambiente).</li>
            <li>Clique no botão <strong>« Gerar Orçamento Técnico »</strong> no topo da página (abre em nova aba).</li>
            <li>Na nova página, selecione os ambientes que deseja converter e clique em <strong>Converter em orçamento técnico</strong>.</li>
          </ol>
          <div class="flex flex-wrap gap-3">
            <Button variant="primary" class="!rounded-xl" @click="router.push('/totem-fabrica')">
              <i class="pi pi-building mr-2" />
              Ir para Totem Fábrica
            </Button>
            <Button variant="secondary" class="!rounded-xl" @click="router.push('/agendamentos/loja')">
              <i class="pi pi-calendar-clock mr-2" />
              Ir para Agenda de Venda
            </Button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { OrcamentoTecnicoService } from '@/services'
import { format } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import Loading from '@/components/common/Loading.vue'

definePage({ meta: { perm: 'agendamentos.producao' } })

const router = useRouter()
const loading = ref(true)
const erro = ref('')
const lista = ref([])

async function carregar() {
  loading.value = true
  erro.value = ''
  try {
    const res = await OrcamentoTecnicoService.listar()
    const raw = res?.data ?? res
    lista.value = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
  } catch (e) {
    lista.value = []
    const status = e?.response?.status
    erro.value = status === 401
      ? 'Faça login novamente para carregar a lista.'
      : (e?.response?.data?.message || 'Erro ao carregar a lista. Tente novamente.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  carregar()
})
</script>
