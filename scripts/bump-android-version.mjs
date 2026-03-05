#!/usr/bin/env node
/**
 * Incrementa versionCode nos build.gradle do ERP e do Ponto (Android).
 * Substitui o antigo bump-android-version.py (não precisa de Python).
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const files = [
  path.join(root, 'frontend', 'android', 'app', 'build.gradle'),
  path.join(root, 'frontend-ponto', 'android', 'app', 'build.gradle'),
]

for (const file of files) {
  if (!fs.existsSync(file)) continue
  const src = fs.readFileSync(file, 'utf8')
  const match = src.match(/versionCode\s+(\d+)/)
  if (!match) continue
  const prev = Number(match[1])
  const next = prev + 1
  const updated = src.replace(/versionCode\s+\d+/, `versionCode ${next}`)
  fs.writeFileSync(file, updated, 'utf8')
  console.log(path.relative(root, file) + `: versionCode ${prev} -> ${next}`)
}
