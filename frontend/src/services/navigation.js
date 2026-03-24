// src/services/navigation.js
/** etapaKey: chave do mapa de cores A Casa (CADASTRO, MEDICAO, ORCAMENTO, AGENDAR_APRESENTACAO, FECHAR_VENDA, AGENDAR_FECHAMENTO, MEDIDA_FINA, PRODUCAO, MONTAGEM, POS_VENDA_GARANTIA) para indicador e hover no menu. */
export const NAV_SCHEMA = {
  comercial: [
    { label: 'Orçamento', to: '/orcamentos', icon: 'pi-file-edit', perm: 'orcamentos.ver', etapaKey: 'ORCAMENTO' },
    { label: 'Fechamento de Venda', to: '/vendas/fechamento', icon: 'pi-shopping-cart', perm: ['vendas.criar', 'vendas.fechamento.ver', 'vendas.fechamento.criar'], etapaKey: 'FECHAR_VENDA' },
    { label: 'Contrato', to: '/contratos', icon: 'pi-file', perm: 'contratos.ver', etapaKey: 'FECHAR_VENDA' },
  ],

  comercial_2: [
    { label: 'Visual Lab', to: '/visual-lab', icon: 'pi-box' },
    { label: 'Agenda', to: '/agenda-geral', icon: 'pi-calendar-clock', perm: ['agendamentos.vendas', 'agendamentos.producao', 'agendamentos.ver'], etapaKey: 'AGENDAR_APRESENTACAO' },
    { label: 'Fluxo de Clientes', to: '/relatorios/acompanhamento-status', icon: 'pi-list-check', perm: 'relatorios.acompanhamento_status.ver', etapaKey: 'MEDICAO' },
    { label: 'Orçamento Técnico', to: '/orcamento-tecnico', icon: 'pi-file-edit', perm: 'agendamentos.vendas', etapaKey: 'ORCAMENTO' },
  ],

  producao: [
    { label: 'Agenda Geral', to: '/agenda-geral', icon: 'pi-objects-column', perm: 'agendamentos.ver', etapaKey: 'PRODUCAO' },
    { label: 'Medição Fina', to: '/producao/medicao-fina', icon: 'pi-sliders-h', perm: ['agendamentos.vendas', 'agendamentos.producao'], etapaKey: 'MEDIDA_FINA' },
    { label: 'Medida Técnica', to: '/producao/medida-tecnica', icon: 'pi-compass', perm: ['agendamentos.vendas', 'agendamentos.producao'], etapaKey: 'MEDIDA_FINA' },
    { label: 'Projeto técnico', to: '/producao/projeto-tecnico', icon: 'pi-box', perm: ['agendamentos.vendas', 'agendamentos.producao'], etapaKey: 'PROJETO_TECNICO' },
    { label: 'Projeto Plano de Corte', to: '/producao/projeto-plano-corte', icon: 'pi-sitemap', perm: 'plano_corte.ver', etapaKey: 'PRODUCAO' },
    { label: 'Serviço de Corte', to: '/plano-corte', icon: 'pi-cog', perm: 'plano_corte.ver', etapaKey: 'PRODUCAO' },
    { label: 'Venda Serviço de Corte', to: '/plano-corte/venda', icon: 'pi-dollar', perm: 'plano_corte.criar', etapaKey: 'PRODUCAO' },
    { divider: true },
    { label: 'Totem Fábrica', to: '/totem-fabrica', icon: 'pi-building', perm: 'agendamentos.producao', etapaKey: 'PRODUCAO' },
    { label: 'Timeline de Projetos', to: '/producao/apontamento', icon: 'pi-history', perm: ['agendamentos.producao', 'agendamentos.vendas'], etapaKey: 'PRODUCAO' },
  ],

  financeiro: [
    { label: 'Contas a Pagar', to: '/financeiro/contas-pagar', icon: 'pi-arrow-down-right', perm: 'contas_pagar.ver' },
    { label: 'Contas a Receber', to: '/financeiro/contas-receber', icon: 'pi-arrow-up-right', perm: 'contas_receber.ver' },
    { divider: true },
    { label: 'Compras', to: '/compras', icon: 'pi-shopping-cart', perm: 'compras.ver' },
    { label: 'Despesas Gerais', to: '/despesas', icon: 'pi-wallet', perm: 'despesas.ver' },
  ],

  cadastros: [
    { label: 'Clientes', to: '/clientes', icon: 'pi-users', perm: 'clientes.ver' },
    { label: 'Fornecedores', to: '/fornecedor', icon: 'pi-truck', perm: 'fornecedores.ver' },
    { label: 'Funcionários', to: '/funcionarios', icon: 'pi-id-card', perm: 'funcionarios.ver' },
    { label: 'Produtos', to: '/produtos', icon: 'pi-tag', perm: 'produtos.ver' },
    { label: 'Estoque', to: '/estoque', icon: 'pi-database', perm: 'produtos.ver', etapaKey: 'PRODUCAO' },
    { label: 'Produtos Serviço de Corte', to: '/plano-corte/itens', icon: 'pi-box', perm: 'plano_corte.ver', etapaKey: 'PRODUCAO' },
  ],

  configuracoes: [
    { label: 'Usuários', to: '/configuracoes/usuarios', icon: 'pi-user', perm: 'usuarios.ver' },
    { label: 'Permissões', to: '/configuracoes/permissoes', icon: 'pi-lock', perm: 'permissoes.ver' },
    { label: 'Cláusulas', to: '/contratos/clausulas', icon: 'pi-file-edit', perm: 'contratos.clausulas.editar', etapaKey: 'FECHAR_VENDA' },
    { divider: true },
    {
      label: 'RH (Gestão)',
      icon: 'pi-users',
      perm: 'ponto_relatorio.ver',
      children: [
        { label: 'Relatório de Ponto', to: '/rh/ponto/relatorio', icon: 'pi-stopwatch', perm: 'ponto_relatorio.ver' },
        { label: 'Convites do Ponto', to: '/rh/ponto/convites', icon: 'pi-link', perm: 'ponto_convite.criar' },
        { label: 'Feriados', to: '/rh/ponto/horas-extras', icon: 'pi-calendar', perm: 'ponto_relatorio.ver' },
        { label: 'Pagamento Funcionários', to: '/rh/ponto/fechamento', icon: 'pi-wallet', perm: 'despesas.ver' },
      ],
    },
    { divider: true },
    { label: 'Cadastro da Empresa', to: '/configuracoes/configuracoes', icon: 'pi-sliders-h', perm: 'configuracoes.empresa.ver' },
    { label: 'Estratégia de Preços', to: '/configuracoes/estrategia-precos', icon: 'pi-chart-line', perm: 'configuracoes.estrategia_precos.ver' },
    { label: 'Visual Lab', to: '/visual-lab', icon: 'pi-box' },
  ],

  relatorios: [
    { label: 'Custos de Estrutura', to: '/financeiro/custos-estrutura', icon: 'pi-chart-bar', perm: 'custos_estrutura.ver' },
    { label: 'DRE Mensal', to: '/relatorios/dre-mensal', icon: 'pi-chart-line', perm: 'relatorios.dre_mensal.ver' },
    { label: 'DRE Detalhada', to: '/relatorios/dre-detalhada', icon: 'pi-chart-pie', perm: 'relatorios.dre_detalhada.ver' },
    { label: 'Comissão de Produção', to: '/comissao-producao', icon: 'pi-percentage', perm: 'comissao_producao.ver' },
  ],

}

