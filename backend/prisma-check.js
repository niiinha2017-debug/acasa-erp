const { PrismaClient } = require('@prisma/client')

async function main() {
  const p = new PrismaClient()
  const keys = Object.keys(p).filter(k => k[0] !== '$' && k[0] !== '_').sort()
  console.log(keys)
  await p.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
