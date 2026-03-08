# Adiciona Cargo ao PATH (runner como serviço pode nao herdar) e roda npm run tauri build.
$ErrorActionPreference = "Stop"

$cargoPaths = @(
  (Join-Path $env:USERPROFILE ".cargo\bin"),
  (Join-Path $env:ProgramFiles "Rust\bin")
)
foreach ($u in (Get-ChildItem "C:\Users" -Directory -ErrorAction SilentlyContinue)) {
  $p = Join-Path $u.FullName ".cargo\bin"
  if (Test-Path $p) { $cargoPaths += $p; break }
}
foreach ($p in $cargoPaths) {
  if ($p -and (Test-Path $p)) {
    $env:Path = "$p;$env:Path"
    Write-Host "Cargo no PATH: $p"
    break
  }
}

# Definir toolchain padrão para o rustup (CI pode rodar sem default configurado)
if (-not $env:RUSTUP_TOOLCHAIN) { $env:RUSTUP_TOOLCHAIN = "stable" }
# Garantir que o default esteja configurado (rustup escreve em stderr; nao falhar o script)
$prevErrPref = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& rustup default stable 2>&1 | Out-Null
$ErrorActionPreference = $prevErrPref

# NSIS (makensis) necessario para gerar o instalador .exe; o download do Tauri pode falhar no CI
$makensisPaths = @(
  (Join-Path $env:ProgramFiles "NSIS\makensis.exe"),
  (Join-Path ${env:ProgramFiles(x86)} "NSIS\makensis.exe")
)
$hasMakensis = $false
foreach ($mp in $makensisPaths) {
  if ($mp -and (Test-Path $mp)) {
    $env:Path = (Split-Path $mp -Parent) + ";" + $env:Path
    $hasMakensis = $true
    Write-Host "NSIS encontrado: $mp"
    break
  }
}
if (-not $hasMakensis) {
  Write-Host "Instalando NSIS via winget..."
  $ErrorActionPreference = "Continue"
  winget install --id NSIS.NSIS -e --accept-source-agreements --accept-package-agreements 2>&1 | Out-Null
  $ErrorActionPreference = $prevErrPref
  foreach ($mp in $makensisPaths) {
    if ($mp -and (Test-Path $mp)) {
      $env:Path = (Split-Path $mp -Parent) + ";" + $env:Path
      Write-Host "NSIS instalado: $mp"
      break
    }
  }
}

$frontendDir = Join-Path $env:CI_PROJECT_DIR "frontend"
Set-Location $frontendDir
npm run tauri -- build --bundles nsis
