<template>
  <PageShell :padded="false" variant="minimal">
    <section class="login-font ds-page-context ds-page-context--editor animate-page-in">
      <PageHeader
        title="Fechamento de Venda"
        subtitle="Carregando editor completo da venda..."
        icon="pi pi-wallet"
        variant="minimal"
      />
      <div class="ds-editor-body">
        <Loading />
      </div>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { notify } from '@/services/notify'
import PageShell from '@/components/ui/PageShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Loading from '@/components/common/Loading.vue'

definePage({ meta: { perm: ['vendas.fechamento.ver', 'vendas.criar', 'vendas.fechamento.criar'] } })

const route = useRoute()
const router = useRouter()

const orcamentoId = computed(() => Number(String(route.params.orcamentoId || '').replace(/\D/g, '')) || 0)

onMounted(() => {
  if (!orcamentoId.value) {
    notify.error('Orçamento inválido para fechamento.')
    router.replace('/vendas/fechamento')
    return
  }
  router.replace(`/vendas/nova-venda?orcamentoId=${orcamentoId.value}`)
})
</script>