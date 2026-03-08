# Wrapper para o CI: define SKIP_TAURI_BUILD e chama ci-tauri-build.ps1
# (evita usar $$ no .gitlab-ci.yml)
$ErrorActionPreference = "Stop"
$env:SKIP_TAURI_BUILD = "1"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $scriptDir "ci-tauri-build.ps1")