/** Metadados visuais de cada seção do menu (label, eyebrow, description). */
export const NAV_SECTION_META = {
  comercial:      { label: 'Comercial',      eyebrow: 'Vendas',      description: 'Orçamentos, vendas e contratos' },
  comercial_2:    { label: 'Comercial',      eyebrow: 'Ferramentas', description: 'Agenda, fluxo e orçamento técnico' },
  producao:       { label: 'Produção',       eyebrow: 'Fábrica',     description: 'Medição, corte e apontamento' },
  financeiro:     { label: 'Financeiro',     eyebrow: 'Finanças',    description: 'Contas, compras e despesas' },
  cadastros:      { label: 'Cadastros',      eyebrow: 'Dados',       description: 'Clientes, fornecedores e produtos' },
  configuracoes:  { label: 'Configurações',  eyebrow: 'Sistema',     description: 'Usuários, permissões e empresa' },
  relatorios:     { label: 'Relatórios',     eyebrow: 'Análise',     description: 'DRE, custos e comissões' },
}

/** Retorna { isActive, isChildActive } para um item do menu comparado com a rota atual. */
export function getNavItemState(item, route) {
  if (!item?.to) return { isActive: false, isChildActive: false }
  const currentPath = route.path
  const normalizedTo = item.to.replace(/\/$/, '')
  const isActive = currentPath === item.to
    || currentPath === normalizedTo
    || (normalizedTo && currentPath.startsWith(normalizedTo + '/'))
  const isChildActive = item.children?.some((child) => {
    const childTo = String(child.to || '').replace(/\/$/, '')
    return child.to && (currentPath === child.to || currentPath === childTo || (childTo && currentPath.startsWith(childTo + '/')))
  }) || false
  return { isActive, isChildActive }
}

/**
 * Encontra o item de navegação que melhor corresponde à rota atual.
 * Retorna { item, state: { score } } — score ≥ 0 indica match.
 */
export function findBestNavItemMatch(items, route) {
  const currentPath = route.path
  let best = { item: null, state: { score: -1 } }

  for (const item of items) {
    if (item.divider) continue

    // Checa filhos primeiro (match mais específico)
    if (item.children) {
      for (const child of item.children) {
        if (!child.to) continue
        const score = calcMatchScore(child.to, currentPath)
        if (score > best.state.score) {
          best = { item: child, state: { score } }
        }
      }
    }

    if (!item.to) continue
    const score = calcMatchScore(item.to, currentPath)
    if (score > best.state.score) {
      best = { item, state: { score } }
    }
  }

  return best
}

function calcMatchScore(itemPath, currentPath) {
  if (currentPath === itemPath) return itemPath.length + 1000 // match exato tem prioridade
  if (currentPath.startsWith(itemPath + '/')) return itemPath.length
  return -1
}
