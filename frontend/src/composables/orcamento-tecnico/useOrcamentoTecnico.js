import { ref, computed } from 'vue'
import { OrcamentoTecnicoService } from '@/services'
import { notify } from '@/services/notify'

/**
 * Carregamento, KPIs, finalização e mapeamento de ambientes do orçamento técnico.
 * Recebe dependências de cálculo como parâmetro para evitar acoplamento circular.
 */
export function useOrcamentoTecnico({ mapearAmbientesParaFinalizacao, getPayloadFechamento }) {
  const loading = ref(true)
  const erro = ref('')
  const orcamento = ref(null)
  const finalizandoOrcamento = ref(false)

  // ── KPIs e dados do cliente ────────────────────────────────────
  // Lê de agenda_loja.cliente (OT via técnico) OU de cliente direto (OT via Promob/Manual)
  const nomeClienteAtual = computed(() =>
    orcamento.value?.agenda_loja?.cliente?.nome_completo
    || orcamento.value?.cliente?.nome_completo
    || 'Cliente não identificado'
  )

  const contatoCliente = computed(() => {
    const cliente = orcamento.value?.agenda_loja?.cliente || orcamento.value?.cliente
    return cliente?.whatsapp || cliente?.telefone || cliente?.email || '—'
  })

  const totalAmbientesProjeto = computed(() =>
    Number(orcamento.value?.resumo_base?.total_ambientes || 0)
  )

  const areaRealProjeto = computed(() =>
    Number(orcamento.value?.resumo_base?.area_real_m2 || 0)
  )

  const precoEstimadoBase = computed(() =>
    Number(orcamento.value?.resumo_base?.preco_estimado_vendedor || 0)
  )

  const ambientesTecnico = computed(() =>
    orcamento.value?.agenda_loja?.medicao_orcamento?.ambientes ?? []
  )

  const temMedicaoTecnico = computed(() => ambientesTecnico.value.length > 0)

  // ── Carregar ───────────────────────────────────────────────────
  async function carregar(id, onCarregado) {
    if (!id) { erro.value = 'ID não informado.'; loading.value = false; return }
    loading.value = true
    erro.value = ''
    try {
      const resOrc = await OrcamentoTecnicoService.buscar(id)
      orcamento.value = resOrc?.data ?? resOrc ?? null
      if (onCarregado) onCarregado(orcamento.value)
    } catch (e) {
      erro.value = e?.response?.data?.message || 'Não foi possível carregar o orçamento técnico.'
    } finally {
      loading.value = false
    }
  }

  // ── Finalizar ──────────────────────────────────────────────────
  async function finalizarOrcamentoAtual(id) {
    if (!id) return null
    finalizandoOrcamento.value = true
    try {
      const ambientes = mapearAmbientesParaFinalizacao()
      const fechamento = getPayloadFechamento ? getPayloadFechamento() : {}
      const res = await OrcamentoTecnicoService.finalizar(id, { ambientes, ...fechamento })
      notify.success('Orçamento finalizado com sucesso.')
      await carregar(id)
      return res?.data ?? res ?? null
    } catch (e) {
      notify.error(e?.response?.data?.message || 'Não foi possível finalizar o orçamento.')
      return null
    } finally {
      finalizandoOrcamento.value = false
    }
  }

  return {
    loading,
    erro,
    orcamento,
    finalizandoOrcamento,
    nomeClienteAtual,
    contatoCliente,
    totalAmbientesProjeto,
    areaRealProjeto,
    precoEstimadoBase,
    ambientesTecnico,
    temMedicaoTecnico,
    carregar,
    finalizarOrcamentoAtual,
  }
}
