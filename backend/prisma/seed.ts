import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Automação Forçada: Populando dados...');

  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO roles (codigo, label)
    VALUES
      ('admin', 'Administrador Total'),
      ('colaborador', 'Colaborador Padrão');
  `);

  console.log('✅ Sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
