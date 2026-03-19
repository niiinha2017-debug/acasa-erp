const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1200;
const STRICT_MODE = String(process.env.PRISMA_GENERATE_STRICT || '').trim() === '1';

function hasUsableExistingClient() {
  const clientDir = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
  const engineFile = path.join(clientDir, 'query_engine-windows.dll.node');
  const jsClientFile = path.join(clientDir, 'index.js');
  return fs.existsSync(engineFile) && fs.existsSync(jsClientFile);
}

function sleep(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // Busy-wait is acceptable here because this is a short prestart script.
  }
}

function cleanupTempPrismaFiles() {
  try {
    const clientDir = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
    if (!fs.existsSync(clientDir)) return;

    const files = fs.readdirSync(clientDir);
    for (const fileName of files) {
      if (fileName.startsWith('query_engine-windows.dll.node.tmp')) {
        const fullPath = path.join(clientDir, fileName);
        try {
          fs.unlinkSync(fullPath);
        } catch {
          // Ignore cleanup failures; retry loop still handles transient locks.
        }
      }
    }
  } catch {
    // Ignore cleanup errors.
  }
}

function runPrismaGenerate() {
  const result = spawnSync('npx', ['prisma', 'generate'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: true,
  });

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);

  const combinedOutput = `${stdout}\n${stderr}`;
  const isEperm = /EPERM/i.test(combinedOutput) && /query_engine-windows\.dll\.node/i.test(combinedOutput);

  return {
    exitCode: typeof result.status === 'number' ? result.status : 1,
    isEperm,
  };
}

let attempt = 1;
while (attempt <= MAX_ATTEMPTS) {
  cleanupTempPrismaFiles();
  const result = runPrismaGenerate();

  if (result.exitCode === 0) {
    process.exit(0);
  }

  if (!result.isEperm) {
    process.exit(result.exitCode || 1);
  }

  if (!STRICT_MODE && hasUsableExistingClient()) {
    console.warn(
      '\n[prisma-generate-safe] EPERM detectado. Usando client Prisma ja existente para nao bloquear o start:dev.\n',
    );
    process.exit(0);
  }

  if (attempt === MAX_ATTEMPTS) {
    if (hasUsableExistingClient()) {
      console.warn(
        '\n[prisma-generate-safe] EPERM persistente apos tentativas. Usando client Prisma ja existente para nao bloquear o start.\n',
      );
      process.exit(0);
    }
    process.exit(result.exitCode || 1);
  }

  const delay = BASE_DELAY_MS * attempt;
  console.warn(`\n[prisma-generate-safe] Tentativa ${attempt}/${MAX_ATTEMPTS} falhou por lock de arquivo (EPERM).`);
  console.warn(`[prisma-generate-safe] Aguardando ${delay}ms e tentando novamente...\n`);
  sleep(delay);
  attempt += 1;
}

process.exit(1);
