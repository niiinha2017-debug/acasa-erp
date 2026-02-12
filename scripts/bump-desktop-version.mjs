import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const paths = {
  tauriConf: path.join(root, 'frontend', 'src-tauri', 'tauri.conf.json'),
  cargoToml: path.join(root, 'frontend', 'src-tauri', 'Cargo.toml'),
  frontendPkg: path.join(root, 'frontend', 'package.json'),
  frontendLock: path.join(root, 'frontend', 'package-lock.json'),
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

console.log(`Desktop version: ${current.major}.${current.minor}.${current.patch} -> ${version}`)
