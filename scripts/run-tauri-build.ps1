# Adiciona Cargo ao PATH (runner como serviço pode nao herdar) e roda npm run tauri build.
$ErrorActionPreference = "Stop"

# useLocalToolsDir: true no tauri.conf.json faz as ferramentas (NSIS) irem para target/.tauri/ no projeto,
# evitando AppData do usuario do servico (que causava "Unable to start child process" error 0x2).
# Pre-popular target/.tauri/NSIS com o NSIS do sistema + nsis_tauri_utils.dll para evitar download e garantir execucao.
$frontendDir = Join-Path $env:CI_PROJECT_DIR "frontend"
$srcTauriDir = Join-Path $frontendDir "src-tauri"
$tauriToolsDir = Join-Path $srcTauriDir "target\.tauri"
$tauriNsisPath = Join-Path $tauriToolsDir "NSIS"
$systemNsis = "C:\Program Files (x86)\NSIS"
if ($env:CI_PROJECT_DIR -and (Test-Path (Join-Path $systemNsis "makensis.exe")) -and (-not (Test-Path (Join-Path $tauriNsisPath "makensis.exe")))) {
  Write-Host "Pre-populando NSIS do Tauri no projeto (target/.tauri/NSIS): $systemNsis -> $tauriNsisPath"
  New-Item -ItemType Directory -Force -Path $tauriNsisPath | Out-Null
  robocopy $systemNsis $tauriNsisPath /E /NFL /NDL /NJH /NJS /nc /ns /np 2>&1 | Out-Null
  if ($LASTEXITCODE -ge 8) { Write-Warning "robocopy NSIS retornou $LASTEXITCODE" }
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

# NSIS no PATH (para o caso de o bundler chamar makensis do PATH em algum passo)
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

Set-Location $frontendDir
npm run tauri -- build --bundles nsis
