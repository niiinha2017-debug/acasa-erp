# Limpa containers, redes e (opcional) volumes/imagens para liberar portas no Windows.
# Uso: .\scripts\podman-limpar.ps1
# Para limpeza agressiva (remove também imagens e volumes não usados): .\scripts\podman-limpar.ps1 -Agressivo

param([switch]$Agressivo)

Set-Location $PSScriptRoot\..

$PodmanCmd = Get-Command podman -ErrorAction SilentlyContinue
$PodmanExePath = 'C:\Program Files\RedHat\Podman\podman.exe'

if ($PodmanCmd) {
    $PodmanBin = $PodmanCmd.Source
} elseif (Test-Path $PodmanExePath) {
    $PodmanBin = $PodmanExePath
} else {
    Write-Host "Podman nao encontrado. Instale o Podman Desktop ou ajuste o PATH." -ForegroundColor Red
    exit 1
}

Write-Host "Parando e removendo containers/redes do projeto com Podman..." -ForegroundColor Cyan
& $PodmanBin compose down -v

Write-Host "Removendo containers parados e redes nao utilizadas..." -ForegroundColor Cyan
& $PodmanBin container prune -f
& $PodmanBin network prune -f

if ($Agressivo) {
    Write-Host "Removendo volumes e imagens nao utilizados (pode demorar)..." -ForegroundColor Yellow
    & $PodmanBin volume prune -f
    & $PodmanBin image prune -a -f
}

Write-Host "Limpeza concluida. Portas 3000, 3307, 5173, 5174, 8080 devem estar livres." -ForegroundColor Green
