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
    { chave: 'permissoes.ver', descricao: 'Acessar tela de permissões' },
    { chave: 'permissoes.editar', descricao: 'Editar permissões' },
    { chave: 'usuarios.ver', descricao: 'Listar usuários' },
    { chave: 'usuarios.criar', descricao: 'Criar usuário' },
    { chave: 'usuarios.editar', descricao: 'Editar usuário' },
    { chave: 'usuarios.excluir', descricao: 'Excluir usuário' },
    { chave: 'PONTO_RELATORIO.ver', descricao: 'Acessar relatório de registros de ponto' },
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
