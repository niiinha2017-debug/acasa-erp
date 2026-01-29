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
      senha: senhaHash,
    },
    create: {
      nome: 'Ana Paula Costa de Souza',
      usuario: 'Ana.P',
      email: 'ana.paulacosta01@hotmail.com',
      status: 'ATIVO',
      senha: senhaHash,
    },
    select: { id: true },
  })

const perms = [
  // Configurações
  { chave: 'usuarios.ver', descricao: 'Visualizar usuários' },
  { chave: 'usuarios.criar', descricao: 'Criar usuários' },
  { chave: 'usuarios.editar', descricao: 'Editar usuários' },
  { chave: 'usuarios.excluir', descricao: 'Excluir usuários' },

  { chave: 'permissoes.ver', descricao: 'Visualizar permissões' },
  { chave: 'permissoes.gerenciar', descricao: 'Gerenciar permissões' },

  { chave: 'configuracoes.empresa.ver', descricao: 'Visualizar empresa' },
  { chave: 'configuracoes.empresa.editar', descricao: 'Editar empresa' },

  { chave: 'arquivos.ver', descricao: 'Visualizar arquivos' },
  { chave: 'arquivos.criar', descricao: 'Criar arquivos' },
  { chave: 'arquivos.excluir', descricao: 'Excluir arquivos' },

  // Ponto
  { chave: 'ponto_relatorio.ver', descricao: 'Visualizar relatório de ponto' },
  { chave: 'ponto_relatorio.editar', descricao: 'Editar registros de ponto' },

  { chave: 'ponto_convite.criar', descricao: 'Criar convites de ponto' },
  { chave: 'ponto_convite.excluir', descricao: 'Excluir convites de ponto' },

  // Operacional
  { chave: 'agendamentos.ver', descricao: 'Visualizar agendamentos' },
  { chave: 'agendamentos.criar', descricao: 'Criar agendamentos' },
  { chave: 'agendamentos.editar', descricao: 'Editar agendamentos' },
  { chave: 'agendamentos.excluir', descricao: 'Excluir agendamentos' },

  { chave: 'vendas.ver', descricao: 'Visualizar vendas' },
  { chave: 'vendas.criar', descricao: 'Criar vendas' },
  { chave: 'vendas.editar', descricao: 'Editar vendas' },
  { chave: 'vendas.excluir', descricao: 'Excluir vendas' },

  { chave: 'orcamentos.ver', descricao: 'Visualizar orçamentos' },
  { chave: 'orcamentos.criar', descricao: 'Criar orçamentos' },
  { chave: 'orcamentos.editar', descricao: 'Editar orçamentos' },
  { chave: 'orcamentos.excluir', descricao: 'Excluir orçamentos' },

  { chave: 'producao.ver', descricao: 'Visualizar produção' },
  { chave: 'producao.criar', descricao: 'Criar produção' },
  { chave: 'producao.editar', descricao: 'Editar produção' },
  { chave: 'producao.excluir', descricao: 'Excluir produção' },

  { chave: 'plano_corte.ver', descricao: 'Visualizar plano de corte' },
  { chave: 'plano_corte.criar', descricao: 'Criar plano de corte' },
  { chave: 'plano_corte.editar', descricao: 'Editar plano de corte' },
  { chave: 'plano_corte.excluir', descricao: 'Excluir plano de corte' },
  { chave: 'plano_corte.enviar_producao', descricao: 'Enviar plano de corte para produção' },


  // Cadastros
  { chave: 'clientes.ver', descricao: 'Visualizar clientes' },
  { chave: 'clientes.criar', descricao: 'Criar clientes' },
  { chave: 'clientes.editar', descricao: 'Editar clientes' },
  { chave: 'clientes.excluir', descricao: 'Excluir clientes' },

  { chave: 'fornecedores.ver', descricao: 'Visualizar fornecedores' },
  { chave: 'fornecedores.criar', descricao: 'Criar fornecedores' },
  { chave: 'fornecedores.editar', descricao: 'Editar fornecedores' },
  { chave: 'fornecedores.excluir', descricao: 'Excluir fornecedores' },

  { chave: 'produtos.ver', descricao: 'Visualizar produtos' },
  { chave: 'produtos.criar', descricao: 'Criar produtos' },
  { chave: 'produtos.editar', descricao: 'Editar produtos' },
  { chave: 'produtos.excluir', descricao: 'Excluir produtos' },

  { chave: 'funcionarios.ver', descricao: 'Visualizar funcionários' },
  { chave: 'funcionarios.criar', descricao: 'Criar funcionários' },
  { chave: 'funcionarios.editar', descricao: 'Editar funcionários' },
  { chave: 'funcionarios.excluir', descricao: 'Excluir funcionários' },

  // Financeiro
  { chave: 'cheques.ver', descricao: 'Visualizar cheques' },
  { chave: 'cheques.editar', descricao: 'Editar cheques' },

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
    where: { chave: { in: perms.map(p => p.chave) } },
    select: { id: true },
  })

  await prisma.usuarios_permissoes.deleteMany({ where: { usuario_id: admin.id } })
  await prisma.usuarios_permissoes.createMany({
    data: permsDb.map(p => ({ usuario_id: admin.id, permissao_id: p.id })),
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
