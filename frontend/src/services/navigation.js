// src/services/navigation.js
/** etapaKey: chave do mapa de cores A Casa (CADASTRO, MEDICAO, ORCAMENTO, AGENDAR_APRESENTACAO, FECHAR_VENDA, AGENDAR_FECHAMENTO, MEDIDA_FINA, PRODUCAO, MONTAGEM, POS_VENDA_GARANTIA) para indicador e hover no menu. */
export const NAV_SCHEMA = {
  cadastros: [
    { label: 'Clientes', to: '/clientes', icon: 'pi-users', perm: 'clientes.ver' },
    { label: 'Importar do Drive', to: '/migracao-drive', icon: 'pi-cloud-download', perm: 'clientes.criar' },
    { label: 'Fornecedores', to: '/fornecedor', icon: 'pi-truck', perm: 'fornecedores.ver' },
    { label: 'Funcionários', to: '/funcionarios', icon: 'pi-id-card', perm: 'funcionarios.ver' },
    { label: 'Automóveis', to: '/automoveis', icon: 'pi-car', perm: 'automoveis.read' },
    { label: 'Cadastro de Produtos', to: '/produtos', icon: 'pi-tag', perm: 'produtos.ver' },
    { label: 'Controle de Estoque', to: '/estoque-retalho', icon: 'pi-box', perm: 'produtos.ver', etapaKey: 'PRODUCAO' },
    { label: 'Produtos Serviço de Corte', to: '/plano-corte/itens', icon: 'pi-box', perm: 'plano_corte.ver', etapaKey: 'PRODUCAO' },
  ],

  comercial: [
    {
      label: 'Orçamentos',
      to: '/comercial/orcamentos',
      icon: 'pi-file-edit',
      perm: 'clientes.ver',
      etapaKey: 'FECHAR_VENDA',
    },
    {
      label: 'Markup pós-venda',
      to: '/comercial/pos-venda-markup',
      icon: 'pi-percentage',
      perm: 'clientes.ver',
      etapaKey: 'POS_VENDA_GARANTIA',
    },
    {
      label: 'Garantias',
      to: '/garantias',
      icon: 'pi-wrench',
      perm: 'garantias.ver',
      etapaKey: 'POS_VENDA_GARANTIA',
    },
  ],

  producao: [
    { label: 'Agenda Geral', to: '/agenda-geral', icon: 'pi-objects-column', perm: 'agendamentos.ver', etapaKey: 'PRODUCAO' },
    { label: 'Serviço de Corte', to: '/plano-corte', icon: 'pi-cog', perm: 'plano_corte.ver', etapaKey: 'PRODUCAO' },
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
  ],

  relatorios: [
    { label: 'Custos de Estrutura', to: '/financeiro/custos-estrutura', icon: 'pi-chart-bar', perm: 'custos_estrutura.ver' },
    { label: 'Fluxo de Caixa', to: '/relatorios/fluxo-caixa', icon: 'pi-arrows-h', perm: 'relatorios.fluxo_caixa.ver' },
    { label: 'DRE Mensal', to: '/relatorios/dre-mensal', icon: 'pi-chart-line', perm: 'relatorios.dre_mensal.ver' },
    { label: 'DRE Detalhada', to: '/relatorios/dre-detalhada', icon: 'pi-chart-pie', perm: 'relatorios.dre_detalhada.ver' },
    { label: 'Contas a Pagar', to: '/relatorios/contas-pagar', icon: 'pi-file-check', perm: 'contas_pagar.ver' },
    { label: 'Contas a Receber', to: '/relatorios/contas-receber', icon: 'pi-file-check', perm: 'contas_receber.ver' },
    { label: 'Comissão de Produção', to: '/comissao-producao', icon: 'pi-percentage', perm: 'comissao_producao.ver' },
    { label: 'Totem Produção', to: '/relatorios/totem-producao', icon: 'pi-clock', perm: 'agendamentos.producao' },
    { label: 'Custo de Rota', to: '/relatorios/custo-rota', icon: 'pi-map', perm: 'relatorios.custo_rota' },
    { divider: true },
    { label: 'Folha Trabalhista', to: '/relatorios/folha-trabalhista', icon: 'pi-briefcase', perm: 'funcionarios.ver' },
  ],

}

/** Metadados visuais de cada seção do menu (label, eyebrow, description). */
export const NAV_SECTION_META = {
  cadastros:      { label: 'Cadastros',      eyebrow: 'Dados',       description: 'Clientes, fornecedores e produtos' },
  comercial:      { label: 'Comercial',      eyebrow: 'Vendas',      description: 'Orçamentos e markup pós-venda' },
  producao:       { label: 'Produção',       eyebrow: 'Fábrica',     description: 'Serviço de corte, agenda e apontamento' },
  financeiro:     { label: 'Financeiro',     eyebrow: 'Finanças',    description: 'Contas, compras e despesas' },
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
