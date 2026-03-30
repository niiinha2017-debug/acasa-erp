# Baixa o WPPConnect Server oficial, aplica a config local do projeto e sobe via Podman.
# Uso:
#   .\scripts\wppconnect-subir.ps1
#   .\scripts\wppconnect-subir.ps1 -Atualizar
#   .\scripts\wppconnect-subir.ps1 -Parar

param(
    [switch]$Atualizar,
    [switch]$Parar
)

$ErrorActionPreference = 'Stop'

Set-Location (Join-Path $PSScriptRoot '..')

$RepoRoot = Get-Location
$ConfigSource = Join-Path $RepoRoot 'wppconnect-api\config.ts'
$SourceDir = Join-Path $env:LOCALAPPDATA 'acasa-erp\wppconnect-server'
$TokensDir = Join-Path $SourceDir 'wppconnect_tokens'
$GitUrl = 'https://github.com/wppconnect-team/wppconnect-server.git'

$PodmanCmd = Get-Command podman -ErrorAction SilentlyContinue
$PodmanExePath = 'C:\Program Files\RedHat\Podman\podman.exe'

if ($PodmanCmd) {
    $PodmanBin = $PodmanCmd.Source
} elseif (Test-Path $PodmanExePath) {
    $PodmanBin = $PodmanExePath
} else {
    Write-Host 'Podman nao encontrado. Instale o Podman Desktop ou ajuste o PATH.' -ForegroundColor Red
    exit 1
}

$GitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $GitCmd) {
    Write-Host 'Git nao encontrado. Instale o Git for Windows para baixar o WPPConnect oficial.' -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $ConfigSource)) {
    Write-Host "Config nao encontrada em $ConfigSource" -ForegroundColor Red
    exit 1
}

if ($Parar) {
    if (Test-Path $SourceDir) {
        Set-Location $SourceDir
        & $PodmanBin compose down
        Write-Host 'WPPConnect parado.' -ForegroundColor Green
    } else {
        Write-Host 'WPPConnect ainda nao foi baixado neste computador.' -ForegroundColor Yellow
    }
    exit 0
}

if (-not (Test-Path $SourceDir)) {
    New-Item -ItemType Directory -Path (Split-Path $SourceDir) -Force | Out-Null
    & $GitCmd.Source clone --depth 1 $GitUrl $SourceDir
} elseif ($Atualizar) {
    & $GitCmd.Source -C $SourceDir fetch --depth 1 origin main
    & $GitCmd.Source -C $SourceDir reset --hard origin/main
}

if (-not (Test-Path $TokensDir)) {
    New-Item -ItemType Directory -Path $TokensDir -Force | Out-Null
}

Copy-Item $ConfigSource (Join-Path $SourceDir 'config.ts') -Force

Set-Location $SourceDir

& $PodmanBin compose up -d --build

Write-Host ''
Write-Host 'WPPConnect iniciado.' -ForegroundColor Green
Write-Host 'Swagger: http://127.0.0.1:21465/api-docs' -ForegroundColor Cyan
Write-Host 'Gerar token: POST http://127.0.0.1:21465/api/acasa-erp/15215bde60b7f098918f740b1abe0423/generate-token' -ForegroundColor Cyan
Write-Host 'Depois use o bearer retornado para iniciar a sessao ACASA-ERP.' -ForegroundColor Cyan