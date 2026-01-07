import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.usuarios.upsert({
    where: { usuario: 'Ana.P' },
    update: {},
    create: {
      nome: 'Ana Paula Costa de Souza',
      usuario: 'Ana.P',
      email: 'ana.paulacosta01@hotmail.com',
      setor: 'ADMIN',
      funcao: 'ADMIN',
      senha: await bcrypt.hash('081317', 10),
      status: 'ATIVO',
    },
  })

  console.log('✅ Seed OK: usuário admin')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
