/**
 * Copia só o necessário para o build Docker (evita 12GB+ de android/ios/src-tauri).
 * Rode antes: node frontend/scripts/prepare-docker-context.cjs
 * Depois: docker compose build frontend
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.docker-context');

const FILES = [
  'package.json',
  'package-lock.json',
  'index.html',
  'vite.config.js',
  'postcss.config.js',
  'tailwind.config.js',
  'nginx.conf',
  'Dockerfile',
];

function copyFile(src, dest) {
  const d = path.dirname(dest);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

for (const f of FILES) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) {
    copyFile(src, path.join(OUT, f));
    console.log('  ', f);
  } else {
    console.warn('  (não encontrado:', f, ')');
  }
}

copyDir(path.join(ROOT, 'src'), path.join(OUT, 'src'));
console.log('  src/');

const pub = path.join(ROOT, 'public');
if (fs.existsSync(pub)) {
  copyDir(pub, path.join(OUT, 'public'));
  console.log('  public/');
}

// Frontend importa de ../../../backend/shared/constantes — precisa no contexto
const backendConstantes = path.join(ROOT, '..', 'backend', 'shared', 'constantes');
if (fs.existsSync(backendConstantes)) {
  copyDir(backendConstantes, path.join(OUT, 'backend', 'shared', 'constantes'));
  console.log('  backend/shared/constantes/');
}

console.log('\nContexto em:', OUT);
console.log('Agora rode: docker compose build frontend');
