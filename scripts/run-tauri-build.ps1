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

# Forcar cache do Tauri (NSIS, etc.) para dentro do projeto; evita AppData do usuario do servico (inacessivel ou quebrado)
$tauriCacheRoot = Join-Path $env:CI_PROJECT_DIR "tauri-ci-cache"
New-Item -ItemType Directory -Force -Path $tauriCacheRoot | Out-Null
$env:LOCALAPPDATA = $tauriCacheRoot
Write-Host "Tauri cache (LOCALAPPDATA): $tauriCacheRoot"

# Pre-popular o cache com copia do NSIS do sistema (evita download e "Unable to start child process" do makensis baixado)
$tauriNsisPath = Join-Path $tauriCacheRoot "tauri\NSIS"
$systemNsis = "C:\Program Files (x86)\NSIS"
if ((Test-Path (Join-Path $systemNsis "makensis.exe")) -and (-not (Test-Path (Join-Path $tauriNsisPath "makensis.exe")))) {
  Write-Host "Pre-populando cache NSIS a partir do sistema: $systemNsis -> $tauriNsisPath"
  New-Item -ItemType Directory -Force -Path $tauriNsisPath | Out-Null
  robocopy $systemNsis $tauriNsisPath /E /NFL /NDL /NJH /NJS /nc /ns /np 2>&1 | Out-Null
  if ($LASTEXITCODE -ge 8) { Write-Warning "robocopy NSIS retornou $LASTEXITCODE" }
  # Plugin nsis_tauri_utils.dll (obrigatorio para o Tauri)
  $pluginDir = Join-Path $tauriNsisPath "Plugins\x86-unicode\additional"
  New-Item -ItemType Directory -Force -Path $pluginDir | Out-Null
  $dllUrl = "https://github.com/tauri-apps/nsis-tauri-utils/releases/download/nsis_tauri_utils-v0.5.3/nsis_tauri_utils.dll"
  try {
    Invoke-WebRequest -Uri $dllUrl -OutFile (Join-Path $pluginDir "nsis_tauri_utils.dll") -UseBasicParsing
    Write-Host "nsis_tauri_utils.dll baixado em $pluginDir"
  } catch {
    Write-Warning "Falha ao baixar nsis_tauri_utils.dll: $_"
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
