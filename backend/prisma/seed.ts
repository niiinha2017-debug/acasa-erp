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
    { chave: 'dashboard.visualizar', descricao: 'Acesso ao dashboard' },
    { chave: 'pendente.visualizar', descricao: 'Acesso a tela de primeiro acesso' },
    { chave: 'alterar-senha', descricao: 'Acesso a alterar senha' },

    // Configuracoes
    { chave: 'usuarios.ver', descricao: 'Visualizar usuarios' },
    { chave: 'usuarios.criar', descricao: 'Criar usuarios' },
    { chave: 'usuarios.editar', descricao: 'Editar usuarios' },
    { chave: 'usuarios.excluir', descricao: 'Excluir usuarios' },

    { chave: 'permissoes.ver', descricao: 'Visualizar permissoes' },
    { chave: 'permissoes.gerenciar', descricao: 'Gerenciar permissoes' },

    { chave: 'obras.ver', descricao: 'Visualizar obras' },
    { chave: 'obras.criar', descricao: 'Criar obras' },
    { chave: 'obras.editar', descricao: 'Editar obras' },

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
    { chave: 'agendamentos.vendas', descricao: 'Ver agenda - vendas' },
    { chave: 'agendamentos.producao', descricao: 'Ver agenda - producao' },

    { chave: 'vendas.ver', descricao: 'Visualizar vendas' },
    { chave: 'vendas.criar', descricao: 'Criar vendas' },
    { chave: 'vendas.editar', descricao: 'Editar vendas' },
    { chave: 'vendas.excluir', descricao: 'Excluir vendas' },

    { chave: 'orcamentos.ver', descricao: 'Visualizar orcamentos' },
    { chave: 'orcamentos.criar', descricao: 'Criar orcamentos' },
    { chave: 'orcamentos.editar', descricao: 'Editar orcamentos' },
    { chave: 'orcamentos.excluir', descricao: 'Excluir orcamentos' },

    { chave: 'producao.ver', descricao: 'Visualizar producao' },
    { chave: 'producao.criar', descricao: 'Criar producao' },
    { chave: 'producao.editar', descricao: 'Editar producao' },
    { chave: 'producao.excluir', descricao: 'Excluir producao' },

    { chave: 'plano_corte.ver', descricao: 'Visualizar plano de corte' },
    { chave: 'plano_corte.criar', descricao: 'Criar plano de corte' },
    { chave: 'plano_corte.editar', descricao: 'Editar plano de corte' },
    { chave: 'plano_corte.excluir', descricao: 'Excluir plano de corte' },
    { chave: 'plano_corte.enviar_producao', descricao: 'Enviar plano de corte para producao (agenda)' },

    // Projetos
    { chave: 'projetos.ver', descricao: 'Visualizar projetos' },
    { chave: 'projetos.criar', descricao: 'Criar projetos' },
    { chave: 'projetos.editar', descricao: 'Editar projetos' },
    { chave: 'projetos.excluir', descricao: 'Excluir projetos' },

    // Cadastros
    { chave: 'clientes.ver', descricao: 'Visualizar clientes' },
    { chave: 'clientes.criar', descricao: 'Criar clientes' },
    { chave: 'clientes.editar', descricao: 'Editar clientes' },
    { chave: 'clientes.excluir', descricao: 'Excluir clientes' },
    { chave: 'clientes.select', descricao: 'Listar clientes (select)' },

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

  const permsDb = await prisma.permissoes.findMany({
    where: { chave: { in: perms.map((p) => p.chave) } },
    select: { id: true },
  })

  await prisma.usuarios_permissoes.deleteMany({ where: { usuario_id: admin.id } })
  await prisma.usuarios_permissoes.createMany({
    data: permsDb.map((p) => ({ usuario_id: admin.id, permissao_id: p.id })),
    skipDuplicates: true,
  })

  console.log('✅ Seed OK: admin + permissões vinculadas')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
