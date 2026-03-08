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

$frontendDir = Join-Path $env:CI_PROJECT_DIR "frontend"
Set-Location $frontendDir
npm run tauri -- build --bundles nsis
