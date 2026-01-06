import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const senha = '081317' // <- sua senha
  const senhaHash = await bcrypt.hash(senha, 10)

// prisma/seed.ts
await prisma.usuarios.upsert({
  where: { usuario: 'Ana.P' },
  update: {},
  create: {
    nome: 'Ana Paula Costa de Souza',
    usuario: 'Ana.P',
    email: 'ana.paulacosta01@hotmail.com', // use o email real do print
    setor: 'ADMIN',
    funcao: 'ADMIN', // Use ADMIN aqui para garantir o acesso na EC2
    senha: await bcrypt.hash('081317', 10),
    status: 'ATIVO',
  },
})

  console.log('OK: admin criado/atualizado')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
