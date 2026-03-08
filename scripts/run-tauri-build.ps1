# Adiciona Cargo ao PATH (runner como serviço pode nao herdar) e roda npm run tauri build.
$ErrorActionPreference = "Stop"

# NSIS: colocar primeiro no PATH com caminhos literais (servico pode nao herdar PATH do sistema)
$nsisPaths = "C:\Program Files (x86)\NSIS", "C:\Program Files\NSIS"
foreach ($np in $nsisPaths) {
  if (Test-Path (Join-Path $np "makensis.exe")) {
    $env:Path = "$np;$env:Path"
    Write-Host "NSIS no PATH: $np"
    break
  }
}

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

$frontendDir = Join-Path $env:CI_PROJECT_DIR "frontend"
Set-Location $frontendDir
npm run tauri -- build --bundles nsis
