/**
 * Bump de versão: Desktop (Tauri) + frontend + ERP Android.
 * --include-ponto: também atualiza frontend-ponto/package.json e Ponto Android (versionCode + versionName).
 * Use UM comando só: version:desktop-ponto:bump atualiza tudo; não rode version:desktop:bump em seguida.
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const paths = {
  tauriConf: path.join(root, 'frontend', 'src-tauri', 'tauri.conf.json'),
  cargoToml: path.join(root, 'frontend', 'src-tauri', 'Cargo.toml'),
  frontendPkg: path.join(root, 'frontend', 'package.json'),
  frontendLock: path.join(root, 'frontend', 'package-lock.json'),
  androidBuildGradle: path.join(root, 'frontend', 'android', 'app', 'build.gradle'),
  pontoPkg: path.join(root, 'frontend-ponto', 'package.json'),
  pontoAndroidBuildGradle: path.join(root, 'frontend-ponto', 'android', 'app', 'build.gradle'),
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function parseVersion(v) {
  const m = String(v || '').trim().match(/^(\d+)\.(\d+)\.(\d+)$/)
  if (!m) throw new Error(`Versao invalida: ${v}`)
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) }
}

function formatVersion(v) {
  return `${v.major}.${v.minor}.${v.patch}`
}

function bumpPatch(v) {
  return { ...v, patch: v.patch + 1 }
}

function setCargoVersion(file, version) {
  const src = fs.readFileSync(file, 'utf8')
  const updated = src.replace(
    /(\[package\][\s\S]*?^version\s*=\s*")(\d+\.\d+\.\d+)(")/m,
    `$1${version}$3`,
  )
  if (src === updated) {
    throw new Error('Nao foi possivel atualizar version em Cargo.toml')
  }
  fs.writeFileSync(file, updated, 'utf8')
}

function getArg(name) {
  const i = process.argv.indexOf(name)
  if (i === -1) return null
  return process.argv[i + 1] ?? null
}

const setVersionArg = getArg('--set')
const syncOnly = process.argv.includes('--sync')
const includePonto = process.argv.includes('--include-ponto')

const tauriConf = readJson(paths.tauriConf)
const current = parseVersion(tauriConf.version)
let next = current

if (setVersionArg) {
  next = parseVersion(setVersionArg)
} else if (!syncOnly) {
  next = bumpPatch(current)
}

const version = formatVersion(next)

tauriConf.version = version
writeJson(paths.tauriConf, tauriConf)

const frontendPkg = readJson(paths.frontendPkg)
frontendPkg.version = version
writeJson(paths.frontendPkg, frontendPkg)

if (fs.existsSync(paths.frontendLock)) {
  const lock = readJson(paths.frontendLock)
  lock.version = version
  if (lock.packages && lock.packages['']) {
    lock.packages[''].version = version
  }
  writeJson(paths.frontendLock, lock)
}

setCargoVersion(paths.cargoToml, version)

// Ponto (Capacitor): só versiona quando solicitado explicitamente.
if (includePonto && fs.existsSync(paths.pontoPkg)) {
  const pontoPkg = readJson(paths.pontoPkg)
  pontoPkg.version = version
  writeJson(paths.pontoPkg, pontoPkg)
  console.log('frontend-ponto/package.json ->', version)
}

// Atualiza versionCode (e opcionalmente versionName) em um build.gradle
function bumpAndroidGradle(gradlePath, version, options = {}) {
  if (!fs.existsSync(gradlePath)) return
  let src = fs.readFileSync(gradlePath, 'utf8')
  const versionCodeMatch = src.match(/versionCode\s+(\d+)/)
  if (!versionCodeMatch) return
  const prevCode = Number(versionCodeMatch[1])
  const nextCode = prevCode + 1
  src = src.replace(/versionCode\s+\d+/, `versionCode ${nextCode}`)
  if (options.setVersionName && version) {
    src = src.replace(/versionName\s+"[^"]*"/, `versionName "${version}"`)
  }
  fs.writeFileSync(gradlePath, src, 'utf8')
  return { prevCode, nextCode }
}

// Android ERP: incrementa versionCode (obrigatório para nova versão na Play Store) — só no bump, não no --sync
if (!syncOnly && fs.existsSync(paths.androidBuildGradle)) {
  const result = bumpAndroidGradle(paths.androidBuildGradle, version)
  if (result) console.log(`Android ERP versionCode: ${result.prevCode} -> ${result.nextCode}`)
}

// Android Ponto: mesma versão e versionCode quando --include-ponto
if (includePonto && !syncOnly && fs.existsSync(paths.pontoAndroidBuildGradle)) {
  const result = bumpAndroidGradle(paths.pontoAndroidBuildGradle, version, { setVersionName: true })
  if (result) {
    console.log(`Android Ponto versionCode: ${result.prevCode} -> ${result.nextCode}, versionName -> ${version}`)
  }
}

const scope = includePonto ? 'Desktop + ERP Android + Ponto' : 'Desktop + ERP Android'
console.log(`Versão (${scope}): ${current.major}.${current.minor}.${current.patch} -> ${version}`)
if (includePonto) {
  console.log('(Use só este comando para release completo; não rode version:desktop:bump em seguida.)')
}
