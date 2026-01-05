import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const senha = '081317' // <- sua senha
  const senhaHash = await bcrypt.hash(senha, 10)

  await prisma.usuarios.upsert({
    where: { usuario: 'admin' },
    update: {
      // se já existir, você pode atualizar o hash:
      senha: senhaHash,
      status: 'ATIVO',
    },
    create: {
      nome: 'Admin',
      usuario: 'admin',
      email: 'admin@acasa.com',
      setor: 'ADMIN',
      funcao: 'Administrador',
      senha: senhaHash,
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
