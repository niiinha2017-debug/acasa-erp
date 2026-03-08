# Configura a chave de assinatura Tauri para o CI (Windows).
# As variáveis TAURI_SIGNING_PRIVATE_KEY e TAURI_SIGNING_PRIVATE_KEY_PASSWORD
# são injetadas pelo GitLab; este script apenas grava a chave em arquivo.
$ErrorActionPreference = "Stop"

if (-not $env:TAURI_SIGNING_PRIVATE_KEY -or -not $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD) {
  Write-Error "Defina TAURI_SIGNING_PRIVATE_KEY e TAURI_SIGNING_PRIVATE_KEY_PASSWORD em Settings -> CI/CD -> Variables"
  exit 1
}

$keyPath = Join-Path $env:CI_PROJECT_DIR "tauri_private.key"
[System.IO.File]::WriteAllText($keyPath, $env:TAURI_SIGNING_PRIVATE_KEY, [System.Text.UTF8Encoding]::new($false))
$env:TAURI_SIGNING_PRIVATE_KEY_PATH = $keyPath
Write-Host "Chave gravada em $keyPath"
