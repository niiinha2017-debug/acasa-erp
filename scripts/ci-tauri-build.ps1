# Build Tauri no CI (Windows runner). Requer: Node, Rust, TAURI_SIGNING_PRIVATE_KEY e TAURI_SIGNING_PRIVATE_KEY_PASSWORD.
# Se SKIP_TAURI_BUILD=1, apenas assina e gera latest.json (build já foi feito no job).
$ErrorActionPreference = "Stop"
$ProjectDir = Join-Path $env:CI_PROJECT_DIR "frontend"
$BundleDir = Join-Path $ProjectDir "src-tauri\target\release\bundle\nsis"
$OutDir = Join-Path $env:CI_PROJECT_DIR "tauri-artifacts"

# Versao do tauri.conf.json
$tauriConf = Get-Content (Join-Path $ProjectDir "src-tauri\tauri.conf.json") -Raw | ConvertFrom-Json
$version = $tauriConf.version
Write-Host "==> Versao: $version"

# Chave de assinatura (conteudo da variavel CI) - before_script do job ja pode ter escrito; senao escrever aqui
$keyPath = Join-Path $env:CI_PROJECT_DIR "tauri_private.key"
if (-not (Test-Path $keyPath)) {
  $env:TAURI_SIGNING_PRIVATE_KEY | Out-File -FilePath $keyPath -Encoding utf8NoBOM
}
$env:TAURI_SIGNING_PRIVATE_KEY_PATH = $keyPath

Set-Location $ProjectDir

if (-not $env:SKIP_TAURI_BUILD) {
  Write-Host "==> npm ci..."
  npm ci
  Write-Host "==> Tauri build (pode levar varios minutos)..."
  npm run tauri -- build --bundles nsis
}

$exeFile = Join-Path $BundleDir "Acasa_${version}_x64-setup.exe"
if (-not (Test-Path $exeFile)) { throw "Arquivo nao encontrado: $exeFile" }

# Assinar (usar arquivo de chave; nao passar conteudo por env no signer)
$env:TAURI_SIGNING_PRIVATE_KEY = $null
npm run tauri -- signer sign --private-key-path $keyPath --password $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD $exeFile

$sigFile = "$exeFile.sig"
$sizeBytes = (Get-Item $exeFile).Length
$sigValue = Get-Content $sigFile -Raw

$latestJson = @{
  version = $version
  notes = "Atualizacao do aplicativo"
  pub_date = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  platforms = @{
    "windows-x86_64" = @{
      url = "https://aplicativo.acasamarcenaria.com.br/erp/AcasaSetup.exe"
      signature = $sigValue.Trim()
      size = $sizeBytes
    }
  }
} | ConvertTo-Json -Depth 4

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
Copy-Item $exeFile (Join-Path $OutDir "AcasaSetup.exe")
$latestJson | Out-File (Join-Path $OutDir "latest.json") -Encoding utf8NoBOM

Write-Host "==> Artefatos em $OutDir"
Get-ChildItem $OutDir

# Limpar chave do disco
Remove-Item $keyPath -Force -ErrorAction SilentlyContinue
