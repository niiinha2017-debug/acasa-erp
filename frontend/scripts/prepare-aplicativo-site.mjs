#!/usr/bin/env node
/**
 * Prepara a pasta aplicativo-site/ para deploy no subdomínio aplicativo.acasamarcenaria.com.br
 * Rode após: npm run build:all
 *
 * Gera:
 * - aplicativo-site/updates/tauri/ (latest.json + instaladores do Tauri)
 * - aplicativo-site/updates/android/version.json (para o app Android avisar "nova versão")
 * - aplicativo-site/ (cópia do dist para a página inicial)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'aplicativo-site')

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const version = pkg.version
const androidUrl = 'https://aplicativo.acasamarcenaria.com.br/erp/Acasa.apk'

function mkdir (dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function copyRecursive (src, dest) {
  mkdir(dest)
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const e of entries) {
    const s = path.join(src, e.name)
    const d = path.join(dest, e.name)
    if (e.isDirectory()) copyRecursive(s, d)
    else fs.copyFileSync(s, d)
  }
}

// 1) updates/android/version.json
const androidDir = path.join(OUT, 'updates', 'android')
mkdir(androidDir)
fs.writeFileSync(
  path.join(androidDir, 'version.json'),
  JSON.stringify({ version, url: androidUrl }, null, 2)
)
console.log('[prepare-aplicativo-site] updates/android/version.json')

// 2) updates/tauri/ (latest.json + instaladores)
const bundleDir = path.join(ROOT, 'src-tauri', 'target', 'release', 'bundle')
const tauriOut = path.join(OUT, 'updates', 'tauri')
if (fs.existsSync(bundleDir)) {
  mkdir(tauriOut)
  const entries = fs.readdirSync(bundleDir, { withFileTypes: true })
  for (const e of entries) {
    const s = path.join(bundleDir, e.name)
    const d = path.join(tauriOut, e.name)
    if (e.name === 'latest.json' || e.name.endsWith('.sig')) {
      fs.copyFileSync(s, d)
      console.log('[prepare-aplicativo-site] updates/tauri/', e.name)
    } else if (e.isDirectory()) {
      copyRecursive(s, d)
      console.log('[prepare-aplicativo-site] updates/tauri/', e.name, '/')
    }
  }
} else {
  console.warn('[prepare-aplicativo-site] bundle não encontrado (rode tauri:build antes):', bundleDir)
}

// 3) erp/AcasaSetup.exe (instalador Tauri Windows para download no index)
const erpDir = path.join(OUT, 'erp')
mkdir(erpDir)
const nsisDir = path.join(ROOT, 'src-tauri', 'target', 'release', 'bundle', 'nsis')
const msiDir = path.join(ROOT, 'src-tauri', 'target', 'release', 'bundle', 'msi')
if (fs.existsSync(nsisDir)) {
  const exe = fs.readdirSync(nsisDir).find(f => f.endsWith('.exe'))
  if (exe) {
    fs.copyFileSync(path.join(nsisDir, exe), path.join(erpDir, 'AcasaSetup.exe'))
    console.log('[prepare-aplicativo-site] erp/AcasaSetup.exe')
  }
}
if (fs.existsSync(msiDir)) {
  const msi = fs.readdirSync(msiDir).find(f => f.endsWith('.msi'))
  if (msi) {
    fs.copyFileSync(path.join(msiDir, msi), path.join(erpDir, 'AcasaSetup.msi'))
    console.log('[prepare-aplicativo-site] erp/AcasaSetup.msi')
  }
}

// 4) raiz do site = dist (página inicial; coloque Acasa.apk em erp/ após build Android)
const distDir = path.join(ROOT, 'dist')
if (fs.existsSync(distDir)) {
  copyRecursive(distDir, OUT)
  console.log('[prepare-aplicativo-site] index + assets (dist)')
}

console.log('[prepare-aplicativo-site] Pronto. Coloque erp/Acasa.apk (build Android) e faça deploy de aplicativo-site/ para o subdomínio.')
