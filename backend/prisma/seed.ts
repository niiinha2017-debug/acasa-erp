import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const senhaHash = await bcrypt.hash('081317', 10)

  const admin = await prisma.usuarios.upsert({
    where: { usuario: 'Ana.P' },
    update: {
      nome: 'Ana Paula Costa de Souza',
      email: 'ana.paulacosta01@hotmail.com',
      status: 'ATIVO',
      is_admin: true,
      senha: senhaHash,
    },
    create: {
      nome: 'Ana Paula Costa de Souza',
      usuario: 'Ana.P',
      email: 'ana.paulacosta01@hotmail.com',
      status: 'ATIVO',
      is_admin: true,
      senha: senhaHash,
    },
    select: { id: true },
  })

  const funcionarioAdmin = await prisma.funcionarios.upsert({
    where: { cpf: '000.000.000-00' },
    update: {
      nome: 'Ana Paula Costa de Souza',
      email: 'ana.paulacosta01@hotmail.com',
      status: 'ATIVO',
    },
    create: {
      nome: 'Ana Paula Costa de Souza',
      cpf: '000.000.000-00',
      email: 'ana.paulacosta01@hotmail.com',
      status: 'ATIVO',
    },
    select: { id: true },
  })

  await prisma.$executeRaw`
    UPDATE usuarios
    SET funcionario_id = ${funcionarioAdmin.id}
    WHERE id = ${admin.id}
  `

  const perms = [
    { chave: 'ADMIN', descricao: 'Acesso total' },

    // Permissoes padrao de primeiro acesso
    { chave: 'index.visualizar', descricao: 'Acesso a pagina inicial' },
    { chave: 'dashboard.visualizar', descricao: 'Acesso ao hub de relatorios' },
    // Acompanhamento de status – tela /relatorios/acompanhamento-status
    { chave: 'relatorios.acompanhamento_status.ver', descricao: 'Acompanhamento de status' },
    { chave: 'pendente.visualizar', descricao: 'Acesso a tela de primeiro acesso' },
    { chave: 'alterar-senha', descricao: 'Acesso a alterar senha' },

    // Configuracoes
    { chave: 'usuarios.ver', descricao: 'Visualizar usuarios' },
    { chave: 'usuarios.criar', descricao: 'Criar usuarios' },
    { chave: 'usuarios.editar', descricao: 'Editar usuarios' },
    { chave: 'usuarios.excluir', descricao: 'Excluir usuarios' },

    { chave: 'permissoes.ver', descricao: 'Visualizar permissoes' },
    { chave: 'permissoes.gerenciar', descricao: 'Gerenciar permissoes' },

    { chave: 'configuracoes.empresa.ver', descricao: 'Visualizar empresa' },
    { chave: 'configuracoes.empresa.editar', descricao: 'Editar empresa' },

    { chave: 'arquivos.ver', descricao: 'Visualizar arquivos' },
    { chave: 'arquivos.criar', descricao: 'Criar arquivos' },
    { chave: 'arquivos.excluir', descricao: 'Excluir arquivos' },

    // Ponto
    { chave: 'ponto_relatorio.ver', descricao: 'Visualizar relatorio de ponto' },
    { chave: 'ponto_relatorio.editar', descricao: 'Editar registros de ponto' },

    { chave: 'ponto_convite.criar', descricao: 'Criar convites de ponto' },
    { chave: 'ponto_convite.excluir', descricao: 'Excluir convites de ponto' },

    // Operacional
    { chave: 'agendamentos.ver', descricao: 'Visualizar agendamentos' },
    { chave: 'agendamentos.criar', descricao: 'Criar agendamentos' },
    { chave: 'agendamentos.editar', descricao: 'Editar agendamentos' },
    { chave: 'agendamentos.excluir', descricao: 'Excluir agendamentos' },
    { chave: 'agendamentos.vendas', descricao: 'Agenda de venda (loja): ver, criar, editar e excluir' },
    { chave: 'agendamentos.producao', descricao: 'Ver agenda - producao' },

    { chave: 'vendas.ver', descricao: 'Visualizar vendas (detalhe/comercial)' },
    { chave: 'vendas.criar', descricao: 'Criar vendas (fechamento - comercial)' },
    { chave: 'vendas.editar', descricao: 'Editar vendas (comercial)' },
    { chave: 'vendas.excluir', descricao: 'Excluir vendas' },
    { chave: 'vendas.fechamento.ver', descricao: 'Visualizar tela de fechamento de venda (loja)' },
    { chave: 'vendas.fechamento.criar', descricao: 'Fechar venda na tela de loja' },
    { chave: 'posvenda.ver', descricao: 'Pos-venda: listagem e acompanhamento (area producao)' },

    { chave: 'orcamentos.ver', descricao: 'Visualizar orcamentos' },
    { chave: 'orcamentos.criar', descricao: 'Criar orcamentos' },
    { chave: 'orcamentos.editar', descricao: 'Editar orcamentos' },
    // Cláusulas – orçamento (por cliente)
    { chave: 'orcamentos.clausulas.editar', descricao: 'Editar clausulas do orcamento (por cliente)' },
    { chave: 'orcamentos.excluir', descricao: 'Excluir orcamentos' },

    { chave: 'contratos.ver', descricao: 'Visualizar contratos' },
    { chave: 'contratos.criar', descricao: 'Criar contratos' },
    { chave: 'contratos.editar', descricao: 'Editar contratos' },
    // Cláusulas – tela /contratos/clausulas (modelos de contrato e orçamento)
    { chave: 'contratos.clausulas.editar', descricao: 'Cláusulas (contratos e orçamentos)' },
    { chave: 'contratos.excluir', descricao: 'Excluir contratos' },
    { chave: 'contratos.assinatura_digital', descricao: 'Autorizar Uso de Assinatura Digital' },

    { chave: 'plano_corte.ver', descricao: 'Visualizar serviço de corte' },
    { chave: 'plano_corte.criar', descricao: 'Criar serviço de corte' },
    { chave: 'plano_corte.editar', descricao: 'Editar serviço de corte' },
    { chave: 'plano_corte.excluir', descricao: 'Excluir serviço de corte' },
    { chave: 'plano_corte.enviar_producao', descricao: 'Enviar serviço de corte para producao (agenda)' },

    // Cadastros
    { chave: 'clientes.ver', descricao: 'Visualizar clientes' },
    { chave: 'clientes.criar', descricao: 'Criar clientes' },
    { chave: 'clientes.editar', descricao: 'Editar clientes' },
    { chave: 'clientes.excluir', descricao: 'Excluir clientes' },
    { chave: 'clientes.select', descricao: 'Listar clientes (select)' },
    { chave: 'clientes.acesso_global', descricao: 'Acesso Global de Clientes (Fluxo: ver todos; sem esta permissão, só vê onde é Responsável)' },

    // Produção / Fábrica (Loja vs. Fábrica)
    { chave: 'producao_fabrica.visualizar_producao', descricao: 'Visualizar Produção' },
    { chave: 'producao_fabrica.concluir_montagem', descricao: 'Concluir Montagem' },
    { chave: 'producao_fabrica.medidas_finais', descricao: 'Acessar Medidas Finais' },
    { chave: 'producao_fabrica.ver_medidas_finais', descricao: 'Ver Medidas Finais' },
    { chave: 'producao_fabrica.avancar_montagem', descricao: 'Avançar para Montagem' },
    { chave: 'producao_fabrica.acessar_agenda_fabrica', descricao: 'Acessar Agenda de Fábrica' },

    { chave: 'fornecedores.ver', descricao: 'Visualizar fornecedores' },
    { chave: 'fornecedores.criar', descricao: 'Criar fornecedores' },
    { chave: 'fornecedores.editar', descricao: 'Editar fornecedores' },
    { chave: 'fornecedores.excluir', descricao: 'Excluir fornecedores' },
    { chave: 'fornecedores.select', descricao: 'Listar fornecedores (select)' },

    { chave: 'produtos.ver', descricao: 'Visualizar produtos' },
    { chave: 'produtos.criar', descricao: 'Criar produtos' },
    { chave: 'produtos.editar', descricao: 'Editar produtos' },
    { chave: 'produtos.excluir', descricao: 'Excluir produtos' },

    { chave: 'funcionarios.ver', descricao: 'Visualizar funcionarios' },
    { chave: 'funcionarios.criar', descricao: 'Criar funcionarios' },
    { chave: 'funcionarios.editar', descricao: 'Editar funcionarios' },
    { chave: 'funcionarios.excluir', descricao: 'Excluir funcionarios' },
    { chave: 'funcionarios.select', descricao: 'Listar funcionarios (select)' },

    // Financeiro
    { chave: 'fechamento_fornecedor.criar', descricao: 'Executar fechamento mensal por fornecedor' },

    { chave: 'contas_pagar.ver', descricao: 'Visualizar contas a pagar' },
    { chave: 'contas_pagar.criar', descricao: 'Criar contas a pagar' },
    { chave: 'contas_pagar.editar', descricao: 'Editar contas a pagar' },
    { chave: 'contas_pagar.excluir', descricao: 'Excluir contas a pagar' },

    { chave: 'contas_receber.ver', descricao: 'Visualizar contas a receber' },
    { chave: 'contas_receber.criar', descricao: 'Criar contas a receber' },
    { chave: 'contas_receber.editar', descricao: 'Editar contas a receber' },
    { chave: 'contas_receber.excluir', descricao: 'Excluir contas a receber' },

    { chave: 'despesas.ver', descricao: 'Visualizar despesas' },
    { chave: 'despesas.criar', descricao: 'Criar despesas' },
    { chave: 'despesas.editar', descricao: 'Editar despesas' },
    { chave: 'despesas.excluir', descricao: 'Excluir despesas' },

    { chave: 'compras.ver', descricao: 'Visualizar compras' },
    { chave: 'compras.criar', descricao: 'Criar compras' },
    { chave: 'compras.editar', descricao: 'Editar compras' },
    { chave: 'compras.excluir', descricao: 'Excluir compras' },
  ]

  for (const p of perms) {
    await prisma.permissoes.upsert({
      where: { chave: p.chave },
      update: { descricao: p.descricao },
      create: { chave: p.chave, descricao: p.descricao },
    })
  }

  const permissoesLegadas = [
    'obras.ver',
    'obras.criar',
    'obras.editar',
    'producao.ver',
    'producao.criar',
    'producao.editar',
    'producao.excluir',
    'projetos.ver',
    'projetos.criar',
    'projetos.editar',
    'projetos.excluir',
  ]
  const legadoDb = await prisma.permissoes.findMany({
    where: { chave: { in: permissoesLegadas } },
    select: { id: true },
  })
  if (legadoDb.length) {
    await prisma.usuarios_permissoes.deleteMany({
      where: { permissao_id: { in: legadoDb.map((p) => p.id) } },
    })
    await prisma.permissoes.deleteMany({
      where: { id: { in: legadoDb.map((p) => p.id) } },
    })
  }

  const permsDb = await prisma.permissoes.findMany({
    where: { chave: { in: perms.map((p) => p.chave) } },
    select: { id: true },
  })

  await prisma.usuarios_permissoes.deleteMany({ where: { usuario_id: admin.id } })
  await prisma.usuarios_permissoes.createMany({
    data: permsDb.map((p) => ({ usuario_id: admin.id, permissao_id: p.id })),
    skipDuplicates: true,
  })

  // Usuária vendedora (agenda de venda + clientes). Senha: 081317
  const senhaVendedora = await bcrypt.hash('081317', 10)
  const chavesVendedor = [
    'index.visualizar',
    'pendente.visualizar',
    'alterar-senha',
    'agendamentos.vendas',
    'clientes.ver',
    'clientes.select',
    'orcamentos.ver',
    'vendas.ver',
    'vendas.fechamento.ver',
    'vendas.fechamento.criar',
    'contratos.ver',
    'contratos.criar',
    'contratos.editar',
  ]
  const permsVendedor = await prisma.permissoes.findMany({
    where: { chave: { in: chavesVendedor } },
    select: { id: true },
  })
  const vendedora = await prisma.usuarios.upsert({
    where: { usuario: 'vendedora' },
    update: {
      nome: 'Vendedora',
      email: 'vendedora@exemplo.com',
      status: 'ATIVO',
      is_admin: false,
      senha: senhaVendedora,
    },
    create: {
      nome: 'Vendedora',
      usuario: 'vendedora',
      email: 'vendedora@exemplo.com',
      status: 'ATIVO',
      is_admin: false,
      senha: senhaVendedora,
    },
    select: { id: true },
  })
  await prisma.usuarios_permissoes.deleteMany({ where: { usuario_id: vendedora.id } })
  await prisma.usuarios_permissoes.createMany({
    data: permsVendedor.map((p) => ({ usuario_id: vendedora.id, permissao_id: p.id })),
    skipDuplicates: true,
  })
  console.log('Seed OK: admin + vendedora (usuário vendedora, senha 081317) + permissoes')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


